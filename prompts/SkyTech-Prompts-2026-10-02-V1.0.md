# SkyTech Prompts — 2026-10-02 — V1.0

End-of-day prompt set. Numbering by day: Day 2 = 2.01, 2.02 … (Day 1 prompts are in `SkyTech_Prompts_v1.0_2026-10-01.pdf`).

## Day 2 — Friday, October 2, 2026

### 2.01 Versioning — V1.0
As written: "Make Versioning of the files. Add V1.0 at the end of any content you give me as part of project. Also update relevant project instructions with the same version numbers to identify easily. Also make versioning of Prompts which will be downloaded at the end of day."
Engineered:
FORMAT RULE (standing): End every file or content delivered for this project with `Version: Vx.y (date) — <file> — Vx.y`. Minor edits bump x.y → x.(y+1); process or structure changes bump the major number. Keep the version register and project instructions in step. Save end-of-day prompts as `SkyTech-Prompts-<date>-Vx.y.md`.

### 2.02 Remove library step — V1.0
As written: "remove step of getting data from library as it is GAP and give me other sources to get this information free we will implement that"
Engineered:
TASK: Remove the library data step from the plan and instructions. Research free lead sources that allow business use and list, for each: what data it gives, cost and license, how to pull it, and what to use it for.
RULES: Edit existing files in place. Cite sources. No scraping that breaks site terms.
OUTPUT: Updated plan section and a short summary with sources.

### 2.03 Edit in place — V1.0
As written: "Edit the file you just made instead of creating a new one … edit the same file"
Engineered:
RULE (standing): When updating, edit the existing file and bump its version footer. Do not create a new file for a new version.

### 2.04 Update project instructions — V1.0
As written: "yes" / "approved"
Engineered:
APPROVAL: Update the project instructions to V1.1 with the free lead sources and log it in the version register.

### 2.05 Niche and 100-lead sample — V1.0
As written: "Niche will be real estate and utility working small business in Baltimore and Howard counties. pull a subset of 100 first to work on as sample to test"
Engineered:
ROLE: SkyTech_BackOffice.
TASK: Pull leads for real estate and utility trades (plumbing, electrical, HVAC, roofing, handyman, contractors) in Baltimore City, Baltimore County and Howard County from Overture Maps Places. Select a 100-lead test sample: no website first, phone listed, balanced across niche and county.
OUTPUT: CSV for review and a SQL import script for SkyTechCRM (batch "Sample100 Oct-2026").

### 2.06 Desktop app, Baltimore City, GitHub repo with index — V1.0
As written: "Let me know how I can install Claude desktop app and link this session to my computer. Include Baltimore City as well. Also I want you to push All the Artifacts created by this project (every thing like scripts,code,dbs,data files, config files etc) I want you to organize in github repo and maintain what each version consists of in separate index file for quick reference"
Engineered:
TASK: (1) Give step-by-step desktop app install and linking instructions. (2) Add Baltimore City to the lead area. (3) Organize every project artifact (docs, scripts, SQL, data, config, exports, prompts, logs) in the GitHub repository skytech-agent-program with tagged releases, and keep `INDEX.md` listing what each release contains and each file's version.
IF BLOCKED: Package the repository with its git history as a zip and give upload/push steps.

### Carry-over — V1.0 (pending)
"Go" → build the 7 agent skills and the demo website template. Status: awaiting owner.

---
Version: V1.0 (2026-10-02) — prompts/SkyTech-Prompts-2026-10-02-V1.0.md — V1.0
