// PAMA site script: mobile menu and the campaign pop-up.
(function () {
  // Remember when the visitor first arrived on the site (this browser tab).
  var entered = Date.now();
  try {
    var saved = parseInt(sessionStorage.getItem("pamaEntered"), 10);
    if (saved) entered = saved; else sessionStorage.setItem("pamaEntered", String(entered));
  } catch (e) {}

  // Mobile menu
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  // Click-to-play videos: swap the placeholder for the Google Drive player on click.
  document.querySelectorAll(".video-play").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var f = document.createElement("iframe");
      f.src = btn.getAttribute("data-src");
      f.title = btn.getAttribute("data-title") || "Video";
      f.allow = "autoplay; fullscreen";
      f.setAttribute("allowfullscreen", "");
      btn.replaceWith(f);
      if (window.pamaTrack) window.pamaTrack("video_play", { video_title: f.title, page_path: location.pathname });
    });
  });

  // Close the "More" menu when clicking elsewhere
  document.addEventListener("click", function (e) {
    document.querySelectorAll(".site-nav details[open]").forEach(function (d) {
      if (!d.contains(e.target)) d.removeAttribute("open");
    });
  });

  // End of Year campaign pop-up, on pages that include #pamaPopup.
  // Opens 20 seconds after the visitor first arrives on the site (the clock keeps
  // running if they move to another page), at most once every 12 hours per visitor.
  var popup = document.getElementById("pamaPopup");
  var overlay = document.getElementById("pamaOverlay");
  if (!popup || !overlay) return;

  var COOKIE = "pamaCubaEOY2026";
  var DELAY_MS = 20000;
  var REPEAT_HOURS = 12;
  var lastFocus = null;

  function setCookie(name, value, hours) {
    var expires = "";
    if (hours) {
      var date = new Date();
      date.setTime(date.getTime() + hours * 60 * 60 * 1000);
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
  }

  function getCookie(name) {
    var parts = document.cookie.split(";");
    for (var i = 0; i < parts.length; i++) {
      var c = parts[i].replace(/^\s+/, "");
      if (c.indexOf(name + "=") === 0) return c.substring(name.length + 1);
    }
    return null;
  }

  // PayPal's donate button. The plain PayPal link already in the page
  // stays in place if PayPal's script can't load.
  function loadPayPalButton() {
    var s = document.createElement("script");
    s.src = "https://www.paypalobjects.com/donate/sdk/donate-sdk.js";
    s.charset = "UTF-8";
    s.onload = function () {
      try {
        var box = document.getElementById("paypal-donate-button-container");
        box.innerHTML = "";
        PayPal.Donation.Button({
          env: "production",
          hosted_button_id: "RUC6Z8YEYPXPA",
          image: {
            src: "https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif",
            alt: "Donate with PayPal button",
            title: "Donate with PayPal"
          }
        }).render("#paypal-donate-button-container");
      } catch (err) {}
    };
    document.head.appendChild(s);
  }

  // Floating hearts in the card background
  var heartsStarted = false;
  function startHearts() {
    if (heartsStarted) return;
    heartsStarted = true;
    var box = document.getElementById("pamaHearts");
    if (!box) return;
    var colors = ["var(--pama-accent)", "var(--pama-accent-2)", "var(--pama-primary)"];
    for (var i = 0; i < 12; i++) {
      var h = document.createElement("span");
      h.className = "pama-heart-float";
      h.textContent = "♥";
      h.style.left = Math.random() * 95 + "%";
      h.style.color = colors[i % colors.length];
      h.style.fontSize = 12 + Math.random() * 14 + "px";
      h.style.animationDuration = 5 + Math.random() * 4 + "s";
      h.style.animationDelay = Math.random() * 6 + "s";
      box.appendChild(h);
    }
  }

  var paypalLoaded = false;
  function openPopup() {
    if (!paypalLoaded) { paypalLoaded = true; loadPayPalButton(); }
    lastFocus = document.activeElement;
    popup.classList.remove("pama-hide");
    popup.classList.add("pama-show");
    popup.setAttribute("aria-hidden", "false");
    overlay.classList.add("pama-show");
    startHearts();
    popup.focus({ preventScroll: true });
  }

  function closePopup() {
    if (!popup.classList.contains("pama-show")) return;
    popup.classList.remove("pama-show");
    popup.classList.add("pama-hide");
    popup.setAttribute("aria-hidden", "true");
    overlay.classList.remove("pama-show");
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  // Once the drop-out animation ends, hide the card fully so it can't be tabbed to.
  popup.addEventListener("animationend", function (e) {
    if (e.animationName === "pamaDropOut") popup.classList.remove("pama-hide");
  });

  overlay.addEventListener("click", closePopup);
  popup.querySelector(".pama-close").addEventListener("click", closePopup);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closePopup();
  });

  window.addEventListener("load", function () {
    if (getCookie(COOKIE)) return;
    var wait = Math.max(1000, DELAY_MS - (Date.now() - entered));
    setTimeout(function () {
      if (getCookie(COOKIE)) return;
      openPopup();
      setCookie(COOKIE, "yes", REPEAT_HOURS);
    }, wait);
  });
})();
