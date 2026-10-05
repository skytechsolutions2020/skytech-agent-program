# SkyTech Version Register

## Versioning rules
1. Every file or content delivered as part of this project ends with a footer line: `Version: Vx.y (date) — <file name> — Vx.y`.
2. Minor edits (typos, small additions, status updates) bump the minor number: V1.0 → V1.1 → V1.2.
3. Major changes (restructured plan, new agents, new pricing, new process) bump the major number: V1.x → V2.0.
4. Project instructions carry a version that matches the highest-impact change; the register below shows which file versions belong to which instructions version.
5. Prompts downloaded at end of day are saved as `SkyTech-Prompts-<YYYY-MM-DD>-Vx.y.md`, numbered by day (2.01, 3.01, 4.01, 5.01 …), each with its own version tag.
6. Older versions are not overwritten silently: the change is logged below with date and reason.
7. Existing files are edited in place; the file name stays the same and the version footer changes.
8. GitHub releases are tagged R<major>.<minor>; `INDEX.md` lists what each release contains.

## Register (as of 2026-10-05)
| File | Version | Date | Notes |
|---|---|---|---|
| 90-Day Plan living doc (claude.ai artifact) + `docs/90-day-plan.md` | V2.2 | 2026-10-02 | V2.0 free lead sources; V2.1 niche and area chosen |
| Project instructions (claude.ai field + `config/project-instructions.md`) | V1.6 | 2026-10-02 | Free lead sources; pasted into Project Instructions by owner. Unchanged 2026-10-03, 2026-10-04 and 2026-10-05 |
| Version register (claude.ai project + `config/version-register.md`) | V3.0 | 2026-10-05 | This register (claude.ai and repo copies kept in step) |
| SkyTech-90-Day-Plan-link.md (claude.ai project) | V1.3 | 2026-10-02 | Plan notes and next steps |
| SkyTech-Prompts-2026-10-05-V1.0.md | V1.2 | 2026-10-05 | Day-5 prompts 5.01–5.03 (file name kept; edited in place) |
| SkyTech-Prompts-2026-10-04-V1.0.md | V1.0 | 2026-10-04 | Day-4 prompts 4.01 |
| SkyTech-Prompts-2026-10-03-V1.0.md | V1.0 | 2026-10-03 | Day-3 prompts 3.01 |
| SkyTech-Prompts-2026-10-02-V1.0.md | V1.0 | 2026-10-02 | Day-2 prompts 2.01–2.06 (superseded by Prompt Book V2.0) |
| Prompt book PDF (Day 1) | V1.0 | 2026-10-01 | 1.01–1.18 + L-01–L-10 (superseded) |
| Prompt book PDF `SkyTech_Prompts_V2.0_2026-10-02.pdf` | V2.0 | 2026-10-02 | All prompts consolidated: 1.01–1.09, 2.01–2.19 + standing rules + L-01–L-10 |
| `scripts/leads/make_sample.py` | V1.1 | 2026-10-02 | Baltimore City added |
| Local working folder | — | 2026-10-02 | C:\Users\AV\Documents\SkyTechClaude\skytech-agent-program |
| `agents/SkyTech_BackOffice.md` | V1.1 | 2026-10-02 | BackOffice role (owner-editable) |
| `agents/SkyTech_WebsiteDeveloper.md` | V1.2 | 2026-10-05 | WebsiteDeveloper role (owner-editable): design files, DemoSites table, Admin editing |
| `scripts/website/build_demo_sites.py` V2.0 + `content.py` V1.0 | 2026-10-05 | Retired in R3.2 (replaced by `admin-site/scripts/build-demos.js`) |
| `demo-sites/` (3 sites, template V2.1) + `designs/*.json` (C&A V1.1, others V1.0) + README V2.0 | 2026-10-05 | Unique designs: Fresh Water (with Pexels photos), Blueprint, Harbor Classic |
| `sql/05_demo_sites_built.sql` | V2.1 | 2026-10-05 | Loads demos into dbo.DemoSites (insert-only), lead → DemoBuilt |
| `admin-site/src/demo/render.js` + `scripts/build-demos.js` | V1.1 | 2026-10-05 | Demo page renderer (layouts split / bold / classic, photo version) and builder |
| `data/verification/2026-10-02_backoffice_results.txt` | V1.0 | 2026-10-02 | 100-lead website verification |
| `data/samples/SkyTech_Leads_Sample100.csv` V1.1 + `_import.sql` V1.2 | 2026-10-02 | First 100-lead sample |
| `sql/01_create_skytechcrm.sql` | V2.2 | 2026-10-05 | Duplicate-proof setup + import procedure; dbo.DemoSites with photo columns (re-runnable) |
| `admin-site/` | V1.4 | 2026-10-05 | Admin website; live duplicate check; Demo sites tab (edit incl. photos, live preview, download, save) |
| `sql/04_admin_site.sql` | V1.4 | 2026-10-05 | Admin site tables, views, duplicate check, vw_DemoSiteDetail |
| `docs/architecture/SkyTech_Infrastructure` (.html/.pdf/.png) | V1.4 | 2026-10-05 | Infrastructure, data flow, agents, roles, versions |
| `push-to-github.bat` | V1.0 | 2026-10-02 | One-click upload of commits + tags |
| GitHub repository `skytech-agent-program` | R3.3 | 2026-10-05 | See `INDEX.md` |

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
- 2026-10-03 Scheduled versioning run: Day-3 prompt file `SkyTech-Prompts-2026-10-03-V1.0.md` created (prompt 3.01); rule 5 example updated; instructions confirmed at V1.6 (no content change). Register → V2.6.
- 2026-10-04 Scheduled versioning run: Day-4 prompt file `SkyTech-Prompts-2026-10-04-V1.0.md` created (prompt 4.01); rule 5 example extended to 4.01; instructions confirmed at V1.6 (no content change). Register → V2.7.
- 2026-10-05 Scheduled versioning run (program start day): Day-5 prompt file `SkyTech-Prompts-2026-10-05-V1.0.md` created (prompt 5.01); rule 5 example extended to 5.01; instructions confirmed at V1.6 (no content change). Register → V2.8.
- 2026-10-05 R3.2: three unique demo websites (layouts split / bold / classic, concept logos, original illustrations); new dbo.DemoSites table (sql/01 V2.1, sql/04 V1.3, sql/05 V2.0); Admin site V1.3 Demo sites tab; WebsiteDeveloper V1.1; old Python generator retired; diagram V1.3; Day-5 prompts V1.1 (5.02). Claude project and repo registers merged. Register → V2.9.
- 2026-10-05 R3.3: C&A Plumbing demo with free-licence Pexels photos (banner, one per service, About), drop-and-wrench concept logo, "What we fix" card (template V2.1, render/build V1.1); DemoSites photo columns (sql/01 V2.2, sql/04 V1.4, sql/05 V2.1); Admin site V1.4; WebsiteDeveloper V1.2; diagram V1.4; Day-5 prompts V1.2 (5.03). Register → V3.0.

---
Version: V3.0 (2026-10-05) — SkyTech-Version-Register.md — V3.0
