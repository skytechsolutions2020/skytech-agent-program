"""Version: V1.0 (2026-10-10) — scripts/docs/build_ops_docs.py — V1.0
Builds the three R4.0 operations documents in docs/architecture (each as .html and .md):
  1. SkyTech_Troubleshooting_Guide   — every SkyTech error code (from config/error-codes.json), predicted errors,
                                        how logging works, first aid, database error queries. One anchor per code
                                        (#SKY-DB-001 …) so the Admin site System log and every error message can link to it.
  2. SkyTech_Security_Architecture   — threat model, data classification, trust boundaries, controls mapped to
                                        OWASP ASVS / NIST CSF 2.0 / CIS Controls v8, secrets, backup, incident response.
  3. SkyTech_Code_Documentation      — the comments written in every program file, collected into one reference:
                                        file purpose blocks plus one line per function / procedure.
Run     : python scripts/docs/build_ops_docs.py            (from the repository folder; no extra packages needed)
Inputs  : config/error-codes.json, the source files listed in CODE_FILES, the DATA sections below.
Outputs : docs/architecture/<name>.html and .md. PDFs are printed from the HTML (SkyTech_Manager does this with a
          headless browser; any browser's Print → Save as PDF gives the same layout).
Errors  : SKY-DOC-002 when a source file cannot be read; log: logs/runtime/scripts-<date>.log.
"""
import html, json, os, re, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "common")); import skylog
import runpy
skylog.install("build_ops_docs", "SKY-DOC-002")
log = skylog.get("build_ops_docs")

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT_DIR = os.path.join(ROOT, "docs", "architecture")
INFRA = runpy.run_path(os.path.join(os.path.dirname(os.path.abspath(__file__)), "build_infrastructure.py"), run_name="skytech_lib")
E = html.escape
DATE, RELEASE = "2026-10-10", "R4.0"
VERSIONS = {"guide": "V1.0", "security": "V1.0", "code": "V1.0"}

# ============================ shared page helpers ============================
CSS = INFRA["DIAGRAM_CSS"] + """
h3 { font-size:15px; margin:20px 0 6px; }
.lead { font-size:15px; max-width:70em; }
.code { background:var(--panel); border:1px solid var(--line); border-radius:10px; padding:10px 14px; margin:10px 0; break-inside:avoid; }
.code h3 { margin:0 0 4px; font-size:15px; } .code h3 a { color:inherit; text-decoration:none; }
.sev { display:inline-block; padding:1px 8px; border-radius:999px; font-size:11.5px; margin-left:6px; vertical-align:2px; border:1px solid var(--line); }
.sev.critical { background:#fde8e6; color:#8a1c12; border-color:#f3b5ad; } .sev.error { background:#fff1e0; color:#7a4300; border-color:#f2c98f; }
.sev.warn { background:#fff8db; color:#6b5600; border-color:#eadb8e; } .sev.info { background:var(--accbg); }
.pred { display:inline-block; padding:1px 8px; border-radius:999px; font-size:11.5px; margin-left:6px; border:1px dashed var(--plan); color:var(--muted); }
.kv { color:var(--muted); font-size:12.5px; } .kv b { color:var(--ink); font-weight:600; }
code, pre { font-family:Consolas,"Cascadia Mono",Menlo,monospace; font-size:12.5px; }
pre { background:var(--zone); border:1px solid var(--line); border-radius:8px; padding:8px 12px; white-space:pre-wrap; overflow-wrap:anywhere; }
.idx a { display:inline-block; margin:2px 6px 2px 0; } .toc li { margin:2px 0; }
.box { background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:12px 16px; margin:10px 0; }
.fn td:first-child { white-space:nowrap; font-family:Consolas,Menlo,monospace; font-size:12.5px; width:28%; }
.fixed { table-layout:fixed; } .fixed td { overflow-wrap:anywhere; } .fixed th:first-child { width:22%; }
@media (prefers-color-scheme: dark) { .sev.critical { background:#3a1714; color:#ffb4a8; } .sev.error { background:#3a2610; color:#ffcf8f; } .sev.warn { background:#3a3410; color:#f2e08f; } }
@media print { h2, h3 { break-after:avoid; } tr, .code, .box { break-inside:avoid; } .pb { break-before:page; } .diagram svg { min-width:0; }
  body { font-size:12.5px; } .code { padding:6px 12px; margin:6px 0; } .code ul, .code ol { margin:2px 0 4px; } .code li { margin:0; } th, td { padding:5px 8px; } }
"""


def page(title, version, fname, body, lead):
    """Wraps body HTML in the standard SkyTech document page (title, version line, footer)."""
    return f"""<!doctype html>
<!-- Version: {version} ({DATE}) — docs/architecture/{fname}.html — {version} -->
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{E(title)}</title><style>{CSS}</style></head><body><main>
<h1>{E(title)}</h1>
<div class="meta">Version {version} · {DATE} · matches repository release {RELEASE} · maintained by SkyTech_Manager</div>
<p class="lead">{lead}</p>
{body}
<footer class="meta" style="margin-top:28px">Version: {version} ({DATE}) — docs/architecture/{fname}.html — {version}. Rebuild with: python scripts/docs/build_ops_docs.py</footer>
</main></body></html>"""


def table(head, rows, cls=""):
    """HTML table; cells are escaped unless they start with '<' (already HTML)."""
    c = lambda v: v if str(v).startswith("<") else E(str(v))
    return (f'<div class="wrap"><table class="{cls}"><thead><tr>' + "".join(f"<th>{E(h)}</th>" for h in head) + "</tr></thead><tbody>"
            + "".join("<tr>" + "".join(f"<td>{c(v)}</td>" for v in r) + "</tr>" for r in rows) + "</tbody></table></div>")


def md_table(head, rows):
    """Markdown table (pipes in cells replaced so the table never breaks)."""
    strip = lambda v: re.sub(r"<[^>]+>", "", str(v)).replace("|", "/").replace("\n", " ")
    return ["| " + " | ".join(head) + " |", "| " + " | ".join("---" for _ in head) + " |"] + ["| " + " | ".join(strip(v) for v in r) + " |" for r in rows]


