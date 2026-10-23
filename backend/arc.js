// Owner's two arcs over the same four cycle windows (approved by the owner):
//   feminine (default): The Maiden · Closing the Mother · The Phoenix · Into the Sovereign
//   masculine:          The Apprentice · Closing the Builder · The Crucible · Into the Sovereign
// The teaching of each threshold is unchanged; only the phase names (and gendered phrasing about
// the person) differ. The arc is the person's own choice at intake; never inferred from the name.
export const ARCS = {
  feminine: { saturnReturn: 'The Maiden', uranusOpposition: 'Closing the Mother', chironReturn: 'The Phoenix', secondSaturnReturn: 'Into the Sovereign' },
  masculine: { saturnReturn: 'The Apprentice', uranusOpposition: 'Closing the Builder', chironReturn: 'The Crucible', secondSaturnReturn: 'Into the Sovereign' },
};

export const normalizeArc = (v) => (String(v || '').trim().toLowerCase() === 'masculine' ? 'masculine' : 'feminine');

// Ordered most-specific first so "Closing the Mother" / "Mother phase" never collide with other uses of "mother".
const MASC = [
  ['CLOSING THE MOTHER', 'CLOSING THE BUILDER'], ['Closing the Mother', 'Closing the Builder'], ['closing the Mother', 'closing the Builder'],
  ['the Mother phase', 'the Builder phase'], ['Mother phase', 'Builder phase'],
  ['THE MAIDEN', 'THE APPRENTICE'], ['Maiden', 'Apprentice'],
  ['THE PHOENIX', 'THE CRUCIBLE'], ['Phoenix', 'Crucible'],
  ['a woman in her 50s', 'a man in his 50s'], ['women in their 50s', 'men in their 50s'],
];

// Incarnation cross names that contain an arc word (e.g. "Right Angle Cross of the Sleeping Phoenix") are
// chart data, not phase names: they are shielded so the masculine rename never alters them.
const PROTECTED = /Sleeping\s+Phoenix/gi;

export function arcText(s, arc) {
  if (normalizeArc(arc) !== 'masculine' || typeof s !== 'string') return s;
  const kept = [];
  let out = s.replace(PROTECTED, m => { kept.push(m); return `\u0000${kept.length - 1}\u0000`; });
  for (const [a, b] of MASC) out = out.split(a).join(b);
  return out.replace(/\u0000(\d+)\u0000/g, (_, i) => kept[+i]);
}

// Apply the arc's phase names to every string in a value (objects/arrays; numbers etc. untouched).
export function applyArc(v, arc) {
  if (normalizeArc(arc) !== 'masculine') return v;
  if (typeof v === 'string') return arcText(v, arc);
  if (Array.isArray(v)) return v.map(x => applyArc(x, arc));
  if (v && typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype) {
    const o = {};
    for (const [k, x] of Object.entries(v)) o[k] = applyArc(x, arc);
    return o;
  }
  return v;
}

// Prompt note for the masculine arc: names only, plus the owner's Crucible framing. No new teachings.
export function arcPromptNote(arc) {
  if (normalizeArc(arc) !== 'masculine') return '';
  return `=== ARC CHOSEN BY THE PERSON: MASCULINE ===
The person chose the masculine arc: The Apprentice (First Saturn Return) · Closing the Builder (Uranus Opposition) · The Crucible (Chiron Return) · Into the Sovereign (Second Saturn Return). These are the masculine names for the same four thresholds, with the same windows and the same teachings: for the women in their Phoenix, the men in their Crucible. Use ONLY these phase names (never Maiden, Mother or Phoenix). Do not add any teaching beyond these names and the Crucible framing; describe each threshold exactly as the framework teaches it. Address the person as "you"; do not use gendered descriptions of them beyond the arc names.
=== END ARC ===`;
}
