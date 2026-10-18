// Regression tests: return ("overlay") charts must be cast at the UTC return moment.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { overlayQuery } from '../overlay-time.js';

// The instant a {date, timezone} query denotes, independent of the server's own zone.
const offMin = (ms, tz) => { const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(new Date(ms)).map(x => [x.type, x.value]));
  return (Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - ms) / 60000; };
const instant = ({ date, timezone }) => { const g = Date.parse(date + 'Z'); return new Date(g - offMin(g - offMin(g, timezone) * 60000, timezone) * 60000).toISOString().slice(0, 16); };

// Jocelyn's Chiron return (Neutrino: 2023-06-09 09:47 UTC) must not move with her birth zone.
for (const tz of ['America/New_York', 'Asia/Tokyo', 'Asia/Kolkata', 'Australia/Sydney', 'America/Los_Angeles', 'Europe/London', 'America/Sao_Paulo', 'Pacific/Auckland']) {
  const q = overlayQuery('2023-06-09T09:47:00', '05:10', tz);
  assert.deepEqual(q, { date: '2023-06-09T09:47:00', timezone: 'UTC' }, tz);
  assert.equal(instant(q), '2023-06-09T09:47', tz);
}
// ISO variants from the sacred-cycles-api / toISOString fallback
assert.deepEqual(overlayQuery('2032-08-24T03:15:24.000Z', '05:10', 'Asia/Kolkata'), { date: '2032-08-24T03:15:00', timezone: 'UTC' });
assert.deepEqual(overlayQuery('2016-05-15T09:00:15', null, 'America/New_York'), { date: '2016-05-15T09:00:00', timezone: 'UTC' });
// Legacy date-only peak: birth clock time in the birth zone
assert.deepEqual(overlayQuery('2003-07-08', '5:10', 'America/New_York'), { date: '2003-07-08T05:10:00', timezone: 'America/New_York' });
assert.equal(overlayQuery('', '05:10', 'UTC'), null);

// Both overlay code paths must go through overlayQuery (guards against re-introducing the birth-zone cast).
for (const f of ['../server.js', '../hd-evolutionary-arc.js']) {
  const src = fs.readFileSync(new URL(f, import.meta.url), 'utf8');
  const fn = src.slice(src.indexOf('async function fetchOverlayChart'), src.indexOf('\n}\n', src.indexOf('async function fetchOverlayChart')));
  assert.match(fn, /overlayQuery\(/, f + ' fetchOverlayChart must use overlayQuery');
}
// The arc must use the full Saturn return datetimes, not date-only peaks.
const arc = fs.readFileSync(new URL('../hd-evolutionary-arc.js', import.meta.url), 'utf8');
assert.match(arc, /saturnReturn\?\.peak_datetime \|\| pythonCycles\?\.saturnReturn\?\.peak/);
assert.match(arc, /secondSaturnReturn\?\.peak_datetime \|\| pythonCycles\?\.secondSaturnReturn\?\.peak/);
console.log('overlay timezone tests passed');
