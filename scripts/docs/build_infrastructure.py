"""Version: V1.7 (2026-10-10) — scripts/docs/build_infrastructure.py — V1.7
Builds docs/architecture/SkyTech_Infrastructure.html (diagram + roles + versions).
Edit the DATA section and re-run to publish a new version.
Also imported by build_tech_stack.py, which reuses SVG and CSS so both documents always show the same diagram.
Run    : python scripts/docs/build_infrastructure.py   (from the repository folder)
Errors : SKY-DOC-001 missing Python package, SKY-DOC-002 file problem; log: logs/runtime/scripts-<date>.log."""
import html, sys, os
if __name__ == "__main__":  # only when run directly (build_tech_stack.py imports this file)
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "common")); import skylog
    skylog.install("build_infrastructure", "SKY-DOC-002")
OUT = sys.argv[1] if len(sys.argv) > 1 and __name__ == "__main__" else "docs/architecture/SkyTech_Infrastructure.html"

# ============================ DATA (edit here) ============================
DOC_VERSION = "V1.7"; DOC_DATE = "2026-10-10"; RELEASE = "R4.2"
AGENTS = [  # name, status, role, inputs, outputs, control
 ("SkyTech_Manager", "Active", "Runs the program: assigns work, collects agent reports, summarizes to the owner, keeps files/versions/GitHub in order", "Owner requests, agent reports", "Daily summary, task assignments, project files", "Claude in this project; asks owner before actions"),
 ("SkyTech_BackOffice", "Active", "Pulls free leads, verifies \"no website\" by alternative search routes, prepares duplicate-safe SQL imports", "Overture & other free sources, web search", "Verified lead CSV, import SQL, verification report", "agents/SkyTech_BackOffice.md + saved skill (owner-editable)"),
 ("SkyTech_WebsiteDeveloper", "Active", "Builds free one-page demo sites for verified no-website leads (preview banner, no made-up facts)", "NoSite leads", "demo-sites/<business>/index.html, manifest, sql/05 (DemoBuilt)", "agents/SkyTech_WebsiteDeveloper.md (owner-editable)"),
 ("SkyTech_PhoneMarketing", "Planned", "Prepares call sheets and scripts; owner makes every call (TCPA); logs outcomes", "Demo links, lead details", "Call sheets, follow-up emails (owner-approved)", "Role file to be created"),
 ("SkyTech_SocialMediaMarketing", "Planned", "Drafts posts and messages; owner approves before posting", "Demos, wins", "Facebook/LinkedIn/Nextdoor drafts", "Role file to be created"),
 ("SkyTech_ProjectManagement", "Planned", "Tracks the 90-day plan, checklist and milestones; flags anything late", "Plan, Manager reports", "Weekly status, risk flags", "Role file to be created"),
]
COMPONENTS = [  # component, where, version, purpose
 ("90-Day Plan (living doc)", "claude.ai artifact + docs/90-day-plan.md", "V2.2", "Plan, guardrails, free lead sources, pricing, timeline"),
 ("Project instructions", "claude.ai Project + config/project-instructions.md", "V1.9", "Standing rules for every session"),
 ("Version register / INDEX", "config/version-register.md, INDEX.md", "V3.6 / V2.4", "What each file and release contains"),
 ("SkyTechCRM database", "SQL Server 2014 Developer (owner's laptop)", "setup V2.3, admin objects V1.5, demo load V2.2, security V1.0", "Companies, WebPresence, Leads, Activities, DemoSites; duplicate-safe imports; audit"),
 ("Admin site", "admin-site/ (Node.js) at http://127.0.0.1:3030", "V2.1", "Login, dashboards, drill-down, CRUD, live duplicate check, Demo sites, audit log, System log, Logins management"),
 ("Security & logging layer", "admin-site/src/security.js, logger.js, errors.js; sql/06", "V1.0", "CSP, CSRF, rate limit, lockout, session timeouts, least-privilege DB role, append-only audit, JSON logs, SKY error codes"),
 ("Error catalog + doctor", "config/error-codes.json; npm run doctor", "V1.1 / V1.0", "65 SKY-<AREA>-<NNN> codes with causes and fixes; one-command health check"),
 ("Operations documents", "docs/architecture/", "V1.0", "Security Architecture, Troubleshooting Guide, Code Documentation"),
 ("Lead scripts", "scripts/leads/", "extract V1.0, build V1.2", "Overture extraction, sample + import SQL generation"),
 ("Lead sample", "data/samples/", "CSV V1.1, SQL V1.2", "100 leads, 36 verified potential clients"),
 ("GitHub repository", "github.com/skytechsolutions2020/skytech-agent-program (private)", "R4.2", "Full history of every artifact, tagged releases"),
 ("Company website", "skytechsolutions.us (Hostinger, Node.js)", "live", "Needs robots.txt, sitemap, pricing page"),
]
FLOWS = [  # number, text
 ("1", "Lead pull — SkyTech_BackOffice collects businesses from Overture Maps Places (desktop-app browser); other free sources fill gaps."),
 ("2", "Verification — BackOffice searches name, phone, address and likely domains; records a verdict and evidence for each lead."),
 ("3", "Files — lead CSV, verification results and import SQL are saved in the local folder (Git repository)."),
 ("4", "Import — owner runs the SQL in SSMS; usp_ImportStagedLeads inserts new companies and updates existing ones (no duplicates)."),
 ("5", "Admin site — owner signs in, reviews dashboards, drills down, edits records, fixes any duplicates the live check finds; every change is audited."),
 ("6", "Backup & history — GitHub Desktop pushes the local folder and release tags to the private GitHub repository."),
 ("7", "Reporting — agents report to SkyTech_Manager; the Manager summarizes to the owner and asks approval before actions."),
 ("8", "Demo sites — WebsiteDeveloper builds demos into the local folder (demo-sites/) with free-licence photos (Pexels); after owner approval they are published to free hosting (Netlify, planned) for the marketing agents."),
 ("9", "Outreach — owner calls and emails prospects (approved scripts); outcomes are logged as Activities in the Admin site."),
 ("10", "Errors & logs — every failure shows a SKY code and a reference; the Admin site, scripts and doctor write logs/runtime, procedures write dbo.ErrorLog; the Troubleshooting Guide gives the fix."),
]
RULES = [
 "Owner approves every action (automatic approval off); owner personally makes all phone calls (TCPA).",
 "$0/month: free tools and free tiers only.",
 "Free lead sources licensed for business use; no library downloads; no bot scraping of Google Maps, Yelp or Facebook.",
 "No duplicate data: all imports through dbo.StgLeads + dbo.usp_ImportStagedLeads; unique indexes; live duplicate check of all tables in the Admin site.",
 "Every file carries a version footer; files are edited in place; changes logged in the version register, INDEX and CHANGELOG; releases tagged in GitHub.",
 "Downloaded documents carry no AI-related metadata.",
 "Security by default: local-only Admin site, strong secrets, CSRF/CSP/rate limits, least-privilege database role, append-only audit, secret scan before every push, weekly verified backups.",
 "Every program file carries a purpose block and function comments; every error has a SKY code documented in the Troubleshooting Guide.",
]
STATUSES = ["New", "Checked", "NoSite", "DemoBuilt", "Contacted", "Interested", "Proposal", "Won"]
CHANGELOG = [("V1.0", "2026-10-02", "First version: infrastructure and data-flow diagram, agents and roles, components and versions, rules, lead lifecycle."),
             ("V1.1", "2026-10-02", "Admin site V1.2 and admin objects V1.2: live duplicate check across Companies, Leads, Web presence and Activities."),
             ("V1.2", "2026-10-02", "SkyTech_WebsiteDeveloper active: demo-site generator, first 3 demos, sql/05 marks leads DemoBuilt."),
             ("V1.3", "2026-10-05", "Demo sites stored in dbo.DemoSites and edited in the Admin site; unique designs per business (template V2.0)."),
             ("V1.4", "2026-10-05", "Free-licence photos (Pexels) in demo sites; DemoSites photo columns; Admin site V1.4."),
             ("V1.5", "2026-10-10", "Diagram shared with the new Technology Stack Use document; version labels refreshed."),
             ("V1.6", "2026-10-10", "R4.0: security and logging layer, error catalog and doctor, sql/06, operations documents; Admin site V2.0."),
             ("V1.7", "2026-10-10", "R4.2: Admin site V2.1 — Logins screen (create, edit, disable, reset password) and Change my password.")]
