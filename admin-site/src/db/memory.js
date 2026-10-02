// Version: V1.1 (2026-10-02) — admin-site/src/db/memory.js — V1.1
// DEMO adapter: no database needed. Loads the 100-lead sample CSV into memory so
// the site can be tried and tested. Changes are lost when the server stops.
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { ENTITIES, editableColumns } = require('../schema');

const T = { companies: [], webpresence: [], leads: [], activities: [], imports: [], audit: [], users: [], dismissed: new Set() };
let seq = { companies: 0, leads: 0, activities: 0, audit: 0 };

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
const normName = s => (' ' + String(s || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ') + ' ')
  .replace(/ (llc|inc|corp|ltd|co) /g, ' ').replace(/^ the /, ' ').trim() || null;
const digits = s => { let d = String(s || '').replace(/\D/g, ''); if (d.length === 11 && d[0] === '1') d = d.slice(1); return d || null; };
const niche = ind => /^Real Estate/i.test(ind || '') ? 'Real Estate' : /^Utility/i.test(ind || '') ? 'Utility Trades' : (ind || 'Other');

function views() {
  const co = Object.fromEntries(T.companies.map(c => [c.CompanyID, c]));
  const wp = Object.fromEntries(T.webpresence.map(w => [w.CompanyID, w]));
  const ld = Object.fromEntries(T.leads.map(l => [l.LeadID, l]));
  const dups = [];
  for (let i = 0; i < T.companies.length; i++) for (let j = i + 1; j < T.companies.length; j++) {
    const a = T.companies[i], b = T.companies[j];
    if (a.PhoneDigits && a.PhoneDigits === b.PhoneDigits) dups.push({ Reason: 'Same phone', CompanyID_A: a.CompanyID, Name_A: a.CompanyName, Zip_A: a.Zip, CompanyID_B: b.CompanyID, Name_B: b.CompanyName, Zip_B: b.Zip, MatchValue: a.PhoneDigits });
    if (a.NormName && a.NormName === b.NormName && a.Zip !== b.Zip) dups.push({ Reason: 'Same name, other ZIP', CompanyID_A: a.CompanyID, Name_A: a.CompanyName, Zip_A: a.Zip, CompanyID_B: b.CompanyID, Name_B: b.CompanyName, Zip_B: b.Zip, MatchValue: a.NormName });
  }
  return {
    'dbo.vw_LeadDetail': T.leads.map(l => { const c = co[l.CompanyID] || {}, w = wp[l.CompanyID] || {};
      return { LeadID: l.LeadID, CompanyID: l.CompanyID, CompanyName: c.CompanyName, Niche: niche(c.Industry), County: c.County, City: c.City, Phone: c.Phone, Email: c.Email,
        HasWebsite: w.HasWebsite, WebsiteURL: w.WebsiteURL, Notes: w.Notes, BatchName: l.BatchName, Status: l.Status, DemoURL: l.DemoURL, AssignedAgent: l.AssignedAgent,
        NextFollowUp: l.NextFollowUp, DealValue: l.DealValue, MonthlyPlan: l.MonthlyPlan, LastSeenBatch: l.LastSeenBatch, UpdatedOn: l.UpdatedOn }; }),
    'dbo.Companies': T.companies,
    'dbo.vw_WebPresenceDetail': T.webpresence.map(w => ({ ...w, CompanyName: (co[w.CompanyID] || {}).CompanyName })),
    'dbo.vw_ActivityDetail': T.activities.map(a => ({ ...a, CompanyName: (co[(ld[a.LeadID] || {}).CompanyID] || {}).CompanyName })),
    'dbo.ImportBatches': T.imports,
    'dbo.vw_PossibleDuplicates': dups,
    'dbo.vw_DuplicateReview': dups.filter(d => !T.dismissed.has(d.CompanyID_A + '-' + d.CompanyID_B)),
    'dbo.AuditLog': T.audit
  };
}
const tableOf = { companies: 'companies', leads: 'leads', webpresence: 'webpresence', activities: 'activities' };
function coerce(def, v) {
  if (v === '' || v === undefined || v === null) return null;
  if (def.type === 'int') return parseInt(v, 10);
  if (def.type === 'money') return Number(v);
  if (def.type === 'bit') return v === true || v === 1 || v === '1' || v === 'true' ? 1 : 0;
  if (def.type === 'date') return String(v).slice(0, 10);
  if (def.type === 'datetime') return new Date(v).toISOString();
  return String(v);
}
function cmp(a, b) { if (a == null) return b == null ? 0 : -1; if (b == null) return 1; return a < b ? -1 : a > b ? 1 : 0; }

module.exports = {
  name: 'DEMO (in memory)',
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
    T.users.push({ UserID: 1, Username: 'admin', PasswordHash: bcrypt.hashSync(process.env.DEMO_ADMIN_PASSWORD || 'demo1234', 10), Role: 'admin', IsActive: 1 });
    T.users.push({ UserID: 2, Username: 'viewer', PasswordHash: bcrypt.hashSync(process.env.DEMO_ADMIN_PASSWORD || 'demo1234', 10), Role: 'viewer', IsActive: 1 });
  },
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
        FollowUpsDue: count(l => l.NextFollowUp && l.NextFollowUp <= today && open(l)), PossibleDuplicates: views()['dbo.vw_DuplicateReview'].length },
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
      if (T.companies.some(c => c.NormName === rec.NormName && c.Zip === rec.Zip)) throw new Error('Duplicate: this record already exists (same source ID, or same company name and ZIP, or a second row for the same company).');
    }
    if (entity === 'webpresence' && T.webpresence.some(w => w.CompanyID === rec.CompanyID)) throw new Error('Duplicate: this record already exists (same source ID, or same company name and ZIP, or a second row for the same company).');
    if (entity === 'leads') { if (T.leads.some(l => l.CompanyID === rec.CompanyID)) throw new Error('Duplicate: this record already exists (same source ID, or same company name and ZIP, or a second row for the same company).'); rec.UpdatedOn = new Date().toISOString(); }
    if (entity === 'activities' && !rec.ActivityDate) rec.ActivityDate = new Date().toISOString();
    if (!e.keyIsInput) rec[e.key] = ++seq[tableOf[entity]];
    t.push(rec); return rec[e.key];
  },
  async update(entity, key, values) {
    const e = ENTITIES[entity], rec = T[tableOf[entity]].find(r => String(r[e.key]) === String(key));
    if (!rec) return 0;
    editableColumns(entity).forEach(c => { if (c in values && c !== e.key) rec[c] = coerce(e.columns[c], values[c]); });
    if (entity === 'companies') { rec.NormName = normName(rec.CompanyName); rec.PhoneDigits = digits(rec.Phone); }
    if ('UpdatedOn' in rec) rec.UpdatedOn = new Date().toISOString();
    return 1;
  },
  async compareCompanies(a, b) {
    const one = id => { const c = T.companies.find(x => x.CompanyID === parseInt(id, 10)); if (!c) return null;
      const lead = T.leads.find(l => l.CompanyID === c.CompanyID);
      return { company: c, web: T.webpresence.find(w => w.CompanyID === c.CompanyID) || null,
        lead: lead ? { ...lead, Activities: T.activities.filter(x => x.LeadID === lead.LeadID).length } : null }; };
    return { a: one(a), b: one(b) };
  },
  async mergeCompanies(keepId, removeId) {
    const K = parseInt(keepId, 10), R = parseInt(removeId, 10);
    if (K === R) throw new Error('Choose two different companies.');
    const k = T.companies.find(c => c.CompanyID === K), r = T.companies.find(c => c.CompanyID === R);
    if (!k || !r) throw new Error('One of the companies no longer exists.');
    ['Industry', 'Address', 'City', 'County', 'State', 'Phone', 'PhoneDigits', 'Email', 'ContactName', 'ContactTitle', 'EmployeeCount', 'SourceRecordID']
      .forEach(f => { if (k[f] == null || k[f] === '') k[f] = r[f]; });
    k.UpdatedOn = new Date().toISOString();
    const kw = T.webpresence.find(w => w.CompanyID === K), rw = T.webpresence.find(w => w.CompanyID === R);
    if (rw && !kw) rw.CompanyID = K;
    else if (rw) { ['HasWebsite', 'WebsiteURL', 'HasGoogleProfile', 'HasFacebook'].forEach(f => { if (kw[f] == null) kw[f] = rw[f]; });
      if (rw.Notes) kw.Notes = ((kw.Notes || '') + ' | merged: ' + rw.Notes).slice(0, 500); T.webpresence.splice(T.webpresence.indexOf(rw), 1); }
    const order = ['New', 'Checked', 'NoSite', 'DemoBuilt', 'Contacted', 'Interested', 'Proposal', 'Won'];
    const kl = T.leads.find(l => l.CompanyID === K), rl = T.leads.find(l => l.CompanyID === R);
    if (rl && !kl) rl.CompanyID = K;
    else if (rl) { if (order.indexOf(rl.Status) > order.indexOf(kl.Status) && !['Lost', 'DoNotContact'].includes(kl.Status)) kl.Status = rl.Status;
      ['DemoURL', 'AssignedAgent', 'NextFollowUp', 'DealValue', 'MonthlyPlan'].forEach(f => { if (kl[f] == null) kl[f] = rl[f]; });
      T.activities.forEach(a => { if (a.LeadID === rl.LeadID) a.LeadID = kl.LeadID; }); T.leads.splice(T.leads.indexOf(rl), 1); }
    T.companies.splice(T.companies.indexOf(r), 1);
  },
  async dismissDuplicate(a, b) { const [x, y] = [parseInt(a, 10), parseInt(b, 10)].sort((m, n) => m - n); T.dismissed.add(x + '-' + y); },

  async remove(entity, key) {
    const e = ENTITIES[entity], t = T[tableOf[entity]];
    if (entity === 'companies' && (T.leads.some(l => String(l.CompanyID) === String(key)) || T.webpresence.some(w => String(w.CompanyID) === String(key))))
      throw new Error('This record is linked to other records (leads, web presence or activities). Change or delete those first.');
    if (entity === 'leads' && T.activities.some(a => String(a.LeadID) === String(key)))
      throw new Error('This record is linked to other records (leads, web presence or activities). Change or delete those first.');
    const i = t.findIndex(r => String(r[e.key]) === String(key)); if (i < 0) return 0; t.splice(i, 1); return 1;
  }
};
