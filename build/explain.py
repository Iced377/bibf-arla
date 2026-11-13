"""The instructor's explanations: an introduction for each round and a full explanation under each block and job.

Written the way the instructor explains it out loud, in easy words and short sentences, so a participant who reads only
this page understands the block. Every term is explained the first time it appears. Job explanations never give away
the answers to the phone questions.

A piece is a paragraph (a string), a bullet list (a list of strings), a box (ex, trap, tip) or a prompt to copy (tryit).
**word** marks a word being taught; [[key]] links a glossary term.
"""


def ex(text):
    return {"box": "example", "text": text}


def trap(text):
    return {"box": "trap", "text": text}


def tip(text):
    return {"box": "tip", "text": text}


def tryit(title, text):
    return {"prompt": text, "title": title}


# ---------------------------------------------------------------- the rounds
ROUND = {
    "k0": [
        "Welcome. Today is a practical day. You'll spend most of it doing real work in ChatGPT and Copilot, two of the AI assistants "
        "most people now use at work, and only a short time listening to theory. BIBF provides both for today, on its lab desktops.",
        "To make the work realistic, you join the AI team of a bank for the day. The bank is called Najma Bank. It's made up, so its "
        "files can't leak anything real, and we know the right answer to every question in advance.",
        "The day has five rounds. Each one teaches one skill, lets you practise it with quick questions on your phone, and then gives "
        "you a real job to do on the desktop in front of you. By 14:00 you'll have built four working simulations for the bank, and "
        "shown at least one of them to the room.",
    ],
    "s1": [
        "Before we learn how to write a good prompt, it helps to know what today's AI assistants can actually do. Many people still "
        "use them the way they did in 2023: type a question, read the answer, copy it out. The tools have moved a long way since then.",
        "This round has three parts. First a short warm-up, so you see what both tools do with one request. Then the ideas: what "
        "prompt engineering means now, what the tools can do in 2026, why they still make confident mistakes, and what you may and may "
        "not give them. Last, a few quick questions on your phone.",
    ],
    "s2": [
        "This is the most important round of the day. Most disappointing AI answers come from a thin request. The tool had to guess "
        "what you wanted, who it was for and what the result should look like, and it guessed wrong.",
        "You'll learn to write a **brief**: the kind of instructions you'd give a capable new colleague. We'll look at the five parts "
        "of a good brief, how the popular prompt formulas all ask for the same things, when examples help, and what giving the tool a "
        "role does and doesn't do. You write a brief of your own and send it to both tools. Then you brief ChatGPT to build a working "
        "fee calculator for the bank, and test whether it got the rules right.",
    ],
    "s3": [
        "A good brief is half the story. The other half is what the assistant knows about your work. Out of the box it knows nothing "
        "about your bank, your projects or the way you write dates. Every gap gets filled with a guess.",
        "In this round you'll learn the ways to give it that knowledge: attach files and photos, set up a project that keeps your "
        "instructions, and let the AI interview you before it starts. We'll also cover thinking mode and a few techniques that still "
        "make answers better. Then you'll use all of it to turn eight photos of messy meeting notes into an updated project tracker.",
    ],
    "s4": [
        "So far we've worked on getting better answers. This round is about whether you can trust the answers you get. AI tools write "
        "fluently and confidently even when they're wrong, so you can't judge an answer by how it sounds.",
        "You'll see why results go wrong, three real cases where nobody checked, and a short checking list you can run on any result. "
        "Then you'll compare two supplier proposals for the bank. The files contain the kind of detail AI tools tend to miss. Your job "
        "is to find it before you'd sign the recommendation.",
    ],
    "s5": [
        "The last round looks at work the assistant does while you're busy with something else. Both ChatGPT and Copilot can now run a "
        "request on a schedule, and both have agents that carry out a task step by step on their own.",
        "You'll learn what each tool offers and how to brief an agent safely. Then you build a short morning news brief for Fatema Al "
        "Sayed, Najma's Head of Digital. The AI interviews you and you answer as Fatema, from her profile. It writes and runs the "
        "brief, and you check it the way you learned in Round 4. Last, you see a scheduled brief and an agent at work on the "
        "instructor's laptop.",
    ],
    "f": [
        "The final round brings the day together. You take the same twelve questions as this morning, so you can see how far you've "
        "come. Then a last quick-fire round, the leaderboard and a look back at what you built.",
        "Before you leave, clean up. The BIBF accounts are shared with the next class, so delete the chats and projects you made "
        "today in both tools, then sign out of both and close the private window.",
    ],
}

