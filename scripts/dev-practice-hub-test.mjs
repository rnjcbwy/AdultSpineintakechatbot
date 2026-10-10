// Start a throwaway Practice Hub dev server for testing the intake hand-off.
//
// Next 16 allows one `next dev` per project folder, and the real folder may
// already be serving someone on port 3100, so this mirrors the source into a
// scratch folder (sharing node_modules through a junction), gives it its own
// embedded database and file store, and serves it on port 3101. Nothing it
// does touches the real folder's .data. Webpack rather than Turbopack: Turbopack
// refuses a node_modules junction that points outside the project folder.
//
//   node scripts/dev-practice-hub-test.mjs
// Sign in with the login written to <practice-hub>/.data/DEV-LOGIN.txt.
import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PH = process.env.PRACTICEHUB_DIR || 'C:/AWEY PRACTICE BLUEPRINT PLAYBOOK/CASE LOGS AND PORTFOLIO/practice-hub';
const PORT = process.env.PORT || '3101';
if (!fs.existsSync(path.join(PH, 'package.json'))) {
  console.error(`Practice Hub not found at ${PH}; set PRACTICEHUB_DIR.`);
  process.exit(1);
}
const copy = path.join(os.tmpdir(), 'practice-hub-intake-test');
fs.mkdirSync(copy, { recursive: true });

// Mirror the source (not node_modules, builds, data, deploy or env files).
if (process.platform === 'win32') {
  try {
    execFileSync('robocopy', [PH, copy, '/MIR', '/NFL', '/NDL', '/NJH', '/NJS', '/XD', 'node_modules', '.next', '.data', 'deploy', '.git', 'docs'], { stdio: 'inherit' });
  } catch (e) {
    // robocopy exits 1-7 for success-with-copies.
    if ((e.status ?? 0) >= 8) throw e;
  }
  const nm = path.join(copy, 'node_modules');
  if (!fs.existsSync(nm)) execFileSync('cmd', ['/c', 'mklink', '/J', nm, path.join(PH, 'node_modules')], { stdio: 'inherit' });
} else {
  execFileSync('rsync', ['-a', '--delete', '--exclude', 'node_modules', '--exclude', '.next', '--exclude', '.data', '--exclude', 'deploy', '--exclude', '.git', `${PH}/`, `${copy}/`], { stdio: 'inherit' });
  const nm = path.join(copy, 'node_modules');
  if (!fs.existsSync(nm)) fs.symlinkSync(path.join(PH, 'node_modules'), nm, 'dir');
}

// Turbopack refuses a node_modules junction that points outside its root, so
// the mirror's config widens the root to the drive. Only the copy is touched.
const cfg = path.join(copy, 'next.config.ts');
const src = fs.readFileSync(cfg, 'utf8');
if (!src.includes('turbopack: { root')) {
  fs.writeFileSync(cfg, src.replace('const nextConfig: NextConfig = {', `const nextConfig: NextConfig = {\n  turbopack: { root: ${JSON.stringify(path.parse(copy).root)} },`));
}

const env = {
  ...process.env,
  PGLITE_DIR: path.join(PH, '.data', 'pglite-intake-test'),
  STORAGE_LOCAL_DIR: path.join(PH, '.data', 'storage-intake-test'),
  BETTER_AUTH_URL: `http://localhost:${PORT}`,
  DEV_ENFORCE_RLS: 'true',
  PORT,
};
console.log(`Serving a mirror of Practice Hub from ${copy} on port ${PORT} (database ${env.PGLITE_DIR})`);
const child = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['next', 'dev', '--port', PORT], {
  cwd: copy, env, stdio: 'inherit', shell: process.platform === 'win32',
});
child.on('exit', (code) => process.exit(code ?? 0));
