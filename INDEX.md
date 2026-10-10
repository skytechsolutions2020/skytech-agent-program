# SkyTech Repository Index

Quick reference: what each release contains and the version of every file. Releases are git tags (`git checkout R1.0` to see an old release).

## Releases

| Release | Date | Summary |
| --- | --- | --- |
| R4.1 | 2026-10-10 | Fix: sql/06 V1.1 (DENY on the backup procedure ran before it was created, Msg 15151) |
| R4.0 | 2026-10-10 | Enterprise security, error codes and logging: Admin site V2.0 (CSP, CSRF, rate limit, lockout, session timeouts, System log), 65-code error catalog, JSON logs, npm run doctor, secret scan before push, sql/06 (least-privilege role, append-only audit, verified backups, ErrorLog), comments in every file; Security Architecture, Troubleshooting Guide and Code Documentation V1.0; diagram V1.6, Technology Stack Use V1.1; instructions V1.9 |
| R3.5 | 2026-10-10 | Technology Stack Use listed as a versioned artifact: README V2.6 key-documents table, Markdown copy (repo + Claude project), generator V1.1; instructions V1.8 |
| R3.4 | 2026-10-10 | Technology Stack Use document V1.0 (plain-language tool list merged with the architecture diagram V1.5); project instructions V1.7; Day 6–10 prompt files; log 2026-10-10 |
| R3.3 | 2026-10-05 | C&A Plumbing demo with free-licence Pexels photos (banner, one per service, About), drop-and-wrench concept logo; DemoSites photo columns (sql/01 V2.2, 04 V1.4, 05 V2.1); Admin site V1.4; diagram V1.4 |
| R3.2 | 2026-10-05 | 3 unique demo websites (layouts split / bold / classic, concept logos, original illustrations); dbo.DemoSites + Admin site V1.3 Demo sites tab (edit, live preview, save); sql/01 V2.1, sql/04 V1.3, sql/05 V2.0; diagram V1.3; Day 3–5 prompts and log |
| R3.1 | 2026-10-02 | Prompt Book V2.0 (PDF): all prompts to date in professional form, consolidated, numbered by date; standing rules; updated library |
| R3.0 | 2026-10-02 | SkyTech_WebsiteDeveloper agent created: demo-site generator (utility trades + real estate templates), first 3 demos for review, sql/05 marks leads DemoBuilt; diagram V1.2 |
| R2.9 | 2026-10-02 | Admin site V1.2: live duplicate check across Companies, Leads, Web presence, Activities (menu count, dashboard alert, auto re-check, fix per type) + sql/04 V1.2; infrastructure diagram V1.1 |
| R2.8 | 2026-10-02 | push-to-github.bat (one-click upload); instructions V1.6 |
| R2.7 | 2026-10-02 | Infrastructure diagram V1.0 (data flow, agents, roles, versions) + generator script; instructions V1.5 |
| R2.6 | 2026-10-02 | Admin site V1.1: duplicate review (compare, merge/remove, dismiss) + sql/04 V1.1 |
| R2.5 | 2026-10-02 | Admin site V1.0 (login, dashboards, drill-down, CRUD, audit) + sql/04_admin_site.sql |
| R2.4 | 2026-10-02 | Duplicate protection in SkyTechCRM (staging + upsert procedure, unique indexes, import log, duplicate review view); sample import re-runnable |
| R2.3 | 2026-10-02 | SkyTech_BackOffice agent created; 100 leads verified (36 potential clients); SQL Server 2014 Developer adopted; SkyTech_Manager naming |
| R2.2 | 2026-10-02 | First 100-lead sample (real estate + utility trades, Baltimore City/County + Howard) collected from Overture Explorer; review CSV + SQL import; extraction and build scripts |
| R2.1 | 2026-10-02 | Local working folder and GitHub link recorded in README, instructions, data README, log, index, register |
| R2.0 | 2026-10-02 | Library step removed; free lead sources; niche/area chosen (real estate + utility trades, Baltimore City/County + Howard); lead sample script; versioning system; config, data, exports folders; this index |
| R1.0 | 2026-10-01 | First plan, agent roles, SQL schema and batch query, robots.txt, Day-1 session log, prompt book v1.0 |

