"""Version: V1.0 (2026-10-02) — scripts/website/build_demo_sites.py — V1.0
SkyTech_WebsiteDeveloper: builds free one-page demo websites for verified potential clients.

Input : data/samples/SkyTech_Leads_Sample100.csv (rows with PotentialClient = Yes)
Output: demo-sites/<slug>/index.html      one self-contained page per business (no outside files)
        demo-sites/manifest.csv           every demo built so far (one row per business, never duplicated)
        sql/05_demo_sites_built.sql       marks those leads DemoBuilt in SkyTechCRM (safe to re-run)

Usage (from the repository folder):
  python scripts/website/build_demo_sites.py --names "C&A Plumbing" "Lee Newton Co."
  python scripts/website/build_demo_sites.py --all          (all verified potential clients)
Pages are previews: marked "not published", hidden from search engines, and only go live after
the owner approves and the business agrees.
"""
import argparse, csv, html, os, re, sys, datetime
from urllib.parse import quote_plus

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from content import CATEGORIES, OVERRIDES, AREAS, TRADE_STEPS, REALTY_STEPS

TEMPLATE_VERSION = "V1.0"
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
SRC = os.path.join(ROOT, "data", "samples", "SkyTech_Leads_Sample100.csv")
OUT = os.path.join(ROOT, "demo-sites")
SQL = os.path.join(ROOT, "sql", "05_demo_sites_built.sql")
TODAY = datetime.date.today().isoformat()

ICONS = {
    "drop": '<path d="M12 3c3 4.5 6 7.6 6 11a6 6 0 0 1-12 0c0-3.4 3-6.5 6-11z"/>',
    "bolt": '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    "house": '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10"/><path d="M10 20v-6h4v6"/>',
    "roof": '<path d="M2 13 12 4.5 22 13"/><path d="M16 8V5h2.5v5"/><path d="M5 11v9h14v-9"/>',
    "temp": '<path d="M10 4.5a2 2 0 0 1 4 0V14a4 4 0 1 1-4 0z"/><path d="M12 9v7.5"/>',
    "hammer": '<path d="M13.5 10.5 4.6 19.4a1.5 1.5 0 0 1-2.1-2.1l8.9-8.9"/><path d="M9.5 5.5 12 3h4.5l4 4-2.5 2.5-2-2-3.5 3.5-3.5-3.5z"/>',
    "wrench": '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3 17.8 6.2 21l6.3-6.3a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>',
    "key": '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9"/><path d="m17 6 3 3"/>',
    "check": '<path d="m5 12.5 4.5 4.5L19 7"/>',
    "phone": '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    "mail": '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    "pin": '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
}
def icon(name, size=24, cls="i"):
    return (f'<svg class="{cls}" width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
            f'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ICONS[name]}</svg>')

e = lambda s: html.escape(str(s or ""), quote=True)

SMALL = {"and", "of", "the", "for", "at", "in"}
def nice_name(n):
    """Tidy capitalisation from listings ("Ramos construction" -> "Ramos Construction"); keeps the owner's own styling."""
    words = re.sub(r"\s+", " ", n.strip()).split(" ")
    words = [w if (w[:1].isupper() or not w[:1].isalpha() or (i and w in SMALL)) else w[:1].upper() + w[1:] for i, w in enumerate(words)]
    n = " ".join(words)
    n = re.sub(r"\bL\.l\.c\.?$", "L.L.C.", n, flags=re.I)
    return re.sub(r"\bLlc\b", "LLC", n)

def slugify(name, zip5):
    s = re.sub(r"[^a-z0-9]+", "-", name.lower().replace("&", " and ")).strip("-")
    return f"{s[:48].rstrip('-')}-{zip5}"

def tel(phone):
    d = re.sub(r"\D", "", phone or "")
    return "+1" + d[-10:] if len(d) >= 10 else ""

def profile(row):
    o = OVERRIDES.get(row["CompanyName"], {})
    cat = o.get("category", row["Category"].strip().lower())
    base = dict(CATEGORIES[cat])
    base.update({k: v for k, v in o.items() if k != "category"})
    return base