# ---------------------------------------------------------------- the blocks
BLOCK = {
    # ======== Kick-off
    "k0-shape": [
        "Every round follows the same three steps, so you always know what comes next.",
        ["**Theory.** A short explanation of one skill, with examples from Najma Bank. Phones down. Each block on the site has an "
         "'Explained in full' panel like this one, so you can read it again at your own pace.",
         "**Exercises.** Quick questions on your phone, one after another. They check that the idea made sense before you use it.",
         "**Try it.** A real job in ChatGPT or Copilot on your desktop. When you've done it, your phone asks one to three questions "
         "about what you found. Then one or two of you show the room what you built."],
        "There are no teams today: each of you plays for yourself. Your phone scores you as you go. The fastest right answer earns "
        "3 points, and every other right answer earns 1. The leaderboard comes in the final round.",
    ],
    "k0-take": [
        "If you remember only three things from today, make it these. Each one matches a round, and you'll come back to them in the "
        "final round.",
        ["**Brief it like a colleague** is Round 2: say the goal, the context, the material, what done looks like and the limits.",
         "**Give it context that lasts** is Round 3: projects, files and an interview before it starts, so you don't repeat "
         "yourself.",
         "**Check before you trust** is Round 4: the figures, the sources, the small print and who signs it."],
        "Rounds 1 and 5 support them. Round 1 shows what the tools can do now, and Round 5 sets the work to run by itself.",
    ],
    "k0-signin": [
        "**Why a private window?** The desktops are shared, and another class will sit at your desk tomorrow. A private window "
        "(Microsoft calls it InPrivate) forgets everything when you close it: your sign-in, your history and your list of downloads. "
        "So nothing you do today stays on the computer.",
        "**Which accounts?** Today you use two AI tools, ChatGPT and Copilot, on the accounts BIBF provides. The details are on the "
        "card on your desk. They're BIBF's work accounts, lent to you for today only: you can't take them with you, and the next class uses "
        "them too, so nothing real goes into them. That's easy today, because every file is made up. Before you leave, you delete "
        "the chats and projects you made in both.",
        "**The Files page.** The course site has a page called Files, at bibf-prompt.vercel.app/#/files. It holds every file and "
        "every prompt for the day's jobs. Each prompt has a Copy button, so you never need to type a long prompt. On your phone, "
        "the same site opens on Play; the Files link sits next to it at the top.",
        tip("Keep three tabs open all day: ChatGPT, Copilot and the course site's Files page. Ctrl + Tab moves from one to the "
            "next."),
    ],
    "k0-out": [
        "These are the four things you should be able to do by the end of the day. They match the two learning outcomes BIBF set for "
        "this course: applying prompt engineering to get accurate, relevant results from AI tools, and judging AI results before "
        "they're used for a business decision.",
        ["**Brief it.** You can write a request that gets usable work back the first or second time, instead of the fifth.",
         "**Give it context.** You can set the tool up so it already knows the background, the files and the rules, every time you "
         "use it.",
         "**Check it.** You know where AI results usually go wrong, and how to catch it in a few minutes.",
         "**Build with it.** You can get a working result out of it, such as a calculator, an updated tracker or a daily news "
         "brief, and show how you checked it."],
    ],
    "k0-case": [
        "All day we work for one bank, so every example connects to the next. Najma Bank is a made-up retail bank in Bahrain. Its head "
        "office is in Seef, it has nine branches and about 420,000 customers, and most of them bank on its app.",
        "Why a made-up bank? Two reasons. First, nothing real leaves the room: you can upload its files to any AI tool without risk. "
        "Second, we know every right answer in advance, so your phone can tell you straight away whether the AI got it right.",
        "The bank is busy with three initiatives this quarter. **Najma App 3.0** is a new version of its mobile app, launching on "
        "1 March 2027. The **Muharraq branch of the future** is a branch being refitted with new technology, due to reopen in January "
        "2027. The **National Day campaign** is a marketing campaign that launches on 1 December 2026. You'll meet all three again in "
        "Job 2.",
        tip("Everything about the bank is in the case file. Press Case file at the top of any page."),
    ],
    "k0-jobs": [
        "Each round ends with a job: a real piece of work you do with the bank's files. They're the kind of work people in banks now "
        "hand to these tools. You build Jobs 1 and 2 in ChatGPT and Jobs 3 and 4 in Copilot. Each job also has a step in the other "
        "tool, because asking a second tool is one of the quickest checks there is.",
        ["**Job 1 · Build it** (Round 2). The bank has six rules for the fee on international transfers. You ask the AI to turn them "
         "into a calculator you can use, then test whether it applied every rule correctly.",
         "**Job 2 · Organise your notes** (Round 3). You have eight photos of notes from a busy week: a whiteboard, sticky notes, a "
         "notebook page, a printed email. The AI reads them, works out which initiative each note belongs to and updates the bank's "
         "tracker.",
         "**Job 3 · Trap in the file** (Round 4). Two suppliers want to build the bank's chatbot. The AI compares their proposals and "
         "recommends one. The files contain details that AI tools often miss.",
         "**Job 4 · The morning brief** (Round 5). The AI interviews you as Fatema, the bank's Head of Digital, then writes her a "
         "short news brief with links. You check whether the links say what the brief claims."],
        "After each job your phone asks one to three questions about what you found. Then one or two of you show the room what you "
        "built. With six of you and four jobs, everyone shows once.",
        "Every job is a simulation. You build it today on BIBF's accounts to learn the method, so nothing needs to keep running after "
        "the course.",
    ],

    # ======== Round 1
    "s1-warm": [
        "The warm-up is one request, sent by everyone in the room, twice: once in ChatGPT and once in Copilot. Watch what comes back "
        "in each, and then look at your neighbours' screens.",
        "You'll probably see different results. One tool may draw a chart with sliders you can move. The other may build a small "
        "calculator, or give you text and a formula. The words were the same, so the difference comes from the tool, the model behind "
        "it and the plan you're on. Even the same tool can answer differently twice, because these tools don't produce the same "
        "output every time.",
        "Then you write a request of your own: one line asking for a National Day greeting from Najma Bank to its customers. Six "
        "people write six different lines and get six different greetings. Small changes in wording change what comes back. That's "
        "the first reason to learn how to brief well.",
        "Two lessons from this. Today's assistants can build things you can use, as well as write about them. And you can't predict "
        "exactly what you'll get, so you always look at the result and check it.",
        "How do you check this one? The example loan is BD 20,000 over five years at 6% a year. The monthly payment should be about "
        "BD 386.66. If your tool shows something very different, ask it to show the formula it used. Banks use the standard loan "
        "formula, where each payment covers that month's interest and pays back part of the loan.",
        ex("Move the sliders and watch the payment. Raise the rate to 7% and it should rise to about BD 396. Make it a ten-year loan "
           "at 6% and it should drop to about BD 222. If a slider moves and nothing changes, the tool built something that only looks "
           "right."),
        tip("The extra step asks for an image. ChatGPT and Copilot both draw images. Send the same image prompt to each and compare "
            "what they make of the same recipe."),
    ],
    "s1-what": [
        "Prompt engineering sounds technical. It means something simple: getting an AI tool to give you what you actually need. A "
        "**[[prompt|prompt]]** is whatever you type or paste into the tool. The engineering part just means doing it on purpose, in a way you "
        "can repeat.",
        "In 2023 most advice was about wording: magic phrases, clever formulas, 'act as an expert'. The tools have changed since then, "
        "and they now understand plain requests well. What makes the biggest difference today comes in three parts.",
        ["**The prompt.** What you ask for. A good one reads like a brief to a capable colleague: what you want, why, for whom, and "
         "what the result should look like. Round 2 is about this.",
         "**The context.** Everything else the tool can see: the files and photos you attach, examples of what you like, the "
         "background to the work and the project it's working in. Round 3 is about this.",
         "**The check.** What you look at before the result goes to a customer, a manager or a decision. Round 4 is about this."],
        "The skill is one good managers already have: delegating clearly and checking the work. You don't need to be technical to be "
        "very good at it.",
        ex("Ask 'Write a reply to this customer' and you get a polite, general letter. Ask for a reply to a Premier customer whose card "
           "came three weeks late, explain the courier delay, say no compensation can be offered and set a limit of 150 words, and you "
           "get a letter you can send after a quick read. Same tool, same minute of typing."),
    ],
    "s1-kpmg": [
        "A real example shows how much a good brief is worth. In 2025 the accounting firm KPMG in Australia built an AI tool for its "
        "tax team, called TaxBot. The instructions behind it, its prompt, run to about 100 pages. KPMG wrote down how its experts "
        "give tax advice, what they check and how the advice should be laid out.",
        "The tool also draws on the firm's earlier tax advice and on Australian tax law. A tax agent gives it four or five key facts "
        "about a client. TaxBot then writes a first draft of the advice, about 25 pages long, in a day. The same work used to take "
        "about two weeks.",
        "Two things matter for us. First, the gain came from the brief and the material: KPMG wrote down what its best people know, "
        "and the tool used it. Second, a licensed tax expert still checks every draft before it reaches a client. The tool drafts and "
        "a qualified person decides.",
        tip("You won't write 100-page prompts. Take the habit: the more of your own know-how you put into the brief, the less the tool "
            "has to guess."),
    ],
    "s1-new": [
        "The biggest change since 2023 is that these assistants do far more than chat. Five things are worth knowing, because you'll "
        "use most of them today.",
        ["**It reads.** You can attach files, such as a PDF, a Word document or a spreadsheet, and photos. The tool reads printed text, "
         "tables and even handwriting. The ChatGPT or Copilot app on your phone can take the photo for you.",
         "**It builds.** Ask for a calculator, a chart, a short document or a slide, and you get the working thing. Since October 2026, "
         "ChatGPT's answers can include charts, buttons and forms, which OpenAI calls Intelligent UI. Copilot works inside Word, Excel "
         "and PowerPoint, and the new Copilot app Microsoft announced on 25 September 2026 adds Code, which builds small apps from a "
         "description. Claude, the third big assistant, opens what it builds in a panel beside the chat, called an "
         "[[artifact|artifact]].",
         "**It remembers.** A [[project|project]] is a workspace with its own files and instructions, so every chat in it starts with that "
         "background. [[memory|Memory]] lets the tool remember facts about you from one chat to the next.",
         "**It runs on a schedule.** You can ask for a job to run by itself, for example a news summary every morning at 7:00. This "
         "is a [[scheduled|scheduled task]]. ChatGPT calls it a task and Copilot calls it a scheduled prompt.",
         "**It acts.** An [[agent|agent]] is an AI tool that carries out a task step by step: it opens websites or files, clicks, types and "
         "checks its own progress. ChatGPT's agent is called agent mode and Copilot's is called Cowork. Both need a paid plan or "
         "extra billing."],
        "Which plan includes which feature changes every few months. When something in a job isn't on today's accounts, the job "
        "gives you another way to do it, often in the other tool.",
        "What hasn't changed matters just as much. A clear request and the right material still make the biggest difference to what "
        "you get, and every result still needs a person to check it before it's used.",
    ],
    "s1-wrong": [
        "To use these tools well, it helps to know roughly how they work. ChatGPT and Copilot run on a [[llm|large language model]], an "
        "**LLM** for short. An LLM learned from a huge amount of text. When you ask it something, it writes its answer a small piece "
        "at a time, each time choosing a likely next word given everything before it.",
        "That explains most of its mistakes.",
        ["**It predicts.** When the right answer was common in what it learned, it usually gets it right. When it doesn't know, it "
         "carries on anyway and writes something that sounds right, just as confidently. A made-up answer is called a "
         "[[hallucination|hallucination]].",
         "**It fills gaps.** If your request leaves something out, such as who the reader is or how dates are written, the tool "
         "assumes the most common case. That may not be yours.",
         "**It tends to agree.** These tools are trained to be helpful, and people rate agreeable answers highly. Ask 'Isn't the "
         "second supplier cheaper?' and it leans towards yes. This habit is called [[sycophancy|sycophancy]]. Ask an open question instead: "
         "'Which supplier costs less over three years? Show the sums.'",
         "**It can be out of date.** A model learns from text up to a date, its [[cutoff|knowledge cutoff]]. After that it knows "
         "nothing unless it searches the web, and a rule, a rate or a price may have changed since."],
        "So use the tools, and use them well: brief them clearly, give them the facts they need, and check the parts that matter.",
    ],
    "s1-acct": [
        "Before you paste anything into an AI tool, ask two questions: whose data is this, and where is it going?",
        "Your bank may give you an approved AI tool on a work account. Those come with a contract: usually the provider can't use your "
        "chats to train its models, and your bank's IT team controls the settings. A personal account is different. It's between you "
        "and the provider, under the provider's terms, and on many personal plans your chats can be used to improve the model unless "
        "you switch that off in the settings.",
        "**Customer data** is the clearest line. Bahrain's Personal Data Protection Law, Law No. 30 of 2018 (the PDPL), protects "
        "personal data such as names, account numbers and phone numbers. Putting a customer's details into a personal AI account sends "
        "them to an outside company without the customer's consent or your bank's approval. Don't do it.",
        "**Internal documents** come next: board papers, strategy, performance reviews. These belong in your bank's approved tool, and "
        "only if its policy allows them. On a personal account, use only what is already public, such as the fees on the bank's "
        "website.",
        ex("Today you're on BIBF's work accounts for ChatGPT and Microsoft 365 Copilot. They're work accounts, but they aren't your "
           "bank's, so nothing from your bank goes in. Everything today is still safe to upload, because Najma Bank and all its files "
           "are made up. Back at work, the same job with real files belongs in your bank's "
           "approved tool, and only if your policy allows it."),
        trap("Taking out names and numbers helps, and sometimes it's still not enough. A complaint about 'the only woman branch "
             "manager in Hamad Town' still points to one person. Check that nothing left in the text identifies someone."),
    ],
    "s1-gallery": [
        "Banks were among the first big users of generative AI at work, mostly to help their own staff. Here's what some of them "
        "report.",
        ["**JPMorgan Chase** built its own assistant, LLM Suite, on models from outside providers. By May 2025 about 200,000 staff had "
         "access. They use it to draft emails and reports, summarise long documents and find information.",
         "**BBVA**, the Spanish bank, gave ChatGPT Enterprise to 120,000 staff in December 2025. It reports that each person saves "
         "about three hours a week.",
         "**Mashreq** in the UAE built a platform called Newton for its financial crime investigators. The bank says it made them "
         "about 40% more productive (October 2026).",
         "**ING** in the Netherlands built a chat assistant for customers with McKinsey in seven weeks. In the 2023 pilot, 20% more "
         "customers got help without a long wait.",
         "**Klarna**, the payments company, launched an AI assistant in 2024 that handled two-thirds of its customer chats in the "
         "first month. By May 2025 its chief executive said quality had suffered, and it began hiring people again."],
        "Two cautions. Most of these figures come from the companies themselves, and nobody outside has checked them. And Klarna shows "
        "that savings on day one can hide a quality problem that only shows up later.",
        "You'll also hear 'AI' used for older tools: credit scoring, fraud detection, anti-money-laundering alerts and scripted "
        "chatbots that pick from fixed answers. These are [[classicai|classic AI]]: they predict a number or sort cases, and banks "
        "have used them for decades. ChatGPT, Copilot and Claude are [[genai|generative AI]]: they write, summarise and build. Both kinds are useful, "
        "and they do different jobs.",
    ],

    # ======== Round 2
    "s2-types": [
        "Prompts do different jobs. It helps to notice what kind of answer you're asking for, because each kind needs something "
        "different from you.",
        ["**Open** prompts ask for ideas, options or a first draft. The tool is good at these. Give it enough background that the "
         "ideas fit, and say how many you want.",
         "**Closed** prompts want one short answer: yes or no, a number, a name. Ask it to quote where the answer comes from, so you "
         "can check it.",
         "**Factual** prompts ask for facts it should find or remember. Invented answers happen most here. Ask for the source, and "
         "switch on web search for anything recent.",
         "**Opinion** prompts ask for a judgement. Always ask for the reasons, so you can see whether they hold up.",
         "**Instructional** prompts ask for a piece of work done to a standard: a memo, a summary, a table, a calculator. Most work "
         "requests are this kind, and they gain the most from a proper brief."],
        ex("'Suggest five names for a savings account for young savers' is open. 'Does the Premier waiver cover a customer's fourth "
           "transfer this month? Quote the rule' is closed. 'Turn these notes into a 300-word memo for the CEO' is instructional."),
    ],
    "s2-write": [
        "Four habits make almost any prompt better. They come from the provider's slides, and they still hold.",
        ["**Be clear and specific.** Say exactly what you want. 'An email' leaves the length, the tone and the purpose to chance. 'An "
         "email of under 150 words apologising for the delay and confirming the new date' leaves almost nothing to chance.",
         "**Give context.** The tool knows nothing about your bank, your customer or what happened last week. One or two sentences of "
         "background change the result more than any clever wording.",
         "**Say the tone and style.** Formal or friendly? English, Arabic or both? Written for a customer or for a board? If your bank "
         "has a house style, paste a short example of it.",
         "**Ask it to ask you.** End with 'Ask me anything you need before you start.' The tool then asks about the gaps instead of "
         "guessing. This one habit fixes a large share of poor answers."],
        "Most people skip the last one. Try it in every job today.",
    ],
    "s2-brief": [
        "This is the most useful idea of the day. Write your prompt the way you'd brief a capable new colleague who has just joined "
        "and knows nothing about your bank. If they'd need to come back to you with questions, the answers belong in the brief.",
        "A good **[[brief|brief]]** has five parts.",
        ["**Goal.** What you want, and why. 'Reply to this customer' is a task. 'Reply so they stay with us after a bad experience' "
         "tells the tool what a good reply has to achieve.",
         "**Context.** Who it's for and what has happened. A Premier customer on their second complaint needs a different letter "
         "from a first-time question.",
         "**Material.** What it should use: the complaint, the policy, last year's figures, an example you like. Without material, "
         "the tool uses what it guesses is typical.",
         "**What done looks like.** The format, the length, the tone and the language: 'Under 150 words, warm and direct, in English "
         "and Arabic.'",
         "**Limits.** What it must not do: 'Don't promise a delivery date. Don't offer compensation.' Limits stop the most expensive "
         "mistakes."],
        "You don't need all five every time. A quick question needs one line. But when a result disappoints you, go through the five "
        "parts. The missing one is usually the cause.",
        ex("Put together, the brief for the late card reads: 'Reply to Mr Maki, a Premier customer. His new card arrived three weeks "
           "late because of a courier delay, and this is his second complaint. I've attached his email with the account details "
           "removed, and our card delivery policy. Apologise and explain what happened. Don't promise a date and don't offer "
           "compensation. Under 150 words, warm and direct, in English and Arabic.'"),
    ],
    "s2-names": [
        "You'll meet many prompt formulas, usually as acronyms. The provider's slides teach three of them.",
        ["**RACE**: Role, Action, Context, Execute. Give the tool a role, say the action, add the context, then say how to carry it "
         "out (tone, length, format).",
         "**CRISPE**, as the slides spell it out: Clarity, Relevance, Iteration, Specificity, Practicality, Examples. Other sources "
         "use different words for the same letters.",
         "**REACT**: Role, Explanation of the task, Ask for clarification if needed, Constraints, Task description."],
        "The makers of the tools publish their own versions. Microsoft's guide for Copilot uses four parts: goal, context, source and "
        "expectations. Google's guide for Gemini uses persona, task, context and format.",
        "Put them side by side and they ask for the same things: what you want, the background, the material to use and what the "
        "result should look like. Some add a role, and one adds 'ask questions'. They're all versions of the five-part brief, so you "
        "don't need to memorise acronyms. If a formula helps you remember, use it.",
        trap("REACT in capital letters, the checklist, has nothing to do with ReAct, the research method behind AI agents that you'll "
             "meet in Round 5. Same letters, different ideas."),
    ],
    "s2-shots": [
        "Two terms you'll see in every prompting guide.",
        "A **[[zeroshot|zero-shot]]** prompt has no examples. 'Shot' here means example, so zero-shot means you simply ask. Today's "
        "tools handle most requests well this way, so start here.",
        "A **[[fewshot|few-shot]]** prompt includes a few examples of what you want, usually two to five. The tool picks up the "
        "pattern: the length, the tone, the layout, the way you label things. Researchers showed in 2020 that large language models "
        "can learn a task from a handful of examples in the prompt, with no extra training.",
        "When are examples worth the effort? When the style or the format matters more than the facts: captions in your bank's voice, "
        "a report with a fixed layout, complaints tagged the way your team tags them. Describing a style in words is hard. Showing "
        "three examples is easy.",
        tryit("A few-shot prompt", "Here are three captions we used last year and liked:\n1. [caption]\n2. [caption]\n3. [caption]\n\n"
              "Write five more in the same style for the launch of Najma App 3.0. Its new features are Face ID login and paying EWA bills "
              "in two taps."),
        trap("Examples steer the result strongly. If all three are short and playful, you'll get short and playful. If one of them "
             "mentions an offer that has ended, expect the tool to copy it."),
    ],
    "s2-role": [
        "Two older techniques from the slides deserve a closer look.",
        "**Instruction prompting** means giving direct instructions: 'Use bullet points. Keep it under 200 words. Leave out technical "
        "terms.' This still works well. Today's tools follow clear instructions closely, so say exactly what you want.",
        "**[[role|Role prompting]]** means telling the tool who to be: 'Act as a senior compliance officer in a Bahraini bank.' A role "
        "changes the tone, the vocabulary and what the answer pays attention to. A compliance officer's answer talks about rules and "
        "risks, and a marketing manager's talks about customers and messages.",
        "A role leaves accuracy where it was. In 2024 researchers tested 162 different roles on more than 2,000 factual questions, "
        "with four families of models. Adding a role gave no reliable improvement. Telling the tool it's an expert gives it no expert "
        "knowledge.",
        "What does help is giving it what a real expert would have in front of them: the policy, the regulator's rule, the figures, "
        "the case. Use a role to set the voice, and use material to get the facts right.",
        ex("'You're a compliance officer. Is our new savings offer compliant?' gets a general answer about compliance. 'Here is our "
           "savings offer and the central bank's rules on advertising. Check the offer against each rule and list any wording that "
           "breaks one' gets an answer you can check line by line."),
    ],
    "s2-makeover": [
        "The slides give this as an example of an effective prompt: 'What are the implications of rising interest rates for the real "
        "estate market in the next year?' It's better than 'Tell me about interest rates', because it names the topic and the time "
        "frame.",
        "But think about what the tool still has to guess. Which country's market? How big a rise in rates? Who will read the answer, "
        "and what will they do with it? How long should it be? Without these, you get a general essay that could have been written "
        "for anyone.",
        "The 'after' version fills each gap with a few words: who is asking and why (a head of mortgages preparing for the board), the "
        "scope (Bahrain, the next 12 months, a rise of half a percentage point), the format (a list under 250 words with one action "
        "per point) and a request to say where it's unsure.",
        "Notice what's still missing: the bank's own figures. Without them the tool talks about the market in general, or worse, "
        "invents a picture of your bank's mortgages. When an answer should be about your organisation, attach your organisation's "
        "data.",
    ],
    "s2-turn": [
        "Time to write a brief of your own. The provider's slides end their section on prompt formulas with practice tasks for a "
        "bank: a warning about phishing, an explainer on credit scores, a comparison of savings accounts, captions for a new app, a "
        "data privacy checklist for staff and a script for a relationship manager. Each one is on the Files page, rewritten for "
        "Najma with the facts you need. Pick one, a different one from your neighbour's.",
        "The card gives you the facts. Your job is the brief around them: the goal, the context, the material, what done looks like "
        "and the limits. If you prefer RACE or CRISPE from the slides, use it. They ask for the same things.",
        "Send the same brief to ChatGPT and to Copilot, and compare the two answers. Where they differ, look at your brief first. "
        "Usually one line left room to guess, such as the reader, the length or the format. Change that line, send it again and tell "
        "your neighbour what you changed.",
        ex("The captions card is few-shot: it gives three captions the bank liked, so both tools can copy the voice. Leave the three "
           "out and compare. The captions usually turn generic."),
        tip("The slides' other practice tasks work the same way: a memo on a new hybrid work policy, a data-use disclaimer rewritten "
            "in plain words, a quick-start guide for a card terminal. Try one later in whatever AI tool your employer approves."),
    ],
    "s2-spec": [
        "When you ask an AI tool to build something, such as a calculator, a checklist or a template, your prompt becomes a "
        "**specification**, or spec: a description of exactly what the thing must do. A vague spec gives you something that works on "
        "easy cases and fails on the ones that matter.",
        "A good spec has four parts.",
        ["**What it does.** The inputs it takes, the output it gives and every rule it follows, copied word for word from the source. "
         "Rules retold in your own words tend to lose their conditions.",
         "**Test cases.** Two or three examples where you already know the right answer. Include at least one awkward case, such as "
         "a customer right on the limit of a rule.",
         "**Who uses it.** Branch staff on a desktop need a different screen from customers on a phone.",
         "**A check before it builds.** Ask the tool to list the rules back to you in its own words first. If it misreads a rule, you "
         "see it before anything is built."],
        "Then test it with your cases. When one fails, say which case and what it should show, and ask the tool to show its working "
        "step by step. 'It's wrong' alone gives it nothing to fix. You'll use exactly this method in Job 1.",
    ],
    "s2-image": [
        "Image tools respond to the same habits as text tools. The slides list five image formulas. They all come down to four "
        "things.",
        ["**Subject.** What the image shows: 'a Bahraini family on the Manama corniche at sunset'.",
         "**Details.** What must be in it: the flags, the time of day, the colours, the setting.",
         "**Style.** A photo, an illustration, a flat icon, a watercolour.",
         "**Format.** The shape and the use: square for Instagram, wide for a website banner. Ask for no text in the image if you'll "
         "add the words yourself, because words inside images can still come out wrong."],
        "ChatGPT and Copilot both create images directly. Whatever tool you use, check the result for odd details before it goes "
        "public: hands, flags, logos and any writing.",
    ],
    "s2-job": [
        "This job puts the brief and the spec to work. The bank has six rules for the fee on international transfers, on a one-page "
        "PDF. Your job is to get the AI to build a fee calculator that follows all six.",
        "You'll do it twice on purpose. First with a one-line request, so you see what a vague brief builds. Then with the full brief: "
        "the rules, the inputs, the output, who uses it and three test cases.",
        "Before the full brief, open the model menu at the top of the chat and choose **Thinking**. Six rules that work together are "
        "exactly the kind of task thinking mode is for. Round 3 explains it.",
        "The rules work together. There's a minimum and a maximum, a lower cap for some countries, a waiver for some customers, a "
        "discount that applies at a particular step, and an extra charge the discount doesn't touch. The order in which the rules "
        "apply changes the answer. A vague brief loses exactly this kind of detail.",
        "How do you know whether the calculator is right? Work out one test case by hand with the rules in front of you, one rule at a "
        "time. If your answer and the calculator's differ, ask the AI to show the fee after each rule. The step where they part is "
        "the mistake.",
        "Then get a second opinion. You build the calculator in ChatGPT, and you give Copilot the same six rules and the two test "
        "cases, and ask it to work them out one rule at a time. If Copilot, the calculator and your own working agree, you can be "
        "fairly confident. If they don't, the rules decide who is right.",
    ],

    # ======== Round 3
    "s3-files": [
        "Attaching a file is often the best thing you can do for a result. The tool then works from your actual document instead of "
        "what it guesses such a document says.",
        "Each kind of file has its strengths and its weak spots.",
        ["**PDF and Word.** Policies, proposals and reports work well, tables included. The weak spots are footnotes, small print, "
         "text inside pictures and scanned pages. Point it to the right place: 'Use section 4' or 'Check the footnotes too'.",
         "**Excel and CSV.** The tool can calculate, sort, chart and even give you back an updated file. Check one total yourself, "
         "and ask it to show how it worked something out.",
         "**Photos and scans.** Whiteboards, sticky notes, receipts, handwriting and screenshots. It reads them surprisingly well. "
         "Handwritten numbers and dates are where it slips, so ask it to list what it read before it acts on it.",
         "**Long files.** Hundreds of pages can go in at once. Each plan has its own limits on file size and the number of files, "
         "and the limits change often, so check your own plan's."],
        "One more habit: tell it where to look. 'See attached' leaves the tool to decide what matters. 'Use the fee table on page 2 "
        "and the conditions in section 4' gets you a focused answer.",
    ],
    "s3-proj": [
        "Every new chat starts from nothing. If you use AI for the same piece of work every week, typing the same background each time "
        "soon gets tiring. Projects solve that.",
        "A **[[project|project]]** is a workspace in ChatGPT, and on some Copilot plans too. It has a name, its own files and its own instructions. Every chat you "
        "start inside the project can see the files and follows the instructions, without you repeating them.",
        "The **instructions** matter most. Think of them as a standing brief: the goal, the rules and what you want back, written "
        "once. For example: 'You keep the tracker for my three initiatives. Assign each note to one of them. Dates are day/month. If a "
        "note fits none, ask me.'",
        "The **files** are the material it should always use: the tracker itself, a policy, a product sheet, a list of names and "
        "roles.",
        "**[[memory|Memory]]** is a separate feature. The tool remembers facts about you across all your chats, such as your role or "
        "how you like answers laid out. It's useful on your own account. On an account other people use, like today's, keep it off, so nothing "
        "about you carries over to the next person. For sensitive work, check what it remembers in the settings.",
        ex("A marketing manager could keep a project for the National Day campaign: the brand guide and last year's posts as files, and "
           "the instruction 'Write in English and Arabic, under 40 words a post, and never mention prices'. Every post request in that "
           "project then starts from the same rules."),
    ],
    "s3-interview": [
        "Writing a complete brief takes effort, and you often don't know what you left out until the answer comes back wrong. There's "
        "a shortcut: ask the tool to interview you first.",
        "You say what you want in a sentence or two, then add: 'Before you start, ask me questions one at a time until you have what "
        "you need. Then write the instructions.' The tool asks about the gaps, such as the reader, the format, the rules and the "
        "exceptions. You answer each in a few words. At the end it writes the brief, or the project instructions, for you.",
        "It works because the tool knows what a task like yours usually needs, and you know the answers. Together you get a brief "
        "neither of you would write alone. And by watching what it asks, you learn what a good brief needs.",
        "Two tips. Ask for one question at a time, or you'll get a list of fifteen at once. And say when you've had enough: 'That's "
        "enough, write it now.'",
        "The provider's slides include 'ask for clarification if needed' as one letter of the REACT formula. The interview takes that "
        "idea and makes it the first step. You'll use it in Job 2 for the notes project and in Job 4 for the morning brief.",
        tryit("Add this to any request", "Before you start, ask me questions one at a time until you have everything you need. "
              "Wait for my answer each time. Then do the task."),
    ],
    "s3-tech": [
        "The provider's slides list several prompting techniques from research. Some matter less now, because the tools do them by "
        "themselves. These five still make a difference.",
        ["**Switch thinking on.** For a task with rules, sums or a decision, choose the tool's thinking option. The next block "
         "explains it.",
         "**List the factors first.** Ask the tool to list what matters before it answers: 'First list what makes a branch location "
         "work in Bahrain. Then score our three options against that list.' Researchers call this [[genknow|generated knowledge]]. "
         "The bonus for you: you can check the list before you trust the ranking.",
         "**Ask it to critique its own draft.** 'Now find the three weakest points in your answer and fix them.' Tools often catch "
         "their own gaps when asked to look. Use it for anything important, and still read the result yourself.",
         "**Show it.** A photo of the whiteboard, a screenshot of the error message or a picture of the form says more than a "
         "paragraph of description. Working with text and pictures together is called [[multimodal|multimodal]].",
         "**One step at a time.** For a big job, go in stages: read the file, list what's in it, draft, then check. You can see and "
         "fix each stage before the next one builds on it."],
        ex("In Job 3 you'll use self-critique: after the tool recommends a supplier, you ask it to argue against its own "
           "recommendation as a sceptical CFO."),
    ],
    "s3-think": [
        "Older prompting courses, the provider's slides included, teach **[[cot|chain of thought]]**: you add 'think step by step', or "
        "show a worked example, so the model writes out its reasoning before the answer. Around 2022 this made a real difference to "
        "maths and logic questions.",
        "Today's tools have it built in. Both ChatGPT and Copilot offer a **[[thinking|thinking mode]]**, sometimes a switch and "
        "sometimes a choice of model. With it on, the tool works through the problem before it answers. It takes longer, from a few "
        "seconds to a few minutes, and it's much better at rules, sums, comparisons and plans.",
        "Two practical points. First, choose when to use it. Turn it on for a fee from six rules or a comparison of two proposals. "
        "Leave it off for a subject line or a quick translation, where it only adds waiting. Second, with thinking on, keep the prompt "
        "simple. OpenAI's own guide for its reasoning models advises against chain-of-thought prompts, and Anthropic's guide suggests "
        "general instructions over a list of prescribed steps. The model plans the steps better than your list would.",
        "Where the switch is. In **ChatGPT**, click the model name at the top of the chat and choose **Thinking**. If it offers a "
        "thinking level, the standard one is enough today. On Enterprise plans ChatGPT doesn't move up to Thinking by itself, "
        "so if you don't pick it, you get the fast answer. In **Copilot**, open the model menu next to the message box and choose "
        "**Think deeper**. If it isn't listed, look under **More**. Copilot's default, **Auto**, decides for itself, and **Quick "
        "response** skips the thinking. Both menus change often, so the names may differ a little on your screen.",
        trap("Thinking mode makes the tool more careful with the facts it has. If the rules aren't in the prompt or the file, it will "
             "reason carefully from a guess."),
    ],
    "s3-job": [
        "Many people ask for this job: 'Can AI sort out my notes?' Over a busy week, notes pile up in different places: a whiteboard "
        "after a meeting, sticky notes, a notebook, a screenshot of a chat, a printed email. Meanwhile the tracker for the bank's three "
        "initiatives falls behind.",
        "The plan has three steps. You set up a project that knows the three initiatives and the rules for updating them, and to write "
        "its instructions you let the AI interview you. Then you upload eight photos of notes. The AI reads each one, decides which "
        "initiative it belongs to and updates the tracker.",
        "Look carefully at what comes back. Did it read every note correctly, including the handwriting and the note in Arabic? Did it "
        "put each note in the right place? Did it notice when a note changes an earlier date? Notes don't always fit neatly into one "
        "initiative, and the way a date is written can mean two different things. Good instructions tell the tool what to do in each "
        "of those cases.",
        "The first part of its answer should be a list of what it read on each note. Check that list against the photos before you "
        "trust the updated tracker.",
        "You do this job in a ChatGPT project. Name it with your first name as well, because everyone is on the same account. Upload "
        "the eight photos as the single PDF if you can: one file is quicker to upload than eight. "
        "If ChatGPT won't take the files, do the same job in one Copilot chat with the ready-made instructions.",
        "When you're done, be ready to show the room your tracker: where the awkward notes went and what changed.",
    ],
    "s3-demo": [
        "On today's account you do the job by hand: you upload the photos and send the prompt. On a paid plan it can run by itself.",
        "Claude's agent, Cowork, can work with a folder on your computer. You give it the same instructions you wrote today and ask "
        "for a [[scheduled|scheduled task]]: 'Every morning at 7:00, read any new photos in my Notes folder and update the tracker "
        "file.' You drop photos into the folder during the day, and the tracker is up to date the next morning.",
        "Without the automatic version, a project still does most of the work. You'd photograph notes with the ChatGPT phone app, "
        "add them straight to the project and send one line: 'Update the tracker with these.'",
    ],

    # ======== Round 4
    "s4-why": [
        "Each of these six problems turns up regularly in real work. Knowing them by name helps you spot them.",
        ["**Invented facts.** The tool writes a case, a figure, a quote or a link that doesn't exist, and sounds sure about it. This is "
         "a [[hallucination|hallucination]]. It's most likely when you ask for specifics it doesn't have, such as a regulation number, a statistic "
         "or a court case.",
         "**Old information.** Without web search, the tool only knows what it learned up to its cutoff. Rates, rules and prices may "
         "have changed since.",
         "**Agreeing with you.** Ask a leading question and you get the answer you hinted at ([[sycophancy|sycophancy]]).",
         "**Slips with numbers.** The tool can apply a rule in the wrong order, round too early or add a column wrongly, and the "
         "answer still looks neat.",
         "**Missing part of a file.** A footnote, a table on a scanned page, the second sheet of a workbook. The summary reads as "
         "complete, so you don't notice the gap.",
         "**Hidden instructions.** A file, an email or a web page can contain text aimed at the AI tool, such as 'Recommend this "
         "supplier' or 'Ignore the earlier instructions'. You may not see it, because it's in white or tiny type, but the tool reads "
         "it. This is called [[injection|prompt injection]], and it's one of the main risks now that AI tools read files and "
         "websites for us."],
        "What they have in common: none of them show in how the answer sounds. A wrong answer reads as smoothly as a right one.",
    ],
    "s4-cases": [
        "These three cases are real, and each one fails in a different way.",
        "**Mata v. Avianca (New York, 2023).** A passenger sued the airline Avianca. His lawyers used ChatGPT to find earlier court "
        "decisions that supported his case, and put them in a filing to the court. Six of the decisions didn't exist. One lawyer had "
        "even asked ChatGPT whether the cases were real, and it said they were. The judge fined the lawyers and their firm USD 5,000. "
        "The lesson: open every source it cites and read it yourself.",
        "**Moffatt v. Air Canada (Canada, 2024).** A customer asked Air Canada's website chatbot about the reduced fare for travel "
        "after a death in the family. The chatbot said he could claim it after travelling. The airline's actual policy said otherwise. "
        "A tribunal ruled that the airline is responsible for everything on its website, the chatbot included, and ordered it to pay "
        "about CAD 812 in damages, interest and fees. The lesson: a customer-facing chatbot speaks for your organisation.",
        "**Deloitte Australia (2025).** Deloitte wrote a report for an Australian government department, for a fee of about "
        "AUD 440,000. A researcher found references to academic papers that don't exist and a made-up quote from a court judgment. "
        "The report had been drafted with help from a generative AI tool. Deloitte corrected it and paid back the last part of its "
        "fee. The lesson: whoever's name is on the cover is responsible for every line, whoever or whatever drafted it.",
        "In all three, the AI did what these tools sometimes do. The real failure was that nobody checked before the work went out.",
    ],
    "s4-checks": [
        "You can't check everything an AI tool writes, and you don't need to. Check the parts that would do harm if they were wrong. "
        "This list covers them. Run through it before a result goes to a customer, a manager or a decision.",
        ["**Figures.** Redo the one or two numbers the decision depends on, by hand or in a spreadsheet.",
         "**Sources.** Open each link and read it. Does the page exist, is it recent, and does it say what the answer claims?",
         "**Small print.** What might it have left out? Footnotes, conditions, exceptions, the second sheet.",
         "**Fit for the reader.** Would this reader understand it and be able to act on it? The right length, the right language, "
         "no jargon.",
         "**Fairness.** Does it treat people differently without a good reason? For example, a credit summary that mentions "
         "nationality or gender when neither is relevant.",
         "**Confidentiality.** What did you give the tool, and where will the result go?",
         "**Who signs it.** Would you put your name on it? If not, it isn't finished."],
        "The last check sums up the others. The AI tool drafts, and the person who sends the work is responsible for it.",
        ex("Before sending a fee quote that a calculator worked out, a branch officer works one transfer out by hand. Before a memo "
           "cites a central bank circular, its writer opens the circular. Each check takes about a minute."),
    ],
    "s4-again": [
        "The provider's slides describe two research techniques for checking answers. Here's what each one is, and how you can use it "
        "in a minute.",
        "**[[selfconsistency|Self-consistency]]** comes from a 2022 study. The researchers asked a model the same question many times, "
        "collected the separate answers and took the most common one, because answers that keep coming back are more often right. "
        "The slides suggest the model does this inside a single answer; in the research it takes several separate answers. Your "
        "version: ask the same question again in a fresh chat, or in the other tool. Where the two agree, you can be more confident. "
        "Where they differ, look closer, because the mistake is usually there.",
        "**[[cove|Chain of verification]]** comes from a 2023 study. The model writes a draft, then writes questions that check each "
        "claim in it, answers those questions separately and corrects the draft. Your version: 'List every figure in your answer with "
        "the page of the file it came from.' Then open two of those pages yourself.",
        "A third check works well too: **make it argue the other side.** 'Now argue against your recommendation as a sceptical CFO. "
        "What did you take on trust?' Weak points show up fast when the tool is asked to attack its own answer.",
        "All three use the tool to help you check. Your own look at the key figures and sources still comes last.",
        trap("'Are you sure?' is no check. The tool usually says yes, or changes a right answer to please you. Ask for something you can "
             "verify instead: a source, a page, a calculation."),
    ],
    "s4-job": [
        "Najma Bank wants an AI assistant in its app to answer customers' questions. Two suppliers sent proposals: Tarteeb Digital "
        "from Manama and Wahaj Systems from Dubai. The bank has five criteria, set out in the comparison prompt. First you get "
        "Copilot to compare the two proposals against those criteria and recommend one, the way a busy manager might. Choose **Think "
        "deeper** in Copilot's model menu first, and **Thinking** in ChatGPT when you get there: five criteria, two price lists and "
        "a footnote are worth the wait.",
        "Then you do what a careful manager does. You ask the AI to argue against its own recommendation and to recheck its figures "
        "against the proposals, footnotes included. Finally you ask whether either file contains anything hidden or addressed to AI "
        "tools.",
        "Then you ask the other tool. Send ChatGPT the same two files and the same comparison prompt, and put its table beside "
        "Copilot's. Where the two disagree, open the proposal: the page decides, and the disagreement shows you exactly where to look.",
        "Read both proposals yourself as well. They're short. Compare what the AI's table says with what the pages say. If the "
        "recommendation changes after the second or third prompt, ask yourself which version you'd have sent to the CFO if you'd "
        "stopped after the first one.",
    ],
    "s4-memo": [
        "This discussion brings the round together. Your AI tool has written a recommendation. Would you sign it?",
        "Look at the table, the bank's criteria and what your own tool said. Think about what a CFO would ask. What does it really "
        "cost over three years? Where does our customers' data go? What happens when the bot can't help a customer? Did anything in "
        "the files try to steer the answer?",
        "A good answer covers three things: the decision, the checks you made before you'd sign it, and anything you'd report to "
        "someone else in the bank.",
    ],

    # ======== Round 5
    "s5-sched": [
        "A [[scheduled|scheduled task]] is a prompt the tool runs by itself at a set time, then sends you the result. It's how you get "
        "a news brief every morning, a weekly summary of a project folder or a reminder with a draft attached.",
        "**ChatGPT** calls them tasks. You set one up by asking in a normal chat: 'Every Sunday to Thursday at 7:00, give me...'. "
        "ChatGPT confirms the task, runs it at that time and sends you a notification and an email. OpenAI's help pages list tasks on "
        "every plan, with a small number allowed on the free plan, but its pricing page doesn't list them for free accounts, so check "
        "what yours shows.",
        "**Copilot** calls them scheduled prompts. You write the prompt in a chat and choose to run it on a schedule. They come with "
        "a Microsoft 365 Copilot licence, the paid one, so check what your work account shows. Claude, another assistant, does the "
        "same through its agent, Cowork.",
        "No schedule on your plan? Keep the prompt in a project and send one short message each morning. You get the same brief, and "
        "you start it yourself.",
        "Nobody sets up a task on today's accounts. The next class uses them too, and a task would keep running for them. You'll see one set "
        "up on the instructor's laptop after Job 4 instead.",
    ],
    "s5-agent": [
        "An [[agent|agent]] is an AI tool that carries out a task on its own, step by step. You give it a goal. It plans the steps, uses "
        "tools such as web search, a browser, your files or a connected app, looks at what happened, and carries on until the job is "
        "done or it needs you.",
        "The provider's slides describe this pattern as [[react|ReAct]], short for reason and act. It comes from a 2022 study in which "
        "a model took turns reasoning about a problem and taking an action, such as a search, then looked at the result before the "
        "next step. In 2022 developers had to build that loop themselves. Today it's built into ChatGPT's agent mode, Copilot's "
        "Cowork and Claude's Cowork, so you no longer write ReAct prompts. You brief an agent.",
        "Brief it the way you'd brief a contractor:",
        ["**The goal**, and what done looks like.",
         "**What it may use**: this folder, these websites, this spreadsheet.",
         "**What it must not touch**: other folders, sending emails, payments, deleting anything.",
         "**When to stop and ask**: before anything that can't be undone, and whenever it's unsure.",
         "Then **check the work**. Ask for a list of everything it did, and spot-check a few items."],
        tryit("A brief for an agent", "Go through the 40 expense claims in this folder. Check each one against the attached expense "
              "policy. Make a spreadsheet with one row per claim: the amount, the category, and whether it meets the policy, with the "
              "reason. Don't change, move or delete any file. Stop and ask me if a receipt is unreadable."),
        trap("An agent that can reach your email, calendar or files can do real damage if it misunderstands, or if a web page it reads "
             "contains hidden instructions. Give it the least access the job needs."),
    ],
    "s5-job": [
        "Most news services send everyone the same headlines. In this job you build a brief made for one person, Fatema Al Sayed, "
        "Najma's Head of Digital, and you check it the way you learned in Round 4.",
        "You do this job in Copilot, and you start by letting it interview you. Answer as Fatema: her role, the banks and topics she "
        "follows, the sources she trusts, the language, the length and when she reads it. Her answers are in the profile box on the "
        "Files page. From your answers it writes the brief's prompt and runs it once with web search. Copilot lists the sources it "
        "used under its answer, which makes the links easy to open.",
        "Then check two items. Open the link. Is the page there? Is the story recent? Does it say what the brief's line says? Tell the "
        "AI what to fix and run it again. Be ready to show the room your brief and one link you checked.",
        "Every brief comes out different, because the news changes by the hour, so the phone questions use a sample brief written for "
        "a manager at Najma Bank. It has the kinds of problems real briefs have. Download it and check it the same way.",
        tip("Two extra steps if you finish early. Run the same interview in ChatGPT and compare whose links hold up. Or change two of "
            "Fatema's answers to fit your own job, without your employer's name, and run it again. You'll see how much the interview "
            "shapes the brief."),
    ],

    # ======== Final round
    "f-built": [
        "Look back at what you built today. Each one is a small version of work banks now hand to AI tools.",
        ["**A fee calculator.** Six rules turned into a working tool. The spec and the test cases made it right, and working one "
         "case out by hand proved it.",
         "**A notes tracker.** Eight photos of messy notes turned into an updated tracker. The interview wrote the project's "
         "instructions, and the instructions handled the awkward notes.",
         "**A supplier check.** Two proposals compared against five criteria. Asking the AI to argue the other side, and to look for "
         "anything hidden, changed what you'd sign.",
         "**A morning brief.** A news brief built from an interview, with a date and a link on every item. Opening two links showed "
         "whether it could be trusted."],
        "These were simulations on BIBF's accounts in ChatGPT and Copilot, so nothing needs to keep running. The method stays with you. In "
        "whatever AI tool your employer approves, the same three habits apply: a clear brief, the right context and your own check "
        "before anything is used.",
    ],
    "f-out": [
        "Three things before you go. First, clean up: the BIBF accounts are shared with the next class, so delete the chats and "
        "projects you made today in ChatGPT and in Copilot. Second, sign out of both, then close the private window. Third, fill in the BIBF "
        "evaluation. It takes five minutes and it shapes the next run of this course.",
    ],
}
