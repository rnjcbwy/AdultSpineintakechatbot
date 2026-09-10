/**
 * Export the intake as a platform-neutral JSON specification.
 *
 *   node scripts/export-spec.mjs            -> spec/spine-intake-spec.json
 *
 * Written for handing the design to another team to rebuild on their own
 * platform. Everything clinical is GENERATED FROM THE APP'S OWN SOURCE rather
 * than transcribed, so the spec cannot quietly drift from what was actually
 * built and tested: the questionnaires, review of systems, body-map zones,
 * red flags and payer rules are loaded from lib/, and the form fields are
 * pulled out of each step component's syntax tree.
 *
 * Every extracted field path is then checked against the app's data schema,
 * and the run fails if one does not exist — a spec that names fields the app
 * never stores would send the other team building the wrong thing.
 *
 * What is deliberately NOT exported:
 *   - any patient data (this is the form definition only);
 *   - requirement text for payers flagged reproductionRestricted. Carelon
 *     states its guidelines may not be reproduced or distributed without
 *     written consent, and this file exists to be given to a third party.
 *     Its policy IDs, source links and evidence mapping ARE included, so the
 *     receiving team can license the criteria and wire them up.
 */

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { pathToFileURL } from 'url';

const require = createRequire(import.meta.url);
const ts = require('typescript');

const ROOT = process.cwd();
const TMP = path.join(ROOT, '.spec-tmp');
const OUT_DIR = path.join(ROOT, 'spec');
const OUT = path.join(OUT_DIR, 'spine-intake-spec.json');

// ---------------------------------------------------------------------------
// 1. Load the data modules.
//
// lib/ is ESM inside a CommonJS package, so Node will not import it directly.
// Each module is copied into a scratch directory as .mjs with its relative
// imports rewritten to match; the directory is removed afterwards.
// ---------------------------------------------------------------------------
const LIB_MODULES = [
  'constants', 'questionnaires', 'rosSystems', 'bodyMap', 'redFlags',
  'promSummary', 'noteFingerprint', 'documents', 'authReadiness',
];

function stageModules() {
  fs.rmSync(TMP, { recursive: true, force: true });
  fs.mkdirSync(path.join(TMP, 'payers'), { recursive: true });
  fs.copyFileSync(path.join(ROOT, 'lib/payers/rules.json'), path.join(TMP, 'payers/rules.json'));

  for (const name of LIB_MODULES) {
    let src = fs.readFileSync(path.join(ROOT, 'lib', `${name}.js`), 'utf8');
    src = src.replace(/from '\.\/([A-Za-z0-9_]+)'/g, "from './$1.mjs'");
    src = src.replace(
      "import rules from './payers/rules.json';",
      "import rules from './payers/rules.json' with { type: 'json' };"
    );
    fs.writeFileSync(path.join(TMP, `${name}.mjs`), src);
  }

  // The store pulls in React, so only its default data shape is staged.
  const store = fs.readFileSync(path.join(ROOT, 'lib/store.js'), 'utf8');
  const start = store.indexOf('export const defaultIntakeData = {');
  const end = store.indexOf('\n};', start) + 3;
  if (start === -1) throw new Error('defaultIntakeData not found in lib/store.js');
  fs.writeFileSync(
    path.join(TMP, 'schema.mjs'),
    "import { emptyROS } from './rosSystems.mjs';\n" +
    "import { EMPTY_PAIN_MAP } from './bodyMap.mjs';\n" +
    'const generateId = () => "";\n' +
    store.slice(start, end) + '\n'
  );

  // i18n likewise: only the shared string table, not the hooks.
  const i18n = fs.readFileSync(path.join(ROOT, 'lib/i18n.js'), 'utf8');
  const cs = i18n.indexOf('export const COMMON = {');
  const ce = i18n.indexOf('\n};', cs) + 3;
  fs.writeFileSync(path.join(TMP, 'common.mjs'), i18n.slice(cs, ce) + '\n');

  // prompts: the note instructions, with their summariser imports rewired.
  let prompts = fs.readFileSync(path.join(ROOT, 'lib/prompts.js'), 'utf8');
  prompts = prompts.replace(/from '\.\/([A-Za-z0-9_]+)'/g, "from './$1.mjs'");
  fs.writeFileSync(path.join(TMP, 'prompts.mjs'), prompts);
}

async function load(name) {
  return import(pathToFileURL(path.join(TMP, `${name}.mjs`)).href);
}

// ---------------------------------------------------------------------------
// 2. Pull form fields out of the step components.
//
// Each step writes through a small helper — updateField('firstName', v),
// updateTx('physicalTherapy.frequency', v) — whose prefix is the section of
// the data model it writes to. Walking the JSX tree finds every element wired
// to one of those helpers, and reads its label, placeholder, suggestions and
// option list off the same element.
// ---------------------------------------------------------------------------

/** helper name -> data-model prefix, per step file. */
const WRITERS = {
  Demographics: { updateField: 'demographics' },
  ChiefComplaint: { updateField: 'chiefComplaint' },
  SocialHistory: { update: 'socialHistory' },
  PriorTreatments: { updateTx: 'hpiData.conservativeTreatments' },
  RecordsUpload: { updateEv: 'authEvidence' },
  SymptomDetails: { updateOverall: 'hpiData.overall', update: 'hpiData.symptoms.{symptomId}' },
};

/**
 * List steps (medications, allergies, surgeries...) edit a draft item with
 * setForm(prev => ({ ...prev, field: value })) and append it on "Add". Each
 * property written that way is a field of the list's item.
 */
