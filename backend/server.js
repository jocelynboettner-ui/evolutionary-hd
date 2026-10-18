import express from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";
import { transformV3Response, formatV3HDChart } from "./hd-v3-parser.js";
import { fetchEvolutionaryArc, formatEvolutionaryArcForPrompt } from "./hd-evolutionary-arc.js";
import { overlayQuery } from "./overlay-time.js";
import { resolveLocalTime } from "./birth-time.js";
import { fileURLToPath } from 'url';
import path from 'path';
import crypto from 'crypto';
import { tzForLocation } from './location-tz.js';
import { parseBirthText } from './birth-parse.js';
import { formatPlanets } from './reading-context.js';
import { buildFactsBlock, attributeChannels, formatAttribution, channelList, currentCycleStatus, formatCycleStatus, bodygraphData, CYCLE_LABELS } from './reading-context.js';
import Stripe from 'stripe';
import { buildEnrichment, formatEnrichmentForPrompt } from './cycle-enrichment.js';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
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
const FOLLOW_UP_RULE = `

FOLLOW-UP MODE (overrides the section structure above): The full reading has already been delivered and is in this conversation. The person is now asking a specific follow-up question.
- Answer ONLY the question asked, directly, in 180-300 words. Open with the direct answer in the first sentence.
- Questions that use cycle language (e.g. "my cycle Manifesting Generator energy through my Generator design") are already framed correctly: honor them. Never open by telling the person they are "not" something; affirm the natal design and show how the cycle energy flows through it.
- Do NOT re-explain or restate content already in the reading (type, profile, cross, the story of becoming, the Chiron channels being permanent, "the full flowering", "how to live it now"). If it is relevant, reference it in one short clause ("as your reading described in the Chiron Return section") and add only what is NEW and specific to the question.
- Do NOT reuse the reading's section names, do not write a multi-section essay, and use at most one or two short ALL-CAPS sub-headings only if truly needed.
- Do not repeat phrases you have already used in earlier answers in this conversation.
- No "type continue", no invitations to the next section, no future cycles.
- Follow the CYCLE FRAMING RULE.`;

