# One intake for every patient

The four intake sites (adult spine, adult orthopaedics, pediatric spine,
pediatric orthopaedics) become one site, one codebase and one deployment.
The patient never picks a form: the first screen after the welcome works out
the direction from a few taps and a sentence, and the form adjusts.

This branch (`feature/unified-intake`) is built on the adult spine app, the
most complete of the four (visit types, claims, kiosk mode, twelve languages,
uploads with AI fill, finish-later links, phone intake, Practice Hub). The
four live sites keep running untouched until this one is proven.

## How the form decides

`components/steps/Triage.js`, the step right after the welcome, asks:

- who the form is for: myself / my child (under 18) / an adult I am helping
- whether this is the patient's first visit with this doctor (a visit to the office with another doctor still counts as a first visit, and a first visit always gets the full new-patient history)
- where the problem is (neck, back, posture, then the limb in body order:
  shoulder, upper arm, elbow, forearm, wrist, hand, hip, thigh, knee, lower
  leg, ankle, foot, then the pelvis or tailbone, the SI joint, somewhere else)
- a sentence or two about it

From those it settles, and shows for one-tap correction:

| Decision | Values | Decided by |
|---|---|---|
| patient | adult / child | the "who" answer |
| specialty | spine / ortho | region taps when they all point one way; otherwise the model, from the description (`/api/triage`) |
| kind of visit | new problem / follow-up / after an operation | the model from the description; the patient confirms |
| claim | none / workers' comp / personal injury | the model, only when the description says so; the patient confirms |

`patient` + `specialty` name the **service** (`lib/service.js`):
`adult_spine`, `adult_ortho`, `peds_spine`, `peds_ortho`, the same keys
Practice Hub uses. A form opened from a chart link (`?invite=`) carries the
service from the hub and the specialty row is pre-set.

The kind of visit and the claim feed the existing visit machinery
(`lib/flows.js`: `visit.choice`, `visit.hadSurgery`, `visit.workInjury`,
`visit.type`), so the follow-up, post-operative, workers' comp and personal
injury flows are unchanged. The old separate "type of visit" step is gone.
The first-visit answer is recorded in `triage.firstTime` and sent to Practice
Hub; the follow-up and post-operative kinds are only offered to a patient
who has seen this doctor before.

## Where the differences live

Everything that differs between the spine and the bone-and-joint questions
is a module under `lib/services/<specialty>/`, with the same exports in both
folders:

| Module | What it holds |
|---|---|
| `constants` | symptom regions, PMH list, implants, medications, injections, family history, visit reasons |
| `problems` | how regions fold into problems for the symptom-details step |
| `painMapTriggers` | what a body-map mark implies |
| `questionnaires` | the outcome questionnaires (ODI, NDI, mJOA, SRS-22r for spine; the joint scores for ortho) |
| `promSummary` | scoring and summaries of those |
| `redFlags` | the red-flag rules |
| `rosSystems` | the review-of-systems lists |
| `operations` | procedures, levels or joints, operation shapes |
| `prompts` | the interview and note prompts |

Components read them through `useService()` (`lib/store.js`); server code
through `getService(intake.service?.key)` (`lib/service.js`). The old
`lib/<module>.js` files are shims to the spine version and go away once
nothing imports them.

Shared and written once: welcome, triage, demographics, uploads, medications,
allergies, social and family history, review and signature, kiosk mode,
languages, drafts, Practice Hub hand-off.

## Status (2026-10-21)

Done on this branch: the triage step; the adult spine and adult ortho
services merged; the pediatric spine and pediatric ortho services ported
(parent-or-guardian demographics, growth, clinical photos, the spine history
step with follow-up and post-operative variants, the fracture-clinic short
path, pediatric questionnaires, prompts, note specs and red flags); the
streamlining pass (nothing asked twice: triage pre-fills the areas and the
main concern, safety answers pre-fill the review of systems, imaging asked
once, claim asked once, medicines-tried and care window only for new
problems, nicotine on daily life, the mode gate and the additional-details
step gone, follow-ups without symptom details, plain step names, a compact
progress line on phones, an insurance-card photo that fills the plan and
numbers); the nine language tables regenerated.

Walked in the browser without errors: adult spine new, adult ortho new and
new-problem, adult spine follow-up, child spine new, child ortho fracture.

## Cutover (2026-10-21)

- intake.aaronweymd.com (Amplify app d1i6bgjzjkpt0h, branch
  `feature/adult-spine-intake-app`) serves this app; `feature/unified-intake`
  is pushed onto that branch to deploy.
