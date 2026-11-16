'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   SOBOOF STUDIO — putting an edit made on the page back into the site's files.

   The editor (editor.js) works on the built page. When it uploads, each new
   line of words comes with the words it replaced, as the browser read them
   (innerHTML). This finds those words in the file they were built from and
   writes the new ones there, so the published HTML carries them and a later
   build keeps them:

     1. the page's own source, src/pages/<page>.html, outside its BUILD regions
        (what is inside one is regenerated from data/ on every build);
     2. data/*.js, inside a string literal, escaped for that literal;
     3. src/partials/ and src/templates/, which every page or every piece shares.

   The browser does not hand back the source byte for byte (an entity becomes
   its character, a self-closed <br/> becomes <br>, single quotes become
   double), so the words are found by a pattern built from them that allows
   for exactly those differences. What cannot be found once, unambiguously,
   is not guessed at: it is kept in data/site.json and put over the page when
   it loads (assets/js/site-edits.js), and the report says so.

   A changed picture of the site's own (/assets/...) is written over that very
   file, in its own format, so everything that shows it shows the new one.
   Anything else (a picture linked from elsewhere) has its address replaced
   in the source, the same way as words.

   Zero dependencies, like the rest of the studio.
   ═══════════════════════════════════════════════════════════════════════════ */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/* ── where a page comes from ───────────────────────────────────────────── */

/** The page a URL path is, as data/pages.js names it, or a piece page. */
function pageOf(repo, urlPath) {
  const p = urlPath.replace(/index\.html$/, '').replace(/\.html$/, '/');
  const norm = p.endsWith('/') ? p : p + '/';
  delete require.cache[require.resolve(path.join(repo, 'data/pages.js'))];
  const pages = require(path.join(repo, 'data/pages.js'));
  for (const [slug, pg] of Object.entries(pages)) {
    const u = pg.url || '/' + pg.out.replace(/index\.html$/, '');
    if (u === norm || u === p) return { kind: 'page', slug, src: `src/pages/${slug}.html` };
  }
  const m = /^\/work\/([^/]+)\/$/.exec(norm);
  if (m) return { kind: 'piece', slug: m[1], src: 'src/templates/artwork.html' };
  return null;
}

/* ── the regions of a file an edit may land in ─────────────────────────── */

/** [start, end) spans of an HTML source that are its own, not BUILD-generated. */
function htmlRegions(text) {
  const spans = [];
  let at = 0;
  const re = /<!-- BUILD:([\w-]+) -->[\s\S]*?<!-- \/BUILD:\1 -->/g;
  let m;
  while ((m = re.exec(text))) {
    spans.push([at, m.index]);
    at = m.index + m[0].length;
  }
  spans.push([at, text.length]);
  return spans;
}

/** The string literals of a JS file: [start, end, quote], start/end inside the quotes. */
function jsStrings(text) {
  const out = [];
  let i = 0;
  const n = text.length;
  while (i < n) {
    const c = text[i];
    if (c === '/' && text[i + 1] === '/') { const e = text.indexOf('\n', i); i = e < 0 ? n : e; continue; }
    if (c === '/' && text[i + 1] === '*') { const e = text.indexOf('*/', i + 2); i = e < 0 ? n : e + 2; continue; }
    if (c === "'" || c === '"' || c === '`') {
      const q = c, s = i + 1;
      let j = s;
      while (j < n && text[j] !== q) {
        if (text[j] === '\\') j++;
        else if (q !== '`' && text[j] === '\n') break;
        j++;
      }
      out.push([s, j, q]);
      i = j + 1;
      continue;
    }
    i++;
  }
  return out;
}

/* ── the pattern a line of words is found by ───────────────────────────── */

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" };
const decode = s => s.replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (w, e) =>
  e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10))
    : ENT[e.toLowerCase()] ?? w);
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');

/**
 * A pattern for words as the browser read them (innerHTML), matching the
 * source they were parsed from: any run of white space as any other, a
 * character or any entity for it, a tag with its attributes however quoted,
 * and, in a JS string, a quote with or without its backslash.
 */
