// sovereign.js — the Sovereign season (Second Saturn Return as the FOCUS cycle). Owner direction, Oct 24 2026:
// "It should focus on the sovereign season and integration of their natal chart, chiron chart and sovereign overlay
// for the season. There is a new incarnation cross so it should focus on that. What are they meant to do."
// The deep section becomes ONE integration section centered on the Sovereign chart's incarnation cross. Chiron is
// woven in (not a Look Back card); earlier cycles stay compact Look Back cards. Pure helpers, server + browser.
//
// How the Sovereign cross is computed (same method the Reader uses for every cycle chart): the Second Saturn
// Return chart is a full Human Design chart cast for the exact return moment (transiting Saturn back on natal
// Saturn, peak_datetime in UTC; see overlay-time.js). Its incarnation cross comes from that chart's conscious
// (Personality) Sun and Earth at the return moment and its unconscious (Design) Sun and Earth about 88 degrees of
// solar arc earlier, with the angle set by the chart's profile (Ra Uru Hu: Right Angle, Juxtaposition, Left Angle).
export const SOVEREIGN_KEY = 'secondSaturnReturn';
export const isSovereignFocus = (focusKey) => focusKey === SOVEREIGN_KEY;
export const SOVEREIGN_SECTION = 'YOUR SOVEREIGN SEASON: INTEGRATION';

const ORDER = ['saturnReturn', 'uranusOpposition', 'chironReturn', 'secondSaturnReturn'];
/** Non-focus cycles that become Look Back cards. In the Sovereign season Chiron is woven into the integration instead. */
export function lookBackKeysFor(focusKey, overlayKeys = [], completedKeys = []) {
  return ORDER.filter(k => k !== focusKey && (overlayKeys.includes(k) || completedKeys.includes(k)) && !(isSovereignFocus(focusKey) && k === 'chironReturn'));
}

/** Plain theme of a cross for prose: "Right Angle Cross of Rulership (45/26 | 22/47)" -> "the cross of Rulership". */
export function plainCrossName(name) {
  const m = String(name || '').replace(/\s*\([^)]*\)\s*/g, ' ').trim().match(/Cross of (.+)$/i);
  return m ? `the cross of ${m[1].trim()}` : '';
}

/** "For the curious" box: the three crosses with their formal names and gates (the only place numbers appear). */
export function crossesCurious(en = []) {
  const s2 = en.find(c => c.key === SOVEREIGN_KEY), ch = en.find(c => c.key === 'chironReturn');
  if (!s2) return null;
  const g = gs => (gs || []).length ? ` (gates ${gs.join(', ')})` : '';
  return {
    title: 'FOR THE CURIOUS: THE THREE CROSSES OF YOUR SOVEREIGN SEASON',
    lines: [
      `Natal cross (the purpose you were born with, home base): ${s2.cross.natal}${g(s2.cross.natalGates)}.`,
      ...(ch ? [`Chiron Return cross (your second-half-of-life purpose, a permanent overlay since ${ch.peakDate}): ${ch.cross.cycle}${g(ch.cross.gates)}.`] : []),
      `Second Saturn Return cross (the purpose of this season, cast for your return on ${s2.peakDate}): ${s2.cross.cycle}${g(s2.cross.gates)}.`,
      'How a cycle cross is found: the chart is cast for the exact return moment. The conscious Sun and Earth come from that moment; the unconscious Sun and Earth come from about 88 degrees of the Sun earlier.',
    ],
  };
}

/** The integration prompt that replaces the Magic Wand section when the Second Saturn Return is the focus. */
export function sovereignIntegrationPrompt({ name = 'them', s2, chiron = null, rules = '' }) {
  const nm = name;
  const chironLine = chiron
    ? `the Chiron Return chart (the Phoenix, a permanent overlay since ${chiron.peakDate}: the wound that became their second-half-of-life purpose, the cross "${chiron.cross.cycle}")`
    : 'the Chiron Return (the Phoenix: the wound that became their second-half-of-life purpose; its chart data is unavailable, so speak of it only in general terms)';
  return `Write ONLY the section "${SOVEREIGN_SECTION}" for ${nm}. They are in the Second Saturn Return: Into the Sovereign, the focus of this reading (phase: ${s2.label}). In this season three charts are alive at once: the natal design (home base; it never changes; natal cross "${s2.cross.natal}"), ${chironLine}, and the Sovereign overlay for this season. Weave them into ONE picture of one life. Do not write three separate chart readings.

Center the whole section on the NEW incarnation cross of the Sovereign season, "${s2.cross.cycle}" (its four energies and Gene Keys are in the SECOND SATURN RETURN block of CYCLE EMBODIMENT DATA). The guiding question: what are they meant to do and embody in this season of their life?

First line exactly: ${SOVEREIGN_SECTION}
Then these sub-headings in order:
THE CROSS OF YOUR SOVEREIGN SEASON  (2-3 paragraphs: the new cross as the purpose of this season. Call it by its plain theme, ${plainCrossName(s2.cross.cycle) ? `"${plainCrossName(s2.cross.cycle)}"` : 'its theme in plain words'}; never write "Right Angle", "Juxtaposition", "Left Angle" or any numbers (the formal name and gates are shown in the For the curious box). Name each of its four energies by name, never by number, with its Gene Key Shadow, Gift and Siddhi as given. Answer the guiding question plainly: what this person is meant to do and embody now.)
THREE CHARTS, ONE LIFE  (2-3 paragraphs: how the purpose they were born with (natal cross, by its plain theme), what Chiron turned the wound into (the Chiron cross, by its plain theme) and the Sovereign cross integrate: what the natal purpose was always for, what the wound became, and how this season asks them to live both from their own authority rather than effort.)
THE GIFTS OF THIS SEASON  (the newly defined centers and every channel of the Sovereign overlay, each as a gift and as a deeper lesson of this season, in plain language; name the planet carrying each new energy and what that planet means)
${s2.type?.shifted ? `THE TYPE YOU ARE LEARNING: ${s2.type.cycle}  (one paragraph; natal ${s2.type.natal} remains home base)\n` : ''}YOUR NATAL WAND IN THIS SEASON  (1-2 paragraphs: how this season hands them their NATAL Magic Wand, the conscious Sun, using the NATAL WAND IN THIS CYCLE lines)
LIVING IT NOW  (1-2 paragraphs: everyday decisions in this season with natal ${s2.authority?.natal || ''} authority, which still decides)
INTEGRATION PRACTICES  (exactly 3 lines, each starting "• ")

Describe the season they are in; do not predict events or outcomes. Never frame this season as decline, withering, retirement or an ending: the Sovereign season is expansion, living from your own authority, with nothing left to prove. Length 950-1250 words. ${rules}
After the section output a line exactly <<<WORKBOOK>>> and then ONE JSON object only: {"cycleReflection":"2-3 sentence intro for this season's workbook page","purposeReflection":"2-3 sentences on what they are meant to do and embody in this season, through the new cross","practices":["3 practices"],"journalPrompts":["3 journal prompts"],"geneKeyContemplations":[{"gate":N,"prompt":"..."}],"natalWandPractices":["2 practices"]} (3 contemplations, from the Sovereign cross gates first).`;
}