const SYSTEM_PROMPT = `
TIME SCOPE RULE (overrides everything below): Only write about the cycle the person is in now and cycles they have already lived through. NEVER describe, chart, date, forecast, or tease future cycles (including a Second Saturn Return that has not begun, or any cycle not yet reached). NEVER mention the 2027 era shift, "the new era", or invite them to type "new era". No "looking ahead" or "what's coming next" content. Keep the tone integrative: help them understand and integrate what is here now and what they have been through. Ignore any later instruction that conflicts with this rule.

ANTI-REPETITION RULE (applies to the whole reading and every section call): State each idea ONCE, in the one section whose purpose it serves. Never restate an earlier section's point in different words. Phrases such as "permanently yours", "the full flowering", "earned wisdom", "how to live it now" may appear at most ONCE in the entire reading. Do not end sections by summarizing what was already said. Each section must add something new.

READING OUTLINE — the reading is in this exact order; each section has ONE distinct purpose; stay inside it; natal and cycle content are never interleaved:
Part 1 (THE NATAL READING — who they are; never changes; NO cycle content here):
  YOUR NATAL BLUEPRINT: type, strategy, signature/not-self, authority, profile, defined and open centers (definition), and natal incarnation cross.
  YOUR SUPERPOWERS AND SUPERHIGHWAYS: natal channels only.
  YOUR ACTIVE GATES — WHERE THE PLANETS LIVE: every planet's gate.line, 1-2 sentences each.
Part 2 (THE CYCLES — only cycles already reached, in chronological order: Saturn Return, Uranus Opposition, Chiron Return, Second Saturn Return). For each cycle, in this order:
  YOUR [CYCLE]: the lived story of that threshold (what happened and changed; no lists).
  YOUR [CYCLE] MAGIC WAND: the energies that cycle overlays (profile, cross, type, centers, channels, planets, Gene Keys) and its practices; for the current cycle also LIVING IT NOW.
  (Chiron Return only) YOUR SECOND-HALF-OF-LIFE PURPOSE: the Chiron cross.
Then THEMES ACROSS YOUR CYCLES (only the thread connecting the cycles) and THE INVITATION FORWARD (a short integrative close).

CYCLE FRAMING RULE (applies to ALL cycle content — reading sections, cycle sections, follow-up answers, workbook text): The natal design is who the person is and it never changes (e.g. a Generator with a 4/6 profile and Sacral authority stays exactly that for life). A cycle overlay — including the Chiron Return, the full flowering — is NOT a new identity. The cycle type, profile and cross are energies flowing THROUGH the natal design in that season, and the natal authority still chooses which of them to follow. Never write "you are now a ___", "you became a ___", or "your new type/profile". Write in this spirit: "You are still a Generator who responds. In this season life is also asking you to initiate like a Manifestor, to inform, to trust your hermit 2 to be called out, in service of your new purpose." (Use the person's actual natal and cycle values from the data; that sentence is a model of tone, not data.)

OUTPUT RULE: You have NO tools. Never write tool calls, XML/HTML-style tags (e.g. <get_bodygraph>), JSON (except a <<<WORKBOOK>>> JSON block when a request explicitly asks for one), or "processing"/"calculating" steps. All chart data is already provided in the user message. Never invent chart data or dates; if a value is missing, say it is unavailable.

ABSOLUTE RULE: The user message begins with === CRITICAL CHART FACTS ===. Read the TYPE, AUTHORITY, PROFILE, and INCARNATION CROSS listed there. Write EXACTLY those values — no substitutions, no supplementing from training data. If TYPE says Generator, write Generator. If PROFILE says 4/6, write 4/6. If CROSS says Right Angle Cross of Service, write that. Your Human Design training knowledge is irrelevant — the chart facts are the only truth.


CRITICAL BEHAVIOR RULES:
- Never narrate what you are about to do. Just do it.
- Never say "I'll now generate" or "Let me begin" or any process narration.
- Never output JSON, code blocks, or tool call syntax.
- Begin the reading immediately with the first word of content.
- The reading starts with the person's name and natal blueprint — nothing before it.

You are a deeply wise Human Design guide — feminine, warm, specific, and soulful. You write as if you are a wise woman speaking to a friend over tea, not a technician reading a manual. Every word you choose is a door that either opens into recognition or closes into confusion. Your job is to make every door open into an aha moment. You translate complex Human Design concepts into language that feels like being truly seen. Not analyzed. Not diagnosed. Seen.

VOICE AND TONE:
- Warm, direct, lyrical, grounded
- Speak as the elder who has watched this soul across fifty years
- Every interpretation connects to this specific person's gates, channels, and centers from the chart data provided
- Never generic. Always specific. Always embodied.
- Write as if you are sitting across from them and can feel their field
- Always speak directly to the person — "you" not "they"

FORMATTING RULES — follow exactly:
- Never use pound signs (#) for headers
- Never use markdown syntax (no **, no ##, no __, no backticks)
- Use ALL CAPS for section titles
- Use plain dashes (---) as section dividers
- Write in flowing prose and paragraphs — no bullet points, no lists
- Do not bold anything

READING THE CHART DATA:
You will receive the person's Human Design chart as structured data at the top of the user message. Read it carefully. Every detail you write must come directly from that data — the TYPE, AUTHORITY, PROFILE, INCARNATION CROSS, DEFINED CENTERS, CHANNELS, and GATES listed there. Do not invent, assume, or supplement with generic Human Design knowledge. If the chart says Generator, write Generator. If it says 4/6, write 4/6. The data is the authority.

LANGUAGE — always use embodied language:
- Defined centers: "A town you know by heart — consistent, reliable, always yours."
- Channels: "The superhighway between two centers — a route you travel automatically."
- Open centers: "A city you are still learning — taxi territory. Receptive, flexible, wise."
- Type capacity: use full embodied description (e.g. "The ability to build with sustainable power — an engine that regenerates through work that matters and runs dry on work that doesn't.")
- Authority: "Your decision-making compass — the part of you that knows before your mind does."
- Incarnation Cross: "Your life's central theme — the specific medicine you came to offer the world."
- Not-self theme: "The feeling that tells you you've drifted from yourself."

SECTION NAMES FOR THE INITIAL (NATAL) READING — use these exactly, in this order, and write nothing about cycles in them:
YOUR NATAL BLUEPRINT  (type, strategy, signature and not-self, authority, profile, defined and open centers, natal incarnation cross)
YOUR SUPERPOWERS AND SUPERHIGHWAYS  (natal channels)
YOUR ACTIVE GATES — WHERE THE PLANETS LIVE  (every planet)
The cycle sections, themes and THE INVITATION FORWARD are written later, one call at a time.

GATE SECTION — YOUR ACTIVE GATES — WHERE THE PLANETS LIVE:
Open with exactly: "Each gate in your chart sits in a planetary position. The planet tells you HOW that gate expresses in your life."
Then cover EVERY planet listed in ALL PLANETARY ACTIVATIONS, both Conscious (Personality) and Unconscious (Design), in this order: Sun, Earth, Moon, North Node, South Node, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto, Chiron (only if provided). Use the exact gate.line from the data and the owner's PLANET MEANINGS for how each planet expresses that gate. Keep each placement to 1-2 sentences.
already walking toward you. */
For each: Gate number, name, planet. One sentence on how this gate expresses. Shadow / Gift / Siddhi if present in data.
already walking toward you.

CLOSING PROMPT 2 — END OF "continue" RESPONSE:
End with one warm, integrative sentence about what she is living now. Do not invite any further prompt about eras or future cycles.

CLOSING PROMPT 3 — NEW ERA RESPONSE INSTRUCTIONS:
Triggers when user types: new era

STEP 1 — ORIENTATION (use this language exactly, 3 paragraphs):
"For the last 400 years, humanity has been living in the Era of Planning — defined by external authority, collective structures, and the belief that someone outside you knows better. Governments, institutions, religions, educational systems — these were the guides. That era ends in 2027.

What begins is the Era of the Individual: 400 years defined by inner authority, personal sovereignty, and spirit-led living. The question is no longer what does the system tell me to do. The question is what does my own inner knowing say.

Every person alive right now carries a specific role in this crossing. Some are here to guard the wisdom of what is ending. Some are here to pioneer what is coming. Some are the bridge between the two. Your design has always known which one you are."

STEP 2 — NAME THEIR ROLE:
Cross-reference ALL gates (natal + every overlay threshold) against these three lists:
LOCK GATES (Transition Bridges): 25, 46, 10, 15, 13, 7, 1, 2
ERA OF PLANNING KEY GATES (Guardians): 37, 40, 9, 16, 61, 62, 32, 42
ERA OF INDIVIDUAL KEY GATES (Pioneers): 55, 59, 34, 20, 54, 53, 57, 51
Name their role: Lock Keeper, Guardian, Pioneer, or combination. Distinguish natal gates ("you came in carrying this") from overlay gates ("this activated at your [threshold]").

STEP 3 — ERA SUPERPOWERS:
                                 If they carry these channels (natal OR overlay), name them:
                                 Channel 34-57 = Grounded Power in Action
                                 Channel 57-20 = Spontaneous Clarity
                                 Channel 34-20 = Charismatic Manifestation
                                 Any channel with Individual-era Key gates = new era carrier

                                 STEP 4 — ONE CLOSING PARAGRAPH:
                                 Specific to their exact gate combination and cross arc. Tone: you were not born into this moment by accident.
                                 End with this exact line: "If you would like to explore what specifically came online in your design at each threshold — the channels that activated, the locks that found their keys, the superpowers that awakened — type activation."

                                 CLOSING PROMPT 4 — ACTIVATION RESPONSE INSTRUCTIONS:
                                 Triggers when user types: activation

                                 STEP 1 — OPEN WITH THIS FRAME:
                                 "Your natal design is the foundation — the capacities you arrived with. But your design is not static. At each major threshold, new channels came online, existing gates found their electromagnetic partners, and sleeping capacities finally awakened. Here is what activated in your specific design."

                                 STEP 2 — WALK THROUGH EACH THRESHOLD:
                                 For each threshold name:
                                 - The overlay cross and what frequency it carried
                                 - NEW channels that came online — described as what they ENABLE, not gate numbers
                                 - ELECTROMAGNETIC COMPLETIONS — natal gates that finally found their partner. Example: "Gate 43 had lived your entire life as insight without translation. At your Chiron Return, Gate 23 arrived and gave it a voice."
                                 - LOCK AND KEY ACTIVATIONS — where overlay gates completed natal gates into new capacity
                                 - THE CONSTELLATION — how gates that don't form a direct channel created a resonant field of new capacity together

                                 STEP 3 — CHIRON IS THE DEEPEST:
                                 Give Chiron the most depth. Present tense — this is happening now. Name what is still integrating. Name what is permanently theirs.

                                 STEP 4 — CLOSE WITH THIS EXACT PARAGRAPH:
                                 "Your design has been building toward this moment your entire life. Every threshold was preparation. Every activation was a layer of the medicine you came to offer. If you would like to explore how to live this activation now — how to embody what came online and offer it to the world — reply with your specific question and I am here."
                                 */
RESPONSE LENGTH:
Initial reading — write the three natal sections in full, flowing prose.
Follow-up questions — 400-600 words maximum.

THE MOST IMPORTANT INSTRUCTION:
Write as if you are the wise woman who has watched this soul across fifty years and can finally tell them what you have witnessed. Every sentence should make the person think: Yes. That's exactly it. I never had words for it before, but that's exactly it.

CRITICAL — STOP AFTER EACH SECTION:
The reading is delivered in layers. You MUST stop completely after YOUR ACTIVE GATES — WHERE THE PLANETS LIVE and wait for the user to respond.
Do NOT continue into YOUR STORY OF BECOMING automatically.
Do NOT generate the arc unless the user types "continue."
Never generate a New Era section.
Do NOT generate the activation section unless the user types "activation."

After YOUR ACTIVE GATES — WHERE THE PLANETS LIVE, write the closing line and then STOP. Generate nothing else. Wait for input.

The closing line after the natal reading is:
"You have seen your blueprint. If you are ready to understand where you are in the arc of your life — the initiation you are currently inside — type continue."

Then stop completely.

CLOSING PROMPT: After the natal reading, always end with this exact line:
"If you would like to explore the cycle you are currently in and your story of becoming, type continue."

/* CYCLE RESPONSE INSTRUCTIONS:

When the user asks about their cycles, thresholds, or story of becoming, follow this structure exactly.

OVERLAY CROSS DATA: The user message will contain a section called THRESHOLD OVERLAY CHARTS. This gives you the exact Human Design chart calculated at the peak of each planetary threshold — the incarnation cross, channels, and defined centers active at that precise moment. This is the core differentiator of this reading. Use the overlay cross for each threshold as the central theme of that section. Reference the channels that came online at each threshold as the specific capacity that arrived. Do not list gate numbers — translate them into what they enable in plain language.


STEP 1 — OPEN WITH THE EROS PHASES FRAMEWORK: Name which cycle they are currently in before anything else, leading with the phase name and keeping the transit name alongside. Use this language as the entry point:

First Saturn Return: The Maiden (about ages 24-33, peak 27-30, varies by chart): The first great initiation into adulthood. The structures you were handed are tested, and you begin to become your own authority.

Uranus Opposition: Closing the Mother (about ages 35-47, peak 38-44): The closing threshold of the Mother phase. The life you built starts to feel too small. Restlessness arrives. This is the invitation to question everything and reclaim the parts of yourself you left behind. This is not a crisis. This is a calling.

Chiron Return: The Phoenix (peak about 50-51; opens around 47, moves through about 54, and does not close): The Chiron Return opens the Phoenix phase. Your oldest wounds rise to finally heal. Your pain transforms into purpose. The wound and the medicine reveal themselves as the same thing, and what comes online here integrates permanently, an overlay for the rest of life.

Second Saturn Return: Into the Sovereign (peak 58-60, window about 55-63): The threshold into the Sovereign, which opens about 55-63 and does not close. The question shifts from "what do I do?" to "what do I leave?"

The Phoenix phase spans about 47-63 and holds both the Chiron Return and the Second Saturn Return, so a woman in her 50s may be inside overlapping initiations. Never use the old labels "Great Disruption", "Deep Healing" or "Legacy Catalyst", and never use erotic-arc stage labels (such as Foreplay).

Name their cycle directly and warmly before going deeper. Make them feel seen in the broader human experience first. Then show them how their specific design illuminates their unique version of that universal journey.

STEP 2 — THE 7-YEAR WINDOW: Each planetary return moves through life as a 7-year window — approximately 3.5 years before the exact return, the themes begin to build. The apex is the exact return. For 3.5 years after, the lessons integrate.

Name this window for each threshold so the person understands they are not waiting for something to happen. They are already inside it, or they have been building toward it for years.

Example language: "Your Chiron window opened around [age]. You did not need to wait for the exact return to feel it. What you have been experiencing for the past few years already has a name."

"Closing the Mother began building around [age]. The restlessness you felt was not confusion — it was the threshold arriving early."

LENGTH RULE FOR ARC — FOLLOW EXACTLY:
Saturn Return = 2 sentences maximum — what it initiated, what it gave permanently.
Uranus Opposition = 2 sentences maximum — what it disrupted, what it revealed.
Chiron Return = full depth, present tense, no length limit — this is where they are NOW.
Second Saturn Return = DO NOT INCLUDE. Remove entirely from the arc. It belongs in the follow-up prompts only. Do not generate it.
New Era section = never include.

The reader is here for where they are NOW. Everything else is context, not content. The past thresholds become two sentences of thread. The Chiron Return is the whole story. Do not give equal weight to all four thresholds — weight the Chiron Return heavily and keep the others to their sentence limits.

STEP 3 — WALK THROUGH EACH THRESHOLD: Write as one continuous story with natural chapter breaks.

For each threshold include:

The approximate age range of the full 7-year window

ONE central transformation — what opened, what became possible

What new capacity or channel arrived — described as what it ENABLES in plain language, not technical gate numbers. Example: "you gained consistent access to your own voice" not "your Throat Center defined"

What the in-between season was building toward the next threshold

WHAT TO EXCLUDE:

What released or became permeable

Technical language about centers opening or closing

Lists of gates or channels by number

Any language about loss, dissolution, or what was taken away

STEP 4 — CHIRON IS THE LONGEST AND DEEPEST SECTION: Give the Chiron Return significantly more depth than the others. Write it in present tense — this is happening now. Name what arrived as permanent gifts. Name the wound that is becoming medicine — connect it specifically to their Incarnation Cross and their natal channels. Name what this season is asking of them right now.

STEP 5 — CLOSE WITH THE CURRENT SEASON: End with 2-3 sentences about what this specific moment in their life is asking. Not generic wisdom — specific to their design, their current cycle, and what is most alive right now.

TONE THROUGHOUT: Warm, wise, personal. Write as if you have watched this person's life unfold across decades and can finally name what it all meant. Past tense for completed thresholds. Present tense for current window. Future-present for the Second Saturn Return — "already encoded, already walking toward you."

AGE CALCULATION — CRITICAL: Use today's date and the age given in CRITICAL CHART FACTS. State all ages accurately before writing anything about timing.

Approximate threshold windows (framing only; each opens about 3.5 years before its peak and closes about 3.5 years after; when the data gives actual window dates from this chart's transit, use those):

First Saturn Return: The Maiden — about ages 24-33 (peak 27-30, varies by chart)

Uranus Opposition: Closing the Mother — about ages 35-47 (peak 38-44)

Chiron Return: The Phoenix — opens about 47, moves through about 54 (peak 50-51), does not close: integrates permanently, an overlay for life

Second Saturn Return: Into the Sovereign — about ages 55-63 (peak 58-60); the Sovereign opens about 55-63 and does not close

The Phoenix phase spans about 47-63 and holds both the Chiron Return and the Second Saturn Return. */`;
async function fetchHumanDesign(birthdate, birthtime, location) {
  // Parse birthdate — accepts "YYYY-MM-DD" or "MM/DD/YYYY"
  let year, month, day;
  const iso = String(birthdate).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const mdy = String(birthdate).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (iso) { year = iso[1]; month = iso[2]; day = iso[3]; }
  else if (mdy) { year = mdy[3]; month = String(+mdy[1]).padStart(2,'0'); day = String(+mdy[2]).padStart(2,'0'); }
  else { [year, month, day] = String(birthdate).split('-'); }

  // Parse birthtime — accepts "HH:MM" or "H:MM"
  const tp = String(birthtime || '12:00').match(/^(\d{1,2}):(\d{2})/);
  const hour = tp ? String(+tp[1]).padStart(2,'0') : '12';
  const minute = tp ? tp[2] : '00';

  const isoDate = year + '-' + String(month).padStart(2,'0') + '-' + String(day).padStart(2,'0') + 'T' + hour + ':' + minute + ':00';

  // Timezone lookup — maps location strings to IANA timezone
  const loc = String(location || '').toLowerCase();
  let timezone = 'America/New_York'; // default
  if (loc.includes('los angeles') || loc.includes('la,') || loc.includes('san francisco') || loc.includes('seattle') || loc.includes('portland') || loc.includes('pacific')) timezone = 'America/Los_Angeles';
  else if (loc.includes('denver') || loc.includes('phoenix') || loc.includes('mountain')) timezone = 'America/Denver';
  else if (loc.includes('chicago') || loc.includes('dallas') || loc.includes('houston') || loc.includes('minneapolis') || loc.includes('central')) timezone = 'America/Chicago';
  else if (loc.includes('london') || loc.includes('uk') || loc.includes('england')) timezone = 'Europe/London';
  else if (loc.includes('paris') || loc.includes('berlin') || loc.includes('amsterdam') || loc.includes('rome') || loc.includes('madrid')) timezone = 'Europe/Paris';
  else if (loc.includes('sydney') || loc.includes('melbourne') || loc.includes('brisbane')) timezone = 'Australia/Sydney';
  else if (loc.includes('toronto') || loc.includes('montreal') || loc.includes('new york') || loc.includes('boston') || loc.includes('miami') || loc.includes('atlanta') || loc.includes('philadelphia') || loc.includes('reading') || loc.includes('eastern')) timezone = 'America/New_York';
  { const _tzx = tzForLocation(location || ''); if (_tzx) timezone = _tzx; }

  // Send the birth as a resolved UTC moment: humandesign.ai rejects local times that occur twice
  // or not at all around DST changes (see birth-time.js). Ordinary times resolve identically.
  const resolved = resolveLocalTime(isoDate, timezone);
  if (resolved.note) console.log('Birth time resolution:', resolved.note);
  const params = new URLSearchParams({ date: resolved.utc, timezone: 'UTC' });
  const url = 'https://api.humandesign.ai/v3/hd-data?' + params.toString() + '&api_key=' + encodeURIComponent(HD_AI_API_KEY);
  const response = await fetch(url, { method: 'GET', headers: { 'X-Api-Key': HD_AI_API_KEY } });
  const responseText = await response.text();
  if (!response.ok) throw new Error('humandesign.ai error ' + response.status + ': ' + responseText.slice(0,200));
  const chart = transformV3Response(JSON.parse(responseText));
  if (chart && resolved.note) chart.birthTimeNote = resolved.note;
  return chart;
}


