/* ═══════════════════════════════════════════════════════════════════════════
   DEATH CULTURE: the print catalogue.

   `printing-lab.html` is generated from this file plus
   templates/printing-lab.html by `node build.js`.

   TO ADD A POSTER
   ───────────────
   Easiest: double-click studio.cmd and use the Add a poster tab — it does all
   three steps below for you, then publishes to GitHub.

   By hand:
   1. Save the scan in assets/img/death-culture/ as the next number in its set,
      e.g. death-culture-10.jpg  (or sky-bodybags-17.jpg).
   2. Add one line to that set's `prints` array below: the caption, in order.
   3. Run:  node build.js

   Every count on the page follows automatically: the status bar, the counter
   card, the "N pulls" heading, each set's sheet count, the homepage card and
   the structured data. Nothing else to touch.

   TO ADD A WHOLE COLLECTION
   ─────────────────────────
   Copy a `sets` block. `prefix` is the image file prefix, so a set with
   prefix 'winter-sheets' expects winter-sheets-01.jpg, -02.jpg, …
   The build refuses to run if a numbered file is missing.
   ═══════════════════════════════════════════════════════════════════════════ */

module.exports = {

  /* ── Counter-card rows that aren't derived from the sets ── */
  facts: [
    { label: 'Posters on site', value: '30–40' },
    { label: 'Technique',       value: 'LINO'  },
    { label: 'Status',          value: 'LIVE'  },
  ],

  /* ── The stamp collection: one carved block per entry ──
     NOT CURRENTLY ON THE PAGE. The stamp-collection section was taken off
     printing-lab.html, so nothing renders this array today — it is kept
     because the descriptions are the only written record of what each block
     means. To put the section back, restore the `03 · The stamp collection`
     block in templates/printing-lab.html with a {{MOTIF_GRID}} token, and the
     motifGrid() renderer in build.js. To drop it for good, delete this array. */
  motifs: [
    {
      name: 'Cypress',
      desc: 'The cedar of the statement, mourning tree of Persian gardens and gravestones. Printed upright, inverted, or rooted in nothing. In black it carries the shape of a body bag, after footage from Iran of protesters lying in the street.',
    },
    {
      name: 'Hound',
      desc: 'A running dog, sometimes in bare outline, sometimes filled with Persian ornament. It is always in motion and never arrives.',
    },
    {
      name: 'Bird of prey',
      desc: 'The bird carrying instruments of war. Cut heavy and solid, so it prints as a shadow crossing the sheet.',
    },
    {
      name: 'Mountain',
      desc: 'Ridge lines cut in hard, jagged strokes. Read them again and they are missile silhouettes: the mountains filled with missiles.',
    },
    {
      name: 'Flame',
      desc: 'A small sprig-and-fire mark used as a seal, printed in gold, red or white on a black ground.',
    },
    {
      name: 'Cloud',
      desc: 'The curling cloud band of Persian miniature painting, standing in for the fog of propaganda. It prints in red across everything else.',
    },
  ],

  /* ── One line from the statement, set as a caesura between two collections.
        `after` is the name of the set it follows. Drop the whole block to
        remove it; the sets close up on their own. ── */
  pull: {
    after: 'Death Culture',
    text:  'If we impose war, war will be imposed on us; if we implant death, we will harvest death.',
  },

  /* ── The collections ── */
  sets: [
    {
      name:   'Death Culture',
      prefix: 'death-culture',
      meta:   'black &amp; gold · A4',
      /* Sheets 2 and 6 are portrait scans that read better sideways: the
         pixels turn a quarter and the card follows, landscape-shaped, so the
         full poster lands in the grid rather than a portrait-card crop.
         Sheet 6 turns clockwise, the set's default. Sheet 2 keeps its
         original counter-clockwise turn (`turn-rev`) — its established
         orientation, left as is on request even after 6 was found upside
         down and the default direction got corrected. Sheet 7 was scanned
         the wrong way up — the cypress hangs by its crown and the hounds
         run on their backs. Turned half a circle. */
      orient: { 2: 'turn turn-rev', 6: 'turn', 7: 'flip' },
      prints: [
        'The recurring cast laid out as a proof sheet: cypress stamps, a gold field, a running dog.',
        'A mountain range cut in a single block, printed against a gold column.',
        'Four dogs in flight above a fifth drawn in outline; flame stamp and gold ground.',
        'Bird of prey, ornamented hound and mountains, layered in grey and gold over a printed field.',
        'Overprinted cypress and mountain blocks, the ink built up until the forms crowd each other.',
        'A body opened out, surrounded by gold animals rising like flame; a black bar closes the sheet.',
        'Trees, ridges and wings layered in monochrome until they press into a single dark mass.',
        'A cypress grown from circuitry, a bird overhead, mountains behind and a red flame stamp between them.',
        'The stamp set printed loose across the page, each block inked at a different weight.',
      ],
    },
    {
      name:   'Bodybags',
      prefix: 'bodybags',
      meta:   'black, white &amp; red · A3',
      /* The only two landscape scans in the catalogue, turned upright to
         stand with the rest of the grid. Both get an extra half turn
         (`rotate-180`) on request, on top of the set's default. Keys count
         within this set, not across the page: 2 and 6 here are sheets 11
         and 15. */
      orient: { 2: 'rotate rotate-180', 6: 'rotate rotate-180' },
      prints: [
        'A circuit-grown cypress topped with a skull, beside a dense grid of tree-stamp panels and a single red flame stamp.',
        'Twin flame-skull cypresses in white flank a black circuit cypress, the whole sheet inked red edge to edge.',
        'A black circuit cypress beside three rows of tree-stamp panels, root and crown alternating down the page.',
        'A flame-skull cypress in white and a circuit-skull cypress in black split a red ground, boxed top and bottom by tree-stamp panels.',
        'A white flame-skull cypress on red, beside nine black tree-stamp panels printed edge to edge.',
        'A flame-skull cypress and a circuit-skull cypress printed side by side across a mottled grey-and-red ground.',
        'A black circuit cypress overlaid on a mirrored pair of white flame-skull cypresses, small red stamps caught at the seam.',
        'A small black tree stamp sits beside a white flame-skull cypress crossed by a black circuit cypress, both on red.',
        'A white flame-skull cypress and a black circuit-skull cypress mirrored on one red sheet, a small black stamp at the corner.',
        'A white flame-skull cypress on red meets a black circuit cypress on white, the sheet cut clean down the middle.',
        'Two flame-skull cypresses in white flank a circuit tree, small tree stamps running off the top and bottom edges.',
        'Rows of tree and root stamps, some upright, some rootless and inverted, filling the page edge to edge.',
        'A black circuit cypress rising from a cross of eleven tree-stamp panels.',
        'A black circuit cypress over a scatter of smaller tree and root stamps, one panel pulled almost bare.',
        'Tree and root stamps massed and overlapped, the ink bleeding red past every panel\'s edge.',
        'A white flame-skull cypress and a black circuit-skull cypress on red, a small black stamp boxed off at the top corner.',
        'Six tree-stamp panels in a row, ink bridging the white gaps between them.',
        'A black circuit cypress radiating into a cross of tree-stamp panels, three of them boxed in red.',
      ],
    },
    {
      name:   'Sky Bodybags',
      prefix: 'sky-bodybags',
      meta:   'red, blue &amp; black · A4',
      prints: [
        'Black bird between two red cloud stamps; below, a hound in blue and a cypress on a blue ground.',
        'Cloud and flame blocks printed in red across an open sheet.',
        'Cypress panels repeated in a column, ink thinning with each pull.',
        'Red clouds banked under a black bird, the paper left open around them.',
        'Blue hound and red cloud, printed over one another.',
        'Cypress and root blocks in black, arranged as a grid.',
        'A single mountain block, printed twice and offset.',
        'Bird, cloud and tree overlaid until the layers close.',
        'Seven cypress panels arranged as a cross beside a circuit-cut tree, flame and cloud in red.',
        'The full sheet worked over: trees, clouds, birds and mountains in red, blue and black.',
        'Two cypress panels, sparse, on open paper.',
        'Clouds massed in red beneath a black wing.',
        'Root systems repeated across the page.',
        'Mountains and cypress, printed dense and dark.',
        'A single hound, printed clean in blue.',
        'Closing sheet. Cypress, cloud and flame, all at low ink.',
      ],
    },
  ],
};
