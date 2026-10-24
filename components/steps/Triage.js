'use client';

import { useEffect, useRef, useState } from 'react';
import { useIntake } from '../../lib/store';
import { useLang, makeT, COMMON } from '../../lib/i18n';
import { TRIAGE_REGIONS, specialtyFromRegions, serviceKeyFor } from '../../lib/service';
import { LOCKED_SERVICE, lockedSpecialty, pedsSiteFor, otherAdultSite } from '../../lib/siteLock';
import { CLAIM_OPTIONS, VISIT_LABEL, visitTypeFor } from '../../lib/flows';
import StepNavigation from '../ui/StepNavigation';
import { Chips, CheckChips, TextArea } from '../ui/Fields';
import { PEDS_ORTHO_TEXT } from '../../lib/services/peds-ortho/text';

// A child's orthopaedic visit: a recent injury or a broken bone takes the
// short fracture-clinic path, so the form asks here, before anything else.
const FRACTURE = ['Yes, an injury or a broken bone', 'No, something else'];

const WHO = ['Myself', 'My child (under 18)', 'An adult I am helping'];
// New to THIS doctor, not to the office: a patient who saw a partner here
// before is still a first visit, and gets the full history.
const FIRST = ['Yes, my first time with this doctor', 'No, I have seen this doctor before'];
const AREA = ['The neck or back', 'A bone or joint'];
const AREA_OF = { spine: AREA[0], ortho: AREA[1] };
const SPECIALTY_OF = { [AREA[0]]: 'spine', [AREA[1]]: 'ortho' };
const KIND = ['A new problem', 'A follow-up for a problem seen here before', 'A visit after an operation'];
const KIND_OF = { new: KIND[0], followup: KIND[1], postop: KIND[2] };
const VISIT_KIND_OF = { [KIND[0]]: 'new', [KIND[1]]: 'followup', [KIND[2]]: 'postop' };
const CLAIM_OF = { none: CLAIM_OPTIONS[0], workers_comp: CLAIM_OPTIONS[1], personal_injury: CLAIM_OPTIONS[2] };

/**
 * The first real screen. Who the visit is for, where the problem is, whether
 * the patient has been seen here before, and a sentence or two about it. From
 * those the form works out its whole direction, a child or an adult, the
 * spine or a bone and joint, a new problem or a follow-up or a visit after an
 * operation, and whether a work injury or an accident claim is involved, and
 * shows what it understood as three rows of chips the patient can correct
 * with one tap. Clear region taps settle the specialty on their own; the
 * description goes to the model for the rest. Nothing here is a diagnosis:
 * it only picks which questions come next, and the office sees every answer.
 */
