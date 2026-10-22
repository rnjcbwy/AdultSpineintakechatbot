// ============================================================================
// Intake Data Store - React Context + localStorage Persistence
// ============================================================================

'use client';

import { createContext, useContext, useReducer, useEffect, useCallback, useMemo, useState } from 'react';
import { emptyROS, migrateROS } from './rosSystems';
import { EMPTY_PAIN_MAP } from './bodyMap';
import { LANGUAGES } from './i18n';
import { readCampaign, stripCampaignParams } from './campaign';
import { getService, isServiceKey } from './service';
import { FRACTURE_MODE, fractureStart, isFracturePath } from './fracture';

const STORAGE_KEY = 'spine-intake-data';
// The clinic tablet. Set with ?kiosk=1 once (cleared with ?kiosk=0); then the
// welcome screen offers "Start a new intake form", a finished or stale form
// is never shown to the next patient, and finish-later links are hidden.
const KIOSK_KEY = 'spine-intake-kiosk';
const KIOSK_STALE_MS = 30 * 60_000;

export function isKiosk() {
  try { return localStorage.getItem(KIOSK_KEY) === '1'; } catch { return false; }
}

// Default empty intake data structure
export const defaultIntakeData = {
  sessionId: '',
  createdAt: null,
  lastUpdated: null,
  currentStep: 0,
  completedSteps: [],
  language: 'en',
  // Set when the form was opened from a link the office sent from the patient's
  // chart: the code travels with the submission so Practice Hub files it there.
  invite: null,

  // Which of the four services this intake is for (lib/service.js):
  // { patient: 'adult'|'child', specialty: 'spine'|'ortho', key, how }.
  // `how` says who decided: 'regions' (the triage taps), 'ai' (the model from
  // the description), 'manual' (the patient corrected it), 'invite' (the
  // office sent the form for a named service). Empty until the triage step.
  service: { patient: '', specialty: '', key: '', how: '' },

  // 'fracture' on the short fracture form (lib/fracture.js); '' otherwise.
  mode: '',

  // The pediatric steps' answers (components/steps/peds/*), by service.
  pedsSpine: {},
  pedsOrtho: {},

  // The triage step's own answers (components/steps/Triage.js).
  triage: { who: '', firstTime: '', regions: [], description: '', suggestion: null },

  // The ad or link that brought the patient here (lib/campaign.js):
  // { source, medium, campaign, content, term, firstSeenAt }, read from the
  // utm_* tags of the first visit and never overwritten after that.
  campaign: null,

  // The express request from the website chat (lib/express.js), or null for
  // an ordinary intake: { startedAt, answers: { who, contact, problem, safety,
  // language }, transcript: [{ role, content }], safety: 'none' | 'yes' |
  // 'unsure', callLanguage, completedAt, leadId, continuedAt }. A full intake
  // that was started from a lead keeps `leadId` so the office can tie the two.
  express: null,

  // A "finish later" link the patient asked for: { id, token, url, savedAt }.
  // While it exists, the server copy is refreshed as the answers change, so
  // the link always opens the latest answers.
  draft: null,

  // Which kind of visit this is (lib/flows.js) and the answers that belong
  // only to that kind: the claim for a work injury, the interval history for a
  // follow-up, the operation and recovery for a post-operative visit.
  visit: {
    type: '',
    // What the patient chose ('new' | 'followup') and the question under it.
    choice: '',
    workInjury: '',
    hadSurgery: '',
    wc: {},
    pi: {},
    followup: {},
    postop: {},
  },

  demographics: {
    firstName: '',
    lastName: '',
    dob: '',
    age: '',
    sex: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States',
    insuranceProvider: '',
    memberId: '',
    // Everything the office needs to verify benefits and send records before a
    // first visit is on the books.
    groupNumber: '',
    insurancePhone: '',
    policyHolderName: '',
    policyHolderDob: '',
    policyHolderRelationship: '',
    secondaryInsurance: '',
    secondaryMemberId: '',
    secondaryGroupNumber: '',
    referringPhysician: '',
    referringPhone: '',
    referringFax: '',
    primaryCarePhysician: '',
    pcpPhone: '',
    pcpFax: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    visitReason: '',

    // A child's visit (service.patient === 'child'; components/steps/Demographics.js).
    // The name, date of birth, sex, phone and email above are the CHILD's
    // (the phone and email being the parent's, as the way to reach the
    // family), so everything downstream reads the same fields. The adult who
    // filled the form in: completedBy is 'parent' | 'patient'.
    guardian: { completedBy: 'parent', name: '', relationship: '' },
    // The family's language and preferences, and the child's other doctors.
    preferredLanguage: '',
    otherLanguage: '',
    interpreterNeeded: '',
    culturalPreferences: '',
    schedulingConsiderations: '',
    otherProviders: '',
    // The growth step (components/steps/peds/Growth.js). hasMenarche and
    // recentGrowthSpurt are 'yes' | 'no' ('unsure' for the spurt).
    growth: {
      heightFeet: '',
      heightInches: '',
      weightLbs: '',
      hasMenarche: '',
      menarcheOnset: '',
      recentGrowthSpurt: '',
      handedness: '',
      grade: '',
      school: '',
      sports: [],
      otherActivities: '',
      activityLevel: '',
    },
  },

  chiefComplaint: {
    mainReason: '',
    symptomRegions: [],
    duration: '',
    primaryConcern: '',
    hasPriorSpineSurgery: false,
    hasDeformityConcern: false,
    // Regions the body map adds for the orthopaedic service (painMapTriggers).
    addRegions: [],
  },

  // Body pain map: normalized marks + radiation traces per view.
  // Taken from bodyMap rather than written out here. The literal that used to
  // live in this file had already fallen behind twice — it never gained the
  // lateral views, and would not have gained customTypes either.
  painMap: JSON.parse(JSON.stringify(EMPTY_PAIN_MAP)),

  hpiData: {
    conversationHistory: [],
    // Per-problem answers (lib/problems.js): onset, onsetType, progression,
    // severity, quality, keyed by cervical | thoracic | lumbar | deformity.
    // `symptoms` (per area) is what older drafts hold and is no longer written.
    problems: {},
    primaryProblem: '',
    symptoms: {},
    primaryRegion: '',
    overall: {},
    additionalConcerns: '',
    conservativeTreatments: {
      // Every sub-field the Prior Treatments step writes is declared here.
      // The prior-auth specifics (facility, provider, frequency) were added to
      // the form without being added to this shape, so the data saved but the
      // schema did not admit it existed — which is what anything built from the
      // schema, including the exported spec, would have missed.
      physicalTherapy: { tried: false, facility: '', provider: '', duration: '', frequency: '', helped: '', details: '' },
      homeExercise: { tried: false, guided: '', appService: '', duration: '', frequency: '', details: '' },
      medicationsTried: [],
      chiropracticCare: { tried: false, duration: '', helped: '' },
      acupuncture: { tried: false, duration: '', helped: '' },
      injections: [],
      braces: { tried: false, type: '', helped: '' },
      priorImaging: [],
      priorEMG: { done: false, when: '', facility: '', provider: '', results: '' },
      // The patient tapped "Nothing yet" on the treatments step.
      noneTried: false,
    },
    // 'conversation' or 'questions': which path through Symptom Details.
    detailMode: '',
    priorSpineSurgeries: [],
    chatComplete: false,
    structuredComplete: false,
  },

  pastMedicalHistory: {
    conditions: [],
    implantedDevices: [],
    additionalNotes: '',
  },

  pastSurgicalHistory: {
    surgeries: [],
  },

  medications: {
    current: [],
    discontinued: [],
    noMedications: false,
  },

  allergies: {
    entries: [],
    nkda: false,
  },

  socialHistory: {
    tobaccoUse: '',
    tobaccoDetails: '',
    alcoholUse: '',
    alcoholDetails: '',
    drugUse: '',
    drugDetails: '',
    occupation: '',
    workStatus: '',
    disabilityStatus: '',
    livingSituation: '',
    mobilityAids: '',
    exerciseLevel: '',
    sports: '',
    compensationCase: '',
  },

  familyHistory: {
    entries: [],
    noRelevantHistory: false,
  },

  reviewOfSystems: emptyROS(),

  // What the patient told us the generated note got wrong. Kept with the
  // intake rather than inside generatedSummary so the corrections survive
  // each rewrite and the clinician can see what was challenged.
  noteCorrections: [],

  proms: {},

  // Evidence specifically required for prior-authorization review.
  // Document BYTES live in IndexedDB (see lib/documents.js); only metadata
  // is mirrored into `documents` so the note and clinician view can see it.
  authEvidence: {
    imagingStudies: [],      // { study, date, facility, hasReport, hasImages }
    medicationTrials: [],    // { drugClass, name, duration, helped }
    conservativeCareStart: '',
    conservativeCareEnd: '',
    nicotineCurrent: '',
    nicotineProduct: '',
    nicotineQuitDate: '',
    nicotineWillingToQuit: '',
    recordsNotes: '',
  },

  documents: [],

  // Acknowledgments and the typed signature from the final step. Mirrors the
  // paper new-patient packet: accuracy, financial responsibility and
  // assignment of benefits, receipt of the privacy notice, consent to be
  // contacted. Checked server-side before a submission is accepted.
  consent: {
    accurate: false,
    financial: false,
    privacy: false,
    contact: false,
    signatureName: '',
    signatureImage: null,
    signedAt: null,
    representativeName: '',
    representativeRelationship: '',
  },

  redFlags: [],

  generatedSummary: null,
  submittedAt: null,
};


