// The child's version of constants: the adult spine module, with the lists a
// child's spine visit changes declared here (a local export shadows the star
// re-export). Ported from the pediatric spine intake's structured forms
// (lib/catalog.js: PMH_OPTIONS, FAMILY_HX_OPTIONS, COMMON_MEDICATIONS,
// VISIT_GOAL_OPTIONS). Values are stored in English; the steps show them
// through t().
export * from '../spine/constants';

/** The chief-complaint wording for a parent filling the form in for a child. */
export const CHIEF_COMPLAINT_TEXT = {
  example: 'For example: "The school nurse noticed a curve in her spine" or "His shoulders look uneven and his back hurts after soccer"',
  regionsLabel: 'Which areas are affected? Select all that apply. *',
  regionsHint: 'Choose every area where your child has pain, numbness, tingling or weakness, or where the back or posture looks different. The next step asks what it feels like.',
  priorSurgery: 'My child has had prior spine surgery',
  concernPlaceholder: 'e.g., We were told the curve is 28 degrees and want to know whether a brace is needed...',
};

/** The body-map wording for a child. */
export const PAIN_MAP_TEXT = {
  example: 'If your child has more than one kind of feeling, mark each one: for example, an ache in the mid back and a sharp pain in the low back after sports. Just choose a different feeling before tapping each spot. If there is no pain, you can skip the map.',
};

/**
 * Conditions a pediatric spine history asks about, including birth and
 * developmental history. Flat, like the adult list, because the shared
 * past-medical-history step searches and lists one array.
 */
export const COMMON_CONDITIONS = [
  // Birth and development
  'Premature birth', 'NICU stay', 'Birth complications', 'Developmental delays',
  // Spine and neurological
  'Chiari malformation', 'Syringomyelia (syrinx)', 'Tethered cord', 'Spina bifida',
  'Spondylolysis or spondylolisthesis', 'Seizure disorder / Epilepsy', 'Hydrocephalus',
  // Connective tissue and genetic
  'Marfan syndrome', 'Ehlers-Danlos syndrome', 'Neurofibromatosis', 'Osteogenesis imperfecta',
  'Down syndrome', 'Other genetic syndrome', 'Connective tissue disorder', 'Skeletal dysplasia',
  // Neuromuscular
  'Cerebral palsy', 'Muscular dystrophy', 'Spinal muscular atrophy',
  // Bone and growth
  'Low bone density / Osteoporosis', 'Vitamin D deficiency / Rickets', 'Growth hormone treatment', 'Juvenile arthritis',
  // Heart and lungs
  'Asthma', 'Heart condition / murmur', 'Congenital heart disease', 'Restrictive lung disease', 'Sleep apnea',
  // Blood
  'Bleeding disorder', 'Sickle cell disease', 'Blood clotting disorder', 'Anemia',
  // Other
  'Diabetes', 'Thyroid disorder', 'Kidney disorder', 'Cancer / Leukemia', 'Chronic pain',
  'Eating disorder', 'Obesity',
  // Mental health and development
  'ADHD', 'Autism spectrum disorder', 'Anxiety', 'Depression',
];

/** Implanted devices that matter for a child's spine care and imaging. */
export const IMPLANTED_DEVICES = [
  'Spinal fusion hardware', 'Growing rods / MAGEC rods', 'Vertebral body tether (VBT)',
  'VEPTR / Rib-based growing system', 'VP shunt', 'Baclofen pump', 'Spinal cord stimulator',
  'Pacemaker', 'Cochlear implant', 'Feeding tube (G-tube)', 'Port or central line', 'Insulin pump',
];

