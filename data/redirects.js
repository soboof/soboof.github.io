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
  { from: '/about-me/',             to: 'about/' },
  { from: '/creatieve-workshop/',   to: 'workshop/' },
  { from: '/blog/',                 to: 'journal/' },
  { from: '/elementor-page-1790/',  to: 'workshop/', note: 'the "services" page' },

  /* ── Shop plumbing — no cart or checkout on a static site ───────────── */
  { from: '/gallery/cart-page/',        to: 'mirbreak/', note: 'cart is gone; land on the collection' },
  { from: '/checkout/',                 to: 'mirbreak/', note: 'checkout is gone; land on the collection' },
  { from: '/terms-and-conditions/',     to: 'index.html', note: 'NO EQUIVALENT PAGE — see README' },

  /* ── Posts ──────────────────────────────────────────────────────────── */
  { from: '/performance/death-culture/', to: 'printing-lab/' },
  { from: '/philosophizing/geometry-in-eyes-of-spinoza/', to: 'journal/', note: 'post not migrated yet' },
  { from: '/philosophizing/karl-jaspers-and-the-axial-age-the-birth-of-a-new-human-consciousness/', to: 'journal/', note: 'post not migrated yet' },
  { from: '/philosophizing/the-influence-of-the-triangle-in-axial-age-civilizations/', to: 'journal/', note: 'post not migrated yet' },

  /* ── Product category archives ──────────────────────────────────────── */
  { from: '/product-category/abstract/',                to: 'mirbreak/' },
  { from: '/product-category/animals/',                 to: 'mirbreak/' },
  { from: '/product-category/statue/',                  to: 'mirbreak/' },
  { from: '/product-category/statue/christmas-gifts/',  to: 'mirbreak/' },
  { from: '/product-category/furniture/',               to: 'mirbreak/' },
  { from: '/product-category/symmetrical/',             to: 'mirbreak/' },
  { from: '/product-category/uncategorized/',           to: 'mirbreak/' },

  /* ── Product tag archives ───────────────────────────────────────────── */
  { from: '/product-tag/1st-edition/',      to: 'mirbreak/' },
  { from: '/product-tag/2end-edition/',     to: 'mirbreak/' },
  { from: '/product-tag/3rd-edition/',      to: 'mirbreak/' },
  { from: '/product-tag/abstract/',         to: 'mirbreak/' },
  { from: '/product-tag/experimental-art/', to: 'mirbreak/' },
  { from: '/product-tag/functional/',       to: 'mirbreak/' },
  { from: '/product-tag/geometrical/',      to: 'mirbreak/' },
  { from: '/product-tag/home-decor/',       to: 'mirbreak/' },
  { from: '/product-tag/one-of-a-kind/',    to: 'mirbreak/' },
  { from: '/product-tag/original-art/',     to: 'mirbreak/' },

  /* ── Post category archives ─────────────────────────────────────────── */
  { from: '/category/performance/',              to: 'printing-lab/' },
  { from: '/category/geometry/',                 to: 'journal/' },
  { from: '/category/philosophizing/',           to: 'journal/' },
  { from: '/category/philosophizing/mindset/',   to: 'journal/' },
  { from: '/category/philosophizing/mythology/', to: 'journal/' },
  { from: '/category/uncategorized/',            to: 'journal/' },

  /* ── Pages this repo has moved since ────────────────────────────────
     `from` may end in ".html" instead of "/", which writes a single file
     rather than a directory index. Same redirect, same guards.           */
  { from: '/death-culture.html', to: 'printing-lab/', note: 'renamed: the page is now the Printing Lab, Death Culture the project inside it' },

  /* ── Deliberately NOT redirected ─────────────────────────────────────
     /global-styles/  — an Elementor artifact with no public value; let it 404.
     /                — the homepage already answers at the same URL.        */

  /* ── Flat page URLs → folder URLs ───────────────────────────────────────
     These were live on soboof.github.io before the pages moved into their own
     directories, and are still in the wild, so they keep working.        */
  { from: '/mirbreak.html', to: 'mirbreak/' },
  { from: '/gallery.html', to: 'mirbreak/' },
  { from: '/printing-lab.html', to: 'printing-lab/' },
  { from: '/workshop.html', to: 'workshop/' },
  { from: '/journal.html', to: 'journal/' },
  { from: '/about.html', to: 'about/' },

  /* ── The gallery, folded into Mirbreak ──────────────────────────────────
     /gallery/ was the full catalogue on its own page; that catalogue is now
     the Work section of /mirbreak/, filters and all.                     */
  { from: '/gallery/', to: 'mirbreak/' },
];
