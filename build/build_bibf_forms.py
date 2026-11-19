"""Fill BIBF's two pre-course forms from the course data:
  outputs/bibf/<class code> - Lesson Plan.docx              one table per day (BIBF asks to copy the table per day)
  outputs/bibf/<class code> - Pre and Post Assessment.docx  the questions with the ILO table and the answers ticked
Templates: build/templates/ (BIBF's blank forms, as sent for the previous BIBF course; the header fields are refilled
from course.js qa). The three ILOs are drafts until BIBF confirms which apply.
Usage (from the project root): DOCX_SKILL=<docx skill> build/.venv/bin/python build/build_bibf_forms.py
"""
import json
import os
import re
import shutil
import subprocess
import tempfile
import zipfile
from xml.sax.saxutils import escape

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
OUT = os.path.join(ROOT, "outputs", "bibf")
PARA = re.compile(r"<w:p[ >].*?</w:p>", re.S)
HL = '<w:highlight w:val="yellow"/>'


def load_js(path, var):
    code = 'const fs=require("fs"),vm=require("vm");const c={window:{}};vm.createContext(c);vm.runInContext(fs.readFileSync(%s,"utf8"),c);console.log(JSON.stringify(c.window.%s))' % (json.dumps(path), var)
    return json.loads(subprocess.run(["node", "-e", code], capture_output=True, text=True, check=True).stdout)


COURSE = load_js(os.path.join(ROOT, "site", "data", "course.js"), "COURSE")
KEY = load_js(os.path.join(ROOT, "site", "instructor", "key.js"), "ASSESSMENT_KEY")


def text_of(p):
    return "".join(re.findall(r"<w:t[^>]*>([^<]*)</w:t>", p))


def set_text(p, text, bold=False):
    """Keep the paragraph properties and the first run's formatting; replace all runs by one run with the text."""
    p = p.replace(HL, "")
    m = re.search(r"<w:r>(<w:rPr>.*?</w:rPr>)?", p, re.S) or re.search(r"<w:r [^>]*>(<w:rPr>.*?</w:rPr>)?", p, re.S)
    rpr = (m.group(1) or "") if m else ""
    if bold and "<w:b/>" not in rpr:
        rpr = rpr.replace("<w:rPr>", "<w:rPr><w:b/>") if rpr else "<w:rPr><w:b/></w:rPr>"
    head = p[: p.index("</w:pPr>") + len("</w:pPr>")] if "</w:pPr>" in p else re.match(r"<w:p[^>]*>", p).group(0)
    return head + '<w:r>%s<w:t xml:space="preserve">%s</w:t></w:r></w:p>' % (rpr, escape(text))


def clear_text(p):
    return set_text(p, "")


def zip_dir(src, dst):
    if os.path.exists(dst):
        os.remove(dst)
    with zipfile.ZipFile(dst, "w", zipfile.ZIP_DEFLATED) as z:
        for base, _, files in os.walk(src):
            for f in files:
                full = os.path.join(base, f)
                z.write(full, os.path.relpath(full, src))


def unpack(template):
    d = tempfile.mkdtemp()
    with zipfile.ZipFile(template) as z:
        z.extractall(d)
    for base, dirs, files in os.walk(d):  # templates come from outside: drop any symlinks
        for f in files + dirs:
            if os.path.islink(os.path.join(base, f)):
                os.remove(os.path.join(base, f))
    subprocess.run([os.path.join(ROOT, "build", ".venv", "bin", "python"), MERGE, d], check=True, capture_output=True)
    return d


SKILL = os.environ.get("DOCX_SKILL", "")
MERGE = os.path.join(SKILL, "scripts", "merge_runs.py")

