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

### Carry-over from Day 5 (still pending)
Owner: run `push-to-github.bat`; set up the database in SSMS (01 → sample import → 04 → 05); review the 3 demos in the Admin site; choose free hosting for demo links (Netlify recommended).

---
Version: V1.2 (2026-10-10) — SkyTech-Prompts-2026-10-10-V1.0.md — V1.2
