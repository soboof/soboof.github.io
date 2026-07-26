/* ═══════════════════════════════════════════════════════════════════════════
   ARTWORKS — the single source of truth for the whole site.

   Every artwork page, the gallery grid, the homepage work grid and
   sitemap.xml are generated from this file by `node build.js`.

   TO ADD A PIECE
   ──────────────
   1. Drop its photos in assets/img/ named  <imgPrefix>-01.jpg, -02.jpg, …
   2. Copy the block below, fill it in, give it the next free `code`.
   3. Run:  node build.js
   Nothing else needs editing — the new page, its gallery card, its links
   and its sitemap entry all appear.

   FIELD NOTES
   ───────────
   slug        file name without .html — also the public URL
   code        SBF · 0NN — shown on cards, manifest and 3D view
   imgPrefix   photo file prefix in assets/img/
   photos      how many photos exist (imgPrefix-01 … -0N)
   edition     'ooak' | 'ltd' | 'sale' | null  — styles the badge
   featured    'big' | 'std' | null — place and size on the homepage grid
   filters     space-separated keys the gallery filter buttons match
   price       kept in sync with WooCommerce for reference only; the
               portfolio deliberately does not display prices
   ═══════════════════════════════════════════════════════════════════════════ */

module.exports = [

  {
    slug:      'space-fox',
    code:      'SBF · 001',
    name:      'Space Fox',
    subtitle:  'Prowling the void between matter and imagination.',
    imgPrefix: 'space-fox',
    photos:    7,

    edition:      'ooak',
    editionLabel: 'ONE OF A KIND',
    galleryBadge: 'ONE OF A KIND',
    editionSpec:  'One of a kind',
    availability: 'One of a kind · Enquire for availability',

    categories: ['Abstract', 'Animals', 'Statue'],
    filters:    'abstract animals statue',
    featured:   'big',

    dims:   { l: 16, w: 20, h: 18, weight: 2 },
    price:  { regular: '440', sale: '' },

    metaTitle: 'Space Fox — One-of-a-Kind Mirrored Sculpture | Soboof',
    metaDesc:  'Space Fox by Soboof. One-of-a-kind mirrored sculpture on a 3D-printed geometric body — black mirror with gold constellations. 16×20×18 cm. Leeuwarden, NL.',

    cardDesc: 'Space Fox prowls the void between matter and imagination, its body forged from black mirror, veins of gold tracing constellations across faceted surfaces.',

    description: `A body <strong>forged from black mirror</strong>, with veins of gold tracing constellations across every facet. Space Fox exists in the threshold between reality and myth — a geometric figure assembled from hand-cut <strong>Ayeneh-Kari</strong> tiles on a 3D-printed modular body, each triangular face capturing a different fragment of the room around it.`,

    schemaDesc: 'One-of-a-kind mirrored sculpture: hand-cut Ayeneh-Kari tiles on a 3D-printed modular body.',

    formTags: ['Branching growth', 'Crystallization', 'Lattices', 'Modular repetition'],
    manifestPrimitive: 'MODULAR<br>FORM',
  },

  {
    slug:      'the-owl-statue',
    code:      'SBF · 002',
    name:      'The Owl Statue',
    subtitle:  'A guardian of thresholds between knowledge and mystery.',
    imgPrefix: 'the-owl-statue',
    photos:    5,

    edition:      'ooak',
    editionLabel: 'ONE OF A KIND',
    galleryBadge: 'ONE OF A KIND',
    editionSpec:  'One of a kind',
    availability: 'One of a kind · Enquire for availability',

    categories: ['Abstract', 'Animals', 'Statue'],
    filters:    'abstract animals statue',
    featured:   'std',

    dims:   { l: 16, w: 20, h: 18, weight: 2 },
    price:  { regular: '260', sale: '' },

    metaTitle: 'The Owl Statue — Mirrored Sculpture by Soboof',
    metaDesc:  'The Owl Statue by Soboof. A one-of-a-kind faceted mirror sculpture that turns stillness into geometry — hand-cut Ayeneh-Kari, 16×20×18 cm. Leeuwarden, NL.',

    cardDesc: 'Perches in quiet vigilance, a guardian of thresholds between knowledge and mystery. Its body, sculpted from faceted mirror, watches without moving.',

    description: `The Owl perches in <strong>quiet vigilance</strong>, a guardian of thresholds between knowledge and mystery. Its body, sculpted from faceted surfaces, captures and refracts light — turning stillness into a subtle geometry of shadows and reflections. Each angle reveals new facets: hidden patterns, whispered truths, fragmented visions of the world. It reminds us that <strong>seeing is never passive</strong>; understanding emerges through reflection, patience and attentiveness.`,

    schemaDesc: 'One-of-a-kind mirrored owl sculpture: hand-cut Ayeneh-Kari tiles on a 3D-printed modular body.',

    formTags: ['Faceting', 'Radial symmetry', 'Lattices', 'Modular repetition'],
    manifestPrimitive: 'FACETED<br>MASS',
  },

  {
    slug:      'simorgh-phoenix',
    code:      'SBF · 003',
    name:      'Simorgh (Phoenix)',
    subtitle:  'A benevolent bird of Persian myth, reassembled in mirror.',
    imgPrefix: 'simorgh-phoenix',
    photos:    11,

    edition:      'sale',
    editionLabel: '1ST EDITION',
    galleryBadge: 'SALE · 1ST ED.',
    editionSpec:  '1st edition',
    availability: '1st edition · Enquire for availability',

    categories: ['Animals', 'Statue', 'Symmetrical'],
    filters:    'animals statue symmetrical',
    featured:   'std',

    dims:   { l: 22, w: 22, h: 18, weight: 2 },
    price:  { regular: '280', sale: '180' },

    metaTitle: 'Simorgh (Phoenix) — Mirrored Sculpture | Soboof',
    metaDesc:  'Simorgh (Phoenix) by Soboof. The benevolent bird of Persian myth rebuilt as faceted Ayeneh-Kari mirrorwork on a 3D-printed body. 22×22×18 cm. Leeuwarden, NL.',

    cardDesc: 'A benevolent bird in Persian mythology and literature. It bears similarities with mythological birds from different origins, such as the phoenix.',

    description: `The <strong>Simorgh</strong> is a benevolent bird in Persian mythology and literature, bearing similarities with mythological birds of other origins — among them the phoenix. Associated with the sun, a phoenix obtains new life by rising from the ashes of its predecessor: some legends say it dies in a show of flames, others that it simply decomposes before being born again. Here that cycle is rebuilt in <strong>hand-cut mirror</strong>, wing by wing.`,

    schemaDesc: 'Mirrored phoenix sculpture: hand-cut Ayeneh-Kari tiles on a 3D-printed symmetrical body.',

    formTags: ['Bilateral symmetry', 'Crystallization', 'Feathered facets', 'Modular repetition'],
    manifestPrimitive: 'WINGED<br>FORM',
  },

  {
    slug:      'abstract-space-vogel',
    code:      'SBF · 004',
    name:      'Abstract Space Vogel',
    subtitle:  'Geometry, reflection and transformation on a mirrored pedestal.',
    imgPrefix: 'abstract-space-vogel',
    photos:    2,

    edition:      'ooak',
    editionLabel: 'ONE OF A KIND',
    galleryBadge: 'ONE OF A KIND',
    editionSpec:  'One of a kind',
    availability: 'One of a kind · Enquire for availability',

    categories: ['Abstract', 'Animals', 'Statue'],
    filters:    'abstract animals statue',
    featured:   null,

    dims:   { l: 16, w: 20, h: 18, weight: 2 },
    price:  { regular: '450', sale: '' },

    metaTitle: 'Abstract Space Vogel — Mirrored Sculpture | Soboof',
    metaDesc:  'Abstract Space Vogel by Soboof. A faceted black crystalline bird rising from a mirrored pedestal — one-of-a-kind Ayeneh-Kari, 16×20×18 cm. Leeuwarden, NL.',

    cardDesc: 'A sculptural exploration of geometry, reflection, and transformation. Rising from a mirrored pedestal, its faceted black crystalline body breaks light into shards.',

    description: `Space Vogel is a sculptural exploration of <strong>geometry, reflection and transformation</strong>. Rising from a mirrored pedestal, its faceted black crystalline body captures both the organic and the cosmic — sharp angular forms echoing constellations, meteorites and digital fragmentation. The glossy surfaces catch and bend light, creating shifting reflections that blur the line between physical presence and illusion. Placed atop a reflective cube, the piece <strong>doubles itself in perception</strong>.`,

    schemaDesc: 'One-of-a-kind mirrored bird sculpture on a reflective pedestal, hand-tiled in Ayeneh-Kari.',

    formTags: ['Crystallization', 'Faceting', 'Reflection doubling', 'Modular repetition'],
    manifestPrimitive: 'CRYSTAL<br>FORM',
  },

  {
    slug:      'geometrical-mouse',
    code:      'SBF · 005',
    name:      'Geometrical Mouse',
    subtitle:  'Small, sharp and mirror-faceted home decor.',
    imgPrefix: 'geometrical-mouse',
    photos:    8,

    edition:      'ltd',
    editionLabel: '3RD EDITION',
    galleryBadge: '3RD EDITION',
    editionSpec:  '3rd edition',
    availability: '3rd edition · Home decor · Enquire for availability',

    categories: ['Animals', 'Home decor', 'Symmetrical'],
    filters:    'animals statue symmetrical',
    featured:   'big',

    dims:   { l: 20, w: 17, h: 15, weight: 2 },
    price:  { regular: '', sale: '' },

    metaTitle: 'Geometrical Mouse — Mirrored Home Decor | Soboof',
    metaDesc:  'Geometrical Mouse by Soboof. Generative geometry and mirrored polygons turn the animal into modular home decor. 3rd edition, 20×17×15 cm. Leeuwarden, NL.',

    cardDesc: 'The geometrical mouse home decor series transforms the familiar animal form into a work of abstract geometry and generative design — small, sharp, and mirror-faceted.',

    description: `The geometrical mouse series transforms a familiar animal form into a work of <strong>abstract geometry and generative design</strong>. Each piece is reimagined through clean lines, mirrored polygons and modular symmetry, creating a balance between organic curve and mathematical precision. Inspired by parametric algorithms and minimalist abstraction, it carries the playful, mysterious essence of the animal while showing off <strong>computational aesthetics</strong> — an architectural edge on traditional animal portraiture.`,

    schemaDesc: 'Mirrored geometric mouse sculpture for the home: hand-cut Ayeneh-Kari on a 3D-printed body.',

    formTags: ['Modular repetition', 'Bilateral symmetry', 'Parametric geometry', 'Lattices'],
    manifestPrimitive: 'MODULAR<br>FORM',
  },

  {
    slug:      'geometrical-cat',
    code:      'SBF · 006',
    name:      'Geometrical Cat',
    subtitle:  'The feline form, redrawn in mirrored polygons.',
    imgPrefix: 'geometrical-cat',
    photos:    2,

    edition:      'sale',
    editionLabel: '3RD EDITION',
    galleryBadge: 'SALE · 3RD ED.',
    editionSpec:  '3rd edition',
    availability: '3rd edition · Home decor · Enquire for availability',

    categories: ['Animals', 'Home decor', 'Symmetrical'],
    filters:    'animals statue symmetrical',
    featured:   null,

    dims:   { l: 16, w: 16, h: 18, weight: 2 },
    price:  { regular: '120', sale: '65' },

    metaTitle: 'Geometrical Cat — Mirrored Home Decor | Soboof',
    metaDesc:  'Geometrical Cat by Soboof. The feline form rebuilt from clean lines, mirrored polygons and modular symmetry. 3rd edition, 16×16×18 cm. Leeuwarden, NL.',

    cardDesc: 'The geometrical cat statue home decor series transforms the familiar feline form into a work of abstract geometry and generative design — a quieter sibling to the mouse.',

    description: `The geometrical cat series transforms the familiar feline form into a work of <strong>abstract geometry and generative design</strong>. Clean lines, mirrored polygons and modular symmetry hold organic curve and mathematical precision in balance. Inspired by parametric algorithms and minimalist abstraction, it keeps the playful yet mysterious essence of the cat while bringing a <strong>modern, architectural edge</strong> to animal portraiture.`,

    schemaDesc: 'Mirrored geometric cat sculpture for the home: hand-cut Ayeneh-Kari on a 3D-printed body.',

    formTags: ['Modular repetition', 'Bilateral symmetry', 'Parametric geometry', 'Faceting'],
    manifestPrimitive: 'MODULAR<br>FORM',
  },

  {
    slug:      'abstract-space-fox-ii',
    code:      'SBF · 007',
    name:      'Abstract Space Fox II',
    subtitle:  'A second study: geometry collapsing into instinct.',
    imgPrefix: 'abstract-space-fox-ii',
    photos:    2,

    edition:      'ooak',
    editionLabel: 'ONE OF A KIND',
    galleryBadge: 'ONE OF A KIND',
    editionSpec:  'One of a kind',
    availability: 'One of a kind · Enquire for availability',

    categories: ['Abstract', 'Animals', 'Statue'],
    filters:    'abstract animals statue',
    featured:   null,

    dims:   { l: 16, w: 20, h: 18, weight: 2 },
    price:  { regular: '550', sale: '' },

    metaTitle: 'Abstract Space Fox II — Mirrored Sculpture | Soboof',
    metaDesc:  'Abstract Space Fox II by Soboof. A faceted black crystalline fox rising from a mirrored pedestal — one-of-a-kind Ayeneh-Kari, 16×20×18 cm. Leeuwarden, NL.',

    cardDesc: 'A second take on the Space Fox study: faceted black crystalline body rising from a mirrored pedestal, geometry collapsing into instinct.',

    description: `A sculptural exploration of <strong>geometry, reflection and transformation</strong>. Rising from a mirrored pedestal, its faceted black crystalline body captures both the organic and the cosmic — a fox emerging from the void of space, its sharp angular forms echoing constellations, meteorites and digital fragmentation. The glossy black surfaces catch and bend light, blurring the line between physical presence and illusion until the viewer has to ask <strong>where reality ends and imagination begins</strong>.`,

    schemaDesc: 'One-of-a-kind mirrored fox sculpture on a reflective pedestal, hand-tiled in Ayeneh-Kari.',

    formTags: ['Crystallization', 'Faceting', 'Reflection doubling', 'Modular repetition'],
    manifestPrimitive: 'CRYSTAL<br>FORM',
  },

  {
    slug:      'dear-mr-fox',
    code:      'SBF · 008',
    name:      'Dear Mr. Fox',
    subtitle:  'Part geometry, part ghost, all gaze.',
    imgPrefix: 'dear-mr-fox',
    photos:    3,

    edition:      'ltd',
    editionLabel: '2ND EDITION',
    galleryBadge: '2ND EDITION',
    editionSpec:  '2nd edition',
    availability: '2nd edition · Made to order · Enquire for availability',

    categories: ['Animals', 'Statue'],
    filters:    'animals statue',
    featured:   null,

    dims:   { l: 16, w: 18, h: 18, weight: 2 },
    price:  { regular: '180', sale: '' },

    metaTitle: 'Dear Mr. Fox — Geometric Mirrored Sculpture | Soboof',
    metaDesc:  'Dear Mr. Fox by Soboof. A mirrored fox caught between curiosity and caution, hand-tiled in Persian Ayeneh-Kari mirrorwork. 16×18×18 cm. Leeuwarden, NL.',

    cardDesc: 'A mirrored fox caught between curiosity and caution. Its angular body, born of generative geometry, refuses to settle into a single read.',

    description: `A study in <strong>stillness and intent</strong> — a creature frozen at the edge of decision. Constructed from MirBreak modular elements and hand-tiled with Persian <strong>Ayeneh-Kari</strong> mirrorwork, its faceted geometry refracts light into a living pelt of reflections. Each triangular shard is cut and set with the pop-break technique, contrasting bright catching surfaces against muted, shadowed planes. The fox is both trickster and guide: part geometry, part ghost, all gaze.`,

    schemaDesc: 'Mirrored geometric fox sculpture: hand-cut Ayeneh-Kari tiles on a 3D-printed modular body.',

    formTags: ['Branching growth', 'Faceting', 'Pop-break shards', 'Modular repetition'],
    manifestPrimitive: 'MODULAR<br>FORM',
  },

  {
    slug:      'abstract-table-lamp',
    code:      'SBF · 009',
    name:      'Abstract Table Lamp',
    subtitle:  'Where sculptural design meets functional lighting.',
    imgPrefix: 'abstract-table-lamp',
    photos:    7,

    edition:      'sale',
    editionLabel: 'FUNCTIONAL · 1ST ED.',
    galleryBadge: 'FUNCTIONAL · 1ST ED.',
    editionSpec:  '1st edition · Functional',
    availability: '1st edition · Functional · Enquire for availability',

    categories: ['Furniture', 'Symmetrical', 'Functional'],
    filters:    'furniture symmetrical',
    featured:   'std',

    dims:   { l: 16, w: 20, h: 18, weight: 2 },
    price:  { regular: '210', sale: '120' },

    metaTitle: 'Abstract Table Lamp — Sculptural Mirror Light | Soboof',
    metaDesc:  'Abstract table lamp by Soboof. A mirrored sculpture that doubles as ambient lighting — a statement piece even when switched off. 16×20×18 cm. Leeuwarden, NL.',

    cardDesc: 'Transform your space with the abstract table lamp — where sculptural design meets functional lighting. Inspired by modern art; the bulb hides inside the geometry.',

    description: `Inspired by modern art, this lamp takes a <strong>unique abstract form</strong> that doubles as a decorative statement piece even when switched off. The warm, ambient glow creates a cosy atmosphere, making it well suited to bedrooms, living rooms and creative workspaces. Crafted from <strong>glass mirror</strong> and designed for versatility, it sits comfortably in interiors from minimalist and contemporary through to eclectic and artistic.`,

    schemaDesc: 'Sculptural mirrored table lamp: hand-cut Ayeneh-Kari tiles over a 3D-printed body with concealed bulb.',

    formTags: ['Radial symmetry', 'Crystallization', 'Light diffusion', 'Modular repetition'],
    manifestPrimitive: 'FUNCTIONAL<br>FORM',
  },

  {
    slug:      'bird-of-dawn',
    code:      'SBF · 010',
    name:      'Bird of Dawn',
    subtitle:  'A quiet sentinel at the edge of night.',
    imgPrefix: 'bird-of-dawn',
    photos:    9,

    edition:      'sale',
    editionLabel: '2ND EDITION',
    galleryBadge: 'SALE · 2ND ED.',
    editionSpec:  '2nd edition',
    availability: '2nd edition · Enquire for availability',

    categories: ['Animals', 'Statue'],
    filters:    'animals statue',
    featured:   'std',

    dims:   { l: 16, w: 20, h: 18, weight: 2 },
    price:  { regular: '160', sale: '99' },

    metaTitle: 'Bird of Dawn — Mirrored Sculpture by Soboof',
    metaDesc:  'Bird of Dawn by Soboof. A faceted mirror bird holding the last of darkness and the first of daylight in suspended equilibrium. 16×20×18 cm. Leeuwarden, NL.',

    cardDesc: 'A quiet sentinel at the edge of night, Bird of Dawn perches in stillness — its faceted body a mosaic of dawnlight before any sun has risen.',

    description: `A <strong>quiet sentinel at the edge of night</strong>, Bird of Dawn perches in stillness, its faceted body a mosaic of light and shadow. Built from mirrored geometries, it catches the last breath of darkness and the first tremor of day, holding both in a <strong>suspended equilibrium</strong>.`,

    schemaDesc: 'Mirrored bird sculpture: hand-cut Ayeneh-Kari tiles on a 3D-printed modular body.',

    formTags: ['Bilateral symmetry', 'Faceting', 'Crystallization', 'Modular repetition'],
    manifestPrimitive: 'WINGED<br>FORM',
  },

  {
    slug:      'adam',
    code:      'SBF · 011',
    name:      'Adam',
    subtitle:  'A point of origin — for the figure, and for the practice.',
    imgPrefix: 'adam',
    photos:    8,

    edition:      'sale',
    editionLabel: '1ST EDITION',
    galleryBadge: 'SALE · 1ST ED.',
    editionSpec:  '1st edition',
    availability: '1st edition · Enquire for availability',

    categories: ['Statue', 'Symmetrical'],
    filters:    'statue symmetrical',
    featured:   'std',

    dims:   { l: 16, w: 18, h: 16, weight: 2 },
    price:  { regular: '80', sale: '45' },

    metaTitle: 'Adam — The First Mirrored Statue | Soboof',
    metaDesc:  'Adam by Soboof. The studio’s first statue: mirrored modular fragments treating the first human as a structural hypothesis. 16×18×16 cm. Leeuwarden, NL.',

    cardDesc: 'The first statue of the studio — mirrored modular fragments that treat the first human not as ancestor but as structural hypothesis.',

    description: `Adam is a <strong>point of origin</strong>: both for the figure it evokes and for the practice that shaped it. As the studio’s first statue it is a self-reflective beginning, where material, memory and intention converge to test what a body can be before it is fully known. Constructed from mirrored modular fragments, Adam resists completeness — treating the first human not as a mythological ancestor but as a <strong>structural hypothesis</strong>, an arrangement of planes negotiating with light, space and the viewer’s shifting position. Each reflection fractures authority, insisting that identity is assembled rather than inherited.`,

    schemaDesc: 'Mirrored figurative statue built from modular fragments, hand-tiled in Ayeneh-Kari.',

    formTags: ['Modular repetition', 'Bilateral symmetry', 'Fragmentation', 'Lattices'],
    manifestPrimitive: 'FIGURE<br>FORM',
  },

];
