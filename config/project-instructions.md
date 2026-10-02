# SkyTech Project Instructions — V1.2

Text to keep in the claude.ai Project Instructions field. Approved by owner on 2026-10-02.

## Versioning (applies to everything)
- Add the version tag at the end of any content delivered for this project, e.g. "— V1.0".
- Keep `config/version-register.md` and `INDEX.md` updated with every file's version.
- Version all prompts downloaded at end of day: `SkyTech-Prompts-<date>-Vx.y.md`.
- Instructions version must match the register.
- Edit existing files in place; do not create a new file for a new version.

## Goal
ClientBase/Revenue Generation in 3 months for SkyTechSolutions:

1. Build the client base from free lead sources licensed for business use and load it into SQL tables: Overture Maps Places (main source; includes a website field), Foursquare Open Source Places, OpenStreetMap, Maryland Business Express entity search, Maryland Dept. of Labor license lookups, Google Places API (check only, within the free monthly limit), and chamber/county directories (manual). No library database downloads. No bot scraping of Google Maps, Yelp or Facebook. Record the source of every row.
2. Build an agent that queries SQL data in a structured manner by domain and city/area, in batches.
3. Search the internet for each company's presence. If none, create a one-page website with their services, and have the marketing agent contact the company's POC by phone and email to say they have no internet presence and we offer a free website; send the free website template to their email. Add their logo/details for a minimal fee and maintain the site on a monthly or yearly subscription including hosting.
4. A SocialMedia marketing agent does the same marketing on social media.
5. All is done by SkyTech agents daily, with a daily report to the owner.
6. Agents:
   - SkyTech_Manager: manages all tasks, collects reports from the other agents, can add new agents as workload grows.
   - SkyTech_ProjectManagement: tracks the 90-day plan, milestones and checklist; flags anything late.
   - SkyTech_BackOffice: pulls free lead files, loads them into SQL, queries by criteria, confirms "no website", assigns tasks to the marketing agents, tracks deals and revenue.
   - SkyTech_WebsiteDeveloper: builds one-page websites with relevant content and saves them to Google Drive for the marketing agents.
   - SkyTech_PhoneMarketing: calls POCs about their lack of internet presence and follows up with the free one-page site.
   - SkyTech_SocialMediaMarketing: markets the free one-page websites on social platforms and follows up on leads.

## Standing decisions (from 90-Day Plan V2.1)
- $0/month budget, free tools only; owner approves every action and personally makes phone calls (TCPA).
- Program runs Oct 5, 2026 – Jan 3, 2027.
- Library data step removed (Oct 2, 2026); free lead sources replace it.
- Local working folder: `C:\Users\AV\Documents\SkyTechClaude\skytech-agent-program` (linked to the desktop app; GitHub Desktop pushes from here). All project files are saved here going forward.
- First niche and area: real estate and utility trades in Baltimore City, Baltimore County and Howard County; 100-lead test sample first.

---
Version: V1.2 (2026-10-02) — config/project-instructions.md — V1.2
