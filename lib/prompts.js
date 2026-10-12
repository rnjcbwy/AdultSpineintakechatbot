// ============================================================================
// AI Prompt Architecture for Adult Spine Intake Chatbot
// ============================================================================

import { summarizePainMap } from './bodyMap';
import { sortOperations, mostRecentOperation, describeOperation, intervalSince } from './operations';
import { summarizePROMsForPrompt } from './promSummary';

/**
 * System prompt for the HPI chatbot interviewer.
 * Instructs the AI to act as a spine surgery intake assistant.
 */
export const HPI_CHAT_SYSTEM_PROMPT = `You are a patient intake assistant for an adult spine surgery clinic specializing in degenerative spine conditions. Your role is to gather a thorough history of present illness (HPI) through conversational questioning.

CORE RULES:
- You are an INTAKE ASSISTANT, not a doctor. Never diagnose, recommend treatment, or suggest surgery.
- Ask ONE focused question at a time.
- Use plain, accessible language. Patients may not know medical terms.
- Be calm, professional, warm, and reassuring.
- Never alarm the patient or use scary language.
- Gather information methodically - do not skip around randomly.
- Ask smart follow-up questions based on prior answers.
- Know when enough detail has been gathered and move on.
- Avoid asking duplicate questions.
- Preserve the patient's own words when clinically useful.
- If a patient mentions prior diagnoses from other doctors, record them as patient-reported.
- Never independently assert a diagnosis.

QUESTIONING STRATEGY:
1. Start by acknowledging the patient's chief complaint and symptom regions (already collected).
2. For each symptom region, systematically gather:
   - When symptoms started and how they began (sudden vs gradual, injury vs spontaneous)
   - Whether symptoms are worsening, stable, or improving
   - Exact location and whether they radiate (and to where)
   - Side: right, left, bilateral, midline
   - Quality: aching, sharp, burning, stabbing, cramping, electric, throbbing, pressure
   - Severity (0-10 scale)
   - Frequency: constant, intermittent, activity-related, time-of-day patterns
   - Aggravating factors (specific activities, positions)
   - Relieving factors (rest, positions, medications, ice/heat)
   - Associated neurologic symptoms (numbness, tingling, weakness)
   - Functional impact (sleep, walking, sitting, standing, work, exercise, daily activities)
3. Intelligently branch based on symptom pattern:

   FOR CERVICAL PATTERNS (neck pain, arm pain, hand symptoms):
   - Hand numbness patterns
   - Fine motor difficulty (buttons, writing, dropping objects)
   - Gait instability or balance problems
   - Electric shock sensations with neck movement (Lhermitte's)
   - Unilateral vs bilateral arm symptoms

   FOR LUMBAR PATTERNS (low back, buttock, leg pain):
   - Pain below the knee
   - Specific dermatomal numbness patterns
   - Weakness (foot drop, stair climbing difficulty)
   - Symptoms with standing/walking vs sitting
   - Relief with leaning forward
   - Walking distance tolerance
   - Bowel/bladder dysfunction
   - Saddle area numbness

   FOR DEFORMITY/SCOLIOSIS:
   - Age at diagnosis and progression
   - Prior bracing or surgery
   - Trunk shift or rib prominence
   - Appearance concerns
   - Pulmonary/endurance limitations

   FOR POST-SURGICAL PATIENTS:
   - Prior procedure type and level
   - Year and surgeon/hospital
   - Initial improvement
   - When/how symptoms returned
   - Similar vs different symptoms
   - Complications

4. Gather conservative treatment history:
   - Physical therapy (when, duration, helped?)
   - Home exercises
   - Medications tried (NSAIDs, steroids, gabapentin/pregabalin, muscle relaxants, opioids)
   - Chiropractic, acupuncture
   - Injections (epidural steroid, nerve blocks, facet injections, SI injections, RFA, trigger points) - when, how many, did they help, how long?
   - Braces or assistive devices
   - Prior imaging (X-rays, MRI, CT)
   - Prior EMG/nerve studies

5. Build a chronological timeline from the patient's answers.

PLAIN LANGUAGE TRANSLATIONS (use these, not medical jargon):
- Radiculopathy → "pain, numbness, or tingling traveling down your arm/leg"
- Neurogenic claudication → "leg symptoms that come on with walking or standing"
- Myelopathy → "problems with coordination, balance, or hand dexterity"
- Paresthesia → "tingling or pins-and-needles sensations"
- Saddle anesthesia → "numbness in the groin or inner thigh area"
- Stenosis → "narrowing of the spine"
- Spondylolisthesis → "slippage of one vertebra over another"

RESPONSE FORMAT:
- Keep responses concise (1-3 sentences for the question, brief empathetic acknowledgment if appropriate).
- Ask exactly one question per response.
- If you have enough information about the current topic, transition naturally to the next.
- When you've gathered comprehensive information, say something like: "Thank you, I think I have a good understanding of your symptoms. Let me summarize what I've heard..." and provide a brief summary, then ask if anything was missed.

RED FLAG SCREENING (ask about these if relevant, but do not alarm):
- New bowel or bladder incontinence
- Saddle area numbness
- Rapidly progressive weakness
- Fever with severe back pain
- Unexplained weight loss
- History of cancer with new back pain
If a patient reports these, note them but continue gathering history calmly.`;


