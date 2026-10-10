// Version: V2.0 (2026-10-10) — admin-site/scripts/build-demos.js — V2.0 (error codes, logging, validation)
/**
 * @file SkyTech_WebsiteDeveloper: builds demo websites from design files and writes the database update.
 * Inputs : demo-sites/designs/<slug>.json          (unique design + wording for one business)
 *          data/samples/SkyTech_Leads_Sample100.csv (public facts: phone, email, address)
 * Outputs: demo-sites/<slug>/index.html             (self-contained page)
 *          demo-sites/manifest.csv                  (one row per demo, never duplicated)
 *          sql/05_demo_sites_built.sql              (adds each demo to dbo.DemoSites and marks the lead DemoBuilt; safe to re-run)
 *          logs/runtime/scripts-YYYY-MM-DD.log      (what was built, and any error code)
 * Run    : (from the admin-site folder)  npm run build-demos                      (all designs)
 *                                        npm run build-demos -- c-and-a-plumbing-20723   (one or more slugs)
 * Errors : SKY-DEMO-001 design file not valid JSON / missing fields; SKY-DEMO-002 design has no matching lead;
 *          SKY-DEMO-003 unknown slug; SKY-LEAD-001 sample CSV missing; SKY-SYS-002 disk full.
 * After the demos are in SkyTechCRM, edit them in the Admin site (Demo sites tab); edits there win.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { render, TEMPLATE_VERSION } = require('../src/demo/render');
const log = require('../src/logger').to('scripts');
const { info } = require('../src/errors');

/** fail — prints the SkyTech code, message and first fix step, logs it, and stops with exit code 1. */
function fail(code, msg, extra = {}) {
  const fix = ((info(code) || {}).fix || [])[0] || '';
  log.error('build-demos', msg, { code, ...extra });
  console.error(`\n[${code}] ${msg}${fix ? '\nFix: ' + fix : ''}\nGuide: docs/architecture/SkyTech_Troubleshooting_Guide.html#${code}`);
  process.exit(1);
}
/** REQUIRED — fields every design file must have (SKY-DEMO-001 if one is missing). */
const REQUIRED = ['Slug', 'OvertureID', 'Layout', 'Theme', 'BrandName', 'Headline', 'Services'];

const ROOT = process.env.SKYTECH_ROOT || path.resolve(__dirname, '..', '..');
const DESIGNS = path.join(ROOT, 'demo-sites', 'designs');
const CSV = path.join(ROOT, 'data', 'samples', 'SkyTech_Leads_Sample100.csv');
const SQL = path.join(ROOT, 'sql', '05_demo_sites_built.sql');
const TODAY = new Date().toISOString().slice(0, 10);
const FIELDS = ['Slug', 'Layout', 'Theme', 'PrimaryColor', 'AccentColor', 'BackgroundColor', 'HeadingFont', 'BodyFont', 'LogoText', 'LogoShape',
  'Illustration', 'BrandName', 'Tagline', 'Headline', 'Subheadline', 'About', 'Services', 'Highlights', 'Steps', 'ServiceAreas', 'CallToAction',
  'DisclosureNote', 'HeroImage', 'AboutImage', 'PhotoCredit', 'Status', 'Notes'];

