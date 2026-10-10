// Version: V1.0 (2026-10-10) — admin-site/src/roles.js — V1.0
/**
 * @file Roles and permissions for the SkyTech Admin site (one place to read and change them).
 * Purpose: decides what each role may do. The server checks every request against this table (SKY-AUTH-005 when
 *          refused) and sends the signed-in user's permissions to the screens, which hide what they cannot use.
 * Roles (match the SkyTech agents' work):
 *   admin    — everything, including Logins and System log (owner).
 *   manager  — all data: create, edit, delete, resolve duplicates, save demo sites; no Logins or System log.
 *   sales    — PhoneMarketing / SocialMediaMarketing work: edit leads, log activities; read everything else.
 *   webdev   — WebsiteDeveloper work: edit demo sites and web presence, save demo pages; read everything else.
 *   viewer   — read only.
 * Change a role here, then update docs (Security Architecture "Access control") and the version.
 */
'use strict';

/** ROLES — key → label, short description, writable screens, and extra rights. */
const ROLES = {
  admin:   { label: 'Admin',         about: 'Everything, including Logins and System log',            write: '*', remove: true,  duplicates: true,  demoSave: true,  users: true,  syslog: true },
  manager: { label: 'Manager',       about: 'All data (create, edit, delete, duplicates, demo sites)', write: '*', remove: true,  duplicates: true,  demoSave: true,  users: false, syslog: false },
  sales:   { label: 'Sales',         about: 'Leads and activities (calls, emails, social follow-ups)', write: ['leads', 'activities'], remove: false, duplicates: false, demoSave: false, users: false, syslog: false },
  webdev:  { label: 'Web developer', about: 'Demo sites and web presence',                              write: ['demosites', 'webpresence'], remove: false, duplicates: false, demoSave: true, users: false, syslog: false },
  viewer:  { label: 'Viewer',        about: 'Read only',                                                write: [], remove: false, duplicates: false, demoSave: false, users: false, syslog: false }
};
const ROLE_KEYS = Object.keys(ROLES);

/** canWrite — may this role create/edit records of this screen (entity key)? */
const canWrite = (role, entity) => { const r = ROLES[role]; return !!r && (r.write === '*' || r.write.includes(entity)); };
/** can — may this role use an extra right: remove | duplicates | demoSave | users | syslog? */
const can = (role, right) => !!(ROLES[role] && ROLES[role][right]);
/** permsFor — the permissions sent to the screens for the signed-in user. */
function permsFor(role) {
  const r = ROLES[role] || ROLES.viewer;
  return { role, label: r.label, write: r.write, remove: r.remove, duplicates: r.duplicates, demoSave: r.demoSave, users: r.users, syslog: r.syslog };
}
/** list — role keys, labels and descriptions for the Logins screen. */
const list = () => ROLE_KEYS.map(k => ({ key: k, label: ROLES[k].label, about: ROLES[k].about }));

module.exports = { ROLES, ROLE_KEYS, canWrite, can, permsFor, list };

// Version: V1.0 (2026-10-10) — admin-site/src/roles.js — V1.0
