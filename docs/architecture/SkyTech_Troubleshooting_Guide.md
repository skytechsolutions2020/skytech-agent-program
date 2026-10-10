# SkyTech Troubleshooting Guide

Version V1.1 · 2026-10-10 · release R4.0 · maintained by SkyTech_Manager

## 1. First aid in five steps

| Step | What to do |
| --- | --- |
| 1. Read the code | Every SkyTech message ends with a code such as SKY-DB-001 and often a reference (ref 3f9c2a1b7d04). Find the code below — each card says what it means, the likely causes and the fix steps in order. |
| 2. Run the doctor | Open a Command Prompt in admin-site and run  npm run doctor . It checks Node.js, packages, .env and secrets, network exposure, git, log folder, disk, port and the database (objects, unique rules, logins, recent database errors, app role, last backup), and prints each problem with its code and fix. Use  npm run doctor -- --demo  without a database. |
| 3. Look in the log | Admin site → System log (admins), or open logs\runtime\admin-YYYY-MM-DD.log in Notepad and search for the ref value or the code. Database procedures write to dbo.ErrorLog (queries below). Scripts write logs\runtime\scripts-YYYY-MM-DD.log. |
| 4. Fix and re-test | Apply the first fix step, repeat the action, and run the doctor again. Most fixes are settings in admin-site\.env, re-running a SQL script in SSMS (all are safe to re-run), or restarting the Admin site. |
| 5. Still stuck? | Send SkyTech_Manager the code, the ref value and the doctor output (never send passwords or the .env file). |

## 2. How logging works

| Part | Where | What is recorded |
| --- | --- | --- |
| Admin site | logs\runtime\admin-YYYY-MM-DD.log | One JSON line per event: ts, level, category (http, auth, security, db, demo, startup), msg, code, reqId, user, ip, status, ms. Every API call, sign-in, lockout, CSRF/rate-limit block, permission refusal and error is recorded. |
| Doctor | logs\runtime\doctor-YYYY-MM-DD.log | Each check and its result, with the code. |
| Scripts (Node + Python) | logs\runtime\scripts-YYYY-MM-DD.log | build-demos, lead builders, document builders: start, files written, failures with code and (for crashes) the traceback. |
| Database | SkyTechCRM.dbo.ErrorLog | One row per failure caught inside a SkyTech procedure: time, procedure, SQL error number, line, message, SkyTech code, context, login, computer. |
| Database audit | SkyTechCRM.dbo.AuditLog | Who signed in, created, changed, merged or deleted what (append-only; protected by trigger, SKY-SEC-006). |

- Levels: debug < info < warn < error. LOG_LEVEL in .env picks the minimum written (default info).
- Passwords, hashes, secrets, tokens, cookies and CSRF values are replaced by [redacted] before anything is written.
- Files older than LOG_RETENTION_DAYS (default 30) are deleted automatically; the logs\runtime folder is git-ignored and never uploaded.
- The ref shown on screen (X-Request-Id) is the reqId in the log — search for it to see exactly what happened.
- If the log folder cannot be written the site keeps running and logs to the screen only (SKY-SYS-003).

## 3–4. Error codes


### CFG — Configuration

#### SKY-CFG-001 — Settings file .env is missing (critical)

Where: Admin site start (npm start / start-admin.bat). Logged in: logs/runtime/admin-YYYY-MM-DD.log (search for the code or the reference number); screen.

Causes: The admin-site\.env file was never created; It was renamed or deleted.

Fix:
1. In the admin-site folder copy .env.example to a new file named .env
2. Fill in DB_SERVER, DB_AUTH, DB_DRIVER and SESSION_SECRET (see admin-site README)
3. Run npm run doctor to confirm, then start the site again

#### SKY-CFG-002 — SESSION_SECRET is missing or too weak (critical)

Where: Admin site start. Logged in: logs/runtime/admin-YYYY-MM-DD.log (search for the code or the reference number); screen.

Causes: SESSION_SECRET is empty, still 'change-this…', or shorter than 32 characters.

Fix:
1. Open admin-site\.env
2. Set SESSION_SECRET to a random phrase of at least 32 characters (npm run doctor -- --new-secret prints one)
3. Save and start the site again; everyone must sign in again

#### SKY-CFG-003 — Site opened to the network without HTTPS cookies (critical)

Where: Admin site start. Logged in: logs/runtime/admin-YYYY-MM-DD.log (search for the code or the reference number); screen.

Causes: HOST is not 127.0.0.1/localhost but COOKIE_SECURE is not 1.

Fix:
1. Keep HOST=127.0.0.1 for local use (recommended)
2. Only when hosting behind HTTPS: set COOKIE_SECURE=1 and TRUST_PROXY=1

#### SKY-CFG-004 — Node.js version is too old (error)

