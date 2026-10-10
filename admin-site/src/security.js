// Version: V1.0 (2026-10-10) — admin-site/src/security.js — V1.0
/**
 * @file Security controls for the Admin site (one place to review them all).
 * Purpose: implements the controls described in docs/architecture/SkyTech_Security_Architecture:
 *   1. checkConfig    — refuses to start with unsafe settings (weak SESSION_SECRET, open network without HTTPS).
 *   2. headers        — browser security headers: strict Content-Security-Policy, no framing, no sniffing, HSTS on HTTPS.
 *   3. requestId      — gives every request a reference (X-Request-Id) shown to the user and written to the log.
 *   4. rateLimit      — limits requests per computer (IP) per minute; stricter for writes.
 *   5. originCheck    — blocks state-changing requests sent from other websites.
 *   6. csrf           — per-session anti-forgery token required on every POST/PUT/DELETE.
 *   7. sessionTimeout — signs users out after SESSION_IDLE_MIN of inactivity and after SESSION_MAX_HOURS.
 *   8. loginGuard     — locks a username or computer for 15 minutes after 5 wrong passwords.
 *   9. passwordPolicy — rules for new passwords (used by scripts/create-admin.js).
 * Inputs:  environment settings (see .env.example); logger; AppError.
 * Errors:  SKY-CFG-002/003 at start; SKY-SEC-001/002/007 and SKY-AUTH-002/003 at run time.
 */
'use strict';
const crypto = require('crypto');
const log = require('./logger');
const { AppError } = require('./errors');

const isLoopback = h => ['127.0.0.1', 'localhost', '::1'].includes(String(h || '').trim());
const num = (v, d) => { const n = parseInt(v, 10); return Number.isFinite(n) && n > 0 ? n : d; };

/**
 * checkConfig — validates security-relevant settings before the server starts.
 * Returns { secret, secure } or throws AppError (the server prints it and exits).
 * Demo mode may run without a secret (a random one is generated for that run).
 */
function checkConfig({ demo }) {
  const host = process.env.HOST || '127.0.0.1';
  const secure = process.env.COOKIE_SECURE === '1';
  let secret = process.env.SESSION_SECRET || '';
  const weak = secret.length < 32 || /change-this/i.test(secret);
  if (weak) {
    if (!demo) throw new AppError('SKY-CFG-002', 'SESSION_SECRET in admin-site\\.env is missing or weak (needs 32+ random characters). Run: npm run doctor -- --new-secret');
    secret = crypto.randomBytes(32).toString('hex');
  }
  if (!isLoopback(host) && !secure) throw new AppError('SKY-CFG-003', `HOST=${host} opens the site to the network; set COOKIE_SECURE=1 behind HTTPS or use HOST=127.0.0.1.`);
  return { secret, secure, host };
}

/** cookieName — "__Host-" prefix on HTTPS (browser-enforced: secure, no domain, path /). */
const cookieName = secure => (secure ? '__Host-skytech' : 'skytech.sid');

/** APP_CSP — policy for the Admin screens: only this site's own scripts, no inline script, no framing. */
const APP_CSP = ["default-src 'self'", "script-src 'self'", "style-src 'self' 'unsafe-inline'", "img-src 'self' data:",
  "connect-src 'self'", "font-src 'self'", "object-src 'none'", "base-uri 'none'", "form-action 'self'", "frame-ancestors 'none'"].join('; ');

/** headers — adds security headers to every response; API responses are never cached. */
function headers(secure) {
  return (req, res, next) => {
    res.set({
      'Content-Security-Policy': APP_CSP,
      'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'same-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
      'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Resource-Policy': 'same-origin'
    });
    if (secure) res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    if (req.path.startsWith('/api/')) res.set('Cache-Control', 'no-store');
    next();
  };
}

/** requestId — 12-character reference for each request; logged and returned in X-Request-Id and error bodies. */
function requestId(req, res, next) {
  req.id = crypto.randomBytes(6).toString('hex');
  res.set('X-Request-Id', req.id);
  const t0 = process.hrtime.bigint();
  res.on('finish', () => {
    if (!req.path.startsWith('/api/') && !req.path.startsWith('/demo/')) return;
    const ms = Number(process.hrtime.bigint() - t0) / 1e6;
    let lvl = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'debug';
    if (res.locals.code === 'SKY-AUTH-004') lvl = 'debug'; // routine "not signed in yet" check on page load
    log[lvl]('http', `${req.method} ${req.path} → ${res.statusCode}`, { reqId: req.id, user: req.session && req.session.user && req.session.user.name, ip: req.ip, status: res.statusCode, ms: Math.round(ms), code: res.locals.code });
  });
  next();
}

/**
 * rateLimit — fixed-window limiter in memory, per IP.
 * Defaults: 300 requests/minute overall, 60 writes/minute (RATE_LIMIT_PER_MIN, RATE_LIMIT_WRITES_PER_MIN).
 */
