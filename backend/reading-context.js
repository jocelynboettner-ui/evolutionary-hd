// reading-context.js
import { PLANET_KEYNOTES } from './planet-meanings.js';
import { ROLE_MODEL_LINE } from './reading-copy.js';
// Deterministic facts handed to the model so it never has to guess:
// canonical channel names, current age / HD life phase, fixed natal authority,
// and a one-cycle-per-channel attribution list.

// Standard Human Design names for all 36 channels (key = "low-high").
export const CHANNEL_NAMES = {
  '1-8': 'Inspiration',            '2-14': 'The Beat',              '3-60': 'Mutation',
  '4-63': 'Logic',                 '5-15': 'Rhythm',                '6-59': 'Mating (Intimacy)',
  '7-31': 'The Alpha',             '9-52': 'Concentration',         '10-20': 'Awakening',
  '10-34': 'Exploration',          '10-57': 'Perfected Form',       '11-56': 'Curiosity',
  '12-22': 'Openness',             '13-33': 'The Prodigal',         '16-48': 'The Wavelength',
  '17-62': 'Acceptance',           '18-58': 'Judgment',             '19-49': 'Synthesis',
  '20-34': 'Charisma',             '20-57': 'The Brainwave',        '21-45': 'Money (The Money Line)',
  '23-43': 'Structuring',          '24-61': 'Awareness',            '25-51': 'Initiation',
  '26-44': 'Surrender',            '27-50': 'Preservation',         '28-38': 'Struggle',
  '29-46': 'Discovery',            '30-41': 'Recognition',          '32-54': 'Transformation',
  '34-57': 'Power',                '35-36': 'Transitoriness',       '37-40': 'Community',
  '39-55': 'Emoting',              '42-53': 'Maturation',           '47-64': 'Abstraction',
};

export function normChannelKey(ch) {
  const g = String(ch).split('-').map(x => parseInt(x.trim(), 10)).filter(n => !isNaN(n));
  if (g.length !== 2) return null;
  return Math.min(...g) + '-' + Math.max(...g);
}

// "10 - 57" -> "10-57 Channel of Perfected Form"
export function channelLabel(ch) {
  const k = normChannelKey(ch);
  if (!k) return String(ch);
  const name = CHANNEL_NAMES[k];
  return name ? `${k} Channel of ${name}` : k;
}

export function channelList(chs) {
  return (chs || []).map(channelLabel).join('; ') || 'none';
}

// Parse "YYYY-MM-DD" or "M/D/YYYY"
export function parseBirthdate(bd) {
  const s = String(bd || '').trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return { y: +m[1], m: +m[2], d: +m[3] };
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return { y: +m[3], m: +m[1], d: +m[2] };
  return null;
}

export function computeAge(birthdate, now = new Date()) {
  const b = parseBirthdate(birthdate);
  if (!b) return null;
  let age = now.getUTCFullYear() - b.y;
  const mo = now.getUTCMonth() + 1, da = now.getUTCDate();
  if (mo < b.m || (mo === b.m && da < b.d)) age--;
  return age;
}

// A 6 in the profile (3/6, 4/6, 6/2, 6/3) is the role-model line.
export function hasSixthLine(profile) {
  return /(^|\/)6(\/|$)/.test(String(profile || '').replace(/\s/g, ''));
}

// Human Design three-phase life (most pronounced for 6th-line profiles).
export function lifePhase(age) {
  if (age == null) return null;
  if (age < 30) return { key: 'phase1', label: 'First phase (birth to ~30): learning through trial and error and experience' };
  if (age < 50) return { key: 'roof', label: 'Second phase (~30 to ~50): "on the roof" — stepping back, observing, healing, and gaining objectivity' };
  return { key: 'offroof', label: 'Third phase (~50 onward): "off the roof" — coming down as the embodied role model, living the wisdom authentically' };
}

