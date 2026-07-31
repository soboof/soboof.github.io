#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   SOBOOF SITE BUILD

     node build.js

   Source                            Output
     src/pages/<name>.html             /            index.html
       body copy, one file per page    /mirbreak/   /gallery/   /printing-lab/
     src/partials/*.html               /workshop/   /journal/   /about/
       head, header, footer, owl —     work/<slug>/  one page per artwork
       shared by every page            sitemap.xml   every page above
     src/templates/artwork.html        <old-wp-url>/ a redirect for every URL
       the shell all 11 pieces use                   soboof.com serves today
     data/*.js
       artworks, prints, projects,
       pages (SEO), redirects

   Every page is generated. The regions between <!-- BUILD:name --> markers in
   a src/pages file are filled from data/, and the whole thing is then wrapped
   in the shared chrome — so the header, footer and <head> exist once and
   cannot drift between pages.

   Every URL the build emits is root-relative (/assets/…, /gallery/), which is
   what lets a page move between directories without rewriting its links.
   ═══════════════════════════════════════════════════════════════════════════ */

const fs   = require('fs');
const path = require('path');

const ROOT     = __dirname;
const SITE     = 'https://soboof.com';
const EMAIL    = 'mirbreak@soboof.com';
const ARTWORKS  = require('./data/artworks.js');
const PRINTS    = require('./data/prints.js');
const REDIRECTS = require('./data/redirects.js');
const PROJECTS  = require('./data/projects.js');
const PAGES     = require('./data/pages.js');

/* ── helpers ───────────────────────────────────────────────────────────── */

const read  = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const write = (f, s) => {
  const full = path.join(ROOT, f);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, s, 'utf8');
};

/** Escape for use inside an HTML attribute. */
const attr = s => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Photo URLs for a piece: prefix-01.jpg … prefix-0N.jpg */
const photosOf = a => Array.from({ length: a.photos },
  (_, i) => `/assets/img/${a.imgPrefix}-${String(i + 1).padStart(2, '0')}.jpg`);

/* ── where an artwork page lives ───────────────────────────────────────────
   Pieces are served from /work/<slug>/. Every URL the site emits is
   root-relative, so a page can move up or down a directory without a single
   link needing to be rewritten — which is what made moving the pages into
   their own folders a data change rather than a search-and-replace. */
const artworkFile = a => `work/${a.slug}/index.html`;   // file the build writes
const artworkUrl  = a => `work/${a.slug}/`;             // path from the site root
/** The href to use in markup. Root-relative, because a grid of pieces is
 *  rendered into pages at three different depths (/, /mirbreak/, /gallery/)
 *  and a relative "work/…" would resolve differently in each. */
const artworkHref = a => `/${artworkUrl(a)}`;

const isOnSale   = a => Boolean(a.price && a.price.sale);
const dimsLine   = a => `${a.dims.l} × ${a.dims.w} × ${a.dims.h} cm`;
const badgeClass = a => (a.edition === 'ooak' ? ' ooak' : a.edition === 'sale' ? ' sale' : '');
/** Filter keys a piece answers to — archetypes from the data, `sale` derived. */
const filterKeys = a => (a.filters + (isOnSale(a) ? ' sale' : '')).trim();

/* ── the hand-written pages ────────────────────────────────────────────────
   A page is body content in src/pages/ plus a metadata block in data/pages.js,
   wrapped in shared chrome from src/partials/. Before this the chrome was
   pasted into all seven pages and had already drifted apart: three of them
   still called the studio "Mirbreak · Mirrored Sculpture" under the logo, only
   the homepage carried the SuperAdobe link, and the owl mark was duplicated 22
   times for 61 KB. There is now one copy of each.

   Two token shapes, deliberately distinguishable at a glance:
     {{> name key="value" }}   an include, resolved from src/partials/name.html
                               ("key" is substituted as {{key}} inside it)
     {{TOKEN}}                 a page value from data/pages.js
   Include arguments are lower-case and page tokens UPPER-CASE, so a partial
   can carry page tokens through untouched. */

/** Resolve includes depth-first, so a partial may include another. */
function include(html, depth = 0) {
  if (depth > 8) throw new Error('src/partials: include loop');
  return html.replace(/\{\{>\s*([\w-]+)([^}]*)\}\}/g, (_, name, argstr) => {
    const args = {};
    for (const m of argstr.matchAll(/([\w-]+)="([^"]*)"/g)) args[m[1]] = m[2];
    const body = read(`src/partials/${name}.html`).trimEnd()
      /* Fill this include's own arguments; leave everything else for the page
         pass, so {{TITLE}} inside a partial still reaches data/pages.js. */
      .replace(/\{\{([a-z][\w-]*)\}\}/g, (whole, k) => (k in args ? args[k] : whole));
    return include(body, depth + 1);
  });
}

/** Wrap one page's body in the chrome and fill its metadata. */
function renderPage(slug, page, body) {
  const nav = ['MIRBREAK', 'PRINTING_LAB', 'WORKSHOP', 'JOURNAL'];
  const tokens = {
    TITLE: page.title, DESC: page.desc, CANONICAL: page.canonical,
    OG_IMAGE: page.ogImage, OG_ALT: page.ogAlt, OG_TYPE: page.ogType, CSS: page.css,
    JSONLD: page.jsonld || '', SYS: page.sys,
    CTA_HREF: page.ctaHref, CTA_TEXT: page.ctaText,
    EXTRA_OG: (page.extraOg || []).map(t => '\n' + t).join(''),
  };
  for (const n of nav) tokens[`CUR_${n}`] = page.current === n ? ' current' : '';

  const html = include(`<!DOCTYPE html>
<html lang="en">
{{> head }}
<body>
${body.trimEnd()}
</body>
</html>
`);
  const left = [];
  const out = html.replace(/\{\{([A-Z][\w]*)\}\}/g, (whole, k) => {
    if (k in tokens) return tokens[k] == null ? '' : tokens[k];
    left.push(k); return whole;
  });
  if (left.length) {
    throw new Error(`src/pages/${page.out}: no value for ${[...new Set(left)].join(', ')} ` +
      `— add it to data/pages.js`);
  }
  return out;
}

/** Replace the text between <!-- BUILD:name --> … <!-- /BUILD:name -->. */
function fill(src, name, body, file) {
  const open  = `<!-- BUILD:${name} -->`;
  const close = `<!-- /BUILD:${name} -->`;
  const i = src.indexOf(open);
  const j = src.indexOf(close);
  if (i < 0 || j < 0) {
    throw new Error(`${file}: missing BUILD markers for "${name}". ` +
      `Expected ${open} … ${close}`);
  }
  return src.slice(0, i + open.length) + '\n' + body + '\n' + src.slice(j);
}

/* ── shared fallback artwork, shown when a photo fails to load ─────────── */