function rateLimit() {
  const all = num(process.env.RATE_LIMIT_PER_MIN, 300), writes = num(process.env.RATE_LIMIT_WRITES_PER_MIN, 60);
  const hits = new Map();
  setInterval(() => hits.clear(), 60000).unref();
  return (req, res, next) => {
    const isWrite = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
    const k = req.ip, h = hits.get(k) || { a: 0, w: 0 };
    h.a++; if (isWrite) h.w++; hits.set(k, h);
    if (h.a > all || (isWrite && h.w > writes)) {
      if (h.a === all + 1 || h.w === writes + 1) log.security('Rate limit exceeded', { code: 'SKY-SEC-002', ip: req.ip, reqId: req.id, path: req.path });
      return next(new AppError('SKY-SEC-002'));
    }
    next();
  };
}

/** originCheck — rejects writes whose Origin/Referer belongs to another site (defence in depth with SameSite cookies). */
function originCheck(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const src = req.get('origin') || req.get('referer');
  if (!src) return next(); // non-browser tools (curl) send none; CSRF token still required below
  try {
    if (new URL(src).host === req.get('host')) return next();
  } catch (_) { /* malformed header → block */ }
  log.security('Cross-site request blocked', { code: 'SKY-SEC-007', ip: req.ip, reqId: req.id, origin: src, path: req.path });
  next(new AppError('SKY-SEC-007'));
}

/** issueCsrf — creates (once per session) and returns the anti-forgery token. */
function issueCsrf(req) {
  if (!req.session.csrf) req.session.csrf = crypto.randomBytes(24).toString('hex');
  return req.session.csrf;
}

/** csrf — requires header X-CSRF-Token = session token on POST/PUT/DELETE (login is exempt; it has no session yet). */
function csrf(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || req.path === '/api/login') return next();
  const sent = Buffer.from(String(req.get('x-csrf-token') || ''));
  const want = Buffer.from(String((req.session && req.session.csrf) || ''));
  if (want.length && sent.length === want.length && crypto.timingSafeEqual(sent, want)) return next();
  log.security('CSRF token missing or invalid', { code: 'SKY-SEC-001', ip: req.ip, reqId: req.id, path: req.path, user: req.session && req.session.user && req.session.user.name });
  next(new AppError('SKY-SEC-001'));
}

/**
 * sessionTimeout — idle timeout (SESSION_IDLE_MIN, default 30) and absolute lifetime (SESSION_MAX_HOURS, default 8).
 * Expired sessions are destroyed and the request continues as "not signed in" (SKY-AUTH-003 on protected routes).
 */
function sessionTimeout() {
  const idle = num(process.env.SESSION_IDLE_MIN, 30) * 60000, max = num(process.env.SESSION_MAX_HOURS, 8) * 3600000;
  return (req, res, next) => {
    const s = req.session;
    if (!s || !s.user) return next();
    const now = Date.now();
    if (now - (s.lastSeen || now) > idle || now - (s.started || now) > max) {
      const user = s.user.name;
      return s.destroy(() => { log.security('Session expired', { code: 'SKY-AUTH-003', user, ip: req.ip, reqId: req.id }, 'info'); req.expired = true; next(); });
    }
    s.lastSeen = now;
    next();
  };
}

/**
 * loginGuard — counts wrong passwords per username and per IP; 5 failures within 15 minutes lock that key.
 * check(user, ip) → AppError | null;  fail(user, ip);  ok(user, ip).
 */
function loginGuard() {
  const LIMIT = 5, WINDOW = 15 * 60000, fails = new Map();
  const locked = k => { const a = fails.get(k); return a && a.n >= LIMIT && Date.now() - a.t < WINDOW; };
  const bump = k => { const a = fails.get(k); const fresh = !a || Date.now() - a.t >= WINDOW; const n = fresh ? 1 : a.n + 1; fails.set(k, { n, t: Date.now() }); return n; };
  return {
    check: (user, ip) => (locked('u:' + String(user).toLowerCase()) || locked('ip:' + ip) ? new AppError('SKY-AUTH-002') : null),
    fail: (user, ip) => { const n = Math.max(bump('u:' + String(user).toLowerCase()), bump('ip:' + ip)); return n >= LIMIT; },
    ok: (user, ip) => { fails.delete('u:' + String(user).toLowerCase()); fails.delete('ip:' + ip); }
  };
}

const COMMON = ['password', 'password1', '123456', '12345678', '123456789', 'qwerty', 'letmein', 'welcome', 'admin', 'skytech', 'iloveyou', 'monkey', 'dragon', 'baltimore', 'maryland'];
/**
 * passwordPolicy — returns a list of problems (empty = acceptable).
 * Rules: 12+ characters, upper and lower case, a digit, not containing the username, not a common password.
 */
function passwordPolicy(pw, username = '') {
  const p = String(pw || ''), probs = [];
  if (p.length < 12) probs.push('at least 12 characters');
  if (!/[a-z]/.test(p) || !/[A-Z]/.test(p)) probs.push('upper and lower case letters');
  if (!/\d/.test(p)) probs.push('at least one number');
  if (username && p.toLowerCase().includes(String(username).toLowerCase())) probs.push('must not contain the username');
  if (COMMON.some(c => p.toLowerCase().replace(/[^a-z0-9]/g, '').startsWith(c) && p.length < 16)) probs.push('must not be a common password');
  return probs;
}

module.exports = { checkConfig, cookieName, headers, requestId, rateLimit, originCheck, issueCsrf, csrf, sessionTimeout, loginGuard, passwordPolicy, APP_CSP };

// Version: V1.0 (2026-10-10) — admin-site/src/security.js — V1.0
