// cycle-enrichment.js — structured "what you're learning to embody" data per cycle,
// computed from each cycle-peak (overlay) chart against the natal chart.
// Natal profile / cross / type / authority are always HOME BASE; the cycle chart adds what
// the person is learning to embody. Only reached (past/current) cycles are ever included.
import { planetTable, planetMeaning, channelLabel, normChannelKey, CYCLE_PHASES } from './reading-context.js';

// Gene Keys (Richard Rudd): gate -> [Shadow, Gift, Siddhi]
export const GENE_KEYS = {
  1:['Entropy','Freshness','Beauty'],2:['Dislocation','Orientation','Unity'],3:['Chaos','Innovation','Innocence'],
  4:['Intolerance','Understanding','Forgiveness'],5:['Impatience','Patience','Timelessness'],6:['Conflict','Diplomacy','Peace'],
  7:['Division','Guidance','Virtue'],8:['Mediocrity','Style','Exquisiteness'],9:['Inertia','Determination','Invincibility'],
  10:['Self-Obsession','Naturalness','Being'],11:['Obscurity','Idealism','Light'],12:['Vanity','Discrimination','Purity'],
  13:['Discord','Discernment','Empathy'],14:['Compromise','Competence','Bounteousness'],15:['Dullness','Magnetism','Florescence'],
  16:['Indifference','Versatility','Mastery'],17:['Opinion','Far-Sightedness','Omniscience'],18:['Judgement','Integrity','Perfection'],
  19:['Co-Dependence','Sensitivity','Sacrifice'],20:['Superficiality','Self-Assurance','Presence'],21:['Control','Authority','Valour'],
  22:['Dishonour','Graciousness','Grace'],23:['Complexity','Simplicity','Quintessence'],24:['Addiction','Invention','Silence'],
  25:['Constriction','Acceptance','Universal Love'],26:['Pride','Artfulness','Invisibility'],27:['Selfishness','Altruism','Selflessness'],
  28:['Purposelessness','Totality','Immortality'],29:['Half-Heartedness','Commitment','Devotion'],30:['Desire','Lightness','Rapture'],
  31:['Arrogance','Leadership','Humility'],32:['Failure','Preservation','Veneration'],33:['Forgetting','Mindfulness','Revelation'],
  34:['Force','Strength','Majesty'],35:['Hunger','Adventure','Boundlessness'],36:['Turbulence','Humanity','Compassion'],
  37:['Weakness','Equality','Tenderness'],38:['Struggle','Perseverance','Honour'],39:['Provocation','Dynamism','Liberation'],
  40:['Exhaustion','Resolve','Divine Will'],41:['Fantasy','Anticipation','Emanation'],42:['Expectation','Detachment','Celebration'],
  43:['Deafness','Insight','Epiphany'],44:['Interference','Teamwork','Synarchy'],45:['Dominance','Synergy','Communion'],
  46:['Seriousness','Delight','Ecstasy'],47:['Oppression','Transmutation','Transfiguration'],48:['Inadequacy','Resourcefulness','Wisdom'],
  49:['Reaction','Revolution','Rebirth'],50:['Corruption','Equilibrium','Harmony'],51:['Agitation','Initiative','Awakening'],
  52:['Stress','Restraint','Stillness'],53:['Immaturity','Expansion','Superabundance'],54:['Greed','Aspiration','Ascension'],
  55:['Victimisation','Freedom','Freedom'],56:['Distraction','Enrichment','Intoxication'],57:['Unease','Intuition','Clarity'],
  58:['Dissatisfaction','Vitality','Bliss'],59:['Dishonesty','Intimacy','Transparency'],60:['Limitation','Realism','Justice'],
  61:['Psychosis','Inspiration','Sanctity'],62:['Intellect','Precision','Impeccability'],63:['Doubt','Inquiry','Truth'],
  64:['Confusion','Imagination','Illumination'],
};
export function geneKey(g) { const k = GENE_KEYS[g]; return k ? { shadow: k[0], gift: k[1], siddhi: k[2] } : null; }

