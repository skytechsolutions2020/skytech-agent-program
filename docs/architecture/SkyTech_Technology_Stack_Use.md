# SkyTech Technology Stack Use

Version V1.2 · 2026-10-10 · release R4.2 · architecture diagram V1.7 · maintained by SkyTech_Manager

Plain-language list of every tool and technology the SkyTech program uses. The full document with the six-step picture and the architecture diagram is `docs/architecture/SkyTech_Technology_Stack_Use.pdf` (and .html).

**47** tools listed · **35** in use or ready · **$0** new monthly spend (44 free or included; the rest use your existing Claude plan, Hostinger plan and phone).

## How SkyTech works, in six steps

1. **Find businesses**: Free public map data lists local plumbers, electricians, contractors and real estate offices, and shows which ones list a website. _Tools: Overture Maps, Claude BackOffice, Desktop browser._
2. **Check & store**: Claude double-checks each business really has no website, then the list is saved in our own database, with duplicates blocked. _Tools: Web search, SQL Server 2014, SSMS._
3. **Build a free website**: Claude designs a one-page website for each business: its name, services, phone, a concept logo and free-licence photos. _Tools: Claude WebsiteDeveloper, HTML / CSS, Pexels photos._
4. **You review**: You sign in to your own Admin website to see dashboards, edit any record or demo site, and approve before anything is sent. _Tools: Admin site, Node.js, Chart.js._
5. **Reach out**: You call the business owner and follow up by email or social media, using scripts SkyTech_Manager prepares for you. _Tools: Phone (you), Email (free), Facebook._
6. **Win & host**: When a business says yes, the site goes live on free or low-cost hosting and they pay a setup fee plus a monthly plan. _Tools: Netlify (free), Hostinger, Monthly plan._

Always running in the background: SkyTech_Manager (Claude) coordinates and reports; Git + GitHub keep a backed-up history of every file; Version register and CHANGELOG record every change; logs and SKY error codes record every problem; Claude desktop app links Claude to your SkyTechClaude folder.


## 1 · Finding businesses

| Tool / technology | What it is | What we use it for | Cost | Where it runs | Status |
| --- | --- | --- | --- | --- | --- |
| **Overture Maps Places** | A free, open database of places and businesses, published by a foundation backed by Amazon, Meta, Microsoft and TomTom. | Main list of local businesses, including whether each one lists a website. | Free (open licence) | explore.overturemaps.org, opened in the Claude desktop browser | In use |
| **Foursquare Open Source Places** | A free, open dataset of business locations. | Fills gaps in the Overture list. | Free | Downloaded file | Planned |
| **OpenStreetMap** | A world map built by volunteers, free to use. | Extra small businesses not in other lists. | Free | Internet | Planned |
| **Maryland Business Express** | The State of Maryland's business registry search. | Confirms a business is active and shows the owner or agent name. | Free | Website (manual look-up) | Planned |
| **MD Dept. of Labor licence look-up** | The State's search for trade licences. | Confirms licences (MHIC, plumbing, electrical) before we contact a business. | Free | Website (manual look-up) | Planned |
| **Google Places API** | Google's business-listing service for programs. | Spot checks only, inside the free monthly allowance. | Free tier | Internet | Planned |
| **Chamber and county directories** | Local member and business lists. | Manual look-ups for extra leads. | Free | Websites | Planned |

## 2 · The AI team

| Tool / technology | What it is | What we use it for | Cost | Where it runs | Status |
| --- | --- | --- | --- | --- | --- |
| **Claude (Anthropic), in Cowork** | An AI assistant that does the work of the named SkyTech agents. | SkyTech_Manager, BackOffice and WebsiteDeveloper: plans, checks leads, builds sites, keeps files and reports to you. | Your existing Claude plan (no added cost) | claude.ai and the Claude desktop app | In use |
| **Claude Project** | A shared space with instructions and documents that every Claude session reads. | Project instructions, version register, daily prompt files. | Included | claude.ai | In use |
| **Claude desktop app (linked computer)** | The app that lets Claude work inside your SkyTechClaude folder and use a built-in browser. | Reading and saving files, running scripts, collecting leads and photos. | Free app | Your Windows laptop | In use |
| **Saved skill: skytech-backoffice** | A saved set of instructions Claude reuses. | Runs SkyTech_BackOffice the same way every time. | Included | Claude | In use |
| **Scheduled tasks** | Claude jobs that run on a timer. | Daily versioning run: prompt file and version register. | Included | Claude (cloud) | In use |
| **Claude Docs living document** | An online document you can read and edit. | The 90-Day Plan. | Included | claude.ai | In use |

