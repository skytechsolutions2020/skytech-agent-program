// Version: V2.1 (2026-10-10) — admin-site/server.js — V2.1 (login management)
/**
 * @file SkyTech Admin site web server.
 * Purpose: serves the Admin screens (public/) and the JSON API used by them: sign-in, dashboard, drill-down tables,
 *          create/edit/delete of SkyTechCRM records, the live duplicate check, demo-site preview/save and the
 *          system log. Every change is written to dbo.AuditLog; every request gets a reference number and is logged.
 * Run:     npm start (SQL Server, needs admin-site\.env)  |  npm run demo (sample data in memory, no database)
 *          npm run doctor (health check)                  |  npm run create-admin (create or reset a login)
 * Inputs:  admin-site\.env (see .env.example), config/error-codes.json, SkyTechCRM or the demo sample CSV.
 * Outputs: http://127.0.0.1:3030 (local only by default); logs/runtime/admin-YYYY-MM-DD.log.
 * Security: see src/security.js (headers, CSRF, rate limits, session timeouts, lockout) and
 *          docs/architecture/SkyTech_Security_Architecture. Only whitelisted tables/columns (src/schema.js) reach SQL.
 * Errors:  every failure is answered as { error, code, requestId, hint } using SkyTech codes (src/errors.js);
 *          look the code up in docs/architecture/SkyTech_Troubleshooting_Guide.
 */
'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const path = require('path');
const fs = require('fs');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const { ENTITIES, STATUSES, ACTIVITY_TYPES, AGENTS } = require('./src/schema');
const { render: renderDemo } = require('./src/demo/render');
const { AppError, fromDbError } = require('./src/errors');
const log = require('./src/logger');
const sec = require('./src/security');
const VERSION = require('./package.json').version;

// ------------------------------------------------------------------ start-up checks
const DEMO = process.argv.includes('--demo') || process.env.DEMO === '1';
/** fatal — prints a start-up error with its code and fix, logs it, and stops the process. */
function fatal(err) {
  const e = err instanceof AppError ? err : new AppError('SKY-SYS-001', err.message);
  log.error('startup', e.message, { code: e.code, details: e.details });
  console.error(`\n  ${e.code}: ${e.message}\n  Fix: ${e.hint || 'see the Troubleshooting Guide'}\n  Guide: docs/architecture/SkyTech_Troubleshooting_Guide.html\n`);
  process.exit(1);
}
if (parseInt(process.versions.node, 10) < 18) fatal(new AppError('SKY-CFG-004', `Node.js ${process.versions.node} is too old; install the LTS version.`));
if (!DEMO && !fs.existsSync(path.join(__dirname, '.env'))) fatal(new AppError('SKY-CFG-001'));
let CFG;
try { CFG = sec.checkConfig({ demo: DEMO }); } catch (e) { fatal(e); }
const db = DEMO ? require('./src/db/memory') : require('./src/db/mssql');
const PORT = parseInt(process.env.PORT, 10) || 3030;

// ------------------------------------------------------------------ middleware (order matters)
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', process.env.TRUST_PROXY === '1'); // only behind a real HTTPS proxy (Hostinger later)
app.use(sec.requestId);                                    // reference number + access log
app.use(sec.headers(CFG.secure));                          // CSP, no framing, no sniffing, HSTS on HTTPS
app.use(sec.rateLimit());                                  // per-IP request limits (SKY-SEC-002)
app.use(express.json({ limit: '200kb' }));                 // bigger bodies → SKY-SEC-003
app.use(session({
  name: sec.cookieName(CFG.secure), secret: CFG.secret, resave: false, saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'strict', secure: CFG.secure, maxAge: (parseInt(process.env.SESSION_MAX_HOURS, 10) || 8) * 3600000 }
}));
app.use(sec.sessionTimeout());                             // idle + absolute timeout (SKY-AUTH-003)
app.use(sec.originCheck);                                  // writes only from this site (SKY-SEC-007)
app.use(sec.csrf);                                         // anti-forgery token on writes (SKY-SEC-001)

