// birth-parse.js — tolerant parser for free-text birth details. Shared by server and frontend.
// parseBirthText(text) -> { birthdate:'YYYY-MM-DD', birthtime:'HH:MM', timeKnown, location, name, missing:[...] }
const MONTHS = ['january','february','march','april','may','june','july','august','september','october','november','december'];
const ABBR = { sept: 9 };

function lev(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

// "Septemeber" -> 9, "Sept" -> 9, "feb" -> 2. Null if not a month.
export function fuzzyMonth(word) {
  const w = String(word || '').toLowerCase().replace(/[^a-z]/g, '');
  if (w.length < 3) return null;
  if (ABBR[w]) return ABBR[w];
  for (let i = 0; i < 12; i++) if (MONTHS[i] === w || (w.length >= 3 && MONTHS[i].startsWith(w))) return i + 1;
  let best = null, bestD = 99;
  for (let i = 0; i < 12; i++) {
    const m = MONTHS[i];
    if (m[0] !== w[0] || m.length < 5) continue;          // first letter must match; skip "may"/"june"/"july" fuzzing
    const dist = lev(w, m);
    if (dist < bestD) { bestD = dist; best = i + 1; }
  }
  return bestD <= Math.max(1, Math.floor(MONTHS[best - 1]?.length / 4)) ? best : null;
}

const pad = n => String(n).padStart(2, '0');
const validDate = (y, m, d) => y >= 1800 && y <= new Date().getFullYear() && m >= 1 && m <= 12 && d >= 1 && d <= 31;

export function parseBirthText(input) {
  let text = String(input || '').replace(/\s+/g, ' ').replace(/\s+,/g, ',').trim();
  const res = { birthdate: null, birthtime: '12:00', timeKnown: false, location: null, name: null, missing: [] };
  let rest = text, m;

  // ── Date ──
  const take = (re, fn) => { if (res.birthdate) return; const mm = rest.match(re); if (mm) { const r = fn(mm); if (r && validDate(...r)) { res.birthdate = `${r[0]}-${pad(r[1])}-${pad(r[2])}`; rest = rest.replace(mm[0], ' '); } } };
  take(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/, x => [+x[1], +x[2], +x[3]]);
  take(/\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})\b/, x => [+x[3], +x[1], +x[2]]);        // US M/D/YYYY
  take(/\b([A-Za-z]{3,12})\.?\s*(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})\b/, x => { const mo = fuzzyMonth(x[1]); return mo ? [+x[3], mo, +x[2]] : null; });
  take(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?([A-Za-z]{3,12})\.?,?\s*(\d{4})\b/, x => { const mo = fuzzyMonth(x[2]); return mo ? [+x[3], mo, +x[1]] : null; });
  if (!res.birthdate) res.missing.push('birth date');

  // ── Time ──
  if ((m = rest.match(/\b(\d{1,2})(?:[:.](\d{2}))?\s*([ap])\.?\s*m\.?(?=\W|$)/i))) {
    let h = +m[1]; const mi = m[2] || '00';
    if (h >= 1 && h <= 12) {
      if (m[3].toLowerCase() === 'p' && h !== 12) h += 12;
      if (m[3].toLowerCase() === 'a' && h === 12) h = 0;
      res.birthtime = `${pad(h)}:${mi}`; res.timeKnown = true; rest = rest.replace(m[0], ' ');
    }
  } else if ((m = rest.match(/\b([01]?\d|2[0-3])[:h](\d{2})\b/))) {
    res.birthtime = `${pad(+m[1])}:${m[2]}`; res.timeKnown = true; rest = rest.replace(m[0], ' ');
  } else if ((m = rest.match(/\bnoon\b/i))) { res.birthtime = '12:00'; res.timeKnown = true; rest = rest.replace(m[0], ' '); }
  else if ((m = rest.match(/\bmidnight\b/i))) { res.birthtime = '00:00'; res.timeKnown = true; rest = rest.replace(m[0], ' '); }
  if (!res.timeKnown) res.missing.push('birth time');

  // ── Location ── (strip a leading name first)
  { const nm = rest.match(/^\s*([A-Z][a-z]+)(?=[\s,])/); if (nm && !fuzzyMonth(nm[1]) && !/^(born|in|my|the)$/i.test(nm[1]) && /,/.test(rest.slice(nm[0].length))) rest = rest.slice(nm[0].length); }
  rest = rest.replace(/\s+/g, ' ').replace(/\s+,/g, ',').trim();
  if ((m = rest.match(/\b(?:born\s+)?in\s+([A-Za-z][A-Za-z .'\-]*(?:,\s*[A-Za-z][A-Za-z .'\-]*)*)/i))) res.location = m[1];
  else if ((m = rest.match(/([A-Za-z][A-Za-z .'\-]*,\s*[A-Za-z][A-Za-z .'\-]*(?:,\s*[A-Za-z][A-Za-z .'\-]*)?)\s*$/))) res.location = m[1];
  if (res.location) {
    res.location = res.location.replace(/\b(at|on|born)\b\s*$/i, '').replace(/[\s.,]+$/, '').replace(/\s*,\s*/g, ', ').trim();
    // drop a leading name in the comma form, e.g. "Jocelyn, Reading, PA" stays as is only if 3+ parts
  }
  if (!res.location || res.location.length < 2) { res.location = null; res.missing.push('birthplace'); }

  // ── Name ── leading capitalised word(s) before the date, or "my name is X"
  if ((m = text.match(/(?:my name is|i'm|i am|name:)\s+([A-Z][a-z]+)/i))) res.name = m[1];
  else if ((m = text.match(/^\s*([A-Z][a-z]+)(?=[\s,—\-])/))) {
    const w = m[1];
    if (!fuzzyMonth(w) && !/^(born|i|on|in|my|the|birth)$/i.test(w)) res.name = w;
  }
  return res;
}
