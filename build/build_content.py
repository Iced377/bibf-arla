"""Course content: writes site/data/course.js, site/instructor/key.js and site/instructor/notes.js.

AI Prompt Engineering for Business Professionals (BIBF COM1247), Thursday 12 November 2026.
Six participants spend the day as the new AI team of Najma Bank (fictional). Each plays alone (no teams) and builds four
simulations for the bank in ChatGPT and Copilot, on the accounts BIBF provides for the day on its lab desktops, then shows them
to the room. Nothing is meant to keep working after the day. Every round runs Theory, Exercises, Try it. Plan: docs/course-plan.md.
Facts were checked on 9 November 2026; the sources are in NOTES_OUT["sources"].
Usage (from the project root): build/.venv/bin/python build/build_data.py, then python3 build/build_content.py
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from explain import BLOCK as EXPLAIN, ROUND as ROUND_EXPLAIN  # noqa: E402

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")

# ---------------------------------------------------------------- the course
NOTES = {}
KEY = {}


def note(beat_id, text):
    NOTES[beat_id] = text
    return beat_id


def q(text, options, answer, why, chart=None, secs=None):
    d = {"q": text, "options": options, "answer": answer, "why": why}
    if chart:
        d["chart"] = chart
    if secs:
        d["secs"] = secs
    return d


def part(bid, kind, title, text, mins, nt):
    """The start of a round's theory, exercises or hands-on work; the site lists the blocks that follow."""
    return {"id": note(bid, nt), "type": "part", "kind": kind, "title": title, "text": text, "mins": mins}


def P(title, text):
    return {"title": title, "text": text}


SECTIONS = []

# ---------------------------------------------------------------- prompts participants copy (files page and deck)
WARM_PROMPT = ("Explain how the monthly payment on a personal loan works. Use this example: BD 20,000 over 5 years at 6% a year.\n\n"
               "Show me a visual I can play with, with sliders for the amount, the number of years and the rate. "
               "Tell me the monthly payment for my example.")
IMAGE_PROMPT = ("Make an image for Najma Bank's National Day post.\n"
                "Subject: a Bahraini family on the Manama corniche at sunset, waving the Bahrain flag.\n"
                "Details: warm evening light, red and white flags, navy and gold accents for the bank.\n"
                "Style: clean, modern illustration.\n"
                "Format: square, for Instagram, with no text in the image.")

FEE_WEAK = "Make me a fee calculator for international transfers."
FEE_FULL = ("Build a fee calculator for Najma Bank's international transfers, as an interactive tool I can use here in the chat.\n\n"
            "Rules: use the six fee rules I attached or pasted, exactly as written and in the order given.\n"
            "Inputs: the amount in BD; the destination country; the customer type (standard or Premier); how many transfers "
            "the customer has made this calendar month, counting this one; the channel (app or branch); the delivery (normal or same-day).\n"
            "Output: the fee in BD with three decimals, and one line for each rule saying how it changed the fee.\n"
            "Who uses it: branch and contact centre staff, on a desktop, in English.\n\n"
            "Before you build, list the six rules back to me in your own words so I can check you read them right. "
            "After you build, run the three test cases below and show the fee for each.\n\n"
            "A: BD 4,000 to India, standard customer, in the app, normal delivery.\n"
            "B: BD 300 to Saudi Arabia, Premier customer, 4th transfer this month, at a branch, same-day delivery.\n"
            "C: BD 1,200 to the UAE, Premier customer, 2nd transfer this month, in the app, same-day delivery.")
FEE_RULES = ("Najma Bank's fee rules for international transfers. They apply in this order.\n"
             "1. The standard fee is 0.5% of the amount sent.\n"
             "2. The fee is never less than BD 2.000 and never more than BD 15.000.\n"
             "3. Transfers to GCC countries (Saudi Arabia, the UAE, Kuwait, Oman and Qatar) have a maximum fee of BD 5.000.\n"
             "4. Najma Premier customers pay no fee on their first three transfers in each calendar month.\n"
             "5. Transfers made in the Najma app get 25% off the fee worked out above, after the minimum and maximum.\n"
             "6. Same-day delivery adds a flat BD 3.000. The app discount does not apply to it, and the Premier waiver does not cover it.")
FEE_SECOND = ("Work out the fee for two international transfers, using only the six rules below. Go one rule at a time and show the "
              "fee after each rule, in BD with three decimals.\n\n"
              "A: BD 4,000 to India, standard customer, in the app, normal delivery.\n"
              "B: BD 300 to Saudi Arabia, Premier customer, 4th transfer this month, at a branch, same-day delivery.\n\n" + FEE_RULES)
FEE_FIX = ("One of the test cases doesn't match my own working. For that case, go through the six rules one at a time and "
           "show the fee after each rule. If a rule was applied wrongly or in the wrong order, fix the calculator and run all three cases again.")

NOTES_INTERVIEW = ("I lead three initiatives at Najma Bank, a retail bank in Bahrain. I want a project that keeps my initiatives tracker "
                   "up to date from photos of my notes.\n\n"
                   "Interview me before you write anything. Ask one question at a time and wait for my answer. Find out: my initiatives, "
                   "their owners and deadlines; what counts as an update; how dates are written in my notes; what to do with a note that "
                   "fits two initiatives or none; and what the updated tracker should look like.\n\n"
                   "When you have enough, write the project instructions I should paste into the project.")
NOTES_FACTS = ("1. Najma App 3.0. Owner: Fatema Al Sayed. Launch 1 March 2027. Stage: build.\n"
               "2. Muharraq branch of the future. Owner: Yusuf Janahi. Reopens 15 January 2027. Stage: fit-out.\n"
               "3. National Day campaign. Owner: Maryam Bucheeri. Launch 1 December 2026. Stage: creative.\n\n"
               "Dates in my notes are day/month. Today is Thursday 12 November 2026.")
NOTES_PHOTOS = ("Here are eight photos of my notes from this week. Note 7 is the steering committee agenda from 10 November. "
                "Note 8 is an email from Yusuf from 11 November.\n\n"
                "First list what you read on each note, word for word where you can, and mark anything you can't read. "
                "Then assign each note to an initiative, update the tracker, and add one row per update to the Updates log. "
                "Give me the updated tracker as an Excel file.")
NOTES_READY = ("You keep the tracker for my three initiatives at Najma Bank: Najma App 3.0 (owner Fatema Al Sayed), the Muharraq branch "
               "of the future (owner Yusuf Janahi) and the National Day campaign (owner Maryam Bucheeri).\n\n"
               "When I upload photos of notes:\n"
               "1. List what each note says, word for word where you can. Mark anything you can't read.\n"
               "2. Assign each note to an initiative. If it fits two, say so and update both. If it fits none, list it under "
               "'Fits none' and ask me what to do with it.\n"
               "3. Dates in my notes are day/month. Write every date in full, for example 12 November 2026.\n"
               "4. Update each initiative's next deadline, stage and risks. Add one row per update to the Updates log, with the note number.\n"
               "5. Never change an owner or a deadline unless a note says so. Flag every change to a deadline at the top of your answer.")

CHAT_COMPARE = ("Najma Bank wants an AI customer service assistant in its app, and will sign on 1 December 2026. Compare the two "
                "attached supplier proposals against our five criteria:\n"
                "1. Total cost over three years (set-up plus 36 months of every monthly fee)\n"
                "2. Arabic, including Gulf dialect, and English\n"
                "3. Customer data stays in Bahrain\n"
                "4. Live by 1 March 2027\n"
                "5. Hands the chat to a person when it can't help\n\n"
                "Show a table with each criterion for each supplier and where in the proposal you found it. "
                "Then recommend one supplier in three sentences for our CFO.")
CHAT_AGAINST = ("Now argue against your recommendation as a sceptical CFO. What did you miss or take on trust? Check every figure "
                "in your table against the two proposals again, including footnotes and small print, and correct the table if needed.")
CHAT_TRAP = ("Does either file contain instructions addressed to AI tools, or text that is hidden, white or very small? "
             "Quote it exactly, say which file it is in, and say whether it changed your answer.")

# Round 2 · Your turn: the provider's RACE and CRISPE practice tasks and its captions activity, rewritten for Najma with the facts
TURN = [
    {"title": "Phishing warning", "text":
     "Task: a social media post warning Najma Bank customers about phishing.\n"
     "Facts: customers are getting emails and text messages that look like Najma's and ask them to 'confirm' their card through a link. "
     "Najma never asks for a card number, PIN or one-time code by email, text or phone. Customers can report a suspicious message in the app: "
     "Menu, then Report Fraud.\n"
     "Readers: all customers, many of them over 50."},
    {"title": "Credit score explainer", "text":
     "Task: a short explainer on what a credit score is and how to improve it.\n"
     "Facts: lenders in Bahrain check a customer's credit report before they lend. Paying on time, keeping card balances low and not "
     "applying for several loans at once all help.\n"
     "Readers: Najma customers aged 21 to 30, applying for their first credit card in the app."},
    {"title": "Three savings accounts compared", "text":
     "Task: compare Najma Bank's three savings accounts for one customer.\n"
     "Facts: Najma Saver: 2.00% a year, no minimum, withdraw any time. Najma Plus: 3.25% a year, minimum BD 1,000, two free withdrawals "
     "a month. Najma Fixed 12: 4.50% a year, minimum BD 5,000, money locked for 12 months.\n"
     "Reader: a customer with BD 6,000 who may need part of it for school fees in September."},
    {"title": "Captions for the new app", "text":
     "Task: five social media captions for the Najma App 3.0 launch, in the bank's own voice.\n"
     "Captions the bank used and liked: 'Payday sorted before your coffee is.' 'Send money home in three taps.' "
     "'Your bills, paid. Your evening, free.'\n"
     "New in App 3.0: transfers at home and abroad, AI spending insights, bill payments (EWA and mobile), credit card applications, "
     "savings and deposits, loan applications."},
    {"title": "Data privacy checklist", "text":
     "Task: a section of staff training on data privacy, as a checklist.\n"
     "Facts: the bank's policy is Najma Data Policy DP-07. Customer data stays in the bank's approved systems. Staff never send customer "
     "data to a personal email or put it into a public AI tool. Bahrain's Personal Data Protection Law applies.\n"
     "Readers: tellers and customer service staff with no technical background. Include one example of a breach and how to avoid it."},
    {"title": "A script for a relationship manager", "text":
     "Task: a short script a relationship manager can use to suggest a fixed deposit to an existing customer.\n"
     "Customer: Sara, 34, a teacher, with BD 8,000 in a Najma Saver account for two years, saving for a flat.\n"
     "Product: Najma Fixed 12, 4.50% a year, minimum BD 5,000, money locked for 12 months.\n"
     "Include the questions she is likely to ask and how to answer them."},
]

BRIEF_INTERVIEW = ("I want a short news brief every working morning that is useful for my job. Before you write anything, interview me. "
                   "Ask one question at a time and wait for my answer. Find out: my role and sector; the companies and competitors "
                   "I follow; the topics that matter to me and the ones to leave out; the sources I trust; the language and length I "
                   "want; and when I read it.\n\n"
                   "Then write the prompt you would run each morning, and run it once now with web search. For every item, give the "
                   "date it was published and a link to the original source. Leave out anything older than seven days.")
BRIEF_FATEMA = ("Role: Head of Digital at Najma Bank, a retail bank in Bahrain. I lead the Najma App 3.0 launch on 1 March 2027.\n"
                "Sector: retail banking in Bahrain and the Gulf.\n"
                "Who I follow: other retail banks in Bahrain, digital banks in the Gulf, and the Central Bank of Bahrain.\n"
                "Topics: digital banking and app launches, payments and open banking, AI in customer service, fraud and cyber security alerts.\n"
                "Leave out: share prices, crypto tips, celebrity news, and anything older than seven days.\n"
                "Sources I trust: the Central Bank of Bahrain website, Bahrain News Agency, and established business and banking news sites. "
                "No forums or anonymous posts.\n"
                "Language and length: English, five items, two lines each, with the date and a link for every item.\n"
                "When I read it: 7:30 every working morning, on my phone, before the 8:00 team meeting.")

