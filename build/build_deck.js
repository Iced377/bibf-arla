// Build the PowerPoint decks from the same content as the course site.
// Usage (from the project root):
//   NODE_PATH=build/node_modules APPLY_THEME_JS=<pptx skill>/scripts/apply_theme.js node build/build_deck.js
// Writes outputs/<fileTag>-Portal.pptx (for the faculty portal: no speaker notes, no answer keys)
// and outputs/<fileTag>-Facilitator.pptx (speaker notes and the assessment answer key). fileTag is set in course.js.
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const pptxgen = require("pptxgenjs");

const ROOT = path.join(__dirname, "..");
const SITE = path.join(ROOT, "site");
const OUT = path.join(ROOT, "outputs");
const ART = path.join(__dirname, "art-deck"); // made by build/build_art.py from the masters in art/

// ---------- load the site's data files ----------
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(SITE, "data", "course.js"), "utf8"), sandbox);
vm.runInContext(fs.readFileSync(path.join(SITE, "instructor", "notes.js"), "utf8"), sandbox);
const C0 = sandbox.window.COURSE;
const N = sandbox.window.NOTES;
const G = C0.glossary;
const A = C0.assessment;
// the check answer key lives in instructor/key.js so participants never load it
vm.runInContext(fs.readFileSync(path.join(SITE, "instructor", "key.js"), "utf8"), sandbox);
A.questions.forEach((q) => { const k = sandbox.window.ASSESSMENT_KEY[q.id]; q.answer = k.answer; q.why = k.why; });

const THEME = {
  name: C0.fileTag,
  headFontFace: "Arial",
  bodyFontFace: "Arial",
  colors: {
    dk1: "0E1430", lt1: "FFFFFF", dk2: "2A3354", lt2: "F4F6FB",
    accent1: "16306F", accent2: "223E99", accent3: "ACB5CC", accent4: "1D7A4E", accent5: "9A6A12", accent6: "6B7391",
    hlink: "223E99", folHlink: "16306F",
  },
};
const HEX = THEME.colors;
const GOOD_BG = "E7F4EC", BAD_BG = "FBEAE8", WARN_BG = "FBF3E2", BAD = "B3261E", TINT2 = "E9EDF7";
const W = 13.333, H = 7.5, MX = 0.6, CW = W - 2 * MX, TOP = 1.45, BOTTOM = 6.7;
const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];

// ---------- text helpers ----------
const plain = (s) => String(s == null ? "" : s).replace(/\[\[([a-z0-9]+)(?:\|([^\]]+))?\]\]/g, (m, k, shown) => shown || (G[k] ? G[k].term : k));
function estH(text, w, pt, lh = 1.25) {
  const cpl = Math.max(8, (w * 72) / (pt * 0.5));
  const lines = String(text).split("\n").reduce((n, para) => n + Math.max(1, Math.ceil(plain(para).length / cpl)), 0);
  return (lines * pt * lh) / 72 + 0.1;
}
const artPath = (name) => { const p = path.join(ART, name + ".jpg"); return name && fs.existsSync(p) ? p : null; };
function hash(str) { let x = 2166136261; for (let i = 0; i < str.length; i++) { x ^= str.charCodeAt(i); x = Math.imul(x, 16777619); } return x >>> 0; }
// Same mixed order as the site, so letters on a slide match the screen.
function shuffledIdx(n, seed) {
  const a = []; for (let i = 0; i < n; i++) a.push({ i, k: hash(seed + ":" + i) });
  a.sort((p, q) => p.k - q.k);
  if (a.every((x, j) => x.i === j)) a.reverse();
  return a.map((x) => x.i);
}