// Reducer actions
function intakeReducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD':
      return {
        ...state,
        [action.section]: {
          ...state[action.section],
          [action.field]: action.value,
        },
        lastUpdated: new Date().toISOString(),
      };

    case 'SET_SECTION':
      return {
        ...state,
        [action.section]: {
          ...state[action.section],
          ...action.data,
        },
        lastUpdated: new Date().toISOString(),
      };

    case 'SET_STEP':
      return {
        ...state,
        currentStep: action.step,
        lastUpdated: new Date().toISOString(),
      };

    case 'SET_LANGUAGE':
      return {
        ...state,
        language: action.language,
        lastUpdated: new Date().toISOString(),
      };

    case 'COMPLETE_STEP':
      return {
        ...state,
        completedSteps: state.completedSteps.includes(action.step)
          ? state.completedSteps
          : [...state.completedSteps, action.step],
        lastUpdated: new Date().toISOString(),
      };

    case 'SET_NESTED':
      return setNestedValue(state, action.path, action.value);

    case 'SET_RED_FLAGS':
      return { ...state, redFlags: action.flags };

    case 'SET_SUMMARY':
      return {
        ...state,
        generatedSummary: action.summary,
        lastUpdated: new Date().toISOString(),
      };

    case 'SET_SUBMITTED':
      return {
        ...state,
        submittedAt: new Date().toISOString(),
      };

    case 'LOAD_STATE':
      return { ...action.state };

    case 'RESET':
      return {
        ...defaultIntakeData,
        // The fracture form stays the fracture form for the next family.
        ...(state.mode === FRACTURE_MODE ? fractureStart(defaultIntakeData.visit) : {}),
        sessionId: generateId(),
        createdAt: new Date().toISOString(),
      };

    default:
      return state;
  }
}