# ---------------------------------------------------------------- the lesson plan, one table per day
QA = COURSE["qa"]
CLS = QA["code"].split(" · ")[0]
CODE = QA["code"].split(" · ")[-1]
# The three draft ILOs (until BIBF confirms which apply), and the assessment topics that test each one (course.js topics T1 to T3)
ILOS = [("ILO 1: Explain how digital transformation and data change the way a dairy business works, and where AI fits along its value chain.", ["T1"]),
        ("ILO 2: Apply Microsoft Copilot to everyday tasks (drafting, summarising, analysing and comparing) using clear briefs and the right material.", ["T2"]),
        ("ILO 3: Evaluate AI-generated outputs for accuracy, completeness and confidentiality before they are used or sent.", ["T3"])]
DAYS = [
    {"n": 1, "ilos": [ILOS[0][0] + " (Rounds 1 and 4, and the value chain case clinic)", ILOS[1][0] + " (Round 2, the quick win and Jobs 1 to 3)",
                      ILOS[2][0] + " (Round 3, and a check in every job)"],
     "topics": ["Digital transformation in a dairy business: digitisation, digitalisation and digital transformation; where a dairy's data comes from; four ways to describe data (structure, form, source, producer); the knowledge pyramid from data to decisions; data as an asset; food-industry peers using Microsoft Copilot",
                "How generative AI works and why it can be confidently wrong; the jagged frontier; Copilot Chat and ChatGPT; what participants have at work (Copilot Chat, and Microsoft 365 Copilot for licensed users)",
                "Briefing Copilot like a colleague: the four-part brief; letting AI write the prompt from an information pack, with multiple-choice questions; the data rules and the Saudi and Bahraini personal data laws",
                "Working from files and checking before trusting: what AI misses in long files, hidden instructions (prompt injection, the EchoLeak case), trust and checking, the checking list, a second opinion from a fresh chat",
                "AI across the dairy value chain: Industry 4.0 (sensors, predictive maintenance, traceability, demand forecasting, camera checks); classic and generative AI along the chain"],
     "activities": ["A warm-up question on the phones (not scored) to check every phone works; pre-course assessment on participants' phones; a quick win: a ready prompt for each participant's own role, copied from the course site into Copilot Chat",
                    "Short lectures on the course site with examples from the case company, Ghaima Dairy, a fictional GCC dairy maker; a team guessing board on where Ghaima's data comes from, ranked by how often new data arrives and tagged by kind of data",
                    "Team quizzes on phones after each lecture (which word fits, which kind of data, which brief wins, what's missing, safe to hand over, spot the slip); a warm-up comparing Copilot Chat and ChatGPT",
                    "Three hands-on jobs in Copilot Chat on the lab PCs, each from one department of the case company, each with a hidden catch checked through questions on the phones and shown to the class: "
                    "a night shift's stoppage log into a handover and a safety poster (Production); three supplier quotes with a footnote fee, a minimum order and a hidden instruction (Procurement); "
                    "a fix and checklist from a manual covering two machine models (Maintenance)",
                    "Value chain case clinic in Copilot Chat: each team maps its top AI opportunities from a pack on the course site, kept open for the action plans"],
     "time": ["Kick-off and quick win: 30 min", "Round 1: 25 min", "Round 2: 35 min", "Job 1: 35 min", "Round 3: 20 min", "Job 2: 35 min",
              "Round 4 and case clinic: 30 min", "Job 3: 35 min", "Day 1 close: 10 min", "Breaks: 45 min (15 min break, 30 min Dhuhr and lunch)", "Total: 5 hours"],
     "assess": ["Pre-course assessment: %d questions, 5 for each ILO" % len(COURSE["assessment"]["questions"]),
                "In-class team quizzes on phones with immediate feedback",
                "Three hands-on jobs checked through questions answered from the participants' own AI results, and shown to the class"]},
    {"n": 2, "ilos": [ILOS[1][0] + " (Round 5, Jobs 4 to 6, and each participant's own prompts and desk card)",
                      ILOS[2][0] + " (Round 6, and a check in every job)",
                      ILOS[0][0] + " (Team action plans, built on Day 1's value chain map)"],
     "topics": ["Patterns that save time: examples to copy a style (few-shot), what a role does and doesn't do, the interview with multiple-choice questions, self-critique, the recipe for images",
                "Analysing figures and replying to customers with Copilot: units, missing data, checking a draft against the records",
                "Bringing your team along: why people stop using AI, what keeps them going (training and manager support), agents and what needs a licence",
                "Turning the course into daily practice: reusable prompts for each participant's weekly tasks, a personal desk card with an if-then plan, and a team action plan"],
     "activities": ["Recap quiz on phones",
                    "Short lectures and team quizzes on phones",
                    "Three hands-on jobs in Copilot Chat: a month's production and waste figures into a commentary and a chart, with a unit slip and a missing week (Planning); "
                    "a customer complaint, the delivery log and a colleague's draft reply (Logistics); a choice of stations: month-end commentary with a one-off cost (Finance), "
                    "a draft export label against a practice checklist (Regulatory), or batch QC results against a practice spec (Lab)",
                    "My card: each participant picks their role and weekly tasks on the course site, has Copilot write reusable prompts and a desk card, tests a prompt on a tricky case, and takes the pack home on their phone",
                    "Team action plans presented to the class; post-course assessment, final team leaderboard, and course evaluation"],
     "time": ["Day 2 kick-off: 15 min", "Round 5: 20 min", "Job 4: 35 min", "Job 5: 35 min", "Round 6: 15 min", "Job 6: 35 min",
              "My card: 35 min", "Team action plans: 25 min", "Final: 40 min", "Breaks: 45 min (15 min break, 30 min Dhuhr and lunch)", "Total: 5 hours"],
     "assess": ["In-class team quizzes on phones with immediate feedback",
                "Three hands-on jobs checked through questions answered from the participants' own AI results, and shown to the class",
                "Each participant's reusable prompts tested on a tricky case",
                "Post-course assessment: the same %d questions as at the start" % len(COURSE["assessment"]["questions"])]},
]
DIFFERENTIATION = ("Every job has a step-by-step guide with Windows shortcuts on the course site and a Copy button for each pack and prompt, so nobody types a long prompt: "
                   "participants paste an information pack and answer the AI's questions with a letter. Teams mix functions, seniority and locations, and the team member "
                   "closest to each job's department leads it. Each job has an extra step for those who finish early. In Job 6 each team picks the station closest to its "
                   "members' work. Key terms are defined in the course site's glossary.")
