# Changelog

## R4.3 — 2026-10-10
- Admin site V2.2: **five project roles** — Admin (everything incl. Logins and System log), Manager (all data), Sales (leads + activities), Web developer (demo sites + web presence), Viewer (read only). Defined in the new `admin-site/src/roles.js`; every request is checked on the server and the screens hide what a role cannot use (SKY-AUTH-005 now says which action the role lacks).
- **Logins screen** shows every account: role, status (Active / Disabled / Locked), failed sign-ins, created by, last change by, last sign-in; search and role filter; counts per role; **Unlock** for logins locked by wrong passwords.
- Lockout refined: 5 wrong passwords lock a username, 20 lock the computer (on one PC every user shares 127.0.0.1); Unlock clears both.
- `sql/04_admin_site.sql` V1.6: AdminUsers CreatedBy / UpdatedOn / UpdatedBy and the role rule CK_AdminUsers_Role (re-run in SSMS). `npm run create-admin` accepts all five roles; doctor V1.1 checks the new columns.
- Error catalog V1.3; Security Architecture, Troubleshooting Guide, Code Documentation V1.2; diagram V1.8; Technology Stack Use V1.3; admin README V2.2; register V4.1, INDEX V2.9, README V3.0, Day-10 prompts V1.6 (10.08), log V1.5.

## R4.2 — 2026-10-10
- Admin site V2.1: **Logins** screen for admins to manage who can sign in, plus **Change my password** for every user.
  - Create logins (admin or viewer), change role, disable/enable, reset password. Password hashes never leave the server.
  - Safeguards: your own password is re-entered for every change (SKY-AUTH-007, wrong attempts count towards the lockout); password policy (SKY-AUTH-006); you cannot disable or demote yourself and one active admin always remains (SKY-AUTH-008); a changed login is signed out at once; every change is in the Audit log (entity `users`: CREATE, UPDATE, PASSWORD).
  - `npm run create-admin` stays as the fallback when no admin can sign in.
- Error catalog V1.2 (SKY-AUTH-007, SKY-AUTH-008). Security Architecture, Troubleshooting Guide and Code Documentation V1.1; infrastructure diagram V1.7; Technology Stack Use V1.2; admin-site README V2.1; register V4.0, INDEX V2.8, README V2.9, Day-10 prompts V1.5 (10.06–10.07), log V1.4.

## R4.1 — 2026-10-10
- Fix: `sql/06_security_and_logging.sql` V1.1. The DENY on `usp_BackupSkyTechCRM` ran before the procedure was created, giving Msg 15151 on first run. It now runs after the CREATE, so it also stays in place on re-runs.
- Register V3.9, INDEX V2.7, README V2.8, Day-10 prompts V1.4 (10.05), log V1.3.

## R4.0 — 2026-10-10
- **Security architecture applied to the whole project** (OWASP ASVS / NIST CSF 2.0 / CIS v8 practices, $0):
  - Admin site V2.0: strict Content-Security-Policy (no inline script), CSRF token on every change, Origin check, rate limits, 30-min idle / 8-h session timeouts, login lockout (5 tries / 15 min), timing-safe sign-in, security headers; it refuses to start with a weak secret or an exposed host.
  - Password policy in `npm run create-admin`; least-privilege `SkyTechApp` role, append-only `dbo.AuditLog` and verified backups (`usp_BackupSkyTechCRM`) in the new `sql/06_security_and_logging.sql`.
  - `push-to-github.bat` V2.0 runs a secret scan (`scripts/security/scan-secrets.js`) and a lock-file check before uploading; `.gitignore` V1.1.