def write(fname, html_text, md_lines, version):
    """Writes the .html and .md versions of one document."""
    os.makedirs(OUT_DIR, exist_ok=True)
    for ext, text in ((".html", html_text), (".md", "\n".join(md_lines + ["", "---", f"Version: {version} ({DATE}) — {fname}.md — {version}", ""]))):
        p = os.path.join(OUT_DIR, fname + ext)
        with open(p, "w", encoding="utf-8") as f:
            f.write(text)
        log.info("wrote", path=os.path.relpath(p, ROOT)); print("wrote", os.path.relpath(p, ROOT))


# ============================ 1. Troubleshooting Guide ============================
with open(os.path.join(ROOT, "config", "error-codes.json"), encoding="utf-8") as f:
    CAT = json.load(f)
CODES = CAT["codes"]
AREA_ORDER = []
for c in CODES:
    pre = c["code"].split("-")[1]
    if pre not in [a for a, _ in AREA_ORDER]: AREA_ORDER.append((pre, c["area"]))

SQL_NUMBERS = [  # SQL Server error number → SkyTech code (same mapping as admin-site/src/errors.js fromDbError)
    ("2601 / 2627", "Duplicate key (unique rule)", "SKY-DUP-001"), ("547", "Record is linked (foreign key)", "SKY-DATA-003"),
    ("50001 / 50002", "usp_MergeCompanies refused", "SKY-DUP-005"), ("50011 / 50012", "usp_MergeLeads refused", "SKY-DUP-002"),
    ("50021", "usp_FixDuplicateWebPresence: nothing to fix", "SKY-DUP-003"), ("50100", "AuditLog is append-only", "SKY-SEC-006"),
    ("208 / 2812", "Object (table/view/procedure) missing", "SKY-DB-005"), ("229 / 230", "Permission denied", "SKY-DB-008"),
    ("4060", "Database not found / no access", "SKY-DB-004"), ("18456", "Login failed", "SKY-DB-006"),
    ("8152 / 2628", "Value too long", "SKY-DATA-002"), ("ETIMEOUT", "Query or connection timed out", "SKY-DB-007"),
    ("ESOCKET / ELOGIN", "Cannot reach SQL Server", "SKY-DB-001"), ("IM002", "ODBC driver not found", "SKY-DB-003"),
    ("anything else", "Unexpected database error", "SKY-DB-009")]

FIRST_AID = [
    ("1. Read the code", "Every SkyTech message ends with a code such as SKY-DB-001 and often a reference (ref 3f9c2a1b7d04). Find the code below — each card says what it means, the likely causes and the fix steps in order."),
    ("2. Run the doctor", "Open a Command Prompt in admin-site and run  npm run doctor . It checks Node.js, packages, .env and secrets, network exposure, git, log folder, disk, port and the database (objects, unique rules, logins, recent database errors, app role, last backup), and prints each problem with its code and fix. Use  npm run doctor -- --demo  without a database."),
    ("3. Look in the log", "Admin site → System log (admins), or open logs\\runtime\\admin-YYYY-MM-DD.log in Notepad and search for the ref value or the code. Database procedures write to dbo.ErrorLog (queries below). Scripts write logs\\runtime\\scripts-YYYY-MM-DD.log."),
    ("4. Fix and re-test", "Apply the first fix step, repeat the action, and run the doctor again. Most fixes are settings in admin-site\\.env, re-running a SQL script in SSMS (all are safe to re-run), or restarting the Admin site."),
    ("5. Still stuck?", "Send SkyTech_Manager the code, the ref value and the doctor output (never send passwords or the .env file)."),
]
LOGGING = [
    ("Admin site", "logs\\runtime\\admin-YYYY-MM-DD.log", "One JSON line per event: ts, level, category (http, auth, security, db, demo, startup), msg, code, reqId, user, ip, status, ms. Every API call, sign-in, lockout, CSRF/rate-limit block, permission refusal and error is recorded."),
    ("Doctor", "logs\\runtime\\doctor-YYYY-MM-DD.log", "Each check and its result, with the code."),
    ("Scripts (Node + Python)", "logs\\runtime\\scripts-YYYY-MM-DD.log", "build-demos, lead builders, document builders: start, files written, failures with code and (for crashes) the traceback."),
    ("Database", "SkyTechCRM.dbo.ErrorLog", "One row per failure caught inside a SkyTech procedure: time, procedure, SQL error number, line, message, SkyTech code, context, login, computer."),
    ("Database audit", "SkyTechCRM.dbo.AuditLog", "Who signed in, created, changed, merged or deleted what (append-only; protected by trigger, SKY-SEC-006)."),
]
LOG_RULES = ["Levels: debug < info < warn < error. LOG_LEVEL in .env picks the minimum written (default info).",
             "Passwords, hashes, secrets, tokens, cookies and CSRF values are replaced by [redacted] before anything is written.",
             "Files older than LOG_RETENTION_DAYS (default 30) are deleted automatically; the logs\\runtime folder is git-ignored and never uploaded.",
             "The ref shown on screen (X-Request-Id) is the reqId in the log — search for it to see exactly what happened.",
             "If the log folder cannot be written the site keeps running and logs to the screen only (SKY-SYS-003)."]
ERRORLOG_SQL = """-- newest database errors
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
EXEC SkyTechCRM.dbo.usp_PurgeErrorLog @KeepDays = 90;"""


def code_card(c):
    """One error-code card with an anchor equal to the code."""
    pred = '<span class="pred">predicted</span>' if c.get("predicted") else ""
    causes = "".join(f"<li>{E(x)}</li>" for x in c.get("causes", []))
    fix = "".join(f"<li>{E(x)}</li>" for x in c.get("fix", []))
    http = f" · HTTP {c['http']}" if c.get("http") else ""
    shown = f'<div class="kv"><b>Message shown:</b> {E(c["user"])}</div>' if c.get("user") else ""
    return (f'<div class="code" id="{c["code"]}"><h3><a href="#{c["code"]}">{c["code"]}</a> — {E(c["title"])}<span class="sev {c["severity"]}">{c["severity"]}</span>{pred}</h3>'
            f'<div class="kv"><b>Where:</b> {E(c["where"])}{http} · <b>Logged in:</b> {E(c.get("log", ""))}</div>{shown}'
            f'<b>Likely causes</b><ul>{causes}</ul><b>Fix (in this order)</b><ol>{fix}</ol></div>')


