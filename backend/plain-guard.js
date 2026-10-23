// plain-guard.js — light post-processing guard for MODEL-WRITTEN reading prose (owner: plain language in the
// body; gate/channel/line numbers live only in the cards and the small "For the curious" notes).
// The prompt already forbids numbers; this catches what slips through. Idempotent, pure, server + browser.
//   "(Gate 23)", "(Gate 10.4)", "(gates 45, 26, 22 and 47)", "(45/26 | 22/47)", "(18.4)"  -> removed
//   "the 21-45 Channel of Money" -> "the Channel of Money";  "Channel 42-53" -> "the Channel of Maturation"
//   "Gate 45" / "Gate 18, line 4" / "Gate 18.4" -> "the energy of Synergy" (its Gene Key gift)
//   bare "18.4" -> removed; "hanging gate" -> plain phrase; "Gene Key 21" -> "its Gene Key"
import { GENE_KEYS, CHANNELS } from './cycle-enrichment.js';
import { channelLabel, normChannelKey } from './reading-context.js';

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
  // Tidy: doubled spaces, space before punctuation, "the the", sentence-start capitals.
  t = t.replace(/[ \t]{2,}/g, ' ').replace(/ +([,.;:!?])/g, '$1').replace(/\bthe the\b/gi, 'the').replace(/,\s*,/g, ',');
  t = t.replace(/(^|[.!?]\s+|\n\s*|\n\s*[•-]\s+)(the energies of|the energy of|the Channel of|its Gene Key|this energy)/g, (m, pre, w) => pre + w[0].toUpperCase() + w.slice(1));
  return t;
}

// Leftover numeric jargon in prose (for tests / QA): gate N, N-N channel pairs, gate.line codes.
export function numericJargon(text) {
  const out = [];
  for (const m of String(text || '').matchAll(/\b[Gg]ates?\s+\d{1,2}\b|\bline\s+[1-6]\b|(?<![\w$.])\d{1,2}\.[1-6](?![\d%])/g)) out.push(m[0]);
  for (const m of String(text || '').matchAll(/(?<![\w$-])(\d{1,2})\s*[-–]\s*(\d{1,2})(?![\w%-])/g)) if (isChannel(+m[1], +m[2])) out.push(m[0]);
  return out;
}
