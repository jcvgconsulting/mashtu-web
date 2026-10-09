// Keep the footer copyright year current without a server or build step.
(function () {
  var el = document.getElementById("year");
  if (el) {
    el.textContent = String(new Date().getFullYear());
  }
})();
