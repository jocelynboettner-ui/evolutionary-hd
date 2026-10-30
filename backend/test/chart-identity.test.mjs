// A new chart must not keep the previous person's type, profile, authority, cross, or channels
// while adopting the new birth date (age) and birthplace. That partial mix is the Oct 2026 bug.
import assert from 'node:assert/strict';
import { buildFactsBlock, computeAge } from '../reading-context.js';
import { sessionBirthdata } from '../delivery.js';
import {
  chartIdForBirth, sameBirth, isolateChartMessages, isFreshChartTurn, shouldUseFollowUpMode,
  nextChartMessages, readingIdentity, assertReadingIdentity, assertFactsMatchIdentity,
  publishChartPayload, chartsMatchBirth, resolveChartBirth, deliveryBirthOk,
} from '../chart-identity.js';

const now = new Date('2026-10-30T15:00:00Z');
assert.equal(computeAge('1992-03-02', now), 34);

// Synthetic charts. Names and crosses are fixtures, not a claim about a real chart.
const lauraChart = {
  type: 'Generator', profile: '4/6', authority: 'Sacral Authority',
  incarnation_cross: 'Right Angle Cross of the Sphinx (1/2 | 7/13)',
  channels: ['1-8', '10-57'], defined_centers: ['Throat', 'G', 'Spleen', 'Sacral'],
};
const dingdongChart = {
  type: 'Projector', profile: '2/4', authority: 'Splenic Authority',
  incarnation_cross: 'Left Angle Cross of the Hermit (2/1 | 13/7)',
  channels: ['20-57'], defined_centers: ['Throat', 'Spleen'],
};
const lauraBirth = { name: 'Laura', birthdate: '1978-06-12', birthtime: '09:40', location: 'Austin, Texas', arc: 'feminine' };
const dingdongBirth = { name: 'Dingdong', birthdate: '1992-03-02', birthtime: '14:05', location: 'Havana, Cuba', arc: 'feminine' };
const dingdongText = 'Dingdong March 2, 1992, 2:05 PM, Havana, Cuba';
const lauraText = 'Laura June 12, 1978, 9:40 AM, Austin, Texas';

const natalOf = (chart) => ({
  type: chart.type, authority: chart.authority, profile: chart.profile, incarnation_cross: chart.incarnation_cross,
  defined_centers: chart.defined_centers, channels: chart.channels,
});

// ── Conversation isolation: a second birth entry is not a follow-up to the first reading ──
const prior = [
  { role: 'user', content: lauraText },
  { role: 'assistant', content: 'Laura, you are a Generator with a 4/6 profile and the Right Angle Cross of the Sphinx. '.padEnd(600, 'x') },
  { role: 'user', content: dingdongText },
];
assert.equal(isFreshChartTurn(prior), true);
assert.equal(shouldUseFollowUpMode(prior), false, 'a new birth must not enter follow-up mode (that mode keeps the previous type/profile/cross)');
const isolated = isolateChartMessages(prior);
assert.equal(isolated.length, 1);
assert.match(isolated[0].content, /Dingdong/);
assert.equal(isolated.some(m => /Generator/.test(m.content)), false);

// The automatic "continue" request still carries the previous reading unless we slice it off.
const continued = [
  ...prior.slice(0, 2),
  { role: 'user', content: dingdongText },
  { role: 'assistant', content: 'Dingdong natal reading'.padEnd(600, 'y') },
  { role: 'user', content: 'continue', hidden: true },
];
const cont = isolateChartMessages(continued);
assert.equal(cont[0].content, dingdongText);
assert.equal(cont.some(m => /Laura/.test(String(m.content))), false);
assert.equal(cont[cont.length - 1].content, 'continue');

// A real follow-up stays attached to the chart it asked about.
const follow = [
  { role: 'user', content: dingdongText },
  { role: 'assistant', content: 'y'.repeat(600) },
  { role: 'user', content: 'How does my design show up in my closest relationships?' },
];
assert.equal(isFreshChartTurn(follow), false);
assert.equal(shouldUseFollowUpMode(follow), true);
assert.equal(isolateChartMessages(follow).length, 3);

const userMsg = { role: 'user', content: dingdongText };
assert.deepEqual(nextChartMessages(prior, userMsg, { fresh: true }), [userMsg]);
assert.equal(nextChartMessages(follow, { role: 'user', content: 'And what about work?' }, { fresh: false }).length, 4);

// ── Identity guard: age and place may update; type/profile/cross/channels may not be borrowed ──
const dingdongIdentity = readingIdentity(dingdongChart, dingdongBirth);
const lauraIdentity = readingIdentity(lauraChart, lauraBirth);
assert.notEqual(dingdongIdentity.chartId, lauraIdentity.chartId);
assert.equal(sameBirth(dingdongIdentity.birth, dingdongBirth), true);

