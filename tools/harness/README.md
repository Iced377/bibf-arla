# Local test harness

Runs the whole live game on this Mac with no Vercel and no Supabase: it serves `site/`, answers `/api/live` and `/instructor/live` like the Vercel function (instructor gets the room token), and answers `/rest/v1/rpc/live_*` like Supabase, using the real SQL from `site/api/_schema.js` on PGlite. No passwords.

```
cd tools/harness && npm install
node server.mjs                      # http://localhost:4183  (fresh, empty database every start)
```
- Presentation: http://localhost:4183/instructor/ · Notes: http://localhost:4183/instructor/?notes · Phone: http://localhost:4183/#/play
- `node sims.mjs join|pre|post|answer …` adds five simulated students (see the top of the file). `node sim2.mjs` runs 22 bots that answer whatever is started (load test).
- Tabs in one browser share localStorage: clear `arla.*` keys between scenarios, and remember that changing only the `#hash` does not reload the page.
- Restarting the server starts a new empty database but the browser still remembers the old run number: clear storage too.
