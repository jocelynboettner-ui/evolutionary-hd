import express from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";

const app = express();
app.use(cors());
app.use(express.json());

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const HD_API_KEY = process.env.HD_API_KEY;
const GEOCODE_API_KEY = process.env.GEOCODE_API_KEY;
const HD_AI_API_KEY = process.env.HD_AI_API_KEY;
const HD_API_URL = "https://api.humandesignapi.nl/v1/bodygraphs";
const HD_AI_BASE_URL = "https://api.humandesign.ai";

// -------------------------------------------------------
// SYSTEM PROMPT -- Evolutionary Human Design Reader
// -------------------------------------------------------
const SYSTEM_PROMPT = `You are the Evolutionary Human Design reader -- the engine behind a premium paid product that helps people understand the developmental cycle they are in, the activations and gifts that have come online to support them, and how those overlays interact with their natal design.

Today's date is March 28, 2026. Your readings are professional, accurate, warm, and powerful. Every person who uses this has paid for a real reading. You treat each one with that level of care and precision.

=======================================================
CORE PRINCIPLE OF THIS SYSTEM
=======================================================
The natal design is the permanent base blueprint. It never changes. Major developmental transits create a 7-year training field. During that field, the person is not becoming someone else -- they are being trained into a new mode of expression.

That training field temporarily activates:
- new center emphasis
- new channel capacities (activated channels)
- a new visible role (overlay profile)
- a new evolutionary mission (overlay incarnation cross)
- a new developmental theme

The reading must ALWAYS be interpreted as: NATAL SELF + DEVELOPMENTAL OVERLAY
Never as: old self replaced by new self. This distinction is the foundation of everything.

=======================================================
DATA RULES -- CRITICAL
=======================================================
1. ALL natal chart details come ONLY from the NATAL CHART DATA block. Never invent or guess.
2. ALL overlay details come ONLY from the OVERLAY CHART DATA block. Never invent or guess.
3. NEVER use hardcoded profiles, crosses, channels, or centers for any cycle. Every person's overlay is unique and comes from their real chart calculation.
4. If overlay data is missing or unavailable, say so honestly -- do not substitute template values.
5. The overlay profile, incarnation cross, channels, and defined centers are what they actually are for this person -- not a fixed template.

=======================================================
READING STRUCTURE -- ALWAYS FOLLOW THIS EXACTLY
=======================================================
When both NATAL CHART DATA and OVERLAY CHART DATA are provided, deliver the reading in this precise structure:

---

## YOUR NATAL BLUEPRINT | The Permanent Foundation

**Human Design Type:** [from natal API]
**Strategy:** [from natal API -- explain HOW to use it practically]
**Inner Authority:** [from natal API -- explain the exact mechanism for decision-making]
**Profile:** [from natal API -- explain what this means for their life role and path]
**Incarnation Cross:** [from natal API -- this is their permanent life purpose theme]
**Definition:** [from natal API -- Single/Split/Triple/Quadruple -- what this means for their energy]
**Signature / Not-Self:** [from natal API -- their compass for alignment and misalignment]

### Defined Centers -- Your Consistent Energy
[For EACH center listed in the natal API "centers" array: name it, explain its consistent function in their life]

### Open Centers -- Where You Learn, Amplify, and Grow Wise
[For each center NOT in the natal API centers array: explain what they amplify from others, and the wisdom available when not over-identified]

### Your Natal Channels -- Built-In Gifts
[For each channel in natal channels_long: name it, explain what it gives them consistently]

### Your Natal Gates -- Active Frequencies
[Interpret the most significant gates from the natal API gates array]

### Your Natal Incarnation Cross -- Permanent Life Purpose
[Interpret the natal incarnation_cross field in depth -- this is who they are here to be]

---

## YOUR CURRENT DEVELOPMENTAL CYCLE | [Cycle Name]

[Calculate age from birth year vs. March 28, 2026. Determine which cycle window applies:]

THE FOUR DEVELOPMENTAL CYCLES:
- The Becoming Cycle (Saturn Return): ages 26-33, apex at 29.5
- The Reorientation Cycle (Uranus Opposition): ages 38.5-45.5, apex at 42
- The Flowering Cycle (Chiron Return): ages 46.5-53.5, apex at 50
- The Legacy Cycle (Second Saturn Return): ages 55.5-62.5, apex at 59

[If outside all windows, name the most recently completed cycle and next upcoming cycle with estimated year.]

**Cycle:** [Formal cycle name]
**Window:** [age range]
**Your Phase in This Cycle:** [early / building toward apex / at the apex / integrating -- based on exact age]
**What This Cycle Is Training:** [one clear sentence based on the cycle purpose]

**Overlay Profile:** [FROM OVERLAY CHART DATA ONLY]
**Overlay Incarnation Cross:** [FROM OVERLAY CHART DATA ONLY]

---

## CENTERS ACTIVATED IN THIS CYCLE

[Use the OVERLAY CHART DATA "defined_centers" to identify which centers are active in the overlay. For EACH defined center in the overlay chart:]

**[Center Name]**
[Check if this center is also defined in the natal chart:]
- If ALSO defined in natal: "This center is part of your natal design and is AMPLIFIED in this cycle -- [explain what becomes stronger and more visible]."
- If OPEN in natal: "This center is open in your natal design. This cycle temporarily stabilizes and trains the themes of [center name] -- [explain what is being developed]."

[For centers defined in natal but NOT in the overlay, briefly acknowledge them as the stable foundation]

---

## ACTIVATED CHANNELS FOR THIS CYCLE

[Use the OVERLAY CHART DATA "channels" to identify activated channels. For EACH channel in the overlay chart:]

**Channel [X-Y] -- [Channel Name from overlay data]**

What this channel does: [explain the channel's gift and function]

[Check if this channel also exists in the natal channels_short array:]
- If YES: "This channel is already part of your natal design. In this cycle, it is AMPLIFIED -- [explain how its function deepens or becomes more public and powerful]."
- If NO: "This channel is not part of your natal design. In this cycle, it activates as a TEMPORARY SUPERPOWER -- a developmental gift that has come online specifically to support you through this cycle. [Explain how to use it and what it makes possible]."

---

## YOUR OVERLAY INCARNATION CROSS | The Evolutionary Mission of This Cycle

[Use the overlay incarnation_cross FROM THE OVERLAY CHART DATA ONLY]

This cross does not replace your natal cross. It describes the evolutionary mission currently governing your growth and public expression.

**Cross Name:** [from overlay chart data]
**Mission:** [interpret what this cross means for this person now]
**Shadow:** [what to watch for]
**Higher Expression:** [what becomes possible when fully lived]

[2-3 paragraphs connecting this cross to their natal design specifics and current life stage]

---

## YOUR PUBLIC PROFILE IN THIS CYCLE | How You Are Being Seen

[Use the profile FROM THE OVERLAY CHART DATA ONLY]

This profile overlay does not replace your natal profile. It describes the public role you are being trained into during this cycle.

**Overlay Profile:** [from overlay chart data]
[Explain what this profile means and how it interacts with their natal profile]

---

## WHAT THIS CYCLE IS TEACHING YOU | The Core Invitation

[3-4 rich paragraphs synthesizing natal design + cycle theme + real activated channels + real centers + real overlay cross + real profile. Speak directly to them. Be warm, precise, and powerful.]

---

## LIVING IT NOW | Practical Guidance

### Decision-Making in This Cycle
[Authority-specific guidance for making decisions under this cycle's pressures and openings]

### What to Trust and Build On
[Defined natal centers + natal channels being amplified in the overlay]

### What to Stay Curious About
[Open natal centers being trained in this cycle]

### The Body's Intelligence
[Type and authority specific -- how their body signals alignment now]

---

=======================================================
TONE AND DELIVERY
=======================================================
1. PROFESSIONAL AND WARM: Paid product. Authority of a master reader. Warmth of someone who genuinely sees them.
2. NATAL BEFORE OVERLAY: Always establish natal design first. Overlay is the second layer. Never confuse the two.
3. PRECISE NOT VAGUE: Anchor every insight in real chart mechanics from the API data provided.
4. NEVER GUESS: Use ONLY the real chart data provided. Never invent gate numbers, channel names, profiles, or crosses.
5. SPEAK TO THEIR LIFE: Connect to what this cycle actually feels like.
6. LIVING SYSTEM: Never frame Human Design as fixed.
7. NO JARGON DUMPS: Explain every technical term clearly.
8. OVERLAY IS REAL: The overlay profile and cross are this person's actual calculated chart for their cycle date -- treat them as real and specific to this individual.

=======================================================
DATA HANDLING
=======================================================
When NATAL CHART DATA and OVERLAY CHART DATA are injected, use ONLY that data.

If birth data has not been provided, warmly ask for:
- Birth date (month, day, year)
- Birth time (as exact as possible)
- Birth city and country

Say: "To calculate your complete Evolutionary Human Design reading, I need your birth date, birth time, and the city where you were born. What are those details for you?"`;

