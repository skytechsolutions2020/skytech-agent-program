"""Version: V1.4 (2026-10-10) — scripts/docs/build_tech_stack.py — V1.4
Builds docs/architecture/SkyTech_Technology_Stack_Use.html (and a .md copy for the Claude project and GitHub): the "Technology Stack Use" document.
It explains, for a non-technical reader, every tool and technology the SkyTech program uses, and merges
them with the architecture diagram (taken from build_infrastructure.py, so both documents always match).
Edit the DATA section, bump DOC_VERSION and add a CHANGELOG line, then run from the repository folder:
    python scripts/docs/build_tech_stack.py
Errors: SKY-DOC-001 missing Python package, SKY-DOC-002 file problem; log: logs/runtime/scripts-<date>.log.
"""
import html, os, runpy, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "common")); import skylog
skylog.install("build_tech_stack", "SKY-DOC-002")

HERE = os.path.dirname(os.path.abspath(__file__))
INFRA = runpy.run_path(os.path.join(HERE, "build_infrastructure.py"), run_name="skytech_lib")
OUT = sys.argv[1] if len(sys.argv) > 1 else "docs/architecture/SkyTech_Technology_Stack_Use.html"
E = html.escape

# ============================ DATA (edit here) ============================
DOC_VERSION = "V1.3"; DOC_DATE = "2026-10-10"; RELEASE = INFRA["RELEASE"]

# The journey a lead takes, in plain words, with the tools used at each step (one-minute picture).
JOURNEY = [
    ("Find businesses", "Free public map data lists local plumbers, electricians, contractors and real estate offices, and shows which ones list a website.",
     ["Overture Maps", "Claude BackOffice", "Desktop browser"]),
    ("Check & store", "Claude double-checks each business really has no website, then the list is saved in our own database, with duplicates blocked.",
     ["Web search", "SQL Server 2014", "SSMS"]),
    ("Build a free website", "Claude designs a one-page website for each business: its name, services, phone, a concept logo and free-licence photos.",
     ["Claude WebsiteDeveloper", "HTML / CSS", "Pexels photos"]),
    ("You review", "You (and anyone you give a login with the right role) sign in to your own Admin website to see dashboards, edit records or demo sites, and approve before anything is sent.",
     ["Admin site", "Node.js", "Chart.js"]),
    ("Reach out", "You call the business owner and follow up by email or social media, using scripts SkyTech_Manager prepares for you.",
     ["Phone (you)", "Email (free)", "Facebook"]),
    ("Win & host", "When a business says yes, the site goes live on free or low-cost hosting and they pay a setup fee plus a monthly plan.",
     ["Netlify (free)", "Hostinger", "Monthly plan"]),
]
BACKGROUND = ["SkyTech_Manager (Claude) coordinates and reports", "Git + GitHub keep a backed-up history of every file",
              "Version register and CHANGELOG record every change; logs and SKY error codes record every problem", "Claude desktop app links Claude to your SkyTechClaude folder"]

