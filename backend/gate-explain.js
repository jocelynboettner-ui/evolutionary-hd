// Plain explanations for a gate.line in the planetary key (web modal and PDF notes).
// Chart-supplied I Ching name, keynote, and line description win. The tables below are only
// the fallback when the chart API did not send a name (Ra Uru Hu's traditional gate names).
import { GATE_PLAIN } from './nodes-plain.js';
import { geneKey, GATE_CENTER } from './cycle-enrichment.js';

// Conscious = Personality = black. Unconscious = Design = red.
// This is the reference section, so the traditional words are named and then translated.
export const CONSCIOUS_UNCONSCIOUS =
  "Conscious is the black side of your chart. In Human Design it is called Personality: the part you recognize as you, and can talk about. " +
  "Unconscious is the red side. It is called Design: the part other people often see in you before you do. It was set before you were born, and it keeps running whether or not you are thinking about it.";

// [I Ching short name, "Gate of ..." name]. Used only when the activation has no name/keynote of its own.
const GATE_TRADITION = {
  1: ['The Creative', 'Self-Expression'],
  2: ['The Receptive', 'the Direction of the Self'],
  3: ['Difficulty at the Beginning', 'Ordering'],
  4: ['Youthful Folly', 'Formulization'],
  5: ['Waiting', 'Fixed Rhythms'],
  6: ['Conflict', 'Friction'],
  7: ['The Army', 'the Role of the Self'],
  8: ['Holding Together', 'Contribution'],
  9: ['The Taming Power of the Small', 'Focus'],
  10: ['Treading', 'the Behavior of the Self'],
  11: ['Peace', 'Ideas'],
  12: ['Standstill', 'Caution'],
  13: ['The Fellowship', 'the Listener'],
  14: ['Possession in Great Measure', 'Power Skills'],
  15: ['Modesty', 'Extremes'],
  16: ['Enthusiasm', 'Skills'],
  17: ['Following', 'Opinions'],
  18: ['Work on What Has Been Spoiled', 'Correction'],
  19: ['Approach', 'Wanting'],
  20: ['Contemplation', 'the Now'],
  21: ['Biting Through', 'the Hunter'],
  22: ['Grace', 'Openness'],
  23: ['Splitting Apart', 'Assimilation'],
  24: ['Return', 'Rationalization'],
  25: ['Innocence', 'the Spirit of the Self'],
  26: ['The Taming Power of the Great', 'the Egoist'],
  27: ['Nourishment', 'Caring'],
  28: ['Preponderance of the Great', 'the Game Player'],
  29: ['The Abysmal', 'Perseverance'],
  30: ['The Clinging', 'Feelings'],
  31: ['Influence', 'Leading'],
  32: ['Duration', 'Continuity'],
  33: ['Retreat', 'Privacy'],
  34: ['The Power of the Great', 'Power'],
  35: ['Progress', 'Change'],
  36: ['Darkening of the Light', 'Crisis'],
  37: ['The Family', 'Friendship'],
  38: ['Opposition', 'the Fighter'],
  39: ['Obstruction', 'the Provocateur'],
  40: ['Deliverance', 'Aloneness'],
  41: ['Decrease', 'Contraction'],
  42: ['Increase', 'Growth'],
  43: ['Breakthrough', 'Insight'],
  44: ['Coming to Meet', 'Alertness'],
  45: ['Gathering Together', 'the Gatherer'],
  46: ['Pushing Upward', 'the Determination of the Self'],
  47: ['Oppression', 'Realization'],
  48: ['The Well', 'Depth'],
  49: ['Revolution', 'Principles'],
  50: ['The Cauldron', 'Values'],
  51: ['The Arousing', 'Shock'],
  52: ['Keeping Still', 'Inaction'],
  53: ['Development', 'Beginnings'],
  54: ['The Marrying Maiden', 'Ambition'],
  55: ['Abundance', 'Spirit'],
  56: ['The Wanderer', 'Stimulation'],
  57: ['The Gentle', 'Intuitive Clarity'],
  58: ['The Joyous', 'Vitality'],
  59: ['Dispersion', 'Sexuality'],
  60: ['Limitation', 'Acceptance'],
  61: ['Inner Truth', 'Mystery'],
  62: ['Preponderance of the Small', 'Detail'],
  63: ['After Completion', 'Doubt'],
  64: ['Before Completion', 'Confusion'],
};

const stripParen = s => String(s || '').replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();

export function gateExplanation(activation) {
  const gate = Number(activation?.gate) || 0;
  const line = Number(activation?.line) || 0;
  const trad = GATE_TRADITION[gate] || null;
  const iching = stripParen(activation?.name) || (trad ? trad[0] : '');
  const keynoteRaw = stripParen(activation?.keynote) || (trad ? `The Gate of ${trad[1]}` : '');
  const keynote = /^the gate of\b/i.test(keynoteRaw) ? keynoteRaw.replace(/^the/i, 'The') : keynoteRaw;
  const plain = GATE_PLAIN[gate] || null;
  const gk = geneKey(gate);
  const title = `${gate}.${line}${iching ? ' ' + iching : ''}`;
  const paragraphs = [];
  if (keynote) paragraphs.push(keynote);
  if (activation?.lineDescription) paragraphs.push(`This line: ${stripParen(activation.lineDescription)}.`);
  if (plain?.e) paragraphs.push(`In everyday words, this is ${plain.e}.`);
  if (plain?.on || plain?.off) paragraphs.push([plain.on && `On track, ${plain.on}.`, plain.off && `Off track, ${plain.off}.`].filter(Boolean).join(' '));
  if (gk) paragraphs.push(`Its Gene Key moves from ${gk.shadow} to ${gk.gift} to ${gk.siddhi}.`);
  if (GATE_CENTER[gate]) paragraphs.push(`It lives in the ${GATE_CENTER[gate]}.`);
  return {
    id: `${gate}.${line}`,
    gate, line, title, iching, keynote,
    lineDescription: stripParen(activation?.lineDescription || ''),
    essence: plain?.e || '',
    on: plain?.on || '',
    off: plain?.off || '',
    geneKey: gk,
    center: GATE_CENTER[gate] || '',
    paragraphs,
  };
}
