// Version: V1.1 (2026-10-02) — admin-site/server.js — V1.1
// SkyTech Admin site: login, dashboard, drill-down and CRUD for SkyTechCRM.
// Start: "npm start" (SQL Server)  |  "npm run demo" (no database, sample data)
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const { ENTITIES, STATUSES, ACTIVITY_TYPES, AGENTS } = require('./src/schema');

const DEMO = process.argv.includes('--demo') || process.env.DEMO === '1';
const db = DEMO ? require('./src/db/memory') : require('./src/db/mssql');
const PORT = parseInt(process.env.PORT, 10) || 3030;
const HOST = process.env.HOST || '127.0.0.1';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '200kb' }));
app.use((req, res, next) => {
  res.set({ 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'same-origin' });
  next();
});
app.use(session({
  name: 'skytech.sid',
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  resave: false, saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'strict', secure: process.env.COOKIE_SECURE === '1', maxAge: 8 * 3600 * 1000 }
}));

// ---- login (with simple brute-force protection)
const attempts = new Map();
function tooMany(ip) { const a = attempts.get(ip); return a && a.n >= 5 && Date.now() - a.t < 15 * 60 * 1000; }
function fail(ip) { const a = attempts.get(ip) || { n: 0, t: Date.now() }; a.n++; a.t = Date.now(); attempts.set(ip, a); }

app.post('/api/login', async (req, res) => {
  const ip = req.ip;
  if (tooMany(ip)) return res.status(429).json({ error: 'Too many attempts. Wait 15 minutes.' });
  const { username, password } = req.body || {};
  try {
    const u = username && await db.getUser(String(username));
    if (!u || !u.IsActive || !(await bcrypt.compare(String(password || ''), u.PasswordHash))) {
      fail(ip); return res.status(401).json({ error: 'Wrong username or password.' });
    }
    attempts.delete(ip);
    req.session.regenerate(async () => {
      req.session.user = { id: u.UserID, name: u.Username, role: u.Role };
      await db.touchLogin(u.UserID); await db.audit(u.Username, 'session', 'LOGIN', null, null);
      res.json({ user: req.session.user });
    });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Login failed: ' + e.message }); }
});
app.post('/api/logout', (req, res) => req.session.destroy(() => res.json({ ok: true })));

function auth(req, res, next) { if (req.session.user) return next(); res.status(401).json({ error: 'Please log in.' }); }
function adminOnly(req, res, next) { if (req.session.user.role === 'admin') return next(); res.status(403).json({ error: 'Read-only account.' }); }
function entity(req, res, next) { const e = ENTITIES[req.params.entity]; if (!e) return res.status(404).json({ error: 'Unknown table.' }); req.e = e; next(); }
const wrap = fn => (req, res) => fn(req, res).catch(e => { console.error(e.message); res.status(400).json({ error: e.message }); });

app.get('/api/me', auth, (req, res) => res.json({ user: req.session.user, mode: db.name }));
app.get('/api/meta', auth, (req, res) => res.json({ entities: ENTITIES, statuses: STATUSES, activityTypes: ACTIVITY_TYPES, agents: AGENTS }));
app.get('/api/dashboard', auth, wrap(async (req, res) => res.json(await db.dashboard())));

app.get('/api/data/:entity', auth, entity, wrap(async (req, res) => {
  const { search, sort, dir, page, size, ...rest } = req.query;
  const filters = {};
  Object.entries(rest).forEach(([k, v]) => { if (k.startsWith('f_') && v !== '') filters[k.slice(2)] = v; });
  res.json(await db.list(req.params.entity, { search, sort, dir, page, size, filters }));
}));
app.get('/api/data/:entity/:key', auth, entity, wrap(async (req, res) => {
  const row = await db.get(req.params.entity, req.params.key);
  if (!row) return res.status(404).json({ error: 'Not found.' });
  res.json(row);
}));
app.post('/api/data/:entity', auth, adminOnly, entity, wrap(async (req, res) => {
  if (!req.e.writable) return res.status(405).json({ error: 'This view is read-only.' });
  const missing = Object.entries(req.e.columns).filter(([k, c]) => c.required && !c.view && (req.body[k] === undefined || req.body[k] === '')).map(([k]) => k);
  if (missing.length) return res.status(400).json({ error: 'Required: ' + missing.join(', ') });
  const key = await db.create(req.params.entity, req.body);
  await db.audit(req.session.user.name, req.params.entity, 'CREATE', key, req.body);
  res.json({ key });
}));
app.put('/api/data/:entity/:key', auth, adminOnly, entity, wrap(async (req, res) => {
  if (!req.e.writable) return res.status(405).json({ error: 'This view is read-only.' });
  const before = await db.get(req.params.entity, req.params.key);
  if (!before) return res.status(404).json({ error: 'Not found.' });
  const n = await db.update(req.params.entity, req.params.key, req.body);
  const changes = {};
  Object.keys(req.body).forEach(k => { if (String(before[k] ?? '') !== String(req.body[k] ?? '')) changes[k] = { from: before[k] ?? null, to: req.body[k] }; });
  await db.audit(req.session.user.name, req.params.entity, 'UPDATE', req.params.key, changes);
  res.json({ updated: n });
}));
app.delete('/api/data/:entity/:key', auth, adminOnly, entity, wrap(async (req, res) => {
  if (!req.e.writable) return res.status(405).json({ error: 'This view is read-only.' });
  const before = await db.get(req.params.entity, req.params.key);
  if (!before) return res.status(404).json({ error: 'Not found.' });
  const n = await db.remove(req.params.entity, req.params.key);
  await db.audit(req.session.user.name, req.params.entity, 'DELETE', req.params.key, before);
  res.json({ deleted: n });
}));

// ---- duplicate review: compare, merge (keep one, remove the other), dismiss
app.get('/api/duplicates/compare', auth, wrap(async (req, res) => {
  const r = await db.compareCompanies(req.query.a, req.query.b);
  if (!r.a || !r.b) return res.status(404).json({ error: 'One of these companies no longer exists.' });
  res.json(r);
}));
app.post('/api/duplicates/merge', auth, adminOnly, wrap(async (req, res) => {
  const { keepId, removeId } = req.body || {};
  const before = await db.compareCompanies(keepId, removeId);
  if (!before.a || !before.b) return res.status(404).json({ error: 'One of these companies no longer exists.' });
  await db.mergeCompanies(keepId, removeId);
  await db.audit(req.session.user.name, 'companies', 'MERGE', `${keepId}<-${removeId}`, { kept: before.a, removed: before.b });
  res.json({ kept: keepId, removed: removeId });
}));
app.post('/api/duplicates/dismiss', auth, adminOnly, wrap(async (req, res) => {
  const { a, b } = req.body || {};
  await db.dismissDuplicate(a, b, req.session.user.name);
  await db.audit(req.session.user.name, 'duplicates', 'DISMISS', `${a}-${b}`, null);
  res.json({ ok: true });
}));

app.use(express.static(path.join(__dirname, 'public'), { index: 'index.html' }));

db.init().then(() => {
  app.listen(PORT, HOST, () => {
    console.log(`SkyTech Admin site running: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}  [data: ${db.name}]`);
    if (DEMO) console.log('DEMO mode: sample data in memory, login admin / ' + (process.env.DEMO_ADMIN_PASSWORD || 'demo1234') + ' (viewer / same password = read-only)');
  });
}).catch(e => {
  console.error('Could not connect to the database: ' + e.message);
  console.error('Check .env (DB_SERVER, DB_AUTH, DB_DRIVER) or try "npm run demo".');
  process.exit(1);
});
