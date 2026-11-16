/* ═══════════════════════════════════════════════════════════════════════════
   THE HOMEPAGE'S 3D SCENE

   One model travels down the page: it docks in the rail (.model-rail) of the
   section in view and wears that section's look (STATES). Until 2026-11 this
   was an inline script in src/pages/index.html; it moved here when each
   section's slot became something Studio can set (data/site.json, `slots`,
   handed to the page by the build as <script id="sbf-site">).

   A section's slot can say what the model becomes there, or leave it as it
   always was. With nothing set the scene is exactly the one before:
     - what plays: a geometric model (the PE formation, the PE model, the
       Pythagoras solid) or one of the five figures rigged in Pythagoras
       Engine's Theater (assets/models/cast/, with their Theater clips);
       or nothing at all;
     - its look (shaded, wireframe, clay, one colour, or a figure's own module
       colours), its colour, size and speed, and which way it is seen
       (front, angled, top, side);
     - how it answers the visitor: turning with the scroll (the scene's own
       way), tipping towards the pointer, facing the reader, or not at all;
       what it does when the pointer comes near (spins, grows, nods, hops, or
       a figure's clip or its own motion played once); and elements of the
       page (a button, a link, a card) that set it off when hovered or
       clicked;
     - whether it is cut off at its slot's border;
     - and for a figure, a motion of its own: keyed on its skeleton in
       Studio (window.SBF_SCENE.pose…), played round its loop, with the
       scroll through its section, or once when something sets it off.

   Studio's editor drives the same object live: window.SBF_SCENE.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (typeof THREE === 'undefined') return;

  const STATES = [
    { id:'hero',     color:[0.91,0.77,0.28], wire:0, rotY:0.0028, label:'SHADED · GOLD',   hex:'#e8c547', scale:1.85 },
    { id:'pythagoras-engine', color:[0.81,0.84,0.86], wire:1, rotY:0.0034, label:'WIRE · MIRROR',  hex:'#cfd6dc', scale:1.30 },
    { id:'mirbreak',      color:[0.91,0.77,0.28], wire:0, rotY:0.0044, label:'SHADED · GOLD',  hex:'#e8c547', scale:1.10 },
    { id:'death-culture', color:[0.85,0.28,0.30], wire:1, rotY:0.0062, label:'WIRE · RED',     hex:'#d9484c', scale:1.00 },
    { id:'superadobe',    color:[0.79,0.54,0.29], wire:0, rotY:0.0069, label:'SHADED · EARTH', hex:'#c98a4b', scale:1.20 },
    { id:'about',    color:[0.42,0.31,0.64], wire:0, rotY:0.0075, label:'SHADED · PURPLE', hex:'#6b4ea3', scale:1.05 },
    { id:'more',     color:[0.30,0.69,0.49], wire:1, rotY:0.0100, label:'WIRE · GREEN',    hex:'#4caf7d', scale:1.00 },
    { id:'contact',  color:[0.30,0.66,0.85], wire:1, rotY:0.0130, label:'WIRE · CYAN',     hex:'#4ca8d8', scale:1.15 }
  ];

  /** The geometric models a slot can show (assets/models/). */
  const MODELS = {
    'pythagoras_m21.gltf': 'PE formation',
    'pe_model.obj': 'PE model',
    'pythagoras.obj': 'Pythagoras solid',
  };
  const DEFAULT_MODEL = 'pythagoras_m21.gltf';
  const GLTF_LOADER = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js';

  function readSite() {
    try { const el = document.getElementById('sbf-site'); return el ? JSON.parse(el.textContent) : null; } catch (e) { return null; }
  }
  let SLOTS = (readSite() || {}).slots || {};
  const still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const canvas = document.getElementById('scene-canvas');
  if (!canvas) return;
  const scene  = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({ canvas, alpha:true, antialias:true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.localClippingEnabled = true;

  const cam = new THREE.PerspectiveCamera(35, 1, 0.1, 200);
  cam.position.set(0, 0, 14);

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key  = new THREE.DirectionalLight(0xfff2c8, 0.9);  key.position.set(4, 6, 8);   scene.add(key);
  const fill = new THREE.DirectionalLight(0x6688aa, 0.45); fill.position.set(-6, -2, 4); scene.add(fill);
  const rim  = new THREE.DirectionalLight(0xe8c547, 0.55); rim.position.set(0, 4, -8);   scene.add(rim);

  const root = new THREE.Group();
  scene.add(root);

  /* ── reading models ──────────────────────────────────────────────────────
     Minimal glTF 2.0 reader — the Pythagoras Engine export is a single mesh
     with embedded base64 buffers, so no external loader is needed for it. */
  function gltfBuffer(uri){
    const bin = atob(uri.split(',')[1]);
    const u8 = new Uint8Array(bin.length);
    for (let i=0;i<bin.length;i++) u8[i] = bin.charCodeAt(i);
    return u8;
  }
  function gltfAccessor(json, bufs, index){
    const acc = json.accessors[index];
    const view = json.bufferViews[acc.bufferView];
    const comps = { SCALAR:1, VEC2:2, VEC3:3, VEC4:4 }[acc.type];
    const bytes = { 5120:1, 5121:1, 5122:2, 5123:2, 5125:4, 5126:4 }[acc.componentType];
    const start = (view.byteOffset||0) + (acc.byteOffset||0);
    const slice = bufs[view.buffer].slice(start, start + acc.count * comps * bytes);
    const Ctor  = { 5120:Int8Array, 5121:Uint8Array, 5122:Int16Array,
                    5123:Uint16Array, 5125:Uint32Array, 5126:Float32Array }[acc.componentType];
    return new Ctor(slice.buffer, 0, acc.count * comps);
  }
  function parseGLTF(json){
    const bufs = json.buffers.map(b => gltfBuffer(b.uri));
    const prim = json.meshes[0].primitives[0];
    const pos  = gltfAccessor(json, bufs, prim.attributes.POSITION);
    const tris = prim.indices != null
      ? Array.from(gltfAccessor(json, bufs, prim.indices))
      : Array.from({ length: pos.length/3 }, (_, i) => i);
    return { verts: Array.from(pos), tris };
  }
  function parseOBJ(text){
    const verts = [], tris = [];
    for (const line of text.split('\n')) {
      const p = line.trim().split(/\s+/);
      if (p[0] === 'v') verts.push(+p[1], +p[2], +p[3]);
      else if (p[0] === 'f') {
        const idx = p.slice(1).map(x => parseInt(x.split('/')[0], 10) - 1);
        for (let k = 1; k < idx.length - 1; k++) tris.push(idx[0], idx[k], idx[k + 1]);
      }
    }
    return { verts, tris };
  }
  function buildGeometry(parsed){
    const positions = new Float32Array(parsed.tris.length*3);
    for (let i=0;i<parsed.tris.length;i++){
      const vi = parsed.tris[i]*3;
      positions[i*3]   = parsed.verts[vi];
      positions[i*3+1] = parsed.verts[vi+1];
      positions[i*3+2] = parsed.verts[vi+2];
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.computeVertexNormals();
    geo.computeBoundingBox();
    const bb = geo.boundingBox;
    const cx=(bb.min.x+bb.max.x)/2, cy=(bb.min.y+bb.max.y)/2, cz=(bb.min.z+bb.max.z)/2;
    geo.translate(-cx,-cy,-cz);
    const size = Math.max(bb.max.x-bb.min.x, bb.max.y-bb.min.y, bb.max.z-bb.min.z) || 1;
    geo.scale(4.6/size, 4.6/size, 4.6/size);
    geo.computeVertexNormals();
    return geo;
  }

  /* ── the things a slot can show, each made once ─────────────────────────
     Every one is a group under `root`, faded in while it is the one shown
     (`vis`), so changing what plays between two sections is a cross-fade. */
  const things = {};   // key → thing
  const thingKey = s => (!s || s.kind !== 'figure') ? 'model:' + ((s && s.model) || DEFAULT_MODEL) : 'figure:' + s.figure;

  function modelThing(file) {
    const k = 'model:' + file;
    if (things[k]) return things[k];
    const group = new THREE.Group();
    group.visible = false;
    root.add(group);
    const mat = new THREE.MeshStandardMaterial({ color: 0xe8c547, roughness: 0.45, metalness: 0.35, flatShading: true, transparent: true, opacity: 0.92 });
    const wireMat = new THREE.LineBasicMaterial({ color: 0xe8c547, transparent: true, opacity: 0 });
    const t = things[k] = { key: k, kind: 'model', group, mat, wireMat, vis: 0, ready: false, mats: [mat, wireMat] };
    const url = '/assets/models/' + file;
    fetch(url).then(r => file.endsWith('.gltf') ? r.json().then(parseGLTF) : r.text().then(parseOBJ)).then(parsed => {
      const geo = buildGeometry(parsed);
      group.add(new THREE.Mesh(geo, mat));
      group.add(new THREE.LineSegments(new THREE.WireframeGeometry(geo), wireMat));
      t.ready = true;
    }).catch(e => console.warn('model load failed:', url, e));
    return t;
  }

  let castInfo = null;
  let loaderJob = null;
  function loadCast() {
    if (castInfo) return Promise.resolve(castInfo);
    return fetch('/assets/models/cast/cast.json').then(r => r.json()).then(c => (castInfo = c));
  }
  function loadLoader() {
    if (THREE.GLTFLoader) return Promise.resolve();
    if (!loaderJob) loaderJob = new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = GLTF_LOADER; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
    return loaderJob;
  }
  /** A figure's name is its file's name without .gltf (assets/models/cast/). */
  function figureThing(name) {
    const k = 'figure:' + name;
    if (things[k]) return things[k];
    const group = new THREE.Group();
    group.visible = false;
    root.add(group);
    const t = things[k] = { key: k, kind: 'figure', name, group, vis: 0, ready: false, mats: [], bones: [], rest: [], actions: {}, mixer: null, info: null };
    Promise.all([loadCast(), loadLoader()]).then(([cast]) => {
      t.info = cast.find(c => c.file === name + '.gltf') || null;
      new THREE.GLTFLoader().load('/assets/models/cast/' + name + '.gltf', gltf => {
        const inner = gltf.scene;
        const info = t.info || {};
        inner.traverse(o => {
          if (o.isSkinnedMesh || o.isMesh) {
            o.frustumCulled = false; // skinned: its rest bounds are not where it is
            o.material = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.55, metalness: 0.1, side: THREE.DoubleSide, skinning: !!o.isSkinnedMesh });
            t.mats.push(o.material);
            if (o.isSkinnedMesh && !t.bones.length) t.bones = o.skeleton.bones.slice();
          }
        });
        t.rest = t.bones.map(b => b.quaternion.clone());
        /* Stood up a model's size: its height to the model's 4.6, its base's middle on the slot's point, facing the reader. */
        const h = info.height || 50;
        const k2 = 4.6 / h;
        const turnG = new THREE.Group();
        turnG.rotation.y = (info.turn || 0) + Math.PI;
        const base = info.base || [0, 0, 0];
        inner.position.set(-base[0], -base[1], -base[2]);
        turnG.add(inner);
        const scaleG = new THREE.Group();
        scaleG.scale.setScalar(k2);
        scaleG.position.y = -2.3;
        scaleG.add(turnG);
        group.add(scaleG);
        t.mixer = new THREE.AnimationMixer(inner);
        for (const clip of gltf.animations) t.actions[clip.name] = t.mixer.clipAction(clip);
        t.clips = gltf.animations.map(c => c.name);
        t.ready = true;
        if (pending.pose && pending.pose.figure === name) pending.pose.resolve(t);
      }, undefined, e => console.warn('figure load failed:', name, e));
    }).catch(e => console.warn('figure load failed:', name, e));
    return t;
  }
  const thingFor = s => (s && s.kind === 'figure' && s.figure) ? figureThing(s.figure) : modelThing((s && s.model) || DEFAULT_MODEL);

  /* ── where the slots are ──────────────────────────────────────────────── */
  function getSections(){
    return STATES.map(s=>{
      const sectEl = s.id==='hero' ? document.querySelector('.hero') : document.getElementById(s.id);
      const railEl = sectEl ? sectEl.querySelector('.model-rail') : null;
      return { sectEl, railEl };
    });
  }
  let sections = getSections();

  /* The section in view: the lowest whose top has passed the probe, by where it
     stands (Studio can reorder and hide sections). */
  function activeIndex(){
    const probe = window.scrollY + window.innerHeight*0.45;
    let idx = 0, best = -Infinity;
    for (let i=0;i<sections.length;i++){
      const el = sections[i].sectEl;
      if (!el || el.offsetParent === null && el !== document.body && getComputedStyle(el).display === 'none') continue;
      const top = el.getBoundingClientRect().top + window.scrollY;
      if (top <= probe && top > best) { best = top; idx = i; }
    }
    return idx;
  }

  const visDims = () => {
    const visH = 2 * Math.tan(cam.fov*0.5 * Math.PI/180) * cam.position.z;
    return { visH, visW: visH * cam.aspect };
  };
  const toWorld = (px, py) => {
    const { visH, visW } = visDims();
    return { x: ((px / window.innerWidth) * 2 - 1) * visW * 0.5, y: -((py / window.innerHeight) * 2 - 1) * visH * 0.5 };
  };
  function railWorldPos(railEl){
    if (!railEl) return null;
    const rect = railEl.getBoundingClientRect();
    if (rect.width === 0) return null;
    const cx = rect.left + rect.width*0.5;
    const vh = window.innerHeight;
    const span = Math.max(1, rect.height + vh);
    const moved = vh - rect.top;
    const progress = Math.min(1, Math.max(0, moved / span));
    const railTop = rect.top + 24;
    const railBottom = rect.bottom - 24;
    const cy = railTop + (railBottom - railTop) * progress;
    return toWorld(cx, cy);
  }
  function fallbackPos(idx){
    const xs = [0.45,-0.45,0.45,-0.45,0.45,-0.45,0];
    const { visW } = visDims();
    return { x: (xs[idx]||0) * visW * 0.5, y: 0 };
  }
  /** How far the reader is through a section, 0 coming in at the foot of the window to 1 gone at the top. */
  function progressOf(el) {
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    return Math.min(1, Math.max(0, (window.innerHeight - r.top) / Math.max(1, r.height + window.innerHeight)));
  }

  /** Four planes keeping a drawing inside a slot's column as the camera sees it. */
  const clipPlanes = [0, 1, 2, 3].map(() => new THREE.Plane());
  function setClipPlanes(railEl) {
    const r = railEl && railEl.getBoundingClientRect();
    if (!r || !r.width) return false;
    const a = toWorld(r.left, r.top), b = toWorld(r.right, r.bottom);
    const c = [new THREE.Vector3(a.x, a.y, 0), new THREE.Vector3(b.x, a.y, 0), new THREE.Vector3(b.x, b.y, 0), new THREE.Vector3(a.x, b.y, 0)];
    const mid = new THREE.Vector3((a.x + b.x) / 2, (a.y + b.y) / 2, 0);
    for (let i = 0; i < 4; i++) {
      clipPlanes[i].setFromCoplanarPoints(cam.position, c[i], c[(i + 1) % 4]);
      if (clipPlanes[i].distanceToPoint(mid) < 0) clipPlanes[i].negate();
    }
    return true;
  }

  /* ── a figure's own motion (keys made in Studio) ────────────────────────
     { figure, bones: [bone names], clip: { d, e, k: [{ t, q: [[x,y,z,w]|null] }] } }
     A key holds one local turn per bone, null at its rest. Between keys every
     bone goes the short way round; past the last key the loop is on its way
     back to the first. "ease" slows into and out of every key. */
  const tmpQ = new THREE.Quaternion(), tmpQ2 = new THREE.Quaternion();
  function keysValid(s, t) {
    const k = s && s.keys;
    return !!(k && t && t.kind === 'figure' && t.ready && k.figure === t.name && Array.isArray(k.bones) &&
      k.bones.length === t.bones.length && k.bones.every((n, i) => n === t.bones[i].name) && k.clip && k.clip.k && k.clip.k.length);
  }
  function sampleKeys(t, clip, time, out) {
    const ks = clip.k, n = t.bones.length, d = clip.d || 2;
    const qOf = (key, i) => (key.q[i] ? tmpQ.fromArray(key.q[i]) : tmpQ.copy(t.rest[i]));
    if (ks.length === 1) { for (let i = 0; i < n; i++) out[i].copy(qOf(ks[0], i)); return out; }
    const tt = ((time % d) + d) % d;
    let b = ks.findIndex(k => k.t > tt);
    let a, span, u;
    if (b < 0) { a = ks.length - 1; b = 0; span = d - ks[a].t + ks[0].t; u = (tt - ks[a].t) / (span || 1); }
    else if (b === 0) { a = ks.length - 1; span = d - ks[a].t + ks[0].t; u = (tt + d - ks[a].t) / (span || 1); }
    else { a = b - 1; span = ks[b].t - ks[a].t; u = (tt - ks[a].t) / (span || 1); }
    u = Math.min(1, Math.max(0, u));
    if (clip.e === 'ease' || clip.e === 'smooth') u = u * u * (3 - 2 * u);
    for (let i = 0; i < n; i++) {
      tmpQ2.copy(qOf(ks[a], i));
      out[i].copy(tmpQ2).slerp(qOf(ks[b], i), u);
    }
    return out;
  }

  /* ── the pointer, and what the page sets off ──────────────────────────── */
  let pointer = null;
  window.addEventListener('pointermove', e => { pointer = { x: e.clientX, y: e.clientY }; }, { passive: true });
  document.addEventListener('mouseout', e => { if (!e.relatedTarget) pointer = null; });

  /* One thing at a time: a reaction (spin, grow, nod, hop, a clip once, its own
     motion once), or a look at an element, on the slot in view. */
  const react = { kind: null, t: 0, slot: null };
  const focus = { x: 0, y: 0, until: 0 };
  function trigger(slotId, does, rect) {
    const idx = activeIndex();
    if (STATES[idx].id !== slotId || still) return;
    if (does === 'look') {
      if (rect) { const w = toWorld(rect.left + rect.width / 2, rect.top + rect.height / 2); focus.x = w.x; focus.y = w.y; focus.until = performance.now() + 2200; }
      return;
    }
    react.kind = does; react.t = 0; react.slot = slotId;
  }
  function linkHits(target, on) {
    for (const [id, s] of Object.entries(SLOTS)) {
      if (!s || !Array.isArray(s.links)) continue;
      for (const l of s.links) {
        if (l.on !== on || !l.sel) continue;
        let el = null;
        try { el = target.closest && target.closest(l.sel); } catch (e) { el = null; }
        if (el) trigger(id, l.does, el.getBoundingClientRect());
      }
    }
  }
  let lastOver = null;
  document.addEventListener('pointerover', e => { if (e.target !== lastOver) { lastOver = e.target; linkHits(e.target, 'hover'); } }, { passive: true });
  document.addEventListener('click', e => { if (!document.documentElement.classList.contains('sbf-editing')) linkHits(e.target, 'click'); }, true);

  /* ── posing a figure (Studio) ─────────────────────────────────────────── */
  const pending = { pose: null };
  const pose = { slot: null, figure: null, q: null, handles: [], thing: null };

  /* ── the frame ───────────────────────────────────────────────────────── */
  const cur = {
    x:0, y:0,
    r:STATES[0].color[0], g:STATES[0].color[1], b:STATES[0].color[2],
    wire:0, rotY:STATES[0].rotY, yaw:0, pitch:0, scale:STATES[0].scale
  };
  const lerp = (a,b,t) => a+(b-a)*t;

  const stateLbl = document.getElementById('scene-state-lbl');
  const stateBox = document.getElementById('scene-state-hud');
  let lastLabel = '';

  let hasScrolled = false;
  let autoYaw = 0;
  window.addEventListener('scroll',    ()=>{ hasScrolled=true; }, { passive:true });
  window.addEventListener('wheel',     ()=>{ hasScrolled=true; }, { passive:true, once:true });
  window.addEventListener('touchmove', ()=>{ hasScrolled=true; }, { passive:true, once:true });

  function scrollDrivenYaw(){
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    return -Math.min(1, Math.max(0, window.scrollY / max)) * Math.PI * 8;
  }

  function resize(){
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    cam.aspect = w/h;
    cam.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', ()=>{ resize(); sections = getSections(); });

  const hexRGB = h => { const n = parseInt(String(h || '#e8c547').slice(1), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };
  const VIEW_PITCH = { front: 0, angle: 0.35, top: Math.PI / 2, side: 0.1 };
  const keyedQ = [];
  let lastT = performance.now();
  let kTime = 0, kPlay = -1, lastSlot = null, lastNear = false;

  function tick(now){
    const dtMs = Math.min(50, (now || performance.now()) - lastT);
    lastT = now || performance.now();
    const dt = dtMs / 1000;
    const isDay = document.body.classList.contains('day');
    const idx = activeIndex();
    const baseTgt = STATES[idx];
    const s = SLOTS[baseTgt.id] || null;

    /* What this section's slot is: the scene's own look, or the slot's. */
    let tgt = (isDay && idx===0)
      ? { color:[0.42,0.31,0.64], wire:baseTgt.wire, rotY:baseTgt.rotY, hex:'#6b4ea3', scale:baseTgt.scale, label:'SHADED · PURPLE' }
      : baseTgt;
    if (s) {
      const look = s.look || 'auto';
      const color = s.color ? hexRGB(s.color) : tgt.color;
      tgt = {
        color: look === 'clay' ? [0.85, 0.82, 0.78] : color,
        wire: look === 'wire' ? 1 : (look === 'shaded' || look === 'clay' || look === 'tint' || look === 'own') ? 0 : tgt.wire,
        rotY: tgt.rotY * (s.speed == null ? 1 : s.speed),
        hex: s.color || tgt.hex,
        scale: tgt.scale * (s.size || 1) * (s.hidden ? 0 : 1),
        label: s.hidden ? 'EMPTY SLOT' : s.kind === 'figure' ? String((s.figure || 'figure')).replace(/-/g, ' ').toUpperCase() + ' · THEATER' : tgt.label,
      };
    }
    rim.color.set(isDay ? 0x6b4ea3 : 0xe8c547);

    const k = 0.07;
    cur.r     = lerp(cur.r,     tgt.color[0], k);
    cur.g     = lerp(cur.g,     tgt.color[1], k);
    cur.b     = lerp(cur.b,     tgt.color[2], k);
    cur.wire  = lerp(cur.wire,  tgt.wire,     k);
    cur.rotY  = lerp(cur.rotY,  tgt.rotY,     k);
    cur.scale = lerp(cur.scale, tgt.scale,    k);

    /* What is shown: this slot's thing faded in, every other faded out. */
    const shown = thingFor(s);
    for (const t of Object.values(things)) {
      t.vis = lerp(t.vis, t === shown && t.ready ? 1 : 0, 0.12);
      t.group.visible = t.vis > 0.01;
      t.group.scale.setScalar(Math.max(0.0001, t.vis));
    }
    if (lastSlot !== baseTgt.id) { lastSlot = baseTgt.id; kTime = 0; kPlay = -1; react.kind = null; }

    let posTarget = railWorldPos(sections[idx].railEl);
    if (!posTarget) posTarget = fallbackPos(idx);
    cur.x = lerp(cur.x, posTarget.x, k);
    cur.y = lerp(cur.y, posTarget.y, k);

    /* The pointer coming near it. */
    const sp = new THREE.Vector3(cur.x, cur.y, 0).project(cam);
    const sx = (sp.x + 1) / 2 * window.innerWidth, sy = (1 - sp.y) / 2 * window.innerHeight;
    const radiusPx = cur.scale * 2.3 * window.innerHeight / visDims().visH;
    const near = !!pointer && Math.hypot(pointer.x - sx, pointer.y - sy) < radiusPx;
    if (s && near && !lastNear && s.hover && s.hover !== 'none' && !react.kind && !still) { react.kind = s.hover; react.t = 0; react.slot = baseTgt.id; }
    lastNear = near;
    if (react.kind) { react.t += dt / 1.1; if (react.t >= 1) react.kind = null; }
    const rk = react.kind, rt = react.t, bump = Math.sin(Math.PI * rt);

    root.scale.setScalar(cur.scale * (rk === 'grow' ? 1 + 0.18 * bump : 1));
    root.position.x = cur.x;
    root.position.y = cur.y + (rk === 'hop' ? cur.scale * 0.6 * bump : 0);

    /* How it turns: the scene's own way (spinning, then with the scroll), or the slot's. */
    const interact = (s && s.interact) || 'scroll';
    const view = (s && s.view) || 'auto';
    const figure = shown.kind === 'figure';
    let yawT, pitchT, rate = 0.10;
    if (interact === 'scroll') {
      if (!hasScrolled) { if (!still) autoYaw += cur.rotY; yawT = autoYaw; rate = 0.2; }
      else yawT = scrollDrivenYaw();
      pitchT = view === 'auto' ? (figure ? 0.12 : yawT * 0.32) : VIEW_PITCH[view];
    } else {
      if (!still && interact !== 'reader') autoYaw += cur.rotY * (s && s.spin != null ? s.spin / 0.17 : 1);
      yawT = interact === 'reader' ? 0 : autoYaw;
      pitchT = view === 'auto' ? (figure ? 0.12 : 0.3) : VIEW_PITCH[view];
      const toward = focus.until > performance.now() ? { x: focus.x, y: focus.y } : (interact === 'pointer' && pointer ? toWorld(pointer.x, pointer.y) : null);
      if (toward) { yawT += Math.max(-0.7, Math.min(0.7, (toward.x - cur.x) * 0.12)); pitchT += Math.max(-0.6, Math.min(0.6, -(toward.y - cur.y) * 0.12)); }
    }
    if (view === 'side') yawT += Math.PI / 2;
    cur.yaw   = lerp(cur.yaw,   yawT,   rate);
    cur.pitch = lerp(cur.pitch, pitchT, rate);
    root.rotation.y = cur.yaw + (rk === 'spin' ? Math.PI * 2 * (rt * rt * (3 - 2 * rt)) : 0);
    root.rotation.x = cur.pitch + (rk === 'nod' ? 0.35 * Math.sin(Math.PI * 2 * rt) * (1 - rt) : 0);

    /* Its look. */
    const clipOn = !!(s && s.clip) && setClipPlanes(sections[idx].railEl);
    for (const t of Object.values(things)) {
      if (!t.group.visible) continue;
      const planes = clipOn && t === shown ? clipPlanes : null;
      for (const m of t.mats) if (m.clippingPlanes !== planes) { m.clippingPlanes = planes; m.needsUpdate = true; }
      if (t.kind === 'model') {
        t.mat.color.setRGB(cur.r, cur.g, cur.b);
        t.mat.opacity   = (1 - cur.wire) * 0.95 + 0.04;
        t.mat.depthWrite = cur.wire < 0.5;
        t.wireMat.color.setRGB(cur.r, cur.g, cur.b);
        t.wireMat.opacity = cur.wire * 0.85 + 0.06;
      } else {
        const look = (s && t === shown && s.look) || 'own';
        for (const m of t.mats) {
          const vc = look === 'own' || look === 'auto';
          if (m.vertexColors !== vc) { m.vertexColors = vc; m.needsUpdate = true; }
          m.color.setRGB(vc ? 1 : cur.r, vc ? 1 : cur.g, vc ? 1 : cur.b);
          m.wireframe = look === 'wire';
        }
      }
    }

    /* A figure's motion: its Theater clip, its own keys, or the pose being made in Studio. */
    if (figure && shown.ready && shown.mixer) {
      const t = shown;
      const posing = pose.thing === t && pose.q;
      const speed = s && s.speed != null ? s.speed : 1;
      if (!posing) {
        const want = (rk && t.actions[rk]) ? rk : ((s && s.motion && s.motion !== 'auto' && t.actions[s.motion]) ? s.motion : ((t.info && t.info.play) || 'idle'));
        for (const [name, a] of Object.entries(t.actions)) {
          const on = name === want;
          if (on && !a.__on) { if (!a.isRunning()) a.reset(); a.fadeIn(0.3).play(); a.__on = true; }
          else if (!on && a.__on) { a.fadeOut(0.3); a.__on = false; }
          a.timeScale = speed;
        }
        t.mixer.update(still ? 0 : dt);
      }
      /* Its own motion, over the clip. */
      const own = s && keysValid(s, t) ? s.keys : null;
      if (posing) {
        for (let i = 0; i < t.bones.length; i++) t.bones[i].quaternion.copy(pose.q[i] ? tmpQ.fromArray(pose.q[i]) : t.rest[i]);
      } else if (own) {
        const clip = own.clip, d = clip.d || 2, drive = s.drive || 'loop';
        if (rk === 'play' && kPlay < 0) { kPlay = 0; react.kind = null; }
        let time = -1, w = 1;
        if (drive === 'loop') { kTime = (kTime + (still ? 0 : dt * speed)) % d; time = kTime; }
        else if (drive === 'scroll') time = progressOf(sections[idx].sectEl) * d * 0.999;
        else if (kPlay >= 0) {
          kPlay += dt * speed;
          if (kPlay >= d) kPlay = -1; else { time = kPlay; w = Math.min(1, kPlay / 0.2, (d - kPlay) / 0.2); }
        }
        if (time >= 0) {
          while (keyedQ.length < t.bones.length) keyedQ.push(new THREE.Quaternion());
          sampleKeys(t, clip, time, keyedQ);
          /* A bone no key turns keeps its Theater motion: the keys are laid over the clip. */
          for (let i = 0; i < t.bones.length; i++) if (clip.k.some(kk => kk.q[i])) t.bones[i].quaternion.slerp(keyedQ[i], w);
        }
      }
    }

    if (tgt.label !== lastLabel && stateLbl && stateBox){
      stateLbl.textContent = tgt.label;
      stateBox.style.color = tgt.hex;
      stateBox.style.borderColor = tgt.hex + '55';
      lastLabel = tgt.label;
    }

    renderer.render(scene, cam);

    /* Where a posed figure's joints are on the screen, for Studio's handles. */
    if (pose.thing && pose.thing === shown && shown.group.visible) {
      const v = new THREE.Vector3();
      pose.handles = shown.bones.map((b, j) => {
        b.getWorldPosition(v);
        v.project(cam);
        return { j, x: (v.x + 1) / 2 * window.innerWidth, y: (1 - v.y) / 2 * window.innerHeight, root: !(b.parent && b.parent.isBone), name: b.name };
      });
    } else pose.handles = [];

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  /* ── what Studio's editor drives ─────────────────────────────────────── */
  window.SBF_SCENE = {
    STATES, MODELS,
    figures: () => loadCast().then(c => c.map(x => ({ id: x.file.replace(/\.gltf$/, ''), name: x.name, clips: Object.keys(x.clips || {}), play: x.play }))),
    getSlots: () => SLOTS,
    /** Put a draft of the slots on the page as it is drawn. */
    setSlots(slots) { SLOTS = slots || {}; },
    active: () => STATES[activeIndex()].id,
    trigger,
    pose: {
      /** Start posing the figure a slot plays: resolves to its bones once it is loaded. */
      start(slotId) {
        const s = SLOTS[slotId];
        if (!s || s.kind !== 'figure' || !s.figure) return Promise.reject(new Error('that slot plays no figure'));
        const t = figureThing(s.figure);
        const begin = th => {
          pose.slot = slotId; pose.figure = s.figure; pose.thing = th;
          pose.q = th.bones.map(() => null);
          return { bones: th.bones.map(b => b.name), rest: th.rest.map(q => q.toArray()) };
        };
        if (t.ready) return Promise.resolve(begin(t));
        return new Promise(res => { pending.pose = { figure: s.figure, resolve: th => { pending.pose = null; res(begin(th)); } }; });
      },
      stop() { pose.slot = null; pose.thing = null; pose.q = null; pose.handles = []; },
      /** The pose shown: one local turn a bone, null at its rest. */
      set(q) { if (pose.thing) pose.q = q.map(x => (x ? x.slice() : null)); },
      get: () => (pose.q ? pose.q.map(x => (x ? x.slice() : null)) : null),
      handles: () => pose.handles,
      /**
       * Aim bone j at a point on the screen: the bone it hangs from swings so
       * it points there (the Theater's Pose Mode drag), on the plane through
       * the joint facing the camera. A root has no bone to aim. Returns the
       * new pose, or null.
       */
      aim(j, x, y) {
        const t = pose.thing;
        if (!t || !pose.q) return null;
        const b = t.bones[j], p = b && b.parent;
        if (!b || !p || !p.isBone) return null;
        const pi = t.bones.indexOf(p);
        if (pi < 0) return null;
        t.group.updateMatrixWorld(true);
        const bw = b.getWorldPosition(new THREE.Vector3()), pw = p.getWorldPosition(new THREE.Vector3());
        const ndc = new THREE.Vector3((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1, 0.5);
        const dir = ndc.unproject(cam).sub(cam.position).normalize();
        const nrm = new THREE.Vector3(); cam.getWorldDirection(nrm);
        const den = dir.dot(nrm);
        if (Math.abs(den) < 1e-6) return null;
        const hit = cam.position.clone().addScaledVector(dir, bw.clone().sub(cam.position).dot(nrm) / den);
        const from = bw.sub(pw).normalize(), to = hit.sub(pw).normalize();
        if (from.lengthSq() < 1e-12 || to.lengthSq() < 1e-12) return null;
        const dq = new THREE.Quaternion().setFromUnitVectors(from, to);
        const pwq = p.getWorldQuaternion(new THREE.Quaternion());
        const parentWq = p.parent ? p.parent.getWorldQuaternion(new THREE.Quaternion()) : new THREE.Quaternion();
        const local = parentWq.invert().multiply(dq.multiply(pwq));
        p.quaternion.copy(local);
        pose.q[pi] = local.toArray();
        return this.get();
      },
    },
  };
})();
