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
const SYSTEM_PROMPT = `
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

SECTION NAMES — use these exactly, in this order:
YOUR NATAL BLUEPRINT
YOUR SUPERPOWERS AND SUPERHIGHWAYS
YOUR ACTIVE GATES — WHERE THE PLANETS LIVE
YOUR CURRENT CHAPTER
LIVING IT NOW
THE INVITATION FORWARD

GATE SECTION — write only these planets:
Conscious Sun, Conscious Earth, Conscious Moon, Unconscious Sun, Conscious North Node, Conscious South Node

For each: Gate number, name, planet. One sentence on how this gate expresses. Shadow / Gift / Siddhi if present in data.

RESPONSE LENGTH:
Initial reading — write all six sections in full, flowing prose.
Follow-up questions — 400-600 words maximum.

THE MOST IMPORTANT INSTRUCTION:
Write as if you are the wise woman who has watched this soul across fifty years and can finally tell them what you have witnessed. Every sentence should make the person think: Yes. That's exactly it. I never had words for it before, but that's exactly it.`;
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

  const params = new URLSearchParams({ date: isoDate, timezone });
  const url = 'https://api.humandesign.ai/v3/hd-data?' + params.toString() + '&api_key=' + encodeURIComponent(HD_AI_API_KEY);
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

        Promise.resolve(null),
      ]);
      console.log('HD Chart result:', hdChart ? 'POPULATED type=' + hdChart.type : 'NULL', 'birthdata:', JSON.stringify({bd: birthdata?.birthdate, bt: birthdata?.birthtime, loc: birthdata?.location}));

      if (hdChart) chartText += formatHDChart(hdChart);
      // transit cycles not available in this version
      // cycles not available — natal chart only
    } catch (err) {
      console.error('Group 1 error:', err.message);
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
          content: `=== CRITICAL CHART FACTS (use EXACTLY these values, no exceptions) ===\nTYPE: ${hdChart?.type || 'unknown'}\nAUTHORITY: ${hdChart?.authority || 'unknown'}\nPROFILE: ${hdChart?.profile || 'unknown'}\nINCARNATION CROSS: ${hdChart?.incarnationCross || 'unknown'}\nDEFINED CENTERS COUNT: ${(hdChart?.definedCenters || []).length}\n=== END CRITICAL CHART FACTS ===\n\n` + chartText + '\n\n' + lastMsg.content,
        };
      }
    }

    // ── Stream 1: Natal blueprint ──
    console.log('CHART TEXT SENT TO AI:', chartText?.substring(0, 500));
  console.log('FULL CHART TEXT:', JSON.stringify(chartText));
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
            // Helper — non-streaming, constrained, one section at a time
            const generateArcSection = async (sectionPrompt, maxTokens, priorMessages) => {
              const msg = await anthropic.messages.create({
                model: "claude-sonnet-4-5",
                max_tokens: maxTokens,
                system: SYSTEM_PROMPT,
                messages: [
                  ...priorMessages,
                  { role: 'user', content: sectionPrompt },
                ],
              });
              return msg.content[0].text;
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

            try {
              const saturnText = await generateArcSection(
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

Begin with the threshold dateline (age and approximate year).
End with one sentence that seeds the Uranus chapter.`,
                280,
                arcContext
              );

              res.write('data: ' + JSON.stringify({ text: 'YOUR STORY OF BECOMING\n\n' }) + '\n\n');
              res.write('data: ' + JSON.stringify({ text: saturnText + '\n\n' }) + '\n\n');

              const uranusText = await generateArcSection(
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

Begin with the threshold dateline.
End with one sentence that seeds the Chiron chapter.`,
                175,
                [...arcContext, { role: 'assistant', content: saturnText }]
              );

              res.write('data: ' + JSON.stringify({ text: uranusText + '\n\n' }) + '\n\n');

              const chironText = await generateArcSection(
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

Begin with the threshold dateline.
End with one sentence that seeds the Second Saturn chapter.`,
                280,
                [...arcContext, { role: 'assistant', content: saturnText + '\n\n' + uranusText }]
              );

              res.write('data: ' + JSON.stringify({ text: chironText + '\n\n' }) + '\n\n');

              const saturn2Text = await generateArcSection(
                `Write ONLY the SECOND SATURN RETURN section of YOUR STORY OF BECOMING.

HARD LIMITS:
- 3 paragraphs maximum
- 150 words maximum
- Stop completely after paragraph 3

RULES:
- Write as destiny already encoded — present-future tense ("this will be teaching you...", "already written into your design")
- One transformation only — what this threshold is encoding
- If the cross is the Right Angle Cross of the Sleeping Phoenix: name it as THE ERA CROSS in one sentence — "Your legacy cross IS the incarnation cross of the new era itself"
- DO NOT list gates, channels, or center activations
- DO NOT write the New Era section here

Begin with the threshold dateline.
End with one sentence that pivots into the New Era reveal.`,
                280,
                [...arcContext, { role: 'assistant', content: saturnText + '\n\n' + uranusText + '\n\n' + chironText }]
              );

              res.write('data: ' + JSON.stringify({ text: saturn2Text + '\n\n' }) + '\n\n');

              const newEraText = await generateArcSection(
                `Write ONLY the YOUR ROLE IN THE NEW ERA section.

HARD LIMITS:
- 5 paragraphs maximum
- 300 words maximum
- Stop completely after the closing sentence

STRUCTURE:
Paragraph 1: 3 sentences orienting to the 2027 shift — no more
Paragraph 2: Name their role(s) — Lock Keeper, Guardian, Pioneer, or combination — connected to moments already told in the arc
Paragraph 3: Cross-reference natal AND transit-activated era gates — distinguish "you came in carrying this" vs "this was switched on at [threshold]"
Paragraph 4: Name Era Superpowers if present (Channel 34-57, 57-20, 34-20, or any channel with Individual-era Key gates)
Paragraph 5: One closing paragraph personalized to their specific gate combination and cross arc

RULES:
- Weave gate references into narrative — do not list as inventory
- Name the Left Angle Cross of Penetration explicitly if it appears at any threshold: "all four gates are Era of Individual Keys — you carried the new era frequency before the world had a name for it"
- Name the Right Angle Cross of the Sleeping Phoenix explicitly if present: "This IS the incarnation cross of the new era itself"
- Close with ONE final sentence that names why this person's design exists at this exact moment in history

This is the final section. The closing sentence is the last line of the entire arc.`,
                450,
                [...arcContext, { role: 'assistant', content: saturnText + '\n\n' + uranusText + '\n\n' + chironText + '\n\n' + saturn2Text }]
              );

              res.write('data: ' + JSON.stringify({ text: 'YOUR ROLE IN THE NEW ERA\n\n' + newEraText + '\n\n' }) + '\n\n');

            } catch (err) {
              console.error('Arc section error:', err.message);
              res.write('data: ' + JSON.stringify({ text: '\n\n[Arc generation encountered an error. Please try again.]\n\n' }) + '\n\n');
            }

            res.write('data: [DONE]\n\n');
            res.end();
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