- ortho.aaronweymd.com and pedsspine.aaronweymd.com redirect (301, path and
  query kept) to intake.aaronweymd.com via Amplify custom rules on their apps
  (d382smsgd5xkup, d1dsz5t255b12o). pedsortho.aaronweymd.com serves the
  original pediatric ortho app again (2026-10-24, see the fracture form).
- A link may name the service: `?service=adult_ortho` (and the other keys)
  pre-sets the direction; the triage step still confirms it.
- Practice Hub holds ONE intake address (Settings → Team) and builds chart
  links as `<intake>/?service=<key>&invite=<token>[&lang=xx]`
  (`intakeUrl()` in `src/server/intake-invites.ts`); its intake endpoint
  accepts all four service keys and files a chart under the adult or the
  pediatric line (`chartServiceFor` in `src/server/intake.ts`).
- The note worker (`spine-intake-worker`) was redeployed from this code.
- Kiosk: `?kiosk=1` once per tablet; the language chosen on the welcome
  stays through "Start a new intake form" and the clinic code.

## Patient education after submitting (2026-10-22)

- `lib/education/guides.json` is the website's 163 guides (conditions,
  treatments, for-patients) in en/es/pt/ko/zh, built by
  `node scripts/build-guide-catalog.mjs` from the aaronweymd-site repo. Re-run
  after adding guides there.
- `lib/server/education.js` picks up to three guides per submission with the
  model, from a list narrowed to the part of the body the patient described
  (children's conditions never go to adults), and stores the pick as
  `submissions/<id>/education.json`. Only for those five languages.
- The thank-you screen shows them (`components/EducationOffer.js`, via
  `GET /api/intake/:id/education`), with a QR code each on wide screens and
  the clinic tablet; descriptions that name the surgeon are left off there.
- The worker sends one thank-you email per submission with the same guides
  (step 4 in `lib/server/intakeWorker.js`), from `EMAIL_FROM`. It stays off
  until EMAIL_FROM is set on the worker (CDK context `emailFrom`) and on the
  Amplify app, which needs SES production access first.

## The fracture form (2026-10-22)

A short pediatric injury form for a simple fracture or a fresh injury, after
a parent found the full form too long. It is the peds_ortho service on its
fracture track with `data.mode = 'fracture'` (`lib/fracture.js`):

- Address: https://intake.aaronweymd.com/fracture (and /fracture/es and the
  other language codes).
- 2026-10-24: at the surgeon's request pedsortho.aaronweymd.com serves the
  ORIGINAL pediatric orthopaedic app again (Amplify app d3chu9dux7tr7z, repo
  CHATBOTS/pedsorthointake, branch master; its custom rule is back to the
  SPA 404-200 rule, no redirect). It has its own fracture-clinic track,
  storage, worker and Practice Hub hand-off (source peds-ortho-intake).
  Changes for that form go into that repo, not this branch.
- Flow (`lib/services/peds-ortho/flow.js`): new injury = about your child,
  what happened, care so far, health check, review and send; a follow-up
  for the same injury = about your child, recovery so far, review and send.
  No triage step, no growth, history, symptom or questionnaire steps.
- New screens: `components/steps/peds/FractureBasics.js` (parent, child,
  contact, first visit or follow-up, optional insurance with the card photo)
  and `FractureHealth.js` (daily medicines, medicine allergies, conditions
  or operations, anesthesia problems; written into the usual lists).
- "Start a new form" and the clinic tablet's reset stay on the fracture form.

## One service per site again (2026-10-24)

At the surgeon's request the sites are one per service again:

| Address | What runs | Amplify |
|---|---|---|
| intake.aaronweymd.com | this code, `NEXT_PUBLIC_SERVICE_LOCK=adult_spine` | d1i6bgjzjkpt0h, branch feature/adult-spine-intake-app |
| ortho.aaronweymd.com | this code, `NEXT_PUBLIC_SERVICE_LOCK=adult_ortho` | d382smsgd5xkup, branch `unified` of rnjcbwy/AdultOrthoIntake (its old master is untouched) |
| pedsspine.aaronweymd.com | the original pediatric spine app | d1dsz5t255b12o, master of CHATBOTS/intake app |
| pedsortho.aaronweymd.com | the original pediatric ortho app | d3chu9dux7tr7z, master of CHATBOTS/pedsorthointake |

- The lock (`lib/siteLock.js`) keeps the new experience but offers only the
  site's own body areas, gives each site its original title and mark (spine
  on intake, knee on ortho) with links to the other forms, stops a child at
  the triage step with a link to the pediatric form, and sends another
  service's link, invite or /fracture to that service's site.
- The ortho branch uses the intake app's compute role and the same bucket,
  worker, Practice Hub URL and key secret (settings copied onto the branch).
