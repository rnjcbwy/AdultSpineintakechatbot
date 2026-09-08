'use client';

import { useState } from 'react';
import { useIntake } from '../../lib/store';
import { useLang, makeT, COMMON } from '../../lib/i18n';
import StepNavigation from '../ui/StepNavigation';
import BodyDiagram, { MarkerGlyph } from '../BodyDiagram';
import {
  SYMPTOM_TYPES, EMPTY_PAIN_MAP, countMarks, summarizePainMap,
  CUSTOM_MARKER_STYLES, MAX_CUSTOM_TYPES, allTypes, customTypes,
} from '../../lib/bodyMap';

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

  // Custom symptoms
  'Something else? Add your own': { es: '¿Algo más? Agregue el suyo', zh: '还有其他感觉？自行添加' },
  'If none of these describe what you feel, name it yourself and pick a marker. You can add up to 4.': {
    es: 'Si ninguno describe lo que siente, nómbrelo usted mismo y elija un marcador. Puede agregar hasta 4.',
    zh: '如果以上都无法描述您的感觉，请自行命名并选择一个标记。最多可添加4个。',
  },
  'Name the feeling': { es: 'Nombre la sensación', zh: '为这种感觉命名' },
  'e.g., Itching, Cramping, Coldness, Pulling': {
    es: 'p. ej., Picazón, Calambres, Frío, Tirantez',
    zh: '例如：瘙痒、抽筋、发凉、牵拉感',
  },
  'Add': { es: 'Agregar', zh: '添加' },
  'Remove': { es: 'Quitar', zh: '移除' },
  'Pick a marker': { es: 'Elija un marcador', zh: '选择标记' },
  'You have added the maximum of 4 of your own symptoms.': {
    es: 'Ha agregado el máximo de 4 síntomas propios.',
    zh: '您已添加最多4个自定义症状。',
  },
};

