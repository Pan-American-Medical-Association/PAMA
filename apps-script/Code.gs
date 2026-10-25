/**
 * PAMA Website Forms + Membership automation
 * ------------------------------------------
 * Bound to the "PAMA Website Submissions" spreadsheet.
 *
 * What it does
 *  1. Receives every form on pan-american.org (Contact Us, Volunteer, Work Application,
 *     Membership Application, Newsletter) and adds a row to the matching tab.
 *  2. Emails admin@ and info@ about each submission and sends the person a confirmation.
 *  3. Adds people who opted in to donors@pan-american.org.
 *  4. Receives PayPal Instant Payment Notifications (IPN) for memberships, records them on the
 *     Members tab, and adds/removes people from members@pan-american.org.
 *
 * Setup (one time) — see "SETUP" at the bottom of this file.
 */

const CONFIG = {
  NOTIFY: ['admin@pan-american.org', 'info@pan-american.org'],
  DONORS_GROUP: 'donors@pan-american.org',
  MEMBERS_GROUP: 'members@pan-american.org',
  RESUME_FOLDER_ID: '1Ltwb4qMNxR6VdAtgK-P_ucjRTqJ-tiIX',   // "Résumés (website applications)"
  MAX_RESUME_BYTES: 5 * 1024 * 1024,
  SEND_CONFIRMATION: true,
  ORG_NAME: 'The Pan-American Medical Association',
  REPLY_TO: 'info@pan-american.org',
  // PayPal
  PAYPAL_SANDBOX: false,                                  // true only while testing with PayPal sandbox
  MEMBERSHIP_KEYWORDS: ['member'],                        // item names containing these count as memberships
  ANNUAL_DAYS: 366,                                       // access length for one-time annual payments
  GRACE_DAYS: 7                                           // extra days before removing a lapsed monthly member
};