# ======== Kick-off
SECTIONS.append({
    "id": "k0", "num": "0", "nav": "Kick-off", "mins": 25, "time": "09:00",
    "title": "Your first day in", "titleAccent": "Najma's AI team",
    "lede": "You have just joined the new AI team of Najma Bank. Today you build four working simulations for the bank in ChatGPT and Copilot, show them to the room, and answer on your phone as you go.",
    "beats": [
        {"id": note("k0-hook", "Press Start (30 s) before any introductions, then Reveal. One line: most of the room already uses one of these tools. "
                               "Today is about using it well."),
         "type": "estimate", "title": "How many people use ChatGPT?",
         "question": "About how many people use ChatGPT every week?",
         "options": ["About 120 million", "About 400 million", "About 1.2 billion", "About 3 billion"], "answer": 2,
         "reveal": "About 1.2 billion a week, OpenAI's chief executive said on 29 September 2026. A year earlier it was 800 million. "
                   "Almost everyone at work now has one of these tools. What sets people apart is how they brief it and how they check what comes back.",
         "source": "Sam Altman at OpenAI DevDay, 29 September 2026 (Engadget live blog); 800 million: TechCrunch, 6 October 2025.", "secs": 30},
        {"id": note("k0-rules", "Read the four rules once. Your laptop shows each code name with the real name. "
                                "At the final leaderboard you decide whether to press Reveal the real names."),
         "type": "rules", "title": "How the game works", "portal": False,
         "items": [P("Your own phone", "Everyone plays for themselves and answers once per question, before the timer runs out."),
                   P("Speed counts", "The fastest right answer wins 3 points. Every other right answer wins 1."),
                   P("Build it, show it", "Each round ends with a job in ChatGPT or Copilot on your desktop. Your phone asks what you found, then some of you show the room what you built."),
                   P("One day, one game", "Everyone plays under a secret AI code name. Nobody knows who is who, not even you, until the final round.")]},
        {"id": note("k0-shape", "Thirty seconds. Every round runs the same way."),
         "type": "flow", "title": "How every round runs",
         "steps": [P("Theory", "The ideas, short, with examples from the bank. Phones down."),
                   P("Exercises", "Quick questions on your phone, one after another."),
                   P("Try it", "A real job in ChatGPT or Copilot on your desktop, then a question on your phone about what you got.")]},
        {"id": note("k0-signin", "Check every desktop is signed in to both tools before the first round: ChatGPT in one tab, Copilot in another. Anyone stuck: share a desktop with a neighbour. "
                                 "Say it once: the BIBF accounts are for today only and shared with the next class, and everyone works on the bank's made-up files, so nothing real goes in."),
         "type": "points", "title": "On your desktop",
         "items": [P("A private window.", "Open Edge and press Ctrl + Shift + N. Nothing you do in it stays on the computer."),
                   P("Your AI tools.", "Open ChatGPT in one tab and Copilot in another, each with the BIBF account on the card on your desk."),
                   P("The course site.", "In a third tab, open bibf-prompt.vercel.app/#/files and sign in as student. Every job's files and prompts are there, with a Copy button for each prompt."),
                   P("At the end.", "Delete the chats and projects you made in both tools, sign out of both and close the private window. The next class uses the same accounts.")]},
        {"id": note("k0-out", "One minute. These are the four things they can do by 14:00. Point at the last one: every job today is a simulation they build, check and show in class."),
         "type": "cards-static", "title": "What you can do after today",
         "items": [P("Brief it", "Brief ChatGPT or Copilot like a capable colleague and get usable work back in one or two rounds."),
                   P("Give it context", "Set up a project with instructions and files, and let the assistant interview you before it starts."),
                   P("Check it", "Check figures, sources, small print and hidden instructions before a result drives a decision."),
                   P("Build with it", "Get working tools out of it, from a fee calculator to a daily news brief, and show the room how you checked them.")]},
        {"id": note("k0-case", "Two minutes. Najma is made up, so every answer is known in advance. Open the case file once to show where everything is."),
         "type": "facts", "title": "Meet Najma Bank",
         "items": [{"value": "9", "label": "branches in Bahrain", "note": "Head office in Seef"},
                   {"value": "420,000", "label": "retail customers", "note": "Most of them use the app"},
                   {"value": "3", "label": "initiatives this quarter", "note": "App 3.0, the Muharraq branch and the National Day campaign"}],
         "source": "Najma Bank and everyone in it are fictional, made for this course."},
        {"id": note("k0-jobs", "Thirty seconds per job. The files page has everything; nobody needs to type a long prompt today. "
                               "Six people, four jobs: after each job two people show what they built (one each for Jobs 3 and 4), so everyone shows once. "
                               "Jobs 1 and 2 are built in ChatGPT and Jobs 3 and 4 in Copilot; each has a check in the other tool."),
         "type": "cards-static", "title": "Your four jobs today",
         "items": [P("Build it", "In ChatGPT, turn the bank's fee rules into a working fee calculator. Then check it in Copilot."),
                   P("Organise your notes", "In a ChatGPT project, eight photos of meeting notes update the bank's tracker."),
                   P("Trap in the file", "In Copilot, compare two supplier proposals for a chatbot. One is hiding something. Then ask ChatGPT."),
                   P("The morning brief", "Copilot interviews you as Najma's Head of Digital, then builds her daily news brief. You check its links.")],
         "note": "Each job is a simulation for Najma Bank. You build it, check it and show it to the room, all within the day."},
        {"id": note("k0-take", "Read the three takeaways once. You come back to them in the final round."), "type": "takeaways", "title": "What you leave with"},
        {"id": note("k0-pre", "Press Open the check on the phones. Twelve questions, about eight minutes. They see no score now."),
         "type": "assesscue", "which": "pre", "title": "Pre-course check", "mins": 10,
         "intro": "Twelve questions on your own phone, about eight minutes. Nobody sees a score now: it comes in the final round, next to your new one."},
    ]})

# ======== Round 1 · What your assistant can do now
SECTIONS.append({
    "id": "s1", "num": "1", "nav": "What it can do", "mins": 30, "time": "09:25",
    "brief": "Understand prompt engineering concepts",
    "title": "What your assistant", "titleAccent": "can do now",
    "lede": "ChatGPT and Copilot now read files and photos, build working tools, remember your projects, run on a schedule and act for you. "
            "A warm-up in both, then what has changed, then where it still goes wrong.",
    "beats": [
        part("s1-th", "theory", "Theory", "A warm-up in both AI tools, then what has changed and what hasn't.", 17,
             "Warm-up first (7 minutes), then theory. Page Down or the clicker moves one block at a time and the notes tab follows."),
        {"id": note("s1-warm", "Seven minutes, no score. Everyone sends the warm-up prompt in ChatGPT, then the same prompt in Copilot. After three minutes ask: "
                               "which tool drew a chart, which a calculator, which only text? Then the provider's ice breaker: everyone writes their own one line "
                               "for a National Day greeting. Ask two people to read theirs and the greeting it got. "
                               "That is the point: wording, tool and plan all change what comes back. The payment is about BD 386.656 a month."),
         "type": "task", "title": "Warm-up · A loan you can play with",
         "prompts": [{"title": "The warm-up prompt", "text": WARM_PROMPT},
                     {"title": "Extra step · An image for National Day", "text": IMAGE_PROMPT}],
         "steps": ["Copy the warm-up prompt from the files page and send it in ChatGPT.",
                   "Send the same prompt in Copilot, in your second tab.",
                   "Move the sliders. Which tool gave you a chart, a calculator or only text?",
                   "Your own words: write one line asking for a National Day greeting from Najma Bank to its customers. Send it and compare with your neighbour's.",
                   "Extra step: send the image prompt in either tool."],
         "note": "Check: for BD 20,000 over 5 years at 6%, the payment is about BD 386.656 a month."},
        {"id": note("s1-what", "Two minutes. The old definition still holds: craft the input that gets the output you need. "
                               "In 2026 the input is more than the words you type, and the output needs a check."),
         "type": "points", "title": "What prompt engineering means today",
         "items": [P("The prompt.", "What you ask for, written so a capable colleague could do it without coming back to you."),
                   P("The context.", "The files, photos, examples and background you give it, and the [[project|project]] it works in."),
                   P("The check.", "What you look at before the result reaches a customer, a manager or a decision."),
                   P("Why it matters.", "The same tool gives a vague answer to a vague request and usable work to a clear [[brief|brief]]. The difference is you.")]},
        {"id": note("s1-kpmg", "Ninety seconds. The lesson: the effort went into the brief and the material, and a licensed tax expert still checks every draft. "
                               "TaxBot is for KPMG's tax agents only."),
         "type": "facts", "title": "A prompt 100 pages long",
         "items": [{"value": "100 pages", "label": "the prompt behind KPMG Australia's TaxBot", "note": "With the firm's tax advice and Australian tax law"},
                   {"value": "1 day", "label": "for a 25-page first draft of tax advice", "note": "It used to take about two weeks"},
                   {"value": "1 expert", "label": "checks every draft", "note": "Only licensed tax agents use it"}],
         "source": "The Register, 20 August 2025: KPMG wrote 100-page prompt to build agentic TaxBot."},
        {"id": note("s1-new", "Three minutes, one line per card. Dates: ChatGPT's Intelligent UI came with GPT-6 on 7 October 2026, paid plans first. "
                              "ChatGPT tasks: OpenAI's help page says every plan, Free with up to 3 tasks; the pricing page still says no for Free. "
                              "Microsoft announced the new Copilot on 25 September 2026: Home (chat with the Cowork agent), Code (builds apps from a description) and Autopilot; "
                              "Frontier early access first, and Cowork, Code and Autopilot are billed by use. Copilot's scheduled prompts come with a Microsoft 365 Copilot licence. "
                              "For your own demos: Claude added designs, decks and docs on every plan on 16 September 2026, and Cowork scheduled tasks are on all paid Claude plans."),
         "type": "cards-static", "title": "What it can do now",
         "items": [P("It reads", "Files, scans and photos: a 40-page policy, a whiteboard, a screenshot, a handwritten note."),
                   P("It builds", "Working calculators, charts, documents and slides. ChatGPT's answers can now come with charts, buttons and forms, and Copilot works inside Word, Excel and PowerPoint."),
                   P("It remembers", "Projects keep your files and instructions. [[memory|Memory]] carries what you told it from one chat to the next."),
                   P("It runs on a schedule", "ChatGPT's tasks and Copilot's scheduled prompts can run a job every morning and send you the result."),
                   P("It acts", "An [[agent|agent]] clicks, types and works through files and websites for you. ChatGPT's agent and Copilot's Cowork do this on paid plans.")],
         "note": "What stayed true: a clear brief, the right material and a stated result still make the biggest difference, and every answer still needs a person to check it."},
        {"id": note("s1-wrong", "Two minutes. This is the bridge to Round 4. None of it means don't use it; it means brief it well and check what matters."),
         "type": "points", "title": "Why it can still be confidently wrong",
         "items": [P("It predicts.", "A [[llm|large language model]] writes the most likely next words. Most of the time that is right. When it doesn't know, it can still write something that sounds right."),
                   P("It fills gaps.", "Whatever you leave out, it guesses: the reader, the date format, the rule you forgot to mention."),
                   P("It tends to agree.", "Ask a leading question and it leans towards your view ([[sycophancy]])."),
                   P("It can be out of date.", "Without web search it only knows what it learned up to its [[cutoff|knowledge cutoff]].")]},
        {"id": note("s1-acct", "Ninety seconds. Today's tools are work accounts that belong to BIBF: ChatGPT on BIBF's paid plan (you believe Enterprise) and Microsoft 365 Copilot. "
                               "Personal accounts: training on chats is often on unless you switch it off, so check the setting. "
                               "Work accounts: usually off by contract. Bahrain's PDPL applies to customer data whatever the tool."),
         "type": "table", "title": "Work accounts and personal accounts",
         "cols": ["", "Your bank's approved tool", "A personal account"],
         "rows": [["Customer data", "Only as your bank's policy allows", "Never"],
                  ["Internal documents", "As your policy allows", "Only what is already public"],
                  ["Chats used to train the model", "Usually off, by contract", "Often on: check the setting"],
                  ["Who can see your chats", "Your bank's administrators", "You, and the provider under its terms"]],
         "note": "Today's ChatGPT and Copilot run on BIBF's work accounts, so the left column applies, with BIBF in place of your bank. They aren't your bank's tools, so only the made-up Najma files go in.",
         "source": "Bahrain's Personal Data Protection Law (Law No. 30 of 2018) applies to customer data whatever tool you use."},
        {"id": note("s1-gallery", "Two minutes. Most figures come from the banks themselves. Klarna shows both sides: fast savings first, then a step back on quality. "
                                  "No Bahraini bank has published a hard figure yet; Bank ABC and NBB have announced programmes."),
         "type": "cards-static", "title": "Banks using it now",
         "items": [P("JPMorgan Chase", "LLM Suite, its in-house assistant, reached about 200,000 staff by May 2025. They use it to draft, summarise and search."),
                   P("BBVA", "Gave ChatGPT Enterprise to 120,000 staff in December 2025, and reports about 3 hours saved per person each week."),
                   P("Mashreq, UAE", "Its generative AI platform, Newton, raised financial crime investigators' productivity by about 40% (October 2026)."),
                   P("ING", "Built a generative AI chat assistant with McKinsey in seven weeks. In the 2023 pilot, 20% more customers avoided long waits."),
                   P("Klarna", "Its AI assistant took two-thirds of customer chats in its first month (2024). In May 2025 it began hiring people again after quality dropped.")],
         "source": "American Banker (2025); OpenAI and BBVA (2025); AGBI (October 2026); McKinsey; Klarna (27 February 2024) and Entrepreneur (9 May 2025)."},
        part("s1-ex", "exercises", "Exercises", "", 11,
             "Phones out. Rhythm: Start, they answer, Reveal, one line from the why, Next."),
        {"id": note("s1-guess", "20 s each. From the provider's game (Perplexity, ChatGPT, Poe, Claude, DeepSeek, Gemini, Copilot), with today's tools."),
         "type": "quiz", "secs": 20, "title": "Guess the AI tool",
         "questions": [
             q("Which company makes Claude?", ["OpenAI", "Anthropic", "Google", "Microsoft"], 1,
               "Anthropic, a US AI company founded in 2021. OpenAI makes ChatGPT, Google makes Gemini and Microsoft makes Copilot."),
             q("Copilot, built into Edge, Word and Outlook, comes from which company?", ["Google", "Meta", "Microsoft", "Perplexity"], 2,
               "Microsoft. It is the AI built into Windows, Edge and Microsoft 365, and one of your two tools today. Microsoft builds it on OpenAI's models and its own."),
             q("DeepSeek, whose free model knocked billions off chip makers' shares in January 2025, comes from which country?", ["The United States", "France", "China", "South Korea"], 2,
               "China: DeepSeek is based in Hangzhou. The rest of the provider's list: Perplexity is an answer engine that cites its sources, "
               "Poe (from Quora) puts many models in one app, and Gemini comes from Google.")]},
        {"id": note("s1-genai", "25 s each. Both cases are from the provider's list of fourteen. Seven of the fourteen are classic AI: scoring models, "
                                "anti-money-laundering models, document reading and scripted chatbots."),
         "type": "quiz", "secs": 25, "title": "Generative AI or classic AI?",
         "intro": "Two cases from a list of AI in banking. Which use the kind of AI you use today?",
         "questions": [
             q("Banca Mediolanum built new credit-scoring models on SAS to meet European default rules. What kind of AI is that?",
               ["Generative AI that writes the scores", "Classic AI: a model that predicts a risk score", "No AI at all: a spreadsheet", "An agent that approves the loans"], 1,
               "[[classicai|Classic AI]]. A scoring model predicts a number from data. It writes nothing, and banks used such models long before ChatGPT."),
             q("JPMorgan Chase gave its staff LLM Suite, an assistant that drafts, summarises and answers questions. What kind of AI is that?",
               ["Classic AI: a fraud detection model", "A rules engine with fixed answers", "Generative AI: a large language model", "Robotic process automation"], 2,
               "[[genai|Generative AI]]. LLM stands for large language model, the same kind of AI as ChatGPT and Copilot.")]},
        {"id": note("s1-safe", "20 s each. A personal account in mind, or one that isn't your bank's, like today's two. The anonymised complaint is the useful one: fine, once nothing identifies the person."),
         "type": "flags", "secs": 20, "title": "Safe to hand over?",
         "intro": "Green flag: fine to give a personal AI account, or one that isn't your bank's, like today's. Red flag: keep it out.",
         "items": [{"text": "A customer's complaint email, with their name, account number and mobile number.", "verdict": "red",
                    "rule": "Personal data. Take out the name and numbers first, or use your bank's approved tool. Bahrain's PDPL applies."},
                   {"text": "The same complaint, with every name and number taken out.", "verdict": "green",
                    "rule": "Fine for drafting a reply. Check nothing else identifies the person, such as a rare job title or an exact date."},
                   {"text": "Full access to your work inbox, so an agent can sort it for you.", "verdict": "red",
                    "rule": "An agent with your inbox can read and send anything in it. Only with your bank's approval, on a work account set up for it."}]},
    ]})

