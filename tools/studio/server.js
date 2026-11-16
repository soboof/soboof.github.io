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

   And the site itself: http://localhost:4000 is soboof.com as built here,
   with the page editor over it (editor.js, injected into every page served,
   never into the built files). An admin bar across the top, the page under
   it: type over any words, change a picture, move and size the sections and
   cards, set what each 3D slot shows and how it moves. Upload puts the words
   and pictures into the files they came from (edits.js), the rest into
   data/site.json, builds, commits and pushes. The forms that were this page
   are at /studio/ now, with a Keys tab for the GitHub token Upload pushes
   with (keys.js, kept outside the repository).

   Zero dependencies — plain Node, nothing to install. It binds to localhost
   only, so nothing outside this machine can reach it.
   ═══════════════════════════════════════════════════════════════════════════ */

'use strict';

const http = require('http');
const fs   = require('fs');
const path = require('path');
const { execFile, execFileSync } = require('child_process');
const KEYS  = require('./keys.js');
const EDITS = require('./edits.js');
const BLOCKS = require(path.join(path.resolve(__dirname, '..', '..'), 'assets/js/blocks.js'));

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

/** git, with the keys from the Keys tab in its environment, and anything it prints cleared of the token. */
function git(args, opts = {}) {
  return new Promise(resolve => {
    execFile('git', args, { cwd: REPO, maxBuffer: 1 << 24, env: KEYS.gitEnv(), ...opts }, (err, stdout, stderr) => {
      resolve({ ok: !err, code: err ? (err.code ?? 1) : 0, stdout: KEYS.scrub(stdout), stderr: KEYS.scrub(stderr) });
    });
  });
}

/* ── the copy that is online ───────────────────────────────────────────────
   The studio edits the site as it is on GitHub, so before anything it asks
   GitHub what that is. Behind it, and with nothing of its own waiting to go
   up, it can bring this copy level (a fast-forward, never a merge). With
   work of its own here it never touches it: that work goes up with the next
   Upload, or is put aside by hand. */
