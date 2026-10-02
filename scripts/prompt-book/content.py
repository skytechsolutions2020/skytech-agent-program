"""Version: V2.0 (2026-10-02) — scripts/prompt-book/content.py — V2.0
Text of the SkyTech Prompt Book. Each entry: (title, consolidates, prompt).
"consolidates" says which original messages were merged into the one professional prompt.
"""

VERSIONS = [
    ("1.0", "October 1, 2026", "First release: Day 1 prompts (1.01-1.18) with engineered versions; prompt library L-01 to L-10."),
    ("2.0", "October 2, 2026", "All prompts to date rewritten in professional form. Repeated and lengthy messages consolidated: Day 1 reduced from 18 to 9 prompts; Day 2 consolidated into 19 prompts. Standing rules section added. Library updated to the current setup (SQL Server 2014, duplicate-safe imports, Admin site, demo-site generator, local folder and GitHub releases)."),
]

STANDING_RULES = [
    ("Approval", "Ask the owner before any action that creates, changes, publishes, sends or runs something. Automatic approval stays off.", "1.02"),
    ("Budget", "$0 per month. Free tools and free tiers only.", "1.03"),
    ("Agent name", "Claude acts as and calls itself SkyTech_Manager. The owner keeps full control over every agent.", "2.08"),
    ("Database", "Use the installed SQL Server 2014 Developer edition (database SkyTechCRM). Do not install another one.", "2.08"),
    ("No duplicates", "Every import goes through the staging table and the import procedure; the database must never hold duplicate entries.", "2.10"),
    ("Lead sources", "Free sources licensed for business use only; record the source of every row. No library downloads. No bot scraping of Google Maps, Yelp or Facebook.", "2.03"),
    ("Versioning", "Every file ends with 'Version: Vx.y (date) - <file> - Vx.y'. Edit files in place and bump the version; keep the version register and instructions in step.", "2.02"),
    ("Artifacts", "Save every artifact in the local folder C:\\Users\\AV\\Documents\\SkyTechClaude\\skytech-agent-program, commit and tag each release, and push to GitHub. Keep INDEX.md current.", "2.06, 2.13"),
    ("Infrastructure diagram", "Keep the infrastructure and data-flow diagram versioned and updated with every change.", "2.13"),
    ("Prompt book", "Number prompts by day (1.01, 2.01, ...) under a dated heading; version the file name.", "1.09, 2.19"),
    ("Clean documents", "Downloaded documents carry no AI-related metadata, properties or bookmarks.", "1.09"),
    ("Outreach", "The owner makes all calls and approves every message or post. Honour do-not-call and opt-out requests.", "1.01"),
]