export const CHANNELS = [[1,8],[2,14],[3,60],[4,63],[5,15],[6,59],[7,31],[9,52],[10,20],[10,34],[10,57],[11,56],[12,22],[13,33],[16,48],[17,62],[18,58],[19,49],[20,34],[20,57],[21,45],[23,43],[24,61],[25,51],[26,44],[27,50],[28,38],[29,46],[30,41],[32,54],[34,57],[35,36],[37,40],[39,55],[42,53],[47,64]];
export const GATE_CENTER = {};
Object.entries({Head:[64,61,63],Ajna:[47,24,4,17,43,11],Throat:[62,23,56,35,12,45,33,8,31,20,16],G:[10,25,46,15,2,1,7,13],Heart:[51,21,40,26],
  Sacral:[34,5,14,29,27,59,9,3,42],'Solar Plexus':[36,22,37,6,55,30,49],Spleen:[48,57,44,50,32,28,18],Root:[53,60,52,19,39,41,58,38,54]})
  .forEach(([c, gs]) => gs.forEach(g => { GATE_CENTER[g] = c; }));
export const CENTER_GIFTS = {
  Head: 'inspiration and mental pressure to know', Ajna: 'conceptualizing, certainty of mind', Throat: 'expression, voice and manifestation',
  G: 'identity, direction and love', Heart: 'willpower, worth and promises kept', Sacral: 'sustainable life-force and response',
  'Solar Plexus': 'emotional depth, feeling and passion', Spleen: 'instinct, intuition and well-being', Root: 'adrenal drive and the pressure to begin',
};

const pretty = s => String(s || '').replace(/_+/g, ' ').replace(/\s+/g, ' ').trim().replace(/\b\w/g, c => c.toUpperCase());
const authLabel = a => pretty(a).replace(/\s*Authority$/i, '');
export function profileLabel(p) { const m = String(p || '').match(/(\d)\D+(\d)/); return m ? `${m[1]}/${m[2]}` : String(p || ''); }
export function crossGates(chart) {
  if (Array.isArray(chart?.incarnation_cross_gates) && chart.incarnation_cross_gates.length === 4) return chart.incarnation_cross_gates.map(Number);
  const m = String(chart?.incarnation_cross || '').match(/(\d+)\s*\/\s*(\d+)\s*\|\s*(\d+)\s*\/\s*(\d+)/);
  return m ? m.slice(1).map(Number) : [];
}
function definedCenters(gates) {
  const s = new Set();
  CHANNELS.forEach(([a, b]) => { if (gates.has(a) && gates.has(b)) { s.add(GATE_CENTER[a]); s.add(GATE_CENTER[b]); } });
  return s;
}
// gate -> [{planet, side, line, meaning}] for a chart
function gatePlanets(chart) {
  const map = {};
  for (const r of planetTable(chart)) {
    for (const [sideKey, side] of [['conscious', 'Conscious'], ['unconscious', 'Unconscious']]) {
      const p = r[sideKey]; if (!p) continue;
      (map[p.gate] ||= []).push({ planet: r.planet, side, line: p.line, name: p.name, meaning: planetMeaning(r.planet, side) });
    }
  }
  return map;
}

export const TYPE_INFO = {
  'Generator': { strategy: 'To respond', signature: 'Satisfaction', notSelf: 'Frustration', asks: 'wait for life to bring something to respond to, and pour your sustainable energy only into what lights up your gut' },
  'Manifesting Generator': { strategy: 'To respond, then inform', signature: 'Satisfaction (and Peace)', notSelf: 'Frustration and Anger', asks: 'respond first, then move fast, skip steps wisely, and inform the people your speed affects' },
  'Manifestor': { strategy: 'To inform before acting', signature: 'Peace', notSelf: 'Anger', asks: 'trust the urge to initiate, inform those impacted before you move, and protect your independence' },
  'Projector': { strategy: 'To wait for the invitation', signature: 'Success', notSelf: 'Bitterness', asks: 'guide rather than push, rest deeply, and offer your seeing where you are recognized and invited' },
  'Reflector': { strategy: 'To wait a lunar cycle', signature: 'Surprise', notSelf: 'Disappointment', asks: 'sample your environment, take a full moon cycle for big decisions, and choose the places that feel good' },
};
const typeInfo = t => TYPE_INFO[t] || null;

