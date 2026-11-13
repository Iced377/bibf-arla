// Six simulated students for local tests (run server.mjs first). The course is solo: nobody picks a team, and the server
// seats each person in an empty slot of their own.
//   node sims.mjs join                     Omar, Reem, Fahad, Lama, Khalid and Noor join
//   node sims.mjs pre | post               each sends the pre- or post-course check (answers built from instructor/key.js)
//   node sims.mjs answer <beat> <item> c1 c2 c3 c4 c5 c6   each sends a choice for the live question ("-" = no answer)
import fs from "node:fs";
import vm from "node:vm";
const ROOM = "prompt";
const B = "http://localhost:4183/rest/v1/rpc/";
const p = (f, a) => fetch(B + f, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(a) }).then((r) => r.json());
const F = new URL("./sims.json", import.meta.url);
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(new URL("../../site/instructor/key.js", import.meta.url), "utf8"), ctx);
const KEY = Object.fromEntries(Object.entries(ctx.window.ASSESSMENT_KEY).map(([id, k]) => [id, k.answer]));
const PEOPLE = [["Omar", null], ["Reem", null], ["Fahad", null], ["Lama", null], ["Khalid", null], ["Noor", null]];
const [cmd, beat, item, ...rest] = process.argv.slice(2);
// the first `right` questions answered correctly, the rest wrong
const ans = (right) => Object.fromEntries(Object.entries(KEY).map(([k, v], i) => [k, i < right ? v : (v + 1) % 4]));
if (cmd === "join") {
  const out = {};
  for (const [n, t] of PEOPLE) { const r = await p("live_join", { p_room: ROOM, p_member: null, p_name: n, p_team: t }); out[n] = r.id; }
  fs.writeFileSync(F, JSON.stringify(out)); console.log(out);
} else {
  const ids = JSON.parse(fs.readFileSync(F, "utf8"));
  if (cmd === "pre" || cmd === "post") {
    const right = cmd === "pre" ? [4, 6, 3, 7, 5, 6] : [9, 11, 7, 12, 10, 10];   // out of 12
    for (const [k, [n]] of PEOPLE.entries()) console.log(n, JSON.stringify(await p("live_check", { p_room: ROOM, p_member: ids[n], p_name: n, p_which: cmd, p_answers: ans(right[k]) })));
  } else if (cmd === "answer") {
    // rest: one choice per person in PEOPLE order, "-" = no answer
    for (const [k, [n]] of PEOPLE.entries()) { const c = rest[k]; if (!c || c === "-") continue; console.log(n, JSON.stringify(await p("live_send", { p_room: ROOM, p_member: ids[n], p_kind: "answer", p_beat: beat, p_item: +item, p_data: { c } }))); }
  }
}
