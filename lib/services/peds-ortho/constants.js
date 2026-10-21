// ============================================================================
// Constants for the pediatric orthopaedic service.
//
// The adult ortho module is the base (symptom regions, the joint grid, pain
// qualities, injection types, states); a local export here shadows the star
// re-export, so only what a child's visit changes is written out: the past
// medical history list with birth and developmental history, a family
// history that looks for dysplasia, connective-tissue and neuromuscular
// conditions, the medicines children actually take, the sports a child
// plays, and the chip lists of the fracture-clinic track (ported from
// peds-ortho-intake app/page.jsx).
// ============================================================================

export * from '../ortho/constants';

/** The chief-complaint wording for a parent answering about a child. */
export const CHIEF_COMPLAINT_TEXT = {
  example: 'For example: "She fell off the monkey bars and her wrist is swollen" or "He has been limping for two weeks and we are not sure why" or "The pediatrician noticed his feet turn in"',
  regionsLabel: 'Which joint or area is affected? Tap the side. *',
  regionsHint: 'Choose every joint where your child has pain, swelling, stiffness, numbness, weakness or a change in shape. The next step asks what it is like.',
  priorSurgery: 'My child has had surgery on this bone or joint before',
  concernPlaceholder: 'e.g., She cannot keep up with the other kids at recess...',
};

export const PAIN_MAP_TEXT = {
  example: 'If your child has more than one kind of feeling, mark each one: for example, an ache deep in the right hip and a sharp pain at the front of the knee. Just choose a different feeling before tapping each spot.',
};

/* --- Past medical history for a child ----------------------------------- */

/** PMH, by category. The flat COMMON_CONDITIONS list below is what the shared step shows. */
export const PMH_OPTIONS = [
  { condition: 'Premature birth', category: 'Birth & Development' },
  { condition: 'NICU stay', category: 'Birth & Development' },
  { condition: 'Breech presentation at birth', category: 'Birth & Development' },
  { condition: 'Birth complications', category: 'Birth & Development' },
  { condition: 'Delayed walking (after 18 months)', category: 'Birth & Development' },
  { condition: 'Developmental delays', category: 'Birth & Development' },
  { condition: 'Early intervention services', category: 'Birth & Development' },
  { condition: 'Hip dysplasia / DDH', category: 'Orthopaedic' },
  { condition: 'Prior fracture', category: 'Orthopaedic' },
  { condition: 'Recurrent fractures', category: 'Orthopaedic' },
  { condition: 'Clubfoot', category: 'Orthopaedic' },
  { condition: 'Limb length difference', category: 'Orthopaedic' },
  { condition: 'Juvenile arthritis', category: 'Orthopaedic' },
  { condition: 'Bone or joint infection', category: 'Orthopaedic' },
  { condition: 'Growth plate injury', category: 'Orthopaedic' },
  { condition: 'Scoliosis or other spine condition', category: 'Orthopaedic' },
  { condition: 'Cerebral palsy', category: 'Neuromuscular' },
  { condition: 'Muscular dystrophy', category: 'Neuromuscular' },
  { condition: 'Spinal muscular atrophy', category: 'Neuromuscular' },
  { condition: 'Spina bifida', category: 'Neuromuscular' },
  { condition: 'Hypotonia / low muscle tone', category: 'Neuromuscular' },
  { condition: 'Seizure disorder', category: 'Neuromuscular' },
  { condition: 'Marfan syndrome', category: 'Connective Tissue & Genetic' },
  { condition: 'Ehlers-Danlos syndrome', category: 'Connective Tissue & Genetic' },
  { condition: 'Joint hypermobility', category: 'Connective Tissue & Genetic' },
  { condition: 'Osteogenesis imperfecta', category: 'Connective Tissue & Genetic' },
  { condition: 'Skeletal dysplasia / Achondroplasia', category: 'Connective Tissue & Genetic' },
  { condition: 'Neurofibromatosis', category: 'Connective Tissue & Genetic' },
  { condition: 'Down syndrome', category: 'Connective Tissue & Genetic' },
  { condition: 'Other genetic syndrome', category: 'Connective Tissue & Genetic' },
  { condition: 'Osteoporosis / Low bone density', category: 'Bone & Growth' },
  { condition: 'Vitamin D deficiency / Rickets', category: 'Bone & Growth' },
  { condition: 'Growth hormone treatment', category: 'Bone & Growth' },
  { condition: 'Short stature / growth concerns', category: 'Bone & Growth' },
  { condition: 'Obesity', category: 'Bone & Growth' },
  { condition: 'Asthma', category: 'Heart & Lungs' },
  { condition: 'Heart condition / murmur', category: 'Heart & Lungs' },
  { condition: 'Congenital heart disease', category: 'Heart & Lungs' },
  { condition: 'Sleep apnea', category: 'Heart & Lungs' },
  { condition: 'Bleeding disorder', category: 'Blood' },
  { condition: 'Sickle cell disease', category: 'Blood' },
  { condition: 'Blood clotting disorder', category: 'Blood' },
  { condition: 'Anemia', category: 'Blood' },
  { condition: 'Diabetes', category: 'Other Medical' },
  { condition: 'Thyroid disorder', category: 'Other Medical' },
  { condition: 'Kidney disorder', category: 'Other Medical' },
  { condition: 'Cancer / Leukemia', category: 'Other Medical' },
  { condition: 'Chronic pain', category: 'Other Medical' },
  { condition: 'Frequent infections', category: 'Other Medical' },
  { condition: 'Problems with anesthesia (the child or a relative)', category: 'Other Medical' },
  { condition: 'ADHD', category: 'Mental Health' },
  { condition: 'Autism spectrum disorder', category: 'Mental Health' },
  { condition: 'Anxiety', category: 'Mental Health' },
  { condition: 'Depression', category: 'Mental Health' },
  { condition: 'Sensory processing differences', category: 'Mental Health' },
];

