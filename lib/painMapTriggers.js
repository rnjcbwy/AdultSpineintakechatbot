// ============================================================================
// What the drawing should SET OFF.
//
// The value of a body map is not the picture — it is that one drawing can
// answer, branch, or escalate a dozen downstream questions. Every rule here
// reads only resolved zone names, so it works regardless of how the figure is
// drawn and stays testable without a browser.
//
// Nothing here is a diagnosis. Suspected levels are surfaced to the SURGEON as
// "pattern consistent with", never shown to the patient as a finding.
// ============================================================================

import { getType, VIEWS } from './bodyMap';

const has = (zones, ...needles) =>
  zones.some((z) => needles.every((n) => z.includes(n)));

const sideOf = (zone) => (zone.startsWith('left') ? 'left' : zone.startsWith('right') ? 'right' : null);

/** Every zone the patient touched, with the marker type that touched it. */
function collect(painMap) {
  const out = [];
  // Must walk every view: a stripe is routinely drawn across the lateral
  // figures, and missing those would silently disable the pattern rules.
  for (const view of VIEWS) {
    const d = painMap?.[view] || {};
    for (const m of d.marks || []) out.push({ zone: m.zone || '', type: m.type, view });
    for (const p of d.paths || []) {
      if (p.fromZone) out.push({ zone: p.fromZone, type: p.type, view });
      if (p.toZone) out.push({ zone: p.toZone, type: p.type, view });
    }
  }
  return out;
}

/** Same-side dermatomal stripe test. */
function stripe(zones, distalParts, proximalPart) {
  for (const side of ['left', 'right']) {
    const mine = zones.filter((z) => z.startsWith(side));
    const proximal = mine.some((z) => z.includes(proximalPart));
    const distal = mine.some((z) => distalParts.some((d) => z.includes(d)));
    if (proximal && distal) return side;
  }
  return null;
}

/**
 * @returns {Array<{id,severity,title,because,action,sets?}>}
 *   severity: 'urgent' | 'branch' | 'pattern' | 'autofill'
 */
