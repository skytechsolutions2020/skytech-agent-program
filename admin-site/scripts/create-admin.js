// Version: V2.1 (2026-10-10) — admin-site/scripts/create-admin.js — V2.1
/**
 * @file Create or reset an Admin site login.
 * Purpose: asks for a username, password (typed hidden) and role, checks the password policy
 *          (src/security.js passwordPolicy: 12+ chars, upper/lower case, a digit, not the username, not common),
 *          stores a bcrypt hash (cost 12) in SkyTechCRM.dbo.AdminUsers and writes an audit entry.
 * Run:     npm run create-admin      (re-run with the same username to reset a password)
 * Inputs:  admin-site\.env database settings.
 * Errors:  SKY-AUTH-006 password policy; SKY-DB-00x database problems; SKY-DATA-002 bad username/role.
 */
'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const readline = require('readline');
const bcrypt = require('bcryptjs');
const { AppError, fromDbError } = require('../src/errors');
const { passwordPolicy } = require('../src/security');
const log = require('../src/logger');

/** ask — prompts on the console; hidden=true shows * instead of the typed characters. */
function ask(question, hidden) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) rl._writeToOutput = s => { if (s.includes(question)) process.stdout.write(s); else process.stdout.write('*'); };
    rl.question(question, a => { rl.close(); if (hidden) process.stdout.write('\n'); resolve(a.trim()); });
  });
}

(async () => {
  try {
    const db = require('../src/db/mssql');
    await db.init();
    const username = await ask('Username: ');
    if (!/^[A-Za-z0-9_.-]{3,50}$/.test(username)) throw new AppError('SKY-DATA-002', 'Username: 3-50 letters, digits, _ . -');
    const p1 = await ask('Password (12+ characters, upper and lower case, a number): ', true);
    const problems = passwordPolicy(p1, username);
    if (problems.length) throw new AppError('SKY-AUTH-006', 'Password needs: ' + problems.join(', ') + '.');
    const p2 = await ask('Repeat password: ', true);
    if (p1 !== p2) throw new AppError('SKY-AUTH-006', 'Passwords do not match.');
    const { ROLE_KEYS } = require('../src/roles');
    const role = ((await ask(`Role (${ROLE_KEYS.join('/')}) [admin]: `)) || 'admin').toLowerCase();
    if (!ROLE_KEYS.includes(role)) throw new AppError('SKY-DATA-002', 'Role must be one of: ' + ROLE_KEYS.join(', ') + '.');
    await db.createUser(username, await bcrypt.hash(p1, 12), role);
    await db.audit(username, 'session', 'CREATE', username, { role, by: 'create-admin script' });
    log.security('Login created or reset', { user: username, role }, 'info');
    console.log(`Login "${username}" (${role}) is ready. Start the site with: npm start`);
    process.exit(0);
  } catch (e) {
    const err = e instanceof AppError ? e : fromDbError(e);
    log.error('create-admin', err.message, { code: err.code, details: err.details });
    console.error(`${err.code}: ${err.message}\nFix: ${err.hint}`);
    process.exit(1);
  }
})();

// Version: V2.1 (2026-10-10) — admin-site/scripts/create-admin.js — V2.1