const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 280" fill="none" aria-hidden="true">
    <defs>
      <pattern id="pm" width="22" height="19.05" patternUnits="userSpaceOnUse">
        <polygon points="11,0 22,19.05 0,19.05" fill="none" stroke="#e8c547" stroke-opacity=".12" stroke-width=".5"/>
        <polygon points="0,0 22,0 11,19.05" fill="none" stroke="#e8c547" stroke-opacity=".07" stroke-width=".5"/>
      </pattern>
      <radialGradient id="pg" cx=".5" cy=".45" r=".65">
        <stop offset="0" stop-color="#1c1812"/>
        <stop offset="1" stop-color="#050402"/>
      </radialGradient>
    </defs>
    <rect width="220" height="280" fill="url(#pg)"/>
    <rect width="220" height="280" fill="url(#pm)"/>
    <polygon points="110,18 196,240 24,240" stroke="#e8c547" stroke-opacity=".9" stroke-width="1.3" fill="#e8c547" fill-opacity=".04"/>
    <polygon points="110,18 152,100 110,80" fill="#e8c547" fill-opacity=".14" stroke="#e8c547" stroke-opacity=".7" stroke-width=".9"/>
    <polygon points="110,18 68,100 110,80" fill="#cfd6dc" fill-opacity=".09" stroke="#e8c547" stroke-opacity=".5" stroke-width=".8"/>
    <polygon points="68,100 110,80 110,180" fill="#e8c547" fill-opacity=".06" stroke="#e8c547" stroke-opacity=".45" stroke-width=".7"/>
    <polygon points="152,100 110,80 110,180" fill="#cfd6dc" fill-opacity=".07" stroke="#e8c547" stroke-opacity=".4" stroke-width=".7"/>
    <line x1="110" y1="18" x2="110" y2="240" stroke="#e8c547" stroke-opacity=".2" stroke-width=".5" stroke-dasharray="3 5"/>
    <line x1="24" y1="240" x2="196" y2="240" stroke="#e8c547" stroke-opacity=".3" stroke-width=".6"/>
    <circle cx="110" cy="18" r="4" fill="#e8c547" fill-opacity=".65"/>
    <circle cx="110" cy="110" r="2" fill="#e8c547" fill-opacity=".55"/>
  </svg>`;

const RELATED_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
        <polygon points="60,12 104,96 16,96" stroke="#e8c547" stroke-opacity=".8" stroke-width="1" fill="#e8c547" fill-opacity=".05"/>
        <polygon points="60,12 82,54 60,44" fill="#e8c547" fill-opacity=".18" stroke="#e8c547" stroke-opacity=".6" stroke-width=".8"/>
        <polygon points="60,12 38,54 60,44" fill="#cfd6dc" fill-opacity=".1" stroke="#e8c547" stroke-opacity=".45" stroke-width=".7"/>
        <circle cx="60" cy="12" r="3" fill="#e8c547" fill-opacity=".6"/>
      </svg>`;

/* ── the PRODUCT object each artwork page runs on ──────────────────────── */

function productJs(a, all) {
  const photos = photosOf(a);
  const j = JSON.stringify;

  /* Related pieces: the next three in the catalogue, wrapping around. */
  const here = all.indexOf(a);
  const related = [1, 2, 3].map(n => {
    const r = all[(here + n) % all.length];
    return {
      id:   r.code,
      img:  photosOf(r)[0],
      name: r.name,
      tags: r.categories.join(' · '),
      href: artworkHref(r),
    };
  });

  /* Two short lines, so the badge never wraps mid-phrase. */
  const twoLines = s => s.includes(' · ')
    ? s.replace(' · ', '<br>')
    : s.replace(' ', '<br>');

  const trustThird = a.edition === 'ooak'
    ? 'One of<br>a kind'
    : twoLines(a.editionSpec.split(' · ')[0]);

  const manifestEdition = a.edition === 'ooak'
    ? 'ONE OF<br>A KIND'
    : twoLines(a.editionLabel);

  const specs = [
    { k: 'Dimensions', v: dimsLine(a) },
    { k: 'Weight',     v: `${a.dims.weight} kg` },
    { k: 'Material',   v: 'PLA + Glass mirror' },
    { k: 'Technique',  v: 'Ayeneh-Kari · 3D print' },
    { k: 'Software',   v: 'Rhino + Grasshopper' },
    { k: 'Edition',    v: a.editionSpec, accent: true },
  ];

  return `const PLACEHOLDER_SVG = \`${PLACEHOLDER_SVG}\`;
const RELATED_SVG = \`${RELATED_SVG}\`;

const PRODUCT = {

  /* ── Identity ── */
  id:       ${j(a.code)},
  series:   'MIRBREAK',
  name:     ${j(a.name)},
  subtitle: ${j(a.subtitle)},
  metaDesc: ${j(a.metaDesc)},

  status: 'AVAILABLE',

  edition:      ${j(a.edition)},
  editionLabel: ${j(a.editionLabel)},

  /* ── Breadcrumb ── */
  breadcrumbCategory:     ${j(a.categories[0])},
  breadcrumbCategoryHref: ${j('/gallery/')},

  /* ── Gallery ── */
  modelPath:   ${j('/assets/models/pythagoras.obj')},
  photos:      ${j(photos)},
  gallerySvg:  PLACEHOLDER_SVG,
  thumbSvgs:   [],

  /* ── Product panel ── */
  categories:   ${j(a.categories)},
  availability: ${j(a.availability)},
  description:  ${j(a.description)},
  specs:        ${j(specs)},
  formTags:     ${j(a.formTags)},

  trust: [
    {icon:'◇', label:'Hand-cut<br>mirror tiles'},
    {icon:'△', label:'3D-printed<br>geometric body'},
    {icon:'✦', label:${j(trustThird)}},
  ],

  /* ── CTAs ── */
  inquireEmail:   ${j(EMAIL)},
  inquireSubject: ${j(`Inquiry: ${a.name} (${a.code.replace(/\s/g, '')})`)},
  inquireBody:    ${j(`Hello,\n\nI am interested in the ${a.name} sculpture.\n\n`)},
  viewingSubject: ${j(`Studio viewing: ${a.name}`)},

  /* ── Manifest strip ── */
  manifest: {
    primitive:  ${j(a.manifestPrimitive)},
    technique:  'AYENEH<br>KARI',
    dimensions: ${j(`${a.dims.l} × ${a.dims.w}<br>× ${a.dims.h} CM`)},
    edition:    ${j(manifestEdition)},
  },

  /* ── Related pieces ── */
  related: ${JSON.stringify(related, null, 2).replace(/\n/g, '\n  ')}
    .map(r => Object.assign(r, { svg: RELATED_SVG })),
};`;
}

/* ── structured data ───────────────────────────────────────────────────── */

function jsonLd(a) {
  const url = `${SITE}/${artworkUrl(a)}`;
  const graph = [
    {
      '@type': 'VisualArtwork',
      name: a.name,
      description: a.schemaDesc,
      url,
      image: photosOf(a).slice(0, 3).map(p => `${SITE}${p}`),
      creator: {
        '@type': 'Person',
        name: 'Soby Farahat',
        alternateName: 'Soboof',
        jobTitle: 'Artist and designer',
        url: `${SITE}/about.html`,
        email: EMAIL,
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Leeuwarden',
          addressCountry: 'NL',
        },
        sameAs: [
          'https://www.instagram.com/soboof/',
          'https://www.linkedin.com/in/soboof',
          'https://www.facebook.com/sobooof',
        ],
      },
      artform: 'Sculpture',
      artMedium: 'PLA and glass mirror',
      artworkSurface: 'Hand-cut mirror mosaic (Ayeneh-Kari)',
      material: 'PLA and glass mirror',
      width:  { '@type': 'QuantitativeValue', value: a.dims.l, unitCode: 'CMT' },
      height: { '@type': 'QuantitativeValue', value: a.dims.w, unitCode: 'CMT' },
      depth:  { '@type': 'QuantitativeValue', value: a.dims.h, unitCode: 'CMT' },
      weight: { '@type': 'QuantitativeValue', value: a.dims.weight, unitCode: 'KGM' },
      inLanguage: 'en',
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Soboof',  item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Gallery', item: `${SITE}/gallery.html` },
        { '@type': 'ListItem', position: 3, name: a.name,    item: url },
      ],
    },
  ];

  return '<script type="application/ld+json">\n' +
    JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2) +
    '\n</script>';
}

