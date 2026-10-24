// LOOK BACK insert (owner direction, Oct 24 2026): only the focus cycle is read in depth; every other entered
// cycle is a compact card (years, 2-3 plain sentences, 2 journal prompts). No future cycles.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { currentCycleStatus } from '../reading-context.js';
import { plainProse } from '../plain-guard.js';
import { arcText } from '../arc.js';
import { LOOK_BACK_TITLE, lookBackYears, lookBackPrompt, parseLookBack, fallbackLookBack, formatLookBackBlock, parseLookBackBlock } from '../look-back.js';

const rd = p => fs.readFileSync(new URL(p, import.meta.url), 'utf8');

// Focus rule on Jocelyn's real windows (born 1973-09-30): at 53 she is in the Chiron Return; Saturn + Uranus are look backs.
const J = { saturnReturn: { peak_datetime: '2003-07-08T00:00:00' }, uranusOpposition: { peak_datetime: '2016-05-15T00:00:00' }, chironReturn: { peak_datetime: '2023-06-09T00:00:00' }, secondSaturnReturn: { peak_datetime: '2032-03-01T00:00:00' } };
const st = currentCycleStatus(J, new Date('2026-10-24T12:00:00Z'));
assert.equal(st.focus.key, 'chironReturn');
assert.deepEqual(st.completed.map(c => c.key), ['saturnReturn', 'uranusOpposition']);
assert.deepEqual(st.overlays, []);
assert.ok(!JSON.stringify(st).includes('secondSaturnReturn'), 'future cycle never surfaced');

// Years line
assert.equal(lookBackYears(st.completed[1], '1973-09-30'), '2012–2019 · about ages 39–46');
assert.equal(lookBackYears({ start: '2019-12-09', end: 'for the rest of life' }, '1973-09-30'), 'Since 2019 · from about age 46');

// Prompt: plain, look back not study, JSON only, 2 prompts, no future
const items = st.completed.map(c => ({ key: c.key, c, active: false }));
const p = lookBackPrompt({ name: 'Jocelyn', items, birthdate: '1973-09-30' });
for (const s of ['look back, not a study', 'exactly 2 journal prompts', 'what was going on in their life during that window', 'in light of the lesson', 'no gates, channels', 'never mention or forecast a future cycle', 'Output ONE JSON object only', 'First Saturn Return: The Maiden', 'Uranus Opposition: Closing the Mother', '2012–2019'])
  assert.ok(p.includes(s), 'prompt has: ' + s);
assert.ok(arcText(p, 'masculine').includes('Closing the Builder'), 'masculine arc names');

// Parse
const raw = 'Here: {"saturnReturn":{"summary":"S.","prompts":["a?","b?","c?"]},"uranusOpposition":{"summary":"","prompts":["x"]}}';
assert.deepEqual(parseLookBack(raw, ['saturnReturn', 'uranusOpposition']), { saturnReturn: { summary: 'S.', prompts: ['a?', 'b?'] } });
assert.deepEqual(parseLookBack('not json', ['saturnReturn']), {});

// Fallback: 2 prompts, years, the lesson, no chart jargon
for (const k of ['saturnReturn', 'uranusOpposition', 'chironReturn', 'secondSaturnReturn']) {
  const f = fallbackLookBack(k, st.completed[1], k === 'chironReturn');
  assert.equal(f.prompts.length, 2);
  assert.ok(f.prompts[0].includes('2012') && /lesson/.test(f.prompts[1]));
  assert.ok(!/\b(gate|channel|center|profile|cross|gene key)s?\b/i.test(f.summary + f.prompts.join(' ')), k);
}

// Block round trip, and it survives the plain-language guard and the masculine arc swap unchanged in structure
const item = { summary: 'This was the first great test of adulthood. You began to become your own authority.', prompts: ['What was going on in your life between 1999 and 2006?', 'What do you remember about that time in light of becoming your own authority?'] };
const block = formatLookBackBlock({ label: 'First Saturn Return: The Maiden', years: lookBackYears(st.completed[0], '1973-09-30'), ...item });
const back = parseLookBackBlock(plainProse(block));
assert.equal(back.label, 'FIRST SATURN RETURN: THE MAIDEN');
assert.match(back.years, /^\d{4}–\d{4} · about ages \d+–\d+$/);
assert.equal(back.summary, item.summary); assert.deepEqual(back.prompts, item.prompts); assert.equal(back.active, false);
const act = parseLookBackBlock(formatLookBackBlock({ label: 'Chiron Return: The Phoenix', years: 'Since 2019 · from about age 46', active: true, ...item }));
assert.equal(act.active, true); assert.equal(act.years, 'Since 2019 · from about age 46');
assert.equal(parseLookBackBlock(arcText(block, 'masculine')).label, 'FIRST SATURN RETURN: THE APPRENTICE');

// Server: deep treatment for the focus only; overlays + completed become look back cards; purpose only with a Chiron focus
const server = rd('../server.js');
assert.ok(server.includes('const currentKeys = [focusKey].filter(Boolean);'));
assert.ok(server.includes("const purposeJob = chiron && focusKey === 'chironReturn' ?"));
assert.ok(server.includes('lookBackKeys = ORDER.filter(k => k !== focusKey && (overlayKeys.includes(k) || completedKeys.includes(k)))'));
assert.ok(server.includes('[[COMPLETED]]') && server.includes('formatLookBackBlock(') && server.includes('fallbackLookBack(key, c, active)'));
assert.ok(server.includes('if (!currentKeys.includes(key)) continue;   // story only for the focus cycle'));
assert.ok(server.includes('FOCUS RULE: only ONE cycle is read in depth') && server.includes('deeper lessons'));
assert.ok(!server.includes("If you'd like to recognize or witness the cycles you've already walked"));

// Frontend: compact cards, no bodygraph or gate cards for look back cycles; PDF uses compact boxes
const app = rd('../../frontend/src/App.jsx'), pdf = rd('../../frontend/src/readingPdf.js');
const pastBlock = app.slice(app.indexOf('className="completed-cycles look-back"'), app.indexOf('<ClosingMoves'));
assert.ok(pastBlock.includes('<LookBackCard') && !pastBlock.includes('<Bodygraphs') && !pastBlock.includes('<CycleCards'));
assert.ok(app.includes('const cur = [st.focus?.key].filter(Boolean);'));
assert.ok(pdf.includes('const lookBackBox') && pdf.includes('past.forEach(lookBackBox)') && !/past\.forEach\(c => \{[\s\S]{0,200}renderCycleSummary/.test(pdf));
assert.ok(app.includes('title: LOOK_BACK_TITLE') && LOOK_BACK_TITLE === 'LOOKING BACK');
console.log('look back tests passed (focus only in depth; compact look back cards; Jocelyn focus = Chiron Return)');
