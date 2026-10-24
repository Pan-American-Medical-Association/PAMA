// PAMA site motion: content and photos ease into view as visitors scroll, and
// headline numbers count up. Skipped entirely for visitors who prefer reduced motion.
(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) return;
  document.documentElement.classList.add("motion");

  function start() {
    var vh = window.innerHeight;
    var blocks = "main section h2, main .path, main .way, main .steps > li, main .stats > li, main .post, " +
      "main .partner-grid > li, main .tiers > *, main .testimonial, main .event-card, main .org-card, " +
      "main .pull-quote, main .infographic, main .chart, main .mission li, main figure, main .serve li, main .trust-list li";
    var photos = "main .split img, main .gallery img, main .photo-grid img, main .p4c-gallery img, main .band img, " +
      "main .figure-pair img, main .article-figure img, main .head-photo img";
    var seen = new Set();

    function mark(el, cls) {
      if (seen.has(el) || el.closest(".pama-popup")) return;
      seen.add(el);
      if (el.getBoundingClientRect().top < vh * 0.92) return; // already on screen: leave it alone
      el.classList.add(cls);
      var sibs = Array.prototype.filter.call(el.parentNode.children, function (c) { return seen.has(c); });
      var i = sibs.indexOf(el);
      if (i > 0) el.style.transitionDelay = Math.min(i, 4) * 60 + "ms";
      io.observe(el);
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        el.classList.add("in");
        io.unobserve(el);
        setTimeout(function () { el.style.transitionDelay = ""; el.classList.add("done"); }, 1000);
      });
    }, { rootMargin: "0px 0px -8% 0px" });

    var side = 0;
    document.querySelectorAll(photos).forEach(function (img) {
      mark(img, side++ % 2 ? "slide-r" : "slide-l");
    });
    document.querySelectorAll(blocks).forEach(function (el) {
      if (!el.querySelector(".slide-l, .slide-r")) mark(el, "reveal");
    });

    // Count up headline numbers such as "$3.94M" or "43,377".
    var counters = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        counters.unobserve(e.target);
        var el = e.target, text = el.textContent;
        var m = text.match(/^(\D*)([\d,]*\.?\d+)(\D*)$/);
        if (!m) return;
        var target = parseFloat(m[2].replace(/,/g, "")), decimals = (m[2].split(".")[1] || "").length;
        var comma = m[2].indexOf(",") > -1, t0 = null, dur = 1400;
        el.setAttribute("aria-label", text);
        function fmt(v) {
          var s = v.toFixed(decimals);
          if (comma) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
          return m[1] + s + m[3];
        }
        function step(ts) {
          if (!t0) t0 = ts;
          var p = Math.min(1, (ts - t0) / dur), ease = 1 - Math.pow(1 - p, 3);
          el.textContent = fmt(target * ease);
          if (p < 1) requestAnimationFrame(step); else el.textContent = text;
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    document.querySelectorAll("main .stats strong").forEach(function (el) {
      if (/^\D*[\d,]*\.?\d+\D*$/.test(el.textContent.trim()) && !/\d\/\d/.test(el.textContent)) counters.observe(el);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