const FORMS = {
  "contact": {
    "sheet": "Contact Us",
    "title": "Contact Us",
    "subject": "New contact message",
    "columns": [
      {
        "key": "submitted_at",
        "label": "Submitted at"
      },
      {
        "key": "first_name",
        "label": "First name",
        "type": "text"
      },
      {
        "key": "last_name",
        "label": "Last name",
        "type": "text"
      },
      {
        "key": "email",
        "label": "Email address",
        "type": "email"
      },
      {
        "key": "phone",
        "label": "Phone number",
        "type": "tel"
      },
      {
        "key": "reason",
        "label": "Reason for contact",
        "type": "select"
      },
      {
        "key": "organization",
        "label": "Organization",
        "type": "text"
      },
      {
        "key": "message",
        "label": "Message",
        "type": "textarea"
      },
      {
        "key": "updates_opt_in",
        "label": "Email updates opt-in",
        "type": "consent"
      },
      {
        "key": "donors_group",
        "label": "Added to Donors group"
      },
      {
        "key": "page",
        "label": "Page"
      },
      {
        "key": "status",
        "label": "Status"
      },
      {
        "key": "notes",
        "label": "Notes"
      }
    ]
  },
  "volunteer": {
    "sheet": "Volunteer Applications",
    "title": "Volunteer Application",
    "subject": "New volunteer application",
    "columns": [
      {
        "key": "submitted_at",
        "label": "Submitted at"
      },
      {
        "key": "first_name",
        "label": "First name",
        "type": "text"
      },
      {
        "key": "last_name",
        "label": "Last name",
        "type": "text"
      },
      {
        "key": "email",
        "label": "Email address",
        "type": "email"
      },
      {
        "key": "phone",
        "label": "Phone number",
        "type": "tel"
      },
      {
        "key": "city",
        "label": "City",
        "type": "text"
      },
      {
        "key": "state",
        "label": "State / province",
        "type": "text"
      },
      {
        "key": "country",
        "label": "Country",
        "type": "text"
      },
      {
        "key": "languages",
        "label": "Languages you speak",
        "type": "checks"
      },
      {
        "key": "role",
        "label": "Which best describes you?",
        "type": "select"
      },
      {
        "key": "license",
        "label": "Active clinical license or certification",
        "type": "text"
      },
      {
        "key": "organization",
        "label": "Current employer, school or organization",
        "type": "text"
      },
      {
        "key": "interests",
        "label": "Areas of interest",
        "type": "checks"
      },
      {
        "key": "format",
        "label": "Preferred format",
        "type": "radios"
      },
      {
        "key": "availability",
        "label": "When are you usually available?",
        "type": "checks"
      },
      {
        "key": "hours",
        "label": "Hours per month",
        "type": "select"
      },
      {
        "key": "travel",
        "label": "Would you consider international travel with a medical team?",
        "type": "radios"
      },
      {
        "key": "passport",
        "label": "Do you have a valid passport?",
        "type": "radios"
      },
      {
        "key": "experience",
        "label": "Relevant experience and skills",
        "type": "textarea"
      },
      {
        "key": "motivation",
        "label": "Why do you want to volunteer with PAMA?",
        "type": "textarea"
      },
      {
        "key": "emergency_name",
        "label": "Emergency contact name",
        "type": "text"
      },
      {
        "key": "emergency_phone",
        "label": "Emergency contact phone",
        "type": "tel"
      },
      {
        "key": "heard_from",
        "label": "How did you hear about PAMA?",
        "type": "select"
      },
      {
        "key": "background_check",
        "label": "Background check acknowledgment",
        "type": "consent"
      },
      {
        "key": "attestation",
        "label": "Attestation",
        "type": "consent"
      },
      {
        "key": "updates_opt_in",
        "label": "Email updates opt-in",
        "type": "consent"
      },
      {
        "key": "donors_group",
        "label": "Added to Donors group"
      },
      {
        "key": "page",
        "label": "Page"
      },
      {
        "key": "status",
        "label": "Status"
      },
      {
        "key": "notes",
        "label": "Notes"
      }
    ]
  },
  "work_application": {
    "sheet": "Work Applications",
    "title": "Work Application",
    "subject": "New work application",
    "columns": [
      {
        "key": "submitted_at",
        "label": "Submitted at"
      },
      {
        "key": "position",
        "label": "Position of interest",
        "type": "select"
      },
      {
        "key": "employment_type",
        "label": "Type of role",
        "type": "select"
      },
      {
        "key": "start_date",
        "label": "Earliest start date",
        "type": "date"
      },
      {
        "key": "first_name",
        "label": "First name",
        "type": "text"
      },
      {
        "key": "last_name",
        "label": "Last name",
        "type": "text"
      },
      {
        "key": "email",
        "label": "Email address",
        "type": "email"
      },
      {
        "key": "phone",
        "label": "Phone number",
        "type": "tel"
      },
      {
        "key": "city",
        "label": "City",
        "type": "text"
      },
      {
        "key": "state",
        "label": "State / province",
        "type": "text"
      },
      {
        "key": "country",
        "label": "Country",
        "type": "text"
      },
      {
        "key": "linkedin",
        "label": "LinkedIn or portfolio link",
        "type": "url"
      },
      {
        "key": "resume",
        "label": "Résumé or CV",
        "type": "file"
      },
      {
        "key": "education",
        "label": "Highest level of education",
        "type": "select"
      },
      {
        "key": "experience_years",
        "label": "Years of relevant experience",
        "type": "select"
      },
      {
        "key": "certifications",
        "label": "Professional licenses or certifications",
        "type": "text"
      },
      {
        "key": "languages",
        "label": "Languages and proficiency",
        "type": "text"
      },
      {
        "key": "cover_letter",
        "label": "Cover letter",
        "type": "textarea"
      },
      {
        "key": "work_authorized",
        "label": "Are you legally authorized to work in the United States?",
        "type": "radios"
      },
      {
        "key": "sponsorship",
        "label": "Will you now or in the future require visa sponsorship?",
        "type": "radios"
      },
      {
        "key": "ref1_name",
        "label": "Reference 1 name and relationship",
        "type": "text"
      },
      {
        "key": "ref1_contact",
        "label": "Reference 1 email or phone",
        "type": "text"
      },
      {
        "key": "ref2_name",
        "label": "Reference 2 name and relationship",
        "type": "text"
      },
      {
        "key": "ref2_contact",
        "label": "Reference 2 email or phone",
        "type": "text"
      },
      {
        "key": "heard_from",
        "label": "How did you hear about this opportunity?",
        "type": "select"
      },
      {
        "key": "attestation",
        "label": "Attestation",
        "type": "consent"
      },
      {
        "key": "privacy_consent",
        "label": "Privacy consent",
        "type": "consent"
      },
      {
        "key": "updates_opt_in",
        "label": "Email updates opt-in",
        "type": "consent"
      },
      {
        "key": "resume_link",
        "label": "Résumé link"
      },
      {
        "key": "donors_group",
        "label": "Added to Donors group"
      },
      {
        "key": "page",
        "label": "Page"
      },
      {
        "key": "status",
        "label": "Status"
      },
      {
        "key": "notes",
        "label": "Notes"
      }
    ]
  },
  "membership": {
    "sheet": "Membership Applications",
    "title": "Membership Application",
    "subject": "New membership application",
    "columns": [
      {
        "key": "submitted_at",
        "label": "Submitted at"
      },
      {
        "key": "category",
        "label": "Membership category",
        "type": "radios"
      },
      {
        "key": "billing",
        "label": "Preferred billing",
        "type": "radios"
      },
      {
        "key": "first_name",
        "label": "First name",
        "type": "text"
      },
      {
        "key": "last_name",
        "label": "Last name",
        "type": "text"
      },
      {
        "key": "email",
        "label": "Email address",
        "type": "email"
      },
      {
        "key": "phone",
        "label": "Phone number",
        "type": "tel"
      },
      {
        "key": "city",
        "label": "City",
        "type": "text"
      },
      {
        "key": "state",
        "label": "State / province",
        "type": "text"
      },
      {
        "key": "country",
        "label": "Country",
        "type": "text"
      },
      {
        "key": "credentials",
        "label": "Profession or credentials",
        "type": "text"
      },
      {
        "key": "specialty",
        "label": "Specialty or field",
        "type": "text"
      },
      {
        "key": "institution",
        "label": "Institution, practice or school",
        "type": "text"
      },
      {
        "key": "languages",
        "label": "Languages you speak",
        "type": "checks"
      },
      {
        "key": "interests",
        "label": "What would you like to be part of?",
        "type": "checks"
      },
      {
        "key": "reason",
        "label": "Why are you joining PAMA?",
        "type": "textarea"
      },
      {
        "key": "heard_from",
        "label": "How did you hear about PAMA?",
        "type": "select"
      },
      {
        "key": "attestation",
        "label": "Attestation",
        "type": "consent"
      },
      {
        "key": "updates_opt_in",
        "label": "Email updates opt-in",
        "type": "consent"
      },
      {
        "key": "donors_group",
        "label": "Added to Donors group"
      },
      {
        "key": "page",
        "label": "Page"
      },
      {
        "key": "status",
        "label": "Status"
      },
      {
        "key": "notes",
        "label": "Notes"
      }
    ]
  },
  "newsletter": {
    "sheet": "Newsletter Signups",
    "title": "Newsletter",
    "subject": "New newsletter signup",
    "columns": [
      {
        "key": "submitted_at",
        "label": "Submitted at"
      },
      {
        "key": "first_name",
        "label": "First name",
        "type": "text"
      },
      {
        "key": "last_name",
        "label": "Last name",
        "type": "text"
      },
      {
        "key": "email",
        "label": "Email address",
        "type": "email"
      },
      {
        "key": "phone",
        "label": "Phone number",
        "type": "tel"
      },
      {
        "key": "interests",
        "label": "What would you like to hear about?",
        "type": "checks"
      },
      {
        "key": "updates_opt_in",
        "label": "Email updates opt-in",
        "type": "consent"
      },
      {
        "key": "donors_group",
        "label": "Added to Donors group"
      },
      {
        "key": "page",
        "label": "Page"
      },
      {
        "key": "status",
        "label": "Status"
      },
      {
        "key": "notes",
        "label": "Notes"
      }
    ]
  }
};