# ==========================================================================

E = html.escape
svg = []
def box(x, y, w, h, title, lines=(), kind="normal", tid=None):
    """Draws one component box (title + up to 3 lines); kind: normal | acc (SkyTech part) | plan (dashed, planned) | store | person."""
    cls = {"normal": "bx", "accent": "bx acc", "planned": "bx plan", "store": "bx store", "person": "bx person"}[kind]
    svg.append(f'<g class="{cls}"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="8"/>')
    svg.append(f'<text class="t" x="{x+12}" y="{y+21}">{E(title)}</text>')
    for i, l in enumerate(lines):
        svg.append(f'<text class="s" x="{x+12}" y="{y+39+i*15}">{E(l)}</text>')
    svg.append('</g>')
def zone(x, y, w, h, title):
    """Draws a labelled background zone (Owner PC, Cloud, Internet…)."""
    svg.append(f'<g class="zone"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="12"/><text x="{x+14}" y="{y+24}">{E(title)}</text></g>')
def arrow(pts, label=None, lx=None, ly=None, planned=False, num=None, anchor="start"):
    """Draws an arrow along the points, with optional label, step number and dashed style for planned flows."""
    d = "M" + " L".join(f"{a} {b}" for a, b in pts)
    svg.append(f'<path class="ar{" plan" if planned else ""}" d="{d}" marker-end="url(#{"mp" if planned else "m"})"/>')
    if num:
        svg.append(f'<g class="num"><circle cx="{lx}" cy="{ly-4}" r="10"/><text x="{lx}" y="{ly}" text-anchor="middle">{num}</text></g>')
    if label:
        tx = lx + (14 if anchor == "start" else -14)
        svg.append(f'<text class="al" x="{tx}" y="{ly}" text-anchor="{anchor}">{E(label)}</text>')

