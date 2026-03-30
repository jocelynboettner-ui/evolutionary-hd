import express from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";
import { transformV3Response, formatV3HDChart } from "./hd-v3-parser.js";

const app = express();
app.use(cors());
app.use(express.json());

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const HD_AI_API_KEY = process.env.HD_AI_API_KEY;
const SACRED_CYCLES_URL = process.env.SACRED_CYCLES_URL || "http://localhost:8000";

// ============================================================
// SYSTEM PROMPT
// ============================================================
const SYSTEM_PROMPT = `You are a deeply wise Human Design guide specializing in evolutionary cycles and natal chart interpretation.

FORMATTING RULES — follow these exactly:
- Never use pound signs (#) for headers. Use ALL CAPS and blank lines to create visual separation instead.
- Never use markdown syntax of any kind (no **, no ##, no __, no backticks).
- Write in flowing, lyrical prose with occasional line breaks for rhythm.
- Use plain dashes (---) as section dividers between major sections.

CYCLE DATA RULES — critical:
- The transit cycle data you receive contains EXACT dates calculated from real planetary degrees.
- Always use the specific start, peak, and end dates provided. Never estimate from age.
- Always state the current phase (approaching / integration / complete) based on today's date.
- Connect each cycle to the person's specific gates, channels, and centers from their HD chart.

DATA RULES:
- ALL natal chart details come ONLY from the NATAL CHART DATA block.
- ALL transit cycle dates come ONLY from the TRANSIT CYCLE DATA block.
- NEVER say chart data is missing if it is present in the blocks.
- NEVER ask the user to go get their chart elsewhere — you have it.
- Use EVERY field: Type, Strategy, Authority, Profile, Cross, Definition, Channels, Gates.

READING STRUCTURE:

YOUR NATAL BLUEPRINT

Human Design Type: [type] — [2-3 sentences on what this means for how they move through life]

Strategy: [strategy] — [explain HOW to use it practically, what it feels like in the body]

Inner Authority: [authority] — [explain the exact decision-making mechanism, how to access it]

Profile: [profile] — [explain what these two numbers mean for their life role]

Incarnation Cross: [cross] — [their permanent life purpose, interpreted in depth, 3-4 sentences]

Definition: [definition] — [explain what this means for their energy flow and consistency]

Signature and Not-Self: When aligned — [signature]. When out of alignment — [not-self theme].

---

YOUR CHANNELS — THE BUILT-IN GIFTS

[For EACH channel listed in the data: write Channel [X-Y], name it if known, then 2-3 sentences on the consistent gift it gives this person.]

---

YOUR GATES — ACTIVE FREQUENCIES

[Pick 6-8 most significant gates. For each: Gate [number] — [name if known] — [2 sentences on what this frequency brings]]

---

YOUR CURRENT DEVELOPMENTAL CYCLE

[State the active cycle name, its exact window dates and peak date from the TRANSIT CYCLE DATA. State whether they are in approach phase or integration phase. Then write 4-5 rich paragraphs connecting this cycle to their specific channels, gates, and centers. Be precise, warm, and powerful. Reference exact dates from the data.]

---

LIVING IT NOW

Decision-Making in This Cycle: [connect their Inner Authority to how it operates during this window — 2 paragraphs]

What to Trust and Build On: [connect their specific channels and gates — 2 paragraphs]

What to Stay Curious About: [1 paragraph on what is opening up]

The Body's Intelligence: [1 paragraph connecting type and authority to somatic guidance]

---

THE INVITATION FORWARD

[Closing paragraph — the soul-level invitation of this moment for this specific person]

Tone: sacred, grounded, wise. Not clinical. Not generic. Speak to this specific person's design.

V3 CHART DATA ENHANCEMENTS — use all of these in your reading:

RETROGRADE PLANETS: If RETROGRADE PLANETS AT BIRTH is present in the natal data, reference each retrograde planet explicitly.
A retrograde planet at birth means its gate energy is deeply internalized — it works from inside out rather than expressing outward.
Saturn retrograde at birth makes the Saturn Return a reclamation of inner authority rather than outer achievement.
Chiron retrograde at birth makes the Chiron Return a profound inward healing journey, often felt before it is seen.

GENE KEYS: If GENE KEYS data is present, weave the Shadow/Gift/Siddhi arc into your reading.
The Shadow is the unconscious pattern this person is moving through. The Gift is the potential available now.
The Siddhi is the transcendent possibility of this gate when fully embodied.
For the cycle reading, emphasize which Gene Key shadows are being transformed and which gifts are emerging.

CIRCUIT DATA: If CIRCUIT BREAKDOWN is present, state which circuits are dominant in this person's chart.
Individual circuit: here to mutate and be uniquely themselves — not to belong, but to model new possibilities.
Collective circuit: here to share patterns and knowledge that benefit the larger group — what they carry is for the whole.
Tribal circuit: here to support and be supported — their energy is most alive within committed bonds and community.

VARIABLES / PHS: If VARIABLES data is present, include a short practical section on environment and digestion.
The Environment field tells this person what physical environment supports their nervous system and clarity.
The Digestion field tells them how their body processes food and information most efficiently.
Keep this section grounded and practical — these are body-level instructions, not metaphors.

When VARIABLES data is present, add a section titled:
BODY INTELLIGENCE AND ENVIRONMENT
Write 2-3 sentences connecting their Environment type and Digestion type to how they can best support themselves during this cycle.

---`;

