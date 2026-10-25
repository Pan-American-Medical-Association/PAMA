/**
 * PAMA Member Portal — sign-in with an emailed code, and the data behind
 * www.pan-american.org/members/.
 *
 * How it works
 *  - A visitor types their email. If it belongs to an active member (Members tab,
 *    "In members group" = Yes and not expired), we email a 6-digit code that works
 *    for 10 minutes. If not, the website sends them to the membership page.
 *  - The code is exchanged for a signed session that lasts 30 days on that device.
 *    Every request re-checks the Members tab, so a lapsed member loses access at once.
 *  - Portal content (announcements, events, resources, opportunities) comes from tabs
 *    in this spreadsheet. Edit a row and the portal updates within 5 minutes.
 *  - Members edit their own profile and choose whether to appear in the directory.
 *
 * Lives next to Code.gs in the same Apps Script project. Code.gs routes any request
 * whose "action" starts with "portal_" here.
 */

const PORTAL = {
  SITE: 'https://www.pan-american.org',
  CODE_MINUTES: 10,
  MAX_CODE_TRIES: 5,
  MAX_CODE_REQUESTS: 5,          // per email, per 15 minutes
  SESSION_DAYS: 30,
  CONTENT_CACHE_SECONDS: 300,
  // These addresses can always sign in (to preview and manage the portal).
  ADMINS: ['admin@pan-american.org', 'info@pan-american.org'],
  TABS: {
    profiles: 'Member Profiles',
    announcements: 'Portal Announcements',
    events: 'Portal Events',
    resources: 'Portal Resources',
    opportunities: 'Portal Opportunities'
  },
  HEADERS: {
    'Member Profiles': ['Email', 'Display name', 'Credentials', 'Specialty', 'Institution', 'City',
      'State / province', 'Country', 'Languages', 'Interests', 'Bio', 'LinkedIn',
      'Show in directory', 'Show email in directory', 'Updated at', 'Session version', 'Last sign-in'],
    'Portal Announcements': ['Date', 'Title', 'Message', 'Link', 'Link label', 'Pinned', 'Show'],
    'Portal Events': ['Date', 'Start time', 'End time', 'Title', 'Format', 'Location', 'Description', 'Link', 'Link label', 'Show'],
    'Portal Resources': ['Category', 'Title', 'Description', 'Type', 'Link', 'Show'],
    'Portal Opportunities': ['Type', 'Title', 'Description', 'Location', 'Deadline', 'Link', 'Link label', 'Show']
  },
  PROFILE_FIELDS: {          // portal field -> [column header, max length]
    display_name: ['Display name', 80], credentials: ['Credentials', 80], specialty: ['Specialty', 80],
    institution: ['Institution', 120], city: ['City', 60], state: ['State / province', 60],
    country: ['Country', 60], languages: ['Languages', 120], interests: ['Interests', 400],
    bio: ['Bio', 600], linkedin: ['LinkedIn', 200],
    show_in_directory: ['Show in directory', 3], show_email: ['Show email in directory', 3]
  }
};

/* ------------------------------------------------------------------ */
/*  Router                                                            */
/* ------------------------------------------------------------------ */

function handlePortal_(data) {
  try {
    switch (data.action) {
      case 'portal_request_code': return json_(portalRequestCode_(data));
      case 'portal_verify': return json_(portalVerify_(data));
      case 'portal_data': return json_(portalData_(data));
      case 'portal_update_profile': return json_(portalUpdateProfile_(data));
      case 'portal_sign_out_all': return json_(portalSignOutAll_(data));
      default: return json_({ ok: false, error: 'Unknown portal action.' });
    }
  } catch (err) {
    if (err && err.portal) return json_({ ok: false, error: err.message, code: err.portal });
    logError_('portal ' + data.action, err, String(data.email || ''));
    return json_({ ok: false, error: 'Something went wrong. Please try again.' });
  }
}

function portalError_(code, message) {
  const e = new Error(message); e.portal = code; return e;
}

/* ------------------------------------------------------------------ */
/*  Sign-in                                                           */
/* ------------------------------------------------------------------ */

