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

import { useEffect, useState } from 'react';
import { useIntake } from './store';

// The language tables live in lib/languages.js (no React there, so the server
// can read them too); re-exported here for every component that always
// imported them from this module.
import { LANGUAGES, LANGUAGE_NAMES, isRtl } from './languages';
export { LANGUAGES, LANGUAGE_NAMES, isRtl };

const TABLES = {};
const LOADING = {};

/** Load a language's table once; resolves immediately for English. */
export function ensureTranslations(lang) {
  if (!lang || lang === 'en' || TABLES[lang]) return Promise.resolve();
  if (!LOADING[lang]) {
    LOADING[lang] = import(`./translations/${lang}.json`)
      .then((m) => { TABLES[lang] = m.default || m; })
      .catch(() => { TABLES[lang] = {}; });
  }
  return LOADING[lang];
}

/** One string through the loaded table (English when nothing is loaded yet). */
export function tx(lang, text) {
  if (!text || lang === 'en') return text;
  return TABLES[lang]?.[text] || text;
}

/** Translate every string inside a nested object/array (for per-language T blocks). */
export function translateDeep(value, lang) {
  if (typeof value === 'string') return tx(lang, value);
  if (Array.isArray(value)) return value.map((v) => translateDeep(v, lang));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, translateDeep(v, lang)]));
  return value;
}

/**
 * Current UI language code. Also loads that language's table and re-renders
 * the caller once it arrives, so every component that asks for the language
 * picks up the words without any further plumbing.
 */
export function useLang() {
  const { data } = useIntake();
  const lang = data?.language || 'en';
  const [, bump] = useState(0);
  useEffect(() => {
    let live = true;
    ensureTranslations(lang).then(() => { if (live && lang !== 'en') bump((n) => n + 1); });
    return () => { live = false; };
  }, [lang]);
  return lang;
}

/**
 * Build a translator from an English->{es,zh} dictionary.
 * Returns the English source unchanged when lang is 'en' or when a key/locale
 * is missing (graceful fallback), so untranslated strings still render. For
 * languages without inline entries, the loaded table is consulted.
 */
export function makeT(dict, lang) {
  return (text) => {
    if (lang === 'en' || text == null) return text;
    const entry = dict[text];
    return (entry && entry[lang]) || tx(lang, text) || text;
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

  // Symptom region labels of the orthopaedic service (lib/services/ortho/constants.js)
  'Right shoulder': { es: 'Hombro derecho', zh: '右肩' },
  'Left shoulder': { es: 'Hombro izquierdo', zh: '左肩' },
  'Right elbow': { es: 'Codo derecho', zh: '右肘' },
  'Left elbow': { es: 'Codo izquierdo', zh: '左肘' },
  'Right hand, wrist or fingers': { es: 'Mano, muñeca o dedos derechos', zh: '右手、手腕或手指' },
  'Left hand, wrist or fingers': { es: 'Mano, muñeca o dedos izquierdos', zh: '左手、手腕或手指' },
  'Right hip': { es: 'Cadera derecha', zh: '右髋' },
  'Left hip': { es: 'Cadera izquierda', zh: '左髋' },
  'Right knee': { es: 'Rodilla derecha', zh: '右膝' },
  'Left knee': { es: 'Rodilla izquierda', zh: '左膝' },
  'Right ankle or foot': { es: 'Tobillo o pie derecho', zh: '右踝或右脚' },
  'Left ankle or foot': { es: 'Tobillo o pie izquierdo', zh: '左踝或左脚' },
  'Neck or back': { es: 'Cuello o espalda', zh: '颈部或背部' },
  'Swelling': { es: 'Hinchazón', zh: '肿胀' },
  'Giving way, locking or catching': { es: 'Se dobla, se traba o se engancha', zh: '打软、卡住或交锁' },
  'A bump, lump or change in shape': { es: 'Un bulto, una protuberancia o un cambio de forma', zh: '肿块、隆起或形状改变' },
  'Pain after a prior operation': { es: 'Dolor después de una operación previa', zh: '既往手术后疼痛' },
  'Recent injury, fall or broken bone': { es: 'Lesión, caída o fractura reciente', zh: '近期受伤、跌倒或骨折' },
  // The joint rows of the chief-complaint grid (JOINT_ROWS) and its side buttons
  'Shoulder': { es: 'Hombro', zh: '肩' },
  'Elbow': { es: 'Codo', zh: '肘' },
  'Hand, wrist or fingers': { es: 'Mano, muñeca o dedos', zh: '手、手腕或手指' },
  'Hip': { es: 'Cadera', zh: '髋' },
  'Knee': { es: 'Rodilla', zh: '膝' },
  'Ankle or foot': { es: 'Tobillo o pie', zh: '踝或脚' },
  'Left': { es: 'Izquierdo', zh: '左' },
  'Right': { es: 'Derecho', zh: '右' },
};