export const PMH_CATEGORIES = [
  'Birth & Development', 'Orthopaedic', 'Neuromuscular', 'Connective Tissue & Genetic',
  'Bone & Growth', 'Heart & Lungs', 'Blood', 'Other Medical', 'Mental Health',
];

/** The PMH checklist the shared step shows, in category order. */
export const COMMON_CONDITIONS = PMH_OPTIONS.map((o) => o.condition);

/** Hardware and devices that matter before a child's operation or imaging. */
export const IMPLANTED_DEVICES = [
  'Plates, screws, rods or pins from a fracture',
  'Growth plate (guided growth) plates',
  'Spinal rods or other spine hardware',
  'Baclofen pump',
  'Shunt (VP shunt)',
  'Pacemaker',
  'Cochlear implant',
  'Insulin pump',
  'Metal allergy or sensitivity',
];

/** Past surgeries, by category (the shared surgical-history step is free text; kept for the note and the review). */
export const PSH_OPTIONS = [
  { condition: 'Hip surgery (any)', category: 'Hip & Lower Limb' },
  { condition: 'Hip dysplasia surgery / osteotomy', category: 'Hip & Lower Limb' },
  { condition: 'SCFE pinning', category: 'Hip & Lower Limb' },
  { condition: 'Femoral or tibial osteotomy', category: 'Hip & Lower Limb' },
  { condition: 'Guided growth / growth plate tethering (8-plate)', category: 'Hip & Lower Limb' },
  { condition: 'Limb lengthening', category: 'Hip & Lower Limb' },
  { condition: 'Knee arthroscopy', category: 'Knee' },
  { condition: 'ACL reconstruction', category: 'Knee' },
  { condition: 'Meniscus surgery', category: 'Knee' },
  { condition: 'Patellar stabilization / MPFL reconstruction', category: 'Knee' },
  { condition: 'Clubfoot surgery', category: 'Foot & Ankle' },
  { condition: 'Achilles tenotomy (Ponseti)', category: 'Foot & Ankle' },
  { condition: 'Heel cord / Achilles lengthening', category: 'Foot & Ankle' },
  { condition: 'Flatfoot reconstruction', category: 'Foot & Ankle' },
  { condition: 'Toe surgery', category: 'Foot & Ankle' },
  { condition: 'Shoulder surgery', category: 'Upper Extremity' },
  { condition: 'Elbow surgery', category: 'Upper Extremity' },
  { condition: 'Hand or wrist surgery', category: 'Upper Extremity' },
  { condition: 'Extra digit removal (polydactyly)', category: 'Upper Extremity' },
  { condition: 'Brachial plexus surgery', category: 'Upper Extremity' },
  { condition: 'Fracture fixation (pins, plates, rods)', category: 'Trauma & Hardware' },
  { condition: 'Closed reduction under anesthesia', category: 'Trauma & Hardware' },
  { condition: 'Hardware removal', category: 'Trauma & Hardware' },
  { condition: 'Casting under anesthesia', category: 'Trauma & Hardware' },
  { condition: 'Tendon lengthening or transfer', category: 'Neuromuscular & Other Ortho' },
  { condition: 'Botox injections for spasticity', category: 'Neuromuscular & Other Ortho' },
  { condition: 'Baclofen pump', category: 'Neuromuscular & Other Ortho' },
  { condition: 'Selective dorsal rhizotomy', category: 'Neuromuscular & Other Ortho' },
  { condition: 'Bone biopsy or tumor surgery', category: 'Neuromuscular & Other Ortho' },
  { condition: 'Joint washout for infection', category: 'Neuromuscular & Other Ortho' },
  { condition: 'Spine surgery', category: 'Neuromuscular & Other Ortho' },
  { condition: 'Tonsillectomy / Adenoidectomy', category: 'General Pediatric' },
  { condition: 'Ear tubes (myringotomy)', category: 'General Pediatric' },
  { condition: 'Appendectomy', category: 'General Pediatric' },
  { condition: 'Hernia repair', category: 'General Pediatric' },
  { condition: 'Dental surgery', category: 'General Pediatric' },
  { condition: 'Eye surgery', category: 'General Pediatric' },
  { condition: 'Cardiac surgery', category: 'Other' },
  { condition: 'Abdominal surgery', category: 'Other' },
  { condition: 'Neurosurgery', category: 'Other' },
  { condition: 'Tumor removal / Biopsy', category: 'Other' },
];

