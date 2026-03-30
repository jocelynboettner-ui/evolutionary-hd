// hd-evolutionary-arc.js
// Generates overlay charts for all four cycle peaks:
//   Uranus Opposition, Chiron Return, 1st Saturn Return, 2nd Saturn Return
// Each chart is cast using: date=exact peak, time=birth time, timezone=birth timezone

import { transformV3Response } from './hd-v3-parser.js';

const HD_API_BASE = 'https://api.humandesign.ai';

// ── Fetch a single overlay chart for a peak date ────────────────
async function fetchOverlayChart(peakDate, birthtime, timezone, apiKey) {
  if (!peakDate) return null;
  // Use full datetime directly if available (peak_datetime from Python service)
  // Fall back to date + birth time if only a date string (e.g. from humandesign.ai exactDate)
  let isoDate;
  if (String(peakDate).includes('T')) {
    isoDate = peakDate;  // Already has time component
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
    console.warn('Overlay chart failed for ' + dateOnly + ': ' + res.status);
    return null;
  }
  const raw = await res.json();
  return transformV3Response(raw);
}

// ── Compare overlay chart to natal ──────────────────────────────
function compareToNatal(natal, overlay) {
  if (!overlay || !natal) return null;
  const profileShifted = overlay.profile !== natal.profile;
  const crossShifted   = overlay.incarnation_cross !== natal.incarnation_cross;
  const typeShifted    = overlay.type !== natal.type;

  const natalChSet   = new Set((natal.channels   || []).map(c => String(c)));
  const overlayChSet = new Set((overlay.channels || []).map(c => String(c)));
  const newChannels  = [...overlayChSet].filter(c => !natalChSet.has(c));
  const lostChannels = [...natalChSet].filter(c => !overlayChSet.has(c));

  const natalDefSet    = new Set(natal.defined_centers   || []);
  const overlayDefSet  = new Set(overlay.defined_centers || []);
  const newlyDefined   = [...overlayDefSet].filter(c => !natalDefSet.has(c));
  const newlyOpen      = [...natalDefSet].filter(c => !overlayDefSet.has(c));

  const natalRetroCount   = (natal.retrogrades   || []).length;
  const overlayRetroCount = (overlay.retrogrades || []).length;

  return {
    typeShifted,
    profileShifted,
    crossShifted,
    newChannels,
    lostChannels,
    newlyDefined,
    newlyOpen,
    natalRetroCount,
    overlayRetroCount,
    definitionExpanding: newlyDefined.length > newlyOpen.length,
  };
}

// ── Master function: fetch all four overlay charts in parallel ───
export async function fetchEvolutionaryArc(birthtime, timezone, natalChart, pythonCycles, hdaiSaturnReturns) {
  const apiKey = process.env.HD_AI_API_KEY;

  // Collect peak dates from both data sources
  // pythonCycles: from /transit-cycles — has saturnReturn.peak, chironReturn.peak, uranusOpposition.peak
  // hdaiSaturnReturns: from humandesign.ai /saturn-return — has allReturns[].ExactDate
  const pythonSaturnPeak  = pythonCycles?.saturnReturn?.peak       || null;
  const pythonUranusP     = pythonCycles?.uranusOpposition?.peak   || null;
  const pythonChironP     = pythonCycles?.chironReturn?.peak       || null;
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
    saturnReturn1:    saturn1Peak,
    uranusOpposition: pythonCycles?.uranusOpposition?.peak_datetime || pythonCycles?.uranusOpposition?.peak || null,
    chironReturn:     pythonCycles?.chironReturn?.peak_datetime     || pythonCycles?.chironReturn?.peak     || null,
    saturnReturn2:    saturn2Peak
      || pythonCycles?.second_saturn_return?.peak_datetime
      || pythonCycles?.secondSaturnReturn?.peak_datetime
      || null,
  };
  console.log('Fetching evolutionary arc peaks:', peaks);

  const [s1, ur, ch, s2] = await Promise.allSettled([
    fetchOverlayChart(peaks.saturnReturn1,    birthtime, timezone, apiKey),
    fetchOverlayChart(peaks.uranusOpposition, birthtime, timezone, apiKey),
    fetchOverlayChart(peaks.chironReturn,     birthtime, timezone, apiKey),
    fetchOverlayChart(peaks.saturnReturn2,    birthtime, timezone, apiKey),
  ]);

  const unwrap = r => r.status === 'fulfilled' ? r.value : null;

  return {
    saturnReturn1:    { peakDate: peaks.saturnReturn1,    chart: unwrap(s1), delta: compareToNatal(natalChart, unwrap(s1)) },
    uranusOpposition: { peakDate: peaks.uranusOpposition, chart: unwrap(ur), delta: compareToNatal(natalChart, unwrap(ur)) },
    chironReturn:     { peakDate: peaks.chironReturn,     chart: unwrap(ch), delta: compareToNatal(natalChart, unwrap(ch)) },
    saturnReturn2:    { peakDate: peaks.saturnReturn2,    chart: unwrap(s2), delta: compareToNatal(natalChart, unwrap(s2)) },
  };
}

