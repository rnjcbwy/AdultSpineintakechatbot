// ============================================================================
// Problems, not areas.
//
// An orthopaedic complaint is about a joint or a limb segment: a shoulder, a
// knee, a hand. The patient taps the sides that hurt on the Chief Complaint
// step; this folds those taps into the joints they belong to, so Symptom
// Details asks about each JOINT once instead of asking the same questions
// for "right knee", "swelling" and "giving way" separately. Which side, and
// where the pain travels, come from the body map the patient drew, so they
// are not asked again.
// ============================================================================

export const PROBLEM_GROUPS = [
  { id: 'shoulder', label: 'Shoulder symptoms', regions: ['right-shoulder', 'left-shoulder'] },
  { id: 'elbow', label: 'Elbow symptoms', regions: ['right-elbow', 'left-elbow'] },
  { id: 'hand', label: 'Hand, wrist or finger symptoms', regions: ['right-hand', 'left-hand'] },
  { id: 'hip', label: 'Hip symptoms', regions: ['right-hip', 'left-hip'] },
  { id: 'knee', label: 'Knee symptoms', regions: ['right-knee', 'left-knee'] },
  { id: 'foot', label: 'Ankle or foot symptoms', regions: ['right-foot', 'left-foot'] },
  { id: 'spine', label: 'Neck or back symptoms', regions: ['neck-back'] },
];

/** Areas that describe a quality or context rather than a place; they ride along with whatever problem exists. */
const RIDE_ALONG = new Set(['numbness-tingling', 'weakness', 'swelling', 'instability', 'deformity', 'prior-surgery-pain', 'trauma']);

/**
 * The problems the chosen areas add up to, in body order. A draft that only
 * holds ride-along areas (an older form, or an unusual choice) gets one
 * general problem so the questions still have somewhere to go.
 */
export function problemsFor(regions = []) {
  const chosen = new Set(regions);
  const out = PROBLEM_GROUPS.filter((g) => g.regions.some((r) => chosen.has(r))).map((g) => ({
    ...g,
    regions: g.regions.filter((r) => chosen.has(r)),
  }));
  if (!out.length && regions.some((r) => RIDE_ALONG.has(r) || r)) {
    out.push({ id: 'general', label: 'Your symptoms', regions: [...regions] });
  }
  return out;
}

export const PROBLEM_LABEL = Object.fromEntries([...PROBLEM_GROUPS, { id: 'general', label: 'Your symptoms' }].map((g) => [g.id, g.label]));

/** The side(s) a problem's chosen regions name, for the note and the review. */
export function sidesFor(problem) {
  const sides = new Set((problem?.regions || []).map((r) => (/^right-/.test(r) ? 'right' : /^left-/.test(r) ? 'left' : null)).filter(Boolean));
  if (sides.size === 2) return 'both sides';
  return [...sides][0] || '';
}

export const ONSET_OPTIONS = ['Less than 1 week', '1-4 weeks', '1-3 months', '3-6 months', '6-12 months', 'More than 1 year', 'More than 2 years', 'More than 5 years', "I'm not sure"];
export const ONSET_TYPE_OPTIONS = ['Gradually, for no clear reason', 'Suddenly', 'After a fall', 'During sport or exercise', 'After a twist, slip or awkward step', 'After an accident (car, work)', 'After repetitive use or overuse'];
export const PROGRESSION_OPTIONS = ['Getting better', 'About the same', 'Getting worse', 'Comes and goes'];

/** What the patient believes the problem is. Routing and emphasis only, never a diagnosis. */
export const PROBLEM_KIND_OPTIONS = [
  'An injury (fall, twist, sport, accident)',
  'A broken bone',
  'Wear and tear or arthritis',
  'A long-standing problem that has worsened',
  "I'm not sure",
];

/** Mechanical symptoms that steer the examination and the questionnaires. */
export const MECHANICAL_OPTIONS = [
  'Swelling',
  'Stiffness, worst in the morning or after sitting',
  'Locking or catching',
  'Giving way or feeling unstable',
  'Clicking, popping or grinding',
  'Loss of motion',
  'A visible bump or change in shape',
  'Pain at night',
  'None of these',
];

export const WEIGHT_BEARING_OPTIONS = ['Yes, normally', 'Yes, but it hurts', 'Only with a limp or support', 'No'];
export const IMMOBILIZATION_OPTIONS = ['None', 'Cast', 'Splint or brace', 'Walking boot', 'Sling', 'Crutches or a walker'];

export const isInjuryKind = (kind) => /injury|broken bone/i.test(kind || '');