// -------------------------------------------------------
// Determine cycle type from birth date
// -------------------------------------------------------
function getCycleType(birthdate) {
  // birthdate is in format like "30-Sep-1973" or ISO
  let birthYear;
  if (birthdate.includes('-') && birthdate.length > 4) {
    const parts = birthdate.split('-');
    // Could be DD-Mon-YYYY or YYYY-MM-DD
    if (parts[0].length === 4) {
      birthYear = parseInt(parts[0]);
    } else {
      birthYear = parseInt(parts[2]);
    }
  } else {
    birthYear = parseInt(birthdate);
  }
  
  const currentYear = 2026;
  const currentMonth = 3; // March
  const age = currentYear - birthYear - (currentMonth < 4 ? 0 : 0); // approximate
  
  if (age >= 26 && age <= 33) return 'saturn-return';
  if (age >= 38 && age <= 46) return 'uranus-opposition'; // no direct endpoint, use progressed
  if (age >= 46 && age <= 54) return 'chiron-return';
  if (age >= 55 && age <= 63) return 'saturn-return'; // second saturn return
  return null;
}

// -------------------------------------------------------
// Convert birthdate from DD-Mon-YYYY to ISO 8601
// -------------------------------------------------------
function toISO8601(birthdate, birthtime) {
  const monthMap = {
    Jan:'01', Feb:'02', Mar:'03', Apr:'04', May:'05', Jun:'06',
    Jul:'07', Aug:'08', Sep:'09', Oct:'10', Nov:'11', Dec:'12'
  };
  
  // Try DD-Mon-YYYY format first
  const match = birthdate.match(/^(\d{1,2})-([A-Za-z]+)-(\d{4})$/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const month = monthMap[match[2]] || match[2];
    const year = match[3];
    return year + '-' + month + '-' + day + 'T' + (birthtime || '12:00') + ':00';
  }
  
  // Already ISO-like
  return birthdate + 'T' + (birthtime || '12:00') + ':00';
}

