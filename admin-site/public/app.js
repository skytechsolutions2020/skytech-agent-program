// Version: V1.0 (2026-10-02) — admin-site/public/app.js — V1.0
// SkyTech Admin site front end (no framework). Routes: #dashboard, #<entity>?search=&f_Col=val
(() => {
  const $ = s => document.querySelector(s);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let META = null, ME = null, charts = [];

  async function api(method, url, body) {
    const r = await fetch(url, { method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined, credentials: 'same-origin' });
    const data = await r.json().catch(() => ({}));
    if (r.status === 401 && url !== '/api/login') { showLogin(); throw new Error('Please log in.'); }
    if (!r.ok) throw new Error(data.error || r.statusText);
    return data;
  }
  function toast(msg, ms = 2600) { const t = $('#toast'); t.textContent = msg; t.classList.remove('hidden'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.add('hidden'), ms); }
  const fmtDate = v => v ? String(v).slice(0, 10) : '';
  const fmtDT = v => v ? new Date(v).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
  const money = v => '$' + Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
  function cell(def, v, col) {
    if (v === null || v === undefined || v === '') return '<span class="muted">—</span>';
    if (col === 'Status') return `<span class="pill ${esc(v)}">${esc(v)}</span>`;
    if (def && def.type === 'bit') return v ? 'Yes' : 'No';
    if (def && def.type === 'date') return esc(fmtDate(v));
    if (def && def.type === 'datetime') return esc(fmtDT(v));
    if (def && def.type === 'money') return esc(money(v));
    if (/URL$/.test(col) && /^https?:\/\//i.test(v)) return `<a href="${esc(v)}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">${esc(v)}</a>`;
    return esc(v);
  }

  // ---------- auth
  function showLogin() { $('#app').classList.add('hidden'); $('#login').classList.remove('hidden'); }
  $('#loginForm').addEventListener('submit', async e => {
    e.preventDefault(); $('#loginError').textContent = '';
    const f = new FormData(e.target);
    try { await api('POST', '/api/login', { username: f.get('username'), password: f.get('password') }); e.target.reset(); await start(); }
    catch (err) { $('#loginError').textContent = err.message; }
  });
  $('#logout').addEventListener('click', async () => { await api('POST', '/api/logout'); showLogin(); });
  $('#menu').addEventListener('click', () => $('.sidebar').classList.toggle('open'));

  async function start() {
    const me = await api('GET', '/api/me'); ME = me.user;
    META = await api('GET', '/api/meta');
    $('#who').textContent = `${ME.name} (${ME.role})`; $('#mode').textContent = me.mode;
    $('#login').classList.add('hidden'); $('#app').classList.remove('hidden');
    route();
  }
  const canWrite = e => ME && ME.role === 'admin' && META.entities[e].writable;

  // ---------- routing
  function parseHash() {
    const [v, qs] = (location.hash.slice(1) || 'dashboard').split('?');
    return { view: v, params: Object.fromEntries(new URLSearchParams(qs || '')) };
  }
  function go(view, params = {}) {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null)).toString();
    location.hash = view + (qs ? '?' + qs : '');
  }
  window.addEventListener('hashchange', route);
  document.querySelectorAll('#nav a').forEach(a => a.addEventListener('click', () => { $('.sidebar').classList.remove('open'); go(a.dataset.view); }));

  function route() {
    if (!META) return;
    const { view, params } = parseHash();
    document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('active', a.dataset.view === view));
    charts.forEach(c => c.destroy()); charts = [];
    if (view === 'dashboard') return renderDashboard();
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
  function miniTable(rows, cols, entity, key, empty) {
    if (!rows || !rows.length) return `<p class="muted">${esc(empty)}</p>`;
    const defs = Object.assign({}, ...Object.values(META.entities).map(e => e.columns));
    return `<div class="table-wrap"><table><thead><tr>${cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${
      rows.map(r => `<tr ${entity ? `data-entity="${entity}" data-open="${esc(r[key])}"` : ''}>${cols.map(c => `<td>${cell(defs[c], r[c], c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }

  // ---------- table view
  async function renderTable(entity, params) {
    const e = META.entities[entity];
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
      <div class="table-wrap"><table><thead><tr>${e.listColumns.map(c => `<th data-sort="${c}">${esc(c)}${params.sort === c ? (params.dir === 'asc' ? ' ▲' : ' ▼') : ''}</th>`).join('')}</tr></thead><tbody id="rows"><tr><td colspan="${e.listColumns.length}" class="muted">Loading…</td></tr></tbody></table></div>
      <div class="pager"><span id="count" class="muted"></span><button class="btn small" id="prev">‹ Prev</button><button class="btn small" id="next">Next ›</button></div>`;
    let t; $('#q').addEventListener('input', ev => { clearTimeout(t); t = setTimeout(() => go(entity, { ...params, search: ev.target.value, page: 1 }), 350); });
    document.querySelectorAll('[data-filter]').forEach(s => s.addEventListener('change', () => go(entity, { ...params, ['f_' + s.dataset.filter]: s.value, page: 1 })));
    document.querySelectorAll('[data-unfilter]').forEach(b => b.addEventListener('click', () => { const p = { ...params }; delete p[b.dataset.unfilter]; go(entity, p); }));
    document.querySelectorAll('[data-sort]').forEach(th => th.addEventListener('click', () => go(entity, { ...params, sort: th.dataset.sort, dir: params.sort === th.dataset.sort && params.dir === 'asc' ? 'desc' : 'asc' })));
    if ($('#new')) $('#new').addEventListener('click', () => openRecord(entity, null, Object.fromEntries(filters.map(([k, v]) => [k.slice(2), v]))));
    const qs = new URLSearchParams({ size: 25, ...params }).toString();
    const data = await api('GET', `/api/data/${entity}?${qs}`);
    $('#rows').innerHTML = data.rows.length ? data.rows.map(r => `<tr data-key="${esc(r[e.key])}">${e.listColumns.map(c => `<td title="${esc(r[c])}">${cell(e.columns[c], r[c], c)}</td>`).join('')}</tr>`).join('')
      : `<tr><td colspan="${e.listColumns.length}" class="muted">No records.</td></tr>`;
    if (e.writable || entity === 'leads') document.querySelectorAll('#rows tr[data-key]').forEach(tr => tr.addEventListener('click', () => openRecord(entity, tr.dataset.key)));
    else if (entity === 'duplicates') document.querySelectorAll('#rows tr[data-key]').forEach(tr => tr.addEventListener('click', () => openRecord('companies', tr.dataset.key)));
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
    else if (def.type === 'int' || def.type === 'money') input = `<input type="number" step="${def.type === 'money' ? '0.01' : '1'}" name="${name}" value="${esc(v)}">`;
    else input = `<input name="${name}" value="${esc(v)}" ${def.max ? `maxlength="${def.max}"` : ''}>`;
    return `<label class="${full}">${esc(name)}${def.required ? ' *' : ''}${input}</label>`;
  }

  async function openRecord(entity, key, preset = {}) {
    const e = META.entities[entity];
    const isNew = key == null;
    let rec = isNew ? preset : await api('GET', `/api/data/${entity}/${encodeURIComponent(key)}`);
    const writable = canWrite(entity);
    const editableName = (n, c) => writable && !c.readonly && !c.view && (n !== e.key || (e.keyIsInput && isNew));
    $('#drawerTitle').textContent = isNew ? `New ${e.label.replace(/s$/, '').toLowerCase()}` : (rec.CompanyName || rec.Name_A || `${e.label} #${key}`);
    const cols = Object.entries(e.columns).filter(([n, c]) => !(isNew && (c.readonly || c.view)));
    $('#drawerBody').innerHTML = `
      <form id="recForm" class="form">${cols.map(([n, c]) => field(n, c, rec[n], editableName(n, c))).join('')}</form>
      <div class="actions">
        ${!isNew && writable ? '<button class="btn danger" id="del">Delete</button>' : ''}
        <span style="flex:1"></span>
        ${writable ? `<button class="btn primary" id="save">${isNew ? 'Create' : 'Save changes'}</button>` : '<span class="muted">Read-only</span>'}
      </div>
      <div id="related"></div>`;
    $('#drawer').classList.remove('hidden');
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
  async function renderRelated(entity, rec) {
    const box = $('#related');
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
      box.innerHTML = `<h3 class="section-title">Lead</h3>${leads.rows.length ? leads.rows.map(l => `<p><a data-lead="${l.LeadID}">Lead #${l.LeadID}</a> · <span class="pill ${esc(l.Status)}">${esc(l.Status)}</span></p>`).join('')
        : (canWrite('leads') ? '<p class="muted">No lead yet.</p><button class="btn" id="mkLead">Create lead</button>' : '<p class="muted">No lead.</p>')}`;
      box.querySelectorAll('[data-lead]').forEach(a => a.addEventListener('click', () => openRecord('leads', a.dataset.lead)));
      if ($('#mkLead')) $('#mkLead').addEventListener('click', () => openRecord('leads', null, { CompanyID: rec.CompanyID, Status: 'New' }));
    }
  }
  function closeDrawer() { $('#drawer').classList.add('hidden'); }
  $('#drawerClose').addEventListener('click', closeDrawer);
  $('#drawer').addEventListener('click', ev => { if (ev.target.id === 'drawer') closeDrawer(); });
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape') closeDrawer(); });

  start().catch(() => showLogin());
})();
