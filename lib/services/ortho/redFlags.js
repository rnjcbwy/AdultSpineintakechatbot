// ============================================================================
// Red Flag Detection Logic for the Orthopaedic Intake
//
// The things that cannot wait for the appointment: a hot swollen joint with
// fever (septic arthritis), a wound over a fracture, a cold or numb limb
// beyond an injury, tight swelling with pain out of proportion (compartment
// syndrome), calf swelling or breathlessness (clot), and after surgery a
// wound problem or a new deficit. Nothing here is a diagnosis; each flag
// raises the summary and gives the patient a calm instruction.
// ============================================================================

import { rosAnswer } from './rosSystems';

const yes = (v) => v === true || v === 'yes' || v === 'Yes' || (typeof v === 'string' && /^yes/i.test(v));

/**
 * Red flag conditions that warrant clinical attention.
 * Each flag has an ID, description, patient-facing message, and detection keywords.
 */
export const RED_FLAG_DEFINITIONS = [
  {
    id: 'septic_joint',
    label: 'Hot, red, swollen joint with fever (possible joint infection)',
    severity: 'urgent',
    patientMessage: 'You mentioned a joint that is hot, red and swollen, or a fever with your joint pain. A joint infection needs to be seen the same day. Please call the office now; if you cannot reach us, go to the emergency room.',
    detectInText: ['joint is hot', 'hot and swollen', 'red and swollen', 'fever and swelling', 'fever with my knee', 'fever with my hip', 'pus'],
    detectInFields: {
      'hpiData.overall.hotJoint': yes,
    },
  },
  {
    id: 'open_wound_injury',
    label: 'Open wound or broken skin over an injury (possible open fracture)',
    severity: 'urgent',
    patientMessage: 'You mentioned a wound or broken skin over the injured area. If the bone may be broken underneath, this needs urgent care. Please go to the emergency room if this is new, or call the office today.',
    detectInText: ['bone is showing', 'bone sticking out', 'open fracture', 'wound over the break'],
    detectInFields: {
      'hpiData.overall.openWound': yes,
    },
  },
  {
    id: 'limb_circulation',
    label: 'Cold, pale or numb limb beyond an injury (circulation or nerve compromise)',
    severity: 'urgent',
    patientMessage: 'You mentioned that the hand or foot beyond your injury is cold, pale or numb. This needs to be checked urgently. Please go to the emergency room if it is happening now.',
    detectInText: ['cold and pale', 'foot is cold', 'hand is cold', 'turned white', 'turned blue', 'no pulse', 'cannot feel my foot', 'cannot feel my hand'],
    detectInFields: {
      'hpiData.overall.coldPaleLimb': yes,
    },
  },
  {
    id: 'compartment_symptoms',
    label: 'Severe worsening pain with tight swelling (possible compartment syndrome)',
    severity: 'urgent',
    patientMessage: 'You mentioned severe pain that is getting rapidly worse with tight swelling. If you are in a cast or splint, or the injury is recent, this needs to be looked at right away. Please go to the emergency room.',
    detectInText: ['pain out of proportion', 'cast is too tight', 'cast feels tight', 'swelling is getting tight', 'unbearable pain'],
    detectInFields: {
      'hpiData.overall.compartmentSymptoms': yes,
    },
  },
  {
    id: 'dvt_pe',
    label: 'Calf swelling or pain, or sudden shortness of breath (possible blood clot)',
    severity: 'urgent',
    patientMessage: 'You mentioned calf swelling or pain, or sudden shortness of breath. These can be signs of a blood clot, especially after an injury, a cast or an operation. Please call the office today; if you are short of breath, call 911.',
    detectInText: ['calf is swollen', 'calf swelling', 'blood clot', 'short of breath suddenly', 'chest pain and short of breath'],
    detectInFields: {
      'hpiData.overall.dvtSymptoms': yes,
      'visit.postop.complications': (v) => Array.isArray(v) && v.some((x) => /blood clot/i.test(String(x))),
    },
  },
  {
    id: 'progressive_weakness',
    label: 'Rapidly progressive weakness or numbness',
    severity: 'urgent',
    patientMessage: 'You mentioned weakness or numbness that is getting worse quickly. This is important information for your care team. Please contact the clinic today.',
    detectInText: ['getting weaker fast', 'rapidly getting weaker', 'weakness getting worse quickly', 'sudden weakness', 'can\'t move my', 'cannot move my fingers', 'cannot lift my foot', 'foot drop getting worse', 'paralysis'],
    detectInFields: {},
  },
  {
    id: 'cannot_bear_weight',
    label: 'Unable to bear weight after an injury',
    severity: 'moderate',
    patientMessage: 'You mentioned that you cannot put weight on the injured leg. Please keep weight off it until you have been seen, and call the office so you can be seen promptly.',
    detectInText: ['cannot put weight', 'can\'t put weight', 'cannot walk on it', 'can\'t walk on it', 'cannot stand on it'],
    detectInFields: {
      'hpiData.problems': (v) => v && Object.values(v).some((p) => p && /^No$/i.test(String(p.weightBearing || '')) && /injury|broken bone/i.test(String(p.kind || ''))),
    },
  },
  {
    id: 'weight_loss',
    label: 'Unexplained weight loss',
    severity: 'moderate',
    patientMessage: 'You mentioned unexplained weight loss. Your care team will want to know more about this during your visit.',
    detectInText: ['losing weight without trying', 'unexplained weight loss', 'unintentional weight loss'],
    detectInFields: {
      'unexplainedWeightLoss': yes,
    },
  },
  {
    id: 'cancer_history_new_pain',
    label: 'Cancer history with new bone or joint pain',
    severity: 'moderate',
    patientMessage: 'Given your history, your care team will carefully evaluate your current symptoms during your visit.',
    detectInText: ['cancer', 'tumor', 'malignancy'],
    detectInFields: {},
  },
  {
    id: 'iv_drug_use',
    label: 'IV drug use (infection risk)',
    severity: 'moderate',
    patientMessage: 'Thank you for sharing this information. It helps your care team provide the best possible evaluation.',
    detectInText: ['inject drugs', 'IV drug', 'intravenous drug'],
    detectInFields: {},
  },
  {
    id: 'postop_wound_concern',
    label: 'Post-operative wound concern or fever',
    severity: 'urgent',
    patientMessage: 'You mentioned redness, drainage, an open incision, or fever or chills after your surgery. Please call the office today so this can be looked at promptly; go to the emergency room if you feel unwell.',
    detectInText: [],
    detectInFields: {
      'visit.postop.wound': (v) => Array.isArray(v) && v.some((x) => /drainage|opened|fever|redness/i.test(String(x))),
      'visit.postop.complications': (v) => Array.isArray(v) && v.some((x) => /infection|readmitted/i.test(String(x))),
    },
  },
  {
    id: 'postop_new_deficit',
    label: 'New numbness, weakness or circulation change after surgery',
    severity: 'urgent',
    patientMessage: 'You mentioned new numbness, weakness or a cold or pale hand or foot since your surgery. Please tell the office about this before your visit.',
    detectInText: [],
    detectInFields: {
      'visit.postop.limbSymptoms': (v) => /new symptoms|worse/i.test(String(v || '')),
      'visit.postop.neuroDetails': (v) => /\bnew\b/i.test(String(v || '')),
      'visit.postop.circulation': (v) => /cold|pale|blue/i.test(String(v || '')),
    },
  },
  {
    id: 'night_pain_severe',
    label: 'Severe unrelenting night pain',
    severity: 'moderate',
    patientMessage: 'Your care team will want to discuss your nighttime symptoms further during your visit.',
    detectInText: ['pain wakes me up', 'can\'t sleep from pain', 'constant pain at night', 'pain never goes away'],
    detectInFields: {},
  },
];