/** parseCSV — small RFC-4180 CSV reader (quoted cells, doubled quotes, CRLF); returns an array of row objects. */
function parseCSV(text) {
  const rows = []; let row = [], cell = '', q = false;
  text = text.replace(/^﻿/, '');
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch; }
    else if (ch === '"') q = true; else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [h, ...d] = rows; return d.filter(r => r.length === h.length).map(r => Object.fromEntries(h.map((k, i) => [k, r[i]])));
}
/** sq — SQL literal: NULL for empty, otherwise N'…' with quotes doubled (prevents SQL injection in the generated file). */
const sq = v => (v == null || v === '') ? 'NULL' : "N'" + String(v).replace(/'/g, "''") + "'";
/** csvCell — quotes a manifest cell when it contains a comma, quote or line break. */
const csvCell = v => /[",\n]/.test(String(v ?? '')) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v ?? '');

// ---- load inputs (each failure stops with a code) ----
let leads;
try { leads = Object.fromEntries(parseCSV(fs.readFileSync(CSV, 'utf8')).map(r => [r.OvertureID, r])); }
catch (e) { fail('SKY-LEAD-001', `Cannot read ${path.relative(ROOT, CSV)} (${e.code || e.message})`); }
const want = process.argv.slice(2);
let files;
try { files = fs.readdirSync(DESIGNS).filter(f => f.endsWith('.json')).sort(); }
catch (e) { fail('SKY-DEMO-001', `Design folder ${path.relative(ROOT, DESIGNS)} not found`); }
const all = files.map(f => {
  let d;
  try { d = JSON.parse(fs.readFileSync(path.join(DESIGNS, f), 'utf8')); }
  catch (e) { fail('SKY-DEMO-001', `${f} is not valid JSON: ${e.message}`, { file: f }); }
  const missing = REQUIRED.filter(k => !d[k]);
  if (missing.length) fail('SKY-DEMO-001', `${f} is missing: ${missing.join(', ')}`, { file: f });
  if (!/^[a-z0-9-]{3,80}$/.test(d.Slug)) fail('SKY-DEMO-001', `${f}: Slug must be lower-case letters, digits and dashes`, { file: f });
  return d;
});
const pick = want.length ? all.filter(d => want.includes(d.Slug)) : all;
if (want.length && pick.length !== want.length) fail('SKY-DEMO-003', 'Unknown design: ' + want.filter(w => !all.some(d => d.Slug === w)).join(', '));

// ---- build one page per design ----
for (const d of pick) {
  const L = leads[d.OvertureID];
  if (!L) fail('SKY-DEMO-002', `No lead in the sample CSV for ${d.Slug} (${d.OvertureID})`, { slug: d.Slug });
  const site = { ...d, CompanyName: L.CompanyName, Phone: L.Phone, Email: L.Email, Address: L.Address, City: L.City, County: L.County, Zip: L.Zip };
  const dir = path.join(ROOT, 'demo-sites', d.Slug);
  try { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'index.html'), render(site, { date: TODAY })); }
  catch (e) { fail(e.code === 'ENOSPC' ? 'SKY-SYS-002' : 'SKY-DEMO-001', `Could not write ${d.Slug}/index.html: ${e.message}`, { slug: d.Slug }); }
  log.info('build-demos', `built ${d.Slug}`, { slug: d.Slug, layout: d.Layout, theme: d.Theme });
  console.log(`built  ${d.Slug}  (${d.Layout} · ${d.Theme})`);
}

// ---- manifest: every design, one row each ----
const cols = ['Slug', 'CompanyName', 'OvertureID', 'Layout', 'Theme', 'Status', 'Path', 'TemplateVersion', 'BuiltOn'];
const man = [cols.join(',')].concat(all.map(d => [d.Slug, (leads[d.OvertureID] || {}).CompanyName, d.OvertureID, d.Layout, d.Theme, d.Status,
  `demo-sites/${d.Slug}/index.html`, TEMPLATE_VERSION, TODAY].map(csvCell).join(',')));
fs.writeFileSync(path.join(ROOT, 'demo-sites', 'manifest.csv'), man.join('\n') + '\n');

