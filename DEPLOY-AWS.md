# Running the Adult Spine Intake on AWS

This moves the intake off Vercel and onto AWS services that are on the AWS
HIPAA-eligible list and covered by the account's Business Associate Addendum
(accepted in AWS Artifact; shared with Practice Hub). Patients reach the site
by link, QR code or the practice website; what they submit lands in the
office's Practice Hub inbox.

```
Patient browser ──HTTPS──► Amplify Hosting (Next.js SSR, compute role)
     │                          │ stores answers (S3, KMS)   ► invokes
     │ presigned PUT            ▼                                worker
     └──────────────────► submissions bucket ◄───────────── Lambda worker
                                                              │ Bedrock (Claude): pre-visit note
                                                              │ transcript PDF
                                                              ▼
                                                     Practice Hub  POST /api/intake
                                                     (match / create patient, inbox)
```

| Piece | Service | Why |
| --- | --- | --- |
| Web app (`app/`, SSR + API routes) | **Amplify Hosting** (WEB_COMPUTE) | HIPAA-eligible, TLS by default, Git-based deploys like Vercel, custom domain later |
| Answers, transcript PDF, attached records | **S3** + **KMS** customer key | Durable the instant the patient submits; encrypted at rest; TLS-only; versioned |
| Pre-visit note + HPI interview assistant | **Amazon Bedrock**, Claude Sonnet 4.6 (note and chat; the only Claude enabled on the account today) | Under the AWS BAA already; no new agreement, no API key, request never leaves AWS |
| Note / PDF / hand-off | **Lambda** worker + **EventBridge** 15-min retry sweep | The note takes longer than a web request may; retries survive a Practice Hub outage |
| Audit of the account | **CloudTrail** (multi-region, validated) | HIPAA audit controls; also covers Practice Hub |
| Credentials | IAM roles only (Amplify SSR compute role, Lambda role) | No long-lived keys anywhere |

**Model choice.** "Whichever has the easiest BAA" is Bedrock: the AWS BAA
already in force covers it. OpenAI would need its own BAA and API-key handling
and is left only as `LLM_PROVIDER=openai` for local experiments with fictional
data. Claude Haiku 4.5 and the newer Claude 5.x models are not yet enabled for
this account (Bedrock → Model access → Anthropic use-case form); the two
enabled models are set in `cdk.json`.

## What a submission does

1. **Submit** — the browser POSTs the structured answers to `/api/intake/submit`.
   They are written to the bucket immediately and a per-submission token is
   returned. Nothing after this step can lose the patient's work.
2. **Upload** — each attached record is PUT straight to S3 with a presigned URL
   (SSR functions cap request bodies far below a scanned report).
3. **Finalize** — `/api/intake/[id]/finalize` invokes the worker asynchronously.
4. **Worker** — writes the pre-visit note (Bedrock), renders the transcript
   PDF (logo, body diagram as drawn, interview transcript, every questionnaire
   answer, attached-records list, the draft note), and POSTs the bundle to
   Practice Hub `/api/intake`. Practice Hub matches the patient by name + DOB,
   or opens a chart with a `TEMP-` MRN for the office to replace, stores the
   files and flags the inbox. Anything undelivered is retried every 15 min.
5. **Patient** — polls `/api/intake/[id]/status`, reads the note, can correct it
   (`/rewrite`), which re-runs the worker and sends Practice Hub an update.

## One-time setup

Prerequisites on this machine: AWS CLI (profile with admin on account
933164653563), Node 20+, `npm ci` in this folder. GitHub repo
`rnjcbwy/AdultSpineintakechatbot`.

### 1. Practice Hub side (its own repo: `practice-hub/`)

Migration `0007_intake` and the `/api/intake` endpoint are in the Practice Hub
source; the shared service key is Terraform-managed.

```powershell
cd "C:\AWEY PRACTICE BLUEPRINT PLAYBOOK\CASE LOGS AND PORTFOLIO\practice-hub"
terraform -chdir=deploy\terraform apply      # adds practicehub/INTAKE_API_KEY
.\deploy\deploy.ps1 -Follow                  # ships the code; migration runs on start
```

### 2. This stack

```bash
npx cdk bootstrap aws://933164653563/us-east-1     # first time only
npx cdk deploy
```

Outputs: the bucket, KMS key, worker name, the Amplify compute role ARN and
the environment block for the app. Settings live in `cdk.json` → `context`
(`practiceHubUrl`, model ids, `allowedOrigins` for browser uploads,
`createCloudTrail`).

