// ============================================================================
// Constants & Reference Data for the Adult Orthopaedic Intake
//
// General orthopaedics: fractures and injuries, arthritic and degenerative
// conditions (osteoarthritis, rotator cuff disease, carpal tunnel, trigger
// finger), and sports and ligament injuries (ACL, meniscus, ankle sprains).
// Neck and back complaints have their own intake; they are accepted here
// but pointed at it.
// ============================================================================

/**
 * Step definitions for the intake wizard. The sequence depends on the kind of
 * visit (lib/flows.js): this is the full new-patient sequence, kept for the
 * spec export and anything else that needs the complete list.
 */
import { stepsForVisit, VISIT_TYPES } from '../../flows';
export const INTAKE_STEPS = stepsForVisit('new');

/**
 * Symptom region options. Joints carry a side (the body map confirms it);
 * the "general" entries describe a quality or context and ride along with
 * whatever joint was chosen. `area` folds the sides into one problem
 * (lib/problems.js) so the questions are asked once per joint.
 */
export const SYMPTOM_REGIONS = [
  { id: 'right-shoulder', label: 'Right shoulder', area: 'shoulder', side: 'right', joint: 'Shoulder' },
  { id: 'left-shoulder', label: 'Left shoulder', area: 'shoulder', side: 'left', joint: 'Shoulder' },
  { id: 'right-elbow', label: 'Right elbow', area: 'elbow', side: 'right', joint: 'Elbow' },
  { id: 'left-elbow', label: 'Left elbow', area: 'elbow', side: 'left', joint: 'Elbow' },
  { id: 'right-hand', label: 'Right hand, wrist or fingers', area: 'hand', side: 'right', joint: 'Hand, wrist or fingers' },
  { id: 'left-hand', label: 'Left hand, wrist or fingers', area: 'hand', side: 'left', joint: 'Hand, wrist or fingers' },
  { id: 'right-hip', label: 'Right hip', area: 'hip', side: 'right', joint: 'Hip' },
  { id: 'left-hip', label: 'Left hip', area: 'hip', side: 'left', joint: 'Hip' },
  { id: 'right-knee', label: 'Right knee', area: 'knee', side: 'right', joint: 'Knee' },
  { id: 'left-knee', label: 'Left knee', area: 'knee', side: 'left', joint: 'Knee' },
  { id: 'right-foot', label: 'Right ankle or foot', area: 'foot', side: 'right', joint: 'Ankle or foot' },
  { id: 'left-foot', label: 'Left ankle or foot', area: 'foot', side: 'left', joint: 'Ankle or foot' },
  { id: 'neck-back', label: 'Neck or back', area: 'spine' },
  { id: 'numbness-tingling', label: 'Numbness or tingling', area: 'general' },
  { id: 'weakness', label: 'Weakness', area: 'general' },
  { id: 'swelling', label: 'Swelling', area: 'general' },
  { id: 'instability', label: 'Giving way, locking or catching', area: 'general' },
  { id: 'deformity', label: 'A bump, lump or change in shape', area: 'general' },
  { id: 'prior-surgery-pain', label: 'Pain after a prior operation', area: 'surgical' },
  { id: 'trauma', label: 'Recent injury, fall or broken bone', area: 'general' },
];

/** The joint rows of the chief-complaint grid, left and right. */
export const JOINT_ROWS = ['Shoulder', 'Elbow', 'Hand, wrist or fingers', 'Hip', 'Knee', 'Ankle or foot'].map((joint) => ({
  joint,
  left: SYMPTOM_REGIONS.find((r) => r.joint === joint && r.side === 'left').id,
  right: SYMPTOM_REGIONS.find((r) => r.joint === joint && r.side === 'right').id,
}));

/** How the chief-complaint step lays the remaining regions out, after the joint grid: titled groups of region ids. */
export const REGION_GROUPS = [
  { id: 'extra', label: 'What else describes it?', ids: ['numbness-tingling', 'weakness', 'swelling', 'instability', 'deformity', 'prior-surgery-pain', 'trauma'] },
];

/** The chief-complaint wording that names the specialty (translated in the step's own dictionary). */
/**
 * The triage step's region taps (lib/service.js TRIAGE_REGIONS) as this
 * service's symptom regions, so the chief-complaint step starts pre-filled.
 *
 *   neck, back, posture -> neck-back
 *   shoulder, elbow, hand, hip, knee, foot -> the JOINT_ROWS joint of that
 *     name, returned in `joints`: the triage does not ask the side, so the
 *     chief-complaint step asks only that, and the sided region id
 *     (right-knee, left-knee) is written once the patient taps it.
 */
const TRIAGE_JOINT_MAP = { shoulder: 'Shoulder', elbow: 'Elbow', hand: 'Hand, wrist or fingers', hip: 'Hip', knee: 'Knee', foot: 'Ankle or foot' };
export function regionsFromTriage(triageRegions = []) {
  const regions = triageRegions.some((id) => ['neck', 'back', 'posture'].includes(id)) ? ['neck-back'] : [];
  const joints = [...new Set(triageRegions.map((id) => TRIAGE_JOINT_MAP[id]).filter(Boolean))];
  return { regions, joints };
}

export const CHIEF_COMPLAINT_TEXT = {
  example: 'For example: "I twisted my knee playing soccer and it keeps giving way" or "My right shoulder aches at night and I cannot lift it overhead" or "I broke my wrist and want it checked"',
  regionsLabel: 'Which joint or area is affected? Tap the side. *',
  regionsHint: 'Choose every joint where you have pain, swelling, stiffness, numbness or weakness. The next step asks what it feels like.',
  priorSurgery: 'I have had surgery on this bone or joint before',
  concernPlaceholder: 'e.g., My knee gives way on stairs, so I avoid them...',
};