# Technology stack: (group, tool, what it is in plain words, what we use it for, cost, where it runs, status)
STACK = [
 ("1 · Finding businesses", "Overture Maps Places", "A free, open database of places and businesses, published by a foundation backed by Amazon, Meta, Microsoft and TomTom.", "Main list of local businesses, including whether each one lists a website.", "Free (open licence)", "explore.overturemaps.org, opened in the Claude desktop browser", "In use"),
 ("1 · Finding businesses", "Foursquare Open Source Places", "A free, open dataset of business locations.", "Fills gaps in the Overture list.", "Free", "Downloaded file", "Planned"),
 ("1 · Finding businesses", "OpenStreetMap", "A world map built by volunteers, free to use.", "Extra small businesses not in other lists.", "Free", "Internet", "Planned"),
 ("1 · Finding businesses", "Maryland Business Express", "The State of Maryland's business registry search.", "Confirms a business is active and shows the owner or agent name.", "Free", "Website (manual look-up)", "Planned"),
 ("1 · Finding businesses", "MD Dept. of Labor licence look-up", "The State's search for trade licences.", "Confirms licences (MHIC, plumbing, electrical) before we contact a business.", "Free", "Website (manual look-up)", "Planned"),
 ("1 · Finding businesses", "Google Places API", "Google's business-listing service for programs.", "Spot checks only, inside the free monthly allowance.", "Free tier", "Internet", "Planned"),
 ("1 · Finding businesses", "Chamber and county directories", "Local member and business lists.", "Manual look-ups for extra leads.", "Free", "Websites", "Planned"),
 ("2 · The AI team", "Claude (Anthropic), in Cowork", "An AI assistant that does the work of the named SkyTech agents.", "SkyTech_Manager, BackOffice and WebsiteDeveloper: plans, checks leads, builds sites, keeps files and reports to you.", "Your existing Claude plan (no added cost)", "claude.ai and the Claude desktop app", "In use"),
 ("2 · The AI team", "Claude Project", "A shared space with instructions and documents that every Claude session reads.", "Project instructions, version register, daily prompt files.", "Included", "claude.ai", "In use"),
 ("2 · The AI team", "Claude desktop app (linked computer)", "The app that lets Claude work inside your SkyTechClaude folder and use a built-in browser.", "Reading and saving files, running scripts, collecting leads and photos.", "Free app", "Your Windows laptop", "In use"),
 ("2 · The AI team", "Saved skill: skytech-backoffice", "A saved set of instructions Claude reuses.", "Runs SkyTech_BackOffice the same way every time.", "Included", "Claude", "In use"),
 ("2 · The AI team", "Scheduled tasks", "Claude jobs that run on a timer.", "Daily versioning run: prompt file and version register.", "Included", "Claude (cloud)", "In use"),
 ("2 · The AI team", "Claude Docs living document", "An online document you can read and edit.", "The 90-Day Plan.", "Included", "claude.ai", "In use"),
 ("3 · Storing & checking data", "Microsoft SQL Server 2014 Developer Edition", "A database: a very organised set of tables, like spreadsheets that check each other.", "SkyTechCRM: companies, leads, activities and demo sites, with duplicate entries blocked.", "Free edition (already installed)", "Your laptop (database not created yet)", "Installed"),
 ("3 · Storing & checking data", "SQL Server Management Studio (SSMS)", "The program used to open the database and run its scripts.", "Running sql/01, the lead import, sql/04 and sql/05.", "Free", "Your laptop", "Ready"),
 ("3 · Storing & checking data", "SQL scripts (T-SQL)", "Step-by-step instructions for the database.", "Create the tables, import leads without duplicates, load the demo sites.", "Free (ours)", "sql/ folder", "Ready"),
 ("4 · Your Admin website", "Node.js", "The engine that runs JavaScript programs on a computer.", "Runs the Admin site and the demo-site builder.", "Free", "Your laptop", "Ready"),
 ("4 · Your Admin website", "Express, express-session, dotenv", "Building blocks for a small web server.", "Admin pages, sign-in sessions and settings.", "Free", "Your laptop", "Ready"),
 ("4 · Your Admin website", "bcryptjs", "A password scrambler.", "Stores Admin site passwords scrambled so they cannot be read (managed on the Logins screen).", "Free", "Your laptop", "Ready"),
 ("4 · Your Admin website", "mssql, msnodesqlv8, ODBC driver", "Connectors between Node.js and SQL Server.", "Lets the Admin site read and save database records.", "Free", "Your laptop", "Ready"),
 ("4 · Your Admin website", "Security layer (security.js)", "The site's locks and alarms, written by us.", "Blocks password guessing, forged requests from other websites and request floods; signs you out when idle; strict browser rules (CSP).", "Free (ours)", "Your laptop", "Ready"),
 ("4 · Your Admin website", "Logging + error codes (logger.js, errors.js)", "A diary of everything the site does, and a numbered list of every possible problem.", "Each problem shows a code like SKY-DB-001 that the Troubleshooting Guide explains; logs are kept 30 days with passwords hidden.", "Free (ours)", "Your laptop", "Ready"),
 ("4 · Your Admin website", "Doctor (npm run doctor)", "A one-command health check.", "Checks settings, packages, database, backups and GitHub safety, and tells you exactly how to fix anything wrong.", "Free (ours)", "Your laptop", "Ready"),
 ("4 · Your Admin website", "Chart.js", "A library for drawing charts.", "Dashboard charts you can click to drill down.", "Free", "Inside the Admin site", "Ready"),
 ("4 · Your Admin website", "HTML, CSS, JavaScript", "The basic building blocks of every web page.", "The Admin screens and every demo site.", "Free", "Browser", "In use"),
 ("5 · Demo websites", "Demo-site builder (render.js, build-demos.js)", "Our own template program.", "Turns each business's design file or database record into a finished one-page website.", "Free (ours)", "admin-site folder", "In use"),
 ("5 · Demo websites", "Pexels", "A free stock-photo library; photos may be used commercially.", "Real photos for banners and service cards (credited in the footer).", "Free licence", "Internet", "In use"),
 ("5 · Demo websites", "Google Fonts", "A free library of web typefaces.", "Professional fonts for each design.", "Free", "Internet", "In use"),
 ("5 · Demo websites", "Concept logos and illustrations (SVG)", "Drawings made in code, original to each site.", "Concept logos and artwork until the business gives us theirs.", "Free (ours)", "Inside each page", "In use"),
 ("5 · Demo websites", "Netlify", "Free website hosting.", "A shareable link for each approved demo.", "Free tier", "Internet", "Planned"),
 ("6 · Reaching out & our presence", "Phone (owner)", "You make every call yourself.", "Calling business owners (US calling rules, TCPA).", "Existing phone", "You", "Next"),
 ("6 · Reaching out & our presence", "Gmail / Brevo free", "Email sending.", "Follow-up emails you approve, with an opt-out line.", "Free tier", "Internet", "Planned"),
 ("6 · Reaching out & our presence", "Facebook Page", "SkyTech's page on Facebook.", "Posts and messages you approve.", "Free", "Internet", "Live"),
 ("6 · Reaching out & our presence", "Google Business Profile", "Your listing on Google Maps and Search.", "Being found by local customers.", "Free", "Internet", "To create"),
 ("6 · Reaching out & our presence", "Google Search Console", "Google's website health tool.", "Getting skytechsolutions.us indexed and checked.", "Free", "Internet", "Planned"),
 ("6 · Reaching out & our presence", "Hostinger", "The web host for skytechsolutions.us.", "Company website; later the Admin site.", "Existing plan", "Internet", "Live"),
 ("7 · Safety net: files & backup", "Git", "A change-tracker that keeps every version of every file.", "Each change is saved as a numbered release (R1.0, R2.0 ...).", "Free", "Your laptop", "In use"),
 ("7 · Safety net: files & backup", "GitHub (private repository)", "An online, private backup of the Git history.", "Off-site copy of all work: skytech-agent-program.", "Free", "Internet", "In use"),
 ("7 · Safety net: files & backup", "GitHub Desktop + push-to-github.bat", "One-click upload tools.", "Sending new releases to GitHub.", "Free", "Your laptop", "In use"),
 ("7 · Safety net: files & backup", "Secret scan (scan-secrets.js)", "A check that runs before every upload to GitHub.", "Stops passwords, keys or the .env settings file from ever being uploaded.", "Free (ours)", "Your laptop", "Ready"),
 ("7 · Safety net: files & backup", "SQL Server backup (usp_BackupSkyTechCRM)", "A verified copy of the whole database.", "Weekly backup to C:\\SkyTechBackups, checked so it can really be restored.", "Free", "Your laptop", "Ready"),
 ("7 · Safety net: files & backup", "Version register, INDEX, CHANGELOG", "Our record books.", "Which version of every file is current and what changed.", "Free (ours)", "config/ and repository root", "In use"),
 ("8 · Behind-the-scenes helpers", "Python 3", "A popular programming language.", "Lead scripts, prompt book, the diagram and this document.", "Free", "Your laptop (Claude runs it)", "In use"),
 ("8 · Behind-the-scenes helpers", "ReportLab", "A PDF maker for Python.", "The Prompt Book PDF.", "Free", "Your laptop", "In use"),
 ("8 · Behind-the-scenes helpers", "Playwright + Chromium", "An automated web browser.", "Turning diagrams into PDF/PNG and testing pages on phone and desktop sizes.", "Free", "Claude workspace", "In use"),
 ("8 · Behind-the-scenes helpers", "pypdf", "A PDF tool.", "Cleans PDF properties so documents carry no AI traces.", "Free", "Claude workspace", "In use"),
 ("8 · Behind-the-scenes helpers", "Markdown", "A simple text format for documents.", "Logs, role files and daily prompt files.", "Free", "Repository", "In use"),
]
GLOSSARY = [
 ("Database", "A set of linked tables that stores records and checks them; ours is called SkyTechCRM."),
 ("CRM", "Customer relationship management: keeping track of every business we contact and where each one stands."),
 ("Script", "A saved list of instructions a computer follows."),
 ("Lead", "A business that might become a customer."),
 ("Demo site", "A free sample website we build to show a business what it could have."),
 ("Repository / release", "The project folder with its full change history; a release is a numbered snapshot (for example R3.4)."),
 ("Hosting", "A service that keeps a website online so anyone can open it."),
 ("API", "A doorway that lets one program ask another for data."),
 ("Open licence / free licence", "Permission to use data or photos without paying, under stated rules."),
 ("noindex", "A tag that keeps a page out of Google until we are ready to publish it."),
 ("Error code", "A short label such as SKY-DB-001 that points to one problem and its fix in the Troubleshooting Guide."),
 ("Log", "A file where the program writes down what it did and any problem, with the time."),
 ("CSRF / CSP", "Protections that stop other websites from making your browser change your data or run unwanted code."),
]
CHANGELOG = [("V1.0", "2026-10-10", "First version: one-minute journey picture, architecture diagram, technology stack in plain words, costs, glossary."),
             ("V1.1", "2026-10-10", "R4.0: security layer, logging and error codes, doctor, secret scan and verified database backups added; diagram V1.6."),
             ("V1.2", "2026-10-10", "R4.2: Admin site manages its own logins (create, edit, disable, reset password); diagram V1.7."),
             ("V1.3", "2026-10-10", "R4.3: five Admin site roles (admin, manager, sales, web developer, viewer); diagram V1.8.")]
