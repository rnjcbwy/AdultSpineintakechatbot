// Two fictional, fully populated intakes for tests and demos: the adult spine
// one (SAMPLE_INTAKE) and the adult orthopaedic one (SAMPLE_ORTHO_INTAKE). Nothing in here is
// a real person. Shared by the transcript render test and the local
// end-to-end submission check.
export const SAMPLE_INTAKE = {
  language: 'en',
  service: { patient: 'adult', specialty: 'spine', key: 'adult_spine', how: 'sample' },
  demographics: { firstName: 'Test', lastName: 'Patient', dob: '1965-04-12', age: '61', sex: 'Female', phone: '(201) 555-0100', email: 'test@example.invalid', address: '1 Sample St', city: 'Teaneck', state: 'NJ', zip: '07666', country: 'United States', insuranceProvider: 'Sample Health Plan', memberId: 'ABC123', referringPhysician: 'Dr. Example', primaryCarePhysician: 'Dr. Primary', visitReason: 'New problem', emergencyContactName: 'Pat Patient', emergencyContactPhone: '(201) 555-0101', emergencyContactRelation: 'Spouse' },
  chiefComplaint: { mainReason: 'Low back pain going down the right leg', symptomRegions: ['low-back', 'right-leg', 'numbness-tingling'], duration: '8 months', primaryConcern: 'Cannot walk more than two blocks', hasPriorSpineSurgery: false },
  painMap: {
    anterior: { marks: [{ id: 'm1', type: 'ache', x: 0.5, y: 0.42, zone: 'abdomen' }], paths: [] },
    posterior: { marks: [{ id: 'm2', type: 'burning', x: 0.52, y: 0.47, zone: 'lumbar spine' }, { id: 'm3', type: 'numbness', x: 0.6, y: 0.8, zone: 'right calf' }], paths: [{ id: 'p1', type: 'sharp', fromZone: 'right buttock', toZone: 'right calf', points: [{ x: 0.58, y: 0.52 }, { x: 0.6, y: 0.65 }, { x: 0.6, y: 0.8 }] }] },
    left: { marks: [], paths: [] }, right: { marks: [], paths: [] }, customTypes: [],
  },
  hpiData: {
    conversationHistory: [{ role: 'assistant', content: 'When did the leg pain start?' }, { role: 'user', content: 'About eight months ago after lifting a suitcase. It has slowly gotten worse. Es más fuerte por la noche.' }, { role: 'assistant', content: 'Does the pain go below the knee?' }, { role: 'user', content: 'Yes, to the outside of my calf and into the top of my foot. 我的脚也麻。' }],
    symptoms: { 'low-back': { onset: 'gradual, after lifting', severity: 7, quality: ['Aching', 'Sharp'], aggravating: 'walking, standing', relieving: 'sitting, leaning forward', frequency: 'daily, worse in the evening' }, 'right-leg': { radiates: true, belowKnee: true, numbness: 'lateral calf, dorsum of foot', weakness: 'no' } },
    overall: { walkingTolerance: 'two blocks', sleep: 'wakes 2-3 times a night' },
    additionalConcerns: 'Worried about needing surgery; wants to know about injections first.',
    conservativeTreatments: {
      physicalTherapy: { tried: true, facility: 'Teaneck Physical Therapy', provider: 'J. Smith, PT (201) 555-0142', duration: '8 weeks', frequency: '2x per week', helped: 'Helped temporarily', details: 'Core strengthening and McKenzie extension; relief lasted a day or two.' },
      homeExercise: { tried: true, guided: 'From PT', appService: '', duration: 'ongoing', frequency: 'most days', details: '' },
      medicationsTried: ['Anti-inflammatories (NSAIDs)', 'Nerve pain medication (gabapentin, pregabalin)'],
      chiropracticCare: { tried: true, duration: '6 visits', helped: 'Did not help' },
      acupuncture: { tried: false }, braces: { tried: false },
      injections: [{ type: 'Epidural steroid injection', when: 'March 2026', count: 1, level: 'L4-L5', facility: 'Bergen Pain', provider: 'Dr. Needle', helped: 'Helped a lot', duration: '3 weeks' }],
      priorImaging: ['MRI', 'X-ray'],
      priorEMG: { done: false },
    },
    priorSpineSurgeries: [],
  },
  authEvidence: { imagingStudies: [{ study: 'MRI', date: 'Feb 2026', facility: 'Holy Name Imaging', hasReport: true, hasImages: false }], medicationTrials: [{ drugClass: 'NSAID', name: 'Naproxen 500 mg', duration: '3 months', helped: 'Helped somewhat' }], conservativeCareStart: '2025-11', conservativeCareEnd: '', nicotineCurrent: 'Never', nicotineProduct: '', nicotineQuitDate: '', nicotineWillingToQuit: '', recordsNotes: '' },
  pastMedicalHistory: { conditions: [{ name: 'Hypertension', yearDiagnosed: '2015', details: 'controlled' }], implantedDevices: [], additionalNotes: '' },
  pastSurgicalHistory: { surgeries: [{ type: 'Appendectomy', date: '1990', bodyRegion: 'Abdomen' }] },
  medications: { current: [{ name: 'Lisinopril', dose: '10 mg', frequency: 'daily', reason: 'blood pressure' }, { name: 'Apixaban', dose: '5 mg', frequency: 'twice daily', reason: 'AFib', isAnticoagulant: true }], discontinued: [], noMedications: false },
  allergies: { entries: [{ allergen: 'Penicillin', type: 'Drug', reaction: 'rash', severity: 'moderate' }], nkda: false },
  socialHistory: { tobaccoUse: 'Never', alcoholUse: 'Occasional', drugUse: 'No', occupation: 'Teacher', workStatus: 'Working full time', livingSituation: 'With spouse', mobilityAids: 'None', exerciseLevel: 'Light', compensationCase: 'No' },
  familyHistory: { entries: [{ relation: 'Mother', condition: 'Osteoporosis' }], noRelevantHistory: false },
  reviewOfSystems: { constitutional: { fevers: 'no', nightSweats: 'no', unexplainedWeightLoss: 'no', fatigue: 'yes' } },
  proms: { odi: { answers: { pain_intensity: 3, personal_care: 1, lifting: 4, walking: 3, sitting: 2, standing: 4, sleeping: 2, sex_life: 1, social_life: 2, travelling: 3 } } },
  noteCorrections: [{ id: 'c1', excerpt: 'The patient reports the injection provided no relief.', comment: 'The injection helped a lot for three weeks.' }],
  consent: { accurate: true, financial: true, privacy: true, contact: true, signatureName: 'Test Patient', signedAt: new Date().toISOString(), representativeName: '', representativeRelationship: '' },
  documents: [{ id: 'doc_1', category: 'pt_notes', name: 'PT discharge summary.pdf', type: 'application/pdf', size: 240000 }],
};

