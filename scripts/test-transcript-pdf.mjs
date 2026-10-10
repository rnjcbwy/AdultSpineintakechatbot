// Render the intake transcript for a fictional patient and write it next to
// this script's output folder, so the layout can be eyeballed without running
// the whole app. Also exercises the same esbuild bundling the Lambda uses.
//
//   node scripts/test-transcript-pdf.mjs [out.pdf]
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { SAMPLE_INTAKE } from './sample-intake.mjs';

const ROOT = process.cwd();
const out = process.argv[2] || path.join(ROOT, '.pdf-tmp', 'sample-transcript.pdf');
fs.mkdirSync(path.dirname(out), { recursive: true });
const bundle = path.join(ROOT, '.pdf-tmp', 'transcript-bundle.mjs');

// Relative paths only: the project folder has spaces in its name.
execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', [
  'esbuild', 'lib/server/intakeTranscriptPdf.js', '--bundle', '--platform=node', '--format=esm',
  '--external:pdf-lib', '--external:@aws-sdk/*', '--outfile=.pdf-tmp/transcript-bundle.mjs', '--log-level=warning',
], { stdio: 'inherit', shell: process.platform === 'win32', cwd: ROOT });

const { buildIntakeTranscriptPdf } = await import(pathToFileURL(bundle).href);

const intake = SAMPLE_INTAKE;

const note = { narrative: 'CHIEF COMPLAINT:\nLow back pain with right leg radiation.\n\nHISTORY OF PRESENT ILLNESS:\nThe patient is a 61-year-old female who reports eight months of low back pain radiating to the right lateral calf and dorsum of the foot, worse with walking and standing and relieved by sitting. Walking tolerance is approximately two blocks.', generatedAt: new Date().toISOString(), modelId: 'test-model' };
const t0 = Date.now();
const bytes = await buildIntakeTranscriptPdf({ intake, note, redFlags: [{ id: 'x', label: 'Progressive weakness', severity: 'urgent' }], attachments: [{ name: 'PT discharge summary.pdf', category: 'pt_notes', size: 240000 }], meta: { submissionId: '20261010-abcdef0123456789abcd', submittedAt: new Date().toISOString() } });
fs.writeFileSync(out, bytes);
console.log(`wrote ${out} (${(bytes.length / 1024).toFixed(0)} KB) in ${Date.now() - t0} ms`);