# ==========================================================================

def journey_svg():
    """Six-step "how SkyTech works" picture (find → check → build → contact → win → run), with the tools used at each step."""
    W, n, gap, top = 1400, len(JOURNEY), 22, 70
    cw = (W - 40 - gap * (n - 1)) / n
    out = [f'<svg viewBox="0 0 {W} 484" role="img" aria-label="How SkyTech works in six steps" xmlns="http://www.w3.org/2000/svg">',
           '<defs><marker id="jm" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0L10 5L0 10z" class="jmk"/></marker></defs>',
           '<text class="jh" x="20" y="36">How SkyTech works, in six steps</text>',
           f'<text class="jsub" x="{W-20}" y="36" text-anchor="end">{DOC_VERSION} · {DOC_DATE} · release {RELEASE}</text>']
    def wrap(t, n=31):
        words, lines, cur = t.split(), [], ""
        for w in words:
            if len(cur) + len(w) + 1 > n: lines.append(cur); cur = w
            else: cur = (cur + " " + w).strip()
        return lines + [cur]
    for i, (title, text, tools) in enumerate(JOURNEY):
        x = 20 + i * (cw + gap)
        out.append(f'<g class="jc"><rect x="{x:.0f}" y="{top}" width="{cw:.0f}" height="300" rx="14"/>')
        out.append(f'<circle class="jn" cx="{x+30:.0f}" cy="{top+32}" r="17"/><text class="jnt" x="{x+30:.0f}" y="{top+38}" text-anchor="middle">{i+1}</text>')
        out.append(f'<text class="jt" x="{x+56:.0f}" y="{top+38}">{E(title)}</text>')
        for k, line in enumerate(wrap(text)):
            out.append(f'<text class="jd" x="{x+16:.0f}" y="{top+76+k*17}">{E(line)}</text>')
        out.append(f'<text class="jl" x="{x+16:.0f}" y="{top+208}">TOOLS</text>')
        for k, tl in enumerate(tools):
            out.append(f'<g class="chip"><rect x="{x+14:.0f}" y="{top+218+k*25}" width="{cw-28:.0f}" height="20" rx="10"/><text x="{x+26:.0f}" y="{top+232+k*25}">{E(tl)}</text></g>')
        out.append('</g>')
        if i < n - 1:
            ax = x + cw
            out.append(f'<path class="ja" d="M{ax+2:.0f} {top+150} L{ax+gap-2:.0f} {top+150}" marker-end="url(#jm)"/>')
    by = top + 320
    out.append(f'<g class="band"><rect x="20" y="{by}" width="{W-40}" height="76" rx="14"/><text class="jl" x="38" y="{by+24}">ALWAYS RUNNING IN THE BACKGROUND</text>')
    for k, b in enumerate(BACKGROUND):
        out.append(f'<text class="bt" x="{38 + (k % 2) * 680}" y="{by+46 + (k // 2) * 20}">• {E(b)}</text>')
    out.append('</g></svg>')
    return "".join(out)