/* --- Medicines children take -------------------------------------------- */

export const COMMON_MEDICATIONS = [
  // Pain and fever
  'Acetaminophen (Tylenol)', 'Ibuprofen (Motrin/Advil)', 'Naproxen (Aleve)',
  'Oxycodone', 'Hydrocodone/Acetaminophen', 'Tramadol',
  // Bone health and growth
  'Vitamin D', 'Calcium', 'Multivitamin', 'Iron', 'Growth hormone',
  // Breathing and allergy
  'Albuterol inhaler', 'Fluticasone (Flovent)', 'Montelukast (Singulair)',
  'Cetirizine (Zyrtec)', 'Loratadine (Claritin)', 'Epinephrine auto-injector (EpiPen)',
  // Attention, mood and sleep
  'Methylphenidate (Ritalin/Concerta)', 'Amphetamine (Adderall/Vyvanse)', 'Guanfacine (Intuniv)',
  'Clonidine', 'Sertraline (Zoloft)', 'Fluoxetine (Prozac)', 'Melatonin',
  // Seizures and tone
  'Levetiracetam (Keppra)', 'Oxcarbazepine (Trileptal)', 'Baclofen', 'Diazepam (Valium)',
  // Arthritis and immune
  'Methotrexate', 'Biologic for juvenile arthritis (Humira, Enbrel, etc.)', 'Prednisone',
  // Other
  'Levothyroxine', 'Insulin', 'Omeprazole (Prilosec)', 'Polyethylene glycol (Miralax)',
  'Hydroxyurea (sickle cell)', 'Aspirin',
];

/* --- Family history ----------------------------------------------------- */

export const FAMILY_HX_OPTIONS = [
  { condition: 'Hip dysplasia / DDH', category: 'Orthopaedic' },
  { condition: 'Clubfoot', category: 'Orthopaedic' },
  { condition: 'Flat feet', category: 'Orthopaedic' },
  { condition: 'Bow legs / knock knees', category: 'Orthopaedic' },
  { condition: 'Limb length difference', category: 'Orthopaedic' },
  { condition: 'Early joint replacement', category: 'Orthopaedic' },
  { condition: 'Scoliosis or other spine condition', category: 'Orthopaedic' },
  { condition: 'Perthes disease', category: 'Orthopaedic' },
  { condition: 'Marfan syndrome', category: 'Connective Tissue' },
  { condition: 'Ehlers-Danlos syndrome', category: 'Connective Tissue' },
  { condition: 'Loeys-Dietz syndrome', category: 'Connective Tissue' },
  { condition: 'Joint hypermobility', category: 'Connective Tissue' },
  { condition: 'Osteogenesis imperfecta', category: 'Connective Tissue' },
  { condition: 'Skeletal dysplasia / Dwarfism', category: 'Genetic' },
  { condition: 'Neurofibromatosis', category: 'Genetic' },
  { condition: 'Down syndrome', category: 'Genetic' },
  { condition: 'Other genetic syndrome', category: 'Genetic' },
  { condition: 'Muscular dystrophy', category: 'Neuromuscular' },
  { condition: 'Cerebral palsy', category: 'Neuromuscular' },
  { condition: 'Spinal muscular atrophy', category: 'Neuromuscular' },
  { condition: 'Charcot-Marie-Tooth', category: 'Neuromuscular' },
  { condition: 'Malignant hyperthermia', category: 'Anesthesia' },
  { condition: 'Anesthesia complications', category: 'Anesthesia' },
  { condition: 'Blood clot / DVT', category: 'Anesthesia' },
  { condition: 'Bleeding disorder', category: 'Other' },
  { condition: 'Osteoporosis', category: 'Other' },
  { condition: 'Juvenile or rheumatoid arthritis', category: 'Other' },
  { condition: 'Autoimmune disorder', category: 'Other' },
  { condition: 'Heart disease', category: 'Other' },
  { condition: 'Cancer', category: 'Other' },
  { condition: 'Diabetes', category: 'Other' },
];

