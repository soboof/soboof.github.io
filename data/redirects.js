/* ═══════════════════════════════════════════════════════════════════════════
   WORDPRESS → STATIC URL MAP

   Every URL soboof.com serves today, and where it should land once the domain
   points at this repo. `node build.js` turns each entry into a real directory
   with an index.html that redirects — GitHub Pages cannot issue 301s, so these
   use a canonical tag plus an instant meta refresh, which search engines treat
   as a permanent move.

   The same list also writes `_redirects`, which is ignored by GitHub Pages but
   gives real 301s automatically if the site is ever moved to Cloudflare Pages
   or Netlify.

   Captured from the live WordPress install on 25 July 2026:
   10 pages · 4 posts · 11 products · 7 product categories · 11 product tags ·
   6 post categories.

   `from` must start and end with a slash. `to` must be a file that exists in
   this repo — the build checks both.
   ═══════════════════════════════════════════════════════════════════════════ */

module.exports = [

  /* ── Products → artwork pages ───────────────────────────────────────────
     WordPress nests these under their category path; here every piece lives at
     /work/<slug>/, so both shapes collapse onto one target.                 */
  { from: '/gallery/statue/christmas-gifts/adam/',                     to: 'work/adam/' },
  { from: '/gallery/statue/christmas-gifts/bird-of-dawn/',             to: 'work/bird-of-dawn/' },
  { from: '/gallery/statue/christmas-gifts/simorgh-phoenix/',          to: 'work/simorgh-phoenix/' },
  { from: '/gallery/statue/christmas-gifts/space-fox/',                to: 'work/space-fox/' },
  { from: '/gallery/statue/christmas-gifts/the-owl-statue/',           to: 'work/the-owl-statue/' },
  { from: '/gallery/statue/christmas-gifts/geometrical-mouse-home-decor/', to: 'work/geometrical-mouse/' },
  { from: '/gallery/statue/christmas-gifts/lamp/',                     to: 'work/abstract-table-lamp/', note: 'slug renamed: lamp → abstract-table-lamp' },
  { from: '/gallery/animals/dear-mr-fox/',                             to: 'work/dear-mr-fox/' },
  { from: '/gallery/animals/geometrical-cat-statue/',                  to: 'work/geometrical-cat/', note: 'slug renamed: geometrical-cat-statue → geometrical-cat' },
  { from: '/gallery/abstract/abstract-space-fox-ii/',                  to: 'work/abstract-space-fox-ii/' },
  { from: '/gallery/abstract/abstract-space-vogel/',                   to: 'work/abstract-space-vogel/' },

  /* ── Flat artwork URLs → /work/<slug>/ ──────────────────────────────────
     The shape this repo published before the pieces moved into /work/. These
     URLs were live on soboof.github.io and are linked from elsewhere, so they
     keep answering rather than 404ing. The stubs overwrite the old page files. */
  { from: '/adam.html',                     to: 'work/adam/' },
  { from: '/bird-of-dawn.html',             to: 'work/bird-of-dawn/' },
  { from: '/simorgh-phoenix.html',          to: 'work/simorgh-phoenix/' },
  { from: '/space-fox.html',                to: 'work/space-fox/' },
  { from: '/the-owl-statue.html',           to: 'work/the-owl-statue/' },
  { from: '/geometrical-mouse.html',        to: 'work/geometrical-mouse/' },
  { from: '/abstract-table-lamp.html',      to: 'work/abstract-table-lamp/' },
  { from: '/dear-mr-fox.html',              to: 'work/dear-mr-fox/' },
  { from: '/geometrical-cat.html',          to: 'work/geometrical-cat/' },
  { from: '/abstract-space-fox-ii.html',    to: 'work/abstract-space-fox-ii/' },
  { from: '/abstract-space-vogel.html',     to: 'work/abstract-space-vogel/' },

  /* ── Pages ──────────────────────────────────────────────────────────── */
  { from: '/gallery/',              to: 'gallery.html',  note: 'also the WooCommerce shop page' },
  { from: '/about-me/',             to: 'about.html' },
  { from: '/creatieve-workshop/',   to: 'workshop.html' },
  { from: '/blog/',                 to: 'journal.html' },
  { from: '/elementor-page-1790/',  to: 'workshop.html', note: 'the "services" page' },

  /* ── Shop plumbing — no cart or checkout on a static site ───────────── */
  { from: '/gallery/cart-page/',        to: 'gallery.html', note: 'cart is gone; land on the collection' },
  { from: '/checkout/',                 to: 'gallery.html', note: 'checkout is gone; land on the collection' },
  { from: '/terms-and-conditions/',     to: 'index.html',   note: 'NO EQUIVALENT PAGE — see README' },

  /* ── Posts ──────────────────────────────────────────────────────────── */
  { from: '/performance/death-culture/', to: 'printing-lab.html' },
  { from: '/philosophizing/geometry-in-eyes-of-spinoza/', to: 'journal.html', note: 'post not migrated yet' },
  { from: '/philosophizing/karl-jaspers-and-the-axial-age-the-birth-of-a-new-human-consciousness/', to: 'journal.html', note: 'post not migrated yet' },
  { from: '/philosophizing/the-influence-of-the-triangle-in-axial-age-civilizations/', to: 'journal.html', note: 'post not migrated yet' },

  /* ── Product category archives ──────────────────────────────────────── */
  { from: '/product-category/abstract/',                to: 'gallery.html' },
  { from: '/product-category/animals/',                 to: 'gallery.html' },
  { from: '/product-category/statue/',                  to: 'gallery.html' },
  { from: '/product-category/statue/christmas-gifts/',  to: 'gallery.html' },
  { from: '/product-category/furniture/',               to: 'gallery.html' },
  { from: '/product-category/symmetrical/',             to: 'gallery.html' },
  { from: '/product-category/uncategorized/',           to: 'gallery.html' },

  /* ── Product tag archives ───────────────────────────────────────────── */
  { from: '/product-tag/1st-edition/',      to: 'gallery.html' },
  { from: '/product-tag/2end-edition/',     to: 'gallery.html' },
  { from: '/product-tag/3rd-edition/',      to: 'gallery.html' },
  { from: '/product-tag/abstract/',         to: 'gallery.html' },
  { from: '/product-tag/experimental-art/', to: 'gallery.html' },
  { from: '/product-tag/functional/',       to: 'gallery.html' },
  { from: '/product-tag/geometrical/',      to: 'gallery.html' },
  { from: '/product-tag/home-decor/',       to: 'gallery.html' },
  { from: '/product-tag/one-of-a-kind/',    to: 'gallery.html' },
  { from: '/product-tag/original-art/',     to: 'gallery.html' },

  /* ── Post category archives ─────────────────────────────────────────── */
  { from: '/category/performance/',              to: 'printing-lab.html' },
  { from: '/category/geometry/',                 to: 'journal.html' },
  { from: '/category/philosophizing/',           to: 'journal.html' },
  { from: '/category/philosophizing/mindset/',   to: 'journal.html' },
  { from: '/category/philosophizing/mythology/', to: 'journal.html' },
  { from: '/category/uncategorized/',            to: 'journal.html' },

  /* ── Pages this repo has moved since ────────────────────────────────
     `from` may end in ".html" instead of "/", which writes a single file
     rather than a directory index. Same redirect, same guards.           */
  { from: '/death-culture.html', to: 'printing-lab.html', note: 'renamed: the page is now the Printing Lab, Death Culture the project inside it' },

  /* ── Deliberately NOT redirected ─────────────────────────────────────
     /global-styles/  — an Elementor artifact with no public value; let it 404.
     /                — the homepage already answers at the same URL.        */
];
