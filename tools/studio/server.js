#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   SOBOOF STUDIO — a local desk for adding work to the site.

     node tools/studio/server.js

   Then open http://localhost:4000 in a browser. Add a sculpture or a poster,
   press Publish, and it goes to GitHub. No AI, no terminal, no editing files
   by hand.

   What it does, in order:
     1. writes the photos into assets/img/ at the right names and sizes
     2. appends the entry to data/artworks.js or data/prints.js
     3. runs build.js so every page, count and sitemap is regenerated
     4. git add / commit / push

   Zero dependencies — plain Node, nothing to install. It binds to localhost
   only, so nothing outside this machine can reach it.
   ═══════════════════════════════════════════════════════════════════════════ */

'use strict';

const http = require('http');
const fs   = require('fs');
const path = require('path');
const { execFile, execFileSync } = require('child_process');

const REPO = path.resolve(__dirname, '..', '..');
const HERE = __dirname;
const PORT = Number(process.env.PORT) || 4000;

/* ── small helpers ─────────────────────────────────────────────────────── */

const R = f => path.join(REPO, f);
const readRepo  = f => fs.readFileSync(R(f), 'utf8');
const writeRepo = (f, s) => fs.writeFileSync(R(f), s, 'utf8');

/** Keep a copy before every data-file write, so a bad run is recoverable. */
function backup(file) {
  const dir = R('tools/studio/backups');
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  fs.copyFileSync(R(file), path.join(dir, `${path.basename(file)}.${stamp}.bak`));
}

