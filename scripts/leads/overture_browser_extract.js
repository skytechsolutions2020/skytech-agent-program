// Version: V1.1 (2026-10-10) — scripts/leads/overture_browser_extract.js — V1.1 (comments)
// Purpose: SkyTech_BackOffice helper — reads business places (Overture Maps, free licence) shown on the public explorer map.
// Inputs : map tiles already loaded in your browser; Outputs: window.__sky rows → save as sample100_extract.json.
// Errors : empty result = SKY-LEAD-002 (zoom in until the places layer shows, keep the map visible, run grab again).
// Rules  : manual, owner-run, read-only; no automated scraping of Google Maps, Yelp or Facebook.
// Run in the browser console on https://explore.overturemaps.org (the page exposes `map`).
// For each area: grab(name, lat, lon). Results collect in window.__sky; then build the sample.
// Note: tiles load only while the map is visible on screen.
window.__sky = window.__sky || {};
window.grab = async (nm, lat, lon) => {
  const RE = /real_estate|realtor|property_management|real_estate_agent|real_estate_service|home_appraiser|mortgage|apartment_agent/i;
  const UT = /plumb|electrician|electrical_service|hvac|heating|air_condition|roofing|handyman|contractor|water_heater|septic|well_drilling|solar|generator|gutter|sewer|drain/i;
  map.jumpTo({ center: [lon, lat], zoom: 14 });
  for (let i = 0; i < 40; i++) { await new Promise(r => setTimeout(r, 500)); if (map.areTilesLoaded() && i > 3) break; }
  let k = 0;
  for (const f of map.querySourceFeatures('places', { sourceLayer: 'place' })) {
    const p = f.properties, tax = `${p.taxonomy || ''} ${p.basic_category || ''} ${p.categories || ''}`;
    const niche = RE.test(tax) ? 'Real Estate' : UT.test(tax) ? 'Utility Trades' : null;
    if (!niche || window.__sky[p.id]) continue;
    const J = (s, d) => { try { return JSON.parse(s || d); } catch (e) { return JSON.parse(d); } };
    const a = J(p.addresses, '[]')[0] || {}, ph = J(p.phones, '[]'), w = J(p.websites, '[]'), so = J(p.socials, '[]'), em = J(p.emails, '[]');
    window.__sky[p.id] = { id: p.id, n: p['@name'] || '', niche, cat: J(p.taxonomy, '{}').primary || p.basic_category,
      ad: a.freeform || '', loc: a.locality || '', zip: (a.postcode || '').slice(0, 5), ph: ph[0] || '', em: em[0] || '',
      web: w[0] || '', fb: so.some(s => /facebook/.test(s)) ? 1 : 0, conf: Math.round((p.confidence || 0) * 100) / 100,
      st: p.operating_status || '', area: nm };
    k++;
  }
  return `${nm}: ${k} new`;
};
// Areas used on 2026-10-02 (lat, lon), zoom 14:
// City: Downtown 39.29,-76.61 | Canton 39.28,-76.575 | Hampden 39.33,-76.63 | NE 39.35,-76.56 | West 39.30,-76.66
// Baltimore Co: Towson 39.40,-76.60 | Catonsville 39.27,-76.73 | Pikesville 39.37,-76.72 | Owings Mills 39.42,-76.78
//   Dundalk 39.26,-76.50 | Essex 39.31,-76.47 | Parkville 39.38,-76.54 | Randallstown 39.37,-76.80 | Cockeysville 39.48,-76.64
// Howard: Columbia 39.20,-76.86 | Ellicott City 39.27,-76.80 | N Laurel 39.13,-76.85 | Elkridge 39.21,-76.75
// Selection (same as scripts/leads/make_sample.py): county by ZIP, drop closed, de-duplicate,
// no website first, then phone listed, then confidence; round-robin across niche x county to 100.
// Version: V1.1 (2026-10-10) — scripts/leads/overture_browser_extract.js — V1.1
