'use client';

import { useIntake, useService } from '../../lib/store';
import { stepsForVisit } from '../../lib/flows';
import { useLang, makeT } from '../../lib/i18n';

const LOCAL = {
  'Welcome back': { es: 'Bienvenido de nuevo', zh: '欢迎回来' },
  'Thank you for your call. Here is what is left of your intake.': { es: 'Gracias por su llamada. Esto es lo que falta de su admisión.', zh: '感谢您的来电。以下是登记还需完成的部分。' },
  'Done on the phone': { es: 'Hecho por teléfono', zh: '已在电话中完成' },
  'Still to do here': { es: 'Falta hacer aquí', zh: '还需在此完成' },
  'The office already has your answers from the call; they are not shown here.': { es: 'El consultorio ya tiene sus respuestas de la llamada; no se muestran aquí.', zh: '诊室已收到您在通话中的回答，此处不显示。' },
  'Start': { es: 'Empezar', zh: '开始' },
  'Your problem, in detail': { es: 'Su problema, en detalle', zh: '您的问题详情' },
  'Medical history': { es: 'Antecedentes médicos', zh: '既往病史' },
  'Operations': { es: 'Operaciones', zh: '手术史' },
  'Medicines': { es: 'Medicamentos', zh: '药物' },
  'Allergies': { es: 'Alergias', zh: '过敏' },
  'Family history': { es: 'Antecedentes familiares', zh: '家族史' },
  'Questionnaires': { es: 'Cuestionarios', zh: '问卷' },
  'Other symptoms': { es: 'Otros síntomas', zh: '其他症状' },
  'Registration and signature': { es: 'Registro y firma', zh: '登记与签名' },
  'Please check your details and sign the office\'s forms. It takes about five minutes.': { es: 'Revise sus datos y firme los formularios del consultorio. Toma unos cinco minutos.', zh: '请核对您的信息并签署诊室的表格，大约需要五分钟。' },
  'Here is what is left of your intake.': { es: 'Esto es lo que falta de su admisión.', zh: '以下是登记还需完成的部分。' },
  'Already done': { es: 'Ya hecho', zh: '已完成' },
};

/** What each phone-covered section is called on this screen. */
const DONE_LABELS = {
  'chief-complaint': 'Your problem, in detail',
  pmh: 'Medical history',
  psh: 'Operations',
  medications: 'Medicines',
  allergies: 'Allergies',
  family: 'Family history',
  ros: 'Other symptoms',
  proms: 'Questionnaires',
};

/**
 * The first screen of the rest of an intake begun on the phone, of the rest
 * of an unfinished one, or of the registration page alone (a code from the
 * office; lib/store.js startJourney): what was done (names of sections only)
 * and what is left here.
 */
export default function JourneyStart({ onNext }) {
  const { data } = useIntake();
  const service = useService();
  const t = makeT(LOCAL, useLang());
  const registration = data.journey?.kind === 'registration';
  const done = registration ? [] : (data.journey?.doneSections || []).filter((id) => DONE_LABELS[id]).map((id) => DONE_LABELS[id]);
  const fromCall = (data.journey?.doneSections || []).length > 0;
  const left = stepsForVisit(data.visit?.type, service, data).filter((s) => s.id !== 'journey-start');
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-8">
      <div className="max-w-[560px] w-full animate-fade-in">
        <h1 className="font-serif text-[2rem] font-semibold text-navy-600 mb-2">{t(registration ? 'Registration and signature' : 'Welcome back')}</h1>
        <p className="text-base text-gray-600 mb-6">
          {t(registration ? 'Please check your details and sign the office\'s forms. It takes about five minutes.' : fromCall ? 'Thank you for your call. Here is what is left of your intake.' : 'Here is what is left of your intake.')}
        </p>
        {done.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400 mb-2">{t('Already done')}</p>
            <ul className="bg-white rounded-2xl border border-navy-100 p-2">
              {done.map((label) => (
                <li key={label} className="flex items-center gap-3 px-4 py-2 text-gray-600">
                  <span className="text-teal-600" aria-hidden>✓</span>
                  <span>{t(label)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-gray-500">{t('The office already has your answers from the call; they are not shown here.')}</p>
          </div>
        )}
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400 mb-2">{t('Still to do here')}</p>
        <ol className="bg-white rounded-2xl border-2 border-teal-200 p-2 mb-7">
          {left.map((s, i) => (
            <li key={s.id} className="flex items-center gap-4 px-4 py-2.5 text-gray-800">
              <span className="flex items-center justify-center w-7 h-7 flex-shrink-0 bg-teal-50 text-teal-700 rounded-full text-xs font-semibold tabular-nums">{i + 1}</span>
              <span>{t(s.label)}</span>
            </li>
          ))}
        </ol>
        <button type="button" onClick={onNext} className="btn-primary text-lg px-10 py-4 w-full max-w-xs mx-auto block">
          {t('Start')}
        </button>
      </div>
    </div>
  );
}
