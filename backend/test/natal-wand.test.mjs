import assert from 'node:assert/strict';
import fs from 'node:fs';
import { transformV3Response } from '../hd-v3-parser.js';
import { natalMagicWand, formatNatalWandForPrompt, wandWiringText, cycleWandLinks, formatCycleWandLinks, wandLinkLines, authorityKey, AUTHORITY_WIELD } from '../natal-wand.js';
import { buildEnrichment, formatEnrichmentForPrompt } from '../cycle-enrichment.js';
const load = f => transformV3Response(JSON.parse(fs.readFileSync(new URL(f, import.meta.url))).full_raw);
const natal = load('./fixture-jocelyn-raw.json');
const chiron = load('./fixture-jocelyn-chiron-raw.json');

// Natal wand = the conscious Sun alone (owner-confirmed), straight from the chart data. No Earth.
const w = natalMagicWand(natal);
assert.equal(w.sun.gate, 18); assert.equal(w.sun.line, 4); assert.equal(w.sun.center, 'Spleen');
assert.equal(w.sun.geneKey.gift, 'Integrity');
assert.deepEqual(w.sun.channels.map(c => c.channel), ['18-58']); assert.deepEqual(w.sun.partners, []);
assert.ok(!('earth' in w), 'Earth is not part of the wand');
assert.equal(w.type, 'Generator'); assert.equal(w.authorityKey, 'sacral'); assert.match(w.wield, /gut sound/);
const p = formatNatalWandForPrompt(natal);
assert.match(p, /CONSCIOUS SUN \(the Magic Wand.*Gate 18\.4/); assert.match(p, /about 70%/); assert.match(p, /18-58 Channel of Judgment/);
assert.ok(!/CONSCIOUS EARTH|Gate 17\.4/.test(p)); assert.match(p, /Earth is not part of the wand/);
// Hanging Sun gate: the partner it listens for.
const hang = { ...natal, personality: { ...natal.personality, Sun: { ...natal.personality.Sun, gate: 17, line: 2 } } };
assert.deepEqual(natalMagicWand(hang).sun.partners, [62]); assert.equal(natalMagicWand(hang).sun.wiring, 'hanging');
assert.match(formatNatalWandForPrompt(hang), /HANGING gate.*partner Gate 62.*electromagnetic connection.*transit or life cycle/);
assert.match(wandWiringText(natalMagicWand(hang).sun), /comes fully alive when you're around people who carry its other half \(Gate 62\), or when a life cycle lights it up\. That moment is magic\./);
assert.ok(!/hanging|electromagnetic/i.test(wandWiringText(natalMagicWand(hang).sun)), 'card wording stays plain');
// Completed Sun channel = superhighway, naming the channel and partner gate.
assert.equal(w.sun.wiring, 'superhighway'); assert.equal(w.sun.channels[0].partner, 58);
assert.match(p, /COMPLETED natal channel 18-58 Channel of Judgment \(partner Gate 58\): a SUPERHIGHWAY they have had all their life, consistent and always on/);
assert.match(wandWiringText(w.sun), /superhighway you've had all your life \(18-58 Channel of Judgment, with Gate 58\)\. Built in and always on.*always been yours/);
assert.equal(natalMagicWand(null), null); assert.equal(formatNatalWandForPrompt({}), '');

// Any type / authority: never assumes Sacral.
const cases = { 'Emotional Authority': 'emotional', 'Solar Plexus': 'emotional', 'Splenic Authority': 'splenic', 'Ego Authority': 'ego', 'Heart (Ego Manifested)': 'ego',
  'Self-Projected Authority': 'self', 'Mental Projector Authority': 'mental', 'No Inner Authority': 'mental', 'Environmental': 'mental', 'Lunar Authority': 'lunar', 'Sacral Authority': 'sacral', '': 'none' };
for (const [a, k] of Object.entries(cases)) assert.equal(authorityKey(a), k, a);
const proj = { ...natal, type: 'Projector', strategy: 'Wait for the Invitation', authority: 'Emotional Authority', signature: 'Success', not_self: 'Bitterness' };
const pw = natalMagicWand(proj);
assert.equal(pw.wield, AUTHORITY_WIELD.emotional.how); assert.equal(pw.type, 'Projector');
assert.ok(!/gut sound|Sacral/.test(formatNatalWandForPrompt(proj)));

// Cycle -> natal wand (Sun only). Jocelyn's Chiron chart: its own Sun 45.2; no channel through natal Sun 18; Spleen already defined.
const l = cycleWandLinks(natal, chiron);
assert.equal(l.cycleSun.gate, 45); assert.ok(!('cycleEarth' in l) && !('natalEarth' in l));
assert.deepEqual(l.links, []); assert.equal(l.centerLink, null); assert.equal(l.sameGate, false);
assert.match(formatCycleWandLinks(l), /No channel runs directly through the natal Sun Gate 18/);
// Synthetic overlay carrying 58 re-lights 18-58 through the natal Sun.
const ov = { ...chiron, gates: [...chiron.gates, 58] };
assert.ok(cycleWandLinks(natal, ov).links.find(x => x.channel === '18-58' && x.kind === 'natal channel re-lit by the cycle'));
assert.ok(wandLinkLines(cycleWandLinks(natal, ov)).some(t => /your natal Sun Gate 18 meets Gate 58/.test(t)));
// Hanging Sun 17 in an open Ajna: a cycle with 62 completes 17-62 and brings the wand's center online.
const hl = cycleWandLinks(hang, { ...chiron, gates: [...chiron.gates, 62] });
assert.ok(hl.links.find(x => x.channel === '17-62' && x.kind === 'completed by the cycle'));
assert.ok(hl.links.find(x => x.channel === '17-62').magic);
assert.match(formatCycleWandLinks(hl), /MAGIC: this cycle lights partner Gate 62 of the HANGING natal Sun Gate 17.*full current of the soul purpose comes online/);
assert.ok(wandLinkLines(hl).some(t => /^Magic: this season lights Gate 62.*full current of your soul purpose/.test(t)));
// Hanging Sun with no partner lit: still names the partner and how to get access.
assert.match(formatCycleWandLinks(cycleWandLinks(hang, chiron)), /hanging and this cycle does not light partner Gate 62/);
// Re-lit natal Sun channel: amplifying a known superhighway, never called magic.
const rl = cycleWandLinks(natal, ov); assert.ok(!rl.links[0].magic);
assert.match(formatCycleWandLinks(rl), /amplifies a superhighway they already know/);
assert.ok(wandLinkLines(rl).some(t => /amplifying a superhighway you already know/.test(t)));
assert.match(formatCycleWandLinks(l), /superhighway that stays on through this season/);
const e = buildEnrichment(natal, { chironReturn: chiron }, { chironReturn: { peak_datetime: '2023-06-09T09:47:00' } }, new Date('2026-10-16'));
assert.equal(e[0].natalWand.natalSun.gate, 18);
const et = formatEnrichmentForPrompt(e, natal);
assert.match(et, /NATAL WAND IN THIS CYCLE \(natal conscious Sun 18\.4, Gift Integrity\)/); assert.ok(!/NATAL WAND IN THIS CYCLE[^\n]*Earth/.test(et));

// Prompts: natal YOUR MAGIC WAND follows HOME BASE (Part 1 stops after it); cycle wand gets the natal-wand subsection.
const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
assert.match(server, /YOUR HOME BASE {2}\(concise[^\n]*\nYOUR MAGIC WAND {2}\(the natal Magic Wand/);
assert.match(server, /You MUST stop completely after YOUR MAGIC WAND/);
assert.match(server, /formatNatalWandForPrompt\(hdChart\)/);
assert.match(server, /YOUR NATAL WAND IN THIS SEASON {2}\(/);
assert.match(server, /"natalWandPractices"/);
assert.match(server, /The natal Magic Wand is the conscious \(Personality\) Sun gate\.line ALONE/);
assert.match(server, /superhighway they have had all their lives, consistent and always on/); assert.match(server, /electromagnetic connection/);
assert.match(server, /call it out prominently as magic, the moment the full current of their soul purpose comes online/); assert.match(server, /amplifying a superhighway they already know/);
assert.ok(!/Sun\/Earth wand|Sun and Earth, about 70%|grounded by its Earth|the Earth gate and line the same way/i.test(server));
assert.match(server, /Length \$\{overlay \? '450-600' : '800-1050'\} words/);
console.log('natal magic wand tests passed (conscious Sun 18.4 only, Sacral; any authority; hanging-gate + cycle links)');
