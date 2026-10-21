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
 * Symptom region options, in body order. Limb entries carry a side (the
 * body map confirms it); the pelvis and the tailbone have none; the general
 * entries describe a quality or context and ride along with whatever place
 * was chosen. `area` folds the sides into one problem (problems.js) so the
 * questions are asked once per place, and names the sided id
 * (`${side}-${area}`), which the fracture steps and the body map rely on.
 *
 * Older drafts hold `right-hand` ("hand, wrist or fingers") and `right-foot`
 * ("ankle or foot"); those ids stay, narrowed to the hand and the foot now
 * that the wrist and the ankle are rows of their own. The SI joint is stored
 * as `right-si` and `left-si`; "Both" on the chief-complaint step taps both,
 * so no third id is needed.
 */
export const SYMPTOM_REGIONS = [
  { id: 'right-shoulder', label: 'Right shoulder', area: 'shoulder', side: 'right', joint: 'Shoulder' },
  { id: 'left-shoulder', label: 'Left shoulder', area: 'shoulder', side: 'left', joint: 'Shoulder' },
  { id: 'right-arm', label: 'Right upper arm', area: 'arm', side: 'right', joint: 'Upper arm' },
  { id: 'left-arm', label: 'Left upper arm', area: 'arm', side: 'left', joint: 'Upper arm' },
  { id: 'right-elbow', label: 'Right elbow', area: 'elbow', side: 'right', joint: 'Elbow' },
  { id: 'left-elbow', label: 'Left elbow', area: 'elbow', side: 'left', joint: 'Elbow' },
  { id: 'right-forearm', label: 'Right forearm', area: 'forearm', side: 'right', joint: 'Forearm' },
  { id: 'left-forearm', label: 'Left forearm', area: 'forearm', side: 'left', joint: 'Forearm' },
  { id: 'right-wrist', label: 'Right wrist', area: 'wrist', side: 'right', joint: 'Wrist' },
  { id: 'left-wrist', label: 'Left wrist', area: 'wrist', side: 'left', joint: 'Wrist' },
  { id: 'right-hand', label: 'Right hand or fingers', area: 'hand', side: 'right', joint: 'Hand or fingers' },
  { id: 'left-hand', label: 'Left hand or fingers', area: 'hand', side: 'left', joint: 'Hand or fingers' },
  { id: 'right-hip', label: 'Right hip', area: 'hip', side: 'right', joint: 'Hip' },
  { id: 'left-hip', label: 'Left hip', area: 'hip', side: 'left', joint: 'Hip' },
  { id: 'right-thigh', label: 'Right thigh', area: 'thigh', side: 'right', joint: 'Thigh' },
  { id: 'left-thigh', label: 'Left thigh', area: 'thigh', side: 'left', joint: 'Thigh' },
  { id: 'right-knee', label: 'Right knee', area: 'knee', side: 'right', joint: 'Knee' },
  { id: 'left-knee', label: 'Left knee', area: 'knee', side: 'left', joint: 'Knee' },
  { id: 'right-leg', label: 'Right lower leg (shin or calf)', area: 'leg', side: 'right', joint: 'Lower leg (shin or calf)' },
  { id: 'left-leg', label: 'Left lower leg (shin or calf)', area: 'leg', side: 'left', joint: 'Lower leg (shin or calf)' },
  { id: 'right-ankle', label: 'Right ankle', area: 'ankle', side: 'right', joint: 'Ankle' },
  { id: 'left-ankle', label: 'Left ankle', area: 'ankle', side: 'left', joint: 'Ankle' },
  { id: 'right-foot', label: 'Right foot or toes', area: 'foot', side: 'right', joint: 'Foot or toes' },
  { id: 'left-foot', label: 'Left foot or toes', area: 'foot', side: 'left', joint: 'Foot or toes' },
  { id: 'pelvis', label: 'Pelvis', area: 'pelvis' },
  { id: 'tailbone', label: 'Tailbone (sacrum)', area: 'tailbone' },
  { id: 'right-si', label: 'Right SI joint', area: 'si', side: 'right', joint: 'SI joint' },
  { id: 'left-si', label: 'Left SI joint', area: 'si', side: 'left', joint: 'SI joint' },
  { id: 'neck-back', label: 'Neck or back', area: 'spine' },
  { id: 'numbness-tingling', label: 'Numbness or tingling', area: 'general' },
  { id: 'weakness', label: 'Weakness', area: 'general' },
  { id: 'swelling', label: 'Swelling', area: 'general' },
  { id: 'instability', label: 'Giving way, locking or catching', area: 'general' },
  { id: 'deformity', label: 'A bump, lump or change in shape', area: 'general' },
  { id: 'prior-surgery-pain', label: 'Pain after a prior operation', area: 'surgical' },
  { id: 'trauma', label: 'Recent injury, fall or broken bone', area: 'general' },
];

