"""The instructor's explanations: an introduction for each section and a full explanation under each teaching block and job.

Written the way Abed explains it out loud in the room, in plain words and short sentences, so a participant who reads only
this page understands the block. Every term is explained the first time it appears. Job explanations never give away
the answers to the phone questions: they name the kind of catch, not where it is or what it comes to.

A piece is a paragraph (a string), a bullet list (a list of strings), a box (ex, trap, tip) or a prompt to copy (tryit).
**word** marks a word being taught; [[key|word]] links a term in COURSE["glossary"] in build_content.py.
Facts, figures and names come only from build_content.py: its blocks, notes, packs and sources.
"""


def ex(text):
    return {"box": "example", "text": text}


def trap(text):
    return {"box": "trap", "text": text}


def tip(text):
    return {"box": "tip", "text": text}


def tryit(title, text):
    return {"prompt": text, "title": title}


# the last line of every information pack, word for word (ASK in build_content.py)
PACK_LAST_LINE = ("Before you write anything, ask me up to three short multiple-choice questions, one at a time, so I can answer with a letter. "
                  "Then write the prompt I should use. Make sure it says who it's for, what to work from, what shape I want, and what it must not do. "
                  "Show me the prompt and wait.")

# ---------------------------------------------------------------- the sections
ROUND = {
    "k0": [
        "Welcome. For two days your team visits the departments of Ghaima Dairy, a made-up dairy maker in Bahrain. In each one you "
        "do a real kind of job with Copilot Chat, check what comes back, and answer questions on your phone as you go.",
        "This kick-off sets everything up: the rules and your four teams, Cream, Butter, Cheese and Laban, a warm-up question on "
        "your phone that scores nothing and only checks your phone works, a sign-in check, what "
        "you'll be able to do by Thursday, Ghaima and its jobs, and a short pre-course check. It ends with a quick win: a "
        "ready-made prompt for your own role.",
        "What to watch: be signed in to both tools before Round 1. Teams are mixed on purpose, so in each job the person closest to "
        "that department's work leads. If your desktop gives you trouble, share with a neighbour and keep going.",
    ],
    "s1": [
        "Before we open the tools, this round gives you the bigger picture: three words people mix up, where a dairy's data "
        "really comes from, how to describe data, why it's worth looking after, and what two other food companies are already "
        "doing with AI.",
        "It runs as about seventeen minutes with phones down, including a guessing board where the teams take turns to name "
        "Ghaima's sources of data, then six quick questions on your phone.",
        "What to watch: the part on data. Messy data, like the same stoppage typed in twice or kg in one row and tonnes in the "
        "next, comes back in the jobs. AI works on whatever you give it.",
    ],
    "s2": [
        "This round is the core of the method for both days. You see how the assistant works and why it can be confidently wrong, "
        "what Copilot Chat and ChatGPT are each for, and what you'll have at Arla. Then the four-part brief, how to let the AI "
        "write your prompt for you, and the data rules.",
        "It runs as fifteen minutes of theory, a seven-minute warm-up where you send one request to both tools, then nine quick "
        "questions on your phone.",
        "What to watch: the four-part brief and the information pack. Every job from now on uses them, so if anything is unclear, "
        "ask now.",
    ],
    "j1": [
        "Your first job, in Production. Last night's stoppage log for Line 1 is handwritten. It has to become a clear handover for "
        "the morning shift lead, an email for the plant manager, and a safety poster for the line.",
        "It runs the way every job runs. Download the files, paste the pack into Copilot Chat and answer its questions with a "
        "letter. Check the prompt it writes, run it with the files, then check the result. About 25 minutes of work, then "
        "questions on your phone, and one team shows its handover.",
        "What to watch: the person in your team closest to production leads. And don't trust the total until you've checked the "
        "times yourself.",
    ],
    "s3": [
        "This round is about trust. You learn what AI does well with your files and where it slips, why you let it interview you "
        "first, how instructions can hide inside a file, and what research says about trusting AI and checking it. It ends with "
        "the checking list you'll use in every job.",
        "About twelve minutes of theory, then seven quick questions, including spotting the slips in AI summaries of Ghaima's "
        "files.",
        "What to watch: the checking list. It goes on the desk card you build on Thursday, and Job 2 puts it into practice straight "
        "after lunch.",
    ],
    "j2": [
        "Job 2 is in Procurement. Three suppliers have quoted for the glass jars Line 1 fills, and you recommend one to Maryam Isa, "
        "the Procurement Manager. One quote has its freight in a footnote, one has a minimum order too big for the store, and one "
        "is hiding something.",
        "Same method as Job 1, with four files. Then two extra steps: you ask whether any file hides text addressed to AI tools, "
        "and you get a second opinion from a fresh chat. ChatGPT gets the same prompt and files, for comparison.",
        "What to watch: whether Copilot's first recommendation survives the checks. The person closest to procurement or finance "
        "leads.",
    ],
    "s4": [
        "This round steps back from the desk to the whole dairy: what Industry 4.0 looks like in a plant, a generative AI example "
        "from the plant floor, and where classic and generative AI each fit along the value chain.",
        "About ten minutes of theory, then the value chain case clinic in Copilot Chat. Your team pastes a pack, answers its "
        "questions, and gets a table of its top three opportunities, then shares one idea with the room.",
        "What to watch: keep the chat open. The team action plan this afternoon continues in it.",
    ],
    "j3": [
        "Job 3 is in Maintenance. Line 1's filler shows a fault after the evening changeover. The fix is in a 12-page manual that "
        "covers two models, and you turn it into a checklist for the night technician.",
        "Same method, with the manual and the breakdown report. Then you ask Copilot where each step came from, and you open two "
        "of those pages yourself.",
        "What to watch: which model each page is about. The person closest to maintenance leads.",
    ],
    "c1": [
        "The end of day one. You see the team scores so far, each team gives one lesson from the day, and we clean up.",
        "The scores are for day one only. The game carries on tomorrow, and the final podium is on Thursday afternoon.",
        "What to watch: the clean-up. BIBF's accounts are for the course only, so delete your chats in both tools, sign out and "
        "close the private window before you leave.",
    ],
    "d2": [
        "Welcome back to Ghaima Dairy. Day two starts with eight quick questions on yesterday, to wake the "
        "phones up. Then a look at today's plan.",
        "The morning keeps yesterday's rhythm: a round, then jobs, this time in Planning and Logistics. Before lunch your team "
        "chooses a station. After lunch the course turns to your own work.",
        "What to watch: sign in again in a private window, and rejoin your team on your phone before the first question.",
    ],
    "s5": [
        "Four patterns you can reuse every day: showing the AI an example, what giving it a role does and doesn't do, asking it to "
        "critique its own draft, and the recipe for an image.",
        "About twelve minutes of theory in four short blocks, then five quick questions, including putting an image brief in "
        "order.",
        "What to watch: these patterns add to the pack, they don't replace it. The material you give it still makes the biggest "
        "difference.",
    ],
    "j4": [
        "Job 4 is in Planning. October's production and waste by line has to become a short commentary for the plant manager, "
        "Noora Al Hashimi, and a chart for a slide. One row isn't in the same unit as the others, and one week is missing.",
        "Same method, with the workbook. Then a second check in a fresh chat, which recalculates the waste for each line, before "
        "you make the chart.",
        "What to watch: the unit of every figure, before you draw any conclusion. The person closest to planning or supply chain "
        "leads.",
    ],
    "j5": [
        "Job 5 is in Logistics. Sabeel Hypermarkets, a supermarket in Al Khobar, is angry about a late delivery. A colleague has "
        "drafted a reply. The delivery log tells a different story.",
        "Same method, with three files: the complaint, the delivery log and the draft. Then you ask Copilot to compare the draft "
        "with the log, line by line.",
        "What to watch: what the reply admits and what it promises. A reply to a customer speaks for the company. The person "
        "closest to logistics or the warehouse leads.",
    ],
    "s6": [
        "A course only pays off if people keep using what they learned, and bring their teams along. This round looks at why "
        "people stop using AI, what keeps them going, and five minutes on agents and what's coming.",
        "About ten minutes of theory, then three quick questions, just before the break.",
        "What to watch: the if-then line in the last question. You write one of your own for your desk card after lunch.",
    ],
    "j6": [
        "Job 6 is your team's choice of station: Finance, Regulatory or Lab. The person from that department leads it.",
        "Finance writes the October commentary, Regulatory checks a draft label for Saudi Arabia, and Lab decides which batches "
        "can be released. It's the same method at every station, with two files each and one extra step.",
        "What to watch: download only your station's files. The label checklist and the lab spec are practice material, not real "
        "regulation. At the end, one team per station shows its result in a minute.",
    ],
    "mc": [
        "This is where the course becomes yours. You pick your role and your weekly tasks, and Copilot writes your prompts and your "
        "one-page desk card.",
        "First a five-minute walk-through of My card on the projector. Then thirty minutes hands-on, and you leave with the pack "
        "on your phone.",
        "What to watch: check every prompt it writes against the four parts, and test one before you trust it. The pack holds no "
        "company data, so it can go into Copilot Chat at Arla.",
    ],
    "ap": [
        "Your team leaves with a plan, not just good intentions. You start from yesterday's map of opportunities and choose two "
        "uses of AI you'll start next week.",
        "Fifteen minutes to draft, then two to three minutes per team to present it to the room.",
        "What to watch: name a person and a day for the first step, and say what stays out of Copilot Chat.",
    ],
    "f": [
        "The final round brings the two days together. You take the same fifteen questions as on Wednesday morning, and see your "
        "score at the start and your score now.",
        "Then a last quick-fire, the final podium, the takeaways and a look back at what your teams did.",
        "Before you leave: check your pack is on your phone, delete your chats in both tools, sign out and close the private "
        "window. Then fill in the BIBF evaluation.",
    ],
}

