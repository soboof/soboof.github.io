/* ═══════════════════════════════════════════════════════════════════════════
   THE FOUR PROJECTS — the introduction block on the landing page.

   Rendered into the `01 · Projects` section of index.html by `node build.js`.
   Edit the copy here; don't edit the generated markup in index.html.

   HEADINGS
   ────────
   `name` is the section's <h2> — the project is what the heading names. `role`
   sits under it as the sub-heading, and `key` supplies both the eyebrow above
   ("02 · ARCHITECTURE", from the part after the ·) and the vertical rail tick
   ("· · · SA ↑", from the part before it). So `key` is always
   `<ABBREVIATION> · <FIELD>`.

   `logo` is optional: a file in assets/img/ drawn into the heading, ahead of
   the name. The .svg on disk is the master — it must use fill="currentColor"
   so the mark takes the section tint and follows the night/day theme. Only the
   two software tools carry one; Mirbreak and Death Culture have no logotype.

   Two tokens are filled in at build time so the counts can never go stale:
     {{ARTWORKS}}  → how many pieces are in data/artworks.js
     {{PRINTS}}    → how many sheets are in data/prints.js

   `accent` tints the card's rule and index number. Only these exist in
   index.html — anything else renders as no colour at all:
     --accent   gold in night mode, purple in day
     --mirror   silver in night, deepened green in day
     --earth    earthbag tan in night, deepened umber in day
     --red      deepened in day
     --green    same in both themes — not deepened, so keep it off small type
                on the light background

   EXAMPLES
   ────────
   Each project shows three on the landing page. `source` says where the build
   resolves them from, so nothing is duplicated and nothing can go stale:

     source: 'models'    → a file in assets/models/. The build parses the real
                           geometry and bakes a wireframe SVG into the page.
                           `label` and `note` are yours to write; the vertex and
                           face counts under each drawing are measured, not typed.
     source: 'domes'     → a superadobe structure written as its build rule
                           ({ type, span, … } in metres). The build lays the
                           course stack and bakes the elevation into the page;
                           the course count and running metres of sack under
                           each drawing are measured off that stack, not typed.
     source: 'artworks'  → a `slug` from data/artworks.js. Photo, title and link
                           all come from there.
     source: 'prints'    → an image basename from assets/img/death-culture/.
                           The caption comes from data/prints.js.

   The build fails if a model file, slug, print image or logo is missing.
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
            'rotation, then export the form you grew. The bodies behind Mirbreak ' +
            'are grown here.',
    meta:   ['WEB', 'THREE.JS', 'FREE'],
    href:   'https://pythagorasengine.com/builder',
    cta:    'Open the builder',
    accent: 'var(--mirror)',
    logo:   'pythagoras-engine-logo.svg',
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
    id:     'superadobe',
    key:    'SA · PROCEDURAL DESIGN',
    status: 'FREE · OPEN SOURCE',
    name:   'SuperAdobe Generator',
    role:   'Earthbag dome designer & material calculator',
    body:   'Procedural design at building scale. Lay out a complex of domes, ' +
            'vaults and cylinders on a scan of your own land, watch it rise course by ' +
            'course, and get back the sack, wire, fill and plaster it will take.',
    meta:   ['WEB', 'EARTHBAG', 'FREE'],
    href:   'https://soboof.com/superadobe-generator/',
    cta:    'Open the generator',
    accent: 'var(--earth)',
    logo:   'superadobe-logo.svg',
    external: true,
    source: 'domes',
    examples: [
      { type: 'dome',     span: 5,   label: 'Dome',
        note: 'Struck the conventional way — compass on the outer edge of the base sack, rr = 2·rb + sw.' },
      { type: 'vault',    span: 3.5, length: 7, label: 'Vault',
        note: 'The same wall run along a length, closing on the catenary a barrel stands in.' },
      { type: 'cylinder', span: 4,   height: 2.4, label: 'Cylinder',
        note: 'A straight drum, left open at the top for a roof or a second storey.' },
    ],
  },
  {
    id:     'mirbreak',
    key:    'MB · SCULPTURE',
    status: '{{ARTWORKS}} PIECES',
    name:   'Mirbreak',
    role:   'Mirrored modular sculptures',
    body:   'Hand-cut mirror tiles mounted on modular 3D-printed bodies grown in the ' +
            'Pythagoras Engine, using the centuries-old Ayeneh-Kari technique. Every ' +
            'face holds a triangular fragment of the room, so the piece changes as ' +
            'you move around it.',
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
    key:    'DC · GRAPHIC DESIGN',
    status: 'ONGOING',
    name:   'Death Culture',
    role:   'Hand-printing kiosk · with Ju Bergman',
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
