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
// Layer 1: Fully new channels (both gates arrive with the overlay, neither in natal)
// Layer 2: Electromagnetically completed (one natal gate + one new overlay gate)
// Layer 3: Natal channels (unchanged -- for reference, not part of overlay description)
//
// KEY INSIGHT: The humandesign.ai API only returns channels where BOTH gates are defined
// in the overlay chart itself. Electromagnetic completions (one natal gate + one overlay
// gate) do NOT appear in the API channels list -- we must scan HD_CHANNEL_PAIRS directly
// against both natal AND overlay gate sets to detect them.
function compareToNatal(natal, overlay) {
  if (!overlay || !natal) return null;

  const profileShifted = overlay.profile !== natal.profile;
  const crossShifted = overlay.incarnation_cross !== natal.incarnation_cross;
  const typeShifted = overlay.type !== natal.type;

  // Gate sets -- natal.gates and overlay.gates are arrays of integers
  const natalGateSet = new Set(natal.gates || []);
  const overlayGateSet = new Set(overlay.gates || []);

  // Scan HD_CHANNEL_PAIRS against both natal and overlay gate sets.
  // Natal gates carry forward into the cycle, so a channel is active when:
  //   - Both gates are new (from overlay) -- fully new channel
  //   - One gate is natal + partner arrives via overlay -- electromagnetic completion
  const seen = new Set();
  const fullyNewChannels = [];
  const electromagneticChannels = [];

  HD_CHANNEL_PAIRS.forEach(([a, b]) => {
    const aInNatal = natalGateSet.has(a);
    const bInNatal = natalGateSet.has(b);
    const aInOverlay = overlayGateSet.has(a);
    const bInOverlay = overlayGateSet.has(b);

    // Skip purely natal channels (both gates already natal, nothing new)
    if (aInNatal && bInNatal) return;

    // For electromagnetic completion: one gate must be natal, its partner must be in overlay
    // For fully new channel: both gates must be in overlay (neither is natal)
    if (aInNatal && !bInOverlay) return; // natal a, but b not arriving via overlay
    if (bInNatal && !aInOverlay) return; // natal b, but a not arriving via overlay
    if (!aInNatal && !aInOverlay) return; // a not natal and not in overlay -- absent
    if (!bInNatal && !bInOverlay) return; // b not natal and not in overlay -- absent

    const key = channelKey(a, b);
    if (seen.has(key)) return;
    seen.add(key);

    if (!aInNatal && !bInNatal) {
      // Layer 1: Both gates are new (in overlay, neither natal) -- fully new channel
      fullyNewChannels.push(key);
    } else {
      // Layer 2: One natal gate + one overlay gate -- electromagnetic completion
      const natalGate = aInNatal ? a : b;
      const overlayGate = aInNatal ? b : a;
      electromagneticChannels.push({ ch: key, natalGate, overlayGate });
    }
  });

  // Channel sets for releasing calculation (use API channels list)
  const natalChannelSet = new Set((natal.channels || []).map(c => String(c)));
  const overlayChannelSet = new Set((overlay.channels || []).map(c => String(c)));

  // Category 3: Natal channels not active at this overlay (per API)
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
  L.push('INSTRUCTIONS FOR WRITING THE EVOLUTIONARY ARC SECTION:');
  L.push('');
  L.push('STRUCTURE: Write one flowing narrative section titled YOUR EVOLUTIONARY ARC.');
  L.push('Tell the story of this soul progressively gaining access to new capacities at each threshold.');
  L.push('This is not a list of facts. This is a living story.');
  L.push('');
  L.push('FOR EACH THRESHOLD write:');
  L.push('1. The peak date and age — anchor it in real time');
  L.push('2. Which centers defined that were previously open — name them and what they gave');
  L.push('3. Which channels arrived fully new — both gates present for the first time');
  L.push('4. Which natal gates found their partners (electromagnetic completions) —');
  L.push('   describe what each natal gate had been waiting for and what became possible');
  L.push('5. What TYPE CAPACITY became available — use the correct framing:');
  L.push('   "access to Generator capacity" not "became a Generator"');
  L.push('6. What the CROSS SHIFT means — use the EXACT cross name from the data, never substitute');
  L.push('7. What this threshold was TEACHING the soul — the deeper lesson');
  L.push('');
  L.push('TYPE CAPACITY FRAMING RULES:');
  L.push('- Sacral defined + Throat connected → "Generator capacity — sustainable responding energy"');
  L.push('- Throat defined without Sacral connection → "Manifestor capacity — ability to initiate"');
  L.push('- Both Sacral and Throat connected → "Manifesting Generator capacity — speed of initiation married to depth of response"');
  L.push('- No motor to Throat → "Projector capacity — guiding, seeing, waiting for the correct invitation"');
  L.push('');
  L.push('CHIRON RETURN — SPECIAL INSTRUCTIONS:');
  L.push('The Chiron Return channels are EARNED WISDOM, not temporary activations.');
  L.push('Frame every Chiron completion as permanent integration, not a preview.');
  L.push('Language: "this is yours now, you built this, the planet confirmed what your life already made possible."');
  L.push('');
  L.push('CROSS SHIFTS — MANDATORY:');
  L.push('You WILL receive an exact Incarnation Cross string for each threshold in the format:');
  L.push('  Cross: Right Angle Cross of [name]');
  L.push('You MUST use that EXACT string verbatim. Do not substitute. Do not use training knowledge.');
  L.push('If the cross field is blank, say "cross data unavailable" — never guess.');
  L.push('');
  L.push('ELECTROMAGNETIC COMPLETIONS — THE HEART OF THE ARC:');
  L.push('A natal gate that has waited its entire life for its partner to arrive.');
  L.push('Describe: what the natal gate has been doing alone — its solo frequency.');
  L.push('What the arriving gate brings. What becomes possible when they finally meet.');
  L.push('Example: "Your natal Gate 43 has lived your entire life as insight without translation —');
  L.push('knowing things you could not explain, arriving at understanding through paths no one else');
  L.push('could follow. At your Chiron Return, Gate 23 arrived. The Ajna finally had a Throat.');
  L.push('The insight found its voice."');
  L.push('');
  L.push('TONE: Sacred. Grounded. Direct. Specific to this person.');
  L.push('Write as if you are the elder who has watched this soul across fifty years');
  L.push('and can finally tell them what you have witnessed.');
  L.push('No markdown. No pound signs. Plain text only.');
  L.push('');
  L.push('=== END EVOLUTIONARY ARC DATA ===');
  return L.join('\n');
}