const DRAFT_WRITERS = {
  Medications: { setForm: 'medications.current[]' },
  Allergies: { setForm: 'allergies.entries[]' },
  PastSurgicalHistory: { setForm: 'pastSurgicalHistory.surgeries[]' },
  FamilyHistory: { setForm: 'familyHistory.entries[]' },
  PriorTreatments: { setNewInjection: 'hpiData.conservativeTreatments.injections[]' },
};

/**
 * Writers that name the field in a LATER argument:
 * updateConditionDetail(conditionName, 'yearDiagnosed', value).
 */
const ARG_FIELD_WRITERS = {
  PastMedicalHistory: { updateConditionDetail: { argIndex: 1, prefix: 'pastMedicalHistory.conditions[]' } },
};

/**
 * Fields set through toggle helpers rather than written inline, so there is no
 * field name in the JSX to find. Stated here, and still schema-checked.
 */
const CURATED_FIELDS = {
  'chief-complaint': [
    { path: 'chiefComplaint.symptomRegions', type: 'multi_choice', label: 'Where are your symptoms?',
      optionsFrom: 'reference.symptomRegions', note: 'Drives which PROMs are offered and which symptom-detail cards appear.' },
  ],
  pmh: [
    { path: 'pastMedicalHistory.conditions', type: 'multi_choice', label: 'Past medical conditions',
      optionsFrom: 'reference.commonConditions',
      note: 'Each selected condition becomes an item { name, yearDiagnosed, details }. The patient may also add a condition not listed.' },
    { path: 'pastMedicalHistory.implantedDevices', type: 'multi_choice', label: 'Implanted medical devices',
      optionsFrom: 'reference.implantedDevices', note: 'Relevant to surgical planning and to MRI safety.' },
  ],
};

/** Steps whose content is defined elsewhere in this spec, not as fields. */
const SPEC_SECTIONS = {
  'pain-map': 'bodyMap',
  ros: 'reviewOfSystems',
  proms: 'proms',
  review: 'noteGeneration',
};

/** Step id (constants.INTAKE_STEPS) -> component file. */
const STEP_FILES = {
  welcome: 'Welcome', consent: 'BeforeWeBegin', demographics: 'Demographics',
  'chief-complaint': 'ChiefComplaint', 'pain-map': 'PainMap', 'symptom-details': 'SymptomDetails',
  treatments: 'PriorTreatments', records: 'RecordsUpload', additional: 'AdditionalConcerns',
  pmh: 'PastMedicalHistory', psh: 'PastSurgicalHistory', medications: 'Medications',
  allergies: 'Allergies', social: 'SocialHistory', family: 'FamilyHistory',
  ros: 'ReviewOfSystems', proms: 'PROMs', review: 'FinalReview',
};

function parseComponent(file) {
  const src = fs.readFileSync(path.join(ROOT, 'components/steps', `${file}.js`), 'utf8');
  return { src, sf: ts.createSourceFile(`${file}.js`, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.JSX) };
}

/** Plain text of a JSX attribute, unwrapping t('...') translation calls. */
function attrText(attr) {
  if (!attr || !attr.initializer) return null;
  const init = attr.initializer;
  if (ts.isStringLiteral(init)) return init.text;
  if (ts.isJsxExpression(init) && init.expression) {
    const e = init.expression;
    if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) return e.text;
    if (ts.isCallExpression(e) && e.arguments[0] &&
        (ts.isStringLiteral(e.arguments[0]) || ts.isNoSubstitutionTemplateLiteral(e.arguments[0]))) {
      return e.arguments[0].text;
    }
  }
  return null;
}

function attrs(node) {
  const el = ts.isJsxElement(node) ? node.openingElement : node;
  const out = {};
  for (const a of el.attributes.properties) {
    if (ts.isJsxAttribute(a)) out[a.name.getText()] = a;
  }
  return out;
}

function tagName(node) {
  const el = ts.isJsxElement(node) ? node.openingElement : node;
  return el.tagName.getText();
}

