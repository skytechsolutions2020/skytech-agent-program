// Version: V1.0 (2026-10-02) — admin-site/scripts/create-admin.js — V1.0
// Creates (or resets) an Admin site login in SkyTechCRM.dbo.AdminUsers.
// Usage: npm run create-admin     (asks for username, password, role)
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const readline = require('readline');
const bcrypt = require('bcryptjs');
const db = require('../src/db/mssql');

function ask(question, hidden) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) rl._writeToOutput = s => { if (s.includes(question)) process.stdout.write(s); else process.stdout.write('*'); };
    rl.question(question, a => { rl.close(); if (hidden) process.stdout.write('\n'); resolve(a.trim()); });
  });
}

(async () => {
  try {
    await db.init();
    const username = await ask('Username: ');
    if (!/^[A-Za-z0-9_.-]{3,50}$/.test(username)) throw new Error('Username: 3-50 letters, digits, _ . -');
    const p1 = await ask('Password (min 10 characters): ', true);
    if (p1.length < 10) throw new Error('Password must be at least 10 characters.');
    const p2 = await ask('Repeat password: ', true);
    if (p1 !== p2) throw new Error('Passwords do not match.');
    const role = ((await ask('Role (admin/viewer) [admin]: ')) || 'admin').toLowerCase();
    if (!['admin', 'viewer'].includes(role)) throw new Error('Role must be admin or viewer.');
    await db.createUser(username, await bcrypt.hash(p1, 12), role);
    await db.audit(username, 'session', 'CREATE', username, { role, by: 'create-admin script' });
    console.log(`Login "${username}" (${role}) is ready. Start the site with: npm start`);
    process.exit(0);
  } catch (e) { console.error('Error: ' + e.message); process.exit(1); }
})();
