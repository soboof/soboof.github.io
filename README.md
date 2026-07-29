# soboof.com — portfolio

Static portfolio site for **Soboof** (MirBreak / Ayeneh-Kari mirror sculptures), Leeuwarden NL.
No framework and no server — what ships is plain HTML/CSS/JS, ready for GitHub Pages. The
artwork pages are generated from one data file by a dependency-free Node script, so the
published output stays static while adding a piece stays a one-file edit.

## Pages

Every page is **generated**. You edit its body in `src/pages/` and its `<head>` block in
`data/pages.js`; `node build.js` writes the file that ships.

| Source | URL | Purpose |
|---|---|---|
| `src/pages/index.html` | `/` | Landing page — studio overview: hero, the four projects, dossier, contact |
| `src/pages/mirbreak.html` | `/mirbreak/` | Mirbreak — the sculpture project: work grid, working method |
| `src/templates/artwork.html` × 11 | `/work/<slug>/` | One artwork page per piece — from `data/artworks.js` |
| `src/pages/printing-lab.html` | `/printing-lab/` | Printing Lab — the hand-printing kiosk, currently showing Death Culture |
| `src/pages/workshop.html` | `/workshop/` | Creatieve Workshop — Ayeneh-Kari course + booking form |
| `src/pages/journal.html` | `/journal/` | Journal / writing |
| `src/pages/about.html` | `/about/` | About the studio |
| `404.html` | — | Served by GitHub Pages on unknown URLs. Hand-written and left alone: it is `noindex` with no canonical or social tags, so it does not fit the shared `<head>` |

Pages live in their own directory rather than as flat `.html` files, so the URLs have no
extension. The old flat URLs (`/gallery.html`, `/about.html`, …) were live, so they are kept
as redirects — see *Old WordPress URLs* below.

**Every URL the build emits is root-relative** (`/assets/css/index.css`, `/gallery/`). That is
what let the pages move down a directory without a single link being rewritten, and it is the
rule to keep: a relative `assets/…` on a page at `/about/` would resolve to `/about/assets/…`.
The only exception is the redirect stubs, which compute `../` hops from their own depth.

## Where things live

Source on the left, published output on the right. The repo root **is** the web root —
GitHub Pages serves this repo from `main`/root — so generated pages sit alongside the
source that makes them, and both are committed.

```
src/                          ← edit these
├── pages/                    body copy, one file per page
│   ├── index.html  mirbreak.html  printing-lab.html
│   └── workshop.html  journal.html  about.html
├── partials/                 the shared chrome, one copy of each
│   ├── head.html             <head> — tokens filled from data/pages.js
│   ├── header.html           nav; the current link and CTA are tokens
│   ├── footer.html
│   ├── chrome.html           status line + theme toggle button
│   └── owl.html              the Soboof mark, tinted by {{cls}}
└── templates/
    └── artwork.html          the shell all 11 artwork pages use

data/                         ← and these
├── pages.js                  every page's <head>: title, description, canonical…
├── artworks.js  prints.js  projects.js  redirects.js

assets/                       ← served as-is
├── css/
│   ├── artwork.css           shared by all 11 artwork pages
│   ├── index.css  mirbreak.css  gallery.css  printing-lab.css
│   └── workshop.css  about.css  journal.css  404.css
├── js/
│   ├── theme.js              night/day toggle, shared by every page
│   ├── artwork.js            page builder, shared by all 11 artwork pages
│   └── artwork-viewer.js     the three.js viewer module
├── img/                      artwork photography + the logos
└── models/                   3D geometry
```

Before this split the `<head>`, header and footer were pasted into all seven pages, and had
already drifted: three of them still said *Mirbreak · Mirrored Sculpture* under the logo after
the studio was rebranded, only the homepage carried the SuperAdobe nav link, and the owl mark
was duplicated 22 times for 61 KB. There is now one copy of each, so that class of bug is
gone — a change to the nav is a change to one file.

