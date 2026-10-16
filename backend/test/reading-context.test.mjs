import assert from 'node:assert/strict';
import { CHANNEL_NAMES, channelLabel, computeAge, lifePhase, buildFactsBlock, attributeChannels, formatAttribution } from '../reading-context.js';
import { formatEvolutionaryArcForPrompt } from '../hd-evolutionary-arc.js';

// 36 canonical channels, all named
const PAIRS = [[1,8],[2,14],[3,60],[4,63],[5,15],[6,59],[7,31],[9,52],[10,20],[10,34],[10,57],[11,56],[12,22],[13,33],[16,48],[17,62],[18,58],[19,49],[20,34],[20,57],[21,45],[23,43],[24,61],[25,51],[26,44],[27,50],[28,38],[29,46],[30,41],[32,54],[34,57],[35,36],[37,40],[39,55],[42,53],[47,64]];
assert.equal(Object.keys(CHANNEL_NAMES).length, 36);
PAIRS.forEach(([a,b]) => assert.ok(CHANNEL_NAMES[a+'-'+b], 'missing '+a+'-'+b));
assert.equal(channelLabel('57 - 10'), '10-57 Channel of Perfected Form');
assert.equal(channelLabel('24-61'), '24-61 Channel of Awareness');

// age / phase
const now = new Date('2026-10-16T00:00:00Z');
assert.equal(computeAge('1973-09-30', now), 53);
assert.equal(computeAge('1996-10-17', now), 29);
assert.equal(computeAge('10/16/1996', now), 30);
assert.equal(lifePhase(29).key, 'phase1');
assert.equal(lifePhase(30).key, 'roof');
assert.equal(lifePhase(49).key, 'roof');
assert.equal(lifePhase(50).key, 'offroof');

const natal = { type:'Generator', authority:'Sacral Authority', profile:'4/6', incarnation_cross:'Right Angle Cross of Service (18/17 | 52/58)', defined_centers:['G','Sacral','Spleen','Root'], channels:['10 - 34','10 - 57','18 - 58','34 - 57'], gates:[10,34,57,18,58,21,42] };
const facts = buildFactsBlock(natal, { birthdate:'1973-09-30' }, now);
assert.match(facts, /CURRENT AGE: 53/);
assert.match(facts, /off the roof/);
assert.match(facts, /10-57 Channel of Perfected Form/);
assert.match(facts, /Sacral Authority\. It is FIXED/);
assert.match(facts, /NEVER say the person's authority changes/);

// attribution: 21-45 appears at Saturn1 AND Chiron -> only Saturn1
const at = attributeChannels([
  { key:'chironReturn', peakDate:'2023-05-01', channels:['21 - 45','42 - 53'] },
  { key:'saturnReturn1', peakDate:'2003-01-01', channels:['45-21'] },
]);
assert.deepEqual(at[0].assigned.map(a=>a.key), ['42-53']);
assert.deepEqual(at[0].alreadyOnline, [{ key:'21-45', from:'saturnReturn1' }]);
assert.deepEqual(at[1].assigned.map(a=>a.key), ['21-45']);

// full arc prompt with mocked overlays
const ov = (gates, centers) => ({ type:'Generator', profile:'4/6', incarnation_cross:'X', defined_centers:centers, channels:[], gates, retrogrades:[] });
const delta = (fn, em) => ({ fullyNewChannels:fn, electromagneticChannels:em, releasingChannels:[], newlyDefined:['Solar Plexus'], newlyOpen:[], typeShifted:false, profileShifted:false, crossShifted:false, natalRetroCount:0, overlayRetroCount:0 });
const arc = {
  saturnReturn1:    { peakDate:'2003-02-01', chart: ov([45],['Throat']), delta: delta([], [{ch:'21 - 45', natalGate:21, overlayGate:45}]) },
  uranusOpposition: { peakDate:'2014-06-01', chart: ov([53],[]), delta: delta([], [{ch:'42 - 53', natalGate:42, overlayGate:53}]) },
  chironReturn:     { peakDate:'2023-05-01', chart: ov([45,53],[]), delta: delta([], [{ch:'21 - 45', natalGate:21, overlayGate:45},{ch:'42 - 53', natalGate:42, overlayGate:53}]) },
  saturnReturn2:    { peakDate:'2032-08-01', chart: null, delta: null },
};
const txt = formatEvolutionaryArcForPrompt(arc, natal);
const block = txt.split('=== CHANNEL COMPLETION BY CYCLE')[1];
assert.equal((block.match(/- 21-45 Channel of Money/g)||[]).length, 1);
assert.equal((block.match(/- 42-53 Channel of Maturation/g)||[]).length, 1);
const chironSection = txt.split('CHIRON RETURN (~Age 50)')[1].split('---')[0];
assert.doesNotMatch(chironSection, /21-45|42-53/);
assert.match(txt, /natal authority stays Sacral Authority/);
console.log('all reading-context tests passed');

// ── cycle model ──
import fs from 'node:fs';
import { currentCycleStatus, formatCycleStatus, bodygraphData } from '../reading-context.js';
import { transformV3Response } from '../hd-v3-parser.js';
const cyc = JSON.parse(fs.readFileSync(new URL('./fixture-jocelyn-cycles.json', import.meta.url)));
cyc.secondSaturnReturn = { peak: '2032-12-01', peak_datetime: '2032-12-01T00:00:00' };
let st = currentCycleStatus(cyc, new Date('2026-10-16'));
assert.deepEqual(st.active.map(c => c.key), ['chironReturn']);         // past Chiron -> permanent
assert.equal(st.active[0].permanent, true);
assert.equal(st.active[0].end, 'for the rest of life');
assert.equal(st.next.key, 'secondSaturnReturn');
st = currentCycleStatus(cyc, new Date('2030-01-01'));                  // Chiron + 2nd Saturn window
assert.deepEqual(st.active.map(c => c.key), ['chironReturn', 'secondSaturnReturn']);
st = currentCycleStatus(cyc, new Date('2010-01-01'));                  // between Saturn1 (ends 2007) and Uranus (opens 2012)
assert.equal(st.between, true); assert.equal(st.next.key, 'uranusOpposition');
st = currentCycleStatus(cyc, new Date('2005-01-01'));
assert.deepEqual(st.active.map(c => c.key), ['saturnReturn']);
assert.match(formatCycleStatus(currentCycleStatus(cyc, new Date('2026-10-16'))), /PRIMARY: Chiron Return.*permanent overlay/);

// bodygraph data from real v3 fixture
const natalChart = transformV3Response(JSON.parse(fs.readFileSync(new URL('./fixture-jocelyn-raw.json', import.meta.url))).full_raw);
const bg = bodygraphData(natalChart);
assert.equal(bg.type, 'Generator');
assert.deepEqual(bg.channels.sort(), ['10-34', '10-57', '18-58', '34-57']);
assert.ok(bg.personalityGates.length > 5 && bg.designGates.length > 5);
console.log('cycle model + bodygraph data tests passed');
st = currentCycleStatus(cyc, new Date('2010-01-01'));
assert.equal(st.recent.key, 'saturnReturn');
assert.match(formatCycleStatus(st), /BETWEEN CYCLES[\s\S]*FOCUS ON MOST RECENTLY COMPLETED CYCLE: First Saturn Return[\s\S]*NEXT CYCLE: Uranus Opposition/);
console.log('between-cycles tests passed');
