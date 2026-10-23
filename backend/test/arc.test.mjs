import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalizeArc, arcText, applyArc, arcPromptNote, ARCS } from '../arc.js';
import { CYCLE_PHASES, phaseFrameworkText, currentCycleStatus, formatCycleStatus } from '../reading-context.js';

// Choice: feminine by default; only an explicit "masculine" switches.
assert.equal(normalizeArc(undefined), 'feminine');
assert.equal(normalizeArc(''), 'feminine');
assert.equal(normalizeArc('Masculine'), 'masculine');
assert.equal(normalizeArc('male'), 'feminine');   // never inferred / guessed

// Feminine leaves everything untouched.
const fw = phaseFrameworkText();
assert.equal(arcText(fw, 'feminine'), fw);
assert.equal(arcPromptNote('feminine'), '');

// Masculine phase names map onto the same four windows.
const m = arcText(fw, 'masculine');
for (const name of ['First Saturn Return: The Apprentice', 'Uranus Opposition: Closing the Builder', 'Chiron Return: The Crucible', 'Second Saturn Return: Into the Sovereign', 'The Crucible phase spans about 47–63', 'men in their 50s'])
  assert.ok(m.includes(name), name);
assert.ok(!/Maiden|Mother|Phoenix|women/.test(m), m);
assert.deepEqual(Object.keys(ARCS.masculine), Object.keys(CYCLE_PHASES));
assert.equal(arcText('THE PHOENIX / THE MAIDEN / CLOSING THE MOTHER', 'masculine'), 'THE CRUCIBLE / THE APPRENTICE / CLOSING THE BUILDER');
// Unrelated uses of "mother" (e.g. conditioning) are not rewritten.
assert.equal(arcText("your mother's voice", 'masculine'), "your mother's voice");

// Deep apply keeps numbers / Infinity / non-strings.
const st = currentCycleStatus({ chironReturn: { peak: '2010-06-01' }, saturnReturn: { peak: '1989-01-01' } }, new Date('2026-10-18'));
const ms = applyArc(st, 'masculine');
assert.equal(ms.focus.key, 'chironReturn');
assert.equal(ms.focus.label, 'Chiron Return: The Crucible');
assert.equal(ms.focus.end, st.focus.end);
assert.equal(ms.completed[0].label, 'First Saturn Return: The Apprentice');
const txt = arcText(formatCycleStatus(st), 'masculine');
assert.ok(txt.includes('The Crucible') && !/Phoenix|Maiden/.test(txt));

// Every phase name in the server prompt + section prompts is covered by the masculine mapping.
const src = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const ms2 = arcText(src.replace(/import \{[^}]*\} from '\.\/arc\.js';/, ''), 'masculine');
assert.ok(!/Maiden|Phoenix|Closing the Mother|Mother phase|women in their 50s|woman in her 50s/.test(ms2));
assert.ok(arcPromptNote('masculine').includes('for the women in their Phoenix, the men in their Crucible'));

// Enrichment cards (labels/phase/theme) follow the arc.
const card = applyArc({ key: 'uranusOpposition', label: CYCLE_PHASES.uranusOpposition.title, phase: CYCLE_PHASES.uranusOpposition.phase, theme: 'closing the Mother: awakening to your authentic difference', peakDate: '2026-01-01' }, 'masculine');
assert.equal(card.phase, 'Closing the Builder');
assert.equal(card.theme, 'closing the Builder: awakening to your authentic difference');
console.log('arc tests passed');
// Cross names are chart data: the masculine rename must not touch them.
{
  const s = 'Right Angle Cross of the Sleeping Phoenix (20/34 | 55/59). RIGHT ANGLE CROSS OF THE SLEEPING PHOENIX. Chiron Return: The Phoenix.';
  const m = arcText(s, 'masculine');
  assert.ok(m.includes('Right Angle Cross of the Sleeping Phoenix (20/34 | 55/59)') && m.includes('THE SLEEPING PHOENIX') && m.includes('Chiron Return: The Crucible'), m);
  console.log('arc cross-name protection passed');
}
