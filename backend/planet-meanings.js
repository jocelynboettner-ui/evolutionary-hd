// planet-meanings.js — what each planet stands for, in plain everyday language, after Ra Uru Hu's
// traditional Human Design teaching. Two uses:
//   1. CYCLE_PLANET_LINES: one line per life cycle (shown beside each cycle in the Reader): what the
//      transiting planet stands for and what it brings to the person in that cycle. Second person,
//      no gate/line/channel jargon.
//   2. PLANETS_CURIOUS: a compact planet chart for the small "For the curious" box.
// Deterministic (never model-written). Arc-neutral: no Maiden/Mother/Phoenix wording, so the
// masculine arc renaming leaves these untouched.

export const CYCLE_PLANET_LINES = {
  saturnReturn: { planet: 'Saturn', line: 'Saturn brings structure, discipline and maturity, so this is where life asks you to grow up, stop living by other people\'s rules and start standing on your own.' },
  uranusOpposition: { planet: 'Uranus', line: 'Uranus brings change and the freedom to be unusual, so this is where life shakes loose what was never really you and asks you to live your own difference.' },
  chironReturn: { planet: 'Chiron', line: 'Chiron brings the old wound that turns into wisdom, so this is where what hurt you most becomes the medicine you have to offer others.' },
  secondSaturnReturn: { planet: 'Saturn', line: 'Saturn comes back as the judge of what you\'ve built, so this is where life asks you to gather the harvest of everything you\'ve learned and step into your elder years as someone others can lean on.' },
};

export function cyclePlanetLine(key) { return CYCLE_PLANET_LINES[key]?.line || ''; }

// Ra Uru Hu's traditional planet keynotes in plain words. SINGLE SOURCE OF TRUTH for every planet meaning in
// the Reader: the curious box below, reading-context.js PLANET_MEANINGS (cycle cards, planetary key, PDF, model prompt).
export const PLANET_KEYNOTES = [
  ['Sun', 'your life force, the light you\'re here to shine'],
  ['Earth', 'your grounding, what keeps you balanced'],
  ['Moon', 'your driving force, what moves you'],
  ['North Node', 'your direction and environment for the second half of life'],
  ['South Node', 'your direction and environment for the first half of life'],
  ['Mercury', 'communication, what you\'re here to say'],
  ['Venus', 'your values, your sense of what is right and good'],
  ['Mars', 'raw, immature energy that matures with time'],
  ['Jupiter', 'law, expansion and protection: what grows when you honor your own rules'],
  ['Saturn', 'discipline, the judge: where you\'re tested and matured'],
  ['Uranus', 'unusualness and change'],
  ['Neptune', 'the veil: spirituality, what stays hidden until it\'s revealed'],
  ['Pluto', 'truth and transformation'],
  ['Chiron', 'the wound that becomes healing and wisdom'],
];

export const PLANETS_CURIOUS = {
  title: 'FOR THE CURIOUS: WHAT EACH PLANET STANDS FOR',
  lines: [
    'Your life cycles are planets coming back to (or opposite) where they sat when you were born: the First Saturn Return (about 27 to 30), the Uranus Opposition (about 38 to 44), the Chiron Return (about 50 to 51) and the Second Saturn Return (about 58 to 60).',
    ...PLANET_KEYNOTES.map(([p, m]) => `${p}: ${m}${p === 'Sun' ? ' (about 70% of your imprint)' : ''}.`),
  ],
};