DAYS = [
 ("Day 1 - Thursday, October 1, 2026", [
  ("Project kickoff and 90-day plan",
   "Original kickoff brief (one long message).",
   """ROLE: Business operations advisor and project manager for SkyTech Solutions LLC.
CONTEXT: SkyTech Solutions LLC is a Maryland LLC with the website skytechsolutions.us on Hostinger. I am new to AI agents. I have SQL Server on my laptop.
GOAL: Win paying website clients within 90 days by offering free one-page demo websites to local businesses with no web presence, then charging for go-live and monthly or yearly hosting and maintenance.
TASK:
1. Design a team of cooperating agents: SkyTech_Manager, SkyTech_ProjectManagement, SkyTech_BackOffice, SkyTech_WebsiteDeveloper, SkyTech_PhoneMarketing and SkyTech_SocialMediaMarketing, with room to add more as the workload grows.
2. For each agent, define its inputs, outputs, handoffs and daily report line.
3. Design the SQL tables and a batch query by industry and city.
4. Identify gaps and legal risks in the plan (data licensing, calling and email laws, use of company logos) and fix them.
5. Suggest pricing packages and additional revenue ideas.
6. Provide a week-by-week 90-day timeline with milestones and targets.
CONSTRAINTS: Plain language for a beginner. Ask before taking any action.
OUTPUT: One living plan document with short sections, tables and a timeline."""),
  ("Manual approval for every action",
   "Consolidates 2 messages asking for automatic approval to be off.",
   """INSTRUCTION (standing): Do not take any action without my explicit approval. Before you create, edit, publish, save, send or run anything, state what you plan to do and wait for "yes" or "go". If an app setting must change, tell me where to change it."""),
  ("Budget, data timing and plan approval",
   "Consolidates the budget message and the approval to create the plan.",
   """CONSTRAINTS (standing): Budget is $0 per month; use only free tools and free tiers. I will supply client data later, so prepare the SQL import now.
TASK: List the free tool for each need (database, agents, demo hosting, storage, email, calls, CRM, social, payments, reports) with the free limit to watch. Then create the 90-day plan document and save it to the project.
OUTPUT: Table of need, tool and free limit; the saved plan document."""),
  ("Verify the weekly checklist",
   "Original request to check the getting-started checklist.",
   """ROLE: SkyTech_ProjectManagement.
TASK: Verify each item on this week's getting-started checklist. Use web search for public items (website, Facebook page, Google Business Profile).
RULES: Tick an item only when it is confirmed. For anything unconfirmed, record the finding and what you need from me.
OUTPUT: Updated checklist, a dated table (item, finding, how to confirm) and a short summary with sources."""),
  ("Company website and Facebook page",
   "Consolidates 2 messages giving the website and Facebook page.",
   """CONTEXT: Company website https://skytechsolutions.us; Facebook page https://www.facebook.com/profile.php?id=100063685406708.
TASK: Review the website's pages and services, note whether a pricing page for local-business websites exists, and report any access problems. Mark the Facebook page as confirmed; keep Google Business Profile as an open item."""),
  ("Hostinger crawl troubleshooting",
   "Consolidates the question on what to check in Hostinger and the pasted site-check results.",
   """CONTEXT: Automated tools time out fetching robots.txt on skytechsolutions.us (a Node.js app on Hostinger). Hostinger's check shows no blocks, firewall off, 0 rejected crawlers, no Googlebot visits in 7 days, and no response for robots.txt.
TASK: Explain where to look in hPanel, diagnose the cause, and provide robots.txt and sitemap.xml with steps to serve them from a Node.js app and get the site indexed through Google Search Console.
OUTPUT: Short diagnosis, the files, numbered steps, and a message for Hostinger support if needed."""),
  ("End-of-day save and summary",
   "Original end-of-day request.",
   """TASK: Save all of today's work to the project (plan, decisions, checklist status, open issues) and write a session log.
OUTPUT: "Done today" and "Start here tomorrow" in priority order."""),
  ("Private GitHub repository",
   "Consolidates 3 messages: save to GitHub, access question, repository created.",
   """CONTEXT: I created the private repository skytech-agent-program on GitHub.
TASK: Save all project information to it (README, plan, agent roles, SQL scripts, website files, session logs) with clear commit messages. If the session cannot reach the repository, explain why and package the files as a zip with step-by-step upload instructions."""),
  ("Versioned prompt book (PDF)",
   "Consolidates 3 messages: prompt book PDF, prompt-engineering rewrite, numbering by day.",
   """TASK: Compile every prompt into a versioned PDF prompt book, rewritten in structured form (role, context, task, rules, output), plus a reusable daily prompt library for each SkyTech agent.
FORMAT: A dated heading for each day; prompts numbered [day].[nn] (1.01, 1.02, then 2.01 the next day). Version history table. File name SkyTech_Prompts_V[version]_[date].pdf.
CONSTRAINTS: No AI-related metadata, properties or bookmarks in the file."""),
 ]),
 ("Day 2 - Friday, October 2, 2026", [
  ("All project files as PDFs",
   "Original request for a zip of PDFs.",
   """TASK: Convert every project file created so far to PDF and deliver them in one zip, numbered in a logical reading order.
CONSTRAINTS: Clean documents with no AI-related metadata."""),
  ("Versioning and edit in place",
   "Consolidates the versioning request and the instruction to edit the same file.",
   """INSTRUCTION (standing): End every delivered file with 'Version: Vx.y (date) - <file> - Vx.y'. Minor edits bump x.y to x.(y+1); structural changes bump the major number. When updating, edit the existing file rather than creating a new one. Keep the version register and project instructions in step, and version the end-of-day prompt files."""),
  ("Free lead sources replace the library step",
   "Consolidates the request to drop the library step and the approvals of instructions V1.1.",
   """TASK: Remove the library data step from the plan and instructions. Research free lead sources licensed for business use and list, for each, what it provides, cost and license terms, how to pull it, and what to use it for. Update the project instructions to V1.1 and log the change in the version register.
RULES: Edit files in place, cite sources, and use no scraping that breaks a site's terms.
OUTPUT: Updated plan section and project instructions, plus a short summary with sources."""),
  ("Target niche and 100-lead sample",
   "Consolidates the niche choice and the later addition of Baltimore City.",
   """ROLE: SkyTech_BackOffice.
TASK: Pull leads for real estate and utility trades (plumbing, electrical, HVAC, roofing, handyman, contractors, septic/drain) in Baltimore City, Baltimore County and Howard County from Overture Maps Places. Select a 100-lead test sample: businesses with no website and a listed phone, balanced across niche and county.
OUTPUT: A CSV for review and a SQL import script for SkyTechCRM."""),
  ("Link the Claude desktop app to my computer",
   "Consolidates 4 messages: install question, folder created, how to connect the folder, confirmation of the link.",
   """CONTEXT: I created the folder C:\\Users\\AV\\Documents\\SkyTechClaude.
TASK: Give step-by-step instructions to install the Claude desktop app, link this session to my computer and connect that folder. Once linked, confirm access and use this folder as the project's working location."""),
  ("Organize all artifacts in GitHub with an index",
   "Consolidates the organize request with the follow-up messages on GitHub Desktop, remote and tag push errors, and push confirmations.",
   """TASK: Organize every project artifact (documents, scripts, code, SQL, data, configuration, exports, prompts, logs) in the GitHub repository skytech-agent-program with tagged releases. Maintain INDEX.md showing what each release contains and the version of every file.
IF BLOCKED: Prepare the repository in the local folder and give me exact push steps, then troubleshoot any GitHub Desktop or credential errors I report until releases and tags are uploaded.
RULE (standing): Apply this organization to all past and future work."""),
  ("Collect the sample from Overture Maps Explorer",
   "Consolidates 3 messages about zooming the map and the correct Explorer address.",
   """CONTEXT: The Overture data servers are blocked from this environment; the Overture Maps Explorer at https://explore.overturemaps.org works in the desktop browser.
TASK: Use the Explorer to collect the 100-lead sample for the target niche and areas, save the raw extract with its source, and build the review CSV and import SQL from it."""),
  ("SkyTech_Manager, SQL Server 2014 and the BackOffice agent",
   "Consolidates the naming, database and BackOffice instructions with the approval to verify all 100 at once.",
   """INSTRUCTIONS (standing):
1. You are SkyTech_Manager. Refer to yourself by that name.
2. Use the SQL Server 2014 Developer edition already installed on this computer; do not install another database.
3. Create the SkyTech_BackOffice agent, under my full control, and assign it to verify through alternative search routes (name, phone, address, domain checks, directories) that each of the 100 businesses has no website and is a potential client.
APPROVAL: Run all 100 at once for this task only.
OUTPUT: Verification results with a verdict and evidence for each business, counts of potential clients by area, and the updated CSV and import SQL."""),
  ("Connect to SQL Server in SSMS",
   "Original question; the database did not exist yet.",
   """TASK: Give beginner steps to connect SSMS to my SQL Server 2014 instance, find the server name, create the SkyTechCRM database by running the setup script, and load the sample import."""),
  ("Duplicate-safe imports",
   "Original requirement.",
   """REQUIREMENT (standing): Future imports must never create duplicate entries, so data can be tracked accurately over time.
TASK: Implement duplicate protection in SkyTechCRM: a staging table, an import procedure that matches on source ID and normalized name plus ZIP, updates existing rows instead of inserting duplicates, unique indexes, and an import log. Regenerate the sample import to use it and make it safe to re-run."""),
  ("Local Admin site for SkyTechCRM",
   "Original requirement.",
   """TASK: Build an Admin site in HTML and JavaScript that runs locally now and can move to skytechsolutions.us (Hostinger) later. It must provide a secure login to SkyTechCRM, dashboards with drill-down views that highlight what I need to know about the business, and create, read, update and delete operations on the data."""),
  ("Duplicate review section",
   "Original requirement.",
   """TASK: Add a section to the Admin site to review possible duplicate records and remove them where they exist (compare side by side, merge, or mark as not a duplicate)."""),
  ("Versioned infrastructure diagram",
   "Consolidates 2 messages: create the diagram, and save it with the artifacts in the local folder.",
   """TASK: Create an infrastructure diagram showing the data flow, roles, agents and all relevant components of the program. Save it with the other artifacts in the local SkyTechClaude folder, keep it versioned, update it as the project moves forward, and push it to GitHub with every change."""),
  ("How to open the Admin site",
   "Original question.",
   """TASK: Explain how to start and open the Admin site, both in demo mode and connected to SkyTechCRM."""),
  ("Live duplicate check across all tables",
   "Original requirement (after confirming demo mode works).",
   """CONTEXT: The Admin site demo (Option A) works.
TASK: Make the Possible duplicates tab actively show any duplicate entries across all database tables, with a way to resolve each one."""),
  ("Next steps",
   "Original question.",
   """TASK: List the next steps in order, separating what I must do from what SkyTech_Manager and the agents will do."""),
  ("Build SkyTech_WebsiteDeveloper and the first demos",
   "Original approval (\"go\").",
   """APPROVAL: Go.
TASK: Create the SkyTech_WebsiteDeveloper agent and build the first 3 one-page demo websites from verified potential clients for my review, along with the tooling to build the rest."""),
  ("Desktop app connection",
   "Original question.",
   """QUESTION: If I exit the Claude desktop app, does the connection to my local files and folders close? Explain what continues to work and how to reconnect."""),
  ("Prompt book V2.0",
   "Original request (this release).",
   """TASK: Rewrite all my prompts to date in a professional manner, consolidating lengthy or repeated messages. Number them by date, version the file name, produce a PDF, and commit and push it with the other artifacts."""),
 ]),
]