async function onlineState(fetch = true) {
  const st = await gitState();
  if (!st.repo) return { repo: false };
  let fetched = { ok: true, stderr: '' };
  if (fetch) fetched = await git(['fetch', '--quiet', 'origin']);
  const ab = await git(['rev-list', '--left-right', '--count', 'HEAD...@{u}']);
  const [ahead, behind] = ab.ok ? ab.stdout.trim().split(/\s+/).map(Number) : [0, 0];
  return {
    repo: true, branch: st.branch, lastCommit: st.lastCommit,
    reached: fetched.ok, reachNote: fetched.ok ? '' : (fetched.stderr || 'could not reach GitHub').trim().split('\n').pop(),
    ahead, behind, dirty: st.changedCount, changed: st.changed,
  };
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
${a.keywords.length ? `    keywords: [${a.keywords.map(k => `'${q(k)}'`).join(', ')}],\n` : ''}
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
      keywords: Array.isArray(f.keywords) ? f.keywords.map(String) : [],
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

  /* ── keys ── */
  async 'GET /api/keys'() { return KEYS.keysView(); },
  async 'POST /api/keys'(req) {
    const f = await body(req);
    return KEYS.saveKeys({ token: f.token, name: f.name, email: f.email });
  },
  async 'POST /api/keys/test'() {
    const r = await git(['ls-remote', '--heads', 'origin']);
    return r.ok
      ? { ok: true, note: 'GitHub answered: this machine can read the repository' + (KEYS.keysView().tokenSet ? ' with the token' : '') + '.' }
      : { ok: false, note: (r.stderr || r.stdout || 'no answer').trim().split('\n').slice(-2).join(' ') };
  },

  /* ── the copy that is online ── */
  async 'GET /api/online'() { return onlineState(true); },
  async 'POST /api/online/pull'() {
    const st = await onlineState(true);
    if (!st.repo) return { ok: false, note: 'not a git repository' };
    if (!st.behind) return { ok: true, note: 'Already the copy that is online.', state: st };
    if (st.dirty) return { ok: false, note: `${st.dirty} file(s) here have changes that are not online yet. Upload them first, so nothing of yours is lost.`, state: st };
    if (st.ahead) return { ok: false, note: 'This copy and the online one have each moved on. Bring them together by hand (git pull).', state: st };
    const r = await git(['pull', '--ff-only', '--quiet']);
    return { ok: r.ok, note: r.ok ? `Brought in ${st.behind} change(s) from online.` : (r.stderr || 'pull failed').trim(), state: await onlineState(false) };
  },

  /* ── the page editor ── */
  async 'GET /api/site'() { return readSite(); },
  async 'POST /api/site/upload'(req) {
    const f = await body(req);
    const urlPath = String(f.path || '/');
    const { page, report, keep } = EDITS.applyEdits(REPO, urlPath, f.texts, f.images, backup);
    if (f.site && Array.isArray(f.site.blocks)) {
      f.site.blocks = BLOCKS.cleanBlocks(saveBlockPictures(f.site.blocks));
      report.push({ key: 'blocks', where: 'data/site.json', ok: true, note: `${f.site.blocks.length} added section(s), written into the page by the build` });
    }
    const site = mergeSite(readSite(), f.site, siteKey(page, urlPath), keep);
    if (fs.existsSync(R('data/site.json'))) backup('data/site.json');
    writeRepo('data/site.json', JSON.stringify(site, null, 2) + '\n');
    report.push({ key: 'site', where: 'data/site.json', ok: true, note: 'layout, cards and 3D slots' });
    if (f.publish === false) return { ok: true, report };
    const pub = await routes['POST /api/publish']({ __body: { message: f.message || 'Edit the site in Studio', push: f.push !== false } });
    return { ok: pub.ok, report, log: pub.log, stoppedAt: pub.stoppedAt, pushed: pub.pushed };
  },

  async 'POST /api/build'() {
    return await runBuild();
  },

  async 'POST /api/publish'(req) {
    const f = req.__body || await body(req);
    const message = String(f.message || '').trim() || 'Update site content';
    const log = [];

    const built = await runBuild();
    log.push({ step: 'build', ok: built.ok, output: built.output });
    if (!built.ok) return { ok: false, log, stoppedAt: 'build' };

    const add = await git(['add', '-A']);
    log.push({ step: 'git add', ok: add.ok, output: add.stdout + add.stderr });
    if (!add.ok) return { ok: false, log, stoppedAt: 'git add' };

    const commit = await git([...KEYS.commitIdentity(), 'commit', '-m', message]);
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

/* ── data/site.json: what the page editor keeps that is not in a source file ──
   { v: 1, pages: { <page>: { layout, cards, text, img } }, slots: { <section>: {...} } }
   The editor sends the whole of it for the page it is on (layout, cards) and
   the slots; text and img are the edits edits.js could not place in a source. */
/** The key a page's edits are kept under: a page by its data/pages.js name, a piece as work/<slug> (build.js reads the same). */
const siteKey = (page, urlPath) => (page ? (page.kind === 'piece' ? `work/${page.slug}` : page.slug) : urlPath);

/**
 * A picture put into an added section is uploaded as a data URL. It is
 * written to assets/img/blocks/ under a name made of its own bytes (the same
 * picture twice is one file) and the section points at that file.
 */
function saveBlockPictures(blocks) {
  const save = v => {
    const m = /^data:image\/(jpeg|png|webp|gif);base64,([A-Za-z0-9+/=]+)$/.exec(String(v || ''));
    if (!m) return v;
    const buf = Buffer.from(m[2], 'base64');
    const rel = `assets/img/blocks/${require('crypto').createHash('sha1').update(buf).digest('hex').slice(0, 12)}.${m[1] === 'jpeg' ? 'jpg' : m[1]}`;
    fs.mkdirSync(R('assets/img/blocks'), { recursive: true });
    if (!fs.existsSync(R(rel))) fs.writeFileSync(R(rel), buf);
    return '/' + rel;
  };
  for (const b of blocks || []) for (const r of (b && b.rows) || []) for (const c of (r && r.cols) || []) for (const it of (c && c.items) || []) {
    if (!it) continue;
    if (it.src) it.src = save(it.src);
    if (it.img) it.img = save(it.img);
  }
  return blocks;
}

function readSite() {
  try { const s = JSON.parse(readRepo('data/site.json')); if (s && s.v === 1) return s; } catch {}
  return { v: 1, pages: {}, slots: {} };
}

function mergeSite(site, draft, pageKey, keep) {
  const out = { v: 1, pages: { ...(site.pages || {}) }, slots: { ...(site.slots || {}) } };
  const d = draft && typeof draft === 'object' ? draft : {};
  const pg = { ...(out.pages[pageKey] || {}) };
  if (d.layout && typeof d.layout === 'object') pg.layout = d.layout;
  if (d.cards && typeof d.cards === 'object') pg.cards = d.cards;
  if (Array.isArray(d.dropText)) for (const k of d.dropText) if (pg.text) delete pg.text[k];
  if (Array.isArray(d.dropImg)) for (const k of d.dropImg) if (pg.img) delete pg.img[k];
  if (Array.isArray(d.blocks)) { if (d.blocks.length) pg.blocks = d.blocks; else delete pg.blocks; }
  pg.text = { ...(pg.text || {}), ...keep.text };
  pg.img = { ...(pg.img || {}), ...keep.img };
  for (const k of ['text', 'img', 'cards']) if (pg[k] && !Object.keys(pg[k]).length) delete pg[k];
  if (pg.layout && !Object.keys(pg.layout).length) delete pg.layout;
  if (Object.keys(pg).length) out.pages[pageKey] = pg; else delete out.pages[pageKey];
  if (d.slots && typeof d.slots === 'object') out.slots = d.slots;
  return out;
}

function nextCode(artworks) {
  const highest = artworks.reduce((m, a) => {
    const n = Number(String(a.code).replace(/\D/g, ''));
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 0);
  return `SBF · ${String(highest + 1).padStart(3, '0')}`;
}

/* ── the site, served as built, with the editor over it ───────────────── */

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon', '.obj': 'text/plain; charset=utf-8',
  '.gltf': 'model/gltf+json', '.glb': 'model/gltf-binary', '.mp4': 'video/mp4', '.webm': 'video/webm', '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8',
};
const EDITOR_TAGS = '\n<link rel="stylesheet" href="/studio/editor.css">\n<script src="/studio/editor.js"></script>\n';

function serveSite(url, res) {
  let rel = decodeURIComponent(url.pathname).replace(/^\/+/, '');
  if (!rel || rel.endsWith('/')) rel += 'index.html';
  let full = R(rel);
  if (!full.startsWith(REPO) || rel.split('/').some(p => p.startsWith('.')) || rel.startsWith('tools/') || rel.startsWith('node_modules/')) {
    res.writeHead(404, { 'content-type': 'text/plain' }); return res.end('not found');
  }
  if (fs.existsSync(full) && fs.statSync(full).isDirectory()) full = path.join(full, 'index.html');
  if (!fs.existsSync(full) && fs.existsSync(full + '.html')) full += '.html';
  if (!fs.existsSync(full)) {
    const nf = R('404.html');
    res.writeHead(404, { 'content-type': TYPES['.html'], 'cache-control': 'no-store' });
    return res.end(fs.existsSync(nf) ? fs.readFileSync(nf) : 'not found');
  }
  const ext = path.extname(full).toLowerCase();
  if (ext === '.html') {
    let html = fs.readFileSync(full, 'utf8');
    const at = html.lastIndexOf('</body>');
    html = at < 0 ? html + EDITOR_TAGS : html.slice(0, at) + EDITOR_TAGS + html.slice(at);
    res.writeHead(200, { 'content-type': TYPES['.html'], 'cache-control': 'no-store' });
    return res.end(html);
  }
  res.writeHead(200, { 'content-type': TYPES[ext] || 'application/octet-stream', 'cache-control': 'no-store' });
  return res.end(fs.readFileSync(full));
}

/* ── server ────────────────────────────────────────────────────────────── */

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const key = `${req.method} ${url.pathname}`;

  if (routes[key]) {
    try { return json(res, 200, await routes[key](req)); }
    catch (e) { return json(res, 500, { ok: false, problems: [e.message] }); }
  }

  /* The forms (sculpture, poster, publish, keys) are /studio/ now. */
  if (req.method === 'GET' && (url.pathname === '/studio' || url.pathname === '/studio/' || url.pathname === '/studio/index.html')) {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
    return res.end(fs.readFileSync(path.join(HERE, 'index.html')));
  }
  if (req.method === 'GET' && /^\/studio\/(editor\.js|editor\.css)$/.test(url.pathname)) {
    const name = url.pathname.slice('/studio/'.length);
    res.writeHead(200, { 'content-type': TYPES[path.extname(name)], 'cache-control': 'no-store' });
    return res.end(fs.readFileSync(path.join(HERE, name)));
  }

  /* Everything else is the site as built here, with the editor put over every page. */
  if (req.method === 'GET') return serveSite(url, res);

  res.writeHead(404, { 'content-type': 'text/plain' });
  res.end('not found');
});

