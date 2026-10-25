// PAMA Member Portal: email-code sign-in and the member dashboard.
// All member data comes from the PAMA Apps Script (Portal.gs) after sign-in;
// nothing private is stored in this public file.
(function () {
  "use strict";
  var ENDPOINT = window.PAMA_FORMS_ENDPOINT || "https://script.google.com/macros/s/AKfycby1f1Q47q7VQ6Ds6yULHwH3TM8vAi_zIMVkr-lnVMXa576JRlMqaUxFAAzOUxU9c_mF/exec";
  var KEY = "pamaPortalSession";
  var root = document.querySelector("main.portal");
  if (!root) return;

  var state = { email: "", data: null, filters: { resources: "All", opportunities: "All" } };

  /* ---------- helpers ---------- */
  function $(sel, el) { return (el || root).querySelector(sel); }
  function $$(sel, el) { return Array.prototype.slice.call((el || root).querySelectorAll(sel)); }
  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (attrs[k] == null || attrs[k] === false) return;
      if (k === "text") el.textContent = attrs[k];
      else if (k === "class") el.className = attrs[k];
      else el.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) el.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return el;
  }
  function safeUrl(u) { return /^(https?:\/\/|mailto:)/i.test(String(u || "")) ? u : ""; }
  function linkBtn(url, label, cls) {
    url = safeUrl(url);
    if (!url) return null;
    var ext = !/^https:\/\/www\.pan-american\.org/i.test(url) && !/^mailto:/i.test(url);
    return h("a", { href: url, class: cls || "portal-link-btn", target: ext ? "_blank" : null, rel: ext ? "noopener" : null, text: label || "Open" });
  }
  function fmtDate(iso, opts) {
    if (!iso) return "";
    var d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(iso + "T12:00:00") : new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleDateString(undefined, opts || { year: "numeric", month: "long", day: "numeric" });
  }
  function store(obj) {
    try { if (obj) localStorage.setItem(KEY, JSON.stringify(obj)); else { localStorage.removeItem(KEY); sessionStorage.removeItem(KEY); } } catch (e) {}
  }
  function storeSession(obj, remember) {
    try {
      localStorage.removeItem(KEY); sessionStorage.removeItem(KEY);
      (remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(obj));
    } catch (e) { state.memToken = obj; }
  }
  function session() {
    if (state.memToken) return state.memToken;
    try { return JSON.parse(localStorage.getItem(KEY) || sessionStorage.getItem(KEY) || "null"); } catch (e) { return null; }
  }
  function track(name, params) { if (window.pamaTrack) window.pamaTrack(name, params || {}); }

  function api(body) {
    return fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); })
      .then(function (r) {
        if (r && !r.ok && /Unknown form_type/.test(r.error || "")) {
          r.error = "The member portal is being set up and will open shortly. Please try again later or email info@pan-american.org.";
        }
        return r;
      })
      .catch(function () { return { ok: false, error: "We couldn’t reach the portal. Check your connection and try again." }; });
  }

  function show(view) {
    root.setAttribute("data-state", view);
    $$("[data-view]").forEach(function (v) { v.hidden = v.getAttribute("data-view") !== view; });
  }
  function step(name) {
    $$(".portal-step").forEach(function (s) { s.hidden = s.getAttribute("data-step") !== name; });
    $$('[data-bind="email"]').forEach(function (b) { b.textContent = state.email; });
    var focus = { email: "#portal-email", code: "#portal-code" }[name];
    if (focus) setTimeout(function () { $(focus).focus(); }, 30);
  }
  function msg(form, text, ok) {
    var m = $(".portal-msg", form);
    m.textContent = text || "";
    m.className = "portal-msg" + (text ? (ok ? " ok" : " err") : "");
  }
  function busy(btn, on, label) {
    if (on) { btn.dataset.label = btn.textContent; btn.textContent = label; btn.disabled = true; }
    else { btn.textContent = btn.dataset.label || btn.textContent; btn.disabled = false; }
  }

  /* ---------- sign-in ---------- */
  var emailForm = $('[data-step="email"]'), codeForm = $('[data-step="code"]');

  function requestCode(btn) {
    var form = emailForm;
    busy(btn, true, "Sending…");
    return api({ action: "portal_request_code", email: state.email }).then(function (r) {
      busy(btn, false);
      if (!r.ok) { msg(step.current === "code" ? codeForm : form, r.error, false); return; }
      if (!r.member) { track("portal_not_member"); step("not-member"); return; }
      msg(form, ""); msg(codeForm, "");
      codeForm.reset(); $('input[name="remember"]', codeForm).checked = true;
      step("code"); step.current = "code";
      track("portal_code_sent");
    });
  }

  emailForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var v = $("#portal-email").value.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { msg(emailForm, "Please enter a valid email address."); return; }
    state.email = v;
    requestCode($('button[type="submit"]', emailForm));
  });

  var codeInput = $("#portal-code");
  codeInput.addEventListener("input", function () {
    codeInput.value = codeInput.value.replace(/\D/g, "").slice(0, 6);
    if (codeInput.value.length === 6) codeForm.requestSubmit ? codeForm.requestSubmit() : codeForm.dispatchEvent(new Event("submit"));
  });

  codeForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var code = codeInput.value.replace(/\D/g, "");
    if (code.length !== 6) { msg(codeForm, "Please enter the 6-digit code from your email."); return; }
    var btn = $('button[type="submit"]', codeForm);
    if (btn.disabled) return;
    busy(btn, true, "Signing in…");
    api({ action: "portal_verify", email: state.email, code: code }).then(function (r) {
      busy(btn, false);
      if (!r.ok) { msg(codeForm, r.error); codeInput.select(); return; }
      storeSession({ token: r.token, email: state.email }, $('input[name="remember"]', codeForm).checked);
      track("portal_sign_in");
      load();
    });
  });

  root.addEventListener("click", function (e) {
    var a = e.target.closest("[data-action]");
    if (!a) return;
    var act = a.getAttribute("data-action");
    if (act === "change-email") { step("email"); step.current = "email"; }
    if (act === "resend") requestCode(a);
    if (act === "sign-out") signOut();
    if (act === "sign-out-all") {
      if (!window.confirm("Sign out on every device, including this one?")) return;
      var s = session();
      api({ action: "portal_sign_out_all", token: s && s.token }).then(function () { signOut(); });
    }
    if (act === "ics") downloadIcs(JSON.parse(a.getAttribute("data-event")));
  });

  function signOut() {
    store(null); state.memToken = null; state.data = null;
    location.hash = "";
    show("auth"); step("email"); step.current = "email";
  }

  /* ---------- dashboard ---------- */
  function load() {
    var s = session();
    if (!s || !s.token) { show("auth"); step("email"); return; }
    show("loading");
    api({ action: "portal_data", token: s.token }).then(function (r) {
      if (!r.ok) {
        store(null); state.memToken = null;
        show("auth");
        state.email = s.email || "";
        if (r.code === "not_member") { step("not-member"); return; }
        step("email");
        if (s.email) $("#portal-email").value = s.email;
        msg(emailForm, r.code === "signed_out" ? "Please sign in again." : r.error);
        return;
      }
      state.data = r;
      render();
      show("app");
      route();
    });
  }

  function bind(name, value) { $$('[data-bind="' + name + '"]').forEach(function (b) { b.textContent = value; }); }

  function profileCompletion(p) {
    var keys = ["display_name", "credentials", "specialty", "institution", "city", "country", "languages", "interests", "bio"];
    var done = keys.filter(function (k) { return String(p[k] || "").trim(); }).length;
    var missing = keys.filter(function (k) { return !String(p[k] || "").trim(); });
    var names = { credentials: "credentials", specialty: "specialty", institution: "institution", city: "city", country: "country", languages: "languages", interests: "interests", bio: "a short bio", display_name: "your name" };
    return { pct: Math.round(done / keys.length * 100), hint: missing.length ? "Add " + missing.slice(0, 2).map(function (k) { return names[k]; }).join(" and ") + " to help us match you with opportunities." : "Thank you — your profile is complete." };
  }

  function render() {
    var d = state.data, m = d.member, p = d.profile;
    bind("first", (p.display_name || m.first || "").split(" ")[0] || "member");
    bind("tier", m.tier);
    bind("member_id", m.member_id);
    bind("display_name", p.display_name || (m.first + " " + m.last));
    bind("joined", m.joined ? fmtDate(m.joined, { year: "numeric", month: "short" }) : "—");
    bind("status_label", /^Cancelled/.test(m.status) ? "Active until " + fmtDate(m.expires) : m.status);
    $$('[data-show="admin"]').forEach(function (el) { el.hidden = !m.admin; });
    var c = profileCompletion(p);
    bind("profile_pct_text", c.pct + "%");
    bind("profile_hint", c.hint);
    $$("[data-bind-style=profile_pct]").forEach(function (el) { el.style.width = c.pct + "%"; });

    fill("announcements", d.announcements, announcement, "No announcements right now.");
    fill("next-event", d.events.slice(0, 1), eventItem, "No upcoming events yet — check back soon.");
    fill("events", d.events, eventItem, "No upcoming events yet. New member calls and trainings will appear here.");
    fill("opps-short", d.opportunities.slice(0, 3), oppItem, "No open opportunities right now.");
    chips("resources", d.resources, "category");
    chips("opportunities", d.opportunities, "type");
    renderResources(); renderOpps(); renderDirectory();
    renderMembership();
    fillProfileForm();
  }

  function fill(name, items, fn, empty) {
    var box = $('[data-list="' + name + '"]');
    if (!box) return;
    box.textContent = "";
    if (!items || !items.length) { box.appendChild(h("p", { class: "portal-empty", text: empty })); return; }
    items.forEach(function (it) { box.appendChild(fn(it)); });
  }

  function announcement(a) {
    return h("article", { class: "portal-item" + (a.pinned === "Yes" ? " pinned" : "") }, [
      h("p", { class: "portal-meta", text: (a.pinned === "Yes" ? "Pinned · " : "") + fmtDate(a.date) }),
      h("h3", { text: a.title }),
      a.message ? h("p", { text: a.message }) : null,
      linkBtn(a.link, a.link_label || "Learn more")
    ]);
  }

  function eventItem(ev) {
    var d = /^\d{4}-\d{2}-\d{2}$/.test(ev.date || "") ? new Date(ev.date + "T12:00:00") : null;
    var when = [ev.start_time, ev.end_time].filter(Boolean).join(" – ");
    return h("article", { class: "portal-item portal-event" }, [
      h("div", { class: "portal-date", "aria-hidden": "true" }, d ? [
        h("span", { text: d.toLocaleDateString(undefined, { month: "short" }) }),
        h("strong", { text: String(d.getDate()) })
      ] : [h("strong", { text: "TBA" })]),
      h("div", null, [
        h("p", { class: "portal-meta", text: [d ? fmtDate(ev.date, { weekday: "long", month: "long", day: "numeric" }) : "", when, ev.format].filter(Boolean).join(" · ") }),
        h("h3", { text: ev.title }),
        ev.location ? h("p", { class: "portal-muted", text: ev.location }) : null,
        ev.description ? h("p", { text: ev.description }) : null,
        h("div", { class: "portal-actions" }, [
          linkBtn(ev.link, ev.link_label || "Details"),
          d ? h("button", { type: "button", class: "portal-link", "data-action": "ics", "data-event": JSON.stringify(ev), text: "Add to calendar" }) : null
        ])
      ])
    ]);
  }

  function oppItem(o) {
    return h("article", { class: "portal-item" }, [
      h("p", { class: "portal-meta" }, [h("span", { class: "portal-tag", text: o.type || "Opportunity" }), " " + [o.location, o.deadline ? "Deadline: " + o.deadline : ""].filter(Boolean).join(" · ")]),
      h("h3", { text: o.title }),
      o.description ? h("p", { text: o.description }) : null,
      linkBtn(o.link, o.link_label || "Learn more")
    ]);
  }

  function chips(name, items, key) {
    var box = $('[data-chips="' + name + '"]');
    box.textContent = "";
    var cats = ["All"];
    items.forEach(function (i) { if (i[key] && cats.indexOf(i[key]) === -1) cats.push(i[key]); });
    if (cats.length < 3) return;
    cats.forEach(function (c) {
      var b = h("button", { type: "button", class: "portal-chip", "aria-pressed": String(state.filters[name] === c), text: c });
      b.addEventListener("click", function () {
        state.filters[name] = c;
        $$(".portal-chip", box).forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        name === "resources" ? renderResources() : renderOpps();
      });
      box.appendChild(b);
    });
  }

  function matches(obj, q) {
    if (!q) return true;
    var hay = Object.keys(obj).map(function (k) { return obj[k]; }).join(" ").toLowerCase();
    return q.toLowerCase().split(/\s+/).every(function (w) { return hay.indexOf(w) !== -1; });
  }

  function renderResources() {
    var q = $('[data-filter="resources"]').value, f = state.filters.resources;
    var list = state.data.resources.filter(function (r) { return (f === "All" || r.category === f) && matches(r, q); });
    fill("resources", list, function (r) {
      return h("article", { class: "portal-card" }, [
        h("p", { class: "portal-meta" }, [h("span", { class: "portal-tag", text: r.type || "Resource" }), " " + (r.category || "")]),
        h("h3", { text: r.title }),
        r.description ? h("p", { text: r.description }) : null,
        linkBtn(r.link, "Open")
      ]);
    }, "No resources match your search.");
  }

  function renderOpps() {
    var f = state.filters.opportunities;
    fill("opportunities", state.data.opportunities.filter(function (o) { return f === "All" || o.type === f; }), oppItem, "No open opportunities right now.");
  }

  function initials(name) {
    return String(name || "?").split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0]; }).join("").toUpperCase();
  }

  function renderDirectory() {
    var q = $('[data-filter="directory"]').value;
    var list = state.data.directory.filter(function (m) { return matches(m, q); });
    var empty = state.data.directory.length
      ? "No members match your search."
      : "No members have joined the directory yet. Be one of the first: turn on “Show me in the member directory” in My profile.";
    fill("directory", list, function (m) {
      return h("article", { class: "portal-card portal-person" }, [
        h("div", { class: "portal-person-head" }, [
          h("span", { class: "portal-avatar", "aria-hidden": "true", text: initials(m.name) }),
          h("div", null, [
            h("h3", { text: m.name + (m.credentials ? ", " + m.credentials : "") }),
            h("p", { class: "portal-meta", text: [m.specialty, m.institution].filter(Boolean).join(" · ") })
          ])
        ]),
        m.location ? h("p", { class: "portal-muted", text: m.location }) : null,
        m.languages ? h("p", { class: "portal-small", text: "Languages: " + m.languages }) : null,
        m.bio ? h("p", { text: m.bio }) : null,
        m.interests ? h("p", { class: "portal-small", text: "Interested in: " + m.interests }) : null,
        h("div", { class: "portal-actions" }, [
          m.email ? linkBtn("mailto:" + m.email, "Email") : null,
          linkBtn(m.linkedin, "LinkedIn")
        ])
      ]);
    }, empty);
  }

  function renderMembership() {
    var m = state.data.member, box = $('[data-list="membership"]');
    box.textContent = "";
    [["Plan", m.tier], ["Billing", m.billing || "—"], ["Status", m.status],
     ["Member since", m.joined ? fmtDate(m.joined) : "—"],
     ["Last payment", m.last_paid ? fmtDate(m.last_paid) : "—"],
     [/^Cancelled/.test(m.status) ? "Access until" : "Paid through", m.expires ? fmtDate(m.expires) : "—"],
     ["Member ID", m.member_id], ["Email", m.email]
    ].forEach(function (row) {
      box.appendChild(h("div", null, [h("dt", { text: row[0] }), h("dd", { text: row[1] || "—" })]));
    });
  }

  /* ---------- profile ---------- */
  var profileForm = $('[data-form="profile"]');
  function fillProfileForm() {
    var p = state.data.profile;
    ["display_name", "credentials", "specialty", "institution", "city", "state", "country", "languages", "linkedin", "bio"].forEach(function (k) {
      profileForm.elements[k].value = p[k] || "";
    });
    var chosen = String(p.interests || "").split(/\s*,\s*/);
    $$('input[name="interests"]', profileForm).forEach(function (c) { c.checked = chosen.indexOf(c.value) !== -1; });
    profileForm.elements.show_in_directory.checked = !!p.show_in_directory;
    profileForm.elements.show_email.checked = !!p.show_email;
    profileForm.elements.show_email.disabled = !p.show_in_directory;
  }
  profileForm.elements.show_in_directory.addEventListener("change", function () {
    profileForm.elements.show_email.disabled = !this.checked;
    if (!this.checked) profileForm.elements.show_email.checked = false;
  });
  profileForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = profileForm.elements, btn = $('button[type="submit"]', profileForm);
    var li = f.linkedin.value.trim();
    if (li && !/^https:\/\/([a-z]+\.)?linkedin\.com\//i.test(li)) { msg(profileForm, "Please paste your full LinkedIn link, starting with https://www.linkedin.com/"); return; }
    var profile = {};
    ["display_name", "credentials", "specialty", "institution", "city", "state", "country", "languages", "linkedin", "bio"].forEach(function (k) { profile[k] = f[k].value.trim(); });
    profile.interests = $$('input[name="interests"]:checked', profileForm).map(function (c) { return c.value; });
    profile.show_in_directory = f.show_in_directory.checked ? "Yes" : "No";
    profile.show_email = f.show_email.checked ? "Yes" : "No";
    busy(btn, true, "Saving…");
    api({ action: "portal_update_profile", token: (session() || {}).token, profile: profile }).then(function (r) {
      busy(btn, false);
      if (!r.ok) { msg(profileForm, r.error); if (r.code === "signed_out") setTimeout(load, 1200); return; }
      state.data.profile = r.profile;
      render();
      msg(profileForm, "Saved. " + (r.profile.show_in_directory ? "You’ll appear in the directory within a few minutes." : "You’re not listed in the directory."), true);
      track("portal_profile_saved");
    });
  });

  $('[data-filter="resources"]').addEventListener("input", renderResources);
  $('[data-filter="directory"]').addEventListener("input", renderDirectory);

  /* ---------- calendar file ---------- */
  function downloadIcs(ev) {
    var d = ev.date.replace(/-/g, "");
    var next = new Date(ev.date + "T12:00:00"); next.setDate(next.getDate() + 1);
    var d2 = next.toISOString().slice(0, 10).replace(/-/g, "");
    function esc(s) { return String(s || "").replace(/[\\,;]/g, "\\$&").replace(/\n/g, "\\n"); }
    var desc = [ev.start_time ? "Time: " + [ev.start_time, ev.end_time].filter(Boolean).join(" – ") : "", ev.description, safeUrl(ev.link)].filter(Boolean).join("\n");
    var ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//PAMA//Member Portal//EN", "BEGIN:VEVENT",
      "UID:" + d + "-" + Math.random().toString(36).slice(2) + "@pan-american.org",
      "DTSTAMP:" + new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z",
      "DTSTART;VALUE=DATE:" + d, "DTEND;VALUE=DATE:" + d2,
      "SUMMARY:" + esc(ev.title), "LOCATION:" + esc(ev.location), "DESCRIPTION:" + esc(desc),
      "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    var a = h("a", { href: URL.createObjectURL(new Blob([ics], { type: "text/calendar" })), download: "pama-event.ics" });
    document.body.appendChild(a); a.click(); a.remove();
  }

  /* ---------- tabs ---------- */
  function route() {
    if (root.getAttribute("data-state") !== "app") return;
    var tab = (location.hash || "#overview").slice(1);
    if (!$('[data-panel="' + tab + '"]')) tab = "overview";
    $$("[data-panel]").forEach(function (p) { p.hidden = p.getAttribute("data-panel") !== tab; });
    $$("[data-tab]").forEach(function (t) {
      var on = t.getAttribute("data-tab") === tab;
      if (on) t.setAttribute("aria-current", "page"); else t.removeAttribute("aria-current");
    });
    var active = $('[data-tab="' + tab + '"]');
    if (active && active.scrollIntoView) active.scrollIntoView({ block: "nearest", inline: "center" });
  }
  window.addEventListener("hashchange", function () { route(); var t = $(".portal-tabs"); if (t && window.scrollY > t.offsetTop) window.scrollTo(0, t.offsetTop - 10); });

  load();
})();