def build_guide():
    v = VERSIONS["guide"]
    pred = [c for c in CODES if c.get("predicted")]
    body = ['<div class="box"><b>Contents</b><ol class="toc"><li><a href="#first-aid">First aid in five steps</a></li><li><a href="#logging">How logging works</a></li>'
            '<li><a href="#index">Code index</a></li><li><a href="#codes">All error codes</a></li><li><a href="#predicted">Predicted errors (prevention)</a></li>'
            '<li><a href="#sql-numbers">SQL Server error numbers</a></li><li><a href="#errorlog">Database error and audit queries</a></li><li><a href="#recipes">Manual recovery recipes</a></li></ol></div>']
    body.append('<h2 id="first-aid">1. First aid in five steps</h2>' + table(["Step", "What to do"], FIRST_AID, "fixed"))
    body.append('<h2 id="logging">2. How logging works</h2>' + table(["Part", "Where", "What is recorded"], LOGGING, "fixed")
                + "<ul>" + "".join(f"<li>{E(r)}</li>" for r in LOG_RULES) + "</ul>")
    idx = []
    for pre, area in AREA_ORDER:
        links = " ".join(f'<a href="#{c["code"]}">{c["code"]}</a>' for c in CODES if c["code"].split("-")[1] == pre)
        idx.append([f"{pre} — {area}", f"<span class='idx'>{links}</span>"])
    body.append(f'<h2 id="index">3. Code index</h2><p>{len(CODES)} codes in {len(AREA_ORDER)} areas. Format <code>SKY-&lt;AREA&gt;-&lt;NNN&gt;</code>; severity: critical (stops the site or risks data), error (an action failed), warn (attention needed), info (normal refusal, e.g. wrong password). Source: <code>config/error-codes.json</code> {E(CAT["version"])} — the same file the Admin site uses, so screen, log and guide always match.</p>'
                + table(["Area", "Codes"], idx))
    body.append('<h2 id="codes" class="pb">4. All error codes</h2>')
    for pre, area in AREA_ORDER:
        body.append(f"<h3>{pre} — {E(area)}</h3>" + "".join(code_card(c) for c in CODES if c["code"].split("-")[1] == pre))
    body.append('<h2 id="predicted" class="pb">5. Predicted errors (prevention)</h2><p>These have not happened yet but are expected as the program grows (more leads, a second PC, hosting on Hostinger, longer running time). Each has a prevention built in and a manual fix.</p>'
                + table(["Code", "Problem", "Prevention already in place / check"], [[f'<a href="#{c["code"]}">{c["code"]}</a>', c["title"], (c.get("fix") or [""])[0]] for c in pred], "fixed"))
    body.append('<h2 id="sql-numbers">6. SQL Server error numbers</h2><p>The Admin site converts database errors with this table (admin-site/src/errors.js). Use it when SSMS shows a number.</p>'
                + table(["SQL number / driver code", "Meaning", "SkyTech code"], [[a, b, f'<a href="#{c}">{c}</a>'] for a, b, c in SQL_NUMBERS]))
    body.append(f'<h2 id="errorlog">7. Database error and audit queries (SSMS)</h2><pre>{E(ERRORLOG_SQL)}</pre>')
    body.append('<h2 id="recipes">8. Manual recovery recipes</h2>' + table(["Situation", "Steps"], RECIPES, "fixed"))
    html_text = page("SkyTech Troubleshooting Guide", v, "SkyTech_Troubleshooting_Guide", "\n".join(body),
                     "How to find and fix any problem in the SkyTech Admin site, database, scripts and GitHub releases. Every error shows a SkyTech code; look it up here. Start with First aid if you are not sure where the problem is.")
    md = ["# SkyTech Troubleshooting Guide", "", f"Version {v} · {DATE} · release {RELEASE} · maintained by SkyTech_Manager", "",
          "## 1. First aid in five steps", ""] + md_table(["Step", "What to do"], FIRST_AID)
    md += ["", "## 2. How logging works", ""] + md_table(["Part", "Where", "What is recorded"], LOGGING) + [""] + [f"- {r}" for r in LOG_RULES]
    md += ["", "## 3–4. Error codes", ""]
    for pre, area in AREA_ORDER:
        md += ["", f"### {pre} — {area}", ""]
        for c in (x for x in CODES if x["code"].split("-")[1] == pre):
            md += [f"#### {c['code']} — {c['title']} ({c['severity']}{', predicted' if c.get('predicted') else ''})", "", f"Where: {c['where']}. Logged in: {c.get('log', '')}.", "",
                   "Causes: " + "; ".join(c.get("causes", [])) + ".", "", "Fix:"] + [f"{i}. {x}" for i, x in enumerate(c.get("fix", []), 1)] + [""]
    md += ["## 5. Predicted errors", ""] + md_table(["Code", "Problem", "Prevention / check"], [[c["code"], c["title"], (c.get("fix") or [""])[0]] for c in pred])
    md += ["", "## 6. SQL Server error numbers", ""] + md_table(["SQL number", "Meaning", "SkyTech code"], SQL_NUMBERS)
    md += ["", "## 7. Database error and audit queries", "", "```sql", ERRORLOG_SQL, "```", "", "## 8. Manual recovery recipes", ""] + md_table(["Situation", "Steps"], RECIPES)
    write("SkyTech_Troubleshooting_Guide", html_text, md, v)


RECIPES = [
    ("Admin site will not start", "Run start-admin.bat — it runs the doctor first and stops on the first problem with its code. Typical: .env missing (SKY-CFG-001), weak SESSION_SECRET (SKY-CFG-002: npm run doctor -- --new-secret), SQL Server service stopped (SKY-DB-001: Services → SQL Server (MSSQLSERVER) → Start)."),
    ("Locked out of the Admin site", "Wait 15 minutes (SKY-AUTH-002), or restart the Admin site to clear the lock. Forgotten password: in admin-site run npm run create-admin with the same username to set a new one."),
    ("A table or procedure is missing", "In SSMS run the scripts in order: sql/01 → lead import → sql/04 → sql/05 → sql/06. All are safe to re-run and never delete data."),
    ("Duplicates appeared", "Admin site → Possible duplicates: merge or dismiss each Exact pair, then re-run sql/01 so the unique rules are created (SKY-DUP-004)."),
    ("Database damaged or deleted (SKY-BAK-002)", "Stop the Admin site. In SSMS: RESTORE DATABASE SkyTechCRM FROM DISK = N'C:\\SkyTechBackups\\<newest>.bak' WITH REPLACE, CHECKSUM; then run sql/04 and sql/06 and npm run doctor."),
    ("Push to GitHub fails", "Read the code printed by push-to-github.bat: lock file (SKY-GIT-002: close GitHub Desktop, delete the .lock file), secret found (SKY-SEC-004: remove it, rotate the key if it was ever pushed), sign-in (SKY-GIT-001: sign in again in GitHub Desktop), GitHub newer (SKY-GIT-004: Fetch/Pull in GitHub Desktop, then push)."),
    ("A secret was uploaded by mistake", "Change the password/key at its source immediately (rotation is the real fix — removing the file later does not erase GitHub history). Then remove it from the file, commit, push, and tell SkyTech_Manager to clean the history."),
    ("Disk full (SKY-SYS-002)", "Delete old files in C:\\SkyTechBackups (keep the newest 4) and logs\\runtime older than 30 days; empty the Recycle Bin; run the doctor."),
    ("Moving to a second computer or to hosting", "Copy the repository, run npm install, create a new .env (new SESSION_SECRET), keep HOST=127.0.0.1 unless the site is behind HTTPS with COOKIE_SECURE=1 and TRUST_PROXY=1, use the SkyTechApp least-privilege login (sql/06), run the doctor."),
]