- **Error codes and logging**:
  - `config/error-codes.json`: 65 `SKY-<AREA>-<NNN>` codes with causes, fixes and where each is logged; predicted errors flagged.
  - Every screen error shows its code and a reference; JSON logs in `logs/runtime/` (passwords redacted, 30-day retention); new System log screen for admins.
  - `dbo.ErrorLog` + `usp_LogError`: every procedure logs failures before re-raising (`sql/01` V2.3, `04` V1.5, `05` V2.2).
  - `npm run doctor`: one-command health check of settings, packages, git, disk, port and database (objects, unique rules, logins, errors, role, backups). `start-admin.bat` V2.0 runs it first.
  - Python scripts use `scripts/common/skylog.py` (same codes, `scripts-*.log`); `build-demos.js` V2.0 validates design files.
- **Comments in every file**: purpose block (Purpose, Inputs, Outputs, Run, Errors, Security) and one line per function, table, view and procedure.
- **New documents** (HTML, PDF, Markdown) built by `scripts/docs/build_ops_docs.py`: Security Architecture V1.0, Troubleshooting Guide V1.0, Code Documentation V1.0. Infrastructure diagram V1.6 and Technology Stack Use V1.1 updated.
- Project instructions V1.9, register V3.8, README V2.7, Day-10 prompts V1.3, log V1.2.

## R3.5 — 2026-10-10
- Technology Stack Use is now a listed, versioned artifact:
  - README V2.6 adds a "Key documents (artifacts, versioned)" table showing current versions (Technology Stack Use V1.0, infrastructure V1.5, plan V2.2, instructions V1.8, register V3.7 and others), and refreshes the folder table.
  - Generator `build_tech_stack.py` V1.1 also writes `SkyTech_Technology_Stack_Use.md`, kept in the repo and in the Claude project (`claude/SkyTech-Technology-Stack-Use.md`).
  - Version-register rule 9 and project instructions V1.8: re-version and release it, and refresh the project copy, whenever a tool changes.
- Day-10 prompts V1.2 (10.03); log V1.1.

## R3.4 — 2026-10-10
- New document **SkyTech Technology Stack Use** V1.0 (`docs/architecture/SkyTech_Technology_Stack_Use.html` / `.pdf` + `SkyTech_Technology_Stack_Journey.png`), written for non-technical readers:
  - one-minute picture of the six steps, with the tools used at each;
  - the architecture diagram and data flow;
  - 42 tools in 8 groups, each with what it is, what we use it for, cost, where it runs and status;
  - the $0 new-spend summary, a glossary and a change log.
- `scripts/docs/build_tech_stack.py` V1.0; `build_infrastructure.py` V1.5 is now importable, so both documents share one diagram. Infrastructure document V1.5 (version labels refreshed).
- Project instructions V1.7: keep the Technology Stack Use document updated and versioned. Register V3.6; Day 6–10 prompt files added; log 2026-10-10.

## R3.3 — 2026-10-05
- C&A Plumbing demo made more customer-appealing (template V2.1):
  - Full-width photo banner with a "What we fix" card listing every service.
  - A photo service card for each of the six services, with an icon badge.
  - An About section with photo and checklist.
  - A new drop-and-wrench concept logo, and separate icons for leak and pipe repair.
- Photos are free-licence images from Pexels with a footer credit. They were chosen so no other company's branding shows and no stock person appears to be the business's staff.
- dbo.DemoSites photo columns HeroImage, AboutImage and PhotoCredit (`sql/01` V2.2, `sql/04` V1.4, `sql/05` V2.1).
- Admin site V1.4: photo fields in the Demo sites tab (free-licence hosts only), and the live preview shows the photos.
- WebsiteDeveloper role V1.2 (photo rules), infrastructure diagram V1.4, register V3.0, Day-5 prompts V1.2, log V1.1.

## R3.2 — 2026-10-05
- Three unique, customer-ready demo websites (template V2.0):
  - C&A Plumbing: layout `split`, Fresh Water palette.
  - David P Davis Construction: layout `bold`, Blueprint palette.
  - Lee Newton Co.: layout `classic`, Harbor Classic palette.
  - Each has its own font pair, concept logo, original illustration, headline, services, highlights and steps.
  - Stock-photo sites are blocked on this network, so all artwork is original and licence-free.