# ---------------------------------------------------------------- the blocks
BLOCK = {
    # ======== Kick-off
    "k0-shape": [
        "Every round runs the same way, so you always know what comes next.",
        ["**Theory.** The ideas, short, with examples from the dairy. Phones down. Each block on the site has an 'Explained in "
         "full' panel like this one, so you can read it again later.",
         "**Exercises.** Quick questions on your phone, one after another. They check the idea made sense before you use it.",
         "**Jobs.** Between the rounds, a department's real kind of work in Copilot Chat. Then questions on your phone about what "
         "you found."],
        "Points go to your team. The team with the fastest right answer gets 2, and every other team with a right answer gets 1. "
        "Scores carry over to Thursday.",
    ],
    "k0-signin": [
        "**Why a private window?** The desktops are shared. A private window, which Edge calls InPrivate, forgets everything when "
        "you close it. In Edge, press Ctrl + Shift + N.",
        "**Which accounts?** Copilot Chat in one tab and ChatGPT in another, on the BIBF accounts from the card on your desk. "
        "They're for the course only, and every file is Ghaima's, made up, so nothing real goes in.",
        "**The Files page.** In a third tab, open bibf-arla.vercel.app/#/files and sign in as student. Every job's files and packs "
        "are there, each prompt with a Copy button, so you never type a long prompt.",
        tip("Ctrl + Tab moves between your tabs. At the end of each day, delete your chats, sign out of both tools and close the "
            "private window."),
    ],
    "k0-out": [
        "These are the four things you should be able to do by Thursday at 14:00. The first three match the course's three "
        "learning outcomes.",
        ["**See the bigger picture.** How data and digital tools change a dairy business, and where AI fits along the chain.",
         "**Let AI write the prompt.** Give Copilot the goal, the material and what good looks like, answer its questions, check "
         "its prompt, then run it.",
         "**Check before you trust.** Figures, units, dates, small print and hidden instructions, and a second opinion from a "
         "fresh chat.",
         "**Take it to work.** Your own prompts and a desk card for your weekly tasks, on your phone, ready for Copilot Chat at "
         "Arla."],
        "The last one is the point of the two days. You don't leave with notes about AI. You leave with prompts for your own job.",
    ],
    "k0-case": [
        "For two days we work for one company, so every example connects to the next. Ghaima Dairy is a made-up GCC dairy maker, "
        "founded in 2004. Its head office and plant are in North Sitra, Bahrain, with a sales and logistics office in Dammam. It "
        "has about 420 staff, and about 60% of its volume goes to Saudi Arabia, to supermarkets and food service.",
        "The plant has three lines: Line 1 for jars, Line 2 for slices and Line 3 for cream. Its products are Ghaima Spread, "
        "Ghaima Slices and Ghaima Cream.",
        "Why made up? Nothing confidential goes in, and we know every right answer in advance, so your phone can tell you at once "
        "whether the AI got it right.",
        tip("Everything about Ghaima, its people and its files is in the case file, which opens from any page."),
    ],
    "k0-jobs": [
        "Each job comes from one of Ghaima's departments, and the person in your team closest to that work leads it. Every job's "
        "files and packs are on the Files page, so nobody types a long prompt.",
        ["**Wednesday.** Production: the night shift's log. Procurement: three quotes, one of them hiding something. Maintenance: "
         "a manual that covers two models.",
         "**Thursday.** Planning: a month of waste figures. Logistics: a complaint and the delivery log. Then a station your team "
         "chooses: Finance, Regulatory or Lab.",
         "**Thursday afternoon.** Your own prompts and desk card, then your team's action plan."],
        "Every job is a simulation for Ghaima, done and checked in class. What goes home with you is the prompts you write, and "
        "the habit of checking.",
    ],
    "k0-quick": [
        "The quick win comes before any theory, on purpose. In ten minutes, with no score, you get something useful for your own "
        "job and a first feel for Copilot Chat.",
        ["On the Files page, under Quick win, find the prompt for your role: Warehouse Team Lead, Lab Supervisor, Finance Lead or "
         "Analyst, and so on. Click Copy.",
         "Paste it into Copilot Chat and send it.",
         "Read what comes back. Would you use it at work? What would you change?",
         "Tell your team in one sentence."],
        "Each prompt is already a small brief: it says who the result is for, the shape and the length. What it can't know is "
        "your plant, your team or your products, so the answer stays general. What you'd change is exactly what the information "
        "pack adds from Round 2 on.",
        tip("If Copilot asks you a question back, answer it in a few words, or say 'just give me your best version'."),
    ],

    # ======== Round 1
    "s1-words": [
        "Three words get mixed up all the time, and they mean different things.",
        ["**[[digitisation|Digitisation]]** turns paper into digital files. Ghaima scans its paper QC sheets into PDFs. The process "
         "hasn't changed: it's the same paper, now as a file.",
         "**[[digitalisation|Digitalisation]]** uses digital tools to run an existing process better. Line 1's filler sends every "
         "stoppage to a dashboard by itself, so the shift lead sees it live and nobody types the log twice.",
         "**[[transformation|Digital transformation]]** changes how the business works and creates value. Ghaima selling direct "
         "to cafés through an app, and planning production on their orders, is a new way of doing business."],
        "Most companies need all three, and transformation is about people and ways of working as much as technology. Think of "
        "one example from your own work for each word.",
    ],
    "s1-data": [
        "Data is an asset, like a machine or a building: it's only worth something if it's looked after. The board showed where "
        "it comes from; this is what keeps it worth having.",
        ["**What makes it useful.** Consistent units and names, recorded on time, shared with whoever needs it, and trusted "
         "because someone checks it.",
         "**What spoils it.** Paper that is typed in twice, kg in one row and tonnes in the next, a missing week nobody notices.",
         "**Why AI cares.** AI works on whatever you give it. Messy data in, confident nonsense out."],
        ex("The same stoppage logged twice on paper isn't just a typing slip. It's a data problem: add up the log and the line "
           "looks worse than it was. Job 1 will show you."),
    ],
    "s1-board": [
        "Ask people where a company's data comes from and most say orders, invoices and customer records: neat tables in a "
        "system. That's real data, but it's a small part of it. This board shows how much more there is.",
        "The board lists Ghaima's top eight sources, ranked by how often new data arrives, from every second down to every week. "
        "Each team names one source per turn. Name one that's on the board and your team takes the points on the tile: the "
        "sources people forget are worth more than the obvious ones. Anything from outside Ghaima counts as a bonus.",
        ["The colour of each tile is its kind of data: [[structured|structured]], [[semistructured|semi-structured]] or "
         "[[unstructured|unstructured]]. The next block explains the three.",
         "Look at where the neat tables land, and how small their share is when you count the records."],
        "Why it matters for this course: AI can read the kinds of data that never fitted in a spreadsheet, such as messages, "
        "photos and documents. That widens what you can ask it to help with.",
        tip("The figures on the board are made up for Ghaima, in the range of a plant its size. The order, though, is typical of "
            "a food plant: machines and messages produce far more data than orders do."),
    ],
    "s1-describe": [
        "The same piece of data can be described in four ways. You don't need to remember the labels; they help you see what "
        "you're holding before you hand it to AI.",
        ["**Structure.** [[structured|Structured]] data sits in fixed rows and columns, like an order in the system. "
         "[[semistructured|Semi-structured]] data has tags but no fixed table, like a filler's alarm log: a time, a code and a "
         "value on each line. [[unstructured|Unstructured]] data is free text, images and voice, like a customer's complaint email.",
         "**Form.** Numbers, such as a fill weight of 497 g, or words and categories, such as an operator's note that the nozzle "
         "is sticking.",
         "**Source.** Captured on purpose, like the lab's QC tests, or exhaust: a by-product of another process, like the stop "
         "times a filler records anyway.",
         "**Producer.** Primary data is your own, like Ghaima's sensor readings. Secondary data is someone else's, inside or "
         "outside the company, like market prices or a retailer's sales report."],
        "Analysts estimate that 80 to 90% of the data a company holds is unstructured (MIT Sloan, 2021). Classic reports read the "
        "structured part. Generative AI can also read the rest, which is why it matters for a dairy.",
    ],
    "s1-pyramid": [
        "Data on its own doesn't decide anything. The pyramid shows how it gains value as it answers more questions.",
        ["**Data.** Raw records, such as one sensor reading: Line 1 filler, 02:14, fill weight 491 g.",
         "**Information.** Data organised to answer a question: Line 1's average fill weight hour by hour, against the 500 g "
         "target.",
         "**Knowledge.** A pattern that explains it: fill weight runs low for twenty minutes after each changeover.",
         "**Wisdom.** A decision: check the filler setting after every changeover, and add it to the changeover checklist."],
        "Most dashboards stop at information. The aim is the decision at the top. AI can help at every step, but the decision "
        "stays with a person.",
    ],
    "s1-peers": [
        "You're not the first food company to do this. Here are two that already are.",
        ["**Nestlé** gives every employee Microsoft Copilot Chat, plus its own assistant, NesGPT. The company reports more than "
         "100,000 regular AI users.",
         "**Danone** has a partnership with Microsoft that includes an AI academy to train its staff, with Copilot available to "
         "tens of thousands of employees."],
        "Two things they have in common. Both use Microsoft Copilot, the same family of tools you'll use at Arla. And both invest "
        "in skills as much as in tools. The tools are the easy part; the habit is what takes work.",
        "The figures are the companies' own, as reported in the trade press, so read them as what the companies report.",
    ],

    # ======== Round 2
    "s2-how": [
        "Copilot and ChatGPT run on a [[llm|large language model]], an **LLM** for short. It writes its answer a piece at a time, each time choosing the most likely next words.",
        ["**It predicts.** Most of the time the likely answer is the right one. When it doesn't know, it still writes something "
         "that sounds right, just as confidently. A made-up answer is called a [[hallucination|hallucination]].",
         "**It fills gaps.** Whatever you leave out, it guesses: the reader, the units, the rule you forgot to mention.",
         "**It tends to agree.** Ask a leading question and it leans towards your view. This is called "
         "[[sycophancy|sycophancy]].",
         "**It reads what you give it.** Files, photos and pasted text, including text you can't see. Job 2 will show you."],
        "None of this means don't use it. It means brief it well and check what matters.",
    ],
    "s2-frontier": [
        "In 2023, researchers from Harvard Business School and BCG studied 758 BCG consultants using GPT-4. On tasks that suit AI, "
        "the consultants using it finished 12.2% more tasks, about 25% faster, and their work was rated about 40% higher in "
        "quality.",
        "On a task just beyond what AI could do, it went the other way. Consultants using AI were 19 percentage points less likely "
        "to get the right answer.",
        "The researchers called this a **jagged frontier**. AI is excellent at some tasks and poor at others that look just as "
        "hard, and you can't tell which from how the answer sounds. The study is from 2023, but the shape still holds: inside the "
        "frontier it's a great help, and outside it's worse than nothing if you don't check.",
    ],
    "s2-tools": [
        "You have two tools open, and they play different parts.",
        ["**[[copilotchat|Copilot Chat]] does the work.** Every job, every image and every second opinion. It's the approved tool "
         "at Arla, on your work account, so it's the one you practise on.",
         "**ChatGPT is for comparison only.** You send it the same prompt for a second view. At Arla, use it only "
         "if Arla approves it, and never with company data.",
         "**Both are good at** drafting, comparing and making images. Copilot is also good at working from the files you attach "
         "and summarising them."],
        "Both make the same kinds of mistakes, because they're the same kind of model. Copilot can also read the wrong page of a "
        "long file.",
        trap("Two tools agreeing doesn't make them right. They can make the same mistake, so the check is still yours."),
    ],
    "s2-arla": [
        "What you see in the lab is what most of you will have at work on Sunday. Here's how the two compare.",
        ["**Copilot Chat.** Everything in the course works here. At Arla it's on your work account, with enterprise data "
         "protection.",
         "**Files and images in Copilot Chat.** Yes, in class and at Arla. Staff without a licence have usage limits, and "
         "Microsoft doesn't publish the numbers.",
         "**Copilot inside Word, Excel, PowerPoint and Outlook.** Not used in the course. At Arla it needs a "
         "[[m365copilot|Microsoft 365 Copilot]] licence, and most of you don't have one.",
         "**ChatGPT.** For comparison only in class. At Arla, only if Arla approves it, and never with company data."],
        "That's why every job here runs in Copilot Chat: you can repeat it at your own desk the day you get back.",
    ],
    "s2-brief": [
        "Brief the AI like a capable new colleague. Every prompt in the course, yours or Copilot's, is checked against these "
        "four parts of a [[brief|brief]].",
        ["**Who it's for.** The reader, and what they care about: the shift lead, the plant manager, a customer.",
         "**What to work from.** The material to use, and nothing else: the log, the quotes, the manual.",
         "**What shape you want.** Sections, length, format: a one-page handover, a table, five bullet points.",
         "**What it must not do.** No invented figures, no promises we can't keep; flag what it can't find."],
        "Microsoft's own Copilot guide asks for the same: goal, context, expectations and source.",
        ex("'Write about October's waste' leaves everything to guess. 'For the plant manager, from the attached workbook: about "
           "150 words on waste by line, odd figures flagged, nothing invented' has all four."),
    ],
    "s2-let": [
        "This is the method for the two days. You don't write prompts by hand: you give Copilot what it needs, and it writes the "
        "prompt for you.",
        ["**Feed it.** Paste the [[pack|information pack]] from the Files page: the goal, the material and what good looks like.",
         "**Let it ask.** The pack ends by asking for up to three multiple-choice questions. Answer each with a letter.",
         "**Check its prompt.** Does it have the four parts? Fix the one that's vague.",
         "**Run it, then check.** Attach the files, send 'Run it', and check the result before you trust it."],
        trap("Evidence that prompts written by AI beat careful hand-written ones is thin. So never skip the check: read its "
             "prompt, and test it on a case where you know the answer."),
    ],
    "s2-rules": [
        "These rules apply whatever the tool. In class they're easy, because every file is made up. At work they matter every day.",
        ["**Approved tools only.** At Arla that's Copilot Chat on your work account. Never a personal account for company work.",
         "**Nothing confidential or personal elsewhere.** Names, phone numbers, prices and unpublished figures stay in approved "
         "company tools.",
         "**A person checks everything.** Nothing reaches a customer, a supplier or a manager until someone has read it. Whoever "
         "sends it owns it.",
         "**The law agrees.** Saudi Arabia's Personal Data Protection Law has been enforced since 14 September 2024. Bahrain's, "
         "Law No. 30 of 2018, has been in force since 1 August 2019."],
        tip("Before you paste anything, ask two questions: whose data is this, and where is it going?"),
    ],
    "s2-warm": [
        "The warm-up is one request sent to both tools. It asks for an explanation of [[oee|OEE]], overall equipment "
        "effectiveness, for a new line leader on a cheese-jar filling line, with one worked example and three quick questions to "
        "check they understood.",
        ["Copy the warm-up from the Files page and send it in Copilot Chat.",
         "Send the same prompt in ChatGPT, in your second tab.",
         "Compare: which explained it better for a new line leader? Which quiz questions would you actually use?",
         "Tell your team in one sentence."],
        "It practises reading an answer with the reader in mind, and comparing two tools. Two tools given the same words can "
        "answer quite differently, so look at both before you decide.",
        "Then check the worked example. OEE is availability × performance × quality, so multiply the example's three figures "
        "yourself. If they don't match its answer, you've caught your first slip. Nothing confidential goes in: the prompt holds "
        "no company data.",
        tip("If one tool is much slower, compare what you have after three minutes."),
    ],

    # ======== Job 1
    "j1-job": [
        "This job practises the whole method on real production paperwork: the night shift's handwritten log for Line 1, turned "
        "into a handover for Yusuf Saleh, the morning shift lead, and a short email for the plant manager.",
        ["Paste your pack into Copilot Chat and answer its questions with a letter.",
         "Check its prompt has the four parts, attach the photo or the typed log, and send 'Run it'.",
         "Send 'Check it': it lists every stoppage with its times and minutes, and adds them up again.",
         "Make the safety poster in Copilot, then send the same poster prompt in ChatGPT and compare."],
        "Where's the catch? Night logs are messy. Two people can log the same stoppage in different words, and a stoppage can run "
        "past midnight. AI tends to take each line at face value and add up what it sees, so both slips go straight into a neat "
        "total. Work the times out yourself.",
        "Data check: the log names three operators. At work, take out names the handover doesn't need, and keep it in Copilot Chat "
        "on your work account.",
    ],

    # ======== Round 3
    "s3-files": [
        "Attaching your files is the best thing you can do for a result: Copilot works from your document instead of guessing. "
        "But it has strengths and weak spots.",
        ["**It reads a lot, fast.** PDFs, Excel sheets, photos and scans: a 12-page manual in seconds.",
         "**It can read the wrong part.** A section for another model, last month's column, the wrong page.",
         "**It can miss the small print.** Footnotes, minimum orders, a unit in a separate column.",
         "**Ask where it found it.** Ask for the page or the row behind every figure, then open two of them yourself."],
        "Long files are where it slips most. Job 3's manual covers two models, and Job 2's quotes have small print, so you'll see "
        "both for yourself.",
    ],
    "s3-interview": [
        "The last line of every pack asks Copilot to ask you up to three multiple-choice questions before it writes the prompt. "
        "Here's why.",
        ["**It knows nothing about your situation.** Without your answers it writes a generic prompt. With them, it writes one "
         "for your reader, your material and your limits.",
         "**Questions with letters.** A, B or C: you answer in a second, with no typing.",
         "**Three is enough.** More questions and you lose the time you saved."],
        "It works because the tool knows what a task like yours usually needs, and you know the answers. Watching what it asks "
        "also teaches you what a good brief needs.",
        tryit("The pack's last line", PACK_LAST_LINE),
    ],
    "s3-echo": [
        "Copilot reads everything you give it, including text aimed at the AI rather than at you. Text that tries to make the "
        "tool do something you didn't ask for is called [[injection|prompt injection]].",
        "The best-known case is EchoLeak, made public by Aim Security in June 2025 and rated critical. An email written to read "
        "like normal text made Microsoft 365 Copilot send data out, with no click from the user. Microsoft had already fixed it on "
        "the server in May 2025.",
        "Fixed doesn't mean gone: the trick still works on careless use. Job 2 has a gentler version, hidden in one of the quotes.",
        trap("You can't see hidden text, so you can't catch it by reading. Ask the tool outright whether any file contains text "
             "addressed to AI tools, or hidden text, and to quote it word for word."),
    ],
    "s3-trust": [
        "A 2025 study by Microsoft Research and Carnegie Mellon University surveyed 319 knowledge workers about 936 real tasks "
        "where they had used AI. People reported how much they checked the results.",
        "The finding is simple. The more people trusted the AI, the less they checked. The more they trusted their own skill, the "
        "more they checked.",
        "So your own judgement is the safety net. Check most when the answer looks most convincing, because that's when you'll "
        "feel least like checking.",
        ex("A neat table whose totals add up looks finished. That's the moment to redo one figure from the file yourself."),
    ],
    "s3-list": [
        "Six checks, and you'll use them in every job. You don't need to check every word: check what would do harm if it were "
        "wrong.",
        ["**Figures.** Redo the key sums yourself.",
         "**Units and dates.** kg or tonnes, day or month first, a time past midnight.",
         "**Hidden conditions.** Footnotes, minimum orders, small print.",
         "**Hidden instructions.** Text in a file that talks to the AI.",
         "**Fit for the reader.** Would you send it as it is?",
         "**A [[secondopinion|second opinion]].** A fresh chat with the same files checks the first one's work. It doesn't carry "
         "the first chat's mistakes."],
        "This list goes on the desk card you build on Thursday, word for word, so it's with you at work.",
    ],

    # ======== Job 2
    "j2-job": [
        "This job practises comparing documents fairly. Three suppliers have quoted for the glass jars Line 1 fills, and you "
        "recommend one to Maryam Isa, the Procurement Manager.",
        ["Paste your pack, answer its questions and check its prompt. Attach the three quotes and the procurement brief, and "
         "send 'Run it'.",
         "Send 'Anything hidden?', which asks whether any file holds hidden text, or text addressed to AI tools, and to quote it.",
         "Open a fresh chat with the same files, paste the first recommendation under the second-opinion prompt, and send.",
         "For comparison, send your prompt and the files in ChatGPT. Where the tables differ, open the quote."],
        "Where's the catch? The price in the main table isn't always the true cost. Freight can sit in a footnote, a minimum order "
        "can be more than the store holds, and a file can try to steer the answer. AI tends to trust the main table, and it reads "
        "text you can't see.",
        "Data check: a supplier's quote with its prices is commercially confidential. At work it stays in approved tools, which "
        "means Copilot Chat on your work account.",
    ],

    # ======== Round 4
    "s4-i40": [
        "[[industry40|Industry 4.0]] means factories where machines, sensors and systems share data in real time. In a dairy plant "
        "it looks like this.",
        ["**Sensors.** Temperatures, fill weights and line speeds recorded on their own, every second.",
         "**Predictive maintenance.** Spotting a filler or a pump that's about to fail, before it stops the line.",
         "**Traceability.** Every batch traced from milk to shelf, in minutes rather than days.",
         "**Demand forecasting.** Planning production on expected orders, so less goes to waste.",
         "**Camera checks.** Cameras that spot a missing lid or a crooked label at line speed."],
        "These are categories, not promises. Dairy case studies with hard figures are mostly vendor marketing, so we don't quote "
        "any. The point is to recognise each one when a supplier or a colleague brings it up.",
    ],
    "s4-siemens": [
        "Here's a generative AI example from the plant floor. Siemens has an Industrial Copilot for maintenance. A technician asks "
        "about a machine fault in plain language, and the answer is drawn from the manuals and the machine's data.",
        "In its first pilots, Siemens reports about 25% less time spent on reactive maintenance: the repairs you make after "
        "something breaks.",
        "Read that figure carefully. It's Siemens' own, from its own pilots, not an independent study. The idea is what matters "
        "for us: finding the fix in a manual is exactly what you do in Job 3, in Copilot Chat.",
    ],
    "s4-chain": [
        "Two kinds of AI work along the chain, and they do different jobs.",
        ["**[[classicai|Classic AI]]** predicts or sorts from data, and has been in use for decades: forecasting demand from past "
         "orders, spotting price outliers, predicting a stoppage or a failure, flagging an unusual lab result.",
         "**[[genai|Generative AI]]** writes, reads and compares: explaining a plan change to sales, comparing supplier quotes, "
         "writing the shift handover, finding the fix in the manual, replying to a customer."],
        "Most real gains come from both together. Classic AI might predict that a delivery will be late; generative AI helps you "
        "write to the customer about it.",
        "Look down the generative column and you'll recognise this course's jobs. Finance and Regulatory sit across the whole "
        "chain: detecting unusual spending on one side, commentary, label and policy checks on the other.",
    ],
    "s4-clinic": [
        "Now it's your team's turn, on one laptop, with the same method as the jobs. Copy the clinic pack from the Files page, "
        "paste it into a new Copilot Chat, and answer its questions: first which departments you work in, then a few with letters.",
        "It gives you a table of your top three opportunities: what AI would do, whether it's classic or generative AI, and what it "
        "would save. The example: drafting the shift handover from the line log, generative, about 20 minutes a shift. Then argue "
        "with it: is each idea realistic, and would it really save that?",
        ["**Frequent, boring and checkable.** The same task every week, with a clear right answer.",
         "**Clean data first.** Start where the data is clean, or clean it first.",
         "**A person on the decision.** Keep a person on anything that reaches a customer, a regulator or a decision."],
        "Then one idea from each team to the room. Keep the chat open: this afternoon's action plan continues in it.",
    ],

    # ======== Job 3
    "j3-job": [
        "This job practises getting the right answer out of a long technical document. Line 1's filler, a Norvell FX-250, shows "
        "fault E14 after the evening changeover. You write the night technician's checklist from the 12-page manual.",
        ["Paste your pack and answer its questions. Check its prompt asks for safety first, every setting and the reset, a page "
         "number for each step, and nothing from another model.",
         "Attach the manual and Ahmed Darwish's breakdown report, and send 'Run it'.",
         "Send 'Check it'. For each step and setting, it names the page and the model that page is about.",
         "Open two of those pages in the PDF and look for yourself."],
        "Where's the catch? The manual covers two models, and their sections look alike. Which model a section is for may be "
        "printed only in small type. AI tends to find the section that matches the fault and copy it, without asking which machine "
        "it's for. A setting for the wrong model reads just as confidently as the right one.",
        "Data check: manuals are usually fine to share. Serial numbers and site layouts are not.",
    ],

    # ======== Day 1 close
    "c1-lessons": [
        "Day one in three lines. Then each team adds one lesson of its own, in one sentence, and they go on the whiteboard for "
        "tomorrow.",
        ["**The pack works.** Give it the goal, the material and what good looks like, and let it ask.",
         "**The catch is in the detail.** A time past midnight, a footnote, a page for another model.",
         "**A second opinion is cheap.** A fresh chat with the same files finds what the first one missed."],
        "None of today's catches was hard to see once you looked. The skill isn't spotting clever tricks. It's the habit of "
        "looking before you send.",
    ],
    "c1-out": [
        "Three things before you go.",
        ["**Your take-home briefs.** They're on the Files page under each job: shift notes, supplier quotes, a manual. You'll pick "
         "the ones to keep on Thursday.",
         "**Clean up.** Delete today's chats in Copilot and ChatGPT, sign out of both and close the private window. The accounts "
         "are BIBF's, and only for the course.",
         "**Tomorrow.** 09:00 sharp, with a quick recap quiz."],
        "The take-home briefs use the same pack as today, written for your own work. In Copilot Chat on your Arla account they "
        "work the same way.",
    ],

    # ======== Day 2
    "d2-today": [
        "Here's the shape of day two.",
        ["**Morning.** Patterns that save time, then two jobs: Planning and Logistics.",
         "**Before lunch.** Bringing your team along, then a station your team chooses: Finance, Regulatory or Lab.",
         "**Afternoon.** Your own prompts and desk card, your team's action plan, and the final podium."],
        "The morning keeps yesterday's rhythm: a round, then jobs. After lunch the course turns to your own work, so think now "
        "about the two or three tasks you do every week that you'd most like help with.",
    ],

    # ======== Round 5
    "s5-example": [
        "The quickest way to get a style right is to show it, not describe it.",
        ["**Two or three examples.** Paste last month's commentary and say 'in this style'. It copies the length, the tone and "
         "the format.",
         "**Examples, not rules.** One good example beats five lines describing the style you want.",
         "**This is called few-shot.** The technical name is [[fewshot|few-shot prompting]]. No examples at all is "
         "[[zeroshot|zero-shot]], where most tasks start."],
        "Examples are worth the effort when the style or the format matters: the monthly commentary, a report with a fixed "
        "layout, a handover your plant manager already knows.",
        trap("Examples steer strongly. If last month's commentary has a mistake or an out-of-date figure in it, expect the tool to "
             "copy that too."),
    ],
    "s5-role": [
        "Many prompts start with 'You are an expert...'. Here's what that does, and what it doesn't.",
        ["**It changes the voice.** 'Write as a plant manager' changes the tone and the vocabulary.",
         "**It doesn't add knowledge.** It knows nothing more about Ghaima because you called it an expert.",
         "**Material beats a role.** The log, the quotes, the manual: that's what makes it right."],
        "In 2024 researchers tested 162 different roles and found they didn't make answers more accurate. Use a "
        "[[role|role]] to set the voice if you like, and use material to get the facts right.",
        ex("'You're an expert maintenance engineer. How do I clear fault E14?' gets a confident general answer. 'Here are the "
           "FX-250 manual and the breakdown report. Give the steps for fault E14, with the page for each' gets one you can check."),
    ],
    "s5-critique": [
        "Two prompts you can reuse on almost anything that matters.",
        ["**Critique your draft.** 'List three weaknesses in your answer, then fix them.'",
         "**Argue the other side.** 'Now argue against your recommendation as a sceptical manager.'",
         "**Then check it yourself.** A self-critique finds some slips, not all of them."],
        "Both work because they change the question. Instead of defending its answer, the tool is asked to attack it, and weak "
        "points tend to show up quickly. Use them on a recommendation, a commentary or a reply before it goes out.",
        trap("'Are you sure?' is no check. The tool tends to say yes, or to change a right answer to please you. Ask for something "
             "you can verify: a page, a row, a sum."),
    ],
    "s5-image": [
        "An image prompt follows the same recipe every time: four parts, in this order.",
        ["**Subject.** What's in the picture: an operator locking out the jar line.",
         "**Details.** What must be there, and what mustn't: three words, Stop, Lock, Check, and no other text.",
         "**Style.** How it should look: a flat illustration in safety yellow and dark blue.",
         "**Format.** The shape and the use: an A4 portrait poster."],
        "The same recipe works in Copilot and ChatGPT. You used it for the safety poster in Job 1, and you'll use it again for the "
        "chart in Job 4 and the corrected label in Job 6.",
        tip("Text inside images can come out garbled. Say exactly which words go on it, keep them few, and add longer text "
            "yourself."),
    ],

    # ======== Job 4
    "j4-job": [
        "This job practises turning a month of figures into a short commentary, and checking the figures before anyone acts on "
        "them. Noora Al Hashimi, the plant manager, wants about 150 words on October's waste by line.",
        ["Paste your pack, answer its questions and check its prompt. Attach the workbook and send 'Run it'.",
         "Open a fresh chat, attach the workbook and send the second check. It recalculates each line's waste % and shows every "
         "unit.",
         "Do the two chats agree? Where they don't, open the workbook and look.",
         "Make the chart from the figures you've checked. For comparison, send the chart prompt and your figures in ChatGPT."],
        "Where's the catch? One row's waste isn't in the same unit as the rest, and the unit sits in its own column. One week is "
        "also missing. AI tends to add up the numbers and pass over the unit column, and a missing week doesn't show in a total. "
        "Read wrong, the wrong line looks worst.",
        "Data check: unpublished figures stay in approved tools. At Arla, that's Copilot Chat on your work account.",
    ],

    # ======== Job 5
    "j5-job": [
        "This job practises writing to a customer from the facts, not from a colleague's first guess. Sabeel Hypermarkets "
        "complained about the late delivery of PO 48213, and a colleague has drafted a reply.",
        ["Paste your pack, answer its questions and check its prompt. It should ask for under 150 words, the 5% credit note and "
         "one concrete step for next time.",
         "Attach the complaint, the delivery log and the draft, and send 'Run it'.",
         "Send 'Check the draft'. It compares the draft with the log, line by line.",
         "Read your reply against the log yourself before you'd send it."],
        "Where's the catch? A draft reads like fact. Asked to improve it, AI tends to keep its claims and polish the words. But "
        "the log is the record, and anything the log doesn't support, the reply puts in writing to a customer. It mustn't promise "
        "what you don't control either.",
        "Data check: the complaint has the buyer's name and mobile number, which is personal data. At work, keep it in Copilot "
        "Chat on your work account, or take the details out.",
    ],

    # ======== Round 6
    "s6-stop": [
        "When people stop using AI at work, it's usually for one of these reasons. You've probably seen some of them.",
        ["**No time to learn.** The first week is slower, so people give up before it pays off.",
         "**One bad answer.** A wrong figure early on, and they decide it can't be trusted.",
         "**No clear rules.** Unsure what they may paste in, they paste nothing.",
         "**Nobody else uses it.** Without a colleague or a manager using it, the habit doesn't stick."],
        "Each one has an answer you've practised here. Start with one weekly task, not ten. Treat a wrong figure as a catch, not a "
        "verdict: that's what checking is for. Know the data rules, so you know what you may paste. And use it with your team, "
        "which is what the action plan is for.",
    ],
    "s6-bcg": [
        "BCG's survey, AI at Work 2025, asked more than 10,600 workers in 11 countries about using AI at work. Two findings matter "
        "for you.",
        ["**Training.** Of people with more than five hours of training, 79% used AI regularly, against 67% of those with less. "
         "In-person training, with access to a coach, worked best.",
         "**Managers.** Among frontline staff, strong support from managers took the share who felt positive about AI from 15% to "
         "55%."],
        "So these two days are a start, not the finish. Keep practising on your own weekly tasks, and get your manager on board: "
        "your team's action plan asks you to share it with them.",
    ],
    "s6-agents": [
        "Five minutes on what's coming next.",
        ["**What an agent is.** An [[agent|agent]] plans and acts on its own: it opens files, searches, and carries on until the "
         "job is done. A chat answers you; an agent works through the steps.",
         "**Brief it like a colleague.** The same four parts, plus what it may and may not touch.",
         "**At Arla.** Most agents, and Copilot's Researcher and Analyst, need a Microsoft 365 Copilot licence. Agents built with "
         "Agent Builder need billing that IT sets up. Copilot Chat is where to start."],
        "So for most of you, agents are for later. The habit you build now carries straight over: a clear brief, and a check of "
        "the work.",
        trap("An agent that opens files on its own also reads any hidden instructions inside them. Give it only the access the "
             "job needs."),
    ],

    # ======== Job 6
    "j6-job": [
        "This job practises the same method on your own department's kind of work: paste the pack, answer its questions, check "
        "its prompt, attach your station's two files and send 'Run it'.",
        ["**Finance.** Five bullet points on October's results for Salman Fakhro, the Finance Manager, then a second check in a "
         "fresh chat.",
         "**Regulatory.** The draft back label for Ghaima Spread 500 g against a practice checklist, then an image of the "
         "corrected label.",
         "**Lab.** This week's QC results against the practice spec: release or hold, batch by batch."],
        "Where's the catch? Each station hides detail AI reads past. A one-off cost can look like a trend, a label can look "
        "finished and still miss an item, and a result can be in a different unit from its limit. AI compares what it sees at "
        "face value, so check the units and the one-offs yourself.",
        "Data check: month-end figures are unpublished, so at work they stay in approved tools. The label checklist and the lab "
        "spec are practice material, not real regulation.",
    ],

    # ======== My card
    "mc-how": [
        "This is where the two days turn into something you use at work. On the course site, My card walks you through it.",
        ["**Tap.** Your role, two or three weekly tasks, and the take-home briefs you want to keep.",
         "**Paste.** Copy your pack into Copilot Chat and answer its questions with letters.",
         "**Check and test.** Check each prompt it writes against the four parts. Test one on the tricky case it gives you.",
         "**Take it home.** Scan the QR code. Download the pack or share it to yourself."],
        "It's the same method you've used in every job, pointed at your own work. The pack holds no company data, so it can go "
        "straight into Copilot Chat on your Arla account.",
    ],
    "mc-task": [
        "This task practises the whole method once more, on your own work. Your pack asks Copilot to:",
        ["Ask up to three multiple-choice questions, including which task you'll start with, and when.",
         "Write a reusable prompt for each task, with the four parts and [brackets] for your own material.",
         "Give you a tricky test case with a hidden catch, to test one prompt before you trust it.",
         "Write the prompt for your desk card: the method word for word, your prompts and one if-then line, such as 'When I "
         "write the Sunday shift handover, I'll paste my prompt first.'"],
        "Where's the catch? AI likes to improve what it's given, so it may reword the method or add rules of its own, even though "
        "the pack says not to. If it does, ask it to put the method back exactly as you gave it. And check every prompt against "
        "the four parts before you keep it.",
        "Data check: the pack holds no company data, so it can go into Copilot Chat at Arla.",
    ],

    # ======== Action plans
    "ap-plan": [
        "Go back to your team's clinic chat from Round 4, copy the action-plan pack from the Files page, and paste it in the same "
        "chat. It turns two of your opportunities into a plan with four parts.",
        ["**Two uses.** Two tasks in your members' work where AI will save time.",
         "**The data rules.** What may go into Copilot Chat, and what stays out.",
         "**Who does what.** A name against each use.",
         "**The first step.** What happens next week, and when."],
        "You have fifteen minutes to draft, then two to three minutes per team to present.",
        tip("Small and frequent beats big and rare: a weekly report, not a once-a-year project. Name a person and a day for the "
            "first step, and share the plan with your manager. Their support is what keeps it going."),
    ],

    # ======== Final
    "f-built": [
        "Look back at what your teams did in two days. Each one is a small version of work a dairy business can hand to AI, with "
        "a person checking.",
        ["**Production.** A night log turned into a handover, with the double entry and the midnight stoppage caught.",
         "**Procurement.** Three quotes compared, a footnote found and a hidden instruction exposed.",
         "**Maintenance.** The right fix from a manual with two models.",
         "**Planning and Logistics.** A unit slip caught, and a reply that tells the customer what really happened.",
         "**Your station.** Finance, Regulatory or Lab, checked line by line.",
         "**Your own work.** Your prompts and desk card, on your phone."],
        "The same method works at your desk in Copilot Chat: let AI write the prompt, check it, run it, check the result.",
    ],
    "f-out": [
        "Three things before you go.",
        ["**Your pack.** Check it's on your phone, in the Files app, Notes or WhatsApp. That's what you open at work.",
         "**Clean up.** BIBF's accounts are for the course only, so delete the chats you made in both tools, sign out and close "
         "the private window.",
         "**Tell BIBF.** Fill in the BIBF evaluation before you leave."],
        "Then you're done. The pack, the four-part brief and the checking list go home with you, ready for Copilot Chat at Arla.",
    ],
}