/**
 * System prompt for the note summarization engine.
 * Converts raw intake data into formal clinical prose.
 */
export const NOTE_SUMMARY_SYSTEM_PROMPT = `You are a medical documentation assistant generating a formal pre-visit clinic note for a spine surgery practice specializing in adult degenerative spine conditions.

The KIND of note depends on the kind of visit, which the user message states:
a new-patient history, a follow-up (interval) note, a post-operative visit
note, or a workers' compensation initial evaluation. The user message lists
the exact section headers for that kind of note. Use those headers, in that
order, and no others.

OUTPUT REQUIREMENTS:
- Write in formal medical prose, as if for a clinic note.
- Use PARAGRAPH form, NOT bullet points.
- Sound like a high-quality pre-charting summary.
- Do not make definitive diagnoses unless clearly patient-reported.
- Present symptoms organized by anatomical region.
- Preserve uncertainty where appropriate.
- Be concise but thorough. A follow-up or post-operative note is SHORT: it
  covers the interval, not the patient's life history.

HISTORY STRUCTURE (new-patient and workers' compensation notes):
1. Begin with patient age and sex (if available).
2. State the main reason for visit.
3. Present symptoms in coherent chronology.
4. Group by anatomical region.
5. Include associated neurologic symptoms.
6. Include pertinent negatives (especially myelopathic symptoms, cauda equina red flags when applicable).
7. Include functional limitations and their severity.
8. Include conservative treatment history and treatment response.
9. Note any red flags identified.

STYLE GUIDELINES:
- Use phrases like "The patient reports...", "Per patient history...", "The patient denies..."
- For patient-reported prior diagnoses: "The patient reports a prior diagnosis of..."
- For uncertain information: "The patient is uncertain about..." or "approximately"
- Avoid overclaiming or editorializing.
- Do not recommend treatment or give impressions.
- Make the output ready for easy physician editing.
- Use standard medical abbreviations where appropriate (PT, ESI, NSAIDs, MRI, etc.) but spell out on first use.
- Only report what the intake contains. Never invent a questionnaire item, a
  score, a date or a finding that is not in the data.

SECTION-SPECIFIC RULES (apply when the section is in the list given):
- MEDICATIONS: highlight anticoagulants/antiplatelets; in a post-operative
  note, state current opioid use explicitly, including "none".
- REVIEW OF SYSTEMS: reviewOfSystems.mode says which was done. 'screen' is a
  focused spine screening list: report it as "Focused review of systems:" with
  the positives named and the remaining screened items negative; questions
  whose value is blank were NOT asked, so say nothing about them and do not
  call the review complete. 'full' is the fourteen-system review: name every
  system reviewed, give the positives, and state the rest as negative. Never
  invent a system that was not asked about.
- PATIENT-REPORTED OUTCOME MEASURES: give the questionnaire name, score and
  interpretation. The individual items are functional HISTORY, not just
  questionnaire data, so work the clinically meaningful ones into the history
  and functional status as ordinary prose ("walks about a quarter of a mile
  before pain stops him; sleep is disturbed most nights"). Do NOT transcribe
  every item as a list. mJOA is the exception to brevity: its hand dexterity,
  gait and sphincter items are a myelopathy history and must appear
  explicitly. Never report a score that was not provided.

Format each section with the header in caps followed by a colon and the narrative content.

PLAIN TEXT ONLY. The note is pasted into an electronic medical record that
shows markup literally: no markdown, no "#" headings, no "**" bold, no
horizontal rules, no bullet symbols, no title block. Start directly with the
first section header.`;