export function buildFactsBlock(hdChart, birthdata, now = new Date()) {
  const age = computeAge(birthdata?.birthdate, now);
  const phase = lifePhase(age);
  const authority = hdChart?.authority || 'unknown';
  const L = [];
  L.push('=== CRITICAL CHART FACTS (use EXACTLY these values, no exceptions) ===');
  L.push('TYPE: ' + (hdChart?.type || 'unknown'));
  L.push('AUTHORITY: ' + authority);
  L.push('PROFILE: ' + (hdChart?.profile || 'unknown'));
  L.push('INCARNATION CROSS: ' + (hdChart?.incarnation_cross || 'unknown'));
  L.push('DEFINED CENTERS COUNT: ' + (hdChart?.defined_centers || []).length);
  L.push('NATAL CHANNELS (use these exact names): ' + channelList(hdChart?.channels));
  if (age != null) {
    L.push('TODAY: ' + now.toISOString().slice(0, 10));
    L.push('CURRENT AGE: ' + age + ' (computed from birth date; do not estimate a different age)');
    L.push('CURRENT HD LIFE PHASE: ' + phase.label);
    if (phase.key === 'offroof' && hasSixthLine(hdChart?.profile)) {
      L.push('ROLE MODEL LINE (6th line, third phase; use this exact sentence once in YOUR HOME BASE): ' + ROLE_MODEL_LINE);
    }
  }
  L.push('');
  L.push('FIXED RULES:');
  L.push(`- Natal Inner Authority is ${authority}. It is FIXED for life and never changes.`);
  L.push('- Cycle/transit overlay charts may temporarily define extra centers (e.g. Solar Plexus). Describe those as temporary themes or conditioning for that season ONLY. NEVER say the person\'s authority changes, shifts, or becomes emotional/other during a cycle.');
  L.push('- Channel names: use ONLY the names given in this data (e.g. 10-57 is the Channel of Perfected Form). Never use any other name for a channel.');
  L.push('- Use the CURRENT AGE and LIFE PHASE above exactly; do not infer a different life stage.');
  L.push('- Each channel that comes online during a cycle belongs to EXACTLY ONE cycle, as listed in the CHANNEL COMPLETION BY CYCLE data. Never attribute the same channel to more than one cycle.');
  L.push('=== END CRITICAL CHART FACTS ===');
  return L.join('\n');
}

// Given [{key,label,peakDate,channels:[...] }] (each cycle's newly-online channels from
// its own overlay chart), assign each channel to exactly one cycle: the earliest
// (chronological) cycle whose overlay produced it. Returns same order with
// { assigned:[...], alreadyOnline:[{ch, from}] }.
export function attributeChannels(cycles) {
  const order = [...cycles].sort((a, b) => String(a.peakDate || '9999').localeCompare(String(b.peakDate || '9999')));
  const owner = new Map();
  for (const c of order) for (const ch of c.channels || []) {
    const k = normChannelKey(typeof ch === 'string' ? ch : ch.ch);
    if (k && !owner.has(k)) owner.set(k, c.key);
  }
  return cycles.map(c => {
    const assigned = [], alreadyOnline = [];
    for (const ch of c.channels || []) {
      const k = normChannelKey(typeof ch === 'string' ? ch : ch.ch);
      if (!k) continue;
      if (owner.get(k) === c.key) { if (!assigned.find(x => x.key === k)) assigned.push({ key: k, src: ch }); }
      else alreadyOnline.push({ key: k, from: owner.get(k) });
    }
    return { ...c, assigned, alreadyOnline };
  });
}

export function formatAttribution(attributed, labels) {
  const L = ['=== CHANNEL COMPLETION BY CYCLE (authoritative; one cycle per channel) ==='];
  for (const c of attributed) {
    L.push(`${labels[c.key] || c.key} (peak ${String(c.peakDate || 'unknown').slice(0, 10)}):`);
    if (!c.assigned.length) L.push('  - no new channels come online at this cycle');
    for (const a of c.assigned) {
      const extra = a.src && a.src.natalGate ? ` (natal Gate ${a.src.natalGate} completed by Gate ${a.src.overlayGate})` : '';
      L.push('  - ' + channelLabel(a.key) + extra);
    }
    for (const a of c.alreadyOnline) L.push(`  (also active here, but it FIRST came online at ${labels[a.from] || a.from}; do not attribute ${a.key} to this cycle)`);
  }
  L.push('=== END CHANNEL COMPLETION BY CYCLE ===');
  return L.join('\n');
}