CSS = """
:root{--a:%(accent)s;--a2:%(accent2)s;--ink:#1d232b;--mut:#5d6773;--bg:#f6f7f9;--line:#e3e6ea;--card:#fff}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;font:16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:var(--ink);background:var(--bg)}
a{color:var(--a)}.wrap{max-width:1100px;margin:0 auto;padding:0 20px}
.preview{background:#fff8e1;border-bottom:1px solid #f0d98c;color:#5c4400;font-size:13.5px;padding:9px 0}
.preview b{color:#3d2d00}
header.top{background:var(--card);border-bottom:1px solid var(--line);position:sticky;top:0;z-index:5}
header.top .wrap{display:flex;align-items:center;gap:16px;height:66px}
.brand{display:flex;align-items:center;gap:10px;font-weight:750;font-size:18px;color:var(--ink);text-decoration:none;min-width:0}
.brand span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mark{flex:none;width:38px;height:38px;border-radius:10px;background:var(--a);color:#fff;display:grid;place-items:center}
nav.links{margin-left:auto;display:flex;gap:22px}nav.links a{color:var(--mut);text-decoration:none;font-size:15px}nav.links a:hover{color:var(--ink)}
.btn{display:inline-flex;align-items:center;gap:8px;background:var(--a);color:#fff;text-decoration:none;font-weight:650;padding:12px 20px;border-radius:10px;border:2px solid var(--a);white-space:nowrap}
.btn:hover{background:var(--a2);border-color:var(--a2)}
.btn.ghost{background:transparent;color:#fff;border-color:rgba(255,255,255,.55)}.btn.ghost:hover{background:rgba(255,255,255,.12)}
.hero{background:linear-gradient(135deg,var(--a2),var(--a));color:#fff;padding:72px 0 80px;position:relative;overflow:hidden}
.hero .wrap{display:grid;grid-template-columns:1.4fr 1fr;gap:40px;align-items:center}
.kicker{display:inline-block;font-size:13px;letter-spacing:.08em;text-transform:uppercase;background:rgba(255,255,255,.14);padding:5px 12px;border-radius:999px}
.hero h1{font-size:46px;line-height:1.1;margin:16px 0 14px;letter-spacing:-.01em}
.hero p.lead{font-size:19px;opacity:.92;margin:0 0 28px;max-width:34em}
.hero .cta{display:flex;flex-wrap:wrap;gap:12px}.hero .btn{background:#fff;color:var(--a2);border-color:#fff}.hero .btn:hover{background:#eef1f4}
.hero .btn.ghost{background:transparent;color:#fff;border-color:rgba(255,255,255,.55)}
.badge-art{justify-self:center;width:260px;height:260px;border-radius:50%%;background:rgba(255,255,255,.1);display:grid;place-items:center;box-shadow:0 0 0 22px rgba(255,255,255,.05),0 0 0 44px rgba(255,255,255,.035)}
.badge-art svg{width:120px;height:120px;color:#fff;stroke-width:1.3}
.facts{display:flex;flex-wrap:wrap;gap:10px 22px;margin-top:26px;font-size:15px;opacity:.95}
.facts span{display:inline-flex;align-items:center;gap:7px}.facts svg{width:18px;height:18px}
section{padding:68px 0}section.alt{background:var(--card);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
h2{font-size:32px;line-height:1.2;margin:0 0 10px;letter-spacing:-.01em}.sub{color:var(--mut);margin:0 0 32px;max-width:40em}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:22px}
section.alt .card{background:var(--bg)}
.card .ci{width:42px;height:42px;border-radius:10px;background:color-mix(in srgb,var(--a) 12%%,#fff);color:var(--a);display:grid;place-items:center;margin-bottom:12px}
.card h3{margin:0 0 6px;font-size:18px}.card p{margin:0;color:var(--mut);font-size:15px}
.steps{counter-reset:s;display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.step{position:relative;padding:22px 22px 22px 70px;background:var(--card);border:1px solid var(--line);border-radius:14px}
.step:before{counter-increment:s;content:counter(s);position:absolute;left:20px;top:20px;width:34px;height:34px;border-radius:50%%;background:var(--a);color:#fff;display:grid;place-items:center;font-weight:700}
.step h3{margin:0 0 4px;font-size:17px}.step p{margin:0;color:var(--mut);font-size:15px}
.two{display:grid;grid-template-columns:1fr 1fr;gap:36px;align-items:start}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}.chips span{background:var(--card);border:1px solid var(--line);border-radius:999px;padding:6px 14px;font-size:14px}
section.alt .chips span{background:var(--bg)}
.contact{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:26px}
.contact .row{display:flex;gap:14px;align-items:flex-start;padding:12px 0;border-bottom:1px solid var(--line)}.contact .row:last-of-type{border-bottom:0}
.contact .row svg{color:var(--a);flex:none;margin-top:2px}.contact .lbl{font-size:13px;color:var(--mut)}.contact .val{font-weight:600;word-break:break-word}
.contact .val a{color:var(--ink);text-decoration:none}.contact .btn{width:100%%;justify-content:center;margin-top:14px}
.note{font-size:13px;color:var(--mut);background:var(--bg);border:1px dashed var(--line);border-radius:10px;padding:10px 12px;margin-top:14px}
footer{background:#14181d;color:#b8c0ca;padding:30px 0 90px;font-size:14px}footer a{color:#fff}
footer .wrap{display:flex;flex-wrap:wrap;gap:8px 24px;justify-content:space-between}
.callbar{display:none}
@media (max-width:860px){
 nav.links{display:none}header.top .btn{margin-left:auto;padding:10px 14px}
 .hero{padding:48px 0 56px}.hero .wrap{grid-template-columns:1fr}.badge-art{display:none}.hero h1{font-size:34px}.hero p.lead{font-size:17px}
 .grid,.steps,.two{grid-template-columns:1fr}section{padding:48px 0}h2{font-size:26px}
 .callbar{display:flex;position:fixed;left:12px;right:12px;bottom:12px;z-index:6;justify-content:center;box-shadow:0 6px 20px rgba(0,0,0,.25)}
}
@media (max-width:420px){header.top .btn span{display:none}}
"""