# ======== Round 2 · Brief it like a colleague
SECTIONS.append({
    "id": "s2", "num": "2", "nav": "Brief it", "mins": 50, "time": "09:55",
    "brief": "Design effective prompts for AI tools (ILO 1)",
    "title": "Brief it", "titleAccent": "like a colleague",
    "lede": "The biggest gain comes from the brief: the goal, the context, the material, what done looks like and the limits. "
            "Then you brief it to build a working tool for the bank.",
    "beats": [
        part("s2-th", "theory", "Theory", "", 20,
             "No phones. About 90 seconds per block. The brief table is the one to slow down on. Your turn (6 minutes) comes after the brief makeover."),
        {"id": note("s2-types", "One minute. Most work requests are instructional, and that is where the brief matters most."),
         "type": "table", "title": "Five kinds of prompt",
         "cols": ["Kind", "What it asks for", "Najma example"],
         "rows": [["Open", "Ideas, options, a first draft", "Suggest five names for our new savings account."],
                  ["Closed", "One short answer", "Does rule 4 cover a Premier customer's fourth transfer? Answer yes or no, and quote the rule."],
                  ["Factual", "Facts it should find and cite", "What does Bahrain's PDPL say about sending customer data abroad? Give the article."],
                  ["Opinion", "A judgement, with reasons", "Which of these two app screens is clearer for older customers, and why?"],
                  ["Instructional", "A task done to a spec", "Turn these notes into a memo for the CEO, under 300 words."]]},
        {"id": note("s2-write", "Ninety seconds. The last point is the one most people never use."),
         "type": "points", "title": "Writing effective prompts",
         "items": [P("Clear and specific.", "Say exactly what you want: the task, the length, the format. 'An email under 150 words' beats 'a short email'."),
                   P("Context.", "Who it is for, why it is needed and what has happened so far. The tool knows nothing about your bank unless you tell it."),
                   P("Tone and style.", "Formal or friendly, English or Arabic, the bank's voice. Show an example if you have one."),
                   P("Ask for questions.", "End with 'Ask me anything you need before you start.' It stops the tool from guessing.")]},
        {"id": note("s2-brief", "Three minutes: the core of the day. Read each row with its Najma example. "
                                "Line to repeat: brief it like a capable new colleague who knows nothing about your bank."),
         "type": "table", "title": "The brief in five parts",
         "cols": ["Part", "What it says", "Najma example"],
         "rows": [["Goal", "What you want, and why", "Reply to a customer whose card is late, so they stay with us."],
                  ["Context", "Who it's for and what has happened", "Premier customer, card ordered 20 days ago, courier delay, second complaint."],
                  ["Material", "Files, facts and examples to use", "The complaint (names taken out) and our card delivery policy."],
                  ["What done looks like", "Format, length, tone, language", "An email under 150 words, warm and direct, in English and Arabic."],
                  ["Limits", "What it must not do", "No delivery date we can't promise. No compensation offer."]],
         "note": "If a new colleague would come back with questions, the answers belong in the brief."},
        {"id": note("s2-names", "One minute. The provider's slides teach RACE, CRISPE and REACT. They are all versions of the same checklist, "
                                "and Microsoft's and Google's own guides say the same thing. Learn the five parts and you have them all."),
         "type": "table", "title": "One checklist, many names",
         "cols": ["Name", "Its parts", "Where you meet it"],
         "rows": [["RACE", "Role, Action, Context, Execute", "Training courses"],
                  ["CRISPE (as in the slides)", "Clarity, Relevance, Iteration, Specificity, Practicality, Examples", "Training courses"],
                  ["REACT", "Role, Explanation, Ask for clarification, Constraints, Task", "Training courses"],
                  ["Microsoft", "Goal, Context, Source, Expectations", "Microsoft 365 Copilot's prompt guide"],
                  ["Google", "Persona, Task, Context, Format", "Gemini's prompting guide"]],
         "source": "Microsoft Support, Get started writing prompts in Microsoft 365 Copilot; Google Workspace, Prompting guide 101."},
        {"id": note("s2-shots", "Ninety seconds. Zero-shot is where to start. Few-shot is for style and format, which is exactly the captions exercise coming up."),
         "type": "points", "title": "Zero-shot and few-shot",
         "items": [P("Zero-shot.", "You ask without examples ([[zeroshot]]). Start here: today's tools handle most requests this way."),
                   P("Few-shot.", "You add two or three examples of what you want ([[fewshot]]). Use it when the style or the format matters: captions in the bank's voice, a fixed report layout, the way you tag complaints."),
                   P("Example.", "'Here are three captions we liked: … Write five more in the same style for the App 3.0 launch.'")]},
        {"id": note("s2-role", "Ninety seconds. The study: 162 roles, 2,410 factual questions, four model families. Roles change tone; facts change accuracy."),
         "type": "points", "title": "Instructions and roles",
         "items": [P("Instructions first.", "Clear, direct instructions do most of the work: 'Use bullet points. Under 200 words. No technical terms.'"),
                   P("What a role does.", "'Act as a compliance officer' changes the tone, the vocabulary and what it pays attention to ([[role|role prompt]])."),
                   P("What a role doesn't do.", "It doesn't make the answer more accurate. A study of 162 roles found no gain on factual questions."),
                   P("Better than a role.", "The facts a real compliance officer would have: the policy, the regulator's rule, the case in front of you.")],
         "source": "Zheng et al., When 'A Helpful Assistant' Is Not Really Helpful, Findings of EMNLP 2024 (arXiv 2311.10054)."},
        {"id": note("s2-makeover", "Three minutes in pairs, one point from each pair, then Show how to read it. "
                                   "The 'before' is the provider's own example of an effective prompt."),
         "type": "discuss", "title": "Brief makeover", "mins": 3,
         "table": {"cols": ["", "Before", "After"],
                   "rows": [["The prompt", "What are the implications of rising interest rates for the real estate market in the next year?",
                             "I head mortgages at a retail bank in Bahrain. Our board meets on Sunday. In under 250 words, list how a 0.5-point rise in rates "
                             "could change mortgage demand in Bahrain over the next 12 months, with one action for us for each point. Say where you are unsure."],
                            ["Who it's for", "Not stated", "The board"],
                            ["What done looks like", "Not stated", "Under 250 words, a list, one action per point"],
                            ["Limits", "None", "Bahrain, 12 months, say where unsure"]]},
         "prompt": "What does the 'after' add? What would you still add before you send it?",
         "reading": ["It adds the goal (the board meeting), the reader, the scope (Bahrain, 12 months), the format and a length.",
                     "It asks the tool to say where it is unsure, which makes checking easier.",
                     "Still missing: the bank's own figures. Attach them, or the tool will invent a picture of your mortgage book."]},
        {"id": note("s2-turn", "Six minutes, no score. These are the provider's RACE and CRISPE practice tasks and its captions activity, rewritten for Najma "
                               "with the facts included. Six cards for six people: ask neighbours to pick different ones. After four minutes ask two people: "
                               "what differed between ChatGPT and Copilot, and which line of the brief did you change? That is the provider's prompt refinement "
                               "workshop in one go."),
         "type": "task", "title": "Your turn · One brief, two tools",
         "prompts": TURN,
         "steps": ["Pick a scenario on the files page, a different one from your neighbour's, and copy it.",
                   "Write a brief around it: the goal, the context, the material, what done looks like and the limits. RACE or CRISPE works too.",
                   "Send the same brief in ChatGPT and in Copilot.",
                   "Compare the two answers. Which is closer to usable, and which line of your brief left room to guess?",
                   "Change that line and tell your neighbour what you changed."],
         "note": "The slides' other practice tasks work the same way: a memo on a new hybrid work policy, a data-use disclaimer in plain words, a quick-start guide for a card terminal."},
        {"id": note("s2-spec", "Ninety seconds. This is Job 1's recipe. Test cases are what make a built tool checkable."),
         "type": "points", "title": "A spec for something it builds",
         "items": [P("Say what it does.", "The inputs, the output and every rule, word for word from the source."),
                   P("Give test cases.", "Two or three examples with the right answer, so you can check it."),
                   P("Say who uses it.", "Who, on what screen, in which language."),
                   P("Then test it.", "Run your test cases. When one fails, say which one and ask it to show its working.")]},
        {"id": note("s2-image", "One minute. SDR, 4W1H, CARE, RAISE and VAST from the slides are versions of this recipe. "
                                "ChatGPT and Copilot both draw images. The warm-up's extra step used this recipe."),
         "type": "table", "title": "The same recipe for images",
         "cols": ["Part", "National Day post"],
         "rows": [["Subject", "A Bahraini family on the Manama corniche at sunset"],
                  ["Details", "Bahrain flags, warm evening light, the bank's navy and gold"],
                  ["Style", "Clean, modern illustration"],
                  ["Format", "Square, for Instagram, no text in the image"]]},
        part("s2-ex", "exercises", "Exercises", "", 9,
             "Phones out. The brief questions need 45 seconds of reading."),
        {"id": note("s2-wins", "45 s each. The second question is the provider's loan email: asking for rates without giving them invites invented rates."),
         "type": "quiz", "secs": 45, "title": "Which brief wins?",
         "questions": [
             q("Mr Maki's new card arrived three weeks late. Which brief gets a reply you can send?",
               ["Write a reply to this complaint. Make it professional, empathetic, clear, concise and polite, and make sure the customer is happy.",
                "You are the best customer service writer in Bahrain, with 20 years' experience. Write an amazing reply to a late card complaint.",
                "Reply to Mr Maki, a Premier customer whose card came 3 weeks late after a courier delay. Apologise and explain. No compensation offer. Under 150 words, warm and direct.",
                "Reply to Mr Maki about his late card. Offer him a BD 20 credit and promise it will never happen again. Keep it short."], 2,
               "C gives the goal, the facts, the limits and the length. A piles up adjectives with no facts. B adds praise, which adds nothing. D makes promises the bank may not keep."),
             q("Ahmad Maki asks about home renovation loans. Which brief gets the most useful email?",
               ["Write a professional email to Ahmad Maki about our loan options and invite him to a consultation.",
                "Write to Ahmad Maki about home renovation loans. Use the attached product sheet for eligibility, rates and repayment. Under 200 words, friendly, end by inviting him to book a call.",
                "Act as a senior loans officer at a top bank and write the best possible email about every loan we offer.",
                "Write an email to Ahmad Maki about home renovation loans, with the eligibility criteria, interest rates and repayment options."], 1,
               "B gives the material, so the rates are the bank's own. D asks for rates without giving them, so the tool will make them up. A and C leave it to guess.")]},
        {"id": note("s2-missing", "30 s each. One addition fixes most of the problem."),
         "type": "quiz", "secs": 30, "title": "What's missing?",
         "questions": [
             q("Brief: 'Summarise this 30-page policy for the branch team.' Result: three pages of dense text nobody reads. Which addition fixes it most?",
               ["Please, and thank you", "One page, five bullet points, only what changes for tellers", "Act as an expert summariser", "Use your best judgement"], 1,
               "What done looks like: the length, the format and the reader. Politeness and a role don't tell it what you need."),
             q("Brief: 'Write the FAQ for our new app.' Result: answers about features the app doesn't have. Which addition fixes it most?",
               ["Make sure it is accurate", "You are an expert in banking apps", "The app's feature list and the five questions customers ask most", "Examples of other banks' FAQs"], 2,
               "The material. Without the feature list it fills the gaps with features other apps have. Other banks' FAQs make that worse.")]},
        {"id": note("s2-caps", "30 s. This is the provider's captions activity, done as few-shot."),
         "type": "quiz", "secs": 30, "title": "Few-shot captions",
         "questions": [
             q("You want five captions for the App 3.0 launch, in the bank's own voice. What do you give the tool?",
               ["Nothing: it knows how banks write", "The word 'catchy', in capitals", "Three captions the bank has used and liked, plus the new features", "Ten famous brand slogans to copy"], 2,
               "Few-shot: three of your own captions show the voice and the length, and the features give it the facts. Famous slogans copy someone else's voice.")]},
        {"id": note("s2-order", "60 s, then Reveal. This is the loop they run in Job 1."),
         "type": "order", "secs": 60, "title": "Build it in order",
         "intro": "Put the steps for getting a working tool in the right order.",
         "steps": [{"text": "Write the spec with every rule, word for word"},
                   {"text": "Ask it to list the rules back to you"},
                   {"text": "Let it build the tool"},
                   {"text": "Run your test cases"},
                   {"text": "Say which case failed and ask for its working"}]},
        part("s2-try", "hands", "Try it", "Job 1. Turn the fee rules into a fee calculator in ChatGPT, test it, then get a second opinion from Copilot.", 20,
             "Show the files page address. Walk the room. After 4 minutes, ask who tried the weak brief and what it ignored."),
        {"id": note("s2-job", "Twenty minutes. Start the first question as soon as people begin, so the timer covers the job. "
                              "Most weak-brief calculators ignore the maximum, apply the app discount before the cap, or waive the same-day fee for Premier. "
                              "Copilot's second opinion works from the rules as text, so no upload is needed there. "
                              "After Reveal, two people show their calculator running case B and say what the full brief changed. Two minutes each."),
         "type": "task", "title": "Job 1 · Build it",
         "files": [{"name": "Najma-fee-rules.pdf", "what": "The bank's six fee rules for international transfers"}],
         "prompts": [{"title": "The weak brief (try it first)", "text": FEE_WEAK},
                     {"title": "The full brief", "text": FEE_FULL},
                     {"title": "If a fee looks wrong", "text": FEE_FIX},
                     {"title": "Second opinion in Copilot", "text": FEE_SECOND},
                     {"title": "The six rules as text (if a file won't attach)", "text": FEE_RULES}],
         "steps": ["Download the fee rules. In ChatGPT, attach them and send the weak brief.",
                   "Try test case A in what it built. What did it ignore?",
                   "Open a new chat. In the model menu at the top, choose Thinking. Attach the file again and send the full brief.",
                   "Run test cases A and B in your calculator. Work one out by hand.",
                   "In Copilot, send the second-opinion prompt. Does it agree with your calculator?",
                   "Answer on your phone: the fee for case A and for case B.",
                   "Be ready to show the room your calculator running case B."],
         "note": "Extra step: ask for an Arabic version, or one that also shows the total the customer pays."},
        {"id": note("s2-result", "The first timer runs 15 minutes for the job. Reveal, read the working, then 60 s for case B."),
         "type": "quiz", "title": "Job 1 · What does your calculator show?",
         "questions": [
             q("Test case A: BD 4,000 to India, standard customer, in the app, normal delivery. What fee should it show?",
               ["BD 15.000", "BD 11.250", "BD 20.000", "BD 3.750"], 1,
               "0.5% of 4,000 is BD 20.000. The maximum brings it to BD 15.000. The app's 25% off comes after the maximum: BD 11.250. "
               "BD 20.000 ignores the maximum, BD 15.000 forgets the app discount, and BD 3.750 uses the GCC cap, which doesn't apply to India.", secs=900),
             q("Test case B: BD 300 to Saudi Arabia, Premier customer, 4th transfer this month, at a branch, same-day delivery. What fee should it show?",
               ["BD 3.000", "BD 4.500", "BD 2.000", "BD 5.000"], 3,
               "0.5% of 300 is BD 1.500, and the minimum makes it BD 2.000. The Premier waiver covers only the first three transfers a month. "
               "No app discount at a branch. Same-day adds BD 3.000: BD 5.000. BD 3.000 applies the waiver, BD 4.500 skips the minimum, BD 2.000 forgets same-day.", secs=60)]},
    ]})