/** The limb rows of the chief-complaint grid, left and right, in body order. */
export const JOINT_ROWS = [
  'Shoulder', 'Upper arm', 'Elbow', 'Forearm', 'Wrist', 'Hand or fingers',
  'Hip', 'Thigh', 'Knee', 'Lower leg (shin or calf)', 'Ankle', 'Foot or toes',
].map((joint) => ({
  joint,
  left: SYMPTOM_REGIONS.find((r) => r.joint === joint && r.side === 'left').id,
  right: SYMPTOM_REGIONS.find((r) => r.joint === joint && r.side === 'right').id,
}));

/**
 * The pelvis rows under the limb grid, before "Neck or back". A `wide` row is
 * one button for a region with no side (the pelvis, the tailbone); a `both`
 * row offers Left / Right / Both, where Both taps both sided ids (the SI
 * joint). The spine service exports an empty list.
 */
export const PELVIS_ROWS = [
  { kind: 'wide', id: 'pelvis' },
  { kind: 'wide', id: 'tailbone' },
  { kind: 'both', joint: 'SI joint', left: 'left-si', right: 'right-si' },
];

/** How the chief-complaint step lays the remaining regions out, after the joint grid: titled groups of region ids. */
export const REGION_GROUPS = [
  { id: 'extra', label: 'What else describes it?', ids: ['numbness-tingling', 'weakness', 'swelling', 'instability', 'deformity', 'prior-surgery-pain', 'trauma'] },
];

/**
 * The triage step's region taps (lib/service.js TRIAGE_REGIONS) as this
 * service's symptom regions, so the chief-complaint step starts pre-filled.
 *
 *   neck, back, posture -> neck-back
 *   pelvis ("Pelvis or tailbone") -> pelvis and tailbone, for the patient to
 *     narrow on the chief-complaint step
 *   shoulder, arm, elbow, forearm, wrist, hand, hip, thigh, knee, leg, ankle,
 *     foot, si -> the row of that name, returned in `joints`: the triage does
 *     not ask the side, so the chief-complaint step asks only that, and the
 *     sided region id (right-knee, left-knee) is written once the patient
 *     taps it.
 */
const TRIAGE_JOINT_MAP = {
  shoulder: 'Shoulder', arm: 'Upper arm', elbow: 'Elbow', forearm: 'Forearm', wrist: 'Wrist', hand: 'Hand or fingers',
  hip: 'Hip', thigh: 'Thigh', knee: 'Knee', leg: 'Lower leg (shin or calf)', ankle: 'Ankle', foot: 'Foot or toes',
  si: 'SI joint',
};
export function regionsFromTriage(triageRegions = []) {
  const regions = [];
  if (triageRegions.some((id) => ['neck', 'back', 'posture'].includes(id))) regions.push('neck-back');
  if (triageRegions.includes('pelvis')) regions.push('pelvis', 'tailbone');
  if (triageRegions.includes('fracture')) regions.push('trauma');
  const joints = [...new Set(triageRegions.map((id) => TRIAGE_JOINT_MAP[id]).filter(Boolean))];
  return { regions, joints };
}

/** The chief-complaint wording that names the specialty (translated in the step's own dictionary). */
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