Where: Admin site start, doctor. Logged in: logs/runtime/doctor-YYYY-MM-DD.log and the doctor screen.

Causes: Node.js older than version 18 is installed.

Fix:
1. Download the LTS version from https://nodejs.org and install it
2. Close and reopen the command window, then run node --version

#### SKY-CFG-005 — demo-sites folder not found (warn)

Where: Admin site: Save to demo-sites folder. Logged in: logs/runtime/admin-YYYY-MM-DD.log (search for the code or the reference number).

Causes: admin-site was moved away from the repository folder; DEMO_SITES_DIR points to a folder that does not exist.

Fix:
1. Keep admin-site inside skytech-agent-program next to demo-sites
2. Or set DEMO_SITES_DIR in .env to the full path of the demo-sites folder

#### SKY-CFG-006 — Port already in use (error, predicted)

Where: Admin site start. Logged in: logs/runtime/admin-YYYY-MM-DD.log (search for the code or the reference number); screen.

Causes: The Admin site is already running in another window; Another program uses port 3030.

Fix:
1. Close the other black Admin site window, or
2. Set PORT=3031 in .env and open http://127.0.0.1:3031

#### SKY-CFG-007 — Required package missing (error)

Where: Admin site start, doctor, build-demos. Logged in: logs/runtime/doctor-YYYY-MM-DD.log and the doctor screen.

Causes: npm install was not run, or node_modules was deleted.

Fix:
1. Open a Command Prompt in admin-site and run npm install
2. Run npm run doctor


### DB — Database

#### SKY-DB-001 — Cannot connect to SQL Server (critical)

Where: Admin site start, create-admin, doctor. Logged in: logs/runtime/admin-YYYY-MM-DD.log (search for the code or the reference number); logs/runtime/doctor-YYYY-MM-DD.log and the doctor screen.

Causes: The SQL Server service is stopped; DB_SERVER does not match the server name used in SSMS; Firewall or instance name wrong (e.g. localhost\SQL2014).

Fix:
1. Press Windows key → Services → 'SQL Server (…)' → Start
2. Open SSMS, copy the exact Server name into DB_SERVER in .env
3. Run npm run doctor; if it still fails, try npm run demo to confirm the site itself works

#### SKY-DB-002 — Windows login needs the msnodesqlv8 package (critical)

Where: Admin site start (DB_AUTH=windows). Logged in: logs/runtime/admin-YYYY-MM-DD.log (search for the code or the reference number).

Causes: msnodesqlv8 failed to install (it only installs on Windows).

Fix:
1. On the Windows PC run npm install in admin-site
2. If it still fails, install 'Visual C++ Redistributable', or use DB_AUTH=sql with a SQL login (see sql/06)

#### SKY-DB-003 — ODBC driver not found (critical)

Where: Admin site start (DB_AUTH=windows). Logged in: logs/runtime/admin-YYYY-MM-DD.log (search for the code or the reference number).

Causes: DB_DRIVER names a driver that is not installed.

Fix:
1. Windows key → 'ODBC Data Sources (64-bit)' → Drivers tab
2. Copy an installed name (e.g. 'SQL Server Native Client 11.0' or 'ODBC Driver 17 for SQL Server') into DB_DRIVER

#### SKY-DB-004 — Database SkyTechCRM does not exist (critical)

Where: Admin site start, doctor. Logged in: logs/runtime/admin-YYYY-MM-DD.log (search for the code or the reference number); logs/runtime/doctor-YYYY-MM-DD.log and the doctor screen.

Causes: sql/01_create_skytechcrm.sql has not been run; DB_DATABASE has a different name.

Fix:
1. In SSMS open and run sql/01_create_skytechcrm.sql, then the sample import, sql/04, sql/05 and sql/06
2. Check DB_DATABASE=SkyTechCRM in .env

#### SKY-DB-005 — A database table, view or procedure is missing (error)

Where: Any Admin site screen. Logged in: logs/runtime/admin-YYYY-MM-DD.log (search for the code or the reference number); logs/runtime/doctor-YYYY-MM-DD.log and the doctor screen.

Causes: A newer script version was not run in SSMS (e.g. sql/04 or sql/06).

Fix:
1. Run npm run doctor to see which object is missing
2. Run the SQL scripts again in order: 01 → sample import → 04 → 05 → 06 (all are safe to re-run)

#### SKY-DB-006 — SQL login failed (critical)

Where: Admin site start (DB_AUTH=sql). Logged in: logs/runtime/admin-YYYY-MM-DD.log (search for the code or the reference number).

Causes: DB_USER or DB_PASSWORD wrong; SQL Server authentication (mixed mode) is turned off; The login is disabled or its password expired.

Fix:
1. Check DB_USER / DB_PASSWORD in .env
2. In SSMS: server Properties → Security → 'SQL Server and Windows Authentication mode', restart the service
3. Or switch to DB_AUTH=windows