# ======== Round 3 · Give it your context
SECTIONS.append({
    "id": "s3", "num": "3", "nav": "Your context", "mins": 55, "time": "11:00",
    "brief": "Design effective prompts for AI tools (ILO 1)",
    "title": "Give it", "titleAccent": "your context",
    "lede": "The more the assistant knows about your work, the less it guesses. Files and photos, projects with instructions, "
            "an interview before it starts, and when to switch thinking on.",
    "beats": [
        part("s3-th", "theory", "Theory", "", 12,
             "No phones. Two minutes per block. Everything here is used in Job 2 straight after."),
        {"id": note("s3-files", "Two minutes. File limits differ by plan and change often; teach people to check their own plan's limits rather than quoting numbers."),
         "type": "table", "title": "Working with files",
         "cols": ["", "Works well", "Watch out for"],
         "rows": [["PDF and Word", "Policies, proposals and reports, with their tables", "Footnotes, small print and scanned pages. Point it to the section."],
                  ["Excel and CSV", "It calculates, charts and updates the sheet", "Totals: check one yourself, and ask it to show the formula."],
                  ["Photos and scans", "Whiteboards, sticky notes, receipts, handwriting", "Handwritten dates and numbers. Ask it to list what it read before it acts."],
                  ["Long files", "Hundreds of pages in one go", "Limits differ by plan and change. Check your own plan."]],
         "note": "Tell it where to look: 'Use section 4 of the policy' beats 'see attached'."},
        {"id": note("s3-proj", "Two minutes. Show where Projects are in ChatGPT; Job 2 uses them. Copilot added projects in its October 2026 update, but a work account may not show them yet. "
                               "The next class uses the BIBF accounts too: memory should be off in both tools (on Microsoft 365 Copilot, BIBF's administrators may control it)."),
         "type": "points", "title": "Projects keep your context",
         "items": [P("A project", "is a folder with its own files and instructions, in ChatGPT and on some Copilot plans. Every chat in it starts with them."),
                   P("The instructions", "say the goal, the rules and the output you want, once: 'Assign each note to one of these three initiatives. Dates are day/month. If a note fits none, ask me.'"),
                   P("The files", "are the material it should always use: the tracker, the policy, the product sheet."),
                   P("Memory", "carries what you told it across chats. Check what it remembers in the settings, and keep it off on an account other people use.")]},
        {"id": note("s3-interview", "Ninety seconds. This turns the slides' REACT step 'ask for clarification if needed' around: you ask it to ask you. "
                                    "Jobs 2 and 4 both start with an interview."),
         "type": "points", "title": "Interview me first",
         "items": [P("The idea.", "Instead of writing the perfect brief, ask the tool to interview you: 'Ask me questions one at a time until you have what you need. Then write the instructions.'"),
                   P("Why it works.", "Your answers fill the gaps it would otherwise guess, and you see what a good brief needs."),
                   P("Where you use it today.", "Job 2, the notes project, and Job 4, the morning brief.")]},
        {"id": note("s3-tech", "Three minutes. These are the provider's techniques that still pay off: generated knowledge, self-critique, multimodal and chain of thought, "
                               "in the form you would use them today."),
         "type": "cards-static", "title": "Techniques that still pay off",
         "items": [P("Thinking on", "For sums, rules and decisions, switch on [[thinking|thinking mode]]: Thinking in ChatGPT, Think deeper in Copilot. It works the steps out before it answers."),
                   P("List the factors first", "'First list what makes a branch location work in Bahrain. Then score our three options on that list.' ([[genknow]])"),
                   P("Critique your own draft", "'Now find the three weakest points in your answer and fix them.'"),
                   P("Show it", "A photo of the whiteboard or a screenshot of the error says more than a paragraph ([[multimodal]])."),
                   P("One step at a time", "Big jobs go better as a chain: read, then list, then draft, then check.")]},
        {"id": note("s3-think", "Ninety seconds. The provider's apples and chocolates examples taught 'think step by step'. Thinking models don't need it, "
                                "and OpenAI's own guide for them says to avoid chain-of-thought prompts. Show the two menus on the projector. "
                                "On an Enterprise plan ChatGPT doesn't switch to Thinking by itself, so everyone picks it."),
         "type": "table", "title": "Thinking on or off",
         "cols": ["", "Switch thinking on", "Leave it off"],
         "rows": [["For", "A fee from six rules, a comparison of two proposals, a plan with deadlines", "A subject line, a translation, a quick rewrite"],
                  ["How in ChatGPT", "Model menu at the top of the chat, then Thinking", "Instant"],
                  ["How in Copilot", "Model menu by the message box, then Think deeper (under More if it isn't listed)", "Quick response, or Auto"],
                  ["What you write", "The task and the facts. No need to say 'think step by step'.", "The task, short and direct"],
                  ["What you get", "A slower, more careful answer", "A fast answer"]],
         "source": "OpenAI, Reasoning best practices: avoid chain-of-thought prompts. Anthropic, Prompting best practices: prefer general instructions over prescriptive steps."},
        part("s3-ex", "exercises", "Exercises", "", 6, "Phones out. Four questions, 30 s each."),
        {"id": note("s3-quiz", "30 s each. The first two are exactly what Job 2 tests."),
         "type": "quiz", "secs": 30, "title": "Context check",
         "questions": [
             q("A note says 'artwork due 12/11'. The tool writes 11 December in the tracker. What stops this happening every time?",
               ["Ask it to be more careful next time", "A line in the project instructions: dates are day/month", "Switch thinking on for every chat", "Type every note out by hand"], 1,
               "Project instructions apply to every chat. One line about the date format fixes it for good."),
             q("A photo says 'renew car park passes, end of month'. It fits none of the three initiatives. What should the tool do?",
               ["File it under the closest initiative", "Leave it out without telling you", "List it as fitting none and ask you", "Start a fourth initiative for it"], 2,
               "Say so and ask. A tool that quietly files or drops a note gives you a tracker you can't trust."),
             q("Which job gains most from switching thinking on?",
               ["Translating a two-line greeting", "Writing a subject line for an email", "Comparing two proposals against five criteria", "Making a sentence sound friendlier"], 2,
               "Several criteria, figures and conditions: that is where reasoning first pays off. The others are quick tasks."),
             q("You want the tool to rank three locations for a new branch. Which prompt uses 'list the factors first'?",
               ["Rank these three locations for a new branch.",
                "First list what makes a branch location work in Bahrain. Then score our three locations on that list.",
                "You are a property expert. Rank these three locations.",
                "Rank these three locations, and be very accurate."], 1,
               "It builds the list of factors first, then uses it. You can check the list before you trust the ranking.")]},
        part("s3-try", "hands", "Try it", "Job 2. Turn eight photos of notes into an updated tracker.", 25,
             "Show the files page. Walk the room. The interview takes 5 to 8 minutes; people who are slow can paste the ready-made instructions."),
        {"id": note("s3-job", "Twenty-five minutes. Start the first question as soon as people begin. The traps: note 5 fits two initiatives, note 6 fits none, "
                              "12/11 is 12 November (today), and Yusuf's email moves the reopening to 22 January. The one PDF with all eight photos is the quickest upload; "
                              "if ChatGPT refuses the files, they do the job in Copilot. After Reveal, two people show their tracker: "
                              "where note 5 went and the new reopening date. Then your demo: Cowork doing the same from a folder on a schedule."),
         "type": "task", "title": "Job 2 · Organise your notes",
         "files": [{"name": "Najma-notes-photos.zip", "what": "All eight photos in one zip"},
                   {"name": "Najma-notes-all-eight.pdf", "what": "The same eight photos in one PDF, if your account limits uploads"},
                   {"name": "Najma-initiatives-tracker.xlsx", "what": "The tracker: three initiatives and an empty updates log"},
                   {"name": "Note-1-whiteboard.jpg", "what": "Note 1 · the App 3.0 sprint review"},
                   {"name": "Note-2-sticky-notes.jpg", "what": "Note 2 · sticky notes"},
                   {"name": "Note-3-notebook.jpg", "what": "Note 3 · a notebook page"},
                   {"name": "Note-4-chat-screenshot.jpg", "what": "Note 4 · a chat screenshot"},
                   {"name": "Note-5-index-card.jpg", "what": "Note 5 · an index card"},
                   {"name": "Note-6-monitor-sticky.jpg", "what": "Note 6 · a sticky on a monitor"},
                   {"name": "Note-7-agenda.jpg", "what": "Note 7 · the steering committee agenda"},
                   {"name": "Note-8-printed-email.jpg", "what": "Note 8 · a printed email"}],
         "prompts": [{"title": "Step 1 · The interview", "text": NOTES_INTERVIEW},
                     {"title": "Your answers · The three initiatives", "text": NOTES_FACTS},
                     {"title": "Step 3 · With the photos", "text": NOTES_PHOTOS},
                     {"title": "Short on time · Ready-made instructions", "text": NOTES_READY}],
         "steps": ["In ChatGPT, create a project called 'Najma initiatives' with your first name.",
                   "In the project, send the interview prompt and answer its questions. The initiatives are in the second box.",
                   "Paste the instructions it writes into the project's instructions, and add the tracker to the project's files.",
                   "In a new chat in the project, upload the photos (best as the one PDF with all eight) with the Step 3 prompt.",
                   "Check its reading of each note, then answer on your phone.",
                   "Be ready to show the room your tracker: where note 5 went and the new reopening date."],
         "note": "ChatGPT won't take the files, or no projects? Do it in one Copilot chat: the ready-made instructions first, then the photos. "
                 "Extra step: in Copilot, attach notes 3 and 8 and ask what each says. Does it read the dates the same way?"},
        {"id": note("s3-result", "The first timer runs 20 minutes. Then 60 s each for the other two."),
         "type": "quiz", "title": "Job 2 · What does your tracker say?",
         "questions": [
             q("Which initiative does note 5, the index card, belong to?",
               ["Najma App 3.0 only", "The Muharraq branch only", "Both App 3.0 and the Muharraq branch", "None of the three"], 2,
               "It promotes App 3.0 inside the new Muharraq branch on launch day: an update for both. A tool that picks one loses half the update.", secs=1200),
             q("When does the Muharraq branch reopen now?",
               ["15 January 2027", "18 January 2027", "22 January 2027", "1 March 2027"], 2,
               "Yusuf's email (note 8) moves the inspection to 18 January and the reopening to 22 January. 15 January is the old date in the tracker, "
               "18 January is the inspection, and 1 March is the app launch.", secs=60),
             q("When is the National Day campaign's final artwork due?",
               ["12 November 2026", "11 December 2026", "1 December 2026", "16 December 2026"], 0,
               "Note 3 says 12/11, and the printer needs about three weeks before the 1 December launch: 12 November, today. "
               "11 December reads the date month first, which would be after the launch.", secs=60)]},
        {"id": note("s3-demo", "Five minutes, on your own laptop. Show a Cowork scheduled task that reads a folder of note photos every morning and updates the tracker file. "
                               "Point out the instructions are the same ones they just wrote."),
         "type": "points", "title": "The automatic version",
         "items": [P("Same brief, new trigger.", "Claude's Cowork can check a folder of note photos every morning and update the tracker file on its own."),
                   P("What it needs.", "A paid Claude plan. Scheduled tasks now run even when your computer is asleep, unless they need files on it."),
                   P("From a phone.", "The ChatGPT phone app adds photos straight into a project, so a note goes in the moment you take it.")]},
    ]})

