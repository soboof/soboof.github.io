/* ═══════════════════════════════════════════════════════════════════════════
   SOBOOF STUDIO — THE PAGE EDITOR

   Pythagoras Engine's on-page editor (pe-web's LandingEditor), for soboof.com,
   in the same theme. Studio serves the site as built (server.js) and puts this
   over every page it serves; the published site never carries it.

     The admin bar      always across the top, the page below it: the Studio
                        menu (add a sculpture, a poster, publish, the Keys),
                        ✎ Edit page, and whether this copy is the one online.
     Editing            type on any words; click a picture to replace it; a
                        card's ▭ chip sizes, moves or hides it; ▦ Layout moves
                        and hides sections, sets which side a 3D slot stands
                        on and how many columns a grid has; on the homepage a
                        ◈ chip on each 3D slot sets what plays there, how it
                        looks, how it answers the visitor, what on the page
                        sets it off, and a motion keyed on a figure's skeleton.
     Upload             words and pictures go into the site's own files
                        (edits.js), the rest into data/site.json; the site is
                        built, committed and pushed with the keys on the Keys
                        tab. The page reloads as built.

   Before anything is edited, the copy here is brought up to the one online
   when it can be done safely (nothing here that is not online), so an edit is
   always made on what is published and later builds keep it.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.__sbfEditor) return;
  window.__sbfEditor = true;

  /* ── small things ─────────────────────────────────────────────────────── */
  const api = (p, body) => fetch(p, body === undefined ? undefined : {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  }).then(r => r.json());
  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style') el.style.cssText = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (k === 'value' || k === 'checked' || k === 'disabled' || k === 'selected') el[k] = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const c of kids.flat(Infinity)) if (c != null && c !== false) el.append(c.nodeType ? c : String(c));
    return el;
  }
  const btn = (label, onclick, cls, extra) => h('button', { class: 'le-btn' + (cls ? ' ' + cls : ''), type: 'button', onclick, ...(extra || {}) }, label);
  const clone = o => JSON.parse(JSON.stringify(o == null ? {} : o));
  const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
  const norm = s => String(s || '').replace(/\s+/g, ' ').trim();
  const isEmpty = o => !o || !Object.keys(o).length;

  function needSBF() {
    if (window.SBF) return Promise.resolve(window.SBF);
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = '/assets/js/site-edits.js';
      s.onload = () => res(window.SBF);
      s.onerror = () => rej(new Error('could not load site-edits.js'));
      document.body.appendChild(s);
    });
  }

  let toastTimer = 0;
  function toast(msg, bad) {
    document.querySelectorAll('.le-toast').forEach(t => t.remove());
    const t = h('div', { class: 'sbf-ui le-toast' + (bad ? ' bad' : ''), onclick: () => t.remove() }, msg);
    document.body.appendChild(t);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.remove(), bad ? 9000 : 4500);
  }

  /* ── state ────────────────────────────────────────────────────────────── */
  const S = {
    editing: false,
    online: null,
    base: null,     // what is saved: { text, img, layout, cards, slots }
    draft: null,    // the same, as edited
    sel: null,      // { kind: 'text'|'img'|'card'|'slot', ... }
    panel: null,    // 'layout' | 'upload' when not about a selection
    leaveArmed: false,
    busy: false,
    picking: null,  // { slot } while choosing an element to link
    pose: null,     // posing a figure's skeleton
    report: null,
  };
  const home = () => !!window.SBF_SCENE && !!document.querySelector('.model-rail');

  /* ── the bar ──────────────────────────────────────────────────────────── */
  document.documentElement.classList.add('sbf-adminbar');
  const bar = h('div', { class: 'sbf-ui le-bar', id: 'sbf-bar' });
  const panel = h('div', { class: 'sbf-ui le-panel', id: 'sbf-panel', style: 'display:none' });
  document.body.append(bar, panel);
  let menu = null;
  function closeMenu() { if (menu) { menu.remove(); menu = null; } }

  function changes() {
    if (!S.draft) return 0;
    let n = 0;
    for (const k of new Set([...Object.keys(S.draft.text), ...Object.keys(S.base.text)])) if (S.draft.text[k] !== S.base.text[k]) n++;
    for (const k of new Set([...Object.keys(S.draft.img), ...Object.keys(S.base.img)])) if (!same(S.draft.img[k], S.base.img[k])) n++;
    for (const k of new Set([...Object.keys(S.draft.cards), ...Object.keys(S.base.cards)])) if (!same(S.draft.cards[k], S.base.cards[k])) n++;
    if (!same(S.draft.layout, S.base.layout)) n++;
    for (const k of new Set([...Object.keys(S.draft.slots), ...Object.keys(S.base.slots)])) if (!same(S.draft.slots[k], S.base.slots[k])) n++;
    const bOf = (list, id) => list.find(b => b.id === id);
    for (const id of new Set([...S.draft.blocks, ...S.base.blocks].map(b => b.id))) if (!same(bOf(S.draft.blocks, id), bOf(S.base.blocks, id))) n++;
    if (!same(S.draft.blocks.map(b => b.id), S.base.blocks.map(b => b.id))) n++;
    return n;
  }

  function onlineNote() {
    const o = S.online;
    if (!o) return h('span', { class: 'le-bar-note' }, 'checking the copy online…');
    if (o.error) return h('span', { class: 'le-bar-note bad' }, 'Studio is not answering');
    if (!o.repo) return h('span', { class: 'le-bar-note bad' }, 'not a git repository');
    if (!o.reached) return h('span', { class: 'le-bar-note warn', title: o.reachNote || '' }, 'GitHub not reached: editing the copy here');
    if (o.behind && (o.dirty || o.ahead)) return h('span', { class: 'le-bar-note warn', title: 'Upload or commit what is here first' }, `${o.behind} change(s) online not here yet`);
    if (o.dirty) return h('span', { class: 'le-bar-note warn', title: (o.changed || []).slice(0, 12).join('\n') }, `${o.dirty} file(s) here not online yet`);
    if (o.ahead) return h('span', { class: 'le-bar-note warn' }, `${o.ahead} commit(s) here not pushed`);
    return h('span', { class: 'le-bar-note' }, '✓ the copy online');
  }

  function renderBar() {
    bar.replaceChildren();
    bar.append(h('span', { class: 'le-bar-title' }, 'SOBOOF STUDIO'));
    if (!S.editing) {
      const m = h('button', { class: 'le-bar-item', type: 'button', onclick: e => {
        e.stopPropagation();
        if (menu) return closeMenu();
        const r = e.currentTarget.getBoundingClientRect();
        menu = h('div', { class: 'sbf-ui le-menu', style: `left:${r.left}px` },
          h('a', { class: 'le-menu-item', href: '/studio/#art' }, '◇ Add a sculpture'),
          h('a', { class: 'le-menu-item', href: '/studio/#print' }, '▤ Add a poster'),
          h('a', { class: 'le-menu-item', href: '/studio/#pub' }, '⇪ Build and publish'),
          h('a', { class: 'le-menu-item', href: '/studio/#keys' }, '⚿ Keys'));
        document.body.appendChild(menu);
      } }, '◫ Studio ▾');
      bar.append(m,
        h('button', { class: 'le-bar-item accent', type: 'button', onclick: startEdit, title: 'Edit the words, pictures, cards, layout and 3D slots of this page' }, '✎ Edit page'),
        onlineNote(),
        h('span', { class: 'le-spacer' }),
        h('a', { class: 'le-bar-item', href: 'https://soboof.com' + location.pathname, target: '_blank', rel: 'noopener' }, 'View it online ↗'));
      return;
    }
    const n = changes();
    bar.append(
      h('span', { class: 'le-bar-note' }, 'Editing this page'),
      h('button', { class: 'le-bar-item' + (S.panel === 'layout' ? ' on' : ''), type: 'button', onclick: () => open('layout') }, '▦ Layout'),
      h('button', { class: 'le-bar-item' + (S.panel === 'addsection' ? ' on' : ''), type: 'button', onclick: () => open('addsection'), title: 'Add a section of rows and columns, with headings, words, cards and pictures' }, '+ Section'),
      onlineNote(),
      h('span', { class: 'le-spacer' }),
      h('span', { class: 'le-count' }, n ? `${n} change${n === 1 ? '' : 's'}` : 'no changes'),
      btn('Discard', discard, '', { disabled: S.busy || !n }),
      btn(S.busy ? 'Uploading…' : '⇪ Upload', () => open('upload'), 'accent', { disabled: S.busy || !n }),
      btn(S.leaveArmed ? 'Not uploaded: press again' : 'Done', leave, S.leaveArmed ? 'warn' : ''));
  }
  document.addEventListener('click', e => { if (menu && !menu.contains(e.target)) closeMenu(); });

  /* ── the copy online ──────────────────────────────────────────────────── */
  async function checkOnline(pull) {
    let o;
    try { o = await api('/api/online'); } catch (e) { o = { error: true }; }
    S.online = o;
    renderBar();
    if (pull && o.repo && o.reached && o.behind > 0 && !o.dirty && !o.ahead) {
      const r = await api('/api/online/pull', {}).catch(() => null);
      if (r && r.ok) {
        try { sessionStorage.setItem('sbf-toast', r.note); } catch (e) { /* the note is lost, the copy is not */ }
        location.reload();
        return 'reloading';
      }
      toast((r && r.note) || 'Could not bring in what is online.', true);
    }
    return o;
  }

  /* ── editing ──────────────────────────────────────────────────────────── */
  async function startEdit() {
    const o = await checkOnline(true);
    if (o === 'reloading') return;
    if (o && o.behind && (o.dirty || o.ahead)) toast(`The copy online has ${o.behind} change(s) this one has not, and this one has its own. Upload or commit what is here first, or what is online could be lost on upload.`, true);
    await needSBF();
    await needBlocks();
    let site = { slots: {} };
    try { site = await api('/api/site'); } catch (e) { /* nothing saved yet */ }
    const pg = (window.SBF.site && window.SBF.site.page) || {};
    S.base = {
      text: clone(pg.text), img: Object.fromEntries(Object.entries(pg.img || {}).map(([k, u]) => [k, { url: u }])),
      layout: clone(pg.layout), cards: clone(pg.cards), slots: clone(site.slots),
      blocks: JSON.parse(JSON.stringify(Array.isArray(pg.blocks) ? pg.blocks : [])),
    };
    S.draft = clone(S.base);
    S.editing = true;
    S.leaveArmed = false;
    document.documentElement.classList.add('sbf-editing');
    mark();
    drawAll();
    renderBar();
    window.addEventListener('beforeunload', warnUnload);
  }
  function warnUnload(e) { if (S.editing && changes() && !S.busy) { e.preventDefault(); e.returnValue = ''; } }

  const chips = [];
  function mark() {
    const ix = window.SBF.index();
    for (const t of ix.texts) t.el.setAttribute('data-sbf-t', '');
    for (const t of ix.imgs) t.el.setAttribute('data-sbf-i', '');
    for (const c of ix.cards) {
      if (getComputedStyle(c.el).position === 'static') { c.el.dataset.sbfPos = '1'; c.el.style.position = 'relative'; }
      const chip = h('button', { class: 'sbf-ui le-chip le-card-chip', type: 'button', onclick: e => { e.preventDefault(); e.stopPropagation(); select({ kind: 'card', c }); } }, '▭ Card');
      c.el.appendChild(chip);
      chips.push(chip);
    }
    if (home()) {
      for (const s of ix.sections.concat([{ id: 'hero', el: document.querySelector('.hero'), rail: document.querySelector('.hero > .model-rail') }])) {
        if (!s.rail) continue;
        const chip = h('button', { class: 'sbf-ui le-chip le-slot-chip', type: 'button', onclick: e => { e.preventDefault(); e.stopPropagation(); select({ kind: 'slot', id: s.id }); } }, '◈ 3D slot');
        s.rail.appendChild(chip);
        chips.push(chip);
      }
    }
  }
  function unmark() {
    const ix = window.SBF.index();
    for (const t of ix.texts) { t.el.removeAttribute('data-sbf-t'); t.el.removeAttribute('contenteditable'); }
    for (const t of ix.imgs) t.el.removeAttribute('data-sbf-i');
    for (const c of ix.cards) if (c.el.dataset.sbfPos) { c.el.style.position = ''; delete c.el.dataset.sbfPos; }
    chips.splice(0).forEach(c => c.remove());
    document.querySelectorAll('.le-sel').forEach(e => e.classList.remove('le-sel'));
  }

  function discard() {
    if (!changes()) return;
    S.editing = false;
    location.reload();
  }
  function leave() {
    if (changes() && !S.leaveArmed) { S.leaveArmed = true; renderBar(); setTimeout(() => { S.leaveArmed = false; renderBar(); }, 3000); return; }
    if (changes()) { S.editing = false; location.reload(); return; }
    endText();
    stopPose();
    unmark();
    S.editing = false;
    S.sel = null; S.panel = null;
    document.documentElement.classList.remove('sbf-editing');
    window.removeEventListener('beforeunload', warnUnload);
    renderPanel();
    renderBar();
  }

  function select(sel) {
    endText();
    if (!(sel && S.bedit && sel.kind === 'block' && sel.id === S.bedit.sel.id && sel.r === S.bedit.sel.r && sel.c === S.bedit.sel.c && sel.i === S.bedit.sel.i)) endBlockText();
    if (!(sel && sel.kind === 'slot' && S.pose && S.pose.slot === sel.id)) stopPose();
    document.querySelectorAll('.le-sel').forEach(e => e.classList.remove('le-sel'));
    S.sel = sel;
    S.panel = null;
    const el = sel && (sel.t ? sel.t.el : sel.c ? sel.c.el : sel.kind === 'slot' ? railOf(sel.id) : null);
    if (el && sel.kind !== 'text') el.classList.add('le-sel');
    markSel();
    renderPanel();
  }
  function open(name) {
    endText();
    endBlockText();
    stopPose();
    document.querySelectorAll('.le-sel').forEach(e => e.classList.remove('le-sel'));
    S.sel = null;
    S.panel = S.panel === name ? null : name;
    renderPanel();
    renderBar();
  }
  function changed() { renderBar(); }

  /* ── on the page: words and pictures ──────────────────────────────────── */
  document.addEventListener('click', e => {
    if (!S.editing) return;
    if (e.target.closest('.sbf-ui')) return;
    if (S.picking) { e.preventDefault(); e.stopPropagation(); finishPick(e.target); return; }
    const sec = e.target.closest('section.sbf-block');
    if (sec) { e.preventDefault(); e.stopPropagation(); blockClick(sec, e.target); return; }
    const a = e.target.closest('a,button,form,label');
    if (a) e.preventDefault();
    const img = e.target.closest('[data-sbf-i]');
    if (img) { e.stopPropagation(); select({ kind: 'img', t: img.__sbfImg }); return; }
    const t = e.target.closest('[data-sbf-t]');
    if (t && t.__sbfText) {
      e.stopPropagation();
      if (S.sel && S.sel.t === t.__sbfText) return;
      editText(t.__sbfText);
      return;
    }
    if (S.sel && S.sel.kind === 'text') select(null);
  }, true);
  document.addEventListener('submit', e => { if (S.editing) e.preventDefault(); }, true);

  function editText(t) {
    select({ kind: 'text', t });
    t.before = t.el.innerHTML;
    t.el.setAttribute('contenteditable', 'true');
    t.el.focus();
  }
  function endText() {
    if (!S.sel || S.sel.kind !== 'text') return;
    const t = S.sel.t;
    commitText(t);
    t.el.removeAttribute('contenteditable');
  }
  function commitText(t) {
    const copy = t.el.cloneNode(true);
    copy.querySelectorAll('.sbf-ui').forEach(u => u.remove());
    const html = window.SBF.cleanHtml(copy.innerHTML);
    if (norm(html) === norm(window.SBF.cleanHtml(t.stock))) delete S.draft.text[t.key];
    else S.draft.text[t.key] = html;
    changed();
  }
  document.addEventListener('input', e => {
    const t = e.target.closest && e.target.closest('[data-sbf-t]');
    if (S.editing && t && t.__sbfText) commitText(t.__sbfText);
    if (S.editing && S.bedit && S.bedit.el.contains(e.target)) commitField();
  }, true);
  document.addEventListener('keydown', e => {
    if (!S.editing) return;
    if (e.key === 'Escape') {
      if (S.picking) { S.picking = null; document.documentElement.classList.remove('sbf-picking'); renderPanel(); return; }
      if (S.sel && S.sel.kind === 'text') { const t = S.sel.t; t.el.innerHTML = t.before; commitText(t); select(null); return; }
      if (S.bedit) { S.bedit.el.innerHTML = S.bedit.before; commitField(); endBlockText(); return; }
      if (S.sel || S.panel) { select(null); return; }
    }
    const t = e.target.closest && e.target.closest('[data-sbf-t][contenteditable],[data-bf][contenteditable]');
    if (t && e.key === 'Enter') { e.preventDefault(); document.execCommand('insertLineBreak'); }
  }, true);
  document.addEventListener('paste', e => {
    const t = e.target.closest && e.target.closest('[data-sbf-t][contenteditable],[data-bf][contenteditable]');
    if (!S.editing || !t) return;
    e.preventDefault();
    document.execCommand('insertText', false, (e.clipboardData || window.clipboardData).getData('text/plain'));
  }, true);

  function textPanel(t) {
    const keep = e => e.preventDefault();
    const edited = t.key in S.draft.text;
    return [
      h('h3', null, 'Words'),
      h('p', { class: 'le-hint' }, 'Type straight on the page. Enter makes a new line, Esc undoes this edit, and pasted text comes in plain.'),
      h('div', { class: 'le-row' },
        btn(h('b', null, 'B'), () => document.execCommand('bold'), '', { onmousedown: keep }),
        btn(h('i', null, 'I'), () => document.execCommand('italic'), '', { onmousedown: keep }),
        btn('↗ Link', () => {
          const url = prompt('Link to (https://…, /a-page/, mailto:…)');
          if (url && /^(https?:|mailto:|tel:|\/|#)/i.test(url.trim())) document.execCommand('createLink', false, url.trim());
        }, '', { onmousedown: keep })),
      h('p', { class: 'le-hint' }, 'On upload these words go into the file they were built from, so the published page carries them and later builds keep them.'),
      btn('Put back the original', () => { t.el.innerHTML = t.stock; delete S.draft.text[t.key]; changed(); renderPanel(); }, '', { disabled: !edited }),
    ];
  }

  async function shrink(file, stockSrc) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
      const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
      const cv = document.createElement('canvas');
      cv.width = Math.round(img.naturalWidth * k); cv.height = Math.round(img.naturalHeight * k);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      /* A picture of the site's own is written over its file, so it keeps the file's format. */
      const ext = ((/^\/assets\/.+\.(jpe?g|png|webp)(\?|#|$)/i.exec(stockSrc || '') || [])[1] || '').toLowerCase();
      const type = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : ext ? 'image/jpeg' : file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      return cv.toDataURL(type, 0.88);
    } finally { URL.revokeObjectURL(url); }
  }
  function imgPanel(t) {
    const cur = S.draft.img[t.key];
    const file = h('input', { type: 'file', accept: 'image/*', style: 'display:none', onchange: async e => {
      const f = e.target.files[0];
      if (!f) return;
      try {
        const data = await shrink(f, t.stockSrc);
        if (data.length > 12e6) { toast('That picture is too large, even made 1600 px across.', true); return; }
        S.draft.img[t.key] = { data };
        t.el.setAttribute('src', data); t.el.removeAttribute('srcset'); t.el.removeAttribute('data-failed');
        changed(); renderPanel();
      } catch (err) { toast('Could not read that picture.', true); }
    } });
    const addr = h('input', { class: 'le-input', placeholder: '/assets/img/… or https://…', value: cur && cur.url ? cur.url : '' });
    const own = /^\/assets\//.test(t.stockSrc);
    return [
      h('h3', null, 'Picture'),
      h('img', { class: 'le-preview', src: t.el.getAttribute('src'), alt: '' }),
      h('p', { class: 'le-hint' }, 'Upload one (it is made at most 1600 px across) or give its address: a path on this site or an https link.'),
      own ? h('p', { class: 'le-hint' }, `An upload is written over ${t.stockSrc.split('?')[0]} itself, so every page showing that picture shows the new one.`) : null,
      h('div', { class: 'le-row' }, btn('Upload…', () => file.click(), 'accent'), file),
      h('div', { class: 'le-row' }, addr, btn('Use', () => {
        const u = addr.value.trim();
        if (!window.SBF.cleanSrc(u) || u.startsWith('data:')) { toast('Give a path on this site (/…) or an https link.', true); return; }
        S.draft.img[t.key] = { url: u };
        t.el.setAttribute('src', u); t.el.removeAttribute('srcset');
        changed(); renderPanel();
      })),
      btn('Put back the original', () => { delete S.draft.img[t.key]; t.el.setAttribute('src', t.stockSrc); changed(); renderPanel(); }, '', { disabled: !cur }),
    ];
  }

  /* ── cards and layout ─────────────────────────────────────────────────── */
  const cardTitle = c => norm((c.el.querySelector('h1,h2,h3,h4,.ex-title,[class*=title]') || c.el).textContent).slice(0, 48) || 'card';
  function gridCards(gridKey) {
    const all = window.SBF.index().cards.filter(c => c.grid === gridKey);
    const o = c => (S.draft.cards[c.key] && Number.isFinite(S.draft.cards[c.key].o) ? S.draft.cards[c.key].o : c.at);
    return all.slice().sort((a, b) => o(a) - o(b) || a.at - b.at);
  }
  function setCard(key, patch) {
    const c = { ...(S.draft.cards[key] || {}), ...patch };
    for (const k of Object.keys(c)) if (c[k] == null || c[k] === false || c[k] === 'auto') delete c[k];
    if (isEmpty(c)) delete S.draft.cards[key]; else S.draft.cards[key] = c;
    window.SBF.applyCards(S.draft.cards);
    changed();
  }
  function moveCard(c, by) {
    const list = gridCards(c.grid);
    const i = list.indexOf(c), j = i + by;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    list.forEach((x, n) => setCard(x.key, { o: n === x.at && list.every((y, m) => m === y.at) ? null : n }));
    renderPanel();
  }
  function cardPanel(c) {
    const now = (S.draft.cards[c.key] || {}).size || 'auto';
    return [
      h('h3', null, 'Card'),
      h('p', { class: 'le-hint' }, cardTitle(c)),
      h('span', { class: 'le-lbl' }, 'Size'),
      h('div', { class: 'le-row' }, [['auto', 'As built'], ['wide', 'Wide'], ['full', 'Full width']].map(([v, l]) =>
        btn(l, () => { setCard(c.key, { size: v }); renderPanel(); }, now === v ? 'on' : ''))),
      h('p', { class: 'le-hint' }, 'Wide takes two of the grid\'s columns. Under 900 px wide every card is full width, as built.'),
      h('span', { class: 'le-lbl' }, 'Where it stands'),
      h('div', { class: 'le-row' },
        btn('← Earlier', () => moveCard(c, -1)), btn('Later →', () => moveCard(c, 1)),
        btn(S.draft.cards[c.key] && S.draft.cards[c.key].hidden ? 'Show card' : 'Hide card', () => { setCard(c.key, { hidden: !(S.draft.cards[c.key] || {}).hidden }); renderPanel(); })),
      h('p', { class: 'le-hint' }, 'A hidden card comes back from ▦ Layout, and stays in the page\'s files: only its showing is kept.'),
      btn('As built', () => { setCard(c.key, { size: null, hidden: null }); renderPanel(); }, '', { disabled: !(S.draft.cards[c.key] && (S.draft.cards[c.key].size || S.draft.cards[c.key].hidden)) }),
    ];
  }

  function setLayout(fn) {
    const L = clone(S.draft.layout);
    fn(L);
    for (const k of ['order', 'hidden']) if (Array.isArray(L[k]) && !L[k].length) delete L[k];
    for (const k of ['side', 'cols']) if (L[k] && isEmpty(L[k])) delete L[k];
    S.draft.layout = L;
    window.SBF.applyLayout(L);
    changed();
    renderPanel();
  }
  function sectionOrder() {
    const ids = window.SBF.index().sections.map(s => s.id);
    const o = (S.draft.layout.order || []).filter(id => ids.includes(id));
    for (const id of ids) if (!o.includes(id)) o.push(id);
    return o;
  }
  const sectionName = s => norm((s.el.querySelector('h1,h2,h3,.sec-k,.kicker') || {}).textContent || '').slice(0, 34) || s.id;
  function layoutPanel() {
    const ix = window.SBF.index();
    const order = sectionOrder();
    const hidden = S.draft.layout.hidden || [];
    const rows = order.map((id, i) => {
      const s = ix.sections.find(x => x.id === id);
      const side = (S.draft.layout.side && S.draft.layout.side[id]) || s.stockSide;
      const off = hidden.includes(id);
      return h('div', { class: 'le-item' + (off ? ' off' : '') },
        h('span', { class: 'le-item-name', title: id }, sectionName(s)),
        h('button', { class: 'le-mini', type: 'button', disabled: i === 0, onclick: () => setLayout(L => { const o = sectionOrder(); [o[i - 1], o[i]] = [o[i], o[i - 1]]; L.order = o; }) }, '↑'),
        h('button', { class: 'le-mini', type: 'button', disabled: i === order.length - 1, onclick: () => setLayout(L => { const o = sectionOrder(); [o[i + 1], o[i]] = [o[i], o[i + 1]]; L.order = o; }) }, '↓'),
        s.stockSide ? h('button', { class: 'le-mini' + (side === 'left' ? ' on' : ''), type: 'button', title: 'Its 3D slot on the left', onclick: () => setLayout(L => { L.side = { ...(L.side || {}) }; if (s.stockSide === 'left') delete L.side[id]; else L.side[id] = 'left'; }) }, '◧') : null,
        s.stockSide ? h('button', { class: 'le-mini' + (side === 'right' ? ' on' : ''), type: 'button', title: 'Its 3D slot on the right', onclick: () => setLayout(L => { L.side = { ...(L.side || {}) }; if (s.stockSide === 'right') delete L.side[id]; else L.side[id] = 'right'; }) }, '◨') : null,
        h('button', { class: 'le-mini' + (off ? ' on' : ''), type: 'button', onclick: () => setLayout(L => { const hd = new Set(L.hidden || []); off ? hd.delete(id) : hd.add(id); L.hidden = [...hd]; }) }, off ? 'Show' : 'Hide'));
    });
    const hiddenCards = ix.cards.filter(c => S.draft.cards[c.key] && S.draft.cards[c.key].hidden);
    const grids = ix.grids.map(g => {
      const sec = g.el.closest('section[id]');
      const n = S.draft.layout.cols && S.draft.layout.cols[g.key];
      return h('div', { class: 'le-item' },
        h('span', { class: 'le-item-name', title: g.el.className }, (sec ? sec.id + ' · ' : '') + (g.el.classList[0] || 'grid') + ` (${g.el.children.length})`),
        [0, 1, 2, 3, 4].map(c => h('button', { class: 'le-mini' + ((n || 0) === c ? ' on' : ''), type: 'button', onclick: () => setLayout(L => { L.cols = { ...(L.cols || {}) }; if (c) L.cols[g.key] = c; else delete L.cols[g.key]; }) }, c || 'As built')));
    });
    return [
      h('h3', null, 'Page structure'),
      h('p', { class: 'le-hint' }, 'The page\'s rows and columns. The hero stays first and the footer last.'),
      h('span', { class: 'le-lbl' }, 'Sections, top to bottom'),
      h('div', { class: 'le-seg' }, rows.length ? rows : h('p', { class: 'le-hint' }, 'This page has no sections to move.')),
      hiddenCards.length ? [h('span', { class: 'le-lbl' }, 'Hidden cards'),
        h('div', { class: 'le-seg' }, hiddenCards.map(c => h('div', { class: 'le-item off' }, h('span', { class: 'le-item-name' }, cardTitle(c)),
          h('button', { class: 'le-mini', type: 'button', onclick: () => { setCard(c.key, { hidden: null }); renderPanel(); } }, 'Show'))))] : null,
      grids.length ? [h('span', { class: 'le-lbl' }, 'Columns'), h('div', { class: 'le-seg' }, grids),
        h('p', { class: 'le-hint' }, 'Under 900 px wide every grid is one column, as built.')] : null,
      btn('Everything as built', () => { S.draft.cards = {}; window.SBF.applyCards({}); setLayout(L => { for (const k of Object.keys(L)) delete L[k]; }); }, '',
        { disabled: isEmpty(S.draft.layout) && isEmpty(S.draft.cards) }),
    ];
  }

  /* ── 3D slots (the homepage) ──────────────────────────────────────────── */
  const SLOT_NAMES = { hero: 'Hero', 'pythagoras-engine': 'Pythagoras Engine', mirbreak: 'Mirbreak', 'death-culture': 'Death Culture', superadobe: 'Superadobe', about: 'About', more: 'More', contact: 'Contact' };
  const railOf = id => (id === 'hero' ? document.querySelector('.hero > .model-rail') : document.querySelector(`#${CSS.escape(id)} > .model-rail`));
  let FIGURES = null;
  function figures() {
    if (FIGURES) return Promise.resolve(FIGURES);
    return window.SBF_SCENE.figures().then(f => (FIGURES = f));
  }
  function setSlot(id, patch, rerender) {
    let s = { ...(S.draft.slots[id] || {}), ...patch };
    for (const k of Object.keys(s)) if (s[k] == null || s[k] === '' || (Array.isArray(s[k]) && !s[k].length)) delete s[k];
    if (isEmpty(s)) delete S.draft.slots[id]; else S.draft.slots[id] = s;
    window.SBF_SCENE.setSlots(S.draft.slots);
    changed();
    if (rerender !== false) renderPanel();
  }
  function seg(label, options, now, onpick) {
    return [h('span', { class: 'le-lbl' }, label),
      h('div', { class: 'le-row' }, options.map(([v, l]) => btn(l, () => onpick(v), (now ?? '') === v ? 'on' : '')))];
  }
  function slider(label, value, min, max, step, fmt, oninput) {
    const out = h('b', null, fmt(value));
    return h('label', { class: 'le-field' }, h('span', null, label, out),
      h('input', { type: 'range', min, max, step, value, oninput: e => { const v = +e.target.value; out.textContent = fmt(v); oninput(v); } }));
  }
  function cssPath(el) {
    const parts = [];
    while (el && el.nodeType === 1 && el !== document.body) {
      if (el.id) { parts.unshift('#' + CSS.escape(el.id)); break; }
      let s = el.tagName.toLowerCase();
      const cls = [...el.classList].find(c => !/^(le-|sbf-)/.test(c));
      if (cls) s += '.' + CSS.escape(cls);
      const p = el.parentElement;
      if (p) { const like = [...p.children].filter(c => c.tagName === el.tagName); if (like.length > 1) s += `:nth-of-type(${like.indexOf(el) + 1})`; }
      parts.unshift(s);
      el = el.parentElement;
    }
    return parts.join(' > ');
  }
  function startPick(id) {
    S.picking = { slot: id };
    document.documentElement.classList.add('sbf-picking');
    toast('Click the element on the page that should set it off. Esc stops.');
    renderPanel();
  }
  let pickHover = null;
  document.addEventListener('mouseover', e => {
    if (!S.picking) return;
    if (pickHover) pickHover.classList.remove('sbf-pick-hover');
    pickHover = e.target.closest('.sbf-ui') ? null : e.target;
    if (pickHover) pickHover.classList.add('sbf-pick-hover');
  }, true);
  function finishPick(target) {
    const id = S.picking.slot;
    S.picking = null;
    document.documentElement.classList.remove('sbf-picking');
    if (pickHover) { pickHover.classList.remove('sbf-pick-hover'); pickHover = null; }
    const el = target.closest('a,button,[data-sbf-t],[data-sbf-i],img,h1,h2,h3,li,[class]') || target;
    const sel = cssPath(el);
    if (!sel) return;
    const links = ((S.draft.slots[id] || {}).links || []).filter(l => l.sel !== sel);
    links.push({ sel, on: 'hover', does: 'spin' });
    setSlot(id, { links: links.slice(-4) });
  }

  function slotPanel(id) {
    const s = S.draft.slots[id] || {};
    const plays = s.hidden ? 'none' : s.kind === 'figure' ? 'figure' : s.kind === 'model' ? 'model' : '';
    const fig = FIGURES && s.kind === 'figure' ? FIGURES.find(f => f.id === s.figure) : null;
    if (!FIGURES) figures().then(() => renderPanel());
    const clips = fig ? fig.clips : [];
    const isFig = s.kind === 'figure';
    const out = [
      h('h3', null, '3D slot · ' + (SLOT_NAMES[id] || id)),
      h('p', { class: 'le-hint' }, 'Changes play on the page as you make them. With nothing set the slot is as built: the travelling model in this section\'s look.'),
      seg('What plays here', [['', 'As built'], ['model', 'A model'], ['figure', 'A figure'], ['none', 'Nothing']], plays, v => {
        if (v === '') return setSlot(id, { kind: null, model: null, figure: null, hidden: null });
        if (v === 'none') return setSlot(id, { hidden: true });
        if (v === 'model') return setSlot(id, { kind: 'model', model: s.model || 'pythagoras_m21.gltf', figure: null, hidden: null, keys: null, motion: null, look: null });
        figures().then(f => setSlot(id, { kind: 'figure', figure: s.figure || (f[0] && f[0].id), hidden: null, look: null }));
      }),
    ];
    if (s.kind === 'model' && !s.hidden) {
      out.push(h('span', { class: 'le-lbl' }, 'Model'),
        h('select', { class: 'le-select', onchange: e => setSlot(id, { model: e.target.value }) },
          Object.entries(window.SBF_SCENE.MODELS).map(([f, n]) => h('option', { value: f, selected: s.model === f }, n))));
    }
    if (isFig && !s.hidden) {
      out.push(h('span', { class: 'le-lbl' }, 'Figure · rigged in Pythagoras Engine\'s Theater'),
        h('select', { class: 'le-select', onchange: e => setSlot(id, { figure: e.target.value, keys: null, motion: null }) },
          (FIGURES || []).map(f => h('option', { value: f.id, selected: s.figure === f.id }, f.name || f.id))),
        h('span', { class: 'le-lbl' }, 'Theater motion'),
        h('select', { class: 'le-select', onchange: e => setSlot(id, { motion: e.target.value || null }) },
          h('option', { value: '' }, `As cast${fig && fig.play ? ' (' + fig.play + ')' : ''}`),
          clips.map(c => h('option', { value: c, selected: s.motion === c }, c))));
    }
    if (s.hidden) {
      out.push(btn('As built', () => setSlot(id, { hidden: null, kind: null })));
      return out;
    }
    out.push(
      ...seg('Look', isFig ? [['', 'Own colours'], ['tint', 'One colour'], ['clay', 'Clay'], ['wire', 'Wireframe']]
        : [['', 'As the section'], ['shaded', 'Shaded'], ['wire', 'Wireframe'], ['clay', 'Clay'], ['tint', 'One colour']], s.look || '', v => setSlot(id, { look: v || null })),
      h('label', { class: 'le-field le-inline' }, h('span', null, 'Colour'),
        h('input', { type: 'color', value: s.color || '#e8c547', oninput: e => setSlot(id, { color: e.target.value }, false) }),
        h('button', { class: 'le-mini', type: 'button', disabled: !s.color, onclick: () => setSlot(id, { color: null }) }, 'As the section')),
      slider('Size', s.size ?? 1, 0.3, 2.5, 0.05, v => '×' + v.toFixed(2), v => setSlot(id, { size: Math.abs(v - 1) < 1e-6 ? null : v }, false)),
      slider('Speed', s.speed ?? 1, 0, 3, 0.1, v => '×' + v.toFixed(1), v => setSlot(id, { speed: Math.abs(v - 1) < 1e-6 ? null : v }, false)),
      ...seg('Seen from', [['', 'As the section'], ['front', 'Front'], ['angle', 'Angled'], ['top', 'Top'], ['side', 'Side']], s.view || '', v => setSlot(id, { view: v || null })),
      ...seg('With the visitor', [['', 'Turns with the scroll'], ['pointer', 'Tips to the pointer'], ['reader', 'Faces the reader'], ['none', 'Spins on its own']], s.interact || '', v => setSlot(id, { interact: v || null })),
      ...seg('When the pointer comes near', [['', 'Nothing'], ['spin', 'Spins'], ['grow', 'Grows'], ['nod', 'Nods'], ['hop', 'Hops'],
        ...clips.map(c => [c, 'Plays ' + c]), ...(isFig ? [['play', 'Plays its own motion']] : [])], s.hover || '', v => setSlot(id, { hover: v || null })),
      h('label', { class: 'le-check' }, h('input', { type: 'checkbox', checked: !!s.clip, onchange: e => setSlot(id, { clip: e.target.checked || null }) }), 'Ends at the slot\'s border'),
      h('span', { class: 'le-lbl' }, 'Set off by the page'),
      h('p', { class: 'le-hint' }, 'An element of the page (a button, a link, a card, a title) that makes it move when hovered or clicked, while this slot is in view.'),
      ...(s.links || []).map((l, i) => h('div', { class: 'le-item' },
        h('span', { class: 'le-item-name', title: l.sel }, l.sel.split(' > ').slice(-2).join(' > ')),
        h('select', { class: 'le-mini', onchange: e => { const ls = clone(s.links); ls[i].on = e.target.value; setSlot(id, { links: ls }, false); } },
          ['hover', 'click'].map(v => h('option', { value: v, selected: l.on === v }, v === 'hover' ? 'Hovered' : 'Clicked'))),
        h('select', { class: 'le-mini', onchange: e => { const ls = clone(s.links); ls[i].does = e.target.value; setSlot(id, { links: ls }, false); } },
          [['spin', 'Spins'], ['grow', 'Grows'], ['nod', 'Nods'], ['hop', 'Hops'], ['look', 'Looks at it'], ...clips.map(c => [c, 'Plays ' + c]), ...(isFig ? [['play', 'Its own motion']] : [])]
            .map(([v, n]) => h('option', { value: v, selected: l.does === v }, n))),
        h('button', { class: 'le-mini', type: 'button', onclick: () => setSlot(id, { links: s.links.filter((_, j) => j !== i) }) }, '✕'))),
      btn(S.picking ? 'Click an element on the page…' : '+ Link an element on the page…', () => startPick(id), S.picking ? 'on' : '', { disabled: (s.links || []).length >= 4 }),
    );
    if (isFig) out.push(...motionPart(id, s));
    out.push(btn('As built', () => { stopPose(); delete S.draft.slots[id]; window.SBF_SCENE.setSlots(S.draft.slots); changed(); renderPanel(); }, '', { disabled: isEmpty(s) }));
    return out;
  }

  /* ── a motion of its own, keyed on the figure's skeleton ──────────────── */
  const SNAP = 0.04;
  const roundQ = q => q.map(x => Math.round(x * 1e5) / 1e5);
  function ownKeys(id, s) {
    const k = s.keys;
    return k && k.figure === s.figure && k.clip ? clone(k) : null;
  }
  function sample(clip, t, rest) {
    const ks = clip.k;
    if (!ks.length) return rest.map(() => null);
    if (ks.length === 1) return ks[0].q.map(x => (x ? x.slice() : null));
    const d = clip.d;
    const tt = ((t % d) + d) % d;
    let b = ks.findIndex(k => k.t > tt), a, span, u;
    if (b <= 0) { a = ks.length - 1; b = 0; span = d - ks[a].t + ks[0].t; u = ((tt - ks[a].t + d) % d) / (span || 1); }
    else { a = b - 1; span = ks[b].t - ks[a].t; u = (tt - ks[a].t) / (span || 1); }
    u = Math.min(1, Math.max(0, u));
    if (clip.e === 'ease') u = u * u * (3 - 2 * u);
    const qa = new THREE.Quaternion(), qb = new THREE.Quaternion();
    return rest.map((r, i) => {
      const A = ks[a].q[i], B = ks[b].q[i];
      if (!A && !B) return null;
      qa.fromArray(A || r); qb.fromArray(B || r);
      return qa.slerp(qb, u).toArray();
    });
  }
  function writeKeys() {
    const P = S.pose;
    if (!P) return;
    const clip = { d: P.clip.d, ...(P.clip.e === 'ease' ? { e: 'ease' } : {}), k: P.clip.k.map(k => ({ t: Math.round(k.t * 1000) / 1000, q: k.q.map(q => (q ? roundQ(q) : null)) })) };
    setSlot(P.slot, { keys: clip.k.length ? { figure: P.figure, bones: P.bones, clip } : null, drive: clip.k.length ? (S.draft.slots[P.slot] || {}).drive : null }, false);
  }
  function startPose(id) {
    const s = S.draft.slots[id] || {};
    /* Its figure is drawn while its section is the one in view, so the handles are only there then. */
    const rail = railOf(id);
    if (rail) rail.scrollIntoView({ block: 'center' });
    window.SBF_SCENE.pose.start(id).then(info => {
      const kept = ownKeys(id, s);
      const fits = kept && kept.bones.length === info.bones.length && kept.bones.every((b, i) => b === info.bones[i]);
      S.pose = { slot: id, figure: s.figure, bones: info.bones, rest: info.rest, q: info.bones.map(() => null),
        clip: fits ? kept.clip : { d: 2, k: [] }, t: 0, playing: false, drag: null, raf: 0, layer: h('div', { class: 'sbf-ui le-handles' }), els: [] };
      if (S.pose.clip.k.length) { S.pose.q = sample(S.pose.clip, 0, S.pose.rest); window.SBF_SCENE.pose.set(S.pose.q); }
      document.body.appendChild(S.pose.layer);
      handleLoop();
      renderPanel();
    }).catch(e => toast(e.message || 'That slot plays no figure.', true));
  }
  function stopPose() {
    const P = S.pose;
    if (!P) return;
    cancelAnimationFrame(P.raf);
    P.layer.remove();
    S.pose = null;
    window.SBF_SCENE && window.SBF_SCENE.pose.stop();
  }
  function handleLoop() {
    const P = S.pose;
    if (!P) return;
    if (P.playing) {
      const now = performance.now();
      P.t = (P.t + (now - (P.last || now)) / 1000) % P.clip.d;
      P.last = now;
      P.q = sample(P.clip, P.t, P.rest);
      window.SBF_SCENE.pose.set(P.q);
      const scrub = panel.querySelector('.le-track input');
      if (scrub) scrub.value = P.t;
    }
    const hs = window.SBF_SCENE.pose.handles();
    while (P.els.length < hs.length) {
      const j = P.els.length;
      const el = h('button', { class: 'le-handle', type: 'button', onpointerdown: e => {
        const hd = window.SBF_SCENE.pose.handles()[j];
        if (!hd || hd.root) { toast('The root has no bone to aim: aim the bones that hang from it.', true); return; }
        e.preventDefault();
        P.playing = false;
        P.drag = j;
        el.setPointerCapture(e.pointerId);
      }, onpointermove: e => {
        if (P.drag !== j) return;
        const q = window.SBF_SCENE.pose.aim(j, e.clientX, e.clientY);
        if (q) P.q = q;
      }, onpointerup: () => { P.drag = null; renderPanel(); } });
      P.layer.appendChild(el);
      P.els.push(el);
    }
    P.els.forEach((el, i) => {
      const hd = hs[i];
      el.style.display = hd ? '' : 'none';
      if (!hd) return;
      el.style.left = hd.x + 'px'; el.style.top = hd.y + 'px';
      el.className = 'le-handle' + (hd.root ? ' root' : '') + (P.drag === i ? ' on' : '');
      el.title = hd.name;
    });
    P.raf = requestAnimationFrame(handleLoop);
  }
  function keyAt(P) { return P.clip.k.findIndex(k => Math.abs(k.t - P.t) < SNAP); }
  function motionPart(id, s) {
    const P = S.pose && S.pose.slot === id ? S.pose : null;
    const kept = ownKeys(id, s);
    const out = [h('span', { class: 'le-lbl' }, 'Its own motion')];
    if (!P) {
      out.push(h('p', { class: 'le-hint' }, kept ? `${kept.clip.k.length} key${kept.clip.k.length === 1 ? '' : 's'} over ${kept.clip.d} s, played over its Theater motion.` : 'Pose its skeleton and keep poses as keys on a loop: the Theater\'s Pose Mode, on the page.'),
        h('div', { class: 'le-row' }, btn('✋ Pose its skeleton…', () => startPose(id), 'accent'),
          kept ? btn('Clear its motion', () => setSlot(id, { keys: null, drive: null })) : null));
      if (kept) out.push(...seg('It plays', [['', 'Round its loop'], ['scroll', 'With the scroll'], ['trigger', 'Once when set off']], s.drive || '', v => setSlot(id, { drive: v || null })));
      return out;
    }
    const at = keyAt(P);
    const scrub = h('input', { type: 'range', min: 0, max: P.clip.d, step: 0.01, value: P.t, oninput: e => {
      P.playing = false; P.t = +e.target.value; P.q = sample(P.clip, P.t, P.rest); window.SBF_SCENE.pose.set(P.q);
    }, onchange: () => renderPanel() });
    const marks = P.clip.k.map(k => h('span', { class: 'le-key', style: `left:${(k.t / P.clip.d) * 100}%`, title: k.t.toFixed(2) + ' s', onclick: () => {
      P.playing = false; P.t = k.t; P.q = sample(P.clip, P.t, P.rest); window.SBF_SCENE.pose.set(P.q); renderPanel();
    } }));
    const step = by => {
      if (!P.clip.k.length) return;
      const ts = P.clip.k.map(k => k.t);
      const next = by > 0 ? (ts.find(t => t > P.t + 1e-3) ?? ts[0]) : ([...ts].reverse().find(t => t < P.t - 1e-3) ?? ts[ts.length - 1]);
      P.playing = false; P.t = next; P.q = sample(P.clip, next, P.rest); window.SBF_SCENE.pose.set(P.q); renderPanel();
    };
    out.push(h('div', { class: 'le-timeline' },
      h('p', { class: 'le-hint' }, 'Drag a joint\'s handle on the page and its bone swings after it. Set a key, move the playhead, pose again.'),
      h('div', { class: 'le-track' }, marks, scrub),
      h('div', { class: 'le-row' },
        btn('‹ Key', () => step(-1)),
        btn(P.playing ? '❚❚ Stop' : '▶ Play', () => { P.playing = !P.playing; P.last = performance.now(); if (!P.playing) renderPanel(); else renderPanel(); }, P.playing ? 'on' : '', { disabled: P.clip.k.length < 2 }),
        btn('Key ›', () => step(1))),
      h('div', { class: 'le-row' },
        btn(at >= 0 ? 'Update key' : 'Set key', () => {
          const k = { t: P.t, q: P.q.map(q => (q ? q.slice() : null)) };
          const i = keyAt(P);
          if (i >= 0) P.clip.k[i] = { ...k, t: P.clip.k[i].t }; else { P.clip.k.push(k); P.clip.k.sort((a, b) => a.t - b.t); }
          writeKeys(); renderPanel();
        }, 'accent'),
        btn('Delete key', () => { P.clip.k.splice(keyAt(P), 1); writeKeys(); renderPanel(); }, '', { disabled: at < 0 }),
        btn('Rest pose', () => { P.q = P.rest.map(() => null); window.SBF_SCENE.pose.set(P.q); }),
        btn('Clear', () => { P.clip.k = []; P.q = P.rest.map(() => null); window.SBF_SCENE.pose.set(P.q); writeKeys(); renderPanel(); }, '', { disabled: !P.clip.k.length })),
      h('label', { class: 'le-field le-inline' }, h('span', null, 'Length'),
        h('input', { class: 'le-input', type: 'number', min: 0.5, max: 30, step: 0.1, value: P.clip.d, onchange: e => {
          const d = Math.min(30, Math.max(0.5, +e.target.value || 2)), k = d / P.clip.d;
          P.clip.k.forEach(x => (x.t *= k)); P.t *= k; P.clip.d = d; writeKeys(); renderPanel();
        } }), h('span', { class: 'le-dim' }, 's, the keys stretched with it')),
      seg('Between keys', [['', 'Linear'], ['ease', 'Ease']], P.clip.e || '', v => { P.clip.e = v || undefined; writeKeys(); renderPanel(); }),
      h('div', { class: 'le-row' }, btn('✓ Done posing', () => { stopPose(); renderPanel(); }))));
    out.push(...seg('It plays', [['', 'Round its loop'], ['scroll', 'With the scroll'], ['trigger', 'Once when set off']], s.drive || '', v => setSlot(id, { drive: v || null })));
    if (s.drive === 'trigger') out.push(h('p', { class: 'le-hint' }, 'Set off by "Plays its own motion" above, or by an element linked with "Its own motion".'));
    return out;
  }

  /* ── upload ───────────────────────────────────────────────────────────── */
  function uploadPanel() {
    const n = changes();
    const msg = h('input', { class: 'le-input', value: `Edit ${location.pathname === '/' ? 'the homepage' : location.pathname} in Studio` });
    const push = h('input', { type: 'checkbox', checked: true });
    const parts = [];
    const nt = Object.keys(S.draft.text).filter(k => S.draft.text[k] !== S.base.text[k]).length;
    const dropT = Object.keys(S.base.text).filter(k => !(k in S.draft.text)).length;
    const ni = Object.keys(S.draft.img).filter(k => !same(S.draft.img[k], S.base.img[k])).length;
    if (nt) parts.push(`${nt} line${nt === 1 ? '' : 's'} of words, into the files they were built from`);
    if (dropT) parts.push(`${dropT} line${dropT === 1 ? '' : 's'} put back as built`);
    if (ni) parts.push(`${ni} picture${ni === 1 ? '' : 's'}`);
    if (!same(S.draft.layout, S.base.layout) || !same(S.draft.cards, S.base.cards)) parts.push('the layout and cards, into data/site.json');
    if (!same(S.draft.slots, S.base.slots)) parts.push('the 3D slots, into data/site.json');
    if (!same(S.draft.blocks, S.base.blocks)) parts.push(`${S.draft.blocks.length} added section${S.draft.blocks.length === 1 ? '' : 's'}, written into the page by the build (pictures into assets/img/blocks/)`);
    return [
      h('h3', null, 'Upload'),
      h('p', { class: 'le-hint' }, `${n} change${n === 1 ? '' : 's'} on this page:`),
      h('ul', { class: 'le-report' }, parts.map(p => h('li', null, p))),
      h('p', { class: 'le-hint' }, 'The site is built, committed and pushed to GitHub with the keys on the Keys tab, and is online a minute or two later. The page here then reloads as built.'),
      h('label', { class: 'le-field' }, h('span', null, 'What changed (the commit\'s message)'), msg),
      h('label', { class: 'le-check' }, push, 'Push it online (off: commit here only)'),
      btn(S.busy ? 'Uploading…' : '⇪ Upload and publish', () => upload(msg.value, push.checked), 'accent', { disabled: S.busy || !n }),
      S.report ? reportView(S.report) : null,
    ];
  }
  function reportView(r) {
    return h('div', { class: 'le-seg' },
      h('span', { class: 'le-lbl' }, r.ok ? 'Done' : 'Stopped'),
      h('ul', { class: 'le-report' }, (r.report || []).map(x => h('li', null, h('b', null, x.where || x.key), x.note ? ' · ' + x.note : '', x.ok === false ? ' · not written' : ''))),
      r.stoppedAt ? h('p', { class: 'le-hint bad' }, 'Stopped at ' + r.stoppedAt + ': ' + norm(((r.log || []).find(l => !l.ok) || {}).output || '').slice(-300)) : null,
      r.ok && r.pushed === false ? h('p', { class: 'le-hint' }, 'Committed here, not pushed.') : null);
  }
  async function upload(message, push) {
    endText();
    endBlockText();
    stopPose();
    const ix = window.SBF.index();
    const texts = [];
    for (const [key, html] of Object.entries(S.draft.text)) {
      if (S.base.text[key] === html) continue;
      const t = ix.texts.find(x => x.key === key);
      if (t) texts.push({ key, stock: t.stock, html, occ: t.occ });
    }
    const images = [];
    for (const [key, v] of Object.entries(S.draft.img)) {
      if (same(v, S.base.img[key])) continue;
      const t = ix.imgs.find(x => x.key === key);
      if (t) images.push({ key, stockSrc: t.stockSrc, ...(v.data ? { data: v.data } : { url: v.url }) });
    }
    const body = {
      path: location.pathname, texts, images, message, push,
      site: {
        layout: S.draft.layout, cards: S.draft.cards,
        dropText: Object.keys(S.base.text).filter(k => !(k in S.draft.text)),
        dropImg: Object.keys(S.base.img).filter(k => !(k in S.draft.img)),
        ...(home() ? { slots: S.draft.slots } : {}),
        blocks: S.draft.blocks,
      },
    };
    S.busy = true; S.report = null; renderBar(); renderPanel();
    let r;
    try { r = await api('/api/site/upload', body); } catch (e) { r = { ok: false, report: [], stoppedAt: 'Studio', log: [{ ok: false, output: e.message }] }; }
    S.busy = false; S.report = r;
    if (r.ok) {
      S.base = clone(S.draft);
      try { sessionStorage.setItem('sbf-toast', r.pushed === false ? 'Uploaded: committed here, not pushed.' : 'Uploaded: built, committed and pushed. Online in a minute or two.'); } catch (e) { /* only the note */ }
      S.editing = false;
      setTimeout(() => location.reload(), 1200);
    }
    renderBar(); renderPanel();
  }

  /* ── the panel ────────────────────────────────────────────────────────── */
  function renderPanel() {
    const sel = S.sel;
    let body = null;
    if (sel && sel.kind === 'text') body = textPanel(sel.t);
    else if (sel && sel.kind === 'img') body = imgPanel(sel.t);
    else if (sel && sel.kind === 'card') body = cardPanel(sel.c);
    else if (sel && sel.kind === 'slot') body = slotPanel(sel.id);
    else if (S.panel === 'layout') body = layoutPanel();
    else if (S.panel === 'upload') body = uploadPanel();
    else if (sel && sel.kind === 'block') body = blockPanel(sel);
    else if (S.panel === 'addsection') body = addSectionPanel();
    const top = panel.scrollTop;
    panel.replaceChildren();
    if (!body || !S.editing && !S.report) { panel.style.display = 'none'; return; }
    panel.style.display = '';
    panel.append(h('button', { class: 'le-x', type: 'button', onclick: () => { stopPose(); select(null); renderBar(); } }, '×'), ...[body].flat(Infinity).filter(Boolean));
    panel.scrollTop = top;
  }

  /* ── sections of its own: a grid of rows, columns and items ───────────────
     A section added here is a 12-column grid: rows, columns in them, and in
     each column headings, words, cards and pictures (assets/js/blocks.js has
     the model and draws them; the build writes them into the page). A click
     on one selects the deepest thing under the pointer (an item, else its
     column, its row, its section); the panel's breadcrumb goes back up. Words
     are typed on the page. Everything else is the panel's. */
  const BK = () => window.SBF_BLOCKS;
  function needBlocks() {
    if (!document.querySelector('link[href="/assets/css/blocks.css"]')) {
      document.head.appendChild(h('link', { rel: 'stylesheet', href: '/assets/css/blocks.css' }));
    }
    if (window.SBF_BLOCKS) return Promise.resolve();
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = '/assets/js/blocks.js';
      s.onload = res; s.onerror = () => rej(new Error('could not load blocks.js'));
      document.body.appendChild(s);
    });
  }
  const blockOf = id => S.draft.blocks.find(b => b.id === id);
  const KIND = { heading: 'Heading', text: 'Words', card: 'Card', image: 'Picture' };
  const SPAN_LABEL = { 12: '1', 6: '½', 4: '⅓', 3: '¼', 8: '⅔', 9: '¾' };
  const layoutName = spans => spans.map(s => SPAN_LABEL[s] || s + '/12').join(' + ');

  function drawBlock(b) {
    const tmp = document.createElement('div');
    tmp.innerHTML = BK().render(b, true);
    const el = tmp.firstElementChild;
    const old = document.getElementById(b.id);
    if (old) old.replaceWith(el);
    else (document.querySelector('body > footer') || document.querySelector('footer') || document.body.lastElementChild).before(el);
    window.SBF.placeBlocks(S.draft.blocks.map(x => ({ id: x.id, after: x.after })));
    markSel();
  }
  function drawAll() {
    const ids = new Set(S.draft.blocks.map(b => b.id));
    document.querySelectorAll('section.sbf-block').forEach(el => { if (!ids.has(el.id)) el.remove(); });
    S.draft.blocks.forEach(drawBlock);
  }
  function markSel() {
    document.querySelectorAll('.sbf-block .le-sel, .sbf-block.le-sel').forEach(e => e.classList.remove('le-sel'));
    const s = S.sel;
    if (!s || s.kind !== 'block') return;
    const sec = document.getElementById(s.id);
    if (!sec) return;
    const el = s.i != null ? sec.querySelector(`[data-bi="${s.r}.${s.c}.${s.i}"]`)
      : s.c != null ? sec.querySelector(`[data-bc="${s.r}.${s.c}"]`)
      : s.r != null ? sec.querySelector(`[data-br="${s.r}"]`) : sec;
    if (el) el.classList.add('le-sel');
  }

  /** Change the draft's section and draw it again. `quiet` leaves the panel as it is (sliders, typing). */
  function edit(id, fn, quiet) {
    const b = blockOf(id);
    if (!b) return;
    fn(b);
    drawBlock(b);
    changed();
    if (!quiet) renderPanel();
  }
  const move = (arr, i, by) => { const j = i + by; if (j < 0 || j >= arr.length) return i; [arr[i], arr[j]] = [arr[j], arr[i]]; return j; };
  const deep = o => JSON.parse(JSON.stringify(o));

  /* Words typed into an added section go into its model as they are typed. */
  function editField(el, sel, name) {
    endBlockText();
    S.bedit = { el, sel, name, before: el.innerHTML };
    el.setAttribute('contenteditable', 'true');
    el.focus();
  }
  function commitField() {
    const E = S.bedit;
    if (!E) return;
    const b = blockOf(E.sel.id);
    const it = b && b.rows[E.sel.r] && b.rows[E.sel.r].cols[E.sel.c] && b.rows[E.sel.r].cols[E.sel.c].items[E.sel.i];
    if (!it) return;
    it[E.name] = E.name === 'kicker' || E.name === 'caption' ? norm(E.el.textContent).slice(0, 200) : BK().cleanHtml(E.el.innerHTML);
    changed();
  }
  function endBlockText() {
    if (!S.bedit) return;
    commitField();
    S.bedit.el.removeAttribute('contenteditable');
    S.bedit = null;
  }
  function blockClick(sec, target) {
    const id = sec.id;
    const itemEl = target.closest('[data-bi]');
    if (itemEl && sec.contains(itemEl)) {
      const [r, c, i] = itemEl.dataset.bi.split('.').map(Number);
      const field = target.closest('[data-bf]');
      if (!(S.sel && S.sel.kind === 'block' && S.sel.id === id && S.sel.i === i && S.sel.c === c && S.sel.r === r)) select({ kind: 'block', id, r, c, i });
      if (field && itemEl.contains(field) && !(S.bedit && S.bedit.el === field)) editField(field, { id, r, c, i }, field.dataset.bf);
      return;
    }
    const colEl = target.closest('[data-bc]');
    if (colEl && sec.contains(colEl)) { const [r, c] = colEl.dataset.bc.split('.').map(Number); return select({ kind: 'block', id, r, c }); }
    const rowEl = target.closest('[data-br]');
    if (rowEl && sec.contains(rowEl)) return select({ kind: 'block', id, r: +rowEl.dataset.br });
    select({ kind: 'block', id });
  }

  /* ── where a section stands ── */
  /** The page's top-level sections, its own and added ones, as they stand now. */
  const sequence = () => Array.from(document.querySelectorAll('section[id]')).filter(s => !s.parentElement.closest('section')).map(s => s.id);
  /** Stand section b after `anchor`, keeping every other added section where it was. */
  function reanchor(b, anchor) {
    const old = b.after;
    for (const o of S.draft.blocks) if (o !== b && o.after === b.id) o.after = old;
    for (const o of S.draft.blocks) if (o !== b && o.after === anchor) o.after = b.id;
    b.after = anchor;
  }
  function moveBlock(b, by) {
    const seq = sequence(), k = seq.indexOf(b.id);
    if (k < 0 || (by < 0 && k === 0) || (by > 0 && k === seq.length - 1)) return;
    reanchor(b, by < 0 ? (k >= 2 ? seq[k - 2] : 'top') : seq[k + 1]);
    window.SBF.placeBlocks(S.draft.blocks.map(x => ({ id: x.id, after: x.after })));
    document.getElementById(b.id).scrollIntoView({ block: 'nearest' });
    changed(); renderPanel();
  }
  /** The section the reader is looking at: where a new one goes after. */
  function sectionInView() {
    const mid = window.innerHeight * 0.45;
    let best = 'top';
    for (const id of sequence()) {
      const r = document.getElementById(id).getBoundingClientRect();
      if (r.top <= mid && r.height) best = id;
    }
    return best;
  }
  function addBlock(starter, after) {
    const b = BK().newBlock(after, starter);
    for (const o of S.draft.blocks) if (o.after === after) o.after = b.id;
    S.draft.blocks.push(b);
    drawBlock(b);
    changed();
    document.getElementById(b.id).scrollIntoView({ block: 'center' });
    select({ kind: 'block', id: b.id });
  }
  function removeBlock(b) {
    for (const o of S.draft.blocks) if (o.after === b.id) o.after = b.after;
    S.draft.blocks = S.draft.blocks.filter(x => x !== b);
    const el = document.getElementById(b.id);
    if (el) el.remove();
    window.SBF.placeBlocks(S.draft.blocks.map(x => ({ id: x.id, after: x.after })));
    select(null); changed();
  }
  function duplicateBlock(b) {
    const copy = { ...deep(b), id: BK().newId() };
    S.draft.blocks.splice(S.draft.blocks.indexOf(b) + 1, 0, copy);
    for (const o of S.draft.blocks) if (o !== copy && o.after === b.id) o.after = copy.id;
    copy.after = b.id;
    drawBlock(copy);
    changed();
    select({ kind: 'block', id: copy.id });
  }

  /* ── the panel's pieces ── */
  const pageColor = tok => getComputedStyle(document.body).getPropertyValue('--' + tok).trim() || '#888';
  /** Theme, the theme's own colours (kept by name, so they follow day mode), or any colour. */
  function swatches(now, onpick, themeLabel) {
    const custom = /^#/.test(now || '') ? now : '';
    return h('div', { class: 'le-row' },
      h('button', { class: 'le-mini' + (!now ? ' on' : ''), type: 'button', onclick: () => onpick('') }, themeLabel || 'Theme'),
      BK().TOKENS.map(t => h('button', { class: 'le-mini' + (now === t ? ' on' : ''), type: 'button', title: BK().TOKEN_NAMES[t], onclick: () => onpick(t) },
        h('span', { style: `display:inline-block;width:10px;height:10px;border-radius:50%;vertical-align:-1px;background:${pageColor(t)}` }), ' ', BK().TOKEN_NAMES[t])),
      h('label', { class: 'le-mini' + (custom ? ' on' : ''), title: 'Any colour' }, 'Pick ',
        h('input', { type: 'color', value: custom || '#e8c547', style: 'width:18px;height:14px;border:0;padding:0;background:none;vertical-align:-3px', oninput: e => onpick(e.target.value) })));
  }
  function crumbs(s) {
    const b = blockOf(s.id);
    const parts = [btn('Section', () => select({ kind: 'block', id: s.id }), s.r == null ? 'on' : '')];
    if (s.r != null) parts.push(btn('Row ' + (s.r + 1), () => select({ kind: 'block', id: s.id, r: s.r }), s.c == null ? 'on' : ''));
    if (s.c != null) parts.push(btn('Column ' + (s.c + 1), () => select({ kind: 'block', id: s.id, r: s.r, c: s.c }), s.i == null ? 'on' : ''));
    if (s.i != null) { const it = b.rows[s.r].cols[s.c].items[s.i]; parts.push(btn(KIND[it.t], () => {}, 'on')); }
    return h('div', { class: 'le-row' }, parts.map((p, i) => [i ? h('span', { class: 'le-dim' }, '›') : null, p]));
  }
  function listRow(label, onSel, onUp, onDown, onDel, on) {
    return h('div', { class: 'le-item' + (on ? ' on' : '') },
      h('button', { class: 'le-item-name', type: 'button', style: 'background:none;border:0;color:inherit;font:inherit;text-align:left;cursor:pointer;padding:0', onclick: onSel }, label),
      h('button', { class: 'le-mini', type: 'button', disabled: !onUp, onclick: onUp }, '↑'),
      h('button', { class: 'le-mini', type: 'button', disabled: !onDown, onclick: onDown }, '↓'),
      h('button', { class: 'le-mini', type: 'button', onclick: onDel, title: 'Delete' }, '✕'));
  }
  const layoutButtons = onpick => h('div', { class: 'le-row' }, BK().LAYOUTS.map(sp => btn(layoutName(sp), () => onpick(sp))));
  function pictureControls(cur, onset, label) {
    const file = h('input', { type: 'file', accept: 'image/*', style: 'display:none', onchange: async e => {
      const f = e.target.files[0];
      if (!f) return;
      try {
        const data = await shrink(f, '');
        if (data.length > 12e6) { toast('That picture is too large, even made 1600 px across.', true); return; }
        onset(data);
      } catch (err) { toast('Could not read that picture.', true); }
    } });
    const addr = h('input', { class: 'le-input', placeholder: '/assets/img/… or https://…', value: /^data:/.test(cur || '') ? '' : cur || '' });
    return [
      h('span', { class: 'le-lbl' }, label || 'Picture'),
      cur ? h('img', { class: 'le-preview', src: cur, alt: '' }) : null,
      h('div', { class: 'le-row' }, btn('Upload…', () => file.click(), 'accent'), file, cur ? btn('Remove', () => onset('')) : null),
      h('div', { class: 'le-row' }, addr, btn('Use', () => {
        const u = addr.value.trim();
        if (!BK().cleanSrc(u) || /^data:/.test(u)) { toast('Give a path on this site (/…) or an https link.', true); return; }
        onset(u);
      })),
      h('p', { class: 'le-hint' }, 'An upload is made at most 1600 px across and saved in assets/img/blocks/ when you upload the page.'),
    ];
  }
  const field = (label, value, oninput, placeholder) => h('label', { class: 'le-field' }, h('span', null, label),
    h('input', { class: 'le-input', value: value || '', placeholder: placeholder || '', oninput: e => oninput(e.target.value) }));

  /* ── the panels ── */
  function blockPanel(s) {
    const b = blockOf(s.id);
    if (!b) return [h('p', { class: 'le-hint' }, 'That section is gone.')];
    if (s.i != null) return itemPanel(s, b);
    if (s.c != null) return columnPanel(s, b);
    if (s.r != null) return rowPanel(s, b);
    return sectionPanel(s, b);
  }

  function sectionPanel(s, b) {
    const seq = sequence(), k = seq.indexOf(b.id);
    return [
      crumbs(s),
      h('h3', null, 'Section'),
      h('p', { class: 'le-hint' }, 'A grid of rows and columns, added here. Click a row, a column or anything in them to edit it.'),
      h('span', { class: 'le-lbl' }, 'Rows'),
      h('div', { class: 'le-seg' }, b.rows.map((r, ri) => listRow(`Row ${ri + 1} · ${layoutName(r.cols.map(c => c.span))}`,
        () => select({ kind: 'block', id: b.id, r: ri }),
        ri > 0 ? () => edit(b.id, x => move(x.rows, ri, -1)) : null,
        ri < b.rows.length - 1 ? () => edit(b.id, x => move(x.rows, ri, 1)) : null,
        () => edit(b.id, x => x.rows.splice(ri, 1))))),
      h('span', { class: 'le-lbl' }, '+ Add a row with columns'),
      layoutButtons(sp => edit(b.id, x => x.rows.push({ gap: 'm', align: 'start', cols: sp.map(span => ({ span, items: [] })) }))),
      h('span', { class: 'le-lbl' }, 'Background'),
      h('div', { class: 'le-row' }, [['', 'None'], ['surface', 'Surface'], ['panel', 'Panel']].map(([v, l]) =>
        btn(l, () => edit(b.id, x => { x.bg = v; }), (b.bg || '') === v ? 'on' : ''))),
      swatches(BK().TOKENS.includes(b.bg) || /^#/.test(b.bg || '') ? b.bg : '', v => edit(b.id, x => { x.bg = v; }, /^#/.test(v)), 'No colour'),
      ...seg('Width', [['narrow', 'Narrow'], ['site', 'As the site'], ['wide', 'Wide'], ['full', 'Full width']], b.width, v => edit(b.id, x => { x.width = v; })),
      ...seg('Space above and below', [['s', 'Small'], ['m', 'As the site'], ['l', 'Large']], b.pad, v => edit(b.id, x => { x.pad = v; })),
      h('span', { class: 'le-lbl' }, 'Where it stands'),
      h('div', { class: 'le-row' },
        btn('↑ Up', () => moveBlock(b, -1), '', { disabled: k <= 0 }),
        btn('↓ Down', () => moveBlock(b, 1), '', { disabled: k < 0 || k >= seq.length - 1 }),
        btn('Duplicate', () => duplicateBlock(b)),
        btn(b.hidden ? 'Show' : 'Hide', () => edit(b.id, x => { if (x.hidden) delete x.hidden; else x.hidden = true; }))),
      btn('Delete this section', () => { if (confirm('Delete this section and everything in it?')) removeBlock(b); }, 'warn'),
    ];
  }

  function setLayoutOf(row, spans) {
    while (row.cols.length < spans.length) row.cols.push({ span: 12, items: [] });
    while (row.cols.length > spans.length) { const gone = row.cols.pop(); row.cols[row.cols.length - 1].items.push(...gone.items); }
    row.cols.forEach((c, i) => { c.span = spans[i]; });
  }
  function rowPanel(s, b) {
    const r = b.rows[s.r];
    if (!r) return [crumbs({ id: s.id }), h('p', { class: 'le-hint' }, 'That row is gone.')];
    return [
      crumbs(s),
      h('h3', null, `Row ${s.r + 1}`),
      h('span', { class: 'le-lbl' }, 'Columns'),
      h('p', { class: 'le-hint' }, `Now ${layoutName(r.cols.map(c => c.span))}. Fewer columns put the items of the ones taken away into the last one. Under 900 px wide every column is full width.`),
      layoutButtons(sp => edit(b.id, x => setLayoutOf(x.rows[s.r], sp))),
      h('div', { class: 'le-seg' }, r.cols.map((c, ci) => listRow(`Column ${ci + 1} · ${c.span}/12 · ${c.items.length} item${c.items.length === 1 ? '' : 's'}`,
        () => select({ kind: 'block', id: b.id, r: s.r, c: ci }),
        ci > 0 ? () => edit(b.id, x => move(x.rows[s.r].cols, ci, -1)) : null,
        ci < r.cols.length - 1 ? () => edit(b.id, x => move(x.rows[s.r].cols, ci, 1)) : null,
        () => edit(b.id, x => x.rows[s.r].cols.splice(ci, 1))))),
      btn('+ Add a column', () => edit(b.id, x => x.rows[s.r].cols.push({ span: 6, items: [] }))),
      ...seg('Space between columns', [['s', 'Small'], ['m', 'As the site'], ['l', 'Large']], r.gap, v => edit(b.id, x => { x.rows[s.r].gap = v; })),
      ...seg('Columns stand', [['start', 'Top'], ['center', 'Middle'], ['end', 'Bottom'], ['stretch', 'Full height']], r.align, v => edit(b.id, x => { x.rows[s.r].align = v; })),
      h('span', { class: 'le-lbl' }, 'This row'),
      h('div', { class: 'le-row' },
        btn('↑ Up', () => { edit(b.id, x => move(x.rows, s.r, -1)); select({ ...s, r: Math.max(0, s.r - 1) }); }, '', { disabled: s.r === 0 }),
        btn('↓ Down', () => { edit(b.id, x => move(x.rows, s.r, 1)); select({ ...s, r: Math.min(b.rows.length - 1, s.r + 1) }); }, '', { disabled: s.r === b.rows.length - 1 }),
        btn('Duplicate', () => edit(b.id, x => x.rows.splice(s.r + 1, 0, deep(x.rows[s.r])))),
        btn('Delete', () => { edit(b.id, x => x.rows.splice(s.r, 1)); select({ kind: 'block', id: b.id }); }, 'warn')),
    ];
  }

  function columnPanel(s, b) {
    const c = b.rows[s.r] && b.rows[s.r].cols[s.c];
    if (!c) return [crumbs({ id: s.id }), h('p', { class: 'le-hint' }, 'That column is gone.')];
    const add = t => { edit(b.id, x => x.rows[s.r].cols[s.c].items.push(BK().NEW[t]())); select({ ...s, i: c.items.length - 1 }); };
    return [
      crumbs(s),
      h('h3', null, `Column ${s.c + 1}`),
      slider('Width', c.span, 1, 12, 1, v => `${v} / 12`, v => edit(b.id, x => { x.rows[s.r].cols[s.c].span = v; }, true)),
      h('p', { class: 'le-hint' }, 'Of the 12 columns of the grid. Columns past 12 wrap onto a new line.'),
      h('span', { class: 'le-lbl' }, 'Add'),
      h('div', { class: 'le-row' }, btn('Heading', () => add('heading')), btn('Words', () => add('text')), btn('Card', () => add('card')), btn('Picture', () => add('image'))),
      c.items.length ? h('span', { class: 'le-lbl' }, 'In it') : h('p', { class: 'le-hint' }, 'Nothing in it yet.'),
      h('div', { class: 'le-seg' }, c.items.map((it, ii) => listRow(`${KIND[it.t]} · ${norm((it.html || it.title || it.alt || it.src || '').replace(/<[^>]+>/g, ' ')).slice(0, 28) || '…'}`,
        () => select({ ...s, i: ii }),
        ii > 0 ? () => edit(b.id, x => move(x.rows[s.r].cols[s.c].items, ii, -1)) : null,
        ii < c.items.length - 1 ? () => edit(b.id, x => move(x.rows[s.r].cols[s.c].items, ii, 1)) : null,
        () => edit(b.id, x => x.rows[s.r].cols[s.c].items.splice(ii, 1))))),
      h('span', { class: 'le-lbl' }, 'This column'),
      h('div', { class: 'le-row' },
        btn('← Left', () => { edit(b.id, x => move(x.rows[s.r].cols, s.c, -1)); select({ ...s, c: Math.max(0, s.c - 1) }); }, '', { disabled: s.c === 0 }),
        btn('Right →', () => { edit(b.id, x => move(x.rows[s.r].cols, s.c, 1)); select({ ...s, c: Math.min(b.rows[s.r].cols.length - 1, s.c + 1) }); }, '', { disabled: s.c === b.rows[s.r].cols.length - 1 }),
        btn('Duplicate', () => edit(b.id, x => x.rows[s.r].cols.splice(s.c + 1, 0, deep(x.rows[s.r].cols[s.c])))),
        btn('Delete', () => { edit(b.id, x => x.rows[s.r].cols.splice(s.c, 1)); select({ kind: 'block', id: b.id, r: s.r }); }, 'warn')),
    ];
  }

  function itemPanel(s, b) {
    const it = b.rows[s.r] && b.rows[s.r].cols[s.c] && b.rows[s.r].cols[s.c].items[s.i];
    if (!it) return [crumbs({ id: s.id }), h('p', { class: 'le-hint' }, 'That item is gone.')];
    const set = (patch, quiet) => edit(b.id, x => Object.assign(x.rows[s.r].cols[s.c].items[s.i], patch), quiet);
    const keep = e => e.preventDefault();
    const out = [crumbs(s), h('h3', null, KIND[it.t])];
    const align = () => seg('Align', [['', 'Theme'], ['left', 'Left'], ['center', 'Centre'], ['right', 'Right']], it.align || '', v => set({ align: v }));
    const marks = () => h('div', { class: 'le-row' },
      btn(h('b', null, 'B'), () => document.execCommand('bold'), '', { onmousedown: keep }),
      btn(h('i', null, 'I'), () => document.execCommand('italic'), '', { onmousedown: keep }),
      btn('↗ Link', () => {
        const url = prompt('Link to (https://…, /a-page/, mailto:…)');
        if (url && BK().cleanHref(url)) document.execCommand('createLink', false, url.trim());
      }, '', { onmousedown: keep }),
      btn(h('span', { style: `color:${pageColor('accent')}` }, 'A'), () => {
        const sel = window.getSelection();
        if (!sel.rangeCount || sel.isCollapsed) return;
        const span = document.createElement('span'); span.className = 'accent';
        try { sel.getRangeAt(0).surroundContents(span); commitField(); } catch (e) { toast('Select words inside one line to colour them.', true); }
      }, '', { onmousedown: keep, title: 'The selected words in the theme\'s accent colour' }));
    if (it.t === 'heading') {
      out.push(h('p', { class: 'le-hint' }, 'Type the heading on the page.'), marks(),
        ...seg('Kind', [[2, 'Title (H2)'], [3, 'Subtitle (H3)'], [4, 'Small (H4)']], it.level, v => set({ level: v })),
        ...seg('Size', [['', 'Theme'], ['s', 'S'], ['m', 'M'], ['l', 'L'], ['xl', 'XL']], typeof it.size === 'number' ? 'px' : it.size || '', v => set({ size: v })),
        h('label', { class: 'le-field le-inline' }, h('span', null, 'Or exactly'),
          h('input', { class: 'le-input', type: 'number', min: 10, max: 160, value: typeof it.size === 'number' ? it.size : '', placeholder: 'px',
            onchange: e => { const v = +e.target.value; set({ size: v >= 10 && v <= 160 ? Math.round(v) : '' }); } }), h('span', { class: 'le-dim' }, 'px')),
        h('span', { class: 'le-lbl' }, 'Colour'), swatches(it.color, v => set({ color: v }, /^#/.test(v))),
        ...align(),
        field('Small line above it', it.kicker, v => set({ kicker: v.slice(0, 80) }, true), '01 · SOMETHING'));
    } else if (it.t === 'text') {
      out.push(h('p', { class: 'le-hint' }, 'Type straight on the page. Enter makes a new line; pasted text comes in plain.'), marks(),
        ...seg('Size', [['', 'Theme'], ['s', 'S'], ['m', 'M'], ['l', 'L']], it.size || '', v => set({ size: v })),
        h('span', { class: 'le-lbl' }, 'Colour'), swatches(it.color, v => set({ color: v }, /^#/.test(v))),
        ...align());
    } else if (it.t === 'card') {
      out.push(h('p', { class: 'le-hint' }, 'Type its title and words on the page.'), marks(),
        ...pictureControls(it.img, v => set({ img: v }), 'Its picture'),
        it.img ? seg('Picture shape', [['square', 'Square'], ['wide', 'Wide'], ['tall', 'Tall']], it.shape, v => set({ shape: v })) : null,
        it.img ? field('Picture described (for screen readers and search)', it.alt, v => set({ alt: v }, true)) : null,
        field('Small line above its title', it.kicker, v => set({ kicker: v.slice(0, 60) }, true), 'PRINT · 2026'),
        field('Links to', it.href, v => set({ href: BK().cleanHref(v) }, true), '/work/space-fox/ or https://…'),
        ...seg('Style', [['', 'Theme'], ['outline', 'Outline'], ['filled', 'Filled'], ['plain', 'Plain']], it.style || '', v => set({ style: v })),
        h('span', { class: 'le-lbl' }, 'Tint (its top edge, filled colour)'), swatches(it.color, v => set({ color: v }, /^#/.test(v)), 'Accent'),
        ...align());
    } else if (it.t === 'image') {
      out.push(...pictureControls(it.src, v => set({ src: v })),
        field('Described (for screen readers and search)', it.alt, v => set({ alt: v }, true)),
        field('Caption under it', it.caption, v => set({ caption: v.slice(0, 200) }, true)),
        ...seg('Shape', [['', 'As it is'], ['1/1', 'Square'], ['4/3', '4:3'], ['16/9', '16:9'], ['3/4', 'Tall']], it.ratio || '', v => set({ ratio: v })),
        it.ratio ? seg('In that shape', [['cover', 'Fill it'], ['contain', 'Whole picture']], it.fit, v => set({ fit: v })) : null,
        ...seg('Corners', [['', 'Theme'], ['none', 'Square'], ['round', 'Round']], it.radius || '', v => set({ radius: v })),
        field('Links to', it.href, v => set({ href: BK().cleanHref(v) }, true), '/work/space-fox/ or https://…'));
    }
    const items = b.rows[s.r].cols[s.c].items;
    out.push(h('span', { class: 'le-lbl' }, 'This ' + KIND[it.t].toLowerCase()),
      h('div', { class: 'le-row' },
        btn('↑ Up', () => { edit(b.id, x => move(x.rows[s.r].cols[s.c].items, s.i, -1)); select({ ...s, i: Math.max(0, s.i - 1) }); }, '', { disabled: s.i === 0 }),
        btn('↓ Down', () => { edit(b.id, x => move(x.rows[s.r].cols[s.c].items, s.i, 1)); select({ ...s, i: Math.min(items.length - 1, s.i + 1) }); }, '', { disabled: s.i === items.length - 1 }),
        btn('Duplicate', () => edit(b.id, x => x.rows[s.r].cols[s.c].items.splice(s.i + 1, 0, deep(it)))),
        btn('Delete', () => { edit(b.id, x => x.rows[s.r].cols[s.c].items.splice(s.i, 1)); select({ kind: 'block', id: b.id, r: s.r, c: s.c }); }, 'warn')));
    return out;
  }

  function addSectionPanel() {
    const seq = sequence();
    const name = id => (id === 'top' ? 'The top, under the hero' : /^b-/.test(id) ? 'An added section' : sectionName({ el: document.getElementById(id), id }));
    let after = sectionInView();
    const where = h('select', { class: 'le-select', onchange: e => { after = e.target.value; } },
      h('option', { value: 'top', selected: after === 'top' }, name('top')),
      seq.map(id => h('option', { value: id, selected: id === after }, 'After: ' + name(id))));
    return [
      h('h3', null, 'Add a section'),
      h('p', { class: 'le-hint' }, 'A grid of rows and columns, with headings, words, cards and pictures in it, in the site\'s own colours and type. Start from one of these and change anything.'),
      h('span', { class: 'le-lbl' }, 'Where'), where,
      h('span', { class: 'le-lbl' }, 'Start from'),
      h('div', { class: 'le-seg' }, Object.keys(BK().STARTERS).map(k => btn(k, () => addBlock(k, after)))),
    ];
  }

  /* ── off we go ────────────────────────────────────────────────────────── */
  renderBar();
  try {
    const note = sessionStorage.getItem('sbf-toast');
    if (note) { sessionStorage.removeItem('sbf-toast'); toast(note); }
  } catch (e) { /* no note */ }
  checkOnline(false);
})();