#### SKY-DB-007 — Database request timed out (error, predicted)

Where: Any Admin site screen. Logged in: logs/runtime/admin-YYYY-MM-DD.log (search for the code or the reference number).

Causes: SQL Server is busy or a long query is blocking; Very large table without index.

Fix:
1. Wait and retry
2. In SSMS run: EXEC sp_who2 to look for blocking sessions
3. Restart the SQL Server service if it stays stuck

#### SKY-DB-008 — Permission denied in the database (error, predicted)

Where: Any Admin site screen. Logged in: logs/runtime/admin-YYYY-MM-DD.log (search for the code or the reference number).

Causes: The app connects with a restricted login that lacks a permission; sql/06 role was created before a new table existed.

Fix:
1. Re-run sql/06_security_and_logging.sql (re-grants all permissions to SkyTechApp)
2. Make sure the app's login is a member of the SkyTechApp role

#### SKY-DB-009 — Unexpected database error (error)

Where: Any database action. Logged in: logs/runtime/admin-YYYY-MM-DD.log (search for the code or the reference number); dbo.ErrorLog in SkyTechCRM (SELECT TOP 50 * FROM dbo.ErrorLog ORDER BY ErrorLogID DESC).

Causes: An error not covered by other codes.

Fix:
1. Note the reference number shown on screen
2. Search the admin log for that reference to read the SQL error number and message
3. Look the SQL error number up in this guide or send it to SkyTech_Manager

#### SKY-DB-010 — Database errors were recorded in dbo.ErrorLog (warn, predicted)

Where: npm run doctor; any stored procedure. Logged in: dbo.ErrorLog (database).

Causes: A stored procedure failed (import, merge, fix, backup) and wrote its error to dbo.ErrorLog before rolling back.

Fix:
1. In SSMS run: SELECT TOP 20 * FROM SkyTechCRM.dbo.ErrorLog ORDER BY ErrorLogID DESC
2. Look up the ErrorNumber in the Troubleshooting Guide table "SQL Server error numbers"
3. After fixing, old rows can be removed with EXEC dbo.usp_PurgeErrorLog @KeepDays = 90


### AUTH — Sign-in

#### SKY-AUTH-001 — Wrong username or password (info)

Where: Admin site sign-in. Logged in: logs/runtime/admin-YYYY-MM-DD.log (search for the code or the reference number).

Causes: Typing error; Account disabled (IsActive = 0).

Fix:
1. Check Caps Lock and try again
2. Reset with npm run create-admin using the same username

#### SKY-AUTH-002 — Too many sign-in attempts — locked for 15 minutes (warn)

Where: Admin site sign-in. Logged in: logs/runtime/admin-YYYY-MM-DD.log (search for the code or the reference number).

Causes: 5 wrong passwords for this username or from this computer within 15 minutes.

Fix:
1. Wait 15 minutes, or restart the Admin site (clears the lock)
2. If you did not cause it, check the security log for LOGIN_FAIL entries

#### SKY-AUTH-003 — Session expired (info)

Where: Any Admin site screen. Logged in: logs/runtime/admin-YYYY-MM-DD.log (search for the code or the reference number).

Causes: No activity for 30 minutes (SESSION_IDLE_MIN), or signed in longer than 8 hours.

Fix:
1. Sign in again

#### SKY-AUTH-004 — Not signed in (info)

Where: Any Admin site request. Logged in: logs/runtime/admin-YYYY-MM-DD.log (search for the code or the reference number).

Causes: The browser has no session (new tab, cookies cleared, site restarted).

Fix:
1. Sign in again

#### SKY-AUTH-005 — Read-only account (warn)

Where: Create, edit, delete, merge actions. Logged in: logs/runtime/admin-YYYY-MM-DD.log (search for the code or the reference number).

Causes: A viewer account tried to change data.

Fix:
1. Sign in with an admin account, or have an admin make the change

#### SKY-AUTH-006 — Password does not meet the policy (warn)

Where: npm run create-admin; Admin site → Logins (new login, reset password) and Change my password. Logged in: logs/runtime/scripts-YYYY-MM-DD.log and the script's screen output.

Causes: Fewer than 12 characters, missing upper/lower case or a digit, contains the username, or is a common password.

Fix:
1. Choose a passphrase of 12+ characters with upper and lower case letters and a number

#### SKY-AUTH-007 — Your password is needed to confirm this change (warn)

Where: Admin site → Logins; Change my password. Logged in: admin log (category security); dbo.AuditLog.

Causes: The "Your password" box was empty or wrong when creating, changing or resetting a login; Too many wrong confirmation attempts also lock the account for 15 minutes (SKY-AUTH-002).

Fix:
1. Type your own current password in the "Your password" box and save again
2. Forgotten it? Another admin can reset it on the Logins screen, or run npm run create-admin with your username

