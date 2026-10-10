# SkyTech Agent Program

Client acquisition program for **SkyTech Solutions LLC** (Maryland): free one-page demo websites for local businesses with no web presence, converted into paid setup and monthly care plans.

- Company website: https://skytechsolutions.us
- Facebook: https://www.facebook.com/profile.php?id=100063685406708
- Local working folder (owner's computer): `C:\Users\AV\Documents\SkyTechClaude\skytech-agent-program`
- GitHub: https://github.com/skytechsolutions2020/skytech-agent-program (private)
- Living plan document: https://claude.ai/code/artifact/df79af8a-1a3f-468e-8a59-c9b644cb8129

**Start here:** [`INDEX.md`](INDEX.md) lists every file and what each release contains. [`CHANGELOG.md`](CHANGELOG.md) explains what changed.

## Key documents (artifacts, versioned)

| Document | Current version | Where |
| --- | --- | --- |
| **Technology Stack Use**: every tool in plain words, merged with the architecture diagram | V1.0 | `docs/architecture/SkyTech_Technology_Stack_Use` (.html / .pdf / .md, journey .png) |
| Infrastructure and data-flow diagram | V1.5 | `docs/architecture/SkyTech_Infrastructure` (.html / .pdf / .png) |
| 90-Day Plan | V2.2 | living doc (link above) + `docs/90-day-plan.md` |
| Project instructions | V1.8 | `config/project-instructions.md` |
| Version register | V3.7 | `config/version-register.md` (copy in the Claude project) |
| Prompt Book | V2.0 | `prompts/SkyTech_Prompts_V2.0_2026-10-02.pdf` + daily prompt files |
| Admin site | V1.4 | `admin-site/` |
| SkyTechCRM database scripts | 01 V2.2 · 04 V1.4 · 05 V2.1 | `sql/` |
| Demo websites | template V2.1 | `demo-sites/` |
| Agent role files | BackOffice V1.1 · WebsiteDeveloper V1.2 | `agents/` |

Each one carries a version footer and is updated in place; every change is logged in the version register, `INDEX.md` and `CHANGELOG.md`, and released to GitHub.

## Goal (Oct 5, 2026 – Jan 3, 2027)
15–25 paying website clients, $800–$1,500 monthly recurring revenue plus $3,000–$5,000 in setup fees, at $0/month in tools.

## Current focus
Real estate and utility trades in Baltimore City, Baltimore County and Howard County. First step: a 100-lead test sample.

## Folders

| Folder | Holds |
| --- | --- |
| `docs/architecture/` | Technology Stack Use document and the infrastructure diagram (HTML, PDF, PNG, Markdown), built by `scripts/docs/` |
| `admin-site/` | Admin website: login, dashboards, drill-down, CRUD, duplicate check and Demo sites on SkyTechCRM; demo-site builder (see its README) |
| `demo-sites/` | Demo websites, one folder per business, plus their design files |
| `agents/` | Agent role files (SkyTech_BackOffice …) — edit to control each agent |
| `config/` | Project instructions, version register |
| `docs/` | 90-day plan, agent roles |
| `sql/` | SkyTechCRM schema and queries |
| `scripts/` | Lead processing, prompt book, diagram and Technology Stack Use builders |
| `data/` | Lead files: 100-lead sample, verification results, raw extract |
| `prompts/` | Daily prompt sets and prompt book |
| `website/` | Files for skytechsolutions.us |
| `exports/pdf/` | PDF copies of the documents |
| `logs/` | Daily session logs |

## Make the 100-lead sample
1. Download Places files from https://explore.overturemaps.org for Baltimore City, Baltimore County and Howard County ("Download Visible").
2. Put them in `data/raw/overture/<date>/`.
3. Run: `python scripts/leads/make_sample.py data/raw/overture/<date>/*.geojson`
4. Review `SkyTech_Leads_Sample100.csv`; in SSMS (SQL Server 2014 Developer) run `sql/01_create_skytechcrm.sql`, then `data/samples/SkyTech_Leads_Sample100_import.sql`.

## Push to GitHub
After SkyTech_Manager reports a new release, double-click **`push-to-github.bat`** in this folder. It uploads all new commits and release tags.

### First time only
On your computer, inside this folder:
```
git remote add origin https://github.com/skytechsolutions2020/skytech-agent-program.git
git push -u origin main --tags
```

## Working rules
- $0/month budget, free tools only.
- Owner approves every action; owner makes all phone calls.
- Every file carries a version footer; edit files in place and log changes in `config/version-register.md` and `INDEX.md`.
- When a tool or component changes, update the Technology Stack Use document and the architecture diagram (`python scripts/docs/build_tech_stack.py`) and bump their versions.
- Keep this repository private: it holds business contact data.

---
Version: V2.6 (2026-10-10) — README.md — V2.6
