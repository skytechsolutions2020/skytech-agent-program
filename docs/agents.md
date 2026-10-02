# SkyTech Agents

| Agent | Input | Output | Daily report line |
| --- | --- | --- | --- |
| SkyTech_Manager | Owner's goals, all agent reports | Today's batch, task list, evening report | Totals and blockers |
| SkyTech_ProjectManagement | 90-day plan, Manager report | Timeline updates, risk flags, weekly review | Milestones on track or late |
| SkyTech_BackOffice | Free lead files (Overture, Foursquare, OpenStreetMap), SQL tables, batch criteria | Imports, web presence checks, NoSite leads | Checked, no-site found |
| SkyTech_WebsiteDeveloper (active, `agents/SkyTech_WebsiteDeveloper.md`) | NoSite leads | Demo site in `demo-sites/`, later a Netlify link | Demos built |
| SkyTech_PhoneMarketing | Demo links, lead details | Call sheet, script, follow-up emails, logged outcomes | Calls, interested, deals |
| SkyTech_SocialMediaMarketing | Demos, wins | Posts, DMs, replies to inquiries | Posts, DMs, leads |

## Flow

```
Owner (approves, calls, closes deals)
 ├── SkyTech_Manager  <── daily reports from all agents
 │     └── SkyTech_BackOffice ──(no-site leads)──> SkyTech_WebsiteDeveloper
 │                                                    ├──(demo links)──> SkyTech_PhoneMarketing
 │                                                    └──(demo links)──> SkyTech_SocialMediaMarketing
 └── SkyTech_ProjectManagement (syncs with Manager)
```

## Adding agents

Each agent is one saved skill with a role file. To add one (e.g., SkyTech_EmailMarketing or SkyTech_ClientSupport once clients pass 20), write its role and add it to the Manager's roster.

---
Version: V1.2 (2026-10-02) — docs/agents.md — V1.2