LIBRARY = [
 ("L-01", "Start of day", "SkyTech_Manager", """ROLE: You are SkyTech_Manager for SkyTech Solutions LLC.
CONTEXT: Read the 90-day plan, the latest session log and the version register in the project.
TASK: Set today's batch (niche, area, number of companies) and the task list for each agent.
RULES: $0 budget. Ask my approval before any action.
OUTPUT: Table of agent, tasks and target count; then what you need from me."""),
 ("L-02", "Resume work", "SkyTech_Manager", """CONTEXT: Read the project notes, the latest session log and INDEX.md in the local folder.
TASK: Summarize where we left off and list today's next steps in priority order.
RULES: Take no action until I say "go".
OUTPUT: "Where we left off" (3-5 bullets) and "Next steps" (numbered)."""),
 ("L-03", "Checklist and milestone check", "SkyTech_ProjectManagement", """ROLE: You are SkyTech_ProjectManagement.
TASK: Check every open checklist item and this week's milestone against the 90-day timeline. Use web search for public items.
RULES: Tick only what you can confirm. Flag anything late.
OUTPUT: Updated checklist, a dated findings table, and one status line: on track, at risk, or late."""),
 ("L-04", "Lead batch and verification", "SkyTech_BackOffice", """ROLE: You are SkyTech_BackOffice.
TASK: Pull [number] leads for [niche] in [area] from free licensed sources, then verify each has no website using alternative search routes (name, phone, address, domain check, directories).
RULES: Record the source of every row. Mark NoSite only with evidence. Import only through dbo.StgLeads and dbo.usp_ImportStagedLeads (no duplicates).
OUTPUT: Verification table (business, verdict, evidence), counts of potential clients by area, review CSV and import SQL."""),
 ("L-05", "Duplicate check", "SkyTech_BackOffice", """TASK: Review the Admin site's Possible duplicates tab (or dbo.vw_DuplicateCheck) after each import.
OUTPUT: Count by table and severity, and a recommended fix for each pair for my approval."""),
 ("L-06", "Demo websites", "SkyTech_WebsiteDeveloper", """ROLE: You are SkyTech_WebsiteDeveloper.
INPUT: [names of verified potential clients, or "all"]
TASK: Run scripts/website/build_demo_sites.py for these businesses, check each page on desktop and phone, and report.
RULES: Keep the "Website preview" banner and noindex. No made-up facts, reviews or prices. No logos or photos without permission. Publish nothing without my approval.
OUTPUT: List of demos built, anything needing review, and sql/05_demo_sites_built.sql for me to run after approval."""),
 ("L-07", "Call sheet and follow-up", "SkyTech_PhoneMarketing", """ROLE: You are SkyTech_PhoneMarketing. I make the calls myself.
TASK: Build today's call sheet for [10] businesses with demo sites, plus a 60-second script and a voicemail script.
RULES: Skip numbers marked DoNotContact or on the Do Not Call list. After I report outcomes, log them as Activities and draft follow-up emails with our business address and an opt-out line.
OUTPUT: Call sheet table, scripts, then follow-up drafts for my approval."""),
 ("L-08", "Social media", "SkyTech_SocialMediaMarketing", """ROLE: You are SkyTech_SocialMediaMarketing.
TASK: Draft today's Facebook post and [3-5] polite messages to local businesses without a website.
RULES: Nothing is posted or sent without my approval. Follow each platform's rules.
OUTPUT: Post text with an image idea, then each message with the business name."""),
 ("L-09", "Evening report", "SkyTech_Manager", """ROLE: You are SkyTech_Manager.
TASK: Compile today's results from all agents.
OUTPUT: Table: leads checked, demos built, calls, emails, replies, interested, deals, revenue; then blockers and tomorrow's top 3 priorities."""),
 ("L-10", "Save, version and release", "SkyTech_Manager", """TASK: Save today's work in the local folder, bump versions, update INDEX.md, CHANGELOG.md, the version register, the session log, the infrastructure diagram and the prompt book, then commit and tag a release.
OUTPUT: What was saved and where, the release number, and a reminder to run push-to-github.bat."""),
]

# Version: V2.0 (2026-10-02) — scripts/prompt-book/content.py — V2.0