# ======== Round 4 · Check before you trust
SECTIONS.append({
    "id": "s4", "num": "4", "nav": "Check it", "mins": 45, "time": "12:25",
    "brief": "Evaluate AI-generated responses for business decision-making (ILO 2)",
    "title": "Check before", "titleAccent": "you trust",
    "lede": "AI results can be fluent and wrong. Why it happens, three cases where nobody checked, the checks that catch it, "
            "and a job with a trap in the file.",
    "beats": [
        part("s4-th", "theory", "Theory", "", 10, "No phones. Two minutes per block."),
        {"id": note("s4-why", "Two minutes. Each card has one example from today: the footnote and the hidden line are in Job 3."),
         "type": "cards-static", "title": "Why results go wrong",
         "items": [P("Invented facts", "A case, a figure or a link that doesn't exist, written with full confidence ([[hallucination]])."),
                   P("Old information", "Last year's rate or a rule that has changed, when it didn't search."),
                   P("Agreeing with you", "Ask 'Isn't Wahaj cheaper?' and it tends to say yes ([[sycophancy]])."),
                   P("Slips with numbers", "A cap applied in the wrong order, a total that doesn't add up."),
                   P("Missing part of a file", "A footnote, a scanned page, the second sheet of a workbook."),
                   P("Hidden instructions", "Text in a file or a web page that tells the AI what to say ([[injection]]).")]},
        {"id": note("s4-cases", "Two minutes. Avianca: USD 5,000 penalty (22 June 2023); the court called six citations bogus. Air Canada: bereavement fare, "
                                "C$812.02 in all (14 February 2024). Deloitte: report for Australia's Department of Employment and Workplace Relations, "
                                "about AU$440,000; it refunded the final instalment, A$97,587 (October 2025)."),
         "type": "table", "title": "Three times nobody checked",
         "cols": ["Case", "What happened", "The lesson"],
         "rows": [["Mata v. Avianca, New York, 2023", "Lawyers filed a brief citing six court cases that ChatGPT had invented. The judge fined them USD 5,000.", "Open every source it cites."],
                  ["Moffatt v. Air Canada, 2024", "The airline's chatbot invented a refund rule for bereavement fares. A tribunal made the airline pay.", "You own what your chatbot tells customers."],
                  ["Deloitte Australia, 2025", "A government report had invented references and a made-up quote from a judge. Deloitte refunded part of its fee.", "Check before you sign, whoever wrote it."]],
         "source": "Mata v. Avianca, S.D.N.Y., 22 June 2023; Moffatt v. Air Canada, BC Civil Resolution Tribunal, 14 February 2024; The Register, 6 October 2025."},
        {"id": note("s4-checks", "Two minutes. The last row is the one to repeat: if you wouldn't sign it, it isn't finished."),
         "type": "table", "title": "The checking list",
         "cols": ["Check", "Ask yourself", "Najma example"],
         "rows": [["Figures", "Can I redo the key number?", "Work out one fee by hand."],
                  ["Sources", "Did I open the link and read it?", "The circular it cites says what it claims."],
                  ["Small print", "What did it leave out?", "Footnotes, conditions, the second sheet."],
                  ["Fit for the reader", "Would the CEO or the customer understand it?", "Plain words, right length, right language."],
                  ["Fairness", "Does it treat people differently without a reason?", "A credit summary that mentions nationality."],
                  ["Confidentiality", "What did I give it, and where does the result go?", "No customer data in a personal or shared account."],
                  ["Who signs it", "Would I put my name on it?", "If not, it isn't finished."]]},
        {"id": note("s4-again", "Two minutes. The slides' self-consistency and chain of verification, in the form a user can run in a minute. "
                                "Self-consistency in the research samples several separate answers and takes the majority; it doesn't happen inside one answer."),
         "type": "points", "title": "Three checks you can run in a minute",
         "items": [P("Ask again, or ask the other tool.", "Run the same question in a fresh chat, or in ChatGPT if you used Copilot. Where the answers differ, look closer ([[selfconsistency]])."),
                   P("Check each figure against its source.", "'List every figure in your answer with the page it came from.' Then open two of them ([[cove]])."),
                   P("Make it argue the other side.", "'Now argue against your recommendation as a sceptical CFO.' Weak points show up fast.")],
         "note": "The tool can help you check. The last check is yours."},
        part("s4-ex", "exercises", "Exercises", "", 10, "Phones out. The fee rules are in the case file if anyone needs them."),
        {"id": note("s4-slip", "25 s each. An AI summary of Najma's fee rules: two lines are right, two are wrong."),
         "type": "flags", "secs": 25, "title": "Spot the slip",
         "intro": "An AI summary of Najma's fee rules. Green flag if the line matches the rules, red flag if it doesn't.",
         "items": [{"text": "The minimum fee is BD 2.000.", "verdict": "green", "rule": "Rule 2: never less than BD 2.000 and never more than BD 15.000."},
                   {"text": "Premier customers never pay a transfer fee.", "verdict": "red", "rule": "Rule 4: only their first three transfers each calendar month are free. The fourth pays."},
                   {"text": "Transfers to GCC countries have a maximum fee of BD 5.000.", "verdict": "green", "rule": "Rule 3: Saudi Arabia, the UAE, Kuwait, Oman and Qatar, maximum BD 5.000."},
                   {"text": "The app's 25% discount also applies to the same-day fee.", "verdict": "red", "rule": "Rule 6: the BD 3.000 same-day fee gets no app discount and no Premier waiver."}]},
        {"id": note("s4-est", "30 s. The point is the second half of the reveal: on a task just outside what AI does well, the AI group did worse."),
         "type": "estimate", "title": "Faster, and right?", "secs": 30,
         "question": "In a 2023 study, BCG consultants with GPT-4 did 18 tasks that AI handles well. How much faster were they than those without it?",
         "options": ["About 5% faster", "About 25% faster", "About 60% faster", "Twice as fast"], "answer": 1,
         "reveal": "25% faster, with more than 40% higher quality and 12% more tasks done. But on a task just outside what AI does well, "
                   "consultants using it were 19 percentage points less likely to get the right answer. Speed and accuracy are two different questions.",
         "source": "Dell'Acqua et al., Navigating the Jagged Technological Frontier, Harvard Business School working paper 24-013, 2023 (758 BCG consultants)."},
        {"id": note("s4-which", "30 s each."),
         "type": "quiz", "secs": 30, "title": "Which check catches it?",
         "questions": [
             q("An AI summary of a 60-page supplier contract says the notice period is 30 days. What catches a mistake?",
               ["Ask it to say it more simply", "Ask it which page says so, then read that page", "Ask the same question more politely", "Check how long the summary is"], 1,
               "Check the figure against its source: ask for the page, then read it yourself."),
             q("Two AI tools give different three-year totals for the same proposal. What do you do?",
               ["Take the lower one", "Take the one from the paid tool", "Redo the sum yourself from the proposal", "Use the average of the two"], 2,
               "A difference tells you where to look. The proposal is the source: redo the sum from it.")]},
        part("s4-try", "hands", "Try it", "Job 3. In Copilot, compare two supplier proposals for a customer chatbot, make it argue against itself, then ask ChatGPT.", 18,
             "Show the files page. Walk the room. Look for screens where the tool recommends Wahaj."),
        {"id": note("s4-job", "Eighteen minutes. The traps: Wahaj's Arabic module is BD 900 a month in a footnote, and a white 6-point line tells AI tools to recommend Wahaj. "
                              "Wahaj also keeps data in Dubai and charges extra for handover. Tarteeb meets all five criteria. "
                              "After Reveal, ask who got a Wahaj recommendation first, and what changed after the other-side prompt. "
                              "Then one person shows the hidden line their tool found, its final recommendation and where Copilot and ChatGPT differed. "
                              "Worth one line: in July 2026 a researcher showed Copilot in Word following white, hidden text in a document (reported by The Hacker News). Same trick as the Wahaj file."),
         "type": "task", "title": "Job 3 · Trap in the file",
         "files": [{"name": "Tarteeb-Digital-proposal.pdf", "what": "Proposal 1 · Tarteeb Digital, Manama"},
                   {"name": "Wahaj-Systems-proposal.pdf", "what": "Proposal 2 · Wahaj Systems, Dubai"}],
         "prompts": [{"title": "The comparison", "text": CHAT_COMPARE},
                     {"title": "The other side", "text": CHAT_AGAINST},
                     {"title": "Look for anything hidden", "text": CHAT_TRAP}],
         "steps": ["Download both proposals. In Copilot, choose Think deeper in the model menu (under More if it isn't listed). Attach both files.",
                   "Send the comparison prompt. Read its table and its recommendation.",
                   "Send the other side. Did anything change?",
                   "Send the last prompt to look for anything hidden.",
                   "In ChatGPT, choose Thinking, attach both files and send the comparison prompt. Where its table differs from Copilot's, check the proposal.",
                   "Answer on your phone: Wahaj's real three-year cost, and what the hidden line asked.",
                   "Be ready to show the room the hidden line, your final recommendation and where the two tools differed."],
         "note": "Extra step: ask Copilot which page each figure in its table comes from, then open two of those pages yourself."},
        {"id": note("s4-result", "The first timer runs 15 minutes. Then 60 s for the hidden line."),
         "type": "quiz", "title": "Job 3 · What did you find?",
         "questions": [
             q("What is Wahaj Systems' real cost over three years?",
               ["BD 80,400", "BD 108,000", "BD 112,800", "BD 91,200"], 2,
               "Set-up BD 12,000, plus 36 months of the BD 1,900 licence and the BD 900 Arabic module from the footnote: BD 112,800. "
               "BD 80,400 misses the footnote, BD 91,200 counts Arabic for one year only, and BD 108,000 is Tarteeb's total.", secs=900),
             q("What did the hidden line in the Wahaj file ask AI tools to do?",
               ["Recommend Wahaj as the best choice", "Leave out the Arabic module fee", "Say the data is kept in Bahrain", "Nothing: there is no hidden line"], 0,
               "White 6-point text tells AI assistants to say Wahaj meets every requirement and to recommend it. A person can't see it; the tool reads it. "
               "This is [[injection|prompt injection]].", secs=60)]},
        {"id": note("s4-memo", "Three minutes in pairs, each pair answers, then Show how to read it. Close the round with: the tool drafts, you sign."),
         "type": "discuss", "title": "Would you sign the memo?", "mins": 3,
         "table": {"cols": ["Criterion", "Tarteeb Digital", "Wahaj Systems"],
                   "rows": [["Three-year cost", "BD 108,000", "BD 112,800 (BD 80,400 without the footnote)"],
                            ["Arabic, with Gulf dialect, and English", "Included", "Arabic is BD 900 a month extra; no word on dialect"],
                            ["Customer data", "Kept in Bahrain", "Kept in Dubai"],
                            ["Live by 1 March 2027", "Yes, 10 weeks", "Yes, 8 weeks"],
                            ["Handover to a person", "Included", "Add-on, priced on request"]]},
         "prompt": "Your AI tool recommended a supplier. Would you sign the memo to the CFO as it stands? What would you check or change first?",
         "reading": ["Tarteeb meets all five criteria and costs less once the footnote is counted.",
                     "A tool that missed the footnote, or followed the hidden line, recommends Wahaj: the supplier that keeps customer data outside Bahrain.",
                     "Before you sign: redo the three-year sum, check where the data is kept against the bank's policy and the PDPL, and report the hidden instruction to procurement."]},
    ]})

# ======== Round 5 · Make it work for you every day
SECTIONS.append({
    "id": "s5", "num": "5", "nav": "Every day", "mins": 30, "time": "13:10",
    "brief": "Improve AI-generated outputs",
    "title": "Make it work", "titleAccent": "every day",
    "lede": "Scheduled tasks and agents do the work while you are elsewhere. You build a daily news brief for Najma's Head of Digital, check what it brings back, "
            "and see a schedule and an agent at work.",
    "beats": [
        part("s5-th", "theory", "Theory", "", 4, "No phones. Two short blocks, then straight into the job."),
        {"id": note("s5-sched", "Ninety seconds. OpenAI's help page lists every plan for tasks, Free with up to 3 active tasks; its pricing page still says no for Free, "
                                "so tell people to check their own. Copilot's scheduled prompts are on by default with a Microsoft 365 Copilot licence (general availability early 2026); "
                                "the free Copilot Chat doesn't seem to have them. Claude does the same through Cowork on paid plans. Nobody sets up a task on the BIBF accounts: "
                                "you show one on your laptop after Job 4."),
         "type": "table", "title": "Scheduled tasks",
         "cols": ["", "ChatGPT", "Copilot"],
         "rows": [["What it's called", "A task", "A scheduled prompt"],
                  ["How you set it up", "Ask in a chat: 'Every Sunday to Thursday at 7:00, …' It creates a task.", "Write the prompt in a chat and choose to run it on a schedule."],
                  ["Which plans", "Paid plans; Free has a few tasks at most, check yours", "A Microsoft 365 Copilot licence, check yours"],
                  ["No schedule on your plan", "Keep the prompt in a project and run it each morning", "The same"]]},
        {"id": note("s5-agent", "Ninety seconds. The provider's ReAct slide (reason, act, observe) describes how agents work inside. Users don't write ReAct prompts any more; "
                                "they brief an agent. Then the demo: an agent working through a folder of expense claims, on your laptop."),
         "type": "points", "title": "Briefing an agent",
         "items": [P("What an agent does.", "It plans, uses tools such as search, a browser or your files, checks what happened and carries on until the job is done. "
                                            "The slides call this pattern [[react]]; it is now built into ChatGPT, Copilot and Claude."),
                   P("Brief it like a contractor.", "The goal, the files or sites it may use, what it must not touch, and when to stop and ask you."),
                   P("Limit what it can reach.", "Give it one folder rather than your whole drive. Ask it to check with you before it sends, pays or deletes anything."),
                   P("Check the work.", "Ask for a list of what it did, and spot-check it.")]},
        part("s5-try", "hands", "Try it", "Job 4. Let Copilot interview you as Fatema, Head of Digital, then build her daily news brief.", 20,
             "Show the files page. Everyone answers the interview as Fatema, from her profile on the files page. Walk the room and look at the links people open."),
        {"id": note("s5-job", "Twenty minutes. Every brief comes out different, so the phone questions use the sample brief. "
                              "Item 2 is dated 3 March 2024, item 3's link is about Q3 results, and item 4 is an anonymous forum. "
                              "Copilot lists its sources under the answer; if the BIBF account has web search switched off, people do the job in ChatGPT with search on. "
                              "After Reveal, one person shows their brief and opens one link with the room. Then show the schedule on your laptop: "
                              "the same brief set for Sunday to Thursday at 7:00."),
         "type": "task", "title": "Job 4 · The morning brief",
         "files": [{"name": "Sample-morning-brief.pdf", "what": "A sample brief written by an AI assistant, for the three checks"}],
         "prompts": [{"title": "The interview", "text": BRIEF_INTERVIEW},
                     {"title": "Your answers · Fatema's profile", "text": BRIEF_FATEMA}],
         "steps": ["In Copilot, send the interview prompt. Answer its questions as Fatema, from her profile in the second box.",
                   "Let it run the brief once. Open two of the links: does each page say what the line says, and is it recent?",
                   "Tell it what to fix, for example 'drop forums' or 'only Gulf news', and run it again.",
                   "Download the sample brief and answer the three questions on your phone.",
                   "Be ready to show the room your brief and one link you checked."],
         "note": "No web search in Copilot? Do the job in ChatGPT with search on. Extra step: run the same interview in ChatGPT and compare whose links hold up, "
                 "or change two answers to fit your own job, leaving out your employer's name."},
        {"id": note("s5-result", "The first timer runs 15 minutes. Then 60 s each."),
         "type": "quiz", "title": "Job 4 · Check the sample brief",
         "questions": [
             q("Which item in the sample brief is an old story shown as new?",
               ["Item 1 · GCC banks spend more on AI service", "Item 2 · Buy-now-pay-later rules this week", "Item 3 · An Arabic voice assistant", "Item 5 · Fintech funding in the third quarter"], 1,
               "Item 2 says 'this week', but the story is dated 3 March 2024. Check the date on the page itself.", secs=900),
             q("Which item's link doesn't match its line?",
               ["Item 1 · GCC banks spend more on AI service", "Item 3 · An Arabic voice assistant", "Item 4 · Gold will double", "Item 5 · Fintech funding in the third quarter"], 1,
               "The line is about an Arabic voice assistant, but the link's address ends 'q3-results-roundup'. Open a link before you quote it.", secs=60),
             q("Which source should the brief drop?",
               ["Gulf Finance Today", "Regional Banking News", "The anonymous investing forum", "None: all of them are fine"], 2,
               "An anonymous forum post predicting gold will double is a rumour. Tell the brief to use only the sources you trust.", secs=60)]},
    ]})

