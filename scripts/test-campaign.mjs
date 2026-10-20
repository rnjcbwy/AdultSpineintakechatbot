/**
 * Checks on the campaign tags an ad link carries into the form.
 *
 *   node scripts/test-campaign.mjs
 *
 * The tags must survive as short slugs, nothing else may ride along with them
 * (free text could carry health information into logs), and the click
 * identifiers ad platforms append must never be kept.
 */
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const tmp = path.resolve('lib/__campaign.test.mjs');
fs.writeFileSync(tmp, fs.readFileSync(path.resolve('lib/campaign.js'), 'utf8'));
let c;
try {
  c = await import(pathToFileURL(tmp).href);
} finally {
  fs.unlinkSync(tmp);
}

let failed = 0;
function check(name, cond, detail) {
  if (cond) console.log(`  ok   ${name}`);
  else { failed++; console.log(`  FAIL ${name}${detail ? `\n       ${detail}` : ''}`); }
}
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const NOW = new Date('2026-10-18T12:00:00Z');

console.log('readCampaign');
{
  const got = c.readCampaign('?utm_source=meta&utm_medium=paid-social&utm_campaign=spine-2026q4&utm_content=story-b&fbclid=IwAR123', NOW);
  check('reads the five tags it knows', eq(got, { source: 'meta', medium: 'paid-social', campaign: 'spine-2026q4', content: 'story-b', firstSeenAt: NOW.toISOString() }), JSON.stringify(got));
  check('keeps no click identifier', !JSON.stringify(got).includes('IwAR'));
  check('no tags means null', c.readCampaign('?invite=abc&lang=es', NOW) === null);
  check('medium alone is not a campaign', c.readCampaign('?utm_medium=cpc', NOW) === null);
  const spaced = c.readCampaign('?utm_source=google&utm_campaign=Spine%20Q4%20%E2%80%94%20Bergen&utm_term=back+pain+doctor', NOW);
  check('spaces and plus signs become dashes, other characters drop', spaced.campaign === 'Spine-Q4-Bergen' && spaced.term === 'back-pain-doctor', JSON.stringify(spaced));
  const long = c.readCampaign(`?utm_source=${'x'.repeat(500)}`, NOW);
  check('values are capped at 60 characters', long.source.length === 60);
  const hostile = c.readCampaign('?utm_source=<script>alert(1)</script>&utm_campaign=a"b\'c', NOW);
  check('markup and quotes are stripped', hostile.source === 'scriptalert1script' && hostile.campaign === 'abc', JSON.stringify(hostile));
}

console.log('cleanCampaign');
{
  const got = c.cleanCampaign({ source: 'meta', campaign: 'spine', firstSeenAt: '2026-10-18T12:00:00.000Z', name: 'Jane Doe', symptoms: 'sciatica', __proto__: { x: 1 } });
  check('drops keys it does not know', eq(got, { source: 'meta', campaign: 'spine', firstSeenAt: '2026-10-18T12:00:00.000Z' }), JSON.stringify(got));
  check('re-cleans values sent from the browser', c.cleanCampaign({ source: 'my back hurts!!' }).source === 'my-back-hurts');
  check('drops a bad date', !('firstSeenAt' in c.cleanCampaign({ source: 'meta', firstSeenAt: 'yesterday' })));
  check('null, arrays and strings give null', c.cleanCampaign(null) === null && c.cleanCampaign(['meta']) === null && c.cleanCampaign('meta') === null);
  check('empty after cleaning gives null', c.cleanCampaign({ source: '!!!', campaign: '' }) === null);
}

console.log('stripCampaignParams');
{
  check('removes tags and click ids, keeps the rest', c.stripCampaignParams('?utm_source=meta&invite=tok&gclid=Cj0&lang=es') === '?invite=tok&lang=es');
  check('nothing left gives an empty string', c.stripCampaignParams('?utm_source=meta&fbclid=1') === '');
  check('nothing to strip gives null (address left alone)', c.stripCampaignParams('?resume=abc.def') === null);
}

if (failed) { console.log(`\n${failed} check(s) failed`); process.exit(1); }
console.log('\nAll campaign checks passed');
