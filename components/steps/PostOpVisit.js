'use client';

import { useEffect } from 'react';
import { useIntake } from '../../lib/store';
import { useLang, makeT, COMMON } from '../../lib/i18n';
import StepNavigation from '../ui/StepNavigation';
import { Chips, CheckChips, TextField, TextArea, PainScale } from '../ui/Fields';
import {
  OPERATION_KINDS, OPERATION_WHERE, PROCEDURE_OPTIONS, LEVEL_OPTIONS, MONTHS,
  emptyOperation, operationDate, operationsFromChart, regionsForOperation, mostRecentOperation, sortOperations,
} from '../../lib/operations';

const WOUND = ['Healing well', 'Redness around the incision', 'Drainage or fluid', 'The incision has opened', 'Fever or chills', 'Not sure'];
const VS_BEFORE = ['Much better', 'Somewhat better', 'About the same', 'Worse'];
const LIMB = ['Gone', 'Better', 'About the same', 'Worse', 'New symptoms in the arm or leg'];
const NEURO = ['None', 'Numbness', 'Weakness', 'Both numbness and weakness'];
const YES_NO = ['Yes', 'No'];
const WALKING = ['Less than a block', 'A few blocks', 'About a mile', 'As far as I want'];
const BRACE = ['Wearing it as instructed', 'Was not prescribed one', 'Stopped wearing it'];
const PT = ['Not started yet', 'Started', 'Finished'];
const WORK = ['Back to full duty', 'Back on light duty', 'Not back yet', 'Not working / retired'];
const OPIOIDS = ['None', 'Occasionally', 'Daily'];
const COMPLICATIONS = ['Emergency room visit', 'Readmitted to the hospital', 'Infection treated with antibiotics', 'Blood clot', 'A fall', 'None of these'];

const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 40 }, (_, i) => String(THIS_YEAR - i));

/**
 * A visit after an operation. The note needs every operation (procedure,
 * levels, when, first or revision, where), the postoperative course (wound,
 * fever, trips to the ER), what the symptoms did compared with before
 * surgery, function, medicines and activity. The interval since the most
 * recent operation is worked out later from the date; the patient only gives
 * the month and year unless the exact day is known. None of the pre-operative
 * history is re-asked.
 */