/** Escape for a single-quoted JS string literal. */
const q = s => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, ' ').trim();
/** Escape for a backtick template literal (description keeps its HTML). */
const bt = s => String(s).replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${').trim();

const slugify = s => String(s).toLowerCase().trim()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** Ordinal words the catalogue already uses: 1st edition, 2nd edition, … */
const ordinal = n => n + (['th','st','nd','rd'][(n % 100 - 20) % 10] || ['th','st','nd','rd'][n % 100] || 'th');

/* ── reading current state ─────────────────────────────────────────────── */

function loadData() {
  /* require() caches, and the files change under us — drop the cache first. */
  delete require.cache[require.resolve(R('data/artworks.js'))];
  delete require.cache[require.resolve(R('data/prints.js'))];
  return {
    artworks: require(R('data/artworks.js')),
    prints:   require(R('data/prints.js')),
  };
}

function git(args, opts = {}) {
  return new Promise(resolve => {
    execFile('git', args, { cwd: REPO, maxBuffer: 1 << 24, ...opts }, (err, stdout, stderr) => {
      resolve({ ok: !err, code: err ? (err.code ?? 1) : 0, stdout: String(stdout), stderr: String(stderr) });
    });
  });
}

async function gitState() {
  const inRepo = await git(['rev-parse', '--is-inside-work-tree']);
  if (!inRepo.ok) return { repo: false };
  const [branch, remote, status, head] = await Promise.all([
    git(['rev-parse', '--abbrev-ref', 'HEAD']),
    git(['remote', 'get-url', 'origin']),
    git(['status', '--porcelain']),
    git(['log', '-1', '--format=%h %s']),
  ]);
  const changed = status.stdout.split('\n').filter(Boolean);
  return {
    repo: true,
    branch: branch.stdout.trim() || '(no commits yet)',
    remote: remote.ok ? remote.stdout.trim() : null,
    lastCommit: head.ok ? head.stdout.trim() : null,
    changedCount: changed.length,
    changed: changed.slice(0, 40),
  };
}

/* ── writing images ────────────────────────────────────────────────────── */

/** Browser sends "data:image/jpeg;base64,…" — already resized and encoded. */
function saveDataUrl(dataUrl, destRel) {
  const m = /^data:image\/(jpeg|png);base64,(.+)$/s.exec(dataUrl || '');
  if (!m) throw new Error('image was not a JPEG or PNG data URL');
  const buf = Buffer.from(m[2], 'base64');
  if (!buf.length) throw new Error('image was empty');
  fs.mkdirSync(path.dirname(R(destRel)), { recursive: true });
  fs.writeFileSync(R(destRel), buf);
  return { file: destRel, bytes: buf.length };
}

/* ── appending an artwork ──────────────────────────────────────────────── */

function artworkEntry(a) {
  const cats = a.categories.map(c => `'${q(c)}'`).join(', ');
  const tags = a.formTags.map(t => `'${q(t)}'`).join(', ');
  return `  {
    slug:      '${q(a.slug)}',
    code:      '${q(a.code)}',
    name:      '${q(a.name)}',
    subtitle:  '${q(a.subtitle)}',
    imgPrefix: '${q(a.imgPrefix)}',
    photos:    ${a.photos},

    edition:      '${q(a.edition)}',
    editionLabel: '${q(a.editionLabel)}',
    galleryBadge: '${q(a.galleryBadge)}',
    editionSpec:  '${q(a.editionSpec)}',
    availability: '${q(a.availability)}',

    categories: [${cats}],
    filters:    '${q(a.filters)}',
    featured:   ${a.featured ? `'${q(a.featured)}'` : 'null'},

    dims:   { l: ${a.dims.l}, w: ${a.dims.w}, h: ${a.dims.h}, weight: ${a.dims.weight} },
    price:  { regular: '${q(a.price.regular)}', sale: '${q(a.price.sale)}' },

    metaTitle: '${q(a.metaTitle)}',
    metaDesc:  '${q(a.metaDesc)}',

    cardDesc: '${q(a.cardDesc)}',

    description: \`${bt(a.description)}\`,

    schemaDesc: '${q(a.schemaDesc)}',

    formTags: [${tags}],
    manifestPrimitive: '${q(a.manifestPrimitive)}',
  },`;
}

function appendArtwork(entryText) {
  const file = 'data/artworks.js';
  const s = readRepo(file);
  const at = s.lastIndexOf('];');
  if (at < 0) throw new Error('could not find the end of the array in data/artworks.js');
  backup(file);
  writeRepo(file, s.slice(0, at).replace(/\s*$/, '\n\n') + entryText + '\n\n' + s.slice(at));
}

/* ── appending a poster ────────────────────────────────────────────────── */

function appendPrint(prefix, caption) {
  const file = 'data/prints.js';
  const s = readRepo(file);

  const pAt = s.indexOf(`prefix: '${prefix}'`);
  if (pAt < 0) throw new Error(`no set with prefix '${prefix}' in data/prints.js`);
  const listAt = s.indexOf('prints: [', pAt);
  if (listAt < 0) throw new Error(`set '${prefix}' has no prints array`);
  const endAt = s.indexOf('\n      ],', listAt);
  if (endAt < 0) throw new Error(`could not find the end of the prints array for '${prefix}'`);

  backup(file);
  const line = `\n        '${q(caption)}',`;
  writeRepo(file, s.slice(0, endAt) + line + s.slice(endAt));
}

/* ── running the build ─────────────────────────────────────────────────── */

function runBuild() {
  return new Promise(resolve => {
    execFile(process.execPath, ['build.js'], { cwd: REPO, maxBuffer: 1 << 24 },
      (err, stdout, stderr) => resolve({
        ok: !err, output: String(stdout) + String(stderr),
      }));
  });
}

/* ── request handling ──────────────────────────────────────────────────── */

const json = (res, code, body) => {
  const s = JSON.stringify(body);
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(s);
};

function body(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', c => {
      size += c.length;
      if (size > 200 * 1024 * 1024) { reject(new Error('upload too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); }
      catch (e) { reject(new Error('could not read the form data: ' + e.message)); }
    });
    req.on('error', reject);
  });
}

/* ── validation, mirroring build.js so problems surface here first ─────── */

