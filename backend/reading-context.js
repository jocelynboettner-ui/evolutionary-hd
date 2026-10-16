// reading-context.js
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
export const CYCLE_LABELS = {
  saturnReturn: 'First Saturn Return',
  uranusOpposition: 'Uranus Opposition',
  chironReturn: 'Chiron Return',
  secondSaturnReturn: 'Second Saturn Return',
};
const YEAR_MS = 365.25 * 864e5;

export function currentCycleStatus(cycles, now = new Date()) {
  if (!cycles) return null;
  const t = now.getTime();
  const list = Object.keys(CYCLE_LABELS).filter(k => cycles[k]).map(k => {
    const c = cycles[k];
    const peak = new Date(c.peak_datetime || c.peak).getTime();
    const start = peak - 3.5 * YEAR_MS, end = k === 'chironReturn' ? Infinity : peak + 3.5 * YEAR_MS;
    return { key: k, label: CYCLE_LABELS[k], peak, start, end };
  }).filter(c => !isNaN(c.peak)).sort((a, b) => a.peak - b.peak);
  const iso = ms => (ms === Infinity ? 'for the rest of life' : new Date(ms).toISOString().slice(0, 10));
  const fmt = c => ({ key: c.key, label: c.label, start: iso(c.start), peak: iso(c.peak), end: iso(c.end),
    permanent: c.key === 'chironReturn' && t >= c.peak,
    phase: t < c.peak ? 'approaching peak' : (c.key === 'chironReturn' ? 'past peak: permanent overlay (the full flowering)' : 'past peak, integrating') });
  const active = list.filter(c => t >= c.start && t <= c.end)
    // Chiron (permanent) first, then by most recent peak
    .sort((a, b) => (b.key === 'chironReturn') - (a.key === 'chironReturn') || b.peak - a.peak).map(fmt);
  const next = list.find(c => c.start > t);
  const between = active.length === 0;
  const done = list.filter(c => c.end < t);
  const recent = between && done.length ? { ...fmt(done[done.length - 1]), phase: 'most recently completed' } : null;
  return { today: iso(t), active, between, recent, next: null }; // future cycles are never surfaced
}

export function formatCycleStatus(st) {
  if (!st) return '';
  const L = ['=== CURRENT CYCLE (computed; LEAD THE READING WITH THIS) ==='];
  if (st.active.length) {
    st.active.forEach((c, i) => L.push(`${i === 0 ? 'PRIMARY' : 'ALSO ACTIVE'}: ${c.label} — window ${c.start} to ${c.end}, peak ${c.peak} (${c.phase})`));
    if (st.active.some(c => c.key === 'chironReturn' && c.permanent))
      L.push('Chiron overlay is PERMANENT from the Chiron return onward: describe its channels/gates as integrated, lifelong capacities, not a passing transit.');
  } else {
    L.push('BETWEEN CYCLES: no 7-year cycle window contains today. Say so plainly near the start of the reading.');
    if (st.recent) L.push(`FOCUS ON MOST RECENTLY COMPLETED CYCLE: ${st.recent.label} — window ${st.recent.start} to ${st.recent.end}, peak ${st.recent.peak}. Describe what it activated and how those capacities are integrating now.`);
  }
  L.push('Do NOT mention, date, or forecast any future cycle.');
  L.push('Rule: every cycle is a 7-year window (±3.5 years around the peak), except Chiron, which stays on permanently after its return. Only past and current cycles are discussed.');
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
  };
}
