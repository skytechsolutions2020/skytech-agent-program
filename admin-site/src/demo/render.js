// Version: V1.0 (2026-10-05) — admin-site/src/demo/render.js — V1.0
// SkyTech_WebsiteDeveloper page renderer. Turns one DemoSites record (design fields + company facts)
// into a complete, self-contained one-page website. Used by:
//   - scripts/build-demos.js  (writes demo-sites/<slug>/index.html)
//   - the Admin site live preview and "Save to folder" (renders straight from the database)
// Honesty rules: preview banner + noindex until the business approves; no reviews, prices or
// licence claims; concept logo and original illustrations only (no third-party images).
'use strict';

const TEMPLATE_VERSION = 'V2.0';
const LAYOUTS = ['split', 'bold', 'classic'];
const LOGO_SHAPES = ['drop', 'roof', 'arch', 'circle'];
const ILLUSTRATIONS = ['plumbing-home', 'house-frame', 'rowhouses'];
const FONTS = ['Plus Jakarta Sans', 'Inter', 'Barlow Condensed', 'Barlow', 'Playfair Display', 'Source Sans 3', 'DM Serif Display', 'Manrope', 'Outfit'];
const STATUSES = ['Draft', 'ReadyForReview', 'Approved', 'Sent', 'Published', 'Removed'];