# ============================ 2. Security Architecture ============================
PRINCIPLES = [
    ("Least privilege", "Each part gets only the access it needs: viewer vs admin roles in the site; SkyTechApp database role with no design rights; agents act only after the owner approves."),
    ("Defence in depth", "Several independent layers: local-only network binding, sign-in with lockout, session timeouts, CSRF token + Origin check, strict CSP, parameterised SQL, whitelisted tables/columns, database role, append-only audit."),
    ("Secure by default", "The site refuses to start with a weak secret or when opened to the network without HTTPS (SKY-CFG-002/003). Demo pages are noindex and carry a preview banner."),
    ("No secrets in code", "Passwords and keys live only in admin-site\\.env on the owner's PC (git-ignored); push-to-github.bat scans every file before upload (SKY-SEC-004)."),
    ("Everything is traceable", "Every request has a reference; security events, changes and errors are logged (files, dbo.AuditLog, dbo.ErrorLog) with secrets redacted."),
    ("Recoverable", "Verified, checksummed database backups; all SQL scripts are re-runnable; every release is a git tag on a private GitHub repository."),
    ("Honest and lawful", "Free licensed data sources only, no bot scraping of Google Maps/Yelp/Facebook, owner makes all calls (TCPA), no invented reviews or credentials on demo sites."),
]
DATA_CLASSES = [
    ("Restricted", "Admin password hashes, SESSION_SECRET, DB password, GitHub sign-in, API keys", "admin-site\\.env, dbo.AdminUsers (hash only), Windows Credential Manager", "Never in git or logs (redacted); bcrypt cost 12; rotate on any suspicion"),
    ("Confidential", "Lead pipeline, notes, call outcomes, deal values, audit and error logs", "SkyTechCRM on the owner's PC, logs\\runtime, private GitHub repo (no logs)", "Sign-in required; admin-only writes; append-only audit; 30-day log retention"),
    ("Internal", "Program documents, prompts, agent role files, code", "Repository, Claude project", "Private repo; versioned; no AI metadata in documents"),
    ("Public", "Business facts from public sources (name, phone, address), published demo sites after approval", "Lead tables, demo-sites", "Source recorded for every row; demos noindex until the business approves"),
]
BOUNDARIES = [
    ("B1 Browser ↔ Admin site", "Owner's browser to http://127.0.0.1:3030", "Loopback only (HOST=127.0.0.1); HTTPS + Secure cookies required for anything else; CSP, CSRF, Origin check, rate limit, session timeouts"),
    ("B2 Admin site ↔ SQL Server", "Node.js process to SkyTechCRM", "Windows integrated login (no stored password) or least-privilege SkyTechApp login; parameterised queries; optional TLS (DB_ENCRYPT=1)"),
    ("B3 PC ↔ GitHub", "git push of releases from the local folder", "Private repository; HTTPS with GitHub sign-in; secret scan before every push; .env, logs and backups git-ignored"),
    ("B4 PC ↔ Claude (SkyTech_Manager)", "The local folder, connected through the Claude desktop app", "Owner-approved actions only (automatic approval off); no passwords or tokens ever requested; delete rights only when granted"),
    ("B5 Demo pages ↔ the public", "Static demo pages copied from the local folder to hosting after approval", "No forms, no scripts from third parties, photos only from allowed free-licence hosts, noindex until approved"),
]
STRIDE = [
    ("Spoofing", "Someone signs in as the owner (guessing or stolen password)", "bcrypt hashes; password policy (12+ chars, mixed case, digit, not common); 5-try lockout per user and per computer; timing-safe check with dummy hash (no user enumeration); session regenerated at sign-in", "SKY-AUTH-001/002/006"),
    ("Tampering", "A malicious web page makes the browser change data (CSRF); SQL injection", "CSRF token on every change; Origin/Referer check; SameSite=Strict cookies; parameterised SQL; table/column allow-list (schema.js); input checks (slug, colours, photo hosts)", "SKY-SEC-001/007/005, SKY-DATA-006"),
    ("Repudiation", "A change cannot be traced to a person", "dbo.AuditLog for every sign-in and change, protected by trigger (append-only); request IDs in logs", "SKY-SEC-006"),
    ("Information disclosure", "Leads or secrets leak (logs, GitHub, error pages, other sites)", "Loopback binding; no stack traces to the browser; redaction in logs; secret scan; git-ignore; no-store cache on API; strict CSP; Referrer-Policy same-origin", "SKY-SEC-004, SKY-CFG-003"),
    ("Denial of service", "Request floods or very large requests make the site unusable", "Rate limit 300/min (60 writes/min) per computer; 200 kB request limit; DB timeouts (15 s connect / 30 s query)", "SKY-SEC-002/003, SKY-DB-007"),
    ("Elevation of privilege", "A viewer performs admin actions; the app changes database design", "Server-side role check on every write (adminOnly); SkyTechApp role has no ALTER/CREATE; DENY on audit/error log changes and on backup/purge procedures", "SKY-AUTH-005, SKY-DB-008"),
]
CONTROLS = [  # control, implementation, OWASP ASVS 4.0.3, NIST CSF 2.0, CIS v8
    ("Secure configuration check at start", "security.checkConfig, server.js fatal(), npm run doctor", "V14.1", "PR.PS-01", "4.1"),
    ("Strong password storage", "bcryptjs cost 12 (create-admin.js); hash only in dbo.AdminUsers", "V2.4.1", "PR.AA-01", "5.2"),
    ("Password policy", "security.passwordPolicy (12+, upper/lower, digit, no username, not common)", "V2.1.1, V2.1.7", "PR.AA-01", "5.2"),
    ("Brute-force protection", "security.loginGuard: 5 failures / 15 min per user and IP", "V2.2.1", "PR.AA-03", "6.x"),
    ("No user enumeration", "Same message and timing for unknown user (dummy bcrypt hash)", "V2.2.3", "PR.AA-03", "—"),
    ("Session management", "express-session, HttpOnly + SameSite=Strict (+Secure/__Host- on HTTPS), regenerate at sign-in, 30 min idle / 8 h absolute", "V3.2, V3.3, V3.4", "PR.AA-05", "6.2"),
    ("Access control", "auth + adminOnly middleware; viewer read-only; schema allow-list", "V4.1, V4.2", "PR.AA-05", "6.8"),
    ("CSRF protection", "Per-session token in X-CSRF-Token + Origin check", "V4.2.2", "PR.PS-06", "16.x"),
    ("Injection prevention", "Typed SQL parameters (mssql); identifiers only from schema.js; HTML escaping in app.js and render.js", "V5.3.4, V5.3.3", "PR.PS-06", "16.x"),
    ("Input validation", "Required fields, types, lengths, slug/colour/photo-host checks", "V5.1", "PR.PS-06", "16.x"),
    ("Security headers", "CSP (script-src 'self'), X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, COOP/CORP, HSTS on HTTPS", "V14.4", "PR.PS-01", "16.x"),
    ("Rate limiting / size limits", "security.rateLimit; express.json 200 kB", "V11.1.4, V13.1", "PR.IR-04", "13.x"),
    ("Error handling", "Central handler: code + ref to the user, details only in the log; catalog-based messages", "V7.4.1", "DE.AE-02", "8.x"),
    ("Security logging", "logger.security for sign-in, lockout, CSRF, rate limit, permission, expiry; redaction; retention 30 days", "V7.1, V7.2, V7.3", "DE.CM-01, DE.AE-03", "8.2, 8.5"),
    ("Audit trail", "dbo.AuditLog append-only (trigger, DENY)", "V7.2.2", "PR.PS-04", "8.5"),
    ("Least-privilege database role", "SkyTechApp role (sql/06)", "V1.4.3", "PR.AA-05", "5.4, 6.8"),
    ("Secrets management", ".env only, git-ignored, secret scan before push, doctor checks", "V6.4.1, V14.3", "PR.DS-01", "3.x, 16.x"),
    ("Backup and recovery", "usp_BackupSkyTechCRM (CHECKSUM, COMPRESSION, VERIFYONLY); doctor warns after 7 days", "—", "PR.DS-11, RC.RP-01", "11.2, 11.4, 11.5"),
    ("Supply chain", "Few, well-known npm packages; package-lock.json committed; npm audit in the monthly checklist", "V14.2", "GV.SC-04", "16.4"),
    ("Change management", "Versioned files and footers, CHANGELOG, git tags per release, owner approval before every action", "V1.1", "PR.PS-02", "4.x"),
]
SECRETS = [
    ("SESSION_SECRET", "Signs session cookies", "admin-site\\.env", "npm run doctor -- --new-secret; change if the PC or .env may have been exposed (everyone is signed out)"),
    ("Admin site passwords", "Owner/viewer sign-in", "dbo.AdminUsers (bcrypt hash)", "npm run create-admin with the same username"),
    ("DB_PASSWORD (only if DB_AUTH=sql)", "SkyTechAdminSite SQL login", "admin-site\\.env", "SSMS: ALTER LOGIN SkyTechAdminSite WITH PASSWORD = N'…'; then update .env"),
    ("GitHub sign-in", "Push releases", "GitHub Desktop / Windows Credential Manager", "github.com → Settings → Sessions / tokens; sign in again"),
    ("Free API keys (Google Places check, Pexels) — if added", "Lead checks, photos", "admin-site\\.env only", "Rotate in the provider's console; never paste into documents or prompts"),
]
INCIDENT = [
    ("1. Detect", "Signs: unexpected LOCKOUT or LOGINFAIL entries, SKY-SEC-001/007 blocks you did not cause, unknown changes in dbo.AuditLog, doctor warnings, a secret-scan hit."),
    ("2. Contain", "Stop the Admin site (close its window). If a secret may be exposed: change it now (table above). If the PC may be compromised: disconnect it from the network."),
    ("3. Investigate", "System log / logs\\runtime (search by ref, user, ip), dbo.AuditLog and dbo.ErrorLog queries in the Troubleshooting Guide, git log for unexpected commits."),
    ("4. Recover", "Restore the newest verified backup if data was damaged (SKY-BAK-002 recipe), re-run sql/04 and sql/06, create new admin passwords, run the doctor."),
    ("5. Learn", "SkyTech_Manager records what happened, the fix and any new control in the CHANGELOG and the version register; add or update the error code."),
]
CHECKLIST = [
    ("Every day", "Start with start-admin.bat (runs the doctor). Glance at the System log for red (error) rows."),
    ("Every week", "EXEC dbo.usp_BackupSkyTechCRM; in SSMS; copy C:\\SkyTechBackups to a USB drive or cloud folder. Run npm run doctor. Push releases with push-to-github.bat (secret scan runs)."),
    ("Every month", "Install Windows and SQL Server updates. In admin-site run npm audit (report findings to SkyTech_Manager). Review AdminUsers (remove unused logins). Review dbo.ErrorLog and purge rows older than 90 days."),
    ("Every quarter", "Test a restore of the newest backup into a scratch database (RESTORE … WITH MOVE, under another name). Change SESSION_SECRET and admin passwords. Review this document with SkyTech_Manager."),
]
LIMITS = [
    ("Single computer", "Sessions, rate-limit and lockout counters are kept in memory; restarting the site signs everyone out and clears locks. Fine for one owner; a shared store is needed before hosting for several users."),
    ("No multi-factor sign-in yet", "Acceptable while the site is reachable only from this PC (127.0.0.1). Required before any internet exposure (roadmap)."),
    ("Local HTTP", "Traffic never leaves the PC, so HTTPS is not needed locally; any other HOST requires HTTPS (enforced, SKY-CFG-003)."),
    ("Database encryption at rest", "SQL Server 2014 Developer supports TDE, but backups and the PC disk are best protected with Windows BitLocker (owner setting)."),
    ("Not a certification", "Controls follow OWASP ASVS, NIST CSF 2.0 and CIS Controls v8 practices scaled to a one-PC business. No external audit has been performed."),
]


