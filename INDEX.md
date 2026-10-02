# SkyTech Repository Index

Quick reference: what each release contains and the version of every file. Releases are git tags (`git checkout R1.0` to see an old release).

## Releases

| Release | Date | Summary |
| --- | --- | --- |
| R2.0 | 2026-10-02 | Library step removed; free lead sources; niche/area chosen (real estate + utility trades, Baltimore City/County + Howard); lead sample script; versioning system; config, data, exports folders; this index |
| R1.0 | 2026-10-01 | First plan, agent roles, SQL schema and batch query, robots.txt, Day-1 session log, prompt book v1.0 |

## Files by release

| File | What it is | R1.0 | R2.0 |
| --- | --- | --- | --- |
| `README.md` | Overview, setup, push steps | V1.0 | V2.0 |
| `INDEX.md` | This index | — | V1.0 |
| `CHANGELOG.md` | Change history | — | V1.0 |
| `.gitignore` / `.gitattributes` | Git config | — | V1.0 |
| `config/project-instructions.md` | Approved project instructions | — | V1.1 |
| `config/version-register.md` | Version register (all files incl. claude.ai items) | — | V1.4 |
| `docs/90-day-plan.md` | 90-day plan (text copy of the living doc) | V1.0 | V2.1 |
| `docs/agents.md` | Agent roles and flow | V1.0 | V1.1 |
| `sql/01_create_skytechcrm.sql` | Creates SkyTechCRM database + 4 tables | V1.0 | V1.0 |
| `sql/02_daily_batch_query.sql` | BackOffice daily batch query | V1.0 | V1.0 |
| `scripts/leads/make_sample.py` | Overture files → 100-lead CSV + SQL import | — | V1.1 |
| `scripts/prompt-book/build_prompt_book.py` | Builds the prompt book PDF | V1.0 (`prompts/build.py`) | V1.0 (moved) |
| `scripts/prompt-book/content.py` | Prompt book text | V1.0 (`prompts/content.py`) | V1.0 (moved) |
| `website/robots.txt` | robots.txt for skytechsolutions.us | V1.0 | V1.0 |
| `prompts/SkyTech_Prompts_v1.0_2026-10-01.pdf` | Prompt book, Day 1 (1.01–1.18) + library L-01–L-10 | V1.0 | V1.0 |
| `prompts/SkyTech-Prompts-2026-10-02-V1.0.md` | Day 2 prompts (2.01–2.06) | — | V1.0 |
| `logs/2026-10-01.md` | Session log Day 1 | V1.0 | V1.0 |
| `logs/2026-10-02.md` | Session log Day 2 | — | V1.0 |
| `data/README.md` | Data folder rules (no lead files yet) | — | V1.0 |
| `exports/pdf/01_README.pdf` … `08_Prompt_Book_v1.0_2026-10-01.pdf` | PDF set from Oct 1 | — | V1.0 |
| `exports/pdf/02_90-Day_Plan_V2.1.pdf` | 90-day plan PDF with diagrams | — | V2.1 |

## Items outside this repository

| Item | Where | Version |
| --- | --- | --- |
| 90-Day Plan living doc (with diagrams) | claude.ai artifact: https://claude.ai/code/artifact/df79af8a-1a3f-468e-8a59-c9b644cb8129 | V2.1 |
| Project notes, register, instructions, prompts | claude.ai Project "AgentProcessCreation_For_FreeMassOnePagewebsitebuild_MarketSkyTechbpresence" | see `config/version-register.md` |
| SkyTechCRM database | SQL Server Express on owner's laptop (not created yet) | schema V1.0 |

---
Version: V1.0 (2026-10-02) — INDEX.md — V1.0