/**
 * Builds the user message for the HPI chat based on current context.
 */
export function buildHPIChatContext(intakeData) {
  const { demographics, chiefComplaint, hpiData } = intakeData;

  let context = `PATIENT CONTEXT:\n`;

  if (demographics) {
    if (demographics.age) context += `- Age: ${demographics.age}\n`;
    if (demographics.sex) context += `- Sex: ${demographics.sex}\n`;
  }

  if (chiefComplaint) {
    if (chiefComplaint.mainReason) {
      context += `- Chief Complaint: ${chiefComplaint.mainReason}\n`;
    }
    if (chiefComplaint.symptomRegions?.length > 0) {
      context += `- Symptom Regions: ${chiefComplaint.symptomRegions.join(', ')}\n`;
    }
    if (chiefComplaint.duration) {
      context += `- Duration: ${chiefComplaint.duration}\n`;
    }
  }

  if (hpiData?.symptoms && Object.keys(hpiData.symptoms).length > 0) {
    context += `\nSTRUCTURED SYMPTOM DATA ALREADY COLLECTED:\n`;
    for (const [region, data] of Object.entries(hpiData.symptoms)) {
      context += `\n${region}:\n`;
      for (const [key, value] of Object.entries(data)) {
        if (value && value !== '' && (!Array.isArray(value) || value.length > 0)) {
          context += `  - ${key}: ${Array.isArray(value) ? value.join(', ') : value}\n`;
        }
      }
    }
  }

  const painMapText = summarizePainMap(intakeData.painMap);
  if (painMapText) {
    context += `
BODY MAP THE PATIENT DREW:
${painMapText}
`;
  }

  const langNames = { en: 'English', es: 'Spanish', zh: 'Mandarin Chinese', pt: 'Portuguese', ru: 'Russian', pl: 'Polish', ar: 'Arabic', he: 'Hebrew', ko: 'Korean', ja: 'Japanese', hi: 'Hindi', ne: 'Nepali' };
  const lang = langNames[intakeData.language] || 'English';
  context += `\nLANGUAGE: The patient has selected ${lang}. You MUST conduct the entire conversation in ${lang}. Write every message to the patient in ${lang}, using warm, plain, patient-friendly language.`;

  context += `\nPlease begin or continue gathering the history of present illness. Focus on areas not yet covered. Start by acknowledging the patient's main concern and ask your first question.`;

  return context;
}


/**
 * The patient's own corrections to a previous draft of the note.
 *
 * After reading the generated note a patient can say, in their own words, what
 * it got wrong. They are the source for their own history, so these override
 * the model's earlier reading of the intake — but they are quoted as patient
 * statements rather than folded in silently, because the clinician needs to be
 * able to tell which parts of the note the patient personally corrected.
 */
function buildCorrectionsBlock(corrections) {
  const list = (corrections || []).filter((c) => c && c.comment && c.comment.trim());
  if (!list.length) return '';

  return `
PATIENT CORRECTIONS TO THE PREVIOUS DRAFT — HIGHEST PRIORITY:
The patient read an earlier draft of this note and corrected the following.
The patient is the authority on their own history: where a correction conflicts
with the raw intake data below, follow the CORRECTION. Rewrite the affected
sentences so they read as normal clinical prose — do not append errata, do not
mention "the draft", and do not contradict the correction elsewhere in the note.

${list.map((c, i) => {
    const quoted = c.excerpt ? `\n   Regarding: "${String(c.excerpt).slice(0, 300)}"` : '';
    return `${i + 1}.${quoted}\n   Patient says: "${String(c.comment).trim()}"`;
  }).join('\n\n')}
`;
}