- New table **dbo.DemoSites** (`sql/01` V2.1): one row per company, unique slug. View `vw_DemoSiteDetail` (`sql/04` V1.3). Loader `sql/05` V2.0 is insert-only, so Admin edits are never overwritten.
- Admin site V1.3: **Demo sites** tab to edit every design field (colour pickers, hints), live preview straight from the database, Download HTML, Save to demo-sites folder; colour and slug validation; audited.
- New `admin-site/src/demo/render.js` + `scripts/build-demos.js` (`npm run build-demos`); `demo-sites/designs/*.json`; Python generator retired (V2.0 stub).
- WebsiteDeveloper role V1.1; infrastructure diagram V1.3; version register V2.9 (claude.ai and repo copies merged); Day 3–5 prompt files; log 2026-10-05.

## R3.1 — 2026-10-02
- Prompt Book V2.0 (`prompts/SkyTech_Prompts_V2.0_2026-10-02.pdf`): every prompt to date rewritten in professional form; repeated and lengthy messages consolidated (Day 1: 18 → 9; Day 2: 19 prompts), numbered by date; new standing-rules section; library L-01–L-10 updated to the current setup. Clean PDF properties.
- Prompt book scripts V2.0 (edited in place); the Day-2 markdown prompt file (V1.0) is superseded by the PDF.

## R3.0 — 2026-10-02
- New agent **SkyTech_WebsiteDeveloper** (`agents/SkyTech_WebsiteDeveloper.md` V1.0) with honesty rules: preview banner, noindex, no made-up facts or reviews, no logos without permission, disclosure placeholders for real estate and mortgage.
- `scripts/website/build_demo_sites.py` + `content.py` (V1.0): two templates (utility trades, real estate) with colour and icon per trade; one self-contained page per business; `demo-sites/manifest.csv` (no duplicates); `sql/05_demo_sites_built.sql` (re-runnable; leads → DemoBuilt + one Note activity).
- First 3 demos for owner review: C&A Plumbing (Howard), David P Davis Construction (Baltimore County), Lee Newton Co. (Baltimore City).
- Infrastructure diagram V1.2; docs/agents.md V1.2.

## R2.9 — 2026-10-02
- Admin site V1.2: the Possible duplicates tab is now a live check of every table, re-checked every 30 seconds (plus **Check now**). Red count in the menu (green 0 when clean) and an alert bar on the Dashboard.
  - Companies: same source ID or same name + ZIP (Exact); same phone, email or website (Likely); same name in another ZIP (Possible) → merge or "not a duplicate".
  - Leads: a company with more than one lead → keep one, merge the other into it.
  - Web presence: a company with more than one row → keep the newest, fill blanks, carry notes, remove extras.
  - Activities: same lead, type, text and day logged twice → remove the extra or "not a duplicate".
  - `npm run demo:duplicates` plants one example of each kind for practice.
- `sql/04_admin_site.sql` V1.2: `vw_DuplicateCheck`, `usp_MergeLeads`, `usp_FixDuplicateWebPresence` (both re-add the one-per-company unique rule once clean), `DuplicateDismissals.Category`.
- Infrastructure diagram V1.1 (Admin site V1.2, duplicate check).

## R2.8 — 2026-10-02
- Added `push-to-github.bat` (V1.0): one double-click uploads all commits and release tags.
- Project instructions V1.6 / README V2.5: infrastructure and all artifacts kept in the local folder; every change is committed and tagged by SkyTech_Manager and uploaded by the owner.