def build_page(row):
    p = profile(row)
    name = nice_name(row["CompanyName"])
    city, county, zip5 = row["City"].strip(), row["County"].strip(), row["Zip"].strip()[:5]
    county_label = county if county.endswith(("City", "County")) else f"{county} County"
    addr = f'{re.sub(r"  +", " ", row["Address"].strip())}, {city}, MD {zip5}'
    phone, email, t = row["Phone"].strip(), row["Email"].strip(), tel(row["Phone"])
    realty = p["template"] == "realty"
    nd = e(name) if name.endswith(".") else e(name) + "."          # sentence end without a doubled period
    near = "nearby neighborhoods" if county == "Baltimore City" else f"nearby communities in {county_label}"
    steps = REALTY_STEPS if realty else TRADE_STEPS
    areas = [a for a in AREAS.get(county, [city]) if a != city]
    areas = [city] + areas[:6]
    maps = "https://www.google.com/maps/search/?api=1&query=" + quote_plus(f"{name} {addr}")
    cta = "Call to talk it over" if realty else "Call for a quote"
    services = "".join(f'<div class="card"><div class="ci">{icon("check", 22)}</div><h3>{e(s)}</h3><p>{e(d)}</p></div>' for s, d in p["services"])
    steps_html = "".join(f'<div class="step"><h3>{e(a)}</h3><p>{e(b)}</p></div>' for a, b in steps)
    chips = "".join(f"<span>{e(a)}</span>" for a in areas)
    note = f'<div class="note">{e(p["note"])}</div>' if p.get("note") else ""
    email_row = (f'<div class="row">{icon("mail")}<div><div class="lbl">Email</div><div class="val"><a href="mailto:{e(email)}">{e(email)}</a></div></div></div>'
                 if email else "")
    css = CSS % {"accent": p["accent"], "accent2": p["accent2"]}
    slug = slugify(row["CompanyName"], zip5)
    return slug, name, p, f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>{e(name)} | {e(p["label"])} in {e(city)}, MD (preview)</title>
<meta name="description" content="{e(name)}: {e(p["tagline"])}. Based in {e(city)}, Maryland.">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='{quote_plus(p["accent"])}'/%3E%3Ctext x='16' y='22' font-size='17' text-anchor='middle' fill='white' font-family='Arial'%3E{e(name[:1])}%3C/text%3E%3C/svg%3E">
<style>{css}</style>
</head>
<body>
<div class="preview"><div class="wrap"><b>Website preview.</b> A free sample made by SkyTech Solutions for {nd} It is not published and not yet approved by {nd} Business details come from public listings and the text is a starting draft. <a href="https://skytechsolutions.us">skytechsolutions.us</a></div></div>
<header class="top"><div class="wrap">
  <a class="brand" href="#top"><span class="mark">{icon(p["icon"], 22)}</span><span>{e(name)}</span></a>
  <nav class="links"><a href="#services">Services</a><a href="#how">How it works</a><a href="#area">Area</a><a href="#contact">Contact</a></nav>
  {f'<a class="btn" href="tel:{t}">{icon("phone", 18)}<span>{e(phone)}</span></a>' if t else ''}
