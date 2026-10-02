"""Version: V1.1 (2026-10-02) — scripts/leads/build_sample_from_extract.py — V1.2 (merges SkyTech_BackOffice verification; duplicate-safe staging import)
Turns data/raw/overture/<date>/sample100_extract.json (collected in Overture Explorer)
into data/samples/SkyTech_Leads_Sample100.csv (for review) and _import.sql (for SkyTechCRM).
Adds a review flag and priority so the team calls the best leads first."""
import json, csv, re, sys, os
src = sys.argv[1] if len(sys.argv) > 1 else "data/raw/overture/2026-10-02/sample100_extract.json"
out = "data/samples"; os.makedirs(out, exist_ok=True)
BRANDS = re.compile(r"century ?21|keller williams|long & foster|cummings & co|\bat rate\b|envoy mortgage|roto-rooter|redfin|stewart title|exit on the harbor|alexcooper|sun west|highlands residential|next day gutters", re.I)
NOTSMB = re.compile(r"trust fd|staffing|association|cooperative|limited partnership|capital partners", re.I)
VER = {}
vf = "data/verification/2026-10-02_backoffice_results.txt"
if os.path.exists(vf):
    for line in open(vf, encoding="utf-8"):
        p = line.rstrip("\n").split("|")
        if len(p) == 6: VER[p[0]] = dict(zip(["Verdict", "VerifiedWebsite", "OnlinePresence", "Evidence", "PotentialClient"], p[1:]))
rows = []
for n, niche, cat, ad, loc, county, zp, ph, em, web, fb, conf, oid in json.load(open(src)):
    flags = []
    if web: flags.append("Website listed")
    if BRANDS.search(n + " " + em): flags.append("Brand/franchise — likely has a parent website")
    if NOTSMB.search(n): flags.append("May not be a small business")
    if conf < 0.6: flags.append("Low listing confidence")
    digits = re.sub(r"\D", "", ph)
    if digits.startswith("1"): digits = digits[1:]
    if len(digits) != 10: flags.append("Phone needs checking")
    phone = f"({digits[:3]}) {digits[3:6]}-{digits[6:]}" if len(digits) == 10 else ph
    pri = "A" if not flags else ("B" if flags == ["Low listing confidence"] else "C")
    v = VER.get(oid[:8], {})
    if v.get("PotentialClient") == "Yes": status = "NoSite"
    elif v: status = "Checked"
    else: status = "NoSite" if not web else "Checked"
    rows.append(dict(PotentialClient=v.get("PotentialClient", ""), Verdict=v.get("Verdict", ""), Priority=pri, CompanyName=n, Niche=niche, Category=cat.replace("_", " "), Address=ad, City=loc.title(),
                     County=county, State="MD", Zip=zp, Phone=phone, Email=em, WebsiteListed=web, HasFacebook=fb,
                     Confidence=conf, ReviewFlags="; ".join(flags), VerifiedWebsite=v.get("VerifiedWebsite", ""),
                     OnlinePresence=v.get("OnlinePresence", ""), Evidence=v.get("Evidence", ""), Status=status,
                     SourceFile="Overture Maps Places 2026-09-23.1", OvertureID=oid))
rows.sort(key=lambda r: (r["PotentialClient"] != "Yes", r["Verdict"], r["County"], r["Niche"], r["CompanyName"]))
with open(f"{out}/SkyTech_Leads_Sample100.csv", "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.DictWriter(fh, fieldnames=list(rows[0])); w.writeheader(); w.writerows(rows)
q = lambda s: "N'" + str(s).replace("'", "''") + "'"
BATCH = "Sample100 Oct-2026 RE+Utility BaltCity-BaltCo-Howard"
SRC = "Overture Maps Places 2026-09-23.1"
with open(f"{out}/SkyTech_Leads_Sample100_import.sql", "w", encoding="utf-8") as fh:
    fh.write("-- Version: V1.2 (2026-10-02) — data/samples/SkyTech_Leads_Sample100_import.sql — V1.2 (duplicate-safe)\n")
    fh.write("-- 100-lead sample with SkyTech_BackOffice verification. SQL Server 2014 Developer (SSMS).\n")
    fh.write("-- Run sql/01_create_skytechcrm.sql (V2.0+) first. SAFE TO RE-RUN: existing companies are updated, never duplicated.\n")
    fh.write("USE SkyTechCRM;\nGO\nSET NOCOUNT ON;\nDELETE FROM dbo.StgLeads;\n")
    fh.write("INSERT INTO dbo.StgLeads (SourceRecordID, CompanyName, Industry, Address, City, County, State, Zip, Phone, Email, HasWebsite, WebsiteURL, HasFacebook, Notes, Status, SourceFile) VALUES\n")
    vals = []
    for r in rows:
        has = 1 if (r['WebsiteListed'] or r['Verdict'] == 'HAS_WEBSITE') else 0
        note = (r['Verdict'] or 'UNVERIFIED') + '; potential client: ' + (r['PotentialClient'] or '?') + '; ' + r['County'] + '; ' + r['Evidence']
        vals.append(f"({q(r['OvertureID'])}, {q(r['CompanyName'])}, {q(r['Niche'] + ' - ' + r['Category'])}, {q(r['Address'])}, {q(r['City'])}, {q(r['County'])}, 'MD', {q(r['Zip'])}, {q(r['Phone'])}, {q(r['Email'])}, {has}, {q(r['VerifiedWebsite'] or r['WebsiteListed'])}, {r['HasFacebook']}, {q(note[:500])}, '{r['Status']}', {q(SRC)})")
    fh.write(",\n".join(vals) + ";\n")
    fh.write(f"EXEC dbo.usp_ImportStagedLeads @BatchName = {q(BATCH)}, @SourceFile = {q(SRC)};\nGO\n")
    fh.write("SELECT l.Status, COUNT(*) AS Leads FROM dbo.Leads l JOIN dbo.Companies c ON c.CompanyID = l.CompanyID WHERE c.SourceRecordID IS NOT NULL GROUP BY l.Status;\n")
from collections import Counter
print(Counter(r["Verdict"] for r in rows), Counter(r["County"] for r in rows if r["PotentialClient"]=="Yes"), Counter(r["Priority"] for r in rows), Counter((r["Niche"], r["County"]) for r in rows if r["Priority"] == "A"))