## 3 · Storing & checking data

| Tool / technology | What it is | What we use it for | Cost | Where it runs | Status |
| --- | --- | --- | --- | --- | --- |
| **Microsoft SQL Server 2014 Developer Edition** | A database: a very organised set of tables, like spreadsheets that check each other. | SkyTechCRM: companies, leads, activities and demo sites, with duplicate entries blocked. | Free edition (already installed) | Your laptop (database not created yet) | Installed |
| **SQL Server Management Studio (SSMS)** | The program used to open the database and run its scripts. | Running sql/01, the lead import, sql/04 and sql/05. | Free | Your laptop | Ready |
| **SQL scripts (T-SQL)** | Step-by-step instructions for the database. | Create the tables, import leads without duplicates, load the demo sites. | Free (ours) | sql/ folder | Ready |

## 4 · Your Admin website

| Tool / technology | What it is | What we use it for | Cost | Where it runs | Status |
| --- | --- | --- | --- | --- | --- |
| **Node.js** | The engine that runs JavaScript programs on a computer. | Runs the Admin site and the demo-site builder. | Free | Your laptop | Ready |
| **Express, express-session, dotenv** | Building blocks for a small web server. | Admin pages, sign-in sessions and settings. | Free | Your laptop | Ready |
| **bcryptjs** | A password scrambler. | Stores Admin site passwords scrambled so they cannot be read (managed on the Logins screen). | Free | Your laptop | Ready |
| **mssql, msnodesqlv8, ODBC driver** | Connectors between Node.js and SQL Server. | Lets the Admin site read and save database records. | Free | Your laptop | Ready |
| **Security layer (security.js)** | The site's locks and alarms, written by us. | Blocks password guessing, forged requests from other websites and request floods; signs you out when idle; strict browser rules (CSP). | Free (ours) | Your laptop | Ready |
| **Logging + error codes (logger.js, errors.js)** | A diary of everything the site does, and a numbered list of every possible problem. | Each problem shows a code like SKY-DB-001 that the Troubleshooting Guide explains; logs are kept 30 days with passwords hidden. | Free (ours) | Your laptop | Ready |
| **Doctor (npm run doctor)** | A one-command health check. | Checks settings, packages, database, backups and GitHub safety, and tells you exactly how to fix anything wrong. | Free (ours) | Your laptop | Ready |
| **Chart.js** | A library for drawing charts. | Dashboard charts you can click to drill down. | Free | Inside the Admin site | Ready |
| **HTML, CSS, JavaScript** | The basic building blocks of every web page. | The Admin screens and every demo site. | Free | Browser | In use |

## 5 · Demo websites

| Tool / technology | What it is | What we use it for | Cost | Where it runs | Status |
| --- | --- | --- | --- | --- | --- |
| **Demo-site builder (render.js, build-demos.js)** | Our own template program. | Turns each business's design file or database record into a finished one-page website. | Free (ours) | admin-site folder | In use |
| **Pexels** | A free stock-photo library; photos may be used commercially. | Real photos for banners and service cards (credited in the footer). | Free licence | Internet | In use |
| **Google Fonts** | A free library of web typefaces. | Professional fonts for each design. | Free | Internet | In use |
| **Concept logos and illustrations (SVG)** | Drawings made in code, original to each site. | Concept logos and artwork until the business gives us theirs. | Free (ours) | Inside each page | In use |
| **Netlify** | Free website hosting. | A shareable link for each approved demo. | Free tier | Internet | Planned |

## 6 · Reaching out & our presence