// ============================================================
// PARSE DATE
// ============================================================
function parseDate(dateStr) {
  if (!dateStr) return null;
  const s = String(dateStr).trim();
  const MONTHS = { jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12 };
  let m;
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return { year: +m[1], month: +m[2], day: +m[3] };
  m = s.match(/^(\d{1,2})[-\/]([A-Za-z]{3,9})[-\/](\d{4})$/);
  if (m) { const mo = MONTHS[m[2].toLowerCase().slice(0,3)]; if (mo) return { year: +m[3], month: mo, day: +m[1] }; }
  m = s.match(/^([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})$/);
  if (m) { const mo = MONTHS[m[1].toLowerCase().slice(0,3)]; if (mo) return { year: +m[3], month: mo, day: +m[2] }; }
  m = s.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})$/);
  if (m) { const mo = MONTHS[m[2].toLowerCase().slice(0,3)]; if (mo) return { year: +m[3], month: mo, day: +m[1] }; }
  const d = new Date(s);
  if (!isNaN(d)) return { year: d.getUTCFullYear(), month: d.getUTCMonth()+1, day: d.getUTCDate() };
  return null;
}

// ============================================================
// TIMEZONE LOOKUP
// ============================================================
function getTimezone(location) {
  const loc = (location || '').toLowerCase();
  if (loc.includes('los angeles')||loc.includes('san francisco')||loc.includes('seattle')||loc.includes('portland')||loc.includes('phoenix')) return 'America/Los_Angeles';
  if (loc.includes('chicago')||loc.includes('dallas')||loc.includes('houston')||loc.includes('minneapolis')) return 'America/Chicago';
  if (loc.includes('denver')||loc.includes('salt lake')) return 'America/Denver';
  if (loc.includes('london')||loc.includes(' uk')||loc.includes('england')) return 'Europe/London';
  if (loc.includes('paris')||loc.includes('france')) return 'Europe/Paris';
  if (loc.includes('berlin')||loc.includes('germany')||loc.includes('amsterdam')) return 'Europe/Berlin';
  if (loc.includes('sydney')||loc.includes('melbourne')) return 'Australia/Sydney';
  if (loc.includes('tokyo')||loc.includes('japan')) return 'Asia/Tokyo';
  if (loc.includes('mumbai')||loc.includes('delhi')||loc.includes('india')) return 'Asia/Kolkata';
  return 'America/New_York';
}

