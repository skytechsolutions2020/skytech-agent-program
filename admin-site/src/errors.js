// Version: V1.1 (2026-10-10) — admin-site/src/errors.js — V1.1
/**
 * @file Error codes for the Admin site.
 * Purpose: one place that turns any failure into a SkyTech error code (SKY-<AREA>-<NNN>) with a plain message,
 *          an HTTP status and a fix hint. Codes, titles and fixes come from config/error-codes.json, the same
 *          catalog that builds the Troubleshooting Guide, so screen, log and guide always agree.
 * Inputs:  config/error-codes.json (falls back to a tiny built-in list if the file is missing).
 * Outputs: AppError objects; fromDbError() maps SQL Server error numbers to codes.
 * Used by: server.js (central error handler), src/db/mssql.js, scripts/doctor.js.
 */
'use strict';
const fs = require('fs');
const path = require('path');

/** loadCatalog — reads the error catalog once; returns a Map code → entry. */
function loadCatalog() {
  const file = path.join(__dirname, '..', '..', 'config', 'error-codes.json');
  try {
    const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
    return new Map(doc.codes.map(c => [c.code, c]));
  } catch (e) {
    // Catalog missing (e.g. admin-site copied alone to a host): keep working with generic text.
    return new Map([['SKY-SYS-001', { code: 'SKY-SYS-001', title: 'Unexpected error', http: 500, fix: ['See the admin log'] }]]);
  }
}
const CATALOG = loadCatalog();

/**
 * AppError — an error that carries a SkyTech code.
 * code: catalog code; message: text for the user (defaults to the catalog title);
 * details: extra facts for the log only (never shown to the user).
 */
class AppError extends Error {
  constructor(code, message, details) {
    const entry = CATALOG.get(code) || CATALOG.get('SKY-SYS-001');
    super(message || entry.user || entry.title);
    this.code = entry.code;
    this.status = entry.http || 500;
    this.details = details;
    this.hint = (entry.fix || [])[0] || '';
  }
}

/** info — returns the catalog entry for a code (or undefined). */
const info = code => CATALOG.get(code);

/**
 * fromDbError — converts a SQL Server / driver error into an AppError.
 * Looks at the SQL error number (err.number or err.originalError.info.number) and driver codes.
 */
function fromDbError(err) {
  if (err instanceof AppError) return err;
  const n = err && (err.number || (err.originalError && err.originalError.info && err.originalError.info.number));
  const msg = String((err && err.message) || '');
  const details = { sqlNumber: n, sqlMessage: msg.slice(0, 500), driverCode: err && err.code };
  if (n === 2601 || n === 2627) return new AppError('SKY-DUP-001', 'Duplicate: this record already exists (same source ID, same company name and ZIP, or a second row for the same company).', details);
  if (n === 547) return new AppError('SKY-DATA-003', 'This record is linked to other records (leads, web presence, demo sites or activities). Change or delete those first.', details);
  if (n === 50001 || n === 50002) return new AppError('SKY-DUP-005', msg || undefined, details);
  if (n === 50011 || n === 50012) return new AppError('SKY-DUP-002', msg || undefined, details);
  if (n === 50021) return new AppError('SKY-DUP-003', msg || undefined, details);
  if (n === 50100) return new AppError('SKY-SEC-006', undefined, details);
  if (n === 208 || n === 2812) return new AppError('SKY-DB-005', 'A database object is missing. Run the SQL scripts again (01 → import → 04 → 05 → 06) or npm run doctor.', details);
  if (n === 229 || n === 230) return new AppError('SKY-DB-008', undefined, details);
  if (n === 4060) return new AppError('SKY-DB-004', undefined, details);
  if (n === 18456) return new AppError('SKY-DB-006', undefined, details);
  if (n === 8152 || n === 2628) return new AppError('SKY-DATA-002', 'A value is too long for its field. Shorten it and save again.', details);
  if (err && (err.code === 'ETIMEOUT' || /timeout/i.test(msg))) return new AppError('SKY-DB-007', undefined, details);
  if (err && (err.code === 'ESOCKET' || err.code === 'ECONNCLOSED' || err.code === 'ELOGIN' || /connect/i.test(msg))) return new AppError('SKY-DB-001', undefined, details);
  if (/IM002|Data source name not found/i.test(msg)) return new AppError('SKY-DB-003', undefined, details);
  return new AppError('SKY-DB-009', undefined, details);
}

module.exports = { AppError, fromDbError, info, CATALOG };

// Version: V1.1 (2026-10-10) — admin-site/src/errors.js — V1.1
