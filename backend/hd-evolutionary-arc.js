// hd-evolutionary-arc.js
// Generates overlay charts for all four cycle peaks:
// Uranus Opposition, Chiron Return, 1st Saturn Return, 2nd Saturn Return
// Each chart is cast using: date=exact peak, time=birth time, timezone=birth timezone

import { transformV3Response } from './hd-v3-parser.js';

const HD_API_BASE = 'https://api.humandesign.ai';

// All 36 canonical Human Design channel pairs
const HD_CHANNEL_PAIRS = [
  [1,8],[2,14],[3,60],[4,63],[5,15],[6,59],[7,31],[9,52],
  [10,20],[10,34],[10,57],[11,56],[12,22],[13,33],[16,48],
  [17,62],[18,58],[19,49],[20,34],[20,57],[21,45],[23,43],
  [24,61],[25,51],[26,44],[27,50],[28,38],[29,46],[30,41],
  [32,54],[33,13],[35,36],[37,40],[38,28],[39,55],[42,53],
  [44,26],[46,29],[47,64],[48,16],[49,19],[51,25],[52,9],
  [55,39],[56,11],[57,34],[58,18],[59,6],[60,3],[61,24],
  [62,17],[63,4],[64,47]
];

// Normalize a channel pair to "lower - higher" string
function channelKey(a, b) {
  return Math.min(a, b) + ' - ' + Math.max(a, b);
}

// Parse gate numbers from a channel string like "12 - 22" or "12-22"
function channelGates(chStr) {
  return String(chStr).split('-').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
}

// -- Fetch a single overlay chart for a peak date --
async function fetchOverlayChart(peakDate, birthtime, timezone, apiKey) {
  if (!peakDate) return null;

  // Use full datetime directly if available (peak_datetime from Python service)
  // Fall back to date + birth time if only a date string (e.g. from humandesign.ai exactDate)
  let isoDate;
  if (String(peakDate).includes('T')) {
    isoDate = peakDate; // Already has time component
  } else {
    const tp = (birthtime || '12:00').match(/^(\d{1,2}):(\d{2})/);
    const hh = String(tp ? +tp[1] : 12).padStart(2, '0');
    const mm = String(tp ? +tp[2] : 0).padStart(2, '0');
    isoDate = String(peakDate).split('T')[0] + 'T' + hh + ':' + mm + ':00';
  }

  console.log('Fetching overlay chart for: ' + isoDate);
  const url = HD_API_BASE + '/v3/hd-data?date=' + encodeURIComponent(isoDate)
    + '&timezone=' + encodeURIComponent(timezone)
    + '&api_key=' + apiKey;

  const res = await fetch(url);
  if (!res.ok) {
    console.warn('Overlay chart failed for ' + isoDate + ': ' + res.status);
    return null;
  }
  const raw = await res.json();
  return transformV3Response(raw);
}

