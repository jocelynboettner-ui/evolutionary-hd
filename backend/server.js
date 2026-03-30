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
const SYSTEM_PROMPT = `You are the Evolutionary Human Design reader -- the engine behind a premium paid product.
Today's date is March 29, 2026. Your readings are professional, accurate, warm, and deeply personal.
Every person who uses this has paid for a real reading. You treat each one with that level of care and precision.

CRITICAL FORMATTING RULE: Do NOT use markdown. No # pound signs for headers. No ** asterisks for bold. No bullet points with dashes or asterisks. Use plain text only. Use ALL CAPS for section titles. Use line breaks between sections. Write in flowing prose paragraphs.

=======================================================
CORE PRINCIPLE
=======================================================
The natal design is the permanent base blueprint. It never changes.
Major developmental transits create a 7-year training field where the person is being trained into a new mode of expression.
The reading must ALWAYS be interpreted as: NATAL SELF + DEVELOPMENTAL OVERLAY.
Never as: old self replaced by new self.

=======================================================
DATA RULES -- CRITICAL
=======================================================
1. ALL natal chart details come ONLY from the NATAL CHART DATA block provided with each message.
2. ALL transit cycle dates come ONLY from the TRANSIT CYCLE DATA block provided with each message.
3. NEVER say chart data is missing or incomplete if it appears in the data blocks.
4. NEVER ask the user to go get their chart elsewhere.
5. Use EVERY field: Type, Strategy, Authority, Profile, Cross, Definition, Channels, Gates.
6. For the developmental cycle section: calculate which cycle is currently active using TODAY'S DATE (March 29, 2026) against the exact start/peak/end dates in the TRANSIT CYCLE DATA block. Name the specific dates. Do not be generic.

=======================================================
READING STRUCTURE -- use these exact section titles in ALL CAPS, no pound signs
=======================================================

YOUR NATAL BLUEPRINT

Human Design Type: [type] -- [2-3 sentences on what this means for how they move through life]

Strategy: [strategy] -- [explain HOW to use it practically, what it feels like in the body]

Inner Authority: [authority] -- [explain the exact decision-making mechanism, how to access it]

Profile: [profile] -- [explain what these two numbers mean for their life role and how they show up]

Incarnation Cross: [cross] -- [their permanent life purpose, interpreted in depth, 3-4 sentences]

Definition: [definition] -- [explain what this means for their energy flow and consistency]

Signature and Not-Self: When aligned -- [signature]. When out of alignment -- [not-self theme] signals to return to Strategy and Authority.

YOUR CHANNELS -- THE BUILT-IN GIFTS

[For EACH channel listed in the data: write the channel designation (e.g. Channel 10-34), name it if known, then 2-3 sentences on the consistent gift it gives this person. Be specific to their design.]

YOUR GATES -- ACTIVE FREQUENCIES

[Pick the 6-8 most significant gates from the list. For each: Gate [number] -- [name if known] -- [2 sentences on what this frequency brings to their expression]]

YOUR CURRENT DEVELOPMENTAL CYCLE

[Use the EXACT dates from the TRANSIT CYCLE DATA block. State which cycle is currently active as of March 29, 2026 by comparing today's date to the start and end dates. Name the cycle, its window (start to end dates from the data), its peak date from the data, and whether they are before or after the peak. Then write 4-5 rich paragraphs on what this specific cycle means for this specific person given their natal blueprint. Connect their actual channels and gates to what is being trained. Be precise, warm, and powerful.]

LIVING IT NOW

Decision-Making in This Cycle: [connect their specific Inner Authority to how it operates during this developmental window -- 2 paragraphs]

What to Trust and Build On: [connect their specific channels and gates to what is solid and reliable in this cycle -- 2 paragraphs]

What to Stay Curious About: [1 paragraph on what is opening up, the questions worth sitting with]

The Body's Intelligence: [1 paragraph connecting their type and authority to somatic/embodied guidance in this cycle]

=======================================================
TONE: Professional, warm, deeply personal. Write to this specific person, not a general audience.
=======================================================`;

