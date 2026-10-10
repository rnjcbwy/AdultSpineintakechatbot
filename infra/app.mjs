#!/usr/bin/env node
// ============================================================================
// AWS infrastructure for the Adult Spine Intake (CDK, JavaScript).
//
// What this stack owns:
//   - a customer-managed KMS key
//   - the submissions bucket (private, KMS, versioned, TLS-only, CORS for
//     direct browser uploads)
//   - the submission worker Lambda (note generation on Bedrock, transcript
//     PDF, hand-off to Practice Hub) and its 15-minute retry sweep
//   - the IAM role Amplify Hosting's SSR compute assumes
//   - an account-wide CloudTrail trail (HIPAA audit controls), optional
//
// What it does NOT own: the Amplify app itself. Connecting the GitHub repo is
// a one-time console step (OAuth), after which scripts/aws/amplify-configure.mjs
// attaches the role and environment this stack outputs. See DEPLOY-AWS.md.
//
// Every service here is on the AWS HIPAA-eligible list and is covered by the
// account's BAA; nothing leaves the account except the patient's browser.
// ============================================================================

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

class SpineIntakeStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const ctx = (k, d) => {
      const v = this.node.tryGetContext(k);
      return v === undefined || v === null || v === '' ? d : v;
    };
    const practiceHubUrl = ctx('practiceHubUrl', '');
    const practiceHubSecretName = ctx('practiceHubSecretName', 'practicehub/INTAKE_API_KEY');
    const practiceHubKmsKeyArn = ctx('practiceHubKmsKeyArn', '');
    const allowedOrigins = ctx('allowedOrigins', ['http://localhost:3000']);
    const noteModelId = ctx('noteModelId', 'us.anthropic.claude-opus-4-6-v1');
    const chatModelId = ctx('chatModelId', 'us.anthropic.claude-sonnet-4-6');
    const createCloudTrail = ctx('createCloudTrail', true) !== false && ctx('createCloudTrail', true) !== 'false';

    cdk.Tags.of(this).add('Project', 'spine-intake');
    cdk.Tags.of(this).add('DataClass', 'PHI');
    cdk.Tags.of(this).add('ManagedBy', 'cdk');

    // ---- Encryption -----------------------------------------------------
    const key = new kms.Key(this, 'DataKey', {
      alias: 'alias/spine-intake',
      description: 'Adult Spine Intake: submissions bucket and related data',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ---- Submissions bucket --------------------------------------------
    const bucket = new s3.Bucket(this, 'Submissions', {
      bucketName: `spine-intake-submissions-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: key,
      bucketKeyEnabled: true,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [
        { id: 'expire-old-versions', noncurrentVersionExpiration: cdk.Duration.days(90) },
        { id: 'abort-incomplete-uploads', abortIncompleteMultipartUploadAfter: cdk.Duration.days(2) },
      ],
      cors: [{
        allowedMethods: [s3.HttpMethods.PUT],
        allowedOrigins,
        allowedHeaders: ['*'],
        exposedHeaders: ['ETag'],
        maxAge: 3600,
      }],
    });

    // ---- Practice Hub service key (owned by the Practice Hub stack) -----
    const practiceHubSecret = secretsmanager.Secret.fromSecretNameV2(this, 'PracticeHubKey', practiceHubSecretName);

    const runtimeEnv = {
      NODE_ENV: 'production',
      DEPLOYMENT_TIER: 'production',
      LLM_PROVIDER: 'bedrock',
      BEDROCK_REGION: this.region,
      BEDROCK_NOTE_MODEL_ID: noteModelId,
      BEDROCK_CHAT_MODEL_ID: chatModelId,
      SPINE_SUBMISSIONS_BUCKET: bucket.bucketName,
      SPINE_KMS_KEY_ARN: key.keyArn,
      PRACTICEHUB_URL: practiceHubUrl,
      PRACTICEHUB_API_KEY_SECRET_ID: practiceHubSecretName,
    };

    const bedrockPolicy = new iam.PolicyStatement({
      actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
      resources: [
        'arn:aws:bedrock:*::foundation-model/anthropic.*',
        `arn:aws:bedrock:${this.region}:${this.account}:inference-profile/*`,
      ],
    });
    const practiceHubKmsPolicy = practiceHubKmsKeyArn
      ? new iam.PolicyStatement({ actions: ['kms:Decrypt'], resources: [practiceHubKmsKeyArn] })
      : null;

    // ---- Worker ----------------------------------------------------------
    const worker = new NodejsFunction(this, 'Worker', {
      functionName: 'spine-intake-worker',
      description: 'Writes the pre-visit note, renders the transcript PDF and hands the intake to Practice Hub',
      entry: path.join(ROOT, 'infra', 'lambda', 'intake-worker.mjs'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 1536,
      timeout: cdk.Duration.minutes(10),
      projectRoot: ROOT,
      depsLockFilePath: path.join(ROOT, 'package-lock.json'),
      environment: runtimeEnv,
      logGroup: new logs.LogGroup(this, 'WorkerLogs', {
        logGroupName: '/aws/lambda/spine-intake-worker',
        retention: logs.RetentionDays.THREE_MONTHS,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      }),
      bundling: {
        target: 'node22',
        minify: false,
        sourceMap: false,
        // Bundle the SDK too, so the worker runs the versions this repo tests.
        externalModules: [],
        mainFields: ['module', 'main'],
      },
    });
    bucket.grantReadWrite(worker);
    key.grantEncryptDecrypt(worker);
    worker.addToRolePolicy(bedrockPolicy);
    practiceHubSecret.grantRead(worker);
    if (practiceHubKmsPolicy) worker.addToRolePolicy(practiceHubKmsPolicy);

    // Retry anything undelivered (model hiccup, Practice Hub maintenance).
    new events.Rule(this, 'Sweep', {
      ruleName: 'spine-intake-sweep',
      schedule: events.Schedule.rate(cdk.Duration.minutes(15)),
      targets: [new targets.LambdaFunction(worker, { event: events.RuleTargetInput.fromObject({ sweep: true }) })],
    });

    // ---- Amplify SSR compute role ----------------------------------------
    const computeRole = new iam.Role(this, 'AmplifyComputeRole', {
      roleName: 'spine-intake-amplify-compute',
      assumedBy: new iam.ServicePrincipal('amplify.amazonaws.com'),
      description: 'Assumed by Amplify Hosting SSR compute for the Adult Spine Intake',
    });
    bucket.grantReadWrite(computeRole);
    key.grantEncryptDecrypt(computeRole);
    computeRole.addToPolicy(bedrockPolicy);
    practiceHubSecret.grantRead(computeRole);
    if (practiceHubKmsPolicy) computeRole.addToPolicy(practiceHubKmsPolicy);
    worker.grantInvoke(computeRole);

    // ---- CloudTrail (audit controls) ------------------------------------
    if (createCloudTrail) {
      const trailBucket = new s3.Bucket(this, 'TrailBucket', {
        bucketName: `spine-intake-cloudtrail-${this.account}-${this.region}`,
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        enforceSSL: true,
        objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
        lifecycleRules: [{ id: 'retain-13-months', expiration: cdk.Duration.days(400) }],
      });
      new cloudtrail.Trail(this, 'Trail', {
        trailName: 'account-audit',
        bucket: trailBucket,
        isMultiRegionTrail: true,
        includeGlobalServiceEvents: true,
        enableFileValidation: true,
        sendToCloudWatchLogs: false,
      });
    }

    // ---- Outputs -----------------------------------------------------------
    new cdk.CfnOutput(this, 'SubmissionsBucket', { value: bucket.bucketName });
    new cdk.CfnOutput(this, 'KmsKeyArn', { value: key.keyArn });
    new cdk.CfnOutput(this, 'WorkerFunctionName', { value: worker.functionName });
    new cdk.CfnOutput(this, 'ComputeRoleArn', { value: computeRole.roleArn });
    new cdk.CfnOutput(this, 'AmplifyEnvironment', {
      description: 'Environment variables for the Amplify app (applied by scripts/aws/amplify-configure.mjs)',
      // NODE_ENV is left out on purpose: Next sets it, and as an Amplify
      // variable it makes `npm ci` skip devDependencies (Tailwind) at build time.
      value: JSON.stringify({
        ...Object.fromEntries(Object.entries(runtimeEnv).filter(([k]) => k !== 'NODE_ENV')),
        NEXT_PUBLIC_DEPLOYMENT_TIER: 'production',
        INTAKE_WORKER_FUNCTION: worker.functionName,
      }),
    });
  }
}

const app = new cdk.App();
new SpineIntakeStack(app, 'SpineIntakeStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'Adult Spine Intake: submissions store, worker, Amplify compute role, CloudTrail',
});