#### SKY-AUTH-008 — Change refused: it would lock everyone out (warn)

Where: Admin site → Logins (edit role or active). Logged in: admin log (category http).

Causes: You tried to disable your own login or remove your own admin role; The change would leave no active admin login.

Fix:
1. Make another login an active admin first, then change this one
2. To lock out a person, disable their login — not your own


### SEC — Security

#### SKY-SEC-001 — Security token missing or invalid (CSRF) (warn)

Where: Any change in the Admin site. Logged in: logs/runtime/admin-YYYY-MM-DD.log (search for the code or the reference number).

Causes: The page was open before the site restarted; Another website tried to send a request on your behalf.

Fix:
1. Reload the page (F5) and repeat the action
2. If it happens without reason, check the security log

#### SKY-SEC-002 — Too many requests — slow down (warn)

Where: Admin site. Logged in: logs/runtime/admin-YYYY-MM-DD.log (search for the code or the reference number).

Causes: More than the allowed number of requests per minute from this computer (a stuck script or an attack).

Fix:
1. Wait one minute and retry
2. Close duplicate browser tabs running auto-refresh

#### SKY-SEC-003 — Request too large (warn)

Where: Admin site save. Logged in: logs/runtime/admin-YYYY-MM-DD.log (search for the code or the reference number).

Causes: A field or upload exceeded 200 KB.

Fix:
1. Shorten the text and save again

#### SKY-SEC-004 — Possible secret found in files to be uploaded (critical)

Where: push-to-github.bat (secret scan). Logged in: Screen output of the secret scan.

Causes: A password, token, private key or connection string with a password is in a tracked file.

Fix:
1. Open the file and line shown by the scanner
2. Move the secret into admin-site\.env (never committed) and remove it from the file
3. Commit the fix, then run push-to-github.bat again; if a real secret was already pushed, change that password/token

#### SKY-SEC-005 — Photo link not allowed (warn)

Where: Admin site → Demo sites. Logged in: logs/runtime/admin-YYYY-MM-DD.log (search for the code or the reference number).

Causes: A photo URL is not from images.pexels.com or images.unsplash.com.

Fix:
1. Use a free-licence photo link from Pexels or Unsplash

#### SKY-SEC-006 — Audit log is protected and cannot be changed (critical, predicted)

Where: Database (dbo.AuditLog). Logged in: dbo.ErrorLog in SkyTechCRM (SELECT TOP 50 * FROM dbo.ErrorLog ORDER BY ErrorLogID DESC).

Causes: Someone tried to UPDATE or DELETE audit records.

Fix:
1. Audit records are append-only by design; nothing to fix
2. Investigate who tried, using SQL Server logs

#### SKY-SEC-007 — Request from another website blocked (warn)

Where: Admin site. Logged in: logs/runtime/admin-YYYY-MM-DD.log (search for the code or the reference number).

Causes: The request's Origin header does not match the Admin site address.