// ── Format arc for Claude prompt injection ───────────────────────
export function formatEvolutionaryArcForPrompt(arc, natalChart) {
  const L = [];

  L.push('=== EVOLUTIONARY ARC DATA ===');
  L.push('');
  L.push('This section shows an overlay chart cast at the exact peak date of each');
  L.push('developmental cycle, using the same birth time and timezone. Each overlay');
  L.push('reveals which frequencies are available at that threshold — who this person');
  L.push('is becoming, not just who they are. Use this data to write an EVOLUTIONARY');
  L.push('ARC section in the reading.');
  L.push('');

  // Natal baseline
  L.push('NATAL BASELINE');
  L.push('Type:    ' + (natalChart.type || ''));
  L.push('Profile: ' + (natalChart.profile || ''));
  L.push('Cross:   ' + (natalChart.incarnation_cross || ''));
  L.push('Defined: ' + (natalChart.defined_centers || []).join(', '));
  L.push('Channels: ' + (natalChart.channels || []).join(', '));
  L.push('');

  const cycleOrder = [
    { key: 'saturnReturn1',    label: '1ST SATURN RETURN (~Age 29)' },
    { key: 'uranusOpposition', label: 'URANUS OPPOSITION (~Age 41)' },
    { key: 'chironReturn',     label: 'CHIRON RETURN (~Age 50)'     },
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
    L.push('  Type:      ' + (chart.type || ''));
    L.push('  Profile:   ' + (chart.profile || ''));
    L.push('  Cross:     ' + (chart.incarnation_cross || ''));
    L.push('  Defined:   ' + (chart.defined_centers || []).join(', '));
    L.push('  Channels:  ' + (chart.channels || []).join(', '));
    L.push('');
    if (delta) {
      if (delta.typeShifted)    L.push('  TYPE SHIFT: ' + natalChart.type + ' to ' + chart.type + ' — address this directly');
      if (delta.profileShifted) L.push('  PROFILE SHIFT: ' + natalChart.profile + ' to ' + chart.profile);
      if (delta.crossShifted)   L.push('  CROSS SHIFT: ' + natalChart.incarnation_cross + ' to ' + chart.incarnation_cross);
      if (delta.newChannels.length)  L.push('  NEW CHANNELS: ' + delta.newChannels.join(', '));
      if (delta.lostChannels.length) L.push('  RELEASING: ' + delta.lostChannels.join(', '));
      if (delta.newlyDefined.length) L.push('  NEWLY DEFINED CENTERS: ' + delta.newlyDefined.join(', '));
      if (delta.newlyOpen.length)    L.push('  RELEASING DEFINITION: ' + delta.newlyOpen.join(', '));
      if (delta.definitionExpanding) L.push('  DIRECTION: More of the vehicle coming online');
      if (delta.overlayRetroCount !== delta.natalRetroCount) {
        const dir = delta.overlayRetroCount > delta.natalRetroCount ? 'more internalized' : 'more outward-expressing';
        L.push('  RETROGRADE SHIFT: ' + delta.natalRetroCount + ' natal retrogrades vs ' + delta.overlayRetroCount + ' at this peak (' + dir + ')');
      }
    }
    L.push('');
  });

  L.push('---');
  L.push('INSTRUCTION FOR CLAUDE:');
  L.push('After the LIVING IT NOW section, add a section titled YOUR EVOLUTIONARY ARC.');
  L.push('Tell the story of this soul progressively incarnating more fully at each threshold.');
  L.push('For each threshold:');
  L.push('  1. Name it and its exact peak date');
  L.push('  2. Describe what shifted — Type, Profile, Cross, new channels, new centers');
  L.push('  3. Interpret what each shift means for their lived experience');
  L.push('  4. Connect the arc to their natal design and current cycle');
  L.push('  5. Name the direction of travel — where is this soul heading?');
  L.push('Write in the same sacred, grounded, prose style. No markdown. No pound signs.');
  L.push('This section should feel like watching a soul remember itself across time.');
  L.push('');
  L.push('=== END EVOLUTIONARY ARC DATA ===');

  return L.join('\n');
}