W, H = 1400, 900
# zones
zone(16, 56, 246, 520, "Free data sources")
zone(282, 56, 420, 640, "Claude (cloud) — SkyTech agents")
zone(722, 56, 410, 640, "Owner's laptop (Windows)")
zone(1152, 56, 232, 640, "Internet services")
# sources
src = [("Overture Maps Places", ["main source · has website field"], "accent"), ("Foursquare OS Places", ["open dataset · fills gaps"], "normal"),
       ("OpenStreetMap", ["extra small businesses"], "normal"), ("MD Business Express", ["active status, agent name"], "normal"),
       ("MD Labor license lookup", ["trade owners"], "normal"), ("Google Places API", ["check only · free limit"], "normal"),
       ("Chamber / county directories", ["manual look-up"], "normal")]
for i, (t, l, k) in enumerate(src): box(32, 92 + i * 66, 214, 54, t, l, k)
# agents
box(300, 92, 384, 70, "SkyTech_Manager (Claude)", ["assigns work · collects reports · summarizes to owner", "asks owner approval before actions"], "accent")
box(330, 186, 354, 70, "SkyTech_BackOffice — active", ["pulls leads · verifies no website (search routes)", "prepares duplicate-safe import SQL"], "normal")
box(330, 272, 354, 54, "SkyTech_WebsiteDeveloper — active", ["unique demo sites → demo-sites/ + dbo.DemoSites"], "normal")
box(330, 342, 354, 54, "SkyTech_PhoneMarketing — planned", ["call sheets + scripts (owner calls)"], "planned")
box(330, 412, 354, 54, "SkyTech_SocialMediaMarketing — planned", ["post + message drafts (owner approves)"], "planned")
box(330, 482, 354, 54, "SkyTech_ProjectManagement — planned", ["plan, checklist, milestones"], "planned")
box(300, 566, 384, 108, "Claude Project + living docs", ["Project instructions V1.9 · version register", "90-Day Plan doc V2.2 · prompt books", "memory: name, rules, local folder"], "store")
# manager assigns bracket
svg.append('<path class="ar" d="M316 162 L316 509"/>')
for y in (221, 299, 369, 439, 509): svg.append(f'<path class="ar" d="M316 {y} L328 {y}" marker-end="url(#m)"/>')
svg.append('<text class="al" x="292" y="350" transform="rotate(-90 292 350)" text-anchor="middle">assigns work / reports back</text>')
# laptop
box(740, 92, 374, 70, "Local folder = Git repository", ["C:\\Users\\AV\\Documents\\SkyTechClaude\\", "skytech-agent-program (linked to Claude desktop app)"], "store")
box(740, 220, 374, 214, "SQL Server 2014 Developer — SkyTechCRM", [
    "Companies · WebPresence · Leads · Activities",
    "StgLeads → usp_ImportStagedLeads (no duplicates)",
    "unique indexes: source ID; name + ZIP;",
    "  one web row + one lead per company",
    "ImportBatches (import log)",
    "vw_DuplicateCheck (all tables, live)",
    "usp_MergeCompanies · usp_MergeLeads",
    "usp_FixDuplicateWebPresence",
    "AdminUsers (bcrypt) · AuditLog (append-only)",
    "DemoSites · ErrorLog · role SkyTechApp · backups",
    "setup V2.3 · admin V1.5 · security V1.0"], "accent")
