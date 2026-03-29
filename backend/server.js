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

This cross does not replace your natal cross. It governs your growth and public expression during this cycle.

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

[3-4 rich paragraphs synthesizing natal + real overlay data. Warm, precise, powerful. Speak directly to them.]

---

## LIVING IT NOW | Practical Guidance

### Decision-Making in This Cycle
[Authority-specific guidance]

### What to Trust and Build On
[Natal defined centers + amplified channels]

### What to Stay Curious About
[Open natal centers being trained]

### The Body's Intelligence
[Type and authority specific guidance]

=======================================================
TONE AND DELIVERY
=======================================================
- Professional and warm. Paid product. Master reader energy.
- Natal before overlay. Always establish the foundation first.
- Precise, not vague. Anchor every insight in real chart data.
- NEVER guess. Never invent gate numbers, channel names, profiles, or crosses.
- Speak to their actual life. Connect to what this cycle feels like.
- No jargon dumps. Explain every technical term clearly.
- The overlay is REAL and unique to this person -- treat it that way.

=======================================================
DATA HANDLING
=======================================================
When NATAL CHART DATA and OVERLAY CHART DATA are injected, use ONLY that data.

If birth data has not been provided, ask warmly for:
- Birth date (month, day, year)
- Birth time (as exact as possible)
- Birth city and country`;

// -------------------------------------------------------
// Timezone lookup from location string
// -------------------------------------------------------
function getTimezone(location) {
  const loc = (location || '').toLowerCase();
  if (loc.includes('los angeles') || loc.includes('san francisco') || loc.includes('seattle') || loc.includes('portland') || loc.includes('las vegas') || loc.includes('phoenix')) return 'America/Los_Angeles';
  if (loc.includes('chicago') || loc.includes('dallas') || loc.includes('houston') || loc.includes('minneapolis') || loc.includes('kansas city') || loc.includes('st. louis')) return 'America/Chicago';
  if (loc.includes('denver') || loc.includes('salt lake') || loc.includes('albuquerque')) return 'America/Denver';
  if (loc.includes('london') || loc.includes('uk') || loc.includes('england') || loc.includes('wales') || loc.includes('scotland')) return 'Europe/London';
  if (loc.includes('paris') || loc.includes('france')) return 'Europe/Paris';
  if (loc.includes('berlin') || loc.includes('germany') || loc.includes('amsterdam') || loc.includes('netherlands') || loc.includes('rome') || loc.includes('italy') || loc.includes('madrid') || loc.includes('spain')) return 'Europe/Berlin';
  if (loc.includes('sydney') || loc.includes('melbourne') || loc.includes('brisbane')) return 'Australia/Sydney';
  if (loc.includes('perth')) return 'Australia/Perth';
  if (loc.includes('toronto') || loc.includes('montreal') || loc.includes('ottawa') || loc.includes('new york') || loc.includes('boston') || loc.includes('philadelphia') || loc.includes('miami') || loc.includes('atlanta') || loc.includes('reading') || loc.includes('pennsylvania') || loc.includes('pa')) return 'America/New_York';
  if (loc.includes('vancouver') || loc.includes('victoria')) return 'America/Vancouver';
  if (loc.includes('tokyo') || loc.includes('japan')) return 'Asia/Tokyo';
  if (loc.includes('beijing') || loc.includes('shanghai') || loc.includes('china')) return 'Asia/Shanghai';
  if (loc.includes('mumbai') || loc.includes('delhi') || loc.includes('india')) return 'Asia/Kolkata';
  if (loc.includes('dubai') || loc.includes('uae')) return 'Asia/Dubai';
  if (loc.includes('johannesburg') || loc.includes('cape town') || loc.includes('south africa')) return 'Africa/Johannesburg';
  if (loc.includes('mexico city') || loc.includes('guadalajara')) return 'America/Mexico_City';
  if (loc.includes('sao paulo') || loc.includes('rio') || loc.includes('brazil')) return 'America/Sao_Paulo';
  if (loc.includes('buenos aires') || loc.includes('argentina')) return 'America/Argentina/Buenos_Aires';
  // Default to Eastern
  return 'America/New_York';
}

// -------------------------------------------------------
// Convert birthdate DD-Mon-YYYY or YYYY-MM-DD to ISO 8601
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
  // Already ISO-like: YYYY-MM-DD
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
  if (age >= 38 && age <= 46) return 'saturn-return'; // Uranus opposition - use closest available
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
  console.log('Fetching natal chart (v3):', isoDate, timezone);
  const response = await fetch(url);
  if (!response.ok) {
    const err = await response.text();
    throw new Error('HD AI natal API error ' + response.status + ': ' + err);
  }
  return response.json();
}

// -------------------------------------------------------
// Fetch overlay/return chart from humandesign.ai
// -------------------------------------------------------
async function fetchOverlayChart(birthdate, birthtime, location, cycleType) {
  const isoDate = toISO8601(birthdate, birthtime);
  const timezone = getTimezone(location);
  const endpoint = cycleType === 'chiron-return' ? 'chiron-return' : 'saturn-return';
  const url = HD_AI_BASE_URL + '/' + endpoint + '?date=' + encodeURIComponent(isoDate) + '&timezone=' + encodeURIComponent(timezone) + '&api_key=' + HD_AI_API_KEY;
  console.log('Fetching overlay chart (' + endpoint + '):', isoDate, timezone);
  const response = await fetch(url);
  if (!response.ok) {
    const err = await response.text();
    throw new Error('HD AI overlay API error ' + response.status + ': ' + err);
  }
  return response.json();
}

// -------------------------------------------------------
// Extract key fields from v3 response
// -------------------------------------------------------
function extractV3Fields(data) {
  const props = data.Properties || {};
  return {
    type: props.Type?.Id || props.Type?.Option || data.type || 'Unknown',
    strategy: props.Strategy?.Id || props.Strategy?.Option || data.strategy || 'Unknown',
    authority: props.InnerAuthority?.Id || props.InnerAuthority?.Option || data.authority || 'Unknown',
    profile: props.Profile?.Id || props.Profile?.Option || data.profile || 'Unknown',
    incarnation_cross: props.IncarnationCross?.Id || props.IncarnationCross?.Option || props.Cross?.Id || data.incarnation_cross || 'Unknown',
    definition: props.Definition?.Id || props.Definition?.Option || data.definition || 'Unknown',
    signature: props.Signature?.Id || props.Signature?.Option || data.signature || 'Unknown',
    not_self: props.NotSelf?.Id || props.NotSelf?.Option || props['Not-Self']?.Id || data.not_self || 'Unknown',
    defined_centers: data.DefinedCenters || data.defined_centers || [],
    open_centers: data.OpenCenters || data.open_centers || [],
    channels: data.Channels || data.channels || [],
    gates: data.Gates || data.gates || [],
    personality: data.Personality || {},
    design: data.Design || {},
    return_date: data.return_date || data.returnDate || data.ReturnDate || null,
    raw: data
  };
}

// -------------------------------------------------------
// Format natal chart data for Claude
// -------------------------------------------------------
function formatNatalData(data, birthdate, birthtime, location) {
  const f = extractV3Fields(data);
  const allCenters = ['Head','Ajna','Throat','G','Heart','Sacral','Solar Plexus','Spleen','Root'];
  // Normalize defined centers -- API returns "Solar Plexus center" style
  const definedNorm = f.defined_centers.map(c => String(c).replace(/ center$/i,'').trim());
  const openNorm = f.open_centers.length > 0
    ? f.open_centers.map(c => String(c).replace(/ center$/i,'').trim())
    : allCenters.filter(c => !definedNorm.some(d => d.toLowerCase() === c.toLowerCase()));

  const persKeys = Object.keys(f.personality);
  const persLines = persKeys.map(k => '  ' + k + ': Gate ' + (f.personality[k]?.Gate || '?') + ' Line ' + (f.personality[k]?.Line || '?')).join('\n');
  const desKeys = Object.keys(f.design);
  const desLines = desKeys.map(k => '  ' + k + ': Gate ' + (f.design[k]?.Gate || '?') + ' Line ' + (f.design[k]?.Line || '?')).join('\n');

  return `