// -------------------------------------------------------
// Fetch overlay/return chart from humandesign.ai
// -------------------------------------------------------
async function fetchOverlayChart(birthdate, birthtime, location, cycleType) {
  if (!HD_AI_API_KEY) {
    throw new Error('HD_AI_API_KEY not configured');
  }
  
  const isoDate = toISO8601(birthdate, birthtime);
  
  // Determine timezone from location (rough mapping, API handles geocoding)
  // We'll use UTC as fallback -- the API uses the date/time as given
  let timezone = 'America/New_York'; // default
  const loc = location.toLowerCase();
  if (loc.includes('los angeles') || loc.includes('san francisco') || loc.includes('seattle') || loc.includes('portland') || loc.includes('las vegas')) {
    timezone = 'America/Los_Angeles';
  } else if (loc.includes('chicago') || loc.includes('dallas') || loc.includes('houston') || loc.includes('denver') || loc.includes('minneapolis')) {
    timezone = 'America/Chicago';
  } else if (loc.includes('london') || loc.includes('uk') || loc.includes('england')) {
    timezone = 'Europe/London';
  } else if (loc.includes('paris') || loc.includes('berlin') || loc.includes('amsterdam') || loc.includes('rome') || loc.includes('madrid')) {
    timezone = 'Europe/Paris';
  } else if (loc.includes('sydney') || loc.includes('melbourne') || loc.includes('australia')) {
    timezone = 'Australia/Sydney';
  } else if (loc.includes('toronto') || loc.includes('montreal') || loc.includes('ottawa')) {
    timezone = 'America/Toronto';
  } else if (loc.includes('vancouver')) {
    timezone = 'America/Vancouver';
  }
  
  const endpoint = cycleType === 'chiron-return' ? 'chiron-return' : 'saturn-return';
  const url = HD_AI_BASE_URL + '/' + endpoint + '?date=' + encodeURIComponent(isoDate) + '&timezone=' + encodeURIComponent(timezone) + '&api_key=' + HD_AI_API_KEY;
  
  console.log('Fetching overlay chart from:', HD_AI_BASE_URL + '/' + endpoint);
  
  const response = await fetch(url);
  if (!response.ok) {
    const err = await response.text();
    throw new Error('HD AI API error ' + response.status + ': ' + err);
  }
  return response.json();
}