</div></header>
<main id="top">
<section class="hero"><div class="wrap">
  <div>
    <span class="kicker">{e(p["label"])} · {e(city)}, MD</span>
    <h1>{e(name)}</h1>
    <p class="lead">{e(p["tagline"])} in {e(city)} and {e(near)}.</p>
    <div class="cta">{f'<a class="btn" href="tel:{t}">{icon("phone", 18)} {e(cta)}</a>' if t else ''}<a class="btn ghost" href="#services">See services</a></div>
    <div class="facts"><span>{icon("pin")} {e(city)}, {e(county_label)}</span>{f'<span>{icon("phone")} {e(phone)}</span>' if phone else ''}</div>
  </div>
  <div class="badge-art">{icon(p["icon"], 120)}</div>
</div></section>

<section id="services"><div class="wrap">
  <h2>{"How we can help" if realty else "Services"}</h2>
  <p class="sub">{e(p["about"])}</p>
  <div class="grid">{services}</div>
</div></section>

<section class="alt" id="how"><div class="wrap">
  <h2>How it works</h2>
  <p class="sub">Getting started is simple.</p>
  <div class="steps">{steps_html}</div>
</div></section>

<section id="area"><div class="wrap two">
  <div>
    <h2>Where we work</h2>
    <p class="sub">Based in {e(city)}, working with {"clients" if realty else "homes and businesses"} across {e(county_label)} and nearby.</p>
    <div class="chips">{chips}</div>
  </div>
  <div class="contact" id="contact">
    <h3 style="margin:0 0 6px;font-size:20px">Contact {e(name)}</h3>
    <div class="row">{icon("phone")}<div><div class="lbl">Phone</div><div class="val">{f'<a href="tel:{t}">{e(phone)}</a>' if t else e(phone)}</div></div></div>
    {email_row}
    <div class="row">{icon("pin")}<div><div class="lbl">Address</div><div class="val"><a href="{e(maps)}" target="_blank" rel="noopener">{e(addr)}</a></div></div></div>
    {f'<a class="btn" href="tel:{t}">{icon("phone", 18)} {e(cta)}</a>' if t else ''}
    {note}
  </div>
</div></section>
</main>
<footer><div class="wrap"><div>© {datetime.date.today().year} {e(name)} · {e(city)}, Maryland</div><div>Website preview by <a href="https://skytechsolutions.us">SkyTech Solutions</a></div></div></footer>
{f'<a class="btn callbar" href="tel:{t}">{icon("phone", 18)} Call {e(phone)}</a>' if t else ''}
</body>
</html>
<!-- Version: {TEMPLATE_VERSION} ({TODAY}) — demo-sites/{slug}/index.html — {TEMPLATE_VERSION} -->
"""

MANIFEST_COLS = ["Slug", "CompanyName", "OvertureID", "Niche", "Category", "Template", "City", "County", "Phone", "Email", "Path", "TemplateVersion", "BuiltOn"]

def read_manifest(path):
    if not os.path.exists(path): return {}
    with open(path, encoding="utf-8-sig") as f:
        return {r["OvertureID"]: r for r in csv.DictReader(f) if r.get("OvertureID")}

def sq(s): return "N'" + str(s).replace("'", "''") + "'"

def write_sql(manifest):
    rows = sorted(manifest.values(), key=lambda r: r["CompanyName"].lower())
    vals = ",\n".join(f"  ({sq(r['OvertureID'])}, {sq(r['CompanyName'])}, {sq('preview: ' + r['Path'])}, {sq(r['TemplateVersion'])})" for r in rows)
    sql = f"""-- Version: V1.0 ({TODAY}) — sql/05_demo_sites_built.sql — V1.0
-- Generated by scripts/website/build_demo_sites.py (SkyTech_WebsiteDeveloper). Safe to re-run: no duplicates.
-- Marks the leads that have a demo site as DemoBuilt (only if they are still New / Checked / NoSite),
-- fills DemoURL if empty, and logs one Note activity per demo. Run in SSMS after the owner approves the demos.
USE SkyTechCRM;
SET NOCOUNT ON;
DECLARE @Demos TABLE (SourceRecordID NVARCHAR(64) PRIMARY KEY, CompanyName NVARCHAR(200), DemoURL NVARCHAR(250), TemplateVersion VARCHAR(10));
INSERT INTO @Demos (SourceRecordID, CompanyName, DemoURL, TemplateVersion) VALUES
{vals};

