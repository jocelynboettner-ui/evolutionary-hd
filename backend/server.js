import express from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";
import { transformV3Response, formatV3HDChart } from "./hd-v3-parser.js";
import { fetchEvolutionaryArc, formatEvolutionaryArcForPrompt } from "./hd-evolutionary-arc.js";
import { fileURLToPath } from 'url';
import path from 'path';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

---

CRITICAL — TYPE AND OVERLAY FRAMING:
When describing evolutionary arc thresholds, NEVER say a person "became" a different type.
Type does not change. What changes is which centers are defined and which channels are active.

CORRECT framing: "At your Saturn Return, your Sacral center defined and your Throat connected — giving you access to Generator-like capacity: the ability to respond with sustainable power, to build momentum through engagement, to work with an energy that regenerates through doing. You were not a Generator. But you had Generator tools in your hands for the first time. And some of what you learned to build with those tools, you never put down."

WRONG framing: "You became a Generator at your Saturn Return." / "Your type shifted to Manifestor." / "You were a Projector but turned into a Manifesting Generator."

The overlay chart shows OPERATING CAPACITY — the skills and abilities available at that threshold — not a type change. Use this language consistently:
- "you had access to [type] capacity"
- "you were operating with [type] skills"
- "the [type] tools were in your hands"
- "you could move like a [type]"
- "[center] defining gave you [type] abilities"

CRITICAL — CHIRON RETURN ACTIVATIONS ARE PERMANENT WISDOM:
The channels that complete during the Chiron Return are categorically different from transit activations or Saturn/Uranus overlay completions.
Transit activations (daily) → temporary, pass when planet moves on
Saturn/Uranus completions → temporary at the peak moment, a preview
Chiron Return completions → initiatory — the planetary alignment opens the door, but what passes through that door is earned and stays

The Chiron Return does not give a person something new. It reveals what fifty years of living has already built in them. The channels that complete at the Chiron peak are not transiting gifts — they are earned capacities finally finding their circuit.

Use this language for Chiron completions: "This channel did not arrive as a gift from the sky. It arrived as a recognition — the universe confirming what fifty years of living had already made possible in you. The planetary alignment opened the door, but you built what walked through it."

METAPHOR GUIDANCE — use embodied, tool-based metaphors:
Good metaphors for cycle overlays:
- "Like being handed a set of tools you had never carried before"
- "The craftsperson doesn't change — the toolkit expands"
- "You learned to use the drill, the level, the saw. When they were returned, the skill remained."
- "The instrument was borrowed. The music you learned to play on it was yours."
- "You wore a different coat for seven years. When you took it off, your body had changed to fit the cold."

For Chiron specifically:
- "The wound was the apprenticeship. The Chiron Return is the graduation."
- "You did not receive medicine. You became it."
- "The crack in the foundation became the spring. What broke you open became the place you now offer water from."

CRITICAL — INCARNATION CROSS RULE:
In the EVOLUTIONARY ARC section, each cycle threshold contains a line in the format:
  Cross: Right Angle Cross of [name]
and possibly:
  CROSS SHIFT: [natal cross] -> [cycle cross]