=== NATAL CHART DATA (v3 - humandesign.ai) ===
Birth: ${birthdate} at ${birthtime} in ${location}

TYPE: ${f.type}
STRATEGY: ${f.strategy}
INNER AUTHORITY: ${f.authority}
PROFILE: ${f.profile}
INCARNATION CROSS: ${f.incarnation_cross}
DEFINITION: ${f.definition}
SIGNATURE: ${f.signature}
NOT-SELF THEME: ${f.not_self}

DEFINED CENTERS: ${definedNorm.join(', ') || 'none'}
OPEN/UNDEFINED CENTERS: ${openNorm.join(', ') || 'none'}

CHANNELS: ${f.channels.join(', ') || 'none'}
GATES: ${(Array.isArray(f.gates) ? f.gates : []).join(', ') || 'none'}

PERSONALITY (Conscious) ACTIVATIONS:
${persLines || '  (see raw data)'}

DESIGN (Unconscious) ACTIVATIONS:
${desLines || '  (see raw data)'}
=== END NATAL CHART DATA ===
`;
}

// -------------------------------------------------------
// Format overlay/return chart data for Claude
// -------------------------------------------------------
function formatOverlayData(data, cycleType) {
  const f = extractV3Fields(data);
  const allCenters = ['Head','Ajna','Throat','G','Heart','Sacral','Solar Plexus','Spleen','Root'];
  const definedNorm = f.defined_centers.map(c => String(c).replace(/ center$/i,'').trim());
  const openNorm = f.open_centers.length > 0
    ? f.open_centers.map(c => String(c).replace(/ center$/i,'').trim())
    : allCenters.filter(c => !definedNorm.some(d => d.toLowerCase() === c.toLowerCase()));

  const cycleName = cycleType === 'chiron-return' ? 'Chiron Return (Flowering Cycle ~age 50)' : 'Saturn Return';

  return `
