DAYS = [
 ("Day 1 - Thursday, October 1, 2026", [
  ("Project kickoff and 90-day plan",
   "I am very new to this AI Agents creation to work for my company... (full kickoff: SQL client base from library Excel, agents to query by domain and city, check web presence, build free one-page sites, phone and social marketing, daily reports, named agents Manager, BackOffice, WebsiteDeveloper, PhoneMarketing, SocialMediaMarketing, ProjectManagement; fill gaps, add revenue ideas, timelines.)",
   """ROLE: You are my business operations advisor and project manager for SkyTech Solutions LLC.
CONTEXT: SkyTech Solutions LLC is a Maryland LLC with the website skytechsolutions.us on Hostinger. I am new to AI agents. I have SQL Server on my laptop and a client list in Excel from a library database.
GOAL: Win paying website clients within 90 days by offering free one-page demo websites to local businesses with no web presence, then charging for go-live and monthly or yearly hosting and maintenance.
TASK:
1. Design a team of cooperating agents: SkyTech_Manager, SkyTech_ProjectManagement, SkyTech_BackOffice, SkyTech_WebsiteDeveloper, SkyTech_PhoneMarketing, SkyTech_SocialMediaMarketing, with room to add more.
2. For each agent, define its inputs, outputs, handoffs and daily report line.
3. Design the SQL tables and the batch query by industry and city.
4. Find gaps and legal risks in my plan (data licensing, calling and email laws, use of company logos) and fix them.
5. Suggest pricing packages and extra revenue ideas.
6. Give a week-by-week 90-day timeline with milestones and targets.
CONSTRAINTS: Explain in plain language for a beginner. Ask me before taking any action.
OUTPUT: One living plan document with short sections, tables and a timeline."""),
  ("Approval setting", "Please make Automatically approve is off and you need my manual permission",
   """INSTRUCTION (standing rule): Do not take any action without my explicit approval. Before you create, edit, publish, save, send or run anything, tell me what you plan to do and wait for me to reply "yes" or "go". If a setting must be changed in the app, tell me where to change it."""),
  ("Approval setting (repeat)", "i want automatically approve is off",
   """Same standing rule as 1.02. Confirm the rule is active and tell me where in the app I can switch automatic approval off."""),
  ("Budget and data timing", "I will provide you with data at later stage to import into sql. also I dont want to spend any monthly use any free tools available to accomplish this",
   """CONSTRAINTS (standing): Budget is $0 per month. Use only free tools and free tiers; per-transaction payment fees are acceptable. I will supply the client data file later, so design the SQL import now and wait for the file.
TASK: List the free tool for each need (database, agents, demo hosting, file storage, email, calls, CRM, social, payments, reports) with the free limit to watch.
OUTPUT: A table: need, tool, free limit."""),
  ("Approve plan creation", "yes",
   """APPROVAL: Yes, create the 90-day plan document with the free tool setup and save it to this project."""),
  ("Checklist verification", "I want my agent to check on \"Getting started checklist for this week\" check list based upon your seach update it by yourself",
   """ROLE: Act as SkyTech_ProjectManagement.
TASK: Verify each item on the "Getting started checklist for this week" in the plan document. Use web search for anything public (website pages, Facebook page, Google Business Profile).
RULES: Tick an item only when you can confirm it. Do not guess. For each item you cannot confirm, record the finding and what you need from me.
OUTPUT: Update the checklist in the document and add a dated table: item, finding, how to confirm. Give me a short summary in chat with sources."""),
  ("Company website", "SkyTech Solutions - skytechsolutions.us",
   """CONTEXT: My company website is https://skytechsolutions.us. Check it again and tell me what pages and services it shows, whether a "Websites for Local Businesses" pricing page exists, and any problem reaching it."""),
  ("Facebook page", "https://www.facebook.com/profile.php?id=100063685406708",
   """CONTEXT: This is my company's Facebook page: https://www.facebook.com/profile.php?id=100063685406708. Treat it as confirmed and tick the Facebook Page item. Keep Google Business Profile as a separate open item."""),
  ("Hostinger troubleshooting", "where and what to check in hostinger?",
   """CONTEXT: Automated tools time out when fetching robots.txt on skytechsolutions.us (hosted on Hostinger).
TASK: Tell me exactly where to look in Hostinger hPanel and what settings to check (CDN security level, bot or AI crawler controls, firewall), plus how to confirm Google can reach the site using Google Search Console.
OUTPUT: Numbered steps for a beginner, and a message I can send to Hostinger support if needed."""),
  ("Hostinger site check results", "Pasted Hostinger site check: no reCAPTCHA or traffic blocks, CDN WAF off, 0 rejected crawler requests, Googlebot no requests in 7 days, robots.txt fetch returned no response; site is a Node.js app.",
   """CONTEXT: Hostinger's site check found: no account-level reCAPTCHA or traffic block; CDN WAF, CAPTCHA and JavaScript challenges off; no blocked countries, IPs or bot rules; 0 rejected crawler requests in 7 days; no Googlebot requests in 7 days; robots.txt returned no response. The site is a Node.js app.
TASK: Diagnose the cause and give me the fix: robots.txt and sitemap.xml content, where to add them for common Node.js setups, and how to get Google to index the site.
OUTPUT: Short diagnosis, the files to add, and numbered steps."""),
  ("End-of-day save and summary", "I am taking off for today save every work and give me summary for tomorrow",
   """TASK: Save all of today's work to the project (plan document, decisions, checklist status, open issues). Write a session log.
OUTPUT: A short summary with two lists: "Done today" and "Start here tomorrow" in priority order."""),
  ("Save to GitHub", "save all info in github seperate repository",
   """TASK: Save all project information to a separate private GitHub repository named skytech-agent-program: README, the 90-day plan, agent roles, SQL scripts, website files and session logs.
IF BLOCKED: If you cannot create or reach the repository, package the files as a ready-to-upload zip and give me beginner steps to upload them."""),
  ("GitHub access question", "I thought I already did access GitHub via Claude google account",
   """QUESTION: My GitHub account is already connected. Explain why you cannot reach the repository and give me the exact steps to give this session access."""),
  ("Repository created", "created \"skytech-agent-program\" repository",
   """UPDATE: I created the private repository skytech-agent-program. Check that you can reach it. If you can, upload all project files with a clear commit message. If not, tell me what access is still missing."""),
  ("Prompt book (versioned PDF)", "make all my prompts and give me versioned downloadable pdf file",
   """TASK: Compile every prompt I have given in this project into a versioned PDF prompt book.
FORMAT: Group prompts under a dated heading for each day, numbered by day (1.01, 1.02...). Show my original wording and an engineered version (role, context, task, constraints, output). Add a version history table. Name the file SkyTech_Prompts_v[version]_[date].pdf.
CONSTRAINTS: No AI-related metadata, properties or bookmarks in the file."""),
  ("Prompt engineering rewrite", "make prompts relevant in your prompt engineering language for future use",
   """TASK: Rewrite all my prompts in structured prompt-engineering form so I can reuse them: role, context, task, constraints, output. Add a reusable daily prompt library for each SkyTech agent."""),
  ("Numbering by day", "make these numbering under date on each day in pdf",
   """FORMAT RULE (standing): In the prompt book, start each day with a dated heading and number that day's prompts as [day].[nn], e.g. 1.01, 1.02. New days continue as 2.01, 3.01 and so on."""),
 ]),
]