def boundary_svg():
    """Trust-boundary picture: three zones and the five boundaries B1–B5 (see the table under it)."""
    zones = [(20, 60, 560, 300, "Owner's PC (trusted zone)"), (620, 60, 250, 120, "GitHub (private)"), (620, 210, 250, 150, "Internet")]
    boxes = [(50, 100, 150, 56, "Browser", "owner"), (240, 100, 150, 56, "Admin site", "Node.js 127.0.0.1"), (430, 100, 130, 56, "SkyTechCRM", "SQL Server 2014"),
             (240, 196, 150, 50, ".env + logs", "never uploaded"), (430, 196, 130, 50, "Backups", "C:\\SkyTechBackups"),
             (240, 284, 320, 52, "Local folder = Git repository", "SkyTechClaude\\skytech-agent-program"),
             (650, 100, 190, 56, "Repository", "releases, tags"), (650, 236, 190, 50, "Claude (SkyTech_Manager)", "owner-approved"), (650, 298, 190, 46, "Demo pages", "Hostinger, after approval")]
    out = ['<svg viewBox="0 0 890 380" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Trust boundaries">',
           '<defs><marker id="sa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10z" class="mk"/></marker></defs>',
           '<text x="20" y="34" class="h">Trust boundaries</text>']
    for x, y, w, h, t in zones:
        out.append(f'<g class="zone"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="14"/><text x="{x+14}" y="{y+22}">{E(t)}</text></g>')
    for x, y, w, h, t, s in boxes:
        out.append(f'<g class="bx"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="9"/><text x="{x+w/2}" y="{y+23}" text-anchor="middle" class="t">{E(t)}</text><text x="{x+w/2}" y="{y+40}" text-anchor="middle" class="s">{E(s)}</text></g>')
    arrows = [("M200,128 L240,128", "B1", 220, 118), ("M390,128 L430,128", "B2", 410, 118),
              ("M560,302 L600,302 L600,128 L650,128", "B3", 600, 210), ("M560,312 L650,262", "B4", 634, 280), ("M560,324 L650,322", "B5", 634, 340)]
    for d, lab, lx, ly in arrows:
        out.append(f'<path d="{d}" class="ar" marker-end="url(#sa)"/><g class="num"><circle cx="{lx}" cy="{ly-4}" r="11"/><text x="{lx}" y="{ly}" text-anchor="middle">{lab}</text></g>')
    out.append('<path d="M315,156 L315,196" class="ar" marker-end="url(#sa)"/><path d="M495,156 L495,196" class="ar" marker-end="url(#sa)"/></svg>')
    return "".join(out)