// formatHDChart delegates to the v3 parser's formatV3HDChart
function formatHDChart(data) {
  return formatV3HDChart(data);
}// ============================================================
// TRANSIT CYCLE + OVERLAY FUNCTIONS
// ============================================================

async function fetchTransitCycles(birthdate, birthtime, timezone) {
  const tzToLatLon = {
    'America/New_York':    { lat: 40.71, lon: -74.01 },
    'America/Chicago':     { lat: 41.85, lon: -87.65 },
    'America/Denver':      { lat: 39.74, lon: -104.98 },
    'America/Los_Angeles': { lat: 34.05, lon: -118.24 },
    'Europe/London':       { lat: 51.51, lon: -0.13 },
    'Europe/Paris':        { lat: 48.85, lon: 2.35 },
    'Australia/Sydney':    { lat: -33.87, lon: 151.21 },
  };
  const coords = tzToLatLon[timezone] || { lat: 40.71, lon: -74.01 };
  let isoDate = birthdate;
  const mdy = String(birthdate).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) isoDate = `${mdy[3]}-${String(+mdy[1]).padStart(2,'0')}-${String(+mdy[2]).padStart(2,'0')}`;
  const response = await fetch('https://sacred-cycles-api.onrender.com/transit-cycles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date: isoDate, time: birthtime || '12:00', latitude: coords.lat, longitude: coords.lon, timezone }),
  });
  if (!response.ok) throw new Error('sacred-cycles-api error ' + response.status);
  const cycles = await response.json();
  const saturnPeak = new Date(cycles.saturnReturn.peak_datetime);
  // Saturn's precise tropical period: 29.4571 Julian years
    // This gives August 2032 for a July 2003 Saturn Return
    const SATURN_PERIOD_DAYS = 29.4571 * 365.25;
    const saturnPeakMs = new Date(cycles.saturnReturn.peak_datetime || cycles.saturnReturn.peak).getTime();
    const saturn2PeakMs = saturnPeakMs + (SATURN_PERIOD_DAYS * 24 * 60 * 60 * 1000);
    const saturn2Peak = new Date(saturn2PeakMs);
    const windowMs = 3.5 * 365.25 * 24 * 60 * 60 * 1000;
    // Prefer the ephemeris-computed 2nd Saturn return from sacred-cycles-api; fall back to 1st + period.
    if (!cycles.secondSaturnReturn?.peak_datetime) cycles.secondSaturnReturn = {
          start: new Date(saturn2PeakMs - windowMs).toISOString().split('T')[0],
          peak: saturn2Peak.toISOString().split('T')[0],
          end: new Date(saturn2PeakMs + windowMs).toISOString().split('T')[0],
          peak_datetime: saturn2Peak.toISOString(),
    };
    else cycles.secondSaturnReturn.source = 'ephemeris';
  return cycles;
}

