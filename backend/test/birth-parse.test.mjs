import assert from 'node:assert/strict';
import { parseBirthText, fuzzyMonth } from '../birth-parse.js';
import { tzForLocation } from '../location-tz.js';
const J = { birthdate: '1973-09-30', birthtime: '05:07' };
const cases = [
  'Jocelyn Septemeber 30, 1973 5:07 AM in Reading , Pennsylvania',
  'Jocelyn September 30, 1973 5:07 AM in Reading, Pennsylvania',
  'Jocelyn, 1973-09-30, 05:07, Reading, PA',
  'Jocelyn, September 30 1973, 5:07 am, Reading, PA',
  'Jocelyn 9/30/1973 5:07am Reading, PA',
  'Jocelyn 30th of Sept 1973 at 5.07 a.m. in Reading Pennsylvania',
  'Jocelyn Septmber 30 1973 5:07 AM Reading, Pennsylvania',
];
for (const c of cases) {
  const r = parseBirthText(c);
  assert.equal(r.birthdate, J.birthdate, c); assert.equal(r.birthtime, J.birthtime, c);
  assert.match(r.location || '', /^Reading/, c); assert.equal(r.name, 'Jocelyn', c);
  assert.equal(tzForLocation(r.location), 'America/New_York', c + ' -> ' + r.location);
}
assert.equal(parseBirthText('Jocelyn Septemeber 30, 1973 5:07 AM in Reading , Pennsylvania').location, 'Reading, Pennsylvania');
assert.equal(fuzzyMonth('Mark'), null); assert.equal(fuzzyMonth('Febuary'), 2); assert.equal(fuzzyMonth('Agust'), 8);
assert.deepEqual(parseBirthText('hello there').missing, ['birth date', 'birth time', 'birthplace']);
assert.equal(tzForLocation('Phoenix, Arizona'), 'America/Phoenix');
assert.equal(tzForLocation('Austin, TX'), 'America/Chicago');
assert.equal(tzForLocation('Seattle, Washington'), 'America/Los_Angeles');
console.log('birth-parse tests passed');