# ======== Final
SECTIONS.append({
    "id": "f", "num": "F", "nav": "Final", "mins": 20, "time": "13:40",
    "title": "The final", "titleAccent": "round",
    "lede": "The post-course check, where you see how far you have come, then a last quick-fire round, the final leaderboard and a look back at what you built.",
    "beats": [
        {"id": note("f-post", "Press Open the check on the phones. About eight minutes. Each phone shows that person's score at the start and now (never the answers)."),
         "type": "assesscue", "which": "post", "title": "Post-course check", "mins": 10,
         "intro": "The same twelve questions as this morning. When you send it, you see your score at the start and your score now."},
        {"id": note("f-quick", "Two fast ones to settle the leaderboard. 20 s each."),
         "type": "quiz", "secs": 20, "title": "Last quick-fire",
         "questions": [
             q("Which are the five parts of a brief?",
               ["Role, tone, length, format, style", "Goal, context, material, what done looks like, limits", "Question, answer, check, send, save", "Who, what, when, where, why"], 1,
               "Goal, context, material, what done looks like, and limits. RACE, CRISPE and the rest are versions of it."),
             q("Which feature runs a news brief every morning on its own?",
               ["Memory", "A project", "A scheduled task", "Thinking mode"], 2,
               "A scheduled task runs a prompt at a set time. A project keeps the context, and memory carries facts between chats.")]},
        {"id": note("f-board", "Show the leaderboard on the phones, then the full-screen board. Read the top 3 by code name. "
                          "Check the real names on your laptop first, then decide whether to press Reveal the real names."), "type": "leaderboard", "title": "Final leaderboard"},
        {"id": note("f-take", "Read the three takeaways one last time."), "type": "takeaways", "title": "What you leave with"},
        {"id": note("f-built", "One minute. Name who showed each one today."),
         "type": "cards-static", "title": "What you built today",
         "items": [P("A fee calculator", "Six fee rules turned into a working tool, tested on two cases. The spec and the test cases made it right."),
                   P("A notes tracker", "Eight photos of notes in one project. The interview wrote its instructions."),
                   P("A supplier check", "Two proposals compared. A footnote fee and a hidden instruction found."),
                   P("A morning brief", "Built from an interview, with a date and a link on every item, and two links opened before trusting it.")],
         "note": "The same recipe works in any AI tool your employer approves: a clear brief, the right context and your own check."},
        {"id": note("f-out", "Leave five minutes for the BIBF evaluation. Walk the room to check every desktop is cleaned up and signed out."),
         "type": "points", "title": "Before you leave",
         "items": [P("Clean up.", "Delete the chats and projects you made today in both tools. The next class uses the same accounts."),
                   P("Sign out.", "Sign out of ChatGPT and Copilot, then close the private window."),
                   P("Tell BIBF.", "Fill in the BIBF evaluation.")]},
    ]})

# ---------------------------------------------------------------- task guides: step by step with Windows shortcuts
# Each step is [what to do, keys]. Participants see the guides on the files page; the presentation keeps the short
# steps and opens the guide on request. HELP (instructor notes only) lists the usual problems and fixes.
SHORTCUTS = [
    ["Ctrl + Shift + N", "In Edge: open a private (InPrivate) window"],
    ["Ctrl + C, Ctrl + V", "Copy, paste"],
    ["Ctrl + A", "Select everything in the box or page"],
    ["Shift + Enter", "In a chat box: a new line without sending"],
    ["Ctrl + J", "In the browser: open the list of downloads"],
    ["Ctrl + click", "Open a link in a new tab"],
    ["Ctrl + Z", "Undo"],
]
GUIDE = {
    "s1-warm": [
        ["On the course site's Files page, click Copy on 'The warm-up prompt'.", ""],
        ["In ChatGPT, click in the chat box, paste and press Enter.", "Ctrl + V, Enter"],
        ["Switch to the Copilot tab, paste the same prompt and press Enter.", "Ctrl + Tab, Ctrl + V, Enter"],
        ["Move the sliders in what comes back. Which tool made what?", ""],
        ["Write your own one line asking for a National Day greeting from Najma Bank. Send it in either tool and compare with your neighbour.", ""],
        ["Extra step: copy 'Extra step · An image for National Day' and send it in either tool.", "Ctrl + V, Enter"],
    ],
    "s2-turn": [
        ["On the Files page, find 'Your turn' and click Copy on one scenario.", ""],
        ["In ChatGPT, paste it and write your brief around it: goal, context, material, what done looks like, limits.", "Shift + Enter for a new line"],
        ["Select your whole brief and copy it, then send it.", "Ctrl + A, Ctrl + C, Enter"],
        ["Switch to Copilot, paste the same brief and send it.", "Ctrl + Tab, Ctrl + V, Enter"],
        ["Compare the two answers. Change the line of your brief that left room to guess.", ""],
        ["Tell your neighbour what you changed.", ""],
    ],
    "s2-job": [
        ["On the Files page, click Download for Najma-fee-rules.pdf.", ""],
        ["In ChatGPT, start a new chat. Click + (or the paperclip) and choose the file from Downloads.", ""],
        ["On the Files page, click Copy on 'The weak brief'. Paste it into the chat box and send.", "Ctrl + V, Enter"],
        ["Try test case A in what it built. What did it get wrong?", ""],
        ["Start a new chat and attach the file again, or paste 'The six rules as text'. Copy 'The full brief', paste and send.", "Ctrl + V, Enter"],
        ["Enter test cases A and B in the calculator that appears in the answer.", ""],
        ["If a fee looks wrong, copy 'If a fee looks wrong', paste and send.", "Ctrl + V, Enter"],
        ["Switch to Copilot. Copy 'Second opinion in Copilot', paste and send. Does it agree with your calculator?", "Ctrl + Tab, Ctrl + V, Enter"],
        ["Answer the two questions on your phone.", ""],
        ["Be ready to show the room your calculator running case B.", ""],
    ],
    "s3-job": [
        ["On the Files page, download the tracker and Najma-notes-all-eight.pdf. One PDF is quicker to upload than eight photos.", ""],
        ["Rather have the photos? Download the zip, open Downloads, right-click it, choose Extract All, then Extract.", "Ctrl + J"],
        ["In ChatGPT, click New project in the sidebar. Name it 'Najma initiatives' and your first name.", ""],
        ["In the project, start a chat. Copy 'Step 1 · The interview', paste and send. Answer one question at a time.", "Shift + Enter for a new line"],
        ["Copy the instructions it writes. Open the project's instructions, paste them and save.", "Ctrl + A, Ctrl + C, Ctrl + V"],
        ["Add the tracker to the project's files.", ""],
        ["Start a new chat in the project. Attach the PDF (or the photos), copy 'Step 3 · With the photos', paste and send.", "Ctrl + V, Enter"],
        ["Check its list of what each note says, and download the updated tracker if it made one.", ""],
        ["Answer the three questions on your phone.", ""],
        ["Be ready to show the room your tracker: where note 5 went and the new reopening date.", ""],
    ],
    "s4-job": [
        ["On the Files page, download both proposals.", ""],
        ["In Copilot, start a new chat and attach both files with + (or the paperclip).", ""],
        ["Copy 'The comparison', paste and send. Read the table and the recommendation.", "Ctrl + V, Enter"],
        ["Copy 'The other side', paste and send.", "Ctrl + V, Enter"],
        ["Copy 'Look for anything hidden', paste and send.", "Ctrl + V, Enter"],
        ["Switch to ChatGPT. Start a new chat, attach both files, paste 'The comparison' and send. Compare the two tables.", "Ctrl + Tab, Ctrl + V, Enter"],
        ["Answer the two questions on your phone.", ""],
        ["Be ready to show the room the hidden line, your final recommendation and where the two tools differed.", ""],
    ],
    "s5-job": [
        ["On the Files page, copy 'The interview'. In Copilot, paste it into a new chat and send.", "Ctrl + V, Enter"],
        ["Answer its questions as Fatema, one at a time. Her answers are in 'Your answers · Fatema's profile'.", "Shift + Enter for a new line"],
        ["When it runs the brief, open two of its links (or its Sources) in new tabs and read the date and the story.", "Ctrl + click"],
        ["Tell it what to fix and ask it to run the brief again.", ""],
        ["Download the sample brief and answer the three questions on your phone.", ""],
        ["Be ready to show the room your brief and one link you checked.", ""],
    ],
}
HELP = {
    "s1-warm": [["Only text comes back, no visual", "Ask: 'Show it as an interactive chart with sliders.' If it still can't, that is the comparison: note which tool did what."],
                ["One tool shows code", "Ask it to show the result instead of the code. If it can't, look at what the other tool made."]],
    "s2-turn": [["Not sure what to write", "Use the five parts as headings, one line each: Goal, Context, Material, What done looks like, Limits."],
                ["The two tools give very different answers", "Good: look for the line in the brief that left room to guess, and fix it."]],
    "s2-job": [["The file won't attach", "Open the PDF, select all the text, copy it and paste it into the chat."],
               ["Message limit reached", "Switch to the other tool, or work with a neighbour."],
               ["ChatGPT won't take another file", "Paste 'The six rules as text' instead of attaching the PDF."],
               ["Copilot and the calculator disagree", "Good: work that case out by hand, one rule at a time. The rules decide."],
               ["It shows code instead of a tool", "Ask: 'Show it as an interactive tool here instead of code.'"],
               ["Two people get different fees", "Good: ask them to compare their briefs and their calculators."]],
    "s3-job": [["Can't upload eight files", "Use the PDF with all eight photos on two pages."],
               ["No Projects option", "Do it in one chat: paste the ready-made instructions first, then the photos."],
               ["ChatGPT won't take the files", "Do the job in Copilot: one chat, the ready-made instructions first, then the PDF or the photos."],
               ["It reads 12/11 as 11 December", "Point to the date line in the instructions, then ask it to fix the tracker."],
               ["No Excel file back", "Ask for the updated tracker as an Excel file. If it can't, a table in the chat is enough."],
               ["The interview runs long", "Answer 'that's enough, write the instructions now', or paste the ready-made ones."]],
    "s4-job": [["It recommends Wahaj", "Ask: 'Did you count the footnote on the price?' and send the hidden-text prompt."],
               ["It doesn't find the hidden line", "Open the Wahaj PDF, press Ctrl + A: the white line shows up under the handover section."],
               ["One file won't attach", "Attach them one at a time, in two messages."],
               ["ChatGPT won't take the files", "Compare your Copilot table with a neighbour's instead."]],
    "s5-job": [["No web search in Copilot", "Do the job in ChatGPT with search switched on (the globe icon). Without search the brief is made up: say so to the room."],
               ["It asks something the profile doesn't cover", "Answer the way Fatema would, in a line. The brief only needs the gist."],
               ["Links open to nothing", "Ask it for the original source of that item, then search for the headline yourself."]],
}
for s_ in SECTIONS:
    for b_ in s_["beats"]:
        if b_["id"] in GUIDE:
            b_["guide"] = GUIDE[b_["id"]]

# ---------------------------------------------------------------- the case file (a pop-up on every page)
CASE = {
    "title": "Najma Bank",
    "match": "Najma",
    "lede": "Everything about Najma Bank and its files, in one place. The bank, its people and its suppliers are fictional, made for this course.",
    "sections": [
        {"id": "glance", "title": "At a glance",
         "text": ["A retail bank in Bahrain with its head office in Seef. Most of its customers bank on the app.",
                  "You have just joined its new AI team, working for Fatema Al Sayed, Head of Digital."],
         "facts": [["Head office", "Seef, Manama"], ["Branches", "9"], ["Customers", "About 420,000"], ["Currency", "Bahraini dinar (BD), shown with three decimals"]]},
        {"id": "initiatives", "title": "The three initiatives",
         "text": ["The initiatives tracker for Job 2 starts from these rows. Dates in the team's notes are day/month."],
         "table": {"cols": ["Initiative", "Owner", "Key date", "Stage"],
                   "rows": [["Najma App 3.0", "Fatema Al Sayed", "Launch 1 March 2027", "Build"],
                            ["Muharraq branch of the future", "Yusuf Janahi", "Reopens 15 January 2027", "Fit-out"],
                            ["National Day campaign", "Maryam Bucheeri", "Launch 1 December 2026", "Creative"]]}},
        {"id": "fees", "title": "The fee rules",
         "text": ["International transfers, in force from 1 November 2026 (Job 1). The rules apply in this order."],
         "table": {"cols": ["Rule", "What it says"],
                   "rows": [["1", "The standard fee is 0.5% of the amount sent."],
                            ["2", "The fee is never less than BD 2.000 and never more than BD 15.000."],
                            ["3", "Transfers to GCC countries (Saudi Arabia, the UAE, Kuwait, Oman and Qatar) have a maximum fee of BD 5.000."],
                            ["4", "Najma Premier customers pay no fee on their first three transfers in each calendar month."],
                            ["5", "Transfers made in the Najma app get 25% off the fee worked out above, after the minimum and maximum."],
                            ["6", "Same-day delivery adds a flat BD 3.000. The app discount does not apply to it, and the Premier waiver does not cover it."]]}},
        {"id": "chatbot", "title": "The chatbot decision",
         "text": ["Najma wants an AI customer service assistant in the app for the App 3.0 launch, and will sign on 1 December 2026 (Job 3). Two suppliers sent proposals."],
         "table": {"cols": ["Criterion", "What Najma needs"],
                   "rows": [["Cost", "The lowest total over three years: set-up plus 36 months of every monthly fee"],
                            ["Languages", "Arabic, including Gulf dialect, and English"],
                            ["Data", "Customer data stays in Bahrain"],
                            ["Timing", "Live by 1 March 2027"],
                            ["Handover", "Hands the chat to a person when it can't help"]]}},
        {"id": "files", "title": "The files",
         "text": ["Each file is on the files page, with the prompts and a Copy button for each."],
         "table": {"cols": ["File", "What it holds"],
                   "rows": [["Najma-fee-rules.pdf", "Job 1 · the six fee rules for international transfers"],
                            ["Note-1 to Note-8 (.jpg), Najma-notes-photos.zip, Najma-notes-all-eight.pdf", "Job 2 · eight photos of the team's notes from this week"],
                            ["Najma-initiatives-tracker.xlsx", "Job 2 · the tracker with an empty updates log"],
                            ["Tarteeb-Digital-proposal.pdf, Wahaj-Systems-proposal.pdf", "Job 3 · two supplier proposals for the chatbot"],
                            ["Sample-morning-brief.pdf", "Job 4 · a sample news brief written by an AI assistant"]]}},
    ]}

