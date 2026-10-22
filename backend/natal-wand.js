// natal-wand.js — the NATAL Magic Wand: the conscious (Personality) Sun gate.line, about 70% of the
// soul's purpose (owner-confirmed; the Sun carries about 70% of the neutrino imprint). Earth is NOT part
// of the wand. The cycle Magic Wand stays what each cycle overlays. Pure helpers, server + browser.
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
  const channels = natalChannels.filter(k => k.split('-').map(Number).includes(g)).map(k => ({ channel: k, label: channelLabel(k), partner: k.split('-').map(Number).find(x => x !== g) }));
  const hanging = channels.length ? [] : partnersOf(g).filter(x => !natalGates.has(x));
  return {
    gate: g, line: p.line, name: p.iChingName || '', keynote: p.gateKeynote || '', lineDescription: p.lineDescription || '',
    sign: p.sign || '', center: GATE_CENTER[g] || '', geneKey: gk || null, channels,
    partners: hanging,   // harmonic gates that would complete a channel with it (when it isn't already in a natal channel)
    wiring: channels.length ? 'superhighway' : (hanging.length ? 'hanging' : ''),
  };
}

// { sun, type, strategy, signature, notSelf, authority, authorityKey, wield } or null.
export function natalMagicWand(chart) {
  const sun = chart?.personality?.Sun;
  if (!sun?.gate) return null;
  const natalGates = new Set(chart.gates || []);
  const natalChannels = (chart.channels || []).map(normChannelKey).filter(Boolean);
  const type = pretty(chart.type);
  const info = TYPE_INFO[type] || null;
  const ak = authorityKey(chart.authority);
  return {
    sun: point(sun, natalGates, natalChannels),
    type, strategy: chart.strategy || info?.strategy || '', signature: chart.signature || info?.signature || '', notSelf: chart.not_self || info?.notSelf || '',
    authority: chart.authority || '', authorityKey: ak, wield: AUTHORITY_WIELD[ak].how,
  };
}

const ptLine = (role, p) => !p ? `${role}: not provided in the chart data.` :
  `${role}: Gate ${p.gate}.${p.line}${p.name ? ' — ' + p.name : ''}${p.keynote ? '; keynote "' + p.keynote + '"' : ''}${p.lineDescription ? '; line ' + p.line + ': "' + p.lineDescription + '"' : ''}; center ${p.center || 'n/a'}`
  + (p.geneKey ? `; Gene Key ${p.gate}: Shadow ${p.geneKey.shadow} → Gift ${p.geneKey.gift} → Siddhi ${p.geneKey.siddhi}` : '')
  + (p.channels.length ? `; part of COMPLETED natal channel ${p.channels.map(c => c.label + ' (partner Gate ' + c.partner + ')').join(' and ')}: a SUPERHIGHWAY they have had all their life, consistent and always on`
    : (p.partners.length ? `; a HANGING gate (channel incomplete), waiting for partner Gate ${p.partners.join(' or ')}: full access comes when they sync with people who carry Gate ${p.partners.join(' or ')} (electromagnetic connection) or when a transit or life cycle lights it` : ''));

// One short shared line for the card and the PDF box: superhighway vs hanging gate.
export function wandWiringText(p) {
  if (!p) return '';
  if (p.channels?.length) return `A superhighway you've had all your life: ${p.channels.map(c => `${c.label}, with partner Gate ${c.partner}`).join('; ')}. Consistent and always on; you know this energy because it has always been yours.`;
  if (p.partners?.length) return `A hanging gate, waiting for Gate ${p.partners.join(' or ')}. You get the full current when you sync with people who carry it (electromagnetic connection), or when a transit or life cycle lights it.`;
  return '';
}

export function formatNatalWandForPrompt(chart) {
  const w = natalMagicWand(chart);
  if (!w) return '';
  return ['=== NATAL MAGIC WAND DATA (the conscious Personality Sun alone; the Sun carries about 70% of the neutrino imprint, so it is about 70% of the soul\'s purpose; Earth is not part of the wand) ===',
    ptLine('CONSCIOUS SUN (the Magic Wand; what you radiate)', w.sun),
    `TYPE AND STRATEGY: ${w.type} — ${w.strategy}; signature ${w.signature}; not-self ${w.notSelf}`,
    `NATAL AUTHORITY: ${w.authority} — how it wields the wand: ${w.wield}`,
    '=== END NATAL MAGIC WAND DATA ==='].join('\n');
}

