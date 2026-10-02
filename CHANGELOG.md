# Changelog

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
Version: V1.5 (2026-10-02) — CHANGELOG.md — V1.5
