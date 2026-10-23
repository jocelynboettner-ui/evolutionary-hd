import assert from 'node:assert/strict';
import fs from 'node:fs';
import { CYCLE_PLANET_LINES, cyclePlanetLine, PLANETS_CURIOUS, PLANET_KEYNOTES } from '../planet-meanings.js';
import { jargonHits, nodesReading } from '../nodes-reading.js';
import { buildEnrichment } from '../cycle-enrichment.js';
import { transformV3Response as tx } from '../hd-v3-parser.js';
import { currentCycleStatus } from '../reading-context.js';
import { applyArc } from '../arc.js';

const keys = ['saturnReturn', 'uranusOpposition', 'chironReturn', 'secondSaturnReturn'];
for (const k of keys) {
  const { planet, line } = CYCLE_PLANET_LINES[k];
  assert.ok(line.startsWith(planet + ' '), `${k} line names its planet first`);
  assert.deepEqual(jargonHits(line), [], `${k} line is plain language`);
  assert.ok(/\byou(r)?\b/.test(line) && !/\b(she|her|he|his|they)\b/i.test(line), `${k} line is second person`);
  assert.ok(!/Maiden|Mother|Phoenix|Apprentice|Builder|Crucible|Sovereign/.test(line), `${k} line is arc-neutral`);
  assert.equal(applyArc(line, 'masculine'), line);
}
assert.equal(cyclePlanetLine('nope'), '');
assert.equal(PLANET_KEYNOTES.length, 14);
assert.ok(PLANETS_CURIOUS.lines.some(l => l.startsWith('Saturn: discipline')));

// Enrichment carries the line; the nodes turning point carries the Uranus line (still jargon-free).
const T = new URL('.', import.meta.url).pathname;
const C = JSON.parse(fs.readFileSync(T + 'fixture-nodes-computed.json'));
const natal = tx(JSON.parse(fs.readFileSync(T + 'fixture-jocelyn-raw.json')).full_raw);
const cycles = JSON.parse(fs.readFileSync(T + 'fixture-jocelyn-cycles.json'));
const overlays = { saturnReturn: tx(C.jocelynSaturn), uranusOpposition: tx(C.jocelynUranus), chironReturn: tx(JSON.parse(fs.readFileSync(T + 'fixture-jocelyn-chiron-raw.json')).full_raw) };
const now = new Date('2026-10-22T13:00:00Z');
const en = buildEnrichment(natal, overlays, cycles, now);
assert.ok(en.length >= 3);
en.forEach(e => assert.equal(e.planetLine, CYCLE_PLANET_LINES[e.key].line));
const r = nodesReading(natal, { cycles, overlays, status: currentCycleStatus(cycles, now), birthdate: '1973-09-30', name: 'Jocelyn', now });
const turn = r.sections.find(s => s.heading === 'THE TURNING POINT').paras.join(' ');
assert.ok(turn.includes(CYCLE_PLANET_LINES.uranusOpposition.line));
assert.deepEqual(jargonHits(r.sections.flatMap(s => s.paras).join('\n')), []);
// Josh (Uranus opposition already walked) too
const jn = tx(C.joshNatal), jr = nodesReading(jn, { cycles: C.joshCycles, overlays: { uranusOpposition: tx(C.joshUranus) }, status: currentCycleStatus(C.joshCycles, now), birthdate: '1976-05-05', name: 'Josh', now });
assert.ok(jr.sections[1].paras.join(' ').includes('Uranus brings change'));
console.log('planet meanings tests passed (one plain line per cycle planet; enrichment + turning point; curious chart)');