def stack_tables():
    """One table per tool group (what it is, what we use it for, cost, where it runs, status)."""
    groups, order = {}, []
    for row in STACK:
        if row[0] not in groups: groups[row[0]] = []; order.append(row[0])
        groups[row[0]].append(row[1:])
    html_out = []
    for g in order:
        rows = "".join(f'<tr><td><b>{E(t)}</b></td><td>{E(w)}</td><td>{E(u)}</td><td>{E(c)}</td><td>{E(r)}</td><td><span class="st {"ok" if s in ("In use", "Live", "Ready") else "pl"}">{E(s)}</span></td></tr>'
                       for t, w, u, c, r, s in groups[g])
        html_out.append(f'<h3>{E(g)}</h3><div class="wrap"><table class="stk"><thead><tr><th>Tool / technology</th><th>What it is, in plain words</th><th>What we use it for</th><th>Cost</th><th>Where it runs</th><th>Status</th></tr></thead><tbody>{rows}</tbody></table></div>')
    return "".join(html_out)

counts = {"total": len(STACK), "inuse": sum(1 for r in STACK if r[6] in ("In use", "Live", "Ready")),
          "free": sum(1 for r in STACK if r[4].lower().startswith("free") or r[4] == "Included")}

page = f'''<!doctype html>
<!-- Version: {DOC_VERSION} ({DOC_DATE}) — docs/architecture/SkyTech_Technology_Stack_Use.html — {DOC_VERSION} -->
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>SkyTech Technology Stack Use</title>
<style>
{INFRA["DIAGRAM_CSS"]}
h3 {{ font-size:15px; margin:22px 0 8px; }}
.lead {{ font-size:15px; max-width:70em; }}
.cards {{ display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin:14px 0 4px; }}
.card {{ background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:14px 16px; }}
.card b {{ display:block; font-size:24px; color:var(--acc); }}
.journey {{ background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:8px; overflow-x:auto; }}
.journey svg {{ width:100%; min-width:1000px; height:auto; display:block; }}
svg .jh {{ font-size:20px; font-weight:700; }} svg .jsub {{ font-size:12px; fill:var(--muted); }}
.jc rect {{ fill:var(--zone); stroke:var(--line); }} .jn {{ fill:var(--acc); }} svg .jnt {{ fill:#fff; font-weight:700; font-size:15px; }}
svg .jt {{ font-size:15.5px; font-weight:700; }} svg .jd {{ font-size:12.5px; fill:var(--ink); }}
svg .jl {{ font-size:10.5px; letter-spacing:.12em; fill:var(--muted); font-weight:700; }}
.chip rect {{ fill:var(--accbg); stroke:var(--acc); stroke-opacity:.35; }} .chip text {{ font-size:12px; font-weight:600; fill:var(--ink); }}
.ja {{ fill:none; stroke:var(--acc); stroke-width:2.2; }} .jmk {{ fill:var(--acc); }}
.band rect {{ fill:var(--person); stroke:var(--line); }} svg .bt {{ font-size:12.5px; }}
.stk {{ table-layout:fixed; min-width:900px; }} .stk th:nth-child(1) {{ width:17%; }} .stk th:nth-child(2) {{ width:24%; }} .stk th:nth-child(3) {{ width:27%; }} .stk th:nth-child(4) {{ width:11%; }} .stk th:nth-child(5) {{ width:13%; }} .stk th:nth-child(6) {{ width:8%; }}
.stk td {{ overflow-wrap:anywhere; }}
.st {{ display:inline-block; padding:2px 9px; border-radius:999px; font-size:12px; }}
.st.ok {{ background:var(--person); }} .st.pl {{ background:var(--zone); color:var(--muted); border:1px dashed var(--line); }}
.howto {{ background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:12px 16px; }}
@media (max-width:760px) {{ .cards {{ grid-template-columns:1fr; }} }}
@media print {{ .journey svg, .diagram svg {{ min-width:0; }} h2, h3 {{ break-after:avoid; }} tr {{ break-inside:avoid; }} .pb {{ break-before:page; }} .card {{ padding:8px 12px; }} .card b {{ font-size:20px; }} .lead {{ font-size:13px; }} }}
</style></head><body><main>
<h1>SkyTech Technology Stack Use</h1>
<div class="meta">Version {DOC_VERSION} · {DOC_DATE} · matches repository release {RELEASE} and architecture diagram {INFRA["DOC_VERSION"]} · maintained by SkyTech_Manager</div>
<p class="lead">This document explains, in plain words, which tools and technologies the SkyTech program uses, what each one does, what it costs and where it runs. The picture below shows the journey from finding a business to winning a customer. The architecture diagram after it shows how the same tools connect behind the scenes.</p>
<div class="cards">
 <div class="card"><b>{counts["total"]}</b>tools and technologies listed</div>
 <div class="card"><b>{counts["inuse"]}</b>already in use or ready</div>
 <div class="card"><b>$0</b>new monthly spend: {counts["free"]} are free or included; the rest use things you already have: your Claude plan, the Hostinger plan for skytechsolutions.us and your phone</div>
</div>
<h2>1. The one-minute picture</h2>
<div class="journey">{journey_svg()}</div>
<h2 class="pb">2. Architecture diagram: how the tools connect</h2>
<p class="lead">Same tools, shown by where they live: free data sources, the Claude agents, your laptop and internet services. Numbers follow the data flow below.</p>
<div class="diagram">{INFRA["SVG"]}</div>
<h3 class="pb">Data flow, step by step</h3><ol>{"".join(f"<li>{E(t)}</li>" for _, t in INFRA["FLOWS"])}</ol>
<h2>3. Technology stack, in plain words</h2>
{stack_tables()}
<h2>4. Words you may see</h2>
<div class="wrap"><table><thead><tr><th>Word</th><th>Meaning</th></tr></thead><tbody>{"".join(f"<tr><td><b>{E(a)}</b></td><td>{E(b)}</td></tr>" for a, b in GLOSSARY)}</tbody></table></div>
<h2>5. How this document is kept up to date</h2>
<div class="howto">SkyTech_Manager updates this document whenever a tool is added, changed or retired. The tool list and the architecture diagram come from the same source files (<code>scripts/docs/build_tech_stack.py</code> and <code>build_infrastructure.py</code>), so they always match. Each update bumps the version, adds a line to the change log below, and is saved in the local folder and released to GitHub with the other artifacts.</div>
<h2>Change log</h2>
<div class="wrap"><table><thead><tr><th>Version</th><th>Date</th><th>Change</th></tr></thead><tbody>{"".join(f"<tr><td>{E(a)}</td><td>{E(b)}</td><td>{E(c)}</td></tr>" for a, b, c in CHANGELOG)}</tbody></table></div>
<footer>Version: {DOC_VERSION} ({DOC_DATE}) — docs/architecture/SkyTech_Technology_Stack_Use.html — {DOC_VERSION}. Rebuild with: python scripts/docs/build_tech_stack.py</footer>
</main></body></html>'''

