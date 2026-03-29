import express from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";

const app = express();
app.use(cors());
app.use(express.json());

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// URL of the Sacred Cycles Python service (Swiss Ephemeris + humandesign.ai proxy)
const SACRED_CYCLES_URL = process.env.SACRED_CYCLES_URL || "http://localhost:8000";

// -------------------------------------------------------
// SYSTEM PROMPT
// -------------------------------------------------------
const SYSTEM_PROMPT = `You are the Evolutionary Human Design reader -- the engine behind a premium paid product that helps people understand the developmental cycle they are in, the activations and gifts that have come online to support them, and how those overlays interact with their natal design.

Today's date is March 28, 2026. Your readings are professional, accurate, warm, and powerful. Every person who uses this has paid for a real reading. You treat each one with that level of care and precision.

=======================================================
CORE PRINCIPLE
=======================================================
The natal design is the permanent base blueprint. It never changes. Major developmental transits create a 7-year training field where the person is being trained into a new mode of expression.

The reading must ALWAYS be interpreted as: NATAL SELF + DEVELOPMENTAL OVERLAY
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
// Fetch natal Human Design chart from Sacred Cycles API
// -------------------------------------------------------
async function fetchHumanDesign(birthdate, birthtime, location) {
  const timezone = getTimezone(location);
  const url = `${SACRED_CYCLES_URL}/human-design`;
  console.log('Fetching HD chart:', birthdate, birthtime, timezone);
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date: birthdate, time: birthtime || '12:00', timezone }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error('HD chart error ' + response.status + ': ' + (err.detail || response.statusText));
  }
  const data = await response.json();
  console.log('HD chart type:', data.type, 'profile:', data.profile);
  return data;
}

// -------------------------------------------------------
// Fetch real transit cycle windows from Sacred Cycles API
// -------------------------------------------------------
async function fetchTransitCycles(birthdate, birthtime, location) {
  const timezone = getTimezone(location);
  // Use a simple geocode fallback -- lat/lng for major cities
  const { latitude, longitude } = geocodeLocation(location);
  const url = `${SACRED_CYCLES_URL}/transit-cycles`;
  console.log('Fetching transit cycles:', birthdate, birthtime, timezone, latitude, longitude);
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date: birthdate, time: birthtime || '12:00', latitude, longitude, timezone }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error('Transit cycles error ' + response.status + ': ' + (err.detail || response.statusText));
  }
  const data = await response.json();
  console.log('Transit cycles fetched: saturn peak', data.saturnReturn?.peak,
              'chiron peak', data.chironReturn?.peak);
  return data;
}

// -------------------------------------------------------
// Timezone lookup (unchanged)
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
// Simple lat/lng lookup for transit calculations
// -------------------------------------------------------
function geocodeLocation(location) {
  const loc = (location || '').toLowerCase();
  if (loc.includes('los angeles'))    return { latitude: 34.05,  longitude: -118.24 };
  if (loc.includes('san francisco'))  return { latitude: 37.77,  longitude: -122.42 };
  if (loc.includes('seattle'))        return { latitude: 47.61,  longitude: -122.33 };
  if (loc.includes('chicago'))        return { latitude: 41.88,  longitude: -87.63  };
  if (loc.includes('dallas'))         return { latitude: 32.78,  longitude: -96.80  };
  if (loc.includes('houston'))        return { latitude: 29.76,  longitude: -95.37  };
  if (loc.includes('denver'))         return { latitude: 39.74,  longitude: -104.98 };
  if (loc.includes('london'))         return { latitude: 51.51,  longitude: -0.13   };
  if (loc.includes('paris'))          return { latitude: 48.85,  longitude: 2.35    };
  if (loc.includes('berlin'))         return { latitude: 52.52,  longitude: 13.41   };
  if (loc.includes('sydney'))         return { latitude: -33.87, longitude: 151.21  };
  if (loc.includes('tokyo'))          return { latitude: 35.68,  longitude: 139.69  };
  if (loc.includes('mumbai'))         return { latitude: 19.08,  longitude: 72.88   };
  // Default: New York
  return { latitude: 40.71, longitude: -74.00 };
}

// -------------------------------------------------------
// Format HD chart for Claude
// -------------------------------------------------------
function formatHDChart(data) {
  return `
=== NATAL CHART DATA (Sacred Cycles API / humandesign.ai) ===
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

PERSONALITY (Conscious):
${Object.entries(data.personality || {}).map(([k,v]) => `  ${k}: Gate ${v.gate} Line ${v.line}`).join('\n') || '  (none)'}

DESIGN (Unconscious):
${Object.entries(data.design || {}).map(([k,v]) => `  ${k}: Gate ${v.gate} Line ${v.line}`).join('\n') || '  (none)'}
=== END NATAL CHART DATA ===
`;
}

// -------------------------------------------------------
// Format transit cycles for Claude
// -------------------------------------------------------
function formatTransitCycles(data) {
  const fmt = (c) => c
    ? `start: ${c.start} | peak: ${c.peak} | end: ${c.end} | natal: ${c.natal_degree}° | transit at peak: ${c.peak_transit_degree}°`
    : 'unavailable';
  return `
=== TRANSIT CYCLE DATA (Swiss Ephemeris) ===
SATURN RETURN:       ${fmt(data.saturnReturn)}
URANUS OPPOSITION:   ${fmt(data.uranusOpposition)}
CHIRON RETURN:       ${fmt(data.chironReturn)}
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

  if (birthdata && birthdata.birthdate && birthdata.birthtime && birthdata.location) {
    try {
      // Fetch HD chart and transit cycles in parallel
      const [hdChart, transitCycles] = await Promise.all([
        fetchHumanDesign(birthdata.birthdate, birthdata.birthtime, birthdata.location),
        fetchTransitCycles(birthdata.birthdate, birthdata.birthtime, birthdata.location),
      ]);

      const chartText = formatHDChart(hdChart) + formatTransitCycles(transitCycles);

      const lastMsg = augmentedMessages[augmentedMessages.length - 1];
      if (lastMsg && lastMsg.role === 'user') {
        augmentedMessages[augmentedMessages.length - 1] = {
          ...lastMsg,
          content: chartText + '\n\n' + lastMsg.content,
        };
      }
      console.log('Chart + transit data injected successfully');
    } catch (err) {
      console.error('Data fetch error:', err.message);
      const lastMsg = augmentedMessages[augmentedMessages.length - 1];
      if (lastMsg && lastMsg.role === 'user') {
        augmentedMessages[augmentedMessages.length - 1] = {
          ...lastMsg,
          content: '[DATA ERROR: ' + err.message + ']\n\n' + lastMsg.content,
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

app.get("/health", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