### 3. Amplify app

In the Amplify console: **Create new app → GitHub**, authorize the Amplify
GitHub App for `rnjcbwy/AdultSpineintakechatbot`, choose the branch to deploy
(`feature/adult-spine-intake-app` or `master` after merging), accept the
detected `amplify.yml`. Then attach the role and environment this stack made:

```bash
node scripts/aws/amplify-configure.mjs --app-id <app id from the console>
```

Put the resulting `https://<branch>.<appid>.amplifyapp.com` origin into
`cdk.json` → `allowedOrigins` and run `npx cdk deploy` again (bucket CORS), then
redeploy the branch. A custom domain (e.g. `intake.yourdomain.com`) is added
under Amplify → Domain management; add it to `allowedOrigins` the same way.

### 4. Verify

```bash
node scripts/aws/bedrock-smoke.mjs          # the two models answer
node scripts/test-transcript-pdf.mjs        # renders .pdf-tmp/sample-transcript.pdf
```

Then complete the intake on the live site with a fictional patient: the form
should appear under Practice Hub → Intake forms with the transcript, the draft
note and any attachments, and the office inbox should show it.

## Two deploys, not one

The site (Amplify) and the worker (Lambda) are deployed separately. A push to
the branch rebuilds the site only. Anything the worker runs, which is the note
prompt (`lib/prompts.js`), the transcript PDF, the Practice Hub hand-off and
whatever they import, reaches production only with:

```bash
npx cdk deploy
```

If you change how the note is written and the live notes do not change, this
is why.

## Operating it

- **Logs**: CloudWatch `/aws/lambda/spine-intake-worker` and the Amplify
  compute logs. Lines are JSON events with ids, counts and error classes only;
  no request content, prompts, notes or file names are ever logged.
- **Stuck submission**: `pending/<id>` markers in the bucket are what the sweep
  retries; `submissions/<id>/state.json` records the step and error class.
  `aws lambda invoke --function-name spine-intake-worker --payload '{"submissionId":"<id>"}' out.json`
  re-runs one by hand.
- **Rotate the service key**: `terraform apply` with a tainted
  `random_password.intake_api_key`, then `deploy.ps1`; the worker reads the new
  value within 10 minutes (it caches the secret).
- **Finish-later links**: a patient can ask for a link to carry on from
  another device. The answers so far go to `drafts/<id>/draft.json` in the
  bucket (same KMS key), the link carries a bearer code (hash stored), it
  expires after 30 days and is deleted when the intake is submitted. Emailing
  the link needs a verified Amazon SES identity: set `emailFrom` in
  `cdk.json` (e.g. `"Dr. Aaron Wey's office <office@example.com>"`), verify
  that address in SES (and move the account out of the SES sandbox so it can
  mail any patient), then `npx cdk deploy` and re-run
  `scripts/aws/amplify-configure.mjs`. Until then the form offers the link to
  copy or to open in the patient's own mail app. The email holds the link
  only, never a name or any answer.
- **Costs**: Amplify ≈ $0–5/mo at clinic volumes, Lambda/S3/KMS/EventBridge a
  few dollars, Bedrock ≈ $0.15–0.40 per intake (one Opus note, a short chat),
  CloudTrail's first management-event trail is free (S3 storage only).

## Security and HIPAA posture

Covered here: only HIPAA-eligible services under the BAA; encryption in
transit (TLS everywhere, S3 bucket policy refuses plain HTTP) and at rest
(customer-managed KMS); no long-lived credentials; least-privilege roles;
per-submission access tokens; PHI-free logs; CloudTrail; security headers and
a CSP; the prototype warnings, `/diagram-lab` and the clinician demo link are
off in `DEPLOYMENT_TIER=production`.

Still yours to do (software cannot): the written security risk analysis,
staff policies and training, Holy Name's sign-off on a practice-run system,
reviewing Practice Hub's access log, and the business-associate relationship
for anything else in the chain.

Practice Hub now runs on ECS Fargate behind CloudFront and an ALB (its App
Runner service, which was not HIPAA-eligible, has been retired), so the whole
chain from the patient's browser to the office inbox is on eligible services.
The hand-off URL is the CloudFront address in `cdk.json`; if Practice Hub
moves again, change it there, `npx cdk deploy`, re-run
`scripts/aws/amplify-configure.mjs` and redeploy the branch, because the
Amplify build bakes the URL into the server bundle.

## Languages

