// PAMA site analytics: records clicks on donation, membership and ticket links.
// Page views are recorded by the Google tag in each page's <head>.
(function () {
  function track(name, params) {
    if (typeof window.gtag === "function") window.gtag("event", name, params || {});
  }
  window.pamaTrack = track;

  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a) return;
    var href = a.getAttribute("href") || "";
    var label = (a.textContent || "").replace(/\s+/g, " ").trim().slice(0, 80);
    var base = { link_url: a.href, link_text: label, page_path: location.pathname };

    if (/billing\/plans\/subscribe/.test(href)) {
      track("membership_click", Object.assign({ billing: "monthly" }, base));
    } else if (/paypal\.com\/ncp\/payment/.test(href) && /member/.test(location.pathname)) {
      track("membership_click", Object.assign({ billing: "annual" }, base));
    } else if (/paypal\.com|paypal\.me/.test(href)) {
      track("donate_click", base);
    } else if (/buytickets\.at|tickettailor\.com/.test(href)) {
      track("ticket_click", base);
    } else if (/^mailto:/i.test(href)) {
      track("email_click", base);
    }
  }, true);
})();
