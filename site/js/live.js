/* Live play. Every activity is a scored question that the instructor starts from the presentation.
   Start puts the question on every phone and starts the timer. Everyone answers on their own phone, once.
   When time runs out answers lock; Reveal shows the answer and scores it: the team with the fastest right
   answer gets C.fastPoints (3 unless the course says otherwise), every other team with a right answer gets 1.
   A stations game (type "stations") gives each team the questions of the station the presentation assigned it. A solo course (C.solo) has no teams: the server
   seats each new player in an empty slot of their own, so a slot is a person and every board shows names.
   /instructor/ is the presentation (it drives); /instructor/?notes is the notes view (it follows).
   app.js calls window.LiveGame(X) once and calls into the object it returns. Data lives in Supabase
   (see api/_schema.js). If the database cannot be reached, nothing here shows and the course runs as before. */
window.LiveGame = function (X) {
  "use strict";
  var t = X.t, h = X.h, T = X.T, C = X.C, BEATS = X.BEATS, SECTIONS = X.SECTIONS, LETTERS = X.LETTERS;
  var INSTR = X.EDITION === "instructor";
  var TEAMS = C.teams.length;
  var SOLO = !!C.solo;
  // a solo course words some lines differently: "<key>Solo" in i18n.js, when it exists
  function ts(k, v) { if (SOLO) { var s = t(k + "Solo", v); if (s !== k + "Solo") return s; } return t(k, v); }
  // the name(s) in a slot, and the slots to list (a solo course lists only the slots someone sits in)
  function slotName(n) { return S.members.filter(function (m) { return m.team === n; }).map(function (m) { return m.name; }).join(" & "); }
  function slots() { var out = []; for (var n = 1; n <= TEAMS; n++) if (!SOLO || slotName(n)) out.push(n); return out; }
  // Code names (C.codeNames, solo only): the projector and the phones show each slot's code name, so nobody knows who is who.
  // The notes view shows the code name and the real name together. The presentation can reveal the real names to everyone.
  var CODES = SOLO && C.codeNames && C.codeNames.length ? C.codeNames : null;
  function codeOf(n) { return CODES ? CODES[(n - 1) % CODES.length] + (n > CODES.length ? " " + n : "") : ""; }
  function revealed() { return drive ? !!D.reveal : !!(S.state && S.state.reveal); }
  function shownName(n) {
    var real = slotName(n);
    if (!CODES || !real) return real;
    return revealed() || notesView ? codeOf(n) + " · " + real : codeOf(n);
  }
  // "1 point", "3 points": the key ending in 1 holds the singular
  function ptsText(k, n) { return t(n === 1 ? k + "1" : k, { n: n }); }
  var SECS = { estimate: 30, quiz: 30, stations: 30, higherlower: 20, flags: 30, scam: 40, timeline: 90, order: 75 };
  var FAST = C.fastPoints || 3;   // points for the fastest right team; every other right team gets 1

  // ---------- small helpers ----------
  var tag = (location.search.match(/[?&]as=(\w+)/) || [])[1] || "";   // lets one browser test several phones
  var MEKEY = "arla.live.me" + (tag ? "." + tag : "");
  function load(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } }
  function store(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  function $(id) { return document.getElementById(id); }
  // A run is one go through the course. Start Over begins the next run; every screen and phone then
  // clears what it saved in this browser (answers, checks, names, scores) and starts as new.
  var RUNKEY = "arla.run";
  function wipeLocal() {
    try {
      var keys = [];
      for (var k = 0; k < localStorage.length; k++) keys.push(localStorage.key(k));
      keys.forEach(function (key) {
        if (key === "arla.v1" || key === "arla.learner" || key.indexOf("arla.live.me") === 0) localStorage.removeItem(key);
      });
    } catch (e) { /* storage unavailable */ }
  }
  function mmss(s) { s = Math.max(0, s); return Math.floor(s / 60) + ":" + (s % 60 < 10 ? "0" : "") + (s % 60); }

  // ---------- the questions inside each game ----------
  function isGame(b) { return !!(b && SECS[b.type]); }
  function countOf(b) {
    if (b.type === "quiz") return b.questions.length;
    if (b.type === "stations") return b.stations[0].questions.length;
    if (b.type === "higherlower") return b.pairs.length;
    if (b.type === "flags" || b.type === "scam") return b.items.length;
    return 1;
  }
  function secsOf(b) { return b.secs || SECS[b.type] || 30; }
  // a hands-on question can carry its own longer timer
  function secsAt(b, i) { var q = b.questions ? b.questions[i] : b.stations ? b.stations[0].questions[i] : null; return (q && q.secs) || secsOf(b); }
  function isOrder(b) { return b.type === "timeline" || b.type === "order"; }
  function orderKey(b) {
    var list = b.items || b.steps, order = X.shuffledIdx(list.length, b.id), letterOf = {};
    order.forEach(function (k, j) { letterOf[k] = LETTERS[j]; });
    return list.map(function (x, k) { return letterOf[k]; }).join(",");
  }
  // team: whose answer it is (a stations game has a different right answer for each station)
  function correctOf(b, i, team) {
    if (b.type === "estimate") return String(b.answer);
    if (b.type === "quiz") return String(b.questions[i].answer);
    if (b.type === "stations") { var sq = qOf(b, i, team); return sq ? String(sq.answer) : null; }
    if (b.type === "higherlower") { var p = b.pairs[i]; return p.b.value > p.a.value ? "higher" : "lower"; }
    if (b.type === "flags" || b.type === "scam") return b.items[i].verdict;
    if (isOrder(b)) return orderKey(b);
    return null;
  }
  // the choices a phone shows: [value, label]
  function choicesOf(b, i, team) {
    var letter = function (o, k) { return [String(k), LETTERS[k] + " · " + o]; };
    if (b.type === "estimate") return b.options.map(letter);
    if (b.type === "quiz") return b.questions[i].options.map(letter);
    if (b.type === "stations") { var sq = qOf(b, i, team); return sq ? sq.options.map(letter) : []; }
    if (b.type === "higherlower") return [["higher", t("higher")], ["lower", t("lower")]];
    if (b.type === "flags") return [["red", t("redFlag")], ["green", t("greenFlag")]];
    if (b.type === "scam") return [["real", t("real")], ["scam", t("scam")]];
    return [];
  }
  // stations: which station the presentation gave each team ({team number: station key}), and that station's question
  function staMap() { return (INSTR && drive ? D.sta : S.state.sta) || {}; }
  function stationFor(b, team) { var k = staMap()[team]; return (b.stations || []).filter(function (x) { return x.key === k; })[0] || null; }
  function qOf(b, i, team) { var st = stationFor(b, team); return st ? st.questions[i] : null; }

  // ---------- connection ----------
  var cfg = null, enabled = false, failures = 0, failWhy = "";
  var S = { state: {}, members: [], items: {}, sv: 0, mv: 0, ep: 0, since: 0, offset: 0, polled: false };
  var me = load(MEKEY);
  var notesView = /[?&]notes\b/.test(location.search);
  var drive = INSTR && !notesView;
  if (INSTR) X.setNotes(notesView);
  // what the presentation decides: the live question, revealed questions, results, reset count
  var D = { q: null, locks: {}, res: {}, auto: null, rn: 0, route: null, rollClosed: false, sta: {} };

  var keyIdx = 0;
  function rpc(fn, args, retried) {
    var key = (cfg.keys && cfg.keys[keyIdx]) || cfg.key;
    var headers = { "Content-Type": "application/json", apikey: key };
    if (!/^sb_/.test(key)) headers.Authorization = "Bearer " + key;
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = ctl ? setTimeout(function () { ctl.abort(); }, 9000) : null;
    return fetch(cfg.url.replace(/\/$/, "") + "/rest/v1/rpc/" + fn, { method: "POST", headers: headers, body: JSON.stringify(args), signal: ctl ? ctl.signal : undefined })
      .then(function (r) {
        if (timer) clearTimeout(timer);
        if ((r.status === 401 || r.status === 403) && !retried && cfg.keys && keyIdx < cfg.keys.length - 1) { keyIdx++; return rpc(fn, args, true); }
        if (!r.ok) throw new Error("http " + r.status);
        return r.json();
      });
  }
  // instructor-only calls; if the room key was refused, fetch it again once and retry
  function admin(op, args, retried) {
    return rpc("live_admin", { p_room: cfg.room, p_token: cfg.token, p_op: op, p_args: args || {} }).then(function (r) {
      if (r && r.ok === false && r.why === "auth" && !retried) {
        return fetch("live?a=config", { credentials: "same-origin", cache: "no-store" }).then(function (x) { return x.json(); })
          .then(function (c) { if (c && c.token) cfg.token = c.token; return admin(op, args, true); });
      }
      return r;
    });
  }
  function serverNow() { return Date.now() + S.offset; }

  function connect() {
    fetch((INSTR ? "live" : "api/live") + "?a=config", { credentials: "same-origin", cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (c) {
        if (!c || !c.ok || !c.url || !c.key || (INSTR && !c.token)) {
          failWhy = c ? (c.why || "no room token") : "settings not reachable";
          setStatus("off", failWhy);
          if (/^#\/live/.test(location.hash)) renderLivePage();
          return;
        }
        cfg = c; enabled = true;
        document.body.classList.add("live-on");
        X.route();
        poll(true);
      })
      .catch(function (e) { failWhy = "settings request failed: " + (e && e.message || e); setStatus("off", failWhy); if (/^#\/live/.test(location.hash)) renderLivePage(); });
  }

  var pollTimer = null, polling = false;
  function poll(first) {
    if (!enabled || polling) return;
    polling = true;
    var team = INSTR ? null : (me ? me.team : -1);
    rpc("live_poll", { p_room: cfg.room, p_team: team, p_since: Math.max(0, S.since), p_state_v: S.sv, p_members_v: S.mv, p_epoch: S.ep })
      .then(function (r) { polling = false; failures = 0; if (r) absorb(r, first); else setStatus("wait"); })
      .catch(function (e) { polling = false; failures++; failWhy = "database: " + (e && e.message || e); setStatus("lost", failWhy); })
      .then(function () {
        clearTimeout(pollTimer);
        var ms = document.hidden ? 6000 : (INSTR ? 1000 : 1200);
        pollTimer = setTimeout(poll, Math.min(15000, ms * (failures ? Math.min(4, failures) : 1)));
      });
  }
  document.addEventListener("visibilitychange", function () { if (!document.hidden && enabled) { clearTimeout(pollTimer); poll(); } });

  function absorb(r, first) {
    // a new run: either this page saw a different run before, or this browser saved a different one
    if (r.run != null && ((S.run != null && r.run !== S.run) || load(RUNKEY) !== r.run)) {
      stopPushing(); wipeLocal(); store(RUNKEY, r.run);
      if (load(RUNKEY) === r.run) { location.reload(); return; }   // only if storage works, so this can never loop
    }
    S.run = r.run; S.runStarted = r.run_started;
    if (S.ep && r.ep !== S.ep) { S.items = {}; S.since = 0; if (!INSTR) { me = null; prevId = null; store(MEKEY, null); } }
    // "Reset the game": forget every answer this device has seen. This response was asked for with the old rev,
    // so the next poll fetches everything again (attendance and check-ins survive a reset)
    var refetch = false;
    if (r.state && S.polled && (r.state.rn || 0) !== (S.state.rn || 0)) { S.items = {}; S.since = 0; orderPick = {}; refetch = true; }
    S.ep = r.ep; S.sv = r.sv; S.mv = r.mv;
    S.offset = (r.now || Date.now()) - Date.now();
    var stateChanged = false, membersChanged = false, itemsChanged = false;
    if (r.state) { S.state = r.state || {}; stateChanged = true; }
    if (r.members) { S.members = r.members; membersChanged = true; }
    (r.items || []).forEach(function (it) {
      var old = S.items[it.s];
      if (!old || old.r < it.r) { S.items[it.s] = it; itemsChanged = true; }
      if (it.r > S.since) S.since = it.r;
    });
    if (refetch) S.since = 0;
    if (me && membersChanged) {
      var mine = S.members.filter(function (m) { return m.id === me.id; })[0];
      if (!mine) { me = null; store(MEKEY, null); }
      else if (mine.team !== me.team || mine.name !== me.name) { me = { id: mine.id, name: mine.name, team: mine.team }; store(MEKEY, me); S.since = 0; S.items = {}; }
    }
    S.polled = true;
    setStatus("on");
    if (INSTR) instructorTick(first, stateChanged, membersChanged, itemsChanged);
    else participantTick(first);
  }

  // ---------- answers and scoring ----------
  function answers(beat, i) {
    var out = [];
    for (var k in S.items) { var it = S.items[k]; if (it.k === "answer" && it.b === beat && it.i === i) out.push(it); }
    return out.sort(function (a, b) { return a.r - b.r; });
  }
  // per team: its fastest right answer; the fastest team overall gets FAST points, every other right team 1
  function results(beat, i) {
    var b = BEATS[beat], best = {};
    answers(beat, i).forEach(function (a) {
      if (a.d.c !== correctOf(b, i, a.t) || best[a.t]) return;
      best[a.t] = { n: a.d.n, r: a.r };
    });
    var teams = Object.keys(best).sort(function (x, y) { return best[x].r - best[y].r; }), out = {};
    teams.forEach(function (tm, k) { out[tm] = { n: best[tm].n, pts: b && b.practice ? 0 : k === 0 ? FAST : 1 }; });
    return out;
  }
  function locked(beat, i) { var st = INSTR && drive ? D : S.state; return !!(st.locks && st.locks[beat + ":" + i]); }
  function computeRes() {
    var res = {}, auto = []; for (var n = 0; n < TEAMS; n++) auto.push(0);
    Object.keys(D.locks).forEach(function (key) {
      var p = key.lastIndexOf(":"), beat = key.slice(0, p), i = +key.slice(p + 1);
      if (!isGame(BEATS[beat]) || BEATS[beat].practice) return;   // a practice question (the set-up check) scores nothing
      var r = results(beat, i), pts = {};
      Object.keys(r).forEach(function (tm) { pts[tm] = r[tm].pts; if (auto[tm - 1] != null) auto[tm - 1] += r[tm].pts; });
      res[key] = pts;
    });
    return { res: res, auto: auto };
  }
  function autoPts(i) {
    if (!enabled) return 0;
    var a = (INSTR && drive ? D.auto : S.state.auto) || [];
    return a[i] || 0;
  }
  // ---------- each person: answered, right, and points won for the team (their team's fastest right answer) ----------
  function playedQs() {
    var locks = D.locks || {}, q = D.q, out = [];
    SECTIONS.forEach(function (sec) {
      sec.beats.forEach(function (b) {
        if (!isGame(b)) return;
        for (var i = 0; i < countOf(b); i++) {
          var k = b.id + ":" + i, done = !!locks[k];
          if (done || (q && q.b === b.id && q.i === i)) out.push({ k: k, b: b.id, i: i, done: done, title: b.title });
        }
      });
    });
    return out;
  }
  function perf() {
    var played = playedQs(), P = {}, list = [];
    S.members.forEach(function (m) { P[m.id] = { id: m.id, name: m.name, team: m.team, ans: 0, right: 0, won: 0, cells: {} }; list.push(P[m.id]); });
    for (var sc in S.items) {
      var it = S.items[sc]; if (it.k !== "answer") continue;
      var pp = P[sc.slice(sc.lastIndexOf(":") + 1)]; if (pp) pp.cells[it.b + ":" + it.i] = it;
    }
    played.forEach(function (pq) {
      if (BEATS[pq.b] && BEATS[pq.b].practice) return;
      var first = {};
      list.forEach(function (p) {
        var a = p.cells[pq.k]; if (!a) return;
        p.ans++;
        if (pq.done && a.d.c === correctOf(BEATS[pq.b], pq.i, a.t)) { p.right++; if (!first[a.t] || a.r < first[a.t].r) first[a.t] = { p: p, r: a.r }; }
      });
      Object.keys(first).sort(function (x, y) { return first[x].r - first[y].r; }).forEach(function (tm, k) { first[tm].p.won += k === 0 ? FAST : 1; });
    });
    list.sort(function (a, b) { return b.right - a.right || b.won - a.won || b.ans - a.ans || a.name.localeCompare(b.name); });
    return { played: played, list: list };
  }
  function top3(pf) {
    if (SOLO) {
      // ties on points go to the one with more right answers, then to whoever joined first
      var rights = {}; (pf || perf()).list.forEach(function (p) { rights[p.team] = (rights[p.team] || 0) + p.right; });
      return slots().map(function (n) { return { n: slotName(n), t: n, s: X.scoreOf(n - 1), r: rights[n] || 0 }; }).filter(function (x) { return x.s > 0; })
        .sort(function (a, b) { return b.s - a.s || b.r - a.r || a.t - b.t; }).slice(0, 3);
    }
    return (pf || perf()).list.filter(function (p) { return p.right > 0; }).slice(0, 3).map(function (p) { return { n: p.name, t: p.team, r: p.right }; });
  }
  // with teams, the projector and the phones show the top 3 teams and their points; individuals stay on the Dashboard
  // ties on points go to the team with more right answers, then to table order
  function teamTop3() {
    var rights = {}; perf().list.forEach(function (p) { rights[p.team] = (rights[p.team] || 0) + p.right; });
    return slots().map(function (n) { return { n: teamLabel(n), t: n, s: X.scoreOf(n - 1), r: rights[n] || 0, team: 1 }; }).filter(function (x) { return x.s > 0; })
      .sort(function (a, b) { return b.s - a.s || b.r - a.r || a.t - b.t; }).slice(0, 3);
  }
  function publicTop3() { return SOLO ? top3() : teamTop3(); }
  // the top 3 on a podium: 2nd, 1st, 3rd
  function podiumHTML(top, small) {
    if (!top || !top.length) return "";
    var slots = [top[1], top[0], top[2]], place = [2, 1, 3];
    return '<div class="podium' + (small ? " small" : "") + '">' + slots.map(function (x, k) {
      if (!x) return '<div class="pd pd-' + place[k] + ' empty"></div>';
      return '<div class="pd pd-' + place[k] + '"><span class="pd-name">' + h(SOLO && x.t && !x.team ? shownName(x.t) || x.n : x.n) + '</span><span class="pd-team">' + (SOLO || x.team ? ptsText("lvPtsN", x.s) : h(teamLabel(x.t)) + " · " + t("lvRightN", { n: x.r })) +
        '</span><div class="pd-step"><b>' + place[k] + "</b></div></div>";
    }).join("") + "</div>";
  }
  function teamLabel(n) { return X.teamName(n - 1); }

  // ---------- status pill ----------
  function setStatus(s, why) {
    var el = $("livePill");
    if (!el) {
      var tools = document.querySelector(".tools"); if (!tools) return;
      el = document.createElement("a"); el.id = "livePill"; el.href = INSTR ? "#/live" : "#/play";
      tools.insertBefore(el, tools.firstChild);
    }
    el.className = "livepill " + s;
    el.textContent = s === "on" ? (INSTR ? (drive ? t("lvDrives") : t("lvFollows")) : t("lvLive")) : s === "lost" ? t("lvReconnecting") : s === "wait" ? t("lvWaiting") : t("lvOff");
    el.title = why || "";
    if (s === "off") el.hidden = !INSTR;
  }

  // =====================================================================
  // Instructor: the presentation drives; the notes view follows it.
  // =====================================================================
  var pushTimer = null, pushWhat, lastSent = "";   // pushWhat: undefined = nothing queued, null = everything changed
  var leaving = false;   // set when this page starts over or sees a new run: it must not send anything after that
  function stopPushing() { leaving = true; clearTimeout(pushTimer); pushWhat = undefined; }
  function pushSoon(what) {
    if (!enabled || !INSTR || !drive || leaving) return;
    if (pushWhat === undefined) pushWhat = what; else if (pushWhat !== what) pushWhat = null;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(pushNow, 120);
  }
  function pushNow() {
    if (leaving) return;
    var state = { run: S.run, st: X.getST(), what: pushWhat, route: D.route, q: D.q, locks: D.locks, res: D.res, auto: D.auto, top: D.top, rn: D.rn, rollClosed: D.rollClosed, reveal: !!D.reveal, sta: D.sta, skew: S.offset, ts: Date.now() };
    pushWhat = undefined;
    lastSent = JSON.stringify([D.res, D.auto, D.top]);
    admin("state", { state: state }).then(function (r) {
      if (r && r.why === "run") { stopPushing(); location.reload(); return; }   // a new run began elsewhere
      if (!r || !r.ok) setStatus("lost", "the database refused the update: reload this page");
    }).catch(function () { if (!leaving) setTimeout(pushNow, 1500); });
  }
  var adopted = false, keySent = false;
  function instructorTick(first, stateChanged, membersChanged, itemsChanged) {
    var st = S.state || {};
    if (st.run != null && S.run != null && st.run !== S.run) st = {};   // never adopt a state from an earlier run
    // the server scores the post-course check, so it needs the key (only this page has it)
    if (!keySent && window.ASSESSMENT_KEY) {
      keySent = true;
      var key = {}; Object.keys(window.ASSESSMENT_KEY).forEach(function (id) { key[id] = window.ASSESSMENT_KEY[id].answer; });
      admin("key", { key: key });
    }
    if (drive) {
      if (!adopted) {
        adopted = true;
        D.q = st.q || null; D.locks = st.locks || {}; D.rn = st.rn || 0; D.rollClosed = !!st.rollClosed; D.reveal = !!st.reveal; D.sta = st.sta || {};
        if (st.st && st.st.teams) { X.setST(st.st); X.applyState(null); }
        D.route = location.hash || "#/";
      }
      var c = computeRes(); D.res = c.res; D.auto = c.auto; D.top = publicTop3();
      if (JSON.stringify([D.res, D.auto, D.top]) !== lastSent) pushSoon("teams");
    } else if (stateChanged && st.ts) {
      followState(st);
      if (CODES && !!st.reveal !== !!instructorTick._rv) { instructorTick._rv = !!st.reveal; X.refreshTeamViews(); }
    }
    if (itemsChanged || stateChanged || first || (SOLO && membersChanged)) X.renderScores();
    if (SOLO && membersChanged) X.refreshTeamViews();
    var autoKey = JSON.stringify(drive ? D.auto : st.auto);
    if (autoKey !== instructorTick._auto) { instructorTick._auto = autoKey; X.refreshTeamViews(); }
    refreshPanels();
    if (/^#\/live/.test(location.hash) && !(document.activeElement && /^(SELECT|INPUT)$/.test(document.activeElement.tagName))) {
      if (membersChanged || first || itemsChanged || stateChanged) renderLivePage(null, true);
      var nowMs = Date.now(); if (!instructorTick._dash || nowMs - instructorTick._dash > 5000) { instructorTick._dash = nowMs; loadDash(); }
    }
  }
  var lastRoute = null;
  function followState(st) {
    if (st.st) {
      var copy = JSON.parse(JSON.stringify(st.st));
      if (copy.timer && copy.timer.endsAt) copy.timer.endsAt = copy.timer.endsAt + (st.skew || 0) - S.offset;
      X.setST(copy);
    }
    D.q = st.q || null; D.locks = st.locks || {}; D.sta = st.sta || {};
    var personal = /^#\/(pre|post|progress|class|live|glossary)/.test(location.hash);
    if (st.route && st.route !== lastRoute && !personal) {
      lastRoute = st.route;
      if (location.hash !== st.route) location.hash = st.route; else X.applyState(st.what || null);
    } else X.applyState(st.what || null);
  }

  // Start: the current question of a game goes to the phones and the timer starts
  function start(beat) {
    var b = BEATS[beat]; if (!INSTR || !drive || !b) return;
    var i = isGame(b) ? Math.min(countOf(b) - 1, (X.getST().ui[beat] || {}).i || 0) : 0;
    var secs = b.type === "assesscue" ? b.mins * 60 : b.type === "leaderboard" ? 0 : secsAt(b, i);
    D.q = { b: beat, i: i, ends: secs ? serverNow() + secs * 1000 : 0, secs: secs };
    if (secs) X.startTimer(secs, b.title, beat + ":" + i);
    pushSoon(null);
    refreshPanels();
  }

  // Pause, Resume, +1 min and Close on the screen timer apply to the live question it belongs to
  function onTimer(action, tm) {
    var q = D.q;
    if (!INSTR || !drive || !q || !tm || tm.q !== q.b + ":" + q.i || locked(q.b, q.i)) return;
    var now = serverNow(), left = q.paused ? (q.left || 0) : Math.max(0, Math.ceil((q.ends - now) / 1000));
    if (action === "pause" && !q.paused) { q.left = left; q.ends = 0; q.paused = true; }
    else if (action === "resume" && q.paused) { q.ends = now + (q.left || 0) * 1000; q.paused = false; }
    else if (action === "restart") { q.ends = now + (q.secs || 30) * 1000; q.paused = false; }
    else if (action === "plus") { if (q.paused) q.left = (q.left || 0) + 60; else q.ends = Math.max(q.ends, now) + 60000; }
    else if (action === "close") { if (q.paused || q.ends > now) { q.ends = now; q.paused = false; } }
    pushSoon(null); refreshPanels();
  }

  // ---------- the bar under each game on the presentation ----------
  function beatPanel(b) {
    if (!INSTR || !(isGame(b) || b.type === "assesscue" || b.type === "leaderboard")) return "";
    return '<div class="lv-panel" id="lvp-' + b.id + '">' + (enabled && S.polled ? panelHTML(b) : "") + "</div>";
  }
  function refreshPanels() {
    document.querySelectorAll(".lv-panel").forEach(function (el) {
      var b = BEATS[el.id.slice(4)]; if (!b) return;
      var html = panelHTML(b);
      if (el._html !== html) { el.innerHTML = html; el._html = html; }
    });
    var roster = $("lvRoster"); if (roster) { var rh = rosterHTML(); if (roster._html !== rh) { roster.innerHTML = rh; roster._html = rh; } }
  }
  setInterval(function () { if (enabled && INSTR) refreshPanels(); }, 500);

  function panelHTML(b) {
    var q = D.q, people = S.members.length;
    if (b.type === "assesscue") {
      var n = 0; for (var k in S.items) { var it = S.items[k]; if (it.k === "checkin" && it.d.w === b.which) n++; }
      var on = q && q.b === b.id;
      return '<div class="lv-row">' + (drive && !on ? '<button class="btn" type="button" data-lv="start" data-id="' + b.id + '">' + t("lvOpenCheck") + "</button>" : "") +
        '<span class="lv-st">' + (on ? t("lvOnPhones") + " · " : "") + t("lvChecksIn", { n: n, m: people }) + "</span></div>";
    }
    if (b.type === "leaderboard") {
      var onb = q && q.b === b.id;
      return '<div class="lv-row">' + (drive && !onb ? '<button class="btn" type="button" data-lv="start" data-id="' + b.id + '">' + t("lvShowBoard") + "</button>" : "") +
        (drive && CODES ? ' <button class="btn ghost" type="button" data-lv="names">' + (D.reveal ? t("lvHideNames") : t("lvRevealNames")) + "</button>" : "") +
        (onb ? '<span class="lv-st">' + t("lvOnPhones") + "</span>" : "") + "</div>";
    }
    var i = Math.min(countOf(b) - 1, (X.getST().ui[b.id] || {}).i || 0);
    var live = q && q.b === b.id && q.i === i, done = locked(b.id, i), got = answers(b.id, i).length;
    var html = '<div class="lv-row">';
    if (!live && !done) {
      html += drive ? '<button class="btn" type="button" data-lv="start" data-id="' + b.id + '">' + t("lvStartBtn", { n: mmss(secsAt(b, i)) }) + "</button>" : "";
      html += '<span class="lv-st">' + t("lvNotStarted") + "</span>";
    } else if (!done) {
      var left = q.paused ? (q.left || 0) : Math.ceil((q.ends - serverNow()) / 1000);
      html += '<span class="lv-st big">' + (q.paused ? t("lvPausedLeft", { s: mmss(left), n: got, m: people }) : left > 0 ? t("lvLiveLeft", { s: mmss(left), n: got, m: people }) : t("lvTimeUpCount", { n: got, m: people })) + "</span>";
    } else {
      var nRight = answers(b.id, i).filter(function (a) { return a.d.c === correctOf(b, i, a.t); }).length;
      html += '<span class="lv-st">' + t("lvRightCount", { r: nRight, n: got }) + "</span>";
    }
    html += "</div>";
    if (done) {
      var res = results(b.id, i);
      html += '<div class="lv-chips">';
      slots().forEach(function (tm) {
        // the projector shows team totals only; the notes view also names who answered fastest
        var r = res[tm], who = h(teamLabel(tm)) + (r && !SOLO && notesView ? " · " + h(r.n) : "");
        html += r ? '<span class="lv-chip ok">' + who + (b.practice ? " · ✓" : " · +" + r.pts) + "</span>" : '<span class="lv-chip no">' + who + (b.practice ? "" : " · 0") + "</span>";
      });
      html += "</div>";
    }
    return html;
  }

  // ---------- the join panel at the start, and the Live page ----------
  function joinURL() { return location.origin + "/"; }
  function rosterHTML() {
    if (SOLO) {
      return '<p class="hint">' + t("lvJoined", { n: S.members.length }) + '</p><div class="lv-roster">' + (S.members.length ? (CODES ? S.members.slice().sort(function (a, b) { return a.name.localeCompare(b.name); }) : S.members).map(function (m) { return '<div class="lv-team"><h3>' + h(m.name) + "</h3></div>"; }).join("") :
        '<div class="lv-team"><p class="muted">' + t("lvNobodyYet") + "</p></div>") + "</div>";
    }
    var html = '<div class="lv-roster">';
    for (var n = 1; n <= TEAMS; n++) {
      var ms = S.members.filter(function (m) { return m.team === n; });
      html += '<div class="lv-team"><h3>' + h(teamLabel(n)) + " <small>" + ms.length + "</small></h3><p>" + (ms.length ? ms.map(function (m) { return h(m.name); }).join(" · ") : '<span class="muted">' + t("lvNobodyYet") + "</span>") + "</p></div>";
    }
    return html + "</div>";
  }
  function sectionTop(id) {
    if (!INSTR || id !== SECTIONS[0].id) return "";
    // the QR code (build/build_qr.js) holds the site address only; the class login is said aloud
    return '<section class="beat lv-join"><div class="beat-head"><h2>' + t("lvJoinTitle") + "</h2></div>" +
      '<div class="lv-join-grid">' + (C.joinUrl ? '<img class="lv-qr" src="../assets/join-qr.svg" alt="" onerror="this.remove()">' : "") +
      '<div><p class="lv-url">' + h(joinURL()) + "</p>" +
      '<p class="hint">' + ts("lvJoinHint") + '</p><div class="actions"><button class="btn ghost small" type="button" data-act="copytext" data-text="' + h(joinURL()) + '">' + t("copyLink") + "</button></div></div></div>" +
      '<div id="lvRoster">' + (enabled ? rosterHTML() : "") + "</div></section>";
  }
  // ---------- attendance: a tick per person and course day, kept in the live store ----------
  var DAY_OF = {}, DAYS = [];
  var ONE_DAY = Object.keys((C.qa && C.qa.days) || {}).length === 1;   // a one-day course: every section is Day 1
  SECTIONS.forEach(function (sec) {
    var m = String(sec.time || "").match(/Day (\d)/), d = m ? +m[1] : ONE_DAY ? 1 : 0;
    if (!d) return;
    if (DAYS.indexOf(d) < 0) DAYS.push(d);
    (sec.beats || []).forEach(function (b) { DAY_OF[b.id] = d; if (b.type === "assesscue") DAY_OF[b.which] = d; });
  });
  DAYS.sort();
  var TICK_DAYS = ONE_DAY ? [] : DAYS;   // the Dashboard's attendance ticks: none on a one-day course, where everyone listed is present
  function attOn(id, day) { var it = S.items["att:" + day + ":" + id]; return !!(it && it.d && it.d.on); }
  // answered a question of that day, or sent that day's check
  function activeOn(id, day) {
    for (var k in S.items) { var it = S.items[k]; if (it.m === id && (it.k === "answer" || it.k === "checkin") && DAY_OF[it.b] === day) return true; }
    return false;
  }
  function attCount(day) { return S.members.filter(function (m) { return attOn(m.id, day); }).length; }
  function setAtt(id, day, on) {
    var m = S.members.filter(function (x) { return x.id === id; })[0], sc = "att:" + day + ":" + id, old = S.items[sc];
    S.items[sc] = { s: sc, k: "attend", b: "att", i: day, t: 0, m: id, d: { n: m ? m.name : "", on: on }, r: old ? old.r : 0 };   // shown at once; the server's row replaces it
    return admin("attend", { member: id, day: day, on: on });
  }
  function attendanceHTML() {
    if (!TICK_DAYS.length) return "";
    return '<div class="dash-att"><p><b>' + t("lvAttendance") + "</b> · " + TICK_DAYS.map(function (d) { return t("lvAttCount", { d: d, n: attCount(d), m: S.members.length }); }).join(" · ") + "</p>" +
      '<div class="actions">' + TICK_DAYS.map(function (d) { return '<button class="btn ghost small" type="button" data-lv="attfill" data-day="' + d + '">' + t("lvAttFill", { d: d }) + "</button>"; }).join("") + "</div>" +
      '<p class="hint">' + t("lvAttHint") + "</p></div>";
  }

  // ---------- the course record: check results with every answer, per run ----------
  var dashData = { rows: [], runs: [] }, dashLoading = false, dashSel = "current";
  function loadDash() {
    if (!enabled || !INSTR || dashLoading) return;
    dashLoading = true;
    Promise.all([admin("checks", {}), admin("runs", {})]).then(function (rs) {
      dashLoading = false;
      dashData.rows = (rs[0] && rs[0].rows) || [];
      dashData.runs = (rs[1] && rs[1].runs) || [];
      if (/^#\/live/.test(location.hash) && !(document.activeElement && /^(SELECT|INPUT)$/.test(document.activeElement.tagName))) renderLivePage(null, true);
    }).catch(function () { dashLoading = false; });
  }
  // the questions with their key
  function keyQs() {
    var key = window.ASSESSMENT_KEY || {};
    return C.assessment.questions.map(function (x) { var k = key[x.id] || {}; return { id: x.id, topic: x.topic, q: x.q, options: x.options, answer: k.answer, why: k.why ? k.why[k.answer] : "" }; });
  }
  function topicName(id) { var tp = C.assessment.topics.filter(function (x) { return x.id === id; })[0]; return tp ? tp.name : id; }
  function marks(ans) { var qs = keyQs(), r = 0; qs.forEach(function (q) { if (ans && ans[q.id] === q.answer) r++; }); return { right: r, total: qs.length }; }
  function dataset(sel) {
    if (sel === "current" || !sel) {
      var board = slots().map(function (n) { return { team: teamLabel(n), score: X.scoreOf(n - 1) }; });
      var att = {};
      S.members.forEach(function (m) { var a = {}; DAYS.forEach(function (d) { a[d] = attOn(m.id, d); }); att[m.name.toLowerCase()] = a; });
      return { run: S.run || 1, started: S.runStarted, ended: null, members: S.members.map(function (m) { return { name: m.name, team: m.team }; }), rows: dashData.rows, board: board, att: att };
    }
    var r = dashData.runs.filter(function (x) { return String(x.run) === String(sel); })[0] || { summary: {} }, sm = r.summary || {}, satt = {};
    (sm.attend || []).forEach(function (x) { if (x && x.name) { var k = String(x.name).toLowerCase(); (satt[k] = satt[k] || {})[x.day] = true; } });
    return { run: r.run, started: r.started, ended: r.ended, members: sm.members || [], rows: (sm.checks || []).filter(function (c) { return c && typeof c === "object"; }), board: sm.board || [], att: satt };
  }
  function people(ds) {
    var list = [], by = {};
    function add(name, team) { var k = String(name).toLowerCase(); if (!by[k]) { by[k] = { name: name, team: team || null, pre: null, post: null }; list.push(by[k]); } else if (team && !by[k].team) by[k].team = team; return by[k]; }
    ds.members.forEach(function (m) { add(m.name, m.team); });
    ds.rows.forEach(function (r) { add(r.name)[r.which] = r; });
    // a one-day course: everyone on the participant list counts as present (as on SAB); longer courses use the ticks
    list.forEach(function (p) { p.att = ONE_DAY ? { 1: true } : (ds.att || {})[String(p.name).toLowerCase()] || {}; });
    return list.sort(function (a, b) { return (SOLO ? 0 : (a.team || 99) - (b.team || 99)) || a.name.localeCompare(b.name); });
  }
  function stamp(ts) {
    if (!ts) return "";
    try { var d = new Date(ts); return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) + " " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; }
  }
  // course details printed on the documents; the defaults come from course.js (qa)
  var QA = C.qa || {};
  var FIELDS = [["fTitle", "Course title", QA.title || ""], ["fProg", "Programme", QA.programme || ""],
    ["fCode", "Course code", QA.code || ""], ["fDates", "Course date", QA.dates || ""], ["fVenue", "Venue", QA.venue || ""], ["fInstr", "Instructor", C.instructor || ""]];
  function fieldVals() {
    var saved = load("arla.sheet") || {}, out = {};
    FIELDS.forEach(function (f) { var el = $(f[0]); out[f[0]] = el ? el.value : (saved[f[0]] != null ? saved[f[0]] : f[2]); });
    store("arla.sheet", out);
    return out;
  }
  function resultsTable(ds, withTimes) {
    var ppl = people(ds);
    if (!ppl.length) return '<p class="muted">' + t("lvNoChecks") + "</p>";
    return '<div class="tablewrap"><table class="dash-table"><thead><tr><th>' + t("lvName") + "</th>" + (SOLO ? "" : "<th>" + t("lvTeam") + "</th>") + "<th>" + t("colPre") + "</th><th>" + t("colPost") + "</th><th>" + t("gain") + "</th>" +
      (withTimes ? "<th>" + t("lvPreAt") + "</th><th>" + t("lvPostAt") + "</th>" : "") + "</tr></thead><tbody>" +
      ppl.map(function (p) {
        var a = p.pre ? marks(p.pre.answers) : null, b = p.post ? marks(p.post.answers) : null, g = a && b ? b.right - a.right : null;
        var stray = !p.team && dashSel === "current" && !S.members.some(function (m) { return m.name.toLowerCase() === String(p.name).toLowerCase(); });
        return "<tr><td>" + h(p.name) + (stray ? ' <select data-lv="mergename" data-name="' + h(p.name) + '">' + mergeOpts(null) + "</select>" : "") + "</td>" + (SOLO ? "" : "<td>" + (p.team ? h(t("teamN", { n: p.team })) : "–") + "</td>") + "<td>" + (a ? a.right + "/" + a.total : "–") + "</td><td>" + (b ? b.right + "/" + b.total : "–") + "</td><td>" + (g == null ? "–" : (g > 0 ? "+" : "") + g) + "</td>" +
          (withTimes ? "<td>" + h(p.pre ? stamp(p.pre.at) : "–") + "</td><td>" + h(p.post ? stamp(p.post.at) : "–") + "</td>" : "") + "</tr>";
      }).join("") + "</tbody></table></div>";
  }

  // ---------- exports: CSV, scoring sheet, QA pack (as in the CPMAI course) ----------
  function csvCell(v) { var x = String(v == null ? "" : v); if (/^[=+\-@\t\r]/.test(x)) x = "'" + x; return /[",\n]/.test(x) ? '"' + x.replace(/"/g, '""') + '"' : x; }
  function exportCSV(ds) {
    var qs = keyQs(), cols = ["Run", "Name"].concat(SOLO ? [] : ["Team"], DAYS.map(function (d) { return "Day " + d + " present"; }), ["Pre score", "Post score", "Gain", "Pre submitted", "Post submitted"]);
    qs.forEach(function (q) { cols.push("Pre " + q.id); }); qs.forEach(function (q) { cols.push("Post " + q.id); });
    var lines = [cols.map(csvCell).join(",")];
    people(ds).forEach(function (p) {
      var a = p.pre ? marks(p.pre.answers) : null, b = p.post ? marks(p.post.answers) : null;
      var row = [ds.run, p.name].concat(SOLO ? [] : [p.team ? "Team " + p.team : ""], DAYS.map(function (d) { return p.att[d] ? "Yes" : "No"; }), [a ? a.right + "/" + a.total : "", b ? b.right + "/" + b.total : "", a && b ? b.right - a.right : "", p.pre ? stamp(p.pre.at) : "", p.post ? stamp(p.post.at) : ""]);
      qs.forEach(function (q) { var v = p.pre && p.pre.answers[q.id]; row.push(v == null ? "" : LETTERS[v]); });
      qs.forEach(function (q) { var v = p.post && p.post.answers[q.id]; row.push(v == null ? "" : LETTERS[v]); });
      lines.push(row.map(csvCell).join(","));
    });
    var blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    var link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = (C.fileTag || "course") + "-Run" + ds.run + "-results.csv";
    document.body.appendChild(link); link.click(); setTimeout(function () { URL.revokeObjectURL(link.href); link.remove(); }, 500);
  }
  // ---------- the four QA documents, downloaded as PDF files (pdfmake, served from assets/vendor) ----------
  // The instructor is the author, creator and producer of every file.
  var pdfLoad = null;
  function loadPdf() {
    if (window.pdfMake && window.pdfMake.vfs) return Promise.resolve(window.pdfMake);
    if (pdfLoad) return pdfLoad;
    var base = INSTR ? "../assets/vendor/" : "assets/vendor/";
    function add(src) { return new Promise(function (ok, no) { var s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); }); }
    pdfLoad = add(base + "pdfmake.min.js").then(function () { return add(base + "vfs_fonts.js"); }).then(function () { return window.pdfMake; });
    pdfLoad.catch(function () { pdfLoad = null; });
    return pdfLoad;
  }
  var PDF_C = { navy: "#16306F", text: "#2A3354", soft: "#4A5370", line: "#DFE4EF", tint: "#F4F6FB", ok: "#1D7A4E", no: "#B3261E" };
  var PDF_GRID = { hLineWidth: function () { return 0.6; }, vLineWidth: function () { return 0.6; }, hLineColor: function () { return PDF_C.line; }, vLineColor: function () { return PDF_C.line; },
    paddingLeft: function () { return 5; }, paddingRight: function () { return 5; }, paddingTop: function () { return 3; }, paddingBottom: function () { return 3; } };
  function pdfHead(text) { return [{ text: text, style: "h1" }, { canvas: [{ type: "rect", x: 0, y: 0, w: 30, h: 3, color: PDF_C.navy }], margin: [0, 2, 0, 10] }]; }
  function pdfH2(text) { return { text: text, style: "h2" }; }
  function pdfInfo(rows) {
    rows = rows.filter(function (r) { return r[1] !== "" && r[1] != null; });
    return { table: { widths: ["30%", "*"], body: rows.map(function (r) { return [{ text: r[0], bold: true, fillColor: PDF_C.tint }, String(r[1])]; }) }, layout: PDF_GRID, margin: [0, 0, 0, 8] };
  }
  function pdfTable(head, rows, widths, opts) {
    opts = opts || {};
    return { table: { headerRows: 1, widths: widths, dontBreakRows: true, body: [head.map(function (x) { return { text: x, bold: true, fillColor: PDF_C.tint, alignment: (opts.center || []).indexOf(head.indexOf(x)) >= 0 ? "center" : "left" }; })].concat(rows) },
      layout: PDF_GRID, fontSize: opts.size || 9, margin: [0, 0, 0, 8] };
  }
  // the PDF font has no Arabic: a name it cannot draw is drawn by the browser and placed as a picture
  function pdfName(name, size, color, bold, maxW) {
    name = String(name);
    if (!/[^\u0000-\u024F]/.test(name)) return { text: name, fontSize: size, color: color, bold: bold };
    var scale = 4, c = document.createElement("canvas"), x = c.getContext("2d"), font = (bold ? "bold " : "") + size * scale + "px Arial, Tahoma, sans-serif";
    x.font = font;
    c.width = Math.ceil(x.measureText(name).width) + 4; c.height = Math.ceil(size * scale * 1.5);
    x.font = font; x.direction = "ltr"; x.textBaseline = "middle"; x.fillStyle = color || PDF_C.text; x.fillText(name, 2, c.height / 2);
    return { image: c.toDataURL("image/png"), fit: [Math.min(c.width / scale, maxW), c.height / scale] };
  }
  function mark(on, yes, no) { return { text: on ? yes : no, color: on ? PDF_C.ok : PDF_C.no, bold: true, alignment: "center" }; }
  function courseRows(f, extra) {
    return [["Course", f.fTitle], ["Programme", f.fProg], ["Course code", f.fCode], ["Course date", f.fDates], ["Venue", f.fVenue], ["Instructor", f.fInstr]].concat(extra || []);
  }
  function fileCode(f) { return String(f.fCode || C.fileTag || "Course").split("·")[0].trim(); }
  function makePdf(f, title, content, landscape) {
    var name = fileCode(f) + " - " + title + ".pdf";
    return loadPdf().then(function (pm) {
      pm.createPdf({
        pageSize: "A4", pageOrientation: landscape ? "landscape" : "portrait", pageMargins: [40, 40, 40, 44],
        info: { title: title + " · " + f.fTitle, author: f.fInstr, subject: f.fTitle, creator: f.fInstr, producer: f.fInstr },
        content: content,
        footer: function (page, pages) { return { columns: [{ text: [f.fTitle, f.fCode].filter(Boolean).join(" · "), color: "#6B7391" }, { text: page + " / " + pages, alignment: "right", color: "#6B7391" }], margin: [40, 12, 40, 0], fontSize: 8 }; },
        defaultStyle: { fontSize: 9.5, color: PDF_C.text, lineHeight: 1.15 },
        styles: { h1: { fontSize: 18, bold: true, color: PDF_C.navy }, h2: { fontSize: 12, bold: true, color: PDF_C.navy, margin: [0, 10, 0, 6] } }
      }).download(name);
    }).catch(function () { X.toast(t("lvNotSent")); });
  }
  function byName(list) { return list.slice().sort(function (a, b) { return String(a.name).localeCompare(String(b.name)); }); }
  // 1. the questions with the answer key and model answers
  function answerKeyDoc() {
    var f = fieldVals(), qs = keyQs(), A = (window.COURSE || C).assessment;
    var content = pdfHead("Assessment questions and answer key").concat([
      pdfInfo(courseRows(f, [["Assessment", "Pre- and post-course check"], ["Topics", A.topics.map(function (tp) { return tp.name; }).join(" · ")]]))]);
    qs.forEach(function (q, k) {
      content.push({ unbreakable: true, margin: [0, 6, 0, 4], stack: [
        { text: (k + 1) + ". " + q.q, bold: true, color: PDF_C.navy, fontSize: 10.5, margin: [0, 0, 0, 3] },
        { stack: q.options.map(function (o, i) { return i === q.answer ? { text: LETTERS[i] + ". " + o + " (correct)", bold: true, color: PDF_C.ok } : { text: LETTERS[i] + ". " + o }; }), margin: [8, 0, 0, 3] },
        { text: [{ text: "Model answer: ", bold: true }, String(q.why || "").replace(/^Correct\.\s*/, "") + " ", { text: "Topic: " + topicName(q.topic), italics: true }], color: PDF_C.soft }] });
    });
    makePdf(f, "Questions and answer key", content);
  }
  // 2. who attended and how everyone scored (submission times stay in the CSV)
  function summaryDoc(ds) {
    var f = fieldVals(), ppl = people(ds);
    var content = pdfHead("Attendance and performance summary").concat([
      pdfInfo(courseRows(f, [["Participants", ppl.length]])),
      pdfH2("Participants"),
      pdfTable(["#", "Participant"].concat(DAYS.map(function (d) { return "Day " + d; }), ["Pre-course check", "Post-course check", "Gain"]),
        byName(ppl).map(function (p, k) {
          var a = p.pre ? marks(p.pre.answers) : null, b = p.post ? marks(p.post.answers) : null;
          return [String(k + 1), pdfName(p.name, 9, PDF_C.text, false, 170)].concat(DAYS.map(function (d) { return mark(p.att[d], "Present", "Absent"); }),
            [a ? a.right + " / " + a.total : "Not taken", b ? b.right + " / " + b.total : "Not taken", a && b ? (b.right - a.right > 0 ? "+" : "") + (b.right - a.right) : ""]);
        }), [16, "*"].concat(DAYS.map(function () { return 48; }), [76, 76, 32]))]);
    makePdf(f, "Attendance and performance summary", content);
  }
  // 3. every participant's pre- and post-course submission, one page each
  function sheetPdf(p, which, qs, first) {
    var r = p[which], label = which === "pre" ? "Pre-course check" : "Post-course check";
    var out = [{ columns: [{ stack: [pdfName(p.name, 15, PDF_C.navy, true, 380), { text: label, color: PDF_C.soft }] },
        r ? { text: marks(r.answers).right + " / " + qs.length, fontSize: 20, bold: true, color: PDF_C.navy, alignment: "right", width: 90 } : { text: "", width: 90 }], pageBreak: first ? undefined : "before" },
      { canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2, lineColor: PDF_C.navy }], margin: [0, 4, 0, 10] }];
    if (!r) return out.concat([{ text: "Not submitted.", fontSize: 12, color: PDF_C.no, margin: [0, 20, 0, 0] }]);
    return out.concat([pdfTable(["#", "Question", "Participant's answer", "Correct answer", ""], qs.map(function (q, k) {
      var mine = r.answers[q.id], ok = mine === q.answer;
      return [String(k + 1), q.q, mine == null ? "No answer" : LETTERS[mine] + ". " + q.options[mine], LETTERS[q.answer] + ". " + q.options[q.answer], { text: ok ? "Correct" : "Incorrect", color: ok ? PDF_C.ok : PDF_C.no, bold: true }];
    }), [14, "*", 110, 110, 46], { size: 7.5 })]);
  }
  function submissionsDoc(ds) {
    var f = fieldVals(), qs = keyQs(), ppl = byName(people(ds)), content = [], k = 0;
    ppl.forEach(function (p) { content = content.concat(sheetPdf(p, "pre", qs, k++ === 0), sheetPdf(p, "post", qs, false)); });
    if (!content.length) content = [{ text: "No submissions." }];
    makePdf(f, "Assessment submissions", content);
  }
  // 4. the attendance sheet: every participant against every course day, with the instructor's signature
  function attendanceDoc(ds) {
    var f = fieldVals(), ppl = byName(people(ds)), dd = QA.days || {};
    function dayHead(d) { return "Day " + d + (dd[d] ? " · " + dd[d] : ""); }
    var center = [2, 3, 4, 5, 6].slice(0, DAYS.length + 1);
    var content = pdfHead("Attendance sheet").concat([
      pdfInfo(courseRows(f, [["Course hours", QA.hours || ""], ["Participants", ppl.length]])),
      pdfH2("Participants"),
      pdfTable(["#", "Participant"].concat(DAYS.map(dayHead), ["Days attended"]), ppl.map(function (p, k) {
        var days = DAYS.filter(function (d) { return p.att[d]; }).length;
        return [String(k + 1), pdfName(p.name, 9, PDF_C.text, false, 130)].concat(DAYS.map(function (d) { return mark(p.att[d], "Present", "Absent"); }), [{ text: days + " of " + DAYS.length, alignment: "center" }]);
      }), [16, "*"].concat(DAYS.map(function () { return 120; }), [62]), { center: center }),
      { margin: [0, 26, 0, 0], stack: [
        { text: [{ text: "Instructor: " }, { text: f.fInstr, bold: true }] },
        { columns: [{ width: 70, text: "Signature", margin: [0, 24, 0, 0] }, { width: 180, canvas: [{ type: "line", x1: 0, y1: 34, x2: 180, y2: 34, lineWidth: 0.8, lineColor: PDF_C.text }] }] },
        { columns: [{ width: 70, text: "Date", margin: [0, 24, 0, 0] }, { width: 180, canvas: [{ type: "line", x1: 0, y1: 34, x2: 180, y2: 34, lineWidth: 0.8, lineColor: PDF_C.text }] }] }] }]);
    makePdf(f, "Attendance sheet", content);
  }

  function hhmm(ts) { try { var d = new Date(ts); return (d.getHours() < 10 ? "0" : "") + d.getHours() + ":" + (d.getMinutes() < 10 ? "0" : "") + d.getMinutes(); } catch (e) { return ""; } }
  // who is playing: top 3, each team's top performer, and a grid of the last questions per person
  function perfHTML() {
    var pf = perf(), played = pf.played, cols = played.slice(-12), liveQ = played.filter(function (x) { return !x.done; })[0];
    var html = '<h2 class="mt-l">' + t("lvPerfTitle") + "</h2>";
    if (!played.length) return html + '<p class="muted">' + t("lvNoPlayed") + "</p>";
    var top = top3(pf);
    html += top.length ? podiumHTML(top, true) : '<p class="muted">' + t("lvNoTop") + "</p>";
    html += '<p class="hint">' + ts("lvPerfHint", { n: played.length, m: cols.length }) + "</p>";
    if (SOLO && liveQ) {
      var liveAll = pf.list.filter(function (p) { return p.cells[liveQ.k]; }).length;
      html += '<p class="' + (liveAll < pf.list.length ? "lv-warn" : "hint") + '">' + t("lvLiveNow", { a: liveAll, b: pf.list.length }) + "</p>";
    }
    html += '<div class="tablewrap"><table class="dash-table perf"><thead><tr><th>' + t("lvName") + "</th><th>" + t("lvAnsweredCol") + "</th><th>" + t("lvRightCol") + "</th><th>" + ts("lvWonCol") + "</th>" +
      cols.map(function (c) { return '<th class="pc" title="' + h(c.title + " · " + (c.i + 1)) + '">' + (played.indexOf(c) + 1) + "</th>"; }).join("") + "</tr></thead><tbody>";
    function cellsHTML(p) {
      return cols.map(function (c) {
        var a = p.cells[c.k], cls = !a ? "no" : !c.done ? "in" : a.d.c === correctOf(BEATS[c.b], c.i, p.team) ? "ok" : "bad";
        return '<td class="pc ' + cls + '">' + (cls === "ok" ? "✓" : cls === "bad" ? "✗" : cls === "in" ? "●" : "·") + "</td>";
      }).join("");
    }
    if (SOLO) {
      pf.list.slice().sort(function (a, b) { return b.won - a.won || b.right - a.right || a.name.localeCompare(b.name); }).forEach(function (p) {
        html += "<tr><td>" + h(p.name) + "</td><td>" + p.ans + "/" + played.length + "</td><td>" + p.right + "</td><td>" + p.won + "</td>" + cellsHTML(p) + "</tr>";
      });
      return html + "</tbody></table></div>";
    }
    for (var n = 1; n <= TEAMS; n++) {
      var ms = pf.list.filter(function (p) { return p.team === n; });
      if (!ms.length) continue;
      var tot = 0; ms.forEach(function (p) { tot += p.ans; });
      var liveN = liveQ ? ms.filter(function (p) { return p.cells[liveQ.k]; }).length : 0;
      var best = ms[0].right > 0 ? ms[0].id : null;
      html += '<tr class="pt-team"><th colspan="' + (4 + cols.length) + '">' + h(teamLabel(n)) + " · " + t("lvPoints", { n: X.scoreOf(n - 1) }) + " · " +
        t("lvTeamRate", { p: Math.round(100 * tot / (ms.length * played.length)) }) + (liveQ ? ' · <span class="' + (liveN < ms.length ? "lv-warn" : "") + '">' + t("lvLiveNow", { a: liveN, b: ms.length }) + "</span>" : "") + "</th></tr>";
      ms.forEach(function (p) {
        html += "<tr" + (p.id === best ? ' class="best"' : "") + "><td>" + (p.id === best ? "★ " : "") + h(p.name) + "</td><td>" + p.ans + "/" + played.length + "</td><td>" + p.right + "</td><td>" + p.won + "</td>" +
          cols.map(function (c) {
            var a = p.cells[c.k], cls = !a ? "no" : !c.done ? "in" : a.d.c === correctOf(BEATS[c.b], c.i, p.team) ? "ok" : "bad";
            return '<td class="pc ' + cls + '">' + (cls === "ok" ? "✓" : cls === "bad" ? "✗" : cls === "in" ? "●" : "·") + "</td>";
          }).join("") + "</tr>";
      });
    }
    return html + "</tbody></table></div>";
  }
  // "Merge into…": the people this entry can be merged into
  function mergeOpts(exceptId) {
    return '<option value="">' + t("lvMergeInto") + "</option>" + S.members.filter(function (m) { return m.id !== exceptId; }).slice().sort(function (a, b) { return a.name.localeCompare(b.name); })
      .map(function (m) { return '<option value="' + m.id + '">' + h(m.name) + (SOLO ? "" : " · " + h(teamLabel(m.team))) + "</option>"; }).join("");
  }
  function renderLivePage(app, fromLoad) {
    app = app || $("app");
    X.renderNav("live");
    var tt = t("lvPageTitle").split("|");
    var html = '<section class="dayhero"><div class="wrap"><h1>' + h(tt[0]) + (tt[1] ? ' <span class="accent">' + h(tt[1]) + "</span>" : "") + '</h1><div class="rule"></div>';
    // the facilitator notes switch for this tab
    html += '<div class="dash-notes"><button class="btn ghost small" type="button" data-act="togglenotes">' + (X.notesOn() ? t("hideNotes") : t("showNotes")) + '</button> <span class="hint">' + t("notesHint") + "</span></div>";
    if (!enabled) { app.innerHTML = html + "<p>" + t("lvNotConnected") + "</p>" + (failWhy ? '<p class="hint">' + h(failWhy) + "</p>" : "") + "</div></section>"; return; }
    if (!fromLoad) loadDash();
    var rollClosed = drive ? D.rollClosed : !!S.state.rollClosed;
    // the run and the roll call
    html += '<div class="dash-run"><div><b>' + t("lvRunN", { n: S.run || 1 }) + "</b><br><span>" + t("lvRunInfo", { t: hhmm(S.runStarted), n: S.members.length }) + " · " + (rollClosed ? t("lvRollClosed") : t("lvRollOpen")) + "</span></div>" +
      (drive ? '<div class="dash-btns"><button class="btn" type="button" data-lv="roll">' + (rollClosed ? t("lvOpenRoll") : t("lvCloseRoll")) + '</button> <button class="btn" type="button" data-lv="keepteams">' + ts("lvKeepTeams") + '</button> <button class="btn" type="button" data-lv="startover">' + t("lvStartOver") + "</button></div>" : "") + "</div>" +
      '<p class="hint">' + ts("lvRollHint") + "</p>";
    // links
    var pres = location.origin + "/instructor/", notes = pres + "?notes", join = joinURL();
    html += '<div class="lv-mode"><p><b>' + t("lvTwoTabs") + "</b></p><p>" + t("lvLinkPresent") + '<br><a href="' + pres + '">' + h(pres) + "</a></p>" +
      "<p>" + t("lvLinkNotes") + '<br><a href="' + notes + '" target="_blank" rel="noopener">' + h(notes) + "</a></p>" +
      "<p>" + t("lvJoinTitle") + ':<br><b>' + h(join) + '</b> <button class="btn ghost small" type="button" data-act="copytext" data-text="' + h(join) + '">' + t("copyLink") + "</button></p></div>";
    // teams, scores, members
    html += "<h2>" + ts("lvTeamsScores") + '</h2><div class="dash-teams">';
    slots().forEach(function (n) {
      var ms = S.members.filter(function (m) { return m.team === n; });
      html += '<div class="dash-team"><h3>' + h(teamLabel(n)) + " <b>" + X.scoreOf(n - 1) + "</b></h3>" + (SOLO ? "" : "<p>" + (ms.length ? ms.map(function (m) { return h(m.name); }).join(" · ") : '<span class="muted">' + t("lvNobodyYet") + "</span>") + "</p>") + "</div>";
    });
    if (SOLO && !S.members.length) html += '<p class="muted">' + t("lvNobodyYet") + "</p>";
    html += "</div>" + perfHTML();
    // people: move or remove
    html += '<h2 class="mt-l">' + t("lvPeople", { n: S.members.length }) + "</h2>" + attendanceHTML() + '<div class="tablewrap"><table class="dash-table lv-people"><thead><tr><th>' + t("lvName") + "</th>" +
      TICK_DAYS.map(function (d) { return '<th class="att">' + t("lvAttDay", { d: d }) + "</th>"; }).join("") + (SOLO ? "" : "<th>" + t("lvTeam") + "</th>") + "<th></th><th></th></tr></thead><tbody>";
    S.members.slice().sort(function (a, b) { return SOLO ? a.name.localeCompare(b.name) : a.team - b.team; }).forEach(function (m) {
      var opts = ""; for (var k = 1; k <= TEAMS; k++) opts += '<option value="' + k + '"' + (k === m.team ? " selected" : "") + ">" + h(teamLabel(k)) + "</option>";
      // people can be renamed, moved or removed from either instructor tab (the notes tab keeps the dashboard private)
      html += "<tr><td>" + h(m.name) + ' <button class="linkbtn" type="button" data-lv="rename" data-member="' + m.id + '" data-name="' + h(m.name) + '">' + t("lvRename") + "</button></td>" +
        TICK_DAYS.map(function (d) {
          return '<td class="att"><label><input type="checkbox" data-lv="attend" data-member="' + m.id + '" data-day="' + d + '"' + (attOn(m.id, d) ? " checked" : "") + ' aria-label="' + h(t("lvAttDay", { d: d }) + " · " + m.name) + '">' +
            (activeOn(m.id, d) ? ' <span class="att-act" title="' + h(t("lvAttActive")) + '">●</span>' : "") + "</label></td>";
        }).join("") +
        (SOLO ? "" : '<td><select data-lv="move" data-member="' + m.id + '">' + opts + "</select></td>") + '<td><button class="linkbtn" type="button" data-lv="remove" data-member="' + m.id + '">' + t("lvRemove") + "</button></td>" +
        '<td><select data-lv="merge" data-member="' + m.id + '" data-name="' + h(m.name) + '">' + mergeOpts(m.id) + "</select></td></tr>";
    });
    html += "</tbody></table></div>";
    // results and exports
    var ds = dataset(dashSel), f = fieldVals();
    html += '<h2 class="mt-l">' + t("lvChecks") + '</h2><div class="dash-bar"><label>' + t("lvShowRun") + ' <select data-lv="dashsel"><option value="current"' + (dashSel === "current" ? " selected" : "") + ">" + t("lvCurrentRun", { n: S.run || 1 }) + "</option>" +
      dashData.runs.map(function (r) { return '<option value="' + r.run + '"' + (String(dashSel) === String(r.run) ? " selected" : "") + ">" + t("lvRunN", { n: r.run }) + " · " + hhmm(r.started) + "–" + hhmm(r.ended) + "</option>"; }).join("") + "</select></label>" +
      '<button class="btn ghost small" type="button" data-lv="csv">' + t("lvCsv") + '</button><button class="btn small" type="button" data-lv="doc1">' + t("lvDoc1") + '</button><button class="btn small" type="button" data-lv="doc2">' + t("lvDoc2") + '</button><button class="btn small" type="button" data-lv="doc3">' + t("lvDoc3") + '</button><button class="btn small" type="button" data-lv="doc4">' + t("lvDoc4") + "</button></div>" +
      resultsTable(ds, true) +
      '<details class="dash-fields"><summary>' + t("lvSheetFields") + "</summary><div class=\"fields\">" +
      FIELDS.map(function (fd) { return '<label>' + h(fd[1]) + '<input id="' + fd[0] + '" value="' + h(f[fd[0]] || "") + '"></label>'; }).join("") + "</div></details>" +
      (ds.board && ds.board.length && dashSel !== "current" ? "<p>" + ds.board.map(function (x) { return h(x.team) + " <b>" + x.score + "</b>"; }).join(" · ") + "</p>" : "");
    app.innerHTML = html + "</div></section>";
  }

  // =====================================================================
  // Students: the phone shows the question the instructor started, and nothing else.
  // =====================================================================
  var matesOpen = false, orderPick = {}, sending = false, prevId = null, prevTeam = null;   // prevId, prevTeam: who this phone was before "Switch team or name"
  document.addEventListener("toggle", function (e) { if (e.target.classList && e.target.classList.contains("pl-mates")) matesOpen = e.target.open; }, true);
  function participantTick(first) {
    X.resendChecks();   // a check the server has not confirmed yet is sent again
    if (first && !/^#\/(play|pre|post|files|start|card)/.test(location.hash)) { location.hash = "#/play"; return; }   // the files, quick win and my card pages stay open on the participants' computers
    // a student who has sent their check goes back to Play as soon as the next game starts
    var cm = location.hash.match(/^#\/(pre|post)/), lq = S.state.q, lb = lq && BEATS[lq.b];
    if (cm && X.getL()[cm[1]] && lb && lb.type !== "assesscue") { location.hash = "#/play"; return; }
    if (/^#\/play/.test(location.hash)) updatePlay(false);
  }
  function myTeam() { return me ? S.members.filter(function (m) { return m.team === me.team; }) : []; }
  function teamScore(i) { var st = S.state.st || {}; var tm = (st.teams || [])[i]; return (tm ? tm.score : 0) + autoPts(i); }

  function renderPlay(app) {
    app = app || $("app");
    X.renderNav("play");
    app.innerHTML = '<section class="play"><div class="wrap narrow" id="playWrap"></div></section>';
    updatePlay(true);
  }
  function updatePlay(force) {
    var wrap = $("playWrap"); if (!wrap) return;
    if (!enabled) { wrap.innerHTML = '<div class="pl-card"><p>' + t("lvConnecting") + "</p></div>"; return; }
    if (!S.polled) return;
    if (!me) { if (!$("plJoin") || force) { wrap.innerHTML = joinHTML(); wrap._mode = S.state.rollClosed ? "closed" : "open"; } else refreshJoin(); return; }
    if (!$("plHead")) wrap.innerHTML = '<div id="plHead"></div><div class="pl-card" id="plCard"></div>';
    var head = $("plHead"), hh = headHTML();
    if (head._html !== hh) { head.innerHTML = hh; head._html = hh; }
    var card = $("plCard"), ch = cardHTML();
    if (force || card._html !== ch) { card.innerHTML = ch; card._html = ch; }
  }
  setInterval(function () { if (enabled && !INSTR && /^#\/play/.test(location.hash)) updatePlay(false); }, 500);

  function joinHTML() {
    var counts = {}; S.members.forEach(function (m) { counts[m.team] = (counts[m.team] || 0) + 1; });
    var L = X.getL();
    if (S.state.rollClosed) {
      var names = S.members.slice().sort(function (a, b) { return a.name.localeCompare(b.name); });
      return '<div class="pl-card" id="plJoin"><h1>' + t("lvPickName") + "</h1><p>" + t("lvPickNameLede") + "</p>" +
        '<select id="plPick" class="pl-select"><option value="">' + t("lvChooseName") + "</option>" +
        names.map(function (m) { return '<option value="' + h(m.id) + '">' + h(m.name) + (SOLO ? "" : " · " + h(teamLabel(m.team))) + "</option>"; }).join("") + "</select>" +
        '<div class="actions"><button class="btn" type="button" data-lv="pick">' + t("lvContinue") + '</button></div><p class="hint">' + t("lvNotListed") + "</p></div>";
    }
    var field = '<label class="namefield" for="plName">' + t("lvYourName") + '<input id="plName" type="text" maxlength="40" autocomplete="given-name" value="' + h(L.name || "") + '" placeholder="' + h(t("lvFirstName")) + '"></label>' + '<div id="plTaken"></div>';
    if (SOLO) return '<div class="pl-card" id="plJoin"><h1>' + t("lvJoinHead") + "</h1><p>" + ts("lvJoinLede") + "</p>" + field +
      '<div class="actions"><button class="btn big" type="button" data-lv="join">' + t("lvJoinBtn") + "</button></div></div>";
    return '<div class="pl-card" id="plJoin"><h1>' + t("lvJoinHead") + "</h1><p>" + t("lvJoinLede") + "</p>" + field + "<p><b>" + t("lvPickTeam") + '</b></p><div class="pl-teams" id="plTeams">' + teamButtons(counts) + "</div>" +
      '<p class="hint">' + t("lvPickTeamHint") + "</p></div>";
  }
  function teamButtons(counts) {
    var out = "";
    for (var n = 1; n <= TEAMS; n++) {
      var c = counts[n] || 0;
      out += '<button class="pl-teambtn" type="button" data-lv="join" data-team="' + n + '"' + (c >= 6 ? " disabled" : "") + "><b>" + h(teamLabel(n)) + "</b><span>" + t("lvInTeam", { n: c }) + "</span></button>";
    }
    return out;
  }
  function refreshJoin() {
    var counts = {}; S.members.forEach(function (m) { counts[m.team] = (counts[m.team] || 0) + 1; });
    var mode = S.state.rollClosed ? "closed" : "open", wrap = $("playWrap");
    if (wrap && wrap._mode !== mode) { wrap._mode = mode; wrap.innerHTML = joinHTML(); return; }
    var el = $("plTeams"); if (!el) return;
    var html = teamButtons(counts); if (el._html !== html) { el.innerHTML = html; el._html = html; }
  }
  function headHTML() {
    if (SOLO) {
      var my = teamScore(me.team - 1), place = 1;
      slots().forEach(function (n) { if (teamScore(n - 1) > my) place++; });
      var myCk = X.getL().scores;
      // with code names, a phone never shows its own code, points or rank until the reveal: those would give the code away
      var secret = CODES && !revealed();
      return '<div class="pl-head"><div class="pl-top"><span class="pl-tn">' + h(CODES && !secret ? shownName(me.team) || me.name : me.name) + "</span>" +
        (secret ? "" : '<span class="pl-score">' + t("lvPoints", { n: my }) + " · " + t("lvRank", { n: place }) + "</span>") + "</div>" +
        (secret ? '<p class="pl-ck">' + t("lvCodeNote") + "</p>" : "") +
        (myCk ? '<p class="pl-ck">' + t("lvMyCheck", { a: myCk.pre == null ? "–" : myCk.pre, b: myCk.post, n: myCk.total }) + "</p>" : "") +
        (S.state.rollClosed ? "" : '<p class="pl-switch"><button class="linkbtn" type="button" data-lv="leave">' + ts("lvSwitch") + "</button></p>") + "</div>";
    }
    var mates = myTeam(), rank = 1, mine = teamScore(me.team - 1);
    for (var i = 0; i < TEAMS; i++) if (teamScore(i) > mine) rank++;
    var ck = X.getL().scores;
    return '<div class="pl-head"><div class="pl-top"><span class="pl-tn">' + h(teamLabel(me.team)) + '</span><span class="pl-score">' + t("lvPoints", { n: mine }) + " · " + t("lvRank", { n: rank }) + "</span></div>" +
      (ck ? '<p class="pl-ck">' + t("lvMyCheck", { a: ck.pre == null ? "–" : ck.pre, b: ck.post, n: ck.total }) + "</p>" : "") +
      '<details class="pl-mates"' + (matesOpen ? " open" : "") + "><summary>" + h(me.name) + " · " + t("lvYourTeam", { n: mates.length }) + "</summary><ul>" +
      mates.map(function (m) { return "<li>" + h(m.name) + (m.id === me.id ? " " + t("lvYou") : "") + "</li>"; }).join("") + "</ul>" +
      (S.state.rollClosed ? "" : '<p class="pl-switch"><button class="linkbtn" type="button" data-lv="leave">' + t("lvSwitch") + "</button></p>") + "</details></div>";
  }

  function cardHTML() {
    var q = S.state.q, b = q && BEATS[q.b];
    if (!b) return "<h2>" + t("lvIn") + "</h2><p>" + t("lvWaitFirst") + "</p>";
    var title = '<p class="pl-k">' + h(b.title) + "</p>";
    if (b.type === "assesscue") {
      var mineCheck = X.getL()[b.which];
      return title + "<p>" + T(b.intro) + "</p>" + (mineCheck ? '<p class="pl-done">' + t("lvCheckDone") + "</p>" : '<a class="btn big" href="#/' + b.which + '">' + t("lvStartCheck", { x: h(b.title) }) + "</a>");
    }
    if (b.type === "leaderboard") {
      var rows = slots().map(function (n) { return { i: n - 1, s: teamScore(n - 1) }; });
      rows.sort(function (a, c) { return c.s - a.s || a.i - c.i; });
      var tp = S.state.top || [];
      return title + '<ol class="pl-board">' + rows.map(function (r) { return '<li class="' + (r.i === me.team - 1 && !(CODES && !revealed()) ? "me" : "") + '"><span>' + h(teamLabel(r.i + 1)) + "</span><b>" + r.s + "</b></li>"; }).join("") + "</ol>" +
        (tp.length ? '<p class="pl-k">' + t("lvTop3") + "</p>" + podiumHTML(tp, true) : "");
    }
    if (!isGame(b)) return "<h2>" + t("lvIn") + "</h2><p>" + t("lvWaitFirst") + "</p>";
    var i = q.i, n = countOf(b), left = q.paused ? (q.left || 0) : Math.ceil((q.ends - serverNow()) / 1000);
    var mine = S.items["a:" + b.id + ":" + i + ":" + me.id], done = !!(S.state.locks && S.state.locks[b.id + ":" + i]);
    var open = !mine && !done && !q.paused && left > 0;
    var html = title + (n > 1 ? '<p class="pl-sub">' + t("questionNofM", { i: i + 1, n: n }) + "</p>" : "");
    html += '<div class="pl-clock' + (left <= 5 && !done ? " low" : "") + '">' + (done ? t("lvRevealed") : q.paused ? t("lvPaused") + " · " + mmss(left) : left > 0 ? mmss(left) : t("timesUp")) + "</div>";
    html += stemHTML(b, i, done);
    if (isOrder(b)) html += orderHTML(b, mine, open);
    else {
      var right = correctOf(b, i, me.team);
      html += '<div class="pl-opts">' + choicesOf(b, i, me.team).map(function (o) {
        var cls = mine && mine.d.c === o[0] ? " sel" : "";
        if (done) cls += o[0] === right ? " right" : (mine && mine.d.c === o[0] ? " wrong" : "");
        return '<button class="pl-opt' + cls + '" type="button" data-lv="answer" data-c="' + h(o[0]) + '"' + (open ? "" : " disabled") + ">" + T(o[1]) + "</button>";
      }).join("") + "</div>";
    }
    html += statusHTML(b, i, mine, done, left);
    return html;
  }
  // charts in a question are drawn on the phone too, smaller; the answer is picked out after the reveal
  function phoneChart(c, done) { return c && window.Charts ? '<div class="pl-chart">' + window.Charts.svg(c, { compact: true, shown: done }) + "</div>" : ""; }
  // the case file opens over the question, so the answer buttons stay where they are
  function caseLinkPhone() { return C.caseFile ? '<p class="pl-case"><button class="linkbtn" type="button" data-act="casefile">' + t("caseFile") + "</button></p>" : ""; }
  function stemHTML(b, i, done) {
    if (b.type === "estimate") return '<p class="pl-q">' + T(b.question) + "</p>" + phoneChart(b.chart, done) + caseLinkPhone();
    if (b.type === "quiz") return (i === 0 && b.intro ? '<p class="pl-prompt">' + T(b.intro) + "</p>" : "") + '<p class="pl-q">' + T(b.questions[i].q) + "</p>" + phoneChart(b.questions[i].chart, done) + caseLinkPhone();
    if (b.type === "stations") {
      var stn = stationFor(b, me.team), sq = stn && stn.questions[i];
      if (!sq) return '<p class="pl-q">' + t("lvNoStation") + "</p>";
      return '<p class="pl-prompt">' + t("lvStation", { x: h(stn.title) }) + '</p><p class="pl-q">' + T(sq.q) + "</p>" + phoneChart(sq.chart, done) + caseLinkPhone();
    }
    if (b.type === "higherlower") { var p = b.pairs[i]; return '<div class="pl-hl"><p>' + T(p.a.label) + " <b>" + h(p.a.show) + "</b></p><p>" + T(p.b.label) + " <b>?</b></p></div>"; }
    if (b.type === "flags") return '<p class="pl-q">' + T(b.items[i].text) + "</p>";
    if (b.type === "scam") {
      var it = b.items[i];
      return '<div class="pl-msg"><small>' + h(it.channel) + " · <span>" + h(it.from) + "</span></small><p>" + T(it.text) + "</p></div>";
    }
    if (isOrder(b)) return '<p class="pl-q">' + (b.type === "timeline" ? t("lvOrderOldest") : t("lvOrderSteps")) + "</p>";
    return "";
  }
  function orderHTML(b, mine, open) {
    var list = b.items || b.steps, order = X.shuffledIdx(list.length, b.id), picked = orderPick[b.id] || [];
    var html = '<div class="pl-cards">' + order.map(function (k, j) {
      var L2 = LETTERS[j], used = picked.indexOf(L2) >= 0 || !!mine;
      return '<button class="pl-ocard' + (used ? " used" : "") + '" type="button" data-lv="opick" data-l="' + L2 + '"' + (used || !open ? " disabled" : "") + '><span class="L">' + L2 + "</span><span>" + T(list[k].text) + "</span></button>";
    }).join("") + "</div>";
    if (mine) return html + '<p class="pl-seq">' + h(String(mine.d.c).split(",").join(" ")) + "</p>";
    return html + '<p class="pl-seq">' + (picked.length ? h(picked.join(" ")) : '<span class="muted">' + t("lvTapInOrder") + "</span>") + "</p>" +
      '<div class="actions"><button class="btn ghost small" type="button" data-lv="oclear">' + t("clear") + "</button>" +
      '<button class="btn" type="button" data-lv="osend"' + (picked.length === list.length && open ? "" : " disabled") + ">" + t("send") + "</button></div>";
  }
  function statusHTML(b, i, mine, done, left) {
    if (!done) {
      if (mine) return '<p class="pl-done">' + t("lvWaitReveal") + "</p>";
      if (S.state.q && S.state.q.paused) return '<p class="hint">' + t("lvPausedHint") + "</p>";
      return left > 0 ? '<p class="hint">' + ts("lvOneEach") + "</p>" : '<p class="pl-result no">' + t("lvYouNone") + "</p>";
    }
    var right = correctOf(b, i, me.team), ok = !!(mine && mine.d.c === right);
    var pts = ((S.state.res || {})[b.id + ":" + i] || {})[me.team] || 0;
    var fast = null;
    answers(b.id, i).some(function (a) { if (a.t === me.team && a.d.c === right) { fast = a.d.n; return true; } return false; });
    var html = '<p class="pl-result ' + (ok ? "ok" : "no") + '">' + (ok ? t("lvYouRight") : mine ? t("lvWrong") : t("lvYouNone")) + "</p>";
    if (isOrder(b)) html += '<p class="pl-fact">' + t("lvRightOrder", { x: h(right.split(",").join(" ")) }) + "</p>";
    if (b.practice) return html + '<p class="pl-team">' + t("lvPractice") + "</p>";
    if (SOLO) { if (pts) html += '<p class="pl-team">' + ptsText("lvSoloGot", pts) + (pts === FAST ? " · " + t("lvSoloFastest") : "") + "</p>"; }
    else html += '<p class="pl-team">' + t("lvTeamGot", { n: pts }) + (fast && pts ? " · " + t("lvTeamFastest", { name: h(fast) }) : "") + "</p>";
    return html;
  }

  // ---------- sending ----------
  function sendAnswer(c) {
    var q = S.state.q; if (!q || sending || !me) return;
    sending = true;
    rpc("live_send", { p_room: cfg.room, p_member: me.id, p_kind: "answer", p_beat: q.b, p_item: q.i, p_data: { c: c } })
      .then(function (r) {
        sending = false;
        if (r && r.ok === false && r.why === "member") { me = null; store(MEKEY, null); updatePlay(true); return; }
        if (r && r.ok === false) { X.toast(t("lvTooLate")); updatePlay(true); return; }
        if (r && r.ok) {
          var scope = "a:" + q.b + ":" + q.i + ":" + me.id;
          S.items[scope] = { s: scope, k: "answer", b: q.b, i: q.i, t: me.team, m: me.id, d: r.d, r: r.r };
        }
        updatePlay(true);
      })
      .catch(function () { sending = false; X.toast(t("lvNotSent")); updatePlay(true); });
  }

  document.addEventListener("change", function (e) {
    if (e.target.getAttribute && e.target.getAttribute("data-lv") === "dashsel") { dashSel = e.target.value; renderLivePage(null, true); return; }
    var mg = e.target.closest && e.target.closest('[data-lv="merge"], [data-lv="mergename"]');
    if (mg && enabled) {
      var into = S.members.filter(function (m) { return m.id === mg.value; })[0], fromName = mg.getAttribute("data-name");
      if (!into || !window.confirm(t("lvMergeConfirm", { a: fromName, b: into.name }))) { mg.value = ""; return; }
      var margs = { into: into.id }; if (mg.getAttribute("data-lv") === "merge") margs.from = mg.getAttribute("data-member"); else margs.fromName = fromName;
      admin("merge", margs).then(function (r) { X.toast(t(r && r.ok ? "lvMerged" : "lvNotSent")); poll(); loadDash(); });
      return;
    }
    var at = e.target.getAttribute && e.target.getAttribute("data-lv") === "attend" ? e.target : null;
    if (at && enabled) {
      var on = at.checked, day = +at.getAttribute("data-day");
      setAtt(at.getAttribute("data-member"), day, on).then(function (r) { if (!r || !r.ok) { at.checked = !on; X.toast(t("lvNotSent")); } poll(); })
        .catch(function () { at.checked = !on; X.toast(t("lvNotSent")); });
      at.blur();
      return;
    }
    var a = e.target.closest && e.target.closest('[data-lv="move"]');
    if (!a || !enabled) return;
    admin("move", { member: a.getAttribute("data-member"), team: +a.value }).then(function () { poll(); });
  });

  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("[data-lv]");
    if (!a || !enabled) return;
    var act = a.getAttribute("data-lv"), id = a.getAttribute("data-id"), q = S.state.q;
    switch (act) {
      case "join":
      case "pick":
        var who, nm, tm;
        if (act === "pick") {
          var pid = ($("plPick") || {}).value, pm = S.members.filter(function (m) { return m.id === pid; })[0];
          if (!pm) { X.toast(t("lvChooseName")); return; }
          who = pm.id; nm = pm.name; tm = pm.team;
        } else {
          // a solo player sends no slot: the server seats them in an empty one (a name change keeps the slot)
          nm = ($("plName").value || "").trim(); tm = a.hasAttribute("data-team") ? +a.getAttribute("data-team") : (!me && prevId && prevTeam ? prevTeam : me ? me.team : null);
          if (!nm) { X.toast(t("addName")); $("plName").focus(); return; }
          who = me ? me.id : prevId;   // "Switch team or name" moves the same person
        }
        a.disabled = true;
        rpc("live_join", { p_room: cfg.room, p_member: who, p_name: nm, p_team: tm }).then(function (r) {
          if (r && r.ok === false && r.why === "taken") {
            a.disabled = false;
            var box = $("plTaken"); if (box) box.innerHTML = '<div class="pl-tip">' + ts("lvNameTaken", { name: h(nm) }) + "</div>";
            return;
          }
          if (r && r.ok === false && r.why === "closed") { a.disabled = false; X.toast(t("lvRollClosedToast")); updatePlay(true); return; }
          if (!r || !r.ok) { X.toast(r && r.why === "full" ? t("lvTeamFull") : t("lvNotSent")); a.disabled = false; return; }
          me = { id: r.id, name: r.name, team: r.team }; store(MEKEY, me);
          if (!X.getL().name) X.setLName(r.name);
          S.mv = -1; S.since = 0; S.items = {}; $("playWrap").innerHTML = ""; poll();
        }).catch(function () { a.disabled = false; X.toast(t("lvNotSent")); });
        return;
      case "leave": prevId = me ? me.id : prevId; prevTeam = me ? me.team : prevTeam; me = null; store(MEKEY, null); $("playWrap").innerHTML = ""; updatePlay(true); return;
      case "answer":
        document.querySelectorAll('#plCard [data-lv="answer"]').forEach(function (x) { x.disabled = true; });
        a.classList.add("sel");
        sendAnswer(a.getAttribute("data-c"));
        return;
      case "opick": if (q) { orderPick[q.b] = (orderPick[q.b] || []).concat([a.getAttribute("data-l")]); updatePlay(true); } return;
      case "oclear": if (q) { orderPick[q.b] = []; updatePlay(true); } return;
      case "osend": if (q) sendAnswer((orderPick[q.b] || []).join(",")); return;
      // presentation
      case "start": start(id); return;
      case "sta": if (INSTR && drive) { var stTeam = +a.getAttribute("data-team"), stKey = a.getAttribute("data-key"); D.sta = Object.assign({}, D.sta); if (D.sta[stTeam] === stKey) delete D.sta[stTeam]; else D.sta[stTeam] = stKey; pushSoon(null); X.applyState(null); refreshPanels(); } return;
      case "roll": D.rollClosed = !D.rollClosed; pushSoon(null); renderLivePage(null, true); return;
      case "names": D.reveal = !D.reveal; pushSoon(null); X.renderScores(); X.refreshTeamViews(); refreshPanels(); return;
      case "attfill":
        var fd = +a.getAttribute("data-day"), todo = S.members.filter(function (m) { return activeOn(m.id, fd) && !attOn(m.id, fd); });
        if (!todo.length) { X.toast(t("lvAttFilled", { n: 0, d: fd })); return; }
        a.disabled = true;
        Promise.all(todo.map(function (m) { return setAtt(m.id, fd, true); })).then(function (rs) {
          a.disabled = false;
          var ok = rs.filter(function (r) { return r && r.ok; }).length;
          X.toast(ok === todo.length ? t("lvAttFilled", { n: ok, d: fd }) : t("lvNotSent"));
          poll(); renderLivePage(null, true);
        }).catch(function () { a.disabled = false; X.toast(t("lvNotSent")); poll(); });
        return;
      case "csv": exportCSV(dataset(dashSel)); return;
      case "doc1": answerKeyDoc(); return;
      case "doc2": summaryDoc(dataset(dashSel)); return;
      case "doc3": submissionsDoc(dataset(dashSel)); return;
      case "doc4": attendanceDoc(dataset(dashSel)); return;
      // clear every question, answer and point of this run; everyone stays in their team (no new roll call)
      case "keepteams":
        if (!window.confirm(ts("lvKeepTeamsConfirm", { n: S.run || 1 }))) return;
        a.disabled = true;
        admin("reset", {}).then(function (r) {
          a.disabled = false;
          if (!r || !r.ok) { X.toast(t("lvNotSent")); return; }
          X.resetGame();
          D.q = null; D.locks = {}; D.res = {}; D.auto = null; D.top = []; D.rn = (D.rn || 0) + 1;
          S.items = {}; S.since = 0; orderPick = {}; lastSent = "";
          pushSoon(null); refreshPanels(); renderLivePage(null, true); X.toast(ts("lvKeepTeamsDone"));
        }).catch(function () { a.disabled = false; X.toast(t("lvNotSent")); });
        return;
      case "startover":
        var next = (S.run || 1) + 1;
        if (!window.confirm(ts("lvStartOverConfirm", { n: next, m: S.run || 1 }))) return;
        var board = slots().map(function (n) { return { team: teamLabel(n), score: X.scoreOf(n - 1) }; });
        a.disabled = true;
        stopPushing();   // from here on this page sends nothing, so the old run cannot leak into the new one
        admin("startover", { board: board }).then(function (r) {
          if (!r || !r.ok) { a.disabled = false; leaving = false; X.toast(t("lvNotSent")); return; }
          wipeLocal(); store(RUNKEY, r.run);
          location.hash = "#/"; location.reload();
        }).catch(function () { a.disabled = false; leaving = false; X.toast(t("lvNotSent")); });
        return;
      case "rename":
        var cur = a.getAttribute("data-name"), nn = window.prompt(t("lvRenamePrompt", { name: cur }), cur);
        if (nn == null || !nn.trim() || nn.trim() === cur) return;
        admin("rename", { member: a.getAttribute("data-member"), name: nn.trim() }).then(function (r) {
          if (r && r.ok) { X.toast(t("lvRenamed")); poll(); loadDash(); }
          else X.toast(t(r && r.why === "taken" ? "lvRenameTaken" : "lvNotSent"));
        });
        return;
      case "remove": admin("move", { member: a.getAttribute("data-member"), team: "" }).then(function () { poll(); }); return;
    }
  });

  connect();

  return {
    enabled: function () { return enabled; },
    autoPts: autoPts,
    onCommit: function (what) { pushSoon(what); },
    onRoute: function (hash) {
      if (!INSTR || !drive || /^#\/(pre|post|progress|class|live)/.test(hash)) return;
      D.route = hash; pushSoon(null);
    },
    onTimer: onTimer,
    // Reveal on the presentation locks the question and scores it
    onReveal: function (beat, i) { if (INSTR && drive) { D.locks[beat + ":" + (i || 0)] = 1; var c = computeRes(); D.res = c.res; D.auto = c.auto; refreshPanels(); } },
    beatPanel: beatPanel,
    sectionTop: sectionTop,
    render: function (hash, app) {
      if (/^#\/play/.test(hash) && !INSTR) { renderPlay(app); return true; }
      if (/^#\/live/.test(hash) && INSTR) { renderLivePage(app); return true; }
      return false;
    },
    navLinks: function (active) {
      if (!enabled) return "";
      return INSTR ? '<a href="#/live" class="' + (active === "live" ? "on" : "") + '">' + t("lvNav") + "</a>"
        : '<a href="#/play" class="play-link ' + (active === "play" ? "on" : "") + '">' + t("lvPlay") + "</a>" +
          '<a href="#/files" class="' + (active === "files" ? "on" : "") + '">' + t("lvFilesNav") + "</a>" +
          (C.quickWin ? '<a href="#/start" class="' + (active === "start" ? "on" : "") + '">' + t("startNav") + "</a>" : "") +
          (C.card ? '<a href="#/card" class="' + (active === "card" ? "on" : "") + '">' + t("cardNav") + "</a>" : "");
    },
    check: function (which, name, answers) {
      if (!enabled) return Promise.resolve(null);
      return rpc("live_check", { p_room: cfg.room, p_member: me ? me.id : null, p_name: me ? me.name : name, p_which: which, p_answers: answers })
        .then(function (r) { return r; }, function () { X.toast(t("lvNotSent")); return null; });
    },
    top3: function () { return enabled ? top3() : []; },
    podium: function (big) { return enabled ? podiumHTML(publicTop3(), !big) : ""; },
    // stations: {team number: station key} as the presentation set it
    stations: function () { return enabled ? staMap() : {}; },
    myName: function () { return enabled && me ? me.name : null; },
    slotName: function (n) { return enabled ? shownName(n) : ""; }
  };
};
