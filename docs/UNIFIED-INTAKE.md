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
- where the problem is (neck, back, posture, shoulder, elbow, hand, hip,
  knee, foot, somewhere else)
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
- ortho.aaronweymd.com, pedsspine.aaronweymd.com and pedsortho.aaronweymd.com
  redirect (301, path and query kept) to intake.aaronweymd.com via Amplify
  custom rules on their apps (d382smsgd5xkup, d1dsz5t255b12o, d3chu9dux7tr7z).
- A link may name the service: `?service=adult_ortho` (and the other keys)
  pre-sets the direction; the triage step still confirms it.
- Practice Hub: the four form links point at intake.aaronweymd.com with the
  service on the link (`src/server/intake-forms.ts`); its intake endpoint
  accepts all four service keys and files a chart under the adult or the
  pediatric line (`chartServiceFor` in `src/server/intake.ts`).
- The note worker (`spine-intake-worker`) was redeployed from this code.
- Kiosk: `?kiosk=1` once per tablet; the language chosen on the welcome
  stays through "Start a new intake form" and the clinic code.

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