| Tool / technology | What it is | What we use it for | Cost | Where it runs | Status |
| --- | --- | --- | --- | --- | --- |
| **Phone (owner)** | You make every call yourself. | Calling business owners (US calling rules, TCPA). | Existing phone | You | Next |
| **Gmail / Brevo free** | Email sending. | Follow-up emails you approve, with an opt-out line. | Free tier | Internet | Planned |
| **Facebook Page** | SkyTech's page on Facebook. | Posts and messages you approve. | Free | Internet | Live |
| **Google Business Profile** | Your listing on Google Maps and Search. | Being found by local customers. | Free | Internet | To create |
| **Google Search Console** | Google's website health tool. | Getting skytechsolutions.us indexed and checked. | Free | Internet | Planned |
| **Hostinger** | The web host for skytechsolutions.us. | Company website; later the Admin site. | Existing plan | Internet | Live |

## 7 · Safety net: files & backup

| Tool / technology | What it is | What we use it for | Cost | Where it runs | Status |
| --- | --- | --- | --- | --- | --- |
| **Git** | A change-tracker that keeps every version of every file. | Each change is saved as a numbered release (R1.0, R2.0 ...). | Free | Your laptop | In use |
| **GitHub (private repository)** | An online, private backup of the Git history. | Off-site copy of all work: skytech-agent-program. | Free | Internet | In use |
| **GitHub Desktop + push-to-github.bat** | One-click upload tools. | Sending new releases to GitHub. | Free | Your laptop | In use |
| **Secret scan (scan-secrets.js)** | A check that runs before every upload to GitHub. | Stops passwords, keys or the .env settings file from ever being uploaded. | Free (ours) | Your laptop | Ready |
| **SQL Server backup (usp_BackupSkyTechCRM)** | A verified copy of the whole database. | Weekly backup to C:\SkyTechBackups, checked so it can really be restored. | Free | Your laptop | Ready |
| **Version register, INDEX, CHANGELOG** | Our record books. | Which version of every file is current and what changed. | Free (ours) | config/ and repository root | In use |

## 8 · Behind-the-scenes helpers

| Tool / technology | What it is | What we use it for | Cost | Where it runs | Status |
| --- | --- | --- | --- | --- | --- |
| **Python 3** | A popular programming language. | Lead scripts, prompt book, the diagram and this document. | Free | Your laptop (Claude runs it) | In use |
| **ReportLab** | A PDF maker for Python. | The Prompt Book PDF. | Free | Your laptop | In use |
| **Playwright + Chromium** | An automated web browser. | Turning diagrams into PDF/PNG and testing pages on phone and desktop sizes. | Free | Claude workspace | In use |
| **pypdf** | A PDF tool. | Cleans PDF properties so documents carry no AI traces. | Free | Claude workspace | In use |
| **Markdown** | A simple text format for documents. | Logs, role files and daily prompt files. | Free | Repository | In use |

## Words you may see

| Word | Meaning |
| --- | --- |
| **Database** | A set of linked tables that stores records and checks them; ours is called SkyTechCRM. |
| **CRM** | Customer relationship management: keeping track of every business we contact and where each one stands. |
| **Script** | A saved list of instructions a computer follows. |
| **Lead** | A business that might become a customer. |
| **Demo site** | A free sample website we build to show a business what it could have. |
| **Repository / release** | The project folder with its full change history; a release is a numbered snapshot (for example R3.4). |
| **Hosting** | A service that keeps a website online so anyone can open it. |
| **API** | A doorway that lets one program ask another for data. |
| **Open licence / free licence** | Permission to use data or photos without paying, under stated rules. |
| **noindex** | A tag that keeps a page out of Google until we are ready to publish it. |
| **Error code** | A short label such as SKY-DB-001 that points to one problem and its fix in the Troubleshooting Guide. |
| **Log** | A file where the program writes down what it did and any problem, with the time. |
| **CSRF / CSP** | Protections that stop other websites from making your browser change your data or run unwanted code. |

## Change log

| Version | Date | Change |
| --- | --- | --- |
| V1.0 | 2026-10-10 | First version: one-minute journey picture, architecture diagram, technology stack in plain words, costs, glossary. |
| V1.1 | 2026-10-10 | R4.0: security layer, logging and error codes, doctor, secret scan and verified database backups added; diagram V1.6. |
| V1.2 | 2026-10-10 | R4.2: Admin site manages its own logins (create, edit, disable, reset password); diagram V1.7. |

---
Version: V1.2 (2026-10-10) — SkyTech_Technology_Stack_Use.md — V1.2