/* ── page renderers ────────────────────────────────────────────────────── */

function artworkPage(template, a, all) {
  /* An artwork page carries the same header and footer as everything else, so
     it takes them from src/partials/ too — otherwise the nav on these eleven
     pages drifts away from the other six, which is exactly what happened when
     the gallery was retired. No nav item corresponds to a piece, so nothing is
     marked current; the CTA matches the rest of the site. */
  return include(template)
    .replace(/\{\{CUR_\w+\}\}/g, '')
    .replace(/\{\{CTA_HREF\}\}/g, '#contact')
    .replace(/\{\{CTA_TEXT\}\}/g, 'Contact')
    .replace(/\{\{META_TITLE\}\}/g,  attr(a.metaTitle))
    .replace(/\{\{META_DESC\}\}/g,   attr(a.metaDesc))
    .replace(/\{\{CANONICAL\}\}/g,   `${SITE}/${artworkUrl(a)}`)
    .replace(/\{\{OG_IMAGE\}\}/g,    `${SITE}${photosOf(a)[0]}`)
    .replace(/\{\{OG_IMAGE_ALT\}\}/g, attr(`${a.name} — mirrored sculpture by Soboof`))
    .replace(/\{\{JSONLD\}\}/g,      () => jsonLd(a))
    .replace(/\{\{H1\}\}/g,          attr(a.name))
    .replace(/\{\{SUBTITLE\}\}/g,    attr(a.subtitle))
    .replace(/\{\{PRODUCT_JS\}\}/g,  () => productJs(a, all));
}

function galleryChips(all) {
  const groups = [
    ['all',         'All'],
    ['abstract',    'Abstract'],
    ['animals',     'Animals'],
    ['statue',      'Statue'],
    ['symmetrical', 'Symmetrical'],
    ['furniture',   'Furniture'],
    ['sale',        'On sale'],
  ];
  return groups.map(([key, label]) => {
    const n = key === 'all'
      ? all.length
      : all.filter(a => filterKeys(a).split(' ').includes(key)).length;
    const cls = key === 'all' ? 'chip active' : 'chip';
    return `    <button class="${cls}" data-filter="${key}">${label} <span class="n">${n}</span></button>`;
  }).join('\n');
}

function galleryGrid(all) {
  return all.map((a, i) => {
    const feature = a.featured === 'big' ? ' feature' : '';
    const photo   = photosOf(a)[0];
    return `    <!-- ${i + 1}. ${a.name} -->
    <a href="${artworkHref(a)}" class="piece${feature}" data-cats="${attr(filterKeys(a))}">
      <div class="piece-img">
        <span class="piece-id">${attr(a.code)}</span>
        <span class="piece-badge${badgeClass(a)}">${attr(a.galleryBadge)}</span>
        <img src="${photo}" alt="${attr(a.name)}" loading="lazy">
      </div>
      <div class="piece-body">
        <div class="piece-tags">${attr(a.categories.join(' · '))}</div>
        <div class="piece-name">${attr(a.name)}</div>
        <div class="piece-desc">${attr(a.cardDesc)}</div>
        <div class="piece-row">
          <span class="piece-edition">${attr(a.editionSpec)} · ${attr(dimsLine(a))}</span>
          <span class="piece-arrow">→</span>
        </div>
      </div>
    </a>`;
  }).join('\n\n');
}

/* ── the work grid ────────────────────────────────────────────────────────
   The whole catalogue, in one mosaic. This used to be the featured pieces
   only, with the rest living on a separate gallery page; that page is now
   folded in here, so `featured` no longer decides *whether* a piece appears —
   only how big its tile is.

   Every piece is written into the HTML, so a crawler and a reader with no
   JavaScript both see the full catalogue. The batching is a display layer the
   page's script puts on top: it hides everything past the first batch and
   reveals six more each time the sentinel scrolls into view. `data-cats`
   carries the filter keys so the chips can work on the same tiles. */
function homeGrid(all) {
  return all.map(a => {
    const big   = a.featured === 'big';
    const photo = photosOf(a)[0];
    return `    <!-- ${a.name} -->
    <a href="${artworkHref(a)}" class="prod ${big ? 'big' : 'std'}" data-cats="${attr(filterKeys(a))}">
      <div class="prod-img">
        <span class="prod-id">${attr(a.code)}</span>
        <span class="prod-edition">${attr(a.editionLabel)}</span>
        <img src="${photo}" alt="${attr(a.name)} sculpture" loading="lazy">
      </div>
      <div class="prod-tags">${attr(a.categories.join(' · '))}</div>
      <div class="prod-name">${attr(a.name)}</div>
      <div class="prod-row">
        <span class="prod-arrow">${big ? 'View piece →' : '→'}</span>
      </div>
    </a>`;
  }).join('\n\n');
}

