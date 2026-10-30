import assert from 'node:assert/strict';
import fs from 'node:fs';
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
  ['It is a hanging gate in your chart.', 'It is an energy that comes fully alive with the right people in your chart.'],
  ['Your Sun sits in Gate 18 - the Gate of Correction, the energy', 'Your Sun sits in the Gate of Correction, the energy'],
  ['The Gift of Gate 18 is Integrity.', 'Its Gift is Integrity.'],
  ['Line 4 of Gate 18 is called The Incompetent.', 'Its line is called The Incompetent.'],
  ['partnered with Gate 58, the Gate of Vitality, creating', 'partnered with the Gate of Vitality, creating'],
  ['It is a hanging gate in your chart.', 'x'],
];
for (const [i, o] of cases.filter(c => c[1] !== 'x')) assert.equal(plainProse(i), o, i);
// Things that must NOT change: dates, ages, profiles, percentages, phase names.
for (const keep of ['Peak 2016-05-15, window 2012–2019.', 'between about 39-46 and ages 42-53', 'your 4/6 profile and the 2/4 you are learning', 'about 70% of your imprint', 'The 2 asks you to pull back.', 'Chiron Return: The Phoenix'])
  assert.equal(plainProse(keep), keep, keep);
assert.equal(plainProse(plainProse(cases[0][0])), cases[0][1]);   // idempotent
assert.deepEqual(numericJargon(plainProse('Gate 8 (Throat) and the 23-43 Channel of Structuring, 8.3 and line 2.')), []);
assert.equal(plainProse('You keep doing work that does not want you.'), "You keep doing work that you don't want to do.");
assert.equal(plainProse("runs dry on work that doesn't want you."), "runs dry on work that you don't want to do.");
const twice = 'Your sun gate is an energy that comes fully alive with the right people. Your sun gate is an energy that comes fully alive with the right people.';
assert.equal(plainProse(twice), 'Your sun gate is an energy that comes fully alive with the right people.');
assert.equal(plainProse('Your sun gate is an energy that comes fully alive with the right people.'), 'Your sun gate is an energy that comes fully alive with the right people.');
const home = 'YOUR HOME BASE\n\nYou are a Generator. Your defined centers are the Sacral and the G center.\n\nYOUR MAGIC WAND\n\nThe Sun.';
const homed = plainProse(home);
assert.match(homed, /G center\. Think of this in terms of cities and maps\. These are the towns you know by heart\./);
assert.equal(plainProse(homed), homed);
assert.ok(!plainProse('The Sun is a town.').includes('cities and maps'));
const muddy = 'You are here to obscure the path so that others have to find their own.';
assert.equal(plainProse(muddy), "You are here as the example, not the instructor. You live your life, and other people find their own way by watching yours.");
assert.equal(plainProse(muddy + ' ' + muddy), "You are here as the example, not the instructor. You live your life, and other people find their own way by watching yours.");
const role = 'YOUR HOME BASE\n\nIn this third phase you come down off the roof as the role model.\n\nYOUR MAGIC WAND\n\nThe Sun.';
assert.match(plainProse(role), /role model\. You are here as the example, not the instructor\./);
assert.ok(!plainProse('WHERE YOU ARE NOW\n\nYou are off the roof.').includes('the example, not the instructor'));
const serverSrc = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
assert.ok(serverSrc.includes('ROLE_MODEL_LINE'));
assert.ok(!serverSrc.includes("You don't hand people the steps"));
assert.ok(!/Leave both out of the prompt|Proposed plain rewrites/i.test(serverSrc));
console.log('plain-language guard tests passed (gate/channel/line numbers out of prose; dates, ages, profiles kept)');