/** Top-level `const NAME = [ 'a', 'b' ]` string arrays, for suggestions={NAME}. */
function constArrays(sf) {
  const out = {};
  const visit = (n) => {
    if (ts.isVariableDeclaration(n) && n.initializer && ts.isArrayLiteralExpression(n.initializer)) {
      const vals = n.initializer.elements
        .map((e) => (ts.isStringLiteral(e) ? e.text : null))
        .filter((v) => v != null);
      if (vals.length) out[n.name.getText()] = vals;
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return out;
}

/** The `const LOCAL = { 'English': { es, zh } }` table, read without eval. */
function localStrings(sf) {
  const out = {};
  const visit = (n) => {
    if (ts.isVariableDeclaration(n) && n.name.getText() === 'LOCAL' &&
        n.initializer && ts.isObjectLiteralExpression(n.initializer)) {
      for (const p of n.initializer.properties) {
        if (!ts.isPropertyAssignment(p)) continue;
        const key = ts.isStringLiteral(p.name) ? p.name.text : p.name.getText();
        if (!ts.isObjectLiteralExpression(p.initializer)) continue;
        const entry = {};
        for (const q of p.initializer.properties) {
          if (ts.isPropertyAssignment(q) &&
              (ts.isStringLiteral(q.initializer) || ts.isNoSubstitutionTemplateLiteral(q.initializer))) {
            entry[q.name.getText()] = q.initializer.text;
          }
        }
        out[key] = entry;
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return out;
}

/**
 * Nearest preceding <label>{t('...')}</label> among an element's siblings —
 * how most plain inputs in this codebase are labelled.
 */
function siblingLabel(node) {
  const parent = node.parent;
  if (!parent || !ts.isJsxElement(parent)) return null;
  const kids = parent.children.filter((c) => ts.isJsxElement(c) || ts.isJsxSelfClosingElement(c));
  const idx = kids.indexOf(node);
  for (let i = idx - 1; i >= 0; i--) {
    const k = kids[i];
    if (ts.isJsxElement(k) && k.openingElement.tagName.getText() === 'label') {
      for (const c of k.children) {
        if (ts.isJsxExpression(c) && c.expression && ts.isCallExpression(c.expression)) {
          const a = c.expression.arguments[0];
          if (a && (ts.isStringLiteral(a) || ts.isNoSubstitutionTemplateLiteral(a))) return a.text;
        }
        if (ts.isJsxText(c) && c.getText().trim()) return c.getText().trim();
      }
    }
  }
  return null;
}

/** Nearest heading or label text above `node`, climbing ancestors. */
function headingAbove(node) {
  let cur = node;
  for (let depth = 0; cur && depth < 8; depth++) {
    const sib = siblingLabel(cur) || siblingHeading(cur);
    if (sib) return sib;
    cur = cur.parent;
  }
  return null;
}

/** Preceding sibling <h2|h3|h4|label|p> carrying t('...') text. */
function siblingHeading(node) {
  const parent = node.parent;
  if (!parent || !ts.isJsxElement(parent)) return null;
  const kids = parent.children.filter((c) => ts.isJsxElement(c) || ts.isJsxSelfClosingElement(c));
  const idx = kids.indexOf(node);
  // Two passes: a real heading first, and only then a paragraph. A question
  // is often preceded by a line of reassurance ("This is asked for your
  // safety...") that sits closer to the control than its heading does.
  for (const tags of [['h2', 'h3', 'h4', 'label'], ['p']]) {
    for (let i = idx - 1; i >= 0; i--) {
      const k = kids[i];
      if (!ts.isJsxElement(k)) continue;
      if (!tags.includes(k.openingElement.tagName.getText())) continue;
      for (const c of k.children) {
        if (ts.isJsxExpression(c) && c.expression && ts.isCallExpression(c.expression)) {
          const a = c.expression.arguments[0];
          if (a && (ts.isStringLiteral(a) || ts.isNoSubstitutionTemplateLiteral(a))) return a.text;
        }
      }
    }
  }
  return null;
}

/** The JSX element whose event handler contains `node`. */
function owningControl(node) {
  let cur = node.parent;
  while (cur) {
    if (ts.isJsxAttribute(cur)) {
      const el = cur.parent.parent; // JsxAttributes -> opening / self-closing element
      const owner = ts.isJsxOpeningElement(el) ? el.parent : el;
      return { element: owner, handler: cur.name.getText() };
    }
    cur = cur.parent;
  }
  return null;
}

/** If `ident` is the parameter of an enclosing ARRAY.map(), return ARRAY's items. */
function mapOptions(ident, arrays) {
  let cur = ident.parent;
  while (cur) {
    if ((ts.isArrowFunction(cur) || ts.isFunctionExpression(cur)) &&
        cur.parameters.some((pr) => pr.name.getText() === ident.getText()) &&
        ts.isCallExpression(cur.parent) && ts.isPropertyAccessExpression(cur.parent.expression) &&
        cur.parent.expression.name.getText() === 'map') {
      const target = cur.parent.expression.expression;
      if (ts.isArrayLiteralExpression(target)) {
        return target.elements.map((e) => (ts.isStringLiteral(e) ? e.text : null)).filter((v) => v != null);
      }
      if (ts.isIdentifier(target) && arrays[target.getText()]) return arrays[target.getText()];
      return [];
    }
    cur = cur.parent;
  }
  return null;
}

/**
 * The condition a field is shown under, as the component writes it — tobacco
 * details only appear for current or former smokers, for instance. Reported
 * as source text: a rebuild needs the branching, and paraphrasing it is how
 * it would get lost.
 */
function showWhen(node) {
  let cur = node.parent;
  while (cur) {
    if (ts.isBinaryExpression(cur) && cur.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken &&
        cur.parent && ts.isJsxExpression(cur.parent)) {
      return cur.left.getText().replace(/\s+/g, ' ');
    }
    if (ts.isFunctionDeclaration(cur)) break;
    cur = cur.parent;
  }
  return null;
}

function extractFields(file) {
  const { sf } = parseComponent(file);
  const writers = { ...(WRITERS[file] || {}), setNested: '' };
  const arrays = constArrays(sf);
  const byKey = new Map();

  /** Classify and store one write of `value` to `pathStr`, made from `node`. */
  const record = (node, pathStr, value) => {
    const ctl = owningControl(node);
    if (!ctl) return;
    const { element, handler } = ctl;
    const tag = tagName(element);
    const a = attrs(element);

    const inputType = tag === 'input' ? attrText(a.type) : null;
    let type =
      tag === 'select' || tag === 'SelectField' || tag === 'HelpedSelect' ? 'select' :
      tag === 'textarea' ? 'textarea' :
      tag === 'TreatmentToggle' || tag === 'YesNoQuestion' ? 'yes_no' :
      tag === 'ChipRow' ? 'single_choice' :
      tag === 'MultiChip' ? 'multi_choice' :
      inputType === 'checkbox' ? 'yes_no' :
      ['date', 'tel', 'email', 'number'].includes(inputType) ? inputType : 'text';

    const options = [];
    if (ts.isJsxElement(element)) {
      for (const c of element.children) {
        if (ts.isJsxElement(c) && c.openingElement.tagName.getText() === 'option') {
          const v = attrText(attrs(c).value);
          if (v) options.push(v);
        }
      }
    }
    if (a.options && a.options.initializer && ts.isJsxExpression(a.options.initializer)) {
      const ex = a.options.initializer.expression;
      if (ts.isIdentifier(ex)) options.push(...(arrays[ex.getText()] || []));
      if (ts.isArrayLiteralExpression(ex)) {
        for (const e of ex.elements) if (ts.isStringLiteral(e)) options.push(e.text);
      }
    }
    // Chip groups: <button onClick={() => set('x', opt)}> inside ARRAY.map(opt => ...)
    if (handler === 'onClick' && value) {
      if (ts.isIdentifier(value)) {
        const opts = mapOptions(value, arrays);
        if (opts && opts.length) { options.push(...opts); type = 'single_choice'; }
      } else if (ts.isStringLiteral(value)) {
        options.push(value.text); type = 'single_choice';
      } else if (value.kind === ts.SyntaxKind.TrueKeyword || value.kind === ts.SyntaxKind.FalseKeyword) {
        type = 'yes_no';
      }
    }
    if (tag === 'HelpedSelect') {
      options.push('Helped a lot', 'Helped somewhat', 'Helped temporarily', 'Did not help');
      if (a.includeWorse) options.push('Made it worse');
    }

    let suggestions = [];
    if (a.suggestions && a.suggestions.initializer && ts.isJsxExpression(a.suggestions.initializer)) {
      suggestions = arrays[a.suggestions.initializer.expression.getText()] || [];
    }

    const key = `${pathStr}|${type}`;
    const prev = byKey.get(key);
    if (prev) {
      // Several buttons writing one field are one question: merge them.
      for (const o of options) {
        prev.options = prev.options || [];
        if (!prev.options.includes(o)) prev.options.push(o);
      }
      return;
    }
    // Label precedence: the field's own label, then a <label> beside it, then
    // the question its placeholder asks ("Where? (e.g., L4-L5)" -> "Where?"),
    // and only then the section heading. Several injection inputs carry their
    // meaning solely in the placeholder, and falling straight to the heading
    // labelled all seven of them "Injections".
    const placeholder = attrText(a.placeholder);
    const own = attrText(a.label) || siblingLabel(element);
    const asked = placeholder && /^\s*([^(]*?\?)/.exec(placeholder)?.[1]?.trim();
    const heading = headingAbove(element);
    const f = {
      path: pathStr,
      type,
      label: own || asked || heading || null,
      placeholder,
    };
    if (!own && asked && heading && heading !== f.label) f.group = heading;
    if (options.length) f.options = [...new Set(options)];
    if (suggestions.length) f.suggestedAnswers = suggestions;
    const cond = showWhen(element);
    if (cond) f.showWhen = cond;
    byKey.set(key, f);
  };

  const drafts = DRAFT_WRITERS[file] || {};

  /** { path, value } pairs for a draft setter call, or [] if it is not one. */
  const draftWrites = (call) => {
    const listPath = drafts[call.expression.getText()];
    if (!listPath || !call.arguments[0]) return [];
    let obj = call.arguments[0];
    if (ts.isArrowFunction(obj) || ts.isFunctionExpression(obj)) obj = obj.body;
    while (obj && ts.isParenthesizedExpression(obj)) obj = obj.expression;
    if (!obj || !ts.isObjectLiteralExpression(obj)) return [];
    // Only a spread-plus-one-field update is an edit to a single field; a
    // bare object literal is a reset of the whole draft.
    if (!obj.properties.some((pr) => ts.isSpreadAssignment(pr))) return [];
    return obj.properties
      .filter((pr) => ts.isPropertyAssignment(pr))
      .map((pr) => ({ path: `${listPath}.${pr.name.getText()}`, value: pr.initializer }));
  };

  const argWriters = ARG_FIELD_WRITERS[file] || {};

  const visit = (node) => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) &&
        node.expression.getText() in drafts) {
      for (const w of draftWrites(node)) record(node, w.path, w.value);
    }
    // setSection('section', { ...prev, field: value })
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) &&
        node.expression.getText() === 'setSection' && node.arguments.length === 2 &&
        ts.isStringLiteral(node.arguments[0]) && ts.isObjectLiteralExpression(node.arguments[1]) &&
        node.arguments[1].properties.some((pr) => ts.isSpreadAssignment(pr))) {
      for (const pr of node.arguments[1].properties) {
        if (ts.isPropertyAssignment(pr)) {
          record(node, `${node.arguments[0].text}.${pr.name.getText()}`, pr.initializer);
        }
      }
    }
    // updateConditionDetail(name, 'field', value)
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) &&
        node.expression.getText() in argWriters) {
      const spec = argWriters[node.expression.getText()];
      const fieldArg = node.arguments[spec.argIndex];
      if (fieldArg && ts.isStringLiteral(fieldArg)) {
        record(node, `${spec.prefix}.${fieldArg.text}`, node.arguments[spec.argIndex + 1]);
      }
    }
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) &&
        node.expression.getText() in writers && node.arguments.length >= 1) {
      const first = node.arguments[0];
      if (ts.isStringLiteral(first) || ts.isNoSubstitutionTemplateLiteral(first)) {
        const prefix = writers[node.expression.getText()];
        record(node, prefix ? `${prefix}.${first.text}` : first.text, node.arguments[1]);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);

  // A text box and a chip group can write the same path; keep the choice,
  // which is the one carrying the options.
  const out = [];
  const paths = new Map();
  for (const f of byKey.values()) {
    const existing = paths.get(f.path);
    if (!existing) { paths.set(f.path, f); out.push(f); continue; }
    if (f.options && !existing.options) Object.assign(existing, f);
  }
  return out;
}