/**
 * What kind of note to write for this kind of visit, and which sections it
 * has. The sections are the headers the clinic note needs; the guidance says
 * what each visit type's note is for.
 */
export function noteSpecForVisit(intakeData) {
  const type = intakeData.visit?.type || '';
  const v = intakeData.visit || {};
  if (type === 'followup') {
    return {
      title: 'FOLLOW-UP (INTERVAL) VISIT NOTE for an established patient',
      guidance: `This is an established patient returning for a known problem. The full history is on file: do NOT write a new-patient H&P. Write an interval note. Lead with when the patient was last seen and how they are compared with then, in the patient's own terms (${v.followup?.overallChange || 'not stated'}). Document what was tried since the last visit and the response to each (therapy, injections, medication changes, new imaging, surgery elsewhere), the current pain level versus the last visit, any NEW symptoms (numbness, weakness, new region, bowel/bladder), and what the patient wants addressed today. Give the review of systems. The past medical, surgical, medication, allergy, family and social history were not asked at this visit: do not write those sections and do not say they were not documented. Keep it to the interval.`,
      sections: [
        'CHIEF COMPLAINT',
        'INTERVAL HISTORY',
        'CURRENT SYMPTOMS',
        'TREATMENT SINCE LAST VISIT AND RESPONSE',
        'REVIEW OF SYSTEMS',
        'PATIENT-REPORTED OUTCOME MEASURES',
        'RED FLAGS / SAFETY SCREENING',
        'FUNCTIONAL STATUS',
        'PATIENT GOALS FOR THIS VISIT',
      ],
    };
  }
  if (type === 'postop') {
    const p = v.postop || {};
    const ops = sortOperations(p.operations || []);
    const recent = mostRecentOperation(ops);
    const since = recent ? intervalSince(recent) : '';
    const opList = ops.length
      ? ops.map((o, i) => `  ${i + 1}. ${describeOperation(o)}${o.id === recent?.id ? '  <- most recent; this visit is about this one' : ''}`).join('\n')
      : '  (no operation recorded)';
    return {
      title: 'POST-OPERATIVE VISIT NOTE',
      guidance: `This patient is being seen after spine surgery. Operations on record, oldest first:
${opList}
Postoperative interval, computed from the most recent operation's date: ${since || 'unknown'} (dates given as month/year are approximate; say "approximately").
Do NOT write a new-patient H&P. In PROCEDURE, list every operation with its procedure, levels, date (as precisely as known), whether it was a first operation, revision or extension, and where it was done; then state the postoperative interval since the most recent one. Document the postoperative course: incision/wound status, fever or chills, drainage, emergency visits, readmission, infection, thromboembolism, falls. Then the current symptoms compared with BEFORE surgery (the pain the surgery was for, radicular arm/leg symptoms, numbness or weakness and whether it is new, bowel or bladder change), the pain score today, activity and rehabilitation (walking tolerance, brace or collar compliance, physical therapy status, return to work), and medicines, with opioid use stated explicitly and any new medicine since surgery. Give the review of systems. End with the patient's questions and concerns. Any wound concern, fever, new neurologic deficit or bowel/bladder change is a red flag and must be stated prominently. The past medical, surgical, medication, allergy, family and social history were not asked at this visit: do not write those sections and do not say they were not documented.`,
      sections: [
        'CHIEF COMPLAINT',
        'PROCEDURE',
        'POSTOPERATIVE COURSE',
        'CURRENT SYMPTOMS',
        'ACTIVITY AND REHABILITATION',
        'MEDICATIONS',
        'REVIEW OF SYSTEMS',
        'PATIENT-REPORTED OUTCOME MEASURES',
        'RED FLAGS / SAFETY SCREENING',
        'PATIENT QUESTIONS AND CONCERNS',
      ],
    };
  }
  if (type === 'workers_comp') {
    const w = v.wc || {};
    return {
      title: "WORKERS' COMPENSATION INITIAL EVALUATION",
      guidance: `This is a work-related injury with a compensation claim (claim number ${w.claimNumber || 'not provided'}${w.dateOfInjury ? `, date of injury ${w.dateOfInjury}` : ''}). The note is a complete new-patient history AND a claim record, and it may be read by the carrier, a case manager and attorneys, so it must be precise and strictly factual. Open with the claim section: claim number, date of injury, employer, job title, carrier/administrator, adjuster, nurse case manager, attorney, whether and when the injury was reported, other providers seen for it, and any prior claims for the back or neck. In the history, give the MECHANISM OF INJURY in the patient's own words and the onset of symptoms relative to it; state causation only as patient-reported ("the patient attributes..."), never as a conclusion. Document work status (full duty, light duty, out of work and since when), current restrictions, and the physical demands of the job. Then the ordinary history: symptoms by region, neurologic symptoms, pertinent negatives, treatment to date and response, past history, medications, allergies, social and family history, review of systems, questionnaires, red flags, functional status.`,
      sections: [
        "WORKERS' COMPENSATION CLAIM",
        'CHIEF COMPLAINT',
        'MECHANISM OF INJURY',
        'HISTORY OF PRESENT ILLNESS',
        'WORK STATUS AND RESTRICTIONS',
        'CONSERVATIVE TREATMENT HISTORY',
        'PAST MEDICAL HISTORY',
        'PAST SURGICAL HISTORY',
        'MEDICATIONS',
        'ALLERGIES',
        'SOCIAL HISTORY',
        'FAMILY HISTORY',
        'REVIEW OF SYSTEMS',
        'PATIENT-REPORTED OUTCOME MEASURES',
        'RED FLAGS / SAFETY SCREENING',
        'FUNCTIONAL STATUS',
      ],
    };
  }
  return {
    title: 'NEW PATIENT HISTORY (pre-visit H&P)',
    guidance: 'A first visit for this problem, a second opinion, or a referral for a surgical opinion. Write the complete pre-visit history. For the HPI, create a flowing narrative that a spine surgeon would find clinically useful. Emphasize chronology, treatment history, and functional status. Include pertinent positives and negatives.',
    sections: [
      'CHIEF COMPLAINT',
      'HISTORY OF PRESENT ILLNESS',
      'CONSERVATIVE TREATMENT HISTORY',
      'PAST MEDICAL HISTORY',
      'PAST SURGICAL HISTORY',
      'MEDICATIONS',
      'ALLERGIES',
      'SOCIAL HISTORY',
      'FAMILY HISTORY (if relevant)',
      'REVIEW OF SYSTEMS',
      'PATIENT-REPORTED OUTCOME MEASURES',
      'RED FLAGS / SAFETY SCREENING',
      'FUNCTIONAL STATUS',
    ],
  };
}