// ============================================================
// FIX 1: FETCH REAL TRANSIT CYCLES from Swiss Ephemeris backend
// Geocodes location via Nominatim, then calls /transit-cycles
// Falls back to age-based calculation if backend unavailable
// ============================================================
async function fetchRealTransitCycles(birthdate, birthtime, location) {
  // Geocode the birthplace
  const geoRes = await fetch(
    'https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(location) + '&format=json&limit=1',
    { headers: { 'User-Agent': 'SacredCyclesApp/1.0' } }
  );
  const geoData = await geoRes.json();
  if (!geoData.length) throw new Error('Could not geocode: "' + location + '"');
  const latitude  = parseFloat(geoData[0].lat);
  const longitude = parseFloat(geoData[0].lon);
  const timezone  = getTimezone(location);

  console.log('Geocoded', location, '->', latitude, longitude);

  const transitRes = await fetch(SACRED_CYCLES_URL + '/transit-cycles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      date: birthdate,
      time: birthtime || '12:00',
      latitude,
      longitude,
      timezone,
    }),
  });

  if (!transitRes.ok) {
    const err = await transitRes.json().catch(() => ({}));
    throw new Error(err.detail || 'Transit calculation failed: ' + transitRes.status);
  }

  const data = await transitRes.json();
  console.log('Real transit cycles received - chiron peak:', data.chironReturn?.peak);
  return data;
}


// ============================================================
// FETCH TRANSIT ACTIVATIONS from Python backend
// Finds channels lit up by today's transits against natal chart
// ============================================================
async function fetchTransitActivations(hdChart, cycles) {
  const today = new Date();
  let activeCycle = cycles.chironReturn;
  const allKeys = ['saturnReturn', 'uranusOpposition', 'chironReturn'];
  for (const key of allKeys) {
    const c = cycles[key];
    if (c && c.start && c.end) {
      if (today >= new Date(c.start) && today <= new Date(c.end)) {
        activeCycle = c;
        break;
      }
    }
  }
  if (!activeCycle || !activeCycle.start || !activeCycle.end) {
    throw new Error('No active cycle found');
  }
  const res = await fetch(SACRED_CYCLES_URL + '/transit-activations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      natal_gates:           hdChart.gates || [],
      natal_defined_centers: hdChart.defined_centers || [],
      cycle_start:           activeCycle.start,
      cycle_end:             activeCycle.end,
      reading_date:          new Date().toISOString().split('T')[0],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Transit activation failed: ' + res.status);
  }
  const data = await res.json();
  console.log('Transit activations received:', data.raw?.activated_channels?.length, 'channels');
  return data.prompt_text;
}

// ============================================================
// FALLBACK: age-based transit cycle calculation
// Used when Swiss Ephemeris backend is unavailable
// ============================================================
function calculateTransitCyclesFallback(birthdate) {
  const parsed = parseDate(birthdate);
  if (!parsed) return {};
  const { year, month, day } = parsed;
  const birthTs = new Date(year, month - 1, day);
  const addYears = (y) => {
    const d = new Date(birthTs);
    const whole = Math.floor(y);
    const frac = Math.round((y - whole) * 12);
    d.setFullYear(d.getFullYear() + whole);
    d.setMonth(d.getMonth() + frac);
    return d.toISOString().split('T')[0];
  };
  return {
    saturnReturn:       { start: addYears(26),   peak: addYears(29.5), end: addYears(33)   },
    uranusOpposition:   { start: addYears(38.5), peak: addYears(42),   end: addYears(45.5) },
    chironReturn:       { start: addYears(46.5), peak: addYears(50),   end: addYears(53.5) },
    secondSaturnReturn: { start: addYears(55.5), peak: addYears(59),   end: addYears(62.5) },
    _source: 'age-based-fallback',
  };
}

