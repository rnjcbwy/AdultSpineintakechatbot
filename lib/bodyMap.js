// ============================================================================
// Body pain map — symptom marker types and anatomical zones.
//
// Marks are stored in normalized coordinates (0..1 of the SVG viewBox) so the
// figure can be rendered at any size. Each mark is resolved to a named
// anatomical zone at capture time, which is what makes the drawing usable
// clinically: the generated note can read "burning over the right lumbar
// region radiating to the right posterior thigh", not a list of pixels.
// ============================================================================

// The anterior and posterior figures are the supplied "pain point" drawing,
// traced to SVG and put on a common coordinate system by
// scripts/normalize-figures.js. 560 tall is inherited from the hand-drawn
// lateral views; 280 wide is what the traced front view needs at that height
// once its outstretched arms are included.
//
// Every zone box below was fitted to that artwork with
// scripts/figure-landmarks.js — crown y=8, shoulder y=94, axilla y=170,
// crotch y=305, patellae y≈400, ankles y≈505, soles y=552 — rather than
// guessed. Guessing is what previously resolved a mark on the flank to
// "left elbow".
export const VIEW_BOX = { width: 280, height: 560 };

/** Traced artwork per view. The lateral views are still drawn in code. */
export const FIGURE_SRC = {
  anterior: '/figures/figure-front.svg',
  posterior: '/figures/figure-back.svg',
};

/**
 * Marker types, distinguished by BOTH colour and shape so they stay legible
 * for colour-blind patients and in a black-and-white printout.
 */
export const SYMPTOM_TYPES = [
  { id: 'ache', label: 'Aching / dull pain', shape: 'circle', color: '#DC2626' },
  { id: 'sharp', label: 'Sharp / stabbing', shape: 'star', color: '#7F1D1D' },
  { id: 'burning', label: 'Burning', shape: 'diamond', color: '#EA580C' },
  { id: 'numbness', label: 'Numbness', shape: 'ring', color: '#2563EB' },
  { id: 'tingling', label: 'Pins and needles', shape: 'dots', color: '#7C3AED' },
  { id: 'weakness', label: 'Weakness', shape: 'square', color: '#0F766E' },
];

export function getType(id) {
  return SYMPTOM_TYPES.find((t) => t.id === id) || SYMPTOM_TYPES[0];
}

// The lateral figures were drawn for a 260-wide box. Rather than re-tune
// seventeen zone boxes and a dozen paths by hand for the wider one, that whole
// coordinate space is centred in it. components/BodyDiagram.js translates the
// lateral drawing by the same amount, so figure and zones stay in register.
export const LATERAL_DX = (VIEW_BOX.width - 260) / 2;

/**
 * Anatomical zones per view, in viewBox units: [xMin, yMin, xMax, yMax].
 *
 * `side: true`  the label needs a left/right qualifier.
 * `at: 'L'|'R'` which half of the FIGURE the box occupies, viewer's side.
 *
 * A box that sits on one side states it, because position alone is not
 * reliable: on this figure the feet very nearly touch, so the great-toe boxes
 * straddle the midline and a purely positional test drops their qualifier —
 * which silently disables the L5 and S1 pattern rules, since those require the
 * proximal and distal marks to be on the SAME side. Boxes that genuinely span
 * both halves (flank, buttock, shoulder blade) carry no `at` and are resolved
 * from where the patient actually touched.
 *
 * Boxes may overlap; zoneAt() resolves to the SMALLEST containing box. That is
 * what lets "lumbar spine" beat "flank" at the midline and — the one that
 * actually matters clinically — "perineum / saddle area" beat "buttock".
 */
export const ZONES = {
  anterior: [
    { name: 'head', box: [106, 4, 174, 78] },
    { name: 'neck', box: [116, 72, 164, 100] },
    { name: 'chest', box: [92, 96, 188, 200] },
    { name: 'abdomen', box: [94, 200, 186, 258] },
    { name: 'groin', box: [96, 258, 184, 306] },
    { name: 'groin / perineum', box: [122, 276, 158, 308] },
    ...limbZones(),
    ...legZones('thigh', 'knee', 'shin', 'foot'),
  ],
  posterior: [
    { name: 'back of head', box: [106, 4, 174, 78] },
    { name: 'cervical spine', box: [124, 70, 156, 106] },
    { name: 'shoulder blade', box: [92, 106, 188, 172], side: true },
    { name: 'thoracic spine', box: [126, 100, 154, 200] },
    { name: 'lumbar spine', box: [122, 200, 158, 252] },
    { name: 'flank', box: [90, 172, 190, 252], side: true },
    { name: 'sacrum / tailbone', box: [124, 248, 156, 280] },
    { name: 'buttock', box: [90, 246, 190, 306], side: true },
    { name: 'perineum / saddle area', box: [124, 280, 156, 312] },
    ...limbZones(),
    ...legZones('back of thigh', 'back of knee', 'calf', 'heel'),
  ],

  // Both lateral figures face the SAME way, so one zone set serves both and
  // the view name supplies the side. This is the surface a front-and-back
  // pair cannot reach — and it is where L5 and C6 actually run.
  left: lateralZones(),
  right: lateralZones(),
};