The patient can choose English, Spanish, Chinese, Portuguese, Russian, Polish,
Arabic, Hebrew, Korean, Japanese, Hindi or Nepali on the welcome page. Spanish
and Chinese are written inline next to each English string; the other nine
live in `lib/translations/<code>.json` and are loaded on demand. Arabic and
Hebrew flip the layout right-to-left. After adding or changing English strings
in the UI, run `node scripts/translate-ui.mjs` (Claude on Bedrock; only
missing strings are translated, existing ones are never overwritten; edit the
JSON by hand to correct a translation). The generated note is always English
regardless of the language the patient wrote in. Known limit: the transcript
PDF prints free-text answers written in non-Latin scripts as a marker and
points to the structured record, because its fonts cover Latin only.

## The express request (website chat)

`/express` is the short appointment request behind the "Chat with us" launcher
on aaronweymd.com (`components/ExpressIntake.js`, `lib/express.js`). Five turns,
phrased by the same Claude model through the same `/api/chat` route
(`mode: 'express'`): name and date of birth, phone or email, what is going on in
the patient's words, the safety question (bladder or bowel control, saddle
numbness, rapidly worsening weakness, fever with back pain) and the language
for the call. The answers are kept by slot, shown on a card the patient
corrects and sends, and then go through the ordinary path
(`/api/intake/submit`, worker, Practice Hub) marked `express`. The lead note is
written without the model (`expressLeadNarrative`), the transcript PDF opens
with an "Express appointment request" section, and the hand-off carries
`express: true`, the language name for the call and `summary.visitReason`. The
thank-you screen offers the full intake now (a finish-later draft opened at
`/?resume=…`, in a new tab when inside the website's panel) or a link for
later; a full intake started that way carries `express.leadId`, the lead's
submission id.

Checks: `node scripts/test-express.mjs` (offline) and
`node scripts/e2e-express-submit.mjs http://localhost:3000` (against a dev
server; the chat turn needs Bedrock credentials).

**What the deploy needs beyond a push:**

1. **Framing.** `next.config.js` lets `/express` alone be framed, by
   `https://aaronweymd.com`, `https://www.aaronweymd.com` and
   `https://aaronweymd-2026.netlify.app` (`EXPRESS_FRAME_ANCESTORS` overrides
   the list; set it on the Amplify app and re-run
   `scripts/aws/amplify-configure.mjs` if the website moves). Every other page
   keeps `X-Frame-Options: DENY`. After the deploy, check that
   `curl -sI https://intake.aaronweymd.com/express` shows the
   `frame-ancestors` list and no `X-Frame-Options`, and that `/` still shows
   `DENY`.
2. **The worker.** The lead note, the PDF section and the hand-off fields run in
   the Lambda worker, so this change needs `npx cdk deploy` as well as the
   Amplify build (see "Two deploys, not one").
3. **Practice Hub.** The hand-off already fits the hub's schema (it requires a
   date of birth, which the express card requires too). Unknown fields
   (`express`, `expressLeadId`, `summary.express`, `summary.safetyScreen`) are
   dropped by the hub until it learns them; the lead is still filed with
   `visitReason` "Express request from the website chat: please call to
   schedule" and the lead note. Showing an "express" badge and the safety
   answer in the hub's inbox is a Practice Hub change.
4. **Translations.** The express strings have inline Spanish and Chinese; run
   `node scripts/translate-ui.mjs` for the other nine languages (the model
   already asks in the chosen language; the fixed wording is the fallback when
   the model is unavailable).
5. **Rate limits.** The express chat uses the existing `/api/chat` limit (60
   calls per IP per minute) and submit limit (6 per IP per hour); the website
   launcher adds no traffic until a visitor opens it.
6. **Privacy notice.** The intake site's notice should mention that the chat
   can be opened from aaronweymd.com inside a panel; the website's privacy
   policy already says the conversation runs here.

## Local development

Nothing AWS-side is required: without `SPINE_SUBMISSIONS_BUCKET` submissions
go to `.data/submissions-store/`, the worker runs in-process, and attachments
upload through `/api/intake/[id]/upload`. Bedrock needs AWS credentials in the
environment (the `caselog-admin` profile works); or set
`LLM_PROVIDER=openai` with a key for fictional data only. To exercise the
hand-off, run Practice Hub locally (`npm run dev`, port 3100) with
`INTAKE_API_KEY=<anything>` in its `.env.local`, and set `PRACTICEHUB_URL`
and `PRACTICEHUB_API_KEY` here to match.
