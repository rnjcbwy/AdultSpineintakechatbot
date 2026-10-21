// ============================================================================
// Constants & Reference Data for Spine Intake
// ============================================================================

/**
 * Step definitions for the intake wizard. The sequence depends on the kind of
 * visit (lib/flows.js): this is the full new-patient sequence, kept for the
 * spec export and anything else that needs the complete list.
 */
import { stepsForVisit, VISIT_TYPES } from '../../flows';
export const INTAKE_STEPS = stepsForVisit('new');

/** Symptom region options with body area mapping */
export const SYMPTOM_REGIONS = [
  { id: 'neck', label: 'Neck pain', area: 'cervical' },
  { id: 'upper-back', label: 'Upper back pain', area: 'thoracic' },
  { id: 'low-back', label: 'Low back pain', area: 'lumbar' },
  { id: 'right-arm', label: 'Right arm pain', area: 'cervical' },
  { id: 'left-arm', label: 'Left arm pain', area: 'cervical' },
  { id: 'right-leg', label: 'Right leg pain', area: 'lumbar' },
  { id: 'left-leg', label: 'Left leg pain', area: 'lumbar' },
  { id: 'numbness-tingling', label: 'Numbness or tingling', area: 'general' },
  { id: 'weakness', label: 'Weakness', area: 'general' },
  { id: 'balance', label: 'Balance problems', area: 'cervical' },
  { id: 'hand-clumsiness', label: 'Hand clumsiness or dropping objects', area: 'cervical' },
  { id: 'walking-difficulty', label: 'Difficulty walking or standing', area: 'lumbar' },
  { id: 'posture-deformity', label: 'Posture or spinal curvature concerns', area: 'deformity' },
  { id: 'prior-surgery-pain', label: 'Pain after prior spine surgery', area: 'surgical' },
  { id: 'trauma', label: 'Recent injury or trauma', area: 'general' },
];

/**
 * The joint rows of the chief-complaint grid, left and right. The spine has
 * none: its regions are listed in REGION_GROUPS. The ortho service fills this.
 */
export const JOINT_ROWS = [];

/** How the chief-complaint step lays the regions out: titled groups of region ids, in order. */
export const REGION_GROUPS = [
  { id: 'spine', label: 'Spine & Back', ids: ['neck', 'upper-back', 'low-back'] },
  { id: 'limbs', label: 'Arms & Legs', ids: ['right-arm', 'left-arm', 'right-leg', 'left-leg'] },
  { id: 'other', label: 'Other Symptoms', ids: ['posture-deformity', 'prior-surgery-pain', 'trauma'] },
];

/** The chief-complaint wording that names the specialty (translated in the step's own dictionary). */
export const CHIEF_COMPLAINT_TEXT = {
  example: 'For example: "My low back hurts and the pain goes down my left leg" or "I was told I have a curved spine"',
  regionsLabel: 'Which areas are affected? Select all that apply. *',
  regionsHint: 'Choose every area where you have pain, numbness, tingling or weakness. The next step asks what it feels like.',
  priorSurgery: 'I have had prior spine surgery',
  concernPlaceholder: 'e.g., The pain in my right leg makes it hard to walk more than a block...',
};

/** The body-map wording that names the specialty (translated in the step's own dictionary). */
export const PAIN_MAP_TEXT = {
  example: 'If you have more than one kind of feeling, mark each one: for example, a dull ache in the low back and a sharp, stabbing pain down the back of the right leg. Just choose a different feeling before tapping each spot.',
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
  'Kidney disease', 'COPD / Lung disease', 'Asthma',
  'Cancer', 'Rheumatoid arthritis', 'Lupus / Autoimmune disease',
  'Depression', 'Anxiety', 'Sleep apnea', 'Bleeding disorder',
  'Blood clots / DVT / PE', 'Peripheral neuropathy',
  'Multiple sclerosis', 'Parkinson\'s disease', 'Seizure disorder / Epilepsy',
  'Fibromyalgia', 'Obesity', 'Thyroid disease', 'Liver disease',
  'HIV/AIDS', 'Hepatitis',
];

/** Implanted devices relevant to spine surgery planning */
export const IMPLANTED_DEVICES = [
  'Pacemaker', 'Defibrillator (ICD)', 'Spinal cord stimulator',
  'VP shunt', 'Baclofen pump', 'Insulin pump',
  'Cochlear implant', 'Joint replacement', 'Prior spine hardware',
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
  // Steroids
  'Prednisone', 'Methylprednisolone (Medrol)',
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
  'Epidural steroid injection (ESI)',
  'Nerve root block / transforaminal ESI',
  'Facet joint injection',
  'Medial branch block',
  'Radiofrequency ablation (RFA)',
  'Sacroiliac (SI) joint injection',
  'Trigger point injection',
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

/** Family history conditions relevant to spine */
export const FAMILY_CONDITIONS = [
  'Scoliosis or spinal deformity',
  'Degenerative spine disease',
  'Osteoporosis',
  'Rheumatoid arthritis',
  'Ankylosing spondylitis',
  'Neurological disease (MS, ALS, etc.)',
  'Blood clotting disorder',
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