/** The body-map wording that names the specialty (translated in the step's own dictionary). */
export const PAIN_MAP_TEXT = {
  example: 'If you have more than one kind of feeling, mark each one: for example, a dull ache deep in the right knee and a sharp, stabbing pain on its inner side. Just choose a different feeling before tapping each spot.',
};

/** Pain quality descriptors */
export const PAIN_QUALITIES = [
  'Aching', 'Sharp', 'Burning', 'Stabbing', 'Cramping',
  'Electric/shooting', 'Throbbing', 'Pressure', 'Dull', 'Stiffness',
];

/** Common medical conditions for PMH checklist */
export const COMMON_CONDITIONS = [
  'Diabetes (Type 1)', 'Diabetes (Type 2)', 'Hypertension (high blood pressure)',
  'Coronary artery disease', 'Prior heart attack', 'Prior stroke or TIA',
  'Atrial fibrillation', 'Heart failure', 'Osteoporosis', 'Osteopenia',
  'Osteoarthritis', 'Gout', 'Rheumatoid arthritis', 'Psoriatic arthritis',
  'Lupus / Autoimmune disease', 'Kidney disease', 'COPD / Lung disease', 'Asthma',
  'Cancer', 'Depression', 'Anxiety', 'Sleep apnea', 'Bleeding disorder',
  'Blood clots / DVT / PE', 'Peripheral neuropathy', 'Peripheral vascular disease',
  'Multiple sclerosis', 'Parkinson\'s disease', 'Seizure disorder / Epilepsy',
  'Fibromyalgia', 'Obesity', 'Thyroid disease', 'Liver disease',
  'HIV/AIDS', 'Hepatitis', 'Problems with anesthesia (you or a relative)',
];

/** Implanted devices and hardware relevant to orthopaedic surgery planning */
export const IMPLANTED_DEVICES = [
  'Pacemaker', 'Defibrillator (ICD)', 'Joint replacement (hip, knee, shoulder)',
  'Plates, screws, rods or pins from a fracture', 'Prior spine hardware',
  'Spinal cord stimulator', 'Insulin pump', 'Cochlear implant', 'Metal allergy or sensitivity',
];

/** Common medication categories */
export const COMMON_MEDICATIONS = [
  // Pain
  'Acetaminophen (Tylenol)', 'Ibuprofen (Advil/Motrin)', 'Naproxen (Aleve)',
  'Meloxicam (Mobic)', 'Celecoxib (Celebrex)', 'Diclofenac',
  'Tramadol', 'Hydrocodone/Acetaminophen (Norco)', 'Oxycodone',
  // Nerve pain
  'Gabapentin (Neurontin)', 'Pregabalin (Lyrica)', 'Duloxetine (Cymbalta)',
  'Amitriptyline', 'Nortriptyline',
  // Muscle relaxants
  'Cyclobenzaprine (Flexeril)', 'Methocarbamol (Robaxin)',
  'Tizanidine (Zanaflex)', 'Baclofen',
  // Steroids and immune-modifying
  'Prednisone', 'Methylprednisolone (Medrol)', 'Methotrexate',
  'Biologic for arthritis (Humira, Enbrel, etc.)',
  // Gout and bone health
  'Allopurinol', 'Colchicine', 'Alendronate (Fosamax)', 'Denosumab (Prolia)',
  'Vitamin D', 'Calcium',
  // Blood thinners
  'Aspirin', 'Clopidogrel (Plavix)', 'Warfarin (Coumadin)',
  'Apixaban (Eliquis)', 'Rivaroxaban (Xarelto)', 'Enoxaparin (Lovenox)',
  // Common others
  'Lisinopril', 'Amlodipine', 'Metformin', 'Atorvastatin (Lipitor)',
  'Omeprazole (Prilosec)', 'Metoprolol', 'Levothyroxine',
];

/** Anticoagulant/antiplatelet medications to flag */
export const ANTICOAGULANTS = [
  'aspirin', 'clopidogrel', 'plavix', 'warfarin', 'coumadin',
  'apixaban', 'eliquis', 'rivaroxaban', 'xarelto', 'enoxaparin',
  'lovenox', 'dabigatran', 'pradaxa', 'heparin', 'prasugrel', 'effient',
  'ticagrelor', 'brilinta',
];

/** Injection types for treatment history */
export const INJECTION_TYPES = [
  'Steroid (cortisone) injection into the joint',
  'Gel / hyaluronic acid injection (knee)',
  'Platelet-rich plasma (PRP)',
  'Steroid injection for carpal tunnel or trigger finger',
  'Bursa or tendon injection',
  'Nerve block',
  'Spine injection (epidural, facet)',
  'Other',
];

/** US states for address dropdown */
export const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
];

/** Visit reason options (the labels of the visit types in lib/flows.js) */
export const VISIT_REASONS = VISIT_TYPES.map((v) => v.label);

/** Family history conditions relevant to orthopaedic care */
export const FAMILY_CONDITIONS = [
  'Osteoarthritis (worn-out joints, joint replacements)',
  'Rheumatoid arthritis or other inflammatory arthritis',
  'Osteoporosis or hip fracture',
  'Gout',
  'Dupuytren\'s contracture',
  'Blood clotting disorder',
  'Problems with anesthesia (malignant hyperthermia)',
  'Heart disease',
  'Stroke',
  'Cancer',
  'Diabetes',
];

/** Family relations */
export const FAMILY_RELATIONS = [
  'Mother', 'Father', 'Sister', 'Brother',
  'Maternal grandmother', 'Maternal grandfather',
  'Paternal grandmother', 'Paternal grandfather',
  'Son', 'Daughter', 'Aunt', 'Uncle',
];
