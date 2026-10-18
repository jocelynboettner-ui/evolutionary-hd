// Regression tests: natal births in a repeated or skipped DST hour must resolve to one UTC moment
// (humandesign.ai rejects them as local times). Convention mirrors main.py parse_birth_utc.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { resolveLocalTime } from '../birth-time.js';

const cases = [
  // ordinary births: unchanged
  ['1973-09-30T05:10', 'America/New_York', '1973-09-30T09:10:00', 'normal'],   // Jocelyn
  ['1973-09-30T05:07', 'America/New_York', '1973-09-30T09:07:00', 'normal'],
  ['1963-08-15T12:00', 'Asia/Kolkata', '1963-08-15T06:30:00', 'normal'],
  ['1955-11-05T23:15', 'Australia/Sydney', '1955-11-05T13:15:00', 'normal'],
  ['1988-12-31T23:50', 'Pacific/Auckland', '1988-12-31T10:50:00', 'normal'],
  ['2000-01-01T00:05', 'Asia/Tokyo', '1999-12-31T15:05:00', 'normal'],
  ['1985-04-28T03:30', 'America/Chicago', '1985-04-28T08:30:00', 'normal'],
  // repeated hour (fall back): first occurrence = daylight time
  ['1983-10-30T01:30', 'America/New_York', '1983-10-30T05:30:00', 'ambiguous'],
  ['1996-10-27T01:30', 'Europe/London', '1996-10-27T00:30:00', 'ambiguous'],
  ['1990-03-04T02:30', 'Australia/Sydney', '1990-03-03T15:30:00', 'ambiguous'],
  // skipped hour (spring forward): shifted forward by the gap (02:30 -> 03:30 daylight)
  ['1985-04-28T02:30', 'America/Chicago', '1985-04-28T08:30:00', 'nonexistent'],
  ['1996-03-31T01:30', 'Europe/London', '1996-03-31T01:30:00', 'nonexistent'],
  ['1989-10-29T02:30', 'Australia/Sydney', '1989-10-28T16:30:00', 'nonexistent'],
];
for (const [local, tz, utc, kind] of cases) {
  const r = resolveLocalTime(local, tz);
  assert.equal(r.utc, utc, `${local} ${tz}`);
  assert.equal(r.kind, kind, `${local} ${tz} kind`);
  assert.equal(!!r.note, kind !== 'normal');
}
assert.equal(resolveLocalTime('1985-04-28T02:30', 'America/Chicago').localUsed, '1985-04-28T03:30');
assert.match(resolveLocalTime('1983-10-30T01:30', 'America/New_York').note, /first occurrence \(daylight time\)/);

// The natal request and the debug endpoint must send the resolved UTC moment, never the raw local time.
const src = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const fn = src.slice(src.indexOf('async function fetchHumanDesign'), src.indexOf('\n}\n', src.indexOf('async function fetchHumanDesign')));
assert.match(fn, /resolveLocalTime\(isoDate, timezone\)/);
assert.match(fn, /timezone: 'UTC'/);
assert.doesNotMatch(fn, /new URLSearchParams\(\{ date: isoDate, timezone \}\)/);
// sacred-cycles-api must use the same convention
const py = fs.readFileSync(new URL('../main.py', import.meta.url), 'utf8');
assert.match(py, /AmbiguousTimeError:\s*\n\s*birth_local = tz.localize\(naive, is_dst=True\)/);
assert.match(py, /NonExistentTimeError:\s*\n\s*birth_local = tz.localize\(naive, is_dst=False\)/);
console.log('birth time DST resolution tests passed');
