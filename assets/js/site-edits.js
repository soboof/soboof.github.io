/* ═══════════════════════════════════════════════════════════════════════════
   EDITS MADE ON THE PAGE IN STUDIO, PUT OVER THE PAGE AS IT LOADS

   Studio's page editor (tools/studio/editor.js) writes words and pictures
   back into the site's own sources, so most edits are simply in the HTML.
   What has no source to live in is kept in data/site.json and handed to the
   page by the build as <script id="sbf-site">:

     layout  sections moved or hidden, which side a section's 3D slot is on,
             and how many columns a grid of cards has;
     cards   a card's place in its grid, its size, or that it is hidden;
     text    words that could not be found exactly once in a source;
     img     the same, for a picture.

   The homepage's 3D slots ride in the same block and are read by
   home-scene.js.

   How an edit finds its element, so the editor and this file always agree:
   each is named by what it is (t: words, i: a picture, c: a card, g: a grid)
   and a hash of what the page shipped with there (the words, the picture's
   address, the card's text), numbered where the same thing comes twice. A
   section is named by its id. So moving markup around keeps its edits, and an
   element whose stock content changed no longer matches: its edit is left
   unused rather than put over words it was not made for.

   window.SBF is what the editor uses: the index, and the same appliers.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /** FNV-1a, base 36: short, and the same in every browser. */
  function hash(s) {
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h.toString(36);
  }
  const norm = s => String(s || '').replace(/\s+/g, ' ').trim();

  const SKIP = 'script,style,svg,canvas,noscript,template,.model-rail,#scene-state-hud,.sbf-ui,.sbf-block,[data-sbf-skip]';
  const TEXT = 'h1,h2,h3,h4,h5,h6,p,li,figcaption,blockquote,dt,dd,label,small,a,button,div,span,strong,em';
  const BLOCK = 'div,p,ul,ol,li,section,article,aside,h1,h2,h3,h4,h5,h6,table,figure,img,picture,svg,canvas,video,iframe,blockquote,form,input,select,textarea,button,header,footer,nav,main,dl,hr';

  /** Words that may be typed in: text, line breaks and the inline marks the site's copy uses, links kept. */
  /* Classes, and a span's inline style, are kept: the site's own copy uses them
     (the hero's second line is a span with its own size), and an edit written
     back into a source must not strip what was there. Nothing that runs. */
  const KEEP = { B: ['class'], STRONG: ['class'], I: ['class'], EM: ['class'], BR: [], SMALL: ['class'], SUP: [], SUB: [], CODE: [],
    SPAN: ['class', 'style'], A: ['href', 'target', 'rel', 'class'] };
  function cleanHtml(html) {
    const box = document.createElement('div');
    box.innerHTML = String(html || '');
    (function walk(node) {
      for (const ch of Array.from(node.childNodes)) {
        if (ch.nodeType === 3) continue;
        if (ch.nodeType !== 1) { ch.remove(); continue; }
        const keep = KEEP[ch.tagName];
        if (!keep) {
          if (/^(SCRIPT|STYLE|IFRAME|OBJECT|EMBED|TEMPLATE)$/.test(ch.tagName)) { ch.remove(); continue; }
          if (/^(DIV|P)$/.test(ch.tagName) && ch.previousSibling) node.insertBefore(document.createElement('br'), ch);
          walk(ch);
          while (ch.firstChild) node.insertBefore(ch.firstChild, ch);
          ch.remove();
          continue;
        }
        for (const a of Array.from(ch.attributes)) if (!keep.includes(a.name)) ch.removeAttribute(a.name);
        if (/url\(|expression|javascript:/i.test(ch.getAttribute('style') || '')) ch.removeAttribute('style');
        if (ch.tagName === 'A') {
          const href = ch.getAttribute('href') || '';
          if (!/^(https?:|mailto:|tel:|\/|#)/i.test(href)) ch.removeAttribute('href');
        }
        walk(ch);
      }
    })(box);
    return box.innerHTML.replace(/(<br>\s*)+$/, '').trim().slice(0, 20000);
  }
  const cleanSrc = s => (/^(https:\/\/|\/(?!\/))[^\s"'<>]+$/.test(String(s || '')) || /^data:image\/(jpeg|png|webp|gif);base64,/.test(String(s || '')) ? String(s) : null);

  /* ── the index ────────────────────────────────────────────────────────── */
  function counted(items, of) {
    const seen = {};
    for (const it of items) { const h = of(it); const n = seen[h] = (seen[h] || 0) + 1; it.occ = n - 1; it.key += h + (n > 1 ? '.' + (n - 1) : ''); }
    return items;
  }
  /** A grid of cards: a CSS grid whose children are alike (one tag, one first class), two or more. */
  function isCardGrid(el) {
    const kids = Array.from(el.children).filter(k => !k.matches('script,style'));
    if (kids.length < 2) return false;
    if (getComputedStyle(el).display !== 'grid') return false;
    const sig = k => k.tagName + '.' + (k.classList[0] || '');
    return kids.every(k => sig(k) === sig(kids[0]));
  }

  let IDX = null;
  function index() {
    if (IDX) return IDX;
    const root = document.body;
    const inSkip = el => !!el.closest(SKIP);
    /* Words: the outermost element holding only inline content. */
    const leaves = [];
    for (const el of root.querySelectorAll(TEXT)) {
      if (inSkip(el) || !norm(el.textContent)) continue;
      if (el.querySelector(BLOCK)) continue;
      if (leaves.some(p => p.contains(el))) continue;
      leaves.push(el);
    }
    const texts = counted(leaves.map(el => ({ key: 't:', el, stock: el.innerHTML.trim() })), it => hash(norm(it.stock)));
    const imgs = counted(Array.from(root.querySelectorAll('img')).filter(el => !inSkip(el) && el.getAttribute('src'))
      .map(el => ({ key: 'i:', el, stockSrc: el.getAttribute('src') })), it => hash(it.stockSrc));
    const gridEls = Array.from(root.querySelectorAll('div,ul,ol,section')).filter(el => !inSkip(el) && !el.closest('header,footer') && isCardGrid(el));
    const grids = counted(gridEls.map(el => ({ key: 'g:', el })), it => hash(it.el.className + '|' + it.el.children.length));
    const cards = [];
    for (const g of grids) {
      const items = counted(Array.from(g.el.children).map((el, i) => ({ key: 'c:', el, grid: g.key, at: i })), it => hash(g.key + '|' + norm(it.el.textContent).slice(0, 160) + '|' + ((it.el.querySelector('img') || {}).src || '')));
      cards.push(...items);
    }
    const sections = Array.from(root.querySelectorAll('section[id]')).filter(el => !el.parentElement.closest('section') && !inSkip(el))
      .map(el => ({ id: el.id, el, rail: el.querySelector(':scope > .model-rail'), stockSide: el.classList.contains('rail-left') ? 'left' : el.classList.contains('rail-right') ? 'right' : null }));
    /* Where the sections stood, so a new order is put into the same places. */
    const slots = sections.map(s => ({ parent: s.el.parentNode, mark: document.createComment('sbf-slot') }));
    sections.forEach((s, i) => s.el.parentNode.insertBefore(slots[i].mark, s.el));
    texts.forEach(t => (t.el.__sbfText = t));
    imgs.forEach(t => (t.el.__sbfImg = t));
    cards.forEach(t => (t.el.__sbfCard = t));
    IDX = { texts, imgs, grids, cards, sections, slots };
    return IDX;
  }

  /* ── putting the edits over the page ──────────────────────────────────── */
  let styled = false;
  function ensureStyle() {
    if (styled) return;
    styled = true;
    const css = ['[data-sbf-hidden]{display:none!important}',
      '@media(min-width:901px){[data-sbf-size="wide"]{grid-column:span 2}[data-sbf-size="full"]{grid-column:1/-1}' +
      [1, 2, 3, 4, 5, 6].map(n => `[data-sbf-cols="${n}"]{grid-template-columns:repeat(${n},minmax(0,1fr))!important}`).join('') + '}'].join('\n');
    const st = document.createElement('style');
    st.id = 'sbf-site-style';
    st.textContent = css;
    document.head.appendChild(st);
  }

  function applyText(text, img) {
    const ix = index();
    for (const t of ix.texts) t.el.innerHTML = text && typeof text[t.key] === 'string' ? cleanHtml(text[t.key]) : t.stock;
    for (const t of ix.imgs) {
      const src = img && cleanSrc(img[t.key]);
      if (src) { t.el.setAttribute('src', src); t.el.removeAttribute('srcset'); } else if (t.el.getAttribute('src') !== t.stockSrc) t.el.setAttribute('src', t.stockSrc);
    }
  }
  function applyCards(cards) {
    ensureStyle();
    const c = cards || {};
    for (const t of index().cards) {
      const s = c[t.key] || {};
      if (Number.isFinite(s.o)) t.el.style.order = String(s.o); else t.el.style.removeProperty('order');
      if (s.size === 'wide' || s.size === 'full') t.el.dataset.sbfSize = s.size; else delete t.el.dataset.sbfSize;
      if (s.hidden) t.el.dataset.sbfHidden = ''; else delete t.el.dataset.sbfHidden;
    }
  }
  function applyLayout(layout) {
    ensureStyle();
    const L = layout || {};
    const ix = index();
    const ids = ix.sections.map(s => s.id);
    const order = (Array.isArray(L.order) ? L.order.filter(id => ids.includes(id)) : []);
    for (const id of ids) if (!order.includes(id)) order.push(id);
    order.forEach((id, i) => {
      const s = ix.sections.find(x => x.id === id);
      const slot = ix.slots[i];
      slot.mark.parentNode.insertBefore(s.el, slot.mark.nextSibling);
    });
    const hidden = Array.isArray(L.hidden) ? L.hidden : [];
    for (const s of ix.sections) {
      if (hidden.includes(s.id)) s.el.dataset.sbfHidden = ''; else delete s.el.dataset.sbfHidden;
      const side = (L.side && L.side[s.id]) || s.stockSide;
      if (s.stockSide && side) { s.el.classList.toggle('rail-left', side === 'left'); s.el.classList.toggle('rail-right', side === 'right'); }
    }
    for (const g of ix.grids) {
      const n = L.cols && L.cols[g.key];
      if (n >= 1 && n <= 6) g.el.dataset.sbfCols = String(n | 0); else delete g.el.dataset.sbfCols;
    }
    placeBlocks();
    window.dispatchEvent(new Event('resize'));
  }
  /**
   * Sections added in Studio (assets/js/blocks.js) stand after another
   * section (data-after: its id, another added section's, 'top' or 'end').
   * The build writes them there; this puts them back there after the layout
   * moved the page's own sections, and the editor calls it when one moves.
   * `list` is [{ id, after }] in their order; the page's own order without it.
   */
  function placeBlocks(list) {
    const items = (list || Array.from(document.querySelectorAll('section.sbf-block')).map(el => ({ id: el.id, after: el.dataset.after })))
      .map(b => ({ ...b, el: document.getElementById(b.id) })).filter(b => b.el);
    const own = () => Array.from(document.querySelectorAll('section[id]')).filter(s => !s.classList.contains('sbf-block') && !s.parentElement.closest('section'));
    const placed = new Set();
    let lastTop = null;
    for (let pass = 0; pass < 3; pass++) {
      for (const b of items) {
        if (placed.has(b.id)) continue;
        if (b.after === 'top') {
          const first = own()[0];
          if (lastTop) lastTop.after(b.el); else if (first) first.before(b.el);
          lastTop = b.el;
        } else if (b.after !== 'end' && document.getElementById(b.after) && (!/^b-/.test(b.after) || placed.has(b.after))) {
          document.getElementById(b.after).after(b.el);
        } else if (b.after === 'end' || pass === 2 || !document.getElementById(b.after)) {
          const foot = document.querySelector('body > footer') || document.querySelector('footer');
          if (foot) foot.before(b.el); else document.body.appendChild(b.el);
        } else continue;
        b.el.dataset.after = b.after;
        placed.add(b.id);
      }
    }
  }
  function apply(page) {
    const p = page || {};
    applyText(p.text, p.img);
    applyCards(p.cards);
    applyLayout(p.layout);
    applyZ(p.z);
    /* An added section, or something in one, may carry a layer of its own (assets/js/blocks.js). */
    if (document.querySelector('section.sbf-block[style*="z-index"], .sbf-block [style*="z-index"]')) layering(true);
  }

  /* ── layers ───────────────────────────────────────────────────────────────
     Any edited element can be given a layer (`z`, by its key: words, a
     picture, a card, or a section as `s:<id>`, the hero as `s:hero`): below 0
     it stands behind the 3D models, above 0 in front of them, and a higher
     number in front of a lower one where they overlap.
     The page as built made every section a layer of its own at 2 over the
     3D canvas at 1, which kept anything inside a section from ever going
     behind the models. With a layer set, the canvas goes to 0 and the
     sections to auto: the canvas comes first in the page, so everything is
     painted over it as before, and a layer number now counts against the
     canvas wherever the element is. */
  /* body{isolation:isolate}: the page paints its background on <body>, and an element with a negative layer was
     drawn under that background and vanished. Made the frame layers count in, the page reads: its background,
     what is set behind, the 3D models, the rest of the page. */
  let layered = false;
  function layering(on) {
    if (!on || layered) return;
    layered = true;
    const st = document.createElement('style');
    st.id = 'sbf-layers';
    /* An element behind the canvas sits under its section and the boxes around it, which would take its clicks:
       those let clicks through to their children (data-sbf-pass, set by applyZ), so it still takes its own. */
    st.textContent = 'body{isolation:isolate}#scene-canvas{z-index:0!important}.hero,body>section,section.sbf-block,body>footer{z-index:auto!important}'
      + '[data-sbf-pass]{pointer-events:none}[data-sbf-pass]>:not([data-sbf-pass]){pointer-events:auto}';
    document.head.appendChild(st);
  }
  const KEY_Z = /^(t|i|c|s):[A-Za-z0-9_.:-]{1,80}$/;
  /** The element a layer key names, or null. */
  function layerEl(key) {
    const ix = index();
    if (key.startsWith('s:')) {
      const id = key.slice(2);
      return id === 'hero' ? document.querySelector('.hero') : document.getElementById(id);
    }
    const hit = ix.texts.find(t => t.key === key) || ix.imgs.find(t => t.key === key) || ix.cards.find(t => t.key === key);
    return hit ? hit.el : null;
  }
  let zDone = [];
  function applyZ(z) {
    document.querySelectorAll('[data-sbf-pass]').forEach(el => el.removeAttribute('data-sbf-pass'));
    for (const el of zDone) {
      el.style.removeProperty('z-index');
      if (el.dataset.sbfZpos) { el.style.removeProperty('position'); delete el.dataset.sbfZpos; }
    }
    zDone = [];
    const list = Object.entries(z || {}).filter(([k, v]) => KEY_Z.test(k) && Number.isInteger(v) && v >= -10 && v <= 10);
    if (!list.length) return;
    layering(true);
    for (const [k, v] of list) {
      const el = layerEl(k);
      if (!el) continue;
      if (getComputedStyle(el).position === 'static') { el.style.position = 'relative'; el.dataset.sbfZpos = '1'; }
      el.style.zIndex = String(v);
      zDone.push(el);
      if (v < 0) for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) p.setAttribute('data-sbf-pass', '');
    }
  }

  function read() {
    try { const el = document.getElementById('sbf-site'); return el ? JSON.parse(el.textContent) : null; } catch (e) { return null; }
  }
  const site = read() || { v: 1, page: {} };
  index();
  if (site.page && Object.keys(site.page).length) apply(site.page);

  window.SBF = { hash, cleanHtml, cleanSrc, index, apply, applyText, applyCards, applyLayout, applyZ, layering, layerEl, placeBlocks, site };
})();