box(740, 492, 374, 70, "Admin site V2.1 (Node.js) · 127.0.0.1:3030", ["dashboards · CRUD · duplicates · demos · logins", "security layer · error codes · logs/runtime · doctor"], "normal")
box(740, 586, 178, 54, "SSMS", ["runs SQL scripts"], "normal")
box(936, 586, 178, 54, "GitHub Desktop + Git", ["push commits + tags"], "normal")
# internet
box(1166, 92, 204, 70, "GitHub (private)", ["skytech-agent-program", "releases R1.0 → R4.2"], "store")
box(1166, 186, 204, 70, "Hostinger", ["skytechsolutions.us (live)", "future: admin site + MySQL"], "normal")
box(1166, 272, 204, 54, "Netlify / Google Drive", ["demo sites (planned)"], "planned")
box(1166, 342, 204, 54, "Gmail / Brevo free", ["owner-approved email (planned)"], "planned")
box(1166, 412, 204, 54, "Facebook Page", ["SkyTech page (live)"], "normal")
box(1166, 482, 204, 54, "Google Business Profile", ["to create"], "planned")
# people
box(740, 760, 374, 70, "Owner — SkyTech Solutions LLC", ["approves every action · makes all calls (TCPA)", "full control over every agent"], "person")
box(1166, 760, 204, 70, "Prospects", ["small businesses with", "no website (36 verified)"], "person")
# flows
arrow([(246, 221), (328, 221)], None, 287, 214, num="1")
svg.append('<text class="al" x="268" y="246">leads</text>')
arrow([(684, 221), (712, 221), (712, 127), (738, 127)], "files", 712, 180, num="3")
arrow([(927, 162), (927, 218)], "import in SSMS (dedupe)", 927, 194, num="4")
arrow([(927, 492), (927, 436)], "read / write · audit", 927, 468, num="5")
arrow([(1114, 127), (1164, 127)], None, 1139, 120, num="6")
svg.append('<text class="al" x="1139" y="150" text-anchor="middle">push</text>')
arrow([(1268, 162), (1268, 184)], None, None, None, planned=True)
svg.append('<text class="al" x="1278" y="178">future deploy</text>')
arrow([(684, 299), (704, 299), (704, 716), (1146, 716), (1146, 299), (1164, 299)], None, 1000, 716, planned=True, num="8")
svg.append('<text class="al" x="1014" y="736">demo sites (planned)</text>')
arrow([(492, 674), (492, 795), (738, 795)], "reports · approvals", 492, 740, num="7")
arrow([(1114, 795), (1164, 795)], None, 1139, 788, num="9")
svg.append('<text class="al" x="1139" y="818" text-anchor="middle">calls</text>')
arrow([(927, 760), (927, 564)], "uses daily", 927, 742, num="5")
svg.append('<text class="al" x="700" y="234" text-anchor="end">verify (2)</text>')

