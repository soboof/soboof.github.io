/* Mobile menu. Under 980px the whole top bar — sections, the two tools and the
   call to action — folds behind the hamburger; the panel drops out of the
   header and closes again on choose, Escape, an outside click, or a resize
   back to desktop. Lives beside the header partial, so it reaches the artwork
   pages too (they do not load theme.js). */
(function () {
  var btn = document.getElementById('nav-toggle');
  var links = document.getElementById('nav-links');
  if (!btn || !links) return;

  function set(open) {
    links.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    set(!links.classList.contains('open'));
  });
  links.addEventListener('click', function (e) {
    if (e.target.closest('a')) set(false);
  });
  document.addEventListener('click', function (e) {
    if (!links.contains(e.target) && !btn.contains(e.target)) set(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') set(false);
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 980) set(false);
  });
})();
