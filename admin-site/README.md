# SkyTech Admin Site

A private admin website for SkyTech Solutions LLC. Sign in, see dashboards that highlight what needs attention, drill down from any chart into the matching records, and create, read, update and delete (CRUD) records in **SkyTechCRM**.

- Runs on your laptop at **http://127.0.0.1:3030**, visible only on this computer.
- Data: SkyTechCRM on SQL Server 2014 Developer (your existing install).
- Every login, change and delete is written to the **Audit log**.
- Duplicate protection: the database rules from `sql/01_create_skytechcrm.sql` V2.0 also apply to edits made here.

## What you get

| Screen | What it shows / does |
| --- | --- |
| Dashboard | Potential clients, demos, contacted, pipeline, clients won, monthly recurring revenue, setup revenue, follow-ups due, possible duplicates; charts by status and by area × niche (click to drill down); follow-ups for the next 7 days; recent activity; recent imports |
| Leads | Search, filter (status, agent, county, niche), sort, page, export CSV; open a lead to edit status, follow-up date, deal value, monthly plan, demo URL; log calls/emails; jump to the company and its web presence |
| Companies | Full CRUD; name + ZIP duplicates are refused |
| Web presence | Website / Facebook / Google profile per company |
| Activities | Calls, emails, posts and notes per lead |
| Demo sites | One row per business demo website (table `DemoSites`). Edit the layout, colours, fonts, concept logo, artwork, headline, services, highlights, steps, areas and status; **Open live preview** shows the page built from the saved fields; **Download HTML** or **Save to demo-sites folder** writes the finished page. Status runs Draft → ReadyForReview → Approved → Sent → Published (the preview banner and "noindex" are removed only at Published) |
| Imports | Every import run with rows in, new, updated, skipped |
| Possible duplicates | **Live check of every table**, refreshed every 30 seconds (plus a **Check now** button). The menu shows a red count of duplicates found right now (green 0 when clean), and the Dashboard shows an alert bar. What it finds is listed in the table below. Click a row to compare side by side and fix it. Every decision is in the Audit log |
| Audit log | Who changed what, when (before → after) |

Two roles: **admin** (read and write) and **viewer** (read only).

### What the duplicate check finds

| Table | Severity | Found when | Fix offered |
| --- | --- | --- | --- |
| Companies | Exact | Same source ID, or same name + same ZIP | Keep A / remove B (merge), or Not a duplicate |
| Companies | Likely | Same phone, same email or same website | same as above |
| Companies | Possible | Same name in another ZIP | same as above |
| Leads | Exact | A company has more than one lead | Keep one lead, merge the other into it (further-along status kept, activities moved) |
| Web presence | Exact | A company has more than one web-presence row | Keep the newest row (blanks filled, notes carried over), remove the extras |
| Activities | Likely | Same lead, type, text and day logged twice | Keep A / remove B, or Not a duplicate |

Each pair shows only its strongest reason. After the last extra lead or web row is fixed, the database adds its one-per-company rule back automatically if it was missing.

## One-time setup (Windows)

1. **Install Node.js** (free): download the **LTS** version from https://nodejs.org and install with default options.
2. **Database objects:** in SSMS, connected to your SQL Server, run these files in order (all are safe to re-run):
   1. `sql\01_create_skytechcrm.sql` (V2.1 adds the `DemoSites` table)
   2. `data\samples\SkyTech_Leads_Sample100_import.sql` (the 100-lead sample)
   3. `sql\04_admin_site.sql` (V1.3: duplicate check + demo sites view)
   4. `sql\05_demo_sites_built.sql` (loads the demo websites into `DemoSites`; edits you make in the Admin site are never overwritten)
3. **Settings:** in this `admin-site` folder, copy `.env.example` to a new file named `.env` and edit:
   - `DB_SERVER` = the server name you use in SSMS (e.g. `localhost` or `localhost\SQL2014`)
   - `DB_AUTH=windows` (uses your Windows login, no password)
   - `DB_DRIVER` = an installed ODBC driver. To check: press Windows key → type **ODBC Data Sources (64-bit)** → **Drivers** tab. Use `SQL Server Native Client 11.0` (comes with SQL Server 2014) or `ODBC Driver 17 for SQL Server` if you see it.
   - `SESSION_SECRET` = any long random phrase.
4. **Install the site:** open a Command Prompt in this folder (in File Explorer, click the address bar, type `cmd`, press Enter) and run:
   ```
   npm install
   ```
5. **Create your login:**
   ```
   npm run create-admin
   ```
   Enter a username, a password of at least 10 characters, and the role `admin`.

## Daily use

Double-click **`start-admin.bat`** (or run `npm start`), then open **http://127.0.0.1:3030** and sign in. Close the black window to stop the site.

**Try it without the database:** `npm run demo` loads the 100-lead sample into memory (login `admin` / `demo1234`, or `viewer` / `demo1234` for read-only). Demo changes are discarded when it stops.

**Build the demo websites again** (after changing a design file in `demo-sites\designs`): `npm run build-demos`.

**Try the duplicate check:** `npm run demo:duplicates` does the same and adds one example of each duplicate kind (7 in total), so you can see the red count and practise each fix.

## Troubleshooting

| Message | Fix |
| --- | --- |
| Could not connect to the database | Check `DB_SERVER` matches SSMS, the SQL Server service is **Running**, and `DB_DRIVER` is an installed driver |
| Windows login needs the "msnodesqlv8" package | Run `npm install` again on this Windows PC (it installs the Windows driver bridge) |
| Invalid object name 'dbo.vw_LeadDetail' / 'dbo.AdminUsers' / 'dbo.vw_DuplicateCheck' | Run `sql\04_admin_site.sql` (V1.2) in SSMS |
| Wrong username or password | Run `npm run create-admin` again with the same username to reset the password |

## Moving to skytechsolutions.us (Hostinger) later

The site is a standard Node.js app, the same type as your current Hostinger website, so the code can move as it is. The **database** is the part to plan:

1. Hostinger cannot reach the SQL Server on your laptop, and Hostinger hosting provides **MySQL**, not SQL Server.
2. The recommended path is to move SkyTechCRM to a Hostinger MySQL database and add a MySQL adapter next to `src/db/mssql.js`. The screens, login and audit stay the same, because all database access lives in `src/db/`.
3. Before going online: run it as a separate subdomain (e.g. `admin.skytechsolutions.us`) with HTTPS, set `HOST=0.0.0.0`, `COOKIE_SECURE=1` and a new `SESSION_SECRET`, create strong passwords, and keep `.env` off GitHub.

SkyTech_Manager will prepare the migration when you decide to move.

## Files

| Path | Purpose |
| --- | --- |
| `server.js` | Web server: login, permissions, API, audit |
| `src/schema.js` | Whitelist of tables and columns the site may use |
| `src/db/mssql.js` | SQL Server connection (all values sent as parameters) |
| `src/db/memory.js` | Demo mode (no database) |
| `src/demo/render.js` | Builds a demo website page from a `DemoSites` record (used by preview, download, save and `build-demos`) |
| `scripts/build-demos.js` | Builds `demo-sites/<business>/index.html` from `demo-sites/designs/*.json` and writes `sql/05_demo_sites_built.sql` |
| `public/` | The web pages: `index.html`, `app.js`, `style.css`, `vendor/chart.umd.min.js` (charts) |
| `scripts/create-admin.js` | Create or reset a login |
| `start-admin.bat` | Double-click start on Windows |
| `.env.example` | Settings template (copy to `.env`) |

---
Version: V1.3 (2026-10-05) — admin-site/README.md — V1.3