/** The family-history checklist the shared step shows. */
export const FAMILY_CONDITIONS = FAMILY_HX_OPTIONS.map((o) => o.condition);

export const FAMILY_RELATIONS = [
  'Mother', 'Father', 'Sister', 'Brother',
  'Maternal grandmother', 'Maternal grandfather',
  'Paternal grandmother', 'Paternal grandfather',
  'Aunt', 'Uncle', 'Cousin',
];

/**
 * Family history that changes what is done about a broken bone: how easily
 * the bone broke, whether it will bleed or heal badly, and whether
 * anaesthesia is safe. The fracture-clinic track asks only these.
 */
export const FRACTURE_FAMILY_HX = [
  'Osteogenesis imperfecta',
  'Osteoporosis',
  'Skeletal dysplasia / Dwarfism',
  'Ehlers-Danlos syndrome',
  'Joint hypermobility',
  'Bleeding disorder',
  'Juvenile or rheumatoid arthritis',
  'Malignant hyperthermia',
  'Anesthesia complications',
];

/* --- School, sport and activity ----------------------------------------- */

export const SPORTS_OPTIONS = [
  'Gymnastics', 'Dance', 'Swimming', 'Basketball', 'Soccer', 'Football',
  'Cheerleading', 'Running / Track', 'Baseball / Softball', 'Volleyball',
  'Tennis', 'Martial arts', 'Yoga / Pilates', 'Hockey', 'Lacrosse',
  'Wrestling', 'Weight training', 'Cycling', 'Skiing / Snowboarding',
  'Skateboarding', 'Climbing', 'Horseback riding',
];

export const ACTIVITY_LEVELS = ['Sedentary', 'Light activity', 'Moderate activity', 'Very active', 'Competitive athlete'];

export const VISIT_GOAL_OPTIONS = [
  'Understand my child\'s diagnosis',
  'Discuss treatment options',
  'Get a second opinion',
  'Evaluate for surgery',
  'Find out if this will get better on its own',
  'Pain management',
  'Bracing, casting, or orthotics',
  'Physical therapy guidance',
  'Return to sports / clearance',
  'Follow-up on a prior injury or surgery',
  'Discuss activity restrictions',
];

/* --- The fracture clinic: a new injury ---------------------------------- */

/** Common ways children break bones, offered as chips so a parent can tap rather than compose. */
export const MECHANISM_CHIPS = [
  'Fell from standing or running', 'Fell from a height', 'Fell off playground equipment',
  'Trampoline', 'Bicycle or scooter', 'Sports collision', 'Twisted it',
  'Landed awkwardly', 'Direct hit', 'Car accident', 'Not sure / did not see it',
];

export const BODY_PART_CHIPS = [
  'Collarbone', 'Shoulder', 'Upper arm', 'Elbow', 'Forearm', 'Wrist', 'Hand or finger',
  'Hip', 'Thigh', 'Knee', 'Lower leg', 'Ankle', 'Foot or toe',
];

/** The body parts of the arm, for the hand-dominance question and the upper-limb questionnaire. */
export const UPPER_LIMB_PARTS = ['Collarbone', 'Shoulder', 'Upper arm', 'Elbow', 'Forearm', 'Wrist', 'Hand or finger'];

/**
 * The symptom-region area (lib/services/ortho/constants.js SYMPTOM_REGIONS)
 * each body part belongs to: one row of the chief-complaint grid each, the
 * collarbone with the shoulder. 'Hip or thigh' was one chip in older drafts.
 */
export const BODY_PART_AREA = {
  'Collarbone': 'shoulder', 'Shoulder': 'shoulder', 'Upper arm': 'arm', 'Elbow': 'elbow',
  'Forearm': 'forearm', 'Wrist': 'wrist', 'Hand or finger': 'hand',
  'Hip': 'hip', 'Thigh': 'thigh', 'Hip or thigh': 'hip', 'Knee': 'knee', 'Lower leg': 'leg', 'Ankle': 'ankle', 'Foot or toe': 'foot',
};

