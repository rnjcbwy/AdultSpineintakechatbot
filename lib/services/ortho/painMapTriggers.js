// ============================================================================
// What the drawing should SET OFF.
//
// The value of a body map is not the picture — it is that one drawing can
// answer, branch, or escalate a dozen downstream questions. Every rule here
// reads only resolved zone names, so it works regardless of how the figure is
// drawn and stays testable without a browser.
//
// Nothing here is a diagnosis. Suspected patterns are surfaced to the SURGEON
// as "pattern consistent with", never shown to the patient as a finding.
// ============================================================================

import { getType, allTypes, VIEWS } from '../../bodyMap';

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

/** Same-side test: a proximal part and any of the distal parts, on one side. */
function stripe(zones, distalParts, proximalPart) {
  for (const side of ['left', 'right']) {
    const mine = zones.filter((z) => z.startsWith(side));
    const proximal = mine.some((z) => z.includes(proximalPart));
    const distal = mine.some((z) => distalParts.some((d) => z.includes(d)));
    if (proximal && distal) return side;
  }
  return null;
}

/** The joints a set of zone names touches, by side. */
const JOINT_OF = [
  ['shoulder', /shoulder|upper arm|shoulder blade/],
  ['elbow', /elbow/],
  ['hand', /forearm|hand|thumb|finger/],
  ['hip', /hip|groin|buttock/],
  ['knee', /thigh|knee/],
  ['foot', /shin|calf|ankle|foot|heel|toe/],
];
function jointsTouched(zones) {
  const out = new Set();
  for (const z of zones) {
    const side = sideOf(z);
    for (const [joint, re] of JOINT_OF) if (re.test(z)) out.add(side ? `${side}-${joint}` : joint);
  }
  return out;
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

  // ---- Branch: the joints the drawing names ------------------------------
  // The chief-complaint chips and the drawing should agree; where the
  // drawing adds a joint the patient did not tap, the form adds it.
  const joints = jointsTouched(zones);
  if (joints.size) {
    fired.push({
      id: 'joints_marked',
      severity: 'branch',
      title: `Joints marked: ${[...joints].join(', ')}`,
      because: 'Marks resolved to limb zones.',
      action: 'Add any joint the patient did not tap on the chief-complaint step, so Symptom Details asks about it.',
      sets: { 'chiefComplaint.addRegions': [...joints].filter((j) => j.includes('-')) },
    });
  }

  // ---- Branch: spine marked — this is the orthopaedic intake ---------------
  const spine = has(zones, 'cervical') || has(zones, 'thoracic spine') || has(zones, 'lumbar') || has(zones, 'sacrum');
  if (spine) {
    fired.push({
      id: 'spine_marked',
      severity: 'branch',
      title: 'Neck or back marked — point at the spine intake',
      because: 'A mark was placed over the spine.',
      action: 'Show the spine-intake pointer; keep the answers if the main problem is a joint.',
      sets: { 'chiefComplaint.addRegions': ['neck-back'] },
    });
  }

  // ---- Urgent: saddle area is a spine emergency wherever it is reported ---
  if (has(zones, 'perineum') || has(zones, 'saddle')) {
    fired.push({
      id: 'cauda_equina',
      severity: 'urgent',
      title: 'Saddle area marked — screen for cauda equina now',
      because: 'A mark was placed in the perineal / saddle zone.',
      action: 'Ask about bowel or bladder control and saddle numbness, raise a red flag, and direct to the spine intake or urgent care.',
    });
  }

  // ---- Pattern: median nerve (carpal tunnel) vs cervical root --------------
  const thumbSide = zones.filter((z) => /thumb/.test(z)).map(sideOf).filter(Boolean);
  const sensoryHand = touched.some((t) => (t.type === 'numbness' || t.type === 'tingling') && /thumb|finger|hand/.test(t.zone));
  if (sensoryHand && thumbSide.length) {
    const forearmToo = stripe(zones, ['thumb'], 'lateral forearm');
    fired.push({
      id: forearmToo ? 'pattern_c6' : 'pattern_median',
      severity: 'pattern',
      title: forearmToo
        ? `Numbness thumb/index with lateral forearm (${forearmToo}) — C6 root vs median nerve`
        : `Numbness in the thumb / index / middle fingers (${[...new Set(thumbSide)].join(', ')}) — median nerve pattern`,
      because: forearmToo ? 'Sensory marks run from the lateral forearm to the thumb.' : 'Sensory marker on the radial digits without forearm involvement.',
      action: forearmToo
        ? 'Surface to the surgeon only. Ask about neck pain and whether neck movement provokes it.'
        : 'Surface to the surgeon only. Ask about night waking, shaking the hand out, and dropping small objects (carpal tunnel screen).',
    });
  }
  const ulnar = zones.filter((z) => /ring \/ little finger/.test(z)).map(sideOf).filter(Boolean);
  if (ulnar.length && touched.some((t) => (t.type === 'numbness' || t.type === 'tingling') && /ring \/ little finger/.test(t.zone))) {
    const medialForearm = stripe(zones, ['little finger', 'ring'], 'medial forearm');
    fired.push({
      id: medialForearm ? 'pattern_c8' : 'pattern_ulnar',
      severity: 'pattern',
      title: medialForearm
        ? `Numbness ring/little with medial forearm (${medialForearm}) — C8 root vs ulnar nerve`
        : `Numbness in the ring / little fingers (${[...new Set(ulnar)].join(', ')}) — ulnar nerve (cubital tunnel) pattern`,
      because: medialForearm ? 'Sensory marks run from the medial forearm to the ulnar digits.' : 'Sensory marker on the ulnar digits.',
      action: 'Surface to the surgeon only. Ask about elbow position (bent elbow, leaning on it) and hand weakness.',
    });
  }

  // ---- Pattern: lateral hip vs referred lumbar ----------------------------
  const lateralHip = zones.filter((z) => /hip \/ buttock|lateral thigh/.test(z));
  if (lateralHip.length && !spine) {
    fired.push({
      id: 'pattern_lateral_hip',
      severity: 'pattern',
      title: 'Lateral hip / thigh pain without back marks — trochanteric vs referred',
      because: `Marked at: ${[...new Set(lateralHip)].slice(0, 3).join(', ')}.`,
      action: 'Surface to the surgeon only. Ask about pain lying on that side and pain with the first steps after sitting.',
    });
  }
  const groin = zones.filter((z) => /groin/.test(z) && !/perineum/.test(z));
  if (groin.length) {
    fired.push({
      id: 'pattern_groin_hip',
      severity: 'pattern',
      title: 'Groin pain marked — intra-articular hip pattern',
      because: 'A mark was placed over the groin.',
      action: 'Surface to the surgeon only. Ask about putting on socks and shoes and getting in and out of a car.',
    });
  }

  // ---- Pattern: radiating leg pain is a spine pattern, not a joint one -----
  const belowKnee = zones.filter((z) => /shin|calf|foot|toe|heel|ankle/.test(z));
  const radiatesLeg = (painMap && VIEWS.some((v) => (painMap[v]?.paths || []).some((p) => /buttock|lumbar|hip/.test(p.fromZone || '') && /thigh|knee|shin|calf|foot/.test(p.toZone || ''))));
  if (radiatesLeg) {
    fired.push({
      id: 'pattern_radicular_leg',
      severity: 'pattern',
      title: 'Pain traced from the back or buttock down the leg — radicular pattern',
      because: 'A radiation path runs from the low back / buttock into the leg.',
      action: 'Surface to the surgeon only; consider the spine intake. Ask whether it travels past the knee.',
      sets: { 'hpiData.overall.painBelowKnee': belowKnee.length > 0 || undefined },
    });
  }

  // ---- Branch: both knees or both hips — arthritis set ---------------------
  for (const [joint, re] of [['knees', /knee/], ['hips', /hip \/ buttock|groin/]]) {
    const sides = new Set(zones.filter((z) => re.test(z)).map(sideOf).filter(Boolean));
    if (sides.size === 2) {
      fired.push({
        id: `bilateral_${joint}`,
        severity: 'branch',
        title: `Both ${joint} involved — ask the arthritis set`,
        because: `Marks on the left and right ${joint}.`,
        action: 'Ask about morning stiffness, stairs, rising from a chair, walking distance, and which side is worse.',
      });
    }
  }

  // ---- Branch: calf marked — clot screen -----------------------------------
  const calf = zones.filter((z) => /calf/.test(z));
  if (calf.length && touched.some((t) => /calf/.test(t.zone) && t.type !== 'numbness' && t.type !== 'tingling')) {
    fired.push({
      id: 'calf_marked',
      severity: 'branch',
      title: 'Calf pain marked — ask the clot screen',
      because: `Marked at: ${[...new Set(calf)].slice(0, 2).join(', ')}.`,
      action: 'Ask about calf swelling, a recent cast, long travel or surgery, and shortness of breath.',
    });
  }

  // ---- Branch: no limb marked -------------------------------------------
  const anyLimb = zones.some((z) => /thigh|shin|calf|knee|foot|toe|ankle|arm|forearm|finger|thumb|hand|shoulder|elbow|hip/.test(z));
  if (!anyLimb) {
    fired.push({
      id: 'no_limb',
      severity: 'branch',
      title: 'No limb or joint marked',
      because: 'Marks only on the trunk, head or spine.',
      action: 'Ask the patient to confirm which joint the visit is about, or route to the spine intake.',
    });
  }

  // ---- Autofill from marker types --------------------------------------
  if (types.has('numbness') || types.has('tingling')) {
    fired.push({
      id: 'autofill_sensory',
      severity: 'autofill',
      title: 'Sensory symptoms recorded',
      because: `Used the ${[...types].filter((t) => t === 'numbness' || t === 'tingling').map((t) => getType(t, allTypes(painMap)).label.toLowerCase()).join(' and ')} marker.`,
      action: 'Pre-answer the numbness / tingling questions instead of asking again.',
      sets: {
        'hpiData.overall.numbness': types.has('numbness') || undefined,
        'hpiData.overall.tingling': types.has('tingling') || undefined,
      },
    });
  }
  if (types.has('weakness')) {
    const where = [...new Set(touched.filter((t) => t.type === 'weakness').map((t) => t.zone))].slice(0, 3).join(', ');
    fired.push({
      id: 'autofill_weakness',
      severity: 'autofill',
      title: 'Weakness recorded',
      because: `Weakness marker placed at: ${where}.`,
      action: 'Pre-answer the weakness question; ask what the patient cannot do (lift the arm, grip, push off, lift the foot).',
      sets: { 'hpiData.overall.weakness': true },
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