legend = ('<g class="legend">'
  '<g class="bx acc"><rect x="20" y="862" width="22" height="14" rx="3"/></g><text x="48" y="874">key component</text>'
  '<g class="bx"><rect x="170" y="862" width="22" height="14" rx="3"/></g><text x="198" y="874">active</text>'
  '<g class="bx plan"><rect x="270" y="862" width="22" height="14" rx="3"/></g><text x="298" y="874">planned</text>'
  '<g class="bx store"><rect x="380" y="862" width="22" height="14" rx="3"/></g><text x="408" y="874">files / records</text>'
  '<g class="bx person"><rect x="530" y="862" width="22" height="14" rx="3"/></g><text x="558" y="874">people</text>'
  '<path class="ar" d="M650 869 L700 869" marker-end="url(#m)"/><text x="708" y="874">data flow</text>'
  '<path class="ar plan" d="M800 869 L850 869" marker-end="url(#mp)"/><text x="858" y="874">planned flow</text>'
  '<g class="num"><circle cx="980" cy="865" r="10"/><text x="980" y="869" text-anchor="middle">1</text></g><text x="996" y="874">step (see Data flow)</text></g>')

SVG = f'''<svg viewBox="0 0 {W} {H}" role="img" aria-label="SkyTech infrastructure and data flow" xmlns="http://www.w3.org/2000/svg">
<defs><marker id="m" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="mk"/></marker>
<marker id="mp" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="mkp"/></marker></defs>
<text class="h" x="16" y="34">SkyTech Agent Program — infrastructure, data flow and roles</text>
<text class="sub" x="1384" y="34" text-anchor="end">{DOC_VERSION} · {DOC_DATE} · repo release {RELEASE}</text>
{"".join(svg)}
{legend}
</svg>'''

def table(head, rows):
    """HTML table helper for the roles/components/versions sections."""
    return "<table><thead><tr>" + "".join(f"<th>{E(h)}</th>" for h in head) + "</tr></thead><tbody>" + "".join(
        "<tr>" + "".join(f"<td>{E(c)}</td>" for c in r) + "</tr>" for r in rows) + "</tbody></table>"

