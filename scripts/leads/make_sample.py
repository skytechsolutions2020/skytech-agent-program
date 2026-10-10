"""Turn Overture Maps Explorer downloads (GeoJSON/CSV) into a 100-lead sample
for Baltimore City + Baltimore County + Howard County: real estate and utility trades.
Version: V1.3 (2026-10-10) - error codes + logging (V1.2: Baltimore City added). NOTE: its SQL output is superseded; for database imports use
scripts/leads/build_sample_from_extract.py, which loads through the duplicate-safe dbo.usp_ImportStagedLeads."""
# Purpose : older Overture → 100-lead sample builder (kept for history; the SQL it writes is NOT duplicate-safe —
#           use build_sample_from_extract.py for database imports).
# Run     : python scripts/leads/make_sample.py <download.geojson|csv> [...]
# Errors  : SKY-LEAD-001 input missing; SKY-LEAD-002 nothing matched. Log: logs/runtime/scripts-<date>.log.
import sys, json, csv, glob, re, random, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "common")); import skylog
skylog.install("make_sample", "SKY-LEAD-001")
HOWARD = "20701 20723 20759 20763 20777 20794 21029 21036 21041 21042 21043 21044 21045 21046 21075 21104 21150 21723 21737 21738 21765 21794 21797".split()
BALTCO = ("21013 21020 21022 21023 21027 21030 21031 21051 21052 21053 21057 21065 21071 21082 21087 21092 21093 21094 "
          "21111 21117 21120 21128 21131 21133 21136 21139 21152 21153 21155 21156 21162 21163 21204 21207 21208 21209 "
          "21219 21220 21221 21222 21227 21228 21234 21236 21237 21244 21252 21286").split()
BCITY = ("21201 21202 21205 21206 21207 21209 21210 21211 21212 21213 21214 21215 21216 21217 21218 21223 21224 "
         "21225 21226 21229 21230 21231 21234 21237 21239 21251 21287").split()
RE_CAT = re.compile(r"real_estate|realtor|property_management|real_estate_agent|real_estate_service|home_appraiser|mortgage", re.I)
UT_CAT = re.compile(r"plumb|electric(ian|al_service)|hvac|heating|air_condition|roofing|handyman|contractor|water_heater|septic|well_drilling|solar|generator|gutter|sewer|drain", re.I)

def g(d, *path):
    """Safe nested lookup in Overture properties: g(p, "names", "primary")."""
    for p in path:
        if d is None: return None
        d = d.get(p) if isinstance(d, dict) else (d[p] if isinstance(d, list) and len(d) > p else None)
    return d

def load(f):
    """Yields place properties from a GeoJSON/JSON or CSV download (JSON-in-text fields decoded)."""
    if f.lower().endswith((".geojson", ".json")):
        data = json.load(open(f))
        feats = data["features"] if "features" in data else data
        for ft in feats:
            p = ft.get("properties", ft)
            for k in ("names","categories","addresses","websites","phones","socials","emails","basic_category","taxonomy"):
                if isinstance(p.get(k), str) and p[k][:1] in "[{":
                    try: p[k] = json.loads(p[k])
                    except Exception: pass
            yield p
    else:
        yield from csv.DictReader(open(f, newline="", encoding="utf-8-sig"))

