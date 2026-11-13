# AI Prompt Engineering for Business Professionals

Course material for BIBF class CLS-00018670 (course code COM1247), a one-day workshop delivered in person at BIBF Bahrain Bay on Thursday 12 November 2026, 09:00 to 14:00. English only. One content source feeds the course site, the live phone game and the PowerPoint decks. The engine comes from the BIBF Sales and Marketing Data Analysis course (`~/Developer/bibf-smda`); this repository has its own history.

**Status: Phase 2 (10 November 2026). The full course is written from the agreed plan (`docs/course-plan.md`): six participants work as the AI team of Najma Bank (fictional), each playing alone, and build four simulations in ChatGPT and Copilot, on accounts BIBF provides for the session only on its lab desktops, then show them to the room. Jobs 1 and 2 are built in ChatGPT and Jobs 3 and 4 in Copilot, each with a check in the other tool; the warm-up and Round 2's Your turn use both. Nothing is meant to keep running after the day, so there are no take-home cards. Questions for BIBF and the Thursday 08:15 desktop check for both tools: `docs/lab-test.md`.** Never mention alcohol in any example (Gulf audience).

## How the content is built
Everything is generated; edit the builders, not the outputs.
```
build/.venv/bin/python build/build_data.py      # the job files: site/assets/data/ (needs openpyxl and Google Chrome)
python3 build/build_content.py                  # site/data/course.js, site/instructor/key.js, site/instructor/notes.js
NODE_PATH=build/node_modules node build/build_qr.js   # site/assets/join-qr.svg from joinUrl
DOCX_SKILL=<docx skill> build/.venv/bin/python build/build_bibf_forms.py   # outputs/bibf: BIBF lesson plan and pre/post form
```
`build/.venv` holds openpyxl (for the tracker and the Word forms) and defusedxml: `python3 -m venv build/.venv && build/.venv/bin/pip install openpyxl==3.1.5 defusedxml==0.7.1`. After a content change, run the decks and the harness test again.