export const SIDE_CHIPS = ['Left', 'Right', 'Both', 'Not sure'];

export const HAND_DOMINANCE = ['Right-handed', 'Left-handed', 'Either / too young to tell'];

export const USE_AFTER = ['Yes, normally', 'Yes, but carefully', 'No, not at all'];

export const POP_CRACK = ['Yes', 'No', 'Not sure'];

export const SWELLING_CHIPS = [
  'Swelling', 'Bruising', 'Looks crooked or out of place', 'Open wound or cut',
  'Numbness or tingling', 'Fingers/toes look pale or blue',
];

export const SEEN_WHERE_CHIPS = [
  'Emergency room', 'Urgent care', 'Pediatrician', 'Another orthopaedist', 'Nowhere yet',
];

export const IMAGING_DONE = ['Yes', 'No, not yet', 'Not sure'];

export const FRACTURE_TREATMENT_CHIPS = [
  'Cast', 'Splint', 'Walking boot', 'Sling', 'Brace', 'Bone was set (reduced)',
  'Surgery', 'Crutches', 'Nothing yet',
];

export const STILL_ON = ['Yes', 'No, it came off', 'Not applicable'];

/* --- The fracture clinic: the cast check -------------------------------- */

export const FX_TREATMENT_CHIPS = [
  'Cast', 'Splint', 'Sling', 'Boot or walking cast', 'Brace', 'Buddy taping',
  'Surgery with pins', 'Surgery with a plate or screws', 'The bone was set without surgery',
  'Nothing — just rest',
];

export const FX_STILL_ON = [
  'Yes, still on',
  'No, it was taken off at a visit',
  'No, it came off on its own or we removed it',
  'There was never one',
];

/**
 * The things that go wrong inside a cast between visits. Worth asking
 * explicitly: a parent will not volunteer "it smells" but will tick it, and
 * a tight cast or a sore underneath is the reason to be seen sooner.
 */
export const CAST_PROBLEM_CHIPS = [
  'Feels too tight', 'Feels too loose or slipping', 'Got wet', 'Cracked or broken',
  'A bad smell', 'Skin sore or red at the edges', 'Itching a lot',
  'Something was pushed down inside it', 'It came off early', 'No problems at all',
];

export const LIMB_WARNING_CHIPS = [
  'Numbness', 'Pins and needles', 'Fingers or toes look pale or blue',
  'Fingers or toes feel cold', 'New or worse swelling', 'Cannot move the fingers or toes',
  'Fever', 'None of these',
];

export const PAIN_TREND = ['Better', 'About the same', 'Worse'];

export const USING_LIMB = ['Normally', 'A little, carefully', 'Not at all'];

export const IMAGING_SINCE = ['No', 'Yes, an X-ray', 'Yes, something else', 'Not sure'];

/* --- After an operation ------------------------------------------------- */

export const RECOVERY_TREND = ['Better than we expected', 'About as expected', 'Harder than we expected'];

/*
 * What the wound looks like. Fever is deliberately not here: it is in the
 * events list below, and offering it twice let a parent tick it in one place
 * and not the other, which reads in the note as a contradiction nobody made.
 */
export const WOUND_CHIPS = [
  'Leaking or draining', 'Redness spreading outwards', 'Edges coming apart',
  'A bad smell', 'More swollen than before', 'Stitches or staples coming out',
  'The wound looks fine',
];

export const DRESSING = [
  'The original dressing, untouched',
  'A dressing we have been changing at home',
  'A cast or splint',
  'Nothing, it is open to the air',
];

export const POSTOP_PAIN_MEDS = ['No, nothing', 'Over-the-counter only', 'Still using the prescription'];

export const THERAPY_STARTED = ['Yes', 'Not yet, but it is booked', 'No', 'We were told it is not needed'];

export const RESTRICTION_CHIPS = [
  'No weight on the leg at all', 'Some weight allowed', 'Crutches or a walker',
  'Sling at all times', 'Brace or splint at all times', 'No PE or sports',
  'No restrictions given',
];

export const FOLLOWING_RESTRICTIONS = ['Yes, no trouble', 'Mostly', 'No, it has been hard'];

export const POSTOP_EVENT_CHIPS = [
  'Fever', 'Being sick / vomiting', 'A fall', 'Went back to the emergency room',
  'Stayed overnight in hospital again', 'Nothing like that',
];