/** Medications children with spine conditions commonly take (search suggestions). */
export const COMMON_MEDICATIONS = [
  // Pain / NSAIDs
  'Ibuprofen (Advil/Motrin)', 'Acetaminophen (Tylenol)', 'Naproxen (Aleve)', 'Aspirin',
  'Celecoxib (Celebrex)', 'Meloxicam (Mobic)', 'Diclofenac (Voltaren)', 'Ketorolac (Toradol)',
  'Indomethacin (Indocin)',
  // Opioids
  'Oxycodone', 'Hydrocodone/Acetaminophen (Norco)', 'Morphine', 'Tramadol (Ultram)',
  'Codeine', 'Hydromorphone (Dilaudid)',
  // Muscle relaxants
  'Cyclobenzaprine (Flexeril)', 'Baclofen', 'Tizanidine (Zanaflex)', 'Methocarbamol (Robaxin)',
  'Diazepam (Valium)', 'Dantrolene',
  // Nerve pain
  'Gabapentin (Neurontin)', 'Pregabalin (Lyrica)', 'Duloxetine (Cymbalta)',
  'Amitriptyline (Elavil)', 'Nortriptyline',
  // Steroids
  'Prednisone', 'Prednisolone', 'Dexamethasone (Decadron)', 'Methylprednisolone (Medrol)',
  'Hydrocortisone', 'Triamcinolone',
  // Antibiotics
  'Amoxicillin', 'Amoxicillin/Clavulanate (Augmentin)', 'Azithromycin (Zithromax/Z-Pack)',
  'Cephalexin (Keflex)', 'Cefdinir', 'Clindamycin', 'Ciprofloxacin (Cipro)',
  'Doxycycline', 'Levofloxacin (Levaquin)', 'Metronidazole (Flagyl)',
  'Sulfamethoxazole/Trimethoprim (Bactrim)', 'Penicillin', 'Nitrofurantoin (Macrobid)',
  // ADHD
  'Methylphenidate (Ritalin/Concerta)', 'Amphetamine/Dextroamphetamine (Adderall)',
  'Lisdexamfetamine (Vyvanse)', 'Atomoxetine (Strattera)', 'Guanfacine (Intuniv)',
  'Clonidine (Kapvay)',
  // Asthma / allergy
  'Albuterol (ProAir/Ventolin)', 'Fluticasone (Flovent/Flonase)', 'Montelukast (Singulair)',
  'Budesonide (Pulmicort)', 'Cetirizine (Zyrtec)', 'Loratadine (Claritin)',
  'Fexofenadine (Allegra)', 'Diphenhydramine (Benadryl)', 'Hydroxyzine (Atarax/Vistaril)',
  'Epinephrine (EpiPen)', 'Famotidine (Pepcid)',
  // GI
  'Omeprazole (Prilosec)', 'Lansoprazole (Prevacid)', 'Esomeprazole (Nexium)',
  'Ondansetron (Zofran)', 'Polyethylene Glycol (MiraLAX)', 'Docusate (Colace)',
  'Simethicone', 'Pantoprazole (Protonix)', 'Sucralfate (Carafate)',
  // Mental health
  'Sertraline (Zoloft)', 'Fluoxetine (Prozac)', 'Escitalopram (Lexapro)',
  'Citalopram (Celexa)', 'Venlafaxine (Effexor)', 'Bupropion (Wellbutrin)',
  'Buspirone (Buspar)', 'Aripiprazole (Abilify)', 'Risperidone (Risperdal)',
  'Quetiapine (Seroquel)', 'Olanzapine (Zyprexa)', 'Lamotrigine (Lamictal)',
  'Lithium', 'Alprazolam (Xanax)', 'Lorazepam (Ativan)',
  // Seizure / neuro
  'Levetiracetam (Keppra)', 'Carbamazepine (Tegretol)', 'Valproic Acid (Depakote)',
  'Topiramate (Topamax)', 'Oxcarbazepine (Trileptal)', 'Phenytoin (Dilantin)',
  'Zonisamide (Zonegran)', 'Phenobarbital',
  // Vitamins / supplements
  'Vitamin D (Cholecalciferol)', 'Calcium + Vitamin D', 'Multivitamin', 'Iron (Ferrous Sulfate)',
  'Folic Acid', 'Vitamin B12', 'Magnesium', 'Fish Oil / Omega-3', 'Melatonin', 'Zinc',
  // Hormones / endocrine
  'Levothyroxine (Synthroid)', 'Oral Contraceptive', 'Medroxyprogesterone (Depo-Provera)',
  'Growth Hormone (Somatropin)', 'Insulin', 'Metformin',
  // Bone health
  'Alendronate (Fosamax)', 'Calcium Carbonate (Tums)', 'Pamidronate', 'Zoledronic Acid (Reclast)',
  // Blood pressure / heart
  'Lisinopril', 'Amlodipine (Norvasc)', 'Atenolol (Tenormin)', 'Propranolol',
  'Metoprolol (Lopressor)', 'Losartan (Cozaar)', 'Enalapril',
  // Skin
  'Mupirocin (Bactroban)', 'Clobetasol', 'Tretinoin', 'Benzoyl Peroxide',
  // Other
  'Oseltamivir (Tamiflu)', 'Acyclovir (Zovirax)', 'Fluconazole (Diflucan)',
  'Methotrexate', 'Nifedipine', 'Sildenafil', 'Botulinum Toxin (Botox)',
  'Scopolamine Patch', 'Sumatriptan (Imitrex)', 'Rizatriptan (Maxalt)',
];

/** Family history relevant to a child's spine: deformity in relatives, connective tissue, anesthesia. */
export const FAMILY_CONDITIONS = [
  'Scoliosis',
  'Kyphosis',
  'Spondylolysis or spondylolisthesis',
  'Spina bifida',
  'Other spine condition',
  'Marfan syndrome',
  'Ehlers-Danlos syndrome',
  'Loeys-Dietz syndrome',
  'Osteogenesis imperfecta',
  'Neurofibromatosis',
  'Down syndrome',
  'Chiari malformation',
  'Skeletal dysplasia / Dwarfism',
  'Muscular dystrophy',
  'Cerebral palsy',
  'Spinal muscular atrophy',
  'Malignant hyperthermia',
  'Anesthesia complications',
  'Blood clot / DVT',
  'Bleeding disorder',
  'Osteoporosis',
  'Hip dysplasia',
  'Clubfoot',
  'Heart disease',
  'Cancer',
  'Autoimmune disorder',
  'Diabetes',
];

/** Family relations, from the child's side. */
export const FAMILY_RELATIONS = [
  'Mother', 'Father', 'Sister', 'Brother', 'Half-sibling',
  'Maternal grandmother', 'Maternal grandfather',
  'Paternal grandmother', 'Paternal grandfather',
  'Aunt', 'Uncle', 'Cousin',
];

/** What families hope for from a pediatric spine visit (the source's visit goals). */
export const VISIT_REASONS = [
  'Understand the diagnosis',
  'Discuss treatment options',
  'Get a second opinion',
  'Evaluate for surgery',
  'Bracing evaluation',
  'Pain management',
  'Monitor curve progression',
  'Address cosmetic concerns',
  'Discuss activity or sports restrictions',
];