function build(edition) {
  const FAC = edition === "facilitator";
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  const courseName = C0.title + " " + C0.titleAccent;
  pres.title = courseName + " · " + C0.qa.programme + (FAC ? " · Facilitator" : "");
  pres.author = C0.instructor;
  pres.company = C0.qa.programme;
  pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
  const C = pres.SchemeColor;
  const footer = courseName + " · " + C0.qa.programme;

  pres.defineSlideMaster({
    title: "Title",
    background: { color: HEX.accent1 },
    objects: [
      { placeholder: { options: { name: "title", type: "title", x: MX, y: 1.5, w: 6.3, h: 2.6, fontSize: 40, bold: true, color: C.background1, valign: "bottom", align: "left", margin: 0 }, text: "" } },
      { placeholder: { options: { name: "body", type: "body", x: MX, y: 4.35, w: 6.2, h: 1.3, fontSize: 18, color: C.background1, valign: "top", align: "left", margin: 0 }, text: "" } },
      { placeholder: { options: { name: "credit", type: "body", x: MX, y: 5.9, w: 6.2, h: 0.9, fontSize: 13, color: C.accent3, valign: "bottom", align: "left", margin: 0 }, text: "" } },
    ],
  });
  pres.defineSlideMaster({
    title: "Section",
    background: { color: HEX.accent1 },
    objects: [
      { rect: { x: MX, y: 1.3, w: 1.0, h: 1.0, fill: { color: HEX.accent2 } } },
      { placeholder: { options: { name: "num", type: "body", x: MX, y: 1.3, w: 1.0, h: 1.0, fontSize: 32, bold: true, color: C.background1, align: "center", valign: "middle", margin: 0 }, text: "" } },
      { placeholder: { options: { name: "title", type: "title", x: MX, y: 2.6, w: 6.2, h: 1.9, fontSize: 34, bold: true, color: C.background1, align: "left", valign: "top", margin: 0 }, text: "" } },
      { placeholder: { options: { name: "body", type: "body", x: MX, y: 4.6, w: 6.2, h: 2.0, fontSize: 16, color: C.background1, align: "left", valign: "top", margin: 0 }, text: "" } },
    ],
    slideNumber: { x: 12.2, y: 6.95, w: 0.6, h: 0.3, fontSize: 10, color: C.accent3, align: "right" },
  });
  pres.defineSlideMaster({
    title: "Content",
    background: { color: HEX.lt1 },
    objects: [
      { text: { text: footer, options: { x: MX, y: 6.98, w: 9, h: 0.3, fontSize: 10, color: C.accent6, margin: 0 } } },
      { placeholder: { options: { name: "title", type: "title", x: MX, y: 0.42, w: CW, h: 0.9, fontSize: 30, bold: true, color: C.text2, margin: 0, align: "left", valign: "middle" }, text: "" } },
    ],
    slideNumber: { x: 12.3, y: 6.98, w: 0.45, h: 0.3, fontSize: 10, color: C.accent6, align: "right" },
  });
  pres.defineSlideMaster({
    title: "Statement",
    background: { color: HEX.dk1 },
    objects: [
      { text: { text: footer, options: { x: MX, y: 6.98, w: 9, h: 0.3, fontSize: 10, color: C.accent6, margin: 0 } } },
      { placeholder: { options: { name: "label", type: "body", x: MX, y: 0.55, w: CW, h: 0.5, fontSize: 16, bold: true, color: C.accent3, margin: 0, align: "left", valign: "middle" }, text: "" } },
    ],
    slideNumber: { x: 12.3, y: 6.98, w: 0.45, h: 0.3, fontSize: 10, color: C.accent6, align: "right" },
  });
  pres.defineSlideMaster({
    title: "Break",
    background: { color: HEX.lt2 },
    objects: [
      { placeholder: { options: { name: "title", type: "title", x: MX, y: 2.3, w: CW, h: 1.3, fontSize: 40, bold: true, color: C.accent1, margin: 0, align: "left", valign: "bottom" }, text: "" } },
      { placeholder: { options: { name: "body", type: "body", x: MX, y: 3.8, w: 10, h: 1.6, fontSize: 20, color: C.text2, margin: 0, align: "left", valign: "top" }, text: "" } },
    ],
    slideNumber: { x: 12.3, y: 6.98, w: 0.45, h: 0.3, fontSize: 10, color: C.accent6, align: "right" },
  });

  let sec = "Welcome";
  const notesOn = (s, text) => { if (FAC && text) s.addNotes(plain(text)); };
  const twoTone = (a, b) => [{ text: a + (b ? " " : ""), options: { color: C.text2 } }].concat(b ? [{ text: b, options: { color: C.accent1 } }] : []);
  function content(title, notes) {
    const s = pres.addSlide({ masterName: "Content", sectionTitle: sec });
    s.addText(Array.isArray(title) ? title : twoTone(title), { placeholder: "title" });
    notesOn(s, notes);
    return s;
  }
  function statement(label, notes) {
    const s = pres.addSlide({ masterName: "Statement", sectionTitle: sec });
    s.addText(label, { placeholder: "label" });
    notesOn(s, notes);
    return s;
  }
  function artFrame(s, name, x, y, w, h, fallbackText) {
    const p = artPath(name);
    if (p) { s.addImage({ path: p, x, y, w, h, sizing: { type: "cover", w, h }, altText: "" }); return; }
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: C.accent2 }, line: { color: C.accent2 }, rectRadius: 0.12 });
    if (fallbackText) s.addText(fallbackText, { x, y, w, h, fontSize: 140, bold: true, color: C.accent3, align: "center", valign: "middle", margin: 0, isTextBox: true, transparency: 40 });
  }
  function textBox(s, runs, x, y, w, h, extra = {}) {
    s.addText(runs, Object.assign({ x, y, w, h, margin: 0, valign: "top", isTextBox: true, fontFace: "Arial" }, extra));
  }
  function para(s, text, y, size = 18, color, w = CW, x = MX) {
    const hh = estH(text, w, size);
    textBox(s, plain(text), x, y, w, hh, { fontSize: size, color: color || C.text2 });
    return hh;
  }
  function card(s, x, y, w, h, title, body, opts = {}) {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: opts.fill || C.background2 }, line: { color: opts.line || opts.fill || C.background2, width: 1 }, rectRadius: 0.08 });
    const runs = [];
    if (opts.kicker) runs.push({ text: opts.kicker, options: { fontSize: 12, bold: true, color: opts.kickerColor || C.accent6, breakLine: true, paraSpaceAfter: 4 } });
    if (title) runs.push({ text: plain(title), options: { fontSize: opts.tSize || 17, bold: true, color: opts.tColor || C.accent1, breakLine: !!body, paraSpaceAfter: 6 } });
    if (body) runs.push({ text: plain(body), options: { fontSize: opts.bSize || 14, color: opts.bColor || C.text2 } });
    textBox(s, runs, x + 0.2, y + 0.16, w - 0.4, h - 0.3);
  }
  // A grid of cards, all rows on one slide; returns the height used.
  function gridH(items, cols, tSize = 17, bSize = 14) {
    const gap = 0.25, cw = (CW - gap * (cols - 1)) / cols;
    let tot = 0;
    for (let r = 0; r < Math.ceil(items.length / cols); r++) {
      let mh = 0;
      for (let c = 0; c < cols; c++) {
        const it = items[r * cols + c]; if (!it) continue;
        mh = Math.max(mh, (it.kicker ? 0.3 : 0) + (it.title ? estH(it.title, cw - 0.4, tSize) : 0) + (it.text ? estH(it.text, cw - 0.4, bSize) : 0) + 0.35);
      }
      tot += mh + gap;
    }
    return tot - gap;
  }
  function grid(s, items, y, cols, opts = {}) {
    const gap = 0.25, cw = (CW - gap * (cols - 1)) / cols, tSize = opts.tSize || 17, bSize = opts.bSize || 14;
    let yy = y;
    for (let r = 0; r < Math.ceil(items.length / cols); r++) {
      const row = items.slice(r * cols, r * cols + cols);
      const mh = Math.max(...row.map((it) => (it.kicker ? 0.3 : 0) + (it.title ? estH(it.title, cw - 0.4, tSize) : 0) + (it.text ? estH(it.text, cw - 0.4, bSize) : 0) + 0.35), opts.minH || 0);
      row.forEach((it, c) => card(s, MX + c * (cw + gap), yy, cw, mh, it.title, it.text, Object.assign({ tSize, bSize, kicker: it.kicker }, opts, it.opts || {})));
      yy += mh + gap;
    }
    return yy - gap - y;
  }
  // Split a grid across slides when it does not fit.
  function gridSlides(title, items, cols, introText, opts = {}, notes) {
    let i = 0, first = true;
    while (i < items.length) {
      const s = content(first ? title : (Array.isArray(title) ? title.concat([{ text: " (continued)", options: { color: C.accent6 } }]) : title + " (continued)"), first ? notes : null);
      let y = TOP;
      if (first && introText) y += para(s, introText, y, 17) + 0.2;
      let take = items.length - i;
      while (take > cols && y + gridH(items.slice(i, i + take), cols, opts.tSize, opts.bSize) > BOTTOM) take -= cols;
      grid(s, items.slice(i, i + take), y, cols, opts);
      i += take; first = false;
    }
  }
  function optionsGrid(s, opts, y, answer, size = 20) {
    const gap = 0.25, cw = (CW - gap) / 2;
    const hh = Math.max(...opts.map((o) => estH(o, cw - 1.1, size))) + 0.35;
    opts.forEach((o, i) => {
      const x = MX + (i % 2) * (cw + gap), yy = y + Math.floor(i / 2) * (hh + gap);
      const right = answer === i, dim = answer != null && !right;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: yy, w: cw, h: hh, fill: { color: right ? GOOD_BG : "FFFFFF" }, line: { color: right ? "BFE0CC" : HEX.accent3, width: 1 }, rectRadius: 0.1 });
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + 0.2, y: yy + (hh - 0.5) / 2, w: 0.5, h: 0.5, fill: { color: right ? HEX.accent4 : TINT2 }, line: { color: right ? HEX.accent4 : TINT2 }, rectRadius: 0.08 });
      textBox(s, LETTERS[i], x + 0.2, yy + (hh - 0.5) / 2, 0.5, 0.5, { fontSize: 16, bold: true, color: right ? C.background1 : C.accent1, align: "center", valign: "middle" });
      textBox(s, plain(o), x + 0.9, yy, cw - 1.1, hh, { fontSize: size, color: dim ? C.accent6 : C.text2, valign: "middle" });
    });
    return 2 * hh + gap;
  }
  function calloutBox(s, title, text, y, tone, size = 17, fixedH) {
    const fill = tone === "warn" ? WARN_BG : tone === "good" ? GOOD_BG : tone === "bad" ? BAD_BG : HEX.lt2;
    const lead = tone === "warn" ? HEX.accent5 : tone === "good" ? HEX.accent4 : tone === "bad" ? BAD : HEX.accent1;
    const hh = fixedH || estH((title ? title + ". " : "") + text, CW - 0.7, size) + 0.35;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: MX, y, w: CW, h: hh, fill: { color: fill }, line: { color: fill }, rectRadius: 0.08 });
    textBox(s, (title ? [{ text: plain(title) + ". ", options: { bold: true, color: lead } }] : []).concat([{ text: plain(text), options: { color: C.text2 } }]), MX + 0.35, y + 0.17, CW - 0.7, hh - 0.3, { fontSize: size, valign: "middle" });
    return hh;
  }
  function bigQuestion(s, text, y = 1.35, size = 30, w = CW) {
    const hh = estH(text, w, size, 1.2);
    textBox(s, plain(text), MX, y, w, hh, { fontSize: size, bold: true, color: C.background1 });
    return hh;
  }
  function chip(s, text, x, y, opts = {}) {
    const w = opts.w || Math.max(1.2, 0.16 + plain(text).length * 0.105);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h: 0.42, fill: { color: opts.fill || TINT2 }, line: { color: opts.fill || TINT2 }, rectRadius: 0.2 });
    textBox(s, plain(text), x, y, w, 0.42, { fontSize: opts.size || 13, bold: true, color: opts.color || C.accent1, align: "center", valign: "middle" });
    return w;
  }
  // ---------- charts: native PowerPoint charts, scatter plots drawn as shapes ----------
  const PAL = ["16306F", "4C6BC0", "8FA3D9", "6B7391", "C9A227", "1D7A4E"];
  function niceTicks(lo, hi, count) {
    if (hi === lo) hi = lo + 1;
    const raw = (hi - lo) / count, mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((v) => v >= raw);
    const out = []; for (let v = Math.floor(lo / step) * step; v <= Math.ceil(hi / step) * step + step / 2; v += step) out.push(Math.round(v * 1e6) / 1e6);
    return out;
  }
  const fmtN = (v) => Number(v).toLocaleString("en-US", { maximumFractionDigits: Math.abs(v) < 10 && v % 1 ? 1 : 0 });
  function drawChart(s, c, x, y, w, h) {
    if (c.title) textBox(s, c.title, x, y, w, 0.35, { fontSize: 12, bold: true, color: C.text2 });
    const cy = y + (c.title ? 0.4 : 0), ch = h - (c.title ? 0.4 : 0);
    if (c.type === "scatter") return scatterShapes(s, c, x, cy, w, ch);
    const multi = c.series.length > 1;
    const data = c.series.map((se) => ({ name: se.name || "Value", labels: c.labels, values: se.values }));
    const base = { x, y: cy, w, h: ch, chartColors: c.type === "pie" ? PAL : multi ? PAL : ["16306F"], showLegend: multi || c.type === "pie", legendPos: c.type === "pie" ? "r" : "t", legendFontSize: 10,
      catAxisLabelFontSize: 10, valAxisLabelFontSize: 10, catAxisLabelColor: "2A3354", valAxisLabelColor: "6B7391", valGridLine: { color: "DFE4EF", size: 0.5 }, dataLabelFontSize: 9 };
    const top = c.yMax != null ? c.yMax : Math.max(...c.series.map((se) => Math.max(...se.values)));
    base.valAxisLabelFormatCode = top >= 100 ? "#,##0" : "0.0";
    if (c.yMin != null) base.valAxisMinVal = c.yMin;
    if (c.yMax != null) base.valAxisMaxVal = c.yMax;
    if (c.type === "pie") { s.addChart(pres.charts.PIE, data, Object.assign(base, { showPercent: c.values !== false, showValue: false, dataLabelColor: "FFFFFF" })); return; }
    if (c.type === "line") { s.addChart(pres.charts.LINE, data, Object.assign(base, { lineSize: 2, lineDataSymbol: "circle", lineDataSymbolSize: 5 })); return; }
    const few = c.labels.length * c.series.length <= 16 && c.values !== false;
    s.addChart(pres.charts.BAR, data, Object.assign(base, { barDir: c.type === "bar" ? "bar" : "col", barGapWidthPct: 60, showValue: few, dataLabelColor: "2A3354", dataLabelFormatCode: "#,##0" + (c.decimals ? ".0" : ""), catAxisOrientation: c.type === "bar" ? "maxMin" : "minMax" }));
  }
  function scatterShapes(s, c, x, y, w, h) {
    const pts = c.points, xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
    const xt = niceTicks(c.xMin != null ? c.xMin : Math.min(...xs), c.xMax != null ? c.xMax : Math.max(...xs), 5);
    const yt = niceTicks(c.yMin != null ? c.yMin : Math.min(...ys), c.yMax != null ? c.yMax : Math.max(...ys), 5);
    const L = x + 0.75, B = y + h - 0.45, pw = w - 0.95, ph = h - 0.6, x0 = xt[0], x1 = xt[xt.length - 1], y0 = yt[0], y1 = yt[yt.length - 1];
    const X = (v) => L + (v - x0) / (x1 - x0) * pw, Y = (v) => B - (v - y0) / (y1 - y0) * ph;
    const q = c.quad;
    if (q) {
      s.addShape(pres.shapes.LINE, { x: X(q.x), y: B - ph, w: 0, h: ph, line: { color: HEX.accent6, width: 1 } });
      s.addShape(pres.shapes.LINE, { x: L, y: Y(q.y), w: pw, h: 0, line: { color: HEX.accent6, width: 1 } });
      textBox(s, q.xLow, L, Y(q.y) - 0.3, 2, 0.28, { fontSize: 10, color: C.accent6 });
      textBox(s, q.xHigh, L + pw - 2, Y(q.y) - 0.3, 2, 0.28, { fontSize: 10, color: C.accent6, align: "right" });
      textBox(s, q.yHigh, X(q.x) + 0.08, B - ph, 2, 0.28, { fontSize: 10, color: C.accent6 });
      textBox(s, q.yLow, X(q.x) + 0.08, B - 0.28, 2, 0.28, { fontSize: 10, color: C.accent6 });
    } else {
      s.addShape(pres.shapes.LINE, { x: L, y: B, w: pw, h: 0, line: { color: HEX.accent6, width: 1 } });
      s.addShape(pres.shapes.LINE, { x: L, y: B - ph, w: 0, h: ph, line: { color: HEX.accent6, width: 1 } });
      yt.forEach((t) => textBox(s, fmtN(t), x, Y(t) - 0.1, 0.68, 0.2, { fontSize: 9, color: C.accent6, align: "right" }));
      xt.forEach((t) => textBox(s, fmtN(t), X(t) - 0.4, B + 0.04, 0.8, 0.2, { fontSize: 9, color: C.accent6, align: "center" }));
      if (c.xLabel) textBox(s, c.xLabel, L + pw - 3, B + 0.22, 3, 0.22, { fontSize: 9, color: C.accent6, align: "right" });
      if (c.yLabel) textBox(s, c.yLabel, x, B - ph - 0.28, 3, 0.22, { fontSize: 9, color: C.accent6 });
    }
    if (c.trend) {
      const mx = xs.reduce((a, b) => a + b, 0) / xs.length, my = ys.reduce((a, b) => a + b, 0) / ys.length;
      let sxy = 0, sxx = 0; pts.forEach((p) => { sxy += (p.x - mx) * (p.y - my); sxx += (p.x - mx) ** 2; });
      const sl = sxy / sxx, ic = my - sl * mx, lx = Math.min(...xs), hx = Math.max(...xs);
      const ya = Y(ic + sl * lx), yb = Y(ic + sl * hx);
      s.addShape(pres.shapes.LINE, { x: X(lx), y: Math.min(ya, yb), w: X(hx) - X(lx), h: Math.abs(yb - ya), flipV: yb < ya, line: { color: HEX.accent2, width: 1.5, dashType: "dash" } });
    }
    pts.forEach((p) => {
      const r = p.label ? 0.07 : 0.05;
      s.addShape(pres.shapes.OVAL, { x: X(p.x) - r, y: Y(p.y) - r, w: 2 * r, h: 2 * r, fill: { color: HEX.accent1, transparency: p.label ? 0 : 25 }, line: { color: HEX.accent1 } });
      if (p.label) textBox(s, p.label, X(p.x) + 0.1, Y(p.y) - 0.12, 1.6, 0.24, { fontSize: 10, color: C.text2 });
    });
  }
  // one column of options beside a chart
  function optionsCol(s, opts, x, y, w, answer, size = 14) {
    const gap = 0.14, hh = Math.max(...opts.map((o) => estH(o, w - 0.8, size))) + 0.22;
    opts.forEach((o, i) => {
      const yy = y + i * (hh + gap), right = answer === i, dim = answer != null && !right;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: yy, w, h: hh, fill: { color: right ? GOOD_BG : "FFFFFF" }, line: { color: right ? "BFE0CC" : HEX.accent3, width: 1 }, rectRadius: 0.08 });
      textBox(s, LETTERS[i], x + 0.12, yy, 0.35, hh, { fontSize: 13, bold: true, color: right ? HEX.accent4 : C.accent1, valign: "middle" });
      textBox(s, plain(o), x + 0.5, yy, w - 0.6, hh, { fontSize: size, color: dim ? C.accent6 : C.text2, valign: "middle" });
    });
    return opts.length * (hh + gap) - gap;
  }
  // a question with a chart: question on top, chart on the left, options on the right
  function chartQuestion(s, text, chart, opts, answer, why, intro) {
    let y = TOP;
    if (intro) y += para(s, intro, y, 14, C.accent6) + 0.1;
    y += para(s, text, y, answer == null ? 20 : 16, answer == null ? C.text2 : C.accent6) + 0.15;
    const cw = 7.1, ow = CW - cw - 0.3, size = Math.max(...opts.map((o) => plain(o).length)) > 45 ? 12 : 14;
    drawChart(s, chart, MX, y, cw, Math.min(4.6, BOTTOM - y));
    const oh = optionsCol(s, opts, MX + cw + 0.3, y + 0.35, ow, answer, size);
    if (answer != null && why) {
      const wy = y + 0.35 + oh + 0.2, wh = Math.min(BOTTOM - wy, estH(why, ow - 0.4, 12) + 0.3);
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: MX + cw + 0.3, y: wy, w: ow, h: wh, fill: { color: GOOD_BG }, line: { color: GOOD_BG }, rectRadius: 0.08 });
      textBox(s, plain(why), MX + cw + 0.5, wy + 0.12, ow - 0.4, wh - 0.2, { fontSize: 12, color: C.text2 });
    }
  }

  // the block's intro line under the title (the bridge from the block before); returns where the content starts
  const introAt = (s, b) => (b.intro ? TOP + para(s, b.intro, TOP, 15, C.accent6) + 0.15 : TOP);
  const beatNote = (b) => (N.sections[b.section] && N.sections[b.section].beats ? N.sections[b.section].beats[b.id] : "");

  // ---------- opening ----------
  pres.addSection({ title: sec });
  {
    const s = pres.addSlide({ masterName: "Title", sectionTitle: sec });
    s.addText(courseName, { placeholder: "title" });
    s.addText(C0.program + "\n" + C0.qa.dates, { placeholder: "body" });
    s.addText(C0.instructor, { placeholder: "credit" });
    artFrame(s, C0.art, 7.25, 1.55, 5.48, 3.65, "AI");
    notesOn(s, "Facilitator deck. The live session runs on the course site: the presentation tab on the projector, the notes tab and the Dashboard on your laptop screen. Use this deck as a backup or for the portal.");
  }
  {
    // one timetable slide per day: rows with "day" start a new day; rows marked offDeck stay on the site only
    const days = [];
    N.schedule.forEach((r) => {
      if (r.day) days.push({ day: r.day, rows: [] });
      else if (!r.offDeck) { if (!days.length) days.push({ day: "", rows: [] }); days[days.length - 1].rows.push(r); }
    });
    const head = (x) => ({ text: x, options: { bold: true, color: C.accent1, fill: { color: C.background2 } } });
    days.forEach((d) => {
      const s = content(twoTone(d.day || "The course,", d.day ? "" : "round by round"), FAC ? "Timetable with breaks and prayer times." : null);
      const tbl = [[head("Time"), head("Min"), head("What happens")]]
        .concat(d.rows.map((r) => [r.time, String(r.mins), plain(r.item)].map((x, j) => ({ text: x, options: { color: r.brk ? C.accent6 : C.text2, bold: j === 0, italic: !!r.brk } }))));
      s.addTable(tbl, { x: MX, y: TOP, w: CW, colW: [1.2, 0.8, CW - 2.0], fontSize: 14, border: { type: "solid", pt: 0.75, color: HEX.accent3 }, margin: 0.06, valign: "middle", rowH: 0.42 });
    });
  }
  {
    const s = content(twoTone("Three things you", "leave with"));
    const gap = 0.3, cw = (CW - 2 * gap) / 3;
    C0.takeaways.forEach((t, i) => {
      const x = MX + i * (cw + gap);
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: TOP + 0.2, w: cw, h: 3.6, fill: { color: C.background2 }, line: { color: C.background2 }, rectRadius: 0.1 });
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + 0.3, y: TOP + 0.5, w: 0.7, h: 0.7, fill: { color: C.accent1 }, line: { color: C.accent1 }, rectRadius: 0.12 });
      textBox(s, String(i + 1), x + 0.3, TOP + 0.5, 0.7, 0.7, { fontSize: 24, bold: true, color: C.background1, align: "center", valign: "middle" });
      textBox(s, [{ text: t.title, options: { fontSize: 20, bold: true, color: C.accent1, breakLine: true, paraSpaceAfter: 8 } }, { text: plain(t.text), options: { fontSize: 16, color: C.text2 } }], x + 0.3, TOP + 1.45, cw - 0.6, 2.2);
    });
  }

  // The decks are offline material: activity intros lose the live-play instructions (phones, Send, points).
  const LIVE_RX = /\b(phone|phones|press Send|Clear starts again|fastest right answer|points? for your team)\b/i;
  const offline = (t, fallback) => String(t || "").split(/(?<=[.!?])\s+/).filter((x) => !LIVE_RX.test(x)).join(" ").trim() || fallback || "";

  // ---------- block builders ----------
  var BLOCK = {
    estimate(b) {
      const s = statement(b.title, beatNote(b));
      const qh = bigQuestion(s, b.question);
      const y = 1.35 + qh + 0.35, gap = 0.25, cw = (CW - gap) / 2;
      b.options.forEach((o, i) => {
        const x = MX + (i % 2) * (cw + gap), yy = y + Math.floor(i / 2) * 0.95;
        s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: yy, w: cw, h: 0.75, fill: { color: C.accent1 }, line: { color: C.accent2 }, rectRadius: 0.1 });
        textBox(s, [{ text: LETTERS[i] + "   ", options: { bold: true, color: C.accent3 } }, { text: plain(o), options: { color: C.background1 } }], x + 0.3, yy, cw - 0.5, 0.75, { fontSize: 20, valign: "middle" });
      });
      const a = content(twoTone(b.title, "· the answer"));
      const oh = optionsGrid(a, b.options, TOP, b.answer, 18);
      const ch = calloutBox(a, null, b.reveal, TOP + oh + 0.3, "good", 18);
      if (b.source) para(a, b.source, TOP + oh + 0.3 + ch + 0.15, 12, C.accent6);
    },
    // every question: one slide with the question, then one slide with the answer and why
    quiz(b) {
      b.questions.forEach((q, k) => {
        const head = "· " + (k + 1) + " of " + b.questions.length;
        const longest = Math.max(...q.options.map((o) => plain(o).length));
        const size = longest > 100 ? 12 : longest > 60 ? 14 : 18;
        const s = content(twoTone(b.title, head), k === 0 ? beatNote(b) : "");
        if (q.chart) {
          chartQuestion(s, q.q, q.chart, q.options, null, null, k === 0 ? offline(b.intro) : "");
          chartQuestion(content(twoTone(b.title, head + " · answer")), q.q, q.chart, q.options, q.answer, q.why, "");
          return;
        }
        let y = TOP;
        const intro = k === 0 ? offline(b.intro) : "";
        if (intro) y += para(s, intro, y, 15, C.accent6) + 0.15;
        y += para(s, q.q, y, 22) + 0.3;
        optionsGrid(s, q.options, y, null, size);
        const a = content(twoTone(b.title, head + " · answer"));
        const ya = TOP + para(a, q.q, TOP, 17, C.accent6) + 0.25;
        const oh = optionsGrid(a, q.options, ya, q.answer, size);
        calloutBox(a, null, q.why, ya + oh + 0.25, "good", 15);
      });
    },
    // stations (Job 6): each station's questions, drawn as a quiz titled with the station
    stations(b) {
      b.stations.forEach((st, k) => {
        BLOCK.quiz(Object.assign({}, b, { title: b.title + " · " + st.title, questions: st.questions, intro: k === 0 ? b.intro : "" }));
      });
    },
    chart(b) {
      const s = content(twoTone(b.title), beatNote(b)), y0 = introAt(s, b);
      if (b.charts) {
        // two charts side by side, or four in two rows; the note goes underneath
        const nh = b.note ? estH(b.note, CW - 0.7, 14) + 0.45 : 0, rows = b.charts.length > 2 ? 2 : 1, gap = 0.3;
        const cw = (CW - gap) / 2, ch = (BOTTOM - y0 - nh - (rows - 1) * 0.2) / rows;
        b.charts.forEach((c, i) => drawChart(s, c, MX + (i % 2) * (cw + gap), y0 + Math.floor(i / 2) * (ch + 0.2), cw, ch));
        if (b.note) calloutBox(s, null, b.note, BOTTOM - nh + 0.1, null, 14);
        return;
      }
      drawChart(s, b.chart, MX, y0, CW * 0.62, BOTTOM - y0);
      if (b.note) {
        const x = MX + CW * 0.62 + 0.3, w = CW - CW * 0.62 - 0.3, hh = estH(b.note, w - 0.4, 15) + 0.4;
        s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: y0 + 0.4, w, h: hh, fill: { color: HEX.lt2 }, line: { color: HEX.lt2 }, rectRadius: 0.08 });
        textBox(s, plain(b.note), x + 0.2, y0 + 0.55, w - 0.4, hh - 0.3, { fontSize: 15, color: C.text2 });
      }
    },
    task(b) {
      const help = (N.help && N.help[b.id]) || [];
      const s = content(twoTone(b.title), beatNote(b) + (help.length ? "\nIf someone is stuck: " + help.map((x) => x[0] + ": " + x[1]).join(" ") : ""));
      // files on one line (the first three and a count when there are many), the prompts to copy on the next
      const fl = (b.files || (b.file ? [{ name: b.file }] : [])).map((f) => f.name);
      const fileText = fl.length > 4 ? fl.slice(0, 3).join(" · ") + " and " + (fl.length - 3) + " more" : fl.join(" · ");
      const where = FAC ? " (on the course site's files page)" : " (in the course files)";
      const lines = [];
      if (fl.length) lines.push({ text: "Files: ", options: { bold: true, color: C.accent1 } }, { text: fileText + where, options: { color: C.text2, breakLine: !!(b.prompts || []).length } });
      // many short prompts (the quick win: one per role) go in a table further on, so the line only counts them
      const many = (b.prompts || []).length > 4 && b.prompts.every((p) => p.text.length < 400);
      if ((b.prompts || []).length) lines.push({ text: "Prompts to copy: ", options: { bold: true, color: C.accent1 } }, { text: (many ? "one for each role, " + b.prompts.length + " in all" : b.prompts.map((p) => p.title).join("; ")) + (fl.length ? "" : where), options: { color: C.text2 } });
      const nl = (fl.length ? 1 : 0) + ((b.prompts || []).length ? 1 : 0);
      textBox(s, lines, MX, TOP, CW, 0.32 * nl + 0.1, { fontSize: 13, paraSpaceAfter: 2 });
      const top = TOP + 0.32 * nl + 0.3;
      textBox(s, b.steps.map((t, i) => ({ text: (i + 1) + ".  " + plain(t), options: { breakLine: i < b.steps.length - 1, paraSpaceAfter: 8 } })), MX, top, CW, BOTTOM - top - 0.85, { fontSize: b.steps.length > 5 ? 15 : 17, color: C.text2 });
      if (b.note) calloutBox(s, null, b.note, BOTTOM - 0.7, null, 14);
      // the full guide, ten steps a slide: what to do and the keyboard shortcut
      const g = b.guide || [], per = 10;
      for (let i = 0; i < g.length; i += per) {
        const gs = content(twoTone(b.title.split(" · ")[0], "· step by step" + (g.length > per ? " (" + (i / per + 1) + " of " + Math.ceil(g.length / per) + ")" : "")));
        const head = (v) => ({ text: v, options: { bold: true, color: "FFFFFF", fill: { color: HEX.accent1 } } });
        const rows = [[head("#"), head("What to do"), head("Keys")]].concat(g.slice(i, i + per).map((st, j) => [
          { text: String(i + j + 1), options: { bold: true, color: C.accent1, align: "center" } },
          { text: plain(st[0]), options: { color: C.text2 } },
          { text: st[1] || "", options: { bold: true, color: HEX.dk1 } }]));
        gs.addTable(rows, { x: MX, y: TOP, w: CW, colW: [0.5, CW - 3.3, 2.8], fontSize: 12, border: { type: "solid", pt: 0.75, color: HEX.accent3 }, margin: 0.06, valign: "middle" });
      }
      // each prompt participants copy, one slide each, so the decks hold the exact text
      if (many) {
        const per2 = 5;
        for (let i = 0; i < b.prompts.length; i += per2) {
          const ts = content(twoTone(b.title.split(" · ")[0], "· the prompts" + (b.prompts.length > per2 ? " (" + (i / per2 + 1) + " of " + Math.ceil(b.prompts.length / per2) + ")" : "")));
          const head = (v) => ({ text: v, options: { bold: true, color: "FFFFFF", fill: { color: HEX.accent1 } } });
          const rows = [[head("For"), head("The prompt")]].concat(b.prompts.slice(i, i + per2).map((p) => [
            { text: plain(p.title), options: { bold: true, color: C.accent1 } }, { text: plain(p.text), options: { color: C.text2 } }]));
          ts.addTable(rows, { x: MX, y: TOP, w: CW, colW: [3.2, CW - 3.2], fontSize: 11, border: { type: "solid", pt: 0.75, color: HEX.accent3 }, margin: 0.06, valign: "top" });
        }
      }
      const ps = (many ? [] : b.prompts || []).concat((b.takeHome && b.takeHome.prompts) || []);
      ps.forEach((p) => {
        const sl = content(twoTone(b.title.split(" · ")[0], "· " + p.title));
        const fs = p.text.length > 1100 ? 11 : p.text.length > 700 ? 12.5 : 14;
        sl.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: MX, y: TOP, w: CW, h: BOTTOM - TOP, fill: { color: HEX.lt2 }, line: { color: HEX.lt2 }, rectRadius: 0.06 });
        textBox(sl, p.text, MX + 0.2, TOP + 0.15, CW - 0.4, BOTTOM - TOP - 0.3, { fontSize: fs, color: C.text2, valign: "top" });
      });
    },
    rules(b) { gridSlides(b.title, b.items.map((i) => ({ title: i.title, text: i.text })), 4, null, { minH: 2.4, bSize: 16, tSize: 19 }, beatNote(b)); },
    takeaways(b) {
      if (b.section !== C0.sections.filter((x) => x.beats.some((y) => y.type === "takeaways")).pop().id) return; // the opening takeaways slide already covers the earlier ones
      const s = content(twoTone(b.title), beatNote(b));
      const gap = 0.3, cw = (CW - 2 * gap) / 3;
      C0.takeaways.forEach((t, i) => card(s, MX + i * (cw + gap), TOP + 0.2, cw, 3.2, (i + 1) + ". " + t.title, t.text, { tSize: 20, bSize: 16 }));
    },
    assesscue(b) {
      const meta = A[b.which];
      const s = content(twoTone(meta.title.split(" ")[0], meta.title.split(" ").slice(1).join(" ")), beatNote(b) + (FAC ? " Participant link: the site address followed by #/" + b.which + "." : ""));
      let y = TOP + 0.1;
      y += para(s, offline(b.intro), y, 20) + 0.3;
      const per = Math.round(A.questions.length / A.topics.length);
      const facts = [[String(A.questions.length), "questions", per + " on each of the " + A.topics.length + " topics"], [String(b.mins), "minutes", "Answered on your own"], b.which === "post" ? ["2", "scores", "At the start and now, shown when you send it"] : ["1", "score", "Shown at the end of the course, next to the new one"]];
      const gap = 0.4, cw = (CW - 2 * gap) / 3;
      facts.forEach((f, i) => textBox(s, [{ text: f[0], options: { fontSize: 54, bold: true, color: C.accent1, breakLine: true } }, { text: f[1], options: { fontSize: 18, bold: true, color: C.text2, breakLine: true } }, { text: f[2], options: { fontSize: 14, color: C.accent6 } }], MX + i * (cw + gap), y, cw, 2.0));
      calloutBox(s, "Where", "On the course site.", y + 2.3, null, 16);
    },
    higherlower(b) {
      b.pairs.forEach((p, k) => {
        [false, true].forEach((shown) => {
          const s = content(twoTone(b.title, "· " + (k + 1) + " of " + b.pairs.length + (shown ? " · answer" : "")), !shown && k === 0 ? beatNote(b) : null);
          const cw = 5.15, y = TOP + 0.3, hh = 3.4;
          s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: MX, y, w: cw, h: hh, fill: { color: C.background2 }, line: { color: C.background2 }, rectRadius: 0.12 });
          textBox(s, plain(p.a.label), MX + 0.35, y + 0.3, cw - 0.7, 1.3, { fontSize: 18, color: C.text2 });
          textBox(s, p.a.show, MX + 0.35, y + hh - 1.4, cw - 0.7, 1.1, { fontSize: p.a.show.length > 9 ? 42 : 54, bold: true, color: C.accent1, valign: "bottom" });
          const x2 = W - MX - cw;
          s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x2, y, w: cw, h: hh, fill: { color: shown ? "FFFFFF" : HEX.accent1 }, line: { color: HEX.accent1, width: 2 }, rectRadius: 0.12 });
          textBox(s, plain(p.b.label), x2 + 0.35, y + 0.3, cw - 0.7, 1.3, { fontSize: 18, color: shown ? C.text2 : C.background1 });
          textBox(s, shown ? p.b.show : "?", x2 + 0.35, y + hh - 1.4, cw - 0.7, 1.1, { fontSize: shown && p.b.show.length > 9 ? 42 : 54, bold: true, color: shown ? C.accent1 : C.background1, valign: "bottom" });
          const higher = p.b.value > p.a.value;
          if (shown) chip(s, higher ? "Higher" : "Lower", W / 2 - 0.65, y + hh / 2 - 0.21, { w: 1.3, fill: higher ? HEX.accent4 : HEX.accent2, color: C.background1, size: 15 });
          else textBox(s, "higher\nor lower?", W / 2 - 0.75, y + hh / 2 - 0.4, 1.5, 0.8, { fontSize: 14, bold: true, color: C.accent6, align: "center", valign: "middle" });
          if (shown) calloutBox(s, null, p.note, y + hh + 0.35, "good", 17);
        });
      });
    },
    league(b) {
      const s = content(twoTone(b.title), beatNote(b));
      let y = TOP;
      y += para(s, b.intro, y, 17) + 0.15;
      const gap = 0.12, rh = 0.62;
      b.rows.forEach((r, i) => {
        const yy = y + i * (rh + gap);
        s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: MX, y: yy, w: CW, h: rh, fill: { color: C.background2 }, line: { color: C.background2 }, rectRadius: 0.08 });
        chip(s, r.who, MX + 0.15, yy + 0.1, { w: 2.5 });
        textBox(s, [{ text: plain(r.name) + "   ", options: { bold: true, color: C.accent1 } }, { text: plain(r.text), options: { color: C.text2 } }], MX + 2.9, yy, CW - 3.1, rh, { fontSize: 14, valign: "middle" });
      });
      if (b.squeeze) calloutBox(content(twoTone(b.title, "· the point")), b.squeeze.title, b.squeeze.text, TOP + 0.2, "warn", 20);
    },
    facts(b) {
      const s = content(twoTone(b.title), beatNote(b));
      const n = b.items.length, cols = n === 6 ? 3 : n, gap = 0.4, cw = (CW - gap * (cols - 1)) / cols;
      b.items.forEach((f, i) => {
        const x = MX + (i % cols) * (cw + gap), y = TOP + 0.2 + Math.floor(i / cols) * 2.35;
        textBox(s, [{ text: f.value, options: { fontSize: n > 4 ? 44 : 40, bold: true, color: C.accent1, breakLine: true } }, { text: f.label, options: { fontSize: 17, bold: true, color: C.text2, breakLine: true } }, { text: plain(f.note || ""), options: { fontSize: 14, color: C.accent6 } }], x, y, cw, 2.1);
      });
      if (b.source) textBox(s, b.source, MX, 6.45, CW, 0.3, { fontSize: 11, color: C.accent6 });
    },
    timeline(b) {
      const order = shuffledIdx(b.items.length, b.id);
      const q = content(twoTone(b.title), beatNote(b));
      let y = TOP; y += para(q, offline(b.intro, "Put these moments in order, from oldest to newest."), y, 17) + 0.15;
      const half = Math.ceil(order.length / 2), colW = (CW - 0.3) / 2, qrh = Math.min(0.85, (BOTTOM - y) / half - 0.1);
      order.forEach((k, j) => {
        const x = MX + (j < half ? 0 : colW + 0.3), yy = y + (j % half) * (qrh + 0.1);
        q.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: yy, w: colW, h: qrh, fill: { color: C.background2 }, line: { color: C.background2 }, rectRadius: 0.08 });
        textBox(q, [{ text: LETTERS[j] + "    ", options: { bold: true, color: C.accent1 } }, { text: plain(b.items[k].text), options: { color: C.text2 } }], x + 0.25, yy, colW - 0.45, qrh, { fontSize: 16, valign: "middle" });
      });
      const a = content(twoTone(b.title, "· the answer"));
      const letterOf = {}; order.forEach((k, j) => { letterOf[k] = LETTERS[j]; });
      const rows = b.items.length, rh = (BOTTOM - TOP) / rows;
      b.items.forEach((it, k) => {
        const yy = TOP + k * rh;
        textBox(a, it.year, MX, yy, 1.1, rh, { fontSize: 18, bold: true, color: C.accent1, valign: "middle" });
        a.addShape(pres.shapes.OVAL, { x: MX + 1.25, y: yy + rh / 2 - 0.1, w: 0.2, h: 0.2, fill: { color: C.accent1 }, line: { color: C.accent1 } });
        if (k < rows - 1) a.addShape(pres.shapes.LINE, { x: MX + 1.35, y: yy + rh / 2 + 0.1, w: 0, h: rh - 0.2, line: { color: HEX.accent3, width: 1.5 } });
        textBox(a, [{ text: plain(it.text) + "  ", options: { color: C.text2 } }, { text: "(" + letterOf[k] + ")", options: { color: C.accent6, bold: true } }], MX + 1.7, yy, CW - 1.7, rh, { fontSize: 16, valign: "middle" });
      });
    },
    strategy(b) {
      const s = content(twoTone(b.title), beatNote(b));
      textBox(s, b.aim, MX, TOP, CW, 0.6, { fontSize: 24, bold: true, color: C.dk1 || C.text1 });
      const gap = 0.3, cw = (CW - 2 * gap) / 3;
      b.items.forEach((it, i) => card(s, MX + i * (cw + gap), TOP + 0.9, cw, 1.9, it.title, it.text, { tSize: 20, bSize: 16 }));
      calloutBox(s, null, b.note, TOP + 3.1, null, 18);
    },
    flow(b) {
      const s = content(twoTone(b.title), beatNote(b));
      let y = TOP;
      if (b.intro) y += para(s, b.intro, y, 18) + 0.25;
      const n = b.steps.length, gap = 0.45, cw = (CW - gap * (n - 1)) / n;
      const hh = Math.max(...b.steps.map((st) => estH(st.title, cw - 0.4, 18) + estH(st.text, cw - 0.4, 15))) + 1.0;
      b.steps.forEach((st, i) => {
        const x = MX + i * (cw + gap);
        s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: cw, h: hh, fill: { color: C.background2 }, line: { color: C.background2 }, rectRadius: 0.1 });
        s.addShape(pres.shapes.OVAL, { x: x + 0.2, y: y + 0.2, w: 0.5, h: 0.5, fill: { color: C.accent1 }, line: { color: C.accent1 } });
        textBox(s, String(i + 1), x + 0.2, y + 0.2, 0.5, 0.5, { fontSize: 16, bold: true, color: C.background1, align: "center", valign: "middle" });
        textBox(s, [{ text: st.title, options: { fontSize: 18, bold: true, color: C.accent1, breakLine: true, paraSpaceAfter: 6 } }, { text: plain(st.text), options: { fontSize: 15, color: C.text2 } }], x + 0.2, y + 0.85, cw - 0.4, hh - 1.0);
        if (i < n - 1) textBox(s, "→", x + cw, y + hh / 2 - 0.25, gap, 0.5, { fontSize: 22, bold: true, color: C.accent1, align: "center", valign: "middle" });
      });
      if (b.risks) {
        const gap2 = 0.3, cw2 = (CW - gap2) / 2;
        b.risks.forEach((r, i) => card(s, MX + i * (cw2 + gap2), y + hh + 0.35, cw2, 1.15, r.title, r.text, { fill: WARN_BG, tColor: HEX.accent5, tSize: 17, bSize: 15 }));
      }
      if (b.note) calloutBox(s, null, b.note, y + hh + 0.35, null, 15);
    },
    cards(b) {
      const items = b.cards;
      for (let i = 0; i < items.length; i += 4) {
        const s = content(i === 0 ? twoTone(b.title) : twoTone(b.title, "(continued)"), i === 0 ? beatNote(b) : null);
        const gap = 0.25, cw = (CW - 3 * gap) / 4, y = TOP, hh = BOTTOM - TOP;
        items.slice(i, i + 4).forEach((c, j) => {
          const x = MX + j * (cw + gap);
          s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: cw, h: 1.55, fill: { color: C.accent1 }, line: { color: C.accent1 }, rectRadius: 0.1 });
          const longTeam = plain(c.team).length > 28;
          textBox(s, plain(c.team), x + 0.2, y + 0.1, cw - 0.4, longTeam ? 0.42 : 0.3, { fontSize: 11, color: C.accent3 });
          textBox(s, plain(c.name), x + 0.2, y + (longTeam ? 0.52 : 0.42), cw - 0.4, longTeam ? 0.55 : 0.65, { fontSize: longTeam ? 16 : 17, bold: true, color: C.background1 });
          s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: y + 1.65, w: cw, h: hh - 1.65, fill: { color: "FFFFFF" }, line: { color: HEX.accent1, width: 1 }, rectRadius: 0.1 });
          textBox(s, [
            { text: "For", options: { bold: true, color: C.accent1, fontSize: 12, breakLine: true } }, { text: plain(c.who), options: { color: C.text2, fontSize: 14, breakLine: true, paraSpaceAfter: 6 } },
            { text: "How", options: { bold: true, color: C.accent1, fontSize: 12, breakLine: true } }, { text: plain(c.how), options: { color: C.text2, fontSize: 14, breakLine: true, paraSpaceAfter: 6 } },
            { text: "Value", options: { bold: true, color: C.accent1, fontSize: 12, breakLine: true } }, { text: plain(c.earns), options: { color: C.text2, fontSize: 14 } },
          ], x + 0.2, y + 1.8, cw - 0.4, hh - 1.9);
        });
      }
    },
    // guessing board: the hidden board (ranks only), then the answers, column by column like the site (1 to 5 left, the rest right)
    topboard(b) {
      const KC = { structured: ["1D7A4E", GOOD_BG], semi: ["9A6A12", WARN_BG], unstructured: ["223E99", TINT2], outside: [BAD, BAD_BG] };
      const pts = (n) => (n === 1 ? "1 point" : n + " points");
      const draw = (shown) => {
        const s = content(shown ? twoTone(plain(b.title), "The answers") : twoTone(plain(b.title)), shown ? b.summary : beatNote(b));
        let y = TOP;
        if (b.intro && !shown) y += para(s, b.intro, y, 15, C.accent6) + 0.12;
        const n = b.answers.length, rows = Math.ceil(n / 2), gap = 0.14, cw = (CW - gap) / 2, vg = 0.08;
        const bottom = shown && b.summary ? 5.95 : BOTTOM;
        const th = Math.min(0.9, (bottom - y - (rows - 1) * vg) / rows);
        b.answers.forEach((a, k) => {
          const col = k < rows ? 0 : 1, row = k < rows ? k : k - rows;
          const x = MX + col * (cw + gap), yy = y + row * (th + vg), rank = a.bonus ? "+" : String(k + 1);
          if (!shown) {
            const fill = a.bonus ? TINT2 : C.accent1, fg = a.bonus ? C.accent1 : C.background1;
            s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: yy, w: cw, h: th, fill: { color: fill }, line: { color: fill }, rectRadius: 0.08 });
            textBox(s, rank, x + 0.2, yy, 0.6, th, { fontSize: 22, bold: true, color: fg, valign: "middle" });
            if (a.bonus) textBox(s, "Bonus", x + 0.8, yy, cw - 2.4, th, { fontSize: 16, bold: true, color: fg, valign: "middle" });
            textBox(s, pts(a.pts), x + cw - 1.6, yy, 1.4, th, { fontSize: 13, bold: true, color: a.bonus ? C.accent6 : C.accent3, align: "right", valign: "middle" });
            return;
          }
          const [kc, kbg] = KC[a.kind] || [C.accent1, TINT2];
          s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: yy, w: cw, h: th, fill: { color: "FFFFFF" }, line: { color: HEX.accent1, width: 0.75 }, rectRadius: 0.08 });
          s.addShape(pres.shapes.RECTANGLE, { x, y: yy + 0.06, w: 0.07, h: th - 0.12, fill: { color: kc }, line: { color: kc } });
          textBox(s, rank, x + 0.18, yy, 0.45, th, { fontSize: 18, bold: true, color: C.accent1, valign: "middle", align: "center" });
          textBox(s, [{ text: plain(a.text), options: { bold: true, color: C.text2, fontSize: 14, breakLine: true } },
                      { text: plain(a.freq || ""), options: { color: C.accent6, fontSize: 11 } }], x + 0.72, yy + 0.06, cw - 2.75, th - 0.12, { valign: "middle" });
          const label = b.kinds[a.kind] || a.kind, kw = 1.85;
          s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + cw - kw - 0.15, y: yy + 0.1, w: kw, h: 0.3, fill: { color: kbg }, line: { color: kbg }, rectRadius: 0.15 });
          textBox(s, label, x + cw - kw - 0.15, yy + 0.1, kw, 0.3, { fontSize: 10, bold: true, color: kc, align: "center", valign: "middle" });
          textBox(s, pts(a.pts), x + cw - kw - 0.15, yy + th - 0.36, kw, 0.28, { fontSize: 10, color: C.accent6, align: "center", valign: "middle" });
        });
        if (shown && b.summary) textBox(s, plain(b.summary), MX, 6.02, CW, 0.5, { fontSize: 12, color: C.text2 });
        if (shown && b.source) textBox(s, plain(b.source), MX, 6.5, CW, 0.25, { fontSize: 10, color: C.accent6 });
      };
      draw(false);
      draw(true);
    },
    regulators(b) {
      if (b.items.length > 6) {
        gridSlides(twoTone(b.title), b.items.map((r) => ({ kicker: r.full, title: r.name, text: r.text })), 3, null, { tSize: 18, bSize: 13 }, beatNote(b));
        if (b.note) calloutBox(content(twoTone(b.title, "· the rule")), null, b.note, TOP + 0.2, null, 20);
        return;
      }
      const s = content(twoTone(b.title), beatNote(b));
      const h1 = grid(s, b.items.map((r) => ({ kicker: r.full, title: r.name, text: r.text })), TOP, 3, { tSize: 24, bSize: 15, minH: 1.9 });
      calloutBox(s, null, b.note, TOP + h1 + 0.3, null, 16);
    },
    segments(b) {
      const items = b.items.map((g) => ({ kicker: g.team, title: g.name, text: "Who: " + g.who.join("; ") + ".\nOffers: " + g.services.join("; ") + "." + (g.earns ? "\nEarns: " + g.earns : "") }));
      gridSlides(twoTone(b.title), items, 2, b.intro, { tSize: 20, bSize: 13 }, beatNote(b));
      if (b.note) calloutBox(content(twoTone(b.title, "· in short")), null, b.note, TOP + 0.2, null, 20);
    },
    explain(b) {
      let first = true;
      const head = (x) => ({ text: x, options: { bold: true, color: C.accent1, fill: { color: C.background2 } } });
      b.groups.forEach((g) => g.items.forEach((p) => {
        const s = content(twoTone(p.name, "· " + g.title), first ? beatNote(b) : null);
        first = false;
        const y = TOP + para(s, p.how, TOP, 17) + 0.2;
        const rows = [[head("Part"), head("What it means")]].concat(p.parts.map((x) => [{ text: plain(x[0]), options: { bold: true, color: C.text2 } }, { text: plain(x[1]), options: { color: C.text2 } }]));
        s.addTable(rows, { x: MX, y, w: CW, colW: [3.2, CW - 3.2], fontSize: 14, border: { type: "solid", pt: 0.75, color: HEX.accent3 }, margin: 0.06, valign: "middle" });
      }));
    },
    flags(b) {
      b.items.forEach((it, k) => {
        const q = statement(b.title + " · " + (k + 1) + " of " + b.items.length, k === 0 ? beatNote(b) : null);
        bigQuestion(q, it.text, 1.6, 32);
        textBox(q, "Red flag or green flag?", MX, 5.6, CW, 0.6, { fontSize: 20, bold: true, color: C.accent3 });
        const a = content(twoTone(b.title, "· " + (k + 1) + " of " + b.items.length + " · answer"));
        let y = TOP; y += para(a, it.text, y, 20, C.accent6) + 0.25;
        const red = it.verdict === "red";
        calloutBox(a, red ? "Red flag" : "Green flag", it.rule, y, red ? "bad" : "good", 20);
      });
    },
    scam(b) {
      b.items.forEach((it, k) => {
        [false, true].forEach((shown) => {
          const s = content(twoTone(b.title, "· " + (k + 1) + " of " + b.items.length + (shown ? " · answer" : "")), !shown && k === 0 ? beatNote(b) : null);
          const px = MX, pw = 5.2, py = TOP, ph = 4.9;
          s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: px, y: py, w: pw, h: ph, fill: { color: HEX.dk1 }, line: { color: HEX.dk1 }, rectRadius: 0.25 });
          textBox(s, it.channel, px + 0.3, py + 0.2, 2, 0.35, { fontSize: 12, color: C.accent3 });
          textBox(s, it.from, px + 2.2, py + 0.2, pw - 2.5, 0.35, { fontSize: 13, bold: true, color: C.background1, align: "right" });
          s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: px + 0.3, y: py + 0.75, w: pw - 0.6, h: ph - 1.1, fill: { color: "EEF1F8" }, line: { color: "EEF1F8" }, rectRadius: 0.2 });
          textBox(s, plain(it.text), px + 0.55, py + 0.95, pw - 1.1, ph - 1.5, { fontSize: 18, color: C.dk1 || C.text1 });
          const sx = px + pw + 0.5, sw = W - MX - sx;
          if (!shown) {
            textBox(s, "Real or scam?", sx, py + 0.2, sw, 0.8, { fontSize: 32, bold: true, color: C.accent1 });
            textBox(s, "Decide, then check the next slide.", sx, py + 1.2, sw, 1.2, { fontSize: 18, color: C.text2 });
          } else {
            const scam = it.verdict === "scam";
            const hh = 0.8 + it.flags.reduce((n, f) => n + estH(f, sw - 0.7, 17) + 0.08, 0);
            s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: sx, y: py, w: sw, h: hh, fill: { color: scam ? BAD_BG : GOOD_BG }, line: { color: scam ? BAD_BG : GOOD_BG }, rectRadius: 0.1 });
            textBox(s, scam ? "Scam" : "Real", sx + 0.3, py + 0.15, sw - 0.6, 0.5, { fontSize: 24, bold: true, color: scam ? BAD : HEX.accent4 });
            textBox(s, it.flags.map((f, i) => ({ text: plain(f), options: { bullet: true, breakLine: i < it.flags.length - 1, paraSpaceAfter: 6 } })), sx + 0.3, py + 0.7, sw - 0.6, hh - 0.8, { fontSize: 17, color: C.text2 });
          }
        });
      });
    },
    "cards-static"(b) {
      const s = content(twoTone(b.title), beatNote(b));
      const h1 = grid(s, b.items.map((i) => ({ title: i.title, text: i.text })), TOP, b.items.length === 5 ? 3 : 3, { tSize: 17, bSize: 14 });
      if (b.note) calloutBox(s, null, b.note, TOP + h1 + 0.25, null, 14);
    },
    order(b) {
      const order = shuffledIdx(b.steps.length, b.id);
      const q = content(twoTone(b.title), beatNote(b));
      let y = TOP; y += para(q, offline(b.intro, "Put these steps in order."), y, 17) + 0.15;
      const rh = Math.min(0.6, (BOTTOM - y) / b.steps.length - 0.08);
      order.forEach((k, j) => {
        const yy = y + j * (rh + 0.08);
        q.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: MX, y: yy, w: 8.5, h: rh, fill: { color: C.background2 }, line: { color: C.background2 }, rectRadius: 0.08 });
        textBox(q, [{ text: LETTERS[j] + "    ", options: { bold: true, color: C.accent1 } }, { text: plain(b.steps[k].text), options: { color: C.text2 } }], MX + 0.25, yy, 8.1, rh, { fontSize: 16, valign: "middle" });
      });
      const a = content(twoTone(b.title, "· the answer"));
      const letterOf = {}; order.forEach((k, j) => { letterOf[k] = LETTERS[j]; });
      const rh2 = Math.min(0.66, (BOTTOM - TOP) / b.steps.length - 0.08);
      b.steps.forEach((st, k) => {
        const yy = TOP + k * (rh2 + 0.08);
        a.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: MX, y: yy, w: CW, h: rh2, fill: { color: C.background2 }, line: { color: C.background2 }, rectRadius: 0.08 });
        a.addShape(pres.shapes.OVAL, { x: MX + 0.15, y: yy + (rh2 - 0.42) / 2, w: 0.42, h: 0.42, fill: { color: C.accent1 }, line: { color: C.accent1 } });
        textBox(a, String(k + 1), MX + 0.15, yy + (rh2 - 0.42) / 2, 0.42, 0.42, { fontSize: 13, bold: true, color: C.background1, align: "center", valign: "middle" });
        textBox(a, [{ text: plain(st.text) + "  ", options: { color: C.text2 } }, { text: "(" + letterOf[k] + ")", options: { color: C.accent6, bold: true } }], MX + 0.75, yy, 6.6, rh2, { fontSize: 15, valign: "middle" });
        textBox(a, plain(st.owner), MX + 7.5, yy, CW - 7.7, rh2, { fontSize: 14, bold: true, color: HEX.accent4, align: "right", valign: "middle" });
      });
    },
    lines(b) {
      const s = content(twoTone(b.title), beatNote(b)), y0 = introAt(s, b);
      const gap = 0.3, cw = (CW - 2 * gap) / 3, fills = [HEX.accent1, HEX.accent2, "4C5F9E"];
      const nh = b.note ? estH(b.note, CW - 0.7, 15) + 0.35 : 0, lh = Math.min(4.6, BOTTOM - y0 - 0.2 - (nh ? nh + 0.3 : 0));
      b.items.forEach((l, i) => {
        const x = MX + i * (cw + gap);
        s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: y0 + 0.2, w: cw, h: lh, fill: { color: fills[i] }, line: { color: fills[i] }, rectRadius: 0.12 });
        textBox(s, [{ text: l.n, options: { fontSize: 36, bold: true, color: "FFFFFF", breakLine: true, paraSpaceAfter: 8 } }, { text: l.title, options: { fontSize: 20, bold: true, color: "FFFFFF", breakLine: true, paraSpaceAfter: 8 } }, { text: plain(l.text), options: { fontSize: 16, color: "E3E8F6" } }], x + 0.3, y0 + 0.45, cw - 0.6, lh - 0.4);
      });
      if (b.note) calloutBox(s, null, b.note, y0 + 0.2 + lh + 0.3, null, 15);
    },

    // ---------- theory blocks ----------
    // the start of a round's theory, exercises or hands-on work: what the part covers
    part(b) {
      const S = C0.sections.find((x) => x.id === b.section), list = [];
      let on = false;
      S.beats.forEach((x) => {
        if (x.id === b.id) { on = true; return; }
        if (x.type === "part") on = false;
        else if (on && x.type !== "leaderboard" && (FAC || x.portal !== false)) list.push(x.title);
      });
      const fallback = b.kind === "exercises" ? "Questions on the ideas above, one after another." : b.kind === "hands" ? "The same ideas put to work in an AI tool." : "";
      const s = statement(b.title + (b.mins ? " · " + b.mins + " minutes" : ""), beatNote(b));
      let y = 1.35;
      if (b.text) y += bigQuestion(s, offline(b.text, fallback), y, 26) + 0.45;
      const per = list.length > 6 ? Math.ceil(list.length / 2) : list.length, cols = list.length > 6 ? 2 : 1;
      const cw = cols === 2 ? (CW - 0.4) / 2 : CW, rh = Math.min(0.6, (6.65 - y) / per);
      list.forEach((t, i) => {
        const x = MX + Math.floor(i / per) * (cw + 0.4), yy = y + (i % per) * rh;
        textBox(s, [{ text: String(i + 1) + "    ", options: { bold: true, color: C.accent3 } }, { text: plain(t), options: { color: C.background1 } }], x, yy, cw, rh, { fontSize: 18, valign: "middle" });
      });
    },
    // bullet points, with a chart or a quote beside them
    points(b) {
      const s = content(twoTone(b.title), beatNote(b)), y0 = introAt(s, b);
      const lw = b.chart ? CW * 0.42 : b.quote ? CW * 0.55 : CW, size = b.chart || b.quote ? 16 : 19;
      const runs = [];
      b.items.forEach((p, i) => {
        const last = i === b.items.length - 1;
        if (typeof p === "string") runs.push({ text: plain(p), options: { bullet: true, breakLine: !last, paraSpaceAfter: 10 } });
        else {
          runs.push({ text: p.title + " ", options: { bold: true, color: C.accent1, bullet: true } });
          runs.push({ text: plain(p.text), options: { breakLine: !last, paraSpaceAfter: 10 } });
        }
      });
      const text = b.items.map((p) => (typeof p === "string" ? p : p.title + " " + p.text)).join("\n");
      const sz = estH(text, lw - 0.3, size) + b.items.length * 0.12 > BOTTOM - y0 ? size - 2 : size;
      textBox(s, runs, MX, y0, lw, BOTTOM - y0, { fontSize: sz, color: C.text2 });
      if (b.chart) drawChart(s, b.chart, MX + lw + 0.3, y0, CW - lw - 0.3, BOTTOM - y0 - 0.1);
      else if (b.quote) {
        const x = MX + lw + 0.4, w = CW - lw - 0.4, hh = estH(b.quote.text, w - 0.6, 20) + 0.9;
        s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: y0, w, h: hh, fill: { color: HEX.lt2 }, line: { color: HEX.lt2 }, rectRadius: 0.1 });
        s.addShape(pres.shapes.RECTANGLE, { x, y: y0, w: 0.08, h: hh, fill: { color: HEX.accent1 }, line: { color: HEX.accent1 } });
        textBox(s, [{ text: plain(b.quote.text), options: { fontSize: 20, bold: true, color: HEX.dk1, breakLine: true, paraSpaceAfter: 10 } }, { text: b.quote.by, options: { fontSize: 12, color: C.accent6 } }], x + 0.3, y0 + 0.25, w - 0.5, hh - 0.4);
      }
      if (b.note) calloutBox(s, null, b.note, BOTTOM - 0.75, null, 14);
    },
    // a comparison table, first column bold
    table(b) {
      const s = content(twoTone(b.title), beatNote(b));
      let y = TOP;
      if (b.intro) y += para(s, b.intro, y, 16) + 0.15;
      const ncol = b.cols.length, first = ncol > 3 ? 2.1 : 2.5, rest = (CW - first) / (ncol - 1);
      const size = b.rows.length > 6 || ncol > 3 ? 12 : 14;
      const head = (x) => ({ text: x, options: { bold: true, color: "FFFFFF", fill: { color: HEX.accent1 } } });
      const rows = [b.cols.map(head)].concat(b.rows.map((r) => r.map((c, j) => ({ text: plain(c), options: j ? { color: C.text2 } : { bold: true, color: C.accent1, fill: { color: HEX.lt2 } } }))));
      const colW = [first].concat(Array(ncol - 1).fill(rest));
      s.addTable(rows, { x: MX, y, w: CW, colW, fontSize: size, border: { type: "solid", pt: 0.75, color: HEX.accent3 }, margin: 0.07, valign: "middle" });
      if (b.note) {
        const th = 0.4 + b.rows.reduce((t, r) => t + Math.max(...r.map((c, j) => estH(c, colW[j] - 0.15, size))) + 0.06, 0);
        calloutBox(s, null, b.note, Math.min(BOTTOM - 0.7, y + th + 0.25), null, 14);
      }
    },
    // formulas as boxes: the result in navy, then the parts, with a worked example under each
    formula(b) {
      const s = content(twoTone(b.title), beatNote(b));
      let y = introAt(s, b);
      b.rows.forEach((r) => {
        let x = MX;
        r.parts.forEach((p, i) => {
          if (/^[=×÷+−]$/.test(p)) { textBox(s, p, x, y, 0.45, 0.6, { fontSize: 24, bold: true, color: C.accent1, align: "center", valign: "middle" }); x += 0.5; return; }
          const w = Math.max(0.7, 0.35 + plain(p).length * 0.13);
          s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h: 0.6, fill: { color: i === 0 ? HEX.accent1 : "FFFFFF" }, line: { color: HEX.accent1, width: 1.25 }, rectRadius: 0.1 });
          textBox(s, plain(p), x, y, w, 0.6, { fontSize: 16, bold: true, color: i === 0 ? C.background1 : C.accent1, align: "center", valign: "middle" });
          x += w + 0.1;
        });
        y += 0.7;
        if (r.example) { const eh = estH(r.example, CW, 14); textBox(s, plain(r.example), MX, y, CW, eh, { fontSize: 14, color: C.accent6 }); y += eh; }
        y += 0.3;
      });
      if (b.note) calloutBox(s, null, b.note, Math.min(y, BOTTOM - 0.8), null, 14);
    },
    // a pyramid of stacked bars, top level first, the meaning beside each level
    pyramid(b) {
      const s = content(twoTone(b.title), beatNote(b));
      const n = b.levels.length, pw = 5.2, avail = BOTTOM - TOP - (b.note ? 0.85 : 0), rh = Math.min(0.85, avail / n);
      const fills = ["0E1430", "16306F", "223E99", "4C6BC0", "7F96D3", "AFC0E8"];
      b.levels.forEach((l, i) => {
        const w = pw * (0.34 + 0.66 * i / Math.max(1, n - 1)), x = MX + (pw - w) / 2, y = TOP + i * rh, k = Math.round(5 * i / Math.max(1, n - 1));
        s.addShape(pres.shapes.RECTANGLE, { x, y, w, h: rh - 0.06, fill: { color: fills[k] }, line: { color: fills[k] } });
        textBox(s, l.title, x, y, w, rh - 0.06, { fontSize: 15, bold: true, color: k === 5 ? HEX.dk1 : "FFFFFF", align: "center", valign: "middle" });
        textBox(s, plain(l.text), MX + pw + 0.4, y, CW - pw - 0.4, rh - 0.06, { fontSize: n > 4 ? 14 : 16, color: C.text2, valign: "middle" });
      });
      if (b.note) calloutBox(s, null, b.note, TOP + n * rh + 0.15, null, 14);
    },
    // read and discuss: the exhibit and the question, then a second slide with how to read it
    discuss(b) {
      const exhibit = (s, x, y, w, h) => {
        if (b.chart) { drawChart(s, b.chart, x, y, w, h); return; }
        const t = b.table, n = t.cols.length, first = Math.min(2.2, w * 0.3), rest = (w - first) / (n - 1);
        const head = (v) => ({ text: v, options: { bold: true, color: "FFFFFF", fill: { color: HEX.accent1 } } });
        s.addTable([t.cols.map(head)].concat(t.rows.map((r) => r.map((c, j) => ({ text: plain(c), options: j ? { color: C.text2 } : { bold: true, color: C.accent1, fill: { color: HEX.lt2 } } })))),
          { x, y, w, colW: [first].concat(Array(n - 1).fill(rest)), fontSize: t.rows.length > 5 ? 12 : 13, border: { type: "solid", pt: 0.75, color: HEX.accent3 }, margin: 0.06, valign: "middle" });
      };
      const s = content(twoTone(b.title), beatNote(b));
      let y = TOP;
      if (b.intro) y += para(s, b.intro, y, 15, C.accent6) + 0.15;
      const ew = CW * 0.58, sx = MX + ew + 0.35, sw = CW - ew - 0.35;
      exhibit(s, MX, y, ew, BOTTOM - y);
      const ph = estH(b.prompt, sw - 0.5, 18) + 0.5;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: sx, y, w: sw, h: ph, fill: { color: HEX.lt2 }, line: { color: HEX.lt2 }, rectRadius: 0.1 });
      textBox(s, plain(b.prompt), sx + 0.25, y + 0.2, sw - 0.5, ph - 0.3, { fontSize: 18, bold: true, color: HEX.dk1 });
      if (b.mins) textBox(s, b.mins + " minutes at your table", sx, y + ph + 0.15, sw, 0.35, { fontSize: 13, color: C.accent6 });
      const a = content(twoTone(b.title, "· how to read it"));
      let ya = TOP + para(a, b.prompt, TOP, 15, C.accent6) + 0.2;
      const runs = b.reading.map((x, i) => ({ text: plain(x), options: { bullet: true, breakLine: i < b.reading.length - 1, paraSpaceAfter: 10 } }));
      const rh = Math.min(BOTTOM - ya, b.reading.reduce((n, x) => n + estH(x, CW - 0.7, 16) + 0.15, 0) + 0.4);
      a.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: MX, y: ya, w: CW, h: rh, fill: { color: GOOD_BG }, line: { color: GOOD_BG }, rectRadius: 0.08 });
      textBox(a, runs, MX + 0.3, ya + 0.2, CW - 0.6, rh - 0.3, { fontSize: 16, color: C.text2 });
    },
    // a two-by-two grid with its axes
    quad(b) {
      const s = content(twoTone(b.title), beatNote(b)), y0 = introAt(s, b);
      const ax = 0.6, gx = MX + ax, gw = CW - ax, nh = b.note ? estH(b.note, CW - 0.7, 14) + 0.5 : 0, gh = BOTTOM - y0 - 0.4 - nh;
      const gap = 0.15, cw = (gw - gap) / 2, ch = (gh - gap) / 2;
      const tone = { good: [GOOD_BG, HEX.accent4, C.text2], bad: [BAD_BG, BAD, C.text2], warn: [WARN_BG, HEX.accent5, C.text2], navy: [HEX.accent1, "FFFFFF", "E3E8F6"] };
      b.cells.forEach((c, i) => {
        const t = tone[c.tone] || [HEX.lt2, HEX.accent1, C.text2];
        card(s, gx + (i % 2) * (cw + gap), y0 + Math.floor(i / 2) * (ch + gap), cw, ch, c.title, c.text, { fill: t[0], tColor: t[1], bColor: t[2], tSize: 20, bSize: 15 });
      });
      textBox(s, b.y.high, MX, y0, ax - 0.05, 0.3, { fontSize: 11, color: C.accent6 });
      textBox(s, b.y.low, MX, y0 + gh - 0.3, ax - 0.05, 0.3, { fontSize: 11, color: C.accent6 });
      textBox(s, b.y.label, MX + ax / 2 - gh / 2, y0 + gh / 2 - 0.2, gh, 0.4, { fontSize: 13, bold: true, color: C.accent1, align: "center", valign: "middle", rotate: 270 });
      textBox(s, b.x.low, gx, y0 + gh + 0.05, 2, 0.3, { fontSize: 11, color: C.accent6 });
      textBox(s, b.x.label, gx + gw / 2 - 2.5, y0 + gh + 0.05, 5, 0.3, { fontSize: 13, bold: true, color: C.accent1, align: "center" });
      textBox(s, b.x.high, gx + gw - 2, y0 + gh + 0.05, 2, 0.3, { fontSize: 11, color: C.accent6, align: "right" });
      if (b.note) calloutBox(s, null, b.note, BOTTOM - nh + 0.1, null, 14);
    },
    // steps around an ellipse with arrows between them, the meaning of each step beside it
    cycle(b) {
      const s = content(twoTone(b.title), beatNote(b));
      const top = b.intro ? TOP + para(s, b.intro, TOP, 14) + 0.1 : TOP, shrink = (top - TOP) / 2;   // the intro pushes the ring down and flattens it
      const n = b.steps.length, cx = MX + 4.2, cy = top + 2.6 - shrink, rx = 3.3, ry = 2.1 - shrink, bw = 1.85, bh = 0.62;
      const pos = b.steps.map((st, i) => { const a = -Math.PI / 2 + 2 * Math.PI * i / n; return { x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) }; });
      pos.forEach((p, i) => {
        const q = pos[(i + 1) % n], dx = q.x - p.x, dy = q.y - p.y;
        const tp = Math.min(Math.abs(dx) > 1e-6 ? (bw / 2 + 0.04) / Math.abs(dx) : 9, Math.abs(dy) > 1e-6 ? (bh / 2 + 0.04) / Math.abs(dy) : 9);
        const x1 = p.x + dx * tp, y1 = p.y + dy * tp, x2 = q.x - dx * tp, y2 = q.y - dy * tp;
        if ((x2 - x1) * dx + (y2 - y1) * dy <= 0) return;   // boxes too close for an arrow
        s.addShape(pres.shapes.LINE, { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.max(0.01, Math.abs(x2 - x1)), h: Math.max(0.01, Math.abs(y2 - y1)), flipH: x2 < x1, flipV: y2 < y1, line: { color: HEX.accent2, width: 2, endArrowType: "triangle" } });
      });
      pos.forEach((p, i) => {
        const on = i === 0;
        s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: p.x - bw / 2, y: p.y - bh / 2, w: bw, h: bh, fill: { color: on ? HEX.accent1 : "FFFFFF" }, line: { color: HEX.accent1, width: 1.25 }, rectRadius: 0.1 });
        textBox(s, b.steps[i].title, p.x - bw / 2, p.y - bh / 2, bw, bh, { fontSize: 13, bold: true, color: on ? "FFFFFF" : C.accent1, align: "center", valign: "middle" });
      });
      if (b.center) textBox(s, b.center, cx - 1.5, cy - 0.3, 3, 0.6, { fontSize: 20, bold: true, color: C.text2, align: "center", valign: "middle" });
      const lx = MX + 8.65, lw = W - MX - lx;
      textBox(s, b.steps.map((st, i) => ({ text: (i + 1) + ". " + st.title + "  ", options: { bold: true, color: C.accent1 } })).reduce((acc, r, i) => acc.concat([r, { text: plain(b.steps[i].text || ""), options: { color: C.text2, breakLine: i < n - 1, paraSpaceAfter: 6 } }]), []),
        lx, top, lw, BOTTOM - top, { fontSize: 12 });
    },
    // a buyer persona card
    persona(b) {
      const p = b.persona, s = content(twoTone(b.title), beatNote(b));
      const lw = 5.0, nh = b.note ? estH(b.note, CW - 0.7, 13) + 0.45 : 0, ph = BOTTOM - TOP - nh;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: MX, y: TOP, w: lw, h: ph, fill: { color: "FFFFFF" }, line: { color: HEX.accent3, width: 1 }, rectRadius: 0.1 });
      s.addShape(pres.shapes.OVAL, { x: MX + 0.3, y: TOP + 0.3, w: 0.9, h: 0.9, fill: { color: HEX.accent1 }, line: { color: HEX.accent1 } });
      textBox(s, p.name.split(" ").map((x) => x.charAt(0)).join("").slice(0, 2), MX + 0.3, TOP + 0.3, 0.9, 0.9, { fontSize: 22, bold: true, color: "FFFFFF", align: "center", valign: "middle" });
      textBox(s, [{ text: p.name, options: { fontSize: 22, bold: true, color: HEX.dk1, breakLine: true } }, { text: p.tagline, options: { fontSize: 13, color: C.accent6 } }], MX + 1.4, TOP + 0.3, lw - 1.6, 0.9, { valign: "middle" });
      textBox(s, p.facts.map((f, i) => [{ text: f[0] + ": ", options: { bold: true, color: C.accent1 } }, { text: plain(f[1]), options: { color: C.text2, breakLine: i < p.facts.length - 1, paraSpaceAfter: 4 } }]).flat(), MX + 0.3, TOP + 1.45, lw - 0.6, 1.9, { fontSize: 14 });
      if (p.quote) {
        s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: MX + 0.3, y: TOP + 3.45, w: lw - 0.6, h: 0.9, fill: { color: HEX.lt2 }, line: { color: HEX.lt2 }, rectRadius: 0.08 });
        textBox(s, plain(p.quote), MX + 0.45, TOP + 3.45, lw - 0.9, 0.9, { fontSize: 15, bold: true, color: HEX.dk1, valign: "middle" });
      }
      const rx = MX + lw + 0.3, rw = CW - lw - 0.3, gh = (ph - 0.2 * (p.groups.length - 1)) / p.groups.length;
      p.groups.forEach((g, i) => {
        const y = TOP + i * (gh + 0.2);
        s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: rx, y, w: rw, h: gh, fill: { color: HEX.lt2 }, line: { color: HEX.lt2 }, rectRadius: 0.08 });
        textBox(s, [{ text: g.title, options: { bold: true, color: C.accent1, fontSize: 15, breakLine: true, paraSpaceAfter: 4 } }].concat(g.items.map((x, j) => ({ text: plain(x), options: { bullet: true, color: C.text2, fontSize: 13, breakLine: j < g.items.length - 1 } }))), rx + 0.2, y + 0.12, rw - 0.4, gh - 0.2);
      });
      if (b.note) calloutBox(s, null, b.note, BOTTOM - nh + 0.12, null, 13);
    },
    leaderboard() {},
  };

  // ---------- the instructor's explanations (build/explain.py) ----------
  // Portal deck: reading slides after each block. Facilitator deck: added to the speaker notes, so the projected deck stays short.
  const XS = 15, XGAP = 0.16;
  const unmd = (t) => plain(t).replace(/\*\*/g, "");
  const mdRuns = (t, o = {}) => plain(t).split(/\*\*(.+?)\*\*/g)
    .map((x, i) => ({ text: x, options: Object.assign({}, o, i % 2 ? { bold: true, color: C.accent1 } : {}) })).filter((r) => r.text);
  const XBOX = { example: ["Example", null], trap: ["Easy to confuse", "warn"], tip: ["Tip", "good"] };
  // Paragraphs and bullets share one text box until a box (example, trap, tip, prompt) or the slide's end; lists split by item.
  const xH = (t, w) => { const cpl = (w * 72) / (XS * 0.48); return String(t).split("\n").reduce((n, p) => n + Math.max(1, Math.ceil(unmd(p).length / cpl)), 0) * XS * 1.2 / 72; };
  const XBOTTOM = 6.85;
  function explainSlides(title, list, label) {
    if (!list || !list.length) return;
    const units = [];
    list.forEach((x) => {
      if (typeof x === "string") units.push({ k: "p", t: x, h: xH(x, CW) + 10 / 72 });
      else if (Array.isArray(x)) x.forEach((li, i) => units.push({ k: "li", t: li, last: i === x.length - 1, h: xH(li, CW - 0.35) + (i === x.length - 1 ? 10 : 4) / 72 }));
      else {
        const head = x.prompt ? x.title || "Try this" : XBOX[x.box][0], body = x.prompt || unmd(x.text);
        units.push({ k: "box", head, body, tone: x.prompt ? null : XBOX[x.box][1], h: xH(head + ". " + body, CW - 0.7) + 0.32 + 0.15 });
      }
    });
    const base = typeof title === "string" ? title : title.map((r) => r.text).join("");
    let s, y, ry, runs = [], n = 0;
    const flush = () => { if (runs.length) textBox(s, runs, MX, ry, CW, y - ry + 0.1, { fontSize: XS, color: C.text2 }); runs = []; };
    const fresh = () => { s = content(n ? base + " (continued)" : base); y = TOP; if (!n) { chip(s, label, MX, y); y += 0.62; } ry = y; n++; };
    fresh();
    units.forEach((u) => {
      if (y + u.h - (u.k === "box" ? 0.15 : 0) > XBOTTOM && y > TOP + 0.7) { flush(); fresh(); }
      if (u.k === "box") { if (runs.length) { flush(); y += 0.1; } calloutBox(s, u.head, u.body, y + 0.04, u.tone, XS, u.h - 0.15); y += u.h; ry = y; return; }
      const r = mdRuns(u.t);
      if (u.k === "li") r[0].options.bullet = { indent: 18 };
      if (runs.length) runs[runs.length - 1].options.breakLine = true;
      r[r.length - 1].options.paraSpaceAfter = u.k === "li" && !u.last ? 4 : 10;
      runs.push(...r);
      y += u.h;
    });
    flush();
  }
  const explainText = (list) => list.map((x) => (typeof x === "string" ? unmd(x)
    : Array.isArray(x) ? x.map((li) => "\u2022 " + unmd(li)).join("\n")
    : x.prompt ? (x.title || "Try this") + ". " + x.prompt : XBOX[x.box][0] + ". " + unmd(x.text))).join("\n\n");
  function explainNotes(s, label, list) {
    if (!s || !list || !list.length) return;
    const has = s._slideObjects.some((o) => o._type === "notes");
    s.addNotes((has ? "\n\n" : "") + label.toUpperCase() + "\n" + explainText(list));
  }

  // ---------- one divider and the blocks for each section ----------
  C0.sections.forEach((S, si) => {
    sec = /^[1-9]$/.test(S.num) ? "Round " + S.num + " · " + plain(S.nav) : plain(S.nav);
    pres.addSection({ title: sec });
    S.beats.forEach((b) => { b.section = S.id; });
    {
      const s = pres.addSlide({ masterName: "Section", sectionTitle: sec });
      s.addText(S.num, { placeholder: "num" });
      s.addText(plain(S.title) + " " + plain(S.titleAccent), { placeholder: "title" });
      s.addText(plain(S.lede) + "\n\n" + S.time + " · " + S.mins + " minutes" + (S.brief ? "\n" + S.brief : ""), { placeholder: "body" });
      artFrame(s, S.art, 7.25, 1.55, 5.48, 3.65, S.num);
      notesOn(s, N.sections[S.id] && N.sections[S.id].say);
      const label = /^[1-9]$/.test(S.num) ? "About this round" : S.id === "f" ? "About the final round" : "Before we start";
      if (FAC) explainNotes(s, label, S.explain);
      else explainSlides(label, S.explain, plain(S.nav));
    }
    // a beat with "portal": false (for example the game rules) stays out of the offline Portal deck
    S.beats.forEach((b) => {
      if (!FAC && b.portal === false) return;
      const n0 = pres.slides.length;
      (BLOCK[b.type] || (() => {}))(b);
      if (!b.explain) return;
      const label = b.type === "task" ? "About this job" : "Explained in full";
      if (FAC) explainNotes(pres.slides[n0], label, b.explain);
      else explainSlides(twoTone(plain(b.title)), b.explain, label);
    });
    const brk = C0.breaks["after-" + S.id];
    if (brk) {
      const s = pres.addSlide({ masterName: "Break", sectionTitle: sec });
      s.addText(brk.title, { placeholder: "title" });
      s.addText(brk.time + " · " + brk.mins + " minutes\n" + plain(brk.text), { placeholder: "body" });
    }
  });

  // ---------- the case file, one slide a section (the site shows it as a pop-up) ----------
  if (C0.caseFile) {
    sec = "Case file";
    pres.addSection({ title: sec });
    C0.caseFile.sections.forEach((cs) => {
      const s = content(twoTone(C0.caseFile.title, "· " + cs.title));
      let y = TOP;
      (cs.text || []).forEach((p) => { y += para(s, p, y, cs.table ? 13 : 15) + 0.1; });
      if (cs.facts) {
        const runs = cs.facts.map((f, i) => [{ text: f[0] + ": ", options: { bold: true, color: C.accent1 } }, { text: plain(f[1]), options: { color: C.text2, breakLine: i < cs.facts.length - 1, paraSpaceAfter: 6 } }]).flat();
        textBox(s, runs, MX, y + 0.1, CW, cs.facts.length * 0.36 + 0.2, { fontSize: 16 });
        y += cs.facts.length * 0.36 + 0.3;
      }
      if (cs.table) {
        const n = cs.table.cols.length, first = n === 3 ? 3.0 : 2.4, rest = (CW - first) / (n - 1);
        const head = (v) => ({ text: v, options: { bold: true, color: "FFFFFF", fill: { color: HEX.accent1 } } });
        s.addTable([cs.table.cols.map(head)].concat(cs.table.rows.map((r) => r.map((c, j) => ({ text: plain(c), options: j ? { color: C.text2 } : { bold: true, color: C.accent1, fill: { color: HEX.lt2 } } })))),
          { x: MX, y: y + 0.05, w: CW, colW: [first].concat(Array(n - 1).fill(rest)), fontSize: cs.table.rows.length > 8 ? 10 : 12, border: { type: "solid", pt: 0.75, color: HEX.accent3 }, margin: 0.05, valign: "middle" });
      }
    });
  }

  // ---------- closing ----------
  sec = "Close";
  pres.addSection({ title: sec });
  {
    const s = pres.addSlide({ masterName: "Title", sectionTitle: sec });
    s.addText("Thank you", { placeholder: "title" });
    s.addText("Keep the course site: your progress, the glossary and every activity stay there.", { placeholder: "body" });
    s.addText(C0.instructor, { placeholder: "credit" });
    artFrame(s, C0.art, 7.25, 1.55, 5.48, 3.65, "AI");
  }

  // ---------- appendix: assessment key (facilitator only) ----------
  if (FAC) {
    sec = "Appendix · Assessment";
    pres.addSection({ title: sec });
    const topicName = {}; A.topics.forEach((t) => { topicName[t.id] = t.name; });
    for (let i = 0; i < A.questions.length; i += 2) {
      const s = content(twoTone("Pre- and post-course check", "answer key"), "The same " + A.questions.length + " questions are used before and after. Correct answers are highlighted.");
      A.questions.slice(i, i + 2).forEach((q, j) => {
        const y = TOP + j * 2.65;
        textBox(s, [{ text: q.id + " · " + topicName[q.topic] + "   ", options: { bold: true, color: C.accent6, fontSize: 12 } }], MX, y, CW, 0.3);
        textBox(s, plain(q.q), MX, y + 0.3, CW, 0.75, { fontSize: 16, bold: true, color: C.dk1 || C.text1 });
        const gap = 0.2, cw = (CW - gap) / 2;
        q.options.forEach((o, k) => {
          const x = MX + (k % 2) * (cw + gap), yy = y + 1.05 + Math.floor(k / 2) * 0.62;
          const right = k === q.answer;
          s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: yy, w: cw, h: 0.54, fill: { color: right ? GOOD_BG : "FFFFFF" }, line: { color: right ? "BFE0CC" : HEX.accent3, width: 1 }, rectRadius: 0.08 });
          textBox(s, [{ text: LETTERS[k] + "  ", options: { bold: true, color: right ? HEX.accent4 : C.accent1 } }, { text: plain(o), options: { color: C.text2 } }], x + 0.15, yy, cw - 0.3, 0.54, { fontSize: 13, valign: "middle" });
        });
      });
    }
  }
  return pres;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const applyTheme = process.env.APPLY_THEME_JS ? require(process.env.APPLY_THEME_JS).applyTheme : null;
  for (const [edition, name] of [["portal", C0.fileTag + "-Portal.pptx"], ["facilitator", C0.fileTag + "-Facilitator.pptx"]]) {
    const pres = build(edition);
    const file = path.join(OUT, name);
    await pres.writeFile({ fileName: file });
    if (applyTheme) await applyTheme(file, THEME);
    console.log("wrote", path.relative(ROOT, file), pres.slides.length, "slides" + (applyTheme ? ", theme applied" : ", theme NOT applied (set APPLY_THEME_JS)"));
  }
})().catch((e) => { console.error(e); process.exit(1); });