BEGIN TRANSACTION;
UPDATE l SET
  l.Status = CASE WHEN l.Status IN ('New', 'Checked', 'NoSite') THEN 'DemoBuilt' ELSE l.Status END,
  l.DemoURL = ISNULL(l.DemoURL, d.DemoURL),
  l.AssignedAgent = CASE WHEN l.Status IN ('New', 'Checked', 'NoSite') THEN 'SkyTech_WebsiteDeveloper' ELSE l.AssignedAgent END,
  l.UpdatedOn = GETDATE()
FROM dbo.Leads l
JOIN dbo.Companies c ON c.CompanyID = l.CompanyID
JOIN @Demos d ON d.SourceRecordID = c.SourceRecordID
WHERE l.Status IN ('New', 'Checked', 'NoSite') OR l.DemoURL IS NULL;

INSERT INTO dbo.Activities (LeadID, Agent, ActivityType, Outcome, ActivityDate)
SELECT l.LeadID, 'SkyTech_WebsiteDeveloper', 'Note', N'Demo site built (' + d.TemplateVersion + N'): ' + d.DemoURL, GETDATE()
FROM dbo.Leads l
JOIN dbo.Companies c ON c.CompanyID = l.CompanyID
JOIN @Demos d ON d.SourceRecordID = c.SourceRecordID
WHERE NOT EXISTS (SELECT 1 FROM dbo.Activities a WHERE a.LeadID = l.LeadID AND a.Agent = 'SkyTech_WebsiteDeveloper'
                    AND a.Outcome LIKE N'Demo site built%' + d.DemoURL);
COMMIT TRANSACTION;

SELECT c.CompanyName, l.Status, l.DemoURL
FROM dbo.Leads l JOIN dbo.Companies c ON c.CompanyID = l.CompanyID
JOIN @Demos d ON d.SourceRecordID = c.SourceRecordID ORDER BY c.CompanyName;
SELECT d.CompanyName AS NotFoundInDatabase FROM @Demos d
WHERE NOT EXISTS (SELECT 1 FROM dbo.Companies c WHERE c.SourceRecordID = d.SourceRecordID);

-- Version: V1.0 ({TODAY}) — sql/05_demo_sites_built.sql — V1.0
"""
    os.makedirs(os.path.dirname(SQL), exist_ok=True)
    with open(SQL, "w", encoding="utf-8", newline="\n") as f: f.write(sql)

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--names", nargs="+", help="company names exactly as in the lead CSV")
    g.add_argument("--all", action="store_true", help="every verified potential client")
    a = ap.parse_args()
    with open(SRC, encoding="utf-8-sig") as f:
        leads = [r for r in csv.DictReader(f) if r["PotentialClient"] == "Yes"]
    if a.names:
        want = {n.lower() for n in a.names}
        pick = [r for r in leads if r["CompanyName"].lower() in want]
        missing = want - {r["CompanyName"].lower() for r in pick}
        if missing: sys.exit("Not found among verified potential clients: " + ", ".join(sorted(missing)))
    else:
        pick = leads
    mpath = os.path.join(OUT, "manifest.csv")
    manifest = read_manifest(mpath)
    for r in pick:
        slug, name, p, page = build_page(r)
        d = os.path.join(OUT, slug); os.makedirs(d, exist_ok=True)
        with open(os.path.join(d, "index.html"), "w", encoding="utf-8", newline="\n") as f: f.write(page)
        manifest[r["OvertureID"]] = dict(Slug=slug, CompanyName=r["CompanyName"], OvertureID=r["OvertureID"], Niche=r["Niche"],
            Category=r["Category"], Template=p["template"], City=r["City"], County=r["County"], Phone=r["Phone"], Email=r["Email"],
            Path=f"demo-sites/{slug}/index.html", TemplateVersion=TEMPLATE_VERSION, BuiltOn=TODAY)
        print(f"built  {slug}  ({p['template']}: {p['label']})")
    os.makedirs(OUT, exist_ok=True)
    with open(mpath, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=MANIFEST_COLS); w.writeheader()
        for r in sorted(manifest.values(), key=lambda x: x["CompanyName"].lower()): w.writerow({k: r.get(k, "") for k in MANIFEST_COLS})
    write_sql(manifest)
    print(f"{len(pick)} built now · {len(manifest)} in demo-sites/manifest.csv · SQL: sql/05_demo_sites_built.sql")

if __name__ == "__main__":
    main()

# Version: V1.0 (2026-10-02) — scripts/website/build_demo_sites.py — V1.0
