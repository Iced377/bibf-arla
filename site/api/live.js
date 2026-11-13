// Live play settings. Phones and the instructor page call this once when they load.
// Everyone signed in gets the database address and its public key; the instructor login also gets the room token.
// The first instructor visit (or a schema change) creates the tables, so there is nothing to set up by hand.
import pg from "pg";
import { SCHEMA, SCHEMA_VERSION, roomSQL } from "./_schema.js";

const ROOM = (process.env.LIVE_ROOM || "prompt").replace(/[^a-z0-9_-]/gi, "") || "prompt";

function credentials(req) {
  const [scheme, encoded] = String(req.headers.authorization || "").split(" ");
  if (scheme !== "Basic" || !encoded) return null;
  const decoded = Buffer.from(encoded, "base64").toString("utf8");
  const i = decoded.indexOf(":");
  return { user: decoded.slice(0, i), pass: decoded.slice(i + 1) };
}

function roleOf(req) {
  const c = credentials(req);
  if (!c) return null;
  const instrPass = process.env.INSTRUCTOR_PASSWORD, sitePass = process.env.SITE_PASSWORD;
  if (instrPass && c.user === (process.env.INSTRUCTOR_USER || "abed") && c.pass === instrPass) return "instructor";
  if (sitePass && c.user === (process.env.SITE_USER || "student") && c.pass === sitePass) return "participant";
  return null;
}

async function withDb(fn) {
  const raw = process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;
  if (!raw) throw new Error("no database url");
  // Supabase's certificate is not in Node's default store; the connection is still encrypted.
  const url = raw.replace(/([?&])(sslmode|supa)=[^&]*/g, "$1").replace(/[?&]+$/, "").replace("?&", "?");
  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 });
  await client.connect();
  try { return await fn(client); } finally { await client.end().catch(() => {}); }
}

async function instructorToken() {
  return withDb(async (db) => {
    let version = null;
    try { version = (await db.query("select v from live.meta where k = 'version'")).rows[0]?.v; } catch (e) { version = null; }
    if (String(version) !== String(SCHEMA_VERSION)) {
      await db.query(SCHEMA);
      await db.query(roomSQL(ROOM, SCHEMA_VERSION));
    }
    let row = (await db.query(`select token from live.rooms where id = '${ROOM}'`)).rows[0];
    if (!row) { await db.query(roomSQL(ROOM, SCHEMA_VERSION)); row = (await db.query(`select token from live.rooms where id = '${ROOM}'`)).rows[0]; }
    return row.token;
  });
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const role = roleOf(req);
  if (!role) return res.status(401).json({ ok: false });
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  // public keys only: the new publishable key and the older anon key, so either style keeps working
  const keys = [process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY].filter(Boolean);
  if (!url || !keys.length) return res.status(200).json({ ok: false, why: "not configured" });
  const out = { ok: true, url, key: keys[0], keys, room: ROOM, role };
  if (role === "instructor") {
    try { out.token = await instructorToken(); }
    catch (e) { out.ok = false; out.why = "database: " + String(e && e.message || e).slice(0, 200); }
  }
  return res.status(200).json(out);
}
