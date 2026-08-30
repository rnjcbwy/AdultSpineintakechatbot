// ============================================================================
// Local filesystem storage adapter.
//
// Layout under DATA_DIR (default ./.data, gitignored):
//   patients/<patientId>/record.json      the intake record
//   patients/<patientId>/documents.json   document metadata
//   patients/<patientId>/files/<docId>__<name>
//
// Chosen for the first backend pass because it needs no accounts, no native
// modules and no network — the office machine holds the file cabinet. The
// adapter interface is deliberately narrow so a Postgres + object-store
// adapter can replace it without touching the API routes or the UI.
// ============================================================================

import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const DATA_DIR = process.env.SPINE_DATA_DIR || path.join(process.cwd(), '.data');
const PATIENTS_DIR = path.join(DATA_DIR, 'patients');

function safeSegment(s) {
  return String(s || '').replace(/[^A-Za-z0-9_-]/g, '');
}

function patientDir(id) {
  const clean = safeSegment(id);
  if (!clean) throw new Error('Invalid patient id');
  return path.join(PATIENTS_DIR, clean);
}

async function readJson(file, fallback = null) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch (e) {
    if (e.code === 'ENOENT') return fallback;
    throw e;
  }
}

async function writeJson(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  // Write to a temp file then rename, so a crash mid-write cannot truncate an
  // existing record.
  const tmp = `${file}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(value, null, 2), 'utf8');
  await fs.rename(tmp, file);
}

/** Short, human-scannable id. */
function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}${crypto.randomBytes(4).toString('hex')}`;
}

function summarize(record, documents) {
  const d = record?.demographics || {};
  return {
    id: record.patientId,
    lastName: d.lastName || '',
    firstName: d.firstName || '',
    dob: d.dob || '',
    age: d.age || '',
    sex: d.sex || '',
    insuranceProvider: d.insuranceProvider || '',
    mainReason: record?.chiefComplaint?.mainReason || '',
    documentCount: (documents || []).length,
    savedAt: record.savedAt || null,
    updatedAt: record.updatedAt || record.savedAt || null,
    redFlagCount: (record.redFlags || []).length,
  };
}

export const fsAdapter = {
  name: 'filesystem',
  describe: () => `local filesystem at ${DATA_DIR}`,

  async listPatients() {
    let entries;
    try {
      entries = await fs.readdir(PATIENTS_DIR, { withFileTypes: true });
    } catch (e) {
      if (e.code === 'ENOENT') return [];
      throw e;
    }
    const out = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const dir = path.join(PATIENTS_DIR, entry.name);
      const record = await readJson(path.join(dir, 'record.json'));
      if (!record) continue;
      const documents = (await readJson(path.join(dir, 'documents.json'), [])) || [];
      out.push(summarize(record, documents));
    }
    return out.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
  },

  async getPatient(id) {
    const dir = patientDir(id);
    const record = await readJson(path.join(dir, 'record.json'));
    if (!record) return null;
    const documents = (await readJson(path.join(dir, 'documents.json'), [])) || [];
    return { ...record, documents };
  },

  /**
   * Create or update a patient record. `intake` is the full intake JSON.
   * Document BYTES are uploaded separately.
   */
  async savePatient({ patientId, intake }) {
    const id = patientId || newId('pt');
    const dir = patientDir(id);
    await fs.mkdir(dir, { recursive: true });

    const existing = await readJson(path.join(dir, 'record.json'));
    const now = new Date().toISOString();
    // Never let the client overwrite server-owned bookkeeping fields.
    const { documents, ...intakeWithoutDocs } = intake || {};
    const record = {
      ...intakeWithoutDocs,
      patientId: id,
      savedAt: existing?.savedAt || now,
      updatedAt: now,
    };
    await writeJson(path.join(dir, 'record.json'), record);
    if (!existing) await writeJson(path.join(dir, 'documents.json'), []);
    return { id, savedAt: record.savedAt, updatedAt: record.updatedAt };
  },

  async deletePatient(id) {
    await fs.rm(patientDir(id), { recursive: true, force: true });
  },

  async listDocuments(id) {
    return (await readJson(path.join(patientDir(id), 'documents.json'), [])) || [];
  },

  async addDocument({ patientId, category, name, type, bytes }) {
    const dir = patientDir(patientId);
    const filesDir = path.join(dir, 'files');
    await fs.mkdir(filesDir, { recursive: true });

    const docId = newId('doc');
    const stored = `${docId}__${String(name || 'file').replace(/[^\w.\- ]+/g, '_').slice(0, 120)}`;
    await fs.writeFile(path.join(filesDir, stored), bytes);

    const meta = {
      id: docId,
      category,
      name,
      type: type || 'application/octet-stream',
      size: bytes.length,
      storedAs: stored,
      uploadedAt: new Date().toISOString(),
    };
    const docs = (await readJson(path.join(dir, 'documents.json'), [])) || [];
    docs.push(meta);
    await writeJson(path.join(dir, 'documents.json'), docs);
    return meta;
  },

  async getDocument({ patientId, docId }) {
    const dir = patientDir(patientId);
    const docs = (await readJson(path.join(dir, 'documents.json'), [])) || [];
    const meta = docs.find((d) => d.id === docId);
    if (!meta) return null;
    const bytes = await fs.readFile(path.join(dir, 'files', meta.storedAs));
    return { meta, bytes };
  },

  async deleteDocument({ patientId, docId }) {
    const dir = patientDir(patientId);
    const docs = (await readJson(path.join(dir, 'documents.json'), [])) || [];
    const meta = docs.find((d) => d.id === docId);
    if (!meta) return false;
    await fs.rm(path.join(dir, 'files', meta.storedAs), { force: true });
    await writeJson(path.join(dir, 'documents.json'), docs.filter((d) => d.id !== docId));
    return true;
  },
};