## R2.7 — 2026-10-02
- New infrastructure diagram V1.0 (`docs/architecture/SkyTech_Infrastructure.html/.pdf/.png`): data flow (9 steps), zones (free sources, Claude agents, owner's laptop, internet services), agents and roles, components and versions, lead lifecycle, standing rules. Generator: `scripts/docs/build_infrastructure.py` V1.0.
- Project instructions V1.5: keep the diagram updated and versioned.

## R2.6 — 2026-10-02
- Admin site V1.1: duplicate review station — compare pairs side by side, merge (keep one, remove the other; blanks filled, lead/activities/web info moved) or mark "not a duplicate"; all decisions audited.
- `sql/04_admin_site.sql` V1.1: DuplicateDismissals table, vw_DuplicateReview, usp_MergeCompanies (transactional).

## R2.5 — 2026-10-02
- New `admin-site/` (V1.0): Node.js + HTML/JavaScript admin website for SkyTechCRM — login (admin/viewer roles, bcrypt passwords, lockout after 5 failed tries), dashboard with KPIs and clickable charts, drill-down tables with search/filter/sort/paging/CSV export, create/edit/delete with duplicate protection, activity logging, audit log; demo mode with the 100-lead sample; Windows `start-admin.bat`; Hostinger move notes.
- New `sql/04_admin_site.sql` (V1.0): AdminUsers, AuditLog, vw_LeadDetail, vw_WebPresenceDetail, vw_ActivityDetail.

## R2.4 — 2026-10-02
- Duplicate protection: `sql/01_create_skytechcrm.sql` V2.0 (re-runnable; upgrades V1 databases) adds `StgLeads`, `ImportBatches`, `usp_ImportStagedLeads`, `fn_NormName`, `fn_DigitsOnly`, unique indexes and `vw_PossibleDuplicates`.
- Sample import → V1.2 (staging + procedure; safe to re-run); build script → V1.2; make_sample.py → V1.2 (SQL output superseded).
- Rules added to data README (V1.3), BackOffice role (V1.1) and project instructions (V1.4).

## R2.3 — 2026-10-02
- Added `agents/SkyTech_BackOffice.md` (V1.0); SkyTech_Manager role named in project instructions (V1.3).
- BackOffice verified all 100 leads: 36 potential clients. Added `data/verification/2026-10-02_backoffice_results.txt`; lead CSV and SQL import → V1.1; build script → V1.1.
- Database switched to the installed SQL Server 2014 Developer edition (plan V2.2, SQL script V1.1, README V2.2).

## R2.2 — 2026-10-02
- First 100-lead sample collected from Overture Explorer (2,896 matching businesses found; 99 of 100 with no website listed and a phone number). Priority A = 63, B = 5, C = 32.
- Added `scripts/leads/overture_browser_extract.js`, `scripts/leads/build_sample_from_extract.py`, the raw extract and the review CSV + SQL import.
- Version tags R1.0–R2.1 pushed to GitHub.

## R2.1 — 2026-10-02
- Recorded the local working folder `C:\Users\AV\Documents\SkyTechClaude\skytech-agent-program` and the GitHub link in README, project instructions, data README, Day-2 log, INDEX and version register.

## R2.0 — 2026-10-02
- Removed the library data step (licensing gap); added free lead data sources, Overture Maps Places as the main source (`docs/90-day-plan.md` V2.0).
- First niche and area chosen: real estate + utility trades in Baltimore City, Baltimore County and Howard County (`docs/90-day-plan.md` V2.1).
- Added `scripts/leads/make_sample.py` (V1.0 → V1.1 with Baltimore City): builds the 100-lead sample CSV and SQL import.
- BackOffice inputs updated in `docs/agents.md` (V1.1).
- Added versioning: `config/version-register.md`, `config/project-instructions.md` (V1.1, approved), version footers/headers on every file.
- Added `INDEX.md`, `CHANGELOG.md`, `data/`, `exports/pdf/`, `.gitignore`, `.gitattributes`.
- Moved prompt-book build scripts to `scripts/prompt-book/`; added Day-2 prompts.

## R1.0 — 2026-10-01
- First release: 90-day plan, agent roles, SQL schema and daily batch query, robots.txt, Day-1 session log, prompt book v1.0.

---
Version: V2.9 (2026-10-10) — CHANGELOG.md — V2.9
