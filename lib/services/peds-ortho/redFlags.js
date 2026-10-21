// ============================================================================
// Red flags for a child's bone or joint visit.
//
// The adult ortho rules stay (septic joint, open wound, cold limb, compartment
// symptoms, clot, wound concern after surgery); what is added is where the
// fracture-clinic answers live (`pedsOrtho.*`): an open wound over the injury,
// fingers or toes that are pale, blue or cold, a cast that feels too tight or
// has something pushed down inside it, numbness or pins and needles in a
// casted limb, fever, a wound that is leaking or opening after an operation.
// Export names match the adult module (RED_FLAG_DEFINITIONS, detectRedFlags).
// ============================================================================

import { RED_FLAG_DEFINITIONS as ADULT_FLAGS } from '../ortho/redFlags';
import { rosAnswer } from './rosSystems';

const has = (...needles) => (v) => Array.isArray(v) && v.some((x) => needles.some((n) => n.test(String(x))));

/** The pediatric fracture rules, merged over the adult ones by id (same id = extra detection, same message). */
const PEDS_FLAGS = [
  {
    id: 'open_wound_injury',
    label: 'Open wound or broken skin over an injury (possible open fracture)',
    severity: 'urgent',
    patientMessage: 'You mentioned a wound or broken skin over your child\'s injury. If the bone may be broken underneath, this needs urgent care. Please go to the emergency room if this is new, or call the office today.',
    detectInText: ['bone is showing', 'bone sticking out', 'open fracture', 'wound over the break'],
    detectInFields: {
      'pedsOrtho.injury.signs': has(/open wound/i),
    },
  },
  {
    id: 'limb_circulation',
    label: 'Pale, blue, cold or numb fingers or toes beyond an injury or cast (circulation or nerve compromise)',
    severity: 'urgent',
    patientMessage: 'You mentioned that your child\'s fingers or toes beyond the injury or cast look pale or blue, feel cold, are numb or cannot be moved. This needs to be checked urgently. Please go to the emergency room if it is happening now.',
    detectInText: ['cold and pale', 'foot is cold', 'hand is cold', 'turned white', 'turned blue', 'fingers are blue', 'toes are blue', 'cannot feel', 'can\'t feel', 'cannot move the fingers', 'cannot move the toes'],
    detectInFields: {
      'pedsOrtho.injury.signs': has(/pale or blue/i, /numbness/i),
      'pedsOrtho.fxFollowUp.warnings': has(/pale or blue/i, /feel cold/i, /numbness/i, /pins and needles/i, /cannot move/i),
    },
  },
  {
    id: 'compartment_symptoms',
    label: 'Tight cast or splint, or severe worsening pain with tight swelling (possible compartment syndrome)',
    severity: 'urgent',
    patientMessage: 'You mentioned that the cast or splint feels too tight, that something was pushed down inside it, or that the pain and swelling are getting rapidly worse. This needs to be looked at right away. Please call the office now; if you cannot reach us, go to the emergency room.',
    detectInText: ['pain out of proportion', 'cast is too tight', 'cast feels tight', 'splint is too tight', 'swelling is getting tight', 'unbearable pain', 'screaming in pain'],
    detectInFields: {
      'pedsOrtho.fxFollowUp.castProblems': has(/too tight/i, /pushed down inside/i),
      'pedsOrtho.fxFollowUp.warnings': has(/new or worse swelling/i),
    },
  },
  {
    id: 'cast_skin_problem',
    label: 'Cast problem: wet, cracked, smelling, sore skin or came off early',
    severity: 'moderate',
    patientMessage: 'You mentioned a problem with the cast or splint (wet, cracked, a bad smell, sore skin at the edges, or it came off early). Please call the office so it can be checked or changed before the planned visit if needed.',
    detectInText: ['cast got wet', 'cast is cracked', 'cast smells', 'cast came off'],
    detectInFields: {
      'pedsOrtho.fxFollowUp.castProblems': has(/got wet/i, /cracked/i, /bad smell/i, /sore or red/i, /came off early/i),
    },
  },
  {
    id: 'fever_with_injury',
    label: 'Fever with an injury, cast or recent operation (possible infection)',
    severity: 'urgent',
    patientMessage: 'You mentioned a fever. A fever with a broken bone, a cast or a recent operation needs to be looked at the same day. Please call the office now; if you cannot reach us, go to the emergency room.',
    detectInText: [],
    detectInFields: {
      'pedsOrtho.fxFollowUp.warnings': has(/^fever$/i),
      'pedsOrtho.postop.events': has(/^fever$/i),
    },
  },
  {
    id: 'postop_wound_concern',
    label: 'Post-operative wound concern or fever',
    severity: 'urgent',
    patientMessage: 'You mentioned that the wound is leaking, the redness is spreading, the edges are coming apart or the stitches are coming out, or that your child has had a fever or gone back to the hospital since the operation. Please call the office today so this can be looked at promptly; go to the emergency room if your child is unwell.',
    detectInText: [],
    detectInFields: {
      'visit.postop.wound': (v) => Array.isArray(v) && v.some((x) => /drainage|opened|fever|redness/i.test(String(x))),
      'visit.postop.complications': (v) => Array.isArray(v) && v.some((x) => /infection|readmitted/i.test(String(x))),
      'pedsOrtho.postop.wound': has(/leaking/i, /redness spreading/i, /edges coming apart/i, /bad smell/i, /stitches or staples/i),
      'pedsOrtho.postop.events': has(/emergency room/i, /overnight in hospital/i),
    },
  },
  {
    id: 'cannot_bear_weight',
    label: 'Unable to bear weight or use the limb after an injury',
    severity: 'moderate',
    patientMessage: 'You mentioned that your child cannot put weight on the injured leg or use the injured arm at all. Please keep weight off it until your child has been seen, and call the office so the visit can be arranged promptly.',
    detectInText: ['cannot put weight', 'can\'t put weight', 'cannot walk on it', 'can\'t walk on it', 'cannot stand on it', 'refuses to walk', 'won\'t walk'],
    detectInFields: {
      'hpiData.problems': (v) => v && Object.values(v).some((p) => p && /^No$/i.test(String(p.weightBearing || '')) && /injury|broken bone/i.test(String(p.kind || ''))),
      'pedsOrtho.injury.useAfter': (v) => /not at all/i.test(String(v || '')),
      'pedsOrtho.fxFollowUp.usingLimb': (v) => /not at all/i.test(String(v || '')),
    },
  },
  {
    id: 'reinjury_in_cast',
    label: 'Re-injury since the last visit',
    severity: 'moderate',
    patientMessage: 'You mentioned that the injury was knocked or hurt again since the last visit. The office will want to know before the appointment; please call if the pain or the shape has changed.',
    detectInText: [],
    detectInFields: {
      'pedsOrtho.fxFollowUp.reinjury': (v) => /^yes/i.test(String(v || '')),
    },
  },
  {
    id: 'deformity_after_injury',
    label: 'Limb looks crooked or out of place after an injury',
    severity: 'moderate',
    patientMessage: 'You mentioned that the injured limb looks crooked or out of place. If it has not yet been seen, please go to the emergency room or an urgent care centre so it can be X-rayed; otherwise the office will want to see your child promptly.',
    detectInText: ['looks crooked', 'out of place', 'bent the wrong way', 'deformed'],
    detectInFields: {
      'pedsOrtho.injury.signs': has(/crooked or out of place/i),
    },
  },
];