async function fetchOverlayChart(peakDatetime, timezone) {
  // Return moments are UTC; overlayQuery casts them in UTC (see overlay-time.js).
  const q = overlayQuery(peakDatetime, null, timezone);
  const params = new URLSearchParams(q);
  const url = 'https://api.humandesign.ai/v3/hd-data?' + params.toString() + '&api_key=' + encodeURIComponent(HD_AI_API_KEY);
  const response = await fetch(url, { method: 'GET', headers: { 'X-Api-Key': HD_AI_API_KEY } });
  if (!response.ok) throw new Error('humandesign.ai overlay error ' + response.status);
  return transformV3Response(await response.json());
}

function formatOverlayData(cycles, overlays, natalChart) {
  const labels = {
    saturnReturn:       'FIRST SATURN RETURN: THE MAIDEN',
    uranusOpposition:   'URANUS OPPOSITION: CLOSING THE MOTHER',
    chironReturn:       'CHIRON RETURN: THE PHOENIX',
    secondSaturnReturn: 'SECOND SATURN RETURN: INTO THE SOVEREIGN',
  };
  let text = '\n=== THRESHOLD OVERLAY CHARTS ===\n';
  text += 'These are the Human Design charts calculated at the exact peak of each planetary threshold.\n';
  text += 'Use these overlay crosses, channels, and centers in the YOUR STORY OF BECOMING response.\n\n';
  const natalSet = new Set((natalChart?.channels || []).map(c => String(c).replace(/\s/g, '')));
  const perCycle = [];
  for (const [key, label] of Object.entries(labels)) {
    const cycle = cycles[key];
    const chart = overlays[key];
    if (!cycle || !chart) continue;
    text += `--- ${label} ---\n`;
    text += `Peak date: ${cycle.peak || cycle.peak_datetime?.slice(0,10)}\n`;
    text += `Overlay Cross: ${chart.incarnation_cross || 'unknown'}\n`;
    text += `Defined centers in this overlay (temporary themes; natal authority does NOT change): ${(chart.defined_centers || []).join(', ') || 'none'}\n`;
    text += '\n';
    perCycle.push({ key, peakDate: cycle.peak_datetime || cycle.peak, channels: (chart.channels || []).filter(c => !natalSet.has(String(c).replace(/\s/g, ''))) });
  }
  text += formatAttribution(attributeChannels(perCycle), labels) + '\n';
  text += '=== END THRESHOLD OVERLAY CHARTS ===\n';
  return text;
}

// ============================================================
// CHAT ENDPOINT
// ============================================================
function birthDetailsHelp(missing) {
  const need = (missing && missing.length) ? missing.join(', ') : 'your birth details';
  return `I couldn't read ${need} from your message. Please enter your name, birth date, birth time, and birthplace, for example:\n\nJocelyn, September 30, 1973, 5:07 AM, Reading, Pennsylvania\n\nYour reading takes a few minutes to generate; when it is complete, a Download PDF button will appear so you can print or save it.`;
}
function sendNotice(res, text, code) {
  if (!res.headersSent) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.flushHeaders();
  }
  if (res.writableEnded) return;
  res.write('data: ' + JSON.stringify({ text, notice: code }) + '\n\n');
  res.write('data: [DONE]\n\n');
  res.end();
}
// Remove any tool-call-like tags the model might emit.
const stripToolTags = (t) => String(t).replace(/<\/?(get|call|tool|function)_?[a-z_]*[^>]*>/gi, '');

// ── ACCESS CHECK: paid Stripe session or owner preview code ──
function isOwnerCode(code) {
  const expected = process.env.OWNER_PREVIEW_CODE;
  if (!expected || typeof code !== 'string' || !code) return false;
  const a = Buffer.from(code), b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
async function isPaidSession(sessionId) {
  if (typeof sessionId !== 'string' || !sessionId.startsWith('cs_')) return false;
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return session.payment_status === 'paid';
  } catch (err) {
    console.error('Stripe session check error:', err.message);
    return false;
  }
}