DIAGRAM_CSS = ''':root { --bg:#f5f7fa; --panel:#fff; --ink:#1c2430; --muted:#5f6b7a; --line:#c9d1dc; --zone:#eef2f7; --acc:#1f5fbf; --accbg:#e6efff; --plan:#8a94a3; --store:#f3f0e6; --person:#e8f5ec; }
@media (prefers-color-scheme: dark) { :root { --bg:#11151c; --panel:#1a202a; --ink:#e6e9ee; --muted:#9aa4b2; --line:#3a4454; --zone:#161c25; --acc:#6aa0ff; --accbg:#1d2a40; --plan:#7d8796; --store:#2a2619; --person:#1c2b22; } }
body { margin:0; background:var(--bg); color:var(--ink); font:14px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; }
main { max-width:1440px; margin:0 auto; padding:20px 16px 40px; }
h1 { font-size:22px; margin:0 0 4px; } h2 { font-size:17px; margin:28px 0 8px; }
.meta { color:var(--muted); margin-bottom:14px; }
.diagram { background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:8px; overflow-x:auto; }
.diagram svg { width:100%; min-width:1000px; height:auto; display:block; }
svg text { fill:var(--ink); font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; }
svg .h { font-size:19px; font-weight:700; } svg .sub { font-size:12px; fill:var(--muted); }
.zone rect { fill:var(--zone); stroke:var(--line); } .zone text { font-size:13px; font-weight:700; fill:var(--muted); text-transform:uppercase; letter-spacing:.04em; }
.bx rect { fill:var(--panel); stroke:var(--line); stroke-width:1.2; }
.bx.acc rect { fill:var(--accbg); stroke:var(--acc); stroke-width:2; }
.bx.plan rect { fill:var(--panel); stroke:var(--plan); stroke-dasharray:5 4; }
.bx.plan text { fill:var(--muted); }
.bx.store rect { fill:var(--store); } .bx.person rect { fill:var(--person); }
.bx .t { font-size:13px; font-weight:600; } .bx .s { font-size:11.5px; fill:var(--muted); }
.ar { fill:none; stroke:var(--acc); stroke-width:1.6; } .ar.plan { stroke:var(--plan); stroke-dasharray:6 5; }
.mk { fill:var(--acc); } .mkp { fill:var(--plan); }
.al { font-size:11.5px; fill:var(--muted); }
.num circle { fill:var(--acc); } .num text { fill:#fff; font-size:11px; font-weight:700; }
.legend text { font-size:12px; fill:var(--muted); }
table { width:100%; border-collapse:collapse; background:var(--panel); border:1px solid var(--line); border-radius:10px; overflow:hidden; }
th,td { text-align:left; padding:8px 10px; border-bottom:1px solid var(--line); vertical-align:top; }
th { font-size:12px; color:var(--muted); }
.wrap { overflow-x:auto; }
ol,ul { padding-left:20px; } .pills span { display:inline-block; padding:3px 10px; margin:2px; border-radius:999px; background:var(--accbg); }
.pills span+span::before { content:""; }
footer { color:var(--muted); margin-top:28px; font-size:12px; }
@media print { body { background:#fff; } .diagram svg { min-width:0; } }
'''

page = f'''<!doctype html>
<!-- Version: {DOC_VERSION} ({DOC_DATE}) — docs/architecture/SkyTech_Infrastructure.html — {DOC_VERSION} -->
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>SkyTech Infrastructure</title>
<style>
{DIAGRAM_CSS}</style></head><body><main>
<h1>SkyTech Agent Program — Infrastructure</h1>
<div class="meta">Version {DOC_VERSION} · {DOC_DATE} · matches repository release {RELEASE} · maintained by SkyTech_Manager</div>
<div class="diagram">{SVG}</div>
<h2>Data flow</h2><ol>{"".join(f"<li>{E(t.split(' — ',1)[0])} — {E(t.split(' — ',1)[1])}</li>" for _, t in FLOWS)}</ol>
<h2>Agents and roles</h2><div class="wrap">{table(["Agent", "Status", "Role", "Inputs", "Outputs", "Owner control"], AGENTS)}</div>
<h2>Components and versions</h2><div class="wrap">{table(["Component", "Where", "Version", "Purpose"], COMPONENTS)}</div>
<h2>Lead lifecycle (Leads.Status)</h2><div class="pills">{" → ".join(f"<span>{s}</span>" for s in STATUSES)} &nbsp; plus <span>Lost</span> <span>DoNotContact</span></div>
<h2>Standing rules</h2><ul>{"".join(f"<li>{E(r)}</li>" for r in RULES)}</ul>
<h2>Change log</h2><div class="wrap">{table(["Version", "Date", "Change"], CHANGELOG)}</div>
<footer>Version: {DOC_VERSION} ({DOC_DATE}) — docs/architecture/SkyTech_Infrastructure.html — {DOC_VERSION}. Rebuild with: python scripts/docs/build_infrastructure.py</footer>
</main></body></html>'''
if __name__ == "__main__":
    os.makedirs(os.path.dirname(OUT) or ".", exist_ok=True)
    open(OUT, "w", encoding="utf-8").write(page)
    print("wrote", OUT)

# Version: V1.7 (2026-10-10) — scripts/docs/build_infrastructure.py — V1.7
