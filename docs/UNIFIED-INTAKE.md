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

## Phases

1. **Foundation** (this branch, in progress): the service switch, the triage
   step, the ortho content merged in from the adult ortho repo as the
   `ortho` service. Both adult paths verified end to end.
2. **Pediatric spine**: the child's demographics (parent or guardian filling
   in, growth, birth history, school), the scoliosis and early-onset sections,
   SRS-22r, from the pediatric spine app. Service `peds_spine`.
3. **Pediatric orthopaedics**: the fracture-clinic track, injury and cast or
   splint questions, the pediatric post-operative questions. Service
   `peds_ortho`.
4. **Cutover**: one Amplify app at one address; the three other addresses
   redirect to it with the service pre-set (`/spine`, `/ortho`, `/kids`
   style paths keep referral links working); Practice Hub's four form URLs
   point at the one site; the old apps are archived.

## Conventions for anyone working on this branch

- Never duplicate a step component per service. Make the shared component
  read what differs from the service module; add an export to **both**
  service folders (empty if one has nothing) so the shape stays identical.
- Keep the form faceless: never the surgeon's name, hospital or logo on a
  patient-facing screen. "The office" and "the practice" only.
- Every patient-facing string goes through `t()`; the Spanish and Chinese
  dictionaries are inline, the other nine come from `scripts/translate-ui.mjs`.
- Do not run `next build` while the dev server is running (it wipes `.next`).
