# SkyTech Prompts — 2026-10-10 — V1.2

End-of-day prompt set. Numbering by day: Day 10 = 10.01, 10.02 … (Day 9 prompts: `SkyTech-Prompts-2026-10-09-V1.0.md`; Day 8: `SkyTech-Prompts-2026-10-08-V1.0.md`; Day 7: `SkyTech-Prompts-2026-10-07-V1.0.md`; Day 6: `SkyTech-Prompts-2026-10-06-V1.0.md`; Day 5: `SkyTech-Prompts-2026-10-05-V1.0.md`; Day 4: `SkyTech-Prompts-2026-10-04-V1.0.md`; Day 3: `SkyTech-Prompts-2026-10-03-V1.0.md`; Day 2: `SkyTech-Prompts-2026-10-02-V1.0.md`, consolidated in Prompt Book V2.0).

## Day 10 — Saturday, October 10, 2026

### 10.01 Versioning (scheduled re-run) — V1.0
As written (scheduled task): "Make Versioning of the files. Add V1.0 at the end of any content you give me as part of project. Also Update relevant project instructions with the same version numbers to identify easily. Also make versioning of Prompts which will be downloaded at the end of day."
Engineered:
FORMAT RULE (standing, unchanged from 2.01): End every file or content delivered for this project with `Version: Vx.y (date) — <file> — Vx.y`. Keep the version register and project instructions in step. Save end-of-day prompts as `SkyTech-Prompts-<date>-Vx.y.md`.
RESULT: Existing versioning system confirmed in place; Day 10 prompt file created (V1.0); register updated to V3.5. No change to project instructions content, so they stay at V1.6.

### 10.02 Technology Stack Use document — V1.0
As written: "I want you to manage and maintaining another document with versioning named "Technological stack Use" this project uses and update it with tools and technology and merge it with Archtecture diagram to give it a meaning for layman to see and understand."
Engineered:
ROLE: SkyTech_Manager.
TASK: Create and maintain a versioned document, "SkyTech Technology Stack Use", listing every tool and technology the program uses. For each tool, say in plain words what it is, what we use it for, what it costs, where it runs and whether it is in use. Merge it with the architecture diagram, and add a simple step-by-step picture so a non-technical reader understands how everything fits together.
RULES (standing): Update and re-version the document whenever a tool is added, changed or retired. Keep it generated from the same source as the architecture diagram so the two always match. Save it in the local folder, release it with the other artifacts, and keep PDFs free of AI traces.
OUTPUT: `docs/architecture/SkyTech_Technology_Stack_Use` (HTML + PDF + journey picture PNG), generator `scripts/docs/build_tech_stack.py`, and release R3.4.
RESULT: V1.0 has a six-step "one-minute picture", the architecture diagram V1.5 with its data flow, 42 tools in 8 plain-language groups with cost and status, a $0 new-spend summary, a glossary and a change log. Project instructions V1.7 add the standing rule.

### 10.03 Technology Stack Use as a versioned artifact — V1.0
As written: "Add this to list of Artifacts and maintain versioning going forward"
Engineered:
INSTRUCTION (standing): Treat the Technology Stack Use document as a project artifact. List it, with its current version, alongside the other key documents. Keep a copy in the Claude project. Re-version and release it whenever a tool or component changes.
RESULT: README V2.6 gains a "Key documents (artifacts, versioned)" table; the generator V1.1 also writes a Markdown copy, kept in the repo and in the Claude project (`claude/SkyTech-Technology-Stack-Use.md`); version-register rule 9; project instructions V1.8; release R3.5.

### 10.04 Comments, enterprise security, error codes and logging — V1.0
As written: "Add comments in all the architecture, code and scripts generated in this project with functionality what it does for future understanding, also document these comments in detail in Architecture and Code documentation with versioning. Implement Enterprise industry level security Architecture and apply whole as a project. I want you to implement troubleshoot error code and logging mechanism and documentation where you predict future error to project architecture code and scripts can resolve the issues easily/manually if possible with this document."
Engineered:
ROLE: SkyTech_Manager.
TASK:
1. Comment every program file (Admin site, SQL scripts, Python and Node scripts, .bat files): a purpose block per file and a one-line description of each function, table, view and procedure. Collect the comments into a versioned Code Documentation.
2. Design and apply an industry-standard security architecture across the project (OWASP ASVS, NIST CSF 2.0, CIS Controls v8, scaled to $0 and one PC): threat model, controls in code and database, secrets handling, backups, incident response; document it as a versioned Security Architecture.
3. Add an error-code and logging mechanism: one catalog of codes with causes and fixes (including predicted future errors), codes on every message, structured logs, a database error log and a one-command health check. Document it as a versioned Troubleshooting Guide so the owner can fix issues manually.
RULES (standing): Keep the three documents, the error catalog, the architecture diagram and the Technology Stack Use document in step with the code and re-version them with each release. Never log or commit secrets.
OUTPUT: Release R4.0 with HTML, PDF and Markdown documents in `docs/architecture/`.
RESULT: Admin site V2.0 (CSP, CSRF, rate limits, lockout, session timeouts, System log), error catalog V1.1 (65 codes), JSON logs, `npm run doctor`, secret scan before push, `sql/06` (least-privilege role, append-only audit, verified backups), `dbo.ErrorLog` in every procedure, comments in every file; Security Architecture, Troubleshooting Guide and Code Documentation V1.0; diagram V1.6; Technology Stack Use V1.1; project instructions V1.9.

### Carry-over from Day 5 (still pending)
Owner: run `push-to-github.bat`; set up the database in SSMS (01 → sample import → 04 → 05 → 06), then `npm run doctor`; review the 3 demos in the Admin site; choose free hosting for demo links (Netlify recommended).

---
Version: V1.3 (2026-10-10) — SkyTech-Prompts-2026-10-10-V1.0.md — V1.3
