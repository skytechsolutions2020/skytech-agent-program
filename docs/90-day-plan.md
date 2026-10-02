# SkyTech Agent Program – 90-Day Plan

Oct 1, 2026 · SkyTech Solutions LLC

## Goal and summary

By early January 2027, SkyTech Solutions LLC aims to sign **15–25 paying website clients** and **$800–$1,500 in monthly recurring revenue, plus $3,000–$5,000 in setup fees**. Tools cost $0 a month.

Find local businesses with no website, build each one a free demo one-page site, and show it to the owner by email, phone and social media. Then charge to make it live, plus a monthly or yearly care plan.

- **Agents** are Claude routines run from the Claude project, each with a written role, plus small free Python scripts. The owner approves every send and every call.
- **The owner** makes the phone calls, closes deals and takes payment. The agents prepare everything else.
- **Volume target:** 20 businesses researched a day, 10 demo sites a week, 150–200 owners contacted a month.
- **Open question:** client data file and its license terms. Import starts when provided.

## Gaps fixed and legal guardrails

General information, not legal advice.

| Gap | Risk if ignored | Fix |
| --- | --- | --- |
| Library data license | Library databases (e.g., Data Axle Reference Solutions) usually ban bulk export and commercial use | Read the terms before export; if barred, use free public sources: Google Maps, MD SDAT business registry, chamber of commerce lists, Yelp, Facebook |
| AI voice phone calls | FCC (2024) treats AI voices as "artificial" under TCPA; fines per call to cell phones without consent | Agent prepares lists and scripts; owner or a hired caller dials. Check the National Do Not Call list |
| Cold email rules | CAN-SPAM fines; Gmail account suspended | Real business address, unsubscribe line, honest subject, max 30–50 a day, honor opt-outs within 10 days |
| Domain reputation | skytechsolutions.us lands on spam lists | Send outreach from a second address or a cheap secondary domain later; warm up slowly |
| Using their logo and name publicly | Trademark complaints, looks deceptive | Demo sites stay unlisted, carry a "Demo by SkyTech – not affiliated" banner, use stock images until they agree |
| "No web presence" is often wrong | Embarrassing pitch | Check Google, Maps, Facebook, Yelp before building; record result in SQL |
| No CRM | Leads lost, double calls | Status column in SQL plus HubSpot Free CRM |
| No contract or payments | Unpaid work | One-page service agreement; Stripe/Square/PayPal invoice before go-live |
| SQL Server 2014 | Out of support since July 2024; Developer edition not licensed for business use | Install SQL Server 2022 Express (free, licensed for production) |

## Agent team

See [agents.md](agents.md). Work flows down from SkyTech_Manager: BackOffice finds no-site leads → WebsiteDeveloper builds demos → PhoneMarketing and SocialMediaMarketing reach owners → every agent reports back daily to the Manager, who reports to the owner. ProjectManagement syncs with the Manager on the timeline.

## Free tool stack

| Need | Tool | Free limit to watch |
| --- | --- | --- |
| Database | SQL Server 2022 Express + SQL Server Management Studio | 10 GB per database |
| Agents | Claude project (one saved skill per agent) + Python scripts | Existing Claude plan |
| Web presence check | Claude web search; manual Google/Maps spot-check | ~20 businesses a day |
| Demo sites | Static HTML one-pagers on Netlify or Cloudflare Pages | Unlisted preview links |
| Live client sites | Existing Hostinger plan | Number of sites the plan allows |
| File handoff | Google Drive folders | 15 GB |
| Email | Gmail, or Brevo free | Gmail ~30–50 cold a day; Brevo 300 a day |
| Calls | Own phone or Google Voice | Personal use only |
| CRM | HubSpot Free CRM, or the SQL Leads table | Free tier contact cap |
| Social | Facebook Page, LinkedIn, Instagram, Nextdoor, Google Business Profile, Canva free | Platform posting rules |
| Payments | Stripe, Square or PayPal invoices | ~2.9% + 30¢ per payment |
| Contracts | Google Docs template + a free e-sign tool | Free tiers cap signatures a month |
| Daily reports | Google Sheet the Manager agent fills | — |

## SQL database design

Four tables: Companies, WebPresence, Leads, Activities. Leads.Status is the CRM pipeline. Scripts are in [`../sql`](../sql).

## Daily workflow and volumes

About 2 hours of owner time a day.