function patternOf(stockHtml, js) {
  const parts = String(stockHtml).trim().split(/(<[^>]+>)/).filter(Boolean);
  let re = '';
  for (const part of parts) {
    if (part[0] === '<') {
      const m = /^<\s*(\/?)\s*([a-z0-9]+)/i.exec(part);
      if (!m) continue;
      const name = m[2].toLowerCase();
      if (name === 'br') { re += '<br\\s*\\/?>'; continue; }
      re += m[1] ? `<\\/${name}\\s*>` : `<${name}\\b[^>]*>`;
      continue;
    }
    const text = decode(part);
    /* In data/*.js a long line is often several literals joined by `+`
       ('…face to ' +\n '…'): a space in the words may stand where one literal
       ends and the next begins. */
    const JOIN = `['"\`]\\s*\\+\\s*['"\`]`;
    const SPACE = js ? `(?:(?: |&nbsp;|&#160;)(?:${JOIN})?|${JOIN}(?: |&nbsp;|&#160;)?)` : '(?: |&nbsp;|&#160;)';
    let lastWs = false;
    for (const ch of text) {
      if (/\s/.test(ch) && ch !== ' ') { if (!lastWs) re += js ? `(?:\\s|${JOIN})+` : '\\s+'; lastWs = true; continue; }
      lastWs = false;
      if (/[A-Za-z0-9]/.test(ch)) { re += ch; continue; }
      const lit = js && (ch === "'" || ch === '"' || ch === '`') ? `\\\\?${reEsc(ch)}` : reEsc(ch);
      re += ch === ' ' ? SPACE : `(?:${lit}|&[A-Za-z0-9#]+;)`;
    }
  }
  return re;
}

/** Every place the words are in a text, inside the given spans: [start, end]. */
function findAll(text, re, spans) {
  const out = [];
  const g = new RegExp(re, 'g');
  let m;
  while ((m = g.exec(text))) {
    const s = m.index, e = s + m[0].length;
    if (m[0].length === 0) { g.lastIndex++; continue; }
    if (spans.some(([a, b]) => s >= a && e <= b)) out.push([s, e, spans.find(([a, b]) => s >= a && e <= b)]);
  }
  return out;
}

/** New words, escaped for the JS string literal they go into. */
function forJs(html, quote) {
  let s = String(html).replace(/\\/g, '\\\\');
  if (quote === '`') return s.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
  return s.replace(new RegExp(quote, 'g'), '\\' + quote).replace(/\r?\n/g, ' ');
}

/* ── the edit itself ───────────────────────────────────────────────────── */

/**
 * Where a line of words is in the site's files: the file, its span and how
 * to write the new words there. `occ` says which of the page's equal lines it
 * was (two "LIVE" tags), counted as the page reads them. Null when it is not
 * in exactly one place this can be sure of.
 */
function locate(repo, page, stock, occ) {
  const read = f => { try { return fs.readFileSync(path.join(repo, f), 'utf8'); } catch { return null; } };
  const tries = [];
  if (page?.src) {
    const t = read(page.src);
    if (t != null) {
      const hits = findAll(t, patternOf(stock, false), htmlRegions(t));
      if (hits.length) {
        const h = hits[Math.min(occ || 0, hits.length - 1)];
        if (hits.length === 1 || occ < hits.length) return { file: page.src, at: h, js: null };
      }
    }
  }
  const data = fs.readdirSync(path.join(repo, 'data')).filter(f => f.endsWith('.js')).map(f => `data/${f}`);
  for (const f of data) {
    const t = read(f);
    if (t == null) continue;
    /* Literals of one quote joined by `+` count as one string, so words that run across the join are found whole. */
    const strs = [];
    for (const s of jsStrings(t)) {
      const last = strs[strs.length - 1];
      if (last && last[2] === s[2] && /^\s*\+\s*$/.test(t.slice(last[1] + 1, s[0] - 1))) last[1] = s[1];
      else strs.push(s.slice());
    }
    for (const h of findAll(t, patternOf(stock, true), strs.map(([a, b]) => [a, b]))) {
      const lit = strs.find(([a, b]) => h[0] >= a && h[1] <= b);
      tries.push({ file: f, at: h, js: lit[2] });
    }
  }
  const shared = ['src/partials', 'src/templates']
    .flatMap(d => { try { return fs.readdirSync(path.join(repo, d)).map(f => `${d}/${f}`); } catch { return []; } })
    .filter(f => f !== page?.src);
  for (const f of shared) {
    const t = read(f);
    if (t == null) continue;
    for (const h of findAll(t, patternOf(stock, false), [[0, t.length]])) tries.push({ file: f, at: h, js: null });
  }
  return tries.length === 1 ? tries[0] : null;
}

