// birth-time.js
// Resolve a local birth wall-clock time in an IANA zone to a single UTC moment.
// humandesign.ai rejects local times that occur twice (DST fall-back: "ambiguous_local_time")
// or not at all (DST spring-forward: "nonexistent_local_time"), so natal charts are requested
// as a resolved UTC moment. Disambiguation follows the standard "compatible" convention
// (RFC 5545 / ECMAScript Temporal / Python zoneinfo fold=0), mirrored in main.py parse_birth_utc:
//   - repeated hour  -> the FIRST occurrence (daylight time, before clocks fall back)
//   - skipped hour   -> shifted FORWARD by the gap (e.g. 02:30 -> 03:30 daylight time)
// Ordinary times resolve to exactly the same instant as before.

const dtf = new Map();
function offsetMinutes(ms, tz) {
  let f = dtf.get(tz);
  if (!f) { f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }); dtf.set(tz, f); }
  const p = Object.fromEntries(f.formatToParts(new Date(ms)).map(x => [x.type, x.value]));
  return (Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - ms) / 60000;
}

/**
 * @param {string} isoLocal 'YYYY-MM-DDTHH:MM[:SS]' wall-clock time
 * @param {string} tz IANA timezone
 * @returns {{ utc: string, utcDate: Date, kind: 'normal'|'ambiguous'|'nonexistent', note: string|null, localUsed: string }}
 */
export function resolveLocalTime(isoLocal, tz) {
  const m = String(isoLocal).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) throw new Error('bad local time: ' + isoLocal);
  const wall = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0)); // wall clock read as if UTC
  const before = offsetMinutes(wall - 36 * 3600e3, tz), after = offsetMinutes(wall + 36 * 3600e3, tz);
  const cands = [...new Set([before, after, offsetMinutes(wall, tz)])].filter(o => offsetMinutes(wall - o * 60000, tz) === o);
  let ms, kind = 'normal', note = null;
  if (cands.length > 1) {
    ms = wall - Math.max(...cands) * 60000; // earliest instant = first occurrence
    kind = 'ambiguous';
    note = `${m[4]}:${m[5]} occurs twice on this date in ${tz} (clocks fell back); using the first occurrence (daylight time).`;
  } else if (cands.length === 1) {
    ms = wall - cands[0] * 60000;
  } else {
    ms = wall - before * 60000; // offset in force before the jump -> later wall time
    kind = 'nonexistent';
    note = `${m[4]}:${m[5]} does not exist on this date in ${tz} (clocks sprang forward); shifted forward by the gap.`;
  }
  const d = new Date(ms);
  const off = offsetMinutes(ms, tz);
  const lw = new Date(ms + off * 60000).toISOString().slice(0, 16);
  return { utc: d.toISOString().slice(0, 19), utcDate: d, kind, note, localUsed: lw };
}
