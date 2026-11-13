# Lab check · Copilot Chat and ChatGPT

Every job runs in **Copilot Chat** on the BIBF lab desktops. **ChatGPT** is the comparison tool: the warm-up, the Job 1 safety poster, the Job 2 comparison and the Job 4 chart. Nobody types a long prompt: participants paste a pack from the course site, answer Copilot's questions with a letter, then attach the job's files. The checks below show whether anything has to change before Wednesday 18 November. Run them on one lab desktop on Monday 16 or Tuesday 17 November.

## Still to ask BIBF (Abed asks; nothing sent)
1. **Class number, course code and ILOs.** The forms in `outputs/bibf/` say `CLS-TBC` and carry three draft ILOs. Once BIBF gives the numbers, change `qa.code` in `build/build_content.py` and the ILOs in `build/build_bibf_forms.py`, then rebuild.
2. **Copilot Chat on the lab accounts.** Which account signs in: a BIBF work account or a personal Microsoft account? Does Copilot open in **Work** or **Web** mode? Can it attach files and make images?
3. **ChatGPT.** Which plan, and is memory switched off?
4. **Accounts.** One account per desktop, or one shared by all? If shared, can 13 people use it at the same time without being signed out?
5. **Sign-in.** Who signs the desktops in each morning? Does any sign-in send a code to someone's phone?
6. **The KSA participants.** Do they attend in person?
7. **The room.** Four team tables, flipchart sheets and markers for the Day 1 case clinic (kept for Day 2), a projector input for your laptop, Wi-Fi for 13 phones.

## On one lab desktop
8. Open Edge, press Ctrl + Shift + N, and open https://bibf-arla.vercel.app as `student`. On **Files**, download `Line1-night-log-photo.jpg`, the three supplier quotes, `October-production-and-waste.xlsx` and `Draft-label-Ghaima-Spread-500g.png`.
9. **Copilot Chat**, in a second tab:
   1. Note the mode (Work or Web) and whether there is a **Think deeper** or similar option.
   2. Settings: **memory or personalisation is off**.
   3. **Packs.** On Files, Copy "Step 1 · Your pack" from Job 1 and send it. Copilot should ask up to three multiple-choice questions, one at a time. Answer with letters. It should then write a prompt.
   4. **One file.** Attach the night-log photo and send "Step 2 · Run it". Copilot should read the handwriting. Note whether it counts the 02:15 ribbon change twice (95 minutes is right).
   5. **Several files.** In a new chat, attach all three quotes plus the procurement brief in one message. All four should attach. Note any upload limit message.
   6. **A workbook.** In a new chat, attach the October workbook and ask for waste % by line. What matters here is that it reads the workbook. For Line 2, 2.51% is right; 1.86% means it missed the row in tonnes, which is the catch the job teaches.
   7. **An image.** Send "Step 4 · The safety poster" from Job 1. Note whether Copilot makes an image, and whether there is a daily limit.
10. **ChatGPT**, in a third tab:
    1. Settings: **memory is off**.
    2. Send the same safety-poster prompt. An image should appear.
    3. Attach the label PNG and ask what the expiry date reads. It should say 2027/05/14.
11. **The quick win and My card.** On the site, open **Quick win**, tap a role, Copy and send it in Copilot. Then open **My card**, tap a role and two tasks, Copy the pack and send it. Copilot should ask its questions, then write prompts.
12. Delete the test chats in both tools, sign out of both and close the private window.

## The room
13. On your laptop: `/instructor/` on the projector and `/instructor/?notes` on your screen, signed in as `abed`. The Dashboard should say Run 1, joined 0.
14. On your phone, on the room Wi-Fi: open the site as `student`, pick a team, type a test name and press Join. Check that you appear on the Dashboard, then **Remove** yourself.
15. Try Job 6's station chips. On the presentation, at "Job 6 · Station results", tap a station for each team. A phone in that team should show the station name.

## If a check fails
- **Copilot can't attach files:** paste the text versions instead. Job 1 has `Line1-night-log.txt`. For the other jobs, tell me which files failed and I'll add text copies.
- **Copilot can't make images:** the safety poster, the chart and the corrected label run in ChatGPT only. The step text changes in `build/build_content.py`.
- **Copilot opens in Web mode only:** the jobs still work, because every file is attached in the chat. The Round 2 table "What you'll have at Arla" stays as it is, since it describes Arla, not BIBF.
- **One shared account signs people out:** teams work on one desktop each, and the others follow on their phones.
- **No ChatGPT:** drop the comparison steps. Nothing on the phones depends on ChatGPT.
- Tell me what failed and I'll change the job cards to match.
