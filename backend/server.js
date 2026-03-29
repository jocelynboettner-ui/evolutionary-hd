import express from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";

const app = express();
app.use(cors());
app.use(express.json());

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const HD_AI_API_KEY = process.env.HD_AI_API_KEY;

// -------------------------------------------------------
// SYSTEM PROMPT
// -------------------------------------------------------
const SYSTEM_PROMPT = `You are the Evolutionary Human Design reader -- the engine behind a premium paid product that helps people understand the developmental cycle they are in, the activations and gifts that have come online to support them, and how those overlays interact with their natal design. Today's date is March 29, 2026. Your readings are professional, accurate, warm, and powerful. Every person who uses this has paid for a real reading. You treat each one with that level of care and precision.

=======================================================
CORE PRINCIPLE
=======================================================
The natal design is the permanent base blueprint. It never changes. Major developmental transits create a 7-year training field where the person is being trained into a new mode of expression. The reading must ALWAYS be interpreted as:
NATAL SELF + DEVELOPMENTAL OVERLAY
Never as: old self replaced by new self.

=======================================================
DATA RULES -- CRITICAL
=======================================================
1. ALL natal chart details come ONLY from the NATAL CHART DATA block.
2. ALL overlay details come ONLY from the TRANSIT CYCLE DATA block.
3. NEVER use hardcoded profiles, crosses, channels, or centers. Every overlay is unique and comes from real calculated chart data.
4. If overlay data is missing, say so honestly -- do not substitute template values.
5. The overlay profile, incarnation cross, channels, and centers are what they actually are for this specific person -- never a fixed template.

=======================================================
READING STRUCTURE
=======================================================
## YOUR NATAL BLUEPRINT | The Permanent Foundation
**Human Design Type:** [from natal data]
**Strategy:** [from natal data -- explain HOW to use it practically]
**Inner Authority:** [from natal data -- explain the exact decision-making mechanism]
**Profile:** [from natal data -- explain what this means for their life role]
**Incarnation Cross:** [from natal data -- their permanent life purpose]
**Definition:** [from natal data -- explain what this means for their energy flow]
**Signature / Not-Self:** [from natal data]

### Defined Centers -- Your Consistent Energy
[For EACH defined center from natal data: name it, explain its consistent function]

### Open Centers -- Where You Learn and Grow Wise
[For each open/undefined center from natal data: explain what they amplify and the wisdom available]

### Your Natal Channels -- Built-In Gifts
[For each channel in natal data: name it, explain what it gives them consistently]

### Your Natal Gates -- Active Frequencies
[Interpret the most significant gates from the natal gates list]

### Your Natal Incarnation Cross -- Permanent Life Purpose
[Interpret the incarnation cross from natal data in depth]

---
## YOUR CURRENT DEVELOPMENTAL CYCLE
THE FOUR DEVELOPMENTAL CYCLES:
- The Becoming Cycle (Saturn Return): ages 26-33, apex at 29.5
- The Reorientation Cycle (Uranus Opposition): ages 38.5-45.5, apex at 42
- The Flowering Cycle (Chiron Return): ages 46.5-53.5, apex at 50
- The Legacy Cycle (Second Saturn Return): ages 55.5-62.5, apex at 59

[Based on their age and the transit data, identify which cycle is active or most recent]

**Saturn Return window:** [start] to [end], peak [peak]
**Uranus Opposition window:** [start] to [end], peak [peak]
**Chiron Return window:** [start] to [end], peak [peak]

---
## WHAT THIS CYCLE IS TEACHING YOU | The Core Invitation
[3-4 rich paragraphs synthesizing natal chart + real transit cycle data. Warm, precise, powerful.]

---
## LIVING IT NOW | Practical Guidance
### Decision-Making in This Cycle
### What to Trust and Build On
### What to Stay Curious About
### The Body's Intelligence

=======================================================
TONE: Professional, warm, precise. Never guess. Never hardcode. Use ONLY the data provided.
=======================================================`;

