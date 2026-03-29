import express from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";

const app = express();
app.use(cors());
app.use(express.json());

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const HD_AI_API_KEY = process.env.HD_AI_API_KEY;
const HD_AI_BASE_URL = "https://api.humandesign.ai";

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
2. ALL overlay details come ONLY from the OVERLAY CHART DATA block.
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

## YOUR CURRENT DEVELOPMENTAL CYCLE | [Cycle Name]

THE FOUR DEVELOPMENTAL CYCLES:
- The Becoming Cycle (Saturn Return): ages 26-33, apex at 29.5
- The Reorientation Cycle (Uranus Opposition): ages 38.5-45.5, apex at 42
- The Flowering Cycle (Chiron Return): ages 46.5-53.5, apex at 50
- The Legacy Cycle (Second Saturn Return): ages 55.5-62.5, apex at 59

**Cycle:** [name the cycle based on their age]
**Window:** [age range]
**Your Phase:** [early / building toward apex / at apex / integrating]
**What This Cycle Is Training:** [one clear sentence]

**Overlay Profile:** [FROM OVERLAY CHART DATA ONLY]
**Overlay Incarnation Cross:** [FROM OVERLAY CHART DATA ONLY]

---

## CENTERS ACTIVATED IN THIS CYCLE

[For each DEFINED center in the OVERLAY chart data:]
**[Center Name]**
- If also defined in natal: "AMPLIFIED in this cycle -- [explain deepening]"
- If open in natal: "TEMPORARILY STABILIZED -- this cycle is training the themes of [center] -- [explain what is being developed]"

---

## ACTIVATED CHANNELS FOR THIS CYCLE

[For each channel in the OVERLAY chart data:]
**Channel [X-Y] -- [name it]**
What this channel does: [explain]
- If also in natal channels: "AMPLIFIED -- [explain how it deepens and becomes more visible]"
- If not in natal: "TEMPORARY SUPERPOWER -- activated specifically for this cycle -- [explain how to use it]"

---

## YOUR OVERLAY INCARNATION CROSS | The Evolutionary Mission

[FROM OVERLAY CHART DATA ONLY -- never hardcoded]

**Cross Name:** [from overlay data]
**Mission:** [interpret for this person]
**Shadow:** [what to watch for]
**Higher Expression:** [what becomes possible]

[2-3 paragraphs connecting this cross to their natal design and life stage]

---

## YOUR PUBLIC PROFILE IN THIS CYCLE

[FROM OVERLAY CHART DATA ONLY -- never hardcoded]

**Overlay Profile:** [from overlay data]
[Explain what this profile means and how it interacts with their natal profile]

---

## WHAT THIS CYCLE IS TEACHING YOU | The Core Invitation

[3-4 rich paragraphs synthesizing natal + real overlay data. Warm, precise, powerful.]

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
  // Default covers eastern US, reading pa, new york, etc
  return 'America/New_York';
}

