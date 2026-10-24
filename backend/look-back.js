// look-back.js — the compact LOOK BACK insert (owner direction, Oct 24 2026).
// Only the FOCUS cycle is read in depth (gates and channels as its deeper lessons). Every other cycle the person
// has entered (completed cycles, and any non-focus cycle still integrating as an overlay) gets a small Look Back
// card: its years and ages, 2-3 plain sentences on the season's theme and lesson, and 2 journal prompts asking
// what was going on in their life then and what they remember in light of that lesson. No gate-by-gate analysis.
// Future cycles are never surfaced. Pure helpers, server + browser.
import { CYCLE_LABELS } from './reading-context.js';

export const LOOK_BACK_TITLE = 'LOOKING BACK';
export const LOOK_BACK_INTRO = "A short look back at the seasons you've already walked through. You don't need to study them. Notice what you remember, and what each one was teaching you.";
export const LOOK_BACK_PROMPTS_HEADING = 'LOOK BACK';
export const STILL_INTEGRATING = 'Still integrating';

// Plain lesson per cycle, used for the fallback text (and as the lesson named in fallback prompts).
const LESSON = {
  saturnReturn: { theme: 'the first great test of adulthood: the structures you were handed were tested, and you began to become your own authority', lesson: 'becoming your own authority' },
  uranusOpposition: { theme: 'the season the life you had built started to feel too small, and the parts of yourself you had set aside to be useful asked to come back', lesson: 'reclaiming the parts of yourself you had set aside' },
  chironReturn: { theme: 'the phase no one named, when your oldest wound rose so it could stop running your life', lesson: 'letting the old wound stop running your life' },
  secondSaturnReturn: { theme: 'the threshold into the Sovereign, when the question shifted from what you do to what you leave', lesson: 'living from your own authority, with nothing left to prove' },
};

const yearOf = s => { const m = String(s || '').match(/^(\d{4})/); return m ? +m[1] : null; };
const birthYear = bd => { const m = String(bd || '').match(/(\d{4})/); return m ? +m[1] : null; };

/** Years + ages line for a cycle window, e.g. "2012–2019 · about ages 39–46" (Chiron: "since 2019 · from about age 46"). */
export function lookBackYears(c, birthdate) {
  const s = yearOf(c?.start), e = c?.end === 'for the rest of life' ? null : yearOf(c?.end), by = birthYear(birthdate);
  if (!s) return '';
  if (!e) return `Since ${s}${by ? ` · from about age ${s - by}` : ''}`;
  return `${s}–${e}${by ? ` · about ages ${s - by}–${e - by}` : ''}`;
}

/** Deterministic fallback when the model's JSON is missing or unusable. */
export function fallbackLookBack(key, c, active = false) {
  const L = LESSON[key] || { theme: 'a season of change', lesson: 'what that season was teaching you' };
  const s = yearOf(c?.start), e = c?.end === 'for the rest of life' ? null : yearOf(c?.end);
  const span = s && e ? `between ${s} and ${e}` : s ? `since ${s}` : 'in that season';
  return {
    summary: active
      ? `This is ${L.theme}. It is still settling in alongside the season you are in now, and what it opened is part of how you meet today.`
      : `This was ${L.theme}. You do not need to dissect it. What it taught you is already part of how you meet the season you are in now.`,
    prompts: [
      `What was going on in your life ${span}? Where were you living, who was close, and what were you carrying?`,
      `Looking back, what do you remember about that time in light of its lesson, ${L.lesson}? What did you learn that you still use?`,
    ],
  };
}

/** The prompt for ONE model call that writes every Look Back card at once (JSON only). */
export function lookBackPrompt({ name = 'them', items = [], birthdate = '' }) {
  const lines = items.map(({ key, c, active }) => `- "${key}": ${CYCLE_LABELS[key] || key}, ${lookBackYears(c, birthdate) || 'window dates unavailable'}; ${active ? 'STILL INTEGRATING alongside the focus cycle (present perfect: what it has been opening)' : 'COMPLETED (past tense)'}`);
  return `Write ONLY the LOOK BACK insert for ${name}: a short look back at the cycles listed below, which are NOT the focus of this reading. This is a look back, not a study.

For each cycle write:
- "summary": 2-3 sentences, 60 words maximum, in plain everyday language: the theme of that season and the lesson it was teaching, read against the natal design (home base). Name the phase alongside the transit name once.
- "prompts": exactly 2 journal prompts. Prompt 1 asks what was going on in their life during that window, using its years (where they were, who was close, what they were carrying). Prompt 2 asks what they remember about that time in light of the lesson the season was teaching, naming the lesson in plain words.

HARD RULES: no gates, channels, centers, profiles, crosses, Gene Keys, planet meanings or line numbers (the transit name, such as Saturn Return, is fine); no gate-by-gate or channel analysis; no numbers except years and ages; do not repeat the focus cycle's content; never mention or forecast a future cycle. Follow the voice and LENS rules.

Cycles:
${lines.join('\n')}

Output ONE JSON object only, nothing before or after it: {${items.map(i => `"${i.key}":{"summary":"...","prompts":["...","..."]}`).join(',')}}`;
}

/** Parse the model output into { key: { summary, prompts[2] } }, keeping only well-formed entries. */
export function parseLookBack(text, keys = []) {
  const t = String(text || ''); const a = t.indexOf('{'), b = t.lastIndexOf('}');
  let j = null; try { j = JSON.parse(t.slice(a, b + 1)); } catch { return {}; }
  const out = {};
  for (const k of keys) {
    const v = j?.[k]; const s = String(v?.summary || '').trim(); const p = (Array.isArray(v?.prompts) ? v.prompts : []).map(x => String(x || '').trim()).filter(Boolean);
    if (s && p.length >= 2) out[k] = { summary: s, prompts: p.slice(0, 2) };
  }
  return out;
}

/** The text block the server emits after a [[PAST:key]] marker (one compact card). */
export function formatLookBackBlock({ label, years, active = false, summary, prompts }) {
  return [label.toUpperCase(), (active ? STILL_INTEGRATING + ' · ' : '') + years, summary, LOOK_BACK_PROMPTS_HEADING, ...prompts.map(p => '• ' + p)].filter(Boolean).join('\n\n');
}

/** Parse a card block back into parts for the web card and the PDF box. Unstructured text falls back to summary only. */
export function parseLookBackBlock(text) {
  const parts = String(text || '').split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
  const hi = parts.indexOf(LOOK_BACK_PROMPTS_HEADING);
  if (hi < 0) return { label: '', years: '', active: false, summary: parts.join('\n\n'), prompts: [] };
  const head = parts.slice(0, hi);
  const label = head[0] && head[0] === head[0].toUpperCase() ? head.shift() : '';
  const yl = head[0] && /^(Still integrating · )?(Since )?\d{4}/.test(head[0]) ? head.shift() : '';
  const active = yl.startsWith(STILL_INTEGRATING);
  return { label, years: yl.replace(STILL_INTEGRATING + ' · ', ''), active, summary: head.join(' '), prompts: parts.slice(hi + 1).map(p => p.replace(/^[•\-]\s*/, '')) };
}