// ---- SQL for every design (insert-only, so edits made in the Admin site are never overwritten) ----
const values = all.map(d => '  (' + [sq(d.OvertureID), ...FIELDS.map(f => sq(d[f])), sq(`demo-sites/${d.Slug}/index.html`), sq(TEMPLATE_VERSION)].join(', ') + ')').join(',\n');
fs.writeFileSync(SQL, `-- Version: V2.2 (${TODAY}) — sql/05_demo_sites_built.sql — V2.2
-- Generated by admin-site/scripts/build-demos.js (SkyTech_WebsiteDeveloper). Safe to re-run; never creates duplicates.
-- 1) Adds each demo to dbo.DemoSites (one row per company). Rows that already exist are left alone, so edits made in the Admin site win.
-- 2) Marks the lead DemoBuilt (only if it is still New / Checked / NoSite) and logs one Note activity per demo.
-- Run in SSMS after sql/01 (V2.3) and sql/04 (V1.5); then run sql/06. All-or-nothing: a failure rolls back,
-- is written to dbo.ErrorLog (SKY-IMP-001) and shown in the Messages tab. Demos listed under NotFoundInDatabase
-- need their lead imported first (SKY-IMP-001).
USE SkyTechCRM;
SET NOCOUNT ON;
DECLARE @D TABLE (SourceRecordID NVARCHAR(64) PRIMARY KEY, ${FIELDS.map(f => `[${f}] NVARCHAR(MAX)`).join(', ')}, PreviewPath NVARCHAR(250), TemplateVersion VARCHAR(10));
INSERT INTO @D (SourceRecordID, ${FIELDS.map(f => `[${f}]`).join(', ')}, PreviewPath, TemplateVersion) VALUES
${values};

BEGIN TRY
BEGIN TRANSACTION;
INSERT INTO dbo.DemoSites (CompanyID, ${FIELDS.map(f => `[${f}]`).join(', ')}, PreviewPath, TemplateVersion, BuiltBy)
SELECT c.CompanyID, ${FIELDS.map(f => `d.[${f}]`).join(', ')}, d.PreviewPath, d.TemplateVersion, 'SkyTech_WebsiteDeveloper'
FROM @D d JOIN dbo.Companies c ON c.SourceRecordID = d.SourceRecordID
WHERE NOT EXISTS (SELECT 1 FROM dbo.DemoSites x WHERE x.CompanyID = c.CompanyID OR x.Slug = d.Slug);

UPDATE l SET
  l.Status = CASE WHEN l.Status IN ('New', 'Checked', 'NoSite') THEN 'DemoBuilt' ELSE l.Status END,
  l.DemoURL = ISNULL(l.DemoURL, N'preview: ' + d.PreviewPath),
  l.AssignedAgent = CASE WHEN l.Status IN ('New', 'Checked', 'NoSite') THEN 'SkyTech_WebsiteDeveloper' ELSE l.AssignedAgent END,
  l.UpdatedOn = GETDATE()
FROM dbo.Leads l JOIN dbo.Companies c ON c.CompanyID = l.CompanyID JOIN @D d ON d.SourceRecordID = c.SourceRecordID
WHERE l.Status IN ('New', 'Checked', 'NoSite') OR l.DemoURL IS NULL;

INSERT INTO dbo.Activities (LeadID, Agent, ActivityType, Outcome, ActivityDate)
SELECT l.LeadID, 'SkyTech_WebsiteDeveloper', 'Note', N'Demo site built (' + d.TemplateVersion + N', ' + d.Theme + N'): ' + d.PreviewPath, GETDATE()
FROM dbo.Leads l JOIN dbo.Companies c ON c.CompanyID = l.CompanyID JOIN @D d ON d.SourceRecordID = c.SourceRecordID
WHERE NOT EXISTS (SELECT 1 FROM dbo.Activities a WHERE a.LeadID = l.LeadID AND a.Agent = 'SkyTech_WebsiteDeveloper'
                    AND a.Outcome LIKE N'Demo site built (' + d.TemplateVersion + N'%');
COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
  EXEC dbo.usp_LogError @ProcedureName = N'sql/05_demo_sites_built', @SkyCode = 'SKY-IMP-001';
  THROW;
END CATCH;

SELECT s.DemoID, s.BrandName, s.Theme, s.Status, l.Status AS LeadStatus
FROM dbo.DemoSites s JOIN @D d ON d.Slug = s.Slug LEFT JOIN dbo.Leads l ON l.CompanyID = s.CompanyID ORDER BY s.BrandName;
SELECT d.Slug AS NotFoundInDatabase FROM @D d WHERE NOT EXISTS (SELECT 1 FROM dbo.Companies c WHERE c.SourceRecordID = d.SourceRecordID);

-- Version: V2.2 (${TODAY}) — sql/05_demo_sites_built.sql — V2.2
`);
log.info('build-demos', `finished: ${pick.length} built, ${all.length} in manifest`, {});
console.log(`${pick.length} built · ${all.length} designs in manifest · SQL: sql/05_demo_sites_built.sql`);

// Version: V1.1 (2026-10-05) — admin-site/scripts/build-demos.js — V1.1

// Version: V2.0 (2026-10-10) — admin-site/scripts/build-demos.js — V2.0
