// Version: V2.3 (2026-10-10) — admin-site/public/app.js — V2.3 (role permissions, Logins screen)
/**
 * @file SkyTech Admin site front end (plain JavaScript, no framework). Routes: #dashboard, #syslog, #users, #<entity>?search=&f_Col=val
 * Security: no inline scripts (strict CSP); every value shown is escaped (esc); every change sends the CSRF token
 *           (X-CSRF-Token) received at sign-in; buttons appear only for what the role may do (PERMS from /api/me; the server checks again).
 * Errors:   server errors arrive as { error, code, requestId, hint } and are shown as "message (CODE, ref ID)";
 *           the ref ID finds the matching line in logs/runtime/admin-<date>.log and the System log screen.
 */
(() => {
  const $ = s => document.querySelector(s);
  // esc — HTML-escape text before inserting it into the page (prevents script injection).
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let META = null, ME = null, PERMS = null, charts = [], CSRF = '';   // PERMS = what this role may do (src/roles.js)

  /**
   * api — calls the Admin site API. Sends the anti-forgery token (X-CSRF-Token) on every change.
   * On failure throws an Error whose message ends with the SkyTech code and reference, e.g.
   * "Wrong username or password. (SKY-AUTH-001, ref 3fa2…)" — look the code up in the Troubleshooting Guide.
   * If the token is stale (SKY-SEC-001) it refreshes it once and retries automatically.
   */
  async function api(method, url, body, retried) {
    const headers = {};
    if (body) headers['Content-Type'] = 'application/json';
    if (method !== 'GET' && CSRF) headers['X-CSRF-Token'] = CSRF;
    let r;
    try { r = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined, credentials: 'same-origin' }); }
    catch (e) { const err = new Error('The Admin site is not reachable. Is the black server window still open? (SKY-SYS-001)'); err.code = 'SKY-SYS-001'; throw err; }
    const data = await r.json().catch(() => ({}));
    if (data.code === 'SKY-SEC-001' && !retried) {
      const me = await fetch('/api/me', { credentials: 'same-origin' }).then(x => x.json()).catch(() => ({}));
      if (me.csrf) { CSRF = me.csrf; return api(method, url, body, true); }
    }
    if (r.status === 401 && url !== '/api/login') { showLogin(data.code === 'SKY-AUTH-003' ? 'Your session expired. Please sign in again.' : ''); const err = new Error('Please sign in. (' + (data.code || 'SKY-AUTH-004') + ')'); err.code = data.code; throw err; }
    if (!r.ok) {
      const err = new Error(`${data.error || r.statusText}${data.code ? ` (${data.code}${data.requestId ? ', ref ' + data.requestId : ''})` : ''}`);
      err.code = data.code; err.ref = data.requestId; throw err;
    }
    return data;
  }
  // toast — short message at the bottom of the screen.
  function toast(msg, ms = 2600) { const t = $('#toast'); t.textContent = msg; t.classList.remove('hidden'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.add('hidden'), ms); }
  // Formatting helpers: date, date+time, money.
  const fmtDate = v => v ? String(v).slice(0, 10) : '';
  const fmtDT = v => v ? new Date(v).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
  const money = v => '$' + Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
  // cell — formats one table cell by column type (status badge, money, date, link, yes/no).
  function cell(def, v, col) {
    if (v === null || v === undefined || v === '') return '<span class="muted">—</span>';
    if (col === 'Status') return `<span class="pill ${esc(v)}">${esc(v)}</span>`;
    if (col === 'Severity') return `<span class="sev ${esc(v)}">${esc(v)}</span>`;
    if (def && def.type === 'bit') return v ? 'Yes' : 'No';
    if (def && def.type === 'color') return /^#[0-9a-f]{6}$/i.test(v) ? `<span class="swatch" style="background:${v}"></span>${esc(v)}` : esc(v);
    if (def && def.type === 'date') return esc(fmtDate(v));
    if (def && def.type === 'datetime') return esc(fmtDT(v));
    if (def && def.type === 'money') return esc(money(v));
    if (/URL$/.test(col) && /^https?:\/\//i.test(v)) return `<a class="ext" href="${esc(v)}" target="_blank" rel="noopener noreferrer">${esc(v)}</a>`;
    return esc(v);
  }

  // links inside table rows open in a new tab without also opening the row (no inline handlers: CSP blocks them)
  document.addEventListener('click', e => { if (e.target.closest && e.target.closest('a.ext')) e.stopPropagation(); }, true);

  // ---------- auth
  /** showLogin — shows the sign-in form (optionally with a message, e.g. session expired). */
  function showLogin(msg) { $('#app').classList.add('hidden'); $('#login').classList.remove('hidden'); if (msg) $('#loginError').textContent = msg; }
  $('#loginForm').addEventListener('submit', async e => {
    e.preventDefault(); $('#loginError').textContent = '';
    const f = new FormData(e.target);
    try { const r = await api('POST', '/api/login', { username: f.get('username'), password: f.get('password') }); CSRF = r.csrf || ''; e.target.reset(); await start(); }
    catch (err) { $('#loginError').textContent = err.message; }
  });
  $('#logout').addEventListener('click', async () => { clearInterval(dupTimer); await api('POST', '/api/logout').catch(() => {}); CSRF = ''; showLogin(); });
  $('#menu').addEventListener('click', () => $('.sidebar').classList.toggle('open'));

  // start — after sign-in: loads /api/me (user, role, CSRF token, version) and the screen metadata, then routes.
  async function start() {
    const me = await api('GET', '/api/me'); ME = me.user; PERMS = me.perms || { write: [] }; CSRF = me.csrf || CSRF;
    META = await api('GET', '/api/meta');
    $('#who').textContent = `${ME.name} (${PERMS.label || ME.role})`; $('#mode').textContent = `${me.mode} · v${me.version || ''}`;
    document.querySelectorAll('[data-perm]').forEach(a => a.classList.toggle('hidden', !PERMS[a.dataset.perm]));
    $('#login').classList.add('hidden'); $('#app').classList.remove('hidden');
    route(); watchDuplicates();
  }

  // ---------- live duplicate watch: nav badge refreshed every 30 s; open Duplicates tab re-checks itself
  let DUP = null, dupTimer = null;
  // checkDuplicates — refreshes the live duplicate badge from /api/duplicates/summary.
  async function checkDuplicates() {
    try { DUP = await api('GET', '/api/duplicates/summary'); } catch (e) { return null; }
    const b = $('#dupBadge'); b.textContent = DUP.total; b.classList.toggle('hidden', false); b.classList.toggle('ok', DUP.total === 0);
    b.title = DUP.total ? `${DUP.total} duplicate${DUP.total === 1 ? '' : 's'} found right now` : 'No duplicates found';
    return DUP;
  }
  // watchDuplicates — re-checks duplicates every minute and after each change.
  function watchDuplicates() {
    clearInterval(dupTimer);
    checkDuplicates();
    dupTimer = setInterval(async () => {
      const before = DUP && DUP.total; await checkDuplicates();
      const { view } = parseHash();
      const drawerOpen = !$('#drawer').classList.contains('hidden');
      if (view === 'duplicates' && !drawerOpen) route();
      else if (view === 'dashboard' && DUP && before !== DUP.total && !drawerOpen) route();
    }, 30000);
  }
  // canWrite — true when this role may change records of the screen (the server enforces the same rule: SKY-AUTH-005).
  const canWrite = e => !!PERMS && META.entities[e].writable && (PERMS.write === '*' || PERMS.write.includes(e));

  // ---------- routing
  function parseHash() {
    const [v, qs] = (location.hash.slice(1) || 'dashboard').split('?');
    return { view: v, params: Object.fromEntries(new URLSearchParams(qs || '')) };
  }
  // go — navigates to a screen with filters.
  function go(view, params = {}) {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null)).toString();
    location.hash = view + (qs ? '?' + qs : '');
  }
  window.addEventListener('hashchange', route);
  document.querySelectorAll('#nav a').forEach(a => a.addEventListener('click', () => { $('.sidebar').classList.remove('open'); go(a.dataset.view); }));

  // route — draws the screen for the current #route.
  function route() {
    if (!META) return;
    const { view, params } = parseHash();
    document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('active', a.dataset.view === view));
    charts.forEach(c => c.destroy()); charts = [];
    if (view === 'dashboard') return renderDashboard();
    if (view === 'syslog') return renderSyslog();
    if (view === 'users') return renderUsers();
    if (META.entities[view]) return renderTable(view, params);
    go('dashboard');
  }

  // ---------- dashboard
  async function renderDashboard() {
    $('#title').textContent = 'Dashboard'; $('#crumbs').textContent = '';
    $('#view').innerHTML = '<p class="muted">Loading…</p>';
    const d = await api('GET', '/api/dashboard');
    const k = d.kpis;
    const kpis = [
      ['Potential clients', k.PotentialClients, { f_Status: 'NoSite' }, 'Verified: no website'],
      ['Demos built', k.DemosBuilt, { f_Status: 'DemoBuilt' }],
      ['Contacted', k.Contacted, null],
      ['In pipeline', k.Pipeline, null, 'Interested + Proposal'],
      ['Clients won', k.Won, { f_Status: 'Won' }],
      ['Monthly recurring', money(k.MRR), { f_Status: 'Won' }],
      ['Setup revenue', money(k.SetupRevenue), { f_Status: 'Won' }],
      ['Follow-ups due', k.FollowUpsDue, null, 'Today or overdue', k.FollowUpsDue > 0],
      ['Companies', k.Companies, 'companies'],
      ['Possible duplicates', k.PossibleDuplicates, 'duplicates', 'Review', k.PossibleDuplicates > 0]
    ];
    $('#view').innerHTML = `
      ${k.PossibleDuplicates > 0 ? `<div class="alert-bar" id="dupAlert"><b>${esc(k.PossibleDuplicates)} duplicate${k.PossibleDuplicates === 1 ? '' : 's'} found in the database.</b><span class="muted">Click to review and fix them.</span></div>` : ''}
      <div class="kpis">${kpis.map((x, i) => `<div class="card kpi ${x[4] ? 'alert' : ''}" data-i="${i}"><div class="v">${esc(x[1])}</div><div class="l">${esc(x[0])}${x[3] ? ' · ' + esc(x[3]) : ''}</div></div>`).join('')}</div>
      <div class="grid2">
        <div class="card"><h3>Leads by status</h3><canvas id="cStatus" height="220"></canvas><div class="hint">Click a bar to open those leads.</div></div>
        <div class="card"><h3>Leads by area and niche</h3><canvas id="cArea" height="220"></canvas><div class="hint">Darker = verified potential clients. Click a bar to drill down.</div></div>
      </div>
      <div class="grid2">
        <div class="card"><h3>Follow-ups (next 7 days)</h3>${miniTable(d.followUps, ['CompanyName', 'Phone', 'Status', 'NextFollowUp', 'AssignedAgent'], 'leads', 'LeadID', 'No follow-ups scheduled.')}</div>
        <div class="card"><h3>Recent activity</h3>${miniTable(d.activity, ['ActivityDate', 'CompanyName', 'Agent', 'ActivityType', 'Outcome'], null, null, 'No activity logged yet.')}</div>
      </div>
      <div class="card"><h3>Recent imports</h3>${miniTable(d.imports, ['BatchName', 'RowsIn', 'Inserted', 'Updated', 'SkippedInFile', 'LastRunOn'], null, null, 'No imports yet.')}</div>`;
    if ($('#dupAlert')) $('#dupAlert').addEventListener('click', () => go('duplicates'));
    document.querySelectorAll('.kpi').forEach(el => el.addEventListener('click', () => {
      const t = kpis[el.dataset.i][2];
      if (typeof t === 'string') go(t); else if (t) go('leads', t);
      else if (kpis[el.dataset.i][0] === 'Contacted') go('leads', { f_Status: 'Contacted' });
      else if (kpis[el.dataset.i][0] === 'In pipeline') go('leads', { f_Status: 'Interested' });
      else go('leads', { sort: 'NextFollowUp', dir: 'asc' });
    }));
    document.querySelectorAll('[data-open]').forEach(tr => tr.addEventListener('click', () => openRecord(tr.dataset.entity, tr.dataset.open)));
    if (!window.Chart) return;
    const css = getComputedStyle(document.documentElement);
    const ink = css.getPropertyValue('--muted').trim(), brand = css.getPropertyValue('--brand').trim();
    Chart.defaults.color = ink;
    const order = META.statuses.filter(s => d.byStatus.some(b => b.Status === s));
    const sc = new Chart($('#cStatus'), { type: 'bar',
      data: { labels: order, datasets: [{ data: order.map(s => (d.byStatus.find(b => b.Status === s) || {}).N || 0), backgroundColor: brand }] },
      options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
        onClick: (e, els) => { if (els.length) go('leads', { f_Status: order[els[0].index] }); } } });
    const areas = [...new Set(d.byArea.map(a => a.County))].sort();
    const niches = [...new Set(d.byArea.map(a => a.Niche))].sort();
    const labels = []; const pot = []; const rest = []; const keys = [];
    areas.forEach(c => niches.forEach(n => { const a = d.byArea.find(x => x.County === c && x.Niche === n); if (!a) return;
      labels.push(`${c} · ${n}`); pot.push(a.Potential); rest.push(a.N - a.Potential); keys.push({ f_County: c, f_Niche: n }); }));
    const ac = new Chart($('#cArea'), { type: 'bar',
      data: { labels, datasets: [{ label: 'Potential clients', data: pot, backgroundColor: brand }, { label: 'Other leads', data: rest, backgroundColor: brand + '55' }] },
      options: { indexAxis: 'y', scales: { x: { stacked: true, beginAtZero: true, ticks: { precision: 0 } }, y: { stacked: true } },
        onClick: (e, els) => { if (els.length) go('leads', { ...keys[els[0].index], ...(els[0].datasetIndex === 0 ? { f_Status: 'NoSite' } : {}) }); } } });
    charts.push(sc, ac);
  }
  // miniTable — small clickable table used on the dashboard.
  function miniTable(rows, cols, entity, key, empty) {
    if (!rows || !rows.length) return `<p class="muted">${esc(empty)}</p>`;
    const defs = Object.assign({}, ...Object.values(META.entities).map(e => e.columns));
    return `<div class="table-wrap"><table><thead><tr>${cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${
      rows.map(r => `<tr ${entity ? `data-entity="${entity}" data-open="${esc(r[key])}"` : ''}>${cols.map(c => `<td>${cell(defs[c], r[c], c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }

  // ---------- table view
  async function renderTable(entity, params) {
    const e = META.entities[entity];
    if (entity === 'duplicates') await checkDuplicates();
    $('#title').textContent = e.label;
    const filters = Object.entries(params).filter(([k]) => k.startsWith('f_'));
    $('#crumbs').textContent = filters.length ? filters.map(([k, v]) => `${k.slice(2)}: ${v}`).join(' · ') : '';
    const enumFilters = e.filterColumns.filter(c => ['enum', 'bit'].includes(e.columns[c].type));
    $('#view').innerHTML = `
      <div class="toolbar">
        <input type="search" id="q" placeholder="Search ${esc(e.label.toLowerCase())}…" value="${esc(params.search || '')}">
        ${enumFilters.map(c => { const def = e.columns[c]; const opts = def.type === 'bit' ? [['1', 'Yes'], ['0', 'No']] : def.options.map(o => [o, o]);
          return `<select data-filter="${c}"><option value="">${esc(c)}: all</option>${opts.map(([v, l]) => `<option value="${esc(v)}" ${params['f_' + c] === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`; }).join('')}
        ${filters.filter(([k]) => !enumFilters.includes(k.slice(2))).map(([k, v]) => `<span class="chip">${esc(k.slice(2))}: ${esc(v)} <button data-unfilter="${esc(k)}" aria-label="Remove filter">&times;</button></span>`).join('')}
        <span style="flex:1"></span>
        <button class="btn" id="csv">Export CSV</button>
        ${canWrite(entity) ? `<button class="btn primary" id="new">+ New</button>` : ''}
      </div>
      ${entity === 'duplicates' ? dupPanel(params) : ''}
      <div class="table-wrap"><table><thead><tr>${e.listColumns.map(c => `<th data-sort="${c}">${esc(c)}${params.sort === c ? (params.dir === 'asc' ? ' ▲' : ' ▼') : ''}</th>`).join('')}</tr></thead><tbody id="rows"><tr><td colspan="${e.listColumns.length}" class="muted">Loading…</td></tr></tbody></table></div>
      <div class="pager"><span id="count" class="muted"></span><button class="btn small" id="prev">‹ Prev</button><button class="btn small" id="next">Next ›</button></div>`;
    let t; $('#q').addEventListener('input', ev => { clearTimeout(t); t = setTimeout(() => go(entity, { ...params, search: ev.target.value, page: 1 }), 350); });
    document.querySelectorAll('[data-filter]').forEach(s => s.addEventListener('change', () => go(entity, { ...params, ['f_' + s.dataset.filter]: s.value, page: 1 })));
    document.querySelectorAll('[data-unfilter]').forEach(b => b.addEventListener('click', () => { const p = { ...params }; delete p[b.dataset.unfilter]; go(entity, p); }));
    document.querySelectorAll('[data-sort]').forEach(th => th.addEventListener('click', () => go(entity, { ...params, sort: th.dataset.sort, dir: params.sort === th.dataset.sort && params.dir === 'asc' ? 'desc' : 'asc' })));
    if ($('#new')) $('#new').addEventListener('click', () => openRecord(entity, null, Object.fromEntries(filters.map(([k, v]) => [k.slice(2), v]))));
    const qs = new URLSearchParams({ size: 25, ...params }).toString();
    const data = await api('GET', `/api/data/${entity}?${qs}`);
    $('#rows').innerHTML = data.rows.length ? data.rows.map(r => `<tr data-key="${esc(r[e.key])}"${entity === 'duplicates' ? ` data-cat="${esc(r.Category)}" data-a="${esc(r.IdA)}" data-b="${esc(r.IdB)}"` : ''}>${e.listColumns.map(c => `<td title="${esc(r[c])}">${cell(e.columns[c], r[c], c)}</td>`).join('')}</tr>`).join('')
      : `<tr><td colspan="${e.listColumns.length}" class="muted">No records.</td></tr>`;
    if (e.writable || entity === 'leads') document.querySelectorAll('#rows tr[data-key]').forEach(tr => tr.addEventListener('click', () => openRecord(entity, tr.dataset.key)));
    else if (entity === 'duplicates') {
      document.querySelectorAll('#rows tr[data-key]').forEach(tr => tr.addEventListener('click', () => openCompare(tr.dataset.cat, tr.dataset.a, tr.dataset.b)));
      if (!data.total && !params.search && !filters.length) $('#rows').innerHTML = `<tr><td colspan="${e.listColumns.length}">No duplicates in Companies, Leads, Web presence or Activities. This page re-checks every 30 seconds.</td></tr>`;
      wireDupPanel(entity, params);
    }
    const page = data.page, pages = Math.max(1, Math.ceil(data.total / data.size));
    $('#count').textContent = `${data.total} record${data.total === 1 ? '' : 's'} · page ${page} of ${pages}`;
    $('#prev').disabled = page <= 1; $('#next').disabled = page >= pages;
    $('#prev').addEventListener('click', () => go(entity, { ...params, page: page - 1 }));
    $('#next').addEventListener('click', () => go(entity, { ...params, page: page + 1 }));
    $('#csv').addEventListener('click', async () => {
      const all = await api('GET', `/api/data/${entity}?${new URLSearchParams({ ...params, size: 500, page: 1 })}`);
      const cols = Object.keys(all.rows[0] || {});
      const line = r => cols.map(c => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(',');
      const blob = new Blob(['﻿' + [cols.join(','), ...all.rows.map(line)].join('\r\n')], { type: 'text/csv' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `skytech_${entity}.csv`; a.click();
      if (all.total > 500) toast('Exported the first 500 rows. Narrow the filter for the rest.');
    });
  }

  // ---------- record drawer (view / create / edit / delete)
  function field(name, def, value, editable) {
    const full = def.type === 'longtext' ? 'full' : '';
    if (!editable) return `<div class="${full}"><label>${esc(name)}</label><div class="ro">${cell(def, value, name)}</div></div>`;
    let input;
    const v = value ?? '';
    if (def.type === 'enum') input = `<select name="${name}"><option value=""></option>${def.options.map(o => `<option ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
    else if (def.type === 'bit') input = `<select name="${name}"><option value=""></option><option value="1" ${v === 1 || v === true || v === '1' ? 'selected' : ''}>Yes</option><option value="0" ${v === 0 || v === false || v === '0' ? 'selected' : ''}>No</option></select>`;
    else if (def.type === 'longtext') input = `<textarea name="${name}">${esc(v)}</textarea>`;
    else if (def.type === 'date') input = `<input type="date" name="${name}" value="${esc(fmtDate(v))}">`;
    else if (def.type === 'datetime') input = `<input type="datetime-local" name="${name}" value="${esc(v ? new Date(v).toISOString().slice(0, 16) : '')}">`;
    else if (def.type === 'color') input = `<span class="colorpick"><input type="color" value="${esc(/^#[0-9a-f]{6}$/i.test(v) ? v : '#000000')}" data-for="${name}"><input name="${name}" value="${esc(v)}" maxlength="7" placeholder="#rrggbb"></span>`;
    else if (def.type === 'int' || def.type === 'money') input = `<input type="number" step="${def.type === 'money' ? '0.01' : '1'}" name="${name}" value="${esc(v)}">`;
    else input = `<input name="${name}" value="${esc(v)}" ${def.max ? `maxlength="${def.max}"` : ''}>`;
    return `<label class="${full}">${esc(name)}${def.required ? ' *' : ''}${input}${def.hint ? `<span class="fhint">${esc(def.hint)}</span>` : ''}</label>`;
  }

  // openRecord — opens the record drawer: view/edit/create/delete, plus related records.
  async function openRecord(entity, key, preset = {}) {
    const e = META.entities[entity];
    const isNew = key == null;
    let rec = isNew ? preset : await api('GET', `/api/data/${entity}/${encodeURIComponent(key)}`);
    const writable = canWrite(entity);
    const editableName = (n, c) => writable && !c.readonly && !c.view && (n !== e.key || (e.keyIsInput && isNew));
    $('#drawerTitle').textContent = isNew ? `New ${e.label.replace(/s$/, '').toLowerCase()}` : (rec.CompanyName || rec.Name_A || `${e.label} #${key}`);
    const cols = Object.entries(e.columns).filter(([n, c]) => !(isNew && (c.readonly || c.view)));
    $('#drawerBody').innerHTML = `
      ${!isNew && entity === 'demosites' ? '<div id="related" class="related-top"></div>' : ''}
      <form id="recForm" class="form">${cols.map(([n, c]) => field(n, c, rec[n], editableName(n, c))).join('')}</form>
      <div class="actions">
        ${!isNew && writable && PERMS.remove ? '<button class="btn danger" id="del">Delete</button>' : ''}
        <span style="flex:1"></span>
        ${writable ? `<button class="btn primary" id="save">${isNew ? 'Create' : 'Save changes'}</button>` : '<span class="muted">Read-only</span>'}
      </div>
      ${entity === 'demosites' ? '' : '<div id="related"></div>'}`;
    $('#drawer').classList.remove('hidden');
    document.querySelectorAll('.colorpick input[type=color]').forEach(c => c.addEventListener('input', () => { $(`#recForm [name="${c.dataset.for}"]`).value = c.value; }));
    if ($('#save')) $('#save').addEventListener('click', async () => {
      const body = {};
      new FormData($('#recForm')).forEach((v, k) => { body[k] = v; });
      try {
        if (isNew) { const r = await api('POST', `/api/data/${entity}`, body); toast('Created.'); closeDrawer(); route(); if (r.key != null) openRecord(entity, r.key); }
        else { await api('PUT', `/api/data/${entity}/${encodeURIComponent(key)}`, body); toast('Saved.'); closeDrawer(); route(); }
      } catch (err) { toast(err.message, 5000); }
    });
    if ($('#del')) $('#del').addEventListener('click', async () => {
      if (!confirmInline()) return;
      try { await api('DELETE', `/api/data/${entity}/${encodeURIComponent(key)}`); toast('Deleted.'); closeDrawer(); route(); }
      catch (err) { toast(err.message, 5000); }
    });
    if (!isNew) renderRelated(entity, rec);
  }
  // in-page confirm (no browser pop-up dialogs)
  function confirmInline() {
    const b = $('#del');
    if (b.dataset.armed) return true;
    b.dataset.armed = '1'; b.textContent = 'Click again to delete'; setTimeout(() => { if (b) { delete b.dataset.armed; b.textContent = 'Delete'; } }, 4000);
    return false;
  }
  // renderRelated — lists linked records (company → lead, web presence, activities, demo site).
  async function renderRelated(entity, rec) {
    const box = $('#related');
    if (entity === 'demosites') {
      box.innerHTML = `<h3 class="section-title">Website</h3>
        <p class="muted">Preview shows the page exactly as the business will see it, built from the saved fields. Save changes first, then preview.</p>
        <div class="actions wrap"><a class="btn primary" href="/demo/${encodeURIComponent(rec.DemoID)}/preview" target="_blank" rel="noopener">Open live preview</a>
        <a class="btn" href="/api/demosites/${encodeURIComponent(rec.DemoID)}/download">Download HTML</a>
        ${PERMS.demoSave ? '<button class="btn" id="saveFolder">Save to demo-sites folder</button>' : ''}</div>
        <h3 class="section-title">Company</h3><p><a id="toCompany">Open company #${esc(rec.CompanyID)}</a>${rec.LeadID ? ` · <a id="toLead">Lead #${esc(rec.LeadID)} (${esc(rec.LeadStatus || '')})</a>` : ''}</p>`;
      $('#toCompany').addEventListener('click', () => openRecord('companies', rec.CompanyID));
      if ($('#toLead')) $('#toLead').addEventListener('click', () => openRecord('leads', rec.LeadID));
      if ($('#saveFolder')) $('#saveFolder').addEventListener('click', async () => {
        try { const r = await api('POST', `/api/demosites/${encodeURIComponent(rec.DemoID)}/save`); toast('Saved: ' + r.file, 4000); } catch (err) { toast(err.message, 6000); }
      });
      return;
    }
    if (entity === 'leads') {
      const acts = await api('GET', `/api/data/activities?f_LeadID=${rec.LeadID}&size=50`);
      box.innerHTML = `<h3 class="section-title">Company</h3><p><a id="toCompany">Open company #${esc(rec.CompanyID)}</a> · <a id="toWeb">Web presence</a></p>
        <h3 class="section-title">Activities (${acts.total})</h3>
        ${acts.rows.length ? `<ul class="list">${acts.rows.map(a => `<li><b>${esc(fmtDT(a.ActivityDate))}</b> · ${esc(a.ActivityType)} · ${esc(a.Agent || '')}<br><span class="muted">${esc(a.Outcome || '')}</span></li>`).join('')}</ul>` : '<p class="muted">None yet.</p>'}
        ${canWrite('activities') ? `<form id="actForm" class="form"><label>Type<select name="ActivityType">${META.activityTypes.map(t => `<option>${t}</option>`).join('')}</select></label>
          <label>Agent<select name="Agent">${META.agents.map(t => `<option ${t === 'Owner' ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
          <label class="full">Outcome<textarea name="Outcome" placeholder="What happened?"></textarea></label></form>
          <div class="actions"><button class="btn" id="addAct">Log activity</button></div>` : ''}`;
      $('#toCompany').addEventListener('click', () => openRecord('companies', rec.CompanyID));
      $('#toWeb').addEventListener('click', () => openRecord('webpresence', rec.CompanyID).catch(() => openRecord('webpresence', null, { CompanyID: rec.CompanyID })));
      if ($('#addAct')) $('#addAct').addEventListener('click', async () => {
        const body = Object.fromEntries(new FormData($('#actForm'))); body.LeadID = rec.LeadID; body.ActivityDate = new Date().toISOString();
        try { await api('POST', '/api/data/activities', body); toast('Activity logged.'); openRecord('leads', rec.LeadID); } catch (err) { toast(err.message, 5000); }
      });
    }
    if (entity === 'companies') {
      const leads = await api('GET', `/api/data/leads?f_CompanyID=${rec.CompanyID}`);
      const demo = await api('GET', `/api/data/demosites?f_CompanyID=${rec.CompanyID}`).catch(() => ({ rows: [] }));
      box.innerHTML = `${demo.rows.length ? `<h3 class="section-title">Demo site</h3><p><a data-demo="${demo.rows[0].DemoID}">${esc(demo.rows[0].BrandName)}</a> · <span class="pill">${esc(demo.rows[0].Status)}</span></p>` : ''}<h3 class="section-title">Lead</h3>${leads.rows.length ? leads.rows.map(l => `<p><a data-lead="${l.LeadID}">Lead #${l.LeadID}</a> · <span class="pill ${esc(l.Status)}">${esc(l.Status)}</span></p>`).join('')
        : (canWrite('leads') ? '<p class="muted">No lead yet.</p><button class="btn" id="mkLead">Create lead</button>' : '<p class="muted">No lead.</p>')}`;
      box.querySelectorAll('[data-lead]').forEach(a => a.addEventListener('click', () => openRecord('leads', a.dataset.lead)));
      box.querySelectorAll('[data-demo]').forEach(a => a.addEventListener('click', () => openRecord('demosites', a.dataset.demo)));
      if ($('#mkLead')) $('#mkLead').addEventListener('click', () => openRecord('leads', null, { CompanyID: rec.CompanyID, Status: 'New' }));
    }
  }
  // ---------- duplicate check
  const DUP_HELP = {
    Companies: 'Two company rows that look like the same business. Merge keeps the one you choose, fills its blanks from the other, moves the lead, activities and web info, then removes the other company.',
    Leads: 'A company should have one lead. Merge keeps the lead you choose, takes the further-along status and any missing details, moves all activities to it, and removes the other lead.',
    WebPresence: 'A company should have one web-presence row. Fix keeps the most recently checked row, fills its blanks and carries over the notes from the others, then removes the extra rows.',
    Activities: 'The same call, email or note was logged twice on the same day for the same lead. Remove the extra one, or mark them as not a duplicate.'
  };
  // dupPanel — the Possible duplicates panel: counts by category and severity.
  function dupPanel(params) {
    const cats = ['Companies', 'Leads', 'WebPresence', 'Activities'];
    const n = c => DUP ? DUP.byCategory.filter(x => x.Category === c).reduce((t, x) => t + x.N, 0) : '…';
    const sev = s => DUP ? DUP.byCategory.filter(x => x.Severity === s).reduce((t, x) => t + x.N, 0) : '…';
    return `<div class="card note">
      <div class="dup-summary">
        <button class="dup-tile ${!params.f_Category ? 'on' : ''} ${DUP && !DUP.total ? 'zero' : ''}" data-cat=""><b>${DUP ? DUP.total : '…'}</b>All tables</button>
        ${cats.map(c => `<button class="dup-tile ${params.f_Category === c ? 'on' : ''} ${n(c) === 0 ? 'zero' : ''}" data-cat="${c}"><b>${n(c)}</b>${c === 'WebPresence' ? 'Web presence' : c}</button>`).join('')}
        <span style="flex:1"></span>
        <span class="muted">Exact ${sev('Exact')} · Likely ${sev('Likely')} · Possible ${sev('Possible')}<br>Checked ${DUP ? esc(new Date(DUP.checkedOn).toLocaleTimeString()) : '…'} · auto every 30 s</span>
        <button class="btn" id="dupNow">Check now</button>
      </div>
      <div class="muted"><b>Exact</b> = breaks a no-duplicates rule (same source ID, same name + ZIP, two leads or two web rows for one company). <b>Likely</b> = same phone, email or website, or an activity logged twice. <b>Possible</b> = same name in another ZIP. Click a row to compare and fix it.</div>
    </div>`;
  }
  // wireDupPanel — click handlers for the duplicate panel buttons.
  function wireDupPanel(entity, params) {
    document.querySelectorAll('.dup-tile').forEach(t => t.addEventListener('click', () => go(entity, { ...params, f_Category: t.dataset.cat, page: 1 })));
    $('#dupNow').addEventListener('click', async () => { await checkDuplicates(); route(); toast(DUP && DUP.total ? `${DUP.total} duplicate${DUP.total === 1 ? '' : 's'} found.` : 'No duplicates found.'); });
  }
  // openCompare — side-by-side compare with Merge / Fix / Not a duplicate actions.
  async function openCompare(cat, a, b) {
    let d;
    try { d = await api('GET', `/api/duplicates/compare?cat=${encodeURIComponent(cat)}&a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`); }
    catch (err) { toast(err.message, 5000); await checkDuplicates(); route(); return; }
    let rows, buttons;
    if (cat === 'Companies') {
      rows = [
        ['Company ID', x => x.company.CompanyID], ['Name', x => x.company.CompanyName], ['Industry', x => x.company.Industry],
        ['Address', x => x.company.Address], ['City', x => x.company.City], ['County', x => x.company.County], ['ZIP', x => x.company.Zip],
        ['Phone', x => x.company.Phone], ['Email', x => x.company.Email], ['Contact', x => x.company.ContactName],
        ['Source ID', x => x.company.SourceRecordID], ['Imported', x => fmtDT(x.company.ImportedOn)],
        ['Lead status', x => x.lead && x.lead.Status], ['Activities', x => x.lead ? x.lead.Activities : 0],
        ['Website', x => x.web && (x.web.WebsiteURL || (x.web.HasWebsite ? 'Yes' : 'No'))], ['Web notes', x => x.web && x.web.Notes]];
      buttons = [['keepA', 'Keep A, remove B'], ['keepB', 'Keep B, remove A'], ['dismiss', 'Not a duplicate']];
    } else if (cat === 'Leads') {
      rows = [['Lead ID', x => x.LeadID], ['Company', x => x.CompanyName], ['Status', x => x.Status], ['Batch', x => x.BatchName],
        ['Agent', x => x.AssignedAgent], ['Next follow-up', x => x.NextFollowUp ? fmtDate(x.NextFollowUp) : null], ['Deal value', x => x.DealValue], ['Monthly plan', x => x.MonthlyPlan],
        ['Demo URL', x => x.DemoURL], ['Activities', x => x.Activities], ['Updated', x => fmtDT(x.UpdatedOn)]];
      buttons = [['keepA', 'Keep A, merge B into it'], ['keepB', 'Keep B, merge A into it']];
    } else if (cat === 'WebPresence') {
      const all = d.rows; d = Object.fromEntries(all.map((r, i) => [i, r]));
      rows = [['Checked', x => fmtDT(x.CheckedOn)], ['Has website', x => x.HasWebsite == null ? null : (x.HasWebsite ? 'Yes' : 'No')], ['Website', x => x.WebsiteURL],
        ['Google profile', x => x.HasGoogleProfile == null ? null : (x.HasGoogleProfile ? 'Yes' : 'No')], ['Facebook', x => x.HasFacebook == null ? null : (x.HasFacebook ? 'Yes' : 'No')], ['Notes', x => x.Notes]];
      d.cols = all.map((r, i) => i); d.title = all[0].CompanyName;
      buttons = [['fix', 'Keep newest row, remove the extras']];
    } else {
      rows = [['Activity ID', x => x.ActivityID], ['Lead', x => x.LeadID], ['When', x => fmtDT(x.ActivityDate)], ['Type', x => x.ActivityType], ['Agent', x => x.Agent], ['Outcome', x => x.Outcome]];
      buttons = [['keepA', 'Keep A, remove B'], ['keepB', 'Keep B, remove A'], ['dismiss', 'Not a duplicate']];
    }
    const cols = d.cols || ['a', 'b'];
    const head = d.cols ? d.cols.map(i => i === 0 ? 'Newest (kept)' : `Extra ${i}`) : ['A', 'B'];
    const admin = !!PERMS.duplicates;   // may resolve duplicates (admin, manager)
    $('#drawerTitle').textContent = cat === 'WebPresence' ? `Web-presence rows: ${d.title || ''}` : `Compare duplicate ${cat === 'Companies' ? 'companies' : cat.toLowerCase()}`;
    $('#drawerBody').innerHTML = `
      <div class="table-wrap"><table class="compare"><thead><tr><th></th>${head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>
      ${rows.map(([l, f]) => { const vals = cols.map(c => f(d[c])); const diff = new Set(vals.map(v => String(v ?? ''))).size > 1;
        return `<tr class="${diff ? 'diff' : ''}"><th>${esc(l)}</th>${vals.map(v => `<td>${esc(v ?? '—')}</td>`).join('')}</tr>`; }).join('')}
      </tbody></table></div>
      <p class="hint">Highlighted rows differ. ${esc(DUP_HELP[cat])} Every decision is written to the Audit log.</p>
      ${admin ? `<div class="actions wrap">${buttons.map(([k, l]) => `<button class="btn ${k === 'dismiss' ? 'ghost' : ''}" data-dup="${k}">${esc(l)}</button>`).join('')}</div>`
        : '<p class="muted">Read-only account: ask an admin to fix this.</p>'}`;
    $('#drawer').classList.remove('hidden');
    document.querySelectorAll('[data-dup]').forEach(btn => btn.addEventListener('click', async () => {
      const act = btn.dataset.dup;
      if (act !== 'dismiss' && !btn.dataset.armed) {
        btn.dataset.armed = '1'; const t = btn.textContent; btn.textContent = 'Click again to confirm'; btn.classList.add('danger');
        setTimeout(() => { delete btn.dataset.armed; btn.textContent = t; btn.classList.remove('danger'); }, 4000); return;
      }
      try {
        if (act === 'dismiss') { await api('POST', '/api/duplicates/dismiss', { cat, a, b }); toast('Marked as not a duplicate.'); }
        else if (act === 'fix') { await api('POST', '/api/duplicates/resolve', { cat, keepId: a }); toast('Extra web-presence rows removed.'); }
        else { const keepId = act === 'keepA' ? a : b, removeId = act === 'keepA' ? b : a;
          await api('POST', '/api/duplicates/resolve', { cat, keepId, removeId }); toast(`Fixed: kept #${keepId}, removed #${removeId}.`); }
        closeDrawer(); await checkDuplicates(); route();
      } catch (err) { toast(err.message, 6000); }
    }));
  }

  // ---------- logins (admin): create / edit role and active / reset password; "Change my password" for everyone
  /** POLICY — shown under every new-password box (the server enforces the same rules, SKY-AUTH-006). */
  const POLICY = '12+ characters, upper and lower case letters, at least one number, not the username, not a common password.';
  /** pwRow — a password input with a show/hide toggle. */
  const pwRow = (name, label, auto) => `<label class="full">${esc(label)}<span class="pwbox"><input type="password" name="${name}" autocomplete="${auto}" required><button type="button" class="btn small ghost pwshow" data-for="${name}">Show</button></span></label>`;
  /** openForm — shows a small form in the drawer; onSave(values) runs on submit, errors stay in the form. */
  function openForm(title, html, saveLabel, onSave) {
    $('#drawerTitle').textContent = title;
    $('#drawerBody').innerHTML = `<form id="uform" class="form" autocomplete="off">${html}<p id="uerr" class="error full"></p><div class="actions full"><button type="button" class="btn" id="ucancel">Cancel</button><button class="btn primary" type="submit">${esc(saveLabel)}</button></div></form>`;
    $('#drawer').classList.remove('hidden');
    $('#ucancel').addEventListener('click', closeDrawer);
    document.querySelectorAll('.pwshow').forEach(b => b.addEventListener('click', () => { const i = $(`#uform [name="${b.dataset.for}"]`); i.type = i.type === 'password' ? 'text' : 'password'; b.textContent = i.type === 'password' ? 'Show' : 'Hide'; }));
    $('#uform').addEventListener('submit', async ev => {
      ev.preventDefault();
      const v = Object.fromEntries(new FormData(ev.target).entries());
      if (v.password !== undefined && v.password2 !== undefined && v.password !== v.password2) { $('#uerr').textContent = 'The two new passwords do not match.'; return; }
      try { await onSave(v); } catch (err) { $('#uerr').textContent = err.message; }
    });
    $('#uform input').focus();
  }
  /** renderUsers — the Logins screen: every login with role, status, lock state, created/changed by and last sign-in. */
  async function renderUsers() {
    $('#title').textContent = 'Logins'; $('#crumbs').textContent = '';
    $('#view').innerHTML = '<p class="muted">Loading…</p>';
    let d; try { d = await api('GET', '/api/users'); } catch (err) { $('#view').innerHTML = `<div class="card">${esc(err.message)}</div>`; return; }
    const roleLabel = k => (d.roles.find(r => r.key === k) || { label: k }).label;
    const roleOpts = sel => d.roles.map(r => `<option value="${esc(r.key)}" ${r.key === sel ? 'selected' : ''}>${esc(r.label)} — ${esc(r.about)}</option>`).join('');
    const status = u => !u.IsActive ? '<span class="pill Lost">Disabled</span>' : u.LockedUntil ? `<span class="pill NoSite" title="Locked until ${esc(fmtDT(u.LockedUntil))}">Locked</span>` : '<span class="pill Won">Active</span>';
    const count = k => d.rows.filter(u => u.Role === k && u.IsActive).length;
    $('#view').innerHTML = `
      <div class="kpis">${d.roles.map(r => `<div class="card kpi" title="${esc(r.about)}"><div class="v">${count(r.key)}</div><div class="l">${esc(r.label)} (active)</div></div>`).join('')}</div>
      <div class="card note"><b>Roles:</b> ${d.roles.map(r => `<b>${esc(r.label)}</b> — ${esc(r.about)}`).join(' · ')}.<br>Every change asks for your own password, is recorded in the Audit log, and signs the changed login out. Passwords are stored scrambled (bcrypt) and can be reset but never shown.</div>
      <div class="toolbar"><input type="search" id="ufind" placeholder="Search logins…"><select id="urole"><option value="">All roles</option>${d.roles.map(r => `<option value="${esc(r.key)}">${esc(r.label)}</option>`).join('')}</select>
        <span class="muted">${d.rows.length} login(s)</span><span style="flex:1"></span><button class="btn primary" id="newUser">+ New login</button></div>
      <div class="table-wrap"><table><thead><tr><th>Username</th><th>Role</th><th>Status</th><th>Failed sign-ins</th><th>Created</th><th>Last change</th><th>Last sign-in</th><th></th></tr></thead><tbody id="urows">
      ${d.rows.map(u => `<tr data-name="${esc(u.Username.toLowerCase())}" data-role="${esc(u.Role)}"><td><b>${esc(u.Username)}</b>${u.UserID === d.me ? ' <span class="pill">you</span>' : ''}</td><td>${esc(roleLabel(u.Role))}</td>
        <td>${status(u)}</td><td>${u.FailedAttempts ? esc(u.FailedAttempts) : ''}</td>
        <td>${esc(fmtDate(u.CreatedOn))}${u.CreatedBy ? ` <span class="muted">by ${esc(u.CreatedBy)}</span>` : ''}</td>
        <td>${u.UpdatedOn ? esc(fmtDate(u.UpdatedOn)) + (u.UpdatedBy ? ` <span class="muted">by ${esc(u.UpdatedBy)}</span>` : '') : ''}</td>
        <td>${esc(u.LastLoginOn ? fmtDT(u.LastLoginOn) : 'never')}</td>
        <td class="actions wrap"><button class="btn small" data-edit="${u.UserID}">Edit</button><button class="btn small" data-reset="${u.UserID}">Reset password</button>${u.LockedUntil ? `<button class="btn small" data-unlock="${u.UserID}">Unlock</button>` : ''}</td></tr>`).join('')}
      </tbody></table></div>`;
    const filter = () => { const q = $('#ufind').value.trim().toLowerCase(), r = $('#urole').value;
      document.querySelectorAll('#urows tr').forEach(tr => tr.classList.toggle('hidden', (q && !tr.dataset.name.includes(q)) || (r && tr.dataset.role !== r))); };
    $('#ufind').addEventListener('input', filter); $('#urole').addEventListener('change', filter);
    const byId = id => d.rows.find(u => u.UserID === parseInt(id, 10));
    $('#newUser').addEventListener('click', () => openForm('New login', `
        <label>Username<input name="username" maxlength="50" required pattern="[A-Za-z0-9._\\-]{3,50}" title="3-50 letters, numbers, dot, dash or underscore"></label>
        <label>Role<select name="role">${roleOpts('viewer')}</select></label>
        ${pwRow('password', 'Password', 'new-password')}${pwRow('password2', 'Repeat password', 'new-password')}<p class="fhint full">${esc(POLICY)}</p>
        ${pwRow('myPassword', 'Your password (to confirm)', 'current-password')}`, 'Create login',
      async v => { await api('POST', '/api/users', { username: v.username, role: v.role, password: v.password, myPassword: v.myPassword }); closeDrawer(); toast(`Login ${v.username} created`); renderUsers(); }));
    document.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => {
      const u = byId(b.dataset.edit), self = u.UserID === d.me;
      openForm(`Edit login: ${u.Username}`, `
        <label class="full">Role<select name="role" ${self ? 'disabled' : ''}>${roleOpts(u.Role)}</select></label>
        <label>Status<select name="isActive" ${self ? 'disabled' : ''}><option value="1" ${u.IsActive ? 'selected' : ''}>Active (can sign in)</option><option value="0" ${u.IsActive ? '' : 'selected'}>Disabled (cannot sign in)</option></select></label>
        ${self ? '<p class="fhint full">This is your own login: you cannot remove your admin role or disable yourself.</p>' : ''}
        ${pwRow('myPassword', 'Your password (to confirm)', 'current-password')}`, 'Save changes',
        async v => { await api('PUT', `/api/users/${u.UserID}`, { role: v.role || u.Role, isActive: v.isActive === undefined ? !!u.IsActive : v.isActive === '1', myPassword: v.myPassword }); closeDrawer(); toast('Login updated'); renderUsers(); });
    }));
    document.querySelectorAll('[data-reset]').forEach(b => b.addEventListener('click', () => {
      const u = byId(b.dataset.reset);
      openForm(`Reset password: ${u.Username}`, `${pwRow('password', 'New password', 'new-password')}${pwRow('password2', 'Repeat new password', 'new-password')}<p class="fhint full">${esc(POLICY)} Tell the person the new password in person or by phone, not by email.</p>
        ${pwRow('myPassword', 'Your password (to confirm)', 'current-password')}`, 'Set new password',
        async v => { await api('POST', `/api/users/${u.UserID}/password`, { password: v.password, myPassword: v.myPassword }); closeDrawer(); toast(`Password for ${u.Username} changed`); renderUsers(); });
    }));
    document.querySelectorAll('[data-unlock]').forEach(b => b.addEventListener('click', async () => {
      try { await api('POST', `/api/users/${b.dataset.unlock}/unlock`); toast('Sign-in lock cleared'); renderUsers(); } catch (err) { toast(err.message, 6000); }
    }));
  }
  /** Change my password — available to every signed-in user (sidebar button). */
  $('#myPassword').addEventListener('click', () => openForm('Change my password', `${pwRow('currentPassword', 'Current password', 'current-password')}
      ${pwRow('password', 'New password', 'new-password')}${pwRow('password2', 'Repeat new password', 'new-password')}<p class="fhint full">${esc(POLICY)}</p>`, 'Change password',
    async v => { await api('POST', '/api/me/password', { currentPassword: v.currentPassword, newPassword: v.password }); closeDrawer(); toast('Your password was changed'); }));

  // ---------- system log (admin): health check + newest log entries, codes link to the Troubleshooting Guide
  /** renderSyslog — shows /api/health and /api/logs; level filter; each code opens its guide entry. */
  async function renderSyslog() {
    $('#title').textContent = 'System log'; $('#crumbs').textContent = '';
    const level = parseHash().params.level || 'info';
    $('#view').innerHTML = '<p class="muted">Loading…</p>';
    let h, l;
    try { [h, l] = await Promise.all([api('GET', '/api/health'), api('GET', '/api/logs?level=' + encodeURIComponent(level))]); }
    catch (err) { $('#view').innerHTML = `<div class="card">${esc(err.message)}</div>`; return; }
    const guide = c => c ? `<a class="ext" target="_blank" rel="noopener" href="/docs/SkyTech_Troubleshooting_Guide.html#${encodeURIComponent(c)}">${esc(c)}</a>` : '';
    $('#view').innerHTML = `
      <div class="kpis">
        <div class="card kpi ${h.ok ? '' : 'alert'}"><div class="v">${h.ok ? 'OK' : esc(h.db)}</div><div class="l">Database · ${esc(h.mode)} · ${esc(h.dbMs)} ms</div></div>
        <div class="card kpi"><div class="v">v${esc(h.version)}</div><div class="l">Admin site · Node ${esc(h.node)}</div></div>
        <div class="card kpi"><div class="v">${l.rows.filter(r => r.level === 'error').length}</div><div class="l">Errors in view</div></div>
      </div>
      <div class="card note">Log files: <code>${esc(h.logDir)}</code>. Each problem on screen shows a code and a reference (ref); find the same ref here. Codes link to the <a class="ext" target="_blank" rel="noopener" href="/docs/SkyTech_Troubleshooting_Guide.html">Troubleshooting Guide</a>.</div>
      <div class="toolbar"><select id="lvl">${['info', 'warn', 'error'].map(v => `<option value="${v}" ${v === level ? 'selected' : ''}>Level: ${v} and above</option>`).join('')}</select><span style="flex:1"></span><button class="btn" id="relog">Refresh</button></div>
      <div class="table-wrap"><table><thead><tr><th>Time</th><th>Level</th><th>Category</th><th>Code</th><th>Ref</th><th>User</th><th>Message</th></tr></thead><tbody>
      ${l.rows.map(r => `<tr class="lg-${esc(r.level)}"><td>${esc(fmtDT(r.ts))}</td><td>${esc(r.level)}</td><td>${esc(r.category)}</td><td>${guide(r.code)}</td><td>${esc(r.reqId || '')}</td><td>${esc(r.user || '')}</td><td title="${esc(JSON.stringify(r.details || ''))}">${esc(r.msg)}</td></tr>`).join('') || '<tr><td colspan="7" class="muted">No entries at this level.</td></tr>'}
      </tbody></table></div>`;
    $('#lvl').addEventListener('change', ev => go('syslog', { level: ev.target.value }));
    $('#relog').addEventListener('click', () => route());
  }

  /** closeDrawer — hides the side panel (record editor / compare view). */
  function closeDrawer() { $('#drawer').classList.add('hidden'); }
  $('#drawerClose').addEventListener('click', closeDrawer);
  $('#drawer').addEventListener('click', ev => { if (ev.target.id === 'drawer') closeDrawer(); });
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape') closeDrawer(); });

  start().catch(() => showLogin());
})();

// Version: V2.3 (2026-10-10) — admin-site/public/app.js — V2.3