// -------------------------------------------------------
// Parse any date string into { year, month, day }
// -------------------------------------------------------
function parseDate(dateStr) {
  if (!dateStr) return null;
  const s = String(dateStr).trim();
  const MONTHS = { jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12 };

  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
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

// -------------------------------------------------------
// Fetch natal Human Design chart from humandesign.ai v2
// -------------------------------------------------------
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
  const url = 'https://api.humandesign.ai/v2/hd-data?' + params.toString();
  console.log('Fetching HD chart, date:', isoDate, 'tz:', timezone);

  const response = await fetch(url, { method: 'GET', headers: { 'X-Api-Key': HD_AI_API_KEY } });
  const responseText = await response.text();
  console.log('humandesign.ai status:', response.status, 'body len:', responseText.length);

  if (!response.ok) throw new Error('humandesign.ai error ' + response.status + ': ' + responseText.slice(0,200));

  const raw = JSON.parse(responseText);
  return transformHDResponse(raw);
}

// -------------------------------------------------------
// Transform humandesign.ai v2 response
// Shape: { Properties: { Type: ["Generator",...], Channels: { List: [{Option:"10 - 34"}] }, Gates: { List: [{Option:18}] } } }
// -------------------------------------------------------
function transformHDResponse(raw) {
  const P = raw?.Properties || {};
  const val = (key) => {
    const v = P[key];
    if (Array.isArray(v)) return v[0] || '';
    if (typeof v === 'string') return v;
    return '';
  };

  const channelList = P?.Channels?.List || [];
  const channels = channelList.map(c => String(c?.Option || '')).filter(Boolean);

  const gateList = P?.Gates?.List || [];
  const gates = gateList.map(g => g?.Option).filter(v => v !== undefined && v !== null);

  // Derive defined centers from channels
  const CENTER_MAP = {
    64:'Head', 61:'Head', 63:'Head',
    47:'Ajna', 24:'Ajna', 4:'Ajna', 17:'Ajna', 43:'Ajna', 11:'Ajna',
    62:'Throat', 23:'Throat', 56:'Throat', 35:'Throat', 12:'Throat', 45:'Throat', 33:'Throat', 8:'Throat', 31:'Throat', 20:'Throat', 16:'Throat',
    10:'G', 25:'G', 46:'G', 15:'G', 2:'G', 1:'G',
    51:'Heart', 21:'Heart', 40:'Heart',
    34:'Sacral', 5:'Sacral', 14:'Sacral', 29:'Sacral', 27:'Sacral', 59:'Sacral', 9:'Sacral', 3:'Sacral', 42:'Sacral',
    36:'Solar', 22:'Solar', 37:'Solar', 6:'Solar',
    48:'Spleen', 57:'Spleen', 44:'Spleen', 50:'Spleen', 32:'Spleen', 28:'Spleen', 18:'Spleen',
    53:'Root', 60:'Root', 52:'Root', 19:'Root', 39:'Root', 41:'Root', 58:'Root', 38:'Root', 54:'Root'
  };

  const definedSet = new Set();
  channels.forEach(ch => {
    ch.split('-').map(s => parseInt(s.trim())).forEach(g => { if (CENTER_MAP[g]) definedSet.add(CENTER_MAP[g]); });
  });

  const ALL_CENTERS = ['Head','Ajna','Throat','G','Heart','Sacral','Solar','Spleen','Root'];
  const definedCenters = ALL_CENTERS.filter(c => definedSet.has(c));
  const openCenters = ALL_CENTERS.filter(c => !definedSet.has(c));

  const result = {
    type:             val('Type'),
    strategy:         val('Strategy'),
    authority:        val('InnerAuthority'),
    profile:          val('Profile'),
    incarnation_cross: val('IncarnationCross'),
    definition:       val('Definition'),
    signature:        val('Signature'),
    not_self:         val('NotSelfTheme'),
    defined_centers:  definedCenters,
    open_centers:     openCenters,
    channels,
    gates,
  };

  console.log('HD transformed - type:', result.type, 'profile:', result.profile, 'channels:', channels.length, 'gates:', gates.length);
  return result;
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
  };
}

