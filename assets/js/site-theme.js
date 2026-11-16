/* ═══════════════════════════════════════════════════════════════════════════
   THE SITE'S THEME, SET IN STUDIO

   Studio's Theme menu (tools/studio/editor.js) sets the site's fonts and its
   colours, for night and for day: the primary text, the secondary (quiet)
   text, the accent, the background and its surfaces, the border, and the
   projects' own colours (mirror, red, earth, green). It is kept in
   data/site.json (`theme`) and the build writes it into the <head> of every
   page as one <style> over the page's own stylesheet, so nothing is set by
   script and every page shows it as it loads.

   Only what was set is written: a colour left as built keeps the
   stylesheet's own value. The stylesheets carry the accent as variables
   wherever they used to write it out (--accent-night-rgb, --accent-day-rgb,
   for its glows, rules and borders), so a new accent reaches all of them.

   The build (Node), the server and the editor (browser) use this one file,
   so what is previewed is what is published.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root, make) {
  const api = make();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SBF_THEME = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /** The colours a theme sets, in the order the menu shows them, with the stylesheets' own values. */
  const COLORS = [
    { key: 'text',     label: 'Primary',       hint: 'the main text',                         night: '#ebe6dc', day: '#0a0908' },
    { key: 'muted',    label: 'Secondary',     hint: 'quiet text: captions, notes, labels',   night: '#7a7368', day: '#3c3a34' },
    { key: 'accent',   label: 'Accent',        hint: 'gold by night, purple by day: links, rules, glows', night: '#e8c547', day: '#6b4ea3' },
    { key: 'bg',       label: 'Background',    hint: 'the page',                              night: '#15140f', day: '#ece9e1' },
    { key: 'surface',  label: 'Surface',       hint: 'cards and panels',                      night: '#1c1a16', day: '#dcd7ca' },
    { key: 'surface2', label: 'Surface 2',     hint: 'a raised surface',                      night: '#23211c', day: '#cac4b8' },
    { key: 'panel',    label: 'Panel',         hint: 'the deepest panels',                    night: '#0e0d0a', day: '#dad6cc' },
    { key: 'border',   label: 'Border',        hint: 'lines and edges',                       night: '#2e2b28', day: '#a8a294' },
    { key: 'mirror',   label: 'Mirror',        hint: 'the Pythagoras Engine project',         night: '#cfd6dc', day: '#1e7a45' },
    { key: 'red',      label: 'Red',           hint: 'the Death Culture project',             night: '#e05c5c', day: '#9e2b2b' },
    { key: 'earth',    label: 'Earth',         hint: 'the Superadobe project',                night: '#c98a4b', day: '#8a5a22' },
    { key: 'green',    label: 'Green',         hint: 'the more section, and success',         night: '#4caf7d', day: '#4caf7d' },
  ];
  const KEYS = COLORS.map(c => c.key);

  /** Fonts from Google Fonts, with the weights the site asks for (each one the family has). */
  const FONTS = {
    heading: [
      { name: 'Syne', w: '400;600;700;800', stock: true },
      { name: 'Space Grotesk', w: '400;500;600;700' },
      { name: 'Unbounded', w: '400;600;700;800' },
      { name: 'Archivo', w: '400;600;700;800' },
      { name: 'Bricolage Grotesque', w: '400;600;700;800' },
      { name: 'Sora', w: '400;600;700;800' },
      { name: 'Outfit', w: '400;600;700;800' },
      { name: 'Manrope', w: '400;600;700;800' },
      { name: 'Inter', w: '400;600;700;800' },
      { name: 'Playfair Display', w: '400;600;700;800', serif: true },
      { name: 'Fraunces', w: '400;600;700;800', serif: true },
      { name: 'DM Serif Display', w: '400', serif: true },
    ],
    body: [
      { name: 'DM Mono', w: '400;500', stock: true, mono: true },
      { name: 'IBM Plex Mono', w: '400;500;600', mono: true },
      { name: 'JetBrains Mono', w: '400;500;700', mono: true },
      { name: 'Space Mono', w: '400;700', mono: true },
      { name: 'Fira Code', w: '400;500;700', mono: true },
      { name: 'Inter', w: '400;500;600' },
      { name: 'Work Sans', w: '400;500;600' },
      { name: 'Karla', w: '400;500;600' },
      { name: 'IBM Plex Sans', w: '400;500;600' },
      { name: 'Source Serif 4', w: '400;600', serif: true },
    ],
  };
  const STOCK_FONT = { heading: 'Syne', body: 'DM Mono' };

  const HEX = /^#[0-9a-f]{6}$/i;
  const FONT_NAME = /^[A-Za-z0-9][A-Za-z0-9 ]{1,40}$/;

  /** A theme as it may be kept: fonts by name, colours as #rrggbb, only what was set. Null when nothing is. */
  function cleanTheme(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const out = {};
    const fonts = {};
    for (const k of ['heading', 'body']) {
      const v = raw.fonts && typeof raw.fonts[k] === 'string' ? raw.fonts[k].trim().replace(/\s+/g, ' ') : '';
      if (FONT_NAME.test(v) && v !== STOCK_FONT[k]) fonts[k] = v;
    }
    if (Object.keys(fonts).length) out.fonts = fonts;
    for (const mode of ['night', 'day']) {
      const m = {};
      for (const k of KEYS) {
        const v = raw[mode] && raw[mode][k];
        if (typeof v === 'string' && HEX.test(v)) m[k] = v.toLowerCase();
      }
      if (Object.keys(m).length) out[mode] = m;
    }
    return Object.keys(out).length ? out : null;
  }

  const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(',');
  function fontOf(kind, name) {
    const f = FONTS[kind].find(x => x.name === name);
    const fall = f && f.serif ? 'serif' : (f ? f.mono : kind === 'body' && /mono|code/i.test(name)) ? 'monospace' : 'sans-serif';
    return `'${name}',${fall}`;
  }

  /** The <style> a theme writes over the page's own stylesheet ('' for none). */
  function themeCss(theme) {
    const t = cleanTheme(theme);
    if (!t) return '';
    const root = [], day = [], extra = [];
    const n = t.night || {}, d = t.day || {};
    for (const k of KEYS) if (n[k]) root.push(`--${k}:${n[k]}`);
    for (const k of KEYS) if (d[k]) day.push(`--${k}:${d[k]}`);
    if (n.accent) root.push(`--accent-night-rgb:${rgb(n.accent)}`);
    if (d.accent) root.push(`--accent-day-rgb:${rgb(d.accent)}`);
    /* What the stylesheets mix from the background: its glass and the hero's fade. */
    if (n.bg) { const b = rgb(n.bg); root.push(`--glass:rgba(${b},.86)`, `--hero-fade:rgba(${b},.82)`, `--hero-fade-mid:rgba(${b},.6)`, `--hero-fade-end:rgba(${b},0)`, `--card-inner:rgba(${b},.5)`); }
    if (d.bg) { const b = rgb(d.bg); day.push(`--glass:rgba(${b},.86)`, `--hero-fade:rgba(${b},.86)`, `--hero-fade-mid:rgba(${b},.6)`, `--hero-fade-end:rgba(${b},0)`, `--card-inner:rgba(${b},.5)`); }
    if (t.fonts && t.fonts.heading) root.push(`--ff-h:${fontOf('heading', t.fonts.heading)}`);
    if (t.fonts && t.fonts.body) root.push(`--ff-m:${fontOf('body', t.fonts.body)}`);
    /* Pictures drawn in the pages in the gold itself follow the accent. */
    if (n.accent) extra.push('svg [fill="#e8c547"]{fill:var(--accent)}svg [stroke="#e8c547"]{stroke:var(--accent)}');
    return (root.length ? `:root{${root.join(';')}}` : '') + (day.length ? `body.day{${day.join(';')}}` : '') + extra.join('');
  }

  /** The Google Fonts address for a theme's fonts, or '' when it keeps the site's own. */
  function fontHref(theme) {
    const t = cleanTheme(theme);
    if (!t || !t.fonts) return '';
    const fams = [];
    for (const k of ['heading', 'body']) {
      const name = t.fonts[k];
      if (!name) continue;
      const f = FONTS[k].find(x => x.name === name);
      fams.push('family=' + encodeURIComponent(name).replace(/%20/g, '+') + (f ? `:wght@${f.w}` : ''));
    }
    return fams.length ? `https://fonts.googleapis.com/css2?${[...new Set(fams)].join('&')}&display=swap` : '';
  }

  /** The <head> lines a theme adds to a page (build.js). */
  function headTags(theme) {
    const css = themeCss(theme);
    if (!css) return '';
    const href = fontHref(theme);
    return (href ? `<link rel="stylesheet" href="${href.replace(/&/g, '&amp;')}">\n` : '') + `<style id="sbf-theme">${css}</style>\n`;
  }

  /** Mix a colour towards another by t (0..1). */
  function mix(a, b, t) {
    const A = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16)), B = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16));
    return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
  }
  /**
   * The surfaces, panel and border that go with a background, in the
   * proportions the site's own stock colours have to theirs (by night the
   * surface is the background with 3% of white, the panel a third darker…;
   * by day, shades of it towards black).
   */
  function derive(mode, bg) {
    if (!HEX.test(bg || '')) return {};
    return mode === 'day'
      ? { surface: mix(bg, '#000000', 0.07), surface2: mix(bg, '#000000', 0.145), panel: mix(bg, '#000000', 0.075), border: mix(bg, '#000000', 0.29) }
      : { surface: mix(bg, '#ffffff', 0.03), surface2: mix(bg, '#ffffff', 0.06), panel: mix(bg, '#000000', 0.33), border: mix(bg, '#ffffff', 0.11) };
  }
  /** Themes to start from: Pythagoras Engine's own (its admin dashboard's Theme), a background and an accent by night and by day. */
  const PRESETS = [
    ['Blueprint', '#0f1a2a', '#6fb3ff', '#e4ecf4', '#1f5fa8'], ['Verdigris', '#0f1a16', '#4caf7d', '#e5eee3', '#2f7a52'],
    ['Kiln', '#1c1310', '#e0703c', '#f2e8e0', '#b4502a'], ['Amethyst', '#16111f', '#b98cf0', '#eee8f4', '#7a3fc4'],
    ['Graphite', '#141414', '#e8e4dc', '#f4f4f2', '#1a1a1a'], ['Rose Quartz', '#1e1216', '#e0588a', '#f6e9ee', '#b02f5e'],
    ['Glacier', '#0e1719', '#4ca8d8', '#e3eef1', '#1f7fb0'], ['Sandstone', '#1b1712', '#d9b38c', '#f3ece1', '#8a5a2b'],
    ['Ink & Paper', '#111318', '#f2f0ea', '#faf8f2', '#c43b2f'], ['Olive Grove', '#151710', '#b8c25a', '#eef0e2', '#6b7a1f'],
    ['Copper', '#171210', '#d08a5a', '#f1e9e2', '#9a5530'], ['Deep Sea', '#07141c', '#35c0c9', '#e2f0f2', '#0f7f88'],
    ['Saffron', '#16130b', '#f0b429', '#f7f1e1', '#a8740a'], ['Lavender Fog', '#17161d', '#c9b6ff', '#f1effa', '#6a53c9'],
    ['Neon Lab', '#0a0a12', '#39e6c8', '#eef2f6', '#0f8f7a'],
  ].map(([name, nb, na, db, da]) => ({ name, night: { bg: nb, accent: na, ...derive('night', nb) }, day: { bg: db, accent: da, ...derive('day', db) } }));

  return { COLORS, KEYS, FONTS, STOCK_FONT, PRESETS, cleanTheme, themeCss, fontHref, headTags, derive, mix };
});
