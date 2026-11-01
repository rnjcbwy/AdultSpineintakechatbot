// Point an Amplify Hosting app at the infrastructure the CDK stack created.
//
// Run once after (a) `npx cdk deploy` and (b) creating the Amplify app in the
// console by connecting the GitHub repository. Idempotent; run again after
// any `cdk deploy` that changes outputs.
//
//   node scripts/aws/amplify-configure.mjs --app-id d1abc2def3ghij [--branch main] [--region us-east-1]
//
// What it sets on the app:
//   - the SSR compute role (gives server code AWS credentials; no keys in env)
//   - the environment variables (bucket, worker, model ids, Practice Hub URL)
//   - the branch framework and stage
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const arg = (name, d) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? d : process.argv[i + 1];
};
const appId = arg('app-id');
const branch = arg('branch', 'main');
const region = arg('region', 'us-east-1');
const stack = arg('stack', 'SpineIntakeStack');
if (!appId) {
  console.error('Usage: node scripts/aws/amplify-configure.mjs --app-id <amplify app id> [--branch main] [--region us-east-1]');
  process.exit(1);
}

const aws = (args) => execFileSync('aws', [...args, '--region', region, '--output', 'json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });

const outputs = Object.fromEntries(
  JSON.parse(aws(['cloudformation', 'describe-stacks', '--stack-name', stack])).Stacks[0].Outputs.map((o) => [o.OutputKey, o.OutputValue]),
);
const env = JSON.parse(outputs.AmplifyEnvironment);
const role = outputs.ComputeRoleArn;

console.log(`Stack ${stack}: bucket ${outputs.SubmissionsBucket}, worker ${outputs.WorkerFunctionName}`);
console.log(`Attaching compute role ${role} and ${Object.keys(env).length} environment variables to app ${appId}`);

// As a JSON file, not the CLI's k=v shorthand: values such as the sender name
// ("Dr. Aaron Wey's office <...>") carry characters the shorthand cannot.
const envFile = path.join(os.tmpdir(), `amplify-env-${appId}.json`);
fs.writeFileSync(envFile, JSON.stringify(env));
try {
  aws(['amplify', 'update-app', '--app-id', appId, '--platform', 'WEB_COMPUTE', '--compute-role-arn', role, '--environment-variables', `file://${envFile}`]);
} finally {
  fs.rmSync(envFile, { force: true });
}
aws(['amplify', 'update-branch', '--app-id', appId, '--branch-name', branch, '--framework', 'Next.js - SSR', '--stage', 'PRODUCTION']);

const app = JSON.parse(aws(['amplify', 'get-app', '--app-id', appId])).app;
console.log(`Done. Default domain: https://${branch.replace(/\//g, '-')}.${app.defaultDomain}`);
console.log('Next: add that origin to cdk.json "allowedOrigins" and run `npx cdk deploy` again so the bucket accepts uploads from it; then start a build (push to the branch or "Redeploy this version" in the console).');