// ============================================================
// FIX 2: FORMAT TRANSIT CYCLES with exact dates and current phase
// ============================================================
function formatTransitCycles(cycles) {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const isFallback = cycles._source === 'age-based-fallback';

  function describePhase(cycle, name) {
    if (!cycle?.peak) return name + ': data unavailable';
    const start = new Date(cycle.start);
    const peak  = new Date(cycle.peak);
    const end   = new Date(cycle.end);
    let phase;
    if (today < start)      phase = 'has not yet begun';
    else if (today < peak)  phase = 'is currently in the APPROACH PHASE (building toward peak)';
    else if (today <= end)  phase = 'is in the INTEGRATION PHASE (peak has passed, embodying the lessons)';
    else                    phase = 'has completed';

    const fmt = (d) => d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    let line = name + ': Window ' + fmt(start) + ' to ' + fmt(end) + ' | Peak: ' + fmt(peak) + ' | Status: This cycle ' + phase;
    if (cycle.natal_degree) line += ' | Natal degree: ' + parseFloat(cycle.natal_degree).toFixed(2) + '°';
    if (cycle.peak_transit_degree) line += ' | Peak transit degree: ' + parseFloat(cycle.peak_transit_degree).toFixed(2) + '°';
    return line;
  }

  // Find which cycle is currently active
  const allCycles = [
    { key: 'saturnReturn',       label: 'Saturn Return (The Becoming Cycle)' },
    { key: 'uranusOpposition',   label: 'Uranus Opposition (The Reorientation Cycle)' },
    { key: 'chironReturn',       label: 'Chiron Return (The Flowering Cycle)' },
    { key: 'secondSaturnReturn', label: 'Second Saturn Return (The Legacy Cycle)' },
  ];
  let activeCycleLabel = 'none currently active';
  for (const { key, label } of allCycles) {
    const c = cycles[key];
    if (c?.start && c?.end) {
      if (today >= new Date(c.start) && today <= new Date(c.end)) {
        activeCycleLabel = label;
        break;
      }
    }
  }

  return `
=== TRANSIT CYCLE DATA (${isFallback ? 'age-based estimate' : 'calculated from real planetary degrees'}) ===
TODAY: ${todayStr}
CURRENTLY ACTIVE CYCLE: ${activeCycleLabel}
IMPORTANT: Use only these exact dates in your reading. Never estimate cycles from age. State the current phase explicitly.

${describePhase(cycles.saturnReturn,       'Saturn Return')}
${describePhase(cycles.uranusOpposition,   'Uranus Opposition')}
${describePhase(cycles.chironReturn,       'Chiron Return')}
${describePhase(cycles.secondSaturnReturn || cycles.second_saturn_return, 'Second Saturn Return')}
=== END TRANSIT CYCLE DATA ===
`;
}

// ============================================================
// FETCH HD CHART from humandesign.ai v3
// ============================================================
async function fetchHumanDesign(birthdate, birthtime, location) {
  const timezone = getTimezone(location);
  const parsed = parseDate(birthdate);
  if (!parsed) throw new Error('Could not parse birth date: ' + birthdate);
  const { year, month, day } = parsed;
  const timeParts = (birthtime || '12:00').match(/^(\d{1,2}):(\d{2})/);
  const hour   = String(timeParts ? +timeParts[1] : 12).padStart(2, '0');
  const minute = String(timeParts ? +timeParts[2] : 0).padStart(2, '0');
  const isoDate = year + '-' + String(month).padStart(2,'0') + '-' + String(day).padStart(2,'0') + 'T' + hour + ':' + minute + ':00';
  const params = new URLSearchParams({ date: isoDate, timezone, api_key: HD_AI_API_KEY });
  const url = 'https://api.humandesign.ai/v3/hd-data?' + params.toString();
  console.log('Fetching HD chart, date:', isoDate, 'tz:', timezone);
  const response = await fetch(url, { method: 'GET', headers: { 'X-Api-Key': HD_AI_API_KEY } });
  const responseText = await response.text();
  if (!response.ok) throw new Error('humandesign.ai error ' + response.status + ': ' + responseText.slice(0,200));
  return transformV3Response(JSON.parse(responseText));
}