export const VIEWS = ['anterior', 'posterior', 'left', 'right'];
export const VIEW_LABELS = {
  anterior: 'Front',
  posterior: 'Back',
  left: 'Left side',
  right: 'Right side',
};
export const isLateral = (view) => view === 'left' || view === 'right';

function lateralZones() {
  const raw = [
    { name: 'head', box: [96, 8, 176, 80] },
    { name: 'neck', box: [106, 70, 152, 108] },
    { name: 'shoulder', box: [120, 96, 168, 140], side: true },
    { name: 'lateral chest wall', box: [98, 108, 160, 208], side: true },
    { name: 'flank', box: [98, 208, 164, 268], side: true },
    { name: 'hip / buttock', box: [96, 266, 166, 326], side: true },

    { name: 'lateral upper arm', box: [142, 110, 186, 222], side: true },
    { name: 'elbow', box: [144, 214, 186, 246], side: true },
    { name: 'lateral forearm', box: [146, 240, 188, 318], side: true },
    { name: 'hand', box: [146, 310, 192, 358], side: true },

    { name: 'lateral thigh', box: [98, 320, 154, 406], side: true },
    { name: 'knee', box: [100, 402, 154, 442], side: true },
    { name: 'lateral calf', box: [96, 438, 152, 522], side: true },
    { name: 'ankle', box: [106, 514, 146, 542], side: true },

    // The lateral foot border and the dorsum are the S1 / L5 giveaway.
    { name: 'heel', box: [94, 524, 124, 558], side: true },
    { name: 'lateral border of the foot', box: [124, 524, 152, 558], side: true },
    { name: 'dorsum of the foot / toes', box: [152, 524, 190, 558], side: true },
  ];
  return raw.map((z) => ({
    ...z,
    box: [z.box[0] + LATERAL_DX, z.box[1], z.box[2] + LATERAL_DX, z.box[3]],
  }));
}

/**
 * Upper-limb zones, subdivided medial/lateral where dermatomes actually
 * differ. C6 runs down the LATERAL forearm to the thumb while C8 runs down the
 * MEDIAL forearm to the little finger, so a single "forearm" label would lose
 * the distinction a patient's own drawing is trying to make.
 */
function limbZones() {
  // The arms hang abducted, so each band sits further out than the one above
  // it — on the traced figure the viewer-left arm runs x 58..87 at the axilla
  // but x 34..59 by the wrist. A single vertical column of boxes would leave
  // the forearm zones sitting over the hips. Each band's x-range is the
  // measured extent of the arm at that height, so no box reaches the trunk.
  const out = [];
  const bands = [
    // name,        L-outer L-split L-inner | R-inner R-split R-outer | y0   y1
    ['upper arm', 38, 64, 92, 188, 216, 242, 166, 230],
    ['elbow', 32, 54, 78, 202, 226, 248, 230, 262],
    ['forearm', 14, 38, 64, 216, 242, 266, 262, 298],
  ];
  for (const [name, lo, lm, li, ri, rm, ro, y0, y1] of bands) {
    out.push({ name: `lateral ${name}`, box: [lo, y0, lm, y1], side: true, at: 'L' });
    out.push({ name: `medial ${name}`, box: [lm, y0, li, y1], side: true, at: 'L' });
    out.push({ name: `medial ${name}`, box: [ri, y0, rm, y1], side: true, at: 'R' });
    out.push({ name: `lateral ${name}`, box: [rm, y0, ro, y1], side: true, at: 'R' });
  }

  // Digits — the dermatome giveaway in the upper limb (C6 thumb, C7 middle,
  // C8 little finger). The figure stands in anatomical position, so on each
  // hand the thumb is the OUTER half, away from the midline.
  out.push({ name: 'thumb / index finger', box: [8, 288, 36, 340], side: true, at: 'L' });
  out.push({ name: 'ring / little finger', box: [36, 288, 62, 340], side: true, at: 'L' });
  out.push({ name: 'ring / little finger', box: [218, 288, 244, 340], side: true, at: 'R' });
  out.push({ name: 'thumb / index finger', box: [244, 288, 272, 340], side: true, at: 'R' });

  out.push({ name: 'shoulder', box: [58, 92, 108, 152], side: true, at: 'L' });
  out.push({ name: 'shoulder', box: [172, 92, 222, 152], side: true, at: 'R' });
  return out;
}

/**
 * Lower-limb zones. Split medial/lateral for the same reason: L4 covers the
 * medial leg and medial foot, L5 the lateral leg and dorsum/great toe, and S1
 * the lateral foot and little toe.
 *
 * The vertical bands come off the traced figure: the legs divide at y=305,
 * the patellae sit at y≈400, the ankles narrow at y≈505, the soles end at 552.
 */
