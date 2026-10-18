// Current-first cycle selection at representative ages (typical peaks: Saturn 29.5, Uranus 41,
// Chiron 50.5, second Saturn 58.8). Windows are peak ±3.5 years; Chiron is permanent after its return.
import assert from 'assert';
import { currentCycleStatus, formatCycleStatus } from '../reading-context.js';

const BIRTH = Date.UTC(1960, 0, 1);
const Y = 365.25 * 864e5;
const at = (age) => new Date(BIRTH + age * Y);
const iso = (age) => at(age).toISOString().slice(0, 19);
const cycles = {
  saturnReturn: { peak_datetime: iso(29.5) },
  uranusOpposition: { peak_datetime: iso(41) },
  chironReturn: { peak_datetime: iso(50.5) },
  secondSaturnReturn: { peak_datetime: iso(58.8) },
};
const keys = (l) => l.map(c => c.key);
const S1 = 'saturnReturn', UR = 'uranusOpposition', CH = 'chironReturn', S2 = 'secondSaturnReturn';

const cases = [
  // age, focus, focus in window?, overlays, completed
  [22, null, null, [], []],
  [28, S1, true, [], []],
  [34, S1, false, [], []],            // between windows: most recently entered
  [40, UR, true, [], [S1]],
  [45.5, UR, false, [], [S1]],        // between Uranus and Chiron windows
  [48, CH, true, [], [S1, UR]],
  [52, CH, true, [], [S1, UR]],       // past peak: permanent overlay, still the focus
  [54.8, CH, true, [], [S1, UR]],     // 7-year Chiron window over; Chiron stays on for life
  [58, S2, true, [CH], [S1, UR]],     // two active: lead with the most active, note the Chiron overlay
  [66, S2, false, [CH], [S1, UR]],    // Sovereign entered, window closed; Chiron overlay continues
];

for (const [age, focus, inWin, overlays, completed] of cases) {
  const st = currentCycleStatus(cycles, at(age));
  assert.equal(st.focus?.key ?? null, focus, `age ${age} focus`);
  if (focus) assert.equal(st.focus.inWindow, inWin, `age ${age} inWindow`);
  assert.deepEqual(keys(st.overlays), overlays, `age ${age} overlays`);
  assert.deepEqual(keys(st.completed), completed, `age ${age} completed`);
  assert.equal(st.next, null);
  // completed + focus + overlays = everything entered, nothing in the future
  const entered = [...(focus ? [focus] : []), ...overlays, ...completed].sort();
  assert.deepEqual(keys(st.reached).sort(), entered, `age ${age} reached`);
  const txt = formatCycleStatus(st);
  assert.doesNotMatch(txt, /NEXT CYCLE/);
  for (const k of Object.keys(cycles)) if (!entered.includes(k)) {
    const label = { saturnReturn: 'First Saturn Return', uranusOpposition: 'Uranus Opposition', chironReturn: 'Chiron Return', secondSaturnReturn: 'Second Saturn Return' }[k];
    assert.doesNotMatch(txt.split('EROS PHASES')[0], new RegExp(label), `age ${age} must not surface future ${k}`);
  }
}

// Wording of the computed block
assert.match(formatCycleStatus(currentCycleStatus(cycles, at(22))), /NO CYCLE WINDOW HAS OPENED YET/);
assert.match(formatCycleStatus(currentCycleStatus(cycles, at(34))), /FOCUS \(the cycle they are in now\): First Saturn Return[\s\S]*BETWEEN WINDOWS/);
assert.match(formatCycleStatus(currentCycleStatus(cycles, at(28))), /approaching the peak/);
const t58 = formatCycleStatus(currentCycleStatus(cycles, at(58)));
assert.match(t58, /FOCUS[^\n]*Second Saturn Return: Into the Sovereign[\s\S]*OVERLAY[^\n]*Chiron Return: The Phoenix[\s\S]*PERMANENT[\s\S]*COMPLETED CYCLES[^\n]*First Saturn Return: The Maiden; Uranus Opposition: Closing the Mother/);
assert.match(formatCycleStatus(currentCycleStatus(cycles, at(52))), /FOCUS[^\n]*Chiron Return[^\n]*permanent overlay/);
console.log('current-cycle selection tests passed');