// -- Three-category channel analysis --
// Layer 1: Fully new channels (both gates arrive with the overlay)
// Layer 2: Electromagnetically completed (one natal gate + one new overlay gate)
// Layer 3: Natal channels (unchanged -- for reference, not part of overlay description)
function compareToNatal(natal, overlay) {
  if (!overlay || !natal) return null;

  const profileShifted = overlay.profile !== natal.profile;
  const crossShifted = overlay.incarnation_cross !== natal.incarnation_cross;
  const typeShifted = overlay.type !== natal.type;

  // Gate sets -- natal.gates and overlay.gates are arrays of integers
  const natalGateSet = new Set(natal.gates || []);
  const overlayGateSet = new Set(overlay.gates || []);

  // Scan HD_CHANNEL_PAIRS directly to correctly classify every channel
  const seen = new Set();
  const fullyNewChannels = [];
  const electromagneticChannels = [];

  HD_CHANNEL_PAIRS.forEach(([a, b]) => {
    const aInNatal = natalGateSet.has(a);
    const bInNatal = natalGateSet.has(b);
    const aInOverlay = overlayGateSet.has(a);
    const bInOverlay = overlayGateSet.has(b);

    // Both gates must be present at the overlay for this channel to be active
    if (!aInOverlay || !bInOverlay) return;

    // Skip if this is purely a natal channel (both gates already natal)
    if (aInNatal && bInNatal) return;

    const key = channelKey(a, b);
    if (seen.has(key)) return;
    seen.add(key);

    if (!aInNatal && !bInNatal) {
      // Layer 1: Both gates are new -- fully new channel
      fullyNewChannels.push(key);
    } else {
      // Layer 2: One natal gate + one new overlay gate -- electromagnetic completion
      const natalGate = aInNatal ? a : b;
      const overlayGate = aInNatal ? b : a;
      electromagneticChannels.push({ ch: key, natalGate, overlayGate });
    }
  });

  // Channel sets for releasing calculation
  const natalChannelSet = new Set((natal.channels || []).map(c => String(c)));
  const overlayChannelSet = new Set((overlay.channels || []).map(c => String(c)));

  // Category 3: Natal channels not active at this overlay
  const releasingChannels = [...natalChannelSet].filter(ch => !overlayChannelSet.has(ch));

  // Center changes
  const natalDefinedSet = new Set(natal.defined_centers || []);
  const overlayDefinedSet = new Set(overlay.defined_centers || []);
  const newlyDefined = [...overlayDefinedSet].filter(c => !natalDefinedSet.has(c));
  const newlyOpen = [...natalDefinedSet].filter(c => !overlayDefinedSet.has(c));

  // Retrograde count (retrogrades is an array in the v3 chart object)
  const natalRetroCount = (natal.retrogrades || []).length;
  const overlayRetroCount = (overlay.retrogrades || []).length;

  return {
    typeShifted,
    profileShifted,
    crossShifted,
    // Three channel categories
    fullyNewChannels,
    electromagneticChannels, // array of { ch, natalGate, overlayGate }
    releasingChannels,
    // Centers
    newlyDefined,
    newlyOpen,
    definitionExpanding: newlyDefined.length > newlyOpen.length,
    // Retrogrades
    natalRetroCount,
    overlayRetroCount,
  };
}

// -- Master function: fetch all four overlay charts in parallel --
export async function fetchEvolutionaryArc(birthtime, timezone, natalChart, pythonCycles, hdaiSaturnReturns) {
  const apiKey = process.env.HD_AI_API_KEY;

  const pythonSaturnPeak = pythonCycles?.saturnReturn?.peak || null;
  const pythonUranusP = pythonCycles?.uranusOpposition?.peak || null;
  const pythonChironP = pythonCycles?.chironReturn?.peak || null;
  const pythonSaturn2Peak = pythonCycles?.secondSaturnReturn?.peak || null;

  // Prefer humandesign.ai ExactDate for saturn returns if available
  let saturn1Peak = pythonSaturnPeak;
  let saturn2Peak = pythonSaturn2Peak;
  if (hdaiSaturnReturns?.allReturns) {
    const r1 = hdaiSaturnReturns.allReturns.find(r => r.returnNumber === 1 || r.ReturnNumber === 1);
    const r2 = hdaiSaturnReturns.allReturns.find(r => r.returnNumber === 2 || r.ReturnNumber === 2);
    if (r1?.ExactDate || r1?.exactDate) saturn1Peak = r1.ExactDate || r1.exactDate;
    if (r2?.ExactDate || r2?.exactDate) saturn2Peak = r2.ExactDate || r2.exactDate;
  }

  const peaks = {
    saturnReturn1: saturn1Peak,
    uranusOpposition: pythonCycles?.uranusOpposition?.peak_datetime || pythonCycles?.uranusOpposition?.peak || null,
    chironReturn: pythonCycles?.chironReturn?.peak_datetime || pythonCycles?.chironReturn?.peak || null,
    saturnReturn2: saturn2Peak || pythonCycles?.second_saturn_return?.peak_datetime || pythonCycles?.secondSaturnReturn?.peak_datetime || null,
  };

  console.log('Fetching evolutionary arc peaks:', peaks);

  const [s1, ur, ch, s2] = await Promise.allSettled([
    fetchOverlayChart(peaks.saturnReturn1, birthtime, timezone, apiKey),
    fetchOverlayChart(peaks.uranusOpposition, birthtime, timezone, apiKey),
    fetchOverlayChart(peaks.chironReturn, birthtime, timezone, apiKey),
    fetchOverlayChart(peaks.saturnReturn2, birthtime, timezone, apiKey),
  ]);

  const unwrap = r => r.status === 'fulfilled' ? r.value : null;

  return {
    saturnReturn1:    { peakDate: peaks.saturnReturn1,    chart: unwrap(s1), delta: compareToNatal(natalChart, unwrap(s1)) },
    uranusOpposition: { peakDate: peaks.uranusOpposition, chart: unwrap(ur), delta: compareToNatal(natalChart, unwrap(ur)) },
    chironReturn:     { peakDate: peaks.chironReturn,     chart: unwrap(ch), delta: compareToNatal(natalChart, unwrap(ch)) },
    saturnReturn2:    { peakDate: peaks.saturnReturn2,    chart: unwrap(s2), delta: compareToNatal(natalChart, unwrap(s2)) },
  };
}