function legZones(thigh, knee, leg, foot) {
  const out = [];
  const bands = [
    [thigh, 302, 386],
    [knee, 386, 416],
    [leg, 416, 492],
  ];
  for (const [name, y0, y1] of bands) {
    // The viewer-left leg spans x 86..142. Its LATERAL surface is the outer
    // (low x) half; its MEDIAL surface is the half facing the midline.
    out.push({ name: `lateral ${name}`, box: [82, y0, 113, y1], side: true, at: 'L' });
    out.push({ name: `medial ${name}`, box: [113, y0, 141, y1], side: true, at: 'L' });
    out.push({ name: `medial ${name}`, box: [141, y0, 168, y1], side: true, at: 'R' });
    out.push({ name: `lateral ${name}`, box: [168, y0, 198, y1], side: true, at: 'R' });
  }

  out.push({ name: 'ankle', box: [112, 486, 147, 512], side: true, at: 'L' });
  out.push({ name: 'ankle', box: [147, 486, 182, 512], side: true, at: 'R' });

  // Toes carry the L5 / S1 distinction. The feet very nearly touch on this
  // figure, so left and right divide at x=147 rather than at the body midline.
  out.push({ name: `outer ${foot} / little toe`, box: [100, 505, 124, 558], side: true, at: 'L' });
  out.push({ name: `great toe / inner ${foot}`, box: [124, 505, 147, 558], side: true, at: 'L' });
  out.push({ name: `great toe / inner ${foot}`, box: [147, 505, 170, 558], side: true, at: 'R' });
  out.push({ name: `outer ${foot} / little toe`, box: [170, 505, 194, 558], side: true, at: 'R' });
  return out;
}

/**
 * Which side of the BODY a point falls on.
 *
 * Anterior view shows the patient facing the viewer, so the patient's left
 * appears on the viewer's right. The posterior view is seen from behind, so
 * the sides match. Getting this backwards would put the wrong leg in the note.
 */
export function bodySide(xNorm, view) {
  // A lateral figure shows one side of the body in its entirety.
  if (view === 'left' || view === 'right') return view;
  if (Math.abs(xNorm - 0.5) < 0.025) return null; // effectively midline
  return sideFromViewer(xNorm < 0.5, view);
}

/** Viewer's half of the figure -> the patient's own left or right. */
function sideFromViewer(viewerLeft, view) {
  if (view === 'left' || view === 'right') return view;
  const isPatientLeft = view === 'anterior' ? !viewerLeft : viewerLeft;
  return isPatientLeft ? 'left' : 'right';
}

/**
 * Resolve a normalized point to a readable anatomical label.
 * The smallest containing zone wins, so "lumbar spine" beats "flank" at midline.
 */
export function zoneAt(xNorm, yNorm, view) {
  const x = xNorm * VIEW_BOX.width;
  const y = yNorm * VIEW_BOX.height;
  const zone = (ZONES[view] || [])
    .filter((z) => x >= z.box[0] && x <= z.box[2] && y >= z.box[1] && y <= z.box[3])
    .sort((a, b) => area(a) - area(b))[0];

  if (!zone) return view === 'anterior' ? 'front of body' : 'back of body';
  if (!zone.side) return zone.name;
  // A box that knows which half it is on beats the positional test, which has
  // a midline dead-zone that would otherwise strip the qualifier off the toes.
  const side = zone.at ? sideFromViewer(zone.at === 'L', view) : bodySide(xNorm, view);
  return side ? `${side} ${zone.name}` : zone.name;
}

function area(z) {
  return (z.box[2] - z.box[0]) * (z.box[3] - z.box[1]);
}

/** Human-readable summary of the whole map, for the clinician note. */
export function summarizePainMap(painMap) {
  if (!painMap) return '';
  const lines = [];

  for (const view of VIEWS) {
    const data = painMap[view] || {};
    const marks = data.marks || [];
    const paths = data.paths || [];
    if (!marks.length && !paths.length) continue;

    // Collapse duplicates: one phrase per (type, zone) pair.
    const seen = new Set();
    const parts = [];
    for (const m of marks) {
      const key = `${m.type}|${m.zone}`;
      if (seen.has(key)) continue;
      seen.add(key);
      parts.push(`${getType(m.type).label.toLowerCase()} at the ${m.zone}`);
    }
    for (const p of paths) {
      if (!p.fromZone || !p.toZone) continue;
      parts.push(`${getType(p.type).label.toLowerCase()} radiating from the ${p.fromZone} to the ${p.toZone}`);
    }

    if (parts.length) {
      lines.push(`${VIEW_LABELS[view] || view}: ${parts.join('; ')}.`);
    }
  }

  return lines.join(' ');
}

/** Total marks plus radiation paths across both views. */
export function countMarks(painMap) {
  let n = 0;
  for (const view of VIEWS) {
    n += (painMap?.[view]?.marks || []).length + (painMap?.[view]?.paths || []).length;
  }
  return n;
}

export const EMPTY_PAIN_MAP = Object.fromEntries(
  VIEWS.map((v) => [v, { marks: [], paths: [] }])
);
