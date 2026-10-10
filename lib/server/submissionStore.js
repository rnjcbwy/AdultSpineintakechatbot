// ============================================================================
// Durable store for submitted intakes.
//
// Production: a private, KMS-encrypted S3 bucket (SPINE_SUBMISSIONS_BUCKET).
// Development: a folder under .data/ so the whole flow runs on a laptop with
// fictional data. The layout is identical in both:
//
//   submissions/<id>/intake.json        the structured answers (PHI)
//   submissions/<id>/state.json         bookkeeping: status, attempts, hashes
//   submissions/<id>/note.json          generated pre-visit note + metadata
//   submissions/<id>/transcript.pdf     rendered transcript
//   submissions/<id>/attachments/<docId>  patient-uploaded records
//   pending/<id>                        marker while not yet delivered
//
// The submission is the unit of durability: once intake.json is written the
// patient's work cannot be lost, whatever happens to the note generator or
// the hand-off to Practice Hub afterwards.
// ============================================================================

import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const BUCKET = process.env.SPINE_SUBMISSIONS_BUCKET || '';
const KMS_KEY = process.env.SPINE_KMS_KEY_ARN || '';
const LOCAL_DIR = path.join(process.env.SPINE_DATA_DIR || path.join(process.cwd(), '.data'), 'submissions-store');

export function storeKind() {
  return BUCKET ? 's3' : 'local';
}

export function describeStore() {
  return BUCKET ? `s3://${BUCKET}` : `local folder ${LOCAL_DIR}`;
}

// ---------------------------------------------------------------------------
// Raw object operations
// ---------------------------------------------------------------------------

let s3 = null;
async function client() {
  if (!s3) {
    const { S3Client } = await import('@aws-sdk/client-s3');
    s3 = new S3Client({ region: process.env.AWS_REGION || process.env.BEDROCK_REGION || 'us-east-1' });
  }
  return s3;
}

function safeKey(key) {
  if (!/^[A-Za-z0-9_\-./]+$/.test(key) || key.includes('..')) throw new Error('Invalid object key');
  return key;
}

export async function putObject(key, body, contentType = 'application/octet-stream') {
  safeKey(key);
  if (BUCKET) {
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    await (await client()).send(new PutObjectCommand({
      Bucket: BUCKET, Key: key, Body: body, ContentType: contentType,
      ServerSideEncryption: 'aws:kms', ...(KMS_KEY ? { SSEKMSKeyId: KMS_KEY } : {}),
    }));
    return;
  }
  const file = path.join(LOCAL_DIR, key);
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  await fs.writeFile(tmp, body);
  await fs.rename(tmp, file);
  await fs.writeFile(`${file}.meta.json`, JSON.stringify({ contentType }));
}

/** @returns {Promise<{body:Buffer, contentType:string, size:number}|null>} */
export async function getObject(key) {
  safeKey(key);
  if (BUCKET) {
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    try {
      const res = await (await client()).send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
      const body = Buffer.from(await res.Body.transformToByteArray());
      return { body, contentType: res.ContentType || 'application/octet-stream', size: body.length };
    } catch (e) {
      if (e.name === 'NoSuchKey' || e.$metadata?.httpStatusCode === 404) return null;
      throw e;
    }
  }
  const file = path.join(LOCAL_DIR, key);
  try {
    const body = await fs.readFile(file);
    let contentType = 'application/octet-stream';
    try { contentType = JSON.parse(await fs.readFile(`${file}.meta.json`, 'utf8')).contentType || contentType; } catch { /* no meta */ }
    return { body, contentType, size: body.length };
  } catch (e) {
    if (e.code === 'ENOENT') return null;
    throw e;
  }
}

/** @returns {Promise<{key:string,size:number}[]>} */
export async function listObjects(prefix) {
  safeKey(prefix);
  if (BUCKET) {
    const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');
    const out = [];
    let token;
    do {
      const res = await (await client()).send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix, ContinuationToken: token }));
      for (const o of res.Contents || []) out.push({ key: o.Key, size: o.Size || 0 });
      token = res.IsTruncated ? res.NextContinuationToken : undefined;
    } while (token);
    return out;
  }
  const dir = path.join(LOCAL_DIR, prefix);
  const out = [];
  async function walk(d, rel) {
    let entries;
    try { entries = await fs.readdir(d, { withFileTypes: true }); } catch (e) { if (e.code === 'ENOENT') return; throw e; }
    for (const ent of entries) {
      if (ent.name.endsWith('.meta.json') || ent.name.endsWith('.tmp')) continue;
      const full = path.join(d, ent.name);
      const key = `${rel}${ent.name}`;
      if (ent.isDirectory()) await walk(full, `${key}/`);
      else out.push({ key, size: (await fs.stat(full)).size });
    }
  }
  await walk(dir, prefix.endsWith('/') ? prefix : `${prefix}/`);
  return out;
}

