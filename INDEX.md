# SkyTech Repository Index

Quick reference: what each release contains and the version of every file. Releases are git tags (`git checkout R1.0` to see an old release).

## Releases

| Release | Date | Summary |
| --- | --- | --- |
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

| File | What it is | R1.0 | R2.0 | R2.1 | R2.2 | R2.3 | R2.4 | R2.5 | R2.6 | R2.7 | R2.8 | R2.9 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `README.md` | Overview, setup, push steps | V1.0 | V2.0 | V2.1 | V2.1 | V2.2 | V2.2 | V2.3 | V2.3 | V2.4 | V2.5 | V2.5 |
| `INDEX.md` | This index | — | V1.0 | V1.1 | V1.2 | V1.3 | V1.4 | V1.5 | V1.6 | V1.7 | V1.8 | V1.9 |
| `CHANGELOG.md` | Change history | — | V1.0 | V1.1 | V1.2 | V1.3 | V1.4 | V1.5 | V1.6 | V1.7 | V1.8 | V1.9 |
| `.gitignore` / `.gitattributes` | Git config | — | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 |
| `config/project-instructions.md` | Approved project instructions | — | V1.1 | V1.2 | V1.2 | V1.3 | V1.4 | V1.4 | V1.4 | V1.5 | V1.6 | V1.6 |
| `config/version-register.md` | Version register (all files incl. claude.ai items) | — | V1.4 | V1.5 | V1.6 | V1.7 | V1.8 | V1.9 | V2.0 | V2.1 | V2.2 | V2.3 |
| `docs/90-day-plan.md` | 90-day plan (text copy of the living doc) | V1.0 | V2.1 | V2.1 | V2.1 | V2.2 | V2.2 | V2.2 | V2.2 | V2.2 | V2.2 | V2.2 |
| `docs/agents.md` | Agent roles and flow | V1.0 | V1.1 | V1.1 | V1.1 | V1.1 | V1.1 | V1.1 | V1.1 | V1.1 | V1.1 | V1.1 |
| `sql/01_create_skytechcrm.sql` | Creates SkyTechCRM database + 4 tables | V1.0 | V1.0 | V1.0 | V1.0 | V1.1 | V2.0 | V2.0 | V2.0 | V2.0 | V2.0 | V2.0 |
| `sql/02_daily_batch_query.sql` | BackOffice daily batch query | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 |
| `scripts/leads/make_sample.py` | Overture files → 100-lead CSV + SQL import | — | V1.1 | V1.1 | V1.1 | V1.1 | V1.2 | V1.2 | V1.2 | V1.2 | V1.2 | V1.2 |
| `scripts/prompt-book/build_prompt_book.py` | Builds the prompt book PDF | V1.0 (`prompts/build.py`) | V1.0 (moved) | V1.0 (moved) | V1.0 (moved) | V1.0 (moved) | V1.0 (moved) | V1.0 (moved) | V1.0 (moved) | V1.0 (moved) | V1.0 (moved) | V1.0 (moved) |
| `scripts/prompt-book/content.py` | Prompt book text | V1.0 (`prompts/content.py`) | V1.0 (moved) | V1.0 (moved) | V1.0 (moved) | V1.0 (moved) | V1.0 (moved) | V1.0 (moved) | V1.0 (moved) | V1.0 (moved) | V1.0 (moved) | V1.0 (moved) |
| `website/robots.txt` | robots.txt for skytechsolutions.us | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 |
| `prompts/SkyTech_Prompts_v1.0_2026-10-01.pdf` | Prompt book, Day 1 (1.01–1.18) + library L-01–L-10 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 |
| `prompts/SkyTech-Prompts-2026-10-02-V1.0.md` | Day 2 prompts (2.01–2.06) | — | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 |
| `logs/2026-10-01.md` | Session log Day 1 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 |
| `logs/2026-10-02.md` | Session log Day 2 | — | V1.0 | V1.1 | V1.2 | V1.3 | V1.4 | V1.5 | V1.6 | V1.7 | V1.7 | V1.8 |
| `data/README.md` | Data folder rules (no lead files yet) | — | V1.0 | V1.1 | V1.2 | V1.2 | V1.3 | V1.3 | V1.3 | V1.3 | V1.3 | V1.3 |
| `exports/pdf/01_README.pdf` … `08_Prompt_Book_v1.0_2026-10-01.pdf` | PDF set from Oct 1 | — | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 |
| `exports/pdf/02_90-Day_Plan_V2.1.pdf` | 90-day plan PDF with diagrams | — | V2.1 | V2.1 | V2.1 | V2.1 | V2.1 | V2.1 | V2.1 | V2.1 | V2.1 | V2.1 |
| `scripts/leads/overture_browser_extract.js` | Collects leads in Overture Explorer (browser) | — | — | — | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 |
| `scripts/leads/build_sample_from_extract.py` | Extract → review CSV + SQL import, with priority and review flags | — | — | — | V1.0 | V1.1 | V1.2 | V1.2 | V1.2 | V1.2 | V1.2 | V1.2 |
| `data/raw/overture/2026-10-02/sample100_extract.json` | Raw 100-lead extract | — | — | — | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 |
| `data/samples/SkyTech_Leads_Sample100.csv` | 100 leads for review (Priority A/B/C) | — | — | — | V1.0 | V1.1 | V1.1 | V1.1 | V1.1 | V1.1 | V1.1 | V1.1 |
| `data/samples/SkyTech_Leads_Sample100_import.sql` | Loads the 100 leads into SkyTechCRM | — | — | — | V1.0 | V1.1 | V1.2 | V1.2 | V1.2 | V1.2 | V1.2 | V1.2 |
| `agents/SkyTech_BackOffice.md` | BackOffice role file (owner-editable) | — | — | — | — | V1.0 | V1.1 | V1.1 | V1.1 | V1.1 | V1.1 | V1.1 |
| `data/verification/2026-10-02_backoffice_results.txt` | Website verification of the 100 leads | — | — | — | — | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 | V1.0 |
| `admin-site/` (server.js, src/, public/, scripts/, README.md, start-admin.bat, .env.example) | Admin website for SkyTechCRM | — | — | — | — | — | — | V1.0 | V1.1 | V1.1 | V1.1 | V1.2 |
| `sql/04_admin_site.sql` | Admin site tables and views | — | — | — | — | — | — | V1.0 | V1.1 | V1.1 | V1.1 | V1.2 |
| `docs/architecture/SkyTech_Infrastructure.html` / `.pdf` / `.png` | Infrastructure diagram: data flow, agents, roles, versions | — | — | — | — | — | — | — | — | V1.0 | V1.0 | V1.1 |
| `scripts/docs/build_infrastructure.py` | Rebuilds the infrastructure diagram | — | — | — | — | — | — | — | — | V1.0 | V1.0 | V1.1 |
| `push-to-github.bat` | One-click upload of commits and tags | — | — | — | — | — | — | — | — | — | V1.0 | V1.0 |

## Items outside this repository

| Item | Where | Version |
| --- | --- | --- |
| Local working copy of this repo | `C:\Users\AV\Documents\SkyTechClaude\skytech-agent-program` | current |
| 90-Day Plan living doc (with diagrams) | claude.ai artifact: https://claude.ai/code/artifact/df79af8a-1a3f-468e-8a59-c9b644cb8129 | V2.1 |
| Project notes, register, instructions, prompts | claude.ai Project "AgentProcessCreation_For_FreeMassOnePagewebsitebuild_MarketSkyTechbpresence" | see `config/version-register.md` |
| SkyTechCRM database | SQL Server 2014 Developer on owner's laptop (not created yet) | setup V2.0 + admin objects V1.2 |

---
Version: V1.9 (2026-10-02) — INDEX.md — V1.9
