/* ═══════════════════════════════════════════════════════════════════════════
   SECTIONS ADDED IN STUDIO: the model, and the one renderer

   Studio's page editor can add sections of its own to a page, built on a
   grid: a section holds rows, a row holds columns on a 12-column grid, and a
   column holds items, each a heading, words, a card or a picture. They are
   kept per page in data/site.json (`blocks`), and this file turns them into
   HTML in three places, so what is edited is exactly what is published:

     build.js       writes them into the built page, so they are in the HTML
                    that is served and indexed, like any other copy;
     server.js      cleans what the editor uploads (and saves its pictures);
     editor.js      draws them live while they are edited.

   Nothing here decides a look: an item set to "Theme" takes the site's own
   colours and type (blocks.css, on the site's CSS variables, day mode
   included), and a colour chosen from the theme is kept as the theme's name
   (accent, mirror, red…), so it follows the theme. Only a colour picked by
   hand is a fixed one.

   A section stands after another section of the page (`after`: its id, the
   id of another added section, 'top' or 'end'), so it keeps its place when
   the page around it changes.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root, make) {
  const api = make();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SBF_BLOCKS = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const TOKENS = ['text', 'muted', 'accent', 'mirror', 'red', 'earth', 'green'];
  const TOKEN_NAMES = { text: 'Text', muted: 'Quiet', accent: 'Accent', mirror: 'Mirror', red: 'Red', earth: 'Earth', green: 'Green' };
  const SPANS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const LIMITS = { blocks: 40, rows: 12, cols: 12, items: 40, html: 8000, line: 300 };

  /* ── cleaning ─────────────────────────────────────────────────────────── */
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const pick = (v, list, dflt) => (list.includes(v) ? v : dflt);
  const str = (v, max) => String(v == null ? '' : v).slice(0, max || LIMITS.line);

  /** A colour: '' (the theme's), a theme colour by name, or a #rrggbb picked by hand. */
  /** A layer: a whole number from -10 (behind the 3D models) to 10 (in front), or none (as built). */
  const cleanZ = v => (Number.isInteger(v) && v >= -10 && v <= 10 ? v : null);
  const cleanColor = c => (TOKENS.includes(c) ? c : /^#[0-9a-f]{6}$/i.test(String(c || '')) ? String(c).toLowerCase() : '');
  const colorCss = c => (TOKENS.includes(c) ? `var(--${c})` : /^#[0-9a-f]{6}$/i.test(c || '') ? c : '');

  /** A picture's address: a path on the site, an https link, or (until it is uploaded) a data URL. */
  const cleanSrc = s => {
    const v = String(s || '');
    if (/^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(v)) return v;
    return /^(https:\/\/|\/(?!\/))[^\s"'<>]+$/.test(v) ? v.slice(0, 600) : '';
  };
  const cleanHref = s => {
    const v = String(s || '').trim();
    return /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)[^\s"'<>]*$/i.test(v) ? v.slice(0, 600) : '';
  };

  /**
   * Words typed on the page: text, line breaks, bold, italic, links, and a
   * span in one of the theme's colours. Anything else is taken out (its words
   * kept); script and style with their contents. Works on a string, so the
   * build and the server need no DOM.
   */
  function cleanHtml(html) {
    let s = String(html || '').replace(/<(script|style|iframe|object|template)\b[\s\S]*?<\/\1\s*>/gi, '').replace(/<!--[\s\S]*?-->/g, '');
    const out = [];
    const open = [];
    for (const part of s.split(/(<[^>]*>)/)) {
      if (!part) continue;
      if (part[0] !== '<') { out.push(part.replace(/</g, '&lt;').replace(/>/g, '&gt;')); continue; }
      const m = /^<(\/?)([a-z][a-z0-9]*)(\s[^>]*)?\/?>$/i.exec(part);
      if (!m) { out.push(part.replace(/</g, '&lt;').replace(/>/g, '&gt;')); continue; }
      const close = !!m[1], name = m[2].toLowerCase(), attrs = m[3] || '';
      if (name === 'br') { out.push('<br>'); continue; }
      if (/^(div|p|li|h[1-6])$/.test(name)) { if (close && out.length) out.push('<br>'); continue; }
      const tag = { b: 'strong', strong: 'strong', i: 'em', em: 'em', a: 'a', span: 'span' }[name];
      if (!tag) continue;
      if (close) {
        const at = open.lastIndexOf(tag);
        if (at < 0) continue;
        while (open.length > at) out.push(`</${open.pop()}>`);
        continue;
      }
      if (tag === 'a') {
        const href = cleanHref((/\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attrs) || [])[2] ?? '');
        const ext = /^https?:/i.test(href);
        out.push(href ? `<a href="${esc(href)}"${ext ? ' target="_blank" rel="noopener"' : ''}>` : '<a>');
      } else if (tag === 'span') {
        const cls = (/\bclass\s*=\s*"([^"]*)"/i.exec(attrs) || [])[1] || '';
        const tok = cls.split(/\s+/).find(c => TOKENS.includes(c));
        if (!tok) { open.push('span'); out.push('<span>'); continue; }
        out.push(`<span class="${tok}">`);
      } else out.push(`<${tag}>`);
      open.push(tag);
    }
    while (open.length) out.push(`</${open.pop()}>`);
    return out.join('').replace(/^(\s*<br>)+|(<br>\s*)+$/g, '').trim().slice(0, LIMITS.html);
  }

  function cleanItem(it) {
    if (!it || typeof it !== 'object') return null;
    const base = { align: pick(it.align, ['', 'left', 'center', 'right'], ''), color: cleanColor(it.color), ...(cleanZ(it.z) != null ? { z: it.z } : {}) };
    switch (it.t) {
      case 'heading': {
        const size = typeof it.size === 'number' && it.size >= 10 && it.size <= 160 ? Math.round(it.size) : pick(it.size, ['', 's', 'm', 'l', 'xl'], '');
        return { t: 'heading', html: cleanHtml(it.html) || 'Heading', level: pick(+it.level, [2, 3, 4], 2), size, kicker: str(it.kicker, 80), ...base };
      }
      case 'text':
        return { t: 'text', html: cleanHtml(it.html), size: pick(it.size, ['', 's', 'm', 'l'], ''), ...base };
      case 'card':
        return { t: 'card', title: cleanHtml(it.title), html: cleanHtml(it.html), img: cleanSrc(it.img), alt: str(it.alt, 160),
          shape: pick(it.shape, ['square', 'wide', 'tall'], 'square'), href: cleanHref(it.href),
          style: pick(it.style, ['', 'outline', 'filled', 'plain'], ''), kicker: str(it.kicker, 60), ...base };
      case 'image':
        return { t: 'image', src: cleanSrc(it.src), alt: str(it.alt, 160), caption: str(it.caption, 200),
          ratio: pick(it.ratio, ['', '1/1', '4/3', '16/9', '3/4'], ''), fit: pick(it.fit, ['cover', 'contain'], 'cover'),
          radius: pick(it.radius, ['', 'none', 'round'], ''), href: cleanHref(it.href), ...base };
      default: return null;
    }
  }
  function cleanBlock(b) {
    if (!b || typeof b !== 'object' || !/^b-[a-z0-9]{3,16}$/.test(String(b.id || ''))) return null;
    const rows = (Array.isArray(b.rows) ? b.rows : []).slice(0, LIMITS.rows).map(r => ({
      gap: pick(r && r.gap, ['s', 'm', 'l'], 'm'),
      align: pick(r && r.align, ['start', 'center', 'end', 'stretch'], 'start'),
      cols: (Array.isArray(r && r.cols) ? r.cols : []).slice(0, LIMITS.cols).map(c => ({
        span: pick(+(c && c.span), SPANS, 12),
        items: (Array.isArray(c && c.items) ? c.items : []).slice(0, LIMITS.items).map(cleanItem).filter(Boolean),
      })),
    })).filter(r => r.cols.length);
    const bg = TOKENS.includes(b.bg) || /^#[0-9a-f]{6}$/i.test(String(b.bg || '')) ? String(b.bg).toLowerCase() : pick(b.bg, ['', 'surface', 'panel'], '');
    return {
      id: b.id,
      after: /^(top|end|[A-Za-z][\w-]{0,60})$/.test(String(b.after || '')) ? String(b.after) : 'end',
      bg, width: pick(b.width, ['site', 'narrow', 'wide', 'full'], 'site'), pad: pick(b.pad, ['s', 'm', 'l'], 'm'),
      ...(b.hidden ? { hidden: true } : {}),
      ...(cleanZ(b.z) != null ? { z: b.z } : {}),
      rows,
    };
  }
  function cleanBlocks(list) {
    const seen = new Set();
    return (Array.isArray(list) ? list : []).slice(0, LIMITS.blocks).map(cleanBlock)
      .filter(b => b && !seen.has(b.id) && seen.add(b.id));
  }

  /* ── drawing ──────────────────────────────────────────────────────────── */
  const style = pairs => {
    const s = pairs.filter(([, v]) => v !== '' && v != null).map(([k, v]) => `${k}:${v}`).join(';');
    return s ? ` style="${esc(s)}"` : '';
  };
  const HEAD_SIZE = { s: '22px', m: 'clamp(26px,3vw,34px)', l: 'clamp(34px,5vw,56px)', xl: 'clamp(44px,7.5vw,92px)' };
  const TEXT_SIZE = { s: '12px', m: '14px', l: '17px' };
  const RATIO = { square: '1/1', wide: '16/9', tall: '3/4' };

  /** One item. `at` is [row, column, item], written on it so the editor can find it in the model. A picture not chosen yet is a placeholder while editing and nothing on the published page. */
  function renderItem(it, at, edit) {
    const pos = ` data-bi="${at.join('.')}"`;
    const zs = it.z != null ? [['position', 'relative'], ['z-index', String(it.z)]] : [];
    const align = it.align ? ['text-align', it.align] : null;
    if (it.t === 'heading') {
      const fs = typeof it.size === 'number' ? it.size + 'px' : HEAD_SIZE[it.size] || '';
      const kick = it.kicker ? `<div class="sbf-kicker" data-bf="kicker">${esc(it.kicker)}</div>` : '';
      return `<div class="sbf-item sbf-heading"${pos}${style([align || ['', ''], ...zs])}>${kick}<h${it.level} class="sbf-h h${it.level}" data-bf="html"${style([['font-size', fs], ['color', colorCss(it.color)]])}>${it.html}</h${it.level}></div>`;
    }
    if (it.t === 'text') {
      return `<div class="sbf-item sbf-t" data-bf="html"${pos}${style([align || ['', ''], ['font-size', TEXT_SIZE[it.size] || ''], ['color', colorCss(it.color)], ...zs])}>${it.html || ''}</div>`;
    }
    if (it.t === 'card') {
      const tag = it.href ? 'a' : 'div';
      const href = it.href ? ` href="${esc(it.href)}"${/^https?:/i.test(it.href) ? ' target="_blank" rel="noopener"' : ''}` : '';
      const media = it.img ? `<div class="sbf-card-media" style="aspect-ratio:${RATIO[it.shape]}"><img src="${esc(it.img)}" alt="${esc(it.alt)}" loading="lazy"></div>` : '';
      const kick = it.kicker ? `<div class="sbf-card-kicker" data-bf="kicker">${esc(it.kicker)}</div>` : '';
      return `<${tag} class="sbf-item sbf-card${it.style ? ' is-' + it.style : ''}"${pos}${href}${style([['--tint', colorCss(it.color)], align || ['', ''], ...zs])}>` +
        `${media}<div class="sbf-card-body">${kick}<h3 class="sbf-card-title" data-bf="title">${it.title || ''}</h3><div class="sbf-card-text" data-bf="html">${it.html || ''}</div></div></${tag}>`;
    }
    if (it.t === 'image') {
      if (!it.src && !edit) return '';
      const img = it.src ? `<img src="${esc(it.src)}" alt="${esc(it.alt)}" loading="lazy"${style([['object-fit', it.fit], ['aspect-ratio', it.ratio]])}>` : '<div class="sbf-img-empty">Picture</div>';
      const inner = it.href ? `<a href="${esc(it.href)}"${/^https?:/i.test(it.href) ? ' target="_blank" rel="noopener"' : ''}>${img}</a>` : img;
      return `<figure class="sbf-item sbf-img${it.radius ? ' r-' + it.radius : ''}"${pos}${style([align || ['', ''], ...zs])}>${inner}${it.caption ? `<figcaption data-bf="caption">${esc(it.caption)}</figcaption>` : ''}</figure>`;
    }
    return '';
  }

  /** The inside of a section: its rows. */
  function renderRows(b, edit) {
    return b.rows.map((r, ri) => `<div class="sbf-row g-${r.gap} a-${r.align}" data-br="${ri}">` +
      r.cols.map((c, ci) => `<div class="sbf-col s-${c.span}" data-bc="${ri}.${ci}">${c.items.map((it, ii) => renderItem(it, [ri, ci, ii], edit)).join('')}</div>`).join('') +
      '</div>').join('');
  }
  function sectionAttrs(b) {
    const bg = b.bg === 'surface' || b.bg === 'panel' ? `var(--${b.bg})` : colorCss(b.bg);
    const st = [bg ? `--sbf-bg:${bg}` : '', b.z != null ? `z-index:${b.z}` : ''].filter(Boolean).join(';');
    return { cls: `sbf-block w-${b.width} p-${b.pad}${bg ? ' has-bg' : ''}`, style: st };
  }
  /** A whole section, as it is written into the page. */
  function render(b, edit) {
    const a = sectionAttrs(b);
    return `<section id="${esc(b.id)}" class="${a.cls}" data-after="${esc(b.after)}"${a.style ? ` style="${esc(a.style)}"` : ''}${b.hidden ? ' data-sbf-hidden' : ''}>${renderRows(b, edit)}</section>`;
  }

  /* ── placing them in a built page (build.js) ──────────────────────────── */
  /** [start, end) of the top-level <section id="…"> in an HTML string, or null. */
  function sectionSpan(html, id) {
    const m = new RegExp(`<section\\b[^>]*\\bid="${id.replace(/[^\w-]/g, '')}"`).exec(html);
    if (!m) return null;
    const re = /<(\/?)section\b[^>]*>/gi;
    re.lastIndex = m.index;
    let depth = 0, t;
    while ((t = re.exec(html))) {
      depth += t[1] ? -1 : 1;
      if (!depth) return [m.index, t.index + t[0].length];
    }
    return null;
  }
  /** The page with its added sections written in, each after what it stands after. */
  function placeInHtml(html, blocks) {
    let out = html;
    const left = cleanBlocks(blocks);
    for (let pass = 0; pass < 3 && left.length; pass++) {
      for (let i = 0; i < left.length; i++) {
        const b = left[i];
        let at = -1;
        if (b.after === 'top') {
          const m = /<section\b[^>]*\bid="(?!b-)/.exec(out);
          at = m ? m.index : -1;
          /* After any section already put at the top, so their order is kept. */
          for (const prev of blocks) { if (prev.id === b.id) break; const s = prev.after === 'top' && sectionSpan(out, prev.id); if (s) at = Math.max(at, s[1]); }
        } else if (b.after !== 'end') {
          const s = sectionSpan(out, b.after);
          if (s) at = s[1];
          else if (pass < 2) continue;
        }
        if (at < 0) {
          const f = out.search(/<footer\b/);
          at = f >= 0 ? f : out.lastIndexOf('</body>');
        }
        out = out.slice(0, at) + '\n' + render(b) + '\n' + out.slice(at);
        left.splice(i--, 1);
      }
    }
    return out;
  }

  /* ── new things, for the editor ───────────────────────────────────────── */
  const newId = () => 'b-' + Math.random().toString(36).slice(2, 9);
  const NEW = {
    heading: () => ({ t: 'heading', html: 'A new heading', level: 2, size: '', kicker: '', align: '', color: '' }),
    text: () => ({ t: 'text', html: 'Words for this column. Click to type.', size: '', align: '', color: '' }),
    card: () => ({ t: 'card', title: 'Card title', html: 'A line or two about it.', img: '', alt: '', shape: 'square', href: '', style: '', kicker: '', align: '', color: '' }),
    image: () => ({ t: 'image', src: '', alt: '', caption: '', ratio: '', fit: 'cover', radius: '', href: '', align: '', color: '' }),
  };
  /** Column layouts a row can take: the spans, left to right. */
  const LAYOUTS = [[12], [6, 6], [4, 4, 4], [3, 3, 3, 3], [8, 4], [4, 8], [3, 6, 3]];
  /** Whole sections to start from. */
  const STARTERS = {
    'Heading and words': () => [[12, [NEW.heading(), NEW.text()]]],
    'Two columns': () => [[6, [{ ...NEW.heading(), level: 3, size: 'm', html: 'Left' }, NEW.text()]], [6, [{ ...NEW.heading(), level: 3, size: 'm', html: 'Right' }, NEW.text()]]],
    'Three cards': () => [[4, [NEW.card()]], [4, [NEW.card()]], [4, [NEW.card()]]],
    'Picture and words': () => [[6, [NEW.image()]], [6, [NEW.heading(), NEW.text()]]],
    'Empty row': () => [[12, []]],
  };
  function newBlock(after, starter) {
    const cols = (STARTERS[starter] || STARTERS['Heading and words'])();
    return { id: newId(), after: after || 'end', bg: '', width: 'site', pad: 'm', rows: [{ gap: 'm', align: 'start', cols: cols.map(([span, items]) => ({ span, items })) }] };
  }

  return { cleanZ, TOKENS, TOKEN_NAMES, LAYOUTS, STARTERS, NEW, LIMITS, cleanHtml, cleanSrc, cleanHref, cleanColor, colorCss, cleanItem, cleanBlock, cleanBlocks,
    render, renderRows, renderItem, sectionAttrs, sectionSpan, placeInHtml, newBlock, newId };
});