export async function deleteObject(key) {
  safeKey(key);
  if (BUCKET) {
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    await (await client()).send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    return;
  }
  const file = path.join(LOCAL_DIR, key);
  await fs.rm(file, { force: true });
  await fs.rm(`${file}.meta.json`, { force: true });
}

/**
 * A short-lived URL the browser can PUT one attachment to directly, so large
 * records never pass through the SSR function (whose request body is capped).
 * Returns null on the local store, where the app's own upload route is used.
 */
export async function presignUpload(key, contentType, expiresSec = 900) {
  safeKey(key);
  if (!BUCKET) return null;
  const { PutObjectCommand } = await import('@aws-sdk/client-s3');
  const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
  const cmd = new PutObjectCommand({
    Bucket: BUCKET, Key: key, ContentType: contentType,
    ServerSideEncryption: 'aws:kms', ...(KMS_KEY ? { SSEKMSKeyId: KMS_KEY } : {}),
  });
  const url = await getSignedUrl(await client(), cmd, { expiresIn: expiresSec });
  // The signed headers must be sent exactly as signed.
  const headers = { 'Content-Type': contentType, 'x-amz-server-side-encryption': 'aws:kms' };
  if (KMS_KEY) headers['x-amz-server-side-encryption-aws-kms-key-id'] = KMS_KEY;
  return { method: 'PUT', url, headers };
}

// ---------------------------------------------------------------------------
// Submission-level helpers
// ---------------------------------------------------------------------------

export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;
export const MAX_ATTACHMENTS = 40;

export function newSubmissionId() {
  // Date prefix keeps the bucket browsable; the random tail makes the id
  // unguessable (it is also part of the patient's access path).
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `${day}-${crypto.randomBytes(10).toString('hex')}`;
}

export function isSubmissionId(id) {
  return typeof id === 'string' && /^\d{8}-[0-9a-f]{20}$/.test(id);
}

export function newAccessToken() {
  return crypto.randomBytes(24).toString('base64url');
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(String(token || '')).digest('hex');
}

export function tokenMatches(token, hash) {
  if (!token || !hash) return false;
  const a = Buffer.from(hashToken(token));
  const b = Buffer.from(String(hash));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const base = (id) => `submissions/${id}`;

export const keys = {
  intake: (id) => `${base(id)}/intake.json`,
  state: (id) => `${base(id)}/state.json`,
  note: (id) => `${base(id)}/note.json`,
  transcript: (id) => `${base(id)}/transcript.pdf`,
  attachment: (id, docId) => `${base(id)}/attachments/${docId}`,
  attachmentsPrefix: (id) => `${base(id)}/attachments/`,
  pending: (id) => `pending/${id}`,
};

export async function saveJson(key, value) {
  await putObject(key, Buffer.from(JSON.stringify(value), 'utf8'), 'application/json');
}

export async function loadJson(key) {
  const o = await getObject(key);
  if (!o) return null;
  return JSON.parse(o.body.toString('utf8'));
}

export const saveIntake = (id, intake) => saveJson(keys.intake(id), intake);
export const loadIntake = (id) => loadJson(keys.intake(id));
export const saveState = (id, state) => saveJson(keys.state(id), state);
export const loadState = (id) => loadJson(keys.state(id));
export const saveNote = (id, note) => saveJson(keys.note(id), note);
export const loadNote = (id) => loadJson(keys.note(id));
export const saveTranscript = (id, bytes) => putObject(keys.transcript(id), Buffer.from(bytes), 'application/pdf');
export const loadTranscript = (id) => getObject(keys.transcript(id));

export async function markPending(id) {
  await putObject(keys.pending(id), Buffer.from(new Date().toISOString()), 'text/plain');
}
export async function clearPending(id) {
  await deleteObject(keys.pending(id));
}
export async function listPending() {
  return (await listObjects('pending/')).map((o) => o.key.slice('pending/'.length)).filter(isSubmissionId);
}

/**
 * Attachments actually present in the store for a submission, joined to the
 * metadata the intake recorded for them. Files the browser never finished
 * uploading simply do not appear; oversize objects are dropped.
 */
export async function listAttachments(id, intake) {
  const prefix = keys.attachmentsPrefix(id);
  const objects = await listObjects(prefix);
  const meta = new Map((intake?.documents || []).map((d) => [d.id, d]));
  const out = [];
  for (const o of objects) {
    const docId = o.key.slice(prefix.length);
    if (!docId || docId.includes('/')) continue;
    if (o.size > MAX_ATTACHMENT_BYTES) continue;
    const m = meta.get(docId) || {};
    out.push({
      docId,
      key: o.key,
      size: o.size,
      name: m.name || docId,
      contentType: m.type || 'application/octet-stream',
      category: m.category || 'other',
      uploadedAt: m.uploadedAt || null,
    });
  }
  return out;
}
