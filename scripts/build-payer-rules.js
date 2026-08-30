/**
 * Normalizes the raw payer research in lib/payers/sources/*.json into a single
 * ruleset the app consumes: lib/payers/rules.json
 *
 * Why this exists:
 *  - The raw sources are the source-of-truth ARCHIVE (kept local, gitignored).
 *  - Some payers restrict reproduction of their guideline text. For those we
 *    emit structured requirements + citation ONLY, with verbatim quotes
 *    stripped, so the tool can say "X is required per <policy id>, see source"
 *    without republishing their document.
 *
 * Run: node scripts/build-payer-rules.js
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'lib', 'payers', 'sources');
const OUT_FILE = path.join(__dirname, '..', 'lib', 'payers', 'rules.json');

/**
 * Per-payer metadata. `reproductionRestricted` drives quote stripping.
 */
const PAYER_META = {
  'aetna.json': {
    id: 'aetna',
    scoring: 'full',
    name: 'Aetna',
    criteriaAvailability: 'public_complete',
    reproductionRestricted: false,
    note: 'Aetna publishes full medical-necessity criteria in its Clinical Policy Bulletins.',
  },
  'cigna-evicore.json': {
    id: 'cigna',
    scoring: 'full',
    name: 'Cigna',
    criteriaAvailability: 'public_complete',
    reproductionRestricted: false,
    note: 'Spine surgery review is delegated to eviCore, which publishes both the criteria and an explicit submission checklist.',
  },
  'carelon.json': {
    id: 'carelon',
    scoring: 'full',
    name: 'AmeriHealth NJ (Carelon-delegated)',
    criteriaAvailability: 'public_complete',
    reproductionRestricted: true,
    note:
      'Carelon states its guidelines are proprietary and may not be reproduced or distributed without written consent. ' +
      'Structured requirements and citations are encoded here; the guideline text itself is not reproduced. Verify against the source before relying on it.',
  },
  'uhc.json': {
    id: 'uhc',
    scoring: 'none',
    name: 'UnitedHealthcare / Oxford / UMR',
    criteriaAvailability: 'proprietary_vendor',
    reproductionRestricted: false,
    note:
      'UnitedHealthcare does not publish spine medical-necessity criteria; its policy defers to proprietary InterQual subsets ' +
      'that sit behind provider login and a commercial license. Readiness cannot be scored for UHC — plan-specific verification is required.',
  },
  'horizon-surgery.json': {
    id: 'horizon',
    scoring: 'indicative',
    name: 'Horizon BCBSNJ — spine surgery',
    criteriaAvailability: 'proprietary_vendor',
    reproductionRestricted: false,
    note:
      'Spine surgery prior authorization is administered by TurningPoint Healthcare Solutions (effective 2022-02-01, when ' +
      'Horizon sunset eviCore for spine surgery). TurningPoint maintains the review criteria and they are NOT published — ' +
      'they sit behind a provider-portal login. The requirements shown here come from Horizon\'s OWN published medical ' +
      'policies, several of which still name eviCore and may therefore govern only plans carved out of the vendor program ' +
      '(e.g. SHBP/SEHBP). TREAT THESE AS INDICATIVE, NOT AS THE CRITERIA TURNINGPOINT WILL APPLY.',
  },
  'horizon-evicore.json': {
    id: 'horizon-pain',
    scoring: 'indicative',
    name: 'Horizon BCBSNJ — interventional pain management',
    criteriaAvailability: 'public_partial',
    reproductionRestricted: false,
    note:
      'eviCore administers Horizon INTERVENTIONAL PAIN MANAGEMENT only — spinal injections and RFA, not surgery. ' +
      'The numeric thresholds captured here come from a 2022 provider orientation deck; the 2026 edition removed the ' +
      'criteria slides, so verify before relying on them.',
  },
};

function normalize() {
  const payers = [];

  for (const [file, meta] of Object.entries(PAYER_META)) {
    const full = path.join(SRC_DIR, file);
    if (!fs.existsSync(full)) {
      console.warn(`  ! missing source: ${file} — skipped`);
      continue;
    }
    const raw = JSON.parse(fs.readFileSync(full, 'utf8'));
    const strip = meta.reproductionRestricted;

    const policies = [];
    const procedures = [];

    for (const p of raw.policies || []) {
      policies.push({
        policyId: p.policyId || null,
        title: p.title || null,
        sourceUrl: p.sourceUrl || null,
        effectiveDate: p.effectiveDate || null,
        effectiveThrough: p.effectiveThrough || null,
        lastReviewed: p.lastReviewed || p.lastReviewDate || null,
        versionStatus: p.versionStatus || 'current',
        verified: p.verified !== false,
      });

      for (const proc of p.procedures || []) {
        procedures.push({
          policyId: p.policyId || null,
          procedure: proc.procedure || null,
          indication: proc.indication || null,
          criteriaLogic: proc.criteriaLogic || null,
          requirements: (proc.requirements || []).map((r) => {
            const out = {
              evidenceId: r.evidenceId || null,
              requirement: r.requirement || null,
              durationRequired: r.durationRequired ?? null,
              verified: r.verified !== false,
            };
            // Reproduce source text only where the payer permits it.
            if (!strip && r.verbatimQuote) out.verbatimQuote = r.verbatimQuote;
            if (r.notes && !strip) out.notes = r.notes;
            return out;
          }),
          exclusions: strip ? [] : proc.exclusions || [],
          cptCodes: proc.cptCodes || [],
        });
      }
    }

    payers.push({
      ...meta,
      umVendor: raw.umVendor || null,
      retrievedAt: raw.retrievedAt || null,
      accessNotes: raw.accessNotes || null,
      submissionChecklist: (raw.submissionChecklist || []).map((c) => {
        const out = {
          item: c.item,
          evidenceId: c.evidenceId || null,
          sourceUrl: c.sourceUrl || null,
          verified: c.verified !== false,
        };
        if (!strip && c.verbatimQuote) out.verbatimQuote = c.verbatimQuote;
        return out;
      }),
      policies,
      procedures,
      unverified: raw.unverified || [],
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    disclaimer:
      'Payer criteria change frequently. Every rule carries its policy ID, source URL and effective date — verify against the ' +
      'current published policy before relying on any readiness result. This tool does not determine coverage.',
    payers,
  };
}

const out = normalize();
fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 2), 'utf8');

const totals = out.payers.map(
  (p) =>
    `  ${p.name}: ${p.policies.length} policies, ${p.procedures.length} procedure blocks, ` +
    `${p.procedures.reduce((s, x) => s + x.requirements.length, 0)} requirements` +
    (p.reproductionRestricted ? ' (quotes stripped)' : '')
);
console.log(`Wrote ${path.relative(process.cwd(), OUT_FILE)}`);
console.log(totals.join('\n'));
