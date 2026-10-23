// PAMA site script: mobile menu and the campaign pop-up.
(function () {
  // Mobile menu
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  // Close the "More" menu when clicking elsewhere
  document.addEventListener("click", function (e) {
    document.querySelectorAll(".site-nav details[open]").forEach(function (d) {
      if (!d.contains(e.target)) d.removeAttribute("open");
    });
  });

  // Campaign pop-up: shows once per browser session on pages that include it.
  var modal = document.getElementById("campaign");
  if (!modal) return;
  var KEY = "pama-campaign-seen";
  var seen = false;
  try { seen = sessionStorage.getItem(KEY) === "1"; } catch (err) {}

  function close() {
    modal.classList.remove("open");
    try { sessionStorage.setItem(KEY, "1"); } catch (err) {}
  }

  if (!seen) {
    setTimeout(function () { modal.classList.add("open"); }, 1200);
  }
  modal.addEventListener("click", function (e) {
    if (e.target === modal || e.target.closest(".modal-close")) close();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") close();
  });
})();