function validateArtwork(f, artworks) {
  const bad = [];
  const need = ['name', 'subtitle', 'metaTitle', 'metaDesc', 'cardDesc', 'description', 'schemaDesc'];
  for (const k of need) if (!String(f[k] || '').trim()) bad.push(`${k} is required`);

  const slug = slugify(f.slug || f.name || '');
  if (!slug) bad.push('slug could not be derived — give the piece a name');
  if (artworks.some(a => a.slug === slug)) bad.push(`slug "${slug}" is already used by another piece`);

  const reserved = ['index', 'gallery', 'mirbreak', 'printing-lab', 'workshop', 'about', 'journal', '404', 'sitemap'];
  if (reserved.includes(slug)) bad.push(`slug "${slug}" is a site page name — pick another`);

  if (!Array.isArray(f.categories) || !f.categories.length) bad.push('pick at least one category');
  if (!Array.isArray(f.formTags) || !f.formTags.length) bad.push('pick at least one form tag');
  if (!Array.isArray(f.photos) || !f.photos.length) bad.push('add at least one photo');

  for (const k of ['l', 'w', 'h', 'weight']) {
    const v = Number(f.dims?.[k]);
    if (!Number.isFinite(v) || v <= 0) bad.push(`dimension "${k}" must be a number greater than zero`);
  }
  if (f.edition === 'sale' && !String(f.price?.sale || '').trim()) {
    bad.push('a sale piece needs a sale price');
  }
  return { problems: bad, slug };
}

/* ── routes ────────────────────────────────────────────────────────────── */

const routes = {

  async 'GET /api/state'() {
    const { artworks, prints } = loadData();
    return {
      artworks: artworks.map(a => ({ code: a.code, slug: a.slug, name: a.name, photos: a.photos })),
      nextCode: nextCode(artworks),
      sets: prints.sets.map(s => ({ name: s.name, prefix: s.prefix, count: s.prints.length })),
      git: await gitState(),
    };
  },

  async 'POST /api/artwork'(req) {
    const f = await body(req);
    const { artworks } = loadData();
    const { problems, slug } = validateArtwork(f, artworks);
    if (problems.length) return { ok: false, problems };

    const code   = nextCode(artworks);
    const prefix = slugify(f.imgPrefix || slug);

    /* Photos first: if one fails, the data file is still untouched. */
    const written = [];
    try {
      f.photos.forEach((p, i) => {
        written.push(saveDataUrl(p, `assets/img/${prefix}-${String(i + 1).padStart(2, '0')}.jpg`));
      });
    } catch (e) {
      written.forEach(w => { try { fs.unlinkSync(R(w.file)); } catch {} });
      return { ok: false, problems: ['photo could not be saved: ' + e.message] };
    }

    const ord   = Number(f.editionNumber) || 1;
    const spec  = f.edition === 'ooak' ? 'One of a kind' : `${ordinal(ord)} edition`;
    const label = f.edition === 'ooak' ? 'ONE OF A KIND' : `${ordinal(ord).toUpperCase()} EDITION`;

    const a = {
      slug, code, name: f.name, subtitle: f.subtitle,
      imgPrefix: prefix, photos: f.photos.length,
      edition: f.edition,
      editionLabel: label,
      galleryBadge: f.edition === 'sale' ? `SALE · ${ordinal(ord).toUpperCase()} ED.` : label,
      editionSpec: spec,
      availability: `${spec} · Enquire for availability`,
      categories: f.categories,
      filters: (f.filters || []).join(' '),
      featured: f.featured || null,
      dims: { l: +f.dims.l, w: +f.dims.w, h: +f.dims.h, weight: +f.dims.weight },
      price: { regular: String(f.price?.regular || ''), sale: String(f.price?.sale || '') },
      metaTitle: f.metaTitle, metaDesc: f.metaDesc, cardDesc: f.cardDesc,
      description: f.description, schemaDesc: f.schemaDesc,
      formTags: f.formTags, manifestPrimitive: f.manifestPrimitive || 'MODULAR<br>FORM',
    };

    try { appendArtwork(artworkEntry(a)); }
    catch (e) {
      written.forEach(w => { try { fs.unlinkSync(R(w.file)); } catch {} });
      return { ok: false, problems: ['data/artworks.js could not be updated: ' + e.message] };
    }

    return { ok: true, added: { code, slug, photos: written.length },
             note: `${slug}.html will be generated by the build.` };
  },

  async 'POST /api/poster'(req) {
    const f = await body(req);
    const { prints } = loadData();
    const set = prints.sets.find(s => s.prefix === f.set);
    if (!set) return { ok: false, problems: ['pick a collection'] };
    if (!String(f.caption || '').trim()) return { ok: false, problems: ['the caption is required'] };
    if (!f.image) return { ok: false, problems: ['add the scan'] };

    const n    = set.prints.length + 1;
    const dest = `assets/img/death-culture/${set.prefix}-${String(n).padStart(2, '0')}.jpg`;
    if (fs.existsSync(R(dest))) {
      return { ok: false, problems: [`${dest} already exists — the data file and the folder are out of step`] };
    }

    let saved;
    try { saved = saveDataUrl(f.image, dest); }
    catch (e) { return { ok: false, problems: ['scan could not be saved: ' + e.message] }; }

    try { appendPrint(set.prefix, f.caption); }
    catch (e) {
      try { fs.unlinkSync(R(dest)); } catch {}
      return { ok: false, problems: ['data/prints.js could not be updated: ' + e.message] };
    }

    return { ok: true, added: { set: set.name, sheet: n, file: dest, kb: Math.round(saved.bytes / 1024) } };
  },

  async 'POST /api/build'() {
    return await runBuild();
  },

  async 'POST /api/publish'(req) {
    const f = await body(req);
    const message = String(f.message || '').trim() || 'Update site content';
    const log = [];

    const built = await runBuild();
    log.push({ step: 'build', ok: built.ok, output: built.output });
    if (!built.ok) return { ok: false, log, stoppedAt: 'build' };

    const add = await git(['add', '-A']);
    log.push({ step: 'git add', ok: add.ok, output: add.stdout + add.stderr });
    if (!add.ok) return { ok: false, log, stoppedAt: 'git add' };

    const commit = await git(['commit', '-m', message]);
    const nothing = /nothing to commit/i.test(commit.stdout + commit.stderr);
    log.push({ step: 'git commit', ok: commit.ok || nothing, output: commit.stdout + commit.stderr });
    if (!commit.ok && !nothing) return { ok: false, log, stoppedAt: 'git commit' };

    if (f.push === false) return { ok: true, log, pushed: false };

    const push = await git(['push']);
    log.push({ step: 'git push', ok: push.ok, output: push.stdout + push.stderr });
    if (!push.ok) return { ok: false, log, stoppedAt: 'git push' };

    return { ok: true, log, pushed: true };
  },
};

