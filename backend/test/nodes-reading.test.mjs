// YOUR NODES (plain language), journal prompts and ONE MOVE FOR THE NEXT 24 HOURS (owner direction, Oct 2026).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { transformV3Response as tx } from '../hd-v3-parser.js';
import { currentCycleStatus } from '../reading-context.js';
import { applyArc } from '../arc.js';
import { nodesReading, natalNodes, nodesBodyText, closingBodyText, jargonHits, oneMoveText, ONE_MOVE, formatNodesForPrompt, GATE_PLAIN, shortEssence, NODES_TITLE, ONE_MOVE_TITLE } from '../nodes-reading.js';
const rd = f => JSON.parse(fs.readFileSync(new URL(f, import.meta.url)));
const src = f => fs.readFileSync(new URL(f, import.meta.url), 'utf8');
const C = rd('./fixture-nodes-computed.json');   // Swiss Ephemeris (true node), humandesign.ai v3 shape
const now = new Date('2026-10-22T13:00:00Z');

// Library: all 64 gates, every field present, essence reads after "you're heading toward".
assert.equal(Object.keys(GATE_PLAIN).length, 64);
for (const [g, x] of Object.entries(GATE_PLAIN)) {
  for (const f of ['e', 'on', 'off', 'habit', 'brings']) assert.ok(x[f] && x[f].length > 3, `gate ${g} ${f}`);
  assert.ok(x.e.startsWith('your '), `gate ${g} essence starts with "your"`);
  assert.deepEqual(jargonHits(Object.values(x).join(' ')), [], `gate ${g} library text is plain`);
}
assert.equal(shortEssence(GATE_PLAIN[44].e), 'your gift for sensing people');