One stylesheet per page, because the pages' CSS has genuinely diverged — no two of
them share a single identical rule block, so there is no common core to hoist. Merging
them into one `site.css` would mean reconciling nineteen variants of the same tokens by
hand, which is a rewrite rather than a move; it is worth doing, but as its own job.

The eleven artwork pages *were* byte-identical, so they now share one `artwork.css`,
one `artwork.js` and one `artwork-viewer.js`. That took each artwork page from 80 KB to
39 KB and turned ~408 KB of repeated payload into 41 KB fetched once and cached.

What stays inline, deliberately:

- the **JSON-LD** block and the generated **`PRODUCT`** object on each artwork page —
  both are per-piece, and the structured data has to be in the raw HTML for crawlers
- each page's own **page-specific JavaScript** (filters, 3D rails, lightboxes). It is
  unique per page, so moving it would buy structure but no caching, and it sits in
  ordered blocks alongside the theme toggle where a careless move changes behaviour.

## Soboof Studio — adding work without the terminal

Double-click **`studio.cmd`**. A page opens at `http://localhost:4000` with three tabs:

| Tab | What it does |
|---|---|
| **Add a sculpture** | The whole `data/artworks.js` entry as a form. Photos are resized to 2560px in the browser and saved as `<slug>-01.jpg`, `-02.jpg`, … |
| **Add a poster** | Pick the collection, drop the scan, write the caption. Numbered and resized (1600px) automatically. |
| **Publish** | Runs the build, then `git add`, `commit` and `push`. Shows exactly what each step said. |

