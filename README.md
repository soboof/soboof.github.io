# soboof.com — portfolio

Static portfolio site for **Soboof** (MirBreak / Ayeneh-Kari mirror sculptures), Leeuwarden NL.
No build step, no framework, no server — plain HTML/CSS/JS, ready for GitHub Pages.

## Pages

| File | URL | Purpose |
|---|---|---|
| `index.html` | `/` | Homepage — hero, work grid, process, studio, contact |
| `gallery.html` | `/gallery.html` | Full collection, filterable grid/list |
| `space-fox.html` | `/space-fox.html` | Artwork page — Space Fox (SBF·001) |
| `abstract-space-fox-ii.html` | `/abstract-space-fox-ii.html` | Artwork page — Abstract Space Fox II |
| `workshop.html` | `/workshop.html` | Creatieve Workshop — Ayeneh-Kari course + booking form |
| `journal.html` | `/journal.html` | Journal / writing |
| `about.html` | `/about.html` | About the studio |
| `404.html` | — | Served by GitHub Pages on unknown URLs |

`assets/models/` holds the 3D geometry. The homepage rail loads
`pythagoras_m21.gltf` — a Pythagoras Engine export, read by a small inline glTF parser
rather than three.js's GLTFLoader, since the file is a single mesh with embedded buffers.
The artwork pages still load `pythagoras.obj`. `assets/img/` holds the artwork
photography and the logo (see *Images* below).

## Publishing to GitHub Pages

1. Create an empty repository on GitHub (public — Pages is free on public repos).
2. From this folder:

```bash
git remote add origin https://github.com/<your-username>/<repo>.git
```

```bash
git push -u origin main
```

3. On GitHub: **Settings → Pages → Source: Deploy from a branch → `main` / `root`**.
4. The site goes live at `https://<your-username>.github.io/<repo>/` within a minute or two.

### Custom domain (soboof.com)

The `CNAME` file in this repo claims `soboof.com` for GitHub Pages.

**Do not change your DNS until you are ready to switch off WordPress** — the live site keeps
serving from its current host until DNS moves. When ready, at your domain registrar:

- `A` records for the apex `soboof.com` → `185.199.108.153`, `185.199.109.153`,
  `185.199.110.153`, `185.199.111.153`
- `CNAME` record for `www` → `<your-username>.github.io`

Then in **Settings → Pages**, tick **Enforce HTTPS** (available once the certificate is issued,
usually within an hour).

## Local preview

Because the homepage loads an OBJ model with `fetch()`, opening `index.html` straight from the
file system leaves the 3D rail empty (browsers block `fetch` on `file://`). Everything else works.
For a full preview, serve the folder over HTTP:

```bash
npx serve .
```

## Images

The 64 artwork photographs were pulled from the WordPress media library at full size
(up to 2560px) and live in `assets/img/`, named by piece — `space-fox-01.jpg`,
`simorgh-phoenix-04.jpg`, and so on. The card grids on the homepage and gallery use the
`-01` shot of each set; the two artwork pages show the full set as a thumbnail strip.

To add a photo: drop it in `assets/img/` and either point an `<img src>` at it, or — on an
artwork page — add it to the `photos: [...]` array in the `PRODUCT` object near the bottom
of the file. An image that fails to load falls back to its geometric SVG placeholder
automatically.

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
| `gallery.html` | `CollectionPage`, `BreadcrumbList` |
| `about.html` | `AboutPage` (with `Person`), `BreadcrumbList` |
| `journal.html` | `Blog`, `BreadcrumbList` |
| `workshop.html` | `Course` (with `CourseInstance`), `BreadcrumbList` |
| artwork pages | `VisualArtwork`, `BreadcrumbList` |

`404.html` is `noindex` and deliberately has no canonical or social tags.

The artwork pages used to set `document.title` from JavaScript, overwriting the static
title; that line was removed, and the `<h1>` and subtitle are now in the raw HTML rather
than injected at runtime. The rest of the page still builds from the `PRODUCT` object.

Two known gaps: `og:image` uses portrait photographs, where social previews prefer a
1200×630 landscape crop, and there is no `article:published_time` on journal entries
because the journal has no individual post pages yet.

## Still to do

- **Journal posts** — three articles still link to `https://www.soboof.com/philosophizing/...`
  on the WordPress site. Those URLs die when WordPress is switched off; the posts need to be
  copied into this repo as pages.
- **Contact and booking forms** — the workshop booking form has no backend. GitHub Pages cannot
  process form submissions; use a hosted form endpoint (Formspree, Basin) or `mailto:`.
- **Redirects** — WordPress URLs (`/gallery/...`, `/product-category/...`) have no equivalent
  here. GitHub Pages cannot issue 301s, so incoming links land on `404.html`. If preserving search
  rankings matters, host through Cloudflare Pages instead, which supports a `_redirects` file.

## Notes

- This is a **portfolio**, not a shop: no prices, cart, or checkout. Artwork pages invite an
  enquiry by email (`mirbreak@soboof.com`).
- The official Soboof owl mark lives at `assets/img/soboof-logo.svg`. It is also inlined into
  every page's header, hero and footer, and encoded into the favicon. The inline copies use
  `fill="currentColor"` so the mark follows the theme — gold at night, purple by day. If the
  logo ever changes, update the `.svg` and re-inline it; the standalone file is the master.
- Night/day theme is remembered in `localStorage` under `soboof.theme`.
- Fonts load from Google Fonts; three.js loads from cdnjs. Both are external CDNs — the site
  degrades gracefully if they are blocked.