def build_security():
    v = VERSIONS["security"]
    body = ['<div class="box"><b>Contents</b><ol class="toc"><li>Security principles</li><li>Data classification</li><li>Trust boundaries</li><li>Threat model (STRIDE)</li>'
            '<li>Controls and standards mapping</li><li>Secrets and key management</li><li>Logging, monitoring and audit</li><li>Backup and recovery</li><li>Incident response</li>'
            '<li>Owner security checklist</li><li>Known limits and roadmap</li></ol></div>',
            '<h2>1. Security principles</h2>' + table(["Principle", "How SkyTech applies it"], PRINCIPLES, "fixed"),
            '<h2>2. Data classification</h2>' + table(["Class", "Examples", "Where it is kept", "Protection"], DATA_CLASSES, "fixed"),
            '<h2 class="pb">3. Trust boundaries</h2><div class="diagram">' + boundary_svg() + '</div>' + table(["Boundary", "What crosses it", "Controls"], BOUNDARIES, "fixed"),
            '<h2 class="pb">4. Threat model (STRIDE)</h2>' + table(["Threat", "Example for SkyTech", "Controls in place", "Codes"], STRIDE, "fixed"),
            '<h2 class="pb">5. Controls and standards mapping</h2><p>References: OWASP Application Security Verification Standard 4.0.3 (ASVS), NIST Cybersecurity Framework 2.0 (CSF), CIS Critical Security Controls v8 (CIS). Code locations are documented in the Code Documentation.</p>'
            + table(["Control", "Implementation", "ASVS", "NIST CSF", "CIS"], CONTROLS, "fixed"),
            '<h2>6. Secrets and key management</h2>' + table(["Secret", "Used for", "Stored in", "How to rotate"], SECRETS, "fixed"),
            '<h2>7. Logging, monitoring and audit</h2>' + table(["Part", "Where", "What is recorded"], LOGGING, "fixed") + "<ul>" + "".join(f"<li>{E(r)}</li>" for r in LOG_RULES) + "</ul>",
            '<h2>8. Backup and recovery</h2><div class="box"><b>Backup:</b> <code>EXEC SkyTechCRM.dbo.usp_BackupSkyTechCRM;</code> — full, compressed backup with page checksums, verified with RESTORE VERIFYONLY, to C:\\SkyTechBackups (weekly; the doctor warns after 7 days, SKY-BAK-003). Keep a copy off the PC.<br><b>Recovery point:</b> up to one week of changes (daily backups shorten this). <b>Recovery time:</b> under one hour (restore, re-run sql/04 and sql/06, doctor).<br><b>Code and documents:</b> every release is a git tag on the private GitHub repository.</div>',
            '<h2>9. Incident response</h2>' + table(["Step", "What to do"], INCIDENT, "fixed"),
            '<h2>10. Owner security checklist</h2>' + table(["When", "Tasks"], CHECKLIST, "fixed"),
            '<h2>11. Known limits and roadmap</h2>' + table(["Limit", "Why it is acceptable now / what changes later"], LIMITS, "fixed")]
    html_text = page("SkyTech Security Architecture", v, "SkyTech_Security_Architecture", "\n".join(body),
                     "How the SkyTech program protects its data, its owner and the businesses it contacts. Industry practices (OWASP ASVS, NIST CSF 2.0, CIS Controls v8) applied to a $0, one-PC setup: what is protected, against which threats, by which controls, and what the owner does to keep it that way.")
    md = ["# SkyTech Security Architecture", "", f"Version {v} · {DATE} · release {RELEASE} · maintained by SkyTech_Manager", ""]
    for title, head, rows in [("1. Security principles", ["Principle", "How SkyTech applies it"], PRINCIPLES), ("2. Data classification", ["Class", "Examples", "Where", "Protection"], DATA_CLASSES),
                              ("3. Trust boundaries", ["Boundary", "What crosses it", "Controls"], BOUNDARIES), ("4. Threat model (STRIDE)", ["Threat", "Example", "Controls", "Codes"], STRIDE),
                              ("5. Controls and standards mapping", ["Control", "Implementation", "ASVS", "NIST CSF", "CIS"], CONTROLS), ("6. Secrets and key management", ["Secret", "Used for", "Stored in", "Rotate"], SECRETS),
                              ("7. Logging, monitoring and audit", ["Part", "Where", "What"], LOGGING), ("9. Incident response", ["Step", "What to do"], INCIDENT),
                              ("10. Owner security checklist", ["When", "Tasks"], CHECKLIST), ("11. Known limits and roadmap", ["Limit", "Notes"], LIMITS)]:
        md += ["", f"## {title}", ""] + md_table(head, rows)
    md += ["", "## 8. Backup and recovery", "", "`EXEC SkyTechCRM.dbo.usp_BackupSkyTechCRM;` weekly (CHECKSUM, COMPRESSION, VERIFYONLY → C:\\SkyTechBackups). Keep a copy off the PC. Restore recipe: Troubleshooting Guide, SKY-BAK-002."]
    write("SkyTech_Security_Architecture", html_text, md, v)