function sitemap(all) {
  /* Priorities by slug; the URLs themselves come from data/pages.js, so a page
     that moves cannot leave a stale entry behind here. */
  const priority = { index: '1.0', mirbreak: '0.9',
                     'printing-lab': '0.8', workshop: '0.8',
                     about: '0.7', journal: '0.7' };
  const pages = [
    ...Object.entries(PAGES).map(([slug, p]) =>
      [p.url.replace(/^\//, ''), priority[slug] || '0.7']),
    ...all.map(a => [artworkUrl(a), '0.6']),
  ];
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    pages.map(([p, pr]) =>
      `  <url>\n    <loc>${SITE}/${p}</loc>\n    <priority>${pr}</priority>\n  </url>`
    ).join('\n') +
    '\n</urlset>\n';
}

/* ── Death Culture ─────────────────────────────────────────────────────── */

/** Photo path for sheet `i` (0-based) of a print set. */
const printPath = (set, i) =>
  `/assets/img/death-culture/${set.prefix}-${String(i + 1).padStart(2, '0')}.jpg`;

const allPrints = p => p.sets.reduce((n, s) => n + s.prints.length, 0);

/** Spell a number out, so headings read "Twenty-five pulls" not "25 pulls". */
function numberWord(n) {
  const ones = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight',
    'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
    'seventeen', 'eighteen', 'nineteen'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  if (n < 0 || n > 999 || !Number.isInteger(n)) return String(n);
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? '-' + ones[n % 10] : '');
  const rest = n % 100;
  return ones[Math.floor(n / 100)] + ' hundred' + (rest ? ' and ' + numberWord(rest) : '');
}

const capitalise = s => s.charAt(0).toUpperCase() + s.slice(1);

function counterRows(p) {
  const rows = p.sets.map(s =>
    [s.name, String(s.prints.length).padStart(2, '0')]);
  for (const f of p.facts) rows.push([f.label, f.value]);
  return rows.map(([cat, cnt]) =>
    `      <div class="counter-row"><span class="cat">${attr(cat)}</span><span class="cnt">${attr(cnt)}</span></div>`
  ).join('\n');
}

function printSets(p) {
  if (p.pull && !p.sets.some(s => s.name === p.pull.after)) {
    throw new Error(`prints.js: pull.after '${p.pull.after}' matches no set name`);
  }
  const blocks = p.sets.map(set => {
    for (const k of Object.keys(set.orient || {})) {
      if (!(k >= 1 && k <= set.prints.length)) {
        throw new Error(`prints.js: ${set.name} orient key ${k} is out of range`);
      }
    }
    const cards = set.prints.map((cap, i) => {
      const n = String(i + 1).padStart(2, '0');
      const file = printPath(set, i);
      const orient = set.orient && set.orient[i + 1];
      const cls = orient ? ` ${orient}` : '';
      return `        <button class="print${cls}" type="button" data-full="${file}" data-cap="${attr(cap)}">\n` +
             `          <div class="print-img">\n` +
             `            <span class="print-n">${n}</span>\n` +
             `            <img src="${file}" alt="${attr(cap)}" loading="lazy">\n` +
             `          </div>\n` +
             `          <div class="print-cap">${cap}</div>\n` +
             `        </button>`;
    }).join('\n');

    let block = `  <div class="dc-set">\n` +
           `    <div class="dc-set-head">\n` +
           `      <span class="dc-set-name">${attr(set.name)}</span>\n` +
           `      <span class="dc-set-meta">${String(set.prints.length).padStart(2, '0')} sheets · ${set.meta}</span>\n` +
           `    </div>\n` +
           `    <div class="print-grid">\n${cards}\n    </div>\n` +
           `  </div>`;

    if (p.pull && p.pull.after === set.name) {
      block += `\n\n  <div class="dc-pull dc-pull-sets">${p.pull.text}</div>`;
    }
    return block;
  }).join('\n\n');
  return blocks;
}

function deathCulturePage(template, p) {
  const total = allPrints(p);
  return template
    .replace(/\{\{PRINT_COUNT\}\}/g,      String(total))
    .replace(/\{\{PRINT_COUNT_WORD\}\}/g, capitalise(numberWord(total)))
    .replace(/\{\{SET_COUNT_WORD\}\}/g,   numberWord(p.sets.length))
    .replace(/\{\{COUNTER_ROWS\}\}/g,     () => counterRows(p))
    .replace(/\{\{PRINT_SETS\}\}/g,       () => printSets(p));
}

/* ── Pythagoras Engine: geometry → static SVG wireframe ────────────────────
   The PE examples are drawn from the real model files in /assets/models/ and
   baked into the page at build time. No WebGL, no runtime cost, and the stroke
   inherits `currentColor` so the drawing follows the theme. ─────────────── */

function parseOBJ(txt) {
  const verts = [], faces = [];
  for (const line of txt.split('\n')) {
    const p = line.trim().split(/\s+/);
    if (p[0] === 'v') verts.push([+p[1], +p[2], +p[3]]);
    else if (p[0] === 'f') faces.push(p.slice(1).map(t => parseInt(t.split('/')[0], 10) - 1));
  }
  return { verts, faces };
}

function parseGLTF(json) {
  const g = JSON.parse(json);
  const bufs = g.buffers.map(b => Buffer.from(b.uri.split(',')[1], 'base64'));
  const readAcc = (i) => {
    const a = g.accessors[i], bv = g.bufferViews[a.bufferView];
    const buf = bufs[bv.buffer];
    const off = (bv.byteOffset || 0) + (a.byteOffset || 0);
    const n = a.type === 'VEC3' ? 3 : 1;
    const out = [];
    for (let k = 0; k < a.count; k++) {
      const row = [];
      for (let c = 0; c < n; c++) {
        const at = off + (k * n + c) * 4;
        row.push(a.componentType === 5126 ? buf.readFloatLE(at) : buf.readUInt32LE(at));
      }
      out.push(n === 1 ? row[0] : row);
    }
    return out;
  };
  const prim = g.meshes[0].primitives[0];
  const verts = readAcc(prim.attributes.POSITION);
  const idx = prim.indices != null ? readAcc(prim.indices) : verts.map((_, i) => i);
  const faces = [];
  for (let i = 0; i < idx.length; i += 3) faces.push([idx[i], idx[i + 1], idx[i + 2]]);
  return { verts, faces };
}

function loadGeometry(file) {
  const txt = read(`assets/models/${file}`);
  return file.endsWith('.gltf') ? parseGLTF(txt) : parseOBJ(txt);
}

/** Merge vertices sharing a position, so triangle soup becomes a real mesh. */
function weld({ verts, faces }, tol = 1e-4) {
  const map = new Map(), remap = [], out = [];
  const key = v => v.map(n => Math.round(n / tol)).join(',');
  for (const v of verts) {
    const k = key(v);
    if (!map.has(k)) { map.set(k, out.length); out.push(v); }
    remap.push(map.get(k));
  }
  const welded = faces.map(f => f.map(i => remap[i]))
                      .filter(f => new Set(f).size === f.length);
  return { verts: out, faces: welded };
}

function uniqueEdges(faces) {
  const seen = new Set(), out = [];
  for (const f of faces) {
    for (let i = 0; i < f.length; i++) {
      const a = f[i], b = f[(i + 1) % f.length];
      const k = a < b ? `${a},${b}` : `${b},${a}`;
      if (!seen.has(k)) { seen.add(k); out.push([a, b]); }
    }
  }
  return out;
}

/** Orthographic wireframe, far edges faint and thin, near edges bright. */
function wireframeSVG(geo, { size = 300, rotX = -0.42, rotY = 0.62, pad = 14 } = {}) {
  const { verts, faces } = weld(geo);
  const cx = Math.cos(rotX), sx = Math.sin(rotX);
  const cy = Math.cos(rotY), sy = Math.sin(rotY);
  const pts = verts.map(([x, y, z]) => {
    const X = x * cy + z * sy, Z = -x * sy + z * cy;
    const Y = y * cx - Z * sx, D = y * sx + Z * cx;
    return [X, -Y, D];
  });
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const span = Math.max(maxX - minX, maxY - minY) || 1;
  const s = (size - pad * 2) / span;
  const ox = (size - (maxX - minX) * s) / 2 - minX * s;
  const oy = (size - (maxY - minY) * s) / 2 - minY * s;
  const P = pts.map(([x, y, d]) => [x * s + ox, y * s + oy, d]);

  const ds = P.map(p => p[2]);
  const dMin = Math.min(...ds), dMax = Math.max(...ds);
  const depth = d => (dMax - dMin) ? (d - dMin) / (dMax - dMin) : 0.5;

  const BUCKETS = 5;
  const r = n => Math.round(n * 10) / 10;
  const bins = Array.from({ length: BUCKETS }, () => []);
  for (const [a, b] of uniqueEdges(faces)) {
    const t = (depth(P[a][2]) + depth(P[b][2])) / 2;
    bins[Math.min(BUCKETS - 1, Math.floor(t * BUCKETS))]
      .push(`M${r(P[a][0])} ${r(P[a][1])}L${r(P[b][0])} ${r(P[b][1])}`);
  }
  const body = bins.map((d, i) => {
    if (!d.length) return '';
    const t = i / (BUCKETS - 1);
    return `<path d="${d.join('')}" stroke-opacity="${(0.20 + t * 0.70).toFixed(2)}" stroke-width="${(0.6 + t * 0.9).toFixed(2)}"/>`;
  }).join('');

  return { svg: `<svg viewBox="0 0 ${size} ${size}" fill="none" stroke="currentColor" stroke-linecap="round" aria-hidden="true">${body}</svg>`,
           verts: verts.length, faces: faces.length };
}

/* ── SuperAdobe: a course stack laid from the build rule ───────────────────
   Superadobe has no photographs here either, and it does not need any: a
   structure is fully described by its span, the section of the sack it is laid
   from, and how the profile closes.

     dome      pointed, struck the way every conventional superadobe dome is —
               the compass sits on the outer edge of the base sack on the far
               side, so the radius of rotation is rr = 2·rb + sw and the two
               arcs cross on the axis
     vault     the same wall run along a length, closing on the catenary a
               barrel stands in
     cylinder  a straight drum, left open at the top

   The build lays the courses, then draws them. Everything printed under a
   drawing — the course count and the running metres of sack — is measured off
   the stack that got drawn, so a caption cannot drift from its picture. */

const SACK_W = 0.45;   // width of the tube once tamped, m — the generator's default
const SACK_H = 0.13;   // height of one course once tamped, m

/** Where a profile's inner face sits at height `y`. 0 once it has closed. */
function profileAt(type, rb, y, h) {
  if (type === 'cylinder') return y <= h ? rb : 0;
  if (type === 'dome') {
    const rr = 2 * rb + SACK_W;
    return Math.max(Math.sqrt(Math.max(rr * rr - y * y, 0)) - (rb + SACK_W), 0);
  }
  const c = 2;                                   // catenary, taut enough to stand
  const t = Math.cosh(c) - (y / h) * (Math.cosh(c) - 1);
  return t <= 1 ? 0 : (rb / c) * Math.acosh(t);
}

/** How high a profile reaches before it closes on the axis, m. */
function profileHeight(type, rb, given) {
  if (type === 'cylinder') return given;
  if (type === 'dome') {
    const rr = 2 * rb + SACK_W;
    return Math.sqrt(rr * rr - (rb + SACK_W) * (rb + SACK_W));
  }
  return given || 1.25 * rb;
}

/** Lay the courses one sack high until the profile closes, measuring as we go. */
function courseStack(spec) {
  const rb = spec.span / 2;
  const h  = profileHeight(spec.type, rb, spec.height);
  const courses = [];
  let sack = 0;
  for (let y = 0; y < h + SACK_H; y += SACK_H) {
    /* A drum is defined by its height, so it stops on the last whole course;
       a dome and a vault run on until their profile closes on the axis. */
    if (spec.type === 'cylinder' && y + SACK_H > h + 1e-9) break;
    const inner = profileAt(spec.type, rb, y + SACK_H / 2, h);
    if (inner <= 0) break;
    /* A dome and a drum close a ring every course; a vault runs two straight
       walls the length of the barrel. */
    sack += spec.type === 'vault' ? 2 * spec.length
                                  : 2 * Math.PI * (inner + SACK_W / 2);
    courses.push({ y, inner, outer: inner + SACK_W });
  }
  /* A barrel is closed by a keystone course laid across what the two walls
     left open. A dome and a drum are left open at the crown — a skylight is
     what the generator gives you unless you tick "closed top". */
  if (spec.type === 'vault' && courses.length) {
    const top = courses[courses.length - 1];
    courses.push({ y: top.y + SACK_H, inner: 0, outer: top.outer, closing: true });
    sack += spec.length;
  }
  return { courses, height: h, sack };
}

/** The stack drawn: an elevation, or a section where the inside is the point. */
function domeSVG(spec) {
  const st   = courseStack(spec);
  const W    = 300, PAD = 14;
  const half = Math.max(...st.courses.map(c => c.outer));
  const tall = st.courses.length * SACK_H;
  const deep = spec.type === 'vault' ? half * 0.5 : 0;   // room for the run back
  const box  = W - PAD * 2;
  const s    = Math.min(box / (half * 2 + deep), box / (tall + deep * 0.5));
  /* Whichever dimension didn't set the scale has room left over; split it, so
     a squat drum and a tall dome both sit in the middle of their card. */
  const cx   = PAD + (box - (half * 2 + deep) * s) / 2 + half * s;
  const base = W - PAD - (box - (tall + deep * 0.5) * s) / 2;
  const X = x => (cx + x * s).toFixed(1);
  const Y = y => (base - y * s).toFixed(1);

  const bh  = SACK_H * s;
  const gap = Math.min(bh * 0.18, 1.1);
  /* A dome tapers and a vault is cut open, so both read as what they are from
     the silhouette alone. A drum has neither — straight sides, flat top — so
     it gets the shading across the courses that says the wall turns away. */
  const gid  = spec.type === 'cylinder' ? `drum-${String(spec.span).replace('.', '-')}` : '';
  const fill = gid ? `url(#${gid})` : 'currentColor';
  const bar = (x1, x2, y, o) =>
    `<rect x="${X(x1)}" y="${(base - (y + SACK_H) * s + gap / 2).toFixed(1)}" ` +
    `width="${((x2 - x1) * s).toFixed(1)}" height="${(bh - gap).toFixed(1)}" ` +
    `rx="${((bh - gap) / 2).toFixed(1)}" fill="${fill}" fill-opacity="${o}"/>`;

  /* A dome is the thing you stand in front of, so it is drawn as an elevation;
     a vault and a drum are what you stand inside, so they are cut open and the
     wall is drawn on both sides of the space it holds. Courses alternate weight
     the way tamped sacks catch the light, and `dim` fades a whole stack — for
     the end of the barrel standing behind the near one. */
  const cut = spec.type === 'vault';
  const courses = dim => st.courses.map((c, i) => {
    const o = ((i % 2 ? 0.58 : 0.9) * dim).toFixed(2);
    return cut && !c.closing
      ? bar(-c.outer, -c.inner, c.y, o) + bar(c.inner, c.outer, c.y, o)
      : bar(-c.outer, c.outer, c.y, o);
  }).join('');

  const body = [];
  /* The far end of the barrel, seen through the near one — the same stack,
     stepped back, so a vault reads as a run and not as a single arch. */
  if (spec.type === 'vault') {
    body.push(`<g transform="translate(${(deep * s).toFixed(1)},` +
      `${(-deep * s / 2).toFixed(1)})">${courses(0.3)}</g>`);
  }
  body.push(courses(1));

  const defs = gid ? `<defs><linearGradient id="${gid}">` +
    '<stop offset="0" stop-color="currentColor" stop-opacity=".3"/>' +
    '<stop offset=".4" stop-color="currentColor" stop-opacity="1"/>' +
    '<stop offset="1" stop-color="currentColor" stop-opacity=".28"/>' +
    '</linearGradient></defs>' : '';

  return { svg: `<svg viewBox="0 0 ${W} ${W}" fill="none" aria-hidden="true">${defs}${body.join('')}</svg>`,
           courses: st.courses.length, sack: Math.round(st.sack) };
}

/* ── the four projects (landing page intro) ────────────────────────────── */

/** Inline a project's mark. The .svg in /assets/img/ is the master and uses
    fill="currentColor", so the drawing takes the section tint and follows the
    night/day theme — the same rule the owl logo is inlined under. */
function inlineMark(file, cls) {
  return read(`assets/img/${file}`).trim()
    .replace(/^<\?xml[^>]*\?>\s*/, '')
    .replace(/<svg\b/, `<svg class="${cls}" aria-hidden="true"`)
    .replace(/\s*\n\s*/g, ' ');
}

/** The marks in a line under the hero, each linking to the project it stands
    for. Anything in data/projects.js with a `logo` shows up here, so the row
    follows the data rather than being kept in step by hand. Only the two
    software tools have a logotype today; Mirbreak and Death Culture have none
    and are reached from their sections instead. */
function heroMarks(projects) {
  const marked = projects.filter(p => p.logo);
  if (!marked.length) return '';
  const links = marked.map(p =>
    `    <a href="${attr(p.href)}" class="hero-tool" style="--proj:${p.accent}"` +
    `${p.external ? ' target="_blank" rel="noopener"' : ''}>` +
    `${inlineMark(p.logo, 'tool-mark')}<span>${attr(p.name)}</span></a>`).join('\n');
  return `  <div class="hero-tools">
    <span class="hero-tools-k">Tools</span>
${links}
  </div>`;
}

function projectCards(projects, artworks, prints) {
  const counts = { '{{ARTWORKS}}': String(artworks.length),
                   '{{PRINTS}}':   String(allPrints(prints)) };
  const sub = s => s.replace(/\{\{ARTWORKS\}\}|\{\{PRINTS\}\}/g, m => counts[m]);

  return projects.map((p, i) => {
    const ext  = p.external ? ' target="_blank" rel="noopener"' : '';
    const meta = (p.meta || []).map(m => `<span>${attr(m)}</span>`).join('');
    return `    <a href="${attr(p.href)}" class="proj-card"${ext} style="--pa:${p.accent}">
      <div class="proj-k"><span>${attr(p.key)}</span><span class="proj-status">${attr(sub(p.status))}</span></div>
      <div class="proj-n">${String(i + 1).padStart(2, '0')}</div>
      <h3>${attr(p.name)}</h3>
      <div class="proj-role">${attr(p.role)}</div>
      <p>${sub(attr(p.body))}</p>
      <div class="proj-meta">${meta}</div>
      <div class="proj-cta">${attr(p.cta)} &rarr;</div>
    </a>`;
  }).join('\n');
}

/* ── one section per project, each with three examples ─────────────────── */

/** Resolve a project's three examples into {media, title, note, href} cards. */
function exampleCards(p, artworks, prints) {
  return p.examples.map(ex => {
    if (p.source === 'models') {
      const w = wireframeSVG(loadGeometry(ex.file));
      return `        <div class="ex ex-wire">
          <div class="ex-media">${w.svg}</div>
          <div class="ex-body">
            <div class="ex-title">${attr(ex.label)}</div>
            <div class="ex-spec">${w.verts} vertices · ${w.faces} faces</div>
            <p>${attr(ex.note)}</p>
          </div>
        </div>`;
    }
    if (p.source === 'domes') {
      const d = domeSVG(ex);
      const size = ex.type === 'vault' ? `${ex.span} × ${ex.length} m` : `${ex.span} m`;
      return `        <div class="ex ex-earth">
          <div class="ex-media">${d.svg}</div>
          <div class="ex-body">
            <div class="ex-title">${attr(ex.label)}</div>
            <div class="ex-spec">${size} · ${d.courses} courses · ${d.sack} m of sack</div>
            <p>${attr(ex.note)}</p>
          </div>
        </div>`;
    }
    if (p.source === 'artworks') {
      const a = artworks.find(a => a.slug === ex.slug);
      return `        <a href="${artworkHref(a)}" class="ex ex-art">
          <div class="ex-media"><img src="${photosOf(a)[0]}" alt="${attr(a.name)} sculpture" loading="lazy" decoding="async"></div>
          <div class="ex-body">
            <div class="ex-title">${attr(a.name)}</div>
            <div class="ex-spec">${attr(a.editionSpec)} · ${a.dims.l}×${a.dims.w}×${a.dims.h} cm</div>
            <p>${attr(a.subtitle)}</p>
          </div>
        </a>`;
    }
    const caption = printCaption(prints, ex.img);
    return `        <a href="/printing-lab/" class="ex ex-print">
          <div class="ex-media"><img src="/assets/img/death-culture/${ex.img}.jpg" alt="${attr(caption)}" loading="lazy" decoding="async"></div>
          <div class="ex-body">
            <div class="ex-title">${attr(printSetName(prints, ex.img))}</div>
            <div class="ex-spec">Lino relief · A4</div>
            <p>${attr(caption)}</p>
          </div>
        </a>`;
  }).join('\n');
}

/** The caption a print carries in data/prints.js. */
function printCaption(prints, img) {
  const m = img.match(/^(.*)-(\d+)$/);
  const set = prints.sets.find(s => s.prefix === m[1]);
  return set.prints[parseInt(m[2], 10) - 1];
}
function printSetName(prints, img) {
  const m = img.match(/^(.*)-(\d+)$/);
  const set = prints.sets.find(s => s.prefix === m[1]);
  return `${set.name} · ${m[2]}`;
}
function projectSections(projects, artworks, prints) {
  const counts = { '{{ARTWORKS}}': String(artworks.length),
                   '{{PRINTS}}':   String(allPrints(prints)) };
  const sub = s => String(s).replace(/\{\{ARTWORKS\}\}|\{\{PRINTS\}\}/g, m => counts[m]);

  return projects.map((p, i) => {
    const side = i % 2 === 0 ? 'rail-left' : 'rail-right';
    const rel  = p.external ? ' target="_blank" rel="noopener"' : '';
    const meta = p.meta.map(m => `<span>${attr(m)}</span>`).join('');
    /* `key` is "<ABBREVIATION> · <FIELD>": the tick down the rail takes the
       abbreviation, the eyebrow above the heading takes the field — the name
       itself is the heading now, so repeating it above would say it twice. */
    const [abbr, ...rest] = p.key.split(' · ');
    const mark = p.logo ? `      ${inlineMark(p.logo, 'sec-mark')}\n` : '';
    return `<!-- ── PROJECT · ${p.name.toUpperCase()} ── -->
<section id="${attr(p.id)}" class="${side} proj-sec" style="--proj:${p.accent}">
  <div class="model-rail" data-section="${attr(p.id)}">
    <span class="rail-tick top">· · · ${attr(abbr)} ↑</span>
    <span class="rail-tick bot">· · · ${attr(abbr)} ↓</span>
  </div>
  <div class="sec-head">
    <div class="sec-id">
${mark}      <div class="sec-num">${String(i + 1).padStart(2, '0')} · ${attr(rest.join(' · ') || p.name)}</div>
      <h2 class="sec-title">${attr(p.name)}</h2>
      <div class="sec-role">${attr(p.role)}</div>
    </div>
    <div class="sec-sub">${sub(attr(p.body))}</div>
  </div>
  <div class="proj-bar">
    <div class="proj-meta">${meta}</div>
    <span class="proj-status">${attr(sub(p.status))}</span>
  </div>
  <div class="ex-grid">
${exampleCards(p, artworks, prints)}
  </div>
  <a href="${attr(p.href)}" class="btn primary proj-go"${rel}>${attr(p.cta)} &rarr;</a>
</section>`;
  }).join('\n\n');
}

function checkProjects(projects, artworks, prints) {
  const problems = [];
  const ok = new Set(['var(--accent)', 'var(--mirror)', 'var(--earth)',
                      'var(--green)', 'var(--red)']);
  const ids = new Set();
  projects.forEach((p, i) => {
    const at = `project ${i + 1} ("${p.name || '?'}")`;
    if (!p.id) problems.push(`${at}: missing "id" (used as the section anchor)`);
    else if (ids.has(p.id)) problems.push(`${at}: duplicate id "${p.id}"`);
    ids.add(p.id);

    /* Three examples, each resolvable. */
    const ex = p.examples || [];
    if (ex.length !== 3) problems.push(`${at}: needs exactly 3 examples, has ${ex.length}`);
    if (!['models', 'domes', 'artworks', 'prints'].includes(p.source)) {
      problems.push(`${at}: source must be "models", "domes", "artworks" or "prints"`);
    } else ex.forEach((e, n) => {
      const where = `${at} example ${n + 1}`;
      if (p.source === 'models') {
        if (!e.file) problems.push(`${where}: missing "file"`);
        else if (!fs.existsSync(path.join(ROOT, '/assets/models', e.file))) {
          problems.push(`${where}: /assets/models/${e.file} does not exist`);
        }
        if (!e.label) problems.push(`${where}: missing "label"`);
        if (!e.note)  problems.push(`${where}: missing "note"`);
      } else if (p.source === 'domes') {
        /* Anything the course stack needs to lay itself. A span that never
           closes would otherwise draw an empty box. */
        if (!['dome', 'vault', 'cylinder'].includes(e.type)) {
          problems.push(`${where}: type must be "dome", "vault" or "cylinder"`);
        }
        if (!(e.span > 0)) problems.push(`${where}: missing "span" (inner diameter, m)`);
        if (e.type === 'vault'    && !(e.length > 0)) problems.push(`${where}: a vault needs a "length" (m)`);
        if (e.type === 'cylinder' && !(e.height > 0)) problems.push(`${where}: a cylinder needs a "height" (m)`);
        if (!e.label) problems.push(`${where}: missing "label"`);
        if (!e.note)  problems.push(`${where}: missing "note"`);
      } else if (p.source === 'artworks') {
        if (!artworks.some(a => a.slug === e.slug)) {
          problems.push(`${where}: no artwork with slug "${e.slug}"`);
        }
      } else {
        const m = String(e.img || '').match(/^(.*)-(\d+)$/);
        const set = m && prints.sets.find(s => s.prefix === m[1]);
        if (!set) problems.push(`${where}: "${e.img}" is not a print in any set`);
        else if (!set.prints[parseInt(m[2], 10) - 1]) {
          problems.push(`${where}: ${set.name} has no print ${m[2]}`);
        } else if (!fs.existsSync(path.join(ROOT, '/assets/img/death-culture', e.img + '.jpg'))) {
          problems.push(`${where}: /assets/img/death-culture/${e.img}.jpg is missing`);
        }
      }
    });
    for (const f of ['key', 'status', 'name', 'role', 'body', 'href', 'cta', 'accent']) {
      if (!p[f]) problems.push(`${at}: missing "${f}"`);
    }
    /* The eyebrow reads the field out of `key`, the rail tick the abbreviation. */
    if (p.key && !p.key.includes(' · ')) {
      problems.push(`${at}: key "${p.key}" must read "<ABBREVIATION> · <FIELD>"`);
    }
    /* A mark is optional, but a named one has to be on disk. */
    if (p.logo && !fs.existsSync(path.join(ROOT, '/assets/img', p.logo))) {
      problems.push(`${at}: logo /assets/img/${p.logo} does not exist`);
    }
    if (p.accent && !ok.has(p.accent)) {
      problems.push(`${at}: accent "${p.accent}" is not a colour index.html defines ` +
        `(use ${[...ok].join(', ')})`);
    }
    /* An internal href has to be a page that exists. */
    if (p.href && !p.external && !/^https?:|^#|^mailto:/.test(p.href)) {
      const f = p.href.split('#')[0];
      if (!hasPage(f, artworks)) problems.push(`${at}: href "${f}" does not exist`);
    }
    if (p.external && !/^https?:\/\//.test(p.href || '')) {
      problems.push(`${at}: marked external but href is not an absolute URL`);
    }
  });
  return problems;
}

/** Every `href="#foo"` in a finished page must point at an id that page has.
    Section ids move around when the page is restructured; this catches the
    links that got left behind. */
function checkAnchors(html, file) {
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
  const dead = [...new Set([...html.matchAll(/href="#([^"]+)"/g)].map(m => m[1]))]
    .filter(a => a && !ids.has(a));
  return dead.map(a => `${file}: link to "#${a}" but no element has that id`);
}

/* ── redirects (old WordPress URLs) ────────────────────────────────────── */

/** A stand-alone page that sends a visitor and a crawler to `to`. */
/** Where a redirect's file goes: a directory gets an index.html, a moved
 *  page keeps its own name. */
const redirectFile = r => r.from.endsWith('/') ? r.from + 'index.html' : r.from;

function redirectPage(r) {
  const target = `${SITE}/${r.to}`;
  /* How many directories deep the emitted file sits — a file at the root is 0. */
  const segs   = r.from.replace(/^\/|\/$/g, '').split('/').filter(Boolean);
  const depth  = r.from.endsWith('/') ? segs.length : segs.length - 1;
  const rel    = '../'.repeat(depth) + r.to;   // works on any host, any domain
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Moved — Soboof</title>
<link rel="canonical" href="${target}">
<meta http-equiv="refresh" content="0; url=${rel}">
<meta name="theme-color" content="#15140f">
<style>
html,body{margin:0;height:100%;background:#15140f;color:#ebe6dc;
  font-family:'DM Mono',ui-monospace,SFMono-Regular,Menlo,monospace;font-size:14px;line-height:1.7}
main{min-height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:32px;text-align:center}
.tag{font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:#7a7368}
a{color:#e8c547}
</style>
</head>
<body>
<main>
  <div class="tag">Soboof · this page has moved</div>
  <p>Redirecting to <a href="${rel}">${attr(r.to)}</a>…</p>
</main>
<script>location.replace(${JSON.stringify(rel)});</script>
</body>
</html>
`;
}

/** Cloudflare Pages / Netlify style rules — real 301s if ever hosted there. */
function redirectsFile(list) {
  const width = Math.max(...list.map(r => r.from.length));
  return '# Generated by build.js from data/redirects.js — do not edit.\n' +
    '# Ignored by GitHub Pages; honoured by Cloudflare Pages and Netlify.\n' +
    list.map(r => `${r.from.padEnd(width)}  /${r.to}  301`).join('\n') + '\n';
}

function checkRedirects(list, artworks) {
  const problems = [];
  const seen = new Set();

  /* Real pages a redirect must never shadow, compared without a trailing slash.
     Pieces live at /work/<slug>/ and pages at /<name>/ now; the old flat
     /<slug>.html and /<name>.html URLs are no longer pages, which is exactly
     why the map is allowed to redirect them. */
  const own = new Set(['', ...artworks.map(a => `/${artworkUrl(a)}`.replace(/\/$/, '')),
    ...Object.values(PAGES).map(p => p.url.replace(/\/$/, '')), '/404.html']);

  /* Directories the redirect tree legitimately owns — a redirect nested inside
     another (e.g. /gallery/animals/ inside /gallery/) is expected, not a clash. */
  const ours = new Set();
  for (const r of list) {
    if (typeof r.from !== 'string') continue;
    const parts = r.from.split('/').filter(Boolean);
    for (let i = 1; i <= parts.length; i++) ours.add('/' + parts.slice(0, i).join('/') + '/');
  }

  for (const r of list) {
    if (!r.from || !r.from.startsWith('/') || !(r.from.endsWith('/') || r.from.endsWith('.html'))) {
      problems.push(`redirect "${r.from}": must start with "/" and end with "/" or ".html"`);
      continue;
    }
    if (r.from.includes('//') || r.from.includes('..')) {
      problems.push(`redirect "${r.from}": malformed path`);
      continue;
    }
    if (seen.has(r.from)) problems.push(`duplicate redirect from "${r.from}"`);
    seen.add(r.from);

    if (own.has(r.from.replace(/\/$/, ''))) {
      problems.push(`redirect "${r.from}" would shadow a real page`);
      continue;
    }
    if (!r.to || !hasPage(r.to, artworks)) {
      problems.push(`redirect "${r.from}" points at missing file "${r.to}"`);
    }

    /* A moved page writes a single file; only the directory form can clash. */
    if (!r.from.endsWith('/')) continue;

    /* Never write into somewhere that already holds real content. */
    const dir = path.join(ROOT, r.from);
    if (!fs.existsSync(dir)) continue;
    if (!fs.statSync(dir).isDirectory()) {
      problems.push(`redirect "${r.from}" collides with an existing file`);
      continue;
    }
    const foreign = fs.readdirSync(dir)
      .filter(f => f !== 'index.html')
      .filter(f => !ours.has(r.from + f + '/'));
    if (foreign.length) {
      problems.push(`redirect "${r.from}" targets a directory holding other files: ${foreign.join(', ')}`);
    }
  }
  return problems;
}

/** Pages that exist once this build finishes — checks run before anything is
 *  written, so asking the filesystem alone fails on a rename or a clean
 *  checkout. A target counts if the build produces it or it is already there. */
function willExist(artworks) {
  return new Set([
    ...Object.values(PAGES).map(p => p.out),
    '404.html',
    ...artworks.map(artworkFile),
  ]);
}
/** A target may be written as a directory (`work/adam/`), which resolves to the
 *  index.html inside it — the form the redirect map and the grids both use. */
const hasPage = (f, artworks) => {
  const asFile = f.endsWith('/') ? f + 'index.html' : f;
  return willExist(artworks).has(asFile) ||
         fs.existsSync(path.join(ROOT, asFile));
};

/* ── sanity checks ─────────────────────────────────────────────────────── */

function check(all) {
  const problems = [];
  const seen = new Set();

  for (const a of all) {
    for (const key of ['slug', 'code', 'name', 'imgPrefix', 'photos',
                       'categories', 'metaTitle', 'metaDesc', 'cardDesc',
                       'description', 'schemaDesc', 'dims']) {
      if (a[key] === undefined) problems.push(`${a.slug || '?'}: missing "${key}"`);
    }
    if (seen.has(a.slug)) problems.push(`duplicate slug "${a.slug}"`);
    seen.add(a.slug);

    for (const p of photosOf(a)) {
      if (!fs.existsSync(path.join(ROOT, p))) problems.push(`${a.slug}: no such photo ${p}`);
    }
    if (a.metaDesc && (a.metaDesc.length < 120 || a.metaDesc.length > 165)) {
      problems.push(`${a.slug}: metaDesc is ${a.metaDesc.length} chars (aim for 120–165)`);
    }
  }
  return problems;
}

function checkPrints(p) {
  const problems = [];
  if (!p.sets || !p.sets.length) problems.push('prints: no sets defined');

  const prefixes = new Set();
  for (const set of p.sets || []) {
    for (const key of ['name', 'prefix', 'meta', 'prints']) {
      if (set[key] === undefined) problems.push(`print set "${set.name || '?'}": missing "${key}"`);
    }
    if (!set.prints || !set.prints.length) problems.push(`print set "${set.name}": no sheets`);
    if (prefixes.has(set.prefix)) problems.push(`duplicate print prefix "${set.prefix}"`);
    prefixes.add(set.prefix);

    (set.prints || []).forEach((cap, i) => {
      const f = printPath(set, i);
      if (!fs.existsSync(path.join(ROOT, f))) problems.push(`${set.name}: no such sheet ${f}`);
      if (!cap || !String(cap).trim()) problems.push(`${set.name}: sheet ${i + 1} has no caption`);
    });

    /* An image sitting in the folder with no caption would silently never show. */
    let next = (set.prints || []).length;
    const orphan = printPath(set, next);
    if (fs.existsSync(path.join(ROOT, orphan))) {
      problems.push(`${set.name}: ${orphan} exists but has no caption in data/prints.js`);
    }
  }
  return problems;
}

/* ── run ───────────────────────────────────────────────────────────────── */

function main() {
  const problems = [...check(ARTWORKS), ...checkPrints(PRINTS),
                    ...checkProjects(PROJECTS, ARTWORKS, PRINTS),
                    ...checkRedirects(REDIRECTS, ARTWORKS)];
  const fatal = problems.filter(p => !p.includes('metaDesc is'));
  problems.forEach(p => console.warn('  ! ' + p));
  if (fatal.length) {
    console.error(`\nBuild stopped: ${fatal.length} problem(s) above.`);
    process.exit(1);
  }

  const template = read('src/templates/artwork.html');
  for (const a of ARTWORKS) {
    write(artworkFile(a), artworkPage(template, a, ARTWORKS));
    console.log(`  ✓ ${artworkUrl(a)}`);
  }

  /* Each page's body is assembled first — generated regions filled in, tokens
     resolved — then wrapped in the shared chrome. */
  const bodyOf = {
    'printing-lab': () => deathCulturePage(read('src/pages/printing-lab.html'), PRINTS),
    gallery: () => {
      let g = read('src/pages/gallery.html');
      g = fill(g, 'gallery-chips', galleryChips(ARTWORKS), 'gallery.html');
      return fill(g, 'gallery-grid', galleryGrid(ARTWORKS), 'gallery.html');
    },
    index: () => {
      let i = read('src/pages/index.html');
      i = fill(i, 'hero-tools', heroMarks(PROJECTS), 'index.html');
      return fill(i, 'projects', projectSections(PROJECTS, ARTWORKS, PRINTS), 'index.html');
    },
    mirbreak: () => {
      let m = read('src/pages/mirbreak.html');
      m = fill(m, 'work-chips', galleryChips(ARTWORKS), 'mirbreak.html');
      return fill(m, 'home-grid', homeGrid(ARTWORKS), 'mirbreak.html');
    },
  };

  const built = {};
  for (const [slug, page] of Object.entries(PAGES)) {
    const body = (bodyOf[slug] || (() => read(`src/pages/${slug}.html`)))();
    built[slug] = renderPage(slug, page, body);
    write(page.out, built[slug]);
    console.log(`  ✓ ${page.out}`);
  }
  /* Anchors are checked after generation, because the sections they point at
     are themselves generated. */
  const dead = Object.entries(built)
    .flatMap(([slug, html]) => checkAnchors(html, PAGES[slug].out));
  if (dead.length) {
    console.error('\nBroken in-page links:');
    dead.forEach(d => console.error('  ! ' + d));
    process.exitCode = 1;
    return;
  }

  write('sitemap.xml', sitemap(ARTWORKS));
  console.log('  ✓ sitemap.xml');

  for (const r of REDIRECTS) write(redirectFile(r), redirectPage(r));
  write('_redirects', redirectsFile(REDIRECTS));
  console.log(`  ✓ ${REDIRECTS.length} redirects + _redirects`);

  console.log(`\n${ARTWORKS.length} pieces, ${allPrints(PRINTS)} prints, ` +
              `${REDIRECTS.length} redirects built.`);
}

main();
