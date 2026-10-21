// ============================================================================
// Document categories for the records the patient attaches.
//
// Shared by the browser (upload step, packet builder) and the server (intake
// transcript PDF, Practice Hub hand-off). lib/documents.js is a client module
// (IndexedDB), so the constants live here where server code can import them.
// ============================================================================

/**
 * Packet structure. Each category becomes a subfolder in the exported ZIP and
 * a chapter in the combined PDF, and maps to the canonical evidence ID that
 * payer criteria are written against.
 */
export const DOCUMENT_CATEGORIES = [
  {
    id: 'pt_notes',
    folder: '01_Physical_Therapy',
    label: 'Physical therapy notes',
    evidenceId: 'pt_supervised',
    hint: 'Visit notes, evaluation, or discharge summary showing dates, frequency, and your response.',
  },
  {
    id: 'injection_records',
    folder: '02_Injections_Procedures',
    label: 'Injection & procedure records',
    evidenceId: 'injection_esi',
    hint: 'Procedure notes showing the level injected, the date, and how long relief lasted.',
  },
  {
    id: 'imaging_reports',
    folder: '03_Imaging_Reports',
    label: 'Imaging reports (MRI, CT, X-ray)',
    evidenceId: 'imaging_mri',
    hint: "If you have pictures or screenshots of your X-rays or other imaging, feel free to upload them here. If the imaging was done at a facility outside our system, please also try to get the actual images on a CD and bring it to your appointment. If you have the radiologist's report, please upload that here too.",
  },
  {
    id: 'emg_report',
    folder: '04_EMG_Nerve_Study',
    label: 'EMG / nerve conduction study',
    evidenceId: 'emg_ncs',
    hint: 'The full report from your nerve study.',
  },
  {
    id: 'operative_reports',
    folder: '05_Prior_Operative_Reports',
    label: 'Prior operative reports',
    evidenceId: 'prior_op_report',
    hint: 'Operative notes from any previous spine surgery.',
  },
  {
    id: 'outside_notes',
    folder: '06_Outside_Provider_Notes',
    label: 'Other provider notes',
    evidenceId: 'medication_trial',
    hint: 'Office notes from your primary care doctor, pain management, chiropractor, or neurologist.',
  },
  {
    id: 'other',
    folder: '07_Other',
    label: 'Anything else',
    evidenceId: null,
    hint: 'Any other records you think would help.',
  },
];

/**
 * What the bone-and-joint service says differently: the same categories and
 * ids, with the hints written for joints rather than spine levels and the
 * injection evidence named the way the ortho payer rules name it. The shared
 * list above stays the spine wording, so server code that does not know the
 * service (the transcript PDF, the Practice Hub hand-off) keeps its labels.
 */
const SPECIALTY_OVERRIDES = {
  spine: {},
  ortho: {
    injection_records: {
      evidenceId: 'injection_steroid',
      hint: 'Procedure notes showing the joint injected, the date, and how long relief lasted.',
    },
    imaging_reports: { label: 'Imaging reports (X-ray, MRI, CT, ultrasound)' },
    operative_reports: { hint: 'Operative notes from any previous bone or joint surgery.' },
    outside_notes: {
      hint: 'Office notes from your primary care doctor, the emergency room or urgent care, a rheumatologist, pain management, or a physical therapist.',
    },
  },
};

/** The categories as the patient sees them for a service's specialty ('spine' | 'ortho'). */
export function documentCategoriesFor(specialty = 'spine') {
  const over = SPECIALTY_OVERRIDES[specialty] || {};
  return DOCUMENT_CATEGORIES.map((c) => (over[c.id] ? { ...c, ...over[c.id] } : c));
}

export function categoryLabel(id) {
  return DOCUMENT_CATEGORIES.find((c) => c.id === id)?.label || 'Other';
}
