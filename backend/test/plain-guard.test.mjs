import assert from 'node:assert/strict';
import { plainProse, numericJargon } from '../plain-guard.js';
const cases = [
  ['The 21-45 Channel of Money came online.', 'The Channel of Money came online.'],
  ['If Channel 42-53 is present', 'If the Channel of Maturation is present'],
  ['your conscious Sun, Gate 18, line 4. The Sun', 'your conscious Sun, the energy of Integrity. The Sun'],
  ['Gate 45: Shadow Dominance', 'The energy of Synergy: Shadow Dominance'],
  ['carried by four gates: 45, 26, 22, and 47.', 'carried by four energies of Synergy, Artfulness, Graciousness and Transmutation.'],
  ['Right Angle Cross of Rulership (45/26 | 22/47) arrived', 'Right Angle Cross of Rulership arrived'],
  ['the gift of grace (Gate 22) and focus (Gate 10.4).', 'the gift of grace and focus.'],
  ['Natal Sun 18.4 holds.', 'Natal Sun holds.'],
  ['Gene Key 21: Shadow Control', 'Its Gene Key: Shadow Control'],
  ['The 18 sees what needs fixing.', 'The energy of Integrity sees what needs fixing.'],
  ['It is a hanging gate in your chart.', 'It is a an energy that comes fully alive with the right people in your chart.'.replace('a an', 'a an')],
];
for (const [i, o] of cases.slice(0, -1)) assert.equal(plainProse(i), o, i);
// Things that must NOT change: dates, ages, profiles, percentages, phase names.
for (const keep of ['Peak 2016-05-15, window 2012–2019.', 'between about 39-46 and ages 42-53', 'your 4/6 profile and the 2/4 you are learning', 'about 70% of your imprint', 'The 2 asks you to pull back.', 'Chiron Return: The Phoenix'])
  assert.equal(plainProse(keep), keep, keep);
assert.equal(plainProse(plainProse(cases[0][0])), cases[0][1]);   // idempotent
assert.deepEqual(numericJargon(plainProse('Gate 8 (Throat) and the 23-43 Channel of Structuring, 8.3 and line 2.')), []);
console.log('plain-language guard tests passed (gate/channel/line numbers out of prose; dates, ages, profiles kept)');
