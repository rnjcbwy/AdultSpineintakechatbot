'use client';

import { useState } from 'react';
import { useIntake } from '../../lib/store';
import { useLang, makeT, COMMON } from '../../lib/i18n';
import StepNavigation from '../ui/StepNavigation';
import BodyDiagram, { MarkerGlyph } from '../BodyDiagram';
import { SYMPTOM_TYPES, EMPTY_PAIN_MAP, countMarks, summarizePainMap } from '../../lib/bodyMap';

const LOCAL = {
  'Where Are Your Symptoms?': { es: '¿Dónde están sus síntomas?', zh: '您的症状在哪里？' },
  'Tap the body where you feel something. Pick the type of feeling first — you can mark as many places as you like, on the front and the back.':
    {
      es: 'Toque el cuerpo donde sienta algo. Primero elija el tipo de sensación: puede marcar tantos lugares como quiera, en la parte delantera y trasera.',
      zh: '请点击身体上有感觉的部位。请先选择感觉类型——您可以在正面和背面标记任意多个位置。',
    },

  'Front': { es: 'Frente', zh: '正面' },
  'Back': { es: 'Espalda', zh: '背面' },

  '1 · Choose the feeling': { es: '1 · Elija la sensación', zh: '1 · 选择感觉类型' },
  '2 · Choose what to do': { es: '2 · Elija qué hacer', zh: '2 · 选择操作' },

  'Mark a spot': { es: 'Marcar un punto', zh: '标记位置' },
  'Draw where it travels': { es: 'Dibujar hacia dónde se extiende', zh: '画出扩散方向' },
  'Erase': { es: 'Borrar', zh: '擦除' },

  'Tap anywhere on the body to place a mark.': {
    es: 'Toque cualquier parte del cuerpo para colocar una marca.',
    zh: '点击身体任意部位来放置标记。',
  },
  'Press and drag from where the feeling starts to where it travels.': {
    es: 'Mantenga presionado y arrastre desde donde comienza la sensación hasta donde se extiende.',
    zh: '按住并从感觉开始的位置拖动到它扩散到的位置。',
  },
  'Tap any mark or line to remove it.': {
    es: 'Toque cualquier marca o línea para eliminarla.',
    zh: '点击任意标记或线条即可删除。',
  },

  'Clear everything': { es: 'Borrar todo', zh: '清除全部' },
  'Nothing marked yet': { es: 'Aún no hay marcas', zh: '尚未标记' },
  'mark': { es: 'marca', zh: '个标记' },
  'marks': { es: 'marcas', zh: '个标记' },

  'What you marked': { es: 'Lo que marcó', zh: '您标记的内容' },
  'This is optional — skip it if you would rather just describe your symptoms in words.': {
    es: 'Esto es opcional: omítalo si prefiere describir sus síntomas con palabras.',
    zh: '此步骤为可选——如果您更愿意用文字描述症状，可以跳过。',
  },

  'Continue to Symptom Details': { es: 'Continuar a los detalles de los síntomas', zh: '继续填写症状详情' },
  'Skip — I would rather not draw': { es: 'Omitir — prefiero no dibujar', zh: '跳过 — 我不想绘制' },

  // Symptom type labels
  'Aching / dull pain': { es: 'Dolor sordo / molestia', zh: '钝痛／隐痛' },
  'Sharp / stabbing': { es: 'Punzante / agudo', zh: '锐痛／刺痛' },
  'Burning': { es: 'Ardor', zh: '灼烧感' },
  'Numbness': { es: 'Entumecimiento', zh: '麻木' },
  'Pins and needles': { es: 'Hormigueo', zh: '针刺感' },
  'Weakness': { es: 'Debilidad', zh: '无力' },
};