export default function PainMap({ onNext, onBack }) {
  const { data, setNested } = useIntake();
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);

  const painMap = data.painMap || EMPTY_PAIN_MAP;
  const [activeType, setActiveType] = useState('ache');
  const [mode, setMode] = useState('mark');

  // The patient's own symptom names, and the marker each one uses.
  const custom = customTypes(painMap);
  const types = allTypes(painMap);
  const [newLabel, setNewLabel] = useState('');
  const [newStyle, setNewStyle] = useState(0);

  const takenStyles = new Set(custom.map((c) => c.style));
  const freeStyle = CUSTOM_MARKER_STYLES.findIndex((st) => !takenStyles.has(st.style));

  const addCustom = () => {
    const label = newLabel.trim();
    if (!label || custom.length >= MAX_CUSTOM_TYPES) return;
    const style = CUSTOM_MARKER_STYLES[newStyle] || CUSTOM_MARKER_STYLES[freeStyle] || CUSTOM_MARKER_STYLES[0];
    const entry = {
      id: `custom_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
      label,
      custom: true,
      style: style.style,
      shape: style.shape,
      color: style.color,
    };
    setNested('painMap.customTypes', [...custom, entry]);
    setNewLabel('');
    setActiveType(entry.id);
    // Move the picker to the next unused marker so two symptoms cannot
    // silently share a glyph.
    const next = CUSTOM_MARKER_STYLES.findIndex(
      (st) => st.style !== style.style && !takenStyles.has(st.style)
    );
    setNewStyle(next === -1 ? 0 : next);
  };

  /**
   * Removing a symptom also removes what was drawn with it. Leaving the marks
   * behind would put unlabelled glyphs on the diagram that resolve to the
   * wrong symptom in the note.
   */
  const removeCustom = (id) => {
    const next = { ...painMap, customTypes: custom.filter((c) => c.id !== id) };
    for (const v of ['anterior', 'posterior', 'left', 'right']) {
      if (!next[v]) continue;
      next[v] = {
        marks: (next[v].marks || []).filter((m) => m.type !== id),
        paths: (next[v].paths || []).filter((pth) => pth.type !== id),
      };
    }
    setNested('painMap', next);
    if (activeType === id) setActiveType('ache');
  };

  const total = countMarks(painMap);

  const updateView = (view, next) => setNested(`painMap.${view}`, next);
  // Clears the drawing but keeps the symptoms the patient named — having to
  // retype them to redo one mark would be its own small punishment.
  const clearAll = () =>
    setNested('painMap', { ...JSON.parse(JSON.stringify(EMPTY_PAIN_MAP)), customTypes: custom });

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

          {custom.map((c) => {
            const on = activeType === c.id;
            return (
              <span
                key={c.id}
                className={`flex items-center gap-2 pl-2 pr-1.5 py-2 rounded-full border text-sm font-medium transition-all ${
                  on ? 'border-navy-600 bg-navy-50 text-navy-700 shadow-sm' : 'border-gray-200 bg-white text-gray-600'
                }`}
              >
                <button
                  onClick={() => setActiveType(c.id)}
                  aria-pressed={on}
                  className="flex items-center gap-2"
                >
                  <svg viewBox="0 0 20 20" className="w-5 h-5 flex-shrink-0" aria-hidden="true">
                    <MarkerGlyph type={c.id} x={10} y={10} scale={0.95} types={types} />
                  </svg>
                  {c.label}
                </button>
                <button
                  onClick={() => removeCustom(c.id)}
                  aria-label={`${t('Remove')} ${c.label}`}
                  className="w-5 h-5 rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors leading-none"
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>

        {/* Name your own. The six built-ins cover most spine complaints but
            not itching, cramping or coldness, and forcing those into "aching"
            loses the word the patient chose. */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <p className="text-sm font-medium text-gray-600 mb-1">{t('Something else? Add your own')}</p>
          <p className="text-xs text-gray-400 mb-2.5">
            {t('If none of these describe what you feel, name it yourself and pick a marker. You can add up to 4.')}
          </p>

          {custom.length >= MAX_CUSTOM_TYPES ? (
            <p className="text-xs text-gray-400 italic">
              {t('You have added the maximum of 4 of your own symptoms.')}
            </p>
          ) : (
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs text-gray-500 mb-1" htmlFor="custom-symptom">
                  {t('Name the feeling')}
                </label>
                <input
                  id="custom-symptom"
                  type="text"
                  value={newLabel}
                  maxLength={28}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
                  placeholder={t('e.g., Itching, Cramping, Coldness, Pulling')}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <span className="block text-xs text-gray-500 mb-1">{t('Pick a marker')}</span>
                <div className="flex gap-1.5">
                  {CUSTOM_MARKER_STYLES.map((st, i) => {
                    const taken = takenStyles.has(st.style);
                    const on = newStyle === i && !taken;
                    return (
                      <button
                        key={st.style}
                        onClick={() => !taken && setNewStyle(i)}
                        disabled={taken}
                        aria-pressed={on}
                        aria-label={st.style}
                        className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-all ${
                          taken
                            ? 'border-gray-100 opacity-25 cursor-not-allowed'
                            : on
                            ? 'border-navy-600 bg-navy-50 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <svg viewBox="0 0 20 20" className="w-5 h-5" aria-hidden="true">
                          <MarkerGlyph
                            type="__preview"
                            x={10}
                            y={10}
                            scale={0.95}
                            types={[{ id: '__preview', label: st.style, shape: st.shape, color: st.color }]}
                          />
                        </svg>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={addCustom}
                disabled={!newLabel.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-navy-600 text-white
                           disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t('Add')}
              </button>
            </div>
          )}
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
            types={types}
          />
          <BodyDiagram
            view="posterior"
            label={t('Back')}
            data={painMap.posterior}
            activeType={activeType}
            mode={mode}
            onChange={(next) => updateView('posterior', next)}
            types={types}
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