ADJUST = {1: "The pre-course assessment results are reviewed during the first break; Rounds 3 and 4 give more time to the topics with the lowest scores. "
             "If the room runs late, theory is shortened and quiz questions are dropped before any job time is cut.",
          2: "Day 2 opens with a recap quiz on Day 1; topics with weak recap answers are revisited in Round 5. The team action plans start from the opportunities each team mapped on Day 1."}
ONLINE = "Not applicable: the course is delivered in person. The quizzes and the pre- and post-course assessments run on participants' phones through the course site."
REMARKS = ("Participants need lab PCs with Microsoft Edge that reach Microsoft Copilot Chat and ChatGPT and allow file uploads and downloads, and Wi-Fi for their phones; "
           "the instructor needs a projector input for a laptop. Participants sign in with the accounts "
           "BIBF provides for the session only, in a private window, and delete their chats and sign out at the end of each day. All case files are fictional. "
           "Course files and quizzes are on the course site, with a class login given in class. The course is delivered for Arla Foods; participants come from Bahrain and Saudi Arabia.")
DROP = "@@DROP@@"


def fill_day(tbl, day):
    paras = PARA.findall(tbl)
    out, dots = tbl, 0
    for p in paras:
        t = text_of(p)
        new = None
        if t.strip() in ("Day 1", "Day1"):
            new = set_text(p, "Day %d" % day["n"])
        elif t.startswith("ILO1:"):
            new = "".join(set_text(p, x) for x in day["ilos"])
        elif t.startswith("ILO2:"):
            new = ""
        elif t.startswith(("Please list the intended", "Please list the topics", "Please list all activities", "List the assessments given")):
            new = ""
        elif t == "…":
            group = ["topics", "activities", "assess"][dots // 3]
            new = "".join(set_text(p, x) for x in day[group]) if dots % 3 == 0 else ""
            dots += 1
        elif t.startswith("Write the time taken"):
            new = "".join(set_text(p, x) for x in day["time"])
        elif t.startswith("List the adjustments you made and special support"):
            new = set_text(p, DIFFERENTIATION)
        elif t.startswith("List the adjustments made to your lesson plan"):
            new = set_text(p, ADJUST[day["n"]])
        elif t.startswith("List the adjustments made to the learning materials"):
            new = set_text(p, ONLINE)
        elif t.startswith("Mention your comments"):
            new = set_text(p, REMARKS)
        if new is not None:
            out = out.replace(p, new, 1)
    # the table is used once per day: bookmarks inside it would repeat their ids, so they go
    out = re.sub(r"<w:bookmark(Start|End) [^>]*/>", "", out)
    # rows grow with their content (the template fixes some heights exactly)
    out = out.replace('w:hRule="exact"', 'w:hRule="atLeast"')
    return out.replace(HL, "")


def lesson_plan():
    d = unpack(os.path.join(ROOT, "build", "templates", "bibf-lesson-plan.docx"))
    path = os.path.join(d, "word", "document.xml")
    x = open(path, encoding="utf-8").read()
    a, b = x.index("<w:tbl>"), x.index("</w:tbl>") + len("</w:tbl>")
    before, tbl, after = x[:a], x[a:b], x[b:]
    # the instruction line above the table goes
    for p in PARA.findall(before):
        if text_of(p).strip().startswith("Please copy and paste the table"):
            before = before.replace(p, "")
    page_break = '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'
    x = before + page_break.join(fill_day(tbl, d) for d in DAYS) + after
    # the header fields: course title and class code, course code, venue
    for p in PARA.findall(x):
        t = text_of(p).strip()
        if re.match(r"^CLS-\d+", t):
            x = x.replace(p, set_text(p, CLS + "-" + QA["title"]), 1)
        elif re.match(r"^COM\d+$", t):
            x = x.replace(p, set_text(p, CODE), 1)
    open(path, "w", encoding="utf-8").write(x)
    dst = os.path.join(OUT, CLS + " - Lesson Plan.docx")
    zip_dir(d, dst)
    shutil.rmtree(d)
    return dst


# ---------------------------------------------------------------- the pre- and post-course assessment
def option_paragraph(p, text, correct):
    """An option paragraph: keep its numbering, box run then text run; the right answer is ticked and bold."""
    p = p.replace(HL, "")
    head = p[: p.index("</w:pPr>") + len("</w:pPr>")]
    box = '<w:r><w:rPr><w:rFonts w:ascii="Calibri" w:eastAsia="Times New Roman" w:hAnsi="Calibri" w:cs="Calibri"/><w:bCs/><w:sz w:val="40"/><w:szCs w:val="40"/></w:rPr><w:t>%s</w:t></w:r>' % ("☑" if correct else "□")
    rpr = '<w:rPr><w:rFonts w:eastAsia="Times New Roman" w:cs="Arial"/>%s</w:rPr>' % ("<w:b/>" if correct else "")
    return head + box + '<w:r>%s<w:t xml:space="preserve"> %s</w:t></w:r></w:p>' % (rpr, escape(text))


def assessment():
    d = unpack(os.path.join(ROOT, "build", "templates", "bibf-pre-post-assessment.docx"))
    path = os.path.join(d, "word", "document.xml")
    x = open(path, encoding="utf-8").read()
    paras = PARA.findall(x)
    texts = [text_of(p) for p in paras]
    A = COURSE["assessment"]
    by_topic = {t["id"]: [i + 1 for i, q in enumerate(A["questions"]) if q["topic"] == t["id"]] for t in A["topics"]}
    repl = {}
    # the title line under the logo
    title_i = next(i for i, t in enumerate(texts) if t.strip())
    repl[title_i] = set_text(paras[title_i], QA["title"])
    # the ILO table: one name, one mark count and one question list per ILO; rows for ILOs the course lacks go
    rows = [i for i, t in enumerate(texts) if t.strip().startswith("ILO:")]
    assert len(ILOS) <= len(rows), "the template has room for %d ILOs" % len(rows)
    for k, row in enumerate(rows):
        end = rows[k + 1] if k + 1 < len(rows) else row + 4
        cells = list(range(row + 1, end))
        marks = [i for i in cells if texts[i].strip().endswith("Marks")]
        lists = [i for i in cells if re.match(r"^[\d, ]+$", texts[i].strip() or "x")]
        if k >= len(ILOS):
            repl[row] = set_text(paras[row], DROP)
            continue
        name, tids = ILOS[k]
        nums = sorted(n for tid in tids for n in by_topic.get(tid, []))
        repl[row] = set_text(paras[row], name)
        repl[marks[0]] = set_text(paras[marks[0]], "%d Marks" % len(nums))
        for extra in marks[1:]:
            repl[extra] = ""
        repl[lists[0]] = set_text(paras[lists[0]], ", ".join(str(n) for n in nums))
    # the sample note goes; the questions replace the sample questions one for one
    for i, t in enumerate(texts):
        if t.strip().startswith("((following are the sample"):
            repl[i] = ""
    first_q = next(i for i, t in enumerate(texts) if t.startswith("According to Shannon"))
    q_idx = [i for i in range(first_q, len(paras)) if "<w:numPr>" in paras[i] and "□" not in texts[i] and texts[i].strip()]
    assert len(A["questions"]) <= len(q_idx), "the template has %d question slots" % len(q_idx)
    for k, qi in enumerate(q_idx):
        stop = q_idx[k + 1] if k + 1 < len(q_idx) else len(paras)
        if k >= len(A["questions"]):   # a slot the course does not need: the question and its options go
            repl[qi] = ""
            for oi in range(qi + 1, stop):
                if "□" in texts[oi]:
                    repl[oi] = ""
            continue
        q = A["questions"][k]
        ans = KEY[q["id"]]["answer"]
        repl[qi] = set_text(paras[qi], q["q"])
        opts = [i for i in range(qi + 1, stop) if "□" in texts[i]]
        numpr = re.search(r"<w:numPr>.*?</w:numPr>", paras[opts[0]], re.S).group(0)
        ppr = re.search(r"<w:pPr>.*?</w:pPr>", paras[opts[0]], re.S).group(0)
        for j, oi in enumerate(opts):
            if j >= len(q["options"]):
                repl[oi] = ""
                continue
            p = paras[oi]
            if "<w:numPr>" not in p:  # the template's last option lost its numbering
                p = p.replace("<w:pPr>", "<w:pPr>" + numpr, 1)
            # every option takes the first option's paragraph style (the template's closing paragraph is centred and grey)
            p = re.sub(r"<w:pPr>.*?</w:pPr>", lambda m: ppr, p, count=1, flags=re.S)
            repl[oi] = option_paragraph(p, q["options"][j], j == ans)
    out = []
    pos = 0
    for i, m in enumerate(PARA.finditer(x)):
        out.append(x[pos:m.start()])
        out.append(repl.get(i, m.group(0)))
        pos = m.end()
    out.append(x[pos:])
    x = "".join(out).replace(HL, "")
    x = re.sub(r"<w:tr[ >](?:(?!</w:tr>).)*" + DROP + r".*?</w:tr>", "", x, flags=re.S)   # unused ILO rows
    open(path, "w", encoding="utf-8").write(x)
    dst = os.path.join(OUT, CLS + " - Pre and Post Assessment.docx")
    zip_dir(d, dst)
    shutil.rmtree(d)
    return dst


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    print("wrote", os.path.relpath(lesson_plan(), ROOT))
    print("wrote", os.path.relpath(assessment(), ROOT))