1. **8:30 – Manager kickoff (5 min).** Owner says "Run SkyTech daily." Manager reads yesterday's report and sets today's batch.
2. **BackOffice (15 min).** Pulls 20 companies by industry and city, checks web presence, writes results to WebPresence, moves no-site companies to Leads as NoSite.
3. **WebsiteDeveloper (20 min).** Builds 2 demo one-pagers from a template, uploads to Netlify, saves HTML and link to Google Drive /Demos/, sets status DemoBuilt.
4. **PhoneMarketing (owner, 60 min).** Agent gives a call sheet: 10 owners, script, demo link. Owner calls; agent logs outcomes and sends the approved follow-up email.
5. **SocialMediaMarketing (20 min).** Drafts 1 post a day and 3–5 DMs to businesses with a Facebook page but no site. Owner approves and posts.
6. **ProjectManagement (5 min).** Updates the timeline tracker and flags anything behind.
7. **5:00 – Manager report.** Daily report in Google Sheets: researched, demos built, calls, emails, replies, deals, revenue.

| Activity | Per day | Per week |
| --- | --- | --- |
| Businesses checked | 20 | 100 |
| Demo sites built | 2 | 10 |
| Owner calls | 10 | 50 |
| Emails sent | 15–30 | 75–150 |
| Social posts | 1 | 5 |

## Offer and pricing packages

| Package | Price | Includes |
| --- | --- | --- |
| Free Demo | $0 | One-page preview with their services, unlisted link, 14 days |
| Go-Live Setup | $199 one-time | Their logo, photos, text edits, contact form, domain connected, Google Maps embed |
| Care Plan | $39/month or $399/year | Hosting on Hostinger, SSL, backups, 2 small edits a month, uptime check |
| Growth Plan | $99/month | Care Plan + Google Business Profile management, 1 post a week, review replies, monthly report |
| Domain | At cost (~$15–20/year) | Registered in the client's name |

Revenue math: 20 clients on Care Plan = $780 a month recurring, plus $3,980 in setup fees.

## Extra revenue ideas

| Idea | Suggested price | Why it sells |
| --- | --- | --- |
| Google Business Profile setup and verification | $99–$149 one-time | Many businesses with no website also have no Maps listing |
| Online booking or quote form | $49 add-on | Salons, cleaners, contractors want leads while they work |
| Website chat assistant (FAQ bot) | $29/month add-on | Answers questions after hours |
| Review request system | $29/month | QR card + text link asking for Google reviews |
| Logo and business card design (Canva) | $79–$149 | Many prospects lack a usable logo |
| Professional email on their domain | $49 setup | Replaces gmail.com addresses |
| Website redesign for outdated sites | $399–$799 | Old, non-mobile sites, not only missing ones |
| Referral reward | 1 free month per referral | Turns clients into salespeople |
| White-label for local agencies and accountants | Revenue share | They refer clients needing sites |

## 90-day timeline

| Phase / milestone | Dates | Focus | Exit gate |
| --- | --- | --- | --- |
| 1 Setup | Oct 5 – Oct 18 | Tools, SQL database, demo template, agent skills, data import | 10 demo sites built from real leads |
| Milestone: first 10 demos live | Oct 16 | | |
| 2 Pilot one niche | Oct 19 – Nov 15 | One niche, one city; owner calls daily; refine script and pricing | First paid client; reply rate known |
| Milestone: first paying client | Nov 6 | | |
| 3 Scale to 3 niches | Nov 16 – Dec 13 | Add 2 niches; social agent active; Growth Plan upsell | 10 paying clients |
| Milestone: 10 paying clients | Dec 4 | | |
| 4 Optimize and upsell | Dec 14 – Jan 3 | Drop weak niches, push yearly plans, ask for referrals | 15–25 clients, plan next 90 days |
| Milestone: day-90 review | Jan 3, 2027 | | |

ProjectManagement checks progress against these gates every Friday.

## Getting started checklist

- [ ] Read the library database's terms of use; confirm export and business use are allowed
- [ ] Install SQL Server 2022 Express and SQL Server Management Studio
- [ ] Run `sql/01_create_skytechcrm.sql`
- [ ] Create Google Drive folders: /SkyTech/Demos, /SkyTech/Reports, /SkyTech/Templates, /SkyTech/Contracts
- [ ] Create free accounts: Netlify, HubSpot CRM, Brevo, Stripe or Square, Canva
- [x] Create a SkyTech Facebook Page
- [ ] Create a Google Business Profile for SkyTech Solutions LLC
- [ ] Add a "Websites for Local Businesses" page with pricing to skytechsolutions.us
- [ ] Pick the first niche and city (suggested: home services in your county)
- [ ] Set up the 7 agent skills and the demo website template
- [ ] Provide the client data file for import