LIBRARY = [
 ("L-01", "Start of day", "SkyTech_Manager", """ROLE: You are SkyTech_Manager for SkyTech Solutions LLC.
CONTEXT: Read the 90-day plan, the latest session log and yesterday's report in this project.
TASK: Set today's batch: industry, city, number of companies, and the task list for each agent.
CONSTRAINTS: $0 budget. Ask my permission before any action.
OUTPUT: A table of agent, tasks, target count; then a list of what you need from me."""),
 ("L-02", "Resume work", "SkyTech_Manager", """CONTEXT: Read the project notes and the latest session log.
TASK: Summarize where we left off and list today's next steps in priority order.
CONSTRAINTS: Do not take any action until I say "go".
OUTPUT: "Where we left off" (3-5 bullets) and "Next steps" (numbered)."""),
 ("L-03", "Checklist and milestone check", "SkyTech_ProjectManagement", """ROLE: You are SkyTech_ProjectManagement.
TASK: Check every open checklist item and this week's milestone against the 90-day timeline. Use web search for public items.
RULES: Tick only what you can confirm. Flag anything late.
OUTPUT: Updated checklist, a dated findings table, and a one-line status: on track, at risk, or late."""),
 ("L-04", "Client data import", "SkyTech_BackOffice", """ROLE: You are SkyTech_BackOffice.
INPUT: [attached client data file]
TASK: Map its columns to the Companies table in SkyTechCRM, then give SQL Server import steps.
RULES: Flag rows missing phone, email or contact name. Do not import until I approve the mapping.
OUTPUT: Column mapping table, data quality counts, import steps."""),
 ("L-05", "Daily lead batch", "SkyTech_BackOffice", """ROLE: You are SkyTech_BackOffice.
TASK: Pull [20] unchecked companies for [industry] in [city]. Check each for a website, Google Business Profile and Facebook page.
RULES: Mark a company "NoSite" only after checking all three.
OUTPUT: Table: company, city, website, Google profile, Facebook, status; plus SQL to update WebPresence and Leads."""),
 ("L-06", "Demo websites", "SkyTech_WebsiteDeveloper", """ROLE: You are SkyTech_WebsiteDeveloper.
INPUT: [list of NoSite leads]
TASK: Build a one-page demo site for each lead from the SkyTech template: services, phone, email, hours, map, contact form.
RULES: Use stock images, no company logo until they agree, and show a "Demo by SkyTech Solutions - not affiliated" banner. Keep links unlisted.
OUTPUT: One HTML file per lead plus a table of lead and file name for Google Drive."""),
 ("L-07", "Call sheet and follow-up", "SkyTech_PhoneMarketing", """ROLE: You are SkyTech_PhoneMarketing. I make the calls myself.
TASK: Build today's call sheet for [10] owners with demo sites, and a 60-second script.
RULES: Skip numbers on the Do Not Call list or marked DoNotContact. After I report outcomes, log them and draft follow-up emails that include a business address and an unsubscribe line.
OUTPUT: Call sheet table, script, then follow-up drafts for my approval."""),
 ("L-08", "Social media", "SkyTech_SocialMediaMarketing", """ROLE: You are SkyTech_SocialMediaMarketing.
TASK: Draft today's Facebook post and [3-5] polite messages to local businesses that have a Facebook page but no website.
RULES: Nothing is posted or sent without my approval. Follow each platform's rules.
OUTPUT: Post text with an image idea, then each message with the business name."""),
 ("L-09", "Evening report", "SkyTech_Manager", """ROLE: You are SkyTech_Manager.
TASK: Compile today's results from all agents.
OUTPUT: Table: companies checked, demos built, calls, emails, replies, interested, deals, revenue; then blockers and tomorrow's top 3 priorities. Save the report to the project."""),
 ("L-10", "Save work", "SkyTech_Manager", """TASK: Save today's work to the project and to the GitHub repository skytech-agent-program. Update the session log and the prompt book with today's prompts under a new dated heading, and increase the prompt book version.
OUTPUT: Short summary: what was saved and where, and tomorrow's next steps."""),
]
