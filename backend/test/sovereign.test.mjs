// Sovereign season (Second Saturn Return focus), owner direction Oct 24 2026: one INTEGRATION section that weaves the
// natal chart, the Chiron Return chart and the Sovereign overlay, centered on the Sovereign chart's new cross.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { transformV3Response } from '../hd-v3-parser.js';
import { buildEnrichment } from '../cycle-enrichment.js';
import { currentCycleStatus } from '../reading-context.js';
import { arcText } from '../arc.js';
import { SOVEREIGN_SECTION, isSovereignFocus, lookBackKeysFor, plainCrossName, crossesCurious, sovereignIntegrationPrompt } from '../sovereign.js';

const rd = p => fs.readFileSync(new URL(p, import.meta.url), 'utf8');
const load = f => transformV3Response(JSON.parse(rd(f)).full_raw);
const natal = load('./fixture-jocelyn-raw.json'), chironChart = load('./fixture-jocelyn-chiron-raw.json');

// Focus at 58: Second Saturn Return, Chiron overlay -> Chiron is NOT a Look Back card; Maiden + Mother are.
const BIRTH = Date.UTC(1960, 0, 1), Y = 365.25 * 864e5, iso = a => new Date(BIRTH + a * Y).toISOString().slice(0, 19);
const cycles = { saturnReturn: { peak_datetime: iso(29.5) }, uranusOpposition: { peak_datetime: iso(41) }, chironReturn: { peak_datetime: iso(50.5) }, secondSaturnReturn: { peak_datetime: iso(58.8) } };
const st = currentCycleStatus(cycles, new Date(BIRTH + 58 * Y));
assert.equal(st.focus.key, 'secondSaturnReturn'); assert.ok(isSovereignFocus(st.focus.key));
assert.deepEqual(st.overlays.map(c => c.key), ['chironReturn']);
assert.deepEqual(lookBackKeysFor(st.focus.key, st.overlays.map(c => c.key), st.completed.map(c => c.key)), ['saturnReturn', 'uranusOpposition']);
// Any other focus keeps the earlier behavior (overlays + completed become cards).
assert.deepEqual(lookBackKeysFor('chironReturn', [], ['saturnReturn', 'uranusOpposition']), ['saturnReturn', 'uranusOpposition']);
assert.deepEqual(lookBackKeysFor('uranusOpposition', [], ['saturnReturn']), ['saturnReturn']);

// Enrichment exists once the window has opened (so the Sovereign focus has its chart data before the exact peak),
// and never for a cycle whose window has not opened (no forecasting).
const ov = { chironReturn: chironChart, secondSaturnReturn: chironChart };
assert.deepEqual(buildEnrichment(natal, ov, cycles, new Date(BIRTH + 56 * Y)).map(c => c.key), ['chironReturn', 'secondSaturnReturn']);
assert.deepEqual(buildEnrichment(natal, ov, cycles, new Date(BIRTH + 54 * Y)).map(c => c.key), ['chironReturn']);
const en = buildEnrichment(natal, ov, cycles, new Date(BIRTH + 59 * Y));
const s2 = en.find(c => c.key === 'secondSaturnReturn'), ch = en.find(c => c.key === 'chironReturn');
assert.equal(s2.cross.cycle, 'Right Angle Cross of Rulership (45/26 | 22/47)', 'cycle cross comes from the cycle chart (Sun/Earth at the return, design Sun/Earth ~88° earlier)');

// Plain cross names for prose
assert.equal(plainCrossName('Right Angle Cross of Rulership (45/26 | 22/47)'), 'the cross of Rulership');
assert.equal(plainCrossName('Juxtaposition Cross of Bargains (37/40 | 5/35)'), 'the cross of Bargains');
assert.equal(plainCrossName('Left Angle Cross of the Clarion (51/57 | 61/62)'), 'the cross of the Clarion');

// For the curious: three crosses with gates (the only place numbers appear)
const box = crossesCurious(en);
assert.equal(box.lines.length, 4);
assert.ok(box.lines[0].startsWith('Natal cross') && box.lines[1].startsWith('Chiron Return cross') && box.lines[2].startsWith('Second Saturn Return cross'));
assert.ok(box.lines[2].includes('gates 45, 26, 22, 47'));
assert.equal(crossesCurious(en.filter(c => c.key !== 'secondSaturnReturn')), null);

