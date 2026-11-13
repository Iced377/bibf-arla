// Database for live play. Run by api/live.js the first time the instructor page connects,
// and again whenever SCHEMA_VERSION changes. Safe to run more than once.
// Tables live in the private "live" schema; phones only reach them through the live_* functions below.
export const SCHEMA_VERSION = 2;

export const SCHEMA = String.raw`
create schema if not exists live;
create sequence if not exists live.rev_seq;

create table if not exists live.meta (k text primary key, v text not null);

create table if not exists live.rooms (
  id text primary key,
  token text not null,
  state jsonb not null default '{}'::jsonb,
  state_v bigint not null default 1,
  members_v bigint not null default 1,
  epoch bigint not null default 1,
  updated_at timestamptz not null default now()
);

alter table live.rooms add column if not exists run int not null default 1;
alter table live.rooms add column if not exists run_started timestamptz not null default now();
-- the pre/post answer key, sent by the instructor page; phones never read it
alter table live.rooms add column if not exists akey jsonb;

create table if not exists live.runs (
  room text not null references live.rooms(id) on delete cascade,
  run int not null,
  started timestamptz,
  ended timestamptz,
  summary jsonb not null default '{}'::jsonb,
  primary key (room, run)
);

create table if not exists live.members (
  id uuid primary key default gen_random_uuid(),
  room text not null references live.rooms(id) on delete cascade,
  name text not null,
  team int not null,
  joined_at timestamptz not null default clock_timestamp()
);
create index if not exists members_room on live.members(room);

create table if not exists live.items (
  room text not null references live.rooms(id) on delete cascade,
  scope text not null,
  kind text not null,
  beat text not null default '',
  item int not null default 0,
  team int,
  member uuid,
  data jsonb not null default '{}'::jsonb,
  rev bigint not null default nextval('live.rev_seq'),
  at timestamptz not null default clock_timestamp(),
  primary key (room, scope)
);
create index if not exists items_room_rev on live.items(room, rev);
create index if not exists items_room_at on live.items(room, at);

create table if not exists live.checks (
  room text not null references live.rooms(id) on delete cascade,
  name text not null,
  which text not null,
  line text not null,
  member uuid,
  at timestamptz not null default now(),
  primary key (room, name, which)
);

alter table live.checks add column if not exists answers jsonb not null default '{}'::jsonb;

-- ---------- reading: one call per tick returns only what changed ----------
drop function if exists public.live_poll(text, int, bigint, bigint, bigint, bigint);
create function public.live_poll(p_room text, p_team int, p_since bigint, p_state_v bigint, p_members_v bigint, p_epoch bigint)
returns jsonb language sql stable security definer set search_path = live, public as $fn$
  select jsonb_build_object(
    'ep', r.epoch, 'sv', r.state_v, 'mv', r.members_v, 'run', r.run, 'run_started', r.run_started,
    'state', case when r.state_v is distinct from p_state_v or r.epoch is distinct from p_epoch then r.state end,
    'members', case when r.members_v is distinct from p_members_v or r.epoch is distinct from p_epoch then
      (select coalesce(jsonb_agg(jsonb_build_object('id', m.id, 'name', m.name, 'team', m.team) order by m.joined_at, m.id), '[]'::jsonb)
         from live.members m where m.room = r.id) end,
    -- items changed since the last rev seen, plus anything touched in the last 5 seconds,
    -- so a write that committed out of order is never missed (phones de-duplicate by scope and rev)
    'items', (select coalesce(jsonb_agg(jsonb_build_object('s', i.scope, 'k', i.kind, 'b', i.beat, 'i', i.item, 't', i.team,
                'm', i.member, 'd', i.data, 'r', i.rev) order by i.rev), '[]'::jsonb)
              from live.items i
              where i.room = r.id
                and (p_epoch is distinct from r.epoch or i.rev > coalesce(p_since, 0) or i.at > clock_timestamp() - interval '5 seconds')
                and (p_team is null or i.team is null or i.team = p_team)),
    'now', floor(extract(epoch from clock_timestamp()) * 1000)
  ) from live.rooms r where r.id = p_room;
$fn$;

-- ---------- joining a team ----------
drop function if exists public.live_join(text, uuid, text, int);
create function public.live_join(p_room text, p_member uuid, p_name text, p_team int)
returns jsonb language plpgsql security definer set search_path = live, public as $fn$
declare v_team int; v_id uuid; v_name text := left(btrim(coalesce(p_name, '')), 40); v_count int;
begin
  if v_name = '' then return jsonb_build_object('ok', false, 'why', 'name'); end if;
  perform 1 from live.rooms where id = p_room for update;
  if not found then return jsonb_build_object('ok', false, 'why', 'room'); end if;
  if coalesce((select state->>'rollClosed' from live.rooms where id = p_room), 'false') = 'true'
     and (p_member is null or not exists (select 1 from live.members where id = p_member and room = p_room)) then
    return jsonb_build_object('ok', false, 'why', 'closed');
  end if;
  if p_team is null then
    select g.t into v_team from generate_series(1, 6) as g(t)
      left join live.members m on m.room = p_room and m.team = g.t and m.id is distinct from p_member
      group by g.t order by count(m.id), g.t limit 1;
  else
    v_team := p_team;
  end if;
  if v_team < 1 or v_team > 6 then return jsonb_build_object('ok', false, 'why', 'team'); end if;
  -- one person per name in a run: the same name again is refused
  select id, team into v_id, v_count from live.members
    where room = p_room and lower(btrim(name)) = lower(v_name) and id is distinct from p_member limit 1;
  if v_id is not null then return jsonb_build_object('ok', false, 'why', 'taken', 'id', v_id, 'team', v_count); end if;
  select count(*) into v_count from live.members where room = p_room and team = v_team and id is distinct from p_member;
  if v_count >= 6 then return jsonb_build_object('ok', false, 'why', 'full'); end if;
  if p_member is not null and exists (select 1 from live.members where id = p_member and room = p_room) then
    update live.members set name = v_name, team = v_team where id = p_member returning id into v_id;
  else
    insert into live.members(room, name, team) values (p_room, v_name, v_team) returning id into v_id;
  end if;
  update live.rooms set members_v = members_v + 1, updated_at = now() where id = p_room;
  return jsonb_build_object('ok', true, 'id', v_id, 'team', v_team, 'name', v_name);
end $fn$;

-- ---------- what a phone sends: one answer per person and question, only while that question is live ----------
drop function if exists public.live_send(text, uuid, text, text, int, jsonb);
create function public.live_send(p_room text, p_member uuid, p_kind text, p_beat text, p_item int, p_data jsonb)
returns jsonb language plpgsql security definer set search_path = live, public as $fn$
declare m live.members; r live.rooms; v_scope text; v_team int; v_row live.items; v_data jsonb;
begin
  select * into m from live.members where id = p_member and room = p_room;
  if not found then return jsonb_build_object('ok', false, 'why', 'member'); end if;
  select * into r from live.rooms where id = p_room;
  if p_kind <> 'answer' then return jsonb_build_object('ok', false, 'why', 'kind'); end if;
  if coalesce(r.state->'locks', '{}'::jsonb) ? (p_beat || ':' || coalesce(p_item, 0)) then
    return jsonb_build_object('ok', false, 'why', 'locked');
  end if;
  v_team := m.team;
  v_data := coalesce(p_data, '{}'::jsonb) || jsonb_build_object('n', m.name);
  -- the question must be the one the instructor started, and its timer must not have run out (2 s of grace for slow phones)
  if coalesce(r.state->'q'->>'b', '') <> p_beat or coalesce((r.state->'q'->>'i')::int, -1) <> coalesce(p_item, 0)
     or floor(extract(epoch from clock_timestamp()) * 1000) > coalesce((r.state->'q'->>'ends')::bigint, 0) + 2000 then
    return jsonb_build_object('ok', false, 'why', 'locked');
  end if;
  v_scope := 'a:' || p_beat || ':' || coalesce(p_item, 0) || ':' || m.id;
  insert into live.items(room, scope, kind, beat, item, team, member, data)
    values (p_room, v_scope, 'answer', p_beat, coalesce(p_item, 0), v_team, m.id, v_data)
    on conflict (room, scope) do nothing;
  select * into v_row from live.items where room = p_room and scope = v_scope;
  return jsonb_build_object('ok', true, 'mine', v_row.member = m.id, 'd', v_row.data, 'r', v_row.rev);
end $fn$;

-- ---------- pre- and post-course check results ----------
create or replace function live.score_of(p_key jsonb, p_answers jsonb) returns int language sql immutable as $sq$
  select count(*)::int from jsonb_each_text(coalesce(p_key, '{}'::jsonb)) k where coalesce(p_answers, '{}'::jsonb)->>k.key = k.value
$sq$;
drop function if exists public.live_check(text, uuid, text, text, jsonb);
create function public.live_check(p_room text, p_member uuid, p_name text, p_which text, p_answers jsonb)
returns jsonb language plpgsql security definer set search_path = live, public as $fn$
declare v_name text := left(btrim(coalesce(p_name, '')), 60); v_kept boolean := false; v_key jsonb; v_pre jsonb; v_post jsonb;
begin
  if v_name = '' or p_which not in ('pre', 'post') then return jsonb_build_object('ok', false); end if;
  if not exists (select 1 from live.rooms where id = p_room) then return jsonb_build_object('ok', false, 'why', 'room'); end if;
  -- the pre- and post-assessments keep a single attempt per person
  if exists (select 1 from live.checks where room = p_room and lower(name) = lower(v_name) and which = p_which) then
    v_kept := true;
  else
    insert into live.checks(room, name, which, line, member, answers) values (p_room, v_name, p_which, '', p_member, coalesce(p_answers, '{}'::jsonb));
    insert into live.items(room, scope, kind, beat, item, team, member, data)
      values (p_room, 'c:' || p_which || ':' || lower(v_name), 'checkin', p_which, 0, null, p_member, jsonb_build_object('n', v_name, 'w', p_which))
      on conflict (room, scope) do update set rev = nextval('live.rev_seq'), at = clock_timestamp();
  end if;
  -- the pre-course check stays blind; after the post-course check each person sees their own two scores
  if p_which <> 'post' then return jsonb_build_object('ok', true, 'kept', v_kept); end if;
  select akey into v_key from live.rooms where id = p_room;
  if v_key is null then return jsonb_build_object('ok', true, 'kept', v_kept); end if;
  select answers into v_pre from live.checks where room = p_room and lower(name) = lower(v_name) and which = 'pre' order by at limit 1;
  select answers into v_post from live.checks where room = p_room and lower(name) = lower(v_name) and which = 'post' order by at limit 1;
  return jsonb_build_object('ok', true, 'kept', v_kept, 'total', (select count(*) from jsonb_object_keys(v_key)),
    'post', live.score_of(v_key, v_post), 'pre', case when v_pre is null then null else live.score_of(v_key, v_pre) end);
end $fn$;

-- ---------- instructor only: needs the room token, which only the instructor login receives ----------
drop function if exists public.live_admin(text, text, text, jsonb);
create function public.live_admin(p_room text, p_token text, p_op text, p_args jsonb)
returns jsonb language plpgsql security definer set search_path = live, public as $fn$
declare r live.rooms; v_sv bigint; v_id uuid; v_name text; v_old text; v_from uuid;
begin
  select * into r from live.rooms where id = p_room;
  if not found or p_token is null or r.token <> p_token then return jsonb_build_object('ok', false, 'why', 'auth'); end if;
  if p_op = 'state' then
    -- a page still showing an earlier run must never overwrite the new one
    if (p_args->'state'->>'run') is not null and (p_args->'state'->>'run')::int <> r.run then
      return jsonb_build_object('ok', false, 'why', 'run');
    end if;
    update live.rooms set state = coalesce(p_args->'state', '{}'::jsonb), state_v = state_v + 1, updated_at = now()
      where id = p_room returning state_v into v_sv;
    return jsonb_build_object('ok', true, 'sv', v_sv);
  elsif p_op = 'move' then
    if coalesce(p_args->>'team', '') = '' then
      delete from live.members where room = p_room and id = (p_args->>'member')::uuid;
    else
      update live.members set team = (p_args->>'team')::int where room = p_room and id = (p_args->>'member')::uuid;
    end if;
    update live.rooms set members_v = members_v + 1 where id = p_room;
  elsif p_op = 'rename' then
    -- a new name for one person: their check results and answers follow them
    v_id := (p_args->>'member')::uuid;
    v_name := left(btrim(coalesce(p_args->>'name', '')), 60);
    select name into v_old from live.members where room = p_room and id = v_id;
    if v_old is null or v_name = '' then return jsonb_build_object('ok', false, 'why', 'name'); end if;
    if exists (select 1 from live.members where room = p_room and id <> v_id and lower(btrim(name)) = lower(v_name)) then
      return jsonb_build_object('ok', false, 'why', 'taken');
    end if;
    update live.members set name = v_name where room = p_room and id = v_id;
    delete from live.checks c where c.room = p_room and lower(c.name) in (lower(v_old), lower(v_name))
      and exists (select 1 from live.checks d where d.room = p_room and lower(d.name) in (lower(v_old), lower(v_name)) and d.which = c.which
        and (d.at < c.at or (d.at = c.at and d.name < c.name)));
    update live.checks set name = v_name where room = p_room and lower(name) = lower(v_old);
    delete from live.items where room = p_room and kind = 'checkin' and scope in ('c:pre:' || lower(v_name), 'c:post:' || lower(v_name))
      and lower(v_name) <> lower(v_old);
    update live.items set scope = 'c:' || beat || ':' || lower(v_name), data = data || jsonb_build_object('n', v_name), rev = nextval('live.rev_seq'), at = clock_timestamp()
      where room = p_room and kind = 'checkin' and scope in ('c:pre:' || lower(v_old), 'c:post:' || lower(v_old));
    update live.items set data = data || jsonb_build_object('n', v_name), rev = nextval('live.rev_seq'), at = clock_timestamp()
      where room = p_room and member = v_id and kind <> 'checkin' and data ? 'n';
    update live.rooms set members_v = members_v + 1 where id = p_room;
  elsif p_op = 'merge' then
    -- one person is in the record twice: answers and check results move to the person kept, the other entry goes
    v_id := (p_args->>'into')::uuid;
    select name into v_name from live.members where room = p_room and id = v_id;
    if v_name is null then return jsonb_build_object('ok', false, 'why', 'into'); end if;
    v_from := nullif(p_args->>'from', '')::uuid;
    if v_from is not null then
      if v_from = v_id then return jsonb_build_object('ok', false, 'why', 'same'); end if;
      select name into v_old from live.members where room = p_room and id = v_from;
      if v_old is null then return jsonb_build_object('ok', false, 'why', 'from'); end if;
      -- where both answered the same question, the kept person's answer stays
      delete from live.items a where a.room = p_room and a.member = v_from and a.kind = 'answer'
        and exists (select 1 from live.items b where b.room = p_room and b.member = v_id and b.kind = 'answer' and b.beat = a.beat and b.item = a.item);
      update live.items set member = v_id, scope = 'a:' || beat || ':' || item || ':' || v_id, data = data || jsonb_build_object('n', v_name),
        rev = nextval('live.rev_seq'), at = clock_timestamp()
        where room = p_room and member = v_from and kind = 'answer';
      -- attendance: the person kept is present on every day either entry was ticked
      update live.items b set data = b.data || jsonb_build_object('on', true), rev = nextval('live.rev_seq'), at = clock_timestamp()
        where b.room = p_room and b.member = v_id and b.kind = 'attend'
          and exists (select 1 from live.items a where a.room = p_room and a.member = v_from and a.kind = 'attend' and a.item = b.item and a.data->>'on' = 'true');
      update live.items a set member = v_id, scope = 'att:' || a.item || ':' || v_id, data = a.data || jsonb_build_object('n', v_name),
        rev = nextval('live.rev_seq'), at = clock_timestamp()
        where a.room = p_room and a.member = v_from and a.kind = 'attend'
          and not exists (select 1 from live.items b where b.room = p_room and b.member = v_id and b.kind = 'attend' and b.item = a.item);
      delete from live.items where room = p_room and member = v_from and kind = 'attend';
    else
      v_old := left(btrim(coalesce(p_args->>'fromName', '')), 60);
      if v_old = '' then return jsonb_build_object('ok', false, 'why', 'from'); end if;
    end if;
    -- check results: the first submission of each kind is kept
    delete from live.checks c where c.room = p_room and lower(c.name) in (lower(v_old), lower(v_name))
      and exists (select 1 from live.checks d where d.room = p_room and lower(d.name) in (lower(v_old), lower(v_name)) and d.which = c.which
        and (d.at < c.at or (d.at = c.at and d.name < c.name)));
    update live.checks set name = v_name where room = p_room and lower(name) = lower(v_old) and lower(v_old) <> lower(v_name);
    delete from live.items where room = p_room and kind = 'checkin' and scope in ('c:pre:' || lower(v_old), 'c:post:' || lower(v_old)) and lower(v_old) <> lower(v_name);
    insert into live.items(room, scope, kind, beat, item, team, member, data)
      select p_room, 'c:' || c.which || ':' || lower(v_name), 'checkin', c.which, 0, null, v_id, jsonb_build_object('n', v_name, 'w', c.which)
      from live.checks c where c.room = p_room and lower(c.name) = lower(v_name)
      on conflict (room, scope) do update set rev = nextval('live.rev_seq'), at = clock_timestamp();
    if v_from is not null then delete from live.members where room = p_room and id = v_from; end if;
    update live.rooms set members_v = members_v + 1 where id = p_room;
  elsif p_op = 'startover' then
    -- archive this run for the dashboard, then remove everyone and everything and begin the next run
    insert into live.runs(room, run, started, ended, summary)
      values (p_room, r.run, r.run_started, now(), jsonb_build_object(
        'members', (select coalesce(jsonb_agg(jsonb_build_object('name', m.name, 'team', m.team) order by m.team, m.joined_at), '[]'::jsonb) from live.members m where m.room = p_room),
        'checks', (select coalesce(jsonb_agg(jsonb_build_object('name', c.name, 'which', c.which, 'answers', c.answers, 'at', c.at) order by c.at), '[]'::jsonb) from live.checks c where c.room = p_room),
        'attend', (select coalesce(jsonb_agg(jsonb_build_object('name', m.name, 'day', i.item) order by i.item, m.name), '[]'::jsonb)
                     from live.items i join live.members m on m.room = i.room and m.id = i.member
                     where i.room = p_room and i.kind = 'attend' and i.data->>'on' = 'true'),
        'board', coalesce(p_args->'board', '[]'::jsonb)))
      on conflict (room, run) do update set ended = excluded.ended, summary = excluded.summary;
    delete from live.members where room = p_room;
    delete from live.items where room = p_room;
    delete from live.checks where room = p_room;
    update live.rooms set run = run + 1, run_started = now(), state = '{}'::jsonb, epoch = epoch + 1,
      state_v = state_v + 1, members_v = members_v + 1 where id = p_room returning run into v_sv;
    return jsonb_build_object('ok', true, 'run', v_sv);
  elsif p_op = 'runs' then
    return jsonb_build_object('ok', true, 'run', r.run, 'started', r.run_started, 'runs',
      (select coalesce(jsonb_agg(jsonb_build_object('run', x.run, 'started', x.started, 'ended', x.ended, 'summary', x.summary) order by x.run desc), '[]'::jsonb)
         from live.runs x where x.room = p_room));
  elsif p_op = 'reset' then
    -- a new game: every answer goes; people stay in their teams, and check results and attendance are kept
    delete from live.items where room = p_room and kind not in ('checkin', 'attend');
  elsif p_op = 'attend' then
    -- attendance: one row per person and course day, kept as on or off so every instructor page sees the change.
    -- team 0 keeps the rows off the phones, which only receive their own team's items.
    v_id := (p_args->>'member')::uuid;
    select name into v_name from live.members where room = p_room and id = v_id;
    if v_name is null or coalesce(p_args->>'day', '') !~ '^[1-9]$' then return jsonb_build_object('ok', false, 'why', 'member'); end if;
    insert into live.items(room, scope, kind, beat, item, team, member, data)
      values (p_room, 'att:' || (p_args->>'day') || ':' || v_id, 'attend', 'att', (p_args->>'day')::int, 0, v_id,
              jsonb_build_object('n', v_name, 'on', coalesce((p_args->>'on')::boolean, false)))
      on conflict (room, scope) do update set data = excluded.data, rev = nextval('live.rev_seq'), at = clock_timestamp();
  elsif p_op = 'key' then
    update live.rooms set akey = p_args->'key' where id = p_room;
  elsif p_op = 'checks' then
    return jsonb_build_object('ok', true, 'rows', (select coalesce(jsonb_agg(jsonb_build_object('name', c.name, 'which', c.which, 'answers', c.answers, 'at', c.at) order by c.at), '[]'::jsonb) from live.checks c where c.room = p_room));
  else
    return jsonb_build_object('ok', false, 'why', 'op');
  end if;
  return jsonb_build_object('ok', true);
end $fn$;

-- ---------- access: phones may call the live_* functions, never read the tables ----------
do $do$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on schema live from anon, authenticated';
    execute 'revoke all on all tables in schema live from anon, authenticated';
    execute 'grant execute on function public.live_poll(text, int, bigint, bigint, bigint, bigint) to anon, authenticated';
    execute 'grant execute on function public.live_join(text, uuid, text, int) to anon, authenticated';
    execute 'grant execute on function public.live_send(text, uuid, text, text, int, jsonb) to anon, authenticated';
    execute 'grant execute on function public.live_check(text, uuid, text, text, jsonb) to anon, authenticated';
    execute 'grant execute on function public.live_admin(text, text, text, jsonb) to anon, authenticated';
  end if;
end $do$;

notify pgrst, 'reload schema';
`;

// Creates the room with a fresh token if it does not exist yet, and records the schema version.
export function roomSQL(room, version) {
  const id = String(room).replace(/[^a-z0-9_-]/gi, "").slice(0, 40) || "arla";
  return `
insert into live.rooms(id, token) values ('${id}', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''))
  on conflict (id) do nothing;
insert into live.meta(k, v) values ('version', '${Number(version) | 0}')
  on conflict (k) do update set v = excluded.v;`;
}