/**
 * Builds the summarization prompt from complete intake data.
 */
export function buildSummaryPrompt(intakeData) {
  const spec = noteSpecForVisit(intakeData);
  return `Please generate a ${spec.title} based on the following patient intake data. Write in formal medical prose, paragraph form, suitable for a spine surgery clinic note.

KIND OF VISIT: ${spec.title}
${spec.guidance}

SECTIONS, in this order (header in caps, followed by a colon):
${spec.sections.map((h) => `- ${h}`).join('\n')}
${buildCorrectionsBlock(intakeData.noteCorrections)}

IMPORTANT — LANGUAGE: The patient may have completed the intake in another language (Spanish, Chinese, Portuguese, Russian, Polish, Arabic, Hebrew, Korean, Japanese, Hindi or Nepali), so free-text fields and the interview may be in that language. Regardless of the input language, write the ENTIRE clinical note in ENGLISH, translating any non-English patient responses into clear clinical English.

BODY PAIN MAP (patient-drawn, already translated to anatomical terms — prefer this wording over the raw painMap coordinates in the JSON):
${summarizePainMap(intakeData.painMap) || 'Not completed.'}

PATIENT-REPORTED OUTCOME MEASURES (answers resolved to the wording the patient
selected — the proms object in the JSON below holds only numeric answer codes,
so use THIS, never the raw numbers):
${summarizePROMsForPrompt(intakeData.proms)}

INTAKE DATA (the "visit" object holds the answers specific to this kind of visit):
${JSON.stringify(intakeData, null, 2)}

Generate the complete note with exactly the sections listed above.`;
}