const e = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hex = (v, d) => (/^#[0-9a-fA-F]{6}$/.test(String(v || '').trim()) ? String(v).trim() : d);
const font = (v, d) => (FONTS.includes(String(v || '').trim()) ? String(v).trim() : d);
const FALLBACK = { 'Playfair Display': "Georgia,'Times New Roman',serif", 'DM Serif Display': "Georgia,'Times New Roman',serif",
  'Barlow Condensed': "'Arial Narrow','Roboto Condensed','Helvetica Neue',Arial,sans-serif" };
const stack = f => `'${f}',${FALLBACK[f] || "system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif"}`;
const pick = (v, list, d) => (list.includes(v) ? v : d);
const lines = v => String(v || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
const tel = p => { const d = String(p || '').replace(/\D/g, ''); return d.length >= 10 ? '+1' + d.slice(-10) : ''; };
const ini = s => String(s || '').trim();

function mix(h, w) { // blend hex colour h with white by w (0..1)
  const n = parseInt(h.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const m = c => Math.round(c + (255 - c) * w).toString(16).padStart(2, '0');
  return '#' + m(r) + m(g) + m(b);
}

// ---------- icons (24px line icons, original)
const I = {
  pipe: '<path d="M3 8h8a3 3 0 0 1 3 3v10"/><path d="M3 5v6"/><path d="M11 21h6"/><path d="M17 9h4"/><path d="M14 11h7"/>',
  drain: '<circle cx="12" cy="12" r="8"/><path d="M12 8a4 4 0 1 1-4 4"/><path d="M12 11.5a.5.5 0 1 1-.5.5"/>',
  heater: '<rect x="7" y="3" width="10" height="16" rx="3"/><path d="M10 21h4"/><path d="M12 9c1.2 1.5 1.8 2.4 1.8 3.2a1.8 1.8 0 0 1-3.6 0c0-.8.6-1.7 1.8-3.2z"/>',
  faucet: '<path d="M4 10h9a4 4 0 0 1 4 4v1"/><path d="M8 10V7h3v3"/><path d="M6 7h7"/><path d="M17 18c.8 1 1.2 1.6 1.2 2.1a1.2 1.2 0 0 1-2.4 0c0-.5.4-1.1 1.2-2.1z"/>',
  pump: '<rect x="6" y="9" width="12" height="11" rx="2"/><path d="M12 9V4h6"/><path d="M9 14h6"/><path d="M9 17h6"/>',
  kitchen: '<rect x="3" y="11" width="18" height="10" rx="1"/><path d="M3 15h18"/><path d="M12 11v10"/><path d="M6 3h4v5H6z"/><path d="M14 4h4"/><path d="M16 4v4"/>',
  bath: '<path d="M3 12h18v3a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5z"/><path d="M6 12V5a2 2 0 0 1 4 0"/><path d="M7 20l-1 2"/><path d="M17 20l1 2"/>',
  stairs: '<path d="M3 20h5v-4h4v-4h4V8h5"/><path d="M3 4h18"/>',
  deck: '<path d="M3 10h18"/><path d="M5 10v10"/><path d="M19 10v10"/><path d="M3 14h18"/><path d="M3 18h18"/><path d="M7 10V6l5-3 5 3v4"/>',
  roller: '<rect x="4" y="3" width="13" height="5" rx="1"/><path d="M17 5h3v6h-8v3"/><rect x="10" y="14" width="4" height="7" rx="1"/>',
  addition: '<path d="M3 11 9 6l6 5v9H3z"/><path d="M15 13h6v7h-6"/><path d="M18 3v6"/><path d="M15 6h6"/>',
  hammer: '<path d="M13.5 10.5 4.6 19.4a1.5 1.5 0 0 1-2.1-2.1l8.9-8.9"/><path d="M9.5 5.5 12 3h4.5l4 4-2.5 2.5-2-2-3.5 3.5-3.5-3.5z"/>',
  people: '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M15.5 14.2A5 5 0 0 1 21 19"/>',
  doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 12h6"/><path d="M9 16h6"/>',
  rent: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 9v.01"/><path d="M18 15v.01"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3 17.8 6.2 21l6.3-6.3a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>',
  clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1"/><path d="m9 13 2 2 4-4"/>',
  chart: '<path d="M4 20V4"/><path d="M4 20h16"/><path d="M8 16v-4"/><path d="M12 16V8"/><path d="M16 16v-6"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9"/><path d="m17 6 3 3"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  shield: '<path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10"/><path d="M10 20v-6h4v6"/>',
  ruler: '<path d="M3 17 17 3l4 4L7 21z"/><path d="m7 13 2 2"/><path d="m10 10 2 2"/><path d="m13 7 2 2"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h8"/>'
};
const KEYWORDS = [[/leak|pipe|repip/i, 'pipe'], [/drain|sewer|clog/i, 'drain'], [/heater|tankless/i, 'heater'], [/fixture|faucet|toilet|sink/i, 'faucet'],
  [/sump|pump/i, 'pump'], [/kitchen/i, 'kitchen'], [/bath/i, 'bath'], [/basement/i, 'stairs'], [/deck|outdoor|patio/i, 'deck'], [/paint|drywall/i, 'roller'],
  [/addition/i, 'addition'], [/carpent|repair/i, 'hammer'], [/tenant|resident|screen/i, 'people'], [/leas|market/i, 'doc'], [/rent|collect/i, 'rent'],
  [/mainten/i, 'wrench'], [/inspect/i, 'clipboard'], [/report|owner/i, 'chart'], [/quote|clear|scope/i, 'chat'], [/contact|point/i, 'phone'],
  [/respect|tidy|clean|care/i, 'shield'], [/schedule|time|prompt/i, 'clock'], [/serv|area|county|local/i, 'pin'], [/plan|measure/i, 'ruler']];
const iconFor = t => (KEYWORDS.find(([re]) => re.test(t)) || [0, 'check'])[1];
const svg = (name, size = 24, sw = 1.8) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[name] || I.check}</svg>`;

// ---------- concept logos (original; replaced by the business's own logo when they sign up)
function logo(shape, text, c1, c2, size = 44) {
  const t = e(ini(text).slice(0, 4));
  const fs = t.length > 3 ? 15 : t.length > 2 ? 17 : 21;
  const shapes = {
    drop: `<path d="M32 4C44 20 54 30 54 41a22 22 0 0 1-44 0C10 30 20 20 32 4z" fill="${c1}"/><path d="M22 44a10 10 0 0 0 10 10" stroke="${c2}" stroke-width="3" fill="none" stroke-linecap="round"/><text x="32" y="43" text-anchor="middle" font-family="Arial, sans-serif" font-weight="800" font-size="${fs}" fill="#fff">${t}</text>`,
    roof: `<rect x="4" y="4" width="56" height="56" rx="10" fill="${c1}"/><path d="M14 30 32 15l18 15" stroke="${c2}" stroke-width="5" fill="none" stroke-linecap="square"/><text x="32" y="50" text-anchor="middle" font-family="Arial Narrow, Arial, sans-serif" font-weight="800" font-size="${fs}" letter-spacing="1" fill="#fff">${t}</text>`,
    arch: `<path d="M8 60V30a24 24 0 0 1 48 0v30z" fill="${c1}"/><path d="M14 58V31a18 18 0 0 1 36 0v27" stroke="${c2}" stroke-width="1.5" fill="none"/><path d="M28 9h8l-1.5 6h-5z" fill="${c2}"/><text x="32" y="45" text-anchor="middle" font-family="Georgia, serif" font-size="${fs + 1}" fill="#fff">${t}</text>`,
    circle: `<circle cx="32" cy="32" r="28" fill="${c1}"/><circle cx="32" cy="32" r="22" stroke="${c2}" stroke-width="2" fill="none"/><text x="32" y="39" text-anchor="middle" font-family="Arial, sans-serif" font-weight="800" font-size="${fs}" fill="#fff">${t}</text>`
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" role="img" aria-label="Concept logo">${shapes[shape] || shapes.circle}</svg>`;
}

// ---------- illustrations (original vector art)
function illustration(kind, p, a, bg) {
  const lt = mix(p, 0.85), md = mix(p, 0.55), al = mix(a, 0.6);
  if (kind === 'plumbing-home') return `<svg viewBox="0 0 480 400" role="img" aria-label="Illustration of a home plumbing system">
  <circle cx="370" cy="80" r="46" fill="${al}" opacity=".55"/>
  <rect x="40" y="355" width="400" height="10" rx="5" fill="${md}" opacity=".35"/>
  <path d="M70 180 240 60l170 120" fill="none" stroke="${p}" stroke-width="10" stroke-linejoin="round"/>
  <rect x="92" y="170" width="296" height="186" rx="6" fill="#fff" stroke="${p}" stroke-width="6"/>
  <path d="M92 262h296M240 170v186" stroke="${lt}" stroke-width="4"/>
  <rect x="112" y="290" width="44" height="58" rx="10" fill="${lt}" stroke="${p}" stroke-width="4"/><path d="M124 306h20" stroke="${p}" stroke-width="4" stroke-linecap="round"/>
  <path d="M156 318h40v-56M196 262v-34h22" fill="none" stroke="${a}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M134 290v-28" stroke="${a}" stroke-width="7" stroke-linecap="round"/>
  <path d="M262 236h70v-18h18" fill="none" stroke="${p}" stroke-width="6" stroke-linecap="round"/><rect x="260" y="236" width="96" height="14" rx="4" fill="${md}"/>
  <path d="M296 250v52h60" fill="none" stroke="${a}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M356 302v54" stroke="${a}" stroke-width="7" stroke-linecap="round"/>
  <path d="M342 210c6 8 9 13 9 17a9 9 0 0 1-18 0c0-4 3-9 9-17z" fill="${a}"/>
  <rect x="262" y="300" width="22" height="48" rx="4" fill="${lt}" stroke="${p}" stroke-width="4"/>
  <path d="M120 230h80M120 214h56" stroke="${lt}" stroke-width="8" stroke-linecap="round"/>
  <path d="M400 330c10 14 15 22 15 29a15 15 0 0 1-30 0c0-7 5-15 15-29z" fill="${a}" opacity=".9"/>
  <path d="M60 330c7 10 11 16 11 21a11 11 0 0 1-22 0c0-5 4-11 11-21z" fill="${a}" opacity=".6"/>
</svg>`;
  if (kind === 'house-frame') return `<svg viewBox="0 0 480 400" role="img" aria-label="Illustration of a house frame under construction">
  <defs><pattern id="g" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0v24" fill="none" stroke="#fff" stroke-opacity=".07"/></pattern></defs>
  <rect width="480" height="400" fill="url(#g)"/>
  <circle cx="380" cy="86" r="40" fill="${a}" opacity=".9"/>
  <path d="M70 196 240 72l170 124" fill="none" stroke="#fff" stroke-width="8" stroke-linejoin="round"/>
  <path d="M110 167 240 72l130 95M150 138v58M195 105v91M240 72v124M285 105v91M330 138v58" stroke="#fff" stroke-opacity=".55" stroke-width="5"/>
  <path d="M96 196h288v150H96z" fill="none" stroke="#fff" stroke-width="8"/>
  <path d="M132 196v150M168 196v150M204 196v150M276 196v150M312 196v150M348 196v150" stroke="#fff" stroke-opacity=".45" stroke-width="5"/>
  <path d="M96 270h288" stroke="${a}" stroke-width="6"/>
  <rect x="216" y="270" width="48" height="76" fill="none" stroke="${a}" stroke-width="5"/>
  <path d="M400 346 434 160M424 346l34-186M408 316h26M413 286h26M419 256h26M424 226h26M430 196h26" stroke="${a}" stroke-width="5" stroke-linecap="round"/>
  <path d="M40 360h400" stroke="#fff" stroke-width="6" stroke-linecap="round"/>
  <path d="M96 380h288M96 372v16M384 372v16" stroke="${a}" stroke-width="2.5"/>
  <text x="240" y="396" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="#fff" fill-opacity=".6" letter-spacing="3">PLAN · BUILD · FINISH</text>
</svg>`;
  return `<svg viewBox="0 0 960 300" preserveAspectRatio="xMidYMax meet" role="img" aria-label="Illustration of Baltimore-style rowhouses">
  <circle cx="820" cy="70" r="44" fill="${a}" opacity=".35"/>
  ${[0, 1, 2, 3, 4, 5].map(i => {
    const x = 60 + i * 140, h = 190 + (i % 2) * 18, top = 280 - h, col = [p, md, p, mix(p, .3), md, p][i];
    const win = (wx, wy) => `<rect x="${x + wx}" y="${top + wy}" width="26" height="40" rx="2" fill="${bg}" opacity=".9"/><path d="M${x + wx} ${top + wy - 8}h26" stroke="${a}" stroke-width="4"/>`;
    return `<rect x="${x}" y="${top}" width="132" height="${h}" fill="${col}"/>
    <rect x="${x - 4}" y="${top - 14}" width="140" height="16" fill="${a}"/><path d="M${x} ${top - 14}v-6h132v6" fill="${mix(a, .3)}"/>
    ${win(18, 30)}${win(53, 30)}${win(88, 30)}${win(18, 100)}${win(88, 100)}
    <rect x="${x + 50}" y="${280 - 62}" width="32" height="56" rx="14" fill="${bg}" opacity=".95"/><path d="M${x + 50} ${280 - 48}h32" stroke="${col}" stroke-width="2"/>
    <rect x="${x + 40}" y="${280 - 6}" width="52" height="6" fill="#fff"/><rect x="${x + 34}" y="${280}" width="64" height="6" fill="#fff" opacity=".9"/>`;
  }).join('')}
  <path d="M0 286h960" stroke="${p}" stroke-width="6"/>
  ${[30, 930].map(tx => `<path d="M${tx} 286v-50" stroke="${p}" stroke-width="5"/><circle cx="${tx}" cy="222" r="26" fill="${mix(p, .45)}"/>`).join('')}
</svg>`;
}

// ---------- page
function render(s, opts = {}) {
  const layout = pick(s.Layout, LAYOUTS, 'split');
  const P = hex(s.PrimaryColor, '#0b2545'), A = hex(s.AccentColor, '#13c4a3'), BG = hex(s.BackgroundColor, '#ffffff');
  const HF = font(s.HeadingFont, 'Plus Jakarta Sans'), BF = font(s.BodyFont, 'Inter');
  const name = ini(s.BrandName) || ini(s.CompanyName);
  const nd = name.endsWith('.') ? e(name) : e(name) + '.';
  const city = ini(s.City), county = ini(s.County);
  const countyLabel = /City$|County$/.test(county) ? county : county ? county + ' County' : '';
  const zip = ini(s.Zip).slice(0, 5);
  const addr = [ini(s.Address).replace(/\s{2,}/g, ' '), city, ('MD ' + zip).trim()].filter(Boolean).join(', ');
  const phone = ini(s.Phone), email = ini(s.Email), t = tel(phone);
  const services = lines(s.Services).map(l => { const [a, ...b] = l.split('|'); return [a.trim(), b.join('|').trim()]; }).slice(0, 9);
  const highlights = lines(s.Highlights).map(l => { const [a, ...b] = l.split('|'); return [a.trim(), b.join('|').trim()]; }).slice(0, 4);
  const areas = String(s.ServiceAreas || '').split(',').map(x => x.trim()).filter(Boolean).slice(0, 10);
  const steps = lines(s.Steps).map(l => { const [a, ...b] = l.split('|'); return [a.trim(), b.join('|').trim()]; }).slice(0, 4);
  const stepsList = steps.length ? steps : [['Call or email', 'Tell us what you need and where.'], ['Get a clear quote', 'We look at the job and explain the options.'], ['Job done right', 'The work gets done and we check you are happy.']];
  const cta = ini(s.CallToAction) || 'Call for a quote';
  const maps = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(`${name} ${addr}`);
  const fontsUrl = 'https://fonts.googleapis.com/css2?' + [...new Set([HF, BF])].map(f => 'family=' + f.replace(/ /g, '+') + ':wght@400;500;600;700;800').join('&') + '&display=swap';
  const preview = s.Status !== 'Published';
  const callBtn = (cls, label) => t ? `<a class="${cls}" href="tel:${t}">${svg('phone', 18)}<span>${e(label)}</span></a>` : '';
  const logoHtml = logo(s.LogoShape, s.LogoText || name.slice(0, 2).toUpperCase(), layout === 'bold' ? A : P, layout === 'bold' ? P : A);
  const ill = illustration(pick(s.Illustration, ILLUSTRATIONS, 'plumbing-home'), P, A, BG);
  const note = ini(s.DisclosureNote) ? `<p class="disclosure">${e(s.DisclosureNote)}</p>` : '';
  const svcCards = services.map(([h, d], i) => `<article class="svc">${layout === 'bold' ? `<span class="num">${String(i + 1).padStart(2, '0')}</span>` : ''}<span class="si">${svg(iconFor(h), 26)}</span><h3>${e(h)}</h3><p>${e(d)}</p></article>`).join('');
  const hl = highlights.map(([h, d]) => `<div class="hl"><span class="hi">${svg(iconFor(h + ' ' + d), 22)}</span><div><h3>${e(h)}</h3>${d ? `<p>${e(d)}</p>` : ''}</div></div>`).join('');
  const stepHtml = stepsList.map(([h, d], i) => `<li><span class="sn">${i + 1}</span><h3>${e(h)}</h3><p>${e(d)}</p></li>`).join('');
  const chips = areas.map(a => `<span>${e(a)}</span>`).join('');
  const contactRows = [
    phone && `<div class="row">${svg('phone')}<div><small>Phone</small><b>${t ? `<a href="tel:${t}">${e(phone)}</a>` : e(phone)}</b></div></div>`,
    email && `<div class="row">${svg('mail')}<div><small>Email</small><b><a href="mailto:${e(email)}">${e(email)}</a></b></div></div>`,
    addr && `<div class="row">${svg('pin')}<div><small>Address</small><b><a href="${e(maps)}" target="_blank" rel="noopener">${e(addr)}</a></b></div></div>`
  ].filter(Boolean).join('');

  const base = `
:root{--p:${P};--a:${A};--bg:${BG};--pl:${mix(P, .92)};--pm:${mix(P, .7)};--al:${mix(A, .85)};--ink:#1b2128;--mut:#5c6672;--line:${mix(P, .86)};--hf:${stack(HF)};--bf:${stack(BF)}}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;font:16px/1.65 var(--bf);color:var(--ink);background:var(--bg)}
h1,h2,h3{font-family:var(--hf);line-height:1.12;margin:0}a{color:inherit}img,svg{max-width:100%}
.w{max-width:1160px;margin:0 auto;padding:0 22px}
.pv{background:#fff6d8;color:#5a4300;font:13px/1.5 system-ui,sans-serif;padding:8px 0;border-bottom:1px solid #eedb9b}.pv b{color:#3a2b00}.pv a{color:#5a4300}
.nav{position:sticky;top:0;z-index:20;backdrop-filter:saturate(1.4) blur(10px)}
.nav .w{display:flex;align-items:center;gap:18px;height:74px}
.brand{display:flex;align-items:center;gap:12px;text-decoration:none;min-width:0}.brand b{font-family:var(--hf);font-size:19px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.brand small{display:block;font-size:11.5px;letter-spacing:.12em;text-transform:uppercase;opacity:.7}
.links{margin-left:auto;display:flex;gap:26px}.links a{text-decoration:none;font-size:15px;opacity:.8}.links a:hover{opacity:1}
.btn{display:inline-flex;align-items:center;gap:9px;padding:13px 22px;border-radius:999px;font-weight:700;text-decoration:none;white-space:nowrap;transition:transform .15s,box-shadow .15s}
.btn:hover{transform:translateY(-1px)}
section{padding:92px 0}.eyebrow{font-size:13px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--a)}
.h2{font-size:clamp(28px,3.6vw,42px);margin:10px 0 14px}.lead{color:var(--mut);font-size:18px;max-width:40em;margin:0}
.svcs{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:44px}
.svc{position:relative;padding:28px;border-radius:18px;background:#fff;border:1px solid var(--line);transition:transform .2s,box-shadow .2s}
.svc:hover{transform:translateY(-3px);box-shadow:0 18px 40px -22px ${P}66}
.si{display:inline-grid;place-items:center;width:52px;height:52px;border-radius:14px;background:var(--pl);color:var(--p);margin-bottom:18px}
.svc h3{font-size:19px;margin-bottom:8px}.svc p{margin:0;color:var(--mut);font-size:15.5px}
.steps{list-style:none;padding:0;margin:44px 0 0;display:grid;grid-template-columns:repeat(${stepsList.length},1fr);gap:22px;counter-reset:s}
.steps li{position:relative}.sn{display:inline-grid;place-items:center;width:46px;height:46px;border-radius:50%;font-weight:800;font-family:var(--hf);margin-bottom:14px}
.steps h3{font-size:19px;margin-bottom:6px}.steps p{margin:0;color:var(--mut)}
.area{display:grid;grid-template-columns:1.05fr .95fr;gap:48px;align-items:start}
.chips{display:flex;flex-wrap:wrap;gap:10px;margin-top:26px}.chips span{padding:8px 16px;border-radius:999px;background:#fff;border:1px solid var(--line);font-size:14.5px}
.card{background:#fff;border-radius:22px;padding:32px;border:1px solid var(--line);box-shadow:0 30px 60px -40px ${P}80}
.card h3{font-size:24px;margin-bottom:6px}.card .row{display:flex;gap:14px;padding:15px 0;border-bottom:1px solid var(--line)}.card .row:last-of-type{border:0}
.card .row svg{color:var(--a);flex:none;margin-top:3px}.card small{display:block;color:var(--mut);font-size:12.5px}.card b{font-weight:650;word-break:break-word}.card b a{text-decoration:none}
.card .btn{width:100%;justify-content:center;margin-top:16px}
.disclosure{font-size:13px;color:var(--mut);border:1px dashed var(--line);border-radius:12px;padding:10px 14px;margin:16px 0 0}
footer{padding:36px 0 96px;font-size:14px}footer .w{display:flex;flex-wrap:wrap;gap:10px 28px;justify-content:space-between;align-items:center}
.callbar{display:none}
@media(max-width:900px){.links{display:none}.svcs,.steps,.area{grid-template-columns:1fr}section{padding:64px 0}.nav .btn span{display:none}.nav .btn{padding:12px}
 .callbar{display:flex;position:fixed;left:14px;right:14px;bottom:14px;z-index:30;justify-content:center;box-shadow:0 10px 30px -8px rgba(0,0,0,.45)}}
@media(min-width:901px) and (max-width:1100px){.svcs{grid-template-columns:repeat(2,1fr)}}`;

  let css = '', body = '';
  if (layout === 'split') {
    css = `
.nav{background:rgba(255,255,255,.86);border-bottom:1px solid var(--line)}.brand b{color:var(--p)}.links a{color:var(--ink)}
.nav .btn,.btn.pri{background:var(--a);color:#fff;box-shadow:0 10px 24px -12px var(--a)}.btn.sec{background:#fff;color:var(--p);border:1.5px solid var(--line)}
.hero{padding:70px 0 90px;background:radial-gradient(1200px 500px at 85% -10%,var(--al),transparent 60%),linear-gradient(180deg,var(--pl),var(--bg))}
.hero .w{display:grid;grid-template-columns:1.05fr .95fr;gap:40px;align-items:center}
.tag{display:inline-flex;align-items:center;gap:8px;background:#fff;border:1px solid var(--line);border-radius:999px;padding:6px 14px 6px 8px;font-size:14px;color:var(--p);font-weight:600}
.tag i{width:8px;height:8px;border-radius:50%;background:var(--a);box-shadow:0 0 0 4px var(--al)}
.hero h1{font-size:clamp(36px,5vw,60px);color:var(--p);margin:20px 0 18px;letter-spacing:-.02em}.hero h1 em{font-style:normal;color:var(--a)}
.hero p{font-size:19px;color:var(--mut);max-width:32em;margin:0 0 30px}.cta{display:flex;flex-wrap:wrap;gap:12px}
.art{background:#fff;border-radius:32px;padding:26px;box-shadow:0 40px 80px -40px ${P}88;border:1px solid var(--line);position:relative}
.art:after{content:"";position:absolute;inset:auto -14px -14px auto;width:120px;height:120px;border-radius:28px;background:var(--a);opacity:.18;z-index:-1}
.hls{background:var(--p);color:#fff;padding:0}.hls .w{display:grid;grid-template-columns:repeat(${Math.max(highlights.length, 1)},1fr);gap:0}
.hl{display:flex;gap:16px;padding:34px 26px;border-left:1px solid rgba(255,255,255,.12)}.hl:first-child{border:0}
.hi{display:inline-grid;place-items:center;flex:none;width:44px;height:44px;border-radius:12px;background:rgba(255,255,255,.12);color:var(--a)}
.hl h3{font-size:17px;margin-bottom:4px}.hl p{margin:0;opacity:.75;font-size:14.5px}
.sn{background:var(--al);color:var(--p)}.how{background:var(--pl)}
footer{background:var(--p);color:rgba(255,255,255,.75)}footer a{color:#fff}
.callbar{background:var(--a);color:#fff}
@media(max-width:900px){.hero .w{grid-template-columns:1fr}.hls .w{grid-template-columns:1fr}.hl{border-left:0;border-top:1px solid rgba(255,255,255,.12)}}`;
    const words = ini(s.Headline).split(' '); const hl1 = words.slice(0, -2).join(' '), hl2 = words.slice(-2).join(' ');
    body = `
<section class="hero"><div class="w">
  <div><span class="tag"><i></i>${e(s.Tagline || '')}</span>
  <h1>${e(hl1)} <em>${e(hl2)}</em></h1><p>${e(s.Subheadline)}</p>
  <div class="cta">${callBtn('btn pri', cta)}<a class="btn sec" href="#services">Our services ${svg('arrow', 18)}</a></div></div>
  <div class="art">${ill}</div>
</div></section>
${hl ? `<section class="hls"><div class="w">${hl}</div></section>` : ''}
<section id="services"><div class="w"><span class="eyebrow">Services</span><h2 class="h2">What we can help with</h2><p class="lead">${e(s.About)}</p><div class="svcs">${svcCards}</div></div></section>
<section class="how" id="how"><div class="w"><span class="eyebrow">How it works</span><h2 class="h2">Simple from the first call</h2><ol class="steps">${stepHtml}</ol></div></section>`;
  } else if (layout === 'bold') {
    css = `
body{background:var(--bg)}h1,h2,h3{text-transform:uppercase;letter-spacing:.01em}
.nav{background:${P}ee;color:#fff;border-bottom:1px solid rgba(255,255,255,.08)}.links a{color:#fff}
.nav .btn,.btn.pri{background:var(--a);color:${P};border-radius:6px}.btn.sec{border:2px solid rgba(255,255,255,.35);color:#fff;border-radius:6px}.btn{border-radius:6px}
.hero{background:${P};color:#fff;padding:80px 0 0;position:relative;overflow:hidden}
.hero:before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px);background-size:32px 32px}
.hero .w{position:relative;display:grid;grid-template-columns:1.1fr .9fr;gap:30px;align-items:end}
.kick{display:inline-block;color:var(--a);font-weight:700;letter-spacing:.18em;font-size:13px;text-transform:uppercase;border-left:4px solid var(--a);padding-left:12px}
.hero h1{font-size:clamp(44px,7vw,92px);line-height:.95;margin:20px 0 22px}.hero h1 span{color:var(--a)}
.hero p{font-size:19px;opacity:.82;max-width:30em;margin:0 0 32px}.cta{display:flex;flex-wrap:wrap;gap:12px;padding-bottom:80px}
.art{align-self:end}
.band{background:var(--a);color:${P}}.band .w{display:flex;flex-wrap:wrap;gap:16px 44px;padding-top:22px;padding-bottom:22px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;font-size:15px}
.band span{display:inline-flex;align-items:center;gap:10px}
.svc{border-radius:4px;border:0;border-top:4px solid var(--a);box-shadow:0 2px 0 var(--line)}.svc .num{position:absolute;right:22px;top:16px;font:800 34px var(--hf);color:var(--line)}
.si{background:${P};color:var(--a);border-radius:4px}
.hls{background:#fff}.hlg{display:grid;grid-template-columns:repeat(${Math.max(highlights.length, 1)},1fr);gap:22px;margin-top:40px}
.hl{display:flex;gap:16px;padding:26px;background:var(--bg);border-left:4px solid ${P}}.hi{color:var(--a);background:${P};display:inline-grid;place-items:center;width:42px;height:42px;flex:none;border-radius:4px}
.hl h3{font-size:18px;margin-bottom:4px}.hl p{margin:0;color:var(--mut);font-size:15px}
.how{background:${P};color:#fff}.how .lead,.how p{color:rgba(255,255,255,.72)}
.steps{position:relative}.steps:before{content:"";position:absolute;left:23px;right:23px;top:23px;height:3px;background:var(--a);opacity:.5}
.sn{background:var(--a);color:${P};border-radius:6px;position:relative}
.card{border-radius:6px;border-top:6px solid var(--a)}.card .btn{background:${P};color:#fff}
footer{background:#111417;color:rgba(255,255,255,.65)}footer a{color:var(--a)}
.callbar{background:var(--a);color:${P}}
@media(max-width:900px){.hero .w{grid-template-columns:1fr}.cta{padding-bottom:20px}.hlg{grid-template-columns:1fr}.steps:before{display:none}}`;
    const words = ini(s.Headline).split('. ').filter(Boolean);
    body = `
<section class="hero"><div class="w">
  <div><span class="kick">${e(s.Tagline || '')}</span>
  <h1>${words.length > 1 ? `${e(words[0])}.<br><span>${e(words.slice(1).join('. ').replace(/\.$/, ''))}.</span>` : e(s.Headline)}</h1>
  <p>${e(s.Subheadline)}</p>
  <div class="cta">${callBtn('btn pri', cta)}<a class="btn sec" href="#services">See our work types</a></div></div>
  <div class="art">${ill}</div>
</div></section>
<div class="band"><div class="w">${services.slice(0, 4).map(([h]) => `<span>${svg('check', 18, 3)} ${e(h)}</span>`).join('')}</div></div>
<section id="services"><div class="w"><span class="eyebrow">What we build</span><h2 class="h2">Projects we take on</h2><p class="lead">${e(s.About)}</p><div class="svcs">${svcCards}</div></div></section>
${hl ? `<section class="hls"><div class="w"><span class="eyebrow">Why work with us</span><h2 class="h2">Organized from start to finish</h2><div class="hlg">${hl}</div></div></section>` : ''}
<section class="how" id="how"><div class="w"><span class="eyebrow">Our process</span><h2 class="h2">How your project runs</h2><ol class="steps">${stepHtml}</ol></div></section>`;
  } else {
    css = `
h1,h2{font-weight:600}
.nav{background:${BG}f2;border-bottom:1px solid var(--line)}.brand b{color:var(--p);font-size:21px}.links a{color:var(--p)}
.nav .btn,.btn.pri{background:var(--p);color:#fff;border-radius:4px}.btn.sec{border:1px solid var(--p);color:var(--p);border-radius:4px}.btn{border-radius:4px}
.hero{text-align:center;padding:84px 0 0;background:linear-gradient(180deg,${BG},${mix(A, .88)})}
.orn{display:flex;align-items:center;justify-content:center;gap:14px;color:var(--a);font-size:13px;letter-spacing:.24em;text-transform:uppercase;font-weight:600}
.orn:before,.orn:after{content:"";width:46px;height:1px;background:var(--a)}
.hero h1{font-size:clamp(38px,5.6vw,68px);color:var(--p);margin:22px auto 20px;max-width:15em;letter-spacing:-.01em}
.hero p{font-size:19px;color:var(--mut);max-width:36em;margin:0 auto 32px}.cta{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-bottom:56px}
.art{line-height:0}.art svg{width:100%;height:auto;display:block}
.svc{border-radius:6px;background:#fff;border-color:var(--line)}.si{background:none;color:var(--a);border:1px solid var(--a);border-radius:50%}
.hls{background:var(--p);color:#fff}.hls .eyebrow{color:var(--a)}.hls .lead{color:rgba(255,255,255,.75)}
.hlg{display:grid;grid-template-columns:repeat(2,1fr);gap:22px;margin-top:40px}
.hl{display:flex;gap:16px;padding:26px;border:1px solid rgba(255,255,255,.16);border-radius:6px}.hi{color:var(--a);flex:none}
.hl h3{font-size:21px;margin-bottom:6px;color:#fff}.hl p{margin:0;opacity:.78}
.sn{border:1px solid var(--a);color:var(--a);font-size:20px}.how{background:${BG}}
.card{border-radius:6px;box-shadow:none;border-color:var(--a)}
footer{border-top:1px solid var(--line);color:var(--mut)}footer a{color:var(--p)}
.callbar{background:var(--p);color:#fff}
@media(max-width:900px){.hlg{grid-template-columns:1fr}}`;
    body = `
<section class="hero"><div class="w">
  <div class="orn">${e(s.Tagline || '')}</div>
  <h1>${e(s.Headline)}</h1><p>${e(s.Subheadline)}</p>
  <div class="cta">${callBtn('btn pri', cta)}<a class="btn sec" href="#services">Our services</a></div></div>
  <div class="art">${ill}</div>
</section>
<section id="services"><div class="w"><span class="eyebrow">Services</span><h2 class="h2">Everything your property needs</h2><p class="lead">${e(s.About)}</p><div class="svcs">${svcCards}</div></div></section>
${hl ? `<section class="hls"><div class="w"><span class="eyebrow">Our approach</span><h2 class="h2">Looking after owners and residents</h2><div class="hlg">${hl}</div></div></section>` : ''}
<section class="how" id="how"><div class="w"><span class="eyebrow">Getting started</span><h2 class="h2">Three simple steps</h2><ol class="steps">${stepHtml}</ol></div></section>`;
  }

  const slug = String(s.Slug || '').replace(/[^a-z0-9-]/g, '');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${preview ? '<meta name="robots" content="noindex, nofollow">\n' : ''}<title>${e(name)} | ${e(s.Tagline || '')}${preview ? ' (preview)' : ''}</title>
<meta name="description" content="${e(s.Subheadline || s.Tagline || '')}">
<meta name="theme-color" content="${P}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${e(fontsUrl)}">
<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(logo(s.LogoShape, s.LogoText || name.slice(0, 2), P, A, 64).replace('role="img" aria-label="Concept logo"', 'xmlns="http://www.w3.org/2000/svg"'))}">
<style>${base}${css}</style>
</head>
<body>
${preview ? `<div class="pv"><div class="w"><b>Website preview.</b> A free sample website made by SkyTech Solutions for ${nd} Not published and not yet approved by ${nd} Details come from public listings; the logo, artwork and text are a starting concept we will replace with yours. <a href="https://skytechsolutions.us">skytechsolutions.us</a></div></div>` : ''}
<header class="nav"><div class="w">
  <a class="brand" href="#top">${logoHtml}<span><b>${e(name)}</b><small>${e(s.Tagline || '')}</small></span></a>
  <nav class="links"><a href="#services">Services</a><a href="#how">How it works</a><a href="#contact">Contact</a></nav>
  ${callBtn('btn', phone)}
</div></header>
<main id="top">${body}
<section id="contact" style="background:${layout === 'bold' ? 'var(--bg)' : '#fff'}"><div class="w area">
  <div><span class="eyebrow">Where we work</span><h2 class="h2">Serving ${county === 'Baltimore City' ? e(city) + ' and nearby neighborhoods' : e(city) + (countyLabel && countyLabel !== city ? ' and ' + e(countyLabel) : '')}</h2>
  <p class="lead">Based in ${e(city)}, working with ${layout === 'classic' ? 'property owners and residents' : 'homeowners and businesses'} in these areas and nearby.</p>
  <div class="chips">${chips}</div></div>
  <div class="card"><h3>Contact ${e(name)}</h3>${contactRows}${callBtn('btn pri', cta)}${note}</div>
</div></section>
</main>
<footer><div class="w"><div>&copy; ${new Date().getFullYear()} ${e(name)} &middot; ${e(city)}, Maryland</div><div>Website ${preview ? 'preview ' : ''}by <a href="https://skytechsolutions.us">SkyTech Solutions</a></div></div></footer>
${callBtn('btn callbar', 'Call ' + phone)}
</body>
</html>
<!-- Version: ${TEMPLATE_VERSION} (${opts.date || new Date().toISOString().slice(0, 10)}) — demo-sites/${slug}/index.html — ${TEMPLATE_VERSION} -->
`;
}

module.exports = { render, TEMPLATE_VERSION, LAYOUTS, LOGO_SHAPES, ILLUSTRATIONS, FONTS, STATUSES };

// Version: V1.0 (2026-10-05) — admin-site/src/demo/render.js — V1.0
