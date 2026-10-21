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

/**
 * The side(s) a problem's chosen regions name. A spine problem is not sided
 * here (side comes from the body map), so this is always empty; the ortho
 * service names the side of a joint.
 */
export function sidesFor() {
  return '';
}

export const ONSET_OPTIONS = ['Less than 1 week', '1-4 weeks', '1-3 months', '3-6 months', '6-12 months', 'More than 1 year', 'More than 2 years', 'More than 5 years', "I'm not sure"];
export const ONSET_TYPE_OPTIONS = ['Gradually, for no clear reason', 'Suddenly', 'After an injury or accident', 'After lifting or straining'];
export const PROGRESSION_OPTIONS = ['Getting better', 'About the same', 'Getting worse', 'Comes and goes'];

// The joint questions the ortho service asks per problem (what the patient
// thinks it is, mechanical symptoms, the injury block). The spine asks none
// of them, so these are empty and the step leaves them out.
export const PROBLEM_KIND_OPTIONS = [];
export const MECHANICAL_OPTIONS = [];
export const WEIGHT_BEARING_OPTIONS = [];
export const IMMOBILIZATION_OPTIONS = [];
export const isInjuryKind = () => false;

/** The symptom-details wording that names the specialty (translated in the step's own dictionary). */
export const SYMPTOM_DETAILS_TEXT = {
  intro: 'A few quick questions about each problem. Where it hurts and where it travels comes from the body map you drew, so we will not ask that again.',
  quick: 'Tap through a few multiple-choice questions for each area that hurts.',
  empty: 'No symptom areas were selected yet. Please go back and choose where you have symptoms.',
  progression: 'Over time, has this symptom been...',
};

/**
 * The safety check, asked once on the symptom-details step. Each entry is a
 * yes/no question (or a short choice when `options` is given) stored under
 * `hpiData.overall.<field>`; `when` receives { problems: Set of the problem
 * ids on the page, anyInjury } and hides the question when it returns false.
 * The cervical myelopathy screens appear with a neck problem, the cauda equina
 * and foot-drop screens with a back problem; numbness, tingling and weakness
 * always.
 */
const lumbar = ({ problems }) => problems.has('lumbar') || problems.has('general');
const cervical = ({ problems }) => problems.has('cervical');
export const SAFETY_QUESTIONS = [
  { field: 'numbness', label: 'Numbness anywhere?' },
  { field: 'tingling', label: 'Tingling or pins-and-needles?' },
  { field: 'weakness', label: 'Weakness in an arm or leg?' },
  { field: 'bowelBladder', label: 'Any new trouble controlling your bladder or bowels?' },
  { field: 'saddleAnesthesia', label: 'Numbness in the groin or inner thighs?', when: lumbar },
  { field: 'footDrop', label: 'Foot slapping or catching on stairs?', sublabel: 'Foot drop or leg weakness', when: lumbar },
  { field: 'handDexterity', label: 'Trouble with buttons, writing or small objects?', when: cervical },
  { field: 'droppingObjects', label: 'Dropping things more than usual?', when: cervical },
  { field: 'gaitChanges', label: 'Unsteady on your feet?', when: cervical },
  { field: 'lhermittes', label: 'Electric shock down your spine when you bend your neck?', when: cervical },
];