export default function PostOpVisit({ onNext, onBack }) {
  const { data, setNested, setField } = useIntake();
  const lang = useLang();
  const t = makeT(COMMON, lang);
  const p = data.visit?.postop || {};
  const set = (k, v) => setNested(`visit.postop.${k}`, v);
  const ops = p.operations || [];
  const onFile = data.invite?.operations || [];

  // Opened from a link the office sent: start from the operations on the chart.
  useEffect(() => {
    if (!ops.length && onFile.length) set('operations', operationsFromChart(onFile));
    else if (!ops.length) set('operations', [emptyOperation()]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onFile.length]);

  const setOps = (next) => {
    set('operations', next);
    // The body region of the most recent operation steers the questionnaires
    // (NDI for the neck, ODI for the low back) and the chief complaint line.
    const recent = mostRecentOperation(next);
    const regions = regionsForOperation(recent);
    setField('chiefComplaint', 'symptomRegions', regions);
    setField('chiefComplaint', 'mainReason', `Post-operative visit${recent?.procedure ? ` after ${recent.procedure}` : ''}`);
  };
  const updateOp = (id, patch) => setOps(ops.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  const addOp = () => setOps([...ops, emptyOperation(ops.length ? 'A separate, later operation' : 'First operation')]);
  const removeOp = (id) => setOps(ops.length > 1 ? ops.filter((o) => o.id !== id) : [emptyOperation()]);

  const complete = (o) => !!(o.procedure && operationDate(o));
  const canGoNext = ops.length > 0 && ops.every(complete);
  const ordered = sortOperations(ops);
  const recentId = mostRecentOperation(ops)?.id;

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="section-title">{t('Your Surgery & Recovery')}</h2>
        <p className="section-subtitle">
          {t('A few questions about the operation and how the recovery is going. If you have had more than one spine operation, add each one. The month and year are enough if you do not remember the exact date. Fields marked with * are required.')}
        </p>
      </div>

      <div className="space-y-6">
        {ops.map((o, idx) => (
          <div key={o.id} className="card space-y-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-medium text-navy-600">
                {ops.length > 1 ? `${t('Operation')} ${idx + 1}` : t('The operation')}
                {o.id === recentId && ops.length > 1 && (
                  <span className="ml-2 text-xs font-normal text-teal-600">{t('most recent')}</span>
                )}
              </h3>
              <div className="flex items-center gap-3 text-xs">
                {o.onFile && <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700">{t('On file from your chart')}</span>}
                {ops.length > 1 && (
                  <button type="button" onClick={() => removeOp(o.id)} className="text-gray-400 hover:text-red-500">{t('Remove')}</button>
                )}
              </div>
            </div>

            <TextField
              label="What operation was it?"
              required
              value={o.procedure}
              onChange={(v) => updateOp(o.id, { procedure: v })}
              placeholder="As written on your discharge papers, if you have them"
              suggestions={PROCEDURE_OPTIONS}
            />

            <CheckChips
              label="Which levels? (tap all that apply, or Not sure)"
              options={LEVEL_OPTIONS}
              value={o.levels || []}
              onChange={(v) => updateOp(o.id, { levels: v })}
              exclusive="Not sure"
            />
            <TextField
              label="Levels written another way, if you prefer (optional)"
              value={o.levelsOther}
              onChange={(v) => updateOp(o.id, { levelsOther: v })}
              placeholder="e.g., L4 to S1, or T10 to pelvis"
            />

            <div>
              <label className="form-label">{t('When was it? *')}</label>
              <div className="grid grid-cols-3 gap-3 max-w-md">
                <select value={o.year || ''} onChange={(e) => updateOp(o.id, { year: e.target.value })} aria-label={t('Year')}>
                  <option value="">{t('Year')}</option>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                <select value={o.month || ''} onChange={(e) => updateOp(o.id, { month: e.target.value })} aria-label={t('Month')}>
                  <option value="">{t('Month')}</option>
                  {MONTHS.map((m, i) => <option key={m} value={String(i + 1)}>{t(m)}</option>)}
                </select>
                <select value={o.day || ''} onChange={(e) => updateOp(o.id, { day: e.target.value })} aria-label={t('Day')} disabled={!o.month}>
                  <option value="">{t('Day (if known)')}</option>
                  {Array.from({ length: 31 }, (_, i) => String(i + 1)).map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">{t('The year is required; add the month and day if you know them.')}</p>
            </div>

            <Chips label="Was this a first operation or a follow-on to an earlier one?" options={OPERATION_KINDS} value={o.kind} onChange={(v) => updateOp(o.id, { kind: v })} />
            <Chips label="Where was it done?" options={OPERATION_WHERE} value={o.where} onChange={(v) => updateOp(o.id, { where: v })} />
            {o.where === 'With another surgeon' && (
              <TextField label="Surgeon and hospital" value={o.surgeon} onChange={(v) => updateOp(o.id, { surgeon: v })} placeholder="e.g., Dr. Smith, Hackensack" />
            )}
          </div>
        ))}

        <button type="button" onClick={addOp} className="btn-secondary w-full sm:w-auto">
          + {t('Add another spine operation')}
        </button>
        {ordered.length > 1 && (
          <p className="text-xs text-gray-400">
            {t('Your recovery questions below are about the most recent operation.')}
          </p>
        )}

        <div className="card space-y-4">
          <h3 className="text-lg font-medium text-navy-600">{t('The incision and the recovery')}</h3>
          <CheckChips label="How does the incision look? (choose all that apply)" options={WOUND} value={p.wound || []} onChange={(v) => set('wound', v)} exclusive="Healing well" />
          <CheckChips label="Since the surgery, have you had any of these?" options={COMPLICATIONS} value={p.complications || []} onChange={(v) => set('complications', v)} exclusive="None of these" />
          {(p.complications || []).some((c) => c !== 'None of these') && (
            <TextArea label="Tell us what happened" value={p.complicationDetails} onChange={(v) => set('complicationDetails', v)} rows={2} />
          )}
        </div>

        <div className="card space-y-4">
          <h3 className="text-lg font-medium text-navy-600">{t('Your symptoms now')}</h3>
          <Chips label="Compared with before surgery, the pain you had surgery for is:" options={VS_BEFORE} value={p.painVsBefore} onChange={(v) => set('painVsBefore', v)} />
          <PainScale label="Your pain today, on average (0 to 10)" value={p.painNow} onChange={(v) => set('painNow', v)} />
          <Chips label="The arm or leg pain, numbness or tingling you had before surgery is:" options={LIMB} value={p.limbSymptoms} onChange={(v) => set('limbSymptoms', v)} />
          <Chips label="Any numbness or weakness right now?" options={NEURO} value={p.neuro} onChange={(v) => set('neuro', v)} />
          {p.neuro && p.neuro !== 'None' && (
            <TextField label="Where, and is it new since the surgery?" value={p.neuroDetails} onChange={(v) => set('neuroDetails', v)} />
          )}
          <Chips label="Any new trouble controlling your bladder or bowels?" options={YES_NO} value={p.bowelBladder} onChange={(v) => set('bowelBladder', v)} />
        </div>

        <div className="card space-y-4">
          <h3 className="text-lg font-medium text-navy-600">{t('Activity and medicines')}</h3>
          <Chips label="How far can you walk comfortably?" options={WALKING} value={p.walking} onChange={(v) => set('walking', v)} />
          <Chips label="Brace or collar" options={BRACE} value={p.brace} onChange={(v) => set('brace', v)} />
          <Chips label="Physical therapy" options={PT} value={p.pt} onChange={(v) => set('pt', v)} />
          <Chips label="Work" options={WORK} value={p.work} onChange={(v) => set('work', v)} />
          <Chips label="Are you still taking opioid pain medicine (oxycodone, hydrocodone, tramadol)?" options={OPIOIDS} value={p.opioids} onChange={(v) => set('opioids', v)} />
          {p.opioids && p.opioids !== 'None' && (
            <TextField label="Which one, and how much per day?" value={p.opioidDetails} onChange={(v) => set('opioidDetails', v)} placeholder="e.g., Oxycodone 5 mg, one at night" />
          )}
          <TextField label="Any other new medicine since the surgery?" value={p.newMedicines} onChange={(v) => set('newMedicines', v)} placeholder="e.g., Gabapentin 300 mg at night; a blood thinner" />
        </div>

        <div className="card space-y-4">
          <TextArea
            label="Anything you are worried about, or want to ask at this visit?"
            value={p.questions}
            onChange={(v) => set('questions', v)}
            placeholder="e.g., When can I drive? Is the tingling in my foot normal?"
            rows={3}
          />
        </div>
      </div>

      <StepNavigation onNext={onNext} onBack={onBack} canGoNext={canGoNext} />
    </div>
  );
}