// The orthopaedic sample, as the adult ortho intake shipped it.
export const SAMPLE_ORTHO_INTAKE = {
  language: 'en',
  service: { patient: 'adult', specialty: 'ortho', key: 'adult_ortho', how: 'sample' },
  demographics: { firstName: 'Test', lastName: 'Patient', dob: '1965-04-12', age: '61', sex: 'Female', phone: '(201) 555-0100', email: 'test@example.invalid', address: '1 Sample St', city: 'Teaneck', state: 'NJ', zip: '07666', country: 'United States', insuranceProvider: 'Sample Health Plan', memberId: 'ABC123', referringPhysician: 'Dr. Example', primaryCarePhysician: 'Dr. Primary', visitReason: 'New patient or new problem', emergencyContactName: 'Pat Patient', emergencyContactPhone: '(201) 555-0101', emergencyContactRelation: 'Spouse' },
  chiefComplaint: { mainReason: 'Right knee pain and swelling, worse on stairs, and it gives way', symptomRegions: ['right-knee', 'swelling', 'instability'], duration: '6-12 months', primaryConcern: 'Cannot walk more than two blocks or go down stairs without holding the rail', hasPriorSpineSurgery: false },
  painMap: {
    anterior: { marks: [{ id: 'm1', type: 'ache', x: 0.34, y: 0.71, zone: 'right medial knee' }, { id: 'm2', type: 'sharp', x: 0.33, y: 0.72, zone: 'right medial knee' }], paths: [] },
    posterior: { marks: [{ id: 'm3', type: 'ache', x: 0.6, y: 0.72, zone: 'right back of knee' }], paths: [] },
    left: { marks: [], paths: [] }, right: { marks: [], paths: [] }, customTypes: [],
  },
  hpiData: {
    conversationHistory: [{ role: 'assistant', content: 'When did the knee pain start?' }, { role: 'user', content: 'About eight months ago after a long hike. It has slowly gotten worse and now it swells after I walk. Es más fuerte por la noche.' }, { role: 'assistant', content: 'Does the knee lock or give way?' }, { role: 'user', content: 'It gives way on the stairs sometimes, and it is stiff for about twenty minutes every morning. 我的膝盖也会咔哒响。' }],
    problems: { knee: { kind: 'Wear and tear or arthritis', onset: '6-12 months', onsetType: 'After repetitive use or overuse', progression: 'Getting worse', severity: 6, quality: ['Aching', 'Sharp'], mechanical: ['Swelling', 'Stiffness, worst in the morning or after sitting', 'Giving way or feeling unstable', 'Clicking, popping or grinding'] } },
    primaryProblem: 'knee',
    symptoms: {},
    overall: { numbness: false, tingling: false, weakness: false, hotJoint: false, dvtSymptoms: false },
    additionalConcerns: 'Worried about needing a knee replacement; wants to know about injections first.',
    conservativeTreatments: {
      physicalTherapy: { tried: true, facility: 'Teaneck Physical Therapy', provider: 'J. Smith, PT (201) 555-0142', duration: '8 weeks', frequency: '2x per week', helped: 'Helped temporarily', details: 'Quadriceps strengthening and stretching; relief lasted a day or two.' },
      homeExercise: { tried: true, guided: 'Guided by a therapist', appService: '', duration: 'ongoing', frequency: 'most days', details: '' },
      medicationsTried: ['Anti-inflammatories (NSAIDs)', 'Acetaminophen'],
      chiropracticCare: { tried: false },
      acupuncture: { tried: false }, braces: { tried: true, type: 'Knee brace, worn for walks for 3 months', helped: 'Helped somewhat' },
      injections: [{ type: 'Steroid (cortisone) injection into the joint', when: 'March 2026', count: 1, location: 'Right knee', provider: 'Dr. Needle, Bergen Ortho', helped: 'Helped a lot', reliefDuration: '3 weeks' }],
      priorImaging: ['X-rays', 'MRI'],
      priorEMG: { done: false },
    },
    priorSpineSurgeries: [],
  },
  authEvidence: { imagingStudies: [{ study: 'MRI', date: 'Feb 2026', facility: 'Holy Name Imaging', hasReport: true, hasImages: false }], medicationTrials: [{ drugClass: 'NSAID', name: 'Naproxen 500 mg', duration: '3 months', helped: 'Helped somewhat' }], conservativeCareStart: '2025-11', conservativeCareEnd: '', nicotineCurrent: 'Never', nicotineProduct: '', nicotineQuitDate: '', nicotineWillingToQuit: '', recordsNotes: '' },
  pastMedicalHistory: { conditions: [{ name: 'Hypertension', yearDiagnosed: '2015', details: 'controlled' }], implantedDevices: [], additionalNotes: '' },
  pastSurgicalHistory: { surgeries: [{ type: 'Appendectomy', date: '1990', bodyRegion: 'Abdomen' }] },
  medications: { current: [{ name: 'Lisinopril', dose: '10 mg', frequency: 'daily', reason: 'blood pressure' }, { name: 'Apixaban', dose: '5 mg', frequency: 'twice daily', reason: 'AFib', isAnticoagulant: true }], discontinued: [], noMedications: false },
  allergies: { entries: [{ allergen: 'Penicillin', type: 'Drug', reaction: 'rash', severity: 'moderate' }], nkda: false },
  socialHistory: { tobaccoUse: 'Never', alcoholUse: 'Occasional', drugUse: 'No', occupation: 'Teacher', workStatus: 'Working full time', livingSituation: 'With spouse', mobilityAids: 'None', exerciseLevel: 'Light', compensationCase: 'No' },
  familyHistory: { entries: [{ relation: 'Mother', condition: 'Osteoarthritis (worn-out joints, joint replacements)' }], noRelevantHistory: false },
  reviewOfSystems: { constitutional: { fevers: 'no', nightSweats: 'no', unexplainedWeightLoss: 'no', fatigue: 'yes' } },
  proms: { koos_jr: { answers: { stiffness: 2, pain_twisting: 3, pain_straightening: 1, pain_stairs: 3, pain_standing: 2, fn_rising: 2, fn_bending: 2 } } },
  noteCorrections: [{ id: 'c1', excerpt: 'The patient reports the injection provided no relief.', comment: 'The injection helped a lot for three weeks.' }],
  consent: { accurate: true, financial: true, privacy: true, contact: true, signatureName: 'Test Patient', signedAt: new Date().toISOString(), representativeName: '', representativeRelationship: '' },
  documents: [{ id: 'doc_1', category: 'pt_notes', name: 'PT discharge summary.pdf', type: 'application/pdf', size: 240000 }],
};

/** The sample for a service key (lib/service.js): the spine one unless the key says ortho. */
export const sampleIntakeFor = (serviceKey) => (/_ortho$/.test(String(serviceKey || '')) ? SAMPLE_ORTHO_INTAKE : SAMPLE_INTAKE);
