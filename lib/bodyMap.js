// ============================================================================
// Body pain map — symptom marker types and anatomical zones.
//
// Marks are stored in normalized coordinates (0..1 of the SVG viewBox) so the
// figure can be rendered at any size. Each mark is resolved to a named
// anatomical zone at capture time, which is what makes the drawing usable
// clinically: the generated note can read "burning over the right lumbar
// region radiating to the right posterior thigh", not a list of pixels.
// ============================================================================

// Larger canvas than a simple silhouette needs, deliberately: patients often
// draw a true dermatomal stripe (lateral calf -> dorsum of foot -> great toe
// for L5), which requires limbs wide enough to distinguish medial from lateral
// and hands/feet with individual digits.
export const VIEW_BOX = { width: 260, height: 560 };

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

/**
 * Anatomical zones per view, in viewBox units: [xMin, yMin, xMax, yMax].
 * `side: true` marks a paired zone that should be qualified left/right.
 */
const ZONES = {
  anterior: [
    { name: 'head', box: [84, 8, 176, 76] },
    { name: 'neck', box: [110, 68, 150, 104] },
    { name: 'chest', box: [88, 98, 172, 208] },
    { name: 'abdomen', box: [92, 208, 168, 264] },
    { name: 'groin', box: [100, 264, 160, 322] },
    { name: 'groin / perineum', box: [112, 286, 148, 324] },
    ...limbZones(),
    ...legZones('thigh', 'knee', 'shin', 'foot'),
  ],
  posterior: [
    { name: 'back of head', box: [84, 8, 176, 76] },
    { name: 'cervical spine', box: [110, 68, 150, 112] },
    { name: 'shoulder blade', box: [88, 112, 172, 176], side: true },
    { name: 'thoracic spine', box: [116, 112, 144, 212] },
    { name: 'lumbar spine', box: [112, 212, 148, 268] },
    { name: 'flank', box: [88, 176, 172, 268], side: true },
    { name: 'sacrum / tailbone', box: [114, 268, 146, 300] },
    { name: 'perineum / saddle area', box: [114, 300, 146, 330] },
    { name: 'buttock', box: [88, 268, 172, 322], side: true },
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
  return [
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
}

/**
 * Upper-limb zones, split left/right so they never swallow the torso, and
 * subdivided medial/lateral where dermatomes actually differ. C6 runs down the
 * LATERAL forearm to the thumb while C8 runs down the MEDIAL forearm to the
 * little finger, so a single "forearm" label would lose the distinction.
 */
function limbZones() {
  // The arms are abducted 15° about the shoulder, so these boxes track where
  // each segment actually ends up rather than sitting in a vertical column.
  // Thumb sits laterally (anatomical position), which is why the thumb/index
  // zone is on the OUTER half of each hand.
  const out = [];
  const bands = [
    // name,        L-outer, L-split, L-inner, R-inner, R-split, R-outer, y0,  y1
    ['upper arm', 40, 76, 106, 154, 184, 220, 104, 216],
    ['elbow', 28, 60, 90, 170, 200, 232, 208, 234],
    ['forearm', 18, 49, 80, 180, 211, 242, 230, 308],
  ];
  for (const [name, lo, lm, li, ri, rm, ro, y0, y1] of bands) {
    out.push({ name: `lateral ${name}`, box: [lo, y0, lm, y1], side: true });
    out.push({ name: `medial ${name}`, box: [lm, y0, li, y1], side: true });
    out.push({ name: `medial ${name}`, box: [ri, y0, rm, y1], side: true });
    out.push({ name: `lateral ${name}`, box: [rm, y0, ro, y1], side: true });
  }

  // Hand digits — the dermatome giveaway in the upper limb
  // (C6 thumb, C7 middle, C8 little finger).
  out.push({ name: 'thumb / index finger', box: [0, 300, 31, 385], side: true });
  out.push({ name: 'ring / little finger', box: [31, 300, 60, 385], side: true });
  out.push({ name: 'ring / little finger', box: [200, 300, 229, 385], side: true });
  out.push({ name: 'thumb / index finger', box: [229, 300, 260, 385], side: true });

  out.push({ name: 'shoulder', box: [62, 90, 112, 124], side: true });
  out.push({ name: 'shoulder', box: [148, 90, 198, 124], side: true });
  return out;
}

/**
 * Lower-limb zones. Split medial/lateral for the same reason: L4 covers the
 * medial leg and medial foot, L5 the lateral leg and dorsum/great toe, and S1
 * the lateral foot and little toe.
 */
function legZones(thigh, knee, leg, foot) {
  const out = [];
  const bands = [
    [thigh, 312, 412],
    [knee, 404, 444],
    [leg, 438, 528],
  ];
  for (const [name, y0, y1] of bands) {
    // viewer-left leg spans x 84..130; its LATERAL side is the outer (low x)
    out.push({ name: `lateral ${name}`, box: [74, y0, 106, y1], side: true });
    out.push({ name: `medial ${name}`, box: [106, y0, 130, y1], side: true });
    out.push({ name: `medial ${name}`, box: [130, y0, 154, y1], side: true });
    out.push({ name: `lateral ${name}`, box: [154, y0, 186, y1], side: true });
  }
  // Toes carry the L5 / S1 distinction.
  out.push({ name: `great toe / inner ${foot}`, box: [106, 518, 130, 560], side: true });
  out.push({ name: `outer ${foot} / little toe`, box: [74, 518, 106, 560], side: true });
  out.push({ name: `great toe / inner ${foot}`, box: [130, 518, 154, 560], side: true });
  out.push({ name: `outer ${foot} / little toe`, box: [154, 518, 186, 560], side: true });
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
  const viewerLeft = xNorm < 0.5;
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
  const side = bodySide(xNorm, view);
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