// How a cycle overlay chart hands the person their NATAL wand (conscious Sun): the cycle's own conscious Sun,
// cycle channels that run through the natal Sun gate, and the Sun gate's center coming online.
export function cycleWandLinks(natal, overlay) {
  const w = natalMagicWand(natal);
  if (!w || !overlay) return null;
  const natalGates = new Set(natal.gates || []);
  const ov = new Set(overlay.gates || []);
  const comp = new Set([...natalGates, ...ov]);
  const p = w.sun, links = [];
  for (const partner of partnersOf(p.gate)) {
    if (!comp.has(partner)) continue;
    const isNatal = natalGates.has(partner);
    if (isNatal && !ov.has(partner)) continue;   // already a natal channel and not re-lit by the cycle
    const k = normChannelKey(`${p.gate}-${partner}`);
    links.push({ natalGate: p.gate, partner, channel: k, label: channelLabel(k), kind: isNatal ? 'natal channel re-lit by the cycle' : 'completed by the cycle', magic: !isNatal });
  }
  const defined = gs => { const c = new Set(); CHANNELS.forEach(([a, b]) => { if (gs.has(a) && gs.has(b)) { c.add(GATE_CENTER[a]); c.add(GATE_CENTER[b]); } }); return c; };
  const natalC = defined(natalGates), compC = defined(comp);
  // the wand gate's center was open natally and is defined in this cycle: the wand's center comes online
  const centerLink = p.center && !natalC.has(p.center) && compC.has(p.center) ? { gate: p.gate, center: p.center } : null;
  const cs = overlay.personality?.Sun?.gate ? { gate: overlay.personality.Sun.gate, line: overlay.personality.Sun.line, name: overlay.personality.Sun.iChingName || '' } : null;
  return {
    natalSun: { gate: p.gate, line: p.line, name: p.name, gift: p.geneKey?.gift || '', wiring: p.wiring, partners: p.partners, channels: p.channels.map(c => c.label) },
    cycleSun: cs, links, centerLink,
    sameGate: !!(cs && cs.gate === p.gate),   // the cycle's Sun sits on the natal wand gate
  };
}

export function formatCycleWandLinks(l) {
  if (!l) return '';
  const L = [`NATAL WAND IN THIS CYCLE (natal conscious Sun ${l.natalSun.gate}.${l.natalSun.line}${l.natalSun.gift ? ', Gift ' + l.natalSun.gift : ''}):`];
  if (l.cycleSun) L.push(`  This cycle's conscious Sun: Gate ${l.cycleSun.gate}.${l.cycleSun.line}${l.cycleSun.name ? ' ' + l.cycleSun.name : ''} (the season's light the natal wand learns to work with)`);
  if (l.sameGate) L.push(`  The cycle's Sun sits on the natal wand Gate ${l.natalSun.gate}: the season amplifies the wand directly.`);
  l.links.forEach(x => L.push(x.magic
    ? `  MAGIC: this cycle lights partner Gate ${x.partner} of the HANGING natal Sun Gate ${x.natalGate}, completing ${x.label}. The full current of the soul purpose comes online for this season; call it out prominently and give concrete ways to use it.`
    : `  Channel ${x.label}: natal Sun Gate ${x.natalGate} + cycle Gate ${x.partner} (natal channel re-lit by the cycle): amplifies a superhighway they already know.`));
  if (l.centerLink) L.push(`  The natal Sun Gate ${l.centerLink.gate} sits in the ${l.centerLink.center}, open natally and defined in this cycle: the wand's own center comes online`);
  if (!l.links.length && !l.centerLink && !l.sameGate) L.push(`  No channel runs directly through the natal Sun Gate ${l.natalSun.gate} in this cycle; the cycle hands the wand new centers, channels and the season's Sun to work through.`);
  if (l.natalSun.wiring === 'superhighway' && !l.links.length) L.push(`  The natal Sun Gate ${l.natalSun.gate} already runs a completed natal channel (${l.natalSun.channels.join(', ')}): a superhighway that stays on through this season.`);
  if (l.natalSun.wiring === 'hanging' && !l.links.some(x => x.magic)) L.push(`  The natal Sun Gate ${l.natalSun.gate} is hanging and this cycle does not light partner Gate ${l.natalSun.partners.join(' or ')}; full access still comes through people who carry it (electromagnetic connection) or a transit that lights it.`);
  return L.join('\n');
}

// Plain-text lines for how a cycle hands the person their natal Sun wand (shared with the cards and PDFs).
export function wandLinkLines(l) {
  if (!l) return [];
  const out = [];
  if (l.sameGate) out.push(`This season's Sun sits on your natal wand Gate ${l.natalSun.gate}`);
  (l.links || []).forEach(x => out.push(x.magic
    ? `Magic: this season lights Gate ${x.partner}, completing your ${x.label}. The full current of your soul purpose comes online.`
    : `${x.label}: your natal Sun Gate ${x.natalGate} meets Gate ${x.partner} again, amplifying a superhighway you already know`));
  if (l.centerLink) out.push(`Your natal Sun Gate ${l.centerLink.gate} lives in the ${l.centerLink.center}, which comes online this season`);
  return out;
}
