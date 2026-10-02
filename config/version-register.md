# SkyTech Version Register

## Versioning rules
1. Every file or content delivered as part of this project ends with a footer line: `Version: Vx.y (date) — <file name> — Vx.y`.
2. Minor edits (typos, small additions, status updates) bump the minor number: V1.0 → V1.1 → V1.2.
3. Major changes (restructured plan, new agents, new pricing, new process) bump the major number: V1.x → V2.0.
4. Project instructions carry a version that matches the highest-impact change; the register below shows which file versions belong to which instructions version.
5. Prompts downloaded at end of day are saved as `SkyTech-Prompts-<YYYY-MM-DD>-Vx.y.md`, numbered by day (2.01, 2.02 …), each with its own version tag.
6. Older versions are not overwritten silently: the change is logged below with date and reason.
7. Existing files are edited in place; the file name stays the same and the version footer changes.
8. GitHub releases are tagged R<major>.<minor>; `INDEX.md` lists what each release contains.

## Register (as of 2026-10-02)
| File | Version | Date | Notes |
|---|---|---|---|
| 90-Day Plan living doc (claude.ai artifact) | V2.1 | 2026-10-02 | V2.0 free lead sources; V2.1 niche and area chosen |
| Project instructions (claude.ai field + `config/project-instructions.md`) | V1.1 (approved) | 2026-10-02 | Free lead sources; pasted into Project Instructions by owner |
| Version register (claude.ai project + `config/version-register.md`) | V1.4 | 2026-10-02 | This register |
| SkyTech-90-Day-Plan-link.md (claude.ai project) | V1.2 | 2026-10-02 | Plan notes and next steps |
| SkyTech-Prompts-2026-10-02-V1.0.md | V1.0 | 2026-10-02 | Day-2 prompts 2.01–2.06 |
| Prompt book PDF (Day 1) | V1.0 | 2026-10-01 | 1.01–1.18 + L-01–L-10 |
| `scripts/leads/make_sample.py` | V1.1 | 2026-10-02 | Baltimore City added |
| GitHub repository `skytech-agent-program` | R2.0 | 2026-10-02 | See `INDEX.md` |

## Change log
- 2026-10-02 V1.0: Versioning system introduced.
- 2026-10-02 Plan doc V1.0 → V2.0: library data step removed; free lead data sources added. Plan link file → V1.1; register → V1.1.
- 2026-10-02 Project instructions V1.0 → V1.1: free lead sources; ProjectManagement agent; edit-in-place rule. Register → V1.2.
- 2026-10-02 Project instructions V1.1 approved and pasted by owner. Register → V1.3.
- 2026-10-02 Plan doc V2.0 → V2.1: niche and area chosen (real estate + utility trades; Baltimore City, Baltimore County, Howard County). Lead script V1.1 (Baltimore City). GitHub repository organized as R1.0 + R2.0 with `INDEX.md`. Register → V1.4.

---
Version: V1.4 (2026-10-02) — SkyTech-Version-Register.md — V1.4
