// Version: V1.1 (2026-10-10) — admin-site/scripts/doctor.js — V1.1
/**
 * @file Health check ("doctor") for the SkyTech Admin site, database and repository.
 * Purpose: finds the problems listed in the Troubleshooting Guide before they bite, and prints each one with its
 *          SkyTech code and the manual fix. Safe to run any time; it only reads (it never changes data or files,
 *          apart from writing its own log).
 * Run:     npm run doctor              full check (needs admin-site\.env and SQL Server)
 *          npm run doctor -- --demo    skip the database checks
 *          npm run doctor -- --new-secret   print a strong SESSION_SECRET to paste into .env
 * Outputs: a ✔ / ⚠ / ✖ list on screen and logs/runtime/doctor-YYYY-MM-DD.log. Exit code 1 if any ✖.
 * Checks:  Node version, packages, .env and secrets, network exposure, git hygiene (locks, remote, .env not tracked),
 *          log folder, demo-sites folder, error catalog, disk space, port, and in SkyTechCRM: connection, required
 *          objects, unique rules, admin logins, recent database errors, app role, last backup.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const net = require('net');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const SITE = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
if (args.includes('--new-secret')) { console.log(crypto.randomBytes(36).toString('base64url')); process.exit(0); }
require('dotenv').config({ path: path.join(SITE, '.env') });
const DEMO = args.includes('--demo');
const log = require('../src/logger').to('doctor');
const results = [];

/** add — records one check result: level ok|warn|fail, the SkyTech code (if any), message and fix. */
function add(level, area, msg, code, fix) {
  results.push({ level, area, msg, code, fix });
  const entry = { code, area, fix };
  if (level === 'fail') log.error('doctor', msg, entry); else if (level === 'warn') log.warn('doctor', msg, entry); else log.info('doctor', msg, entry);
}
/** git — runs a git command in the repository; returns trimmed output or null if git is unavailable. */
function git(...a) { try { return execFileSync('git', a, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch (e) { return null; } }

/** checkLocal — everything that does not need the database. */
async function checkLocal() {
  const major = parseInt(process.versions.node, 10);
  major >= 18 ? add('ok', 'Node.js', `Node.js ${process.versions.node}`) : add('fail', 'Node.js', `Node.js ${process.versions.node} is too old`, 'SKY-CFG-004', 'Install the LTS version from nodejs.org');

  const pkgs = ['express', 'express-session', 'bcryptjs', 'dotenv', 'mssql'];
  const missing = pkgs.filter(p => { try { require.resolve(p, { paths: [SITE] }); return false; } catch (e) { return true; } });
  missing.length ? add('fail', 'Packages', 'Missing: ' + missing.join(', '), 'SKY-CFG-007', 'Run npm install in admin-site') : add('ok', 'Packages', 'All required packages installed');
  if (!DEMO && (process.env.DB_AUTH || 'windows').toLowerCase() === 'windows') {
    try { require.resolve('msnodesqlv8', { paths: [SITE] }); add('ok', 'Packages', 'msnodesqlv8 (Windows login) installed'); }
    catch (e) { add(process.platform === 'win32' ? 'fail' : 'warn', 'Packages', 'msnodesqlv8 not installed (needed for DB_AUTH=windows)', 'SKY-DB-002', 'Run npm install on the Windows PC, or use DB_AUTH=sql'); }
  }

  const envFile = path.join(SITE, '.env');
  if (!fs.existsSync(envFile)) add(DEMO ? 'warn' : 'fail', 'Settings', '.env file missing', 'SKY-CFG-001', 'Copy .env.example to .env and fill it in');
  else {
    add('ok', 'Settings', '.env present');
    const s = process.env.SESSION_SECRET || '';
    s.length >= 32 && !/change-this/i.test(s) ? add('ok', 'Security', 'SESSION_SECRET is strong') : add('fail', 'Security', 'SESSION_SECRET missing or weak', 'SKY-CFG-002', 'Run npm run doctor -- --new-secret and paste the result into .env');
  }
  const host = process.env.HOST || '127.0.0.1';
  if (!['127.0.0.1', 'localhost', '::1'].includes(host) && process.env.COOKIE_SECURE !== '1') add('fail', 'Security', `HOST=${host} exposes the site without HTTPS cookies`, 'SKY-CFG-003', 'Use HOST=127.0.0.1, or COOKIE_SECURE=1 behind HTTPS');
  else add('ok', 'Security', `Site listens on ${host}${['127.0.0.1', 'localhost', '::1'].includes(host) ? ' (this computer only)' : ' with secure cookies'}`);

  const ignored = git('check-ignore', '-q', 'admin-site/.env') !== null;
  const tracked = (git('ls-files', 'admin-site/.env') || '').length > 0;
  if (tracked) add('fail', 'Security', 'admin-site/.env is tracked by git (secrets would be uploaded)', 'SKY-SEC-004', 'Run: git rm --cached admin-site/.env, then commit');
  else if (git('--version') === null) add('warn', 'Git', 'git not available here; repository checks skipped');
  else add(ignored ? 'ok' : 'warn', 'Security', ignored ? '.env is excluded from git' : '.env is not listed in .gitignore', ignored ? undefined : 'SKY-SEC-004', ignored ? undefined : 'Add .env to .gitignore');

  for (const lock of ['index.lock', 'HEAD.lock', 'refs/heads/main.lock']) {
    if (fs.existsSync(path.join(ROOT, '.git', lock))) add('fail', 'Git', `.git/${lock} left behind`, 'SKY-GIT-002', `Close GitHub Desktop and delete .git\\${lock.replace(/\//g, '\\')}`);
  }
  const remote = git('remote', 'get-url', 'origin');
  if (git('--version') !== null) remote ? add('ok', 'Git', 'GitHub remote: ' + remote) : add('warn', 'Git', 'No GitHub remote set', 'SKY-GIT-003', 'git remote add origin https://github.com/skytechsolutions2020/skytech-agent-program.git');

  const logDir = require('../src/logger').DIR;
  try { fs.mkdirSync(logDir, { recursive: true }); fs.accessSync(logDir, fs.constants.W_OK); add('ok', 'Logs', 'Log folder writable: ' + logDir); }
  catch (e) { add('warn', 'Logs', 'Log folder not writable: ' + logDir, 'SKY-SYS-003', 'Make sure logs\\runtime exists and is not read-only'); }
  const demoDir = process.env.DEMO_SITES_DIR || path.join(ROOT, 'demo-sites');
  fs.existsSync(demoDir) ? add('ok', 'Demo sites', 'demo-sites folder found') : add('warn', 'Demo sites', 'demo-sites folder not found', 'SKY-CFG-005', 'Keep admin-site next to demo-sites, or set DEMO_SITES_DIR');
  const cat = require('../src/errors').CATALOG;
  cat.size > 10 ? add('ok', 'Docs', `Error catalog loaded (${cat.size} codes)`) : add('warn', 'Docs', 'Error catalog config/error-codes.json not found', 'SKY-DOC-002', 'Keep the config folder next to admin-site');
  if (!fs.existsSync(path.join(ROOT, 'docs', 'architecture', 'SkyTech_Troubleshooting_Guide.html'))) add('warn', 'Docs', 'Troubleshooting Guide not built', 'SKY-DOC-002', 'python scripts/docs/build_ops_docs.py');

  if (fs.statfsSync) {
    try { const st = fs.statfsSync(ROOT); const gb = st.bavail * st.bsize / 1e9; gb < 1 ? add('fail', 'Disk', `Only ${gb.toFixed(1)} GB free`, 'SKY-SYS-002', 'Free disk space') : add('ok', 'Disk', `${gb.toFixed(0)} GB free`); } catch (e) { /* not supported */ }
  }
  const port = parseInt(process.env.PORT, 10) || 3030;
  await new Promise(resolve => {
    const srv = net.createServer().once('error', e => { add('warn', 'Port', `Port ${port} is in use (the Admin site may already be running)`, e.code === 'EADDRINUSE' ? 'SKY-CFG-006' : undefined, 'Close the other Admin site window or change PORT'); resolve(); })
      .once('listening', () => { srv.close(() => { add('ok', 'Port', `Port ${port} is free`); resolve(); }); }).listen(port, process.env.HOST || '127.0.0.1');
  });
}

/** REQUIRED — database objects the Admin site and scripts rely on (type U=table, V=view, P=procedure, FN=function). */
const REQUIRED = [
  ['dbo.Companies', 'U'], ['dbo.WebPresence', 'U'], ['dbo.Leads', 'U'], ['dbo.Activities', 'U'], ['dbo.StgLeads', 'U'], ['dbo.ImportBatches', 'U'],
  ['dbo.DemoSites', 'U'], ['dbo.ErrorLog', 'U'], ['dbo.AdminUsers', 'U'], ['dbo.AuditLog', 'U'], ['dbo.DuplicateDismissals', 'U'],
  ['dbo.vw_LeadDetail', 'V'], ['dbo.vw_DuplicateCheck', 'V'], ['dbo.vw_DemoSiteDetail', 'V'],
  ['dbo.usp_ImportStagedLeads', 'P'], ['dbo.usp_LogError', 'P'], ['dbo.usp_MergeCompanies', 'P'], ['dbo.usp_MergeLeads', 'P'], ['dbo.usp_BackupSkyTechCRM', 'P'], ['dbo.usp_PurgeErrorLog', 'P']];

/** checkDatabase — connects to SkyTechCRM and checks objects, rules, logins, errors, role and backups. */
async function checkDatabase() {
  const { fromDbError } = require('../src/errors');
  let mssql;
  try { mssql = require('../src/db/mssql'); await mssql.init(); add('ok', 'Database', `Connected to ${process.env.DB_SERVER || 'localhost'} / ${process.env.DB_DATABASE || 'SkyTechCRM'}`); }
  catch (e) { const er = fromDbError(e); add('fail', 'Database', er.message, er.code, er.hint); return; }
  const q = async sqlText => (await mssql._pool().request().query(sqlText)).recordset;
  try {
    const rows = await q(`SELECT name, type FROM (VALUES ${REQUIRED.map(([n, t]) => `(N'${n}', '${t}')`).join(',')}) r(name, type) WHERE OBJECT_ID(name) IS NULL`);
    rows.length ? add('fail', 'Database', 'Missing objects: ' + rows.map(r => r.name).join(', '), 'SKY-DB-005', 'Run the SQL scripts in order: 01 → sample import → 04 → 05 → 06') : add('ok', 'Database', `All ${REQUIRED.length} required objects present`);
    const [uc] = await q("SELECT COL_LENGTH('dbo.AdminUsers', 'UpdatedBy') AS c, OBJECT_ID('dbo.CK_AdminUsers_Role') AS ck");
    uc.c && uc.ck ? add('ok', 'Logins', 'Login roles and change history ready (sql/04 V1.6)') : add('warn', 'Logins', 'AdminUsers is missing the role rule or CreatedBy/UpdatedBy columns', 'SKY-DB-005', 'Run sql/04_admin_site.sql (V1.6) in SSMS');
    const ux = await q(`SELECT name FROM (VALUES ('UX_Companies_SourceRecordID'),('UX_Companies_NormName_Zip'),('UX_Leads_CompanyID'),('UX_WebPresence_CompanyID'),('UX_DemoSites_CompanyID')) i(name) WHERE NOT EXISTS (SELECT 1 FROM sys.indexes x WHERE x.name = i.name)`);
    ux.length ? add('warn', 'Duplicates', 'Unique rules missing: ' + ux.map(r => r.name).join(', '), 'SKY-DUP-004', 'Fix Exact duplicates in the Admin site, then re-run sql/01') : add('ok', 'Duplicates', 'All unique (no-duplicate) rules active');
    const [u] = await q('SELECT COUNT(*) AS n FROM dbo.AdminUsers WHERE IsActive = 1');
    u.n ? add('ok', 'Logins', `${u.n} active admin login(s)`) : add('warn', 'Logins', 'No admin logins yet', 'SKY-AUTH-001', 'Run npm run create-admin');
    if ((await q("SELECT OBJECT_ID('dbo.ErrorLog') AS id"))[0].id) {
      const [er] = await q('SELECT COUNT(*) AS n, MAX(LoggedOn) AS last FROM dbo.ErrorLog WHERE LoggedOn > DATEADD(day, -7, GETDATE())');
      er.n ? add('warn', 'Database', `${er.n} database error(s) logged in the last 7 days (newest ${new Date(er.last).toISOString().slice(0, 16)})`, 'SKY-DB-010', 'SELECT TOP 20 * FROM dbo.ErrorLog ORDER BY ErrorLogID DESC') : add('ok', 'Database', 'No database errors in the last 7 days');
    }
    const [role] = await q("SELECT COUNT(*) AS n FROM sys.database_principals WHERE name = 'SkyTechApp' AND type = 'R'");
    role.n ? add('ok', 'Security', 'Least-privilege role SkyTechApp exists') : add('warn', 'Security', 'Role SkyTechApp not created', 'SKY-DB-008', 'Run sql/06_security_and_logging.sql');
    let bk = {};
    try { [bk] = await q("SELECT MAX(backup_finish_date) AS last FROM msdb.dbo.backupset WHERE database_name = DB_NAME() AND type = 'D'"); }
    catch (e) { add('warn', 'Backup', 'Cannot read backup history (msdb) with this login', 'SKY-DB-008', 'Run doctor with the owner Windows login, or check backups in SSMS'); return; }
    if (!bk.last) add('warn', 'Backup', 'No full backup of SkyTechCRM found', 'SKY-BAK-003', 'In SSMS run: EXEC dbo.usp_BackupSkyTechCRM;');
    else { const days = (Date.now() - new Date(bk.last)) / 864e5; days > 7 ? add('warn', 'Backup', `Last backup ${days.toFixed(0)} days ago`, 'SKY-BAK-003', 'EXEC dbo.usp_BackupSkyTechCRM;') : add('ok', 'Backup', `Last backup ${days.toFixed(1)} days ago`); }
  } catch (e) { const er = fromDbError(e); add('fail', 'Database', er.message, er.code, er.hint); }
}

(async () => {
  console.log('SkyTech doctor — checking the Admin site, repository and database…\n');
  await checkLocal();
  if (!DEMO) await checkDatabase(); else add('ok', 'Database', 'Skipped (--demo)');
  const icon = { ok: '✔', warn: '⚠', fail: '✖' };
  for (const r of results) {
    console.log(`${icon[r.level]} ${r.area.padEnd(11)} ${r.msg}${r.code ? `  [${r.code}]` : ''}`);
    if (r.level !== 'ok' && r.fix) console.log(`  ${' '.repeat(12)}Fix: ${r.fix}`);
  }
  const f = results.filter(r => r.level === 'fail').length, w = results.filter(r => r.level === 'warn').length;
  console.log(`\n${f} problem(s), ${w} warning(s). Codes are explained in docs/architecture/SkyTech_Troubleshooting_Guide.html`);
  log.info('doctor', `Finished: ${f} problem(s), ${w} warning(s)`, {});
  process.exit(f ? 1 : 0);
})();

// Version: V1.1 (2026-10-10) — admin-site/scripts/doctor.js — V1.1