// ── Josh: May 5 1976 10:01 AM, Reading PA. Natally a 3/5 Projector with Splenic authority. ──
const josh = tx(C.joshNatal), joshChiron = tx(C.joshChiron), joshUranus = tx(C.joshUranus);
assert.equal(josh.type, 'Projector'); assert.equal(josh.authority, 'Splenic Authority'); assert.equal(josh.profile, '3/5');
// Manifesting Generator 2/5 with Emotional authority belongs ONLY to his Chiron Return cycle chart, never natal.
assert.equal(joshChiron.type, 'Manifesting Generator'); assert.equal(joshChiron.authority, 'Emotional Authority'); assert.equal(joshChiron.profile, '2/5');
const jst = currentCycleStatus(C.joshCycles, now);
const jr = nodesReading(josh, { cycles: C.joshCycles, overlays: { uranusOpposition: joshUranus, chironReturn: joshChiron, saturnReturn: tx(C.joshSaturn) }, status: jst, birthdate: '1976-05-05', name: 'Josh', now });
const jn = jr.nodes;
assert.deepEqual([jn.cN.gate, jn.cN.line, jn.cS.gate, jn.cS.line, jn.dN.gate, jn.dN.line, jn.dS.gate, jn.dS.line], [44, 6, 24, 6, 1, 4, 2, 4]);
assert.equal(jn.cS.wiring, 'superhighway'); assert.deepEqual(jn.cS.channels.map(c => c.channel), ['24-61']);
assert.equal(jn.cN.wiring, 'hanging'); assert.deepEqual(jn.cN.partners, [26]);
assert.deepEqual(jn.dN.partners, [8]); assert.deepEqual(jn.dS.partners, [14]);
// Turning point = Uranus opposition 2015-12 .. 2022-11 (peak 2019-06-01), already lived.
assert.equal(jr.turningPoint.state, 'past');
assert.deepEqual([jr.turningPoint.cycleNodes.cN.gate, jr.turningPoint.cycleNodes.dN.gate, jr.turningPoint.cycleNodes.cS.gate, jr.turningPoint.cycleNodes.dS.gate], [53, 62, 54, 61]);
assert.ok(jr.turningPoint.completions.find(x => x.channel === '26-44' && x.carrier.planet === 'Jupiter' && x.role === 'cN'));
// Current season: his Chiron Return lights Gate 8 (Uranus), completing 1-8 with the unconscious North Node.
assert.ok(jr.nowCompletions.find(x => x.channel === '1-8' && x.carrier.planet === 'Uranus' && x.role === 'dN' && x.cycle === 'chironReturn'));
const jb = nodesBodyText(jr);
assert.match(jb, /^YOUR NODES: WHERE YOU'VE BEEN AND WHERE YOU'RE HEADED/);
assert.match(jb, /WHERE YOU'VE BEEN\n\nJosh, for most of your life you've worked from your quiet thinking mind/);
assert.match(jb, /THE TURNING POINT\n\nSomewhere between about 39 and 46, roughly 2015 to 2022, life ran a quiet audit/);
assert.match(jb, /old pull toward climbing to prove you could get to the next level.*new pull: your urge to begin something/);
assert.match(jb, /your gift for sensing people came fully alive whenever someone who brings heart, persuasion and the willingness to make the pitch/);
assert.match(jb, /WHERE YOU'RE HEADED\n\nYou're heading toward your gift for sensing people/);
assert.match(jb, /Right now, in the season you're in, that gets an unusual spark.*magic/);
assert.deepEqual(jargonHits(jb), [], 'no gate numbers or jargon in the nodes body');
assert.deepEqual(jargonHits(closingBodyText(jr)), [], 'no jargon in journal prompts or one move');
// Placements live only in the small "For the curious" box.
const jc = jr.curious.lines.join(' ');
assert.match(jc, /Conscious North Node 44\.6 \(Coming to Meet\), waiting for 26/); assert.match(jc, /Conscious South Node 24\.6 .*in channel 24-61 Awareness/);
assert.match(jc, /Unconscious North Node 1\.4 .*waiting for 8/); assert.match(jc, /Cycle Jupiter 26 completes 26-44 Surrender/);
assert.match(jc, /Current season \(Chiron Return: The Phoenix\): cycle Uranus 8 completes 1-8 Inspiration/);
assert.match(jc, /Natal design: Projector, Splenic Authority, 3\/5\./); assert.ok(!/Manifesting Generator/.test(jc));
// One move fitted to Splenic: the first quiet instant knowing.
assert.equal(jr.oneMove.title, ONE_MOVE_TITLE); assert.equal(jr.oneMove.text, ONE_MOVE.splenic);
assert.match(jr.oneMove.text, /quiet, in-the-moment hit in your body.*very first instinct/);

// ── Jocelyn: Sept 30 1973, 5:07 AM, Reading PA (humandesign.ai fixtures). ──
const jo = tx(rd('./fixture-jocelyn-raw.json').full_raw), joCh = tx(rd('./fixture-jocelyn-chiron-raw.json').full_raw), joCy = rd('./fixture-jocelyn-cycles.json');
const or = nodesReading(jo, { cycles: joCy, overlays: { uranusOpposition: tx(C.jocelynUranus), chironReturn: joCh }, status: currentCycleStatus(joCy, now), birthdate: '1973-09-30', name: 'Jocelyn', now });
const on = natalNodes(jo);
assert.deepEqual([on.cN.gate, on.cN.line, on.cS.gate, on.cS.line, on.dN.gate, on.dS.gate], [10, 5, 15, 5, 58, 52]);
assert.equal(on.cN.wiring, 'superhighway'); assert.equal(on.cS.wiring, 'hanging');
const ob = nodesBodyText(or);
assert.match(ob, /You're heading toward your gift for being fully yourself.*superhighway you'll recognize/s);
assert.match(ob, /roughly 2012 to 2019/); assert.deepEqual(jargonHits(ob), []);
assert.match(or.curious.lines[0], /Conscious North Node 10\.5 \(Treading\), in channel 10-34 Exploration and 10-57 Perfected Form/);
assert.equal(or.oneMove.text, ONE_MOVE.sacral); assert.match(or.oneMove.text, /uh-huh/);
// A lit South Node is the old road: never called "your direction showing you itself".
assert.ok(!/direction showing you itself/.test(ob));

// Journal prompts: two or three, about stuck / what changed / craving + support.
for (const r of [jr, or]) {
  assert.ok(r.journal.prompts.length >= 2 && r.journal.prompts.length <= 3);
  assert.match(r.journal.prompts[0], /stuck/); assert.match(r.journal.prompts[1], /changed/); assert.match(r.journal.prompts[2], /craving.*support/);
}
assert.match(jr.journal.prompts[1], /since about 2015/);

// Younger person: the turning point is framed around the current cycle, not a lived midlife audit.
const young = { ...josh };
const yc = { saturnReturn: { start: '2025-01-01', peak: '2028-07-01', end: '2032-01-01', peak_datetime: '2028-07-01T00:00:00' }, uranusOpposition: { start: '2036-01-01', peak: '2039-07-01', end: '2043-01-01', peak_datetime: '2039-07-01T00:00:00' } };
const yr = nodesReading(young, { cycles: yc, status: currentCycleStatus(yc, now), birthdate: '1998-01-01', name: 'Sam', now });
assert.equal(yr.turningPoint.state, 'before');
assert.match(nodesBodyText(yr), /usually arrives in your early forties around 2039.*You aren't there yet/);
assert.ok(!/quiet audit/.test(nodesBodyText(yr))); assert.match(yr.journal.prompts[1], /last few years/);
// Inside the window right now: present tense.
const ic = { uranusOpposition: { start: '2024-01-01', peak: '2027-07-01', end: '2031-01-01', peak_datetime: '2027-07-01T00:00:00' } };
assert.match(nodesBodyText(nodesReading(josh, { cycles: ic, status: currentCycleStatus(ic, now), birthdate: '1986-01-01', now })), /Right now, roughly 2024 to 2031, life is running a quiet audit/);

// One move per natal authority (never assumes Sacral).
assert.match(oneMoveText('Emotional Authority'), /sleep on it/); assert.match(oneMoveText('Sacral Authority'), /uh-huh/);
assert.match(oneMoveText('Splenic Authority'), /first instinct/); assert.match(oneMoveText('Ego Authority'), /I want/);
assert.match(oneMoveText('Self-Projected Authority'), /hear yourself|your own voice/); assert.match(oneMoveText('Mental Projector Authority'), /talk it out/);
assert.match(oneMoveText('Lunar Authority'), /month/); assert.equal(oneMoveText(''), ONE_MOVE.none);
for (const t of Object.values(ONE_MOVE)) assert.deepEqual(jargonHits(t), []);

// Intake answers are light seasoning only: one short quote, the design stays the substance.
const seasoned = nodesReading(josh, { cycles: C.joshCycles, overlays: { uranusOpposition: joshUranus, chironReturn: joshChiron }, status: jst, birthdate: '1976-05-05', name: 'Josh', now, answers: { stuck: 'my job', craving: 'work that feels like mine', support: 'a partner in it' } });
const sb = nodesBodyText(seasoned);
assert.equal((sb.match(/"/g) || []).length, 2, 'exactly one quoted answer'); assert.match(sb, /You said you're craving "work that feels like mine\."/);
assert.ok(!sb.includes('my job') && !sb.includes('a partner in it'));
assert.ok(sb.length - jb.length < 120, 'seasoning adds one sentence, nothing more');

// Arc: masculine names carry through.
assert.match(nodesBodyText(applyArc(jr, 'masculine')), /Closing the Builder/);
// Prompt block for follow-ups only.
assert.match(formatNodesForPrompt(jr), /NODES DATA \(true node; the app shows the YOUR NODES section/);
assert.equal(nodesReading(null), null); assert.equal(nodesReading({}), null);

// Server: built from data (never by the model), sent to the client, available to follow-ups, model told not to write it.
const server = src('../server.js');
assert.match(server, /import \{ nodesReading, formatNodesForPrompt \} from '\.\/nodes-reading\.js'/);
assert.match(server, /natalBg\.nodes = nodes/); assert.match(server, /chartText \+= '\\n' \+ formatNodesForPrompt\(nodes\)/);
assert.match(server, /Never write a nodes section yourself/); assert.match(server, /Never write journal prompts or a 24-hour move/);
assert.match(server, /PLAIN LANGUAGE RULE/); assert.match(server, /never write line numbers or gate\.line codes/);
// Frontend: nodes after the natal wand; journal prompts + one move close the reading (before the session invite), on screen and in the PDF.
const app = src('../../frontend/src/App.jsx'), pdf = src('../../frontend/src/readingPdf.js'), cards = src('../../frontend/src/CycleCards.jsx');
assert.ok(app.indexOf('<NodesSection') > app.indexOf('<NatalWandCard') && app.indexOf('<NodesSection') < app.indexOf('{current.map'));
assert.ok(app.indexOf('<ClosingMoves') > app.indexOf('completed-cycles') && app.indexOf('<ClosingMoves') < app.indexOf('className="session-invite"'));
assert.ok(pdf.indexOf('renderNodes(nodes)') > pdf.indexOf('renderNatalWand(w, natalWand'));
assert.ok(pdf.indexOf('renderClosingMoves(nodes)') > pdf.indexOf('if (past.length)') && pdf.indexOf('renderClosingMoves(nodes)') < pdf.indexOf('SESSION_INVITE, maxW'));
assert.match(pdf, /curiousBox\(r\.curious\)/); assert.match(cards, /rn-curious/);
// Follow-up questions trimmed: nothing the reading already answers.
const fu = app.slice(app.indexOf('export function followupPrompts'), app.indexOf('function DeliveryNotice'));
for (const gone of ['Gene Keys gift', 'magic wand in', 'practice would help', 'Chiron incarnation cross']) assert.ok(!fu.includes(gone), 'removed: ' + gone);
assert.equal((fu.match(/out\.push\(/g) || []).length, 4, 'at most three prompts shown (type/profile branch is either-or)');
assert.equal(NODES_TITLE, "YOUR NODES: WHERE YOU'VE BEEN AND WHERE YOU'RE HEADED");
console.log('nodes reading tests passed (Josh 3/5 Splenic Projector natal; Jocelyn; plain body; curious box; turning point; journal prompts; one move per authority)');