/** wrap — lets async route handlers pass errors to the central error handler. */
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
/** auth — the request must come from a signed-in user (SKY-AUTH-004, or SKY-AUTH-003 if the session just expired). */
function auth(req, res, next) {
  if (req.session && req.session.user) {
    // a login that was disabled, re-roled or given a new password by an admin is signed out everywhere (epoch changed)
    if ((req.session.epoch || 0) === (EPOCH.get(req.session.user.id) || 0)) return next();
    const user = req.session.user.name;
    return req.session.destroy(() => { log.security('Session ended: login changed by an admin', { code: 'SKY-AUTH-003', user, reqId: req.id }, 'info'); next(new AppError('SKY-AUTH-003', 'Your login was changed. Please sign in again.')); });
  }
  next(new AppError(req.expired ? 'SKY-AUTH-003' : 'SKY-AUTH-004'));
}
/** EPOCH — per-login change counter; bumping it ends that login's open sessions (see auth). */
const EPOCH = new Map();
const bumpEpoch = id => EPOCH.set(id, (EPOCH.get(id) || 0) + 1);
/** adminOnly — the user must have the admin role; viewers are read-only (SKY-AUTH-005). */
function adminOnly(req, res, next) {
  if (req.session.user.role === 'admin') return next();
  log.security('Write attempt by read-only account', { code: 'SKY-AUTH-005', user: req.session.user.name, reqId: req.id, path: req.path }, 'info');
  next(new AppError('SKY-AUTH-005'));
}
/** entity — resolves :entity against the whitelist in src/schema.js (SKY-DATA-006 if unknown). */
function entity(req, res, next) { const e = ENTITIES[req.params.entity]; if (!e) return next(new AppError('SKY-DATA-006')); req.e = e; next(); }
/** checkDemo — field rules for demo sites before saving: slug format, colours, free-licence photo hosts. */
function checkDemo(req, res, next) {
  if (req.params.entity !== 'demosites') return next();
  const b = req.body || {};
  if ('Slug' in b && !/^[a-z0-9][a-z0-9-]{2,79}$/.test(String(b.Slug))) return next(new AppError('SKY-DATA-002', 'Slug: use 3-80 lowercase letters, numbers and dashes.'));
  const bad = ['PrimaryColor', 'AccentColor', 'BackgroundColor'].find(k => b[k] && !/^#[0-9a-fA-F]{6}$/.test(String(b[k])));
  if (bad) return next(new AppError('SKY-DATA-002', bad + ': use a colour like #1f5fbf.'));
  const badImg = ['HeroImage', 'AboutImage'].find(k => b[k] && !/^https:\/\/(images\.pexels\.com|images\.unsplash\.com)\/\S+$/.test(String(b[k])));
  if (badImg) return next(new AppError('SKY-SEC-005', badImg + ': use a free-licence photo link from images.pexels.com or images.unsplash.com.'));
  next();
}

// ------------------------------------------------------------------ sign-in / sign-out
const guard = sec.loginGuard();
/** DUMMY_HASH — real bcrypt hash of a random value, compared when the username is unknown (equal timing). */
const DUMMY_HASH = bcrypt.hashSync(require('crypto').randomBytes(16).toString('hex'), 12);
/**
 * POST /api/login — checks username + password (bcrypt), applies the lockout (SKY-AUTH-002),
 * starts a fresh session (new id, prevents session fixation) and returns the user and CSRF token.
 */
app.post('/api/login', wrap(async (req, res) => {
  const { username, password } = req.body || {};
  const name = String(username || '').slice(0, 50), ip = req.ip;
  const locked = guard.check(name, ip);
  if (locked) { log.security('Sign-in blocked (locked)', { code: 'SKY-AUTH-002', user: name, ip, reqId: req.id }); throw locked; }
  const u = name && await db.getUser(name);
  // compare against a dummy hash when the user does not exist, so response time does not reveal valid usernames
  const ok = await bcrypt.compare(String(password || ''), (u && u.PasswordHash) || DUMMY_HASH);
  if (!u || !u.IsActive || !ok) {
    const nowLocked = guard.fail(name, ip);
    log.security(nowLocked ? 'Account locked after repeated failures' : 'Sign-in failed', { code: nowLocked ? 'SKY-AUTH-002' : 'SKY-AUTH-001', user: name, ip, reqId: req.id });
    await db.audit(name || '(blank)', 'session', nowLocked ? 'LOCKOUT' : 'LOGINFAIL', null, { ip }).catch(() => {});
    throw new AppError('SKY-AUTH-001', 'Wrong username or password.');
  }
  guard.ok(name, ip);
  await new Promise((resolve, reject) => req.session.regenerate(e => (e ? reject(e) : resolve())));
  req.session.user = { id: u.UserID, name: u.Username, role: u.Role };
  req.session.epoch = EPOCH.get(u.UserID) || 0;
  req.session.started = req.session.lastSeen = Date.now();
  const csrf = sec.issueCsrf(req);
  await db.touchLogin(u.UserID);
  await db.audit(u.Username, 'session', 'LOGIN', null, { ip });
  log.security('Signed in', { user: u.Username, role: u.Role, ip, reqId: req.id }, 'info');
  res.json({ user: req.session.user, csrf });
}));
/** POST /api/logout — ends the session (needs the CSRF token, like every write). */
app.post('/api/logout', (req, res) => {
  const user = req.session && req.session.user && req.session.user.name;
  req.session.destroy(() => { if (user) log.security('Signed out', { user, reqId: req.id }, 'info'); res.json({ ok: true }); });
});

// ------------------------------------------------------------------ read APIs
/** GET /api/me — who is signed in, data mode, and the CSRF token for this session. */
app.get('/api/me', auth, (req, res) => res.json({ user: req.session.user, mode: db.name, csrf: sec.issueCsrf(req), version: VERSION }));
/** GET /api/meta — table definitions and lists the screens need (statuses, agents…). */
app.get('/api/meta', auth, (req, res) => res.json({ entities: ENTITIES, statuses: STATUSES, activityTypes: ACTIVITY_TYPES, agents: AGENTS }));
/** GET /api/dashboard — KPI counts, charts data, follow-ups, recent activity and imports. */
app.get('/api/dashboard', auth, wrap(async (req, res) => res.json(await db.dashboard())));
/** GET /api/health — quick self-test: database reachable, version, log folder (used by the System log screen). */
app.get('/api/health', auth, wrap(async (req, res) => {
  const t0 = Date.now(); let dbOk = true, dbError = null;
  try { await db.ping(); } catch (e) { dbOk = false; dbError = fromDbError(e).code; }
  res.json({ ok: dbOk, version: VERSION, mode: db.name, db: dbOk ? 'ok' : dbError, dbMs: Date.now() - t0, logDir: log.DIR, node: process.versions.node });
}));
/** GET /api/logs — newest log entries (admin only); ?level=warn shows warnings and errors only. */
app.get('/api/logs', auth, adminOnly, (req, res) => res.json({ rows: log.tail(300, ['debug', 'info', 'warn', 'error'].includes(req.query.level) ? req.query.level : 'info') }));

/** GET /api/data/:entity — list with search (?search=), filters (?f_Column=), sort and paging. */
app.get('/api/data/:entity', auth, entity, wrap(async (req, res) => {
  const { search, sort, dir, page, size, ...rest } = req.query;
  const filters = {};
  Object.entries(rest).forEach(([k, v]) => { if (k.startsWith('f_') && v !== '') filters[k.slice(2)] = v; });
  res.json(await db.list(req.params.entity, { search, sort, dir, page, size, filters }));
}));
/** GET /api/data/:entity/:key — one record (SKY-DATA-004 if it does not exist). */
app.get('/api/data/:entity/:key', auth, entity, wrap(async (req, res) => {
  const row = await db.get(req.params.entity, req.params.key);
  if (!row) throw new AppError('SKY-DATA-004');
  res.json(row);
}));

// ------------------------------------------------------------------ write APIs (admin only, audited)
/** POST /api/data/:entity — create a record; required fields checked; audited as CREATE. */
app.post('/api/data/:entity', auth, adminOnly, entity, checkDemo, wrap(async (req, res) => {
  if (!req.e.writable) throw new AppError('SKY-DATA-005');
  const missing = Object.entries(req.e.columns).filter(([k, c]) => c.required && !c.view && (req.body[k] === undefined || req.body[k] === '')).map(([k]) => k);
  if (missing.length) throw new AppError('SKY-DATA-001', 'Required: ' + missing.join(', '));
  const key = await db.create(req.params.entity, req.body);
  await db.audit(req.session.user.name, req.params.entity, 'CREATE', key, req.body);
  res.json({ key });
}));
/** PUT /api/data/:entity/:key — update a record; the audit entry stores each field's before → after value. */
app.put('/api/data/:entity/:key', auth, adminOnly, entity, checkDemo, wrap(async (req, res) => {
  if (!req.e.writable) throw new AppError('SKY-DATA-005');
  const before = await db.get(req.params.entity, req.params.key);
  if (!before) throw new AppError('SKY-DATA-004');
  const n = await db.update(req.params.entity, req.params.key, req.body);
  const changes = {};
  Object.keys(req.body).forEach(k => { if (String(before[k] ?? '') !== String(req.body[k] ?? '')) changes[k] = { from: before[k] ?? null, to: req.body[k] }; });
  await db.audit(req.session.user.name, req.params.entity, 'UPDATE', req.params.key, changes);
  res.json({ updated: n });
}));
/** DELETE /api/data/:entity/:key — delete a record (blocked if linked records exist: SKY-DATA-003); audited with the old values. */
app.delete('/api/data/:entity/:key', auth, adminOnly, entity, wrap(async (req, res) => {
  if (!req.e.writable) throw new AppError('SKY-DATA-005');
  const before = await db.get(req.params.entity, req.params.key);
  if (!before) throw new AppError('SKY-DATA-004');
  const n = await db.remove(req.params.entity, req.params.key);
  await db.audit(req.session.user.name, req.params.entity, 'DELETE', req.params.key, before);
  res.json({ deleted: n });
}));

// ------------------------------------------------------------------ duplicate check
const DUP_CATS = ['Companies', 'Leads', 'WebPresence', 'Activities'];
/** cat — validates the duplicate category (?cat= or body.cat). */
function cat(req, res, next) { const c = (req.query.cat || (req.body || {}).cat || 'Companies'); if (!DUP_CATS.includes(c)) return next(new AppError('SKY-DATA-002', 'Unknown duplicate type.')); req.cat = c; next(); }
/** dupCompare — loads both sides of a suspected duplicate pair for the side-by-side screen. */
async function dupCompare(c, a, b) {
  if (c === 'Companies') return db.compareCompanies(a, b);
  if (c === 'Leads') return db.compareLeads(a, b);
  if (c === 'Activities') return db.compareActivities(a, b);
  const rows = await db.webRows(a); return { a: rows[0] || null, b: rows[1] || null, rows };
}
/** GET /api/duplicates/summary — counts per table and severity (menu badge, refreshed every 30 s). */
app.get('/api/duplicates/summary', auth, wrap(async (req, res) => res.json(await db.duplicateSummary())));
/** GET /api/duplicates/compare — both records of a pair (SKY-DATA-004 if already resolved). */
app.get('/api/duplicates/compare', auth, cat, wrap(async (req, res) => {
  const r = await dupCompare(req.cat, req.query.a, req.query.b);
  if (!r.a || !r.b) throw new AppError('SKY-DATA-004', 'This duplicate is already resolved (one of the records no longer exists).');
  res.json({ cat: req.cat, ...r });
}));
/** POST /api/duplicates/resolve — merge companies/leads, fix web-presence rows or remove a repeated activity; audited as MERGE. */
app.post('/api/duplicates/resolve', auth, adminOnly, cat, wrap(async (req, res) => {
  const { keepId, removeId } = req.body || {};
  const before = await dupCompare(req.cat, keepId, req.cat === 'WebPresence' ? keepId : removeId);
  if (!before.a || !before.b) throw new AppError('SKY-DATA-004', 'This duplicate is already resolved (one of the records no longer exists).');
  if (req.cat === 'Companies') await db.mergeCompanies(keepId, removeId);
  else if (req.cat === 'Leads') await db.mergeLeads(keepId, removeId);
  else if (req.cat === 'WebPresence') await db.fixWebPresence(keepId);
  else await db.removeActivity(removeId);
  const ent = { Companies: 'companies', Leads: 'leads', WebPresence: 'webpresence', Activities: 'activities' }[req.cat];
  await db.audit(req.session.user.name, ent, 'MERGE', req.cat === 'WebPresence' ? String(keepId) : `${keepId}<-${removeId}`, before.rows ? { rows: before.rows } : { kept: before.a, removed: before.b });
  res.json({ ok: true });
}));
/** POST /api/duplicates/dismiss — marks a company or activity pair as "not a duplicate"; audited as DISMISS. */
app.post('/api/duplicates/dismiss', auth, adminOnly, cat, wrap(async (req, res) => {
  if (!['Companies', 'Activities'].includes(req.cat)) throw new AppError('SKY-DATA-002', 'Leads and web-presence rows must be one per company, so these can only be fixed, not dismissed.');
  const { a, b } = req.body || {};
  await db.dismissDuplicate(req.cat, a, b, req.session.user.name);
  await db.audit(req.session.user.name, 'duplicates', 'DISMISS', `${req.cat}:${a}-${b}`, null);
  res.json({ ok: true });
}));

// ------------------------------------------------------------------ demo websites
const DEMO_DIR = process.env.DEMO_SITES_DIR || path.join(__dirname, '..', 'demo-sites');
/** PAGE_CSP — demo pages may load only Google Fonts and free-licence photos; no scripts at all. */
const PAGE_CSP = "default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src data: https://images.pexels.com https://images.unsplash.com; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
/** demoPage — loads a DemoSites record and renders its HTML (SKY-DATA-004 if missing). */
async function demoPage(id) {
  const s = await db.get('demosites', id);
  if (!s) throw new AppError('SKY-DATA-004', 'Demo site not found.');
  return { s, html: renderDemo(s) };
}
/** GET /demo/:id/preview — live preview built from the database record. */
app.get('/demo/:id/preview', auth, wrap(async (req, res) => {
  const { html } = await demoPage(req.params.id);
  res.set({ 'Content-Security-Policy': PAGE_CSP, 'Cache-Control': 'no-store' }).type('html').send(html);
}));
/** GET /api/demosites/:id/download — the finished page as a file. */
app.get('/api/demosites/:id/download', auth, wrap(async (req, res) => {
  const { s, html } = await demoPage(req.params.id);
  res.set('Content-Disposition', `attachment; filename="${String(s.Slug).replace(/[^a-z0-9-]/g, '')}.html"`).type('html').send(html);
}));
/** POST /api/demosites/:id/save — writes demo-sites/<slug>/index.html (slug sanitised; SKY-CFG-005 if folder missing); audited as EXPORT. */
app.post('/api/demosites/:id/save', auth, adminOnly, wrap(async (req, res) => {
  const { s, html } = await demoPage(req.params.id);
  const slug = String(s.Slug || '').replace(/[^a-z0-9-]/g, '');
  if (!slug) throw new AppError('SKY-DATA-002', 'This demo has no valid Slug.');
  if (!fs.existsSync(DEMO_DIR)) throw new AppError('SKY-CFG-005');
  const dir = path.join(DEMO_DIR, slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  await db.audit(req.session.user.name, 'demosites', 'EXPORT', String(s.DemoID), { file: `demo-sites/${slug}/index.html` });
  res.json({ file: `demo-sites/${slug}/index.html` });
}));

// ------------------------------------------------------------------ logins (Admin site "Logins" screen + "Change my password")
// Rules: admins only (except changing your own password); every change needs the acting admin's own password again
// (re-authentication, SKY-AUTH-007); new passwords follow the policy (SKY-AUTH-006); there must always be at least one
// active admin and you cannot disable or demote yourself (SKY-AUTH-008); every change is audited (entity "users")
// and ends the affected login's open sessions. Password hashes never leave the server.
const ROLES = ['admin', 'viewer'];
/** confirmMe — re-checks the signed-in admin's own password; wrong attempts count towards the lockout. */
async function confirmMe(req, password) {
  const me = await db.getUserById(req.session.user.id);
  const locked = guard.check(req.session.user.name, req.ip);
  if (locked) throw locked;
  if (!me || !(await bcrypt.compare(String(password || ''), me.PasswordHash))) {
    guard.fail(req.session.user.name, req.ip);
    log.security('Confirmation password wrong', { code: 'SKY-AUTH-007', user: req.session.user.name, ip: req.ip, reqId: req.id });
    throw new AppError('SKY-AUTH-007');
  }
  return me;
}
/** checkNewPassword — applies the password policy (SKY-AUTH-006 lists what is missing). */
function checkNewPassword(pw, username) {
  const probs = sec.passwordPolicy(pw, username);
  if (probs.length) throw new AppError('SKY-AUTH-006', 'Password needs: ' + probs.join(', ') + '.');
}
/** activeAdminsAfter — how many active admins remain if login id gets role/isActive. */
async function activeAdminsAfter(id, role, isActive) {
  return (await db.listUsers()).filter(u => (u.UserID === id ? role === 'admin' && isActive : u.Role === 'admin' && u.IsActive)).length;
}
/** GET /api/users — all logins (no hashes). */
app.get('/api/users', auth, adminOnly, wrap(async (req, res) => res.json({ rows: await db.listUsers(), me: req.session.user.id })));
/** POST /api/users — create a login {username, role, password, myPassword}. */
app.post('/api/users', auth, adminOnly, wrap(async (req, res) => {
  const b = req.body || {};
  const username = String(b.username || '').trim();
  if (!/^[A-Za-z0-9._-]{3,50}$/.test(username)) throw new AppError('SKY-DATA-002', 'Username: 3-50 letters, numbers, dot, dash or underscore.');
  if (!ROLES.includes(b.role)) throw new AppError('SKY-DATA-002', 'Role must be admin or viewer.');
  await confirmMe(req, b.myPassword);
  checkNewPassword(b.password, username);
  const id = await db.addUser(username, await bcrypt.hash(String(b.password), 12), b.role);
  await db.audit(req.session.user.name, 'users', 'CREATE', String(id), { username, role: b.role });
  log.security('Login created', { user: req.session.user.name, target: username, role: b.role, reqId: req.id }, 'info');
  res.json({ ok: true, id });
}));
/** PUT /api/users/:id — change role and/or active flag {role, isActive, myPassword}. */
app.put('/api/users/:id', auth, adminOnly, wrap(async (req, res) => {
  const id = parseInt(req.params.id, 10), b = req.body || {};
  const u = await db.getUserById(id);
  if (!u) throw new AppError('SKY-DATA-004', 'This login no longer exists.');
  const role = b.role === undefined ? u.Role : b.role, isActive = b.isActive === undefined ? !!u.IsActive : !!b.isActive;
  if (!ROLES.includes(role)) throw new AppError('SKY-DATA-002', 'Role must be admin or viewer.');
  if (id === req.session.user.id && (role !== 'admin' || !isActive)) throw new AppError('SKY-AUTH-008', 'You cannot disable your own login or remove your own admin role.');
  if ((await activeAdminsAfter(id, role, isActive)) < 1) throw new AppError('SKY-AUTH-008');
  await confirmMe(req, b.myPassword);
  await db.updateUser(id, role, isActive);
  bumpEpoch(id);
  await db.audit(req.session.user.name, 'users', 'UPDATE', String(id), { username: u.Username, before: { role: u.Role, isActive: !!u.IsActive }, after: { role, isActive } });
  log.security('Login changed', { user: req.session.user.name, target: u.Username, role, isActive, reqId: req.id }, 'info');
  res.json({ ok: true });
}));
/** POST /api/users/:id/password — an admin sets a new password for a login {password, myPassword}. */
app.post('/api/users/:id/password', auth, adminOnly, wrap(async (req, res) => {
  const id = parseInt(req.params.id, 10), b = req.body || {};
  const u = await db.getUserById(id);
  if (!u) throw new AppError('SKY-DATA-004', 'This login no longer exists.');
  await confirmMe(req, b.myPassword);
  checkNewPassword(b.password, u.Username);
  await db.setPassword(id, await bcrypt.hash(String(b.password), 12));
  if (id !== req.session.user.id) bumpEpoch(id);
  await db.audit(req.session.user.name, 'users', 'PASSWORD', String(id), { username: u.Username, by: 'admin reset' });
  log.security('Password reset by admin', { user: req.session.user.name, target: u.Username, reqId: req.id }, 'info');
  res.json({ ok: true });
}));
/** POST /api/me/password — any signed-in user changes their own password {currentPassword, newPassword}. */
app.post('/api/me/password', auth, wrap(async (req, res) => {
  const b = req.body || {};
  await confirmMe(req, b.currentPassword);
  checkNewPassword(b.newPassword, req.session.user.name);
  await db.setPassword(req.session.user.id, await bcrypt.hash(String(b.newPassword), 12));
  await db.audit(req.session.user.name, 'users', 'PASSWORD', String(req.session.user.id), { username: req.session.user.name, by: 'self' });
  log.security('Password changed by its owner', { user: req.session.user.name, reqId: req.id }, 'info');
  res.json({ ok: true });
}));

// ------------------------------------------------------------------ project documents (signed-in users)
/** /docs — serves docs/architecture (Troubleshooting Guide, Security, Code docs) so log codes can link to fixes. */
app.use('/docs', auth, express.static(path.join(__dirname, '..', 'docs', 'architecture'), { dotfiles: 'deny', index: false }));

// ------------------------------------------------------------------ static files, unknown API paths, errors
app.use(express.static(path.join(__dirname, 'public'), { index: 'index.html', dotfiles: 'deny' }));
app.use('/api', (req, res, next) => next(new AppError('SKY-DATA-006', 'Unknown address.')));

/**
 * Central error handler — turns every error into { error, code, requestId, hint } and logs it.
 * 5xx errors log the stack (log only, never sent to the browser); 4xx are logged as warnings/info.
 */
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  let e = err;
  if (!(e instanceof AppError)) {
    if (err.type === 'entity.too.large') e = new AppError('SKY-SEC-003');
    else if (err.type === 'entity.parse.failed') e = new AppError('SKY-DATA-002', 'The request was not valid JSON.');
    else if (err.number || err.originalError || /^E[A-Z]+$/.test(err.code || '')) e = fromDbError(err);
    else if (err.code === 'ENOSPC') e = new AppError('SKY-SYS-002');
    else e = new AppError('SKY-SYS-001', undefined, { message: err.message });
  }
  res.locals.code = e.code;
  const fields = { code: e.code, reqId: req.id, user: req.session && req.session.user && req.session.user.name, path: req.path, status: e.status, details: e.details };
  if (e.status >= 500) log.error('error', e.message, { ...fields, stack: String(err.stack || '').split('\n').slice(0, 6).join(' | ') });
  else if (!['SKY-AUTH-004', 'SKY-AUTH-003'].includes(e.code)) log.warn('error', e.message, fields);
  if (req.path.startsWith('/demo/')) return res.status(e.status).type('text').send(`${e.code}: ${e.message} (ref ${req.id})`);
  res.status(e.status).json({ error: e.message, code: e.code, requestId: req.id, hint: e.hint });
});