// Integration prompt
const p = sovereignIntegrationPrompt({ name: 'Ann', s2, chiron: ch, rules: 'RULES-HERE' });
for (const s of [`First line exactly: ${SOVEREIGN_SECTION}`, 'THE CROSS OF YOUR SOVEREIGN SEASON', 'THREE CHARTS, ONE LIFE', 'THE GIFTS OF THIS SEASON', 'YOUR NATAL WAND IN THIS SEASON', 'LIVING IT NOW', 'INTEGRATION PRACTICES',
  'Center the whole section on the NEW incarnation cross', 'what are they meant to do and embody in this season', '"the cross of Rulership"', 'never write "Right Angle", "Juxtaposition", "Left Angle" or any numbers',
  'Weave them into ONE picture', 'the natal design (home base', 'the Chiron Return chart (the Phoenix', 'do not predict events or outcomes', 'Never frame this season as decline', 'RULES-HERE', '"purposeReflection"'])
  assert.ok(p.includes(s), 'integration prompt has: ' + s);
assert.ok(!/elder|crone|wither(ed|ing)? away/i.test(p.replace('decline, withering', '')), 'no elder/crone framing');
const pm = arcText(p, 'masculine');
assert.ok(pm.includes('the Chiron Return chart (the Crucible') && pm.includes('Into the Sovereign') && !/Phoenix|Maiden/.test(pm), 'masculine arc works the same');
const pNoChiron = sovereignIntegrationPrompt({ name: 'Ann', s2, chiron: null });
assert.ok(pNoChiron.includes('chart data is unavailable'));

// Server wiring
const server = rd('../server.js');
assert.ok(server.includes("const sovereign = isSovereignFocus(focusKey);"));
assert.ok(server.includes("sovereignIntegrationPrompt({ name: nm, s2: c, chiron: enrichment.find(x => x.key === 'chironReturn') || null, rules: RULES })"));
assert.ok(server.includes('YOUR SOVEREIGN SEASON: INTEGRATION instead'));
// Frontend + PDF wiring
const app = rd('../../frontend/src/App.jsx'), pdf = rd('../../frontend/src/readingPdf.js'), wbk = rd('../../frontend/src/workbookPdf.js');
assert.ok(app.includes('<CuriousBox box={crossesCurious(en)} />') && app.includes("isSovereignFocus(charts?.status?.focus?.key) ? ['chironReturn'] : []"));
assert.ok(app.includes('const done = lookBackKeysFor(') && app.includes('curious: isSovereignFocus(k) ? crossesCurious(en) : null'));
assert.ok(pdf.includes('if (c.curious) curiousBox(c.curious);') && pdf.includes('...extraImages'));
assert.ok(wbk.includes('WHAT THIS SEASON IS FOR'));
console.log('sovereign season tests passed (integration centered on the Sovereign cross; Chiron woven in; Maiden/Mother look backs)');

// Sovereign focus owns every channel of its own overlay, even if an earlier cycle produced it first.
{
  const early = { ...chironChart, gates: [...new Set([...(chironChart.gates || []), 21, 45])] };
  const sOv = { ...chironChart, gates: [...new Set([...(chironChart.gates || []), 37, 40])] };
  const e2 = buildEnrichment({ ...natal, gates: (natal.gates || []).filter(g => ![37, 40].includes(g)) }, { chironReturn: { ...early, gates: [...early.gates, 37, 40] }, secondSaturnReturn: sOv }, cycles, new Date(BIRTH + 59 * Y));
  const ch37 = k => e2.find(c => c.key === k).magicWand.channels.some(x => x.channel === '37-40');
  assert.ok(ch37('secondSaturnReturn') && !ch37('chironReturn'), 'Sovereign focus owns its channels');
}
console.log('sovereign channel ownership ok');
{
  const sv = rd('../server.js');
  assert.ok(sv.includes("${sovereign ? 'the Chiron Return (it is woven INTO the Sovereign integration section"), 'shared rules do not tell the Sovereign section that Chiron is covered elsewhere');
  assert.ok(sv.includes("${sovereign ? 'Only this cycle, woven with the natal and Chiron Return charts as given' : 'Only this cycle'}"));
  assert.ok(sv.indexOf('const sovereign = isSovereignFocus(focusKey);') < sv.indexOf('const RULES = `'), 'sovereign defined before RULES');
}
console.log('sovereign shared-rules wiring ok');