export const CYCLE_META = {
  saturnReturn:       { theme: 'the Maiden: becoming your own authority' },
  uranusOpposition:   { theme: 'closing the Mother: awakening to your authentic difference' },
  chironReturn:       { theme: 'the Phoenix: the wound becoming medicine; your second-half-of-life purpose' },
  secondSaturnReturn: { theme: 'into the Sovereign: elderhood and the harvest of mastery' },
};

// natal, overlay: transformed v3 charts. Returns one cycle's enrichment.
export function cycleEnrichment(key, natal, overlay, peakDate, ownedChannels) {
  if (!natal || !overlay) return null;
  const natalGates = new Set(natal.gates || []);
  const ovGates = new Set(overlay.gates || []);
  const composite = new Set([...natalGates, ...ovGates]);
  const natalCenters = definedCenters(natalGates);
  const compCenters = definedCenters(composite);
  const newCenters = [...compCenters].filter(c => !natalCenters.has(c)).map(c => ({ center: c, gift: CENTER_GIFTS[c] || '' }));
  const gp = gatePlanets(overlay);
  const channels = [];
  CHANNELS.forEach(([a, b]) => {
    if (!(composite.has(a) && composite.has(b)) || (natalGates.has(a) && natalGates.has(b))) return;
    const k = normChannelKey(`${a}-${b}`);
    if (ownedChannels && !ownedChannels.has(k)) return;
    const natalGate = natalGates.has(a) ? a : natalGates.has(b) ? b : null;
    channels.push({ channel: k, label: channelLabel(k), natalGate, newGates: [a, b].filter(g => !natalGates.has(g)), kind: natalGate ? 'completed' : 'fully new' });
  });
  const newGates = [...ovGates].filter(g => !natalGates.has(g)).sort((a, b) => a - b).map(g => ({
    gate: g, center: GATE_CENTER[g], planets: gp[g] || [], geneKey: geneKey(g),
  }));
  const cg = crossGates(overlay), ncg = crossGates(natal);
  const sun = overlay.personality?.Sun, dsun = overlay.design?.Sun;
  return {
    key, label: CYCLE_PHASES[key]?.title || key, transit: CYCLE_PHASES[key]?.transit || key, phase: CYCLE_PHASES[key]?.phase || '', window: CYCLE_PHASES[key]?.window || '', theme: CYCLE_META[key]?.theme || '', peakDate: String(peakDate || '').slice(0, 10),
    profile: { natal: profileLabel(natal.profile), cycle: profileLabel(overlay.profile), shifted: profileLabel(natal.profile) !== profileLabel(overlay.profile),
      fromSun: sun && dsun ? `Conscious Sun ${sun.gate}.${sun.line} / Unconscious Sun ${dsun.gate}.${dsun.line}` : '' },
    cross: { natal: natal.incarnation_cross || '', cycle: overlay.incarnation_cross || '', gates: cg, natalGates: ncg,
      shifted: (overlay.incarnation_cross || '') !== (natal.incarnation_cross || ''),
      gateKeys: cg.map(g => ({ gate: g, geneKey: geneKey(g) })) },
    type: { natal: pretty(natal.type), cycle: pretty(overlay.type), shifted: pretty(natal.type) !== pretty(overlay.type),
      info: typeInfo(pretty(overlay.type)), natalInfo: typeInfo(pretty(natal.type)) },
    authority: { natal: authLabel(natal.authority), cycle: authLabel(overlay.authority), shifted: authLabel(natal.authority) !== authLabel(overlay.authority) },
    magicWand: { newCenters, channels, newGates },
  };
}