os.makedirs(os.path.dirname(OUT) or ".", exist_ok=True)
open(OUT, "w", encoding="utf-8").write(page)
print("wrote", OUT)

# Markdown copy: same content in plain text (the diagrams live in the HTML/PDF)
md_path = os.path.splitext(OUT)[0] + ".md"
cell = lambda v: str(v).replace("|", "/")
md = [f"# SkyTech Technology Stack Use", "", f"Version {DOC_VERSION} · {DOC_DATE} · release {RELEASE} · architecture diagram {INFRA['DOC_VERSION']} · maintained by SkyTech_Manager", "",
      "Plain-language list of every tool and technology the SkyTech program uses. The full document with the six-step picture and the architecture diagram is `docs/architecture/SkyTech_Technology_Stack_Use.pdf` (and .html).", "",
      f"**{counts['total']}** tools listed · **{counts['inuse']}** in use or ready · **$0** new monthly spend ({counts['free']} free or included; the rest use your existing Claude plan, Hostinger plan and phone).", "",
      "## How SkyTech works, in six steps", ""]
md += [f"{i}. **{t}**: {d} _Tools: {', '.join(tl)}._" for i, (t, d, tl) in enumerate(JOURNEY, 1)]
md += ["", "Always running in the background: " + "; ".join(BACKGROUND) + ".", ""]
group = None
for g, t, w, u, c, r, st in STACK:
    if g != group:
        md += ["", f"## {g}", "", "| Tool / technology | What it is | What we use it for | Cost | Where it runs | Status |", "| --- | --- | --- | --- | --- | --- |"]; group = g
    md.append("| " + " | ".join(cell(x) for x in (f"**{t}**", w, u, c, r, st)) + " |")
md += ["", "## Words you may see", "", "| Word | Meaning |", "| --- | --- |"] + [f"| **{a}** | {b} |" for a, b in GLOSSARY]
md += ["", "## Change log", "", "| Version | Date | Change |", "| --- | --- | --- |"] + [f"| {a} | {b} | {c} |" for a, b, c in CHANGELOG]
md += ["", "---", f"Version: {DOC_VERSION} ({DOC_DATE}) — SkyTech_Technology_Stack_Use.md — {DOC_VERSION}", ""]
open(md_path, "w", encoding="utf-8").write("\n".join(md))
print("wrote", md_path)

# Version: V1.2 (2026-10-10) — scripts/docs/build_tech_stack.py — V1.2