// -------------------------------------------------------
// HD API CALL (natal chart via humandesignapi.nl)
// -------------------------------------------------------
async function fetchHDChart(birthdate, birthtime, location) {
  const headers = {
    "Content-Type": "application/json",
    "HD-Api-Key": HD_API_KEY,
  };
  if (GEOCODE_API_KEY) {
    headers["HD-Geocode-Key"] = GEOCODE_API_KEY;
  }
  const response = await fetch(HD_API_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ birthdate, birthtime, location }),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error("HD API error " + response.status + ": " + err);
  }
  return response.json();
}

// -------------------------------------------------------
// Format natal chart data
// -------------------------------------------------------
function formatChartData(chart, birthdate, birthtime, location) {
  const allCenters = ["Head", "Ajna", "Throat", "G", "Heart", "Sacral", "Solar Plexus", "Spleen", "Root"];
  const definedCenters = chart.centers || [];
  const undefinedCenters = allCenters.filter(c => !definedCenters.includes(c));
  return `
=== NATAL CHART DATA FROM HUMAN DESIGN API ===
Birth Details: ${birthdate} at ${birthtime} in ${location}

TYPE: ${chart.type}
STRATEGY: ${chart.strategy}
AUTHORITY: ${chart.authority}
PROFILE: ${chart.profile}
INCARNATION CROSS: ${chart.incarnation_cross}
DEFINITION: ${chart.definition}
SIGNATURE: ${chart.signature}
NOT-SELF THEME: ${chart.not_self_theme}

DEFINED CENTERS (natal): ${definedCenters.join(", ")}
OPEN/UNDEFINED CENTERS (natal): ${undefinedCenters.join(", ")}

NATAL CHANNELS (short): ${(chart.channels_short || []).join(", ")}
NATAL CHANNELS (full names): ${(chart.channels_long || []).join(", ")}
NATAL GATES: ${(chart.gates || []).join(", ")}

CIRCUITRY: ${chart.circuitries || "N/A"}
ACTIVATIONS:
  Design Sun: Gate ${chart.activations?.design?.sun || "unknown"}
  Design Earth: Gate ${chart.activations?.design?.earth || "unknown"}
  Personality Sun: Gate ${chart.activations?.personality?.sun || "unknown"}
  Personality Earth: Gate ${chart.activations?.personality?.earth || "unknown"}

ADVANCED:
  Cognition: ${chart.cognition || "N/A"}
  Determination: ${chart.determination || "N/A"}
  Variables: ${chart.variables || "N/A"}
  Motivation: ${chart.motivation || "N/A"}
  Transference: ${chart.transference || "N/A"}
  Perspective: ${chart.perspective || "N/A"}
  Distraction: ${chart.distraction || "N/A"}
=== END NATAL CHART DATA ===
`;
}

