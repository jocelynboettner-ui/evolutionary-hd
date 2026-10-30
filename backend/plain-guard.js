// plain-guard.js — light post-processing guard for MODEL-WRITTEN reading prose (owner: plain language in the
// body; gate/channel/line numbers live only in the cards and the small "For the curious" notes).
// The prompt already forbids numbers; this catches what slips through. Idempotent, pure, server + browser.
//   "(Gate 23)", "(Gate 10.4)", "(gates 45, 26, 22 and 47)", "(45/26 | 22/47)", "(18.4)"  -> removed
//   "the 21-45 Channel of Money" -> "the Channel of Money";  "Channel 42-53" -> "the Channel of Maturation"
//   "Gate 45" / "Gate 18, line 4" / "Gate 18.4" -> "the energy of Synergy" (its Gene Key gift)
//   bare "18.4" -> removed; "hanging gate" -> plain phrase; "Gene Key 21" -> "its Gene Key"
import { GENE_KEYS, CHANNELS } from './cycle-enrichment.js';
import { channelLabel, normChannelKey } from './reading-context.js';
import { ROLE_MODEL_LINE, TOWNS_SENTENCE, UNWANTED_WORK } from './reading-copy.js';

const CH = new Set(CHANNELS.map(([a, b]) => `${a}-${b}`));
const isChannel = (a, b) => CH.has(`${Math.min(a, b)}-${Math.max(a, b)}`);
const chName = (a, b) => channelLabel(normChannelKey(`${a}-${b}`)).replace(/^\d+-\d+\s+/, '');   // "Channel of Money"
const gateName = g => (GENE_KEYS[g] ? `the energy of ${GENE_KEYS[g][1]}` : 'this energy');
const NUM = String.raw`\d{1,2}(?:\.\d)?`;
const SEP = String.raw`\s*(?:,|and|&|\/|\||-|–|or)\s*`;