export default function Triage({ onNext, onBack }) {
  const { data, setNested, setField } = useIntake();
  const lang = useLang();
  const t = makeT({ ...COMMON, ...PEDS_ORTHO_TEXT }, lang);
  const tri = data.triage || {};
  const svc = data.service || {};
  const v = data.visit || {};
  const [busy, setBusy] = useState(false);
  const [asked, setAsked] = useState(false);
  const askedFor = useRef('');

  const patient = tri.who === WHO[1] ? 'child' : tri.who ? 'adult' : '';
  // A one-service site (lib/siteLock.js): its own body areas only, and its
  // service never changes here; a child or another specialty is sent on.
  const lockSpec = lockedSpecialty();
  const regionChoices = lockSpec ? TRIAGE_REGIONS.filter((r) => r.specialty === lockSpec || !r.specialty) : TRIAGE_REGIONS;
  const childOnAdultSite = !!LOCKED_SERVICE && patient === 'child';
  const [elsewhere, setElsewhere] = useState('');
  const regions = tri.regions || [];
  const byRegions = specialtyFromRegions(regions);
  const description = String(tri.description || '').trim();
  const firstTime = tri.firstTime === FIRST[0];
  const returning = tri.firstTime === FIRST[1];
  const kind = v.choice === 'followup' ? (v.hadSurgery === 'Yes' ? 'postop' : v.hadSurgery === 'No' ? 'followup' : '') : v.choice === 'new' ? 'new' : '';
  const claim = v.workInjury || '';
  const understood = !!svc.specialty || !!kind || !!claim;

  // Keep the patient half of the service in step with the answer.
  useEffect(() => {
    if (LOCKED_SERVICE) return;
    if (patient && svc.patient !== patient) applyService({ patient });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient]);

  // A "broken bone" tap on a child's visit is the fracture-clinic path.
  const tappedFracture = regions.includes('fracture');
  useEffect(() => {
    if (tappedFracture && patient === 'child' && !data.pedsOrtho?.track) setNested('pedsOrtho.track', 'fracture');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tappedFracture, patient]);

  // Regions that all point one way settle the specialty without the model
  // (unless the patient or the office already chose).
  useEffect(() => {
    if (LOCKED_SERVICE) return;
    if (byRegions && !['manual', 'invite'].includes(svc.how) && svc.specialty !== byRegions) applyService({ specialty: byRegions, how: 'regions' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [byRegions]);

  // The first-visit answer changes the kind: a first visit is always a full
  // new-patient visit; a returning patient's new problem is its own kind.
  useEffect(() => {
    if (firstTime && kind !== 'new') applyVisit({ kind: 'new' });
    else if (kind) applyVisit({ kind });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstTime]);

  const trimCompleted = () => {
    // The steps after this one depend on these answers, so "completed" marks
    // beyond it no longer refer to the same steps.
    const here = data.currentStep || 0;
    setNested('completedSteps', (data.completedSteps || []).filter((i) => i <= here));
  };

  const applyService = (next) => {
    const merged = { patient: svc.patient || '', specialty: svc.specialty || '', how: svc.how || '', ...next };
    const key = serviceKeyFor(merged);
    setNested('service', { ...merged, key });
    if (key && key !== svc.key) trimCompleted();
  };

  /** The visit kind and the claim, as lib/flows.js stores them. */
  const applyVisit = ({ kind: k = kind, claim: c = claim }) => {
    const choice = k === 'new' ? 'new' : k ? 'followup' : v.choice || '';
    const hadSurgery = k === 'postop' ? 'Yes' : k === 'followup' ? 'No' : k === 'new' ? '' : v.hadSurgery || '';
    const type = visitTypeFor({ choice, workInjury: c, hadSurgery, established: returning });
    if (choice !== v.choice) setNested('visit.choice', choice);
    if (hadSurgery !== (v.hadSurgery || '')) setNested('visit.hadSurgery', hadSurgery);
    if (c !== (v.workInjury || '')) setNested('visit.workInjury', c);
    if (type && type !== v.type) {
      setNested('visit.type', type);
      setField('demographics', 'visitReason', VISIT_LABEL[type]);
      trimCompleted();
    }
  };

  const classify = async () => {
    const signature = `${description}|${regions.join(',')}|${tri.firstTime || ''}`;
    if (askedFor.current === signature) return;
    askedFor.current = signature;
    setBusy(true);
    try {
      const r = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, regions, who: tri.who || '', firstTime: tri.firstTime || '', language: lang }),
      }).then((x) => x.json());
      setNested('triage.suggestion', { specialty: r?.specialty || '', visitKind: r?.visitKind || '', claim: r?.claim || '', reason: r?.reason || '' });
      if (LOCKED_SERVICE) setElsewhere(r?.specialty && r.specialty !== 'unsure' && r.specialty !== lockSpec ? r.specialty : '');
      else if ((r?.specialty === 'spine' || r?.specialty === 'ortho') && !['manual', 'invite'].includes(svc.how) && !byRegions) applyService({ specialty: r.specialty, how: 'ai' });
      // A first visit with this doctor is a new-patient visit whatever the sentence says.
      const k = firstTime ? 'new' : ['new', 'followup', 'postop'].includes(r?.visitKind) ? r.visitKind : kind;
      const c = CLAIM_OF[r?.claim] || claim;
      // What the patient already tapped is never overwritten by the model.
      applyVisit({ kind: kind || k, claim: claim || c });
    } catch {
      /* the chips below take over */
    } finally {
      setBusy(false);
      setAsked(true);
    }
  };

  // The description is also the chief complaint's opening line, so it is not typed twice.
  const seedComplaint = () => {
    if (description && !String(data.chiefComplaint?.mainReason || '').trim()) setField('chiefComplaint', 'mainReason', description);
  };

  const basicsDone = !!patient && !!tri.firstTime && (regions.length > 0 || description.length >= 3);
  const pedsOrtho = svc.key === 'peds_ortho';
  const track = data.pedsOrtho?.track || '';
  const allSet = !!svc.specialty && !!kind && !!claim && !!v.type && (!pedsOrtho || !!track);
  // Before the model has been asked, Continue asks it; afterwards it needs the three rows settled.
  const canGoNext = basicsDone && !busy && !childOnAdultSite && (!asked || allSet);

  const next = async () => {
    if (!asked && description.length >= 3 && !allSet) { await classify(); return; }
    if (!asked) { setAsked(true); return; }
    if (!allSet) return;
    seedComplaint();
    onNext();
  };

  const showCard = asked || understood;

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="section-title">{t('A few questions to point you the right way')}</h2>
        <p className="section-subtitle">{t('Adults and children, the spine and other bones and joints, a first visit and a follow-up are all asked different questions. These answers choose the right ones.')}</p>
      </div>

      <div className="card">
        <Chips label="Who is this form for?" options={WHO} value={tri.who || ''} onChange={(x) => setNested('triage.who', x)} />
        {childOnAdultSite && (
          <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
            <p className="font-medium">{t('Children and teenagers have their own form, with questions made for their age.')}</p>
            <a href={pedsSiteFor(lockSpec)} className="inline-block mt-2 font-semibold underline text-teal-700">{t('Open the pediatric form')}</a>
          </div>
        )}
      </div>

      <div className="card mt-4">
        <Chips
          label="Is this your first visit with this doctor?"
          hint="If you have been to this office before but saw a different doctor, that still counts as a first visit."
          options={FIRST}
          value={tri.firstTime || ''}
          onChange={(x) => { setNested('triage.firstTime', x); setAsked(false); }}
        />
      </div>

      <div className="card mt-4">
        <CheckChips
          label="Where is the problem?"
          hint="Tap everything that applies."
          options={regionChoices.map((r) => r.label)}
          value={regions.map((id) => regionChoices.find((r) => r.id === id)?.label).filter(Boolean)}
          onChange={(labels) => { setNested('triage.regions', labels.map((l) => TRIAGE_REGIONS.find((r) => r.label === l)?.id).filter(Boolean)); setAsked(false); }}
        />
      </div>

      <div className="card mt-4">
        <TextArea
          label="In a sentence or two, what is going on?"
          hint="For example: my right knee has been swollen since I slipped at work last month, or: I had a fusion here in March and this is my check-up. You will have room for the full story later."
          value={tri.description || ''}
          onChange={(x) => { setNested('triage.description', x); setAsked(false); }}
          rows={3}
        />
      </div>

      {showCard && (
        <div className="card mt-4 border-teal-200 bg-teal-50 animate-fade-in" role="status">
          <h3 className="text-base font-semibold text-navy-600">{t('Here is what we understood. Tap to change anything.')}</h3>
          {tri.suggestion?.reason && <p className="text-sm text-gray-500 mt-1">{tri.suggestion.reason}</p>}
          <div className="mt-3 space-y-4">
            {!LOCKED_SERVICE && <Chips
              label="The problem is with"
              options={AREA}
              value={AREA_OF[svc.specialty] || ''}
              onChange={(x) => applyService({ specialty: SPECIALTY_OF[x], how: 'manual' })}
            />}
            {returning ? (
              <Chips
                label="This visit is"
                options={KIND}
                value={KIND_OF[kind] || ''}
                onChange={(x) => applyVisit({ kind: VISIT_KIND_OF[x] })}
                hint={kind === 'new' ? 'The form asks about the new problem in full; the history already on file is only brought up to date.' : kind === 'followup' || kind === 'postop' ? 'Your history is on file, so the form will only ask what has changed.' : undefined}
              />
            ) : (
              <p className="text-sm text-gray-600">{t('A first visit with this doctor: the form asks for your full history, even if another doctor here has seen you.')}</p>
            )}
            <Chips
              label="Is a work injury or an accident claim involved?"
              options={CLAIM_OPTIONS}
              value={claim}
              onChange={(x) => applyVisit({ claim: x })}
            />
            {pedsOrtho && (
              <Chips
                label="Is this visit about a broken bone or a recent injury?"
                options={FRACTURE.map((o) => t(o))}
                value={track === 'fracture' ? t(FRACTURE[0]) : track === 'full' ? t(FRACTURE[1]) : ''}
                onChange={(x) => { setNested('pedsOrtho.track', x === t(FRACTURE[0]) ? 'fracture' : 'full'); trimCompleted(); }}
                hint={track === 'fracture' ? 'The form asks about the injury and the cast or splint, and skips the longer questions.' : undefined}
              />
            )}
          </div>
          {elsewhere && (
            <p className="text-sm text-gray-600 mt-3">
              {t(lockSpec === 'spine' ? 'If the problem is a bone or joint rather than the neck or back, the orthopaedic form asks the right questions.' : 'If the problem is the neck or back rather than a bone or joint, the spine form asks the right questions.')}{' '}
              <a href={otherAdultSite(lockSpec)} className="font-semibold underline text-teal-700">{t(lockSpec === 'spine' ? 'Open the orthopaedic form' : 'Open the spine form')}</a>
            </p>
          )}
          {!allSet && <p className="text-sm text-amber-700 mt-3">{t(pedsOrtho ? 'Please answer each of the questions above to continue.' : 'Please answer each of the three above to continue.')}</p>}
        </div>
      )}

      <StepNavigation onNext={next} onBack={onBack} canGoNext={canGoNext} nextLabel={busy ? t('One moment…') : undefined} />
    </div>
  );
}
