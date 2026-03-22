// ============================================================================
// Constants & Reference Data for Spine Intake
// ============================================================================

/** Step definitions for the intake wizard */
export const INTAKE_STEPS = [
  { id: 'welcome', label: 'Welcome', icon: '1' },
  { id: 'demographics', label: 'Demographics', icon: '2' },
  { id: 'chief-complaint', label: 'Chief Complaint', icon: '3' },
  { id: 'hpi', label: 'History of Present Illness', icon: '4' },
  { id: 'pmh', label: 'Past Medical History', icon: '5' },
  { id: 'psh', label: 'Past Surgical History', icon: '6' },
  { id: 'medications', label: 'Medications', icon: '7' },
  { id: 'allergies', label: 'Allergies', icon: '8' },
  { id: 'social', label: 'Social History', icon: '9' },
  { id: 'family', label: 'Family History', icon: '10' },
  { id: 'ros', label: 'Review of Systems', icon: '11' },
  { id: 'review', label: 'Review & Submit', icon: '12' },
];

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

/** Visit reason options */
export const VISIT_REASONS = [
  'New patient evaluation',
  'Second opinion',
  'Follow-up visit',
  'Post-operative follow-up',
  'Referred for surgical evaluation',
  'Other',
];

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
