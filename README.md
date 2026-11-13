# Working Smarter with AI

Course material for a two-day BIBF workshop for Arla Foods (MENA), delivered in person at BIBF on **Wednesday 18 and Thursday 19 November 2026, 09:00 to 14:00**, on BIBF's lab desktops. 13 participants from Bahrain and Saudi Arabia work in four mixed teams: **Cream, Butter, Cheese and Laban**. English only. One content source feeds the course site, the live phone game, the PowerPoint decks and the BIBF forms. The engine comes from `Iced377/bibf-prompt`; this repository has its own history.

**Status (13 November 2026).** The full course is written from the agreed plan (`docs/course-plan.md`). The teams spend two days visiting the departments of **Ghaima Dairy**, a made-up GCC dairy maker with a plant in North Sitra and an office in Dammam. Each visit is a job in **Copilot Chat** built from the department's own kind of work. Six jobs are run: production, procurement, maintenance, planning, logistics, and a choice of three stations (Finance, Regulatory, Lab). **ChatGPT** is used only to compare. Nobody types a long prompt. People paste an information pack, answer Copilot's multiple-choice questions with a letter, check the prompt it writes, then run it on the job's files. Day 2 ends with **My card**: each person's own prompts and desk card, taken home on their phone (download or share; nothing is emailed or stored). Questions for BIBF and the lab-desktop check: `docs/lab-test.md`. The spec for every case file and its catch: `docs/case-files.md`.

**Content rules.** Gulf audience: never mention alcohol. All data is invented; no real Arla figures, and nothing on Arla's merger plans. Ghaima Dairy must not look like Arla: no Arla brands, and no real Gulf dairy competitors. No live demos, no Microsoft 365 Copilot hands-on, no Arabic materials, nothing printed and nothing emailed.

## How the content is built
Everything is generated; edit the builders, not the outputs.
```
build/.venv/bin/python build/build_data.py      # the job files: site/assets/data/ (needs openpyxl, Pillow, pypdf and Chrome)
python3 build/build_content.py                  # site/data/course.js, site/instructor/key.js, site/instructor/notes.js
NODE_PATH=build/node_modules node build/build_qr.js   # site/assets/join-qr.svg from joinUrl
DOCX_SKILL=<docx skill> build/.venv/bin/python build/build_bibf_forms.py   # outputs/bibf: BIBF lesson plan and pre/post form
```
`build/.venv` holds openpyxl and defusedxml: `python3 -m venv build/.venv && build/.venv/bin/pip install openpyxl==3.1.5 defusedxml==0.7.1`. `build_data.py` finds Chrome through `CHROME`, then the Mac path, then Playwright's headless shell on Linux; its fonts (Caveat for handwriting, Noto Naskh Arabic for the label) are in `build/fonts/` with their OFL licences. After a content change, run the decks and the harness test again.

## What is where
- `site/data/course.js` (generated): all course content, including the pre- and post-course check (`assessment`, 15 questions, no answers). `[[key]]` marks a glossary term defined at the bottom of the file. `qa` holds the course details printed on the QA documents (the class code is `CLS-TBC` until BIBF gives it); `fileTag` names the decks and the CSV.
- `teams`, `fastPoints` (in course.js): four teams; per question the fastest right team gets `fastPoints` (2) and every other right team 1. Team totals only on the projector.
- `quickWin` (in course.js): the Quick win page (`#/start`). Tap a role and copy a ready prompt for Copilot Chat. Used in the Kick-off.
- `card` (in course.js): the My card page (`#/card`). Tap a role, up to three weekly tasks and the take-home briefs; the page builds one pack to paste into Copilot Chat. A QR code carries the choices in the link (`#/card?r=..&t=..&b=..`), so the phone opens the same pack. Download as .txt or Share. Nothing is stored on the server.
- `stations` block (Job 6 results): the presentation assigns each team a station (chips under the block, before Reveal). Each phone then shows and scores that station's questions. Every station has the same number of questions.
- `caseFile` (in course.js): the case file, a dialog over any page: Ghaima Dairy at a glance, the value chain, the people in the files and the files list. Facts only, never an exercise result.
- `site/js/i18n.js`: interface words.
- `site/instructor/notes.js`: facilitator notes, the two-day timetable (rows with `day` head each day), scoring rules, sources and `help` (the "If someone is stuck" lists). Only the instructor page loads it.
- `site/instructor/key.js`: the pre/post answer key with an explanation for every option. Only the instructor page loads it.
- `site/index.html`: participant page (phones and lab desktops). `site/instructor/index.html`: instructor page (presentation and notes).
- `site/js/app.js`: the engine (rendering, routing, checks, scores, timer, Quick win, My card). `site/js/live.js`: the live phone game, stations, the Dashboard and the QA documents. `site/css/style.css`: styles. `site/assets/vendor/qrcode.js`: qrcode-generator 1.4.4 (MIT), for My card.
- `site/api/live.js`: Vercel function that gives each login the database address and public key (the instructor also gets the room token) and creates or updates the database. `site/api/_schema.js`: the database (tables in a private `live` schema, `live_*` functions the browsers call).
- `site/middleware.js`: the password gate (two logins).
- `site/assets/data/`: the 20 job files, made by `build_data.py`. These are PDFs, a phone photo of the handwritten night log, a draft label PNG, workbooks and text files. Every figure and catch is asserted there against `docs/case-files.md`. Participants download them from `#/files`. Each job's task block lists its `files` and `prompts` (each with a Copy button) and a step-by-step `guide` with Windows shortcuts.
- `build/explain.py`: the instructor's explanations, one for each round (`ROUND`) and one under every teaching block and job (`BLOCK`). `build_content.py` attaches them as `explain` and fails if a teaching block has none.
- `build/build_deck.js`: builds both decks from the site data. `build/build_bibf_forms.py`: fills BIBF's Lesson Plan (one table per day) and Pre and Post Assessment forms from the course data. Its three ILOs are drafts until BIBF confirms them.
- `tools/harness/`: the whole live game locally without Vercel or Supabase, for testing.

