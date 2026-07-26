# soboof.com — portfolio

Static portfolio site for **Soboof** (MirBreak / Ayeneh-Kari mirror sculptures), Leeuwarden NL.
No framework and no server — what ships is plain HTML/CSS/JS, ready for GitHub Pages. The
artwork pages are generated from one data file by a dependency-free Node script, so the
published output stays static while adding a piece stays a one-file edit.

## Pages

| File | URL | Purpose |
|---|---|---|
| `index.html` | `/` | Landing page — studio overview: hero, the three projects, dossier, contact |
| `mirbreak.html` | `/mirbreak.html` | Mirbreak — the sculpture project: work grid, working method |
| `gallery.html` | `/gallery.html` | Full collection, filterable grid/list |
| `<slug>.html` × 11 | `/<slug>.html` | One artwork page per piece — **generated**, see below |
| `printing-lab.html` | `/printing-lab.html` | Printing Lab — the hand-printing kiosk, currently showing Death Culture |
| `workshop.html` | `/workshop.html` | Creatieve Workshop — Ayeneh-Kari course + booking form |
| `journal.html` | `/journal.html` | Journal / writing |
| `about.html` | `/about.html` | About the studio |
| `404.html` | — | Served by GitHub Pages on unknown URLs |

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

That writes `<slug>.html`, adds the piece to the gallery grid, recounts the filter chips,
adds it to the homepage grid if `featured` is set, rebuilds the related-work links on every
other artwork page, and adds it to `sitemap.xml`. Nothing else needs touching.

The build refuses to run if a piece is missing a required field, has a duplicate slug, or
points at a photo that is not on disk, and it warns when a `metaDesc` falls outside the
120–165 character window search engines display.

| File | Role |
|---|---|
| `data/artworks.js` | The sculpture catalogue — **edit this** |
| `data/prints.js` | The Death Culture print catalogue — **edit this** |
| `data/projects.js` | The three projects introduced on the landing page — **edit this** |
| `data/redirects.js` | Old WordPress URL → new page map |
| `templates/artwork.html` | Page shell with `{{TOKEN}}` placeholders — edit to change *every* artwork page |
| `templates/printing-lab.html` | Shell and prose for the Printing Lab page |
| `build.js` | The generator |

In `gallery.html`, `index.html` and `mirbreak.html` only the regions between `<!-- BUILD:name -->`
and `<!-- /BUILD:name -->` are rewritten; hand-written copy outside those markers survives a
rebuild. Generated `<slug>.html` files are overwritten wholesale — edit the template, never
the output.

| Marker | Lives in | Holds |
|---|---|---|
| `projects` | `index.html` | the three project cards |
| `home-grid` | `mirbreak.html` | the Mirbreak work grid |
| `gallery-chips`, `gallery-grid` | `gallery.html` | filters and the full catalogue |

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
`data/prints.js` + `templates/printing-lab.html`.

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
the `03 · The stamp collection` block in `templates/printing-lab.html` with a `{{MOTIF_GRID}}` token
and the `motifGrid()` renderer in `build.js`; to drop it for good, delete the array.

### Print sources

| Prefix | Sheets | Source |
|---|---|---|
| `death-culture-01…09.jpg` | 9 | *Death culture 3.pdf* — black and gold |
| `sky-bodybags-01…16.jpg` | 16 | *sky bodybags collection soboof.pdf* — red, blue and black |
| `death-culture-og.jpg` | — | 1200×630 social crop |

The originals are image-only PDFs with no text layer; the JPEGs were pulled out of them and resized
to fit 1600px (25 sheets, 4.8 MB total, down from ~20 MB).

The prose — statement, kiosk section, CTA — lives in `templates/printing-lab.html`. The artist
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

## The three projects

The landing page is a studio overview, not a Mirbreak page. Each project gets its own full
section with three examples:

```
hero → 01 · Pythagoras Engine → 02 · Mirbreak → 03 · Death Culture
     → 04 · Dossier → 05 · Beyond the object → contact
```

Mirbreak's own material — the work grid and the four working-method chapters — lives on
`mirbreak.html`, so all three projects are reached the same way rather than one of them owning
the front page. Each section ends with a link to its project page (`mirbreak.html`,
`printing-lab.html`, pythagorasengine.com); `gallery.html` stays the full filterable catalogue
that `mirbreak.html` links onward to.

All three sections are generated from **`data/projects.js`** — edit the copy there, never the
markup in `index.html`. `source` decides where a project's three examples come from:

| `source` | Each example is | Where the rest comes from |
|---|---|---|
| `models` | `{ file, label, note }` | a real file in `assets/models/` |
| `artworks` | `{ slug }` | `data/artworks.js` — photo, name, edition, dimensions |
| `prints` | `{ img }` | `data/prints.js` — set name and caption |

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

The build refuses to run on a missing model file, an unknown artwork slug, a print index that
doesn't exist, a bad `source`, a duplicate section `id`, or any project that doesn't have exactly
three examples.

Two tokens are substituted at build time so the counts can't drift: `{{ARTWORKS}}` becomes the
number of pieces in `data/artworks.js`, `{{PRINTS}}` the number of sheets in `data/prints.js`.

`accent` tints each card's top rule, index number, status and call to action. Only four colours
exist in `index.html` — `var(--accent)`, `var(--mirror)`, `var(--green)`, `var(--red)` — and the
build rejects anything else, because an undefined variable renders as no colour at all. It also
rejects a missing field, an internal link to a page that doesn't exist, and a card marked
`external` whose href isn't an absolute URL.

