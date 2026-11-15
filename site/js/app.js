/* Course engine. Renders window.COURSE. The instructor page also loads window.NOTES (facilitator notes and timetable).
   Reveals, scores and the timer are saved in the browser and shared between open windows. */
(function () {
  "use strict";

  // ---------- interface words (js/i18n.js) ----------
  var STR = window.UI_STRINGS || {};
  function t(k, v) {
    var s = STR[k] != null ? STR[k] : k;
    return v ? String(s).replace(/\{(\w+)\}/g, function (m, x) { return v[x] != null ? v[x] : m; }) : s;
  }
  function t2(k) { var p = t(k).split("|"); return title2(p[0], p[1] || ""); }
  var C = window.COURSE;
  var N = window.NOTES || null;
  var EDITION = N ? "instructor" : "audience";
  var NOTESVIEW = !!(N && /[?&]notes\b/.test(location.search));
  if (NOTESVIEW) document.body.classList.add("notes-view");
  var LIVE = null;   // live play (js/live.js), set up just before the first render
  var app = document.getElementById("app");
  var LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
  var SECTIONS = C.sections;
  var BEATS = {};
  SECTIONS.forEach(function (s) { s.beats.forEach(function (b) { b.section = s.id; BEATS[b.id] = b; }); });

  // ---------- state, saved per browser and shared between windows ----------
  var KEY = "arla.v1";
  function freshST() { return { teams: C.teams.map(function (n) { return { name: n, score: 0 }; }), ui: {}, timer: null, scoresOpen: false }; }
  var ST = freshST();
  try { var raw = localStorage.getItem(KEY); if (raw) ST = Object.assign(ST, JSON.parse(raw)); } catch (e) { /* storage unavailable */ }
  var ME = Math.random().toString(36).slice(2);
  var bc = null;
  try { bc = new BroadcastChannel("arla"); } catch (e) { bc = null; }

  function save() { try { localStorage.setItem(KEY, JSON.stringify(ST)); } catch (e) { /* ignore */ } }
  function send(msg) { if (NOTESVIEW) return; msg.from = ME; if (bc) { try { bc.postMessage(msg); } catch (e) { /* ignore */ } } }
  function commit(what) { save(); send({ kind: "state", state: ST, what: what || null }); if (LIVE) LIVE.onCommit(what || null); }
  function ui(id) { if (!ST.ui[id]) ST.ui[id] = {}; return ST.ui[id]; }

  function receive(msg) {
    if (!msg || msg.from === ME) return;
    if (msg.kind === "state") {
      ST = msg.state; save();
      applyState(msg.what);
    }
  }
  if (bc) bc.onmessage = function (e) { receive(e.data); };
  // Fallback for browsers without BroadcastChannel: the storage event fires in the other windows.
  window.addEventListener("storage", function (e) {
    if (bc || e.key !== KEY || !e.newValue) return;
    try { ST = JSON.parse(e.newValue); applyState(null); } catch (x) { /* ignore */ }
  });

  function applyState(what) {
    renderScores(); renderTimer();
    if (what && BEATS[what]) refreshBeat(what);
    else if (what === "teams") refreshTeamViews();
    else if (what === "focus") { if (NOTESVIEW) followFocus(true); }
    else if (!what) { route(); if (NOTESVIEW) followFocus(false); }
  }

  // ---------- helpers ----------
  function h(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  // Plain text with [[key]] or [[key|shown text]] glossary markers.
  function T(s) {
    return h(s).replace(/\[\[([a-z0-9]+)(?:\|([^\]]+))?\]\]/g, function (m, key, shown) {
      var g = C.glossary[key];
      if (!g) return shown || key;
      return '<button type="button" class="term" data-term="' + key + '">' + (shown || h(g.term)) + "</button>";
    });
  }
  // Same markers shown as plain text, for places that are already a button (the flip cards).
  function P(s) {
    return h(s).replace(/\[\[([a-z0-9]+)(?:\|([^\]]+))?\]\]/g, function (m, key, shown) {
      var g = C.glossary[key]; return shown || (g ? h(g.term) : key);
    });
  }
  function hash(str) { var x = 2166136261; for (var i = 0; i < str.length; i++) { x ^= str.charCodeAt(i); x = Math.imul(x, 16777619); } return x >>> 0; }
  function shuffledIdx(n, seed) {
    var a = []; for (var i = 0; i < n; i++) a.push({ i: i, k: hash(seed + ":" + i) });
    a.sort(function (p, q) { return p.k - q.k; });
    // never leave the list already in order
    if (a.every(function (x, j) { return x.i === j; })) a.reverse();
    return a.map(function (x) { return x.i; });
  }
  function title2(a, b) { return h(a) + (b ? ' <span class="accent">' + h(b) + "</span>" : ""); }
  function reduced() { return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
  function toast(msg) {
    var t = document.getElementById("toast"); t.textContent = msg; t.classList.add("on");
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove("on"); }, 2000);
  }
  function copy(text, label) {
    function fallback() {
      var ta = document.createElement("textarea"); ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); toast(t("copied", { label: label || t("lblText") })); } catch (e) { toast(t("selectCopy")); }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast(t("copied", { label: label || t("lblText") })); }, fallback);
    } else fallback();
  }
  function sectionById(id) { return SECTIONS.filter(function (s) { return s.id === id; })[0]; }
  function sectionIndex(id) { for (var i = 0; i < SECTIONS.length; i++) if (SECTIONS[i].id === id) return i; return -1; }
  function note(text) { return text ? '<div class="inote"><b>Facilitator</b><p>' + T(text) + "</p></div>" : ""; }
  function beatNote(b) { return N && N.sections[b.section] && N.sections[b.section].beats ? note(N.sections[b.section].beats[b.id]) : ""; }
  function nav(i, n, act, id) {
    return '<div class="stepper"><button class="btn ghost small" data-act="' + act + '" data-id="' + id + '" data-dir="-1" ' + (i <= 0 ? "disabled" : "") + ' type="button">' + t("prev") + "</button>" +
      '<span class="count">' + t("nOfM", { i: i + 1, n: n }) + "</span>" +
      '<button class="btn ghost small" data-act="' + act + '" data-id="' + id + '" data-dir="1" ' + (i >= n - 1 ? "disabled" : "") + ' type="button">' + t("next") + "</button></div>";
  }
  function timerBtn(mins, label, secs) {
    var s = secs || mins * 60;
    return '<button class="btn small" type="button" data-act="timer" data-secs="' + s + '" data-label="' + h(label || "") + '">' + (secs ? t("timerSec", { n: secs }) : t("timerMin", { n: mins })) + "</button>";
  }

  // ---------- the learner's own progress: this device only, never shared between windows ----------
  var LKEY = "arla.learner";
  var L = { name: "", done: {}, pre: null, post: null, draft: { pre: {}, post: {} } };
  try { var lraw = localStorage.getItem(LKEY); if (lraw) L = Object.assign(L, JSON.parse(lraw)); } catch (e) { /* storage unavailable */ }
  L.draft = L.draft || { pre: {}, post: {} };
  L.done = L.done || {};
  function saveL() { try { localStorage.setItem(LKEY, JSON.stringify(L)); } catch (e) { /* ignore */ } updateProgress(); }
  var A = C.assessment;
  // the answer key for the checks is only loaded by the instructor page (instructor/key.js)
  if (window.ASSESSMENT_KEY) A.questions.forEach(function (q) { var k = window.ASSESSMENT_KEY[q.id]; if (k) { q.answer = k.answer; q.why = k.why; } });
  var ART = (EDITION === "instructor" ? "../" : "") + "assets/art/";

  function checkScore(res) {
    var by = {}, right = 0;
    A.topics.forEach(function (t) { by[t.id] = { right: 0, total: 0 }; });
    A.questions.forEach(function (q) {
      by[q.topic].total++;
      if (res && res.answers && res.answers[q.id] === q.answer) { right++; by[q.topic].right++; }
    });
    return { right: right, total: A.questions.length, pct: Math.round(100 * right / A.questions.length), by: by };
  }
  function isRound(s) { return /^[1-9]$/.test(s.num); }
  function progressItems() {
    var items = [{ id: "pre", label: A.pre.title, done: !!L.pre, href: "#/pre" }];
    SECTIONS.forEach(function (s) {
      items.push({ id: s.id, label: (isRound(s) ? t("roundN", { n: s.num }) + " · " : "") + s.title + " " + s.titleAccent, done: !!L.done[s.id], href: "#/s/" + s.id });
    });
    items.push({ id: "post", label: A.post.title, done: !!L.post, href: "#/post" });
    return items;
  }
  function updateProgress() {
    var items = progressItems(), n = items.filter(function (x) { return x.done; }).length;
    var pct = Math.round(100 * n / items.length);
    var bar = document.getElementById("progressBar"), lab = document.getElementById("progressLabel");
    if (bar) bar.style.width = pct + "%";
    if (lab) lab.textContent = pct + "%";
    document.querySelectorAll("[data-navid]").forEach(function (a) { a.classList.toggle("done", !N && !!L.done[a.getAttribute("data-navid")]); });
  }
  // teams take their names from C.teams (Team 1, Team 2 if it has none). On a solo course (C.solo) each slot is one person: it shows their name
  function teamName(i) {
    var nm = C.solo && LIVE && LIVE.slotName ? LIVE.slotName(i + 1) : (!C.solo && C.teams && C.teams[i]) || "";
    return nm || t("teamN", { n: i + 1 });
  }
  // a solo course lists only the slots someone sits in
  function slotShown(i) { return !C.solo || !!(LIVE && LIVE.slotName && LIVE.slotName(i + 1)); }
  function artHTML(name, cls) {
    return name ? '<div class="' + cls + '"><img src="' + ART + name + '.webp" alt="" onerror="this.parentNode.remove()"></div>' : "";
  }
  function participantURL(which) {
    var path = location.pathname.replace(/instructor\/(index\.html)?$/, "").replace(/index\.html$/, "");
    return (location.protocol === "file:" ? "file://" : location.origin) + path + "#/" + which;
  }
  function splitTitle(t) { var i = t.lastIndexOf(" "); return i < 0 ? [t, ""] : [t.slice(0, i), t.slice(i + 1)]; }

  // Topic bars: starting point and end of day, per round of the brief.
  function topicBars(pre, post) {
    return '<div class="tbars">' + A.topics.map(function (tp) {
      var a = pre ? pre.by[tp.id] : null, b = post ? post.by[tp.id] : null;
      function bar(x, cls, label) {
        return x ? '<div class="tb-row"><span class="tb-lab">' + label + '</span><span class="tb-track"><i class="' + cls + '" style="width:' + Math.round(100 * x.right / x.total) + '%"></i></span><span class="tb-val">' + x.right + "/" + x.total + "</span></div>" : "";
      }
      return '<div class="tb"><h3>' + h(tp.name) + "</h3>" + bar(a, "pre", t("barStart")) + bar(b, "post", t("barEnd")) + "</div>";
    }).join("") + "</div>";
  }

  // ---------- pre- and post-course check ----------
  function scoresHTML(sc) {
    var g = sc.pre == null ? null : sc.post - sc.pre;
    return '<div class="facts res-top">' +
      (sc.pre == null ? "" : '<div class="fact"><b>' + sc.pre + " / " + sc.total + "</b><span>" + t("startScore") + "</span></div>") +
      '<div class="fact"><b>' + sc.post + " / " + sc.total + "</b><span>" + t("scoreNow") + "</span></div>" +
      (g == null ? "" : '<div class="fact"><b>' + (g > 0 ? "+" : "") + g + "</b><span>" + t("sinceMorning") + "</span></div>") +
      '</div><div class="callout"><p>' + t("ckScoresNote") + "</p></div>";
  }
  var postAskedAt = 0;   // one request at a time for the post-course scores
  // a check counts only when the server confirms it; until then the phone keeps sending it
  var resendAt = {};
  function confirmed(which, r) {
    if (!r || !r.ok || !L[which]) return;
    var was = L[which].sent; L[which].sent = true; saveL();
    if (which === "post") gotScores(r);
    if (was !== true && new RegExp("^#/" + which).test(location.hash)) renderCheck(which);
  }
  function resendChecks() {
    if (!LIVE || !LIVE.enabled()) return;
    ["pre", "post"].forEach(function (w) {
      if (!L[w] || L[w].sent === true || Date.now() - (resendAt[w] || 0) < 8000) return;
      resendAt[w] = Date.now();
      LIVE.check(w, L.name || LIVE.myName() || "", L[w].answers).then(function (r) { confirmed(w, r); });
    });
  }
  function gotScores(r) {
    if (!r || r.post == null) return;
    L.scores = { pre: r.pre, post: r.post, total: r.total }; saveL();
    if (/^#\/post/.test(location.hash)) renderCheck("post");
  }
  function renderCheck(which) {
    renderNav(which);
    var meta = A[which], tt = splitTitle(meta.title);
    var html = '<section class="dayhero"><div class="wrap narrow"><h1>' + title2(tt[0], tt[1]) + '</h1><div class="rule"></div>';
    if (L[which]) {
      // the pre-course check stays blind; after the post-course check each person sees their own two scores (never the answers)
      var sc = which === "post" ? L.scores : null, live = LIVE && LIVE.enabled(), pending = live && L[which].sent !== true;
      if (pending) resendChecks();
      app.innerHTML = html + (sc ? scoresHTML(sc) : '<div class="callout' + (pending ? " warn" : "") + '"><p>' + t(pending ? "ckSending" : which === "post" && live ? "ckScoresWait" : "checkSaved") + "</p></div>") +
        '<div class="actions"><a class="btn" href="' + (live ? "#/play" : "#/") + '">' + t("lvBackToGame") + "</a></div></div></section>";
      if (which === "post" && !sc && live && Date.now() - postAskedAt > 10000) { postAskedAt = Date.now(); LIVE.check("post", L.name || LIVE.myName(), L.post.answers).then(gotScores); }
      return;
    }
    var d = L.draft[which] || {}, answered = Object.keys(d).length;
    html += '<p class="lede">' + h(meta.lede) + "</p>";
    if (which === "post" && !L.pre) html += '<div class="callout warn"><p>' + h(t("noPreWarn")) + "</p></div>";
    var liveName = LIVE && LIVE.myName();
    html += liveName ? '<input id="ckName" type="hidden" value="' + h(liveName) + '"><p class="hint">' + h(liveName) + "</p>"
      : '<label class="namefield" for="ckName">' + t("nameLabel") + '<input id="ckName" type="text" autocomplete="name" maxlength="60" value="' + h(L.name) + '" placeholder="' + h(t("namePh")) + '"></label>';
    A.questions.forEach(function (q, k) {
      html += '<div class="cq" id="q-' + q.id + '"><p class="cq-n">' + t("questionNofM", { i: k + 1, n: A.questions.length }) + '</p><p class="cq-q">' + T(q.q) + '</p><div class="cq-opts">' +
        q.options.map(function (o, i) {
          var on = d[q.id] === i;
          return '<button type="button" class="cq-opt' + (on ? " sel" : "") + '" data-act="ans" data-which="' + which + '" data-q="' + q.id + '" data-i="' + i + '" aria-pressed="' + on + '"><span class="L">' + LETTERS[i] + "</span><span>" + P(o) + "</span></button>";
        }).join("") + "</div></div>";
    });
    html += '<div class="submitbar"><span id="ckCount">' + t("answered", { a: answered, n: A.questions.length }) + '</span><button class="btn" type="button" data-act="submitcheck" data-which="' + which + '">' + t("submit") + "</button></div>";
    app.innerHTML = html + "</div></section>";
  }

  // ---------- my progress ----------
  function renderProgress() {
    renderNav("progress");
    var pre = L.pre ? checkScore(L.pre) : null, post = L.post ? checkScore(L.post) : null;
    var items = progressItems(), n = items.filter(function (x) { return x.done; }).length;
    var html = '<section class="dayhero"><div class="wrap"><h1>' + t2("progressTitle") + '</h1><div class="rule"></div>';
    html += '<p class="lede">' + t("progressLede") + "</p>";
    html += '<div class="facts n4">';
    html += '<div class="fact"><b>' + Math.round(100 * n / items.length) + '%</b><span>' + t("ofDay") + "</span><small>" + t("stepsN", { a: n, n: items.length }) + "</small></div>";
    html += '<div class="fact"><b>' + (pre ? pre.right + " / " + pre.total : "–") + '</b><span>' + t("preCheck") + "</span><small>" + (pre ? pre.pct + "%" : t("notYet")) + "</small></div>";
    html += '<div class="fact"><b>' + (post ? post.right + " / " + post.total : "–") + '</b><span>' + t("postCheck") + "</span><small>" + (post ? post.pct + "%" : t("notYet")) + "</small></div>";
    html += '<div class="fact"><b>' + (pre && post ? (post.right - pre.right > 0 ? "+" : "") + (post.right - pre.right) : "–") + '</b><span>' + t("gain") + "</span><small>" + (pre && post ? t("gainNote") : t("gainWait")) + "</small></div></div>";
    if (pre || post) html += '<h2 class="mt-l">' + t("byRound") + "</h2>" + topicBars(pre, post);
    html += '<h2 class="mt-l">' + t("dayStepByStep") + '</h2><ol class="steplist">' + items.map(function (it) {
      return '<li class="' + (it.done ? "done" : "") + '"><span class="sl-mark">' + (it.done ? "✓" : "") + '</span><a href="' + it.href + '">' + h(it.label) + '</a><span class="sl-state">' + (it.done ? t("done") : t("open")) + "</span></li>";
    }).join("") + "</ol>";
    html += '<div class="actions">' + (pre ? "" : '<a class="btn" href="#/pre">' + t("takePre") + "</a>") +
      (EDITION === "instructor" ? '<button class="btn ghost small" type="button" data-act="resetlearner" id="resetLearner">' + t("resetLearner") + "</button>" : "") + "</div>";
    app.innerHTML = html + "</div></section>";
  }

  // ---------- top bar ----------
  function renderNav(active) {
    var lv = LIVE ? LIVE.navLinks(active) : "";
    if (EDITION === "audience" && LIVE && LIVE.enabled()) { document.getElementById("daynav").innerHTML = lv; return; }
    var html = (EDITION === "audience" ? lv : "") + '<a href="#/" class="' + (active === "home" ? "on" : "") + '">' + t("home") + "</a>";
    SECTIONS.forEach(function (s) {
      html += '<a href="#/s/' + s.id + '" data-navid="' + s.id + '" class="' + (active === s.id ? "on" : "") + (!N && L.done[s.id] ? " done" : "") + '">' + (isRound(s) ? s.num + " · " : "") + h(s.nav) + "</a>";
    });
    if (!N) html += '<a href="#/progress" class="' + (active === "progress" ? "on" : "") + '">' + t("myProgress") + "</a>";
    if (EDITION === "instructor") html += lv;
    document.getElementById("daynav").innerHTML = html;
  }

  // ---------- home ----------
  function renderHome() {
    renderNav("home");
    var html = '<section class="hero"><div class="wrap hero-flex"><div class="hero-text">';
    html += "<h1>" + title2(C.title, C.titleAccent) + '</h1><div class="rule"></div>';
    html += '<p class="lede">' + T(C.lede) + "</p>";
    html += '<p class="byline"><strong>' + h(C.instructor) + "</strong><br>" + h(C.program) + "<br>" + h(C.when) + "</p>";
    html += '<div class="cta-row"><a class="btn" href="#/s/k0">' + t("startGame") + "</a>" + (N ? '<a class="btn ghost" href="#/live">' + t("lvNav") + "</a>" : '<a class="btn ghost" href="#/progress">' + t("myProgress") + "</a>") + "</div>";
    html += "</div>" + artHTML(C.art, "hero-art") + "</div></section>";

    var pre = L.pre ? checkScore(L.pre) : null, post = L.post ? checkScore(L.post) : null;
    var rdone = SECTIONS.filter(function (s) { return L.done[s.id]; }).length;
    function statusCard(tl, v, n, href, cta) {
      return '<a class="status-card" href="' + href + '"><span class="st-t">' + h(tl) + "</span><b>" + h(v) + "</b><small>" + h(n) + '</small><span class="st-cta">' + h(cta) + " " + t("fwd") + "</span></a>";
    }
    var gainTxt = post ? (pre ? t("sinceStart", { g: (post.right - pre.right > 0 ? "+" : "") + (post.right - pre.right) }) : t("noPreHere")) : t("takeAtEnd");
    if (!N) html += '<section class="band"><div class="wrap"><h2>' + t2("daySoFar") + '</h2><div class="status-cards">' +
      statusCard(A.pre.title, pre ? pre.right + " / " + pre.total : t("notTaken"), pre ? t("startingPoint") : t("takeAtStart"), "#/pre", pre ? t("seeResult") : t("start")) +
      statusCard(t("roundsComplete"), rdone + " / " + SECTIONS.length, t("markEach"), "#/progress", t("myProgress")) +
      statusCard(A.post.title, post ? post.right + " / " + post.total : t("notTaken"), gainTxt, "#/post", post ? t("seeResult") : t("start")) +
      "</div></div></section>";

    html += '<section class="band tint"><div class="wrap"><h2>' + t("roundsTitle") + '</h2><div class="arc">';
    SECTIONS.forEach(function (s) {
      var sdone = !N && L.done[s.id];
      html += '<a class="arc-card' + (sdone ? " is-done" : "") + '" href="#/s/' + s.id + '"><span class="n">' + h(s.time) + " · " + t("minShort", { n: s.mins }) + '</span><h3>' + title2(s.title, s.titleAccent) + "</h3>" +
        (s.brief ? "<p>" + h(s.brief) + "</p>" : "<p>" + h(s.lede) + "</p>") + (sdone ? '<span class="arc-done">' + t("completeTick") + "</span>" : "") + "</a>";
    });
    html += "</div></div></section>";

    html += '<section class="band"><div class="wrap"><h2>' + t("threeThings") + "</h2>" + takeawaysHTML() + "</div></section>";

    if (N) {
      html += '<section class="band only-instructor"><div class="wrap"><h2>Timetable</h2><div class="tablewrap schedule"><table><thead><tr><th>Time</th><th>Min</th><th>What happens</th></tr></thead><tbody>';
      N.schedule.forEach(function (r) {
        // a row with "day" heads each day of the course
        if (r.day) { html += '<tr class="dayrow"><th colspan="3">' + h(r.day) + "</th></tr>"; return; }
        html += '<tr class="' + (r.brk ? "brk" : "") + '"><td>' + h(r.time) + "</td><td>" + r.mins + "</td><td>" + (r.ref ? '<a href="#/s/' + r.ref + '">' + h(r.item) + "</a>" : h(r.item)) + "</td></tr>";
      });
      html += "</tbody></table></div>";
      html += '<div class="two-col"><div><h3>Scoring</h3><ul class="plain">' + N.scoring.map(function (x) { return "<li>" + T(x) + "</li>"; }).join("") + "</ul></div>";
      html += '<div><h3>Running the room</h3><ul class="plain">' + N.general.map(function (x) { return "<li>" + T(x) + "</li>"; }).join("") + "</ul></div></div>";
      html += '<h3 class="mt">Sources</h3><ul class="plain small">' + N.sources.map(function (x) { return "<li>" + h(x) + "</li>"; }).join("") + "</ul>";
      html += "</div></section>";
    }
    app.innerHTML = html;
  }

  function takeawaysHTML() {
    return '<div class="takeaways">' + C.takeaways.map(function (t, i) {
      return '<div class="take"><span class="take-n">' + (i + 1) + "</span><div><h3>" + h(t.title) + "</h3><p>" + T(t.text) + "</p></div></div>";
    }).join("") + "</div>";
  }

  // ---------- section ----------
  function renderSection(id) {
    var s = sectionById(id);
    if (!s) { location.hash = "#/"; return; }
    renderNav(id);
    var idx = sectionIndex(id);
    var html = '<section class="dayhero"><div class="wrap"><div class="act-head"><div class="act-num">' + h(s.num) + '</div><div class="act-text">';
    html += "<h1>" + title2(s.title, s.titleAccent) + '</h1><div class="rule"></div><p class="lede">' + T(s.lede) + "</p>";
    html += '<p class="daymeta">' + h(s.time) + " · " + t("minutesLong", { n: s.mins }) + (s.brief ? " · " + t("fromBrief", { x: h(s.brief) }) : "") + "</p>";
    if (N && N.sections[id]) html += note(N.sections[id].say);
    html += "</div>" + artHTML(s.art, "act-art") + "</div></div></section>";
    html += '<div class="wrap beats">';
    if (LIVE) html += LIVE.sectionTop(id);
    if (s.explain) html += '<section class="beat beat-roundintro">' + explainHTML(s.explain, t(isRound(s) ? "roundIntro" : id === "f" ? "finalIntro" : "sectionIntro"), "s-" + id) + "</section>";
    s.beats.forEach(function (b) { html += renderBeat(b); });
    var brk = C.breaks["after-" + id];
    if (brk) html += '<div class="breakcard"><span class="bt">' + h(brk.time) + " · " + t("minShort", { n: brk.mins }) + '</span><h3>' + h(brk.title) + "</h3><p>" + T(brk.text) + "</p>" +
      timerBtn(brk.mins, brk.title) + "</div>";
    if (!N) html += '<div class="markrow" id="markrow">' + markBtn(id) + "</div>";
    html += '<div class="pager">' +
      (idx > 0 ? '<a class="btn ghost" href="#/s/' + SECTIONS[idx - 1].id + '">' + t("back") + " " + h(SECTIONS[idx - 1].nav) + "</a>" : '<a class="btn ghost" href="#/">' + t("back") + " " + t("home") + "</a>") +
      (idx < SECTIONS.length - 1 ? '<a class="btn" href="#/s/' + SECTIONS[idx + 1].id + '">' + h(SECTIONS[idx + 1].nav) + " " + t("fwd") + "</a>" : '<a class="btn" href="#/scores">' + t("leaderboard") + " " + t("fwd") + "</a>") +
      "</div></div>";
    app.innerHTML = html;
  }

  function markBtn(id) {
    return L.done[id] ? '<button class="btn ghost" type="button" disabled>' + t("roundDone") + "</button>"
      : '<button class="btn" type="button" data-act="markdone" data-sid="' + id + '">' + t("markRound") + "</button>";
  }

  // a link to the case file on the title line: every exercise, discussion and hands-on task, and every theory block that
  // names the case company (caseFile.match) or shows a chart (hands-on tasks open it at the files)
  var NO_CASE = { part: 1, rules: 1, takeaways: 1, leaderboard: 1, assesscue: 1 };
  var PRACTICAL = { quiz: 1, estimate: 1, order: 1, discuss: 1, task: 1 };
  function caseLink(b) {
    if (!C.caseFile || NO_CASE[b.type]) return "";
    if (!PRACTICAL[b.type] && !b.chart && !b.charts && !(C.caseFile.match && new RegExp(C.caseFile.match).test(JSON.stringify(b)))) return "";
    return '<button class="case-chip" type="button" data-act="casefile"' + (b.type === "task" ? ' data-sec="files"' : "") + ">" + t("caseFile") + "</button>";
  }
  function beatShell(b, inner, extraHead) {
    return '<section class="beat beat-' + b.type + '" id="b-' + b.id + '" data-beat="' + b.id + '">' +
      '<div class="beat-head"><h2>' + h(b.title) + "</h2>" + (b.mins ? '<span class="mins">' + t("minShort", { n: b.mins }) + "</span>" : "") + (extraHead || "") + caseLink(b) + "</div>" +
      (b.intro ? '<p class="intro">' + T(b.intro) + "</p>" : "") + inner + explainHTML(b.explain, t(b.type === "task" ? "aboutJob" : "explainTitle"), b.id) + (LIVE ? LIVE.beatPanel(b) : "") + beatNote(b) + "</section>";
  }

  function renderBeat(b) {
    var f = RENDER[b.type];
    return f ? f(b, ui(b.id)) : beatShell(b, "<p>" + t("unknownBlock", { x: h(b.type) }) + "</p>");
  }

  function refreshBeat(id) {
    var el = document.getElementById("b-" + id);
    var b = BEATS[id];
    if (!el || !b) return;
    if (b.type === "cards") { syncFlips(b); return; }
    var t = document.createElement("template"); t.innerHTML = renderBeat(b).trim();
    el.replaceWith(t.content.firstChild);
  }
  function refreshTeamViews() {
    document.querySelectorAll(".beat-leaderboard").forEach(function (el) { refreshBeat(el.getAttribute("data-beat")); });
    if (/^#\/scores/.test(location.hash)) renderBoard();
  }

  // a chart from course.js (js/charts.js); the answer is picked out once it is revealed
  function chartHTML(c, shown) { return c && window.Charts ? '<div class="chartbox">' + window.Charts.svg(c, { shown: shown }) + "</div>" : ""; }
  // a question with a chart: the chart and the options side by side, so both fit on the projector
  function withChart(c, opts, shown) { return c ? '<div class="qchart">' + chartHTML(c, shown) + opts + "</div>" : opts; }
  function filesURL() { return participantURL("files"); }
  // a comparison table; the first column names the row
  function tableHTML(cols, rows) {
    return '<div class="tbl-wrap"><table class="tbl' + (cols.length > 3 ? " wide" : "") + '"><thead><tr>' + cols.map(function (c) { return "<th>" + h(c) + "</th>"; }).join("") + "</tr></thead><tbody>" +
      rows.map(function (r) {
        return "<tr>" + r.map(function (c, j) { return j ? "<td>" + T(c) + "</td>" : '<th scope="row">' + T(c) + "</th>"; }).join("") + "</tr>";
      }).join("") + "</tbody></table></div>";
  }
  // a task's files ({name, what}); older content names one file in b.file
  function taskFiles(b) { return b.files || (b.file ? [{ name: b.file }] : []); }
  // a prompt to paste into the AI tool, with a Copy button (files page, take-home card, notes tab)
  // the instructor's explanation under a block, a round or a job: paragraphs, bullet lists, boxes and prompts to copy.
  // Open on the participant pages and the notes tab; closed on the presentation tab, where the instructor opens it on request.
  var OPENX = {};
  function md(x) { return T(x).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>"); }
  function explainHTML(list, label, key) {
    if (!list || !list.length) return "";
    var open = OPENX[key] != null ? OPENX[key] : !(EDITION === "instructor" && !NOTESVIEW);
    var body = list.map(function (x) {
      if (typeof x === "string") return "<p>" + md(x) + "</p>";
      if (Array.isArray(x)) return '<ul class="points">' + x.map(function (li) { return "<li>" + md(li) + "</li>"; }).join("") + "</ul>";
      if (x.prompt) return promptHTML({ title: x.title || t("boxTry"), text: x.prompt });
      return '<div class="xbox ' + h(x.box) + '"><b>' + t("box_" + x.box) + "</b> " + md(x.text) + "</div>";
    }).join("");
    return '<details class="teach" data-x="' + h(key) + '"' + (open ? " open" : "") + "><summary>" + h(label) + '</summary><div class="teach-body">' + body + "</div></details>";
  }
  document.addEventListener("toggle", function (e) {
    var el = e.target;
    if (el && el.matches && el.matches("details.teach")) OPENX[el.getAttribute("data-x")] = el.open;
  }, true);
  function promptHTML(p) {
    return '<div class="promptbox"><div class="promptbox-head"><b>' + h(p.title) + '</b><button class="btn small" type="button" data-act="copytext" data-label="' + h(p.title) + '" data-text="' + h(p.text) + '">' + t("copy") + "</button></div>" +
      '<div class="prompt-text">' + h(p.text) + "</div></div>";
  }
  // a task guide: numbered steps, each with its keyboard shortcut
  function guideHTML(g) {
    return '<ol class="guide-steps">' + g.map(function (st) {
      return "<li><span>" + T(st[0]) + "</span>" + (st[1] ? '<kbd class="keys">' + h(st[1]) + "</kbd>" : "<span></span>") + "</li>";
    }).join("") + "</ol>";
  }
  // ---------- the case file: a dialog over the page, so nobody loses their place ----------
  var caseDlg = null;
  function caseFileHTML() {
    var cf = C.caseFile;
    return '<div class="case-head"><h2>' + h(cf.title) + '</h2><button class="iconbtn" type="button" data-act="closecase" aria-label="' + h(t("caseClose")) + '">×</button></div>' +
      '<p class="case-lede">' + T(cf.lede) + '</p><nav class="case-nav">' + cf.sections.map(function (x) { return '<button type="button" data-act="casego" data-sec="' + x.id + '">' + h(x.title) + "</button>"; }).join("") + "</nav>" +
      '<div class="case-body">' + cf.sections.map(function (x) {
        return '<section class="case-sec" id="case-' + x.id + '"><h3>' + h(x.title) + "</h3>" + (x.text || []).map(function (p) { return "<p>" + T(p) + "</p>"; }).join("") +
          (x.facts ? '<dl class="case-facts">' + x.facts.map(function (f) { return "<dt>" + h(f[0]) + "</dt><dd>" + T(f[1]) + "</dd>"; }).join("") + "</dl>" : "") +
          (x.table ? tableHTML(x.table.cols, x.table.rows) : "") + "</section>";
      }).join("") + "</div>";
  }
  function openCase(sec) {
    if (!C.caseFile) return;
    if (!caseDlg) {
      caseDlg = document.createElement("dialog");
      caseDlg.className = "case-dlg";
      caseDlg.setAttribute("aria-label", t("caseFile"));
      caseDlg.innerHTML = caseFileHTML();
      caseDlg.addEventListener("click", function (e) { if (e.target === caseDlg) caseDlg.close(); });   // a click on the backdrop closes it
      document.body.appendChild(caseDlg);
    }
    if (!caseDlg.open) { if (caseDlg.showModal) caseDlg.showModal(); else caseDlg.setAttribute("open", ""); }
    var target = sec && caseDlg.querySelector("#case-" + sec);
    var body = caseDlg.querySelector(".case-body");
    if (target) target.scrollIntoView({ block: "start" }); else body.scrollTop = 0;
  }
  function closeCase() { if (caseDlg && caseDlg.open) { if (caseDlg.close) caseDlg.close(); else caseDlg.removeAttribute("open"); } }

  // the note and the source under a block
  function calloutHTML(b) { return (b.note ? '<div class="callout"><p>' + T(b.note) + "</p></div>" : "") + (b.source ? '<p class="src">' + h(b.source) + "</p>" : ""); }

  function options(opts, answer, shown) {
    return '<div class="opts">' + opts.map(function (o, i) {
      return '<div class="opt' + (shown ? (i === answer ? " right" : " dim") : "") + '"><span class="L">' + LETTERS[i] + "</span><span>" + T(o) + "</span></div>";
    }).join("") + "</div>";
  }

  // ---------- block renderers ----------
  var RENDER = {
    assesscue: function (b) {
      var url = participantURL(b.which);
      var inner = '<div class="cue"><p class="cue-label">' + t("openOnDevice") + '</p><p class="cue-url" dir="ltr">' + h(url) + "</p>" +
        '<div class="actions"><button class="btn" type="button" data-act="copytext" data-text="' + h(url) + '">' + t("copyLink") + "</button>" +
        '<a class="btn ghost" href="' + h(url) + '" target="_blank" rel="noopener">' + t("openCheck") + "</a>" + timerBtn(b.mins, b.title) + "</div>" +
        '<p class="hint">' + t("cueHint", { n: A.questions.length }) + "</p></div>";
      return beatShell(b, inner);
    },

    estimate: function (b, u) {
      var inner = '<p class="q-big">' + T(b.question) + "</p>" + withChart(b.chart, options(b.options, b.answer, u.shown), u.shown);
      inner += u.shown ? '<div class="explain"><p>' + T(b.reveal) + "</p>" + (b.source ? '<p class="src">' + h(b.source) + "</p>" : "") + "</div>"
        : '<button class="btn" type="button" data-act="reveal" data-id="' + b.id + '">' + t("revealAnswer") + "</button>";
      return beatShell(b, inner);
    },

    quiz: function (b, u) {
      var i = u.i || 0, q = b.questions[i];
      var inner = '<p class="qcount">' + t("questionNofM", { i: i + 1, n: b.questions.length }) + "</p>";
      inner += '<p class="q-big">' + T(q.q) + "</p>" + withChart(q.chart, options(q.options, q.answer, u.shown), u.shown);
      inner += u.shown ? '<div class="explain"><p><b>' + LETTERS[q.answer] + ".</b> " + T(q.why) + "</p></div>" : '<button class="btn" type="button" data-act="reveal" data-id="' + b.id + '">' + t("reveal") + "</button>";
      inner += nav(i, b.questions.length, "step", b.id);
      return beatShell(b, inner);
    },

    // Job stations: each team works on one station; the presentation gives each team its station, phones show that station's question
    stations: function (b, u) {
      var i = u.i || 0, n = b.stations[0].questions.length, sta = LIVE && LIVE.stations ? LIVE.stations() : {};
      var inner = '<p class="qcount">' + t("questionNofM", { i: i + 1, n: n }) + "</p>";
      if (EDITION === "instructor" && !u.shown) {
        inner += '<div class="sta-assign"><p class="sta-k">' + t("staAssign") + "</p>" + C.teams.map(function (tn, k) {
          return '<div class="sta-team"><b>' + h(teamName(k)) + "</b>" + b.stations.map(function (x) {
            return '<button type="button" class="chip' + (sta[k + 1] === x.key ? " on" : "") + '" data-lv="sta" data-team="' + (k + 1) + '" data-key="' + h(x.key) + '">' + h(x.title) + "</button>";
          }).join("") + "</div>";
        }).join("") + "</div>";
      }
      inner += '<div class="sta-grid n' + b.stations.length + '">' + b.stations.map(function (x) {
        var q = x.questions[i], who = C.teams.map(function (tn, k) { return sta[k + 1] === x.key ? teamName(k) : null; }).filter(Boolean);
        return '<div class="sta-card"><h3>' + h(x.title) + (who.length ? ' <span class="sta-who">' + h(who.join(", ")) + "</span>" : "") + '</h3><p class="q-mid">' + T(q.q) + "</p>" +
          options(q.options, q.answer, u.shown) + (u.shown ? '<div class="explain"><p><b>' + LETTERS[q.answer] + ".</b> " + T(q.why) + "</p></div>" : "") + "</div>";
      }).join("") + "</div>";
      if (!u.shown) inner += '<button class="btn" type="button" data-act="reveal" data-id="' + b.id + '">' + t("reveal") + "</button>";
      inner += nav(i, n, "step", b.id);
      return beatShell(b, inner);
    },

    higherlower: function (b, u) {
      var i = u.i || 0, p = b.pairs[i];
      var higher = p.b.value > p.a.value;
      var inner = '<div class="hl">';
      inner += '<div class="hl-card"><p class="hl-label">' + T(p.a.label) + '</p><p class="hl-val">' + h(p.a.show) + "</p></div>";
      inner += '<div class="hl-vs">' + (u.shown ? '<span class="hl-verdict ' + (higher ? "up" : "down") + '">' + (higher ? t("higher") : t("lower")) + "</span>" : t("vs")) + "</div>";
      inner += '<div class="hl-card ' + (u.shown ? "open" : "hidden") + '"><p class="hl-label">' + T(p.b.label) + '</p><p class="hl-val">' + (u.shown ? h(p.b.show) : "?") + "</p></div>";
      inner += "</div>";
      inner += u.shown ? '<div class="explain"><p>' + T(p.note) + "</p></div>" : '<button class="btn" type="button" data-act="reveal" data-id="' + b.id + '">' + t("reveal") + "</button>";
      inner += nav(i, b.pairs.length, "step", b.id);
      return beatShell(b, inner);
    },

    league: function (b) {
      var inner = '<div class="league">' + b.rows.map(function (r) {
        return '<div class="lg-row"><span class="lg-who">' + h(r.who) + '</span><div><h3>' + T(r.name) + "</h3><p>" + T(r.text) + "</p></div></div>";
      }).join("") + "</div>";
      if (b.squeeze) inner += '<div class="callout warn"><p><strong>' + h(b.squeeze.title) + ".</strong> " + T(b.squeeze.text) + "</p></div>";
      return beatShell(b, inner);
    },

    facts: function (b) {
      var inner = '<div class="facts n' + b.items.length + '">' + b.items.map(function (f) {
        return '<div class="fact"><b>' + h(f.value) + "</b><span>" + h(f.label) + "</span>" + (f.note ? "<small>" + h(f.note) + "</small>" : "") + "</div>";
      }).join("") + "</div>" + (b.source ? '<p class="src">' + h(b.source) + "</p>" : "");
      return beatShell(b, inner);
    },

    timeline: function (b, u) {
      var inner;
      if (!u.shown) {
        var order = shuffledIdx(b.items.length, b.id);
        inner = '<div class="tl-pool">' + order.map(function (k, j) {
          return '<div class="tl-card"><span class="L">' + LETTERS[j] + "</span><span>" + T(b.items[k].text) + "</span></div>";
        }).join("") + '</div><p class="hint">' + t("postOrderOldest") + "</p>";
        inner += '<button class="btn" type="button" data-act="reveal" data-id="' + b.id + '">' + t("revealOrder") + "</button>";
      } else {
        var order2 = shuffledIdx(b.items.length, b.id), letterOf = {};
        order2.forEach(function (k, j) { letterOf[k] = LETTERS[j]; });
        inner = '<div class="timeline">' + b.items.map(function (it, k) {
          return '<div class="tl-row"><span class="tl-year">' + h(it.year) + '</span><span class="tl-dot"></span><p>' + T(it.text) + ' <span class="tl-letter">' + letterOf[k] + "</span></p></div>";
        }).join("") + '</div><p class="hint">' + t("rightAnswer", { x: b.items.map(function (it, k) { return letterOf[k]; }).join(", ") }) + "</p>";
        inner += '<button class="btn ghost small" type="button" data-act="hide" data-id="' + b.id + '">' + t("shuffle") + "</button>";
      }
      return beatShell(b, inner);
    },

    strategy: function (b) {
      var inner = '<p class="aim">' + h(b.aim) + '</p><div class="grid-cards three">' + b.items.map(function (c) {
        return '<div class="card"><h3>' + h(c.title) + "</h3><p>" + T(c.text) + "</p></div>";
      }).join("") + "</div>" + (b.note ? '<div class="callout"><p>' + T(b.note) + "</p></div>" : "");
      return beatShell(b, inner);
    },

    rules: function (b) {
      return beatShell(b, '<div class="grid-cards">' + b.items.map(function (c) {
        return '<div class="card"><h3>' + h(c.title) + "</h3><p>" + T(c.text) + "</p></div>";
      }).join("") + "</div>");
    },

    takeaways: function (b) { return beatShell(b, takeawaysHTML()); },

    flow: function (b) {
      var inner = '<div class="flow">' + b.steps.map(function (s, i) {
        return '<div class="flow-step"><span class="flow-n">' + (i + 1) + "</span><h3>" + h(s.title) + "</h3><p>" + T(s.text) + "</p></div>";
      }).join('<span class="flow-arrow" aria-hidden="true">' + t("fwd") + "</span>") + "</div>";
      if (b.risks) inner += '<div class="risks">' + b.risks.map(function (r) { return '<div class="risk"><h3>' + h(r.title) + "</h3><p>" + T(r.text) + "</p></div>"; }).join("") + "</div>";
      return beatShell(b, inner + calloutHTML(b));
    },

    cards: function (b, u) {
      var fl = u.flipped || {};
      var inner = '<div class="pcards">' + b.cards.map(function (c) {
        return '<button type="button" class="pcard' + (fl[c.key] ? " on" : "") + '" data-act="flip" data-id="' + b.id + '" data-key="' + c.key + '" aria-pressed="' + (fl[c.key] ? "true" : "false") + '">' +
          '<span class="pcard-inner"><span class="pcard-face pcard-front"><span class="pcard-team">' + h(c.team) + '</span><span class="pcard-name">' + h(c.name) + '</span><span class="pcard-hint">' + t("flip") + "</span></span>" +
          '<span class="pcard-face pcard-back"><span class="pcard-name small">' + h(c.name) + "</span>" +
          '<span class="stat"><i>' + t("cardFor") + "</i>" + P(c.who) + '</span><span class="stat"><i>' + t("cardHow") + "</i>" + P(c.how) + '</span><span class="stat"><i>' + t("cardEarns") + "</i>" + P(c.earns) + "</span></span></span></button>";
      }).join("") + "</div>";
      inner += '<div class="actions"><button class="btn ghost small" type="button" data-act="flipall" data-id="' + b.id + '">' + t("flipAll") + "</button></div>";
      return beatShell(b, inner);
    },

    regulators: function (b) {
      var inner = '<div class="regs">' + b.items.map(function (r) {
        return '<div class="reg"><b>' + h(r.name) + "</b><span>" + h(r.full) + "</span><p>" + T(r.text) + "</p></div>";
      }).join("") + "</div>" + (b.note ? '<div class="callout"><p>' + T(b.note) + "</p></div>" : "");
      return beatShell(b, inner);
    },

    segments: function (b) {
      var li = function (x) { return "<li>" + T(x) + "</li>"; };
      var inner = '<div class="segs">' + b.items.map(function (s) {
        return '<div class="seg"><span class="seg-team">' + h(s.team) + "</span><h3>" + h(s.name) + "</h3>" +
          "<i>" + t("segWho") + "</i><ul>" + s.who.map(li).join("") + "</ul>" +
          "<i>" + t("segSells") + "</i><ul>" + s.services.map(li).join("") + "</ul>" +
          (s.earns ? '<p class="seg-earns"><i>' + t("cardEarns") + "</i>" + T(s.earns) + "</p>" : "") + "</div>";
      }).join("") + "</div>" + (b.note ? '<div class="callout"><p>' + T(b.note) + "</p></div>" : "");
      return beatShell(b, inner);
    },

    explain: function (b) {
      var inner = b.groups.map(function (g) {
        return '<div class="xgroup"><h3 class="xg-title">' + h(g.title) + (g.team ? " <span>" + h(g.team) + "</span>" : "") + "</h3>" +
          g.items.map(function (p) {
            return '<details class="xprod"><summary><b>' + h(p.name) + "</b><span>" + T(p.how) + "</span></summary>" +
              '<dl class="xparts">' + p.parts.map(function (x) { return "<dt>" + T(x[0]) + "</dt><dd>" + T(x[1]) + "</dd>"; }).join("") + "</dl></details>";
          }).join("") + "</div>";
      }).join("");
      return beatShell(b, inner);
    },

    flags: function (b, u) {
      var i = u.i || 0, it = b.items[i];
      var inner = '<div class="scenario"><p>' + T(it.text) + "</p></div>";
      inner += u.shown ? '<div class="verdict-row ' + it.verdict + '"><span class="flagbadge">' + (it.verdict === "red" ? t("redFlag") : t("greenFlag")) + "</span><p>" + T(it.rule) + "</p></div>"
        : '<div class="vote-hint"><span>🚩</span><span>' + t("or") + '</span><span>💚</span></div><button class="btn" type="button" data-act="reveal" data-id="' + b.id + '">' + t("reveal") + "</button>";
      inner += nav(i, b.items.length, "step", b.id);
      return beatShell(b, inner);
    },

    scam: function (b, u) {
      var i = u.i || 0, it = b.items[i];
      var inner = '<div class="scam-wrap"><div class="phone"><div class="phone-top"><span class="ch">' + h(it.channel) + '</span><span class="from">' + h(it.from) + "</span></div>" +
        '<div class="bubble">' + T(it.text) + "</div></div>";
      inner += '<div class="scam-side">';
      if (u.shown) {
        inner += '<div class="verdict-row ' + (it.verdict === "scam" ? "red" : "green") + '"><span class="flagbadge">' + (it.verdict === "scam" ? t("scam") : t("real")) + "</span><ul>" +
          it.flags.map(function (f) { return "<li>" + T(f) + "</li>"; }).join("") + "</ul></div>";
      } else {
        inner += '<div class="vote-hint"><span>💚</span><span>' + t("or") + '</span><span>🚩</span></div><button class="btn" type="button" data-act="reveal" data-id="' + b.id + '">' + t("reveal") + "</button>";
      }
      inner += "</div></div>" + nav(i, b.items.length, "step", b.id);
      return beatShell(b, inner);
    },

    // a chart with what it shows, for the debrief after a game
    chart: function (b) {
      var charts = b.charts ? '<div class="chart-two n' + b.charts.length + '">' + b.charts.map(function (c) { return chartHTML(c, true); }).join("") + "</div>" : chartHTML(b.chart, true);
      return beatShell(b, charts + calloutHTML(b));
    },

    // a hands-on task: the file, the steps, where to download it; the questions on the result follow as a quiz
    task: function (b) {
      var files = taskFiles(b), what = files.map(function (f) { return h(f.name); }).concat((b.prompts || []).map(function (p) { return h(p.title); }));
      var inner = '<div class="task"><p class="task-file"><b>' + what.join(" · ") + '</b><br>' + t("taskFiles", { url: h(filesURL()) }) + "</p>" +
        '<ol class="task-steps">' + b.steps.map(function (s) { return "<li>" + T(s) + "</li>"; }).join("") + "</ol>" +
        (b.note ? '<div class="callout"><p>' + T(b.note) + "</p></div>" : "") + "</div>";
      // the full guide: closed on the projector (open it when the room is stuck), open on the notes tab
      if (b.guide) inner += '<details class="guide"' + (NOTESVIEW ? " open" : "") + "><summary>" + t("guideTitle") + "</summary>" + guideHTML(b.guide) + "</details>";
      // the prompts participants copy from the files page, so the room can see the exact text when needed
      if (b.prompts) inner += '<details class="guide"' + (NOTESVIEW ? " open" : "") + "><summary>" + t("promptsTitle") + '</summary><div class="prompts-in">' + b.prompts.map(promptHTML).join("") + "</div></details>";
      // the usual problems and their fixes: instructor notes only, hidden with the notes
      var help = N && N.help && N.help[b.id];
      if (help) inner += '<div class="inote help"><b>' + t("helpTitle") + "</b>" + tableHTML([t("helpSee"), t("helpFix")], help) + "</div>";
      return beatShell(b, inner);
    },

    "cards-static": function (b) {
      return beatShell(b, '<div class="grid-cards n' + b.items.length + '">' + b.items.map(function (c) {
        return '<div class="card"><h3>' + h(c.title) + "</h3><p>" + T(c.text) + "</p></div>";
      }).join("") + "</div>" + (b.note ? '<div class="callout"><p>' + T(b.note) + "</p></div>" : ""));
    },

    order: function (b, u) {
      var order = shuffledIdx(b.steps.length, b.id), inner;
      if (!u.shown) {
        inner = '<div class="tl-pool one">' + order.map(function (k, j) {
          return '<div class="tl-card"><span class="L">' + LETTERS[j] + "</span><span>" + T(b.steps[k].text) + "</span></div>";
        }).join("") + '</div><p class="hint">' + t("postOrder") + '</p><button class="btn" type="button" data-act="reveal" data-id="' + b.id + '">' + t("revealOrder") + "</button>";
      } else {
        var letterOf = {}; order.forEach(function (k, j) { letterOf[k] = LETTERS[j]; });
        inner = '<ol class="trace">' + b.steps.map(function (s, k) {
          return '<li><span class="tr-text">' + T(s.text) + ' <span class="tl-letter">' + letterOf[k] + "</span></span>" + (u.owners ? '<span class="owner">' + T(s.owner) + "</span>" : "") + "</li>";
        }).join("") + "</ol>";
        inner += '<div class="actions">' + (u.owners || !b.steps.some(function (x) { return x.owner; }) ? "" : '<button class="btn" type="button" data-act="owners" data-id="' + b.id + '">' + (b.ownersBtn ? h(b.ownersBtn) : t("showOwners")) + "</button>") +
          '<button class="btn ghost small" type="button" data-act="hide" data-id="' + b.id + '">' + t("shuffle") + "</button></div>";
      }
      return beatShell(b, inner);
    },

    lines: function (b) {
      return beatShell(b, '<div class="lines">' + b.items.map(function (l, i) {
        return '<div class="line l' + (i + 1) + '"><span class="line-n">' + h(l.n) + "</span><h3>" + h(l.title) + "</h3><p>" + T(l.text) + "</p></div>";
      }).join("") + "</div>" + calloutHTML(b));
    },

    // ---------- theory blocks ----------
    // the start of a round's theory or exercises, with the list of what follows until the next part
    part: function (b) {
      var s = sectionById(b.section), list = [], on = false;
      s.beats.forEach(function (x) {
        if (x.id === b.id) { on = true; return; }
        if (x.type === "part") on = false;
        else if (on && x.type !== "leaderboard") list.push(x.title);
      });
      return '<section class="beat beat-part' + (b.kind === "exercises" ? " ex" : "") + '" id="b-' + b.id + '" data-beat="' + b.id + '">' +
        '<div class="part-band"><div class="part-head"><h2>' + h(b.title) + "</h2>" + (b.mins ? '<span class="part-mins">' + t("minutesLong", { n: b.mins }) + "</span>" : "") + "</div>" +
        (b.text ? "<p>" + T(b.text) + "</p>" : "") +
        '<ol class="part-list">' + list.map(function (x) { return "<li>" + h(x) + "</li>"; }).join("") + "</ol></div>" + beatNote(b) + "</section>";
    },

    // bullet points, with a chart or a quote beside them
    points: function (b) {
      var list = '<ul class="points">' + b.items.map(function (p) {
        return "<li>" + (typeof p === "string" ? T(p) : "<b>" + h(p.title) + "</b> " + T(p.text)) + "</li>";
      }).join("") + "</ul>";
      var side = b.chart ? chartHTML(b.chart, true) : b.quote ? '<blockquote class="quote"><p>' + T(b.quote.text) + "</p><cite>" + h(b.quote.by) + "</cite></blockquote>" : "";
      return beatShell(b, (side ? '<div class="pts-grid' + (b.quote && !b.chart ? " q" : "") + '">' + list + '<div class="pts-side">' + side + "</div></div>" : list) + calloutHTML(b));
    },

    // a comparison table; the first column names the row
    // with a prompt and hideCol, the room fills in that column first (with the case file), then the reveal shows it
    table: function (b, u) {
      if (!b.prompt) return beatShell(b, tableHTML(b.cols, b.rows) + calloutHTML(b));
      var hide = !u.shown && b.hideCol != null;
      var rows = hide ? b.rows.map(function (r) { return r.map(function (c, j) { return j === b.hideCol ? "?" : c; }); }) : b.rows;
      var task = '<div class="fx-task"><p>' + T(b.prompt) + '</p><div class="actions">' +
        (C.caseFile ? '<button class="btn ghost small" type="button" data-act="casefile"' + (b.caseSec ? ' data-sec="' + h(b.caseSec) + '"' : "") + ">" + t("caseOpen") + "</button>" : "") +
        timerBtn(b.mins || 3, b.title) + (u.shown ? "" : '<button class="btn" type="button" data-act="reveal" data-id="' + b.id + '">' + h(b.revealLabel || t("showNumbers")) + "</button>") + "</div></div>";
      return beatShell(b, task + '<div class="' + (hide ? "tbl-hidecol" : "") + '">' + tableHTML(b.cols, rows) + "</div>" + calloutHTML(b));
    },

    // read and discuss: an exhibit (a chart or a table), the question for the tables and a timer, then how an analyst reads it
    discuss: function (b, u) {
      var ex = b.chart ? chartHTML(b.chart, true) : b.table ? tableHTML(b.table.cols, b.table.rows) : "";
      var side = '<p class="disc-prompt">' + T(b.prompt) + "</p>" +
        '<div class="actions">' + timerBtn(b.mins, b.title) + (u.shown ? "" : '<button class="btn" type="button" data-act="reveal" data-id="' + b.id + '">' + t("showReading") + "</button>") + "</div>" +
        (u.shown ? '<div class="reading"><h3>' + t("readingTitle") + '</h3><ul class="points">' + b.reading.map(function (x) { return "<li>" + T(x) + "</li>"; }).join("") + "</ul></div>" : "");
      return beatShell(b, '<div class="disc"><div class="disc-ex">' + ex + '</div><div class="disc-side">' + side + "</div></div>" + calloutHTML(b));
    },

    // formulas drawn as boxes: the result first, then the parts, with a worked example under each
    // with a prompt, the room finds the numbers first: each row shows its blanks ("ask") until Show the numbers
    formula: function (b, u) {
      var hide = b.prompt && !u.shown;
      var top = b.prompt ? '<div class="fx-task"><p>' + T(b.prompt) + '</p><div class="actions">' + timerBtn(b.mins || 2, b.title) +
        (u.shown ? "" : '<button class="btn" type="button" data-act="reveal" data-id="' + b.id + '">' + t("showNumbers") + "</button>") + "</div></div>" : "";
      var inner = top + '<div class="formulas">' + b.rows.map(function (r) {
        var ex = hide && r.ask ? r.ask : r.example;
        return '<div class="fx"><div class="fx-row">' + r.parts.map(function (p, i) {
          return /^[=×÷+−]$/.test(p) ? '<span class="fx-op" aria-hidden="true">' + h(p) + "</span>" : '<span class="fx-box' + (i === 0 ? " res" : "") + '">' + h(p) + "</span>";
        }).join("") + "</div>" + (ex ? '<p class="fx-ex' + (hide && r.ask ? " ask" : "") + '">' + T(ex) + "</p>" : "") + "</div>";
      }).join("") + "</div>";
      return beatShell(b, inner + calloutHTML(b));
    },

    // a pyramid, top level first, with what each level means beside it
    // a guessing board: hidden tiles in rank order; teams name an answer, the presentation reveals the tile and gives its points to that team
    topboard: function (b, u) {
      var open = u.open || {}, got = u.got || {}, instr = EDITION === "instructor";
      var pts = function (n) { return t(n === 1 ? "lvPtsN1" : "lvPtsN", { n: n }); };
      var tiles = b.answers.map(function (a, k) {
        var rank = '<span class="tb-rank">' + (a.bonus ? "+" : k + 1) + "</span>";
        if (!open[a.key]) return '<button type="button" class="tb-tile' + (a.bonus ? " bonus" : "") + '" data-act="tbopen" data-id="' + b.id + '" data-key="' + a.key + '">' + rank +
          '<span class="tb-hidden">' + (a.bonus ? h(t("tbBonus")) : "") + '</span><span class="tb-pts">' + pts(a.pts) + "</span></button>";
        var who = got[a.key] != null ? '<span class="tb-got">' + h(teamName(got[a.key])) + " · +" + a.pts +
          (instr ? ' <button type="button" class="tb-undo" data-act="tbaward" data-id="' + b.id + '" data-key="' + a.key + '" data-team="-1" aria-label="' + h(t("tbUndo")) + '">×</button>' : "") + "</span>" : "";
        var award = instr && got[a.key] == null && !u.rest ? '<span class="tb-award">' + C.teams.map(function (tn, i) {
          return '<button type="button" class="chip" data-act="tbaward" data-id="' + b.id + '" data-key="' + a.key + '" data-team="' + i + '">' + h(teamName(i)) + "</button>";
        }).join("") + "</span>" : "";
        return '<div class="tb-tile on k-' + a.kind + (a.bonus ? " bonus" : "") + '">' + rank + '<span class="tb-body"><b>' + T(a.text) + "</b>" +
          (a.detail ? '<span class="tb-detail">' + T(a.detail) + "</span>" : "") + (a.freq ? '<span class="tb-freq">' + T(a.freq) + "</span>" : "") + "</span>" +
          '<span class="tb-side"><span class="tb-kind k-' + a.kind + '">' + h(b.kinds[a.kind]) + '</span><span class="tb-pts">' + pts(a.pts) + "</span></span>" + who + award + "</div>";
      }).join("");
      var all = b.answers.every(function (a) { return open[a.key]; });
      var inner = '<div class="tb-board" style="grid-template-rows:repeat(' + Math.ceil(b.answers.length / 2) + ',auto)">' + tiles + "</div>";
      if (all && b.summary) inner += '<div class="callout"><p>' + T(b.summary) + "</p></div>";
      inner += '<div class="actions">' + (all ? "" : '<button class="btn" type="button" data-act="tbrest" data-id="' + b.id + '">' + t("tbRest") + "</button>") +
        (instr ? '<button class="btn ghost small" type="button" data-act="tbreset" data-id="' + b.id + '">' + t("tbReset") + "</button>" : "") + "</div>";
      return beatShell(b, inner + (b.source ? '<p class="src">' + h(b.source) + "</p>" : ""));
    },

    pyramid: function (b) {
      var n = b.levels.length, wd = function (i) { return 34 + 66 * i / Math.max(1, n - 1); };
      var inner = '<div class="pyr">' + b.levels.map(function (l, i) {
        var w = wd(i), top = i ? wd(i - 1) : w - (wd(1) - wd(0)), inset = Math.max(0, (w - top) / 2 / w * 100);
        return '<div class="pyr-row"><div class="pyr-cell"><div class="pyr-tier t' + Math.round(5 * i / Math.max(1, n - 1)) + '" style="width:' + w.toFixed(1) + "%;clip-path:polygon(" +
          inset.toFixed(1) + "% 0," + (100 - inset).toFixed(1) + '% 0,100% 100%,0 100%)"><span>' + h(l.title) + "</span></div></div><p>" + T(l.text) + "</p></div>";
      }).join("") + "</div>";
      return beatShell(b, inner + calloutHTML(b));
    },

    // a two-by-two grid: cells top left, top right, bottom left, bottom right
    quad: function (b) {
      var inner = '<div class="quad"><div class="q-y"><span>' + h(b.y.high) + "</span><b>" + h(b.y.label) + "</b><span>" + h(b.y.low) + "</span></div>" +
        '<div class="q-grid">' + b.cells.map(function (c) {
          return '<div class="q-cell' + (c.tone ? " " + c.tone : "") + '"><h3>' + h(c.title) + "</h3><p>" + T(c.text) + "</p></div>";
        }).join("") + "</div><div></div>" +
        '<div class="q-x"><span>' + h(b.x.low) + "</span><b>" + h(b.x.label) + "</b><span>" + h(b.x.high) + "</span></div></div>";
      return beatShell(b, inner + calloutHTML(b));
    },

    // steps around a circle (a cycle that starts again), with what each step means under it
    cycle: function (b) {
      var n = b.steps.length, W0 = 840, H0 = 440, cx = W0 / 2, cy = H0 / 2, rx = 325, ry = 166, bw = 176, bh = 60;
      var pos = b.steps.map(function (s, i) { var a = -Math.PI / 2 + 2 * Math.PI * i / n; return { x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a), a: a }; });
      var svg = '<svg class="cycle-svg" viewBox="0 0 ' + W0 + " " + H0 + '" role="img" aria-label="' + h(b.title) + '"><defs><marker id="ar-' + b.id + '" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#223E99"/></marker></defs>';
      svg += '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="none" stroke="#DFE4EF" stroke-width="2"/>';
      var inBox = function (x, y, p) { return Math.abs(x - p.x) < bw / 2 + 8 && Math.abs(y - p.y) < bh / 2 + 8; };
      pos.forEach(function (p, i) {   // an arrow along the ring from each step to the next, from box edge to box edge
        var q = pos[(i + 1) % n], a1 = q.a + (i === n - 1 ? 2 * Math.PI : 0), pts = [];
        for (var k = 0; k <= 60; k++) {
          var a = p.a + (a1 - p.a) * k / 60, x = cx + rx * Math.cos(a), y = cy + ry * Math.sin(a);
          if (!inBox(x, y, p) && !inBox(x, y, q)) pts.push(x.toFixed(1) + "," + y.toFixed(1));
        }
        if (pts.length > 1) svg += '<polyline points="' + pts.join(" ") + '" fill="none" stroke="#223E99" stroke-width="2.5" marker-end="url(#ar-' + b.id + ')"/>';
      });
      if (b.center) svg += '<text x="' + cx + '" y="' + (cy + 8) + '" text-anchor="middle" class="cy-center">' + h(b.center) + "</text>";
      pos.forEach(function (p, i) {
        var words = b.steps[i].title.split(" "), l1 = "", l2 = "";
        words.forEach(function (w) { if ((l1 + " " + w).trim().length <= 16 && !l2) l1 = (l1 + " " + w).trim(); else l2 = (l2 + " " + w).trim(); });
        svg += '<g><rect x="' + (p.x - bw / 2).toFixed(1) + '" y="' + (p.y - bh / 2).toFixed(1) + '" width="' + bw + '" height="' + bh + '" rx="12" fill="' + (i === 0 ? "#16306F" : "#fff") + '" stroke="#16306F" stroke-width="1.5"/>' +
          '<text x="' + p.x.toFixed(1) + '" y="' + (p.y + (l2 ? -4 : 6)).toFixed(1) + '" text-anchor="middle" class="cy-t' + (i === 0 ? " on" : "") + '">' + h(l1) + "</text>" +
          (l2 ? '<text x="' + p.x.toFixed(1) + '" y="' + (p.y + 17).toFixed(1) + '" text-anchor="middle" class="cy-t' + (i === 0 ? " on" : "") + '">' + h(l2) + "</text>" : "") + "</g>";
      });
      svg += "</svg>";
      var legend = b.steps.some(function (s) { return s.text; }) ? '<ol class="cy-legend">' + b.steps.map(function (s) { return "<li><b>" + h(s.title) + "</b> " + T(s.text || "") + "</li>"; }).join("") + "</ol>" : "";
      return beatShell(b, '<div class="cycle">' + svg + legend + "</div>" + calloutHTML(b));
    },

    // a buyer persona card
    persona: function (b) {
      var p = b.persona, ini = p.name.split(" ").map(function (x) { return x.charAt(0); }).join("").slice(0, 2);
      var li = function (x) { return "<li>" + T(x) + "</li>"; };
      var inner = '<div class="persona"><div class="pe-left"><div class="pe-id"><span class="pe-av" aria-hidden="true">' + h(ini) + "</span><div><h3>" + h(p.name) + "</h3><p>" + h(p.tagline) + "</p></div></div>" +
        '<dl class="pe-facts">' + p.facts.map(function (f) { return "<dt>" + h(f[0]) + "</dt><dd>" + T(f[1]) + "</dd>"; }).join("") + "</dl>" +
        (p.quote ? '<blockquote class="pe-quote">' + T(p.quote) + "</blockquote>" : "") + "</div>" +
        '<div class="pe-right">' + p.groups.map(function (g) { return '<div class="pe-group"><h4>' + h(g.title) + "</h4><ul>" + g.items.map(li).join("") + "</ul></div>"; }).join("") + "</div></div>";
      return beatShell(b, inner + calloutHTML(b));
    },

    leaderboard: function (b) {
      var pod = LIVE && LIVE.enabled() ? LIVE.podium(true) : "";
      return beatShell(b, boardHTML(false) + (pod ? '<h3 class="top3-h">' + t("lvTop3") + "</h3>" + pod : "") + '<div class="actions"><a class="btn" href="#/scores">' + t("fullScreen") + "</a></div>");
    }
  };

  // ---------- flips are toggled in place so the animation plays ----------
  function syncFlips(b) {
    var fl = ui(b.id).flipped || {};
    document.querySelectorAll('#b-' + b.id + " .pcard").forEach(function (el) {
      var on = !!fl[el.getAttribute("data-key")];
      el.classList.toggle("on", on); el.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  // ---------- leaderboard ----------
  // manual points from the scoreboard plus points teams earned by answering on their phones
  function scoreOf(i) { return (ST.teams[i] ? ST.teams[i].score : 0) + (LIVE ? LIVE.autoPts(i) : 0); }
  function ranked() {
    return ST.teams.map(function (tm, i) { return { name: teamName(i), score: scoreOf(i), i: i }; }).filter(function (x) { return slotShown(x.i); })
      .sort(function (a, b) { return b.score - a.score || a.i - b.i; });
  }
  function boardHTML(big) {
    var r = ranked();
    if (!r.length) return '<p class="muted">' + t("lvNobodyYet") + "</p>";
    var max = Math.max(1, r[0].score);
    return '<div class="board' + (big ? " big" : "") + '">' + r.map(function (t) {
      var rank = 1 + r.filter(function (o) { return o.score > t.score; }).length;
      var lead = rank === 1 && t.score > 0;
      return '<div class="brow' + (lead ? " lead" : "") + '"><span class="rank">' + rank + '</span><span class="bname">' + h(t.name) + '</span><span class="bbar"><i style="width:' + Math.round(100 * t.score / max) + '%"></i></span><span class="bscore">' + t.score + "</span></div>";
    }).join("") + "</div>";
  }
  function renderBoard() {
    renderNav("scores");
    var pod = LIVE && LIVE.enabled() ? LIVE.podium(true) : "";
    app.innerHTML = '<section class="dayhero"><div class="wrap"><h1>' + t2("boardTitle") + '</h1><div class="rule"></div>' + boardHTML(true) + (pod ? '<h2 class="top3-h">' + t("lvTop3") + "</h2>" + pod : "") +
      '<div class="actions"><button class="btn ghost" type="button" data-act="openscores">' + t("editScores") + '</button><a class="btn ghost" href="#/">' + t("home") + "</a></div></div></section>";
  }

  // ---------- files for the hands-on tasks (participants open this on their computer) ----------
  function renderFiles() {
    renderNav("files");
    var tasks = []; SECTIONS.forEach(function (s) { s.beats.forEach(function (b) { if (b.type === "task") tasks.push(b); }); });
    var base = (EDITION === "instructor" ? "../" : "") + "assets/data/";
    var keys = C.shortcuts ? '<details class="guide"><summary>' + t("shortcutsTitle") + "</summary>" + tableHTML([t("shortcutKeys"), t("shortcutDoes")], C.shortcuts) + "</details>" : "";
    var caseBtn = C.caseFile ? '<p><button class="btn ghost small" type="button" data-act="casefile" data-sec="files">' + h(t("caseFile")) + "</button></p>" : "";
    app.innerHTML = '<section class="dayhero"><div class="wrap"><h1>' + t2("filesTitle") + '</h1><div class="rule"></div><p class="lede">' + t("filesLede") + "</p>" + caseBtn + keys +
      (tasks.length ? tasks.map(function (b) {
        var files = taskFiles(b);
        return '<div class="filecard"><h2>' + h(b.title) + "</h2>" + explainHTML(b.explain, t("aboutJob"), "f-" + b.id) +
          (files.length ? '<div class="dl-list">' + files.map(function (f) {
            return '<p><a class="btn" href="' + base + encodeURIComponent(f.name) + '" download>' + t("download", { x: h(f.name) }) + "</a>" + (f.what ? '<span class="dl-what">' + T(f.what) + "</span>" : "") + "</p>";
          }).join("") + "</div>" : "") +
          (b.prompts || []).map(promptHTML).join("") +
          (b.guide ? guideHTML(b.guide) : '<ol class="task-steps">' + b.steps.map(function (s) { return "<li>" + T(s) + "</li>"; }).join("") + "</ol>") +
          (b.takeHome ? '<div class="takehome"><h3>' + t("takeHomeTitle") + "</h3><p>" + T(b.takeHome.text) + "</p>" + (b.takeHome.prompts || []).map(promptHTML).join("") + "</div>" : "") + "</div>";
      }).join("") : "<p>" + t("filesNone") + "</p>") + "</div></section>";
  }

  // ---------- quick win: tap your role, copy a ready prompt (C.quickWin) ----------
  var startPick = null;
  function renderStart() {
    renderNav("start");
    var qw = C.quickWin || [], pick = qw.filter(function (x) { return x.key === startPick; })[0];
    app.innerHTML = '<section class="dayhero"><div class="wrap"><h1>' + t2("startTitle") + '</h1><div class="rule"></div><p class="lede">' + t("startLede") + "</p>" +
      '<p class="sta-k">' + t("startPick") + '</p><div class="chips">' + qw.map(function (x) {
        return '<button type="button" class="chip' + (x === pick ? " on" : "") + '" data-act="startpick" data-key="' + h(x.key) + '">' + h(x.name) + "</button>";
      }).join("") + "</div>" +
      (pick ? promptHTML({ title: pick.title, text: pick.prompt }) + '<p class="hint">' + t("startCopyHint") + "</p>" : "") + "</div></section>";
  }

  // ---------- my card: taps build a pack the person pastes into Copilot Chat, then takes home on the phone (C.card) ----------
  // The choices live in this browser and in the link (#/card?r=role&t=0,2&b=beat,beat), so the QR code carries them to the phone.
  var CARDKEY = "arla.card";
  var CARD = (function () {
    var m = (location.hash.match(/^#\/card\?(.*)$/) || [])[1], c = null;
    if (m) {
      c = { r: "", t: [], b: [], fromLink: true };
      m.split("&").forEach(function (kv) {
        var p = kv.split("="), v = decodeURIComponent(p[1] || "");
        if (p[0] === "r") c.r = v;
        if (p[0] === "t") c.t = v ? v.split(",").map(Number) : [];
        if (p[0] === "b") c.b = v ? v.split(",") : [];
      });
    } else { try { c = JSON.parse(localStorage.getItem(CARDKEY) || "null"); } catch (e) { c = null; } }
    return c || { r: "", t: [], b: [] };
  })();
  function saveCard() { try { localStorage.setItem(CARDKEY, JSON.stringify({ r: CARD.r, t: CARD.t, b: CARD.b })); } catch (e) { /* ignore */ } }
  function cardRole() { return ((C.card && C.card.roles) || []).filter(function (x) { return x.key === CARD.r; })[0] || null; }
  function takeHomes() {
    var out = []; SECTIONS.forEach(function (s) { s.beats.forEach(function (b) { if (b.type === "task" && b.takeHome && b.takeHome.prompts && b.takeHome.prompts.length) out.push(b); }); });
    return out;
  }
  function cardLink() {
    var base = location.href.split("#")[0].replace(/\/instructor\/.*$/, "/");
    return base + "#/card?r=" + encodeURIComponent(CARD.r) + "&t=" + CARD.t.join(",") + "&b=" + CARD.b.map(encodeURIComponent).join(",");
  }
  function cardPack() {
    var role = cardRole(); if (!role || !CARD.t.length) return "";
    var tasks = CARD.t.map(function (i) { return role.tasks[i]; }).filter(Boolean);
    var briefs = takeHomes().filter(function (b) { return CARD.b.indexOf(b.id) >= 0; }).map(function (b) {
      return b.takeHome.prompts.map(function (p) { return "### " + p.title + "\n" + p.text; }).join("\n\n");
    });
    return C.card.instruction.replace("{role}", role.name).replace("{tasks}", tasks.map(function (x) { return "- " + x; }).join("\n"))
      .replace("{briefs}", briefs.length ? briefs.join("\n\n") : C.card.noBriefs) + "\n\n" + C.card.method;
  }
  function qrSVG(text) {
    if (!window.qrcode) return "";
    try { var qr = window.qrcode(0, "M"); qr.addData(text); qr.make(); return qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); } catch (e) { return ""; }
  }
  function plainCardHTML() {
    return '<div class="plaincard">' + C.card.plain.map(function (x) {
      return '<div class="card"><h3>' + h(x.title) + '</h3><ul class="points">' + x.items.map(function (li) { return "<li>" + T(li) + "</li>"; }).join("") + "</ul></div>";
    }).join("") + "</div>";
  }
  function renderCard() {
    renderNav("card");
    var cd = C.card; if (!cd) { renderHome(); return; }
    var role = cardRole(), pack = cardPack(), n = 6, step = 0;
    function head(k, txt) { step++; return '<div class="cstep"><p class="cstep-n">' + t("cardStep", { i: step, n: n }) + "</p><h2>" + h(t(k)) + "</h2>" + (txt ? "<p>" + h(txt) + "</p>" : ""); }
    var actions = pack ? '<div class="actions"><button class="btn" type="button" data-act="carddl">' + t("cardDownload") + "</button>" +
      '<button class="btn ghost" type="button" data-act="cardshare">' + t("cardShare") + "</button>" +
      '<button class="btn ghost" type="button" data-act="copytext" data-label="' + h(t("cardCopyPack")) + '" data-text="' + h(pack) + '">' + t("cardCopyPack") + "</button></div>" : "";
    var html = '<section class="dayhero"><div class="wrap"><h1>' + t2("cardTitle") + '</h1><div class="rule"></div>';
    if (CARD.fromLink && pack) html += '<div class="callout"><p>' + t("cardOnPhone") + "</p>" + actions + "</div>";
    html += '<p class="lede">' + t("cardLede") + "</p>";
    html += head("cardStep1") + '<div class="chips">' + cd.roles.map(function (x) {
      return '<button type="button" class="chip' + (x === role ? " on" : "") + '" data-act="cardrole" data-key="' + h(x.key) + '">' + h(x.name) + "</button>";
    }).join("") + "</div></div>";
    html += head("cardStep2") + (role ? '<div class="chips">' + role.tasks.map(function (x, i) {
      return '<button type="button" class="chip' + (CARD.t.indexOf(i) >= 0 ? " on" : "") + '" data-act="cardtask" data-i="' + i + '">' + h(x) + "</button>";
    }).join("") + "</div>" : '<p class="muted">' + t("cardPickMore") + "</p>") + "</div>";
    html += head("cardStep3") + '<div class="chips">' + takeHomes().map(function (b) {
      return '<button type="button" class="chip' + (CARD.b.indexOf(b.id) >= 0 ? " on" : "") + '" data-act="cardbrief" data-key="' + h(b.id) + '">' + h(b.title) + "</button>";
    }).join("") + "</div></div>";
    html += head("cardStep4", t("cardStep4Text")) + (pack ? promptHTML({ title: t("cardCopyPack"), text: pack }) : '<p class="muted">' + t("cardPickMore") + "</p>") + "</div>";
    html += head("cardStep5") + plainCardHTML() + "</div>";
    html += head("cardStep6", t("cardStep6Text")) + (pack ? '<div class="qrbox">' + qrSVG(cardLink()) + "</div>" + actions : '<p class="muted">' + t("cardPickMore") + "</p>") + "</div>";
    app.innerHTML = html + "</div></section>";
  }
  function cardDownload() {
    var pack = cardPack(); if (!pack) return;
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([pack], { type: "text/plain;charset=utf-8" }));
    a.download = C.card.fileName || "My-Copilot-pack.txt";
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    toast(t("cardSaved"));
  }
  function cardShare() {
    var pack = cardPack(); if (!pack) return;
    if (navigator.share) navigator.share({ title: C.card.shareTitle || t("cardNav"), text: pack }).then(function () { toast(t("cardShared")); }, function () { /* cancelled */ });
    else copy(pack, t("cardCopyPack"));
  }

  // ---------- glossary page ----------
  function renderGlossary() {
    renderNav("glossary");
    var keys = Object.keys(C.glossary).sort(function (a, b) { return C.glossary[a].term.localeCompare(C.glossary[b].term); });
    app.innerHTML = '<section class="dayhero"><div class="wrap"><h1>' + t2("glossaryTitle") + '</h1><div class="rule"></div><dl class="gloss">' +
      keys.map(function (k) { return "<dt>" + h(C.glossary[k].term) + "</dt><dd>" + h(C.glossary[k].def) + "</dd>"; }).join("") + "</dl></div></section>";
  }

  // ---------- scoreboard drawer ----------
  function renderScores() {
    var d = document.getElementById("scores");
    d.hidden = !ST.scoresOpen;
    if (!ST.scoresOpen) return;
    var html = '<div class="sc-head"><h2>' + t("scores") + '</h2><button class="iconbtn" type="button" data-act="closescores" aria-label="' + h(t("closeScores")) + '">×</button></div><div class="sc-list">';
    var rankOf = {}; ST.teams.forEach(function (tm, i) { rankOf[i] = 1 + ST.teams.filter(function (o, j) { return scoreOf(j) > scoreOf(i); }).length; });
    ST.teams.forEach(function (tm, i) {
      if (!slotShown(i)) return;
      html += '<div class="sc-row"><span class="rank">' + rankOf[i] + '</span><span class="tname">' + h(teamName(i)) + "</span>" +
        '<span class="sc-num">' + scoreOf(i) + '</span><span class="sc-btns">' +
        [-1, 1, 2, 3].map(function (v) { return '<button type="button" data-act="score" data-i="' + i + '" data-v="' + v + '">' + (v > 0 ? "+" + v : "−1") + "</button>"; }).join("") + "</span></div>";
    });
    html += '</div><div class="sc-foot"><a class="btn ghost small" href="#/scores">' + t("leaderboard") + "</a></div>";
    d.innerHTML = html;
  }

  // ---------- timer ----------
  function timeLeft() {
    var tmr = ST.timer; if (!tmr) return 0;
    return tmr.endsAt ? Math.max(0, Math.round((tmr.endsAt - Date.now()) / 1000)) : tmr.left;
  }
  function fmt(s) { var m = Math.floor(s / 60), x = s % 60; return m + ":" + (x < 10 ? "0" : "") + x; }
  function renderTimer() {
    var el = document.getElementById("timer");
    var tmr = ST.timer;
    if (!tmr) { el.hidden = true; return; }
    el.hidden = false;
    var left = timeLeft(), done = left === 0;
    var pct = tmr.total ? Math.round(100 * (tmr.total - left) / tmr.total) : 0;
    var label = h(tmr.label || t("timer"));
    if (!el._built) {
      el.innerHTML = '<div class="tm-label"></div><div class="tm-time"></div><div class="tm-bar"><i></i></div><div class="tm-btns">' +
        '<button type="button" data-act="tpause"></button><button type="button" data-act="tplus">' + t("plusMin") + '</button><button type="button" data-act="tclose">' + t("close") + "</button></div>";
      el._built = true;
    }
    el.querySelector(".tm-label").innerHTML = label;
    el.querySelector(".tm-time").textContent = done ? t("timesUp") : fmt(left);
    el.querySelector(".tm-bar i").style.width = pct + "%";
    el.querySelector('[data-act="tpause"]').textContent = tmr.endsAt ? t("pause") : (done ? t("restart") : t("resume"));
    el.classList.toggle("done", done);
    el.classList.toggle("low", !done && left <= 30 && tmr.total > 60);
  }
  setInterval(function () { if (ST.timer) renderTimer(); }, 250);

  // q: the live question this timer belongs to ("beat:index"); its buttons then control answering on the phones
  function startTimer(secs, label, q) {
    ST.timer = { total: secs, endsAt: Date.now() + secs * 1000, left: secs, label: label || "", q: q || null };
    commit(null); renderTimer();
  }

  function openTimerMenu() {
    var m = document.getElementById("timermenu");
    m.hidden = !m.hidden;
    if (!m.hidden) {
      m.innerHTML = "<p>" + t("startATimer") + '</p><div class="tmenu">' + [45, 60, 180, 300, 600, 720, 900, 1080, 1500].map(function (sec) {
        return '<button type="button" data-act="timer" data-secs="' + sec + '" data-label="">' + (sec < 60 ? t("secShort", { n: sec }) : t("minPreset", { n: sec / 60 })) + "</button>";
      }).join("") + "</div>";
    }
  }

  // ---------- glossary popover ----------
  var pop = document.getElementById("termpop");
  function showTerm(btn) {
    var g = C.glossary[btn.getAttribute("data-term")]; if (!g) return;
    pop.innerHTML = "<b>" + h(g.term) + "</b><p>" + h(g.def) + "</p>";
    pop.hidden = false;
    var r = btn.getBoundingClientRect();
    var w = Math.min(340, window.innerWidth - 32);
    pop.style.width = w + "px";
    var left = Math.min(Math.max(16, r.left + window.scrollX), window.scrollX + window.innerWidth - w - 16);
    pop.style.left = left + "px";
    pop.style.top = (r.bottom + window.scrollY + 8) + "px";
  }

  // ---------- events ----------
  document.addEventListener("click", function (e) {
    var term = e.target.closest(".term");
    if (term) { e.preventDefault(); showTerm(term); return; }
    if (!e.target.closest("#termpop")) pop.hidden = true;
    var tm = document.getElementById("timermenu");
    if (!tm.hidden && !e.target.closest("#timermenu") && !e.target.closest("#timerBtn")) tm.hidden = true;

    var a = e.target.closest("[data-act]");
    if (!a) return;
    if (NOTESVIEW && ["copytext", "flip", "flipall", "togglenotes", "casefile", "casego", "closecase"].indexOf(a.getAttribute("data-act")) < 0) return;   // notes: no controls
    var act = a.getAttribute("data-act"), id = a.getAttribute("data-id"), u = id ? ui(id) : null;
    switch (act) {
      case "reveal": u.shown = true; if (LIVE) LIVE.onReveal(id, u.i || 0); commit(id); refreshBeat(id); break;
      case "hide": u.shown = false; u.owners = false; commit(id); refreshBeat(id); break;
      case "owners": u.owners = true; commit(id); refreshBeat(id); break;
      case "step":
        var b = BEATS[id], len = (b.questions || b.pairs || b.items || (b.stations && b.stations[0].questions)).length;
        u.i = Math.min(len - 1, Math.max(0, (u.i || 0) + (+a.getAttribute("data-dir")))); u.shown = false;
        commit(id); refreshBeat(id); break;
      case "flip":
        u.flipped = u.flipped || {}; var k = a.getAttribute("data-key"); u.flipped[k] = !u.flipped[k];
        commit(id); syncFlips(BEATS[id]); break;
      case "flipall": u.flipped = {}; commit(id); syncFlips(BEATS[id]); break;
      case "tbopen": u.open = u.open || {}; u.open[a.getAttribute("data-key")] = true; commit(id); refreshBeat(id); break;
      case "tbrest": u.open = {}; u.rest = true; BEATS[id].answers.forEach(function (x) { u.open[x.key] = true; }); commit(id); refreshBeat(id); break;
      case "tbaward":
        // the tile's points go to the team that named it; the same team again, or ×, takes them back
        var tk = a.getAttribute("data-key"), tt = +a.getAttribute("data-team"), tans = BEATS[id].answers.filter(function (x) { return x.key === tk; })[0];
        u.got = u.got || {};
        var prev = u.got[tk];
        if (prev != null && ST.teams[prev]) ST.teams[prev].score = Math.max(0, ST.teams[prev].score - tans.pts);
        if (prev === tt || tt < 0 || !ST.teams[tt]) delete u.got[tk];
        else { u.got[tk] = tt; ST.teams[tt].score += tans.pts; }
        commit("teams"); refreshBeat(id); renderScores(); refreshTeamViews(); break;
      case "tbreset":
        Object.keys(u.got || {}).forEach(function (k2) {
          var ta = BEATS[id].answers.filter(function (x) { return x.key === k2; })[0], tm2 = u.got[k2];
          if (ta && ST.teams[tm2]) ST.teams[tm2].score = Math.max(0, ST.teams[tm2].score - ta.pts);
        });
        u.open = {}; u.got = {}; u.rest = false; commit("teams"); refreshBeat(id); renderScores(); refreshTeamViews(); break;
      case "copytext": copy(a.getAttribute("data-text"), a.getAttribute("data-label") || t("lblText")); break;
      case "startpick": startPick = a.getAttribute("data-key"); renderStart(); break;
      case "cardrole": var rk = a.getAttribute("data-key"); if (CARD.r !== rk) { CARD.r = rk; CARD.t = []; } saveCard(); renderCard(); break;
      case "cardtask": var ti = +a.getAttribute("data-i"), tp = CARD.t.indexOf(ti); if (tp >= 0) CARD.t.splice(tp, 1); else if (CARD.t.length < 3) CARD.t.push(ti); saveCard(); renderCard(); break;
      case "cardbrief": var bk = a.getAttribute("data-key"), bp = CARD.b.indexOf(bk); if (bp >= 0) CARD.b.splice(bp, 1); else CARD.b.push(bk); saveCard(); renderCard(); break;
      case "carddl": cardDownload(); break;
      case "cardshare": cardShare(); break;
      case "togglenotes": setNotes(!notesOn); break;
      case "casefile": openCase(a.getAttribute("data-sec")); break;
      case "casego": openCase(a.getAttribute("data-sec")); break;
      case "closecase": closeCase(); break;
      case "timer": document.getElementById("timermenu").hidden = true; startTimer(+a.getAttribute("data-secs"), a.getAttribute("data-label")); break;
      case "tpause":
        var tm1 = ST.timer; if (!tm1) break;
        var tact = tm1.endsAt ? "pause" : (tm1.left > 0 ? "resume" : "restart");
        if (tm1.endsAt) { tm1.left = timeLeft(); tm1.endsAt = null; }
        else if (tm1.left > 0) { tm1.endsAt = Date.now() + tm1.left * 1000; }
        else { tm1.endsAt = Date.now() + tm1.total * 1000; tm1.left = tm1.total; }
        if (LIVE) LIVE.onTimer(tact, tm1);
        commit(null); renderTimer(); break;
      case "tplus":
        var t2 = ST.timer; if (!t2) break;
        if (t2.endsAt) t2.endsAt = Math.max(t2.endsAt, Date.now()) + 60000; else t2.left += 60;
        t2.total += 60;
        if (LIVE) LIVE.onTimer("plus", t2);
        commit(null); renderTimer(); break;
      case "tclose":
        if (LIVE && ST.timer) LIVE.onTimer("close", ST.timer);
        ST.timer = null; commit(null); renderTimer(); break;
      case "score":
        var i = +a.getAttribute("data-i"); ST.teams[i].score = Math.max(0, ST.teams[i].score + (+a.getAttribute("data-v")));
        commit("teams"); renderScores(); refreshTeamViews(); break;
      case "openscores": ST.scoresOpen = true; commit(null); renderScores(); break;
      case "closescores": ST.scoresOpen = false; commit(null); renderScores(); break;
      case "markdone":
        L.done[a.getAttribute("data-sid")] = true; saveL();
        var mr = document.getElementById("markrow"); if (mr) mr.innerHTML = markBtn(a.getAttribute("data-sid"));
        toast(t("roundMarked")); break;
      case "ans":
        var wh = a.getAttribute("data-which"), qid = a.getAttribute("data-q"), oi = +a.getAttribute("data-i");
        L.draft[wh] = L.draft[wh] || {}; L.draft[wh][qid] = oi; saveL();
        document.querySelectorAll('#q-' + qid + ' .cq-opt').forEach(function (o) { var on = +o.getAttribute("data-i") === oi; o.classList.toggle("sel", on); o.setAttribute("aria-pressed", on ? "true" : "false"); });
        var cnt = document.getElementById("ckCount"); if (cnt) cnt.textContent = t("answered", { a: Object.keys(L.draft[wh]).length, n: A.questions.length });
        break;
      case "submitcheck":
        var w2 = a.getAttribute("data-which"), nm = (document.getElementById("ckName").value || "").trim(), dr = L.draft[w2] || {};
        if (!nm) { toast(t("addName")); document.getElementById("ckName").focus(); break; }
        var missing = A.questions.filter(function (q) { return dr[q.id] == null; });
        if (missing.length) { toast(t("answerAll", { n: A.questions.length, m: missing.length })); document.getElementById("q-" + missing[0].id).scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "center" }); break; }
        L.name = nm; L[w2] = { answers: JSON.parse(JSON.stringify(dr)), at: Date.now(), sent: false }; saveL();
        if (LIVE && LIVE.enabled()) { if (w2 === "post") postAskedAt = Date.now(); resendAt[w2] = Date.now(); LIVE.check(w2, nm, L[w2].answers).then(function (r) { confirmed(w2, r); }); }
        renderCheck(w2); window.scrollTo({ top: 0, behavior: "instant" }); toast(t("submittedToast")); break;
      case "resetlearner":
        var rl = document.getElementById("resetLearner");
        if (!rl.dataset.armed) { rl.dataset.armed = "1"; rl.textContent = t("resetLearnerArm"); setTimeout(function () { if (rl.isConnected) { delete rl.dataset.armed; rl.textContent = t("resetLearner"); } }, 4000); break; }
        L = { name: "", done: {}, pre: null, post: null, draft: { pre: {}, post: {} } }; saveL(); renderProgress(); toast(t("progressReset")); break;
    }
  });

  document.getElementById("scoresBtn").addEventListener("click", function () { ST.scoresOpen = !ST.scoresOpen; commit(null); renderScores(); });
  document.getElementById("timerBtn").addEventListener("click", function (e) { e.stopPropagation(); openTimerMenu(); });

  // ---------- block by block: a presenter clicker (Page Down, Page Up) or the left and right arrows ----------
  // Each press brings the next block of the round to the top of the screen; after the last block comes the next round.
  // The block in view is shared as ST.focus, so the notes tab scrolls to the same block.
  function pageBlocks() { return Array.prototype.slice.call(document.querySelectorAll("#app .dayhero, #app .beat")); }
  var steppedAt = 0;   // while the last step is still scrolling, count from the block it went to
  function currentBlock(list) {
    var byScroll = 0, fi = -1;
    list.forEach(function (el, i) { if (el.getBoundingClientRect().top <= 90) byScroll = i; if (ST.focus && el.getAttribute("data-beat") === ST.focus) fi = i; });
    if (fi >= 0 && Date.now() - steppedAt < 1200) return fi;
    if (fi >= 0) { var r = list[fi].getBoundingClientRect(); if (r.top < window.innerHeight && r.bottom > 60) return Math.max(fi, byScroll); }
    return byScroll;
  }
  function scrollToBlock(el) { if (el) el.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" }); }
  function stepBlock(dir) {
    var m = location.hash.match(/^#\/s\/([a-z0-9]+)/), idx = m ? sectionIndex(m[1]) : -1;
    if (idx < 0) return false;
    var list = pageBlocks(), j = currentBlock(list) + dir;
    if (j >= list.length || j < 0) {
      var to = SECTIONS[idx + (j < 0 ? -1 : 1)];
      if (to) { ST.focus = null; save(); location.hash = "#/s/" + to.id; }
      return true;
    }
    ST.focus = list[j].getAttribute("data-beat") || null;
    steppedAt = Date.now();
    scrollToBlock(list[j]);
    commit("focus");
    return true;
  }
  // notes tab: scroll to the block the presentation shows (explicit: the presentation moved, so the top counts too)
  function followFocus(explicit) {
    var el = ST.focus ? document.getElementById("b-" + ST.focus) : null;
    if (el) scrollToBlock(el); else if (explicit) window.scrollTo({ top: 0, behavior: reduced() ? "auto" : "smooth" });
  }

  document.addEventListener("keydown", function (e) {
    if (NOTESVIEW) return;
    if (e.target.closest && e.target.closest("input, textarea")) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if ((e.key === "PageDown" || e.key === "ArrowRight") && stepBlock(1)) e.preventDefault();
    else if ((e.key === "PageUp" || e.key === "ArrowLeft") && stepBlock(-1)) e.preventDefault();
    else if (e.key === "s") { ST.scoresOpen = !ST.scoresOpen; commit(null); renderScores(); }
    else if (e.key === "Escape") { pop.hidden = true; document.getElementById("timermenu").hidden = true; }
  });

  // ---------- static words ----------
  (function () {
    var q = function (sel) { return document.querySelector(sel); };
    var bn = q(".brand-name"); if (bn) bn.innerHTML = h(t("brand")) + " <span>" + h(t("brandDay")) + "</span>";
    var bl = q(".brand"); if (bl) bl.setAttribute("aria-label", t("home"));
    var pg = q("a.progress"); if (pg) pg.title = t("myProgress");
    document.getElementById("scoresBtn").textContent = t("scores");
    var tools = q(".tools");
    if (tools && C.caseFile) tools.insertAdjacentHTML("afterbegin", '<button class="toolbtn" type="button" data-act="casefile">' + h(t("caseBtn")) + "</button>");
    document.getElementById("timerBtn").textContent = t("timer");
    var gl = q('#footActions a[href="#/glossary"]'); if (gl) gl.textContent = t("glossary");
    var fc = q(".footer-credit"); if (fc) fc.innerHTML = "<strong>" + h(C.instructor) + "</strong> · " + h(t("credit"));
    var fl = q(".instructor-flag"); if (fl) fl.textContent = t("instructorFlag");
    document.title = C.title + " " + C.titleAccent + (EDITION === "instructor" ? " · " + t("instructorFlag") : "");
  })();

  // ---------- instructor edition ----------
  var setNotes = function () { };
  if (EDITION === "instructor") {
    // the switch for the facilitator notes sits on the Dashboard (never in the footer, which the projector shows)
    var notesOn = true;
    try { notesOn = localStorage.getItem("arla.notes") !== "0"; } catch (e) { /* ignore */ }
    setNotes = function (on) { notesOn = !!on; applyNotes(); };
    var applyNotes = function () {
      document.body.classList.toggle("notes-off", !notesOn);
      document.querySelectorAll('[data-act="togglenotes"]').forEach(function (b) { b.textContent = notesOn ? t("hideNotes") : t("showNotes"); });
      try { localStorage.setItem("arla.notes", notesOn ? "1" : "0"); } catch (e) { /* ignore */ }
    };
    applyNotes();
    document.body.classList.add("instructor");
  }
  // ---------- live play ----------
  if (window.LiveGame) {
    LIVE = window.LiveGame({
      t: t, h: h, T: T, C: C, N: N, EDITION: EDITION, BEATS: BEATS, SECTIONS: SECTIONS, LETTERS: LETTERS,
      shuffledIdx: shuffledIdx, reduced: reduced, toast: toast, teamName: teamName, renderBeat: renderBeat, startTimer: startTimer,
      scoreOf: function (i) { return scoreOf(i); },
      getST: function () { return ST; }, setST: function (s) { ST = s; save(); },
      // a fresh game on the presentation: no reveals, no positions, no manual points, no timer
      resendChecks: function () { resendChecks(); },
      resetGame: function () { ST = freshST(); save(); renderScores(); renderTimer(); },
      applyState: applyState, route: function () { route(); }, renderNav: renderNav, renderScores: renderScores, refreshTeamViews: refreshTeamViews,
      getL: function () { return L; }, setLName: function (n) { L.name = n; saveL(); },
      setNotes: function (on) { setNotes(on); },
      notesOn: function () { return notesOn; }
    });
  }

  // ---------- router ----------
  var lastRoute = null;
  function route() {
    var hsh = location.hash || "#/";
    var m;
    var y = hsh === lastRoute ? window.scrollY : 0;
    if (EDITION === "audience" && LIVE && LIVE.enabled() && !/^#\/(play|pre|post|files|start|card)/.test(hsh)) { location.hash = "#/play"; return; }
    if (LIVE && LIVE.render(hsh, app)) { /* live play page */ }
    else if ((m = hsh.match(/^#\/s\/([a-z0-9]+)/))) renderSection(m[1]);
    else if (/^#\/scores/.test(hsh)) renderBoard();
    else if (/^#\/glossary/.test(hsh)) renderGlossary();
    else if (/^#\/files/.test(hsh)) renderFiles();
    else if (/^#\/start/.test(hsh)) renderStart();
    else if (/^#\/card/.test(hsh)) renderCard();
    else if (/^#\/pre/.test(hsh)) renderCheck("pre");
    else if (/^#\/post/.test(hsh)) renderCheck("post");
    else if (/^#\/progress/.test(hsh)) renderProgress();
    else renderHome();
    updateProgress();
    window.scrollTo({ top: y, left: 0, behavior: "instant" });
    if (hsh !== lastRoute && LIVE) LIVE.onRoute(hsh);
    lastRoute = hsh;
  }
  window.addEventListener("hashchange", route);
  route(); renderScores(); renderTimer();
})();