export default function PainMap({ onNext, onBack }) {
  const { data, setNested } = useIntake();
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);

  const painMap = data.painMap || EMPTY_PAIN_MAP;
  const [activeType, setActiveType] = useState('ache');
  const [mode, setMode] = useState('mark');

  const total = countMarks(painMap);

  const updateView = (view, next) => setNested(`painMap.${view}`, next);
  const clearAll = () => setNested('painMap', JSON.parse(JSON.stringify(EMPTY_PAIN_MAP)));

  const MODES = [
    { id: 'mark', label: 'Mark a spot', hint: 'Tap anywhere on the body to place a mark.' },
    { id: 'radiate', label: 'Draw where it travels', hint: 'Press and drag from where the feeling starts to where it travels.' },
    { id: 'erase', label: 'Erase', hint: 'Tap any mark or line to remove it.' },
  ];
  const activeMode = MODES.find((m) => m.id === mode);

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="section-title">{t('Where Are Your Symptoms?')}</h2>
        <p className="section-subtitle">
          {t('Tap the body where you feel something. Pick the type of feeling first — you can mark as many places as you like, on the front and the back.')}
        </p>
      </div>

      {/* 1 — symptom type */}
      <div className="card mb-4">
        <p className="text-sm font-semibold text-navy-600 mb-3">{t('1 · Choose the feeling')}</p>
        <div className="flex flex-wrap gap-2">
          {SYMPTOM_TYPES.map((s) => {
            const on = activeType === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveType(s.id)}
                aria-pressed={on}
                className={`flex items-center gap-2 pl-2 pr-3.5 py-2 rounded-full border text-sm font-medium transition-all ${
                  on ? 'border-navy-600 bg-navy-50 text-navy-700 shadow-sm' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <svg viewBox="0 0 20 20" className="w-5 h-5 flex-shrink-0" aria-hidden="true">
                  <MarkerGlyph type={s.id} x={10} y={10} scale={0.95} />
                </svg>
                {t(s.label)}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2 — tool */}
      <div className="card mb-4">
        <p className="text-sm font-semibold text-navy-600 mb-3">{t('2 · Choose what to do')}</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              aria-pressed={mode === m.id}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                mode === m.id
                  ? m.id === 'erase'
                    ? 'border-red-300 bg-red-50 text-red-700'
                    : 'border-teal-400 bg-teal-50 text-teal-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              {t(m.label)}
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-500">{t(activeMode.hint)}</p>
      </div>

      {/* Diagrams */}
      <div className="card mb-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start justify-center">
          <BodyDiagram
            view="anterior"
            label={t('Front')}
            data={painMap.anterior}
            activeType={activeType}
            mode={mode}
            onChange={(next) => updateView('anterior', next)}
          />
          <BodyDiagram
            view="posterior"
            label={t('Back')}
            data={painMap.posterior}
            activeType={activeType}
            mode={mode}
            onChange={(next) => updateView('posterior', next)}
          />
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 flex-wrap gap-2">
          <p className="text-sm text-gray-500">
            {total === 0 ? t('Nothing marked yet') : `${total} ${total === 1 ? t('mark') : t('marks')}`}
          </p>
          {total > 0 && (
            <button onClick={clearAll} className="text-sm text-gray-400 hover:text-red-500 transition-colors">
              {t('Clear everything')}
            </button>
          )}
        </div>
      </div>

      {/* Plain-language readback so the patient can confirm we understood */}
      {total > 0 && (
        <div className="card mb-4 bg-teal-50/50 border-teal-100">
          <p className="text-sm font-semibold text-navy-600 mb-1">{t('What you marked')}</p>
          <p className="text-sm text-gray-600 leading-relaxed">{summarizePainMap(painMap)}</p>
        </div>
      )}

      <p className="text-xs text-gray-400 mb-2">
        {t('This is optional — skip it if you would rather just describe your symptoms in words.')}
      </p>

      <StepNavigation
        onNext={onNext}
        onBack={onBack}
        canGoNext
        nextLabel={t('Continue to Symptom Details')}
        showSkip
        skipLabel={t('Skip — I would rather not draw')}
      />
    </div>
  );
}
