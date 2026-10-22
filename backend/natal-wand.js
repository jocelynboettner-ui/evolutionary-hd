// natal-wand.js — the NATAL Magic Wand: the conscious (Personality) Sun and its Earth.
// In Human Design the Sun carries about 70% of the neutrino imprint, which is why the Sun/Earth
// pair is treated here as "about 70% of your soul's purpose". (Owner framing; the cycle Magic Wand
// stays what each cycle overlays.) Pure data helpers, shared by the server and the browser.
import { GATE_CENTER, CHANNELS, geneKey, TYPE_INFO } from './cycle-enrichment.js';
import { normChannelKey, channelLabel } from './reading-context.js';

const pretty = s => String(s || '').replace(/_+/g, ' ').replace(/\s+/g, ' ').trim().replace(/\b\w/g, c => c.toUpperCase());

// How each natal authority "wields" the wand (decides where its energy goes). Keyed by normalized authority.
export const AUTHORITY_WIELD = {
  sacral: { label: 'Sacral', how: 'through response in the moment: the gut sound (uh-huh or unh-unh) before any words decides which invitations the wand is poured into' },
  emotional: { label: 'Emotional (Solar Plexus)', how: 'over time: ride the emotional wave and let the wand move only once clarity has arrived, never from the high or the low' },
  splenic: { label: 'Splenic', how: 'in the instant: the quiet, one-time intuitive hit in the body that says yes or no, trusted the first time it speaks' },
  ego: { label: 'Ego (Heart)', how: 'through the heart\'s true want and willpower: point the wand only where you actually want to commit and can keep your word' },
  self: { label: 'Self-Projected (G)', how: 'by hearing yourself speak: talk it through with someone you trust and listen for the direction your own voice reveals' },
  mental: { label: 'Mental / Environmental', how: 'through the right environment and sounding boards: talk it out with trusted people in a place that feels right, hearing yourself rather than deciding with the mind' },
  lunar: { label: 'Lunar', how: 'across a full lunar cycle: let the wand reveal itself over about 28 days of sampling how it feels in different environments' },
  none: { label: 'Inner', how: 'through the person\'s own inner authority as named in the chart facts' },
};
export function authorityKey(a) {
  const s = String(a || '').toLowerCase();
  if (s.includes('sacral')) return 'sacral';
  if (s.includes('emotion') || s.includes('solar')) return 'emotional';
  if (s.includes('splen')) return 'splenic';
  if (s.includes('ego') || s.includes('heart')) return 'ego';
  if (s.includes('self')) return 'self';
  if (s.includes('mental') || s.includes('environment') || s.includes('outer') || s.includes('no inner')) return 'mental';
  if (s.includes('lunar')) return 'lunar';
  return 'none';
}

// Built lazily: cycle-enrichment.js imports this module too, so CHANNELS isn't ready at load time.
let _partners = null;
const partnersOf = g => { if (!_partners) { _partners = {}; CHANNELS.forEach(([a, b]) => { (_partners[a] ||= []).push(b); (_partners[b] ||= []).push(a); }); } return _partners[g] || []; };

function point(p, natalGates, natalChannels) {
  if (!p || !p.gate) return null;
  const g = p.gate;
  const gk = p.geneKeys && p.geneKeys.gift ? p.geneKeys : geneKey(g);
  const channels = natalChannels.filter(k => k.split('-').map(Number).includes(g)).map(k => ({ channel: k, label: channelLabel(k) }));
  const hanging = channels.length ? [] : partnersOf(g).filter(x => !natalGates.has(x));
  return {
    gate: g, line: p.line, name: p.iChingName || '', keynote: p.gateKeynote || '', lineDescription: p.lineDescription || '',
    sign: p.sign || '', center: GATE_CENTER[g] || '', geneKey: gk || null, channels,
    partners: hanging,   // harmonic gates that would complete a channel with it (when it isn't already in a natal channel)
  };
}

// { sun, earth, type, strategy, signature, notSelf, authority, authorityKey, wield } or null.
export function natalMagicWand(chart) {
  const sun = chart?.personality?.Sun, earth = chart?.personality?.Earth;
  if (!sun?.gate) return null;
  const natalGates = new Set(chart.gates || []);
  const natalChannels = (chart.channels || []).map(normChannelKey).filter(Boolean);
  const type = pretty(chart.type);
  const info = TYPE_INFO[type] || null;
  const ak = authorityKey(chart.authority);
  return {
    sun: point(sun, natalGates, natalChannels), earth: point(earth, natalGates, natalChannels),
    type, strategy: chart.strategy || info?.strategy || '', signature: chart.signature || info?.signature || '', notSelf: chart.not_self || info?.notSelf || '',
    authority: chart.authority || '', authorityKey: ak, wield: AUTHORITY_WIELD[ak].how,
  };
}

const ptLine = (role, p) => !p ? `${role}: not provided in the chart data.` :
  `${role}: Gate ${p.gate}.${p.line}${p.name ? ' — ' + p.name : ''}${p.keynote ? '; keynote "' + p.keynote + '"' : ''}${p.lineDescription ? '; line ' + p.line + ': "' + p.lineDescription + '"' : ''}; center ${p.center || 'n/a'}`
  + (p.geneKey ? `; Gene Key ${p.gate}: Shadow ${p.geneKey.shadow} → Gift ${p.geneKey.gift} → Siddhi ${p.geneKey.siddhi}` : '')
  + (p.channels.length ? `; part of natal channel ${p.channels.map(c => c.label).join(' and ')}` : (p.partners.length ? `; a hanging gate (not in a natal channel), waiting for Gate ${p.partners.join(' or ')}` : ''));