/* ------------------------------------------------------------------ */
/*  Web entry points                                                  */
/* ------------------------------------------------------------------ */

function doGet() {
  return json_({ ok: true, service: 'PAMA website forms', time: new Date().toISOString() });
}

function doPost(e) {
  try {
    if (isPayPal_(e)) return handlePayPal_(e);
    const data = parseBody_(e);
    if (/^portal_/.test(String(data.action || ''))) return handlePortal_(data);   // Portal.gs
    if (data._gotcha) return json_({ ok: true });            // spam trap
    const form = FORMS[data.form_type];
    if (!form) throw new Error('Unknown form_type: ' + data.form_type);
    validate_(form, data);

    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      if (data.form_type === 'work_application' && data.resume_file) {
        data.resume = data.resume_file.name;
        data.resume_link = saveResume_(data);
      }
      data.submitted_at = new Date();
      data.donors_group = '';
      if (String(data.updates_opt_in || '').toLowerCase() === 'yes') {
        data.donors_group = addToGroup_(CONFIG.DONORS_GROUP, data.email);
      }
      data.status = 'New';
      appendRow_(form, data);
    } finally {
      lock.releaseLock();
    }

    notifyTeam_(form, data);
    if (CONFIG.SEND_CONFIRMATION) confirmToSender_(form, data);
    return json_({ ok: true });
  } catch (err) {
    logError_('doPost', err, e && e.postData ? e.postData.contents : '');
    return json_({ ok: false, error: String(err.message || err) });
  }
}

