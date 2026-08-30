// ============================================================================
// Document storage for prior-authorization records.
//
// Files live in IndexedDB (native Blob support, hundreds of MB) rather than
// localStorage (~5MB of strings — a single scanned PT note would blow it).
// Only lightweight METADATA is mirrored into the intake JSON so the clinician
// view and the generated note know what exists without carrying the bytes.
//
// PROTOTYPE NOTE: everything stays in the patient's own browser. Nothing is
// uploaded to a server. A real multi-patient deployment needs a backend with
// a signed BAA before real PHI touches it.
// ============================================================================

'use client';

const DB_NAME = 'spine-intake-documents';
const DB_VERSION = 1;
const STORE = 'documents';

export const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB per file
export const MAX_TOTAL_BYTES = 250 * 1024 * 1024; // 250 MB per session

export const ACCEPTED_TYPES =
  '.pdf,.jpg,.jpeg,.png,.heic,.webp,.tif,.tiff,.doc,.docx,.txt';

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
    hint: 'The written radiology report is what matters most — not the images themselves.',
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

export function getCategory(id) {
  return DOCUMENT_CATEGORIES.find((c) => c.id === id) || null;
}

export function formatBytes(bytes) {
  if (!bytes) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('Document storage is unavailable in this browser.'));
      return;
    }
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('sessionId', 'sessionId', { unique: false });
        store.createIndex('category', 'category', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Could not open document storage.'));
  });
}

function tx(db, mode) {
  return db.transaction(STORE, mode).objectStore(STORE);
}

function makeId() {
  return `doc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Strip the Blob so metadata can be safely mirrored into the intake JSON. */
function toMeta(record) {
  const { blob, ...meta } = record;
  return meta;
}

/**
 * Store one file. Returns its metadata record.
 * Throws on oversize files so the caller can show a friendly message.
 */
export async function addDocument({ sessionId, category, file, note = '' }) {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(
      `"${file.name}" is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_FILE_BYTES)} per file.`
    );
  }
  const existing = await getTotalSize(sessionId);
  if (existing + file.size > MAX_TOTAL_BYTES) {
    throw new Error(
      `Adding "${file.name}" would exceed the ${formatBytes(MAX_TOTAL_BYTES)} total limit for this session.`
    );
  }

  const record = {
    id: makeId(),
    sessionId,
    category,
    name: file.name,
    type: file.type || 'application/octet-stream',
    size: file.size,
    note,
    uploadedAt: new Date().toISOString(),
    blob: file,
  };

  const db = await openDB();
  await new Promise((resolve, reject) => {
    const req = tx(db, 'readwrite').add(record);
    req.onsuccess = resolve;
    req.onerror = () => reject(req.error);
  });
  db.close();
  return toMeta(record);
}

/** All metadata for a session (no Blobs), newest last. */
export async function listDocuments(sessionId) {
  let db;
  try {
    db = await openDB();
  } catch {
    return [];
  }
  const all = await new Promise((resolve, reject) => {
    const req = tx(db, 'readonly').getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return all
    .filter((r) => !sessionId || r.sessionId === sessionId)
    .map(toMeta)
    .sort((a, b) => a.uploadedAt.localeCompare(b.uploadedAt));
}

/** Full record including the Blob — used by the packet exporter. */
export async function getDocumentBlob(id) {
  const db = await openDB();
  const rec = await new Promise((resolve, reject) => {
    const req = tx(db, 'readonly').get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return rec ? rec.blob : null;
}

export async function deleteDocument(id) {
  const db = await openDB();
  await new Promise((resolve, reject) => {
    const req = tx(db, 'readwrite').delete(id);
    req.onsuccess = resolve;
    req.onerror = () => reject(req.error);
  });
  db.close();
}

export async function getTotalSize(sessionId) {
  const docs = await listDocuments(sessionId);
  return docs.reduce((sum, d) => sum + (d.size || 0), 0);
}

/**
 * Which document categories this particular patient should be prompted for,
 * derived from what they already told us earlier in the intake.
 * This is what turns a generic upload box into a targeted request.
 */
export function suggestedCategories(intakeData) {
  const tx = intakeData?.hpiData?.conservativeTreatments || {};
  const suggested = new Set();

  if (tx.physicalTherapy?.tried) suggested.add('pt_notes');
  if ((tx.injections || []).length > 0) suggested.add('injection_records');
  if ((tx.priorImaging || []).some((i) => i && i !== 'None')) suggested.add('imaging_reports');
  if (tx.priorEMG?.done) suggested.add('emg_report');

  if (intakeData?.chiefComplaint?.hasPriorSpineSurgery) suggested.add('operative_reports');
  const spineSurgery = (intakeData?.pastSurgicalHistory?.surgeries || []).some((s) =>
    /spine|back|neck|fusion|laminectomy|discectomy|cervical|lumbar/i.test(
      `${s.type || ''} ${s.bodyRegion || ''}`
    )
  );
  if (spineSurgery) suggested.add('operative_reports');

  if (tx.chiropracticCare?.tried) suggested.add('outside_notes');
  if ((intakeData?.medications?.current || []).length > 0) suggested.add('outside_notes');

  return suggested;
}
