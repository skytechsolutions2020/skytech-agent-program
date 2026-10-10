// Version: V1.0 (2026-10-10) — scripts/security/scan-secrets.js — V1.0
/**
 * @file Secret scanner run before every push (push-to-github.bat calls it).
 * Purpose: stops passwords, API keys, private keys or a committed .env from reaching GitHub.
 * Inputs:  the files git tracks plus files staged for the next commit (git ls-files).
 * Outputs: a list of suspicious lines (value masked) and exit code 1 (SKY-SEC-004) if anything is found; 0 if clean.
 * Run:     node scripts/security/scan-secrets.js      (from the repository folder)
 * Allow:   a line containing "scan-secrets: allow" is skipped (use only for documented example values).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..', '..');

/** RULES — what counts as a secret. Each has a name and a regular expression. */
const RULES = [
  ['Private key', /-----BEGIN (RSA |EC |OPENSSH |DSA |)PRIVATE KEY-----/],
  ['GitHub token', /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b|\bgithub_pat_[A-Za-z0-9_]{40,}/],
  ['AWS key', /\bAKIA[0-9A-Z]{16}\b/],
  ['Google API key', /\bAIza[0-9A-Za-z_\-]{35}\b/],
  ['Slack token', /\bxox[abpr]-[A-Za-z0-9-]{10,}/],
  ['Stripe live key', /\b(sk|rk)_live_[A-Za-z0-9]{20,}/],
  // KEY=value lines in .env-style files (upper-case key names only; placeholders and the demo password are allowed)
  ['Password in settings', /^\s*[A-Z_]*(PASSWORD|SECRET|TOKEN|API_KEY)\s*=\s*(?!change-this|<|demo1234\b|#)[^\s#]{6,}/],
  // ODBC / ADO connection strings: ...;Password=xxxx;  or  "Pwd=xxxx"
  ['Connection string password', /(^|[;"'])\s*(Password|Pwd)\s*=\s*[^;'"\s<{$]{6,}/i]
];
const SKIP_EXT = /\.(png|jpe?g|gif|webp|ico|pdf|zip|gz|woff2?|ttf|bak|mdf|ldf|xlsx|docx|pptx)$/i;

/** listFiles — files git tracks or has staged; exits with SKY-GIT-001 if git is not available. */
function listFiles() {
  try { return execFileSync('git', ['ls-files', '--cached'], { cwd: ROOT }).toString().split('\n').filter(Boolean); }
  catch (e) { console.error('[SKY-GIT-005] git is not available or this is not the repository folder.'); process.exit(2); }
}

const findings = [];
for (const f of listFiles()) {
  if (/(^|\/)\.env$/.test(f)) { findings.push([f, 0, 'A .env file is tracked by git', '']); continue; }
  if (SKIP_EXT.test(f) || f.includes('node_modules/')) continue;
  let text; try { text = fs.readFileSync(path.join(ROOT, f), 'utf8'); } catch (e) { continue; }
  if (text.length > 3e6) continue;
  text.split(/\r?\n/).forEach((line, i) => {
    if (line.includes('scan-secrets: allow')) return;
    for (const [name, re] of RULES) if (re.test(line)) { findings.push([f, i + 1, name, line.trim().slice(0, 12) + '…(masked)']); break; }
  });
}
if (!findings.length) { console.log('Secret scan: clean (no passwords, keys or .env files in git).'); process.exit(0); }
console.error(`[SKY-SEC-004] Secret scan found ${findings.length} possible secret(s). Nothing was uploaded.`);
for (const [f, n, name, s] of findings) console.error(`  ${f}${n ? ':' + n : ''}  ${name}  ${s}`);
console.error('Fix: remove the value (keep secrets only in admin-site\\.env), run "git rm --cached <file>" for a tracked .env, commit, and push again.');
console.error('     If a real key was already pushed, change (rotate) that key now. See SkyTech_Troubleshooting_Guide#SKY-SEC-004.');
process.exit(1);

// Version: V1.0 (2026-10-10) — scripts/security/scan-secrets.js — V1.0
