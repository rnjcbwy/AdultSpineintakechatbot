// ============================================================================
// The quick questionnaire: the adult intake for patients who find the
// comprehensive one too much (older patients, people who are not at home on
// a computer). The spine site and the orthopaedic site both offer it; the
// welcome asks for the comprehensive one and offers this as the quick one.
//
// It is the default on both adult sites. Six screens, big buttons, no body
// map, no questionnaires, the treatments question optional:
//
//   about you -> what is bothering you -> a few questions -> your health -> anything else -> sign
//   (seen here before: the same without "your health")
//
// It writes the same fields as the comprehensive form (chief complaint, the
// problem answers, the safety screen, medications, allergies, conditions,
// prior operations, the screening review of systems), so the office note,
// the PDF, Practice Hub and the handouts work exactly as they do for the
// comprehensive form. What differs by service is the list of places (spine
// areas, or joints and a side), the safety questions and the treatments.
// ============================================================================

import { LOCKED_SERVICE } from './siteLock';
import { getService } from './service';

export const SIMPLE_MODE = 'simple';
export const FULL_MODE = 'full';

/** The adult sites that open on the quick questionnaire. */
export const simpleByDefault = () => LOCKED_SERVICE === 'adult_spine' || LOCKED_SERVICE === 'adult_ortho';

/** The service the quick questionnaire belongs to on this site (the spine one when unlocked). */
export function simpleService() {
  const key = simpleByDefault() ? LOCKED_SERVICE : 'adult_spine';
  const s = getService(key);
  return { patient: s.patient, specialty: s.specialty, key: s.key, how: 'site' };
}

/** The answers the quick questionnaire starts with (also after "Start a new form"). */
export function simpleStart() {
  return {
    mode: SIMPLE_MODE,
    service: simpleService(),
    triage: { who: 'Myself', firstTime: '', regions: [], description: '', suggestion: null },
  };
}

/** The big "where does it hurt" chips of the spine quick questionnaire and the regions they set. */
export const SIMPLE_AREAS = [
  { id: 'neck', label: 'Neck' },
  { id: 'upper-back', label: 'Upper or middle back' },
  { id: 'low-back', label: 'Low back' },
  { id: 'right-arm', label: 'Right arm or hand' },
  { id: 'left-arm', label: 'Left arm or hand' },
  { id: 'right-leg', label: 'Right leg or foot' },
  { id: 'left-leg', label: 'Left leg or foot' },
];

/**
 * The orthopaedic quick questionnaire asks for the joint and then the side;
 * the two together name the sided regions the comprehensive form stores
 * (lib/services/ortho/constants.js SYMPTOM_REGIONS, `${side}-${area}`).
 */
export const ORTHO_SIMPLE_AREAS = [
  { id: 'shoulder', label: 'Shoulder' },
  { id: 'elbow', label: 'Elbow' },
  { id: 'wrist', label: 'Wrist' },
  { id: 'hand', label: 'Hand or fingers' },
  { id: 'hip', label: 'Hip' },
  { id: 'knee', label: 'Knee' },
  { id: 'ankle', label: 'Ankle' },
  { id: 'foot', label: 'Foot or toes' },
];
export const SIMPLE_SIDES = ['Right', 'Left', 'Both'];

/** The sided region ids for the joints and the side the patient tapped. */
export function orthoRegions(areas = [], side = '') {
  const sides = side === 'Both' ? ['right', 'left'] : side ? [side.toLowerCase()] : [];
  return areas.flatMap((a) => sides.map((s) => `${s}-${a}`));
}

/** The places list for a service's quick questionnaire. */
export const simpleAreasFor = (specialty) => (specialty === 'ortho' ? ORTHO_SIMPLE_AREAS : SIMPLE_AREAS);

/**
 * The answers that follow from the one branch the short form takes, chosen
 * on the welcome screen: a first visit or a new problem, or a return visit.
 * Paths into the intake data, for setNested.
 */
export function visitAnswers(followup) {
  return {
    'visit.choice': followup ? 'followup' : 'new',
    'visit.hadSurgery': followup ? 'No' : '',
    'visit.workInjury': 'No',
    'visit.type': followup ? 'followup' : 'new',
    'triage.firstTime': followup ? 'No, I have seen this doctor before' : 'Yes, my first time with this doctor',
    'demographics.visitReason': followup ? 'Follow-up visit' : 'New patient or new problem',
  };
}

/** Common conditions as big buttons, so nobody has to type them. */
export const SIMPLE_CONDITIONS = [
  'High blood pressure', 'Diabetes', 'Heart disease', 'Osteoporosis',
  'Thyroid problem', 'Cancer', 'Kidney disease', 'Lung disease or asthma',
];

/** The medicines question: a third answer for the patient who has a list, but not with them. */
export const MEDS_LATER = 'Yes, but I do not have my list with me';

export const SIMPLE_DURATIONS = ['Less than a month', '1 to 6 months', '6 months to 2 years', 'More than 2 years'];
export const SIMPLE_TRENDS = ['Getting better', 'About the same', 'Getting worse'];
export const SIMPLE_CHANGE = ['Better', 'About the same', 'Worse'];
export const SIMPLE_TRIED = ['Physical therapy', 'Chiropractor', 'Injections', 'Pain medicine', 'Nothing yet'];
export const ORTHO_SIMPLE_TRIED = ['Physical therapy', 'Brace, splint or boot', 'Injections', 'Pain medicine', 'Nothing yet'];
export const simpleTriedFor = (specialty) => (specialty === 'ortho' ? ORTHO_SIMPLE_TRIED : SIMPLE_TRIED);

/**
 * The safety questions of the quick questionnaire, by service. Each is a
 * yes/no stored under hpiData.overall.<field>, where the comprehensive form's
 * symptom step stores it; `also` is a second field given the same answer.
 */
export const SIMPLE_SAFETY = {
  spine: [
    { field: 'numbness', also: 'tingling', label: 'Do you have numbness or tingling in your arms, hands, legs or feet?' },
    { field: 'weakness', label: 'Do you have weakness in an arm or a leg?' },
    { field: 'gaitChanges', label: 'Do you have trouble walking, or feel unsteady on your feet?' },
    { field: 'bowelBladder', label: 'Any new trouble controlling your bladder or bowels?' },
  ],
  ortho: [
    { field: 'numbness', also: 'tingling', label: 'Do you have numbness or tingling in the hand or foot on that side?' },
    { field: 'weakness', label: 'Do you have weakness in that arm or leg?' },
    { field: 'hotJoint', label: 'Is the joint hot, red and swollen, or do you have a fever with it?' },
    { field: 'dvtSymptoms', label: 'Do you have calf swelling or pain, or sudden shortness of breath?' },
  ],
};
export const simpleSafetyFor = (specialty) => SIMPLE_SAFETY[specialty === 'ortho' ? 'ortho' : 'spine'];

/** The "surgery before" question of the quick questionnaire, by service. */
export const SIMPLE_SURGERY_Q = {
  spine: 'Have you ever had surgery on your spine?',
  ortho: 'Have you ever had surgery on this joint or area?',
};
export const simpleSurgeryQFor = (specialty) => SIMPLE_SURGERY_Q[specialty === 'ortho' ? 'ortho' : 'spine'];