// -- Format arc for Claude prompt injection --
export function formatEvolutionaryArcForPrompt(arc, natalChart) {
  const L = [];
  L.push('=== EVOLUTIONARY ARC DATA ===');
  L.push('');
  L.push('Overlay charts cast at the exact peak datetime of each cycle,');
  L.push('using birth time and timezone. Channels are categorized into three layers:');
  L.push('  FULLY NEW: both gates arrive with this overlay -- new circuitry');
  L.push('  ELECTROMAGNETIC: one natal gate + one new gate -- latent potential completing');
  L.push('  NATAL ONLY: present in natal chart, not active at this peak -- do not describe here');
  L.push('');

  // Natal baseline
  L.push('NATAL BASELINE');
  L.push('Type: ' + (natalChart.type || ''));
  L.push('Profile: ' + (natalChart.profile || ''));
  L.push('Cross: ' + (natalChart.incarnation_cross || ''));
  L.push('Defined: ' + (natalChart.defined_centers || []).join(', '));
  L.push('Channels: ' + (natalChart.channels || []).join(', '));
  L.push('Gates: ' + (natalChart.gates || []).join(', '));
  L.push('');

  const cycleOrder = [
    { key: 'saturnReturn1',    label: '1ST SATURN RETURN (~Age 29)' },
    { key: 'uranusOpposition', label: 'URANUS OPPOSITION (~Age 41)' },
    { key: 'chironReturn',     label: 'CHIRON RETURN (~Age 50)' },
    { key: 'saturnReturn2',    label: '2ND SATURN RETURN (~Age 58)' },
  ];

  cycleOrder.forEach(({ key, label }) => {
    const entry = arc[key];
    L.push('---');
    L.push(label);
    if (!entry?.chart) {
      L.push('  [Chart unavailable for this threshold]');
      L.push('');
      return;
    }
    const { chart, delta, peakDate } = entry;
    L.push('  Peak Date: ' + (peakDate || 'unknown'));
    L.push('  Type: ' + (chart.type || ''));
    L.push('  Profile: ' + (chart.profile || ''));
    L.push('  Cross: ' + (chart.incarnation_cross || ''));
    L.push('  Defined: ' + (chart.defined_centers || []).join(', '));
    L.push('');

    if (delta) {
      if (delta.typeShifted)    L.push('  TYPE SHIFT: ' + natalChart.type + ' -- address this directly');
      if (delta.profileShifted) L.push('  PROFILE SHIFT: ' + natalChart.profile + ' -> ' + chart.profile);
      if (delta.crossShifted)   L.push('  CROSS SHIFT: ' + natalChart.incarnation_cross + ' -> ' + chart.incarnation_cross);

      // Layer 1 -- Fully new channels
      if (delta.fullyNewChannels.length > 0) {
        L.push('  FULLY NEW CHANNELS (both gates arrive with this overlay):');
        delta.fullyNewChannels.forEach(ch => L.push('    ' + ch));
      }

      // Layer 2 -- Electromagnetic completions
      if (delta.electromagneticChannels.length > 0) {
        L.push('  ELECTROMAGNETICALLY COMPLETED CHANNELS');
        L.push('  (natal gate + new overlay gate -- latent potential completing temporarily):');
        delta.electromagneticChannels.forEach(({ ch, natalGate, overlayGate }) => {
          L.push('    ' + ch + ' -- natal Gate ' + natalGate + ' completed by overlay Gate ' + overlayGate);
        });
      }

      // Layer 3 -- Releasing
      if (delta.releasingChannels.length > 0) {
        L.push('  NATAL CHANNELS NOT ACTIVE AT THIS PEAK: ' + delta.releasingChannels.join(', '));
        L.push('  (natal design -- do NOT describe these as active at this threshold)');
      }

      if (delta.newlyDefined.length)  L.push('  NEWLY DEFINED CENTERS: ' + delta.newlyDefined.join(', '));
      if (delta.newlyOpen.length)     L.push('  RELEASING DEFINITION: ' + delta.newlyOpen.join(', '));
      if (delta.definitionExpanding)  L.push('  DIRECTION: More of the vehicle coming online');

      if (delta.overlayRetroCount !== delta.natalRetroCount) {
        const dir = delta.overlayRetroCount > delta.natalRetroCount ? 'more internalized' : 'more outward-expressing';
        L.push('  RETROGRADE SHIFT: ' + delta.natalRetroCount + ' natal vs ' + delta.overlayRetroCount + ' at this peak (' + dir + ')');
      }
    }
    L.push('');
  });

  L.push('---');
  L.push('INSTRUCTION FOR CLAUDE:');
  L.push('After the LIVING IT NOW section, add a section titled YOUR EVOLUTIONARY ARC.');
  L.push('Tell the story of this soul progressively incarnating more fully at each threshold.');
  L.push('');
  L.push('CHANNEL INTERPRETATION RULES:');
  L.push('1. FULLY NEW CHANNELS: interpret as completely new gifts arriving at this threshold.');
  L.push('   Both gates were absent from the natal chart -- this is brand new circuitry.');
  L.push('');
  L.push('2. ELECTROMAGNETICALLY COMPLETED CHANNELS: these are the most soulful layer.');
  L.push('   One gate was always present in the natal design. At this cycle peak, its');
  L.push('   partner gate arrives for the first time, completing the channel temporarily.');
  L.push('   Interpret each completion as a natal gate finally meeting its partner --');
  L.push('   a latent potential that has been building the entire life, now realized.');
  L.push('   These are not permanent -- they are activated for the duration of the cycle.');
  L.push('   Describe what it feels like when that natal gate finally has its partner.');
  L.push('   Example: "Your Gate 41 has lived in your Root center your entire life --');
  L.push('   the pressure to begin, the anticipation of new experience. At your Chiron');
  L.push('   Return, Gate 30 arrived: the willingness to feel everything, to desire');
  L.push('   without apology. For the first time, that anticipation had somewhere to go."');
  L.push('');
  L.push('3. NATAL CHANNELS NOT ACTIVE: do not describe these in the overlay reading.');
  L.push('   They belong to the natal section only. Never bleed them into threshold work.');
  L.push('');
  L.push('For each threshold:');
  L.push('  1. Name it and its exact peak date');
  L.push('  2. Describe TYPE, PROFILE, CROSS shifts if present');
  L.push('  3. Describe fully new channels -- new gifts that arrived');
  L.push('  4. Describe electromagnetic completions -- natal gates meeting their partners');
  L.push('  5. Name what centers became defined and what that felt like in the body');
  L.push('  6. Connect the arc to natal design and current cycle');
  L.push('Write in the same sacred, grounded, prose style. No markdown. No pound signs.');
  L.push('This section should feel like watching a soul remember itself across time.');
  L.push('');
  L.push('=== END EVOLUTIONARY ARC DATA ===');
  return L.join('\n');
}