# ============================ 3. Code Documentation ============================
CODE_FILES = [  # (group, path) — every program file in the repository, in reading order
    ("Admin site — server", "admin-site/server.js"), ("Admin site — server", "admin-site/src/security.js"), ("Admin site — server", "admin-site/src/errors.js"),
    ("Admin site — server", "admin-site/src/logger.js"), ("Admin site — server", "admin-site/src/schema.js"), ("Admin site — server", "admin-site/src/db/mssql.js"),
    ("Admin site — server", "admin-site/src/db/memory.js"), ("Admin site — server", "admin-site/src/demo/render.js"),
    ("Admin site — screens", "admin-site/public/app.js"), ("Admin site — screens", "admin-site/public/style.css"), ("Admin site — screens", "admin-site/public/index.html"),
    ("Admin site — tools", "admin-site/scripts/doctor.js"), ("Admin site — tools", "admin-site/scripts/create-admin.js"), ("Admin site — tools", "admin-site/scripts/build-demos.js"),
    ("Admin site — tools", "admin-site/start-admin.bat"), ("Admin site — tools", "admin-site/.env.example"),
    ("Database (SQL Server 2014)", "sql/01_create_skytechcrm.sql"), ("Database (SQL Server 2014)", "sql/02_daily_batch_query.sql"), ("Database (SQL Server 2014)", "sql/04_admin_site.sql"),
    ("Database (SQL Server 2014)", "sql/05_demo_sites_built.sql"), ("Database (SQL Server 2014)", "sql/06_security_and_logging.sql"),
    ("Scripts", "scripts/common/skylog.py"), ("Scripts", "scripts/security/scan-secrets.js"), ("Scripts", "scripts/leads/build_sample_from_extract.py"),
    ("Scripts", "scripts/leads/make_sample.py"), ("Scripts", "scripts/leads/overture_browser_extract.js"), ("Scripts", "scripts/docs/build_infrastructure.py"),
    ("Scripts", "scripts/docs/build_tech_stack.py"), ("Scripts", "scripts/docs/build_ops_docs.py"), ("Scripts", "scripts/prompt-book/build_prompt_book.py"),
    ("Scripts", "scripts/prompt-book/content.py"), ("Scripts", "scripts/website/content.py"), ("Scripts", "scripts/website/build_demo_sites.py"),
    ("Repository", "push-to-github.bat"), ("Repository", ".gitignore"), ("Repository", "config/error-codes.json"),
]
CONVENTIONS = [
    ("Version line", "First and last line of every file: Version: Vx.y (date) — <path> — Vx.y. Files are edited in place; the CHANGELOG and version register record each change."),
    ("File purpose block", "Right after the version line: Purpose, Inputs, Outputs, Run, Errors (SkyTech codes) and, where relevant, Security. JavaScript uses /** @file … */, Python a module docstring, SQL and .bat files comment lines (-- / REM)."),
    ("Function comments", "One line directly above each function, procedure, view or table: name — what it does (and the codes it can raise). JavaScript /** … */ or //, Python docstrings, SQL -- lines above CREATE."),
    ("Error codes", "Code never invents messages: it throws AppError('SKY-…') (Node) or skylog.fail('SKY-…') (Python); SQL THROWs numbers that errors.js maps to codes. All codes live in config/error-codes.json."),
    ("Logging", "Node: require('./logger') — log.info/warn/error/security(category, message, {code, reqId, …}). Python: skylog.get(name).info(…). Never log passwords or tokens (redaction is automatic, but do not rely on it)."),
    ("Security notes", "Any input that reaches SQL, HTML or the file system is validated or escaped at that point, and the comment says how."),
]


