/* ==========================================================
   AcademiaX Fee Management
   Shared Sidebar Behaviour
   - Auto-highlights the menu item matching the current page,
     so pages don't need to hardcode class="active" by hand.
   - Safe to include on any page that uses the shared
     .sidebar / .menu-item markup.
========================================================== */

document.addEventListener("DOMContentLoaded", function () {

  var menuItems = document.querySelectorAll(".sidebar .menu-item");

  if (!menuItems.length) return;

  // Current page path + hash, e.g. "/fee-management/index.html#tab-fee-setup"
  var currentPath = window.location.pathname.replace(/\/+$/, "");
  var currentHash = window.location.hash;

  var bestMatch = null;
  var bestScore = -1;

  menuItems.forEach(function (item) {

    var href = item.getAttribute("href");

    if (!href || href === "#") return;

    // Resolve the link relative to this page to get a real path/hash
    var linkUrl;
    try {
      linkUrl = new URL(href, window.location.href);
    } catch (e) {
      return;
    }

    var linkPath = linkUrl.pathname.replace(/\/+$/, "");
    var linkHash = linkUrl.hash;

    var score = -1;

    if (linkPath === currentPath) {
      // Same file. A link with a matching hash is a stronger match
      // than one with no hash (or a different tab).
      if (linkHash && linkHash === currentHash) {
        score = 2;
      } else if (!linkHash && !currentHash) {
        score = 1;
      } else if (!linkHash) {
        score = 0;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = item;
    }

  });

  if (bestMatch) {
    menuItems.forEach(function (item) { item.classList.remove("active"); });
    bestMatch.classList.add("active");
  }

  // Keep the highlight correct if the user switches tabs on the
  // same page (e.g. the All-in-One Fee Manager's hash-based tabs).
  window.addEventListener("hashchange", function () {
    var newHash = window.location.hash;
    var match = null;
    menuItems.forEach(function (item) {
      var href = item.getAttribute("href") || "";
      if (href.indexOf("#") !== -1) {
        var hashPart = "#" + href.split("#")[1];
        if (hashPart === newHash) match = item;
      }
    });
    if (match) {
      menuItems.forEach(function (item) { item.classList.remove("active"); });
      match.classList.add("active");
    }
  });

});