function nextCode(artworks) {
  const highest = artworks.reduce((m, a) => {
    const n = Number(String(a.code).replace(/\D/g, ''));
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 0);
  return `SBF · ${String(highest + 1).padStart(3, '0')}`;
}

/* ── server ────────────────────────────────────────────────────────────── */

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const key = `${req.method} ${url.pathname}`;

  if (routes[key]) {
    try { return json(res, 200, await routes[key](req)); }
    catch (e) { return json(res, 500, { ok: false, problems: [e.message] }); }
  }

  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
    return res.end(fs.readFileSync(path.join(HERE, 'index.html')));
  }

  /* Let the desk preview the real site's images. */
  if (req.method === 'GET' && url.pathname.startsWith('/assets/')) {
    const f = R(decodeURIComponent(url.pathname).replace(/^\//, ''));
    if (f.startsWith(R('assets')) && fs.existsSync(f)) {
      res.writeHead(200, { 'content-type': 'image/jpeg' });
      return res.end(fs.readFileSync(f));
    }
  }

  res.writeHead(404, { 'content-type': 'text/plain' });
  res.end('not found');
});

server.listen(PORT, '127.0.0.1', () => {
  let where = REPO;
  try { where = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: REPO }).toString().trim(); } catch {}
  console.log(`
  Soboof Studio
  ─────────────
  repo    ${where}
  open    http://localhost:${PORT}

  Leave this window open while you work. Ctrl+C to stop.
`);
});