app.post("/api/chat", async (req, res) => {
  const { sessionId, previewCode } = req.body || {};
  if (!isOwnerCode(previewCode) && !(await isPaidSession(sessionId))) {
    return res.status(402).json({ error: "Payment required" });
  }
  // Full readings (natal + multi-section arc) can take several minutes; allow 5 min.
  req.setTimeout(300000);
  res.setTimeout(300000, () => {
    if (res.writableEnded) return;
    res.write('data: ' + JSON.stringify({
      error: "Reading is taking longer than expected. Please try again."
    }) + '\n\n');
    res.end();
  });

  const { messages } = req.body;
  let { birthdata } = req.body;
  // Fallback: parse birth details from the user's text if the client didn't send them (tolerant parser).
  if (!birthdata?.birthdate && Array.isArray(messages)) {
    for (const m of messages) {
      if (m?.role !== 'user' || typeof m.content !== 'string') continue;
      const p = parseBirthText(m.content);
      if (p.birthdate && p.location) { birthdata = { birthdate: p.birthdate, birthtime: p.birthtime, location: p.location, name: p.name }; break; }
    }
  }
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages array required" });
  }

  let augmentedMessages = [...messages];

  if (birthdata && birthdata.birthdate) {
    let chartText = '';
    let hdChart = null;
    let cycles = null;

    let overlaysForClient = null;
    let enrichment = [];
    const now = new Date();
    // ── GROUP 1: Parallel fetch — natal chart + transit cycles ──
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const _tzLoc = String(birthdata.location || '').toLowerCase();
    let _timezone = 'America/New_York';
    if (_tzLoc.includes('los angeles') || _tzLoc.includes('san francisco') || _tzLoc.includes('seattle') || _tzLoc.includes('pacific')) _timezone = 'America/Los_Angeles';
    else if (_tzLoc.includes('denver') || _tzLoc.includes('phoenix') || _tzLoc.includes('mountain')) _timezone = 'America/Denver';
    else if (_tzLoc.includes('chicago') || _tzLoc.includes('dallas') || _tzLoc.includes('houston') || _tzLoc.includes('central')) _timezone = 'America/Chicago';
    else if (_tzLoc.includes('london') || _tzLoc.includes('uk') || _tzLoc.includes('england')) _timezone = 'Europe/London';
    else if (_tzLoc.includes('paris') || _tzLoc.includes('berlin') || _tzLoc.includes('amsterdam') || _tzLoc.includes('rome') || _tzLoc.includes('madrid')) _timezone = 'Europe/Paris';
    else if (_tzLoc.includes('sydney') || _tzLoc.includes('melbourne') || _tzLoc.includes('brisbane')) _timezone = 'Australia/Sydney';
    { const _tzx = tzForLocation(birthdata.location || ''); if (_tzx) _timezone = _tzx; }

    try {
      [hdChart, cycles] = await Promise.all([
        (birthdata.birthtime && birthdata.location)
          ? fetchHumanDesign(birthdata.birthdate, birthdata.birthtime, birthdata.location)
              .catch(err => { console.error('HD chart error:', err.message); return null; })
          : Promise.resolve(null),
        (birthdata.birthdate)
          ? fetchTransitCycles(birthdata.birthdate, birthdata.birthtime, _timezone)
              .catch(err => { console.error('Transit cycles error:', err.message); return null; })
          : Promise.resolve(null),
      ]);

      console.log('HD Chart result:', hdChart ? 'POPULATED type=' + hdChart.type : 'NULL',
        'birthdata:', JSON.stringify({bd: birthdata?.birthdate, bt: birthdata?.birthtime, loc: birthdata?.location}));
      console.log('Transit cycles result:', cycles ? 'POPULATED peaks=' + JSON.stringify({
        saturn: cycles.saturnReturn?.peak,
        uranus: cycles.uranusOpposition?.peak,
        chiron: cycles.chironReturn?.peak,
        saturn2: cycles.secondSaturnReturn?.peak,
      }) : 'NULL');

      if (hdChart) chartText += formatHDChart(hdChart) + '\n' + formatPlanets(hdChart) + '\n';
      if (hdChart?.birthTimeNote) chartText += `BIRTH TIME NOTE: ${hdChart.birthTimeNote} Mention this once, briefly and plainly, at the start of the natal section, and suggest checking the birth certificate if the other occurrence/time is possible.\n`;

      if (cycles && hdChart) {
        const overlayKeys = ['saturnReturn', 'uranusOpposition', 'chironReturn', 'secondSaturnReturn'];
        const overlayCharts = await Promise.all(
          overlayKeys.map(key =>
            (cycles[key]?.peak_datetime && new Date(cycles[key].peak_datetime).getTime() <= Date.now())
              ? fetchOverlayChart(cycles[key].peak_datetime, _timezone)
                  .catch(err => { console.error(`Overlay ${key} error:`, err.message); return null; })
              : Promise.resolve(null)
          )
        );
        const overlays = Object.fromEntries(overlayKeys.map((k, i) => [k, overlayCharts[i]]));
        overlaysForClient = overlays;
        try { enrichment = buildEnrichment(hdChart, overlays, cycles, now); } catch (e) { console.error('Enrichment error:', e.message); }
        console.log('Overlays fetched:', overlayKeys.map((k,i) => k + '=' + (overlayCharts[i] ? overlayCharts[i].incarnation_cross : 'null')).join(', '));
        const overlayText = formatOverlayData(cycles, overlays, hdChart);
        if (overlayText) chartText += overlayText;
      }
    } catch (err) {
      console.error('Group 1 error:', err.message);
    }

    // Guard: no natal chart -> never call the model (it would hallucinate a chart).
    if (!hdChart) {
      console.error('No natal chart for birthdata', JSON.stringify(birthdata));
      sendNotice(res, "I couldn't calculate your chart from those details. Please check your birth date, time, and birthplace and try again, for example:\n\nJocelyn, September 30, 1973, 5:07 AM, Reading, Pennsylvania", 'chart_unavailable');
      return;
    }

    // ── Current cycle (7-yr windows; Chiron permanent after return) + bodygraph data for the client ──
    const cycleStatus = currentCycleStatus(cycles, now);
    if (cycleStatus) chartText = formatCycleStatus(cycleStatus) + '\n\n' + chartText;
    if (hdChart) {
      const natalBg = bodygraphData(hdChart);
      if (natalBg && hdChart?.birthTimeNote) natalBg.birthTimeNote = hdChart.birthTimeNote;
      const shownCycles = cycleStatus?.between ? (cycleStatus.recent ? [cycleStatus.recent] : []) : (cycleStatus?.active || []);
      const activeOverlays = shownCycles.map(c => {
        const ov = overlaysForClient?.[c.key];
        return ov ? { ...c, chart: bodygraphData(ov) } : null;
      }).filter(Boolean);
      const cycleCharts = enrichment.map(c => ({ key: c.key, label: c.label, peak: c.peakDate, chart: bodygraphData(overlaysForClient?.[c.key]) })).filter(c => c.chart);
      res.write('data: ' + JSON.stringify({ charts: { natal: natalBg, cycles: activeOverlays, status: cycleStatus, enrichment, cycleCharts } }) + '\n\n');
    }

        // ── GROUP 2: Start slow fetches in background ──
    const group2Promise = (hdChart && cycles)
      ? Promise.all([
          (() => {
            try {
              const _loc = String(birthdata.location || '').toLowerCase();
              let timezone = 'America/New_York';
              if (_loc.includes('los angeles') || _loc.includes('san francisco') || _loc.includes('seattle') || _loc.includes('pacific')) timezone = 'America/Los_Angeles';
              else if (_loc.includes('denver') || _loc.includes('phoenix') || _loc.includes('mountain')) timezone = 'America/Denver';
              else if (_loc.includes('chicago') || _loc.includes('dallas') || _loc.includes('houston') || _loc.includes('central')) timezone = 'America/Chicago';
              else if (_loc.includes('london') || _loc.includes('uk') || _loc.includes('england')) timezone = 'Europe/London';
              else if (_loc.includes('paris') || _loc.includes('berlin') || _loc.includes('amsterdam') || _loc.includes('rome') || _loc.includes('madrid')) timezone = 'Europe/Paris';
              else if (_loc.includes('sydney') || _loc.includes('melbourne') || _loc.includes('brisbane')) timezone = 'Australia/Sydney';
              { const _tzx = tzForLocation(birthdata.location || ''); if (_tzx) timezone = _tzx; }
              return fetchEvolutionaryArc(
                birthdata.birthtime, timezone, hdChart, cycles, null
              ).catch(err => { console.error('Arc error:', err.message); return null; });
            } catch (err) {
              console.error('getTimezone error:', err.message);
              return Promise.resolve(null);
            }
          })(),
          Promise.resolve(null)
            .catch(err => { console.error('Activations error:', err.message); return null; }),
        ]).catch(err => { console.error('Group 2 error:', err.message); return [null, null]; })
      : Promise.resolve([null, null]);

        if (birthdata.name) {
                chartText = `The person's name is ${birthdata.name}. Address them by name throughout the reading — warmly, naturally, the way a wise friend would.\n\n` + chartText;
        }
    // ── Inject natal chart into message ──
    if (chartText) {
      const lastMsg = augmentedMessages[augmentedMessages.length - 1];
      if (lastMsg?.role === 'user') {
        augmentedMessages[augmentedMessages.length - 1] = {
          ...lastMsg,
          content: buildFactsBlock(hdChart, birthdata, now) + '\n\n' + chartText + '\n\n' + lastMsg.content,
        };
      }
    }

    // Only generate the arc if the user explicitly typed "continue"
    const lastUserMsg = messages[messages.length - 1];
    const userText = (typeof lastUserMsg?.content === 'string' ? lastUserMsg.content : '').toLowerCase().trim();
    const isContinue = userText === 'continue' || userText.endsWith('\ncontinue') || userText.split('\n').pop().trim() === 'continue';

    // ── Stream 1: Natal blueprint ──
    console.log('CHART TEXT SENT TO AI:', chartText?.substring(0, 500));
  console.log('FULL CHART TEXT:', JSON.stringify(chartText));
    let fullText = '';

    const runArcPhase = async () => {
      try {

                const [arc, activationText] = await group2Promise;

        if ((arc || activationText) && isContinue) {
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
          if (enrichment.length) arcChartText += '\n' + formatEnrichmentForPrompt(enrichment, hdChart);

          if (arcChartText) {
            // Helper — non-streaming, constrained, one section at a time
            const generateArcSection = async (sectionPrompt, maxTokens, priorMessages) => {
              const create = (args) => anthropic.messages.create(args).catch(async (e) => {
                if (![429, 500, 529].includes(e?.status)) throw e;
                await new Promise(r => setTimeout(r, 4000));
                return anthropic.messages.create(args);
              });
              const msg = await create({
                model: "claude-sonnet-4-5",
                max_tokens: maxTokens,
                system: SYSTEM_PROMPT,
                messages: [
                  ...priorMessages,
                  { role: 'user', content: sectionPrompt },
                ],
              });
              let t = msg.content[0].text;
              // Safety net: never emit a section cut off mid-sentence.
              if (msg.stop_reason === 'max_tokens' && !t.includes('<<<WORKBOOK>>>')) {
                const cut = Math.max(t.lastIndexOf('. '), t.lastIndexOf('.\n'), t.lastIndexOf('."'), t.lastIndexOf('? '), t.lastIndexOf('! '));
                if (cut > 0) t = t.slice(0, cut + 1);
              }
              return t;
            };

            const arcContext = [
              ...augmentedMessages,
              { role: 'assistant', content: fullText },
              {
                role: 'user',
                content: arcChartText + '\n\nThe arc will be written one section at a time. Each call gives you one section only. Match the example in the system prompt exactly — paragraph count, one transformation per threshold, no gate or channel listing.',
              },
              {
                role: 'assistant',
                content: 'Understood. One section at a time. Matching the example exactly.',
              },
            ];

            // ── Cycle embodiment sections (parallel with the arc chain; one call each) ──
            const activeKeys = new Set((cycleStatus?.active || []).map(c => c.key));
            const splitWb = (t) => {
              const i = t.indexOf('<<<WORKBOOK>>>');
              if (i < 0) return { text: t.trim(), wb: null };
              const js = t.slice(i + 14); const a = js.indexOf('{'), b = js.lastIndexOf('}');
              let wb = null; try { wb = JSON.parse(js.slice(a, b + 1)); } catch (e) { console.error('Workbook JSON parse error:', e.message); }
              return { text: t.slice(0, i).trim(), wb };
            };
            const nm = birthdata.name || 'them';
            const RULES = `ANTI-REPETITION: other sections already cover the natal design (Part 1), the narrative story of each threshold (the YOUR [CYCLE] story section), the Chiron cross purpose (YOUR SECOND-HALF-OF-LIFE PURPOSE) and the thread across cycles (THEMES ACROSS YOUR CYCLES); cover only this section's purpose, state each idea once, and avoid "permanently yours" / "full flowering" unless this is the only place it appears. Plain text only: no markdown, no #, no **, no bullet symbols except "• " where asked. Sub-headings are ALL-CAPS lines on their own. Only this cycle; never mention or forecast any future cycle. Follow the CYCLE FRAMING RULE: natal design is who ${nm} is and never changes; the cycle type, profile and cross are energies flowing THROUGH it in this season, and natal authority still chooses which to follow (never "you became" / "you are now"). Use exact names and numbers from CYCLE EMBODIMENT DATA. When naming a planet carrying a gate, use its given meaning.`;
            const wandPrompt = (c) => `Write ONLY the section "YOUR ${c.transit.toUpperCase()} MAGIC WAND" for ${nm} (phase: ${c.label}). This cycle is ${activeKeys.has(c.key) ? 'CURRENT (present tense)' : 'COMPLETED (past tense, integrated now)'}. Use the ${c.label.toUpperCase()} block of CYCLE EMBODIMENT DATA. Name the phase (${c.phase}) alongside the transit name.
First line exactly: YOUR ${c.transit.toUpperCase()} MAGIC WAND
Then these sub-headings in order:
THE PROFILE YOU ARE LEARNING: ${c.profile.cycle}  (one paragraph: what the ${c.profile.cycle} lines teach in this season, sitting on top of home-base ${c.profile.natal})
${c.key === 'chironReturn' ? '' : `THE CROSS OF THIS SEASON  (one paragraph: the exact cross "${c.cross.cycle}" as the purpose being practiced; natal cross stays home)
`}${c.type.shifted ? `THE TYPE YOU ARE LEARNING: ${c.type.cycle}  (a rich subsection, 2-3 paragraphs, framed as the type initiation of this season while natal ${c.type.natal} remains home base: its strategy "${c.type.info?.strategy || ''}", its signature "${c.type.info?.signature || ''}" and not-self "${c.type.info?.notSelf || ''}", what it asks of ${nm}, and how it adds to the natal ${c.type.natal} way of moving)
` : ''}${c.authority.shifted ? `THE AWARENESS YOU ARE PRACTICING: ${c.authority.cycle}  (one short paragraph: practicing this awareness; natal ${c.authority.natal} authority remains the decision-maker, never replaced)
` : ''}THE GIFTS THAT CAME ONLINE  (the heart of this section: every newly defined center and every channel listed, each as a gift; name the planet carrying the new gate and what that planet means)
GENE KEYS FOR YOUR NEW GATES  (choose the 3-5 most important new gates, prioritising channel and cross gates; for each, one line "Gate N: Shadow X → Gift Y → Siddhi Z" then one sentence of contemplation)
${activeKeys.has(c.key) ? `LIVING IT NOW  (1-2 paragraphs: practical, everyday decision-making in this season with natal ${c.authority.natal} authority)
` : ''}INTEGRATION PRACTICES  (exactly 3 lines, each starting "• ")
Frame the cycle profile, cross and type together as the initiation of this season. Length 550-750 words; keep the JSON compact. ${RULES}
After the section output a line exactly <<<WORKBOOK>>> and then ONE JSON object only: {"cycleReflection":"2-3 sentence intro for this cycle's workbook page","practices":["3 practices"],"journalPrompts":["3 journal prompts"],"geneKeyContemplations":[{"gate":N,"prompt":"..."}]} (3 contemplations).`;
            const chiron = enrichment.find(c => c.key === 'chironReturn');
            const purposePrompt = chiron && `Write ONLY the section "YOUR SECOND-HALF-OF-LIFE PURPOSE" for ${nm}. It is the Chiron Return incarnation cross: "${chiron.cross.cycle}" (gates ${chiron.cross.gates.join(', ')}). Home base stays the natal cross "${chiron.cross.natal}".
First line exactly: YOUR SECOND-HALF-OF-LIFE PURPOSE
Write a rich, specific section (500-700 words): what this cross is and the purpose it carries; each of its four gates with its Gene Key Shadow → Gift → Siddhi as given; how the natal cross (home base) and this Chiron cross work together; how the wound becomes medicine through this purpose; what living this purpose looks like now. End with sub-heading INTEGRATION PRACTICES and exactly 3 lines starting "• ". ${RULES}
After the section output a line exactly <<<WORKBOOK>>> and then ONE JSON object only: {"purposeReflection":"2-3 sentence intro","practices":["3 practices"],"journalPrompts":["3 journal prompts"]}.`;
            const themesPrompt = enrichment.length ? `Write ONLY the closing of the reading for ${nm}: first the section "THEMES ACROSS YOUR CYCLES", then the section "THE INVITATION FORWARD".
THEMES ACROSS YOUR CYCLES (250-350 words): thread how ${enrichment.map(c => c.label).join(' → ')} built on one another: what each began and how the next deepened it. Only these cycles; nothing in the future; do not re-list gifts already given in the cycle sections.
THE INVITATION FORWARD (one short paragraph, 80-130 words): an integrative close returning to the natal design as home, with natal authority choosing. No new information, no future cycles, no "type" instructions.
Each heading on its own line exactly as written. ${RULES}
After both sections output a line exactly <<<WORKBOOK>>> and then ONE JSON object only: {"intro":"warm 3-4 sentence workbook introduction addressed to ${nm}","homeBase":"2-3 sentences summarising natal home base","themesPrompts":["3 reflection prompts about the thread across cycles"],"closing":"warm 3-4 sentence closing blessing"}.`
              : `Write ONLY the section "THE INVITATION FORWARD" for ${nm} (one paragraph, 100-150 words): an integrative close returning to the natal design, with natal authority choosing. No cycles, nothing in the future. Heading on its own line exactly. ${RULES}`;
            const extraCtx = [
              ...augmentedMessages,
              { role: 'assistant', content: fullText },
              { role: 'user', content: arcChartText + '\n\nEach following request asks for ONE section. Follow that request\'s structure and length exactly; it overrides any earlier brevity or no-listing rule.' },
              { role: 'assistant', content: 'Understood. One section per request, following its structure exactly.' },
            ];
            const wandJobs = enrichment.map(c => generateArcSection(wandPrompt(c), 4000, extraCtx).then(splitWb).catch(e => { console.error('Wand error', c.key, e.message); return null; }));
            const purposeJob = chiron ? generateArcSection(purposePrompt, 3200, extraCtx).then(splitWb).catch(e => { console.error('Purpose error', e.message); return null; }) : Promise.resolve(null);
            const themesJob = generateArcSection(themesPrompt, 2200, extraCtx).then(splitWb).catch(e => { console.error('Themes error', e.message); return null; });

            const _nowMs = Date.now();
            const reached = (k) => { const c = cycles?.[k]; if (!c) return false; const pk = new Date(c.peak_datetime || c.peak).getTime(); return !isNaN(pk) && pk - 3.5 * 365.25 * 864e5 <= _nowMs; };
            try {
              let saturnText = '', uranusText = '', chironText = '';
              if (reached('saturnReturn')) saturnText = await generateArcSection(
                `Write ONLY the SATURN RETURN section of YOUR STORY OF BECOMING.

HARD LIMITS:
- 3 paragraphs maximum
- 150 words maximum
- Stop completely after paragraph 3

RULES:
- One transformation only — what this threshold broke open, what it gave, what they kept
- Past tense throughout
- Cross-reference the Saturn Return cross gates against the Lock/Key/Pioneer lists — weave into story naturally, do not announce
- DO NOT list gates, channels, centers, or what defined/released
- DO NOT write about any other threshold

Begin with the threshold dateline (actual dates from the data), naming its EROS phase (The Maiden / Closing the Mother / The Phoenix / Into the Sovereign) alongside the transit name (age and approximate year).
End with one integrative sentence about what this threshold left them with.`,
                700,
                arcContext
              );


              if (reached('uranusOpposition')) uranusText = await generateArcSection(
                `Write ONLY the URANUS OPPOSITION section of YOUR STORY OF BECOMING.

HARD LIMITS:
- 2 paragraphs maximum
- 100 words maximum
- Stop completely after paragraph 2

RULES:
- One transformation only — what Uranus detonated, what it revealed
- Past tense throughout
- If the cross name carries transmission language (Contagion, Penetration, Upheaval), name the carrier quality in one sentence woven naturally
- DO NOT list gates, channels, centers, or what defined/released
- DO NOT write about any other threshold

Begin with the threshold dateline (actual dates from the data), naming its EROS phase (The Maiden / Closing the Mother / The Phoenix / Into the Sovereign) alongside the transit name.
End with one integrative sentence about what this threshold left them with.`,
                500,
                [...arcContext, { role: 'assistant', content: saturnText }]
              );


              if (reached('chironReturn')) chironText = await generateArcSection(
                `Write ONLY the CHIRON RETURN section of YOUR STORY OF BECOMING.

HARD LIMITS:
- 3 paragraphs maximum
- 150 words maximum
- Stop completely after paragraph 3

RULES:
- One transformation only — what the wound revealed as medicine
- If this threshold is active or recent: present tense. If complete: past tense
- Name ONE significant channel activation only (the most important one) — woven into the story, not listed
- If Channel 42-53 is present: name it as THE BRIDGE CHANNEL in one sentence
- DO NOT list multiple channels, gates, or center activations
- DO NOT write about any other threshold

Begin with the threshold dateline (actual dates from the data), naming its EROS phase (The Maiden / Closing the Mother / The Phoenix / Into the Sovereign) alongside the transit name.
End with one sentence about how this is integrating in their life now. Do not mention anything still to come.`,
                700,
                [...arcContext, { role: 'assistant', content: saturnText + '\n\n' + uranusText }]
              );


              let s2 = '';
              if (reached('secondSaturnReturn')) {
                s2 = await generateArcSection(
                  `Write ONLY the SECOND SATURN RETURN section of YOUR STORY OF BECOMING (this person is in or past it).

HARD LIMITS: 3 paragraphs, 150 words maximum.
RULES: one transformation only; present tense if active, past tense if complete; no gate/channel lists; do not write about any other threshold or anything still to come.
Begin with the threshold dateline (actual dates from the data), naming its EROS phase (The Maiden / Closing the Mother / The Phoenix / Into the Sovereign) alongside the transit name. End with one integrative sentence.`,
                  700,
                  [...arcContext, { role: 'assistant', content: [saturnText, uranusText, chironText].filter(Boolean).join('\n\n') }]
                );
              }


              // (New Era section removed: readings do not forecast future eras or cycles.)

              // Emit cycles in chronological order — story, Magic Wand, (Chiron) purpose — then themes + closing.
              const wands = await Promise.all(wandJobs);
              const [purpose, themes] = await Promise.all([purposeJob, themesJob]);
              const workbook = { cycles: {}, purpose: purpose?.wb || null, themes: themes?.wb || null };
              const stories = { saturnReturn: saturnText, uranusOpposition: uranusText, chironReturn: chironText, secondSaturnReturn: s2 };
              const LABEL = { saturnReturn: 'FIRST SATURN RETURN: THE MAIDEN', uranusOpposition: 'URANUS OPPOSITION: CLOSING THE MOTHER', chironReturn: 'CHIRON RETURN: THE PHOENIX', secondSaturnReturn: 'SECOND SATURN RETURN: INTO THE SOVEREIGN' };
              const emit = t => res.write('data: ' + JSON.stringify({ text: stripToolTags(t) }) + '\n\n');
              const cleanStory = t => String(t || '').replace(/^\s*YOUR STORY OF BECOMING\s*/i, '').replace(new RegExp('^\\s*(YOUR\\s+)?(THE\\s+)?(1ST\\s+|FIRST\\s+)?(SATURN RETURN|URANUS OPPOSITION|CHIRON RETURN|SECOND SATURN RETURN|2ND SATURN RETURN)[^\\n]{0,40}\\n'), '').trim();
              for (const key of ['saturnReturn', 'uranusOpposition', 'chironReturn', 'secondSaturnReturn']) {
                const ei = enrichment.findIndex(c => c.key === key);
                const story = cleanStory(stories[key]);
                const w = ei >= 0 ? wands[ei] : null;
                if (!story && !w?.text) continue;
                emit(`[[CYCLE:${key}]]\n\n${LABEL[key]}\n\n` + (story ? story + '\n\n' : ''));
                if (w?.text) emit(w.text + '\n\n');
                if (w?.wb) workbook.cycles[key] = w.wb;
                if (key === 'chironReturn' && purpose?.text) emit(purpose.text + '\n\n');
              }
              emit('[[CLOSING]]\n\n' + (themes?.text ? themes.text + '\n\n' : ''));
              res.write('data: ' + JSON.stringify({ workbook }) + '\n\n');

            } catch (err) {
              console.error('Arc section error:', err.message);
              res.write('data: ' + JSON.stringify({ text: '\n\n[Arc generation encountered an error. Please try again.]\n\n' }) + '\n\n');
            }

          }
        }
      } catch (err) {
        console.error('Group 2 completion error:', err.message);
      }
      if (!res.writableEnded) {
        res.write('data: [DONE]\n\n');
        res.end();
      }
    };

    // On "continue", stream ONLY the section-by-section Story of Becoming.
    // (Previously the model also streamed its own full story first, so it appeared twice.)
    const [arcForContinue] = isContinue ? await group2Promise : [null];
    if (isContinue && arcForContinue) {
      fullText = '(The natal reading above has been delivered. Continuing with the Story of Becoming.)';
      await runArcPhase();
    } else {
      // Follow-up question after the reading: answer just that question, concisely.
      const isFollowUp = messages.some(m => m?.role === 'assistant' && typeof m.content === 'string' && m.content.length > 500);
      if (isFollowUp) {
        const li = augmentedMessages.length - 1;
        if (augmentedMessages[li]?.role === 'user') augmentedMessages[li] = { ...augmentedMessages[li], content: augmentedMessages[li].content + '\n\n[FOLLOW-UP MODE: answer only this question in 180-300 words. Honor the cycle framing in the question (natal design is who I am; cycle energies flow through it); never open by correcting the question. Do not re-explain what the reading already covered.]' };
      }
      const stream = anthropic.messages.stream({
        model: "claude-sonnet-4-5",
        max_tokens: isFollowUp ? 900 : 16000,
        system: isFollowUp ? SYSTEM_PROMPT + FOLLOW_UP_RULE : SYSTEM_PROMPT,
        messages: augmentedMessages,
      });
      stream.on('text', (text) => {
        fullText += text;
        if (!res.writableEnded) res.write('data: ' + JSON.stringify({ text: stripToolTags(text) }) + '\n\n');
      });
      stream.on('message', runArcPhase);
      stream.on('error', (err) => {
        if (res.writableEnded) return;
        res.write('data: ' + JSON.stringify({ error: err.message }) + '\n\n');
        res.end();
      });
    }

  } else {
    // ── No birth data: never call the model without a chart ──
    const lastUser = [...messages].reverse().find(m => m?.role === 'user');
    const missing = parseBirthText(lastUser?.content || '').missing;
    sendNotice(res, birthDetailsHelp(missing), 'missing_birthdata');
  }
});