/** Step title and subtitle as the patient sees them. */
function stepCopy(file) {
  const { sf } = parseComponent(file);
  const out = {};
  const visit = (n) => {
    if (ts.isJsxElement(n)) {
      const cls = attrText(attrs(n).className) || '';
      const key = cls.includes('section-title') ? 'title' : cls.includes('section-subtitle') ? 'subtitle' : null;
      if (key && !out[key]) {
        for (const c of n.children) {
          if (ts.isJsxExpression(c) && c.expression && ts.isCallExpression(c.expression)) {
            const a = c.expression.arguments[0];
            if (a && (ts.isStringLiteral(a) || ts.isNoSubstitutionTemplateLiteral(a))) out[key] = a.text;
          }
        }
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return out;
}

// ---------------------------------------------------------------------------
// 3. Schema checks. A field the app never stores is a spec error.
// ---------------------------------------------------------------------------
function pathExists(schema, dotted) {
  // "section.list[].field": the list must exist and be an array. Its items
  // are created by the patient, so an empty default holds no shape to check.
  const listMatch = /^(.*)\[\]\.[^.]+$/.exec(dotted);
  if (listMatch) {
    let cur = schema;
    for (const k of listMatch[1].split('.')) {
      if (cur == null || typeof cur !== 'object' || !(k in cur)) return false;
      cur = cur[k];
    }
    return Array.isArray(cur);
  }
  let cur = schema;
  for (const k of dotted.split('.')) {
    if (k === '{symptomId}') return true;         // keyed by the patient's symptoms
    if (cur == null || typeof cur !== 'object') return false;
    if (!(k in cur)) {
      // Nested objects that are created on first write (e.g. a treatment's
      // sub-fields) exist in the schema only as their parent object.
      return typeof cur === 'object' && !Array.isArray(cur) && Object.keys(cur).length === 0;
    }
    cur = cur[k];
  }
  return true;
}

// ---------------------------------------------------------------------------
// 4. Assemble.
// ---------------------------------------------------------------------------
async function main() {
  stageModules();
  let spec;
  try {
    const constants = await load('constants');
    const q = await load('questionnaires');
    const ros = await load('rosSystems');
    const bm = await load('bodyMap');
    const rf = await load('redFlags');
    const docs = await load('documents');
    const auth = await load('authReadiness');
    const { defaultIntakeData } = await load('schema');
    const { COMMON } = await load('common');
    const prompts = await load('prompts');
    const rules = JSON.parse(fs.readFileSync(path.join(ROOT, 'lib/payers/rules.json'), 'utf8'));

    // ---- steps + fields -------------------------------------------------
    const translations = { ...COMMON };
    const steps = constants.INTAKE_STEPS.map((s, i) => {
      const file = STEP_FILES[s.id];
      const out = { order: i, id: s.id, label: s.label, component: file || null };
      if (file) {
        const { sf } = parseComponent(file);
        Object.assign(translations, localStrings(sf));
        Object.assign(out, stepCopy(file));
        const fields = [...extractFields(file), ...(CURATED_FIELDS[s.id] || [])];
        if (fields.length) out.fields = fields;
      }
      if (SPEC_SECTIONS[s.id]) out.definedIn = SPEC_SECTIONS[s.id];
      return out;
    });

    // Fail loudly on any field the data model does not hold.
    const bad = [];
    for (const st of steps) {
      for (const f of st.fields || []) {
        if (!pathExists(defaultIntakeData, f.path)) bad.push(`${st.id}: ${f.path}`);
      }
    }
    if (bad.length) {
      throw new Error(`Extracted fields missing from the data schema:\n  ${bad.join('\n  ')}`);
    }

    // ---- PROMs ----------------------------------------------------------
    const instrument = (def, extra) => ({
      id: def.id,
      name: def.name,
      shortName: def.shortName,
      patientDescription: def.description,
      ...extra,
      items: (def.sections || def.questions || []).map((sec) => ({
        id: sec.id,
        title: sec.title || sec.text || sec.question,
        ...(sec.subtitle ? { subtitle: sec.subtitle } : {}),
        options: (sec.options || []).map((o) => ({ value: o.score, label: o.label })),
      })),
      ...(def.domains ? { domains: def.domains } : {}),
    });

    const proms = {
      selectionRules: [
        { instrument: 'odi', when: 'chiefComplaint.symptomRegions includes any of: low-back, right-leg, left-leg, walking-difficulty' },
        { instrument: 'ndi', when: 'chiefComplaint.symptomRegions includes any of: neck, right-arm, left-arm' },
        { instrument: 'mjoa', when: 'symptomRegions includes balance or hand-clumsiness, OR any symptom reports handDexterity, droppingObjects, gaitChanges or lhermittes' },
        { instrument: 'srs22r', when: 'a deformity / scoliosis concern is reported' },
      ],
      noteHandling:
        'Item answers are stored as the option VALUE. Before note generation they must be resolved back ' +
        'to the option LABEL the patient chose — a bare value is meaningless to the note writer, and ' +
        'passing values alone drops the entire functional history. Report the score and interpretation, ' +
        'and work clinically meaningful items into the history as prose. mJOA items are a myelopathy ' +
        'history and must be reported explicitly, not only as a total.',
      instruments: [
        instrument(q.ODI, {
          scoring: {
            method: 'Sum of answered items / (answered items x 5) x 100, rounded. Unanswered items are excluded from the denominator.',
            direction: 'higher_is_worse',
            bands: [
              { max: 20, label: 'Minimal disability' },
              { max: 40, label: 'Moderate disability' },
              { max: 60, label: 'Severe disability' },
              { max: 80, label: 'Crippled' },
              { max: 100, label: 'Bed-bound or exaggerating symptoms' },
            ],
          },
        }),
        instrument(q.NDI, {
          scoring: {
            method: 'As ODI: sum / (answered x 5) x 100.',
            direction: 'higher_is_worse',
            bands: 'same as ODI',
          },
        }),
        instrument(q.MJOA, {
          scoring: {
            method: 'Sum of item values; maximum 18.',
            direction: 'higher_is_better',
            bands: [
              { min: 18, label: 'No myelopathy' },
              { min: 15, label: 'Mild myelopathy' },
              { min: 12, label: 'Moderate myelopathy' },
              { min: 0, label: 'Severe myelopathy' },
            ],
          },
          itemsAreClinicalFindings: true,
        }),
        instrument(q.SRS22R, {
          scoring: {
            method: 'Mean item score per domain (1-5); total is the mean of answered items.',
            direction: 'higher_is_better',
          },
        }),
      ],
      recommendedAdditions: [
        {
          id: 'nrs_pain',
          status: 'recommended — not yet in the prototype',
          name: 'Numeric pain rating, split by region',
          items: [
            'Back pain right now, 0-10', 'Leg pain right now, 0-10',
            'Neck pain right now, 0-10 (cervical patients)', 'Arm pain right now, 0-10 (cervical patients)',
          ],
          rationale:
            'The prototype has no numeric pain score anywhere. Separate axial vs limb scores distinguish ' +
            'axial from radicular predominance, which several payer policies reference for decompression ' +
            'versus fusion, and are needed as a baseline for MCID at follow-up.',
        },
        {
          id: 'phq2_gad7',
          status: 'recommended — not yet in the prototype',
          name: 'PHQ-2 (escalating to PHQ-9 when positive) and GAD-7',
          rationale:
            'Psychological distress is among the strongest predictors of a poor spine surgery outcome, and ' +
            'some bundled-payment and centre-of-excellence programmes require documented screening.',
        },
        {
          id: 'zcq',
          status: 'optional — depends on stenosis volume',
          name: 'Zurich Claudication Questionnaire',
          rationale: 'The stenosis-specific instrument; nothing in the current set covers neurogenic claudication.',
        },
      ],
      licensing:
        'VERIFY BEFORE CLINICAL USE. PHQ-9/GAD-7 and PROMIS are free to use; ODI, SRS-22r and ZCQ have ' +
        'permission or licensing processes. The item wording below is reproduced from the prototype for ' +
        'build reference only and does not convey any licence.',
    };

    // ---- review of systems ---------------------------------------------
    const reviewOfSystems = {
      note:
        'All 14 body systems recognised for E/M documentation. Since 1 Jan 2021 office E/M level is ' +
        'selected on medical decision making or total time, so the system count no longer sets the ' +
        'level; 10+ remains the conventional bar for a complete ROS and is tracked for payers.',
      completeThreshold: ros.COMPLETE_ROS_THRESHOLD,
      systemCountsAsReviewedWhen: 'every question in that system has an answer',
      answers: ['yes', 'no'],
      ux: ['Per-system "No to all" (ROS answers are overwhelmingly negative).', 'Live "N of 14 systems reviewed" counter.'],
      systems: ros.ROS_SECTIONS,
      redFlagLinks: {
        cauda_equina_bowel_bladder: ['bladderChanges', 'bowelChanges', 'urinaryRetention'],
        weight_loss: ['unexplainedWeightLoss'],
        fever_back_pain: ['fevers'],
        cancer_history_new_pain: ['cancerHistory'],
      },
      lookupRule:
        'Look answers up by question id across all systems, never by a fixed path. The prototype once ' +
        'read these from the wrong level and the weight-loss flag silently never fired from the ROS.',
    };

    // ---- body map --------------------------------------------------------
    const bodyMap = {
      coordinateSystem: {
        viewBox: bm.VIEW_BOX,
        storage: 'Marks stored normalised 0..1 of the viewBox, so any rendering size works.',
        inputMapping:
          'Convert pointer position to viewBox units through the SVG screen matrix (getScreenCTM), NOT ' +
          'the element bounding box. With a height-capped figure the element is wider than the artwork ' +
          'and preserveAspectRatio centres it; a bounding-box mapping put marks up to ~28 units off.',
      },
      views: bm.VIEWS,
      viewLabels: bm.VIEW_LABELS,
      figures: bm.FIGURE_SRC,
      laterality:
        'Anterior view: patient\'s left is the viewer\'s right. Posterior: sides match. Lateral views ' +
        'carry their own side. Paired zones declare which half they occupy (at: L|R) because position ' +
        'alone fails where the feet nearly touch — the toe zones sat in the midline dead-zone and lost ' +
        'their side, silently disabling the L5/S1 pattern rules.',
      zoneResolution: 'Smallest containing box wins (so "perineum / saddle area" beats "buttock").',
      symptomTypes: bm.SYMPTOM_TYPES,
      customSymptomTypes: {
        max: bm.MAX_CUSTOM_TYPES,
        styles: bm.CUSTOM_MARKER_STYLES,
        rules: [
          'Patient names the symptom; the stored label is their own word and appears in the note verbatim.',
          'Each style differs in shape AND colour, so the drawing survives a black-and-white printout.',
          'A style already in use is locked, so two symptoms never share a glyph.',
          'Deleting a custom symptom deletes the marks drawn with it.',
        ],
      },
      modes: ['mark (tap to place)', 'radiate (drag a path from origin to destination)', 'erase'],
      zones: bm.ZONES,
      triggers: [
        { id: 'cauda_equina', severity: 'urgent', when: 'any mark in a perineum / saddle zone',
          action: 'Ask about bowel/bladder control and saddle numbness immediately; raise a red flag.' },
        { id: 'below_knee', severity: 'branch', when: 'any mark in a shin, calf, foot, toe, heel or ankle zone',
          action: 'Open radicular questions; set hpiData.overall.painBelowKnee (an explicit Aetna / eviCore fusion criterion).' },
        { id: 'pattern_l5', severity: 'pattern', when: 'same side: lateral shin or lateral calf, AND great toe / inner foot / dorsum',
          action: 'Surgeon-only hint. Never shown to the patient as a finding.' },
        { id: 'pattern_s1', severity: 'pattern', when: 'same side: calf AND little toe / outer foot / heel / lateral border of the foot',
          action: 'Surgeon-only hint.' },
        { id: 'pattern_l4', severity: 'pattern', when: 'same side: knee AND medial shin', action: 'Surgeon-only hint.' },
        { id: 'pattern_c6', severity: 'pattern', when: 'same side: lateral forearm AND thumb / index finger', action: 'Surgeon-only hint.' },
        { id: 'pattern_c8', severity: 'pattern', when: 'same side: medial forearm AND ring / little finger', action: 'Surgeon-only hint.' },
        { id: 'myelopathy', severity: 'branch', when: 'any cervical/neck zone AND any finger or thumb zone',
          action: 'Run the myelopathy screen: buttons, handwriting, dropping objects, balance, Lhermitte.' },
        { id: 'bilateral_legs', severity: 'branch', when: 'leg zones marked on BOTH sides',
          action: 'Ask the claudication set: walking distance, relief with sitting / leaning forward.' },
        { id: 'axial_only', severity: 'branch', when: 'no limb zone marked at all',
          action: 'Shorten the form: hide radiation and dermatome questions.' },
        { id: 'autofill_sensory', severity: 'autofill', when: 'numbness or tingling marker used',
          action: 'Pre-answer the numbness / tingling questions.' },
        { id: 'foot_drop', severity: 'branch', when: 'weakness marker in a foot, toe, shin or calf zone',
          action: 'Ask about tripping, catching the toe, stair difficulty.' },
      ],
      inNote:
        'Render the marked views (only views actually marked) with a legend of markers used, above the ' +
        'narrative, plus a prose description for EMR text fields.',
    };

    // Every trigger the app can fire must be described here.
    const trigSrc = fs.readFileSync(path.join(ROOT, 'lib/painMapTriggers.js'), 'utf8');
    const srcIds = [...trigSrc.matchAll(/id: '([a-z0-9_]+)'/g)].map((m) => m[1]);
    const missingTriggers = srcIds.filter((id) => !bodyMap.triggers.some((t) => t.id === id));
    if (missingTriggers.length) throw new Error(`Triggers in source but not in spec: ${missingTriggers.join(', ')}`);

    // ---- red flags -------------------------------------------------------
    const redFlags = rf.RED_FLAG_DEFINITIONS.map((f) => ({
      id: f.id,
      label: f.label,
      severity: f.severity,
      patientMessage: f.patientMessage,
      detectInText: f.detectInText,
      detectInFields: Object.keys(f.detectInFields || {}),
    }));

    // ---- prior authorisation --------------------------------------------
    const payers = rules.payers.map((p) => {
      const base = {
        id: p.id, name: p.name, scoring: p.scoring, umVendor: p.umVendor,
        criteriaAvailability: p.criteriaAvailability, note: p.note,
        retrievedAt: p.retrievedAt, reproductionRestricted: !!p.reproductionRestricted,
        policies: p.policies,
      };
      if (p.reproductionRestricted) {
        // Structure only. The requirement wording is withheld: this payer does
        // not permit reproduction or distribution without written consent.
        return {
          ...base,
          withheld:
            'Requirement text omitted — this payer does not permit its guidelines to be reproduced or ' +
            'distributed without written consent. Obtain it under licence and map it using the evidence ' +
            'ids listed per procedure.',
          procedures: (p.procedures || []).map((pr) => ({
            policyId: pr.policyId,
            procedure: pr.procedure,
            indication: pr.indication,
            cptCodes: pr.cptCodes,
            evidenceIds: [...new Set((pr.requirements || []).map((r) => r.evidenceId).filter(Boolean))],
          })),
        };
      }
      return { ...base, submissionChecklist: p.submissionChecklist, procedures: p.procedures };
    });

    const priorAuthorization = {
      disclaimer: rules.disclaimer,
      evidenceModel: {
        description:
          'Each payer requirement is keyed to an evidenceId; the intake produces evidence, and readiness ' +
          'is scored per payer and procedure. Some evidence can only come from the clinician (exam, imaging review).',
        evidenceLabels: auth.EVIDENCE_LABELS,
        clinicianSupplied: [...auth.CLINICIAN_SUPPLIED],
      },
      documentCategories: docs.DOCUMENT_CATEGORIES,
      uploadLimits: { maxFileBytes: docs.MAX_FILE_BYTES, maxTotalBytes: docs.MAX_TOTAL_BYTES, acceptedTypes: docs.ACCEPTED_TYPES },
      packetOutput: 'A zip with each required document in its subcategory folder, plus one combined PDF with a bookmark per chapter.',
      payers,
    };

    // ---- note generation ------------------------------------------------
    const noteGeneration = {
      language: 'Always English, whatever language the patient used; translate free text.',
      systemPrompt: prompts.NOTE_SUMMARY_SYSTEM_PROMPT,
      hpiChatSystemPrompt: prompts.HPI_CHAT_SYSTEM_PROMPT,
      preResolvedInputs: [
        'Body map -> anatomical prose (never raw coordinates).',
        'PROM answers -> the option labels the patient chose (never bare values).',
      ],
      patientReview: {
        description:
          'The patient reads the note split into paragraphs and can object to any one in their own words. ' +
          'Corrections attach to the paragraph they concern, are sent back as authoritative over the intake ' +
          'data, and the note is rewritten. Corrections are retained so the clinician can see what was challenged.',
        staleness:
          'Stamp each note with a fingerprint of the clinical answers it was written from (excluding ' +
          'navigation, timestamps, the note itself and corrections). If the answers change afterwards, tell ' +
          'the patient the note is out of date and offer a rewrite. Timestamps cannot do this: they change on ' +
          'every navigation and would report "changed" constantly.',
      },
      clinicianView: 'Generated note, structured data, raw responses, body diagram and PROM items (item wording, worst answers highlighted).',
    };

    // ---- UX rules --------------------------------------------------------
    const ux = {
      navigation:
        'Steps run in order. The timeline lets the patient jump to any step at or behind the furthest one ' +
        'reached (or already completed); steps never reached stay locked, because later questions branch ' +
        'off earlier answers.',
      freeTextGuidance: [
        'Keep prior-care answers free text; offer the placeholder example as a one-tap chip that fills the ' +
        'field and stays editable, plus curated common answers, deduplicated against the example.',
        'Write examples that MODEL the detail wanted ("Sarah Mills, PT — (303) 555-0142"), which asks for a ' +
        'phone number by showing one.',
        'Tell the patient more detail is better but partial answers are useful and anything can be left blank.',
        'When adopting an example, strip the "e.g.," scaffolding and read to the LAST closing bracket — ' +
        'examples contain phone numbers, and stopping at the first bracket truncates them.',
      ],
      i18n:
        'Display-only translation. Stored values stay canonical English so scoring, red flags and the ' +
        'English note keep working whatever language is on screen.',
      languages: ['en', 'es', 'zh'],
    };

    // No "$schema" key: this is a specification document, not a JSON Schema,
    // and declaring one would invite a validator to treat it as the latter.
    spec = {
      meta: {
        name: 'Comprehensive Spine & Scoliosis Center — Adult Spine Intake',
        specVersion: '1.0.0',
        generatedAt: new Date().toISOString(),
        generatedFrom: 'scripts/export-spec.mjs — derived from the prototype source, not hand-transcribed.',
        sourceRepository: 'https://github.com/rnjcbwy/AdultSpineintakechatbot',
        prototype: 'https://adult-spine-intake.vercel.app',
        audience: 'Implementation team rebuilding this intake on a production platform.',
        important: [
          'The prototype is NOT HIPAA compliant and has never held real patient data. A production build needs its own compliance, hosting, BAA and audit controls.',
          'Clinical questionnaire wording is included for build reference only and conveys no licence. See proms.licensing.',
          'Payer criteria change often. Every rule carries a policy id, source and date; re-verify before relying on it.',
          'Requirement text is withheld for any payer that restricts reproduction. See priorAuthorization.payers[].withheld.',
        ],
        pediatricRedirect: 'Patients under 18 are directed to https://peds-spine-intake.vercel.app/',
      },
      dataModel: {
        description: 'The complete shape of one intake record, with default values. Field paths in steps[].fields refer into this.',
        defaults: defaultIntakeData,
      },
      steps,
      reference: {
        symptomRegions: constants.SYMPTOM_REGIONS,
        painQualities: constants.PAIN_QUALITIES,
        commonConditions: constants.COMMON_CONDITIONS,
        implantedDevices: constants.IMPLANTED_DEVICES,
        commonMedications: constants.COMMON_MEDICATIONS,
        anticoagulants: constants.ANTICOAGULANTS,
        injectionTypes: constants.INJECTION_TYPES,
        visitReasons: constants.VISIT_REASONS,
        familyConditions: constants.FAMILY_CONDITIONS,
        familyRelations: constants.FAMILY_RELATIONS,
      },
      reviewOfSystems,
      proms,
      bodyMap,
      redFlags,
      priorAuthorization,
      noteGeneration,
      ux,
      knownGaps: [
        'No numeric pain score (see proms.recommendedAdditions.nrs_pain).',
        'No structured opioid / controlled-substance capture (MDM risk element; spine planning; payers).',
        'No height / weight / BMI (several payers gate fusion on BMI).',
        'Conservative-care dates are free text; payers want duration AND recency.',
        'No consolidated list of outside care sources (MDM data element counts each unique external source reviewed).',
        'The clinician dashboard reads the patient\'s own browser storage, so it only works on the device the intake was completed on. Production needs a server.',
      ],
      translations: {
        description: 'Every visible string, keyed by its English text, with es / zh. Collected from the app\'s own string tables.',
        strings: translations,
      },
    };
  } finally {
    fs.rmSync(TMP, { recursive: true, force: true });
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(spec, null, 2) + '\n');

  // ---- summary --------------------------------------------------------
  const fieldCount = spec.steps.reduce((n, s) => n + (s.fields || []).length, 0);
  const withheld = spec.priorAuthorization.payers.filter((p) => p.reproductionRestricted);
  console.log(`Wrote ${path.relative(ROOT, OUT)}  (${(fs.statSync(OUT).size / 1024).toFixed(0)} KB)`);
  console.log(`  steps:              ${spec.steps.length}`);
  console.log(`  extracted fields:   ${fieldCount} (all present in the data schema)`);
  console.log(`  ROS systems:        ${spec.reviewOfSystems.systems.length}`);
  console.log(`  PROM instruments:   ${spec.proms.instruments.length} (+${spec.proms.recommendedAdditions.length} recommended)`);
  console.log(`  body-map zones:     ${Object.values(spec.bodyMap.zones).reduce((n, z) => n + z.length, 0)} across ${spec.bodyMap.views.length} views`);
  console.log(`  body-map triggers:  ${spec.bodyMap.triggers.length} (all source triggers accounted for)`);
  console.log(`  red flags:          ${spec.redFlags.length}`);
  console.log(`  payers:             ${spec.priorAuthorization.payers.length} (${withheld.map((p) => p.id).join(', ') || 'none'} withheld)`);
  console.log(`  translated strings: ${Object.keys(spec.translations.strings).length}`);
}

main().catch((e) => {
  fs.rmSync(TMP, { recursive: true, force: true });
  console.error(e.message);
  process.exit(1);
});