function portalRequestCode_(data) {
  const email = normalizeEmail_(data.email);
  if (!email) throw portalError_('bad_email', 'Please enter a valid email address.');
  const cache = CacheService.getScriptCache();

  const rlKey = 'pr:' + hashHex_(email).slice(0, 40);
  const count = Number(cache.get(rlKey) || 0);
  if (count >= PORTAL.MAX_CODE_REQUESTS) {
    throw portalError_('rate_limited', 'Too many codes requested. Please wait 15 minutes and try again.');
  }
  cache.put(rlKey, String(count + 1), 900);

  const member = findMember_(email);
  if (!member) return { ok: true, member: false };

  const code = randomCode_();
  cache.put('pc:' + hashHex_(email).slice(0, 40),
    JSON.stringify({ h: hashHex_(code + '|' + email), t: 0 }), PORTAL.CODE_MINUTES * 60);

  MailApp.sendEmail({
    to: email, name: CONFIG.ORG_NAME, replyTo: CONFIG.REPLY_TO,
    subject: code + ' is your PAMA member portal code',
    body: 'Your PAMA member portal sign-in code is ' + code + '. It works for ' + PORTAL.CODE_MINUTES +
      ' minutes. If you didn’t ask for it, you can ignore this email.',
    htmlBody:
      '<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#1d2b2a">' +
      '<p style="font-family:Georgia,serif;font-size:20px;color:#0d3b3e;margin:0 0 16px">PAMA Member Portal</p>' +
      '<p>Hello ' + esc_(member.first || '') + ',</p>' +
      '<p>Use this code to sign in:</p>' +
      '<p style="font-size:32px;letter-spacing:8px;font-weight:bold;background:#eef3f2;border-radius:8px;' +
      'padding:16px;text-align:center;margin:16px 0">' + code + '</p>' +
      '<p style="color:#4a5a58;font-size:13px">The code works for ' + PORTAL.CODE_MINUTES + ' minutes. ' +
      'If you didn’t try to sign in, you can ignore this email — your account is safe.</p>' +
      '<p style="color:#4a5a58;font-size:13px">— ' + CONFIG.ORG_NAME + '</p></div>'
  });
  return { ok: true, member: true };
}

function portalVerify_(data) {
  const email = normalizeEmail_(data.email);
  const code = String(data.code || '').replace(/\D/g, '');
  if (!email || code.length !== 6) throw portalError_('bad_code', 'Please enter the 6-digit code from your email.');
  const cache = CacheService.getScriptCache();
  const key = 'pc:' + hashHex_(email).slice(0, 40);
  const raw = cache.get(key);
  if (!raw) throw portalError_('expired', 'That code has expired. Please request a new one.');
  const rec = JSON.parse(raw);
  if (rec.t >= PORTAL.MAX_CODE_TRIES) {
    cache.remove(key);
    throw portalError_('expired', 'Too many attempts. Please request a new code.');
  }
  if (rec.h !== hashHex_(code + '|' + email)) {
    rec.t += 1;
    cache.put(key, JSON.stringify(rec), PORTAL.CODE_MINUTES * 60);
    throw portalError_('bad_code', 'That code doesn’t match. Please check the email and try again.');
  }
  cache.remove(key);
  const member = findMember_(email);
  if (!member) throw portalError_('not_member', 'Your membership isn’t active.');
  const prof = profileRow_(email, true);
  setProfileCell_(prof, 'Last sign-in', new Date());
  const ver = Number(prof.values['Session version'] || 0);
  return { ok: true, token: makeToken_(email, ver), days: PORTAL.SESSION_DAYS };
}

/* ------------------------------------------------------------------ */
/*  Portal data                                                       */
/* ------------------------------------------------------------------ */

function portalData_(data) {
  const s = requireSession_(data.token);
  const content = portalContent_();
  return {
    ok: true,
    member: memberView_(s.member),
    profile: profileView_(s.email),
    announcements: content.announcements,
    events: content.events,
    resources: content.resources,
    opportunities: content.opportunities,
    directory: directory_(),
    links: {
      join: PORTAL.SITE + '/member/',
      manage_paypal: 'https://www.paypal.com/myaccount/autopay/',
      contact: 'mailto:' + CONFIG.REPLY_TO
    }
  };
}