/** Write the new words where `locate` found the old ones. */
function writeAt(repo, loc, html, backup) {
  const full = path.join(repo, loc.file);
  const t = fs.readFileSync(full, 'utf8');
  backup(loc.file);
  const body = loc.js ? forJs(html, loc.js) : html;
  fs.writeFileSync(full, t.slice(0, loc.at[0]) + body + t.slice(loc.at[1]), 'utf8');
}

/** A picture's file, if the address is one of the site's own. */
function ownPicture(repo, src) {
  const p = String(src || '').split(/[?#]/)[0];
  if (!/^\/assets\/[^\0]+\.(jpe?g|png|webp|gif|svg)$/i.test(p)) return null;
  const full = path.join(repo, decodeURIComponent(p));
  return full.startsWith(path.join(repo, 'assets')) && fs.existsSync(full) ? { rel: decodeURIComponent(p).slice(1), full } : null;
}

const DATA_URL = /^data:image\/(jpeg|png|webp|gif);base64,([A-Za-z0-9+/=]+)$/;

/**
 * Put every edit of one page where it belongs. Returns what went where, so
 * the editor can say it, and what has to be kept in data/site.json instead.
 *   texts:  [{ key, stock, html, occ }]
 *   images: [{ key, stockSrc, data?, url? }]
 */
function applyEdits(repo, urlPath, texts, images, backup) {
  const page = pageOf(repo, urlPath);
  const report = [];
  const keep = { text: {}, img: {} };
  for (const t of texts || []) {
    if (typeof t.html !== 'string' || typeof t.stock !== 'string' || !t.stock.trim()) continue;
    const loc = locate(repo, page, t.stock, t.occ | 0);
    if (loc) {
      writeAt(repo, loc, t.html, backup);
      report.push({ key: t.key, where: loc.file, ok: true });
    } else {
      keep.text[t.key] = t.html;
      report.push({ key: t.key, where: 'data/site.json', ok: true, note: 'not found once in the sources: applied on the page' });
    }
  }
  for (const im of images || []) {
    const own = ownPicture(repo, im.stockSrc);
    if (im.data) {
      const m = DATA_URL.exec(im.data);
      if (!m) { report.push({ key: im.key, ok: false, note: 'not a picture' }); continue; }
      const buf = Buffer.from(m[2], 'base64');
      if (own) {
        backup(own.rel);
        fs.writeFileSync(own.full, buf);
        report.push({ key: im.key, where: own.rel, ok: true, note: 'the picture file itself, so every page showing it shows the new one' });
        continue;
      }
      const ext = m[1] === 'jpeg' ? 'jpg' : m[1];
      const rel = `assets/img/edits/${crypto.createHash('sha1').update(buf).digest('hex').slice(0, 12)}.${ext}`;
      fs.mkdirSync(path.join(repo, 'assets/img/edits'), { recursive: true });
      fs.writeFileSync(path.join(repo, rel), buf);
      im.url = '/' + rel;
    }
    if (typeof im.url === 'string' && /^(https:\/\/|\/(?!\/))[^\s"'<>]+$/.test(im.url)) {
      const loc = locate(repo, page, String(im.stockSrc), 0);
      if (loc) { writeAt(repo, loc, im.url, backup); report.push({ key: im.key, where: loc.file, ok: true }); }
      else { keep.img[im.key] = im.url; report.push({ key: im.key, where: 'data/site.json', ok: true, note: 'applied on the page' }); }
    }
  }
  return { page, report, keep };
}

module.exports = { pageOf, patternOf, findAll, htmlRegions, jsStrings, forJs, locate, applyEdits };