const mixedIdentity = {
  ...dingdongIdentity,
  type: lauraChart.type,
  profile: lauraChart.profile,
  authority: lauraChart.authority,
  incarnation_cross: lauraChart.incarnation_cross,
  channels: lauraChart.channels,
  defined_centers: lauraChart.defined_centers,
};
assert.throws(
  () => assertReadingIdentity(mixedIdentity, dingdongChart, dingdongBirth),
  (e) => e.code === 'chart_identity_mismatch'
    && ['type', 'profile', 'authority', 'incarnation_cross', 'channels', 'defined_centers'].every(f => e.fields.includes(f))
    && !e.fields.includes('age'),
);
assert.doesNotThrow(() => assertReadingIdentity(dingdongIdentity, dingdongChart, dingdongBirth));

const facts = buildFactsBlock(dingdongChart, dingdongBirth, now, dingdongIdentity.chartId);
assert.match(facts, /CURRENT AGE: 34/);
assert.match(facts, /Havana, Cuba/);
assert.match(facts, new RegExp('CHART ID: ' + dingdongIdentity.chartId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
assert.doesNotThrow(() => assertFactsMatchIdentity(facts, dingdongIdentity, now));

// The reported failure: age ~34 and Cuba/Brazil stick, while type, profile, and cross stay the previous person's.
const mixedFacts = facts
  .replace(/^TYPE: .+$/m, 'TYPE: ' + lauraChart.type)
  .replace(/^PROFILE: .+$/m, 'PROFILE: ' + lauraChart.profile)
  .replace(/^AUTHORITY: .+$/m, 'AUTHORITY: ' + lauraChart.authority)
  .replace(/^INCARNATION CROSS: .+$/m, 'INCARNATION CROSS: ' + lauraChart.incarnation_cross);
assert.match(mixedFacts, /CURRENT AGE: 34/);
assert.match(mixedFacts, /Havana, Cuba/);
assert.throws(
  () => assertFactsMatchIdentity(mixedFacts, dingdongIdentity, now),
  (e) => e.code === 'chart_identity_mismatch'
    && ['type', 'profile', 'authority', 'incarnation_cross'].every(f => e.fields.includes(f))
    && !e.fields.includes('age')
    && !e.fields.includes('location'),
);

// Publishing stamps the payload from the chart just calculated. A previous natal object is refused.
const published = publishChartPayload({ natal: natalOf(dingdongChart), cycles: [], enrichment: [] }, dingdongChart, dingdongBirth);
assert.equal(published.chartId, dingdongIdentity.chartId);
assert.equal(chartsMatchBirth(published, dingdongBirth), true);
assert.equal(chartsMatchBirth(published, lauraBirth), false, 'stale charts must not render against the next birth payload');
assert.throws(
  () => publishChartPayload({ natal: natalOf(lauraChart) }, dingdongChart, dingdongBirth),
  (e) => e.code === 'chart_identity_mismatch' && e.fields.includes('type') && e.fields.includes('incarnation_cross'),
);
const halfUpdated = {
  ...published,
  natal: { ...published.natal, type: lauraChart.type, profile: lauraChart.profile, incarnation_cross: lauraChart.incarnation_cross },
};
assert.equal(chartsMatchBirth(halfUpdated, dingdongBirth), false);

// ── Gift-code / checkout session: redeeming a code cannot attach the previous customer's chart ──
const lauraSession = sessionBirthdata({ metadata: lauraBirth });
const dingdongSession = sessionBirthdata({ metadata: dingdongBirth });
const mismatch = resolveChartBirth({ requestBirth: dingdongBirth, sessionBirth: lauraSession, ownerPreview: false });
assert.equal(mismatch.error, 'birth_mismatch');
assert.equal(mismatch.birthdata, null, 'must not return a hybrid of the new place and the previous session');

const owner = resolveChartBirth({ requestBirth: dingdongBirth, sessionBirth: lauraSession, ownerPreview: true });
assert.equal(owner.error, null);
assert.equal(owner.source, 'request');
assert.equal(chartIdForBirth(owner.birthdata), dingdongIdentity.chartId);

const redeemed = resolveChartBirth({ requestBirth: dingdongBirth, sessionBirth: dingdongSession, ownerPreview: false });
assert.equal(redeemed.error, null);
assert.notEqual(chartIdForBirth(redeemed.birthdata), chartIdForBirth(lauraSession));
assert.equal(deliveryBirthOk(dingdongSession, dingdongBirth), true);
assert.equal(deliveryBirthOk(lauraSession, dingdongBirth), false, 'a PDF for the new person must not be stored on the previous checkout');
assert.equal(deliveryBirthOk(lauraSession, null), true);

// Time and place normalization still counts as the same checkout birth.
assert.equal(sameBirth({ ...dingdongBirth, birthtime: '14:05', location: 'Havana,  Cuba' }, { ...dingdongBirth, birthtime: '14:05' }), true);

console.log('chart-identity tests passed');
