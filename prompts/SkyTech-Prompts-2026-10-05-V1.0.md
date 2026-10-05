# SkyTech Prompts — 2026-10-05 — V1.1

End-of-day prompt set. Numbering by day: Day 5 = 5.01, 5.02 … (Day 4 prompts: `SkyTech-Prompts-2026-10-04-V1.0.md`; Day 3 prompts: `SkyTech-Prompts-2026-10-03-V1.0.md`; Day 2 prompts: `SkyTech-Prompts-2026-10-02-V1.0.md`, consolidated in Prompt Book V2.0).

## Day 5 — Monday, October 5, 2026 (program start date)

### 5.01 Versioning (scheduled re-run) — V1.0
As written (scheduled task): "Make Versioning of the files. Add V1.0 at the end of any content you give me as part of project. Also Update relevant project instructions with the same version numbers to identify easily. Also make versioning of Prompts which will be downloaded at the end of day."
Engineered:
FORMAT RULE (standing, unchanged from 2.01): End every file or content delivered for this project with `Version: Vx.y (date) — <file> — Vx.y`. Keep the version register and project instructions in step. Save end-of-day prompts as `SkyTech-Prompts-<date>-Vx.y.md`.
RESULT: Existing versioning system confirmed in place; Day 5 prompt file created (V1.0); register updated to V2.8. No change to project instructions content, so they stay at V1.6.

### 5.02 Unique, attractive demo sites stored in the database — V1.0
As written: "These 3 demo one pager will be with some customer attractive, professional theme and modern color combinations with relevant logos and images. Each site will be unique by itself. I will save this entry into relevant database table and can see and edit in admin page"
Engineered:
ROLE: SkyTech_WebsiteDeveloper, reporting to SkyTech_Manager.
TASK: Redesign the 3 demo one-page websites (C&A Plumbing, David P Davis Construction, Lee Newton Co.) so each is unique: its own layout, modern colour palette, font pairing, concept logo and relevant images. Store each demo as a record in a SkyTechCRM table (one row per company, no duplicates) and add a Demo sites section to the Admin site to view, edit, preview and save them.
RULES: Free tools only. No third-party logos or photos without permission (stock photo sites are blocked on this network, so use original concept art). Keep the preview banner, noindex and no made-up facts until the business approves. Version every file and release to the local folder.
OUTPUT: The 3 redesigned demos, the DemoSites table and Admin tab, updated SQL scripts, and release R3.2.
RESULT: Layouts split / bold / classic (Fresh Water, Blueprint, Harbor Classic); dbo.DemoSites (sql/01 V2.1, sql/04 V1.3, sql/05 V2.0); Admin site V1.3 with live preview; release R3.2.

### Carry-over — V1.1 (pending)
Owner: run `push-to-github.bat`; set up the database in SSMS (01 → sample import → 04 → 05); review the 3 demos in the Admin site; choose free hosting for demo links (Netlify recommended).

---
Version: V1.1 (2026-10-05) — SkyTech-Prompts-2026-10-05-V1.0.md — V1.1
