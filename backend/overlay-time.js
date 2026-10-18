// overlay-time.js
// Builds the humandesign.ai date/timezone for a cycle return ("overlay") chart.
// Return moments from sacred-cycles-api (peak_datetime) are naive UTC timestamps computed
// with swe.calc_ut, so they must be sent with timezone=UTC. Sending them with the birth
// timezone shifted every return chart by the birth zone's offset (e.g. +4h for EDT,
// -9h for Tokyo, -5:30 for Kolkata) and could flip the cycle's type/channels.
// A date-only peak (legacy fallback) is cast at the birth clock time in the birth timezone.
export function overlayQuery(peak, birthtime, birthTimezone) {
  const s = String(peak || '');
  if (!s) return null;
  if (s.includes('T')) {
    const [d, t] = s.replace(/Z$/, '').replace(/[+-]00:?00$/, '').split('T');
    const hhmm = (t || '12:00').slice(0, 5);
    return { date: `${d}T${hhmm}:00`, timezone: 'UTC' };
  }
  const tp = String(birthtime || '12:00').match(/^(\d{1,2}):(\d{2})/);
  const hh = String(tp ? +tp[1] : 12).padStart(2, '0');
  const mm = String(tp ? +tp[2] : 0).padStart(2, '0');
  return { date: `${s}T${hh}:${mm}:00`, timezone: birthTimezone || 'UTC' };
}