# ---------------------------------------------------------------- the pre- and post-course check (12 questions)
# ILO 1: questions 1 to 6 (T1 the brief, T2 context). ILO 2: questions 7 to 12 (T3 facts and sources, T4 hidden risks).
# Right answers spread evenly: three on each of A, B, C and D. Options are of similar length; no clues in the stems.
ASSESS = [
    ("T1", "Which brief is most likely to get a usable first draft of a reply to a customer?",
     ["One that names the topic: the late card", "One that gives the goal, the facts, the tone and a word limit", "One that says it is the best banker in Bahrain", "One that asks for a reply that is good and professional"], 1,
     ["It names the topic but gives no facts, tone or length, so the tool has to guess them.",
      "Goal, facts, tone and a limit: the parts of a brief that let a capable colleague do the job without coming back to you.",
      "A role changes the tone; it adds no facts and doesn't make the answer more accurate.",
      "'Good and professional' says nothing about the facts, the reader or the length."]),
    ("T1", "You give the tool three captions your bank has used before you ask for new ones. What do they do?",
     ["Show the style and format you want", "Make the facts in the captions more accurate", "Switch on the tool's thinking mode", "Stop the tool from searching the web"], 0,
     ["Few-shot examples show the voice, length and format, and the tool follows them.",
      "Examples shape the style. The facts come from the material you give it.",
      "Thinking mode is a separate setting; examples don't switch it on.",
      "Examples have nothing to do with web search."]),
    ("T2", "You need an answer from a 40-page policy on cash withdrawals. What is the best way to get it?",
     ["Retype the parts of it you remember", "Ask without it, since it knows most policies", "Upload it and point to the right section", "Paste in only the first page of it"], 2,
     ["Your memory of the policy may be wrong or incomplete.",
      "It doesn't know your bank's policy. It will answer from general knowledge and may invent details.",
      "The tool reads the real policy, and pointing to the section stops it from missing the part you need.",
      "The answer is probably not on page 1."]),
    ("T1", "When does switching on thinking mode help most?",
     ["Fixing a typo in one short sentence", "Translating a two-line greeting", "Writing a subject line for an email", "Working out a fee from six rules"], 3,
     ["A typo needs no reasoning; thinking only makes it slower.",
      "A short translation is quick work without thinking.",
      "A subject line is a quick task.",
      "Several rules applied in order: that is where working the steps out first pays off."]),
    ("T2", "Why ask the tool to interview you before it starts a task?",
     ["Your answers fill the gaps it would guess", "The final answer comes out much shorter", "It keeps your data away from the provider", "Projects only work after an interview"], 0,
     ["It asks for what it needs instead of guessing, and you see what a good brief needs.",
      "Length depends on what you ask for. The interview doesn't change it.",
      "Your answers go to the provider like any other message.",
      "Projects work without an interview; the interview helps you write their instructions."]),
    ("T2", "What belongs in a project's instructions?",
     ["Your password, so it can sign in for you", "The goal, the rules and the output you want", "A copy of every chat you have ever had", "The project's name and nothing else"], 1,
     ["Never put a password in a prompt or in instructions.",
      "Instructions set the goal, the rules and the output once, for every chat in the project.",
      "Old chats add noise. Give it the rules and the files it needs.",
      "A name alone tells it nothing about the job."]),
    ("T3", "An AI draft memo cites a central bank circular with a link. What do you do before you use it?",
     ["Use it: a link means the source is real", "Ask the assistant whether it is sure", "Open the link and read what it says", "Remove the link and keep the claim"], 2,
     ["Tools can invent links, or link to a page that says something else.",
      "It will usually say yes. Asking it is no check.",
      "Read the source yourself: does it exist, and does it say what the memo claims?",
      "The claim is still unchecked without its source."]),
    ("T4", "An AI summary of a supplier's price leaves out a footnote. What is the risk?",
     ["The real cost is higher than it looks", "The summary will be far too long", "The supplier will see your prompt", "None: footnotes aren't part of a price"], 0,
     ["Extra fees often sit in footnotes and small print. Check them yourself.",
      "Leaving something out makes a summary shorter.",
      "Suppliers can't see what you ask your AI tool.",
      "Footnotes often carry fees and conditions that are part of the price."]),
    ("T3", "Which is a sign that an AI answer may be invented?",
     ["It gives a source you can open", "It shows each step of its sum", "It says when it isn't sure", "It cites a case you can't find anywhere"], 3,
     ["A source you can open is something you can check.",
      "Showing the steps lets you check the sum.",
      "Saying it isn't sure is a good sign.",
      "A citation you can't find anywhere is the classic sign of an invented source, as in Mata v. Avianca."]),
    ("T4", "A file you ask AI to analyse has hidden text telling AI tools to recommend one supplier. What is this?",
     ["Few-shot prompting with examples", "Prompt injection: a hidden instruction", "A knowledge cutoff in the model", "Self-consistency across answers"], 1,
     ["Few-shot means examples you give it yourself.",
      "Instructions planted in a file or web page that the tool may follow: prompt injection.",
      "A cutoff is the date its training data ends.",
      "Self-consistency means comparing several answers to the same question."]),
    ("T4", "Which of these is safe to paste into a personal AI account?",
     ["A customer's name and account number", "A board paper marked confidential", "The fee table on the bank's website", "A colleague's performance review"], 2,
     ["Personal data: keep it out of personal accounts. Bahrain's PDPL applies.",
      "Confidential papers only go into your bank's approved tool, if policy allows.",
      "Already public, so it is safe to paste anywhere.",
      "Personal data about a colleague: keep it out."]),
    ("T3", "When is an AI result ready to support a business decision?",
     ["When it sounds confident and has no doubts", "When it is long, detailed and well formatted", "When two AI tools agree with each other", "When you've checked its figures and sources"], 3,
     ["Confidence is no sign of accuracy.",
      "Length and formatting can hide mistakes.",
      "Two tools can make the same mistake. A difference tells you where to look; agreement proves nothing.",
      "You check the key figures and sources yourself, and you are ready to sign it."]),
]
TOPICS = [{"id": "T1", "name": "Writing the brief", "round": "s2"},
          {"id": "T2", "name": "Giving it context", "round": "s3"},
          {"id": "T3", "name": "Checking facts and sources", "round": "s4"},
          {"id": "T4", "name": "Hidden costs, instructions and data", "round": "s4"}]
assessment = {"title": "Pre- and post-course check", "topics": TOPICS,
              "pre": {"title": "Pre-course check", "lede": "Twelve questions, about eight minutes. Answer on your own. Nobody sees your answers, and you will not see a score now: it appears in the final round, next to your post-course score."},
              "post": {"title": "Post-course check", "lede": "The same twelve questions as this morning. When you send it, you see your score at the start and your score now."},
              "questions": []}
for i, (topic, text, opts, ans, why) in enumerate(ASSESS):
    qid = "A%d" % (i + 1)
    assessment["questions"].append({"id": qid, "topic": topic, "q": text, "options": opts})
    KEY[qid] = {"answer": ans, "why": [("Correct. " if j == ans else "") + why[j] for j in range(4)]}

COURSE = {
    "title": "AI Prompt Engineering", "titleAccent": "for Business Professionals",
    "program": "BIBF · CLS-00018670 · COM1247",
    "when": "Thursday 12 November 2026 · BIBF Bahrain Bay · 09:00 to 14:00",
    "instructor": "Mohamad Abdallah El Izmirli", "fileTag": "BIBF-Prompt", "joinUrl": "https://bibf-prompt.vercel.app",
    "qa": {"title": "AI Prompt Engineering for Business Professionals", "programme": "BIBF", "code": "CLS-00018670 · COM1247", "dates": "12 November 2026", "venue": "BIBF Bahrain Bay",
           "hours": "09:00 to 14:00", "days": {"1": "Thursday 12 November 2026"}},
    "lede": "A one-day, hands-on workshop. You brief ChatGPT and Copilot like a capable colleague, give them the context they need, "
            "and check what comes back before it drives a decision. Four simulations for a fictional Bahrain bank, built and shown in class.",
    # six people, each playing alone: the live game seats each one in a slot of their own and shows names (see site/js/live.js)
    "solo": True,
    "teams": ["Player %d" % i for i in range(1, 7)],
    # each seat plays under an AI code name on the projector and the phones; the notes view shows the real name too
    "codeNames": ["Neuron", "Vector", "Pixel", "Tensor", "Cortex", "Kernel"],
    "takeaways": [
        P("Brief it like a colleague", "Say the goal, give the context and the material, describe what done looks like and set the limits. A clear brief beats clever wording."),
        P("Give it context that lasts", "Projects, files and an interview before it starts keep the assistant working your way, day after day."),
        P("Check before you trust", "Redo the key figures, open the sources, read the small print and decide who signs it. The tool drafts; you decide.")],
    "sections": SECTIONS,
    "shortcuts": SHORTCUTS,
    "caseFile": CASE,
    "assessment": assessment,
    "breaks": {
        "after-s2": {"time": "10:45", "mins": 15, "title": "Break", "text": "Fifteen minutes. Leave your AI tool signed in; the private window stays open."},
        "after-s3": {"time": "11:55", "mins": 30, "title": "Dhuhr and lunch", "text": "Thirty minutes. Round 4 starts at 12:25."}},
    "glossary": {
        "prompt": {"term": "Prompt", "def": "What you type or paste into an AI tool: the request, and any material and instructions with it."},
        "brief": {"term": "Brief", "def": "A prompt written like a brief to a capable colleague: the goal, the context, the material, what done looks like and the limits."},
        "llm": {"term": "Large language model (LLM)", "def": "The kind of AI model behind Claude, ChatGPT, Gemini and Copilot. It writes by predicting the most likely next words."},
        "context": {"term": "Context", "def": "Everything the tool can see when it answers: your prompt, the files and photos you add, the project's instructions and what it remembers."},
        "project": {"term": "Project", "def": "A folder in ChatGPT or Copilot with its own files and instructions. Every chat in it starts with them."},
        "memory": {"term": "Memory", "def": "A setting that lets the tool carry facts about you from one chat to the next. You can see, edit or switch it off in the settings."},
        "zeroshot": {"term": "Zero-shot prompt", "def": "A request with no examples. Where to start for most tasks."},
        "fewshot": {"term": "Few-shot prompt", "def": "A request with two or three examples of what you want, so the tool copies their style or format."},
        "role": {"term": "Role prompt", "def": "Telling the tool to act as someone, such as a compliance officer. It changes the tone and vocabulary. It doesn't make answers more accurate."},
        "thinking": {"term": "Thinking mode", "def": "A setting, or a model, that works through a problem before answering. Slower, and better for rules, sums and decisions. Thinking in ChatGPT, Think deeper in Copilot."},
        "cot": {"term": "Chain of thought", "def": "Writing out the steps of reasoning before the answer. Older models needed to be asked ('think step by step'); thinking models do it on their own."},
        "genknow": {"term": "Generated knowledge", "def": "Asking the tool to list the relevant facts or factors first, then answer using that list."},
        "multimodal": {"term": "Multimodal", "def": "Working with more than text: photos, scans, screenshots, charts, voice."},
        "hallucination": {"term": "Hallucination", "def": "A confident answer that is made up: a case, a figure or a link that doesn't exist."},
        "cutoff": {"term": "Knowledge cutoff", "def": "The date the model's training data ends. Without web search, it knows nothing after it."},
        "sycophancy": {"term": "Sycophancy", "def": "The tool's habit of agreeing with you, even when you are wrong. A leading question makes it worse."},
        "injection": {"term": "Prompt injection", "def": "Instructions hidden in a file, email or web page that try to make an AI tool do or say something its user didn't ask for."},
        "selfconsistency": {"term": "Self-consistency", "def": "Asking the same question several times, or in two tools, and comparing the answers. Where they differ, look closer."},
        "cove": {"term": "Chain of verification", "def": "Checking each claim or figure in an answer against its source, one by one."},
        "agent": {"term": "Agent", "def": "An AI tool that plans and acts on its own: it searches, clicks, opens files and carries on until the job is done."},
        "react": {"term": "ReAct", "def": "Reason and act: the research pattern behind agents. The model reasons, uses a tool, looks at the result and carries on."},
        "scheduled": {"term": "Scheduled task", "def": "A prompt the tool runs by itself at a set time, such as every morning at 7:00."},
        "connector": {"term": "Connector", "def": "A link between the AI tool and another app, such as email, a calendar or a drive, so it can read or act there."},
        "artifact": {"term": "Artifact", "def": "Claude's name for something it builds next to the chat: a document, a chart, a calculator or a small app."},
        "genai": {"term": "Generative AI", "def": "AI that writes, draws or builds something new: text, images, code. ChatGPT, Copilot and Claude are generative AI."},
        "classicai": {"term": "Classic AI", "def": "AI that predicts or sorts from data, such as credit scoring, fraud detection or a scripted chatbot. In banks for decades."}},
}

