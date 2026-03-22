// ============================================================================
// Red Flag Detection Logic for Spine Intake
// ============================================================================

/**
 * Red flag conditions that warrant clinical attention.
 * Each flag has an ID, description, patient-facing message, and detection keywords.
 */
export const RED_FLAG_DEFINITIONS = [
  {
    id: 'cauda_equina_bowel_bladder',
    label: 'New bowel/bladder dysfunction',
    severity: 'urgent',
    patientMessage: 'You mentioned changes in bowel or bladder function. This is important information for your surgeon. If these symptoms are new or worsening, please contact the clinic or seek medical attention promptly.',
    detectInText: ['incontinence', 'can\'t hold urine', 'can\'t hold bowel', 'bladder problems', 'bowel problems', 'wetting myself', 'losing control of bladder', 'losing control of bowel', 'urinary retention', 'can\'t urinate', 'difficulty urinating'],
    detectInFields: {
      'bowelBladder': (v) => v === true || v === 'yes' || (typeof v === 'string' && v.toLowerCase().includes('yes')),
    },
  },
  {
    id: 'saddle_anesthesia',
    label: 'Saddle anesthesia',
    severity: 'urgent',
    patientMessage: 'You mentioned numbness in the groin or inner thigh area. This is important clinical information. If this is a new symptom, please contact the clinic or seek medical evaluation promptly.',
    detectInText: ['saddle numbness', 'groin numbness', 'numb groin', 'numb inner thigh', 'numbness between legs', 'perineal numbness'],
    detectInFields: {
      'saddleAnesthesia': (v) => v === true || v === 'yes' || (typeof v === 'string' && v.toLowerCase().includes('yes')),
    },
  },
  {
    id: 'progressive_weakness',
    label: 'Rapidly progressive weakness',
    severity: 'urgent',
    patientMessage: 'You mentioned weakness that is getting worse quickly. This is important information for your care team. If you are experiencing rapidly worsening weakness, please contact the clinic or seek medical attention.',
    detectInText: ['getting weaker fast', 'rapidly getting weaker', 'weakness getting worse quickly', 'sudden weakness', 'can\'t move my', 'leg gave out', 'legs gave out', 'foot drop getting worse', 'paralysis'],
    detectInFields: {},
  },
  {
    id: 'fever_back_pain',
    label: 'Fever with severe back pain',
    severity: 'urgent',
    patientMessage: 'You mentioned fever along with back pain. This combination is important to evaluate. If you currently have a fever with severe back pain, please contact the clinic or seek medical attention promptly.',
    detectInText: ['fever and back pain', 'back pain and fever', 'chills and back pain', 'high temperature with back pain'],
    detectInFields: {},
  },
  {
    id: 'weight_loss',
    label: 'Unexplained weight loss',
    severity: 'moderate',
    patientMessage: 'You mentioned unexplained weight loss. Your care team will want to know more about this during your visit.',
    detectInText: ['losing weight without trying', 'unexplained weight loss', 'unintentional weight loss'],
    detectInFields: {
      'unexplainedWeightLoss': (v) => v === true || v === 'yes',
    },
  },
  {
    id: 'cancer_history_new_pain',
    label: 'Cancer history with new spine pain',
    severity: 'moderate',
    patientMessage: 'Given your history, your care team will carefully evaluate your current spine symptoms during your visit.',
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

    // Check ROS responses
    if (!isTriggered && intakeData.reviewOfSystems) {
      const ros = intakeData.reviewOfSystems;
      if (flag.id === 'cauda_equina_bowel_bladder' && ros.bowelBladderChanges === 'yes') {
        isTriggered = true;
      }
      if (flag.id === 'weight_loss' && ros.unexplainedWeightLoss === 'yes') {
        isTriggered = true;
      }
    }

    // Check HPI symptom data
    if (!isTriggered && intakeData.hpiData?.symptoms) {
      for (const symptomData of Object.values(intakeData.hpiData.symptoms)) {
        if (flag.id === 'cauda_equina_bowel_bladder' && symptomData.bowelBladder) {
          isTriggered = true;
        }
        if (flag.id === 'saddle_anesthesia' && symptomData.saddleAnesthesia) {
          isTriggered = true;
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
