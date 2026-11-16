#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   SOBOOF STUDIO — its desktop icon.

     node tools/studio/make-icon.js

   Draws tools/studio/studio.ico (256, 64, 48, 32 and 16 px) and a 256 px
   studio-icon.png beside it: the site's own gold owl (assets/img/soboof-logo.png)
   on the editor's dark tile, with a gold pencil badge so it reads as the
   editor and not as the site. Zero dependencies, like the rest of the studio:
   the PNG is read and written with Node's own zlib, and the .ico holds PNGs
   (Windows Vista and later read those).
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const REPO = path.resolve(__dirname, '..', '..');
const OUT_ICO = path.join(__dirname, 'studio.ico');
const OUT_PNG = path.join(__dirname, 'studio-icon.png');

/* ── reading a PNG (8-bit RGBA, not interlaced: what the logo is) ──────── */
function readPNG(file) {
  const b = fs.readFileSync(file);
  const w = b.readUInt32BE(16), h = b.readUInt32BE(20);
  if (b[24] !== 8 || b[25] !== 6 || b[28] !== 0) throw new Error(`${file}: expected 8-bit RGBA, not interlaced`);
  const idat = [];
  for (let at = 8; at < b.length;) {
    const len = b.readUInt32BE(at), type = b.toString('latin1', at + 4, at + 8);
    if (type === 'IDAT') idat.push(b.subarray(at + 8, at + 8 + len));
    at += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const px = Buffer.alloc(w * h * 4), stride = w * 4;
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], row = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= 4 ? px[y * stride + x - 4] : 0, up = y ? px[(y - 1) * stride + x] : 0, ul = x >= 4 && y ? px[(y - 1) * stride + x - 4] : 0;
      let v = row[x];
      if (f === 1) v += a;
      else if (f === 2) v += up;
      else if (f === 3) v += (a + up) >> 1;
      else if (f === 4) { const p = a + up - ul, pa = Math.abs(p - a), pb = Math.abs(p - up), pc = Math.abs(p - ul); v += pa <= pb && pa <= pc ? a : pb <= pc ? up : ul; }
      px[y * stride + x] = v & 255;
    }
  }
  return { w, h, px };
}

/* ── writing one ───────────────────────────────────────────────────────── */
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32(td) >>> 0);
  return Buffer.concat([len, td, crc]);
}
function writePNG(w, h, rgba) {
  const raw = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

/* ── drawing ───────────────────────────────────────────────────────────── */
const BG = [0x1a, 0x18, 0x14], GOLD = [0xe8, 0xc5, 0x47];
const logo = readPNG(path.join(REPO, 'assets/img/soboof-logo.png'));

/** The logo's colour at a point of its own pixels, premultiplied, bilinear. */
function logoAt(u, v) {
  const out = [0, 0, 0, 0];
  const x0 = Math.floor(u - 0.5), y0 = Math.floor(v - 0.5), fx = u - 0.5 - x0, fy = v - 0.5 - y0;
  for (const [dx, dy, k] of [[0, 0, (1 - fx) * (1 - fy)], [1, 0, fx * (1 - fy)], [0, 1, (1 - fx) * fy], [1, 1, fx * fy]]) {
    const x = x0 + dx, y = y0 + dy;
    if (x < 0 || y < 0 || x >= logo.w || y >= logo.h || !k) continue;
    const i = (y * logo.w + x) * 4, a = logo.px[i + 3] / 255;
    out[0] += logo.px[i] * a * k; out[1] += logo.px[i + 1] * a * k; out[2] += logo.px[i + 2] * a * k; out[3] += a * k;
  }
  return out;
}

function draw(S) {
  const badge = S >= 48;
  const m = S * 0.04, half = (S - 2 * m) / 2, r = S * 0.2, bw = Math.max(1, S / 64);
  const L = (S - 2 * m) * (badge ? 0.7 : 0.8), lw = L, lh = L * logo.h / logo.w;
  const lx = S / 2 - lw / 2 - (badge ? S * 0.04 : 0), ly = S / 2 - lh / 2 - (badge ? S * 0.03 : 0);
  const bc = [S * 0.76, S * 0.76], br = S * 0.17;
  const d = [-Math.SQRT1_2, Math.SQRT1_2];        // the pencil points down and to the left
  const k = 4, out = Buffer.alloc(S * S * 4);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    let R = 0, G = 0, B = 0, A = 0;
    for (let sy = 0; sy < k; sy++) for (let sx = 0; sx < k; sx++) {
      const px = x + (sx + 0.5) / k, py = y + (sy + 0.5) / k;
      const qx = Math.abs(px - S / 2) - (half - r), qy = Math.abs(py - S / 2) - (half - r);
      const sdf = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
      if (sdf > 0) continue;
      let c = sdf > -bw ? GOLD.map((g, i) => g * 0.5 + BG[i] * 0.5) : BG.slice();
      const l = logoAt((px - lx) / lw * logo.w, (py - ly) / lh * logo.h);
      c = c.map((v, i) => l[i] + v * (1 - l[3]));
      if (badge) {
        const ex = px - bc[0], ey = py - bc[1], dist = Math.hypot(ex, ey);
        if (dist < br + S * 0.025) c = BG.slice();                       // a dark ring keeps it off the owl
        if (dist < br) {
          c = GOLD.slice();
          const a = ex * d[0] + ey * d[1], b = ex * d[1] - ey * d[0], w2 = S * 0.026;
          const body = a > -S * 0.085 && a < S * 0.045 && Math.abs(b) < w2;
          const tip = a >= S * 0.045 && a < S * 0.09 && Math.abs(b) < w2 * (S * 0.09 - a) / (S * 0.045);
          const cap = body && a < -S * 0.06;
          if (tip || (body && !cap)) c = BG.slice();
          if (cap) c = BG.map(v => v * 0.6);
        }
      }
      R += c[0]; G += c[1]; B += c[2]; A += 1;
    }
    const n = k * k, i = (y * S + x) * 4;
    if (A) { out[i] = Math.round(R / A); out[i + 1] = Math.round(G / A); out[i + 2] = Math.round(B / A); }
    out[i + 3] = Math.round(255 * A / n);
  }
  return writePNG(S, S, out);
}

/* ── the .ico ──────────────────────────────────────────────────────────── */
const sizes = [256, 64, 48, 32, 16];
const pngs = sizes.map(draw);
const head = Buffer.alloc(6 + 16 * sizes.length);
head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(sizes.length, 4);
let at = head.length;
sizes.forEach((s, i) => {
  const e = 6 + 16 * i;
  head[e] = s >= 256 ? 0 : s; head[e + 1] = s >= 256 ? 0 : s;
  head.writeUInt16LE(1, e + 4); head.writeUInt16LE(32, e + 6);
  head.writeUInt32LE(pngs[i].length, e + 8); head.writeUInt32LE(at, e + 12);
  at += pngs[i].length;
});
fs.writeFileSync(OUT_ICO, Buffer.concat([head, ...pngs]));
fs.writeFileSync(OUT_PNG, pngs[0]);
console.log(`  ✓ ${path.relative(REPO, OUT_ICO)} (${sizes.join(', ')} px)`);
console.log(`  ✓ ${path.relative(REPO, OUT_PNG)}`);
