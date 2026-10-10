import { NextResponse } from 'next/server';
import { authorizeSubmission } from '../../../../../lib/server/submissionAuth';
import { putObject, keys, storeKind, MAX_ATTACHMENT_BYTES } from '../../../../../lib/server/submissionStore';
import { logError } from '../../../../../lib/server/log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/intake/:id/upload?doc=<docId> — development-only attachment upload.
 *
 * In production attachments go straight to S3 with a presigned URL (the web
 * tier's request body is capped well below a scanned MRI report). With the
 * local store there is no S3 to sign for, so the file comes through here.
 */
export async function POST(request, { params }) {
  if (storeKind() !== 'local') return NextResponse.json({ error: 'Direct uploads are used in this deployment.' }, { status: 404 });
  const auth = await authorizeSubmission(request, params.id);
  if (auth.response) return auth.response;
  if (auth.state.finalizedAt) return NextResponse.json({ error: 'This submission is already complete.' }, { status: 409 });

  const docId = new URL(request.url).searchParams.get('doc') || '';
  if (!/^doc_[a-z0-9_]+$/i.test(docId)) return NextResponse.json({ error: 'Invalid document id.' }, { status: 400 });

  let form;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Expected multipart/form-data.' }, { status: 400 });
  }
  const file = form.get('file');
  if (!file || typeof file !== 'object') return NextResponse.json({ error: 'No file supplied.' }, { status: 400 });
  if (file.size > MAX_ATTACHMENT_BYTES) return NextResponse.json({ error: 'File too large.' }, { status: 413 });

  try {
    await putObject(keys.attachment(params.id, docId), Buffer.from(await file.arrayBuffer()), file.type || 'application/octet-stream');
    return NextResponse.json({ ok: true });
  } catch (err) {
    logError('upload.failed', err, { submissionId: params.id });
    return NextResponse.json({ error: 'Could not store the file.' }, { status: 500 });
  }
}