## Running the days
- Laptop on the projector as an extended display. The projector shows one presentation tab: `/instructor/`. Under each game: **Start on the phones** puts the current question on every phone and starts the timer. **Reveal** shows the answer and adds the points. **Next**, then **Start** again. Only one presentation tab may be open.
- Page Down or the right arrow (a presenter clicker sends the same keys) brings the next block to the top of the screen; Page Up or the left arrow goes back.
- Laptop screen: `/instructor/?notes` shows the notes and follows the presentation. Open the **Dashboard** here so the room never sees it.
- Participants open the site on their phones, sign in with the class login, type a first name, pick their team and press Join. The lab desktops open the same site in a private window for the files, packs and prompts.
- Job 6: at "Job 6 · Station results", tap a station for each team before you Start. Each phone shows its team's station.
- Pre-course check (Kick-off, Day 1) is blind. After the post-course check (Final, Day 2) each phone shows the person's own score at the start and now, never the answers.
- Day 2 starts with a recap quiz. Points carry over; the podium is on Thursday afternoon.

## Dashboard
- **Run box** (presentation tab only): the run number, Close/Reopen roll call, **Clear the game, keep everyone** and **Start over**. Never Start over during the course: it removes everyone, and both days are one run.
- **Scores** and **How everyone is playing**: team points, how many have answered the live question, and per person answered / right / points.
- **People in this run**: Rename, Remove, Merge. One attendance tick per person per day (`qa.days`).
- **Check results** and **Exports**: CSV and the four PDF documents for BIBF. The documents never mention the game.

## Database changes
`SCHEMA_VERSION` in `site/api/_schema.js` goes up whenever the SQL changes. After the deploy, reload the presentation tab once: the instructor page triggers the update.

## Preview and test
```
cd tools/harness && npm install && node server.mjs
```
Then open http://localhost:4183/instructor/ (see `tools/harness/README.md`). Local storage keys start with `arla.`.

## Build the decks
```
cd build && npm install && cd ..
NODE_PATH=build/node_modules APPLY_THEME_JS=<pptx skill>/scripts/apply_theme.js node build/build_deck.js
```
Writes `outputs/BIBF-Arla-Portal.pptx` (for the faculty portal: no speaker notes, no answer key) and `outputs/BIBF-Arla-Facilitator.pptx` (speaker notes and the assessment key). Both are backups; the course runs on the site.

## Hosting
- Vercel project `bibf-arla` (team "Abed's projects"), root directory `site/`, connected to the private GitHub repository `Iced377/bibf-arla`. Every push to `main` is a production deploy at https://bibf-arla.vercel.app, so work happens on the `build` branch and goes to `main` only on Abed's "redeploy".
- Logins: `SITE_USER` / `SITE_PASSWORD` (participants, default user `student`) and `INSTRUCTOR_USER` / `INSTRUCTOR_PASSWORD` (default user `abed`), set by Abed as Vercel environment variables. Until `SITE_PASSWORD` is set, the site answers "Site password is not configured."
- Database: its own Supabase store from the Vercel Marketplace, connected to this project only. `LIVE_ROOM` defaults to `arla`.

## Sources
Listed in `site/instructor/notes.js` (and the notes of the Facilitator deck).