// -------------------------------------------------------
// Convert birthdate to ISO 8601
// -------------------------------------------------------
function toISO8601(birthdate, birthtime) {
  const monthMap = { Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12' };
  const match = birthdate.match(/^(\d{1,2})-([A-Za-z]+)-(\d{4})$/);
  if (match) {
    const day = match[1].padStart(2,'0');
    const month = monthMap[match[2]] || '01';
    const year = match[3];
    return year + '-' + month + '-' + day + 'T' + (birthtime || '12:00') + ':00';
  }
  if (birthdate.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return birthdate + 'T' + (birthtime || '12:00') + ':00';
  }
  return birthdate + 'T' + (birthtime || '12:00') + ':00';
}

// -------------------------------------------------------
// Determine cycle type from approximate age
// -------------------------------------------------------
function getCycleType(birthdate) {
  let birthYear;
  const isoMatch = birthdate.match(/^(\d{4})/);
  const ddMatch = birthdate.match(/-(\d{4})$/);
  if (isoMatch) birthYear = parseInt(isoMatch[1]);
  else if (ddMatch) birthYear = parseInt(ddMatch[1]);
  else return null;
  const age = 2026 - birthYear;
  if (age >= 26 && age <= 33) return 'saturn-return';
  if (age >= 38 && age <= 46) return 'saturn-return';
  if (age >= 46 && age <= 54) return 'chiron-return';
  if (age >= 55 && age <= 63) return 'saturn-return';
  return null;
}

// -------------------------------------------------------
// Fetch natal chart from humandesign.ai /v3/hd-data
// -------------------------------------------------------
async function fetchNatalChart(birthdate, birthtime, location) {
  const isoDate = toISO8601(birthdate, birthtime);
  const timezone = getTimezone(location);
  const url = HD_AI_BASE_URL + '/v3/hd-data?date=' + encodeURIComponent(isoDate) + '&timezone=' + encodeURIComponent(timezone) + '&api_key=' + HD_AI_API_KEY;
  console.log('Natal chart request:', isoDate, timezone);
  const response = await fetch(url);
  if (!response.ok) {
    const err = await response.text();
    throw new Error('HD AI natal API error ' + response.status + ': ' + err);
  }
  const data = await response.json();
  // Log top-level keys so we can see the response structure
  console.log('Natal API response keys:', Object.keys(data).join(', '));
  console.log('Natal API Properties keys:', data.Properties ? Object.keys(data.Properties).join(', ') : 'no Properties');
  console.log('Natal Type:', JSON.stringify(data.Properties?.Type || data.type || 'not found'));
  console.log('Natal Profile:', JSON.stringify(data.Properties?.Profile || data.profile || 'not found'));
  console.log('Natal Cross:', JSON.stringify(data.Properties?.IncarnationCross || data.Properties?.Cross || data.incarnation_cross || 'not found'));
  return data;
}

// -------------------------------------------------------
// Fetch overlay/return chart
// -------------------------------------------------------
async function fetchOverlayChart(birthdate, birthtime, location, cycleType) {
  const isoDate = toISO8601(birthdate, birthtime);
  const timezone = getTimezone(location);
  const endpoint = cycleType === 'chiron-return' ? 'chiron-return' : 'saturn-return';
  const url = HD_AI_BASE_URL + '/' + endpoint + '?date=' + encodeURIComponent(isoDate) + '&timezone=' + encodeURIComponent(timezone) + '&api_key=' + HD_AI_API_KEY;
  console.log('Overlay chart request (' + endpoint + '):', isoDate, timezone);
  const response = await fetch(url);
  if (!response.ok) {
    const err = await response.text();
    throw new Error('HD AI overlay API error ' + response.status + ': ' + err);
  }
  const data = await response.json();
  console.log('Overlay API response keys:', Object.keys(data).join(', '));
  console.log('Overlay Profile:', JSON.stringify(data.Properties?.Profile || data.profile || 'not found'));
  console.log('Overlay Cross:', JSON.stringify(data.Properties?.IncarnationCross || data.Properties?.Cross || data.incarnation_cross || 'not found'));
  return data;
}

// -------------------------------------------------------
// Format raw API response for Claude -- pass EVERYTHING
// -------------------------------------------------------
function formatChartForClaude(data, label) {
  // Pass the full raw JSON so Claude and we can see all fields
  const raw = JSON.stringify(data, null, 2);
  // Also extract common fields with fallbacks across v1/v2/v3 structures
  const props = data.Properties || {};
  const type = props.Type?.Id || props.Type?.Option || data.type || 'unknown';
  const strategy = props.Strategy?.Id || props.Strategy?.Option || data.strategy || 'unknown';
  const authority = props.InnerAuthority?.Id || props.InnerAuthority?.Option || props.Authority?.Id || data.authority || 'unknown';
  const profile = props.Profile?.Id || props.Profile?.Option || data.profile || 'unknown';
  const cross = props.IncarnationCross?.Id || props.IncarnationCross?.Option || props.Cross?.Id || props.Cross?.Option || data.incarnation_cross || data.cross || 'unknown';
  const definition = props.Definition?.Id || props.Definition?.Option || data.definition || 'unknown';
  const signature = props.Signature?.Id || props.Signature?.Option || data.signature || 'unknown';
  const notSelf = props.NotSelf?.Id || props.NotSelf?.Option || props['Not-Self']?.Id || data.not_self || data.notSelf || 'unknown';
  const definedCenters = data.DefinedCenters || data.defined_centers || data.definedCenters || [];
  const openCenters = data.OpenCenters || data.open_centers || data.openCenters || [];
  const channels = data.Channels || data.channels || [];
  const gates = data.Gates || data.gates || [];
  const returnDate = data.return_date || data.returnDate || data.ReturnDate || data.chiron_return_date || null;

  return `
=== ${label} ===
TYPE: ${type}
STRATEGY: ${strategy}
AUTHORITY: ${authority}
PROFILE: ${profile}
INCARNATION CROSS: ${cross}
DEFINITION: ${definition}
SIGNATURE: ${signature}
NOT-SELF: ${notSelf}
${returnDate ? 'RETURN DATE: ' + returnDate : ''}

DEFINED CENTERS: ${Array.isArray(definedCenters) ? definedCenters.join(', ') : 'none'}
OPEN CENTERS: ${Array.isArray(openCenters) ? openCenters.join(', ') : 'none'}
CHANNELS: ${Array.isArray(channels) ? channels.join(', ') : 'none'}
GATES: ${Array.isArray(gates) ? gates.join(', ') : 'none'}

PERSONALITY (Conscious):
${data.Personality ? Object.entries(data.Personality).map(([k,v]) => '  ' + k + ': Gate ' + v?.Gate + ' Line ' + v?.Line).join('\n') : '  (none)'}

DESIGN (Unconscious):
${data.Design ? Object.entries(data.Design).map(([k,v]) => '  ' + k + ': Gate ' + v?.Gate + ' Line ' + v?.Line).join('\n') : '  (none)'}

FULL RAW API RESPONSE (first 3000 chars for reference):
${raw.substring(0, 3000)}
=== END ${label} ===
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
      // 1. Fetch natal chart
      const natalData = await fetchNatalChart(birthdata.birthdate, birthdata.birthtime, birthdata.location);
      let chartText = formatChartForClaude(natalData, 'NATAL CHART DATA (humandesign.ai v3)');

      // 2. Fetch overlay chart
      const cycleType = getCycleType(birthdata.birthdate);
      if (cycleType) {
        try {
          const overlayData = await fetchOverlayChart(birthdata.birthdate, birthdata.birthtime, birthdata.location, cycleType);
          chartText += '\n' + formatChartForClaude(overlayData, 'OVERLAY CHART DATA (' + cycleType + ')');
          console.log('Both charts fetched successfully');
        } catch (overlayErr) {
          console.error('Overlay chart fetch failed:', overlayErr.message);
          chartText += '\n[OVERLAY ERROR: ' + overlayErr.message + ' -- Do NOT use hardcoded values.]';
        }
      } else {
        chartText += '\n[CYCLE NOTE: Not currently in an active developmental cycle window. State most recently completed and next upcoming with approximate year.]';
      }

      const lastMsg = augmentedMessages[augmentedMessages.length - 1];
      if (lastMsg && lastMsg.role === 'user') {
        augmentedMessages[augmentedMessages.length - 1] = {
          ...lastMsg,
          content: chartText + '\n\n' + lastMsg.content,
        };
      }
    } catch (err) {
      console.error('Chart fetch failed:', err.message);
      const lastMsg = augmentedMessages[augmentedMessages.length - 1];
      if (lastMsg && lastMsg.role === 'user') {
        augmentedMessages[augmentedMessages.length - 1] = {
          ...lastMsg,
          content: '[CHART API ERROR: ' + err.message + ']\n\n' + lastMsg.content,
        };
      }
    }
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: augmentedMessages,
    });
    res.json({ content: response.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/health", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
