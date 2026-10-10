// Version: V2.0 (2026-10-10) — admin-site/src/db/memory.js — V2.0 (SkyTech error codes, ping)
/**
 * @file DEMO adapter: no database needed (npm run demo). Loads the 100-lead sample CSV into memory so the site can be
 *       tried and tested. Changes are lost when the server stops. Implements exactly the same functions and the same
 *       duplicate rules as src/db/mssql.js, and throws the same SkyTech codes (DUP-001, DATA-002/003/004, DUP-002/003).
 * Inputs: data/samples/SkyTech_Leads_Sample100.csv, demo-sites/designs/*.json.
 */
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { ENTITIES, editableColumns } = require('../schema');
const { AppError } = require('../errors');

// T — the in-memory tables (same names and columns as SkyTechCRM).
const T = { companies: [], webpresence: [], leads: [], activities: [], demosites: [], imports: [], audit: [], users: [], dismissed: new Set() };
let seq = { companies: 0, leads: 0, activities: 0, demosites: 0, audit: 0 };

// parseCSV — small CSV reader for the sample file (quoted cells, doubled quotes).
function parseCSV(text) {
  const rows = []; let row = [], cell = '', q = false;
  text = text.replace(/^﻿/, '');
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch; }
    else if (ch === '"') q = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [h, ...data] = rows;
  return data.filter(r => r.length === h.length).map(r => Object.fromEntries(h.map((k, i) => [k, r[i]])));
}
// normName — same normalisation as dbo.fn_NormName (lower case, "&" → and, no punctuation or Inc/LLC).
const normName = s => (' ' + String(s || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ') + ' ')
  .replace(/ (llc|inc|corp|ltd|co) /g, ' ').replace(/^ the /, ' ').trim() || null;
// digits — phone digits only, without a leading 1 (same as dbo.fn_DigitsOnly).
const digits = s => { let d = String(s || '').replace(/\D/g, ''); if (d.length === 11 && d[0] === '1') d = d.slice(1); return d || null; };
// niche — Real Estate / Utility Trades from the Industry text.
const niche = ind => /^Real Estate/i.test(ind || '') ? 'Real Estate' : /^Utility/i.test(ind || '') ? 'Utility Trades' : (ind || 'Other');

// Same rules as dbo.vw_DuplicateCheck (sql/04 V1.2): one row per suspected pair, strongest reason only.
const site = u => String(u || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\//g, '') || null;
// dupCheck — demo version of dbo.vw_DuplicateCheck: Exact / Likely / Possible pairs across all tables.
function dupCheck(co) {
  const out = [], seen = new Set();
  const add = (Category, Severity, Reason, IdA, LabelA, IdB, LabelB, MatchValue) => {
    const PairKey = `${Category}:${IdA}-${IdB}`;
    if (Category === 'Companies' && seen.has(PairKey)) return;
    seen.add(PairKey);
    if (T.dismissed.has(PairKey)) return;
    out.push({ Category, Severity, Reason, IdA, LabelA, IdB, LabelB, MatchValue, PairKey });
  };
  const C = T.companies.slice().sort((x, y) => x.CompanyID - y.CompanyID);
  const web = {}; T.webpresence.forEach(w => { const s = site(w.WebsiteURL); if (s && !web[w.CompanyID]) web[w.CompanyID] = s; });
  const zip5 = z => z ? String(z).slice(0, 5) : null;
  for (let i = 0; i < C.length; i++) for (let j = i + 1; j < C.length; j++) {
    const a = C[i], b = C[j], A = a.CompanyID, B = b.CompanyID, na = a.CompanyName, nb = b.CompanyName;
    const email = x => (x.Email || '').trim().toLowerCase() || null;
    if (a.SourceRecordID && a.SourceRecordID === b.SourceRecordID) add('Companies', 'Exact', 'Same source ID', A, na, B, nb, a.SourceRecordID);
    else if (a.NormName && a.NormName === b.NormName && zip5(a.Zip) && zip5(a.Zip) === zip5(b.Zip)) add('Companies', 'Exact', 'Same name + ZIP', A, na, B, nb, a.NormName + ' / ' + zip5(a.Zip));
    else if (a.PhoneDigits && a.PhoneDigits === b.PhoneDigits) add('Companies', 'Likely', 'Same phone', A, na, B, nb, a.PhoneDigits);
    else if (email(a) && email(a) === email(b)) add('Companies', 'Likely', 'Same email', A, na, B, nb, email(a));
    else if (web[A] && web[A] === web[B]) add('Companies', 'Likely', 'Same website', A, na, B, nb, web[A]);
    else if (a.NormName && a.NormName === b.NormName && (zip5(a.Zip) || '') !== (zip5(b.Zip) || '')) add('Companies', 'Possible', 'Same name, other ZIP', A, na, B, nb, a.NormName);
  }
  const L = T.leads.slice().sort((x, y) => x.LeadID - y.LeadID);
  const lab = l => `${(co[l.CompanyID] || {}).CompanyName || ''} (lead ${l.LeadID}, ${l.Status || ''})`;
  for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++)
    if (L[i].CompanyID === L[j].CompanyID) add('Leads', 'Exact', 'Company has more than one lead', L[i].LeadID, lab(L[i]), L[j].LeadID, lab(L[j]), String(L[i].CompanyID));
  const wc = {}; T.webpresence.forEach(w => { wc[w.CompanyID] = (wc[w.CompanyID] || 0) + 1; });
  Object.entries(wc).filter(([, n]) => n > 1).forEach(([id, n]) => { const nm = (co[id] || {}).CompanyName; add('WebPresence', 'Exact', `Company has ${n} web-presence rows`, Number(id), nm, Number(id), nm, id); });
  const A = T.activities.slice().sort((x, y) => x.ActivityID - y.ActivityID);
  const ld = Object.fromEntries(T.leads.map(l => [l.LeadID, l]));
  const alab = a => `${(co[(ld[a.LeadID] || {}).CompanyID] || {}).CompanyName || ''} - ${a.ActivityType || ''}`;
  for (let i = 0; i < A.length; i++) for (let j = i + 1; j < A.length; j++) {
    const a = A[i], b = A[j];
    if (a.LeadID === b.LeadID && (a.ActivityType || '') === (b.ActivityType || '') && (a.Outcome || '') === (b.Outcome || '') && String(a.ActivityDate).slice(0, 10) === String(b.ActivityDate).slice(0, 10))
      add('Activities', 'Likely', 'Same activity logged twice (same lead, type, text, day)', a.ActivityID, alab(a), b.ActivityID, alab(b), (a.Outcome || '').slice(0, 120));
  }
  return out;
}

// "npm run demo:duplicates": adds one example of each duplicate kind so the Possible duplicates tab can be tried.
function plantDuplicates(now) {
  const c1 = T.companies[0], c2 = T.companies[1], c3 = T.companies[2], c4 = T.companies[3];
  if (!c4) return;
  const copy = (c, extra) => { const n = { ...c, CompanyID: ++seq.companies, ImportedOn: now, UpdatedOn: now, ...extra }; T.companies.push(n); return n; };
  copy(c1, {});                                                                // Exact: same source ID (and name + ZIP)
  copy(c2, { SourceRecordID: null, Address: null });                            // Exact: same name + ZIP
  copy(c3, { SourceRecordID: null, CompanyName: c3.CompanyName + ' Services', NormName: normName(c3.CompanyName + ' Services'), Zip: '21000' }); // Likely: same phone
  copy(c4, { SourceRecordID: null, Zip: '20999', PhoneDigits: null, Phone: null, Email: null }); // Possible: same name, other ZIP
  T.leads.push({ LeadID: ++seq.leads, CompanyID: c1.CompanyID, BatchName: 'Manual re-entry', Status: 'Contacted', DemoURL: null, AssignedAgent: 'SkyTech_PhoneMarketing',
    NextFollowUp: null, DealValue: null, MonthlyPlan: null, LastSeenBatch: null, UpdatedOn: now });     // Exact: second lead for a company
  T.webpresence.push({ CompanyID: c2.CompanyID, CheckedOn: new Date(Date.now() + 1000).toISOString(), HasWebsite: 0, WebsiteURL: null,
    HasGoogleProfile: 1, HasFacebook: null, Notes: 'Re-checked by BackOffice' });                       // Exact: second web-presence row
  const lead = T.leads.find(l => l.CompanyID === c1.CompanyID);
  [1, 2].forEach(() => T.activities.push({ ActivityID: ++seq.activities, LeadID: lead.LeadID, Agent: 'Owner', ActivityType: 'Call',
    Outcome: 'Left voicemail about free demo site', ActivityDate: now }));                              // Likely: activity logged twice
}

// views — builds the joined "views" (vw_LeadDetail, vw_DemoSiteDetail…) from the tables on each call.
function views() {
  const co = Object.fromEntries(T.companies.map(c => [c.CompanyID, c]));
  const wp = Object.fromEntries(T.webpresence.map(w => [w.CompanyID, w]));
  const ld = Object.fromEntries(T.leads.map(l => [l.LeadID, l]));
  const dups = dupCheck(co);
  return {
    'dbo.vw_LeadDetail': T.leads.map(l => { const c = co[l.CompanyID] || {}, w = wp[l.CompanyID] || {};
      return { LeadID: l.LeadID, CompanyID: l.CompanyID, CompanyName: c.CompanyName, Niche: niche(c.Industry), County: c.County, City: c.City, Phone: c.Phone, Email: c.Email,
        HasWebsite: w.HasWebsite, WebsiteURL: w.WebsiteURL, Notes: w.Notes, BatchName: l.BatchName, Status: l.Status, DemoURL: l.DemoURL, AssignedAgent: l.AssignedAgent,
        NextFollowUp: l.NextFollowUp, DealValue: l.DealValue, MonthlyPlan: l.MonthlyPlan, LastSeenBatch: l.LastSeenBatch, UpdatedOn: l.UpdatedOn }; }),
    'dbo.Companies': T.companies,
    'dbo.vw_WebPresenceDetail': T.webpresence.map(w => ({ ...w, CompanyName: (co[w.CompanyID] || {}).CompanyName })),
    'dbo.vw_ActivityDetail': T.activities.map(a => ({ ...a, CompanyName: (co[(ld[a.LeadID] || {}).CompanyID] || {}).CompanyName })),
    'dbo.vw_DemoSiteDetail': T.demosites.map(d => { const c = co[d.CompanyID] || {}, l = T.leads.find(x => x.CompanyID === d.CompanyID) || {};
      return { ...d, CompanyName: c.CompanyName, Phone: c.Phone, Email: c.Email, Address: c.Address, City: c.City, County: c.County, Zip: c.Zip,
        LeadID: l.LeadID, LeadStatus: l.Status }; }),
    'dbo.ImportBatches': T.imports,
    'dbo.vw_DuplicateCheck': dups,
    'dbo.AuditLog': T.audit
  };
}
const tableOf = { companies: 'companies', leads: 'leads', webpresence: 'webpresence', activities: 'activities', demosites: 'demosites' };
// coerce — converts form values to the column type; bad numbers or dates → SKY-DATA-002.
function coerce(def, v) {
  if (v === '' || v === undefined || v === null) return null;
  if (def.type === 'int') return parseInt(v, 10);
  if (def.type === 'money') return Number(v);
  if (def.type === 'bit') return v === true || v === 1 || v === '1' || v === 'true' ? 1 : 0;
  if (def.type === 'date') return String(v).slice(0, 10);
  if (def.type === 'datetime') return new Date(v).toISOString();
  return String(v);
}
// cmp — sort helper that puts empty values first.
function cmp(a, b) { if (a == null) return b == null ? 0 : -1; if (b == null) return 1; return a < b ? -1 : a > b ? 1 : 0; }

module.exports = {
  name: 'DEMO (in memory)',
  // init — loads the CSV and demo designs, creates the demo users admin/viewer.
  async init() {
    const csv = path.join(__dirname, '..', '..', '..', 'data', 'samples', 'SkyTech_Leads_Sample100.csv');
    const now = new Date().toISOString();
    const rows = fs.existsSync(csv) ? parseCSV(fs.readFileSync(csv, 'utf8')) : [];
    rows.forEach(r => {
      const id = ++seq.companies;
      T.companies.push({ CompanyID: id, CompanyName: r.CompanyName, Industry: `${r.Niche} - ${r.Category}`, Address: r.Address, City: r.City, County: r.County,
        State: 'MD', Zip: r.Zip, Phone: r.Phone, Email: r.Email || null, ContactName: null, ContactTitle: null, EmployeeCount: null,
        SourceFile: r.SourceFile, SourceRecordID: r.OvertureID, NormName: normName(r.CompanyName), PhoneDigits: digits(r.Phone),
        LastBatchName: 'Sample100 Oct-2026', ImportedOn: now, UpdatedOn: now });
      T.webpresence.push({ CompanyID: id, CheckedOn: now, HasWebsite: (r.WebsiteListed || r.Verdict === 'HAS_WEBSITE') ? 1 : 0,
        WebsiteURL: r.VerifiedWebsite || r.WebsiteListed || null, HasGoogleProfile: null, HasFacebook: Number(r.HasFacebook) || 0,
        Notes: `${r.Verdict}; potential client: ${r.PotentialClient}; ${r.Evidence}` });
      T.leads.push({ LeadID: ++seq.leads, CompanyID: id, BatchName: 'Sample100 Oct-2026', Status: r.Status || 'New', DemoURL: null, AssignedAgent: 'SkyTech_BackOffice',
        NextFollowUp: null, DealValue: null, MonthlyPlan: null, LastSeenBatch: 'Sample100 Oct-2026', UpdatedOn: now });
    });
    T.imports.push({ BatchID: 1, BatchName: 'Sample100 Oct-2026', SourceFile: 'Overture Maps Places 2026-09-23.1', FirstRunOn: now, LastRunOn: now, Runs: 1, RowsIn: rows.length, Inserted: rows.length, Updated: 0, SkippedInFile: 0 });
    if (process.argv.includes('--with-duplicates')) plantDuplicates(now);
    // demo websites: same as running sql/05 (designs from demo-sites/designs, matched on the Overture source ID)
    const ddir = path.join(__dirname, '..', '..', '..', 'demo-sites', 'designs');
    if (fs.existsSync(ddir)) fs.readdirSync(ddir).filter(f => f.endsWith('.json')).sort().forEach(f => {
      const d = JSON.parse(fs.readFileSync(path.join(ddir, f), 'utf8'));
      const c = T.companies.find(x => x.SourceRecordID === d.OvertureID); if (!c || T.demosites.some(x => x.CompanyID === c.CompanyID)) return;
      const rec = { DemoID: ++seq.demosites, CompanyID: c.CompanyID, PreviewPath: `demo-sites/${d.Slug}/index.html`, PublicURL: null,
        TemplateVersion: 'V2.0', BuiltBy: 'SkyTech_WebsiteDeveloper', BuiltOn: now, UpdatedOn: now };
      editableColumns('demosites').forEach(k => { if (k in d) rec[k] = d[k]; });
      T.demosites.push(rec);
      const l = T.leads.find(x => x.CompanyID === c.CompanyID);
      if (l && ['New', 'Checked', 'NoSite'].includes(l.Status)) { l.Status = 'DemoBuilt'; l.DemoURL = l.DemoURL || 'preview: ' + rec.PreviewPath; l.AssignedAgent = 'SkyTech_WebsiteDeveloper'; }
    });
    T.users.push({ UserID: 1, Username: 'admin', PasswordHash: bcrypt.hashSync(process.env.DEMO_ADMIN_PASSWORD || 'demo1234', 10), Role: 'admin', IsActive: 1 });
    T.users.push({ UserID: 2, Username: 'viewer', PasswordHash: bcrypt.hashSync(process.env.DEMO_ADMIN_PASSWORD || 'demo1234', 10), Role: 'viewer', IsActive: 1 });
  },
  /** ping — health check; demo data is always available. */
  async ping() { return true; },
  async getUser(u) { return T.users.find(x => x.Username.toLowerCase() === String(u).toLowerCase()); },
  async touchLogin() {},
  async createUser(username, hash, role) { T.users.push({ UserID: T.users.length + 1, Username: username, PasswordHash: hash, Role: role, IsActive: 1 }); },
  async audit(user, entity, action, key, details) {
    T.audit.push({ AuditID: ++seq.audit, At: new Date().toISOString(), Username: user, Entity: entity, Action: action, RecordKey: key == null ? null : String(key), Details: details ? JSON.stringify(details) : null });
  },
  async dashboard() {
    const v = views()['dbo.vw_LeadDetail'];
    const today = new Date().toISOString().slice(0, 10);
    const in7 = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
    const open = l => !['Won', 'Lost', 'DoNotContact'].includes(l.Status);
    const count = f => T.leads.filter(f).length;
    const byStatus = {}; T.leads.forEach(l => { byStatus[l.Status] = (byStatus[l.Status] || 0) + 1; });
    const area = {}; v.forEach(l => { const k = (l.County || '(none)') + '|' + l.Niche; area[k] = area[k] || { County: l.County || '(none)', Niche: l.Niche, N: 0, Potential: 0 }; area[k].N++; if (l.Status === 'NoSite') area[k].Potential++; });
    return {
      kpis: { Companies: T.companies.length, Leads: T.leads.length, PotentialClients: count(l => l.Status === 'NoSite'), DemosBuilt: count(l => l.Status === 'DemoBuilt'),
        Contacted: count(l => ['Contacted', 'Interested', 'Proposal', 'Won', 'Lost'].includes(l.Status)), Pipeline: count(l => ['Interested', 'Proposal'].includes(l.Status)),
        Won: count(l => l.Status === 'Won'), MRR: T.leads.filter(l => l.Status === 'Won').reduce((s, l) => s + (l.MonthlyPlan || 0), 0),
        SetupRevenue: T.leads.filter(l => l.Status === 'Won').reduce((s, l) => s + (l.DealValue || 0), 0),
        FollowUpsDue: count(l => l.NextFollowUp && l.NextFollowUp <= today && open(l)), PossibleDuplicates: views()['dbo.vw_DuplicateCheck'].length },
      byStatus: Object.entries(byStatus).map(([Status, N]) => ({ Status, N })),
      byArea: Object.values(area),
      followUps: v.filter(l => l.NextFollowUp && l.NextFollowUp <= in7 && open(l)).sort((a, b) => cmp(a.NextFollowUp, b.NextFollowUp)).slice(0, 10),
      activity: views()['dbo.vw_ActivityDetail'].sort((a, b) => cmp(b.ActivityDate, a.ActivityDate)).slice(0, 8),
      imports: T.imports.slice(-5).reverse()
    };
  },
  async list(entity, opts) {
    const e = ENTITIES[entity];
    let rows = views()[e.source].slice();
    if (opts.search) { const s = opts.search.toLowerCase(); rows = rows.filter(r => e.searchColumns.some(c => String(r[c] ?? '').toLowerCase().includes(s))); }
    Object.entries(opts.filters || {}).forEach(([c, val]) => { if (!e.columns[c]) return;
      rows = rows.filter(r => val === '__null__' ? r[c] == null : String(r[c]) === String(coerce(e.columns[c], val))); });
    const sort = e.columns[opts.sort] ? opts.sort : e.defaultSort, dir = (opts.dir || e.defaultDir) === 'asc' ? 1 : -1;
    rows.sort((a, b) => dir * cmp(a[sort], b[sort]) || cmp(a[e.key], b[e.key]));
    const size = Math.min(Math.max(parseInt(opts.size, 10) || 25, 1), 500), page = Math.max(parseInt(opts.page, 10) || 1, 1);
    return { total: rows.length, rows: rows.slice((page - 1) * size, page * size), page, size };
  },
  async get(entity, key) { const e = ENTITIES[entity]; return views()[e.source].find(r => String(r[e.key]) === String(key)); },
  async create(entity, values) {
    const e = ENTITIES[entity], t = T[tableOf[entity]], rec = {};
    editableColumns(entity).forEach(c => { if (c in values) rec[c] = coerce(e.columns[c], values[c]); });
    if (entity === 'companies') {
      rec.NormName = normName(rec.CompanyName); rec.PhoneDigits = digits(rec.Phone); rec.UpdatedOn = rec.ImportedOn = new Date().toISOString();
      if (T.companies.some(c => c.NormName === rec.NormName && c.Zip === rec.Zip)) throw new AppError('SKY-DUP-001', 'Duplicate: this record already exists (same source ID, same company name and ZIP, or a second row for the same company).');
    }
    if (entity === 'webpresence' && T.webpresence.some(w => w.CompanyID === rec.CompanyID)) throw new AppError('SKY-DUP-001', 'Duplicate: this record already exists (same source ID, same company name and ZIP, or a second row for the same company).');
    if (entity === 'leads') { if (T.leads.some(l => l.CompanyID === rec.CompanyID)) throw new AppError('SKY-DUP-001', 'Duplicate: this record already exists (same source ID, same company name and ZIP, or a second row for the same company).'); rec.UpdatedOn = new Date().toISOString(); }
    if (entity === 'activities' && !rec.ActivityDate) rec.ActivityDate = new Date().toISOString();
    if (entity === 'demosites') {
      if (T.demosites.some(d => d.CompanyID === rec.CompanyID || d.Slug === rec.Slug)) throw new AppError('SKY-DUP-001', 'Duplicate: this record already exists (same source ID, same company name and ZIP, or a second row for the same company).');
      rec.BuiltOn = rec.UpdatedOn = new Date().toISOString(); rec.BuiltBy = 'Owner'; rec.TemplateVersion = 'V2.0';
    }
    if (!e.keyIsInput) rec[e.key] = ++seq[tableOf[entity]];
    t.push(rec); return rec[e.key];
  },
  async update(entity, key, values) {
    const e = ENTITIES[entity], rec = T[tableOf[entity]].find(r => String(r[e.key]) === String(key));
    if (!rec) return 0;
    editableColumns(entity).forEach(c => { if (c in values && c !== e.key) rec[c] = coerce(e.columns[c], values[c]); });
    if (entity === 'companies') { rec.NormName = normName(rec.CompanyName); rec.PhoneDigits = digits(rec.Phone); }
    if (entity === 'demosites' && T.demosites.some(d => d !== rec && (d.Slug === rec.Slug || d.CompanyID === rec.CompanyID))) throw new AppError('SKY-DUP-001', 'Duplicate: this record already exists (same source ID, same company name and ZIP, or a second row for the same company).');
    if ('UpdatedOn' in rec) rec.UpdatedOn = new Date().toISOString();
    return 1;
  },
  async duplicateSummary() {
    const d = views()['dbo.vw_DuplicateCheck'], by = {};
    d.forEach(r => { const k = r.Category + '|' + r.Severity; by[k] = by[k] || { Category: r.Category, Severity: r.Severity, N: 0 }; by[k].N++; });
    return { total: d.length, byCategory: Object.values(by), checkedOn: new Date().toISOString() };
  },
  async compareCompanies(a, b) {
    const one = id => { const c = T.companies.find(x => x.CompanyID === parseInt(id, 10)); if (!c) return null;
      const lead = T.leads.find(l => l.CompanyID === c.CompanyID);
      return { company: c, web: T.webpresence.find(w => w.CompanyID === c.CompanyID) || null,
        lead: lead ? { ...lead, Activities: T.activities.filter(x => x.LeadID === lead.LeadID).length } : null }; };
    return { a: one(a), b: one(b) };
  },
  async compareLeads(a, b) {
    const one = id => { const l = T.leads.find(x => x.LeadID === parseInt(id, 10)); if (!l) return null;
      return { ...l, CompanyName: (T.companies.find(c => c.CompanyID === l.CompanyID) || {}).CompanyName, Activities: T.activities.filter(x => x.LeadID === l.LeadID).length }; };
    return { a: one(a), b: one(b) };
  },
  async webRows(companyId) {
    const id = parseInt(companyId, 10), c = T.companies.find(x => x.CompanyID === id) || {};
    return T.webpresence.filter(w => w.CompanyID === id).map(w => ({ ...w, CompanyName: c.CompanyName }))
      .sort((x, y) => cmp(y.CheckedOn, x.CheckedOn));
  },
  async compareActivities(a, b) {
    const one = id => { const x = T.activities.find(r => r.ActivityID === parseInt(id, 10)); return x ? { ...x } : null; };
    return { a: one(a), b: one(b) };
  },
  async mergeCompanies(keepId, removeId) {
    const K = parseInt(keepId, 10), R = parseInt(removeId, 10);
    if (K === R) throw new AppError('SKY-DUP-005', 'Choose two different companies.');
    const k = T.companies.find(c => c.CompanyID === K), r = T.companies.find(c => c.CompanyID === R);
    if (!k || !r) throw new AppError('SKY-DUP-005', 'One of the companies no longer exists.');
    ['Industry', 'Address', 'City', 'County', 'State', 'Phone', 'PhoneDigits', 'Email', 'ContactName', 'ContactTitle', 'EmployeeCount', 'SourceRecordID']
      .forEach(f => { if (k[f] == null || k[f] === '') k[f] = r[f]; });
    if (k.SourceRecordID === r.SourceRecordID) r.SourceRecordID = null;
    k.UpdatedOn = new Date().toISOString();
    const kw = T.webpresence.find(w => w.CompanyID === K), rw = T.webpresence.find(w => w.CompanyID === R);
    if (rw && !kw) rw.CompanyID = K;
    else if (rw) { ['HasWebsite', 'WebsiteURL', 'HasGoogleProfile', 'HasFacebook'].forEach(f => { if (kw[f] == null) kw[f] = rw[f]; });
      if (rw.Notes) kw.Notes = ((kw.Notes || '') + ' | merged: ' + rw.Notes).slice(0, 500); T.webpresence.splice(T.webpresence.indexOf(rw), 1); }
    T.webpresence.filter(w => w.CompanyID === R).forEach(w => { w.CompanyID = K; });
    const kl = T.leads.find(l => l.CompanyID === K), rl = T.leads.find(l => l.CompanyID === R);
    if (rl && !kl) rl.CompanyID = K;
    else if (rl) await this.mergeLeads(kl.LeadID, rl.LeadID, true);
    T.leads.filter(l => l.CompanyID === R).forEach(l => { l.CompanyID = K; });
    T.companies.splice(T.companies.indexOf(r), 1);
  },
  async mergeLeads(keepId, removeId, anyCompany) {
    const K = parseInt(keepId, 10), R = parseInt(removeId, 10);
    if (K === R) throw new AppError('SKY-DUP-002', 'Choose two different leads.');
    const kl = T.leads.find(l => l.LeadID === K), rl = T.leads.find(l => l.LeadID === R);
    if (!kl || !rl || (!anyCompany && kl.CompanyID !== rl.CompanyID)) throw new AppError('SKY-DUP-002', 'These leads do not belong to the same company (or no longer exist).');
    const order = ['New', 'Checked', 'NoSite', 'DemoBuilt', 'Contacted', 'Interested', 'Proposal', 'Won'];
    if (order.indexOf(rl.Status) > order.indexOf(kl.Status) && !['Lost', 'DoNotContact'].includes(kl.Status)) kl.Status = rl.Status;
    ['DemoURL', 'AssignedAgent', 'NextFollowUp', 'DealValue', 'MonthlyPlan'].forEach(f => { if (kl[f] == null) kl[f] = rl[f]; });
    kl.UpdatedOn = new Date().toISOString();
    T.activities.forEach(a => { if (a.LeadID === R) a.LeadID = K; });
    T.leads.splice(T.leads.indexOf(rl), 1);
  },
  async fixWebPresence(companyId) {
    const id = parseInt(companyId, 10), rows = await this.webRows(id);
    if (rows.length < 2) throw new AppError('SKY-DUP-003', 'This company has only one web-presence row now.');
    const keep = T.webpresence.find(w => w.CompanyID === id && w.CheckedOn === rows[0].CheckedOn);
    rows.slice(1).forEach(r => ['HasWebsite', 'WebsiteURL', 'HasGoogleProfile', 'HasFacebook'].forEach(f => { if (keep[f] == null) keep[f] = r[f]; }));
    rows.slice(1).forEach(r => { if (r.Notes && r.Notes !== keep.Notes) keep.Notes = ((keep.Notes || '') + ' | merged: ' + r.Notes).slice(0, 500); });
    T.webpresence = T.webpresence.filter(w => w.CompanyID !== id || w === keep);
  },
  async removeActivity(id) {
    const i = T.activities.findIndex(a => a.ActivityID === parseInt(id, 10));
    if (i < 0) throw new AppError('SKY-DATA-004', 'This activity no longer exists.');
    T.activities.splice(i, 1);
  },
  async dismissDuplicate(category, a, b) { const [x, y] = [parseInt(a, 10), parseInt(b, 10)].sort((m, n) => m - n); T.dismissed.add(`${category}:${x}-${y}`); },

  async remove(entity, key) {
    const e = ENTITIES[entity], t = T[tableOf[entity]];
    if (entity === 'companies' && (T.leads.some(l => String(l.CompanyID) === String(key)) || T.webpresence.some(w => String(w.CompanyID) === String(key)) || T.demosites.some(d => String(d.CompanyID) === String(key))))
      throw new AppError('SKY-DATA-003', 'This record is linked to other records (leads, web presence, demo sites or activities). Change or delete those first.');
    if (entity === 'leads' && T.activities.some(a => String(a.LeadID) === String(key)))
      throw new AppError('SKY-DATA-003', 'This record is linked to other records (leads, web presence, demo sites or activities). Change or delete those first.');
    const i = t.findIndex(r => String(r[e.key]) === String(key)); if (i < 0) return 0; t.splice(i, 1); return 1;
  }
};

// Version: V2.0 (2026-10-10) — admin-site/src/db/memory.js — V2.0
