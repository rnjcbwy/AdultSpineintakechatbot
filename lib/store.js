// ============================================================================
// Intake Data Store - React Context + localStorage Persistence
// ============================================================================

'use client';

import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { emptyROS, migrateROS } from './rosSystems';
import { EMPTY_PAIN_MAP } from './bodyMap';

const STORAGE_KEY = 'spine-intake-data';

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

  // A "finish later" link the patient asked for: { id, token, url, savedAt }.
  // While it exists, the server copy is refreshed as the answers change, so
  // the link always opens the latest answers.
  draft: null,

  // Which kind of visit this is (lib/flows.js) and the answers that belong
  // only to that kind: the claim for a work injury, the interval history for a
  // follow-up, the operation and recovery for a post-operative visit.
  visit: {
    type: '',
    wc: {},
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
  },

  chiefComplaint: {
    mainReason: '',
    symptomRegions: [],
    duration: '',
    primaryConcern: '',
    hasPriorSpineSurgery: false,
    hasDeformityConcern: false,
  },

  // Body pain map: normalized marks + radiation traces per view.
  // Taken from bodyMap rather than written out here. The literal that used to
  // live in this file had already fallen behind twice — it never gained the
  // lateral views, and would not have gained customTypes either.
  painMap: JSON.parse(JSON.stringify(EMPTY_PAIN_MAP)),

  hpiData: {
    conversationHistory: [],
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

  // Load saved state from localStorage on mount. Opened from a finish-later
  // link (?resume=…), the saved draft replaces whatever this device had.
  useEffect(() => {
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const resume = params?.get('resume');
    if (resume) {
      try { window.history.replaceState(null, '', window.location.pathname); } catch { /* ignore */ }
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
        })
        .catch(() => loadLocal());
      return;
    }
    loadLocal();
    function loadLocal() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
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
    const token = params.get('invite');
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
        dispatch({ type: 'SET_SECTION', section: 'invite', data: { token, status: 'ok', form: res.form || null, operations } });
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


export function useIntake() {
  const context = useContext(IntakeContext);
  if (!context) {
    throw new Error('useIntake must be used within an IntakeProvider');
  }
  return context;
}