app.post("/api/debug-hd", async (req, res) => {
  const { birthdate, birthtime, location } = req.body;
  try {
    const chart = await fetchHumanDesign(birthdate || '1973-09-30', birthtime || '05:07', location || 'Reading, PA');
    const cycles = null;
    res.json({ ok: true, chart, cycles });
  } catch (err) {
    res.json({ error: err.message });
  }
});


app.post("/api/debug-raw", async (req, res) => {
  const { birthdate, birthtime, location } = req.body;
  try {
    const _loc2 = String(location || '').toLowerCase();
    let timezone = 'America/New_York';
    if (_loc2.includes('los angeles') || _loc2.includes('pacific')) timezone = 'America/Los_Angeles';
    else if (_loc2.includes('chicago') || _loc2.includes('central')) timezone = 'America/Chicago';
    else if (_loc2.includes('london') || _loc2.includes('uk')) timezone = 'Europe/London';
    { const _tzx = tzForLocation(location || ''); if (_tzx) timezone = _tzx; }
    const iso2 = String(birthdate).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const mdy2 = String(birthdate).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    let year, month, day;
    if (iso2) { year = iso2[1]; month = iso2[2]; day = iso2[3]; }
    else if (mdy2) { year = mdy2[3]; month = String(+mdy2[1]).padStart(2,'0'); day = String(+mdy2[2]).padStart(2,'0'); }
    else { [year, month, day] = String(birthdate).split('-'); }
    const timeParts = (birthtime || '05:07').match(/^(\d{1,2}):(\d{2})/);
    const hour = String(timeParts ? +timeParts[1] : 5).padStart(2, '0');
    const minute = String(timeParts ? +timeParts[2] : 0).padStart(2, '0');
    const isoDate = year + '-' + String(month).padStart(2,'0') + '-' + String(day).padStart(2,'0') + 'T' + hour + ':' + minute + ':00';
    const params = new URLSearchParams({ date: resolveLocalTime(isoDate, timezone).utc, timezone: 'UTC', api_key: HD_AI_API_KEY });
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

// ── STRIPE CHECKOUT ──────────────────────────────────────────

app.post('/api/create-checkout-session', async (req, res) => {
    try {
          const { birthdate, birthtime, location, name } = req.body;

          const session = await stripe.checkout.sessions.create({
                  payment_method_types: ['card'],
                  line_items: [{
                            price_data: {
                                        currency: 'usd',
                                        product_data: {
                                                      name: 'The Evolutionary Human Design Reader',
                                                      description: 'Your design. Your wound. Your major life transits. All of it rendered into a reading so precise it will feel like someone finally turned the lights on in a room you\'ve been navigating in the dark.',
                                        },
                                        unit_amount: 3300,
                            },
                            quantity: 1,
                  }],
                  mode: 'payment',
                  success_url: `${process.env.FRONTEND_URL}?session_id={CHECKOUT_SESSION_ID}`,
                  cancel_url: `${process.env.FRONTEND_URL}`,
                  metadata: {
                            birthdate: birthdate || '',
                            birthtime: birthtime || '',
                            location: location || '',
                            name: name || ''
                  }
          });

          res.json({ url: session.url });
    } catch (err) {
          console.error('Stripe error:', err.message);
          res.status(500).json({ error: err.message });
    }
});

app.get('/api/verify-session/:sessionId', async (req, res) => {
    try {
          const session = await stripe.checkout.sessions.retrieve(
                  req.params.sessionId
                );
          if (session.payment_status === 'paid') {
                  res.json({
                            paid: true,
                            birthdate: session.metadata.birthdate,
                            birthtime: session.metadata.birthtime,
                            location: session.metadata.location,
                            name: session.metadata.name
                  });
          } else {
                  res.json({ paid: false });
          }
    } catch (err) {
          console.error('Stripe verify error:', err.message);
          res.status(500).json({ error: err.message });
    }
});

// ── END STRIPE ───────────────────────────────────────────────


app.get("/health", (_req, res) => res.json({ ok: true }));

// Serve React frontend
app.use(express.static(path.join(__dirname, '../frontend/dist'), {
  setHeaders: (res, p) => { if (p.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache'); },
}));
app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