function portalUpdateProfile_(data) {
  const s = requireSession_(data.token);
  const p = data.profile || {};
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const prof = profileRow_(s.email, true);
    Object.keys(PORTAL.PROFILE_FIELDS).forEach(function (k) {
      if (!(k in p)) return;
      const spec = PORTAL.PROFILE_FIELDS[k];
      let v = Array.isArray(p[k]) ? p[k].join(', ') : String(p[k] == null ? '' : p[k]);
      if (k === 'show_in_directory' || k === 'show_email') v = /^(yes|true|on)$/i.test(v.trim()) ? 'Yes' : 'No';
      v = v.replace(/\s+$/g, '').slice(0, spec[1]);
      if (k === 'linkedin' && v && !/^https:\/\/([a-z]+\.)?linkedin\.com\//i.test(v)) {
        throw portalError_('bad_link', 'Please paste your full LinkedIn profile link (https://www.linkedin.com/in/…).');
      }
      if (/^[=+\-@]/.test(v)) v = "'" + v;      // block formula injection
      setProfileCell_(prof, spec[0], v);
    });
    setProfileCell_(prof, 'Updated at', new Date());
  } finally { lock.releaseLock(); }
  CacheService.getScriptCache().remove('portal:directory');
  return { ok: true, profile: profileView_(s.email) };
}

function portalSignOutAll_(data) {
  const s = requireSession_(data.token);
  const prof = profileRow_(s.email, true);
  setProfileCell_(prof, 'Session version', Number(prof.values['Session version'] || 0) + 1);
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/*  Members                                                           */
/* ------------------------------------------------------------------ */

/** Active members keyed by email, read once per request. */
let ACTIVE_MEMBERS_ = null;
function activeMembers_() {
  if (ACTIVE_MEMBERS_) return ACTIVE_MEMBERS_;
  const map = {};
  const vals = membersSheet_().getDataRange().getValues();
  const now = new Date();
  for (let i = 1; i < vals.length; i++) {
    const row = vals[i];
    const email = String(row[0]).trim().toLowerCase();
    if (!email) continue;
    const status = String(row[6]);
    const expires = row[9] instanceof Date ? row[9] : null;
    const active = String(row[12]) === 'Yes' && /^Active|^Cancelled/.test(status) && (!expires || expires >= now);
    if (!active) continue;
    map[email] = {
      email: email, first: row[1], last: row[2], plan: row[3], billing: row[4], amount: row[5],
      status: status, joined: row[7], lastPaid: row[8], expires: expires, admin: false
    };
  }
  ACTIVE_MEMBERS_ = map;
  return map;
}

/** Returns the member record if this email has active access, otherwise null. */
function findMember_(email) {
  const m = activeMembers_()[email];
  if (m) return m;
  if (PORTAL.ADMINS.indexOf(email) !== -1) {
    return { email: email, first: 'PAMA', last: 'Team', plan: 'Portal administrator', billing: '',
      amount: '', status: 'Active', joined: '', lastPaid: '', expires: null, admin: true };
  }
  return null;
}

function memberView_(m) {
  const tier = String(m.plan || '').replace(/^PAMA Membership\s*[–-]\s*/i, '').replace(/\s*\((Monthly|Annual)\)\s*$/i, '');
  const joined = m.joined instanceof Date ? m.joined : null;
  return {
    email: m.email, first: m.first, last: m.last,
    tier: tier || 'Member', plan: m.plan, billing: m.billing, status: m.status,
    joined: joined ? joined.toISOString() : '',
    last_paid: m.lastPaid instanceof Date ? m.lastPaid.toISOString() : '',
    expires: m.expires ? m.expires.toISOString() : '',
    member_id: 'PAMA-' + (joined ? joined.getFullYear() : new Date().getFullYear()) + '-' +
      hashHex_('id|' + m.email).slice(0, 5).toUpperCase(),
    admin: !!m.admin
  };
}

/* ------------------------------------------------------------------ */
/*  Profiles and directory                                            */
/* ------------------------------------------------------------------ */

function profileSheet_() {
  return portalSheet_(PORTAL.TABS.profiles);
}

/** Finds (or creates, if create=true) the member's profile row. */
function profileRow_(email, create) {
  const sh = profileSheet_();
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
  const vals = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, headers.length).getValues() : [];
  for (let i = 0; i < vals.length; i++) {
    if (String(vals[i][0]).trim().toLowerCase() === email) {
      return { sheet: sh, row: i + 2, headers: headers, values: zip_(headers, vals[i]) };
    }
  }
  if (!create) return null;
  const seed = latestApplication_(email);
  const values = {};
  headers.forEach(function (h) { values[h] = ''; });
  values['Email'] = email;
  if (seed) {
    values['Display name'] = (seed['First name'] + ' ' + seed['Last name']).trim();
    values['Credentials'] = seed['Profession or credentials'] || '';
    values['Specialty'] = seed['Specialty or field'] || '';
    values['Institution'] = seed['Institution, practice or school'] || '';
    values['City'] = seed['City'] || '';
    values['State / province'] = seed['State / province'] || '';
    values['Country'] = seed['Country'] || '';
    values['Languages'] = seed['Languages you speak'] || '';
    values['Interests'] = seed['What would you like to be part of?'] || '';
  }
  values['Show in directory'] = 'No';
  values['Show email in directory'] = 'No';
  values['Session version'] = 0;
  sh.appendRow(headers.map(function (h) { return values[h] === undefined ? '' : values[h]; }));
  return { sheet: sh, row: sh.getLastRow(), headers: headers, values: values };
}