// Build enrichment for reached cycles that have an overlay chart (peak <= now), chronological.
export function buildEnrichment(natal, overlays, cycles, now = new Date()) {
  const keys = ['saturnReturn', 'uranusOpposition', 'chironReturn', 'secondSaturnReturn'];
  const avail = keys.map(k => {
    const peak = cycles?.[k]?.peak_datetime || cycles?.[k]?.peak;
    const t = new Date(peak).getTime();
    if (!overlays?.[k] || isNaN(t) || t > now.getTime()) return null;
    return { key: k, peak, chart: overlays[k] };
  }).filter(Boolean).sort((a, b) => String(a.peak).localeCompare(String(b.peak)));
  // each channel owned by the earliest cycle that produced it
  const owned = new Map(); const seen = new Set();
  for (const c of avail) {
    const s = new Set(); const comp = new Set([...(natal.gates || []), ...(c.chart.gates || [])]); const ng = new Set(natal.gates || []);
    CHANNELS.forEach(([a, b]) => { if (comp.has(a) && comp.has(b) && !(ng.has(a) && ng.has(b))) { const k = normChannelKey(`${a}-${b}`); if (!seen.has(k)) { seen.add(k); s.add(k); } } });
    owned.set(c.key, s);
  }
  return avail.map(c => cycleEnrichment(c.key, natal, c.chart, c.peak, owned.get(c.key))).filter(Boolean);
}

export function formatEnrichmentForPrompt(list, natal) {
  if (!list?.length) return '';
  const L = ['=== CYCLE EMBODIMENT DATA (authoritative; computed from each cycle-peak chart) ===',
    'FRAMING: The natal design is who the person is and never changes. A cycle chart (even Chiron, the full flowering) is not a new identity: its type, profile and cross are energies flowing THROUGH the natal design in that season, and natal authority still chooses which to follow. Never "you became" or "you are now".',
    `NATAL HOME BASE: ${pretty(natal.type)}, ${profileLabel(natal.profile)} profile, ${authLabel(natal.authority)} authority, ${natal.incarnation_cross || ''}`];
  for (const c of list) {
    L.push('', `--- ${c.label.toUpperCase()} (actual peak ${c.peakDate}; approximate window ${c.window}) ---`);
    L.push(`Cycle profile they are learning: ${c.profile.cycle} (${c.profile.fromSun}); home base stays ${c.profile.natal}.`);
    L.push(`Cycle incarnation cross: ${c.cross.cycle}${c.key === 'chironReturn' ? '  <- THEIR SECOND-HALF-OF-LIFE PURPOSE' : ''}`);
    c.cross.gateKeys.forEach(g => g.geneKey && L.push(`  cross gate ${g.gate}: Shadow ${g.geneKey.shadow} / Gift ${g.geneKey.gift} / Siddhi ${g.geneKey.siddhi}`));
    L.push(`Cycle type (the type initiation of this season): ${c.type.cycle}${c.type.shifted ? ' (natal ' + c.type.natal + ' stays home base; this is the type they are being initiated into)' : ' (same as natal)'}`);
    if (c.type.info) L.push(`  ${c.type.cycle}: Strategy ${c.type.info.strategy}; Signature ${c.type.info.signature}; Not-self ${c.type.info.notSelf}; asks them to ${c.type.info.asks}`);
    L.push(`Cycle authority: ${c.authority.cycle}${c.authority.shifted ? ' (practicing; natal ' + c.authority.natal + ' authority remains their decision-maker)' : ' (same as natal)'}`);
    L.push('MAGIC WAND (what this cycle overlays onto the natal chart):');
    if (c.magicWand.newCenters.length) L.push('  Newly defined centers: ' + c.magicWand.newCenters.map(x => `${x.center} (${x.gift})`).join('; '));
    c.magicWand.channels.forEach(ch => L.push(`  Channel ${ch.label} — ${ch.kind}${ch.natalGate ? ` (natal Gate ${ch.natalGate} met by Gate ${ch.newGates.join(' & ')})` : ''}`));
    c.magicWand.newGates.forEach(g => L.push(`  New Gate ${g.gate} (${g.center}) via ${g.planets.map(p => `${p.side} ${p.planet} ${g.gate}.${p.line} — ${p.meaning}`).join('; ') || 'planet n/a'}; Gene Key ${g.gate}: Shadow ${g.geneKey?.shadow} / Gift ${g.geneKey?.gift} / Siddhi ${g.geneKey?.siddhi}`));
  }
  L.push('=== END CYCLE EMBODIMENT DATA ===');
  return L.join('\n');
}
