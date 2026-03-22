// ============================================================================
// Intake Data Store - React Context + localStorage Persistence
// ============================================================================

'use client';

import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'spine-intake-data';

// Default empty intake data structure
export const defaultIntakeData = {
  sessionId: '',
  createdAt: null,
  lastUpdated: null,
  currentStep: 0,
  completedSteps: [],

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
    insuranceProvider: '',
    memberId: '',
    referringPhysician: '',
    primaryCarePhysician: '',
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

  hpiData: {
    conversationHistory: [],
    symptoms: {},
    conservativeTreatments: {
      physicalTherapy: { tried: false, duration: '', helped: '', details: '' },
      homeExercise: { tried: false, details: '' },
      medicationsTried: [],
      chiropracticCare: { tried: false, duration: '', helped: '' },
      acupuncture: { tried: false, duration: '', helped: '' },
      injections: [],
      braces: { tried: false, type: '', helped: '' },
      priorImaging: [],
      priorEMG: { done: false, results: '' },
    },
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

  reviewOfSystems: {
    constitutional: {
      fevers: '', chills: '', nightSweats: '', unexplainedWeightLoss: '', fatigue: '',
    },
    cardiovascular: {
      chestPain: '', shortnessOfBreath: '', swelling: '',
    },
    neurological: {
      headaches: '', dizziness: '', seizures: '', memoryIssues: '',
    },
    gastrointestinal: {
      bowelChanges: '', nausea: '', abdominalPain: '',
    },
    genitourinary: {
      bladderChanges: '', urinaryFrequency: '', urinaryRetention: '',
    },
    musculoskeletal: {
      jointPain: '', muscleWeakness: '', falls: '',
    },
    general: {
      recentInfections: '', woundIssues: '', cancerHistory: '', ivDrugUse: '',
    },
    additionalNotes: '',
  },

  proms: {},

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

  // Load saved state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        dispatch({ type: 'LOAD_STATE', state: { ...defaultIntakeData, ...parsed } });
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
  }, []);

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