function setProfileCell_(prof, header, value) {
  const c = prof.headers.indexOf(header);
  if (c === -1) return;
  prof.sheet.getRange(prof.row, c + 1).setValue(value);
  prof.values[header] = value;
}

function profileView_(email) {
  const prof = profileRow_(email, false);
  const v = prof ? prof.values : {};
  const m = findMember_(email) || {};
  const out = {};
  Object.keys(PORTAL.PROFILE_FIELDS).forEach(function (k) {
    out[k] = String(v[PORTAL.PROFILE_FIELDS[k][0]] || '').replace(/^'/, '');
  });
  if (!out.display_name) out.display_name = ((m.first || '') + ' ' + (m.last || '')).trim();
  out.show_in_directory = out.show_in_directory === 'Yes';
  out.show_email = out.show_email === 'Yes';
  return out;
}

function directory_() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get('portal:directory');
  if (hit) return JSON.parse(hit);
  const sh = profileSheet_();
  const list = [];
  if (sh.getLastRow() > 1) {
    const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
    sh.getRange(2, 1, sh.getLastRow() - 1, headers.length).getValues().forEach(function (r) {
      const v = zip_(headers, r);
      const email = String(v['Email']).trim().toLowerCase();
      if (v['Show in directory'] !== 'Yes' || !email) return;
      const m = findMember_(email);
      if (!m || m.admin) return;
      list.push({
        name: String(v['Display name'] || (m.first + ' ' + m.last)).trim(),
        credentials: clean_(v['Credentials']), specialty: clean_(v['Specialty']),
        institution: clean_(v['Institution']),
        location: [v['City'], v['State / province'], v['Country']].map(clean_).filter(String).join(', '),
        languages: clean_(v['Languages']), interests: clean_(v['Interests']), bio: clean_(v['Bio']),
        linkedin: clean_(v['LinkedIn']), email: v['Show email in directory'] === 'Yes' ? email : '',
        tier: memberView_(m).tier
      });
    });
  }
  list.sort(function (a, b) { return a.name.localeCompare(b.name); });
  cache.put('portal:directory', JSON.stringify(list), PORTAL.CONTENT_CACHE_SECONDS);
  return list;
}

function latestApplication_(email) {
  const sh = SpreadsheetApp.getActive().getSheetByName('Membership Applications');
  if (!sh || sh.getLastRow() < 2) return null;
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
  const vals = sh.getRange(2, 1, sh.getLastRow() - 1, headers.length).getValues();
  const col = headers.indexOf('Email address');
  for (let i = vals.length - 1; i >= 0; i--) {
    if (String(vals[i][col]).trim().toLowerCase() === email) return zip_(headers, vals[i]);
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  Content tabs                                                      */
/* ------------------------------------------------------------------ */

function portalContent_() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get('portal:content');
  if (hit) return JSON.parse(hit);
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const content = {
    announcements: tabRows_(PORTAL.TABS.announcements).sort(function (a, b) {
      return (b.pinned === 'Yes') - (a.pinned === 'Yes') || String(b.date).localeCompare(String(a.date));
    }).slice(0, 20),
    events: tabRows_(PORTAL.TABS.events).filter(function (e) {
      return !e.date || e.date >= today;
    }).sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); }),
    resources: tabRows_(PORTAL.TABS.resources),
    opportunities: tabRows_(PORTAL.TABS.opportunities)
  };
  cache.put('portal:content', JSON.stringify(content), PORTAL.CONTENT_CACHE_SECONDS);
  return content;
}

