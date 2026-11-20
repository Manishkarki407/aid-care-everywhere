/* ==========================================================================
   AID-CARE-EVERYWHERE — Site script
   Used by: index.html (carousel) and current-crises.html (search + crisis sections)
   Each part only runs if its section exists on the page.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {
  setupCarousel();
  setupCrisesPage();
});


/* --------------------------------------------------------------------------
   1. FEATURED CRISES CAROUSEL (home page)
   - Arrow buttons and dots switch posters.
   - The neighbouring posters peek out on both sides.
   - The blurred background fades to match the active poster.
   - No autoplay: it only moves when the visitor asks it to.
   -------------------------------------------------------------------------- */
function setupCarousel() {
  var carousel = document.querySelector("[data-carousel]");
  if (!carousel) return;

  var posters  = Array.prototype.slice.call(carousel.querySelectorAll(".poster"));
  var bgLayers = Array.prototype.slice.call(document.querySelectorAll(".carousel-bg .bg-layer"));
  var prevBtn  = carousel.querySelector("[data-dir='prev']");
  var nextBtn  = carousel.querySelector("[data-dir='next']");
  var dotsBox  = document.querySelector(".carousel-dots");
  var counter  = document.querySelector(".carousel-counter");
  var total    = posters.length;
  var current  = 0;

  if (total === 0) return;

  // Build one dot button per poster
  var dots = posters.map(function (poster, i) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "dot-btn";
    btn.setAttribute("aria-label", "Show featured crisis " + (i + 1));
    btn.appendChild(document.createElement("span"));
    btn.addEventListener("click", function () { goTo(i); });
    dotsBox.appendChild(btn);
    return btn;
  });

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  function goTo(index) {
    current = (index + total) % total;   // wrap around at both ends

    posters.forEach(function (poster, i) {
      // How far is this poster from the active one? (-2 … 2)
      var offset = i - current;
      if (offset > total / 2)  offset -= total;
      if (offset < -total / 2) offset += total;

      poster.classList.remove("is-active", "is-prev", "is-next", "is-hidden-left");
      if (offset === 0)        poster.classList.add("is-active");
      else if (offset === -1)  poster.classList.add("is-prev");
      else if (offset === 1)   poster.classList.add("is-next");
      else if (offset < 0)     poster.classList.add("is-hidden-left");

      // Only the active poster can be read or tabbed into
      var isActive = offset === 0;
      poster.setAttribute("aria-hidden", isActive ? "false" : "true");
      if (isActive) poster.removeAttribute("inert");
      else poster.setAttribute("inert", "");
    });

    bgLayers.forEach(function (layer, i) {
      layer.classList.toggle("is-active", i === current);
    });

    dots.forEach(function (dot, i) {
      dot.setAttribute("aria-current", i === current ? "true" : "false");
    });

    if (counter) counter.textContent = pad(current + 1) + " / " + pad(total);
  }

  prevBtn.addEventListener("click", function () { goTo(current - 1); });
  nextBtn.addEventListener("click", function () { goTo(current + 1); });

  // Left / right arrow keys work while focus is inside the carousel
  carousel.addEventListener("keydown", function (event) {
    if (event.key === "ArrowLeft")  { event.preventDefault(); goTo(current - 1); }
    if (event.key === "ArrowRight") { event.preventDefault(); goTo(current + 1); }
  });

  carousel.classList.add("is-ready");
  goTo(0);
}


/* --------------------------------------------------------------------------
   2. CURRENT CRISES PAGE: search bar + crisis sections
   - The page has a list view and one <article class="crisis-detail"> per
     crisis (for now only #crisis-1, "Placeholder 1").
   - The URL hash decides what is shown:
       current-crises.html            -> the list
       current-crises.html#crisis-1   -> the Placeholder 1 section
     so the browser Back button, links and bookmarks all work.
   - Pressing Search opens the crisis whose data-keywords match the text.
     While no card has keywords yet, every search opens Placeholder 1.
     Once keywords are filled in, a search with no match shows a message.
   -------------------------------------------------------------------------- */
function setupCrisesPage() {
  var listView = document.getElementById("crisis-list-view");
  if (!listView) return;

  var details = Array.prototype.slice.call(document.querySelectorAll(".crisis-detail"));
  var form    = document.querySelector("[data-crisis-search]");
  var input   = form ? form.querySelector("input[type='search']") : null;
  var hint    = document.getElementById("search-hint");
  var defaultHint = hint ? hint.textContent : "";

  // Show the list or one crisis section, depending on the URL hash
  function route() {
    var id = decodeURIComponent(window.location.hash.slice(1));
    var target = id ? document.getElementById(id) : null;
    var detail = target ? target.closest(".crisis-detail") : null;

    listView.hidden = !!detail;
    details.forEach(function (d) { d.hidden = d !== detail; });

    if (detail && target === detail) {
      // Opened a crisis: start at the top and move keyboard focus to its name
      window.scrollTo(0, 0);
      var heading = detail.querySelector("h1");
      if (heading) heading.focus({ preventScroll: true });
    } else if (target) {
      target.scrollIntoView();
    }
  }

  function openSection(id) {
    if (window.location.hash === "#" + id) route();
    else window.location.hash = id;     // triggers route() through "hashchange"
  }

  if (form && input) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var query = input.value.trim().toLowerCase();

      if (!query) {
        hint.textContent = "Type a country or region first, then press Search.";
        hint.classList.add("is-error");
        input.focus();
        return;
      }

      // Cards that have their own crisis section
      var cards = Array.prototype.slice.call(document.querySelectorAll(".crisis-card[data-detail]"));
      var match = cards.filter(function (card) {
        var words = (card.getAttribute("data-keywords") || "").toLowerCase();
        return words !== "" && words.indexOf(query) !== -1;
      })[0];

      // Placeholder stage: while no card has keywords yet, open Placeholder 1
      var anyKeywords = cards.some(function (card) {
        return (card.getAttribute("data-keywords") || "").trim() !== "";
      });
      var chosen = match || (anyKeywords ? null : cards[0]);

      if (chosen) {
        openSection(chosen.getAttribute("data-detail"));
      } else {
        hint.textContent = "No crisis page found for \u201c" + input.value.trim() + "\u201d. Try a country or a region, such as East Africa.";
        hint.classList.add("is-error");
      }
    });

    input.addEventListener("input", function () {
      hint.textContent = defaultHint;
      hint.classList.remove("is-error");
    });
  }

  window.addEventListener("hashchange", route);
  route();
}
