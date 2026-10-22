import assert from 'node:assert/strict';
import fs from 'node:fs';
import { transformV3Response } from '../hd-v3-parser.js';
import { natalMagicWand, formatNatalWandForPrompt, cycleWandLinks, wandLinkLines, authorityKey, AUTHORITY_WIELD } from '../natal-wand.js';
import { buildEnrichment, formatEnrichmentForPrompt } from '../cycle-enrichment.js';
const load = f => transformV3Response(JSON.parse(fs.readFileSync(new URL(f, import.meta.url))).full_raw);
const natal = load('./fixture-jocelyn-raw.json');
const chiron = load('./fixture-jocelyn-chiron-raw.json');

// Natal wand = conscious Sun + Earth, straight from the chart data.
const w = natalMagicWand(natal);
assert.equal(w.sun.gate, 18); assert.equal(w.sun.line, 4); assert.equal(w.sun.center, 'Spleen');
assert.equal(w.sun.geneKey.gift, 'Integrity');
assert.deepEqual(w.sun.channels.map(c => c.channel), ['18-58']);
assert.equal(w.earth.gate, 17); assert.equal(w.earth.line, 4); assert.equal(w.earth.center, 'Ajna');
assert.deepEqual(w.earth.channels, []); assert.deepEqual(w.earth.partners, [62]);   // hanging gate listening for 62
assert.equal(w.type, 'Generator'); assert.equal(w.authorityKey, 'sacral'); assert.match(w.wield, /gut sound/);
const p = formatNatalWandForPrompt(natal);
assert.match(p, /CONSCIOUS SUN .*Gate 18\.4/); assert.match(p, /CONSCIOUS EARTH .*Gate 17\.4/); assert.match(p, /about 70%/);
assert.match(p, /waiting for Gate 62/); assert.match(p, /Sacral Authority — how it wields the wand/);
assert.equal(natalMagicWand(null), null); assert.equal(formatNatalWandForPrompt({}), '');

// Any type / authority: never assumes Sacral.
const cases = { 'Emotional Authority': 'emotional', 'Solar Plexus': 'emotional', 'Splenic Authority': 'splenic', 'Ego Authority': 'ego', 'Heart (Ego Manifested)': 'ego',
  'Self-Projected Authority': 'self', 'Mental Projector Authority': 'mental', 'No Inner Authority': 'mental', 'Environmental': 'mental', 'Lunar Authority': 'lunar', 'Sacral Authority': 'sacral', '': 'none' };
for (const [a, k] of Object.entries(cases)) assert.equal(authorityKey(a), k, a);
const proj = { ...natal, type: 'Projector', strategy: 'Wait for the Invitation', authority: 'Emotional Authority', signature: 'Success', not_self: 'Bitterness' };
const pw = natalMagicWand(proj);
assert.equal(pw.wield, AUTHORITY_WIELD.emotional.how); assert.equal(pw.type, 'Projector');
assert.ok(!/gut sound|Sacral/.test(formatNatalWandForPrompt(proj)));

// Cycle -> natal wand: Chiron chart defines the open Ajna, home of natal Earth 17 (via 23-43).
const l = cycleWandLinks(natal, chiron);
assert.equal(l.cycleSun.gate, 45); assert.equal(l.cycleEarth.gate, 26);
assert.deepEqual(l.centerLinks, [{ role: 'Earth', gate: 17, center: 'Ajna' }]);
assert.ok(wandLinkLines(l).some(t => /Earth Gate 17 lives in the Ajna/.test(t)));
// Synthetic overlay carrying 62 completes 17-62 through the natal Earth.
const ov = { ...chiron, gates: [...chiron.gates, 62] };
assert.ok(cycleWandLinks(natal, ov).links.find(x => x.channel === '17-62' && x.role === 'Earth' && x.kind === 'completed by the cycle'));
const e = buildEnrichment(natal, { chironReturn: chiron }, { chironReturn: { peak_datetime: '2023-06-09T09:47:00' } }, new Date('2026-10-16'));
assert.equal(e[0].natalWand.natalSun.gate, 18);
assert.match(formatEnrichmentForPrompt(e, natal), /NATAL WAND IN THIS CYCLE \(natal conscious Sun 18\.4 \/ Earth 17\.4\)/);

// Prompts: natal YOUR MAGIC WAND follows HOME BASE (Part 1 stops after it); cycle wand gets the natal-wand subsection.
const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
assert.match(server, /YOUR HOME BASE {2}\(concise[^\n]*\nYOUR MAGIC WAND {2}\(the natal Magic Wand/);
assert.match(server, /You MUST stop completely after YOUR MAGIC WAND/);
assert.match(server, /formatNatalWandForPrompt\(hdChart\)/);
assert.match(server, /YOUR NATAL WAND IN THIS SEASON {2}\(/);
assert.match(server, /"natalWandPractices"/);
assert.match(server, /Length \$\{overlay \? '450-600' : '800-1050'\} words/);
console.log('natal magic wand tests passed (Sun 18.4 / Earth 17.4, Sacral; any authority; Chiron lights the Earth\'s Ajna)');
