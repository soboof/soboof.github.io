/* ═══════════════════════════════════════════════════════════════════════════
   THE THREE PROJECTS — the introduction block on the landing page.

   Rendered into the `01 · Projects` section of index.html by `node build.js`.
   Edit the copy here; don't edit the generated markup in index.html.

   Two tokens are filled in at build time so the counts can never go stale:
     {{ARTWORKS}}  → how many pieces are in data/artworks.js
     {{PRINTS}}    → how many sheets are in data/prints.js

   `accent` tints the card's rule and index number. Only these exist in
   index.html — anything else renders as no colour at all:
     --accent   gold in night mode, purple in day
     --mirror   silver in night, deepened green in day
     --green    same in both themes
     --red      same in both themes

   EXAMPLES
   ────────
   Each project shows three on the landing page. `source` says where the build
   resolves them from, so nothing is duplicated and nothing can go stale:

     source: 'models'    → a file in assets/models/. The build parses the real
                           geometry and bakes a wireframe SVG into the page.
                           `label` and `note` are yours to write; the vertex and
                           face counts under each drawing are measured, not typed.
     source: 'artworks'  → a `slug` from data/artworks.js. Photo, title and link
                           all come from there.
     source: 'prints'    → an image basename from assets/img/death-culture/.
                           The caption comes from data/prints.js.

   The build fails if a model file, slug, or print image is missing.
   ═══════════════════════════════════════════════════════════════════════════ */

module.exports = [
  {
    id:     'pythagoras-engine',
    key:    'PE · SOFTWARE',
    status: 'LIVE',
    name:   'Pythagoras Engine',
    role:   'Procedural polyhedron builder',
    body:   'The studio’s modular logic, running as software. Snap polyhedra face to ' +
            'face — tetrahedra, Johnson solids, prisms and cupolas — set height and ' +
            'rotation, then export the form you grew.',
    meta:   ['WEB', 'THREE.JS', 'FREE'],
    href:   'https://pythagorasengine.com/builder',
    cta:    'Open the builder',
    accent: 'var(--mirror)',
    external: true,
    source: 'models',
    examples: [
      { file: 'pythagoras_m21.gltf', label: 'M21',
        note: 'Modules stacked along a single axis — the growth rule applied in one direction.' },
      { file: 'pythagoras.obj',      label: 'M22',
        note: 'A short run of solids snapped face to face, each rotated against the last.' },
      { file: 'pe_model.obj',        label: 'PE MODEL',
        note: 'Branching in more than one direction until the form closes on itself.' },
    ],
  },
  {
    id:     'mirbreak',
    key:    'MB · SCULPTURE',
    status: '{{ARTWORKS}} PIECES',
    name:   'Mirbreak',
    role:   'Mirrored modular sculptures',
    body:   'Hand-cut mirror tiles mounted on modular 3D-printed bodies using the ' +
            'centuries-old Ayeneh-Kari technique. Every face holds a triangular ' +
            'fragment of the room, so the piece changes as you move around it.',
    meta:   ['MIRROR', 'PLA', 'ONE-OFF'],
    href:   'mirbreak.html',
    cta:    'Inside Mirbreak',
    accent: 'var(--accent)',
    source: 'artworks',
    examples: [
      { slug: 'space-fox' },
      { slug: 'simorgh-phoenix' },
      { slug: 'the-owl-statue' },
    ],
  },
  {
    id:     'death-culture',
    key:    'DC · PERFORMANCE',
    status: 'ONGOING',
    name:   'Death Culture',
    role:   'Hand-printing kiosk',
    body:   'Six carved lino stamps: cypress, hound, bird of prey, mountain, flame, ' +
            'cloud. They are printed live on site while visitors help place the body ' +
            'bags on the paper. {{PRINTS}} sheets documented so far, across two collections.',
    meta:   ['LINO', 'A4', 'LIVE'],
    href:   'printing-lab.html',
    cta:    'See the prints',
    accent: 'var(--red)',
    source: 'prints',
    examples: [
      { img: 'death-culture-04' },
      { img: 'sky-bodybags-09' },
      { img: 'sky-bodybags-01' },
    ],
  },
];