export function formatNatalWandForPrompt(chart) {
  const w = natalMagicWand(chart);
  if (!w) return '';
  return ['=== NATAL MAGIC WAND DATA (the conscious Personality Sun and its Earth; the Sun carries about 70% of the neutrino imprint, so this pair is about 70% of the soul\'s purpose) ===',
    ptLine('CONSCIOUS SUN (what you radiate; the wand itself)', w.sun),
    ptLine('CONSCIOUS EARTH (what grounds the wand; where its power is held in the body)', w.earth),
    `TYPE AND STRATEGY: ${w.type} — ${w.strategy}; signature ${w.signature}; not-self ${w.notSelf}`,
    `NATAL AUTHORITY: ${w.authority} — how it wields the wand: ${w.wield}`,
    '=== END NATAL MAGIC WAND DATA ==='].join('\n');
}

// How a cycle overlay chart hands the person their NATAL wand: the cycle's own Sun/Earth, cycle channels that
// run through the natal Sun/Earth gates, and cycle gates that are harmonic partners of the natal Sun/Earth.
export function cycleWandLinks(natal, overlay) {
  const w = natalMagicWand(natal);
  if (!w || !overlay) return null;
  const natalGates = new Set(natal.gates || []);
  const ov = new Set(overlay.gates || []);
  const comp = new Set([...natalGates, ...ov]);
  const links = [];
  for (const [role, p] of [['Sun', w.sun], ['Earth', w.earth]]) {
    if (!p) continue;
    for (const partner of partnersOf(p.gate)) {
      if (!comp.has(partner)) continue;
      const k = normChannelKey(`${p.gate}-${partner}`);
      const isNatal = natalGates.has(partner);
      if (isNatal && !ov.has(partner)) continue;   // already a natal channel and not re-lit by the cycle
      links.push({ role, natalGate: p.gate, partner, channel: k, label: channelLabel(k), kind: isNatal ? 'natal channel re-lit by the cycle' : 'completed by the cycle' });
    }
  }
  const defined = gs => { const c = new Set(); CHANNELS.forEach(([a, b]) => { if (gs.has(a) && gs.has(b)) { c.add(GATE_CENTER[a]); c.add(GATE_CENTER[b]); } }); return c; };
  const natalC = defined(natalGates), compC = defined(comp);
  // a wand gate whose center was open natally and is defined in this cycle: the wand's center comes online
  const centerLinks = [['Sun', w.sun], ['Earth', w.earth]].filter(([, p]) => p && p.center && !natalC.has(p.center) && compC.has(p.center))
    .map(([role, p]) => ({ role, gate: p.gate, center: p.center }));
  const pick = x => x?.gate ? { gate: x.gate, line: x.line, name: x.iChingName || '' } : null;
  const cs = pick(overlay.personality?.Sun), ce = pick(overlay.personality?.Earth);
  const onWand = [w.sun?.gate, w.earth?.gate].filter(Boolean);
  return {
    natalSun: w.sun && { gate: w.sun.gate, line: w.sun.line, name: w.sun.name }, natalEarth: w.earth && { gate: w.earth.gate, line: w.earth.line, name: w.earth.name },
    cycleSun: cs, cycleEarth: ce, links, centerLinks,
    sameGates: [cs?.gate, ce?.gate].filter(g => g && onWand.includes(g)),   // cycle Sun/Earth sitting on the natal wand gates
  };
}

export function formatCycleWandLinks(l) {
  if (!l) return '';
  const L = [`NATAL WAND IN THIS CYCLE (natal conscious Sun ${l.natalSun.gate}.${l.natalSun.line}${l.natalEarth ? ` / Earth ${l.natalEarth.gate}.${l.natalEarth.line}` : ''}):`];
  if (l.cycleSun) L.push(`  This cycle's own conscious Sun/Earth: Gate ${l.cycleSun.gate}.${l.cycleSun.line}${l.cycleSun.name ? ' ' + l.cycleSun.name : ''}${l.cycleEarth ? ` / Gate ${l.cycleEarth.gate}.${l.cycleEarth.line}${l.cycleEarth.name ? ' ' + l.cycleEarth.name : ''}` : ''} (the season's wand, which the natal wand learns to work with)`);
  if (l.sameGates.length) L.push(`  The cycle Sun/Earth sit on the natal wand gate(s) ${l.sameGates.join(', ')}: the season amplifies the natal wand directly.`);
  l.links.forEach(x => L.push(`  Channel ${x.label}: natal ${x.role} Gate ${x.natalGate} + cycle Gate ${x.partner} (${x.kind})`));
  l.centerLinks.forEach(x => L.push(`  The natal ${x.role} gate ${x.gate} sits in the ${x.center}, open natally and defined in this cycle: the wand's own center comes online`));
  if (!l.links.length && !l.centerLinks.length && !l.sameGates.length) L.push('  No channel runs directly through the natal Sun/Earth gates in this cycle; the cycle hands the wand new centers, channels and the season\'s Sun/Earth to work through.');
  return L.join('\n');
}

// Plain-text lines for how a cycle hands the person their natal Sun/Earth wand (shared with the PDFs).
export function wandLinkLines(l) {
  if (!l) return [];
  const out = [];
  (l.sameGates || []).forEach(g => out.push(`This season's Sun/Earth sits on your natal wand Gate ${g}`));
  (l.links || []).forEach(x => out.push(`${x.label}: your natal ${x.role} Gate ${x.natalGate} meets Gate ${x.partner} (${x.kind})`));
  (l.centerLinks || []).forEach(x => out.push(`Your natal ${x.role} Gate ${x.gate} lives in the ${x.center}, which comes online this season`));
  return out;
}