/**
 * Scans intake data for red flags.
 * Returns an array of triggered red flag objects.
 */
export function detectRedFlags(intakeData) {
  const triggered = [];

  // Collect all text fields for scanning
  const textFields = collectTextFields(intakeData);
  const allText = textFields.join(' ').toLowerCase();

  for (const flag of RED_FLAG_DEFINITIONS) {
    let isTriggered = false;

    // Check text-based detection
    for (const keyword of flag.detectInText) {
      if (allText.includes(keyword.toLowerCase())) {
        isTriggered = true;
        break;
      }
    }

    // Check field-based detection
    if (!isTriggered) {
      for (const [fieldPath, checker] of Object.entries(flag.detectInFields)) {
        const value = getNestedValue(intakeData, fieldPath);
        if (value !== undefined && checker(value)) {
          isTriggered = true;
          break;
        }
      }
    }

    // Check ROS responses, by question id, wherever the question lives.
    if (!isTriggered && intakeData.reviewOfSystems) {
      const ros = intakeData.reviewOfSystems;
      const ROS_TRIGGERS = {
        septic_joint: ['hotSwollenJoint'],
        dvt_pe: ['calfSwelling'],
        weight_loss: ['unexplainedWeightLoss'],
        cancer_history_new_pain: ['cancerHistory'],
      };
      for (const questionId of ROS_TRIGGERS[flag.id] || []) {
        if (rosAnswer(ros, questionId) === 'yes') {
          isTriggered = true;
          break;
        }
      }
    }

    if (isTriggered) {
      triggered.push({
        id: flag.id,
        label: flag.label,
        severity: flag.severity,
        patientMessage: flag.patientMessage,
      });
    }
  }

  return triggered;
}


/**
 * Recursively collects all string values from an object.
 */
function collectTextFields(obj, results = []) {
  if (!obj) return results;
  if (typeof obj === 'string') {
    results.push(obj);
    return results;
  }
  if (Array.isArray(obj)) {
    for (const item of obj) {
      collectTextFields(item, results);
    }
    return results;
  }
  if (typeof obj === 'object') {
    for (const value of Object.values(obj)) {
      collectTextFields(value, results);
    }
  }
  return results;
}


/**
 * Gets a nested value from an object using dot-separated path.
 */
function getNestedValue(obj, path) {
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current === undefined || current === null) return undefined;
    current = current[key];
  }
  return current;
}
