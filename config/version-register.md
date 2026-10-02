# SkyTech Version Register

## Versioning rules
1. Every file or content delivered as part of this project ends with a footer line: `Version: Vx.y (date) — <file name> — Vx.y`.
2. Minor edits (typos, small additions, status updates) bump the minor number: V1.0 → V1.1 → V1.2.
3. Major changes (restructured plan, new agents, new pricing, new process) bump the major number: V1.x → V2.0.
4. Project instructions carry a version that matches the highest-impact change; the register below shows which file versions belong to which instructions version.
5. Prompts downloaded at end of day are saved as `SkyTech-Prompts-<YYYY-MM-DD>-Vx.y.md`, numbered by day (2.01, 2.02 …), each with its own version tag.
6. Older versions are not overwritten silently: the change is logged below with date and reason.
7. Existing files are edited in place; the file name stays the same and the version footer changes.
8. GitHub releases are tagged R<major>.<minor>; `INDEX.md` lists what each release contains.

## Register (as of 2026-10-02)
| File | Version | Date | Notes |
|---|---|---|---|
| 90-Day Plan living doc (claude.ai artifact) + `docs/90-day-plan.md` | V2.2 | 2026-10-02 | V2.0 free lead sources; V2.1 niche and area chosen |
| Project instructions (claude.ai field + `config/project-instructions.md`) | V1.6 | 2026-10-02 | Free lead sources; pasted into Project Instructions by owner |
| Version register (claude.ai project + `config/version-register.md`) | V2.2 | 2026-10-02 | This register |
| SkyTech-90-Day-Plan-link.md (claude.ai project) | V1.3 | 2026-10-02 | Plan notes and next steps |
| SkyTech-Prompts-2026-10-02-V1.0.md | V1.0 | 2026-10-02 | Day-2 prompts 2.01–2.06 (superseded by Prompt Book V2.0) |
| Prompt book PDF (Day 1) | V1.0 | 2026-10-01 | 1.01–1.18 + L-01–L-10 (superseded) |
| Prompt book PDF `SkyTech_Prompts_V2.0_2026-10-02.pdf` | V2.0 | 2026-10-02 | All prompts consolidated: 1.01–1.09, 2.01–2.19 + standing rules + L-01–L-10 |
| `scripts/leads/make_sample.py` | V1.1 | 2026-10-02 | Baltimore City added |
| Local working folder | — | 2026-10-02 | C:\Users\AV\Documents\SkyTechClaude\skytech-agent-program |
| `agents/SkyTech_BackOffice.md` | V1.1 | 2026-10-02 | BackOffice role (owner-editable) |
| `agents/SkyTech_WebsiteDeveloper.md` | V1.0 | 2026-10-02 | WebsiteDeveloper role (owner-editable) |
| `scripts/website/` (build_demo_sites.py, content.py) | V1.0 | 2026-10-02 | Demo-site generator |
| `demo-sites/` + `sql/05_demo_sites_built.sql` | V1.0 | 2026-10-02 | Demo websites (3) + DemoBuilt update |
| `data/verification/2026-10-02_backoffice_results.txt` | V1.0 | 2026-10-02 | 100-lead website verification |
| `data/samples/SkyTech_Leads_Sample100.csv` V1.1 + `_import.sql` V1.2 | 2026-10-02 | First 100-lead sample |
| `sql/01_create_skytechcrm.sql` | V2.0 | 2026-10-02 | Duplicate-proof setup + import procedure (re-runnable) |
| `admin-site/` | V1.2 | 2026-10-02 | Admin website (Node.js + HTML/JS); live duplicate check |
| `sql/04_admin_site.sql` | V1.2 | 2026-10-02 | Admin site tables, views, duplicate check and fix procedures |
| `docs/architecture/SkyTech_Infrastructure` (.html/.pdf/.png) | V1.2 | 2026-10-02 | Infrastructure, data flow, agents, roles, versions |
| `push-to-github.bat` | V1.0 | 2026-10-02 | One-click upload of commits + tags |
| GitHub repository `skytech-agent-program` | R3.1 | 2026-10-02 | See `INDEX.md` |

## Change log
- 2026-10-02 V1.0: Versioning system introduced.
- 2026-10-02 Plan doc V1.0 → V2.0: library data step removed; free lead data sources added. Plan link file → V1.1; register → V1.1.
- 2026-10-02 Project instructions V1.0 → V1.1: free lead sources; ProjectManagement agent; edit-in-place rule. Register → V1.2.
- 2026-10-02 Project instructions V1.1 approved and pasted by owner. Register → V1.3.
- 2026-10-02 Plan doc V2.0 → V2.1: niche and area chosen (real estate + utility trades; Baltimore City, Baltimore County, Howard County). Lead script V1.1 (Baltimore City). GitHub repository organized as R1.0 + R2.0 with `INDEX.md`. Register → V1.4.
- 2026-10-02 Local working folder recorded: C:\Users\AV\Documents\SkyTechClaude\skytech-agent-program; git remote set; README V2.1, instructions V1.2, data README V1.1, log V1.1, INDEX V1.1, plan notes V1.3. Repo release R2.1. Register → V1.5.
- 2026-10-02 First 100-lead sample built (R2.2): extract + scripts + CSV + SQL; INDEX V1.2, CHANGELOG V1.2, data README V1.2, log V1.2. Register → V1.6.
- 2026-10-02 R2.3: SkyTech_Manager naming; SkyTech_BackOffice created and verified 100 leads (36 potential clients); SQL Server 2014 Developer adopted (plan V2.2, instructions V1.3, SQL script V1.1). Register → V1.7.
- 2026-10-02 R2.4: no-duplicates rule implemented (SQL setup V2.0, import V1.2, instructions V1.4, BackOffice V1.1). Register → V1.8.
- 2026-10-02 R2.5: Admin site V1.0 + sql/04_admin_site.sql V1.0. Register → V1.9.
- 2026-10-02 R2.6: duplicate review in Admin site V1.1 + sql/04 V1.1. Register → V2.0.
- 2026-10-02 R2.7: infrastructure diagram V1.0; instructions V1.5. Register → V2.1.
- 2026-10-02 R2.8: push-to-github.bat; instructions V1.6 (artifacts in local folder, committed/tagged on every change). Register → V2.2.
- 2026-10-02 R2.9: Admin site V1.2 + sql/04 V1.2 (live duplicate check across all tables); infrastructure diagram V1.1. Register → V2.3.
- 2026-10-02 R3.0: SkyTech_WebsiteDeveloper created; demo-site generator; first 3 demos; sql/05; diagram V1.2. Register → V2.4.
- 2026-10-02 R3.1: Prompt Book V2.0 PDF (all prompts consolidated, numbered by date). Register → V2.5.

---
Version: V2.5 (2026-10-02) — SkyTech-Version-Register.md — V2.5