=== OVERLAY CHART DATA (${cycleName}) ===
${f.return_date ? 'Return Date: ' + f.return_date : ''}

OVERLAY PROFILE: ${f.profile}
OVERLAY INCARNATION CROSS: ${f.incarnation_cross}
OVERLAY TYPE: ${f.type}
OVERLAY AUTHORITY: ${f.authority}

OVERLAY DEFINED CENTERS: ${definedNorm.join(', ') || 'none'}
OVERLAY OPEN CENTERS: ${openNorm.join(', ') || 'none'}

OVERLAY CHANNELS: ${f.channels.join(', ') || 'none'}
OVERLAY GATES: ${(Array.isArray(f.gates) ? f.gates : []).join(', ') || 'none'}
=== END OVERLAY CHART DATA ===

CRITICAL: Use ONLY the overlay data above for ALL overlay details -- profile, cross, channels, centers. This is a real calculated chart unique to this person. Never substitute hardcoded or templated values.
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
      // 1. Fetch natal chart via /v3/hd-data
      const natalData = await fetchNatalChart(birthdata.birthdate, birthdata.birthtime, birthdata.location);
      let chartText = formatNatalData(natalData, birthdata.birthdate, birthdata.birthtime, birthdata.location);

      // 2. Fetch overlay/return chart based on cycle
      const cycleType = getCycleType(birthdata.birthdate);
      if (cycleType) {
        try {
          const overlayData = await fetchOverlayChart(birthdata.birthdate, birthdata.birthtime, birthdata.location, cycleType);
          chartText += '\n' + formatOverlayData(overlayData, cycleType);
          console.log('Overlay chart fetched successfully:', cycleType);
        } catch (overlayErr) {
          console.error('Overlay chart fetch failed:', overlayErr.message);
          chartText += '\n[OVERLAY CHART ERROR: ' + overlayErr.message + ' -- Do NOT use hardcoded overlay values. Tell the user the overlay could not be calculated.]';
        }
      } else {
        chartText += '\n[CYCLE NOTE: This person is not currently in an active developmental cycle window. Name their most recently completed cycle and the next upcoming one with approximate year.]';
      }

      const lastMsg = augmentedMessages[augmentedMessages.length - 1];
      if (lastMsg && lastMsg.role === "user") {
        augmentedMessages[augmentedMessages.length - 1] = {
          ...lastMsg,
          content: chartText + "\n\n" + lastMsg.content,
        };
      }
    } catch (err) {
      console.error("Chart fetch failed:", err.message);
      const lastMsg = augmentedMessages[augmentedMessages.length - 1];
      if (lastMsg && lastMsg.role === "user") {
        augmentedMessages[augmentedMessages.length - 1] = {
          ...lastMsg,
          content: "[CHART API ERROR: " + err.message + "]\n\n" + lastMsg.content,
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