process.on('unhandledRejection', r => log.error('process', 'Unhandled promise rejection', { code: 'SKY-SYS-001', details: { message: String(r && r.message || r) } }));
process.on('uncaughtException', e => { log.error('process', 'Uncaught exception', { code: 'SKY-SYS-001', details: { message: e.message, stack: String(e.stack).slice(0, 800) } }); process.exit(1); });

// ------------------------------------------------------------------ start
db.init().then(() => {
  const server = app.listen(PORT, CFG.host, () => {
    log.info('startup', `SkyTech Admin site ${VERSION} running on http://${CFG.host === '0.0.0.0' ? 'localhost' : CFG.host}:${PORT} [data: ${db.name}]`);
    if (DEMO) console.log('DEMO mode: sample data in memory, login admin / ' + (process.env.DEMO_ADMIN_PASSWORD || 'demo1234') + ' (viewer / same password = read-only)');
  });
  server.on('error', e => fatal(e.code === 'EADDRINUSE' ? new AppError('SKY-CFG-006', `Port ${PORT} is already in use.`) : e));
}).catch(e => fatal(e.code === 'MODULE_NOT_FOUND' || /msnodesqlv8/.test(e.message) ? new AppError('SKY-DB-002', e.message) : fromDbError(e)));

// Version: V2.1 (2026-10-10) — admin-site/server.js — V2.1