/* ------------------------------------------------------------------ */
/*  Website forms                                                     */
/* ------------------------------------------------------------------ */

function parseBody_(e) {
  if (e.postData && e.postData.contents) {
    try { return JSON.parse(e.postData.contents); } catch (x) { /* fall through to form fields */ }
  }
  return e.parameter || {};
}

function validate_(form, data) {
  const email = String(data.email || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('A valid email address is required.');
  ['first_name', 'last_name'].forEach(function (k) {
    if (!String(data[k] || '').trim()) throw new Error('Missing ' + k);
  });
  data.email = email.toLowerCase();
}

function appendRow_(form, data) {
  const sh = SpreadsheetApp.getActive().getSheetByName(form.sheet) || setupSheet_(form);
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const byLabel = {};
  form.columns.forEach(function (c) { byLabel[c.label] = c.key; });
  const row = headers.map(function (h) {
    const key = byLabel[h];
    if (!key) return '';
    let v = data[key];
    if (Array.isArray(v)) v = v.join(', ');
    if (v === undefined || v === null) return '';
    if (typeof v === 'string' && /^[=+\-@]/.test(v)) v = "'" + v;  // block formula injection
    return v;
  });
  sh.appendRow(row);
}

function saveResume_(data) {
  const f = data.resume_file;
  const bytes = Utilities.base64Decode(f.data);
  if (bytes.length > CONFIG.MAX_RESUME_BYTES) throw new Error('Résumé is larger than 5 MB.');
  const okTypes = ['application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (okTypes.indexOf(f.type) === -1) throw new Error('Résumé must be a PDF or Word document.');
  const safe = (data.last_name + '_' + data.first_name + '_' +
    Utilities.formatDate(new Date(), 'America/Denver', 'yyyy-MM-dd') + '_' + f.name)
    .replace(/[^\w.\- ]+/g, '_');
  const file = DriveApp.getFolderById(CONFIG.RESUME_FOLDER_ID)
    .createFile(Utilities.newBlob(bytes, f.type, safe));
  delete data.resume_file;
  return file.getUrl();
}

function notifyTeam_(form, data) {
  const name = (data.first_name + ' ' + data.last_name).trim();
  const subject = form.subject + ': ' + name +
    (data.reason ? ' (' + data.reason + ')' : data.position ? ' (' + data.position + ')' : '');
  const rows = form.columns
    .filter(function (c) { return ['submitted_at', 'status', 'notes'].indexOf(c.key) === -1; })
    .map(function (c) {
      let v = data[c.key];
      if (Array.isArray(v)) v = v.join(', ');
      if (v === undefined || v === '') return '';
      return '<tr><th align="left" valign="top" style="padding:4px 12px 4px 0;color:#4a5a58">' +
        esc_(c.label) + '</th><td style="padding:4px 0">' +
        (c.key === 'resume_link' ? '<a href="' + esc_(v) + '">Open résumé</a>' : esc_(String(v)).replace(/\n/g, '<br>')) +
        '</td></tr>';
    }).join('');
  const sheetUrl = SpreadsheetApp.getActive().getUrl();
  MailApp.sendEmail({
    to: CONFIG.NOTIFY.join(','),
    replyTo: data.email,
    subject: subject,
    htmlBody: '<h2 style="font-family:Georgia,serif;color:#0d3b3e">' + esc_(form.title) + '</h2>' +
      '<table style="font-family:Arial,sans-serif;font-size:14px">' + rows + '</table>' +
      '<p style="font-family:Arial,sans-serif;font-size:13px"><a href="' + sheetUrl + '">Open the submissions sheet</a></p>'
  });
}

function confirmToSender_(form, data) {
  const lines = {
    contact: 'Thank you for contacting us. Our coordination team will reply within 3–5 business days.',
    volunteer: 'Thank you for applying to volunteer with PAMA. Our volunteer coordinator will review your application and contact you about next steps.',
    work_application: 'Thank you for applying to join PAMA’s team. We review applications on a rolling basis and will contact you if you are selected for an interview.',
    membership: 'Thank you for completing your PAMA member profile. If you haven’t paid your dues yet, you can join anytime at https://www.pan-american.org/member/ — please use this same email address in PayPal.',
    newsletter: 'You’re subscribed. Expect field reports, shipment updates and ways to get involved.'
  };
  MailApp.sendEmail({
    to: data.email,
    replyTo: CONFIG.REPLY_TO,
    name: CONFIG.ORG_NAME,
    subject: 'We received your ' + form.title.toLowerCase() + ' — ' + CONFIG.ORG_NAME,
    htmlBody: '<p>Hello ' + esc_(data.first_name) + ',</p><p>' + lines[data.form_type] + '</p>' +
      '<p>Together with our partners, we strengthen health systems across the Americas.</p>' +
      '<p>— ' + CONFIG.ORG_NAME + '<br><a href="https://www.pan-american.org">pan-american.org</a></p>'
  });
}

/* ------------------------------------------------------------------ */
/*  Google Groups (Admin SDK)                                         */
/* ------------------------------------------------------------------ */

function addToGroup_(group, email) {
  try {
    AdminDirectory.Members.insert({ email: email, role: 'MEMBER' }, group);
    return 'Added';
  } catch (err) {
    const m = String(err.message || err);
    if (/Member already exists|duplicate/i.test(m)) return 'Already a member';
    logError_('addToGroup_ ' + group, err, email);
    return 'Error: ' + m.slice(0, 120);
  }
}

function removeFromGroup_(group, email) {
  try {
    AdminDirectory.Members.remove(group, email);
    return 'Removed';
  } catch (err) {
    const m = String(err.message || err);
    if (/Resource Not Found|not found/i.test(m)) return 'Not a member';
    logError_('removeFromGroup_ ' + group, err, email);
    return 'Error: ' + m.slice(0, 120);
  }
}

/* ------------------------------------------------------------------ */
/*  PayPal memberships (IPN)                                          */
/* ------------------------------------------------------------------ */

function isPayPal_(e) {
  const p = (e && e.parameter) || {};
  return !!(p.txn_type || p.ipn_track_id || p.payment_status || p.source === 'paypal');
}

function handlePayPal_(e) {
  const raw = e.postData ? e.postData.contents : '';
  const p = e.parameter || {};
  const url = CONFIG.PAYPAL_SANDBOX
    ? 'https://ipnpb.sandbox.paypal.com/cgi-bin/webscr'
    : 'https://ipnpb.paypal.com/cgi-bin/webscr';
  let verified = false;
  try {
    const res = UrlFetchApp.fetch(url, {
      method: 'post', payload: 'cmd=_notify-validate&' + raw,
      contentType: 'application/x-www-form-urlencoded', muteHttpExceptions: true
    });
    verified = res.getContentText().trim() === 'VERIFIED';
  } catch (err) { logError_('PayPal verify', err, raw); }

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  let action = '';
  try {
    if (!verified) action = 'Ignored: not verified by PayPal';
    else if (p.txn_id && alreadyLogged_(p.txn_id, p.txn_type)) action = 'Duplicate notification';
    else action = applyMembership_(p);
    logPayPal_(p, verified, action, raw);
  } finally { lock.releaseLock(); }
  return json_({ ok: true });
}

function isMembershipPayment_(p) {
  const name = String(p.item_name || p.product_name || p.transaction_subject || p.item_name1 || '').toLowerCase();
  if (CONFIG.MEMBERSHIP_KEYWORDS.some(function (k) { return name.indexOf(k) !== -1; })) return true;
  return /^subscr_|^recurring_payment/.test(String(p.txn_type || ''));
}

function applyMembership_(p) {
  const t = String(p.txn_type || '');
  const status = String(p.payment_status || '');
  const email = String(p.payer_email || '').toLowerCase().trim();
  if (!email) return 'No payer email';
  if (!isMembershipPayment_(p)) return 'Not a membership payment';

  const now = new Date();
  const start = ['subscr_signup', 'recurring_payment_profile_created'];
  const paid = ['subscr_payment', 'recurring_payment', 'web_accept', 'express_checkout', 'cart'];
  const ended = ['subscr_eot', 'recurring_payment_expired', 'recurring_payment_suspended',
    'recurring_payment_suspended_due_to_max_failed_payment', 'recurring_payment_profile_cancel'];
  const cancelled = ['subscr_cancel'];
  const failed = ['subscr_failed', 'recurring_payment_failed'];
  const refunded = status === 'Refunded' || status === 'Reversed';
  const recurring = /^subscr_|^recurring_payment/.test(t);

  let m = {
    email: email, first: p.first_name || '', last: p.last_name || '',
    plan: p.item_name || p.product_name || p.transaction_subject || '',
    billing: recurring ? 'Monthly (PayPal subscription)' : 'Annual (one-time payment)',
    amount: p.mc_gross || p.amount || p.mc_amount3 || '',
    subscr: p.subscr_id || p.recurring_payment_id || '', txn: p.txn_id || ''
  };

  if (refunded) {
    upsertMember_(m, { status: 'Refunded', expires: now });
    return 'Refund: ' + removeFromGroup_(CONFIG.MEMBERS_GROUP, email);
  }
  if (start.indexOf(t) !== -1 || (paid.indexOf(t) !== -1 && status === 'Completed')) {
    const expires = new Date(now.getTime() + (recurring ? 31 + CONFIG.GRACE_DAYS : CONFIG.ANNUAL_DAYS) * 864e5);
    const isNew = upsertMember_(m, { status: 'Active', paidAt: paid.indexOf(t) !== -1 ? now : null, expires: expires });
    const g = addToGroup_(CONFIG.MEMBERS_GROUP, email);
    if (isNew) welcomeMember_(m);
    return 'Active member: ' + g;
  }
  if (cancelled.indexOf(t) !== -1) {
    upsertMember_(m, { status: 'Cancelled (access until expiry)' });
    return 'Cancelled; keeps access until expiry';
  }
  if (ended.indexOf(t) !== -1) {
    upsertMember_(m, { status: 'Ended', expires: now });
    return 'Ended: ' + removeFromGroup_(CONFIG.MEMBERS_GROUP, email);
  }
  if (failed.indexOf(t) !== -1) {
    upsertMember_(m, { status: 'Payment failed' });
    return 'Payment failed (no change to access)';
  }
  return 'No action for ' + t + ' / ' + status;
}

function membersSheet_() { return SpreadsheetApp.getActive().getSheetByName('Members'); }

function upsertMember_(m, u) {
  const sh = membersSheet_();
  const vals = sh.getDataRange().getValues();
  let r = -1;
  for (let i = 1; i < vals.length; i++) {
    if (String(vals[i][0]).toLowerCase() === m.email ||
        (m.subscr && String(vals[i][10]) === m.subscr)) { r = i + 1; break; }
  }
  const isNew = r === -1;
  if (isNew) {
    sh.appendRow([m.email, m.first, m.last, m.plan, m.billing, m.amount, u.status || 'Active',
      new Date(), u.paidAt || '', u.expires || '', m.subscr, m.txn, '', '']);
    r = sh.getLastRow();
  } else {
    if (m.first) sh.getRange(r, 2).setValue(m.first);
    if (m.last) sh.getRange(r, 3).setValue(m.last);
    if (m.plan) sh.getRange(r, 4).setValue(m.plan);
    if (m.amount) sh.getRange(r, 6).setValue(m.amount);
    if (u.status) sh.getRange(r, 7).setValue(u.status);
    if (u.paidAt) sh.getRange(r, 9).setValue(u.paidAt);
    if (u.expires) sh.getRange(r, 10).setValue(u.expires);
    if (m.subscr) sh.getRange(r, 11).setValue(m.subscr);
    if (m.txn) sh.getRange(r, 12).setValue(m.txn);
  }
  const st = String(u.status || sh.getRange(r, 7).getValue());
  sh.getRange(r, 13).setValue(/^Active|^Cancelled/.test(st) ? 'Yes' : 'No');
  return isNew;
}

function welcomeMember_(m) {
  MailApp.sendEmail({
    to: CONFIG.NOTIFY.join(','),
    subject: 'New PAMA member: ' + (m.first + ' ' + m.last).trim() + ' (' + m.email + ')',
    htmlBody: '<p>A new membership payment was received and the member was added to ' +
      CONFIG.MEMBERS_GROUP + '.</p><p>Plan: ' + esc_(m.plan) + '<br>Amount: ' + esc_(String(m.amount)) +
      '<br>Billing: ' + esc_(m.billing) + '</p>'
  });
  MailApp.sendEmail({
    to: m.email, replyTo: CONFIG.REPLY_TO, name: CONFIG.ORG_NAME,
    subject: 'Welcome to the Pan-American Medical Association',
    htmlBody: '<p>Hello ' + esc_(m.first || 'and welcome') + ',</p>' +
      '<p>Thank you for becoming a PAMA member. Your membership is active, and you’ll now receive member updates at this address.</p>' +
      '<p><strong>Your member portal is ready.</strong> Sign in at <a href="https://www.pan-american.org/members/">pan-american.org/members</a> ' +
      'with this email address — we’ll send you a one-time code, so there’s no password to remember. ' +
      'Inside you’ll find events, resources, opportunities and the member directory.</p>' +
      '<p>Together with our members and partners, we strengthen health systems across the Americas.</p>' +
      '<p>— ' + CONFIG.ORG_NAME + '</p>'
  });
}

function alreadyLogged_(txnId, txnType) {
  const sh = SpreadsheetApp.getActive().getSheetByName('PayPal Log');
  if (sh.getLastRow() < 2) return false;
  const vals = sh.getRange(2, 3, sh.getLastRow() - 1, 9).getValues(); // C..K
  return vals.some(function (r) { return String(r[8]) === String(txnId) && String(r[0]) === String(txnType); });
}

function logPayPal_(p, verified, action, raw) {
  SpreadsheetApp.getActive().getSheetByName('PayPal Log').appendRow([
    new Date(), verified ? 'Yes' : 'No', p.txn_type || '', p.payment_status || '', p.payer_email || '',
    p.first_name || '', p.last_name || '', p.item_name || p.product_name || p.transaction_subject || '',
    p.mc_gross || p.amount || '', p.mc_currency || p.currency_code || '', p.txn_id || '',
    p.subscr_id || p.recurring_payment_id || '', action, String(raw).slice(0, 45000)
  ]);
}

/**
 * Daily: removes members whose access has expired, and makes sure every Active
 * (or Cancelled-but-not-expired) member is in members@. Safe to run by hand.
 */
function syncMembersGroup() {
  const sh = membersSheet_();
  const vals = sh.getDataRange().getValues();
  const today = new Date();
  for (let i = 1; i < vals.length; i++) {
    const email = String(vals[i][0]).trim().toLowerCase();
    if (!email) continue;
    const status = String(vals[i][6]);
    const exp = vals[i][9] instanceof Date ? vals[i][9] : null;
    const r = i + 1;
    if (/^Active|^Cancelled/.test(status) && exp && exp < today) {
      sh.getRange(r, 7).setValue('Expired');
      sh.getRange(r, 13).setValue('No');
      sh.getRange(r, 14).setValue('Removed ' + today.toDateString() + ': ' + removeFromGroup_(CONFIG.MEMBERS_GROUP, email));
    } else if (/^Active|^Cancelled/.test(status)) {
      addToGroup_(CONFIG.MEMBERS_GROUP, email);
      sh.getRange(r, 13).setValue('Yes');
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function esc_(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function logError_(where, err, details) {
  try {
    SpreadsheetApp.getActive().getSheetByName('Errors')
      .appendRow([new Date(), where, String(err && err.message || err), String(details || '').slice(0, 5000)]);
  } catch (x) { console.error(x); }
}
function setupSheet_(form) {
  const sh = SpreadsheetApp.getActive().insertSheet(form.sheet);
  sh.getRange(1, 1, 1, form.columns.length).setValues([form.columns.map(function (c) { return c.label; })])
    .setFontWeight('bold');
  sh.setFrozenRows(1);
  return sh;
}

/* ------------------------------------------------------------------ */
/*  SETUP — run once from the Apps Script editor                      */
/* ------------------------------------------------------------------ */

/**
 * 1. Run setup() once and approve the permissions prompt.
 *    It checks every tab, confirms the Admin SDK works, and creates the daily members sync.
 */
function setup() {
  Object.keys(FORMS).forEach(function (k) {
    if (!SpreadsheetApp.getActive().getSheetByName(FORMS[k].sheet)) setupSheet_(FORMS[k]);
  });
  // Confirms Admin SDK access to both groups (throws if the service isn't enabled).
  [CONFIG.DONORS_GROUP, CONFIG.MEMBERS_GROUP].forEach(function (g) {
    const info = AdminDirectory.Groups.get(g);
    console.log('Group OK: ' + info.email + ' (' + info.directMembersCount + ' members)');
  });
  DriveApp.getFolderById(CONFIG.RESUME_FOLDER_ID);
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'syncMembersGroup') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('syncMembersGroup').timeBased().everyDays(1).atHour(6).create();
  console.log('Setup complete. Now deploy as a web app (Deploy → New deployment → Web app).');
}

/** Optional: sends one test row through the Contact form path. */
function testContact() {
  const e = { postData: { contents: JSON.stringify({
    form_type: 'contact', first_name: 'Test', last_name: 'Submission', email: 'admin@pan-american.org',
    phone: '000-000-0000', reason: 'Other', message: 'Test from Apps Script', updates_opt_in: '', page: 'apps-script test'
  }) } };
  console.log(doPost(e).getContent());
}