// ── Cycle model (owner's teaching, after Ra Uru Hu) ──
// Every cycle is a 7-year transit window (±3.5 yrs around the exact peak), EXCEPT Chiron:
// from the Chiron return onward its overlay is permanent for the rest of life ("the full flowering").
// Owner's canonical EROS phases + approximate age windows (framing text only; real windows are
// computed from each chart's actual transit date ±3.5 years).
export const CYCLE_PHASES = {
  saturnReturn:       { transit: 'First Saturn Return', phase: 'The Maiden', title: 'First Saturn Return: The Maiden',
    window: 'about ages 24–33', peak: '27–30', note: 'the Maiden phase; varies by chart' },
  uranusOpposition:   { transit: 'Uranus Opposition', phase: 'Closing the Mother', title: 'Uranus Opposition: Closing the Mother',
    window: 'about ages 35–47', peak: '38–44', note: 'the closing threshold of the Mother phase' },
  chironReturn:       { transit: 'Chiron Return', phase: 'The Phoenix', title: 'Chiron Return: The Phoenix',
    window: 'opens about age 47, moves through about 54, and does not close', peak: '50–51', note: 'opens the Phoenix phase (about 47–63); integrates permanently and stays an overlay for life' },
  secondSaturnReturn: { transit: 'Second Saturn Return', phase: 'Into the Sovereign', title: 'Second Saturn Return: Into the Sovereign',
    window: 'about ages 55–63', peak: '58–60', note: 'the threshold into Sovereign, which opens about 55–63 and does not close' },
};
export const CYCLE_LABELS = Object.fromEntries(Object.entries(CYCLE_PHASES).map(([k, v]) => [k, v.title]));
export function phaseFrameworkText(keys = Object.keys(CYCLE_PHASES)) {
  const L = ['EROS PHASES AND APPROXIMATE WINDOWS (owner\'s canonical framing; lead with the phase name, keep the transit name alongside):',
    'Each window opens about 3.5 years before its peak and closes about 3.5 years after (about 7 years), except where noted. Real dates vary by chart; when CURRENT CYCLE gives actual window dates, use those.'];
  for (const k of keys) { const v = CYCLE_PHASES[k]; if (v) L.push(`- ${v.title}: ${v.window}, peak ${v.peak} — ${v.note}.`); }
  if (keys.includes('secondSaturnReturn')) L.push('- The Phoenix phase spans about 47–63 and holds both the Chiron Return and the Second Saturn Return, so women in their 50s may be in overlapping initiations.');
  else if (keys.includes('chironReturn')) L.push('- The Phoenix phase spans about 47–63.');
  L.push('Never use the labels "Great Disruption", "Deep Healing", "Legacy Catalyst", or any "erotic arc" stage labels (e.g. Foreplay).');
  return L.join('\n');
}
const YEAR_MS = 365.25 * 864e5;

// Current-first model (owner's direction): lead with the cycle the person is in NOW.
// FOCUS = the most recently entered cycle (latest window start <= today). If its window is still open it is
// the most active cycle; if it has closed (between windows, e.g. ~34, or ~45-46) it is still the most relevant
// one, integrating now. OVERLAYS = any other cycle whose window also contains today (the Chiron overlay is
// permanent after its return). COMPLETED = every other cycle already entered; shown only at the end.
export function currentCycleStatus(cycles, now = new Date()) {
  if (!cycles) return null;
  const t = now.getTime();
  const list = Object.keys(CYCLE_LABELS).filter(k => cycles[k]).map(k => {
    const c = cycles[k];
    const peak = new Date(c.peak_datetime || c.peak).getTime();
    const start = peak - 3.5 * YEAR_MS, end = k === 'chironReturn' ? Infinity : peak + 3.5 * YEAR_MS;
    return { key: k, label: CYCLE_LABELS[k], peak, start, end };
  }).filter(c => !isNaN(c.peak)).sort((a, b) => a.start - b.start);
  const iso = ms => (ms === Infinity ? 'for the rest of life' : new Date(ms).toISOString().slice(0, 10));
  const inWindow = c => t >= c.start && t <= c.end;
  const where = c => !inWindow(c) ? 'window completed; most recently entered cycle, integrating now'
    : t < c.peak ? 'in its window, approaching the peak'
    : (c.key === 'chironReturn' ? 'past peak: permanent overlay (the full flowering)' : 'in its window, past the peak, integrating');
  const fmt = c => ({ key: c.key, label: c.label, start: iso(c.start), peak: iso(c.peak), end: iso(c.end),
    permanent: c.key === 'chironReturn' && t >= c.peak, inWindow: inWindow(c), phase: where(c) });
  const reachedL = list.filter(c => c.start <= t);
  const focusC = reachedL[reachedL.length - 1] || null;
  const overlayC = reachedL.filter(c => c !== focusC && inWindow(c)).sort((a, b) => b.start - a.start);
  const completedC = reachedL.filter(c => c !== focusC && !overlayC.includes(c));
  const activeC = [...(focusC && inWindow(focusC) ? [focusC] : []), ...overlayC];   // most active first
  const between = activeC.length === 0 || !(focusC && inWindow(focusC));
  const doneC = list.filter(c => c.end < t);
  const recent = activeC.length === 0 && doneC.length ? { ...fmt(doneC[doneC.length - 1]), phase: 'most recently completed' } : null;
  return {
    today: iso(t),
    focus: focusC ? fmt(focusC) : null,
    overlays: overlayC.map(fmt),
    completed: completedC.map(fmt),
    active: activeC.map(fmt),
    between, recent,
    reached: reachedL.map(c => ({ key: c.key })),
    next: null, // future cycles are never surfaced
  };
}