export function evaluatePainMap(painMap) {
  const touched = collect(painMap);
  const zones = touched.map((t) => t.zone);
  const types = new Set(touched.map((t) => t.type));
  const fired = [];

  if (!touched.length) return fired;

  // ---- Red flag: cauda equina ------------------------------------------
  if (has(zones, 'perineum') || has(zones, 'saddle')) {
    fired.push({
      id: 'cauda_equina',
      severity: 'urgent',
      title: 'Saddle area marked — screen for cauda equina now',
      because: 'A mark was placed in the perineal / saddle zone.',
      action: 'Immediately ask about bowel or bladder control and saddle numbness, and raise a red flag on the summary.',
    });
  }

  // ---- Branch: pain below the knee -------------------------------------
  const belowKnee = zones.filter((z) => /shin|calf|foot|toe|heel/.test(z));
  if (belowKnee.length) {
    fired.push({
      id: 'below_knee',
      severity: 'branch',
      title: 'Pain below the knee',
      because: `Marked at: ${[...new Set(belowKnee)].slice(0, 3).join(', ')}.`,
      action: 'Open the radicular questions and set painBelowKnee — an explicit Aetna and eviCore fusion criterion.',
      sets: { 'hpiData.overall.painBelowKnee': true },
    });
  }

  // ---- Pattern: lumbosacral dermatomes ---------------------------------
  // Distal terms differ between the front/back figures ("great toe / inner
  // foot") and the lateral ones ("dorsum of the foot / toes"), so both
  // vocabularies are accepted — otherwise a stripe drawn across views would
  // never complete.
  const L5_DISTAL = ['great toe', 'inner foot', 'dorsum'];
  const l5 = stripe(zones, L5_DISTAL, 'lateral shin') ||
             stripe(zones, L5_DISTAL, 'lateral calf');
  if (l5) {
    fired.push({
      id: 'pattern_l5', severity: 'pattern',
      title: `Pattern consistent with L5 (${l5})`,
      because: 'Lateral leg plus dorsum / great toe on the same side.',
      action: 'Surface to the surgeon only. Prompt: "does it travel past the knee?"',
    });
  }
  const s1 = stripe(zones, ['little toe', 'outer foot', 'heel', 'lateral border of the foot'], 'calf');
  if (s1) {
    fired.push({
      id: 'pattern_s1', severity: 'pattern',
      title: `Pattern consistent with S1 (${s1})`,
      because: 'Posterior calf plus lateral foot / little toe on the same side.',
      action: 'Surface to the surgeon only. Consider ankle reflex and plantarflexion on exam.',
    });
  }
  const l4 = stripe(zones, ['medial shin'], 'knee');
  if (l4) {
    fired.push({
      id: 'pattern_l4', severity: 'pattern',
      title: `Pattern consistent with L4 (${l4})`,
      because: 'Medial leg distribution.',
      action: 'Surface to the surgeon only.',
    });
  }

  // ---- Pattern: cervical dermatomes ------------------------------------
  const c6 = stripe(zones, ['thumb'], 'lateral forearm');
  if (c6) fired.push({
    id: 'pattern_c6', severity: 'pattern',
    title: `Pattern consistent with C6 (${c6})`,
    because: 'Lateral forearm plus thumb / index finger.',
    action: 'Surface to the surgeon only.',
  });
  const c8 = stripe(zones, ['little finger', 'ring'], 'medial forearm');
  if (c8) fired.push({
    id: 'pattern_c8', severity: 'pattern',
    title: `Pattern consistent with C8 (${c8})`,
    because: 'Medial forearm plus ring / little finger.',
    action: 'Surface to the surgeon only.',
  });

  // ---- Branch: myelopathy screen ---------------------------------------
  const cervical = has(zones, 'cervical') || has(zones, 'neck');
  const hand = zones.some((z) => /finger|thumb/.test(z));
  if (cervical && hand) {
    fired.push({
      id: 'myelopathy', severity: 'branch',
      title: 'Neck plus hand symptoms — run the myelopathy screen',
      because: 'Marks in both the cervical region and the hand.',
      action: 'Ask about buttons and handwriting, dropping objects, balance, and Lhermitte sign.',
    });
  }

  // ---- Branch: neurogenic claudication ---------------------------------
  const legSides = new Set(zones.filter((z) => /thigh|shin|calf|knee/.test(z)).map(sideOf).filter(Boolean));
  if (legSides.size === 2) {
    fired.push({
      id: 'bilateral_legs', severity: 'branch',
      title: 'Both legs involved — ask the claudication set',
      because: 'Marks on the left and right lower limb.',
      action: 'Ask walking distance, whether sitting or leaning forward relieves it, and shopping-cart sign.',
    });
  }

  // ---- Branch: axial only ----------------------------------------------
  const anyLimb = zones.some((z) => /thigh|shin|calf|knee|foot|toe|arm|forearm|finger|thumb|hand/.test(z));
  if (!anyLimb) {
    fired.push({
      id: 'axial_only', severity: 'branch',
      title: 'Axial pain only — skip the radicular branch',
      because: 'No marks on any limb.',
      action: 'Shorten the form: hide radiation and dermatome questions entirely.',
    });
  }

  // ---- Autofill from marker types --------------------------------------
  if (types.has('numbness') || types.has('tingling')) {
    fired.push({
      id: 'autofill_sensory', severity: 'autofill',
      title: 'Sensory symptoms recorded',
      because: `Used the ${[...types].filter((t) => t === 'numbness' || t === 'tingling').map((t) => getType(t).label.toLowerCase()).join(' and ')} marker.`,
      action: 'Pre-answer the numbness / tingling questions instead of asking again.',
      sets: {
        'hpiData.overall.numbness': types.has('numbness') || undefined,
        'hpiData.overall.tingling': types.has('tingling') || undefined,
      },
    });
  }
  const weakFoot = touched.some((t) => t.type === 'weakness' && /foot|toe|shin|calf/.test(t.zone));
  if (weakFoot) {
    fired.push({
      id: 'foot_drop', severity: 'branch',
      title: 'Weakness marked in the foot — ask about foot drop',
      because: 'Weakness marker placed distally.',
      action: 'Ask about tripping, catching the toe, and stair difficulty.',
    });
  }

  return fired;
}

export const SEVERITY_STYLE = {
  urgent: { label: 'Red flag', cls: 'bg-red-50 border-red-300 text-red-800' },
  branch: { label: 'Branches the form', cls: 'bg-amber-50 border-amber-300 text-amber-800' },
  pattern: { label: 'Surgeon-only hint', cls: 'bg-violet-50 border-violet-300 text-violet-800' },
  autofill: { label: 'Auto-fills answers', cls: 'bg-teal-50 border-teal-300 text-teal-800' },
};
