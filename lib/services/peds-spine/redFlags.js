// The child's version of redFlags: the adult spine rules, plus the pediatric
// spine flags the source intake raised from its click-through history (night
// pain that wakes the child, fever or weight loss or night sweats, a change in
// walking or balance, and after surgery a wound concern, fever or trouble
// urinating). Same export names as the adult module.
import { RED_FLAG_DEFINITIONS as ADULT_DEFINITIONS, detectRedFlags as detectAdultRedFlags } from '../spine/redFlags';

const has = (list, re) => Array.isArray(list) && list.some((x) => re.test(String(x)));

/** The pediatric rules, each read off the fields under pedsSpine. */
const PEDS_DEFINITIONS = [
  {
    id: 'peds_constitutional',
    label: 'Fever, weight loss or night sweats with a spine complaint in a child',
    severity: 'urgent',
    patientMessage: 'You mentioned fever, weight loss or night sweats. This is important information for the care team. If your child has a fever or is unwell now, please call the office today.',
    detectInText: [],
    detectInFields: {
      'pedsSpine.history.neuro': (v) => has(v, /fever, weight loss or night sweats/i),
      'pedsSpine.interval.neuro': (v) => has(v, /fever, weight loss or night sweats/i),
    },
  },
  {
    id: 'peds_gait_balance_change',
    label: 'Change in walking or balance in a child',
    severity: 'urgent',
    patientMessage: 'You mentioned a change in how your child walks or balances. The care team will want to know about this before the visit; please mention it when the office calls.',
    detectInText: [],
    detectInFields: {
      'pedsSpine.history.neuro': (v) => has(v, /walking or balance/i),
      'pedsSpine.interval.neuro': (v) => has(v, /walking or balance/i),
      'pedsSpine.postop.walkingBalance': (v) => v === 'Yes',
    },
  },
  {
    id: 'peds_night_pain',
    label: 'Pain that wakes the child from sleep',
    severity: 'moderate',
    patientMessage: 'You mentioned that pain wakes your child from sleep. The care team will want to discuss this at the visit.',
    detectInText: [],
    detectInFields: {
      'pedsSpine.history.nightPain': (v) => v === 'Yes',
      'pedsSpine.interval.nightPain': (v) => v === 'Yes',
    },
  },
  {
    id: 'peds_postop_wound_fever',
    label: 'Post-operative wound concern or fever in a child',
    severity: 'urgent',
    patientMessage: 'You mentioned redness, swelling, drainage, warmth or an opening at the incision, or a fever since going home. Please call the office today so this can be looked at promptly; go to the emergency room if your child seems unwell.',
    detectInText: [],
    detectInFields: {
      'pedsSpine.postop.incision': (v) => has(v, /redness|swelling|drainage|opening|warm/i),
      'pedsSpine.postop.fever': (v) => v === 'Yes',
    },
  },
  {
    id: 'peds_postop_bladder',
    label: 'Trouble urinating after surgery',
    severity: 'urgent',
    patientMessage: 'You mentioned trouble urinating since the surgery. Please tell the office about this today.',
    detectInText: [],
    detectInFields: {
      'pedsSpine.postop.bladder': (v) => v === 'Yes',
    },
  },
];

/** Every rule this service knows: the adult spine rules, then the pediatric ones. */
export const RED_FLAG_DEFINITIONS = [...ADULT_DEFINITIONS, ...PEDS_DEFINITIONS];

function getNestedValue(obj, path) {
  let current = obj;
  for (const key of path.split('.')) {
    if (current === undefined || current === null) return undefined;
    current = current[key];
  }
  return current;
}

/**
 * Scans intake data for red flags: the adult spine detection (text and the
 * shared fields) plus the pediatric fields under pedsSpine. Returns the same
 * { id, label, severity, patientMessage } objects.
 */
export function detectRedFlags(intakeData) {
  const triggered = detectAdultRedFlags(intakeData);
  const seen = new Set(triggered.map((f) => f.id));
  for (const flag of PEDS_DEFINITIONS) {
    if (seen.has(flag.id)) continue;
    const fired = Object.entries(flag.detectInFields).some(([path, check]) => {
      const value = getNestedValue(intakeData, path);
      return value !== undefined && check(value);
    });
    if (fired) {
      triggered.push({ id: flag.id, label: flag.label, severity: flag.severity, patientMessage: flag.patientMessage });
    }
  }
  return triggered;
}