You MUST use the EXACT cross string provided in that field — verbatim, character for character.
Do NOT substitute your own knowledge of what cross this person has.
Do NOT use the natal cross for a cycle threshold that shows a different cross.
If the Cross field for a threshold is blank or missing, write "cross data unavailable" — never guess or infer.
The cycle cross and the natal cross are different things. Treat each threshold's cross as its own discrete data point.`;

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
async function fetchTransitActivations(hdChart, cycles, overlayCross = null) {
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
      overlay_cross:         overlayCross,
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
  res.setTimeout(120000, () => {
    res.write('data: ' + JSON.stringify({
      error: "Reading is taking longer than expected. Please try again."
    }) + '\n\n');
    res.end();
  });

  const { messages, birthdata } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages array required" });
  }

  let augmentedMessages = [...messages];

  if (birthdata && birthdata.birthdate) {
    let chartText = '';
    let hdChart = null;
    let cycles = null;

    // ── GROUP 1: Fast parallel fetch (~2-3s) ──
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
      [hdChart, cycles] = await Promise.all([
        (birthdata.birthtime && birthdata.location)
          ? fetchHumanDesign(birthdata.birthdate, birthdata.birthtime, birthdata.location)
              .catch(err => { console.error('HD chart error:', err.message); return null; })
          : Promise.resolve(null),

        (birthdata.birthtime && birthdata.location)
          ? fetchRealTransitCycles(birthdata.birthdate, birthdata.birthtime, birthdata.location)
              .catch(err => { console.error('Cycles error:', err.message); return null; })
          : Promise.resolve(null),
      ]);

      if (hdChart) chartText += formatHDChart(hdChart);
      if (cycles)  chartText += formatTransitCycles(cycles);
      if (!cycles) {
        cycles = calculateTransitCyclesFallback(birthdata.birthdate);
        chartText += formatTransitCycles(cycles);
      }
    } catch (err) {
      console.error('Group 1 error:', err.message);
    }

    // ── GROUP 2: Start slow fetches in background ──
    const group2Promise = (hdChart && cycles)
      ? Promise.all([
          (() => {
            try {
              const timezone = getTimezone(birthdata.location);
              return fetchEvolutionaryArc(
                birthdata.birthtime, timezone, hdChart, cycles, null
              ).catch(err => { console.error('Arc error:', err.message); return null; });
            } catch (err) {
              console.error('getTimezone error:', err.message);
              return Promise.resolve(null);
            }
          })(),
          fetchTransitActivations(hdChart, cycles, null)
            .catch(err => { console.error('Activations error:', err.message); return null; }),
        ]).catch(err => { console.error('Group 2 error:', err.message); return [null, null]; })
      : Promise.resolve([null, null]);

    // ── Inject natal chart into message ──
    if (chartText) {
      const lastMsg = augmentedMessages[augmentedMessages.length - 1];
      if (lastMsg?.role === 'user') {
        augmentedMessages[augmentedMessages.length - 1] = {
          ...lastMsg,
          content: chartText + '\n\n' + lastMsg.content,
        };
      }
    }

    // ── Stream 1: Natal blueprint ──
    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-5",
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: augmentedMessages,
    });

    let fullText = '';

    stream.on('text', (text) => {
      fullText += text;
      res.write('data: ' + JSON.stringify({ text }) + '\n\n');
    });

    stream.on('message', async () => {
      try {
        const [arc, activationText] = await group2Promise;

        if (arc || activationText) {
          let arcChartText = '';

          if (arc) {
            console.log('ARC CROSSES:', {
              saturn1: arc?.saturnReturn1?.chart?.incarnation_cross,
              uranus:  arc?.uranusOpposition?.chart?.incarnation_cross,
              chiron:  arc?.chironReturn?.chart?.incarnation_cross,
            });
            arcChartText += '\n' + formatEvolutionaryArcForPrompt(arc, hdChart);
          }

          if (activationText) arcChartText += '\n' + activationText;

          if (arcChartText) {
            const arcMessages = [
              ...augmentedMessages,
              { role: 'assistant', content: fullText },
              {
                role: 'user',
                content: arcChartText + '\n\nNow write YOUR EVOLUTIONARY ARC and YOUR EVOLUTIONARY ACTIVATION sections based on the data above. Same voice, same style. No markdown. No pound signs.',
              },
            ];

            const arcStream = anthropic.messages.stream({
              model: "claude-sonnet-4-5",
              max_tokens: 8000,
              system: SYSTEM_PROMPT,
              messages: arcMessages,
            });

            arcStream.on('text', (text) => {
              res.write('data: ' + JSON.stringify({ text }) + '\n\n');
            });
            arcStream.on('message', () => { res.write('data: [DONE]\n\n'); res.end(); });
            arcStream.on('error', (err) => {
              console.error('Arc stream error:', err.message);
              res.write('data: [DONE]\n\n'); res.end();
            });
            return;
          }
        }
      } catch (err) {
        console.error('Group 2 completion error:', err.message);
      }
      res.write('data: [DONE]\n\n');
      res.end();
    });

    stream.on('error', (err) => {
      res.write('data: ' + JSON.stringify({ error: err.message }) + '\n\n');
      res.end();
    });

  } else {
    // ── No birth data — regular chat ──
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
      const stream = anthropic.messages.stream({
        model: "claude-sonnet-4-5",
        max_tokens: 16000,
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


app.post("/api/debug-raw", async (req, res) => {
  const { birthdate, birthtime, location } = req.body;
  try {
    const timezone = getTimezone(location || 'Reading, PA');
    const parsed = parseDate(birthdate || '1973-09-30');
    const { year, month, day } = parsed;
    const timeParts = (birthtime || '05:07').match(/^(\d{1,2}):(\d{2})/);
    const hour = String(timeParts ? +timeParts[1] : 5).padStart(2, '0');
    const minute = String(timeParts ? +timeParts[2] : 0).padStart(2, '0');
    const isoDate = year + '-' + String(month).padStart(2,'0') + '-' + String(day).padStart(2,'0') + 'T' + hour + ':' + minute + ':00';
    const params = new URLSearchParams({ date: isoDate, timezone, api_key: HD_AI_API_KEY });
    const url = 'https://api.humandesign.ai/v3/hd-data?' + params.toString();
    const response = await fetch(url, { headers: { 'X-Api-Key': HD_AI_API_KEY } });
    const raw = await response.json();
    // Return just the channels-related fields from the raw v3 response
    const P = raw?.Properties || {};
    res.json({
      ok: true,
      channels_raw: P?.Channels,
      defined_centers_raw: P?.DefinedCenters,
      type_raw: P?.Type,
      profile_raw: P?.Profile,
      cross_raw: raw?.IncarnationCross || P?.IncarnationCross,
      isoDate,
      full_raw: raw
    });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// Serve React frontend
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

app.get("/health", (_req, res) => res.json({ ok: true }));
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