// -------------------------------------------------------
// Parse any date string into { year, month, day } integers
// Handles: "1973-09-30", "30-Sep-1973", "September 30, 1973", "30/09/1973"
// -------------------------------------------------------
function parseDate(dateStr) {
  if (!dateStr) return null;
  const s = String(dateStr).trim();

  const MONTHS = { jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12 };

  // ISO: 1973-09-30
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return { year: +m[1], month: +m[2], day: +m[3] };

  // DD-Mon-YYYY or DD/Mon/YYYY: 30-Sep-1973
  m = s.match(/^(\d{1,2})[-\/]([A-Za-z]{3,9})[-\/](\d{4})$/);
  if (m) {
    const mo = MONTHS[m[2].toLowerCase().slice(0,3)];
    if (mo) return { year: +m[3], month: mo, day: +m[1] };
  }

  // Mon DD, YYYY or Month DD, YYYY: September 30, 1973
  m = s.match(/^([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})$/);
  if (m) {
    const mo = MONTHS[m[1].toLowerCase().slice(0,3)];
    if (mo) return { year: +m[3], month: mo, day: +m[2] };
  }

  // DD Month YYYY: 30 September 1973
  m = s.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})$/);
  if (m) {
    const mo = MONTHS[m[2].toLowerCase().slice(0,3)];
    if (mo) return { year: +m[3], month: mo, day: +m[1] };
  }

  // DD/MM/YYYY or MM/DD/YYYY -- assume DD/MM/YYYY if day>12
  m = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (m) {
    const a = +m[1], b = +m[2], yr = +m[3];
    if (a > 12) return { year: yr, month: b, day: a };
    return { year: yr, month: a, day: b };
  }

  // Fallback: try Date constructor then pull UTC parts
  const d = new Date(s);
  if (!isNaN(d)) return { year: d.getUTCFullYear(), month: d.getUTCMonth()+1, day: d.getUTCDate() };

  return null;
}

