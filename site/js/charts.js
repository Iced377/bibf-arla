/* Charts drawn as SVG from data in course.js, for the presentation, the phones and the notes.
   A chart is { type, labels, series, points, ... }:
     type        "column" | "bar" | "line" | "scatter" | "pie"
     labels      category names (column, bar, line, pie)
     series      [{ name, values: [...] }] (column, bar, line; pie uses the first)
     points      [{ x, y, label }] (scatter)
     xLabel, yLabel   axis titles; unit is shown in the axis title, for example "minutes"
     yMin, yMax  force the value axis (a yMin above 0 cuts the axis, used for "fix the chart")
     values      false hides the numbers on bars and slices
     trend       true draws the least-squares line on a scatter
     quad        { x, y, xLow, xHigh, yLow, yHigh } draws the cross of a positioning map
     highlight   indexes (or point labels) picked out once the answer is revealed
   Charts.svg(chart, { shown, compact }) returns the markup. */
window.Charts = (function () {
  "use strict";
  var NAVY = "#16306F", BLUE = "#223E99", SOFT = "#6B7391", MUTED = "#ACB5CC", LINE = "#DFE4EF", INK = "#2A3354", GOOD = "#1D7A4E";
  var PALETTE = [NAVY, "#4C6BC0", "#8FA3D9", SOFT, "#C9A227", "#1D7A4E", "#9A6A12", MUTED];

  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function num(v, dec) {
    if (v == null || isNaN(v)) return "";
    var d = dec != null ? dec : (Math.abs(v) < 10 && v % 1 !== 0 ? 1 : 0);
    return Number(v).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  // round axis steps: 1, 2, 2.5 or 5 times a power of ten
  function niceTicks(lo, hi, count) {
    if (hi === lo) hi = lo + 1;
    var raw = (hi - lo) / Math.max(1, count), mag = Math.pow(10, Math.floor(Math.log10(raw))), step = mag;
    [1, 2, 2.5, 5, 10].some(function (m) { if (m * mag >= raw) { step = m * mag; return true; } return false; });
    var start = Math.floor(lo / step) * step, end = Math.ceil(hi / step) * step, out = [];
    for (var v = start; v <= end + step / 2; v += step) out.push(Math.round(v * 1e6) / 1e6);
    return out;
  }
  function isHi(c, i, label) {
    var h = c.highlight; if (!h) return false;
    return h.indexOf(i) >= 0 || (label != null && h.indexOf(label) >= 0);
  }
  function seriesColor(k, n) { return n === 1 ? NAVY : PALETTE[k % PALETTE.length]; }

  function frame(W, H, body, label) {
    return '<svg class="chart-svg" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(label || "") + '" preserveAspectRatio="xMidYMid meet" font-family="Inter, Arial, sans-serif">' + body + "</svg>";
  }
  function legend(c, x, y, fs) {
    if (!c.series || c.series.length < 2) return "";
    var out = "", cx = x;
    c.series.forEach(function (s, k) {
      out += '<rect x="' + cx + '" y="' + (y - fs + 2) + '" width="' + fs + '" height="' + fs + '" rx="2" fill="' + seriesColor(k, c.series.length) + '"/>' +
        '<text x="' + (cx + fs + 5) + '" y="' + y + '" font-size="' + fs + '" fill="' + INK + '">' + esc(s.name) + "</text>";
      cx += fs + 14 + String(s.name).length * fs * 0.55;
    });
    return out;
  }

  // column, bar and line share the value axis logic
  function valueAxis(c) {
    var all = []; (c.series || []).forEach(function (s) { s.values.forEach(function (v) { if (v != null) all.push(v); }); });
    var lo = c.yMin != null ? c.yMin : Math.min(0, Math.min.apply(null, all)), hi = c.yMax != null ? c.yMax : Math.max.apply(null, all);
    var ticks = niceTicks(lo, hi, 5);
    if (c.yMin != null) ticks = ticks.filter(function (t) { return t >= c.yMin; });
    if (c.yMax != null) ticks = ticks.filter(function (t) { return t <= c.yMax; });
    return { lo: c.yMin != null ? c.yMin : ticks[0], hi: c.yMax != null ? c.yMax : ticks[ticks.length - 1], ticks: ticks };
  }

  function columns(c, o) {
    var W = o.W, H = o.H, fs = o.fs, n = c.labels.length, k = c.series.length;
    var L = fs * 4.2, R = 12, T = fs * 2.2, B = fs * 3.4;
    var ax = valueAxis(c), pw = W - L - R, ph = H - T - B;
    var y = function (v) { return T + ph - (Math.max(ax.lo, Math.min(ax.hi, v)) - ax.lo) / (ax.hi - ax.lo) * ph; };
    var band = pw / n, bw = Math.min(band * 0.72 / k, fs * 4), out = "";
    ax.ticks.forEach(function (t) {
      out += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(t) + '" y2="' + y(t) + '" stroke="' + LINE + '"/>' +
        '<text x="' + (L - 6) + '" y="' + (y(t) + fs * 0.35) + '" font-size="' + fs * 0.85 + '" fill="' + SOFT + '" text-anchor="end">' + num(t) + "</text>";
    });
    var showVals = c.values !== false && n * k <= 16;
    c.labels.forEach(function (lab, i) {
      var x0 = L + band * i + (band - bw * k) / 2;
      c.series.forEach(function (s, j) {
        var v = s.values[i]; if (v == null) return;
        var hi = o.shown && isHi(c, i, lab), dim = o.shown && c.highlight && !hi;
        var col = hi ? GOOD : dim ? MUTED : seriesColor(j, k), yy = y(v), base = y(Math.max(ax.lo, 0));
        out += '<rect x="' + (x0 + bw * j) + '" y="' + Math.min(yy, base) + '" width="' + (bw - 2) + '" height="' + Math.max(1, Math.abs(base - yy)) + '" rx="2" fill="' + col + '"/>';
        if (showVals) out += '<text x="' + (x0 + bw * j + bw / 2 - 1) + '" y="' + (yy - 5) + '" font-size="' + fs * 0.8 + '" fill="' + (hi ? GOOD : INK) + '" text-anchor="middle" font-weight="' + (hi ? 700 : 500) + '">' + num(v, c.decimals) + "</text>";
      });
      out += xLabel(lab, L + band * i + band / 2, H - B + fs * 1.3, fs, band, n);
    });
    out += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + (T + ph) + '" y2="' + (T + ph) + '" stroke="' + SOFT + '"/>';
    return out + axisTitles(c, o, L, T, pw, ph) + legend(c, L, fs * 1.1, fs * 0.85);
  }
  // a category label under the axis, wrapped onto two lines when long
  function xLabel(lab, x, y, fs, band, n) {
    var s = String(lab), size = fs * (n > 8 ? 0.72 : 0.82), max = Math.max(4, Math.floor(band / (size * 0.56)));
    if (s.length <= max) return '<text x="' + x + '" y="' + y + '" font-size="' + size + '" fill="' + INK + '" text-anchor="middle">' + esc(s) + "</text>";
    var cut = s.lastIndexOf(" ", max); if (cut < 1) cut = max;
    return '<text x="' + x + '" y="' + y + '" font-size="' + size + '" fill="' + INK + '" text-anchor="middle">' + esc(s.slice(0, cut)) +
      '<tspan x="' + x + '" dy="' + size * 1.15 + '">' + esc(s.slice(cut).trim().slice(0, max)) + "</tspan></text>";
  }
  function axisTitles(c, o, L, T, pw, ph) {
    var out = "", fs = o.fs * 0.8;
    if (c.yLabel) out += '<text x="' + 2 + '" y="' + (T - o.fs * 0.9) + '" font-size="' + fs + '" fill="' + SOFT + '">' + esc(c.yLabel) + "</text>";
    if (c.xLabel) out += '<text x="' + (L + pw) + '" y="' + (o.H - 4) + '" font-size="' + fs + '" fill="' + SOFT + '" text-anchor="end">' + esc(c.xLabel) + "</text>";
    return out;
  }

  function bars(c, o) {
    var W = o.W, fs = o.fs, n = c.labels.length, rowH = fs * 2.1, T = fs * 1.6, B = fs * 2.2;
    var H = Math.max(o.H * 0.6, T + B + rowH * n);
    var longest = Math.max.apply(null, c.labels.map(function (l) { return String(l).length; }));
    var L = Math.min(W * 0.38, fs * 0.55 * longest + 12), R = fs * 4;
    var ax = valueAxis(c), pw = W - L - R;
    var x = function (v) { return L + (Math.max(ax.lo, Math.min(ax.hi, v)) - ax.lo) / (ax.hi - ax.lo) * pw; };
    var out = "";
    ax.ticks.forEach(function (t) { out += '<line x1="' + x(t) + '" x2="' + x(t) + '" y1="' + T + '" y2="' + (H - B) + '" stroke="' + LINE + '"/><text x="' + x(t) + '" y="' + (H - B + fs * 1.2) + '" font-size="' + fs * 0.8 + '" fill="' + SOFT + '" text-anchor="middle">' + num(t) + "</text>"; });
    c.labels.forEach(function (lab, i) {
      var v = c.series[0].values[i], yy = T + rowH * i + rowH * 0.15, hi = o.shown && isHi(c, i, lab), dim = o.shown && c.highlight && !hi;
      out += '<text x="' + (L - 8) + '" y="' + (yy + rowH * 0.45) + '" font-size="' + fs * 0.85 + '" fill="' + INK + '" text-anchor="end">' + esc(lab) + "</text>" +
        '<rect x="' + x(Math.max(ax.lo, 0)) + '" y="' + yy + '" width="' + Math.max(1, x(v) - x(Math.max(ax.lo, 0))) + '" height="' + rowH * 0.7 + '" rx="2" fill="' + (hi ? GOOD : dim ? MUTED : NAVY) + '"/>';
      if (c.values !== false) out += '<text x="' + (x(v) + 6) + '" y="' + (yy + rowH * 0.45) + '" font-size="' + fs * 0.8 + '" fill="' + (hi ? GOOD : INK) + '" font-weight="' + (hi ? 700 : 500) + '">' + num(v, c.decimals) + "</text>";
    });
    if (c.xLabel) out += '<text x="' + (L + pw) + '" y="' + (H - 4) + '" font-size="' + fs * 0.8 + '" fill="' + SOFT + '" text-anchor="end">' + esc(c.xLabel) + "</text>";
    return { body: out, H: H };
  }

  function lines(c, o) {
    var W = o.W, H = o.H, fs = o.fs, n = c.labels.length, k = c.series.length;
    var L = fs * 4.2, R = fs * 1.2, T = fs * 2.2, B = fs * 3;
    var ax = valueAxis(c), pw = W - L - R, ph = H - T - B;
    var y = function (v) { return T + ph - (Math.max(ax.lo, Math.min(ax.hi, v)) - ax.lo) / (ax.hi - ax.lo) * ph; };
    var x = function (i) { return L + (n === 1 ? pw / 2 : pw * i / (n - 1)); };
    var out = "", every = n > 12 ? 2 : 1;
    ax.ticks.forEach(function (t) { out += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(t) + '" y2="' + y(t) + '" stroke="' + LINE + '"/><text x="' + (L - 6) + '" y="' + (y(t) + fs * 0.35) + '" font-size="' + fs * 0.85 + '" fill="' + SOFT + '" text-anchor="end">' + num(t) + "</text>"; });
    c.labels.forEach(function (lab, i) { if (i % every === 0) out += '<text x="' + x(i) + '" y="' + (H - B + fs * 1.3) + '" font-size="' + fs * 0.75 + '" fill="' + INK + '" text-anchor="middle">' + esc(lab) + "</text>"; });
    c.series.forEach(function (s, j) {
      var col = seriesColor(j, k), pts = [];
      s.values.forEach(function (v, i) { if (v != null) pts.push(x(i) + "," + y(v)); });
      out += '<polyline points="' + pts.join(" ") + '" fill="none" stroke="' + col + '" stroke-width="' + (fs * 0.22) + '" stroke-linejoin="round"/>';
      s.values.forEach(function (v, i) {
        if (v == null) return;
        var hi = o.shown && isHi(c, i, c.labels[i]);
        out += '<circle cx="' + x(i) + '" cy="' + y(v) + '" r="' + (hi ? fs * 0.5 : fs * 0.25) + '" fill="' + (hi ? GOOD : col) + '"/>';
        // a value at either end is anchored inwards so it is never cut off by the edge of the chart
        if (hi) out += '<text x="' + x(i) + '" y="' + (y(v) - fs * 0.8) + '" font-size="' + fs * 0.85 + '" fill="' + GOOD + '" font-weight="700" text-anchor="' + (i === n - 1 && n > 1 ? "end" : i === 0 && n > 1 ? "start" : "middle") + '">' + num(v, c.decimals) + "</text>";
      });
    });
    out += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + (T + ph) + '" y2="' + (T + ph) + '" stroke="' + SOFT + '"/>';
    return out + axisTitles(c, o, L, T, pw, ph) + legend(c, L, fs * 1.1, fs * 0.85);
  }

  function scatter(c, o) {
    var W = o.W, H = o.H, fs = o.fs, pts = c.points;
    var L = fs * 4.2, R = fs * 1.5, T = fs * 2, B = fs * 3;
    var xs = pts.map(function (p) { return p.x; }), ys = pts.map(function (p) { return p.y; });
    var xt = niceTicks(c.xMin != null ? c.xMin : Math.min.apply(null, xs), c.xMax != null ? c.xMax : Math.max.apply(null, xs), 5);
    var yt = niceTicks(c.yMin != null ? c.yMin : Math.min.apply(null, ys), c.yMax != null ? c.yMax : Math.max.apply(null, ys), 5);
    var x0 = xt[0], x1 = xt[xt.length - 1], y0 = yt[0], y1 = yt[yt.length - 1], pw = W - L - R, ph = H - T - B;
    var X = function (v) { return L + (v - x0) / (x1 - x0) * pw; }, Y = function (v) { return T + ph - (v - y0) / (y1 - y0) * ph; };
    var out = "", q = c.quad;
    if (q) {
      // positioning map: a cross through the middle, the ends of each axis named
      out += '<line x1="' + X(q.x) + '" x2="' + X(q.x) + '" y1="' + T + '" y2="' + (T + ph) + '" stroke="' + SOFT + '"/><line x1="' + L + '" x2="' + (L + pw) + '" y1="' + Y(q.y) + '" y2="' + Y(q.y) + '" stroke="' + SOFT + '"/>' +
        '<text x="' + (L + 2) + '" y="' + (Y(q.y) - 6) + '" font-size="' + fs * 0.8 + '" fill="' + SOFT + '">' + esc(q.xLow) + "</text>" +
        '<text x="' + (L + pw - 2) + '" y="' + (Y(q.y) - 6) + '" font-size="' + fs * 0.8 + '" fill="' + SOFT + '" text-anchor="end">' + esc(q.xHigh) + "</text>" +
        '<text x="' + (X(q.x) + 6) + '" y="' + (T + ph - 4) + '" font-size="' + fs * 0.8 + '" fill="' + SOFT + '">' + esc(q.yLow) + "</text>" +
        '<text x="' + (X(q.x) + 6) + '" y="' + (T + fs * 0.4) + '" font-size="' + fs * 0.8 + '" fill="' + SOFT + '">' + esc(q.yHigh) + "</text>";
    } else {
      yt.forEach(function (t) { out += '<line x1="' + L + '" x2="' + (L + pw) + '" y1="' + Y(t) + '" y2="' + Y(t) + '" stroke="' + LINE + '"/><text x="' + (L - 6) + '" y="' + (Y(t) + fs * 0.35) + '" font-size="' + fs * 0.85 + '" fill="' + SOFT + '" text-anchor="end">' + num(t) + "</text>"; });
      xt.forEach(function (t) { out += '<text x="' + X(t) + '" y="' + (T + ph + fs * 1.3) + '" font-size="' + fs * 0.85 + '" fill="' + SOFT + '" text-anchor="middle">' + num(t) + "</text>"; });
      out += '<line x1="' + L + '" x2="' + (L + pw) + '" y1="' + (T + ph) + '" y2="' + (T + ph) + '" stroke="' + SOFT + '"/><line x1="' + L + '" x2="' + L + '" y1="' + T + '" y2="' + (T + ph) + '" stroke="' + SOFT + '"/>';
      out += axisTitles(c, o, L, T, pw, ph);
    }
    if (c.trend && pts.length > 1) {
      var mx = xs.reduce(function (a, b) { return a + b; }, 0) / xs.length, my = ys.reduce(function (a, b) { return a + b; }, 0) / ys.length, sxy = 0, sxx = 0;
      pts.forEach(function (p) { sxy += (p.x - mx) * (p.y - my); sxx += (p.x - mx) * (p.x - mx); });
      var b = sxx ? sxy / sxx : 0, a = my - b * mx, lx = Math.min.apply(null, xs), hx = Math.max.apply(null, xs);
      out += '<line x1="' + X(lx) + '" y1="' + Y(a + b * lx) + '" x2="' + X(hx) + '" y2="' + Y(a + b * hx) + '" stroke="' + BLUE + '" stroke-width="2" stroke-dasharray="6 4"/>';
    }
    pts.forEach(function (p, i) {
      var hi = o.shown && isHi(c, i, p.label), dim = o.shown && c.highlight && !hi;
      out += '<circle cx="' + X(p.x) + '" cy="' + Y(p.y) + '" r="' + (p.label ? fs * 0.45 : fs * 0.32) + '" fill="' + (hi ? GOOD : dim ? MUTED : NAVY) + '" fill-opacity="' + (p.label ? 1 : 0.75) + '"/>';
      if (p.label) out += '<text x="' + (X(p.x) + fs * 0.7) + '" y="' + (Y(p.y) + fs * 0.35) + '" font-size="' + fs * 0.82 + '" fill="' + (hi ? GOOD : INK) + '" font-weight="' + (hi ? 700 : 500) + '">' + esc(p.label) + "</text>";
    });
    return out;
  }

  function pie(c, o) {
    var W = o.W, H = o.H, fs = o.fs, vals = c.series[0].values, total = vals.reduce(function (a, b) { return a + b; }, 0);
    var r = Math.min(H * 0.42, W * 0.22), cx = r + fs, cy = H / 2, a0 = -Math.PI / 2, out = "";
    vals.forEach(function (v, i) {
      var a1 = a0 + 2 * Math.PI * v / total, large = a1 - a0 > Math.PI ? 1 : 0;
      var hi = o.shown && isHi(c, i, c.labels[i]), col = hi ? GOOD : PALETTE[i % PALETTE.length];
      out += '<path d="M' + cx + "," + cy + " L" + (cx + r * Math.cos(a0)) + "," + (cy + r * Math.sin(a0)) + " A" + r + "," + r + " 0 " + large + " 1 " + (cx + r * Math.cos(a1)) + "," + (cy + r * Math.sin(a1)) + ' Z" fill="' + col + '" stroke="#fff" stroke-width="2"/>';
      a0 = a1;
    });
    // the legend lists every slice with its share
    var lx = cx + r + fs * 2, ly = Math.max(fs * 1.5, cy - vals.length * fs * 0.8);
    vals.forEach(function (v, i) {
      var hi = o.shown && isHi(c, i, c.labels[i]);
      out += '<rect x="' + lx + '" y="' + (ly + i * fs * 1.6 - fs * 0.85) + '" width="' + fs + '" height="' + fs + '" rx="2" fill="' + (hi ? GOOD : PALETTE[i % PALETTE.length]) + '"/>' +
        '<text x="' + (lx + fs * 1.5) + '" y="' + (ly + i * fs * 1.6) + '" font-size="' + fs * 0.85 + '" fill="' + INK + '" font-weight="' + (hi ? 700 : 500) + '">' + esc(c.labels[i]) + (c.values === false ? "" : " · " + Math.round(100 * v / total) + "%") + "</text>";
    });
    return out;
  }

  function svg(c, opts) {
    if (!c) return "";
    opts = opts || {};
    var o = { shown: !!opts.shown, W: opts.compact ? 420 : 720, H: opts.compact ? 300 : 380, fs: opts.compact ? 15 : 15 };
    var body, H = o.H;
    if (c.type === "bar") { var r = bars(c, o); body = r.body; H = r.H; }
    else if (c.type === "line") body = lines(c, o);
    else if (c.type === "scatter") body = scatter(c, o);
    else if (c.type === "pie") body = pie(c, o);
    else body = columns(c, o);
    return '<figure class="chart' + (opts.compact ? " compact" : "") + '">' + (c.title ? '<figcaption>' + esc(c.title) + "</figcaption>" : "") + frame(o.W, H, body, c.title) +
      (c.source ? '<p class="chart-src">' + esc(c.source) + "</p>" : "") + "</figure>";
  }
  return { svg: svg, niceTicks: niceTicks };
})();