/** Reads a content tab into objects keyed by snake_case header; skips rows with Show = No. */
function tabRows_(name) {
  const sh = portalSheet_(name);
  if (sh.getLastRow() < 2) return [];
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(function (h) {
    return String(h).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  });
  const tz = Session.getScriptTimeZone();
  return sh.getRange(2, 1, sh.getLastRow() - 1, headers.length).getDisplayValues()
    .map(function (r, i) {
      const o = {};
      headers.forEach(function (h, j) { if (h) o[h] = String(r[j]).trim(); });
      return o;
    })
    .filter(function (o) { return o.title && !/^no$/i.test(o.show || ''); })
    .map(function (o) {
      delete o.show;
      if (o.date && !/^\d{4}-\d{2}-\d{2}$/.test(o.date)) {
        const d = new Date(o.date);           // e.g. "11/20/2026" from a date-formatted cell
        if (!isNaN(d)) o.date = Utilities.formatDate(d, tz, 'yyyy-MM-dd');
      }
      if (o.link && !/^(https?:\/\/|mailto:)/i.test(o.link)) o.link = '';
      return o;
    });
}

function portalSheet_(name) {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    const h = PORTAL.HEADERS[name];
    sh.getRange(1, 1, 1, h.length).setValues([h]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

/* ------------------------------------------------------------------ */
/*  Sessions                                                          */
/* ------------------------------------------------------------------ */

function portalSecret_() {
  const props = PropertiesService.getScriptProperties();
  let s = props.getProperty('PORTAL_SECRET');
  if (!s) {
    s = Utilities.getUuid() + Utilities.getUuid() + Utilities.getUuid();
    props.setProperty('PORTAL_SECRET', s);
  }
  return s;
}

function makeToken_(email, ver) {
  const exp = Date.now() + PORTAL.SESSION_DAYS * 864e5;
  const payload = Utilities.base64EncodeWebSafe(JSON.stringify({ e: email, x: exp, v: ver }));
  return payload + '.' + sign_(payload);
}

function requireSession_(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 2 || sign_(parts[0]) !== parts[1]) throw portalError_('signed_out', 'Please sign in again.');
  let p;
  try { p = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString()); }
  catch (x) { throw portalError_('signed_out', 'Please sign in again.'); }
  if (!p.x || p.x < Date.now()) throw portalError_('signed_out', 'Your session has ended. Please sign in again.');
  const member = findMember_(p.e);
  if (!member) throw portalError_('not_member', 'Your membership isn’t active.');
  const prof = profileRow_(p.e, false);
  if (prof && Number(prof.values['Session version'] || 0) !== Number(p.v || 0)) {
    throw portalError_('signed_out', 'Please sign in again.');
  }
  return { email: p.e, member: member };
}

function sign_(payload) {
  return Utilities.base64EncodeWebSafe(
    Utilities.computeHmacSha256Signature(payload, portalSecret_())).replace(/=+$/, '');
}

/* ------------------------------------------------------------------ */
/*  Small helpers                                                     */
/* ------------------------------------------------------------------ */

function normalizeEmail_(s) {
  const e = String(s || '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 200 ? e : '';
}
function hashHex_(s) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(s), Utilities.Charset.UTF_8)
    .map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}
function randomCode_() {
  const hex = hashHex_(Utilities.getUuid() + Utilities.getUuid() + Date.now());
  return String(parseInt(hex.slice(0, 12), 16) % 1000000).padStart(6, '0');
}
function zip_(headers, row) {
  const o = {};
  headers.forEach(function (h, i) { o[h] = row[i]; });
  return o;
}
function clean_(v) { return String(v == null ? '' : v).replace(/^'/, '').trim(); }

/* ------------------------------------------------------------------ */
/*  SETUP — run once after adding this file                           */
/* ------------------------------------------------------------------ */

/** Creates any missing portal tabs and the signing secret. Safe to run again. */
function setupPortal() {
  Object.keys(PORTAL.HEADERS).forEach(function (name) { portalSheet_(name); });
  portalSecret_();
  CacheService.getScriptCache().removeAll(['portal:content', 'portal:directory']);
  console.log('Portal ready. Deploy → Manage deployments → Edit → Version: New version → Deploy.');
}

/** Clears the 5-minute cache so content edits show immediately. */
function refreshPortalNow() {
  CacheService.getScriptCache().removeAll(['portal:content', 'portal:directory']);
}
