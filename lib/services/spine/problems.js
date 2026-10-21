// ============================================================================
// Problems, not areas.
//
// A spine complaint comes in a few shapes: a neck-and-arm problem, a
// back-and-leg problem, a mid-back problem, a curvature. The patient taps the
// areas that hurt on the Chief Complaint step; this folds those areas into
// the problems they belong to, so Symptom Details asks about each PROBLEM
// once instead of asking the same questions for "low back", "right leg" and
// "numbness" separately. Side and radiation come from the body map the
// patient drew, so they are not asked again.
// ============================================================================

export const PROBLEM_GROUPS = [
  { id: 'cervical', label: 'Neck and arm symptoms', regions: ['neck', 'right-arm', 'left-arm', 'hand-clumsiness', 'balance'] },
  { id: 'thoracic', label: 'Mid-back symptoms', regions: ['upper-back'] },
  { id: 'lumbar', label: 'Low back and leg symptoms', regions: ['low-back', 'right-leg', 'left-leg', 'walking-difficulty'] },
  { id: 'deformity', label: 'Posture or curvature', regions: ['posture-deformity'] },
];

/** Areas that describe a quality or context rather than a place; they ride along with whatever problem exists. */
const RIDE_ALONG = new Set(['numbness-tingling', 'weakness', 'prior-surgery-pain', 'trauma']);

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

export const ONSET_OPTIONS = ['Less than 1 week', '1-4 weeks', '1-3 months', '3-6 months', '6-12 months', 'More than 1 year', 'More than 2 years', 'More than 5 years', "I'm not sure"];
export const ONSET_TYPE_OPTIONS = ['Gradually, for no clear reason', 'Suddenly', 'After an injury or accident', 'After lifting or straining'];
export const PROGRESSION_OPTIONS = ['Getting better', 'About the same', 'Getting worse', 'Comes and goes'];