// -------------------------------------------------------
// Format overlay chart data
// -------------------------------------------------------
function formatOverlayData(overlayData, cycleType) {
  if (!overlayData) return '';
  
  // The humandesign.ai API may return data in various structures
  // Try to extract the key fields
  const chart = overlayData.chart || overlayData.bodygraph || overlayData;
  
  const allCenters = ["Head", "Ajna", "Throat", "G", "Heart", "Sacral", "Solar Plexus", "Spleen", "Root"];
  const definedCenters = chart.centers || chart.defined_centers || [];
  const undefinedCenters = allCenters.filter(c => !definedCenters.includes(c));
  
  const cycleName = cycleType === 'chiron-return' ? 'Chiron Return (Flowering Cycle)' : 'Saturn Return';
  
  return `
=== OVERLAY CHART DATA FROM RETURN CHART API ===
Cycle: ${cycleName}
Return Date: ${overlayData.return_date || overlayData.returnDate || chart.return_date || "calculated"}

OVERLAY PROFILE: ${chart.profile || overlayData.profile || "see raw data"}
OVERLAY INCARNATION CROSS: ${chart.incarnation_cross || overlayData.incarnation_cross || overlayData.cross || "see raw data"}
OVERLAY TYPE: ${chart.type || overlayData.type || "N/A"}
OVERLAY AUTHORITY: ${chart.authority || overlayData.authority || "N/A"}

OVERLAY DEFINED CENTERS: ${definedCenters.join(", ") || "see raw data"}
OVERLAY UNDEFINED CENTERS: ${undefinedCenters.join(", ")}

OVERLAY CHANNELS (short): ${(chart.channels_short || overlayData.channels_short || chart.channels || overlayData.channels || []).join(", ")}
OVERLAY CHANNELS (full names): ${(chart.channels_long || overlayData.channels_long || []).join(", ")}
OVERLAY GATES: ${(chart.gates || overlayData.gates || []).join(", ")}

RAW OVERLAY RESPONSE (for reference): ${JSON.stringify(overlayData).substring(0, 1000)}
=== END OVERLAY CHART DATA ===

CRITICAL INSTRUCTION: Use ONLY the overlay data above for ALL overlay details -- profile, incarnation cross, channels, and centers. Do NOT use any hardcoded or templated overlay values. This is a unique calculated chart for this specific person.
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
      const chart = await fetchHDChart(birthdata.birthdate, birthdata.birthtime, birthdata.location);
      let chartText = formatChartData(chart, birthdata.birthdate, birthdata.birthtime, birthdata.location);

      // 2. Determine which cycle this person is in and fetch overlay chart
      const cycleType = getCycleType(birthdata.birthdate);
      if (cycleType && HD_AI_API_KEY) {
        try {
          const overlayData = await fetchOverlayChart(birthdata.birthdate, birthdata.birthtime, birthdata.location, cycleType);
          const overlayText = formatOverlayData(overlayData, cycleType);
          chartText = chartText + '\n' + overlayText;
          console.log('Overlay chart fetched successfully for cycle:', cycleType);
        } catch (overlayErr) {
          console.error('Overlay chart fetch failed:', overlayErr.message);
          chartText = chartText + '\n[OVERLAY CHART ERROR: ' + overlayErr.message + ' -- Inform the user the overlay chart could not be calculated at this time. Do NOT use any hardcoded overlay values.]';
        }
      } else if (!HD_AI_API_KEY) {
        chartText = chartText + '\n[OVERLAY NOTE: HD_AI_API_KEY not configured -- overlay chart unavailable. Do NOT use hardcoded overlay values.]';
      } else {
        chartText = chartText + '\n[CYCLE NOTE: This person is not currently in an active developmental cycle window (ages 26-33, 38-46, 46-54, or 55-63). Name the most recently completed cycle and the next upcoming one with approximate year.]';
      }

      const lastMsg = augmentedMessages[augmentedMessages.length - 1];
      if (lastMsg && lastMsg.role === "user") {
        augmentedMessages[augmentedMessages.length - 1] = {
          ...lastMsg,
          content: chartText + "\n\n" + lastMsg.content,
        };
      }
    } catch (hdErr) {
      console.error("Natal HD API call failed:", hdErr.message);
      const lastMsg = augmentedMessages[augmentedMessages.length - 1];
      if (lastMsg && lastMsg.role === "user") {
        augmentedMessages[augmentedMessages.length - 1] = {
          ...lastMsg,
          content: "[HD API ERROR: " + hdErr.message + " -- please let the user know there was a chart lookup issue]\n\n" + lastMsg.content,
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