def extract(path):
    """Returns (header_text, [(name, comment)]) for one source file, following the conventions above."""
    full = os.path.join(ROOT, path)
    try:
        src = open(full, encoding="utf-8").read()
    except OSError as e:
        skylog.fail("SKY-DOC-002", f"Cannot read {path}: {e}")
    lines = src.split("\n")
    ext = os.path.splitext(path)[1].lower()
    header, items = "", []
    if ext == ".json":
        try:
            d = json.loads(src); header = f"Error catalog {d.get('version')}: {len(d.get('codes', []))} codes, format {d.get('format')}. Fields per code: code, area, severity, title, where, causes, fix, log, predicted, http, user."
        except Exception:
            header = "JSON data file."
        return header, items
    if ext == ".py":
        m = re.match(r'\s*(?:#[^\n]*\n)*\s*"""(.*?)"""', src, re.S)
        header = m.group(1).strip() if m else "\n".join(l[1:].strip() for l in lines[:8] if l.startswith("#"))
        for m in re.finditer(r'^(\s*)(?:def|class) (\w+)[^\n]*:\n\s*"""(.*?)"""', src, re.S | re.M):
            items.append((m.group(2), " ".join(m.group(3).split())))
        return header, items
    if ext in (".sql",):
        hdr = []
        for l in lines[1:]:
            if l.startswith("--"): hdr.append(l[2:].rstrip())
            else: break
        header = "\n".join(hdr).strip()
        for i, l in enumerate(lines):
            m = re.search(r"\bCREATE (TABLE|VIEW|PROCEDURE|FUNCTION|TRIGGER|ROLE) ([\w.\[\]]+)", l, re.I)
            if l.strip().startswith("--"): continue
            if not m: continue
            com, j = [], i - 1
            while j >= 0 and (lines[j].strip().startswith("--") or re.match(r"\s*IF (OBJECT_ID|DATABASE_PRINCIPAL_ID)|\s*GO\s*$", lines[j])):
                if lines[j].strip().startswith("--") and not lines[j].strip().startswith("-----"): com.insert(0, lines[j].strip()[2:].strip())
                j -= 1
                if len(com) > 4: break
            name = f"{m.group(1).upper()} {m.group(2)}"
            if not any(n == name for n, _ in items): items.append((name, " ".join(com) or "—"))
        return header, items
    if ext in (".bat",):
        header = "\n".join(l.strip()[3:].strip() for l in lines if l.strip().upper().startswith("REM") and "Version:" not in l)
        return header, items
    if path.endswith(".env.example") or path.endswith(".gitignore"):
        header = "\n".join(l[1:].strip() for l in lines if l.startswith("#") and "Version:" not in l)
        return header, items
    if ext in (".html",):
        return "Admin site page shell: sign-in form, sidebar menu (Dashboard, tables, Possible duplicates, Demo sites, System log for admins), record drawer and toast. Loads style.css, vendor Chart.js and app.js only (no inline script, CSP).", items
    if ext == ".css":
        m = re.match(r"/\*(.*?)\*/", src, re.S); header = re.sub(r"Version:[^\n]*\n?", "", m.group(1)).strip() if m else ""
        return header, items
    # JavaScript
    m = re.search(r"/\*\*(.*?)\*/", src, re.S)
    if m and src.index("/**") < 400:
        header = "\n".join(re.sub(r"^\s*\* ?", "", l) for l in m.group(1).split("\n")).strip()
    else:
        header = "\n".join(l.strip()[2:].strip() for l in lines[1:12] if l.strip().startswith("//"))
    for i, l in enumerate(lines):
        if i < 3: continue
        s = l.strip()
        m1 = re.match(r"/\*\*\s*(\w+)\s+—\s+(.*?)\s*\*/$", s)        # /** name — text */
        m2 = re.match(r"//\s*(\w+)\s+—\s+(.*)$", s)                   # // name — text
        if m1 or m2:
            mm = m1 or m2; items.append((mm.group(1), mm.group(2))); continue
        if s.startswith("/**") and not s.endswith("*/"):                # multi-line /** name — … */
            block = []
            for k in range(i, min(i + 12, len(lines))):
                block.append(re.sub(r"^\s*/?\*+/? ?", "", lines[k]).strip())
                if lines[k].strip().endswith("*/"): break
            text = " ".join(b for b in block if b and b != "/")
            mm = re.match(r"(\w+)\s+—\s+(.*)", text)
            if mm and not text.startswith("@file"): items.append((mm.group(1), mm.group(2).rstrip("*/ ").strip()))
    return header, items


def build_code():
    v = VERSIONS["code"]
    docs, groups = [], []
    for g, p in CODE_FILES:
        if not os.path.exists(os.path.join(ROOT, p)): log.warn("file missing, skipped", code="SKY-DOC-002", path=p); continue
        head3 = "".join(open(os.path.join(ROOT, p), encoding="utf-8").readlines()[:4])
        mv = re.search(r'Version: (V\d+\.\d+)', head3) or re.search(r'"version":\s*"(V\d+\.\d+)"', head3)
        ver = mv.group(1) if mv else "—"
        hdr, items = extract(p)
        docs.append((g, p, ver, hdr, items))
        if g not in groups: groups.append(g)
    summary = [[g, str(sum(1 for d in docs if d[0] == g)), str(sum(len(d[4]) for d in docs if d[0] == g))] for g in groups]
    body = ['<h2>1. How the code is commented</h2>' + table(["Rule", "What it means"], CONVENTIONS, "fixed"),
            '<h2>2. Files at a glance</h2>' + table(["Group", "Files", "Documented functions / objects"], summary)
            + table(["File", "Version", "Group"], [[f'<a href="#f-{re.sub(r"[^a-z0-9]+", "-", p.lower())}">{E(p)}</a>', ver, g] for g, p, ver, _, _ in docs]),
            '<h2 class="pb">3. File by file</h2>']
    md = ["# SkyTech Code Documentation", "", f"Version {v} · {DATE} · release {RELEASE} · maintained by SkyTech_Manager", "",
          "## 1. How the code is commented", ""] + md_table(["Rule", "What it means"], CONVENTIONS) + ["", "## 2. Files at a glance", ""] + md_table(["Group", "Files", "Documented items"], summary) + ["", "## 3. File by file"]
    for g in groups:
        body.append(f"<h3>{E(g)}</h3>"); md += ["", f"### {g}"]
        for gg, p, ver, hdr, items in (d for d in docs if d[0] == g):
            anchor = "f-" + re.sub(r"[^a-z0-9]+", "-", p.lower())
            fn = table(["Function / object", "What it does"], [[n, c] for n, c in items], "fn fixed") if items else ""
            body.append(f'<div class="code" id="{anchor}"><h3>{E(p)} <span class="sev info">{E(ver)}</span></h3><pre>{E(hdr)}</pre>{fn}</div>')
            md += ["", f"#### {p} ({ver})", "", "```text", hdr, "```"] + ([""] + md_table(["Function / object", "What it does"], items) if items else [])
    html_text = page("SkyTech Code Documentation", v, "SkyTech_Code_Documentation", "\n".join(body),
                     "Every program file in the SkyTech repository with the comments written in it: what the file is for, what goes in and comes out, how to run it, which SkyTech error codes it can raise, and one line for each function, table, view and procedure. Generated from the code itself, so it stays in step with each release.")
    write("SkyTech_Code_Documentation", html_text, md, v)
    return len(docs), sum(len(d[4]) for d in docs)


if __name__ == "__main__":
    build_guide()
    build_security()
    files, items = build_code()
    log.info("finished", files=files, items=items)
    print(f"done: {len(CODES)} error codes, {files} files / {items} documented items")

# Version: V1.0 (2026-10-10) — scripts/docs/build_ops_docs.py — V1.0