export function plainProse(text) {
  if (typeof text !== 'string' || !text) return text;
  let t = text;
  // 1. Parentheticals that hold only gate/line/channel references.
  t = t.replace(new RegExp(String.raw`\s*\((?:(?:the\s+)?(?:gates?|channel|line)\s*)?${NUM}(?:${SEP}(?:(?:gates?|line)\s*)?${NUM})*\)`, 'gi'), '');
  // 2. Channels.
  t = t.replace(/\b(\d{1,2})\s*[-–]\s*(\d{1,2})\s+(Channel)\b/g, (m, a, b, c) => (isChannel(+a, +b) ? c : m));
  t = t.replace(/\b[Cc]hannel\s+(\d{1,2})\s*[-–]\s*(\d{1,2})\b(\s+(?:Channel\s+)?of\s+[A-Z][\w' ]*)?/g, (m, a, b, named) => (isChannel(+a, +b) ? (named ? 'Channel' + named.replace(/^\s+Channel/, '') : 'the ' + chName(+a, +b)) : m));
  t = t.replace(/(?<![\w$-])(?:the\s+)?(\d{1,2})\s*[-–]\s*(\d{1,2})(?![\w%-]|\s*(?:years?|percent))/gi, (m, a, b, off, s) => {
    if (!isChannel(+a, +b) || /\b(?:ages?|aged|about|between|from|around)\s*$/i.test(s.slice(Math.max(0, off - 12), off))) return m;
    return 'the ' + chName(+a, +b);
  });
  // 3. Gates (and their lines).
  // 3a. Readable rewrites first: "Gate 18 - the Gate of Correction" -> "the Gate of Correction";
  //     "The Gift of Gate 18" -> "Its Gift"; "Line 4 of Gate 18" -> "Its line".
  t = t.replace(/\b[Gg]ate\s+\d{1,2}(?:\.\d)?(?:,?\s+line\s+\d)?\s*(?:[-–—,:]\s*)+(?=(?:the\s+)?Gate of\b)/g, '');
  t = t.replace(/\b[Ll]ine\s+[1-6]\s+(?:of|in)\s+(?:your\s+)?[Gg]ate\s+\d{1,2}\b/g, m => (m[0] === 'L' ? 'Its line' : 'its line'));
  t = t.replace(/\b([Tt]he)\s+(Gift|Shadow|Siddhi|keynote|Gene Key)\s+(?:of|for)\s+[Gg]ate\s+\d{1,2}\b/g, (m, the, w) => (the === 'The' ? 'Its ' : 'its ') + w);
  t = t.replace(/\b([Gg]ates?):?\s+(\d{1,2})((?:\s*(?:,|and|&)\s*(?:and\s+)?\d{1,2}\b)+)/g, (m, w, g1, rest, off, src) => {
    const counted = /\b(?:two|three|four|five|six|both|these|its|their|your)\s*$/i.test(src.slice(Math.max(0, off - 8), off));
    const gs = [g1, ...rest.match(/\d{1,2}/g)].map(Number), names = gs.map(g => GENE_KEYS[g]?.[1]).filter(Boolean);
    if (names.length !== gs.length) return m;
    return `${counted ? '' : 'the '}energies of ${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  });
  t = t.replace(/\b[Gg]ates?\s+(\d{1,2})(?:\.\d|,?\s+line\s+\d)?\b/g, (m, g) => gateName(+g));
  t = t.replace(/\b([Tt]he)\s+(\d{1,2})\b(?=\s+(?:sees|brings|is|gives|asks|carries|holds|says|adds|stays|teaches|wants|knows|calls|meets|needs|and)\b)/g, (m, the, g) => (+g > 6 && GENE_KEYS[+g] ? (the === 'The' ? 'The' : 'the') + gateName(+g).slice(3) : m));
  t = t.replace(/\b[Gg]ene [Kk]eys?\s+\d{1,2}\b/g, 'its Gene Key');
  t = t.replace(/\bLine\s+[1-6]\b/g, 'Its line').replace(/,\s*line\s+[1-6]\b/g, '').replace(/\bline\s+[1-6]\b/g, 'its line');
  // 4. Bare gate.line codes (not percentages / money).
  t = t.replace(/\s?(?<![\w$.])\d{1,2}\.[1-6](?![\d%]|\.\d)/g, '');
  // 5. Jargon.
  t = t.replace(/\bhanging gates?\b/gi, 'an energy that comes fully alive with the right people');
  t = t.replace(/\ba\s+an energy that comes fully alive/gi, 'an energy that comes fully alive');
  t = dropRepeatedAlive(t);
  t = t.replace(/doing work that does not want you/gi, UNWANTED_WORK);
  t = t.replace(/\bwork that (?:does not|doesn't) want you\b/gi, "work that you don't want to do");
  t = replaceObscurePath(t);
  t = ensureRoleModelLine(t);
  t = ensureTownsSentence(t);
  // Tidy: doubled spaces, space before punctuation, "the the", sentence-start capitals.
  t = t.replace(/[ \t]{2,}/g, ' ').replace(/ +([,.;:!?])/g, '$1').replace(/\bthe the\b/gi, 'the').replace(/,\s*,/g, ',');
  t = t.replace(/(^|[.!?]\s+|\n\s*|\n\s*[•-]\s+)(the energies of|the energy of|the Channel of|its Gene Key|this energy)/g, (m, pre, w) => pre + w[0].toUpperCase() + w.slice(1));
  return t;
}

const ALIVE = 'fully alive with the right people';
// The sun-gate sentence is easy for the model to say twice (the prompt names it, then the
// hanging-gate rewrite says it again). Keep the first sentence; drop later ones.
function dropRepeatedAlive(text) {
  const needle = ALIVE.toLowerCase();
  if (text.toLowerCase().indexOf(needle) === text.toLowerCase().lastIndexOf(needle)) return text;
  let seen = false;
  return text.replace(/[^.!?\n]*fully alive with the right people[^.!?\n]*[.!?]?/gi, (m) => {
    if (!seen) { seen = true; return m; }
    return '';
  });
}

// The 6th-line role-model sentence. Replaces "obscure the path…" if the model still writes it,
// and adds the chosen line once when home base is already describing that phase.
function replaceObscurePath(text) {
  if (!text || !/obscure the path/i.test(text)) return text;
  const line = ROLE_MODEL_LINE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text
    .replace(/[^.!?\n]*\bobscure the path\b[^.!?\n]*[.!?]?/gi, ROLE_MODEL_LINE)
    .replace(new RegExp(line + '(?:\\s*' + line + ')+', 'g'), ROLE_MODEL_LINE);
}
function ensureRoleModelLine(text) {
  if (!text || text.includes(ROLE_MODEL_LINE)) return text;
  const head = text.search(/YOUR HOME BASE\b/);
  if (head < 0) return text;
  const rest = text.slice(head);
  const nextHead = rest.slice(1).search(/\nYOUR [A-Z]/);
  const end = nextHead < 0 ? text.length : head + 1 + nextHead;
  const section = text.slice(head, end);
  if (!/role model|off the roof/i.test(section)) return text;
  const sentences = section.split(/(?<=[.!?])\s+/);
  const target = sentences.find(s => /role model|off the roof/i.test(s));
  if (!target) return text;
  const at = head + section.indexOf(target) + target.length;
  const glue = /[.!?]$/.test(target.trim()) ? ' ' : '. ';
  return text.slice(0, at) + glue + ROLE_MODEL_LINE + text.slice(at);
}

// Backstop for YOUR HOME BASE: after the first sentence that names the Sacral and the G center,
// add the cities-and-maps line if the model skipped it. Once only.
const hasGCenter = s => /\bG(?:\s|-)?centers?\b|\bthe G\b/i.test(s);
function ensureTownsSentence(text) {
  if (!text || text.includes('towns you know by heart')) return text;
  const head = text.search(/YOUR HOME BASE\b/);
  if (head < 0) return text;
  const rest = text.slice(head);
  const nextHead = rest.slice(1).search(/\nYOUR [A-Z]/);
  const end = nextHead < 0 ? text.length : head + 1 + nextHead;
  const section = text.slice(head, end);
  if (!/\bSacral\b/.test(section) || !hasGCenter(section)) return text;
  const sentences = section.split(/(?<=[.!?])\s+/);
  let target = sentences.find(s => /\bSacral\b/.test(s) && hasGCenter(s));
  if (!target) {
    let seenS = false, seenG = false;
    for (const s of sentences) {
      if (/\bSacral\b/.test(s)) seenS = true;
      if (hasGCenter(s)) seenG = true;
      if (seenS && seenG) { target = s; break; }
    }
  }
  if (!target) return text;
  const at = head + section.indexOf(target) + target.length;
  return text.slice(0, at) + ' ' + TOWNS_SENTENCE + text.slice(at);
}

// Leftover numeric jargon in prose (for tests / QA): gate N, N-N channel pairs, gate.line codes.
export function numericJargon(text) {
  const out = [];
  for (const m of String(text || '').matchAll(/\b[Gg]ates?\s+\d{1,2}\b|\bline\s+[1-6]\b|(?<![\w$.])\d{1,2}\.[1-6](?![\d%])/g)) out.push(m[0]);
  for (const m of String(text || '').matchAll(/(?<![\w$-])(\d{1,2})\s*[-–]\s*(\d{1,2})(?![\w%-])/g)) if (isChannel(+m[1], +m[2])) out.push(m[0]);
  return out;
}
