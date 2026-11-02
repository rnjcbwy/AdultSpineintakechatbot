import crypto from 'node:crypto';
import { getApiKey, practiceHubConfigured } from './practicehub';

/**
 * True when the request carries Practice Hub's shared service key (the
 * answering service asking for questionnaires or scores during a call).
 */
export async function fromPracticeHub(request) {
  const auth = request.headers.get('authorization') || '';
  const presented = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!presented || !practiceHubConfigured()) return false;
  try {
    const key = await getApiKey();
    const a = Buffer.from(presented);
    const b = Buffer.from(key);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