## Files by release

| File | What it is | R1.0 | R2.0 | R2.1 | R2.2 | R2.3 | R2.4 | R2.5 | R2.6 | R2.7 | R2.8 | R2.9 | R3.0 | R3.1 | R3.2 | R3.3 | R3.4 | R3.5 | R4.0 | R4.1 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `README.md` | Overview, setup, push steps | V1.0 | V2.0 | V2.1 | V2.1 | V2.2 | V2.2 | V2.3 | V2.3 | V2.4 | V2.5 | V2.5 | V2.5 | V2.5 | V2.5 | V2.5 | V2.5 | V2.6 | V2.7 | V2.8 |
| `INDEX.md` | This index | — | V1.0 | V1.1 | V1.2 | V1.3 | V1.4 | V1.5 | V1.6 | V1.7 | V1.8 | V1.9 | V2.0 | V2.1 | V2.2 | V2.3 | V2.4 | V2.5 | V2.6 | V2.7 |
| `CHANGELOG.md` | Change history | — | V1.0 | V1.1 | V1.2 | V1.3 | V1.4 | V1.5 | V1.6 | V1.7 | V1.8 | V1.9 | V2.0 | V2.1 | V2.2 | V2.3 | V2.4 | V2.5 | V2.6 | V2.7 |
| `.gitignore` / `.gitattributes` | Git config | — | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.1 | V1.1 |
| `config/project-instructions.md` | Approved project instructions | — | V1.1 | V1.2 | V1.2 | V1.3 | V1.4 | V1.4 | V1.4 | V1.5 | V1.6 | V1.6 | V1.6 | V1.6 | V1.6 | V1.6 | V1.7 | V1.8 | V1.9 | V1.9 |
| `config/version-register.md` | Version register (all files incl. claude.ai items) | — | V1.4 | V1.5 | V1.6 | V1.7 | V1.8 | V1.9 | V2.0 | V2.1 | V2.2 | V2.3 | V2.4 | V2.5 | V2.9 | V3.0 | V3.6 | V3.7 | V3.8 | V3.9 |
| `docs/90-day-plan.md` | 90-day plan (text copy of the living doc) | V1.0 | V2.1 | V2.1 | V2.1 | V2.2 | V2.2 | V2.2 | V2.2 | V2.2 | V2.2 | V2.2 | V2.2 | V2.2 | V2.2 | V2.2 | V2.2 | V2.2 | V2.2 | V2.2 |
| `docs/agents.md` | Agent roles and flow | V1.0 | V1.1 | V1.1 | V1.1 | V1.1 | V1.1 | V1.1 | V1.1 | V1.1 | V1.1 | V1.1 | V1.2 | V1.2 | V1.2 | V1.2 | V1.2 | V1.2 | V1.2 | V1.2 |
| `sql/01_create_skytechcrm.sql` | Creates SkyTechCRM database + 4 tables | V1.0 | V1.0 | V1.0 | V1.0 | V1.1 | V2.0 | V2.0 | V2.0 | V2.0 | V2.0 | V2.0 | V2.0 | V2.0 | V2.1 | V2.2 | V2.2 | V2.2 | V2.3 | V2.3 |
| `sql/02_daily_batch_query.sql` | BackOffice daily batch query | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 |
| `scripts/leads/make_sample.py` | Overture files → 100-lead CSV + SQL import | — | V1.1 | V1.1 | V1.1 | V1.1 | V1.2 | V1.2 | V1.2 | V1.2 | V1.2 | V1.2 | V1.2 | V1.2 | V1.2 | V1.2 | V1.2 | V1.2 | V1.3 | V1.3 |
| `scripts/prompt-book/build_prompt_book.py` | Builds the prompt book PDF | V1.0 (`prompts/build.py`) | V1.0 (moved) | V1.0 (moved) | V1.0 (moved) | V1.0 (moved) | V1.0 (moved) | V1.0 (moved) | V1.0 (moved) | V1.0 (moved) | V1.0 (moved) | V1.0 (moved) | V1.0 (moved) | V2.0 | V2.0 | V2.0 | V2.0 | V2.0 | V2.1 | V2.1 |
| `scripts/prompt-book/content.py` | Prompt book text | V1.0 (`prompts/content.py`) | V1.0 (moved) | V1.0 (moved) | V1.0 (moved) | V1.0 (moved) | V1.0 (moved) | V1.0 (moved) | V1.0 (moved) | V1.0 (moved) | V1.0 (moved) | V1.0 (moved) | V1.0 (moved) | V2.0 | V2.0 | V2.0 | V2.0 | V2.0 | V2.0 | V2.0 |
| `website/robots.txt` | robots.txt for skytechsolutions.us | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 |
| `prompts/SkyTech_Prompts_v1.0_2026-10-01.pdf` | Prompt book, Day 1 (1.01–1.18) + library L-01–L-10 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 |
| `prompts/SkyTech-Prompts-2026-10-02-V1.0.md` | Day 2 prompts (2.01–2.06) | — | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 (superseded by V2.0 PDF) | V1.0 (superseded by V2.0 PDF) | V1.0 (superseded by V2.0 PDF) | V1.0 (superseded by V2.0 PDF) | V1.0 (superseded by V2.0 PDF) | V1.0 (superseded by V2.0 PDF) | V1.0 (superseded by V2.0 PDF) |
| `logs/2026-10-01.md` | Session log Day 1 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 |
| `logs/2026-10-02.md` | Session log Day 2 | — | V1.0 | V1.1 | V1.2 | V1.3 | V1.4 | V1.5 | V1.6 | V1.7 | V1.7 | V1.8 | V1.9 | V2.0 | V2.0 | V2.0 | V2.0 | V2.0 | V2.0 | V2.0 |
| `data/README.md` | Data folder rules (no lead files yet) | — | V1.0 | V1.1 | V1.2 | V1.2 | V1.3 | V1.3 | V1.3 | V1.3 | V1.3 | V1.3 | V1.3 | V1.3 | V1.3 | V1.3 | V1.3 | V1.3 | V1.3 | V1.3 |
| `exports/pdf/01_README.pdf` … `08_Prompt_Book_v1.0_2026-10-01.pdf` | PDF set from Oct 1 | — | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 |
| `exports/pdf/02_90-Day_Plan_V2.1.pdf` | 90-day plan PDF with diagrams | — | V2.1 | V2.1 | V2.1 | V2.1 | V2.1 | V2.1 | V2.1 | V2.1 | V2.1 | V2.1 | V2.1 | V2.1 | V2.1 | V2.1 | V2.1 | V2.1 | V2.1 | V2.1 |
| `scripts/leads/overture_browser_extract.js` | Collects leads in Overture Explorer (browser) | — | — | — | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.1 | V1.1 |
| `scripts/leads/build_sample_from_extract.py` | Extract → review CSV + SQL import, with priority and review flags | — | — | — | V1.0 | V1.1 | V1.2 | V1.2 | V1.2 | V1.2 | V1.2 | V1.2 | V1.2 | V1.2 | V1.2 | V1.2 | V1.2 | V1.2 | V1.3 | V1.3 |
| `data/raw/overture/2026-10-02/sample100_extract.json` | Raw 100-lead extract | — | — | — | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 |
| `data/samples/SkyTech_Leads_Sample100.csv` | 100 leads for review (Priority A/B/C) | — | — | — | V1.0 | V1.1 | V1.1 | V1.1 | V1.1 | V1.1 | V1.1 | V1.1 | V1.1 | V1.1 | V1.1 | V1.1 | V1.1 | V1.1 | V1.1 | V1.1 |
| `data/samples/SkyTech_Leads_Sample100_import.sql` | Loads the 100 leads into SkyTechCRM | — | — | — | V1.0 | V1.1 | V1.2 | V1.2 | V1.2 | V1.2 | V1.2 | V1.2 | V1.2 | V1.2 | V1.2 | V1.2 | V1.2 | V1.2 | V1.2 | V1.2 |
| `agents/SkyTech_BackOffice.md` | BackOffice role file (owner-editable) | — | — | — | — | V1.0 | V1.1 | V1.1 | V1.1 | V1.1 | V1.1 | V1.1 | V1.1 | V1.1 | V1.1 | V1.1 | V1.1 | V1.1 | V1.1 | V1.1 |
| `data/verification/2026-10-02_backoffice_results.txt` | Website verification of the 100 leads | — | — | — | — | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 |
| `admin-site/` (server.js, src/, public/, scripts/, README.md, start-admin.bat, .env.example) | Admin website for SkyTechCRM | — | — | — | — | — | — | V1.0 | V1.1 | V1.1 | V1.1 | V1.2 | V1.2 | V1.2 | V1.3 | V1.4 | V1.4 | V1.4 | V2.0 | V2.0 |
| `sql/04_admin_site.sql` | Admin site tables and views | — | — | — | — | — | — | V1.0 | V1.1 | V1.1 | V1.1 | V1.2 | V1.2 | V1.2 | V1.3 | V1.4 | V1.4 | V1.4 | V1.5 | V1.5 |
| `docs/architecture/SkyTech_Infrastructure.html` / `.pdf` / `.png` | Infrastructure diagram: data flow, agents, roles, versions | — | — | — | — | — | — | — | — | V1.0 | V1.0 | V1.1 | V1.2 | V1.2 | V1.3 | V1.4 | V1.5 | V1.5 | V1.6 | V1.6 |
| `scripts/docs/build_infrastructure.py` | Rebuilds the infrastructure diagram | — | — | — | — | — | — | — | — | V1.0 | V1.0 | V1.1 | V1.2 | V1.2 | V1.3 | V1.4 | V1.5 | V1.5 | V1.6 | V1.6 |
| `push-to-github.bat` | One-click upload of commits and tags | — | — | — | — | — | — | — | — | — | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V2.0 | V2.0 |
| `agents/SkyTech_WebsiteDeveloper.md` | WebsiteDeveloper role file (owner-editable) | — | — | — | — | — | — | — | — | — | — | — | V1.0 | V1.0 | V1.1 | V1.2 | V1.2 | V1.2 | V1.2 | V1.2 |
| `scripts/website/build_demo_sites.py` | Builds demo sites, manifest and sql/05 | — | — | — | — | — | — | — | — | — | — | — | V1.0 | V1.0 | V2.0 (retired) | V2.0 (retired) | V2.0 (retired) | V2.0 (retired) | V2.0 (retired) | V2.0 (retired) |
| `scripts/website/content.py` | Wording, colours and icons per trade | — | — | — | — | — | — | — | — | — | — | — | V1.0 | V1.0 | V1.0 (retired) | V1.0 (retired) | V1.0 (retired) | V1.0 (retired) | V1.0 (retired) | V1.0 (retired) |
| `demo-sites/ (README, manifest.csv, <business>/index.html)` | Demo websites (3 so far: C&A Plumbing, David P Davis Construction, Lee Newton Co.) | — | — | — | — | — | — | — | — | — | — | — | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 |
| `sql/05_demo_sites_built.sql` | Marks demo leads DemoBuilt (re-runnable) | — | — | — | — | — | — | — | — | — | — | — | V1.0 | V1.0 | V2.0 | V2.1 | V2.1 | V2.1 | V2.2 | V2.2 |
| `prompts/SkyTech_Prompts_V2.0_2026-10-02.pdf` | Prompt Book V2.0: all prompts (Day 1 1.01–1.09, Day 2 2.01–2.19), standing rules, library L-01–L-10 | — | — | — | — | — | — | — | — | — | — | — | — | V2.0 | V2.0 | V2.0 | V2.0 | V2.0 | V2.0 | V2.0 |
| `admin-site/src/demo/render.js` | Demo page renderer (layouts, concept logos, illustrations) | — | — | — | — | — | — | — | — | — | — | — | — | — | V1.0 | V1.1 | V1.1 | V1.1 | V1.2 | V1.2 |
| `admin-site/scripts/build-demos.js` | Builds demo pages, manifest and sql/05 (npm run build-demos) | — | — | — | — | — | — | — | — | — | — | — | — | — | V1.0 | V1.1 | V1.1 | V1.1 | V2.0 | V2.0 |
| `demo-sites/designs/*.json` | Unique design + wording per business (3) | — | — | — | — | — | — | — | — | — | — | — | — | — | V1.0 | C&A V1.1 | C&A V1.1 | C&A V1.1 | C&A V1.1 | C&A V1.1 |
| `logs/2026-10-05.md` | Session log Day 5 | — | — | — | — | — | — | — | — | — | — | — | — | — | V1.0 | V1.1 | V1.1 | V1.1 | V1.1 | V1.1 |
| `prompts/SkyTech-Prompts-2026-10-03/04/05-V1.0.md` | Day 3–5 prompts (Day 5 at V1.1) | — | — | — | — | — | — | — | — | — | — | — | — | — | V1.1 | V1.2 (Day 5) | V1.2 (Day 5) | V1.2 (Day 5) | V1.2 (Day 5) | V1.2 (Day 5) |
| `docs/architecture/SkyTech_Technology_Stack_Use.html` / `.pdf` / `.md` / `SkyTech_Technology_Stack_Journey.png` | Technology Stack Use: every tool in plain words, merged with the architecture diagram | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | V1.0 | V1.0 (+ .md) | V1.1 | V1.1 |
| `scripts/docs/build_tech_stack.py` | Builds the Technology Stack Use document (reuses the diagram) | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | V1.0 | V1.1 | V1.2 | V1.2 |
| `prompts/SkyTech-Prompts-2026-10-06…10-V1.0.md` | Day 6–10 prompts (Day 10 at V1.1) | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | V1.1 | V1.2 (Day 10) | V1.3 (Day 10) | V1.4 (Day 10) |
| `logs/2026-10-10.md` | Session log Day 10 | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | V1.0 | V1.1 | V1.2 | V1.3 |
| `config/error-codes.json` | Error catalog: every SKY code with causes and fixes | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | V1.1 | V1.1 |
| `admin-site/src/security.js`, `logger.js`, `errors.js` | Security layer, JSON logging, error codes (Admin site) | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | V1.0 / V1.1 / V1.1 | V1.0 / V1.1 / V1.1 |
| `admin-site/scripts/doctor.js` | Health check: npm run doctor | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | V1.0 | V1.0 |
| `scripts/security/scan-secrets.js` | Secret scan run before every push | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | V1.0 | V1.0 |
| `scripts/common/skylog.py` | Error codes + logging for Python scripts | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | V1.0 | V1.0 |
| `sql/06_security_and_logging.sql` | App role, audit protection, verified backup, ErrorLog purge | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | V1.0 | V1.1 |
| `scripts/docs/build_ops_docs.py` | Builds the three operations documents | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | V1.0 | V1.0 |
| `docs/architecture/SkyTech_Security_Architecture` (.html/.pdf/.md) + `SkyTech_Trust_Boundaries.png` | Security architecture | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | V1.0 | V1.0 |
| `docs/architecture/SkyTech_Troubleshooting_Guide` (.html/.pdf/.md) | Troubleshooting guide (all error codes) | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | V1.0 | V1.0 |
| `docs/architecture/SkyTech_Code_Documentation` (.html/.pdf/.md) | Code documentation (all comments) | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | V1.0 | V1.0 |

## Items outside this repository

| Item | Where | Version |
| --- | --- | --- |
| Local working copy of this repo | `C:\Users\AV\Documents\SkyTechClaude\skytech-agent-program` | current |
| 90-Day Plan living doc (with diagrams) | claude.ai artifact: https://claude.ai/code/artifact/df79af8a-1a3f-468e-8a59-c9b644cb8129 | V2.1 |
| Technology Stack Use (copy) | claude.ai Project: `claude/SkyTech-Technology-Stack-Use.md` | V1.1 |
| Project notes, register, instructions, prompts | claude.ai Project "AgentProcessCreation_For_FreeMassOnePagewebsitebuild_MarketSkyTechbpresence" | see `config/version-register.md` |
| SkyTechCRM database | SQL Server 2014 Developer on owner's laptop (not created yet) | setup V2.2 + admin objects V1.4 + demo load V2.1 |

---
Version: V2.7 (2026-10-10) — INDEX.md — V2.7