// -------------------------------------------------------
// Fetch natal Human Design chart directly from humandesign.ai
// -------------------------------------------------------
async function fetchHumanDesign(birthdate, birthtime, location) {
  const timezone = getTimezone(location);
  const parsed = parseDate(birthdate);
  if (!parsed) throw new Error('Could not parse birth date: ' + birthdate);

  const { year, month, day } = parsed;

  // Parse time
  const timeParts = (birthtime || '12:00').match(/^(\d{1,2}):(\d{2})/);
  const hour = timeParts ? +timeParts[1] : 12;
  const minute = timeParts ? +timeParts[2] : 0;

  const payload = { year, month, day, hour, minute, second: 0, timezone, location: location || 'New York, NY' };
  console.log('Fetching HD chart from humandesign.ai:', JSON.stringify(payload));

  const response = await fetch('https://api.humandesign.ai/v3/hd-data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': HD_AI_API_KEY,
      'Authorization': 'Bearer ' + HD_AI_API_KEY,
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();
  console.log('humandesign.ai status:', response.status, 'body:', responseText.slice(0, 300));

  if (!response.ok) {
    throw new Error('humandesign.ai error ' + response.status + ': ' + responseText.slice(0, 200));
  }

  const raw = JSON.parse(responseText);
  return transformHDResponse(raw);
}

// -------------------------------------------------------
// Transform humandesign.ai v3 response into our format
// -------------------------------------------------------
function transformHDResponse(raw) {
  // Try multiple response shapes
  const chart = raw?.chart || raw?.data || raw;
  const centers = chart?.centers || raw?.centers || {};
  const channels = chart?.channels || raw?.channels || [];
  const gates = chart?.gates || raw?.gates || [];

  const definedCenters = Object.entries(centers)
    .filter(([, v]) => v === true || v?.defined === true || v?.active === true)
    .map(([k]) => k);
  const openCenters = Object.entries(centers)
    .filter(([, v]) => v === false || v?.defined === false || v?.active === false)
    .map(([k]) => k);

  const channelNames = Array.isArray(channels)
    ? channels.map(c => typeof c === 'string' ? c : c?.name || c?.channel || JSON.stringify(c))
    : [];
  const gateNumbers = Array.isArray(gates)
    ? gates.map(g => typeof g === 'number' ? g : g?.gate || g?.number || g)
    : [];

  return {
    type: chart?.type || chart?.design_type || raw?.type || 'unknown',
    strategy: chart?.strategy || raw?.strategy || '',
    authority: chart?.authority || chart?.inner_authority || raw?.authority || '',
    profile: chart?.profile || raw?.profile || '',
    incarnation_cross: chart?.incarnation_cross || chart?.cross || raw?.incarnation_cross || '',
    definition: chart?.definition || raw?.definition || '',
    signature: chart?.signature || raw?.signature || '',
    not_self: chart?.not_self || chart?.not_self_theme || raw?.not_self || '',
    defined_centers: definedCenters,
    open_centers: openCenters,
    channels: channelNames,
    gates: gateNumbers,
    raw_response: JSON.stringify(raw).slice(0, 500),
  };
}

// -------------------------------------------------------
// Calculate transit cycle windows from birthdate
// -------------------------------------------------------
function calculateTransitCycles(birthdate) {
  const parsed = parseDate(birthdate);
  if (!parsed) return {};
  const { year, month, day } = parsed;
  const birthTs = new Date(year, month - 1, day);

  const addYears = (y) => {
    const d = new Date(birthTs);
    const wholeYears = Math.floor(y);
    const fracMonths = Math.round((y - wholeYears) * 12);
    d.setFullYear(d.getFullYear() + wholeYears);
    d.setMonth(d.getMonth() + fracMonths);
    return d.toISOString().split('T')[0];
  };

  return {
    saturnReturn:       { start: addYears(26),   peak: addYears(29.5), end: addYears(33)   },
    uranusOpposition:   { start: addYears(38.5), peak: addYears(42),   end: addYears(45.5) },
    chironReturn:       { start: addYears(46.5), peak: addYears(50),   end: addYears(53.5) },
    secondSaturnReturn: { start: addYears(55.5), peak: addYears(59),   end: addYears(62.5) },
  };
}

// -------------------------------------------------------
// Timezone lookup
// -------------------------------------------------------
function getTimezone(location) {
  const loc = (location || '').toLowerCase();
  if (loc.includes('los angeles') || loc.includes('san francisco') || loc.includes('seattle') || loc.includes('portland') || loc.includes('las vegas') || loc.includes('phoenix')) return 'America/Los_Angeles';
  if (loc.includes('chicago') || loc.includes('dallas') || loc.includes('houston') || loc.includes('minneapolis')) return 'America/Chicago';
  if (loc.includes('denver') || loc.includes('salt lake')) return 'America/Denver';
  if (loc.includes('london') || loc.includes(' uk') || loc.includes('england')) return 'Europe/London';
  if (loc.includes('paris') || loc.includes('france')) return 'Europe/Paris';
  if (loc.includes('berlin') || loc.includes('germany') || loc.includes('amsterdam') || loc.includes('rome') || loc.includes('madrid')) return 'Europe/Berlin';
  if (loc.includes('sydney') || loc.includes('melbourne') || loc.includes('brisbane')) return 'Australia/Sydney';
  if (loc.includes('tokyo') || loc.includes('japan')) return 'Asia/Tokyo';
  if (loc.includes('mumbai') || loc.includes('delhi') || loc.includes('india')) return 'Asia/Kolkata';
  return 'America/New_York';
}

// -------------------------------------------------------
// Format HD chart for Claude
// -------------------------------------------------------
function formatHDChart(data) {
  return `
=== NATAL CHART DATA (humandesign.ai) ===
TYPE: ${data.type}
STRATEGY: ${data.strategy}
AUTHORITY: ${data.authority}
PROFILE: ${data.profile}
INCARNATION CROSS: ${data.incarnation_cross}
DEFINITION: ${data.definition}
SIGNATURE: ${data.signature}
NOT-SELF: ${data.not_self}
DEFINED CENTERS: ${data.defined_centers?.join(', ') || 'none'}
OPEN CENTERS: ${data.open_centers?.join(', ') || 'none'}
CHANNELS: ${data.channels?.join(', ') || 'none'}
GATES: ${data.gates?.join(', ') || 'none'}
=== END NATAL CHART DATA ===
`;
}

// -------------------------------------------------------
// Format transit cycles for Claude
// -------------------------------------------------------
function formatTransitCycles(data) {
  const fmt = (c) => c ? `start: ${c.start} | peak: ${c.peak} | end: ${c.end}` : 'unavailable';
  return `
=== TRANSIT CYCLE DATA (age-based calculation) ===
SATURN RETURN: ${fmt(data.saturnReturn)}
URANUS OPPOSITION: ${fmt(data.uranusOpposition)}
CHIRON RETURN: ${fmt(data.chironReturn)}
SECOND SATURN RETURN: ${fmt(data.secondSaturnReturn)}
=== END TRANSIT CYCLE DATA ===
`;
}

// -------------------------------------------------------
// CHAT ENDPOINT
// -------------------------------------------------------
app.post("/api/chat", async (req, res) => {
  const { messages, birthdata } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages array required" });
  }

  let augmentedMessages = [...messages];

  if (birthdata && birthdata.birthdate) {
    let chartText = '';
    let hdError = null;

    // Try HD chart from humandesign.ai
    try {
      if (birthdata.birthtime && birthdata.location) {
        const hdChart = await fetchHumanDesign(birthdata.birthdate, birthdata.birthtime, birthdata.location);
        chartText += formatHDChart(hdChart);
        console.log('HD chart injected successfully, type:', hdChart.type);
      }
    } catch (err) {
      hdError = err.message;
      console.error('HD chart error:', err.message);
      chartText += '[HD CHART ERROR: ' + err.message + ']\n';
    }

    // Always calculate transit cycles
    try {
      const transitCycles = calculateTransitCycles(birthdata.birthdate);
      chartText += formatTransitCycles(transitCycles);
      console.log('Transit cycles calculated for:', birthdata.birthdate);
    } catch (err) {
      console.error('Transit cycles error:', err.message);
      chartText += '[TRANSIT ERROR: ' + err.message + ']\n';
    }

    if (chartText) {
      const lastMsg = augmentedMessages[augmentedMessages.length - 1];
      if (lastMsg && lastMsg.role === 'user') {
        augmentedMessages[augmentedMessages.length - 1] = {
          ...lastMsg,
          content: chartText + '\n\n' + lastMsg.content,
        };
      }
    }
  }

  // Streaming response
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

    stream.on('text', (text) => {
      res.write('data: ' + JSON.stringify({ text }) + '\n\n');
    });
    stream.on('message', () => {
      res.write('data: [DONE]\n\n');
      res.end();
    });
    stream.on('error', (err) => {
      console.error('Stream error:', err);
      res.write('data: ' + JSON.stringify({ error: err.message }) + '\n\n');
      res.end();
    });
  } catch (err) {
    console.error('Anthropic error:', err);
    res.write('data: ' + JSON.stringify({ error: err.message }) + '\n\n');
    res.end();
  }
});

// -------------------------------------------------------
// DEBUG ENDPOINT -- see exactly what humandesign.ai returns
// -------------------------------------------------------
app.post("/api/debug-hd", async (req, res) => {
  const { birthdate, birthtime, location } = req.body;
  try {
    const parsed = parseDate(birthdate);
    const timezone = getTimezone(location || '');
    const timeParts = (birthtime || '12:00').match(/^(\d{1,2}):(\d{2})/);
    const hour = timeParts ? +timeParts[1] : 12;
    const minute = timeParts ? +timeParts[2] : 0;
    const payload = { ...parsed, hour, minute, second: 0, timezone, location: location || 'New York, NY' };

    const response = await fetch('https://api.humandesign.ai/v3/hd-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': HD_AI_API_KEY,
        'Authorization': 'Bearer ' + HD_AI_API_KEY,
      },
      body: JSON.stringify(payload),
    });
    const text = await response.text();
    res.json({ status: response.status, payload, response: text.slice(0, 2000) });
  } catch (err) {
    res.json({ error: err.message });
  }
});

app.get("/health", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