/**
 * Deep set a nested value by dot-path.
 */
function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  const result = { ...obj, lastUpdated: new Date().toISOString() };
  let current = result;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    current[key] = Array.isArray(current[key])
      ? [...current[key]]
      : { ...current[key] };
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
  return result;
}


function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}


// Context
const IntakeContext = createContext(null);

export function IntakeProvider({ children }) {
  const [state, dispatch] = useReducer(intakeReducer, defaultIntakeData);
  // Kiosk mode is read after mount so the server-rendered page and the first
  // client render agree (reading localStorage during render breaks hydration).
  const [kiosk, setKiosk] = useState(false);

  // Load saved state from localStorage on mount. Opened from a finish-later
  // link (?resume=…), the saved draft replaces whatever this device had.
  useEffect(() => {
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const kioskFlag = params?.get('kiosk');
    if (kioskFlag === '1' || kioskFlag === '0') {
      try { if (kioskFlag === '1') localStorage.setItem(KIOSK_KEY, '1'); else localStorage.removeItem(KIOSK_KEY); } catch { /* ignore */ }
      try { window.history.replaceState(null, '', window.location.pathname); } catch { /* ignore */ }
    }
    setKiosk(isKiosk());
    const resume = params?.get('resume');
    if (resume) {
      // The code stays in the address bar until the draft has loaded, so a
      // second run of this effect (React's development double-mount) still
      // finds it instead of falling through to the device copy.
      const clean = () => { try { window.history.replaceState(null, '', window.location.pathname); } catch { /* ignore */ } };
      fetch(`/api/draft?code=${encodeURIComponent(resume)}`)
        .then((r) => r.json())
        .then((res) => {
          if (res?.status !== 'ok' || !res.intake) throw new Error('no draft');
          const d = res.intake;
          dispatch({
            type: 'LOAD_STATE',
            state: {
              ...defaultIntakeData,
              ...d,
              sessionId: d.sessionId || generateId(),
              createdAt: d.createdAt || new Date().toISOString(),
              reviewOfSystems: migrateROS(d.reviewOfSystems),
              documents: [],
              draft: { id: res.id, token: res.token, url: `${window.location.origin}/?resume=${res.id}.${res.token}`, savedAt: res.savedAt },
            },
          });
          clean();
        })
        .catch(() => { clean(); loadLocal(); });
      return;
    }
    loadLocal();
    function loadLocal() {
    try {
      let saved = localStorage.getItem(STORAGE_KEY);
      // On the kiosk a submitted form, or one nobody has touched for half an
      // hour, belongs to the previous patient: start the next one clean.
      if (saved && isKiosk() && !params?.get('invite')) {
        const prev = JSON.parse(saved);
        const stale = !prev.lastUpdated || Date.now() - new Date(prev.lastUpdated).getTime() > KIOSK_STALE_MS;
        if (prev.submittedAt || stale) { localStorage.removeItem(STORAGE_KEY); saved = null; }
      }
      if (saved) {
        const parsed = JSON.parse(saved);
        dispatch({
          type: 'LOAD_STATE',
          state: {
            ...defaultIntakeData,
            ...parsed,
            // The spread above replaces reviewOfSystems wholesale, so a draft
            // saved before a system existed would come back missing it.
            // migrateROS fills the gaps and rehomes the retired group.
            reviewOfSystems: migrateROS(parsed.reviewOfSystems),
          },
        });
      } else {
        dispatch({
          type: 'LOAD_STATE',
          state: {
            ...defaultIntakeData,
            sessionId: generateId(),
            createdAt: new Date().toISOString(),
          },
        });
      }
    } catch {
      dispatch({
        type: 'LOAD_STATE',
        state: {
          ...defaultIntakeData,
          sessionId: generateId(),
          createdAt: new Date().toISOString(),
        },
      });
    }
    }
  }, []);

  // A finish-later link exists: keep its server copy current (debounced), so
  // whichever device opens it next sees the latest answers.
  useEffect(() => {
    if (!state.draft?.id || !state.draft?.token || state.submittedAt) return;
    const timer = setTimeout(() => {
      fetch('/api/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intakeData: state, draft: { id: state.draft.id, token: state.draft.token } }),
        keepalive: true,
      }).catch(() => { /* the device copy is still safe */ });
    }, 2500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.lastUpdated]);

  // Opened from a link the office sent (?invite=…): fetch the chart's demographics
  // and fill in whatever the patient has not typed yet, then drop the code from the
  // address bar so it is not re-shared by accident.
  useEffect(() => {
    if (!state.sessionId || typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    // Campaign tags from an ad or the landing page: kept from the first visit
    // only, then taken out of the address bar along with the click ids the
    // ad platforms add, so neither is bookmarked or shared onward.
    const campaign = readCampaign(params);
    if (campaign && !state.campaign) dispatch({ type: 'SET_SECTION', section: 'campaign', data: campaign });
    const stripped = stripCampaignParams(window.location.search);
    if (stripped !== null) {
      try { window.history.replaceState(null, '', window.location.pathname + stripped + window.location.hash); } catch { /* ignore */ }
    }
    const token = params.get('invite');
    // A link sent in the patient's language (?lang=, from a referral): switch
    // the interface before the first screen, unless they have already chosen.
    // Or the address itself: /es, /ko (the QR codes on the printed cards).
    // The fracture form's address carries the language after it: /fracture/es.
    const pathLang = window.location.pathname.replace(/^\/+|\/+$/g, '').replace(/^fracture\/?/i, '').toLowerCase();
    if (isFracturePath(window.location.pathname) && state.mode !== FRACTURE_MODE && !state.currentStep) {
      const start = fractureStart(defaultIntakeData.visit);
      for (const [path, value] of Object.entries(start)) dispatch({ type: 'SET_NESTED', path, value });
    }
    const linkLang = String(params.get('lang') || pathLang || '').toLowerCase();
    if (linkLang && linkLang !== state.language && !state.currentStep && LANGUAGES.some((l) => l.code === linkLang)) {
      dispatch({ type: 'SET_LANGUAGE', language: linkLang });
    }
    // A link that already knows the service (Practice Hub's form links, the
    // old per-service addresses): pre-set it; the triage step still confirms.
    const linkService = String(params.get('service') || '').toLowerCase();
    if (isServiceKey(linkService) && !state.currentStep && state.service?.key !== linkService) {
      const s = getService(linkService);
      dispatch({ type: 'SET_SECTION', section: 'service', data: { patient: s.patient, specialty: s.specialty, key: s.key, how: 'link' } });
    }
    if (!token || state.invite?.token === token) return;
    let live = true;
    fetch(`/api/invite?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((res) => {
        if (!live) return;
        if (res?.status !== 'ok') {
          dispatch({ type: 'SET_SECTION', section: 'invite', data: { token, status: res?.status || 'unknown' } });
          return;
        }
        const p = res.patient || {};
        const fill = {
          firstName: p.firstName, lastName: p.lastName, dob: p.dob, sex: p.sex, phone: p.phone, email: p.email,
          address: p.address, insuranceProvider: p.insurance, memberId: p.insuranceId,
          referringPhysician: p.referringProvider, primaryCarePhysician: p.pcpName,
          emergencyContactName: p.guardianName,
        };
        const data = {};
        for (const [k, v] of Object.entries(fill)) if (v && !String(state.demographics?.[k] || '').trim()) data[k] = v;
        dispatch({ type: 'SET_SECTION', section: 'demographics', data });
        // The chart's spine operations, so a post-operative visit starts from
        // what the office already has (procedure, levels, date) instead of
        // asking the patient to remember it all again.
        const operations = Array.isArray(res.operations) ? res.operations : [];
        // The history sections from the last form this patient filed, for
        // any section still empty on this device: medications, allergies,
        // conditions, surgeries, social and family history. They are shown
        // for the patient to check, not hidden.
        const history = res.history && typeof res.history === 'object' ? res.history : null;
        if (history) {
          const empty = {
            pastMedicalHistory: (h) => !(h.conditions || []).length,
            pastSurgicalHistory: (h) => !(h.surgeries || []).length,
            medications: (h) => !(h.current || []).length && !h.noMedications,
            allergies: (h) => !(h.entries || []).length && !h.nkda,
            socialHistory: (h) => !Object.values(h || {}).some((v) => v),
            familyHistory: (h) => !(h.entries || []).length && !h.noRelevantHistory,
          };
          for (const [section, isEmpty] of Object.entries(empty)) {
            const incoming = history[section];
            if (incoming && typeof incoming === 'object' && isEmpty(state[section] || {})) {
              dispatch({ type: 'SET_SECTION', section, data: incoming });
            }
          }
        }
        // Carried on a referral: the language the referring office said the
        // patient prefers, and what the patient wrote back to the text that
        // asked, in their own words, what brings them in. Their words become
        // the chief complaint as typed; the patient can still change them.
        const lang = String(res.language || '').toLowerCase();
        if (lang && lang !== 'en' && state.language === 'en' && LANGUAGES.some((l) => l.code === lang)) {
          dispatch({ type: 'SET_LANGUAGE', language: lang });
        }
        const intro = typeof res.intro === 'string' ? res.intro.trim() : '';
        if (intro && !String(state.chiefComplaint?.mainReason || '').trim()) {
          dispatch({ type: 'SET_SECTION', section: 'chiefComplaint', data: { mainReason: intro } });
        }
        dispatch({ type: 'SET_SECTION', section: 'invite', data: { token, status: 'ok', form: res.form || null, operations, prefilledHistory: !!history, intro: intro || null } });
        if (isServiceKey(res.form)) {
          const s = getService(res.form);
          dispatch({ type: 'SET_SECTION', section: 'service', data: { patient: s.patient, specialty: s.specialty, key: s.key, how: 'invite' } });
        }
        // On the clinic tablet the office opened this form for the patient:
        // go straight to the first question rather than the welcome screen,
        // whose "start a new form" button would throw the pre-fill away.
        if (isKiosk() && !state.currentStep) dispatch({ type: 'SET_STEP', step: 1 });
        try { window.history.replaceState(null, '', window.location.pathname); } catch { /* ignore */ }
      })
      .catch(() => { /* the form still works without the pre-fill */ });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.sessionId]);

  // Auto-save to localStorage on state change
  useEffect(() => {
    if (state.sessionId) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // Storage full or unavailable
      }
    }
  }, [state]);

  const setField = useCallback((section, field, value) => {
    dispatch({ type: 'SET_FIELD', section, field, value });
  }, []);

  const setSection = useCallback((section, data) => {
    dispatch({ type: 'SET_SECTION', section, data });
  }, []);

  const setStep = useCallback((step) => {
    dispatch({ type: 'SET_STEP', step });
  }, []);

  const setLanguage = useCallback((language) => {
    dispatch({ type: 'SET_LANGUAGE', language });
  }, []);

  const completeStep = useCallback((step) => {
    dispatch({ type: 'COMPLETE_STEP', step });
  }, []);

  const setNested = useCallback((path, value) => {
    dispatch({ type: 'SET_NESTED', path, value });
  }, []);

  const setRedFlags = useCallback((flags) => {
    dispatch({ type: 'SET_RED_FLAGS', flags });
  }, []);

  const setSummary = useCallback((summary) => {
    dispatch({ type: 'SET_SUMMARY', summary });
  }, []);

  const setSubmitted = useCallback(() => {
    dispatch({ type: 'SET_SUBMITTED' });
  }, []);

  const resetIntake = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    dispatch({ type: 'RESET' });
  }, []);

  return (
    <IntakeContext.Provider
      value={{
        data: state,
        kiosk,
        dispatch,
        setField,
        setSection,
        setStep,
        setLanguage,
        completeStep,
        setNested,
        setRedFlags,
        setSummary,
        setSubmitted,
        resetIntake,
      }}
    >
      {children}
    </IntakeContext.Provider>
  );
}


/** The content for this intake's service (lib/service.js): regions, questionnaires, prompts and the rest. */
export function useService() {
  const { data } = useIntake();
  const key = data.service?.key || '';
  return useMemo(() => getService(key), [key]);
}

export function useIntake() {
  const context = useContext(IntakeContext);
  if (!context) {
    throw new Error('useIntake must be used within an IntakeProvider');
  }
  return context;
}