const byId = new Map(ADULT_FLAGS.map((f) => [f.id, f]));
for (const f of PEDS_FLAGS) byId.set(f.id, f);

/**
 * Red flag conditions that warrant clinical attention. Each has an id, a
 * description, a patient-facing message, and the text and field checks.
 */
export const RED_FLAG_DEFINITIONS = [...byId.values()];

/**
 * Scans intake data for red flags. Returns the triggered flags.
 */
export function detectRedFlags(intakeData) {
  const triggered = [];
  const allText = collectTextFields(intakeData).join(' ').toLowerCase();

  for (const flag of RED_FLAG_DEFINITIONS) {
    let isTriggered = false;

    for (const keyword of flag.detectInText || []) {
      if (allText.includes(keyword.toLowerCase())) { isTriggered = true; break; }
    }

    if (!isTriggered) {
      for (const [fieldPath, checker] of Object.entries(flag.detectInFields || {})) {
        const value = getNestedValue(intakeData, fieldPath);
        if (value !== undefined && checker(value)) { isTriggered = true; break; }
      }
    }

    // Check ROS responses, by question id, wherever the question lives.
    if (!isTriggered && intakeData?.reviewOfSystems) {
      const ros = intakeData.reviewOfSystems;
      const ROS_TRIGGERS = {
        septic_joint: ['hotSwollenJoint'],
        dvt_pe: ['calfSwelling'],
        weight_loss: ['unexplainedWeightLoss'],
        cancer_history_new_pain: ['cancerHistory'],
      };
      for (const questionId of ROS_TRIGGERS[flag.id] || []) {
        if (rosAnswer(ros, questionId) === 'yes') { isTriggered = true; break; }
      }
    }

    if (isTriggered) {
      triggered.push({ id: flag.id, label: flag.label, severity: flag.severity, patientMessage: flag.patientMessage });
    }
  }

  return triggered;
}

/** Recursively collects all string values from an object. */
function collectTextFields(obj, results = []) {
  if (!obj) return results;
  if (typeof obj === 'string') { results.push(obj); return results; }
  if (Array.isArray(obj)) { for (const item of obj) collectTextFields(item, results); return results; }
  if (typeof obj === 'object') { for (const value of Object.values(obj)) collectTextFields(value, results); }
  return results;
}

/** Gets a nested value from an object using a dot-separated path. */
function getNestedValue(obj, path) {
  let current = obj;
  for (const key of path.split('.')) {
    if (current === undefined || current === null) return undefined;
    current = current[key];
  }
  return current;
}