/* ── starting: the desktop icon and studio.cmd run `server.js --open` ──────
   With --open the browser is opened once the server is listening, so the
   first page never meets a server that is not up yet. If Studio is already
   running (the icon clicked twice), the port is taken: this asks that Studio
   whether it is one, opens the browser on it, and leaves quietly (exit 0,
   which studio.cmd closes on). Anything else on the port is an error. */
const OPEN = process.argv.includes('--open');
const HOME = `http://localhost:${PORT}/`;

function openBrowser(url) {
  const cmd = process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]]
    : process.platform === 'darwin' ? ['open', [url]] : ['xdg-open', [url]];
  try { execFile(cmd[0], cmd[1], { windowsHide: true }, () => {}); } catch { /* the address is printed anyway */ }
}

server.on('error', async e => {
  if (e.code !== 'EADDRINUSE') { console.error(`\n  Studio could not start: ${e.message}\n`); process.exit(1); }
  let studio = false;
  try { studio = (await fetch(`http://127.0.0.1:${PORT}/api/keys`)).ok; } catch {}
  if (studio) {
    console.log(`\n  Soboof Studio is already running: opening ${HOME}\n`);
    if (OPEN) openBrowser(HOME);
    process.exit(0);
  }
  console.error(`\n  Port ${PORT} is taken by another program, so Studio cannot start.` +
    `\n  Close that program, or start Studio on another port: set PORT=4001 and run studio.cmd again.\n`);
  process.exit(1);
});

server.listen(PORT, '127.0.0.1', () => {
  let where = REPO;
  try { where = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: REPO }).toString().trim(); } catch {}
  console.log(`
  Soboof Studio
  ─────────────
  repo    ${where}
  open    http://localhost:${PORT}          the site, with the editor
          http://localhost:${PORT}/studio/   add work, publish, keys

  Leave this window open while you work. Ctrl+C to stop.
`);
  if (OPEN) openBrowser(HOME);
});