rows, seen = [], set()
for f in sys.argv[1:]:
    if not os.path.exists(f): skylog.fail("SKY-LEAD-001", f"Input file not found: {f}")
    for p in load(f):
        name = g(p, "names", "primary") or p.get("name") or ""
        cat = (g(p, "categories", "primary") or p.get("basic_category") or g(p, "taxonomy", "primary") or p.get("category") or "")
        alts = " ".join(g(p, "categories", "alternate") or []) if isinstance(g(p,"categories","alternate"), list) else ""
        allcat = f"{cat} {alts}"
        niche = "Real Estate" if RE_CAT.search(allcat) else "Utility Trades" if UT_CAT.search(allcat) else None
        if not niche or not name: continue
        a = g(p, "addresses", 0) or {}
        zp = (a.get("postcode") or p.get("postcode") or "")[:5]
        loc = (a.get("locality") or "").strip().lower()
        if zp in HOWARD: county = "Howard"
        elif zp in BCITY and (zp not in BALTCO or loc == "baltimore"): county = "Baltimore City"
        elif zp in BALTCO: county = "Baltimore County"
        else: county = None
        if not county: continue
        key = (name.lower().strip(), zp)
        if key in seen: continue
        seen.add(key)
        webs = p.get("websites") or []; webs = webs if isinstance(webs, list) else [webs]
        phones = p.get("phones") or []; phones = phones if isinstance(phones, list) else [phones]
        socials = p.get("socials") or []; socials = socials if isinstance(socials, list) else [socials]
        emails = p.get("emails") or []; emails = emails if isinstance(emails, list) else [emails]
        rows.append(dict(CompanyName=name, Niche=niche, Category=cat, Address=a.get("freeform",""), City=a.get("locality",""),
            County=county, State="MD", Zip=zp, Phone=(phones[0] if phones else ""), Email=(emails[0] if emails else ""),
            WebsiteURL=(webs[0] if webs else ""), HasWebsite=1 if webs else 0,
            HasFacebook=1 if any("facebook" in str(s) for s in socials) else 0,
            Confidence=round(float(p.get("confidence") or 0), 2), OvertureID=p.get("id",""), SourceFile="Overture Maps Places"))

# priority: no website, has phone, higher confidence; balance niches and counties
rows.sort(key=lambda r: (r["HasWebsite"], r["Phone"] == "", -r["Confidence"]))
sample, buckets = [], {}
for r in rows: buckets.setdefault((r["Niche"], r["County"]), []).append(r)
while len(sample) < 100 and any(buckets.values()):
    for k in sorted(buckets):
        if buckets[k] and len(sample) < 100: sample.append(buckets[k].pop(0))
if not sample: skylog.fail("SKY-LEAD-002", "No matching businesses in the input files")
print(f"matched {len(rows)} businesses; sample {len(sample)}; no-website in sample: {sum(1 for r in sample if not r['HasWebsite'])}")
with open("SkyTech_Leads_Sample100.csv", "w", newline="") as fh:
    w = csv.DictWriter(fh, fieldnames=list(sample[0].keys())); w.writeheader(); w.writerows(sample)
q = lambda s: "N'" + str(s).replace("'", "''") + "'"
with open("SkyTech_Leads_Sample100_import.sql", "w") as fh:
    fh.write("USE SkyTechCRM;\nGO\n-- Sample of 100 leads: Real Estate + Utility Trades, Baltimore City / Baltimore County / Howard County\n")
    for r in sample:
        fh.write(f"INSERT INTO Companies (CompanyName, Industry, Address, City, State, Zip, Phone, Email, SourceFile) VALUES "
                 f"({q(r['CompanyName'])}, {q(r['Niche'] + ' - ' + r['Category'])}, {q(r['Address'])}, {q(r['City'])}, 'MD', {q(r['Zip'])}, {q(r['Phone'])}, {q(r['Email'])}, {q(r['SourceFile'])});\n"
                 f"INSERT INTO WebPresence (CompanyID, HasWebsite, WebsiteURL, HasFacebook, Notes) VALUES (SCOPE_IDENTITY(), {r['HasWebsite']}, {q(r['WebsiteURL'])}, {r['HasFacebook']}, {q('Overture listing; confirm before demo. County: ' + r['County'])});\n"
                 f"INSERT INTO Leads (CompanyID, BatchName, Status) SELECT MAX(CompanyID), N'Sample100 Oct-2026 RE+Utility BaltCity-BaltCo-Howard', '{'NoSite' if not r['HasWebsite'] else 'Checked'}' FROM Companies;\n")
    fh.write("GO\n")

# Version: V1.3 (2026-10-10) — scripts/leads/make_sample.py — V1.3