Fix:
1. Use the Admin site only from its own address (http://127.0.0.1:3030)


### DATA — Data

#### SKY-DATA-001 — Required field missing (info)

Where: Admin site save. Logged in: logs/runtime/admin-YYYY-MM-DD.log (search for the code or the reference number).

Causes: A field marked * was left empty.

Fix:
1. Fill in the fields marked * and save again

#### SKY-DATA-002 — Value has the wrong format (info)

Where: Admin site save. Logged in: logs/runtime/admin-YYYY-MM-DD.log (search for the code or the reference number).

Causes: Colour not like #1f5fbf, slug with spaces/capitals, bad date or number, or the request was not valid JSON.

Fix:
1. Correct the field shown in the message and save again

#### SKY-DATA-003 — Record is linked to other records (warn)

Where: Admin site delete. Logged in: logs/runtime/admin-YYYY-MM-DD.log (search for the code or the reference number).

Causes: Deleting a company that still has a lead, web presence or demo site, or a lead with activities.

Fix:
1. Delete or move the linked records first, or use Possible duplicates → merge

#### SKY-DATA-004 — Record not found (info)

Where: Admin site. Logged in: logs/runtime/admin-YYYY-MM-DD.log (search for the code or the reference number).

Causes: It was deleted or merged in another tab.

Fix:
1. Reload the list

#### SKY-DATA-005 — This view is read-only (info)

Where: Admin site. Logged in: logs/runtime/admin-YYYY-MM-DD.log (search for the code or the reference number).

Causes: Trying to change Imports, Possible duplicates or Audit log directly.

Fix:
1. Change the underlying record instead

#### SKY-DATA-006 — Unknown table (warn)

Where: Admin site API. Logged in: logs/runtime/admin-YYYY-MM-DD.log (search for the code or the reference number).

Causes: A link or bookmark names a table the site does not allow.

Fix:
1. Use the menu


### DUP — Duplicates

#### SKY-DUP-001 — Duplicate record refused (info)

Where: Admin site save, imports. Logged in: logs/runtime/admin-YYYY-MM-DD.log (search for the code or the reference number).

Causes: Same source ID, same name + ZIP, a second lead/web row/demo site for one company.

Fix:
1. Open Possible duplicates and merge, or edit the existing record instead

#### SKY-DUP-002 — Leads cannot be merged (warn)

Where: Possible duplicates → merge leads. Logged in: logs/runtime/admin-YYYY-MM-DD.log (search for the code or the reference number); dbo.ErrorLog in SkyTechCRM (SELECT TOP 50 * FROM dbo.ErrorLog ORDER BY ErrorLogID DESC).

Causes: The two leads no longer belong to the same company, or one was deleted (SQL 50011/50012).

Fix:
1. Click Check now to refresh the list
2. Merge the companies first if needed

#### SKY-DUP-003 — Nothing to fix — company has one web-presence row (info)

Where: Possible duplicates → fix web presence. Logged in: logs/runtime/admin-YYYY-MM-DD.log (search for the code or the reference number).

Causes: Already fixed in another tab (SQL 50021).

Fix:
1. Click Check now

#### SKY-DUP-004 — Unique rule could not be created (warn, predicted)

Where: sql/01 or sql/04 run in SSMS. Logged in: SSMS Messages tab.

Causes: Duplicates existed when the script ran, so the unique index was skipped (WARNING in Messages).

Fix:
1. Open Admin site → Possible duplicates, fix all Exact duplicates
2. Run the script again; the index is then created

#### SKY-DUP-005 — Companies cannot be merged (warn)

Where: Possible duplicates → merge companies (dbo.usp_MergeCompanies). Logged in: admin log (category http/db); dbo.ErrorLog.

Causes: The same company was chosen twice (SQL error 50001); One of the two companies was deleted or merged by someone else (SQL error 50002).

Fix:
1. Reload the Possible duplicates screen and choose two different companies that still exist


### DEMO — Demo sites

#### SKY-DEMO-001 — Design file is not valid (error)

Where: npm run build-demos. Logged in: logs/runtime/scripts-YYYY-MM-DD.log and the script's screen output.

Causes: A comma or quote is missing in demo-sites\designs\<name>.json.

Fix:
1. Open the file named in the message; check the line shown
2. Paste it into a JSON checker (e.g. jsonlint.com) if unsure, fix and rebuild

#### SKY-DEMO-002 — Design has no matching lead (error)

Where: npm run build-demos. Logged in: logs/runtime/scripts-YYYY-MM-DD.log and the script's screen output.

Causes: The OvertureID in the design file is not in data/samples/SkyTech_Leads_Sample100.csv.

Fix:
1. Copy the correct OvertureID from the lead CSV into the design file

#### SKY-DEMO-003 — Unknown demo name (error)

Where: npm run build-demos -- <slug>. Logged in: logs/runtime/scripts-YYYY-MM-DD.log and the script's screen output.

Causes: The slug typed does not match any design file.

Fix:
1. Use the file name without .json, e.g. c-and-a-plumbing-20723

#### SKY-DEMO-004 — Photos do not appear on a demo (warn, predicted)

Where: Demo page in a browser. Logged in: Browser developer tools (F12 → Console).

Causes: No internet connection; Pexels changed or removed the photo; A firewall blocks images.pexels.com.

Fix:
1. Open the page online; try another photo link in Admin site → Demo sites
2. Before going live, download the photos and host them with the site (img/ folder)

#### SKY-DEMO-005 — Fonts look plain (info, predicted)

Where: Demo page offline. Logged in: —.

Causes: Google Fonts cannot load offline; a similar system font is used.

Fix:
1. No action needed; fonts load when online


### IMP — Imports

#### SKY-IMP-001 — Some demos were not loaded into the database (warn)

Where: sql/05 in SSMS. Logged in: SSMS results grid.

Causes: The result grid 'NotFoundInDatabase' lists businesses whose company is not in SkyTechCRM yet.

Fix:
1. Run the lead import first (data/samples/…_import.sql), then sql/05 again

#### SKY-IMP-002 — Lead import failed and was rolled back (error)

Where: usp_ImportStagedLeads (lead import SQL). Logged in: dbo.ErrorLog in SkyTechCRM (SELECT TOP 50 * FROM dbo.ErrorLog ORDER BY ErrorLogID DESC).

Causes: Bad data in the staging rows (too long, invalid characters) or a missing object.

Fix:
1. Read the newest row in dbo.ErrorLog for the exact SQL message
2. Fix the data or run sql/01 again, then re-run the import (nothing was half-imported)

#### SKY-IMP-003 — Staging table not empty (warn, predicted)

Where: Lead import. Logged in: dbo.ErrorLog in SkyTechCRM (SELECT TOP 50 * FROM dbo.ErrorLog ORDER BY ErrorLogID DESC).

Causes: A previous import stopped half-way; dbo.StgLeads still has rows.

Fix:
1. Nothing to do: each import clears staging at the start
2. If in doubt: DELETE FROM dbo.StgLeads; then re-run the import


### LEAD — Lead scripts

#### SKY-LEAD-001 — Lead input file missing or unreadable (error)

Where: scripts/leads/*.py. Logged in: logs/runtime/scripts-YYYY-MM-DD.log and the script's screen output.

Causes: Path typed wrong, or the file is open in Excel.

Fix:
1. Check the path in the command
2. Close the file in Excel and retry

#### SKY-LEAD-002 — Overture extract is empty (error, predicted)

Where: scripts/leads (browser extract). Logged in: logs/runtime/scripts-YYYY-MM-DD.log and the script's screen output.

Causes: Map tiles were not loaded when the extract ran.

Fix:
1. Zoom the Overture Explorer map to the area, wait for points to appear, then run the extract again

#### SKY-LEAD-003 — Data source blocked by the network (warn, predicted)

Where: Lead pulls. Logged in: logs/runtime/scripts-YYYY-MM-DD.log and the script's screen output.

Causes: The Overture download bucket or OpenStreetMap API is blocked by the network policy.

Fix:
1. Use the Overture Explorer in the Claude desktop browser (works)
2. Or download files manually and place them in data/raw/


### DOC — Documents

#### SKY-DOC-001 — Document builder needs a missing tool (error)

Where: scripts/docs/*.py, prompt book. Logged in: logs/runtime/scripts-YYYY-MM-DD.log and the script's screen output.

Causes: Python package missing (e.g. reportlab for the prompt book).

Fix:
1. Run: pip install reportlab
2. PDF versions of documents are made by SkyTech_Manager; HTML/Markdown build without extra tools

#### SKY-DOC-002 — Document source could not be read (error)

Where: scripts/docs/*.py. Logged in: logs/runtime/scripts-YYYY-MM-DD.log and the script's screen output.

Causes: A source file (error catalog, diagram data, code file) was moved or has a syntax error.

Fix:
1. Run the builder again and read the file name in the message
2. Undo the last edit to that file (GitHub Desktop → History) and rebuild


### GIT — GitHub

#### SKY-GIT-001 — GitHub rejected the sign-in (error)

Where: push-to-github.bat. Logged in: Screen output of push-to-github.bat or GitHub Desktop.

Causes: Saved GitHub password/token expired ('Invalid username or token').

Fix:
1. Windows key → Credential Manager → Windows Credentials → remove entries starting git:https://github.com
2. Run push-to-github.bat again and sign in in the browser window

#### SKY-GIT-002 — Git lock file left behind (error)

Where: push-to-github.bat, GitHub Desktop. Logged in: Screen output of push-to-github.bat or GitHub Desktop; logs/runtime/doctor-YYYY-MM-DD.log and the doctor screen.

Causes: A git command was interrupted ('index.lock' or 'HEAD.lock' … File exists).

Fix:
1. Make sure GitHub Desktop is closed
2. Delete skytech-agent-program\.git\index.lock (or HEAD.lock) in File Explorer
3. Run the push again; npm run doctor reports leftover locks

#### SKY-GIT-003 — GitHub remote not set (error)

Where: push-to-github.bat. Logged in: Screen output of push-to-github.bat or GitHub Desktop.

Causes: The folder was copied without its GitHub link.

Fix:
1. In this folder run: git remote add origin https://github.com/skytechsolutions2020/skytech-agent-program.git
2. Then run push-to-github.bat

#### SKY-GIT-004 — GitHub has changes this computer does not (warn, predicted)

Where: push-to-github.bat. Logged in: Screen output of push-to-github.bat or GitHub Desktop.

Causes: Files were edited directly on github.com ('rejected … fetch first').

Fix:
1. Open GitHub Desktop → Fetch origin → Pull, then push again
2. Do not edit files on github.com; edit in the local folder

#### SKY-GIT-005 — Git is not installed or this is not the repository folder (error, predicted)

Where: push-to-github.bat, scan-secrets, doctor. Logged in: screen.

Causes: Git for Windows is not installed or not on PATH; The script was run outside the skytech-agent-program folder.

Fix:
1. Install Git for Windows (free) and reopen the window
2. Run the script from C:\Users\AV\Documents\SkyTechClaude\skytech-agent-program


### BAK — Backup

#### SKY-BAK-001 — Database backup failed (error)

Where: usp_BackupSkyTechCRM (sql/06). Logged in: dbo.ErrorLog in SkyTechCRM (SELECT TOP 50 * FROM dbo.ErrorLog ORDER BY ErrorLogID DESC).

Causes: Backup folder does not exist or SQL Server's service account cannot write to it; Disk full.

Fix:
1. Use a folder SQL Server can write to (default C:\SkyTechBackups, created by the script) or grant the service account access
2. Free disk space and run EXEC dbo.usp_BackupSkyTechCRM again

#### SKY-BAK-002 — Database damaged or lost — restore needed (critical, predicted)

Where: SQL Server. Logged in: dbo.ErrorLog in SkyTechCRM (SELECT TOP 50 * FROM dbo.ErrorLog ORDER BY ErrorLogID DESC).

Causes: Disk failure, accidental drop, corrupted database.

Fix:
1. Find the newest SkyTechCRM_*.bak in the backup folder
2. In SSMS: right-click Databases → Restore Database → Device → choose the .bak → OK
3. Run npm run doctor to confirm

#### SKY-BAK-003 — No recent database backup (warn, predicted)

Where: npm run doctor. Logged in: doctor log; msdb.dbo.backupset.

Causes: dbo.usp_BackupSkyTechCRM has not been run in the last 7 days (or never).

Fix:
1. In SSMS run: EXEC SkyTechCRM.dbo.usp_BackupSkyTechCRM;
2. Copy C:\SkyTechBackups to a USB drive or cloud folder once a week


### SYS — System

#### SKY-SYS-001 — Unexpected error (error)

Where: Anywhere. Logged in: logs/runtime/admin-YYYY-MM-DD.log (search for the code or the reference number).

Causes: A situation the program did not expect.

Fix:
1. Note the reference number on screen
2. Open the newest admin log and search for that reference; the code and details are there
3. Send the log lines to SkyTech_Manager

#### SKY-SYS-002 — Disk full (critical, predicted)

Where: Logs, demo files, backups. Logged in: logs/runtime/admin-YYYY-MM-DD.log (search for the code or the reference number).

Causes: The drive has no free space.

Fix:
1. Free disk space (empty Recycle Bin, delete old backups beyond the last 5)
2. Restart the Admin site

#### SKY-SYS-003 — Log folder cannot be written (warn)

Where: Admin site, scripts. Logged in: Screen.

Causes: logs/runtime is read-only or blocked by antivirus.

Fix:
1. Make sure logs\runtime exists and is not read-only
2. The site keeps running and logs to the screen only

## 5. Predicted errors

| Code | Problem | Prevention / check |
| --- | --- | --- |
| SKY-CFG-006 | Port already in use | Close the other black Admin site window, or |
| SKY-DB-007 | Database request timed out | Wait and retry |
| SKY-DB-008 | Permission denied in the database | Re-run sql/06_security_and_logging.sql (re-grants all permissions to SkyTechApp) |
| SKY-DB-010 | Database errors were recorded in dbo.ErrorLog | In SSMS run: SELECT TOP 20 * FROM SkyTechCRM.dbo.ErrorLog ORDER BY ErrorLogID DESC |
| SKY-SEC-006 | Audit log is protected and cannot be changed | Audit records are append-only by design; nothing to fix |
| SKY-DUP-004 | Unique rule could not be created | Open Admin site → Possible duplicates, fix all Exact duplicates |
| SKY-DEMO-004 | Photos do not appear on a demo | Open the page online; try another photo link in Admin site → Demo sites |
| SKY-DEMO-005 | Fonts look plain | No action needed; fonts load when online |
| SKY-IMP-003 | Staging table not empty | Nothing to do: each import clears staging at the start |
| SKY-LEAD-002 | Overture extract is empty | Zoom the Overture Explorer map to the area, wait for points to appear, then run the extract again |
| SKY-LEAD-003 | Data source blocked by the network | Use the Overture Explorer in the Claude desktop browser (works) |
| SKY-GIT-004 | GitHub has changes this computer does not | Open GitHub Desktop → Fetch origin → Pull, then push again |
| SKY-GIT-005 | Git is not installed or this is not the repository folder | Install Git for Windows (free) and reopen the window |
| SKY-BAK-002 | Database damaged or lost — restore needed | Find the newest SkyTechCRM_*.bak in the backup folder |
| SKY-BAK-003 | No recent database backup | In SSMS run: EXEC SkyTechCRM.dbo.usp_BackupSkyTechCRM; |
| SKY-SYS-002 | Disk full | Free disk space (empty Recycle Bin, delete old backups beyond the last 5) |

## 6. SQL Server error numbers

| SQL number | Meaning | SkyTech code |
| --- | --- | --- |
| 2601 / 2627 | Duplicate key (unique rule) | SKY-DUP-001 |
| 547 | Record is linked (foreign key) | SKY-DATA-003 |
| 50001 / 50002 | usp_MergeCompanies refused | SKY-DUP-005 |
| 50011 / 50012 | usp_MergeLeads refused | SKY-DUP-002 |
| 50021 | usp_FixDuplicateWebPresence: nothing to fix | SKY-DUP-003 |
| 50100 | AuditLog is append-only | SKY-SEC-006 |
| 208 / 2812 | Object (table/view/procedure) missing | SKY-DB-005 |
| 229 / 230 | Permission denied | SKY-DB-008 |
| 4060 | Database not found / no access | SKY-DB-004 |
| 18456 | Login failed | SKY-DB-006 |
| 8152 / 2628 | Value too long | SKY-DATA-002 |
| ETIMEOUT | Query or connection timed out | SKY-DB-007 |
| ESOCKET / ELOGIN | Cannot reach SQL Server | SKY-DB-001 |
| IM002 | ODBC driver not found | SKY-DB-003 |
| anything else | Unexpected database error | SKY-DB-009 |

## 7. Database error and audit queries

```sql
-- newest database errors
SELECT TOP 20 ErrorLogID, LoggedOn, ProcedureName, ErrorNumber, SkyCode, ErrorMessage, Context, LoginName
FROM SkyTechCRM.dbo.ErrorLog ORDER BY ErrorLogID DESC;

-- errors per procedure in the last 30 days
SELECT ProcedureName, SkyCode, COUNT(*) AS Errors, MAX(LoggedOn) AS Newest
FROM SkyTechCRM.dbo.ErrorLog WHERE LoggedOn > DATEADD(day, -30, GETDATE())
GROUP BY ProcedureName, SkyCode ORDER BY Errors DESC;

-- who changed a lead (audit)
SELECT TOP 50 At, Username, Action, Entity, RecordKey, Details FROM SkyTechCRM.dbo.AuditLog
WHERE Entity = N'leads' ORDER BY AuditID DESC;

-- failed sign-ins and lockouts in the last 7 days
SELECT At, Username, Action, Details FROM SkyTechCRM.dbo.AuditLog
WHERE Action IN ('LOGINFAIL', 'LOCKOUT') AND At > DATEADD(day, -7, GETDATE()) ORDER BY At DESC;

-- housekeeping (owner): keep 90 days of database errors
EXEC SkyTechCRM.dbo.usp_PurgeErrorLog @KeepDays = 90;
```

## 8. Manual recovery recipes

| Situation | Steps |
| --- | --- |
| Admin site will not start | Run start-admin.bat — it runs the doctor first and stops on the first problem with its code. Typical: .env missing (SKY-CFG-001), weak SESSION_SECRET (SKY-CFG-002: npm run doctor -- --new-secret), SQL Server service stopped (SKY-DB-001: Services → SQL Server (MSSQLSERVER) → Start). |
| Locked out of the Admin site | Wait 15 minutes (SKY-AUTH-002), or restart the Admin site to clear the lock. Forgotten password: another admin resets it on the Logins screen; if no admin can sign in, run npm run create-admin in admin-site with the same username (this also re-enables the login). |
| A table or procedure is missing | In SSMS run the scripts in order: sql/01 → lead import → sql/04 → sql/05 → sql/06. All are safe to re-run and never delete data. |
| Duplicates appeared | Admin site → Possible duplicates: merge or dismiss each Exact pair, then re-run sql/01 so the unique rules are created (SKY-DUP-004). |
| Database damaged or deleted (SKY-BAK-002) | Stop the Admin site. In SSMS: RESTORE DATABASE SkyTechCRM FROM DISK = N'C:\SkyTechBackups\.bak' WITH REPLACE, CHECKSUM; then run sql/04 and sql/06 and npm run doctor. |
| Push to GitHub fails | Read the code printed by push-to-github.bat: lock file (SKY-GIT-002: close GitHub Desktop, delete the .lock file), secret found (SKY-SEC-004: remove it, rotate the key if it was ever pushed), sign-in (SKY-GIT-001: sign in again in GitHub Desktop), GitHub newer (SKY-GIT-004: Fetch/Pull in GitHub Desktop, then push). |
| A secret was uploaded by mistake | Change the password/key at its source immediately (rotation is the real fix — removing the file later does not erase GitHub history). Then remove it from the file, commit, push, and tell SkyTech_Manager to clean the history. |
| Disk full (SKY-SYS-002) | Delete old files in C:\SkyTechBackups (keep the newest 4) and logs\runtime older than 30 days; empty the Recycle Bin; run the doctor. |
| Moving to a second computer or to hosting | Copy the repository, run npm install, create a new .env (new SESSION_SECRET), keep HOST=127.0.0.1 unless the site is behind HTTPS with COOKIE_SECURE=1 and TRUST_PROXY=1, use the SkyTechApp least-privilege login (sql/06), run the doctor. |

---
Version: V1.1 (2026-10-10) — SkyTech_Troubleshooting_Guide.md — V1.1