## What is where
- `site/data/course.js` (generated): all course content, including the pre- and post-course check (`assessment`, no answers). Charts are data in the questions (`chart`), drawn by `site/js/charts.js`. `[[key]]` marks a glossary term defined at the bottom of the file. `qa` holds the course details printed on the QA documents; `fileTag` names the decks and the CSV.
- `caseFile` (in course.js): the case file, a dialog that opens over any page from the Case file button, the link on block titles and the link under each phone question. `match` names the case company: theory blocks that mention it get the link. It holds facts only, never an exercise result.
- `site/js/i18n.js`: interface words.
- `site/instructor/notes.js`: facilitator notes, timetable (rows with `day` head each day; `offDeck` rows stay off the decks), scoring rules, sources and `help` (the "If someone is stuck" lists). Only the instructor page loads it.
- `site/instructor/key.js`: the pre/post answer key with an explanation for every option. Only the instructor page loads it; it uploads the key to the database so the server can score the post-course check.
- `site/index.html`: participant page (phones). `site/instructor/index.html`: instructor page (presentation and notes).
- `site/js/app.js`: the engine (rendering, routing, checks, scores, timer). `site/js/live.js`: the live phone game, the Dashboard and the QA documents. `site/css/style.css`: styles.
- `site/api/live.js`: Vercel function that gives each login the database address and public key (the instructor also gets the room token) and creates or updates the database. `site/api/_schema.js`: the database (tables in a private `live` schema, `live_*` functions the browsers call).
- `site/middleware.js`: the password gate (two logins).
- `site/assets/data/`: the job files, made by `build_data.py` (PDFs and note photos drawn in headless Chrome, the tracker with openpyxl; every figure is checked by asserts there). Participants download them from `#/files`. A task block lists its `files` (name and `what`) and its `prompts` (title and text, each with a Copy button); its last step asks people to be ready to show the room what they built (the engine still draws a `takeHome` card if a task has one; none does now); the files page shows the full step-by-step guide (`guide` on the task block) and `shortcuts` (in course.js) lists useful Windows shortcuts. The task card on the presentation keeps the short `steps` and opens the guide on request; the notes tab shows it open, with the task's "If someone is stuck" list.
- `build/explain.py`: the instructor's explanations, written the way the instructor explains them out loud: one for each round (`ROUND`) and one under every teaching block and job (`BLOCK`). `build_content.py` attaches them as `explain` and fails if a teaching block has none. The site shows each as a panel ("Explained in full", "About this job", "About this round"): open on the participant pages, the files page and the notes tab, closed on the presentation (one click opens it). The Portal deck adds reading slides after each block; the Facilitator deck puts them in the speaker notes.
- `build/build_deck.js`: builds both decks from the site data. `build/build_art.py`: artwork copies for the site and decks (no artwork yet).
- `build/build_bibf_forms.py`: fills BIBF's Lesson Plan and Pre and Post Assessment forms (blank templates in `build/templates/`) from the course data. The two ILOs are BIBF's own for COM1247.
- `tools/harness/`: the whole live game on this Mac without Vercel or Supabase, for testing.
- `solo` (in course.js): no teams. The phone shows a name field and a Join button and sends no team; the server's `live_join` then seats the person in the emptiest of the six slots, so each slot is one person. Every board, chip, podium and dashboard shows names, and empty slots are hidden (`site/js/live.js`, `teamName` in `site/js/app.js`). A seventh person would share a slot. Lines worded for teams have a `…Solo` version in `site/js/i18n.js`.
- Game types: `quiz` (a question may carry a `chart` and its own `secs`, used for the hands-on questions), `higherlower`, `estimate`, `timeline`, `order`, `flags`, `scam`.
- Theory blocks: `part` (the divider that opens a round's Theory, Exercises or Try it, `kind` theory, exercises or hands, and lists the blocks that follow), `points`, `table`, `formula`, `pyramid`, `quad`, `cycle`, `persona`, `chart`, plus `rules`, `takeaways`, `strategy`, `league`, `regulators`, `facts`, `flow`, `cards`, `cards-static`, `segments`, `explain`, `lines`, `task` (a hands-on task card), `leaderboard`, `assesscue` and `discuss` (read and discuss). The decks draw every type.

## Running the day
- Laptop on the projector as an extended display. The projector shows one presentation tab: `/instructor/`. Under each game: **Start on the phones** puts the current question on every phone and starts the timer. Answers lock when time runs out. **Reveal** shows the answer and adds the points. **Next**, then **Start** again. Only one presentation tab may be open.
- Every round: Theory (no phones), then Exercises (the phone questions back to back), then Try it (a task in the participants' AI tool, then a question on the result). Page Down or the right arrow (a presenter clicker sends the same keys) brings the next block to the top of the screen; Page Up or the left arrow goes back; after the last block the next round opens.
- Laptop screen: `/instructor/?notes` shows the notes and follows the presentation, block by block. Open the **Dashboard** here so the room never sees it.
- Students open the site on their phones, sign in with the class login, type a first name and press Join (roll call). Their phone shows only the question that was started, then their result. Anyone on a new device picks their name from the list.
- Scoring: everyone plays for themselves and answers once. Per question, the fastest right answer gets 3 points; every other right answer gets 1.
- Demos: after each job's reveal, participants show what they built (two after Jobs 1 and 2, one after Jobs 3 and 4), so all six show once.
- Pre-course check (Kick-off) is blind. After the post-course check (Final) each student's phone shows their own score at the start and now, never the answers. A phone keeps re-sending a check until the server confirms it.
- The final leaderboard shows everyone's points and the top 3 on a podium (presentation and phones).

## Dashboard
- **Facilitator notes** (top of the page): shows or hides the yellow notes in that tab only. The presentation starts with them hidden.
- **Run box** (presentation tab only): the run number, Close/Reopen roll call, **Clear the game, keep everyone** and **Start over** (archives the run, removes everyone, begins the next run). Never Start over during the course: it removes everyone.
- **Scores** and **How everyone is playing**: everyone's points, the podium of the top 3, how many have answered the live question, per person answered / right / points, and a grid of the last 12 questions.
- **People in this run** (either tab): Rename, Remove, Merge into another person. No attendance ticks on a one-day course (as on SAB); a course with a `qa.days` entry per day gets a tick per person and day.
- **Check results**: every pre and post result, a run selector for earlier runs, rows that match nobody can be merged into a person.
- **Exports**: Download CSV and four PDF documents: **1 · Questions and answer key**, **2 · Attendance and performance summary**, **3 · Assessment submissions** and **4 · Attendance sheet**. The documents never mention the game. On this one-day course everyone on the participant list counts as present, including a check row that matches nobody, so merge those first.

## Database changes
`SCHEMA_VERSION` in `site/api/_schema.js` goes up whenever the SQL changes. After the deploy, reload the presentation tab once: the instructor page triggers the update.

## Preview and test
```
cd tools/harness && npm install && node server.mjs
```
Then open http://localhost:4183/instructor/ (see `tools/harness/README.md`). Local storage keys start with `prompt.`.

## Build the decks
```
cd build && npm install && cd ..
NODE_PATH=build/node_modules APPLY_THEME_JS=<pptx skill>/scripts/apply_theme.js node build/build_deck.js
```
Writes `outputs/BIBF-Prompt-Portal.pptx` (offline material for the faculty portal: no speaker notes, no answer key, every question followed by its answer slide) and `outputs/BIBF-Prompt-Facilitator.pptx` (speaker notes and the assessment key).

## Hosting
- Live at https://bibf-prompt.vercel.app behind the password gate. Vercel project `bibf-prompt` (team "Abed's projects"), root directory `site/`, connected to the private GitHub repository `Iced377/bibf-prompt`: every push to `main` is a production deploy, so push only on Abed's "redeploy".
- Logins: `SITE_USER` / `SITE_PASSWORD` (participants, default user `student`) and `INSTRUCTOR_USER` / `INSTRUCTOR_PASSWORD` (default user `abed`), set by Abed as Vercel environment variables. Until `SITE_PASSWORD` is set, the site answers "Site password is not configured."
- Database: its own Supabase store from the Vercel Marketplace, connected to this project only. Its environment values are marked sensitive. `LIVE_ROOM` defaults to `prompt`.

## Sources
Listed in `site/instructor/notes.js` (and the notes of the Facilitator deck).
