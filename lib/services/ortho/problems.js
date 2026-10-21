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
  // The neck and back get no mechanical-symptom question: those are joint questions.
  { id: 'spine', label: 'Neck or back symptoms', regions: ['neck-back'], mechanical: false },
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

/**
 * What a problem's card starts with when the chief complaint carries the
 * injury chip or the visit has a work or accident claim: the patient's idea
 * of the problem is pre-answered as an injury (which opens the injury
 * questions), and a claim also pre-answers "how did it start" as an accident.
 * The patient can change either.
 */
export function injuryDefaults({ claim = false } = {}) {
  return { kind: PROBLEM_KIND_OPTIONS[0], ...(claim ? { onsetType: 'After an accident (car, work)' } : {}) };
}

/** The symptom-details wording that names the specialty (translated in the step's own dictionary). */
export const SYMPTOM_DETAILS_TEXT = {
  intro: 'A few quick questions about each joint. Which side it is and where it travels comes from the body map you drew, so we will not ask that again.',
  quick: 'Tap through a few multiple-choice questions for each joint that hurts.',
  empty: 'No joints were selected yet. Please go back and choose where you have symptoms.',
  progression: 'Over time, has this been...',
};

/**
 * The safety check, asked once on the symptom-details step. Each entry is a
 * yes/no question (or a short choice when `options` is given) stored under
 * `hpiData.overall.<field>`; `when` receives { problems: Set of the problem
 * ids on the page, anyInjury } and hides the question when it returns false.
 * The infection, wound, circulation and compartment screens matter most after
 * an injury; the clot screen for any leg problem; the joint-specific screens
 * appear with that joint; numbness, tingling and weakness always.
 */
const has = (...ids) => ({ problems }) => ids.some((id) => problems.has(id));
const injury = ({ anyInjury }) => !!anyInjury;
const leg = has('hip', 'knee', 'foot');
const kneeInjury = (ctx) => has('knee')(ctx) && injury(ctx);
export const SAFETY_QUESTIONS = [
  { field: 'numbness', label: 'Numbness anywhere?' },
  { field: 'tingling', label: 'Tingling or pins-and-needles?' },
  { field: 'weakness', label: 'Weakness in an arm or leg?' },
  { field: 'hotJoint', label: 'Is the joint hot, red and swollen, or do you have a fever with it?' },
  { field: 'openWound', label: 'Any open wound or broken skin over the injured area?', when: injury },
  { field: 'coldPaleLimb', label: 'Is the hand or foot beyond the injury cold, pale or numb?', when: injury },
  { field: 'compartmentSymptoms', label: 'Severe pain getting rapidly worse, with tight swelling?', sublabel: 'Especially inside a cast or splint', when: injury },
  { field: 'dvtSymptoms', label: 'Calf swelling or pain, or sudden shortness of breath?', when: (ctx) => leg(ctx) || injury(ctx) },
  { field: 'handDominance', label: 'Which hand do you write with?', options: ['Right-handed', 'Left-handed'], when: has('hand', 'elbow', 'shoulder') },
  { field: 'nightHandNumbness', label: 'Do numb fingers wake you at night or make you shake your hand out?', when: has('hand') },
  { field: 'triggerFinger', label: 'Does a finger catch or lock when you bend it?', when: has('hand') },
  { field: 'shoulderNightPain', label: 'Pain lying on that shoulder at night?', when: has('shoulder') },
  { field: 'overheadWeakness', label: 'Trouble lifting the arm overhead?', when: has('shoulder') },
  { field: 'dislocation', label: 'Has the shoulder ever popped out (dislocated)?', when: has('shoulder') },
  { field: 'groinPain', label: 'Pain in the groin, or trouble putting on socks and shoes?', when: has('hip') },
  { field: 'popAtInjury', label: 'Did you hear or feel a pop when it was injured?', when: kneeInjury },
  { field: 'earlySwelling', label: 'Did it swell within a few hours of the injury?', when: kneeInjury },
  { field: 'recurrentSprains', label: 'Repeated ankle sprains or rolling over on uneven ground?', when: has('foot') },
  { field: 'bowelBladder', label: 'Any new trouble controlling your bladder or bowels?', when: has('spine') },
];