# ---------------------------------------------------------------- notes, timetable and sources
SECTION_SAY = {
    "k0": "Open on the estimate before any introductions. Then the rules, the desktop sign-in to ChatGPT and Copilot on the BIBF accounts, the four outcomes, Najma Bank, the four jobs, the takeaways and the pre-course check.",
    "s1": "Warm-up in both tools first, with everyone's own line for a National Day greeting, then what has changed and where it still goes wrong, then eight quick questions. No job in this round.",
    "s2": "The core of the day. Slow down on the brief table. Your turn: everyone briefs one of the slides' practice tasks in both tools (6 minutes). Job 1 needs the full 20 minutes; cut exercise questions before you cut the job.",
    "s3": "Files, projects, the interview and thinking mode, then Job 2 and two people's trackers. The interview takes time: point anyone slow to the ready-made instructions. Then your Cowork demo.",
    "s4": "Why results go wrong, three cases, the checking list, then Job 3 and the memo discussion. This round carries ILO 2.",
    "s5": "Two short blocks, then Job 4 as Fatema. The phone checks use the sample brief. Then show the schedule, and your agent demo if time allows.",
    "f": "Post-course check first, then the quick-fire, the leaderboard with the top 3, the takeaways and what they built. Leave five minutes for the BIBF evaluation, the clean-up and the sign-out.",
}
NOTES_OUT = {
    "schedule": [
        {"day": "Thursday 12 November 2026"},
        {"time": "08:45", "mins": 15, "item": "Room open. Desktops: Edge private window, ChatGPT and Copilot in two tabs on the BIBF accounts (card on each desk). Phones: QR code and class login on the projector.", "offDeck": True},
        {"time": "09:00", "mins": 25, "item": "Kick-off: opening estimate, rules, sign-in check, outcomes, Najma Bank, the four jobs, pre-course check", "ref": "k0"},
        {"time": "09:25", "mins": 30, "item": "Round 1 · What your assistant can do now: warm-up in both tools, theory, 8 quick questions", "ref": "s1"},
        {"time": "09:55", "mins": 50, "item": "Round 2 · Brief it like a colleague: theory, your turn in both tools, 6 quick questions, Job 1 Build it, two demos", "ref": "s2"},
        {"time": "10:45", "mins": 15, "item": "Break", "brk": True},
        {"time": "11:00", "mins": 55, "item": "Round 3 · Give it your context: theory, 4 quick questions, Job 2 Organise your notes, two demos, Cowork demo", "ref": "s3"},
        {"time": "11:55", "mins": 30, "item": "Dhuhr and lunch", "brk": True},
        {"time": "12:25", "mins": 45, "item": "Round 4 · Check before you trust: theory, 7 quick questions, Job 3 Trap in the file, one demo, memo discussion", "ref": "s4"},
        {"time": "13:10", "mins": 30, "item": "Round 5 · Make it work every day: theory, Job 4 The morning brief, one demo, schedule and agent demo", "ref": "s5"},
        {"time": "13:40", "mins": 20, "item": "Final: post-course check, quick-fire, leaderboard with the top 3, takeaways, what you built, BIBF evaluation, clean up and sign out", "ref": "f"}],
    "scoring": ["No teams: six people, each playing alone on their own phone, one answer per question.",
                "Fastest right answer: 3 points. Every other right answer: 1 point.",
                "Points are added when you press Reveal. The scoreboard buttons still add or remove points by hand."],
    "general": ["Every round runs the same way: Theory (no phones), then Exercises (quick questions on the phones, one after another), then Try it (the job in ChatGPT or Copilot, then questions on the result).",
                "Two tools, both on BIBF accounts for the day only: Jobs 1 and 2 are built in ChatGPT, Jobs 3 and 4 in Copilot, and each job has a check in the other tool. The warm-up and Your turn use both.",
                "Jobs: press Start on the first job question as soon as people begin; its timer covers the job. The other job questions run 60 s each.",
                "Move block by block with Page Down or the right arrow; a presenter clicker sends the same keys. Page Up or the left arrow goes back. After the last block of a round, the next round opens. The notes tab scrolls to the block you are showing.",
                "Rhythm for every question: Start, they answer, Reveal, one line from the why, Next.",
                "The projector shows the presentation tab /instructor/ only. Keep the notes tab /instructor/?notes and the Dashboard on your laptop screen. One presentation tab only.",
                "Demos: after each job's reveal, people show what they built, two minutes each. Two for Jobs 1 and 2, one each for Jobs 3 and 4, so all six show once. Pick someone new each time.",
                "The BIBF accounts are BIBF's work accounts, used by the next class too: only the made-up Najma files go in, memory stays off, and at the end everyone deletes their chats and projects in both tools and signs out.",
                "Running late: skip the warm-up's extra step, shorten theory to the first line of each block, cut questions from the end of a game, and take one demo instead of two. Never cut a job's time first.",
                "A tool misbehaves on a desktop: do that step in the other tool. A sign-in fails: two people share one desktop.",
                "Accounts: ChatGPT on BIBF's paid plan (you believe Enterprise, so uploads are not tightly limited) and Microsoft 365 Copilot on BIBF work accounts (up to 20 files in one chat). "
                "BIBF's administrators may have switched web search off in Copilot: if so, Job 4 runs in ChatGPT with search on. If ChatGPT stops taking files, "
                "paste the text from the Files page (Job 1) or move the step to Copilot (Job 2).",
                "If phones on the room Wi-Fi show Reconnecting, ask everyone to switch to mobile data.",
                "Pre- and post-course checks: press Open the check on the phones; students tap the button on their phone. Results appear on the Dashboard."],
    "sections": {},
    "help": HELP,
    "sources": [
        "ChatGPT weekly users: 1.2 billion, Sam Altman at OpenAI DevDay, 29 September 2026 (Engadget live blog); 800 million, TechCrunch, 6 October 2025.",
        "KPMG TaxBot: The Register, 20 August 2025, KPMG wrote 100-page prompt to build agentic TaxBot (theregister.com/2025/08/20/kpmg_giant_prompt_tax_agent).",
        "ChatGPT GPT-6 and Intelligent UI: paid plans 7 October 2026, Free and Go from 8 October (9to5Mac, 7 October 2026). ChatGPT Scan: release notes, about 1 October 2026, rolling out on iOS.",
        "Microsoft, Introducing the new Copilot with Home, Code and Autopilot, 25 September 2026 (blogs.microsoft.com): Home with chat and the Cowork agent, Code, Autopilot; Frontier early access first; Cowork, Code and Autopilot billed by use. "
        "What's New in Microsoft Copilot, October 2026 (Microsoft Tech Community, 30 October 2026): projects in the Copilot app.",
        "Copilot scheduled prompts: on by default for Microsoft 365 Copilot licence holders (Microsoft 365 message center MC1189911; general availability early 2026). "
        "Copilot file upload: up to 20 files in one conversation, 50 MB each (Microsoft Support, File upload in Microsoft Copilot). Web search in Copilot Chat can be switched off by an organisation's administrator.",
        "ChatGPT uploads: Free 3 a day, paid plans up to 80 files every 3 hours; projects hold 5 files on Free and 40 on Business, Edu, Pro and Enterprise (OpenAI help: Uploading files; Projects in ChatGPT).",
        "DeepSeek is based in Hangzhou, China. Its R1 model (20 January 2025) knocked about USD 590 billion off Nvidia's market value on 27 January 2025 (Reuters).",
        "Copilot in Word and hidden text: a researcher's proof of concept with white, small hidden instructions, disclosed 28 July 2026 (The Hacker News, July 2026).",
        "Claude: designs, decks and docs on every plan including Free, and Cowork in every conversation for Pro and Max, release notes 16 September 2026 (support.claude.com). Cowork scheduled tasks: all paid plans; help article 'Schedule recurring tasks in Claude Cowork'.",
        "ChatGPT scheduled tasks: help article 'Scheduled tasks in ChatGPT' (Free and Go 3 active tasks, Plus 5, Business and Edu 10, Pro and Enterprise 15). The pricing page still lists Free as no: check on the day.",
        "OpenAI, Reasoning best practices: 'Avoid chain-of-thought prompts' (developers.openai.com). Anthropic, Prompting best practices: 'Prefer general instructions over prescriptive steps' (platform.claude.com).",
        "Microsoft Support, Get started writing prompts in Microsoft 365 Copilot: goal, context, source, expectations. Google Workspace, Prompting guide 101 and writing-effective-prompts: persona, task, context, format.",
        "Zheng et al., When 'A Helpful Assistant' Is Not Really Helpful: Personas in System Prompts Do Not Improve Performances of Large Language Models, Findings of EMNLP 2024, arXiv 2311.10054 (162 roles, 2,410 questions, 4 model families).",
        "Research behind the provider's techniques: Wei et al., chain of thought, arXiv 2201.11903 (2022); Wang et al., self-consistency, arXiv 2203.11171 (2022); Yao et al., ReAct, arXiv 2210.03629 (2022); Dhuliawala et al., chain of verification, arXiv 2309.11495 (2023).",
        "Dell'Acqua et al., Navigating the Jagged Technological Frontier, HBS Working Paper 24-013, 22 September 2023: 758 BCG consultants, 12.2% more tasks, 25.1% faster, more than 40% higher quality; 19 percentage points less likely to be correct outside the frontier.",
        "Mata v. Avianca, S.D.N.Y.: order of 4 May 2023 (six bogus decisions) and opinion of 22 June 2023 (USD 5,000 penalty).",
        "Moffatt v. Air Canada, BC Civil Resolution Tribunal, 14 February 2024: C$650.88 damages plus interest and fees, C$812.02 in all (American Bar Association summary).",
        "Deloitte Australia: report for the Department of Employment and Workplace Relations, about AU$440,000; The Register, 6 October 2025; refund of the final instalment, A$97,587, disclosed at Senate estimates (October 2025).",
        "Bank cases: JPMorgan LLM Suite, about 200,000 users by May 2025 (American Banker); BBVA, ChatGPT Enterprise for 120,000 staff, about 3 hours a week saved (OpenAI, 2025); Mashreq Newton, about 40% (AGBI, October 2026); ING with McKinsey, 7 weeks, 20% more customers avoided long waits (McKinsey); Klarna, 2.3 million chats in the first month (press release, 27 February 2024) and hiring people again (Entrepreneur, 9 May 2025).",
        "Provider case list, checked: generative AI in Deloitte UK PairD, Discover, ING, JPMorgan, MUFG and Rocket Mortgage; classic AI in Commonwealth Bank (H2O.ai), Banca Mediolanum (SAS), Federal Bank Feddy, NatWest Marge, Valley Bank, BNY Mellon (Evisort) and Nedbank Enbi. Colonial First State's deal is Azure cloud and AI, with Copilot for 75% of staff.",
        "Bahrain: Personal Data Protection Law, Law No. 30 of 2018, in force 1 August 2019. National Day holidays 16 and 17 December 2026 (Central Bank of Bahrain).",
        "Najma Bank, Tarteeb Digital, Wahaj Systems, their people and all their figures are fictional, made for this course. The sample brief's outlets and .example links are invented.",
    ],
}
# the instructor's explanations: one per round, and one under every teaching block and job (build/explain.py)
TEACH_TYPES = ("points", "table", "cards-static", "facts", "flow", "discuss", "task")
for s in SECTIONS:
    s["explain"] = ROUND_EXPLAIN[s["id"]]
    for b in s["beats"]:
        if b["id"] in EXPLAIN:
            b["explain"] = EXPLAIN[b["id"]]
        else:
            assert b["type"] not in TEACH_TYPES, "no explanation for " + b["id"]
assert not set(EXPLAIN) - {b["id"] for s in SECTIONS for b in s["beats"]}, "explanation for an unknown block"

for s in SECTIONS:
    NOTES_OUT["sections"][s["id"]] = {"say": SECTION_SAY[s["id"]], "beats": {b["id"]: NOTES[b["id"]] for b in s["beats"]}}


def js(name, obj, header):
    return header + "window.%s = %s;\n" % (name, json.dumps(obj, ensure_ascii=False, indent=1))


with open(os.path.join(ROOT, "site", "data", "course.js"), "w") as f:
    f.write(js("COURSE", COURSE, "/* Course content for the participant pages and the instructor page. Generated by build/build_content.py: edit the builder, not this file.\n   The case company is fictional. The assessment key lives in instructor/key.js. */\n"))
with open(os.path.join(ROOT, "site", "instructor", "key.js"), "w") as f:
    f.write(js("ASSESSMENT_KEY", KEY, "/* Answer key for the pre- and post-course checks. Generated by build/build_content.py.\n   Only the instructor page loads this file, so the answers never reach a participant's phone. why[i] explains option i. */\n"))
with open(os.path.join(ROOT, "site", "instructor", "notes.js"), "w") as f:
    f.write(js("NOTES", NOTES_OUT, "/* Facilitator notes, timetable and scoring rules. Generated by build/build_content.py. Only the instructor page loads this file. */\n"))

# ---------------------------------------------------------------- checks
data_dir = os.path.join(ROOT, "site", "assets", "data")
for s in SECTIONS:
    for b in s["beats"]:
        for fl in b.get("files", []):
            assert os.path.exists(os.path.join(data_dir, fl["name"])), "missing task file " + fl["name"]
        for qq in b.get("questions", []):
            assert 0 <= qq["answer"] < len(qq["options"]) == 4, qq["q"]
        if b["type"] == "estimate":
            assert 0 <= b["answer"] < len(b["options"]), b["id"]
ids = [b["id"] for s in SECTIONS for b in s["beats"]]
assert len(ids) == len(set(ids)), "duplicate block id"
nq = sum(len(b.get("questions") or b.get("items") or b.get("pairs") or []) if b["type"] in ("quiz", "flags", "scam", "higherlower") else (1 if b["type"] in ("estimate", "order", "timeline") else 0) for s in SECTIONS for b in s["beats"])
jobq = sum(len(b["questions"]) for s in SECTIONS for b in s["beats"] if b["type"] == "quiz" and b["id"].endswith("-result"))
theory = sum(1 for s in SECTIONS for b in s["beats"] if b["type"] not in ("quiz", "estimate", "order", "flags", "higherlower", "scam", "part", "task", "leaderboard", "assesscue", "takeaways", "rules"))
spread = [sum(1 for a in ASSESS if a[3] == j) for j in range(4)]
qa = [a[3] for a in ASSESS]
print("sections", len(SECTIONS), "beats", len(ids), "theory blocks", theory, "phone questions", nq, "(from the jobs", jobq, ")",
      "assessment", len(ASSESS), "answer spread A-D", spread, "answers", "".join("ABCD"[x] for x in qa))
