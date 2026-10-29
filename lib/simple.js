// ============================================================================
// The short form: the adult spine intake for patients who find the full form
// too much (older patients, people who are not at home on a computer).
//
// It is the default on intake.aaronweymd.com. Five screens, big buttons, no
// body map, no questionnaires, the treatments question optional:
//
//   about you -> what is bothering you -> a few questions -> health check -> sign
//   (seen here before: about you -> what has changed -> a few questions -> sign)
//
// It writes the same fields as the full form (chief complaint, the problem
// answers, the safety screen, medications, allergies, conditions, prior
// operations), so the office note, the PDF, Practice Hub and the handouts
// work exactly as they do for the full form. The welcome offers the detailed
// form for anyone who wants it (mode 'full').
// ============================================================================

export const SIMPLE_MODE = 'simple';
export const FULL_MODE = 'full';

/** The answers the short form starts with (also after "Start a new form"). */
export function simpleStart() {
  return {
    mode: SIMPLE_MODE,
    service: { patient: 'adult', specialty: 'spine', key: 'adult_spine', how: 'site' },
    triage: { who: 'Myself', firstTime: '', regions: [], description: '', suggestion: null },
  };
}

/** The big "where does it hurt" chips of the short form and the regions they set. */
export const SIMPLE_AREAS = [
  { id: 'neck', label: 'Neck' },
  { id: 'upper-back', label: 'Upper or middle back' },
  { id: 'low-back', label: 'Low back' },
  { id: 'right-arm', label: 'Right arm or hand' },
  { id: 'left-arm', label: 'Left arm or hand' },
  { id: 'right-leg', label: 'Right leg or foot' },
  { id: 'left-leg', label: 'Left leg or foot' },
];

export const SIMPLE_DURATIONS = ['Less than a month', '1 to 6 months', '6 months to 2 years', 'More than 2 years'];
export const SIMPLE_TRENDS = ['Getting better', 'About the same', 'Getting worse'];
export const SIMPLE_CHANGE = ['Better', 'About the same', 'Worse'];
export const SIMPLE_TRIED = ['Physical therapy', 'Chiropractor', 'Injections', 'Pain medicine', 'Surgery on my spine', 'Nothing yet'];