// -------------------------------------------------------
// Timezone lookup
// -------------------------------------------------------
function getTimezone(location) {
  const loc = (location || '').toLowerCase();
  if (loc.includes('los angeles')||loc.includes('san francisco')||loc.includes('seattle')||loc.includes('portland')||loc.includes('las vegas')||loc.includes('phoenix')) return 'America/Los_Angeles';
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

// -------------------------------------------------------
// Format HD chart for Claude
// -------------------------------------------------------
function formatHDChart(data) {
  return `
=== NATAL CHART DATA (humandesign.ai) ===
TYPE: ${data.type}
STRATEGY: ${data.strategy}
INNER AUTHORITY: ${data.authority}
PROFILE: ${data.profile}
INCARNATION CROSS: ${data.incarnation_cross}
DEFINITION: ${data.definition}
SIGNATURE: ${data.signature}
NOT-SELF THEME: ${data.not_self}
DEFINED CENTERS: ${data.defined_centers.join(', ')}
OPEN CENTERS: ${data.open_centers.join(', ')}
CHANNELS: ${data.channels.join(', ')}
GATES: ${data.gates.join(', ')}
=== END NATAL CHART DATA ===
`;
}

// -------------------------------------------------------
// Format transit cycles for Claude -- with explicit active cycle callout
// -------------------------------------------------------
function formatTransitCycles(data) {
  const today = new Date('2026-03-29');
  const fmt = (c) => c ? `start: ${c.start} | peak: ${c.peak} | end: ${c.end}` : 'unavailable';

  // Find which cycle is currently active
  let activeCycle = 'none';
  let activeDetails = '';
  const cycles = [
    { name: 'Saturn Return (The Becoming Cycle)', ...data.saturnReturn },
    { name: 'Uranus Opposition (The Reorientation Cycle)', ...data.uranusOpposition },
    { name: 'Chiron Return (The Flowering Cycle)', ...data.chironReturn },
    { name: 'Second Saturn Return (The Legacy Cycle)', ...data.secondSaturnReturn },
  ];
  for (const c of cycles) {
    if (c.start && c.end) {
      const s = new Date(c.start), e = new Date(c.end), p = new Date(c.peak);
      if (today >= s && today <= e) {
        activeCycle = c.name;
        const pastPeak = today > p;
        activeDetails = `ACTIVE NOW. Window: ${c.start} to ${c.end}. Peak: ${c.peak}. Today is ${pastPeak ? 'PAST the peak -- integration phase' : 'BEFORE the peak -- building phase'}.`;
        break;
      }
    }
  }

  return `
=== TRANSIT CYCLE DATA ===
TODAY: 2026-03-29
CURRENTLY ACTIVE CYCLE: ${activeCycle}
${activeDetails}

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
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: "messages array required" });

  let augmentedMessages = [...messages];

  if (birthdata && birthdata.birthdate) {
    let chartText = '';

    try {
      if (birthdata.birthtime && birthdata.location) {
        const hdChart = await fetchHumanDesign(birthdata.birthdate, birthdata.birthtime, birthdata.location);
        chartText += formatHDChart(hdChart);
        console.log('HD chart injected - type:', hdChart.type, 'channels:', hdChart.channels.length);
      }
    } catch (err) {
      console.error('HD chart error:', err.message);
      chartText += '[HD CHART ERROR: ' + err.message + ']\n';
    }

    try {
      const cycles = calculateTransitCycles(birthdata.birthdate);
      chartText += formatTransitCycles(cycles);
      console.log('Transit cycles injected');
    } catch (err) {
      console.error('Transit error:', err.message);
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

// DEBUG
app.post("/api/debug-hd", async (req, res) => {
  const { birthdate, birthtime, location } = req.body;
  try {
    const chart = await fetchHumanDesign(birthdate || '1973-09-30', birthtime || '05:07', location || 'Reading, PA');
    const cycles = calculateTransitCycles(birthdate || '1973-09-30');
    res.json({ ok: true, chart, cycles, cycleText: formatTransitCycles(cycles) });
  } catch (err) {
    res.json({ error: err.message });
  }
});

app.get("/health", (_req, res) => res.json({ ok: true }));
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
