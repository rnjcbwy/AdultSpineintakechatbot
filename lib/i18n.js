// ============================================================================
// Lightweight i18n for the intake UI.
//
// STRATEGY: display-only translation. Stored data values stay canonical
// (English / booleans / indices) so red-flag detection, PROMs scoring, and the
// generated English clinical note all keep working unchanged. Only the text the
// patient SEES is translated. Free text the patient types is stored as-is and
// translated to English by the note generator.
//
// Usage in a component:
//   import { useLang, makeT, COMMON } from '../../lib/i18n';
//   const lang = useLang();
//   const t = makeT({ ...COMMON, ...LOCAL_DICT }, lang);
//   ...
//   <label>{t('When did this start?')}</label>
//   {OPTIONS.map(o => <button>{t(o)}</button>)}   // stores English `o`, shows t(o)
// ============================================================================

'use client';

import { useIntake } from './store';

/** Current UI language code ('en' | 'es' | 'zh'). */
export function useLang() {
  const { data } = useIntake();
  return data?.language || 'en';
}

/**
 * Build a translator from an English->{es,zh} dictionary.
 * Returns the English source unchanged when lang is 'en' or when a key/locale
 * is missing (graceful fallback), so untranslated strings still render.
 */
export function makeT(dict, lang) {
  return (text) => {
    if (lang === 'en' || text == null) return text;
    const entry = dict[text];
    return (entry && entry[lang]) || text;
  };
}

/** Strings reused across many steps. Spread into a component's local dict. */
export const COMMON = {
  // Navigation / chrome
  'Back': { es: 'Atrás', zh: '返回' },
  'Continue': { es: 'Continuar', zh: '继续' },
  'Save & Exit': { es: 'Guardar y salir', zh: '保存并退出' },
  'Skip this section': { es: 'Omitir esta sección', zh: '跳过此部分' },
  'Skip to next section': { es: 'Saltar a la siguiente sección', zh: '跳到下一部分' },

  // Yes / No
  'Yes': { es: 'Sí', zh: '是' },
  'No': { es: 'No', zh: '否' },

  // "Did it help?" scale
  'Select...': { es: 'Seleccionar...', zh: '请选择...' },
  'Did it help?': { es: '¿Ayudó?', zh: '有帮助吗？' },
  'Helped a lot': { es: 'Ayudó mucho', zh: '帮助很大' },
  'Helped somewhat': { es: 'Ayudó un poco', zh: '有一些帮助' },
  'Helped temporarily': { es: 'Ayudó temporalmente', zh: '暂时有帮助' },
  'Did not help': { es: 'No ayudó', zh: '没有帮助' },
  'Made it worse': { es: 'Lo empeoró', zh: '使情况恶化' },

  // Symptom region labels (from SYMPTOM_REGIONS)
  'Neck pain': { es: 'Dolor de cuello', zh: '颈部疼痛' },
  'Upper back pain': { es: 'Dolor de la espalda alta', zh: '上背部疼痛' },
  'Low back pain': { es: 'Dolor lumbar', zh: '下背部疼痛' },
  'Right arm pain': { es: 'Dolor en el brazo derecho', zh: '右臂疼痛' },
  'Left arm pain': { es: 'Dolor en el brazo izquierdo', zh: '左臂疼痛' },
  'Right leg pain': { es: 'Dolor en la pierna derecha', zh: '右腿疼痛' },
  'Left leg pain': { es: 'Dolor en la pierna izquierda', zh: '左腿疼痛' },
  'Numbness or tingling': { es: 'Entumecimiento u hormigueo', zh: '麻木或刺痛' },
  'Weakness': { es: 'Debilidad', zh: '无力' },
  'Balance problems': { es: 'Problemas de equilibrio', zh: '平衡问题' },
  'Hand clumsiness or dropping objects': { es: 'Torpeza en las manos o dejar caer objetos', zh: '手部笨拙或掉落物品' },
  'Difficulty walking or standing': { es: 'Dificultad para caminar o estar de pie', zh: '行走或站立困难' },
  'Posture or spinal curvature concerns': { es: 'Preocupaciones sobre la postura o la curvatura de la columna', zh: '姿势或脊柱弯曲问题' },
  'Pain after prior spine surgery': { es: 'Dolor después de una cirugía de columna previa', zh: '既往脊柱手术后疼痛' },
  'Recent injury or trauma': { es: 'Lesión o traumatismo reciente', zh: '近期受伤或外伤' },
};