// formatHDChart delegates to the v3 parser's formatV3HDChart
function formatHDChart(data) {
  return formatV3HDChart(data);
}// ============================================================
// CHAT ENDPOINT
// ============================================================
app.post("/api/chat", async (req, res) => {
  const { messages, birthdata } = req.body;
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: "messages array required" });

  let augmentedMessages = [...messages];

  if (birthdata && birthdata.birthdate) {
    let chartText = '';

    let hdChart = null; // hoisted for use in transit activations
    // Fetch HD chart
    try {
      if (birthdata.birthtime && birthdata.location) {
        hdChart = await fetchHumanDesign(birthdata.birthdate, birthdata.birthtime, birthdata.location);
        chartText += formatHDChart(hdChart);
        console.log('HD chart injected - type:', hdChart.type);
      }
    } catch (err) {
      console.error('HD chart error:', err.message);
      chartText += '[HD CHART ERROR: ' + err.message + ']\n';
    }

    // FIX 3: Try real Swiss Ephemeris backend first, fall back to age-based
    try {
      if (birthdata.birthtime && birthdata.location) {
        const cycles = await fetchRealTransitCycles(birthdata.birthdate, birthdata.birthtime, birthdata.location);
        chartText += formatTransitCycles(cycles);
        console.log('Real transit cycles injected - chiron peak:', cycles.chironReturn?.peak);
      // Fetch transit activations (today's planetary gates vs natal chart)
      try {
        if (hdChart) {
          const activationText = await fetchTransitActivations(hdChart, cycles);
          chartText += activationText;
          console.log('Transit activations injected');
        }
      } catch (activErr) {
        console.error('Activation error:', activErr.message);
        chartText += '\nTRANSIT ACTIVATIONS: Unavailable\n';
      }
      } else {
        throw new Error('Missing birthtime or location for real transit calculation');
      }
    } catch (err) {
      console.error('Real transit failed, using fallback:', err.message);
      const cycles = calculateTransitCyclesFallback(birthdata.birthdate);
      chartText += formatTransitCycles(cycles);
      console.log('Fallback transit cycles injected');
    }

    if (chartText) {
      const lastMsg = augmentedMessages[augmentedMessages.length - 1];
      if (lastMsg?.role === 'user') {
        augmentedMessages[augmentedMessages.length - 1] = {
          ...lastMsg,
          content: chartText + '\n\n' + lastMsg.content,
        };
      }
    }
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-5",
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: augmentedMessages,
    });
    stream.on('text', (text) => { res.write('data: ' + JSON.stringify({ text }) + '\n\n'); });
    stream.on('message', () => { res.write('data: [DONE]\n\n'); res.end(); });
    stream.on('error', (err) => { res.write('data: ' + JSON.stringify({ error: err.message }) + '\n\n'); res.end(); });
  } catch (err) {
    res.write('data: ' + JSON.stringify({ error: err.message }) + '\n\n');
    res.end();
  }
});

app.post("/api/debug-hd", async (req, res) => {
  const { birthdate, birthtime, location } = req.body;
  try {
    const chart = await fetchHumanDesign(birthdate || '1973-09-30', birthtime || '05:07', location || 'Reading, PA');
    const cycles = calculateTransitCyclesFallback(birthdate || '1973-09-30');
    res.json({ ok: true, chart, cycles, cycleText: formatTransitCycles(cycles) });
  } catch (err) {
    res.json({ error: err.message });
  }
});


app.post("/api/raw-v3", async (req, res) => {
  const { birthdate, birthtime, location } = req.body;
  const timezone = getTimezone(location || "Reading, PA");
  const parsed = parseDate(birthdate || "1973-09-30");
  const { year, month, day } = parsed;
  const tp = (birthtime || "05:07").match(/^(\d{1,2}):(\d{2})/);
  const hour = String(tp ? +tp[1] : 5).padStart(2,"0");
  const minute = String(tp ? +tp[2] : 7).padStart(2,"0");
  const isoDate = year+"-"+String(month).padStart(2,"0")+"-"+String(day).padStart(2,"0")+"T"+hour+":"+minute+":00";
  const url = "https://api.humandesign.ai/v3/hd-data?date="+isoDate+"&timezone="+timezone+"&api_key="+HD_AI_API_KEY;
  const response = await fetch(url, { headers: { "X-Api-Key": HD_AI_API_KEY } });
  const raw = await response.json();
  // Return just the top-level keys and structure, not the full blob
  const topKeys = Object.keys(raw);
  const propKeys = raw.Properties ? Object.keys(raw.Properties) : [];
  const personalityType = Array.isArray(raw.Personality) ? "array["+raw.Personality.length+"]" : (typeof raw.Personality);
  const designType = Array.isArray(raw.Design) ? "array["+raw.Design.length+"]" : (typeof raw.Design);
  const firstPersonality = Array.isArray(raw.Personality) ? raw.Personality[0] : (raw.Properties?.Personality?.[0] || null);
  const crossRaw = raw.IncarnationCross || raw.Properties?.IncarnationCross;
  const varsRaw = raw.Variables || raw.Properties?.Variables;
  res.json({ topKeys, propKeys, personalityType, designType, firstPersonality, crossRaw, varsRaw });
});

app.get("/health", (_req, res) => res.json({ ok: true }));
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