- Deploying the adult sites: push `feature/unified-intake` to
  `feature/adult-spine-intake-app` on origin (intake) AND to `unified` on
  https://github.com/rnjcbwy/AdultOrthoIntake.git (ortho). Both build the
  same code; the Amplify setting picks the service.
- Unset lock (local development) still runs every service, as the combined
  form did. Set `NEXT_PUBLIC_SERVICE_LOCK` in `.env.local` to test a site.

## The short form and the paper form (2026-10-29)

Older patients found the full adult spine form too long, so:

- **The short form** (`lib/simple.js`, `components/steps/simple/*`) is the
  DEFAULT on intake.aaronweymd.com (mode `simple`, set on load and kept
  across "start a new form" when the site lock is adult_spine). Five screens:
  about you, what is bothering you (own words + dictation, seven big area
  buttons, how long, pain 0-10, better/worse), a few yes/no questions (the
  safety screen, prior spine surgery, work injury or accident in plain words,
  optional "already tried"),
  three health questions (medicines with the photo fill, allergies,
  conditions), sign and send with a one-tap "agree to all". A returning
  patient gets four screens. The thank-you says "Your intake is complete."
  and hides the note review. "Use the detailed form" on the welcome sets
  mode `full` (also `?form=full` / `?form=simple` on the address). The
  answers land in the full form's fields, so note, PDF, Practice Hub and
  the handouts are unchanged.
- **The paper form** (`scripts/build-paper-intake.mjs` ->
  `public/paper/spine-intake-paper-en.pdf`, `-es.pdf`): five letter pages,
  large type, big boxes, middle-school reading level. Pages 1 to 4 are the
  clinical form the hub reads (2026-10-30 shape, at the user's direction):
  name and contact only (no date of birth, sex or "seen before": those are
  on the registration), what brings you in, where it hurts with an "Other"
  line, a front-and-back body diagram to mark pain, its travel and numbness
  (the practice's own figure, `scripts/assets/body-diagram.jpg`, with its
  title cropped off; positions on it are fractions in `FIG`), how long,
  0-10, better or
  worse, the four safety questions, treatments tried with details (PT when,
  where, how long, how often; a row of alternative-therapy boxes:
  chiropractor, dry needling, massage, acupuncture, cupping, home
  exercises; injections when, how many, type and level; pain medicine),
  medicines, allergies, fifteen common conditions plus cancer (type, when,
  treated, ongoing or remission since) and serious infections, spine and
  other surgeries, a ten-system review of systems with "none of these",
  and social history (job, who they live with, stairs, activity level,
  activities, walking aid, smoking). No work-injury or claim question and
  no signature on the clinical pages. Page 5 is the five acknowledgments
  of `lib/consent.js` in plain words (English on every form) with the one
  signature block, filed with registration. No insurance details anywhere (the office has
  the card; the assignment-of-benefits statement still mentions insurance).
  The build fails if a page would run into the footer or the page count
  changes. `--sample` writes a filled copy to `.pdf-tmp/` for testing the
  reader; the hub reader's prompt already describes body-diagram marks
  into `symptoms.painLocations`. PyMuPDF is installed locally, so pages
  can be rendered to PNG and checked by eye.
- **Scan to note** lives in Practice Hub (its own commit e104ef7, "Paper
  intake forms"): the "Paper intake form" panel on the Intake forms page and
  on each chart photographs or scans the pages, `src/server/paper-intake.ts`
  transcribes them with Claude on Bedrock into a fixed JSON shape, flags red
  flags, drafts the clinic note and files the intake (to the chart when
  opened from one). The filled sample above was read back exactly and gave
  a correct H&P.

## Remaining

1. The review-of-systems defaults in `lib/store.js` still come from the
   spine list (works for every service because missing answers are
   tolerated; should read from the service).
2. The website express chat prompt still names the surgeon (office-side
   only, as in the old apps).
3. PROMIS pediatric T-score tables are an empty hook (raw scores are
   labelled as such), as in the pediatric ortho app.
4. Archive the three old repos once the one site has taken real intakes
   for a week or two; the Settings → Team page in Practice Hub may hold
   old form URLs that override the defaults, check it there.

## Conventions for anyone working on this branch

- Never duplicate a step component per service. Make the shared component
  read what differs from the service module; add an export to **both**
  service folders (empty if one has nothing) so the shape stays identical.
- Keep the form faceless: never the surgeon's name, hospital or logo on a
  patient-facing screen. "The office" and "the practice" only.
- Every patient-facing string goes through `t()`; the Spanish and Chinese
  dictionaries are inline, the other nine come from `scripts/translate-ui.mjs`.
- Do not run `next build` while the dev server is running (it wipes `.next`).