Those four are theme-swapped so the small 10px labels stay legible on both backgrounds; the day
palette deepens them, and `--red` was moved from `#c44444` to `#e05c5c` (night) / `#9e2b2b` (day)
to clear WCAG AA. Nothing else used `--red`.

## Old WordPress URLs

Every URL soboof.com serves today is mapped in `data/redirects.js`, and `node build.js` turns each
one into a real directory containing an `index.html` that forwards to the new page. GitHub Pages
cannot issue 301s, so these use a `<link rel="canonical">` plus a zero-delay meta refresh and a
`location.replace()` — which search engines treat as a permanent move. 46 URLs, ~121 KB total.

| Old shape | Count | Goes to |
|---|---|---|
| `/gallery/<cat>/<product>/` | 11 | the matching artwork page |
| `/product-category/…`, `/product-tag/…` | 17 | `gallery.html` |
| `/category/…` | 6 | `journal.html`, except `/category/performance/` → `death-culture.html` |
| `/philosophizing/<post>/` | 3 | `journal.html` — until the posts are migrated |
| `/performance/death-culture/` | 1 | `death-culture.html` |
| pages (`/about-me/`, `/blog/`, `/creatieve-workshop/`, …) | 8 | their counterparts |

Three product slugs changed and the map absorbs that: `lamp` → `abstract-table-lamp`,
`geometrical-cat-statue` → `geometrical-cat`, `geometrical-mouse-home-decor` → `geometrical-mouse`.

The build also writes **`_redirects`**, which GitHub Pages ignores but Cloudflare Pages and Netlify
honour as real 301s — so moving hosts later upgrades every redirect automatically, no edits needed.

The redirect directories are generated, so don't hand-edit them. The build refuses to run on a
duplicate `from`, a `to` that doesn't exist, a path that would shadow a real page, a malformed
path, or a directory that already holds unrelated files.

### Custom domain (soboof.com) — not connected yet

There is deliberately **no `CNAME` file** in this repo right now. GitHub Pages redirects
`soboof.github.io` to whatever custom domain is configured, so a `CNAME` naming `soboof.com`
would bounce every visitor to the WordPress site that still answers on that domain — making
the new site impossible to preview.

When you are ready to switch off WordPress, do it in this order:

1. At your domain registrar, point `soboof.com` at GitHub:
   - `A` records for the apex → `185.199.108.153`, `185.199.109.153`,
     `185.199.110.153`, `185.199.111.153`
   - `CNAME` record for `www` → `soboof.github.io`
2. Re-add the file: `echo soboof.com > CNAME`, then commit and push.
3. In **Settings → Pages**, wait for the certificate, then tick **Enforce HTTPS**.

WordPress currently serves **`www.soboof.com`**, while every canonical in this repo is the bare
apex `soboof.com`. Putting `soboof.com` in `CNAME` is what makes GitHub Pages redirect `www` to the
apex for you — so keep the apex in that file and the two stay consistent. Flipping it (apex → www)
would mean rewriting every canonical, `sitemap.xml` and the redirect map, so don't.

After the switch, spot-check a few old URLs — `/gallery/statue/christmas-gifts/space-fox/`,
`/product-tag/one-of-a-kind/`, `/performance/death-culture/` — and re-submit `sitemap.xml` in
Search Console.

Until step 1, the site is only reachable at `soboof.github.io`, and soboof.com keeps
serving WordPress exactly as it does today.

## Local preview

Because the homepage loads an OBJ model with `fetch()`, opening `index.html` straight from the
file system leaves the 3D rail empty (browsers block `fetch` on `file://`). Everything else works.
For a full preview, serve the folder over HTTP:

```bash
npx http-server -p 3001 -c-1 .
```

**Use `http-server`, not `serve`.** Since the WordPress redirects landed, the repo contains both a
file `gallery.html` and a directory `gallery/`. GitHub Pages serves those as two distinct URLs, and
`http-server` does the same. `serve` does not: by default it rewrites `/gallery.html` to `/gallery`,
which resolves to the directory and shows the redirect stub instead of the real gallery page —
so the preview lies about what visitors will see. Its `cleanUrls: false` setting fixes that but
then stops resolving directory indexes, breaking every redirect instead. Neither mode matches
production, so avoid it here.

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
| `gallery.html` | `CollectionPage`, `BreadcrumbList` |
| `about.html` | `AboutPage` (with `Person`), `BreadcrumbList` |
| `journal.html` | `Blog`, `BreadcrumbList` |
| `workshop.html` | `Course` (with `CourseInstance`), `BreadcrumbList` |
| `death-culture.html` | `CreativeWorkSeries` + `VisualArtwork`, `BreadcrumbList` |
| artwork pages | `VisualArtwork`, `BreadcrumbList` |

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
  only thing derived from price is which pieces answer the gallery's *On sale* filter.
- The catalogue mirrors the 11 published WooCommerce products on soboof.com as of
  25 July 2026. Copy, dimensions, categories and edition labels came from that catalogue;
  slugs are flat here (`/adam.html`) where WordPress nests them (`/gallery/statue/…/adam/`).
- The official Soboof owl mark lives at `assets/img/soboof-logo.svg`. It is also inlined into
  every page's header, hero and footer, and encoded into the favicon. The inline copies use
  `fill="currentColor"` so the mark follows the theme — gold at night, purple by day. If the
  logo ever changes, update the `.svg` and re-inline it; the standalone file is the master.
- Night/day theme is remembered in `localStorage` under `soboof.theme`.
- Fonts load from Google Fonts; three.js loads from cdnjs. Both are external CDNs — the site
  degrades gracefully if they are blocked.
