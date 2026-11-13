// Local stand-in for production: serves the site, answers /api/live like the Vercel function,
// and answers /rest/v1/rpc/live_* like Supabase, using the real SQL on PGlite (Postgres in WebAssembly).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { fileURLToPath } from "node:url";
import { SCHEMA, SCHEMA_VERSION, roomSQL } from "../../site/api/_schema.js";

const SITE = fileURLToPath(new URL("../../site", import.meta.url));
const PORT = +(process.env.PORT || 4183);
const db = new PGlite();
await db.exec(SCHEMA);
const ROOM = "prompt";
await db.exec(roomSQL(ROOM, SCHEMA_VERSION));
const token = (await db.query("select token from live.rooms where id = $1", [ROOM])).rows[0].token;
let calls = 0, slow = 0;

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css", ".webp": "image/webp", ".png": "image/png", ".json": "application/json", ".svg": "image/svg+xml" };
const ARGS = {
  live_poll: ["p_room", "p_team", "p_since", "p_state_v", "p_members_v", "p_epoch"],
  live_join: ["p_room", "p_member", "p_name", "p_team"],
  live_send: ["p_room", "p_member", "p_kind", "p_beat", "p_item", "p_data"],
  live_check: ["p_room", "p_member", "p_name", "p_which", "p_answers"],
  live_admin: ["p_room", "p_token", "p_op", "p_args"],
};
let queue = Promise.resolve();
function rpc(fn, body) {
  const keys = ARGS[fn];
  const sql = `select public.${fn}(${keys.map((k, i) => `${k} => $${i + 1}`).join(", ")}) as r`;
  const vals = keys.map((k) => { const v = body[k]; return v !== null && typeof v === "object" ? JSON.stringify(v) : (v === undefined ? null : v); });
  // PGlite has one connection: run calls one after another, as a pooled database would queue them
  const run = queue.then(() => db.query(sql, vals)).then((r) => r.rows[0].r);
  queue = run.catch(() => {});
  return run;
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  try {
    if (url.pathname === "/api/live" || url.pathname === "/instructor/live") {
      const role = url.pathname.startsWith("/instructor") ? "instructor" : "participant";
      const out = { ok: true, url: "http://" + req.headers.host, key: "local-anon-key", room: ROOM, role };
      if (role === "instructor") out.token = token;
      res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
      return res.end(JSON.stringify(out));
    }
    const m = url.pathname.match(/^\/rest\/v1\/rpc\/(live_\w+)$/);
    if (m && req.method === "POST") {
      if (!ARGS[m[1]]) { res.writeHead(404); return res.end("{}"); }
      let raw = ""; for await (const c of req) raw += c;
      const t0 = Date.now();
      const r = await rpc(m[1], JSON.parse(raw || "{}"));
      calls++; if (Date.now() - t0 > 300) slow++;
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(r));
    }
    if (url.pathname === "/__stats") { res.writeHead(200); return res.end(JSON.stringify({ calls, slow })); }
    let p = path.join(SITE, decodeURIComponent(url.pathname));
    if (!p.startsWith(SITE)) { res.writeHead(403); return res.end(); }
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, "index.html");
    if (!fs.existsSync(p)) { res.writeHead(404); return res.end("not found"); }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(p)] || "application/octet-stream", "Cache-Control": "no-store" });
    fs.createReadStream(p).pipe(res);
  } catch (e) {
    console.error(e);
    res.writeHead(500, { "Content-Type": "application/json" }); res.end(JSON.stringify({ message: String(e.message || e) }));
  }
}).listen(PORT, () => console.log("harness on http://localhost:" + PORT));
