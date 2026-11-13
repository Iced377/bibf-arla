// Simulated students (22 by default, N=… to change): they join, wait for a started question, and answer once.
import fs from "node:fs";
import vm from "node:vm";
const BASE = process.env.BASE || "http://localhost:4183";
const N = +(process.env.N || 22);
const ROOM = "prompt";
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(new URL("../../site/data/course.js", import.meta.url), "utf8"), ctx);
const C = ctx.window.COURSE, BEATS = {};
C.sections.forEach((s) => s.beats.forEach((b) => { BEATS[b.id] = b; }));
const NAMES = ["Abdulaziz", "Reem", "Fahad", "Lama", "Omar", "Sara", "Khalid", "Haya", "Faisal", "Nouf", "Turki", "Rawan", "Majed", "Dana", "Yousef", "Shahad", "Nawaf", "Ghada", "Saud", "Joud", "Bandar", "Asma", "Ziyad", "Hessa", "Mishal", "Lulwa", "Rakan", "Maha", "Talal", "Aljohara"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let calls = 0, errors = 0, sent = 0, refused = 0;
async function rpc(fn, args) {
  calls++;
  const r = await fetch(BASE + "/rest/v1/rpc/" + fn, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(args) });
  if (!r.ok) { errors++; throw new Error(fn + " " + r.status); }
  return r.json();
}
function shuffledIdx(n, seed) {
  const hash = (str) => { let x = 2166136261; for (let i = 0; i < str.length; i++) { x ^= str.charCodeAt(i); x = Math.imul(x, 16777619); } return x >>> 0; };
  const a = []; for (let i = 0; i < n; i++) a.push({ i, k: hash(seed + ":" + i) });
  a.sort((p, q) => p.k - q.k);
  if (a.every((x, j) => x.i === j)) a.reverse();
  return a.map((x) => x.i);
}
const L = "ABCDEFGHIJ";
function correct(b, i) {
  if (b.type === "estimate") return String(b.answer);
  if (b.type === "quiz") return String(b.questions[i].answer);
  if (b.type === "higherlower") return b.pairs[i].b.value > b.pairs[i].a.value ? "higher" : "lower";
  if (b.type === "flags" || b.type === "scam") return b.items[i].verdict;
  const list = b.items || b.steps, order = shuffledIdx(list.length, b.id), letterOf = {};
  order.forEach((k, j) => { letterOf[k] = L[j]; });
  return list.map((x, k) => letterOf[k]).join(",");
}
function wrong(b, i) {
  const c = correct(b, i);
  if (b.type === "estimate") return String((b.answer + 1) % b.options.length);
  if (b.type === "quiz") return String((b.questions[i].answer + 1) % b.questions[i].options.length);
  if (b.type === "higherlower") return c === "higher" ? "lower" : "higher";
  if (b.type === "flags") return c === "red" ? "green" : "red";
  if (b.type === "scam") return c === "scam" ? "real" : "scam";
  return c.split(",").reverse().join(",");
}
class Player {
  constructor(name) { this.name = name; this.done = new Set(); this.S = { since: 0, sv: 0, mv: 0, ep: 0, state: {} }; this.offset = 0; }
  async join() { const r = await rpc("live_join", { p_room: ROOM, p_member: null, p_name: this.name, p_team: null }); this.id = r.id; this.team = r.team; }
  async tick() {
    const r = await rpc("live_poll", { p_room: ROOM, p_team: this.team, p_since: this.S.since, p_state_v: this.S.sv, p_members_v: this.S.mv, p_epoch: this.S.ep });
    if (!r) return;
    this.S.sv = r.sv; this.S.mv = r.mv; this.S.ep = r.ep; this.offset = r.now - Date.now();
    if (r.state) this.S.state = r.state;
    for (const it of r.items) if (it.r > this.S.since) this.S.since = it.r;
    const q = this.S.state.q; if (!q) return;
    const b = BEATS[q.b], key = q.b + ":" + q.i + ":" + (this.S.state.rn || 0);
    if (!b || this.done.has(key)) return;
    this.done.add(key);
    if (b.type === "assesscue") {
      await sleep(2000 + Math.random() * 8000);
      const answers = Object.fromEntries(C.assessment.questions.map((q) => [q.id, Math.floor(Math.random() * q.options.length)]));
      await rpc("live_check", { p_room: ROOM, p_member: this.id, p_name: this.name, p_which: b.which, p_answers: answers });
      return;
    }
    if (b.type === "leaderboard") return;
    const secsLeft = (q.ends - (Date.now() + this.offset)) / 1000;
    if (secsLeft <= 0) return;
    if (Math.random() < 0.1) return;                       // some people never answer
    await sleep(Math.min(secsLeft * 1000 * 0.9, 1000 + Math.random() * 12000));
    const c = Math.random() < 0.6 ? correct(b, q.i) : wrong(b, q.i);
    const res = await rpc("live_send", { p_room: ROOM, p_member: this.id, p_kind: "answer", p_beat: q.b, p_item: q.i, p_data: { c } });
    if (res && res.ok) sent++; else refused++;
  }
}
const players = NAMES.slice(0, N).map((n) => new Player(n));
for (const p of players) await p.join();
console.log("joined", players.length);
let stop = false;
setTimeout(() => { stop = true; }, +(process.env.SECS || 900) * 1000);
setInterval(() => console.log("calls", calls, "errors", errors, "answers sent", sent, "refused", refused), 30000);
await Promise.all(players.map(async (p) => { await sleep(Math.random() * 1200); while (!stop) { try { await p.tick(); } catch (e) { /* counted */ } await sleep(1200); } }));
console.log("done. calls", calls, "errors", errors, "answers sent", sent, "refused", refused);
process.exit(0);