It needs [Node.js](https://nodejs.org) and nothing else — no `npm install`, no dependencies. The
server binds to localhost, so nothing outside the machine can reach it. Leave the black window open
while you work; closing it stops the studio.

The catalogue code (`SBF · 012`) and the page URL are worked out for you, and it refuses to save a
piece with a duplicate slug, a missing field, a slug that collides with a site page, or no photo. If
a photo fails to save, the data file is left untouched — it never half-writes an entry.

Before it edits `data/artworks.js` or `data/prints.js` it drops a timestamped copy in
`tools/studio/backups/` (git-ignored). If a run ever goes wrong, that folder has the file as it was.

Everything below describes doing the same work by hand, which still works exactly as before.

## Adding an artwork

The catalogue lives in **`data/artworks.js`** — one object per piece, and the only file
you edit to add work.

1. Drop the photos in `assets/img/`, named `<imgPrefix>-01.jpg`, `-02.jpg`, …
2. Copy an existing block in `data/artworks.js`, fill it in, give it the next free `code`.
3. Run the build:

```bash
node build.js
```

That writes `work/<slug>/index.html`, adds the piece to the Work grid on `/mirbreak/`, recounts the filter chips,
adds it to the homepage grid if `featured` is set, rebuilds the related-work links on every
other artwork page, and adds it to `sitemap.xml`. Nothing else needs touching.
`featured: 'big'` only decides how large a tile is now — every piece appears either way.

The build refuses to run if a piece is missing a required field, has a duplicate slug, or
points at a photo that is not on disk, and it warns when a `metaDesc` falls outside the
120–165 character window search engines display.

| File | Role |
|---|---|
| `data/artworks.js` | The sculpture catalogue — **edit this** |
| `data/prints.js` | The Death Culture print catalogue — **edit this** |
| `data/projects.js` | The four projects introduced on the landing page — **edit this** |
| `data/redirects.js` | Old WordPress URL → new page map |
| `src/templates/artwork.html` | Page shell with `{{TOKEN}}` placeholders — edit to change *every* artwork page. Links and asset paths are root-relative, so there is no base-path token to remember |
| `src/pages/printing-lab.html` | Body and prose for the Printing Lab page |
| `data/pages.js` | Every page's `<head>` — title, description, canonical, social tags — **edit this** |
| `src/partials/*.html` | The chrome every page shares — edit once, changes everywhere |
| `build.js` | The generator |

In the `src/pages` files only the regions between `<!-- BUILD:name -->`
and `<!-- /BUILD:name -->` are rewritten; hand-written copy outside those markers survives a
rebuild. Generated `<slug>.html` files are overwritten wholesale — edit the template, never
the output.

| Marker | Lives in | Holds |
|---|---|---|
| `hero-tools` | `src/pages/index.html` | the row of tool marks under the hero |
| `projects` | `src/pages/index.html` | the four project sections |
| `work-chips` | `src/pages/mirbreak.html` | the filter chips above the Work grid |
| `home-grid` | `src/pages/mirbreak.html` | the Work grid — the whole catalogue |
| `work-chips`, `home-grid` | `src/pages/mirbreak.html` | the filter chips and the full catalogue |

Re-running the build with no data changes produces no diff, so it is safe to run any time.

`assets/models/` holds the 3D geometry. The landing and Mirbreak rails load
`pythagoras_m21.gltf` — a Pythagoras Engine export, read by a small inline glTF parser
rather than three.js's GLTFLoader, since the file is a single mesh with embedded buffers.
The artwork pages still load `pythagoras.obj`. `assets/img/` holds the artwork
photography and the logo (see *Images* below).

## Printing Lab

The page is the **Printing Lab** — the studio's press, which travels to festivals, galleries and
art markets. **Death Culture** is the project currently shown in it, and keeps its own name
throughout: the statement, the stamp collection and both print sets are Death Culture's. The lab is
the container so that later print projects have somewhere to go without renaming anything.

`printing-lab.html` is the studio's third strand — a hand-printing kiosk performance, worked in
cut lino and ink rather than mirror. Like the artwork pages it is **generated**, from
`data/prints.js` + `src/pages/printing-lab.html`.

### Adding a poster

1. Save the scan in `assets/img/death-culture/` as the next number in its set —
   `death-culture-10.jpg`, or `sky-bodybags-17.jpg`.
2. Add its caption, in order, to that set's `prints` array in `data/prints.js`.
3. `node build.js`

Every count on the page follows from the data: the status bar, the counter card, the spelled-out
"Twenty-five pulls" heading, each set's sheet count, the card on the homepage, and the structured
data. Adding a whole new collection means copying a `sets` block — `prefix` is the image file
prefix, so a set with `prefix: 'winter-sheets'` expects `winter-sheets-01.jpg` onward.

The build stops if a caption has no image file **or** if an image sits in the folder with no
caption — the second case would otherwise leave a scan silently invisible on the page.

The stamp collection section (cypress, hound, bird, mountain, flame, cloud) has been **taken off the
page**. Its `motifs` array is still in `data/prints.js` because those descriptions are the only
written record of what each block means, but nothing renders it. To bring the section back, restore
the `03 · The stamp collection` block in `src/pages/printing-lab.html` with a `{{MOTIF_GRID}}` token
and the `motifGrid()` renderer in `build.js`; to drop it for good, delete the array.

### Print sources

| Prefix | Sheets | Source |
|---|---|---|
| `death-culture-01…09.jpg` | 9 | *Death culture 3.pdf* — black and gold |
| `sky-bodybags-01…16.jpg` | 16 | *sky bodybags collection soboof.pdf* — red, blue and black |
| `death-culture-og.jpg` | — | 1200×630 social crop |

The originals are image-only PDFs with no text layer; the JPEGs were pulled out of them and resized
to fit 1600px (25 sheets, 4.8 MB total, down from ~20 MB).

The prose — statement, kiosk section, CTA — lives in `src/pages/printing-lab.html`. The artist
statement there is reproduced verbatim from the WordPress post at
`soboof.com/performance/death-culture/`; once WordPress is switched off, the template becomes the
only copy, so keep it.

The page carries its own lightbox (click a sheet, arrow keys and Esc to navigate) and reuses
`gallery.html`'s stylesheet and chrome, so it inherits the night/day theme automatically.

## Publishing to GitHub Pages

1. Create an empty repository on GitHub (public — Pages is free on public repos).
This repo is live at **https://github.com/soboof/soboof.github.io**, published by GitHub
Pages from `main` / root at **https://soboof.github.io/**. Pushing to `main` redeploys:

```bash
git push
```

## The four projects

The landing page is a studio overview, not a Mirbreak page. Each project gets its own full
section with three examples:

```
hero → 01 · Pythagoras Engine → 02 · SuperAdobe Generator → 03 · Mirbreak
     → 04 · Death Culture → 05 · Dossier → 06 · Beyond the object → contact
```

How the four relate is deliberate, and the copy states it in both directions:

| Project | Field (`key`) | Relationship |
|---|---|---|
| Pythagoras Engine | `SOFTWARE` | **Paired with Mirbreak** — it grows the bodies Mirbreak tiles |
| SuperAdobe Generator | `PROCEDURAL DESIGN` | **Stands alone** — not related to the Engine |
| Mirbreak | `SCULPTURE` | **Paired with the Engine** — its bodies come from there |
| Death Culture | `GRAPHIC DESIGN` | Stands alone |

An earlier version presented the Engine and SuperAdobe as a matched pair of browser tools
sharing "the same modular logic". That is wrong — they are unrelated, and the real pair is
the Engine and Mirbreak. Do not reintroduce the link when editing this copy.

The order is the order of `data/projects.js`, and two things follow from it and have to
move with it: the section numbers, and the side each vertical rail sits on (they alternate
from the first project, and `about` / `more` / `contact` continue the alternation by hand).
The `STATES` array in `index.html`'s 3D scene script is **indexed by document order**, so
reordering projects means reordering it to match, or the rail shows the wrong model.

Mirbreak's own material — the work grid and the four working-method chapters — lives on
`/mirbreak/`, so all four projects are reached the same way rather than one of them owning
the front page. Each section ends with a link to its project page (`/mirbreak/`,
`/printing-lab/`, pythagorasengine.com, `soboof.com/superadobe-generator/`); `/gallery/`
stays the full filterable catalogue that `/mirbreak/` links onward to.

The two software tools are external — they are their own sites, not pages in this repo — so
their sections link out and the nav carries a button for each (`△ Builder`, `⬡ SuperAdobe`).

All four sections are generated from **`data/projects.js`** — edit the copy there, never the
markup in `index.html`. `source` decides where a project's three examples come from:

| `source` | Each example is | Where the rest comes from |
|---|---|---|
| `models` | `{ file, label, note }` | a real file in `assets/models/` |
| `domes` | `{ type, span, …, label, note }` | nothing — the build lays the courses from the spec |
| `artworks` | `{ slug }` | `data/artworks.js` — photo, name, edition, dimensions |
| `prints` | `{ img }` | `data/prints.js` — set name and caption |

### Headings and marks

The section heading is the project's `name`; `role` sits under it as the sub-heading, and the
eyebrow above reads the field out of `key` — which is always `<ABBREVIATION> · <FIELD>`, the
abbreviation being what runs down the vertical rail.

A project may also name a `logo` in `assets/img/`. The file on disk is the master and must use
`fill="currentColor"`, so the mark takes the section tint and follows the night/day theme — the
same rule the owl logo is inlined under. A logo is used in two places, both generated:

- **behind the section heading**, enlarged and faint — the treatment the owl already gets
  behind the hero headline. It is `pointer-events:none` and sits under the type, so it stays
  decoration and never eats a click.
- **in the row of marks under the hero**, where it links to that project's own site.

The row follows the data: anything with a `logo` appears in it, so adding a mark is a one-file
edit. Only the two software tools have a logotype today — Mirbreak and Death Culture have none,
so the field is optional and they simply don't appear in the row.

So a caption is written once and reused; changing a piece's name or a print's caption updates the
landing page on the next build. Each source is framed the way that medium already is elsewhere on
the site — sculpture photos crop square, print scans sit whole on paper at A4.

### The Pythagoras Engine wireframes

PE has no photographs, so its three examples are drawn from the actual geometry. At build time
`build.js` parses the OBJ and glTF files in `assets/models/`, welds duplicate vertices, collapses
the mesh to unique edges, projects it orthographically and bakes a static SVG into the page —
far edges faint and thin, near edges bright, sorted back to front.

There is no WebGL and no runtime cost; the stroke is `currentColor`, so each drawing takes its
project tint and follows the theme. All three come to about 15 KB. The vertex and face counts
printed under each drawing are **measured from the file**, not typed in — so they cannot drift.

To swap in a different model, drop the `.obj` or `.gltf` into `assets/models/` and name it in
`data/projects.js`. Only the `label` and `note` are yours to write.

### The SuperAdobe course stacks

SuperAdobe has no photographs either, and needs none: a structure is fully described by its span,
the section of the sack it is laid from, and how the profile closes. The build lays the courses —
a 45 cm tube tamped to 13 cm, the generator's default — and draws the stack it laid.

| `type` | Profile | Drawn as |
|---|---|---|
| `dome` | pointed, `rr = 2·rb + sw` struck from the outer edge of the base sack | elevation, crown left open as a skylight |
| `vault` | catenary, run along `length` | section, with the far end of the barrel behind it |
| `cylinder` | straight wall to `height` | elevation, shaded across the courses so the drum reads round |

The course count and the running metres of sack printed under each drawing are **measured off
the stack that got drawn**, not typed — a caption cannot drift from its picture. As with the
wireframes there is no WebGL and no runtime cost, and the fill is `currentColor`, so each
drawing takes its project tint and follows the theme.

The build refuses to run on a missing model file, an unknown artwork slug, a print index that
doesn't exist, a dome spec that can't be laid, a missing logo file, a bad `source`, a `key` that
isn't `<ABBREVIATION> · <FIELD>`, a duplicate section `id`, or any project that doesn't have
exactly three examples.

Two tokens are substituted at build time so the counts can't drift: `{{ARTWORKS}}` becomes the
number of pieces in `data/artworks.js`, `{{PRINTS}}` the number of sheets in `data/prints.js`.

`accent` tints each card's top rule, index number, status and call to action. Only five colours
exist in `index.html` — `var(--accent)`, `var(--mirror)`, `var(--earth)`, `var(--green)`,
`var(--red)` — and the build rejects anything else, because an undefined variable renders as no
colour at all. It also rejects a missing field, an internal link to a page that doesn't exist,
and a card marked `external` whose href isn't an absolute URL.

The four a project can actually use are theme-swapped so the small 10px labels stay legible on
both backgrounds; the day palette deepens them. `--red` was moved from `#c44444` to `#e05c5c`
(night) / `#9e2b2b` (day) to clear WCAG AA, and `--earth` — added for SuperAdobe, the earthbag
tan the generator brands itself with — is `#c98a4b` / `#8a5a22` for the same reason. It has to
stay clear of `--mirror`'s day value, which is itself a deep green (`#1e7a45`), or the two
software sections would be indistinguishable in day mode.

`--green` is the exception: it is the same in both themes, so it is still only safe on the dark
background (the status dot, a rail label) and a project should not tint itself with it.

## Old WordPress URLs

Every URL soboof.com serves today is mapped in `data/redirects.js`, and `node build.js` turns each
one into a real directory containing an `index.html` that forwards to the new page. GitHub Pages
cannot issue 301s, so these use a `<link rel="canonical">` plus a zero-delay meta refresh and a
`location.replace()` — which search engines treat as a permanent move. 63 URLs.

| Old shape | Count | Goes to |
|---|---|---|
| `/gallery/<cat>/<product>/` | 11 | `work/<slug>/` |
| `/<slug>.html` | 11 | `work/<slug>/` — the flat shape this repo published before the move |
| `/<page>.html` | 6 | `/<page>/` — the flat shape used before pages moved into directories |
| `/product-category/…`, `/product-tag/…` | 17 | `/mirbreak/` |
| `/category/…` | 6 | `/journal/`, except `/category/performance/` → `/printing-lab/` |
| `/philosophizing/<post>/` | 3 | `/journal/` — until the posts are migrated |
| `/performance/death-culture/` | 1 | `/printing-lab/` |
| pages (`/about-me/`, `/blog/`, `/creatieve-workshop/`, …) | 7 | their counterparts |

`/gallery/` is a redirect as well now: the catalogue it used to hold is the Work section of
`/mirbreak/`, so the 20 URLs that pointed at the gallery point there instead. Its nested
children (`/gallery/abstract/…`) are untouched — a page and a tree of redirects can share a
directory, since only the `index.html` is taken.

The eleven `/<slug>.html` entries exist because those URLs were live on
`soboof.github.io` before the pieces moved into `/work/`. Their stubs overwrite the old
page files, so nothing is left serving a stale copy and no old link 404s.

Three product slugs changed and the map absorbs that: `lamp` → `abstract-table-lamp`,
`geometrical-cat-statue` → `geometrical-cat`, `geometrical-mouse-home-decor` → `geometrical-mouse`.

The build also writes **`_redirects`**, which GitHub Pages ignores but Cloudflare Pages and Netlify
honour as real 301s — so moving hosts later upgrades every redirect automatically, no edits needed.

The redirect directories are generated, so don't hand-edit them. The build refuses to run on a
duplicate `from`, a `to` that doesn't exist, a path that would shadow a real page, a malformed
path, or a directory that already holds unrelated files.

### Custom domain (soboof.com) — connected

`CNAME` holds **`soboof.com`**, so that is where the site answers; `soboof.github.io`
redirects to it. The DNS side of the cutover is done:

- `A` records for the apex → `185.199.108.153`, `185.199.109.153`,
  `185.199.110.153`, `185.199.111.153`
- `CNAME` record for `www` → `soboof.github.io`

**Leave `CNAME` alone.** Deleting it sends every visitor back to whatever answers on the
domain, and it has already been removed and restored once. It is a tracked file like any
other, so a careless `git add -A` after deleting it will publish the deletion.

The file holds the bare apex on purpose. Every canonical in this repo, `sitemap.xml` and the
redirect map all use `soboof.com`, and putting the apex in `CNAME` is what makes Pages
redirect `www` → apex for you. Flipping it (apex → www) would mean rewriting all of them,
so don't.

Still worth confirming, if it has not been done: **Settings → Pages → Enforce HTTPS** is
ticked once the certificate has been issued. Then spot-check a few old URLs —
`/gallery/statue/christmas-gifts/space-fox/`, `/product-tag/one-of-a-kind/`,
`/performance/death-culture/` — and re-submit `sitemap.xml` in Search Console.

## Local preview

The site **must** be served over HTTP now — opening a file from disk no longer works at all,
because every link and asset path is root-relative (`/assets/css/index.css`), and on `file://`
a leading slash means the root of the drive. The 3D rail also loads its model with `fetch()`,
which browsers block on `file://` regardless.

```bash
npx http-server -p 3001 -c-1 .
```

**Use `http-server`, not `serve`.** The repo contains both a file `about.html` (a redirect)
and a directory `about/` (the real page). GitHub Pages serves those as two distinct URLs and
`http-server` does the same; `serve` rewrites `/about.html` to `/about` by default, so the
preview would silently skip the redirect it is supposed to be testing. Its `cleanUrls: false`
setting fixes that but then stops resolving directory indexes, breaking every page instead.
Neither mode matches production, so avoid it here.

## Images

The 64 artwork photographs were pulled from the WordPress media library at full size
(up to 2560px) and live in `assets/img/`, named by piece — `space-fox-01.jpg`,
`simorgh-phoenix-04.jpg`, and so on. The card grids on the homepage and gallery use the
`-01` shot of each set; each artwork page shows the full set as a thumbnail strip.

Photo file names are a convention the build relies on: a piece with `imgPrefix: 'space-fox'`
and `photos: 7` resolves to `space-fox-01.jpg` … `space-fox-07.jpg`. To add a photo, drop it
in as the next number and raise the `photos` count. The build fails loudly if a numbered
file is missing, so a typo cannot ship. An image that fails to load in the browser falls
back to a geometric SVG placeholder automatically.

Four process-chapter images on the homepage are still placeholders (concept diagram, bird
anatomy, material philosophy, lamp functionality). Candidate source files exist in
`Documents/mir break/New folder/` (formation studies) but were not matched automatically.

## SEO

Every indexable page carries:

- a unique `<title>` (46–55 chars) and `<meta name="description">` (134–162 chars)
- `<link rel="canonical">` pointing at `https://soboof.com/…` — matching `sitemap.xml`
- Open Graph and Twitter card tags, with a real artwork photo as `og:image`
- JSON-LD structured data in a `@graph`:

| Page | Schema types |
|---|---|
| `index.html` | `WebSite`, `Organization` |
| `mirbreak.html` | `CreativeWorkSeries`, `BreadcrumbList` |
| `about.html` | `AboutPage` (with `Person`), `BreadcrumbList` |
| `journal.html` | `Blog`, `BreadcrumbList` |
| `workshop.html` | `Course` (with `CourseInstance`), `BreadcrumbList` |
| `printing-lab.html` | `CreativeWorkSeries` + `VisualArtwork`, `BreadcrumbList` |
| artwork pages | `VisualArtwork`, `BreadcrumbList` |

`death-culture.html` is no longer a page — it is a redirect stub pointing at
`printing-lab.html`, which carries that schema now.

`404.html` is `noindex` and deliberately has no canonical or social tags.

On artwork pages the `<title>`, meta description, canonical, social tags, JSON-LD, `<h1>`
and subtitle are all written into the raw HTML by the build, not injected at runtime, so a
crawler that runs no JavaScript still sees them. The rest of the page builds from the
generated `PRODUCT` object.

Two known gaps: the artwork pages' `og:image` uses portrait photographs, where social previews
prefer a 1200×630 landscape crop (`death-culture.html` has a proper one at
`assets/img/death-culture/death-culture-og.jpg`), and there is no `article:published_time` on
journal entries because the journal has no individual post pages yet.

## Still to do

- **Journal posts** — three articles still link to `https://www.soboof.com/philosophizing/...`
  on the WordPress site. Those URLs die when WordPress is switched off; the posts need to be
  copied into this repo as pages.
- **Contact and booking forms** — the workshop booking form has no backend. GitHub Pages cannot
  process form submissions; use a hosted form endpoint (Formspree, Basin) or `mailto:`.
- **Terms and conditions** — `soboof.com/terms-and-conditions/` currently redirects to the
  homepage because this repo has no equivalent page. If the shop is retired the page may not be
  needed; if any commerce returns, write it and repoint the redirect.

## Notes

- This is a **portfolio**, not a shop: no prices, cart, or checkout. Artwork pages invite an
  enquiry by email (`mirbreak@soboof.com`). Each piece does carry its WooCommerce `price`
  in `data/artworks.js` so the catalogue matches soboof.com, but nothing renders it — the
  only thing derived from price is which pieces answer the *On sale* filter in the Work grid.
- The catalogue mirrors the 11 published WooCommerce products on soboof.com as of
  25 July 2026. Copy, dimensions, categories and edition labels came from that catalogue;
  pieces live at `/work/adam/` here where WordPress nests them (`/gallery/statue/…/adam/`).
- The official Soboof owl mark lives at `assets/img/soboof-logo.svg`. It is also inlined into
  every page's header, hero and footer, and encoded into the favicon. The inline copies use
  `fill="currentColor"` so the mark follows the theme — gold at night, purple by day. If the
  logo ever changes, update the `.svg` and re-inline it; the standalone file is the master.
- Night/day theme is remembered in `localStorage` under `soboof.theme`.
- Fonts load from Google Fonts; three.js loads from cdnjs. Both are external CDNs — the site
  degrades gracefully if they are blocked.
