// Version: V1.1 (2026-10-10) — admin-site/src/logger.js — V1.1
/**
 * @file Structured logging for the Admin site and its scripts.
 * Purpose: writes one JSON line per event to logs/runtime/admin-YYYY-MM-DD.log (one file per day) and a short
 *          readable line to the screen. Every line has a time, level, category, SkyTech error code (if any) and the
 *          request reference shown to the user, so a problem on screen can be found in the log in seconds.
 * Security: values of sensitive fields (passwords, hashes, secrets, tokens, cookies) are replaced by "[redacted]"
 *          before writing. Logs stay on this computer (folder is git-ignored) and are deleted after LOG_RETENTION_DAYS.
 * Inputs:  env LOG_DIR (default <repo>/logs/runtime), LOG_LEVEL (debug|info|warn|error, default info),
 *          LOG_RETENTION_DAYS (default 30).
 * Outputs: log files; functions debug/info/warn/error/security.
 * Errors:  if the folder cannot be written the logger keeps running and only prints to the screen (SKY-SYS-003).
 */
'use strict';
const fs = require('fs');
const path = require('path');

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const DIR = process.env.LOG_DIR || path.join(__dirname, '..', '..', 'logs', 'runtime');
const MIN = LEVELS[(process.env.LOG_LEVEL || 'info').toLowerCase()] || LEVELS.info;
const KEEP_DAYS = parseInt(process.env.LOG_RETENTION_DAYS, 10) || 30;
const SENSITIVE = /pass(word)?|hash|secret|token|cookie|authorization|csrf/i;
let fileOk = true;

/** ensureDir — creates the log folder; on failure switches to screen-only logging (SKY-SYS-003). */
function ensureDir() {
  try { fs.mkdirSync(DIR, { recursive: true }); fs.accessSync(DIR, fs.constants.W_OK); }
  catch (e) { fileOk = false; console.warn(`[SKY-SYS-003] Log folder ${DIR} cannot be written (${e.code}); logging to screen only.`); }
}

/** redact — deep-copies a value replacing sensitive keys with "[redacted]" (max depth 4 to stay small). */
function redact(v, depth = 0) {
  if (v == null || typeof v !== 'object' || depth > 4) return typeof v === 'string' && v.length > 2000 ? v.slice(0, 2000) + '…' : v;
  if (Array.isArray(v)) return v.slice(0, 50).map(x => redact(x, depth + 1));
  const out = {};
  for (const [k, val] of Object.entries(v)) out[k] = SENSITIVE.test(k) ? '[redacted]' : redact(val, depth + 1);
  return out;
}

/** fileFor — today's log file name for a prefix ("admin", "doctor", "scripts"). */
const fileFor = (prefix = 'admin') => path.join(DIR, `${prefix}-${new Date().toISOString().slice(0, 10)}.log`);

/**
 * write — the single place that records an event.
 * level: debug|info|warn|error; category: e.g. http, auth, security, db, demo, startup;
 * msg: short text; fields: extra data (code, reqId, user, ip, status, details…).
 */
function write(level, category, msg, fields = {}, prefix = 'admin') {
  if ((LEVELS[level] || 20) < MIN) return;
  const entry = { ts: new Date().toISOString(), level, category, msg, ...redact(fields) };
  const line = JSON.stringify(entry);
  if (fileOk) {
    try { fs.appendFileSync(fileFor(prefix), line + '\n'); }
    catch (e) { fileOk = false; console.warn(`[SKY-SYS-003] Cannot write log file (${e.code}); logging to screen only.`); }
  }
  if (level !== 'debug') {
    const tag = fields.code ? ` [${fields.code}]` : '';
    const ref = fields.reqId ? ` ref ${fields.reqId}` : '';
    (level === 'error' ? console.error : console.log)(`${entry.ts.slice(11, 19)} ${level.toUpperCase()} ${category}${tag}${ref}: ${msg}`);
  }
}

/** prune — deletes log files older than LOG_RETENTION_DAYS (runs at start and once a day). */
function prune() {
  if (!fileOk) return;
  const cutoff = Date.now() - KEEP_DAYS * 864e5;
  try {
    for (const f of fs.readdirSync(DIR)) {
      if (!/^(admin|doctor|scripts)-\d{4}-\d{2}-\d{2}\.log$/.test(f)) continue;
      const p = path.join(DIR, f);
      if (fs.statSync(p).mtimeMs < cutoff) fs.unlinkSync(p);
    }
  } catch (e) { /* pruning is best-effort */ }
}

/** tail — newest n log entries (admin, doctor and scripts logs of the last 3 days, merged by time) for the System log screen. */
function tail(n = 200, minLevel = 'info') {
  const days = [...new Set((fileOk ? fs.readdirSync(DIR) : []).map(f => (f.match(/-(\d{4}-\d{2}-\d{2})\.log$/) || [])[1]).filter(Boolean))].sort().slice(-3);
  const files = fileOk ? fs.readdirSync(DIR).filter(f => /^(admin|doctor|scripts)-/.test(f) && days.some(d => f.endsWith(d + '.log'))) : [];
  const rows = [];
  for (const f of files) {
    for (const l of fs.readFileSync(path.join(DIR, f), 'utf8').split('\n')) {
      if (!l) continue;
      try { const e = JSON.parse(l); if ((LEVELS[e.level] || 0) >= (LEVELS[minLevel] || 0)) rows.push(e); } catch (_) { /* skip broken line */ }
    }
  }
  rows.sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0));
  return rows.slice(-n).reverse();
}

ensureDir(); prune();
setInterval(prune, 864e5).unref();

module.exports = {
  DIR, redact, tail, prune, fileFor,
  debug: (c, m, f) => write('debug', c, m, f), info: (c, m, f) => write('info', c, m, f),
  warn: (c, m, f) => write('warn', c, m, f), error: (c, m, f) => write('error', c, m, f),
  /** security — security events (sign-in, lockout, CSRF, rate limit, permission) always at warn or info. */
  security: (m, f = {}, level = 'warn') => write(level, 'security', m, f),
  /** to — logger that writes to another file prefix (used by doctor and scripts). */
  to: prefix => ({ info: (c, m, f) => write('info', c, m, f, prefix), warn: (c, m, f) => write('warn', c, m, f, prefix), error: (c, m, f) => write('error', c, m, f, prefix) })
};

// Version: V1.1 (2026-10-10) — admin-site/src/logger.js — V1.1
