# SkyTech Agent Program

Client acquisition program for **SkyTech Solutions LLC** (Maryland): free one-page demo websites for local businesses with no web presence, converted into paid setup and monthly care plans.

- Company website: https://skytechsolutions.us
- Facebook: https://www.facebook.com/profile.php?id=100063685406708
- Local working folder (owner's computer): `C:\Users\AV\Documents\SkyTechClaude\skytech-agent-program`
- GitHub: https://github.com/skytechsolutions2020/skytech-agent-program (private)
- Living plan document: https://claude.ai/code/artifact/df79af8a-1a3f-468e-8a59-c9b644cb8129

**Start here:** [`INDEX.md`](INDEX.md) lists every file and what each release contains. [`CHANGELOG.md`](CHANGELOG.md) explains what changed.

## Goal (Oct 5, 2026 – Jan 3, 2027)
15–25 paying website clients, $800–$1,500 monthly recurring revenue plus $3,000–$5,000 in setup fees, at $0/month in tools.

## Current focus
Real estate and utility trades in Baltimore City, Baltimore County and Howard County. First step: a 100-lead test sample.

## Folders

| Folder | Holds |
| --- | --- |
| `docs/architecture/` | Infrastructure diagram: data flow, agents, roles, components and versions (HTML, PDF, PNG) |
| `admin-site/` | Admin website: login, dashboards, drill-down, CRUD on SkyTechCRM (see its README) |
| `agents/` | Agent role files (SkyTech_BackOffice …) — edit to control each agent |
| `config/` | Project instructions, version register |
| `docs/` | 90-day plan, agent roles |
| `sql/` | SkyTechCRM schema and queries |
| `scripts/` | Lead processing and prompt-book scripts |
| `data/` | Lead files (none yet) |
| `prompts/` | Daily prompt sets and prompt book |
| `website/` | Files for skytechsolutions.us |
| `exports/pdf/` | PDF copies of the documents |
| `logs/` | Daily session logs |

## Make the 100-lead sample
1. Download Places files from https://explorer.overturemaps.org for Baltimore City, Baltimore County and Howard County ("Download Visible").
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
- Keep this repository private: it holds business contact data.

---
Version: V2.5 (2026-10-02) — README.md — V2.5