export function formatCycleStatus(st) {
  if (!st) return '';
  const L = ['=== CURRENT CYCLE (computed; LEAD THE READING WITH THIS AND CARRY IT THROUGH) ==='];
  if (st.focus) {
    const f = st.focus;
    L.push(`FOCUS (the cycle they are in now): ${f.label} — window ${f.start} to ${f.end}, peak ${f.peak} (${f.phase})`);
    if (!f.inWindow) L.push('BETWEEN WINDOWS: no new cycle window has opened since this one; it is the most recently entered cycle and is integrating now. Say so plainly in the opening.');
    st.overlays.forEach(c => L.push(`OVERLAY (also active; note it, but lead with the focus): ${c.label} — window ${c.start} to ${c.end}, peak ${c.peak} (${c.phase})`));
    if ([f, ...st.overlays].some(c => c.key === 'chironReturn' && c.permanent))
      L.push('Chiron overlay is PERMANENT from the Chiron return onward: describe its channels/gates as integrated, lifelong capacities, not a passing transit.');
    if (st.completed.length) L.push(`COMPLETED CYCLES (mention only at the very end, briefly): ${st.completed.map(c => c.label).join('; ')}`);
  } else {
    L.push('NO CYCLE WINDOW HAS OPENED YET: the natal design is the whole focus of this reading. Say so plainly and do not mention any future cycle.');
  }
  L.push('Do NOT mention, date, or forecast any future cycle.');
  L.push('Rule: every cycle is a 7-year window (±3.5 years around the actual peak date in this chart), except Chiron, which stays on permanently after its return. Only past and current cycles are discussed.');
  L.push(phaseFrameworkText([...(st.focus ? [st.focus] : []), ...st.overlays, ...(st.reached || [])].map(c => c.key).filter((k, i, a) => a.indexOf(k) === i)));
  L.push('=== END CURRENT CYCLE ===');
  return L.join('\n');
}

// Compact chart data for the client-side bodygraph.
export function bodygraphData(chart) {
  if (!chart) return null;
  const gatesOf = side => [...new Set(Object.values(chart[side] || {}).map(p => p?.gate).filter(Boolean))];
  return {
    type: chart.type, authority: chart.authority, profile: chart.profile, incarnation_cross: chart.incarnation_cross,
    defined_centers: chart.defined_centers || [], channels: (chart.channels || []).map(normChannelKey).filter(Boolean),
    gates: chart.gates || [], personalityGates: gatesOf('personality'), designGates: gatesOf('design'),
    planets: planetTable(chart),
  };
}

// ── All planetary activations (owner's planet meanings) ──
export const PLANET_ORDER = ['Sun','Earth','Moon','North Node','South Node','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto','Chiron'];
export const PLANET_INTRO = 'Each gate in your chart sits in a planetary position. The planet tells you HOW that gate expresses in your life.';
// Planet meanings come from planet-meanings.js (Ra Uru Hu's traditional keynotes; single source of truth).
export const PLANET_MEANINGS = Object.fromEntries(PLANET_KEYNOTES);
export function planetMeaning(planet, side) {
  return PLANET_MEANINGS[`${planet} (${side})`] || PLANET_MEANINGS[planet] || PLANET_MEANINGS[`${planet} (Conscious)`] || '';
}

// [{ planet, conscious:{gate,line,name}|null, unconscious:{...}|null }]
export function planetTable(chart) {
  const pick = p => (p && p.gate ? { gate: p.gate, line: p.line, name: p.iChingName || '', keynote: p.gateKeynote || '', lineDescription: p.lineDescription || '' } : null);
  return PLANET_ORDER.map(planet => ({
    planet,
    conscious: pick(chart?.personality?.[planet]),
    unconscious: pick(chart?.design?.[planet]),
  })).filter(r => r.conscious || r.unconscious);
}

export function formatPlanets(chart) {
  const rows = planetTable(chart);
  if (!rows.length) return '';
  const L = ['=== ALL PLANETARY ACTIVATIONS (gate.line; Conscious = Personality, Unconscious = Design) ==='];
  for (const r of rows) {
    const c = r.conscious ? `${r.conscious.gate}.${r.conscious.line}${r.conscious.name ? ' (' + r.conscious.name + ')' : ''}` : '—';
    const u = r.unconscious ? `${r.unconscious.gate}.${r.unconscious.line}${r.unconscious.name ? ' (' + r.unconscious.name + ')' : ''}` : '—';
    L.push(`${r.planet}: Conscious ${c} | Unconscious ${u}`);
  }
  if (!rows.find(r => r.planet === 'Chiron')) L.push('Chiron: not provided in the chart data (do not invent a Chiron gate).');
  L.push('');
  L.push('PLANET MEANINGS (use these exact meanings):');
  L.push(PLANET_INTRO);
  for (const [k, v] of Object.entries(PLANET_MEANINGS)) L.push(`${k} — ${v}`);
  L.push('=== END PLANETARY ACTIVATIONS ===');
  return L.join('\n');
}
