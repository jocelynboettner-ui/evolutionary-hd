// hd-v3-parser.js — FIXED for actual v3 API structure
// v3 Personality/Design: objects keyed by lowercase planet name (sun, earth, north_node...)
// v3 IncarnationCross: { Name, Id, Option } — Option has the full text
// v3 Variables: { Digestion, Environment, Awareness, Perspective } at top level

const GATE_CIRCUIT = {
  1:'Individual',2:'Individual',3:'Individual',7:'Individual',10:'Individual',13:'Individual',
  15:'Individual',24:'Individual',25:'Individual',28:'Individual',32:'Individual',38:'Individual',
  39:'Individual',43:'Individual',44:'Individual',51:'Individual',52:'Individual',53:'Individual',
  54:'Individual',57:'Individual',58:'Individual',60:'Individual',
  4:'Collective',11:'Collective',17:'Collective',18:'Collective',23:'Collective',29:'Collective',
  42:'Collective',46:'Collective',47:'Collective',48:'Collective',49:'Collective',55:'Collective',
  56:'Collective',59:'Collective',62:'Collective',63:'Collective',64:'Collective',
  5:'Collective',6:'Collective',8:'Collective',9:'Collective',14:'Collective',16:'Collective',
  20:'Collective',33:'Collective',34:'Collective',35:'Collective',36:'Collective',45:'Collective',61:'Collective',
  19:'Tribal',21:'Tribal',22:'Tribal',26:'Tribal',27:'Tribal',30:'Tribal',31:'Tribal',
  37:'Tribal',40:'Tribal',41:'Tribal',50:'Tribal'
};

const CENTER_MAP = {
  64:'Head',61:'Head',63:'Head',
  47:'Ajna',24:'Ajna',4:'Ajna',17:'Ajna',43:'Ajna',11:'Ajna',
  62:'Throat',23:'Throat',56:'Throat',35:'Throat',12:'Throat',45:'Throat',33:'Throat',8:'Throat',31:'Throat',20:'Throat',16:'Throat',
  10:'G',25:'G',46:'G',15:'G',2:'G',1:'G',
  51:'Heart',21:'Heart',40:'Heart',26:'Heart',
  34:'Sacral',5:'Sacral',14:'Sacral',29:'Sacral',27:'Sacral',59:'Sacral',9:'Sacral',3:'Sacral',42:'Sacral',
  36:'Solar',22:'Solar',37:'Solar',6:'Solar',55:'Solar',30:'Solar',
  48:'Spleen',57:'Spleen',44:'Spleen',50:'Spleen',32:'Spleen',28:'Spleen',18:'Spleen',
  53:'Root',60:'Root',52:'Root',19:'Root',39:'Root',41:'Root',58:'Root',38:'Root',54:'Root'
};

const ALL_CENTERS = ['Head','Ajna','Throat','G','Heart','Sacral','Solar','Spleen','Root'];

// Convert lowercase underscore key (north_node) to display name (North Node)
function keyToPlanetName(key) {
  return key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function parsePlanetActivation(entry, planetKey) {
  if (!entry) return null;
  const gate = parseInt(entry.Gate) || 0;
  return {
    planet: keyToPlanetName(planetKey),
    gate,
    line: parseInt(entry.Line) || 0,
    sign: entry.Sign || '',
    isRetrograde: entry.IsRetrograde === true,
    iChingName: entry.IChingName || '',
    geneKeys: {
      shadow: entry.GeneKeys?.Shadow || '',
      gift: entry.GeneKeys?.Gift || '',
      siddhi: entry.GeneKeys?.Siddhi || ''
    },
    gateKeynote: entry.GateKeynote || '',
    lineDescription: entry.LineDescription || '',
    circuit: GATE_CIRCUIT[gate] || 'Unknown'
  };
}

export function transformV3Response(raw) {
  const P = raw?.Properties || {};

  const val = (key) => {
    const v = P[key];
    if (!v) return '';
    if (typeof v === 'string') return v;
    if (Array.isArray(v)) return v[0] || '';
    if (typeof v === 'object') return v.Option || v.Id || v.Name || '';
    return '';
  };

  const channels = (P?.Channels?.List || []).map(c => String(c?.Option || '')).filter(Boolean);
  const gates = (P?.Gates?.List || []).map(g => g?.Option).filter(v => v !== undefined && v !== null);

  const definedSet = new Set();
  channels.forEach(ch => { ch.split('-').map(s => parseInt(s.trim())).forEach(g => { if (CENTER_MAP[g]) definedSet.add(CENTER_MAP[g]); }); });

  // Personality and Design are OBJECTS keyed by lowercase planet name
  // e.g. { sun: {Gate,Line,IsRetrograde,...}, earth: {...}, north_node: {...} }
  const personality = {};
  const personalityRaw = raw?.Personality;
  if (personalityRaw && typeof personalityRaw === 'object' && !Array.isArray(personalityRaw)) {
    Object.entries(personalityRaw).forEach(([key, entry]) => {
      if (entry && typeof entry === 'object') personality[keyToPlanetName(key)] = parsePlanetActivation(entry, key);
    });
  }

  const design = {};
  const designRaw = raw?.Design;
  if (designRaw && typeof designRaw === 'object' && !Array.isArray(designRaw)) {
    Object.entries(designRaw).forEach(([key, entry]) => {
      if (entry && typeof entry === 'object') design[keyToPlanetName(key)] = parsePlanetActivation(entry, key);
    });
  }

  // Collect retrograde planets from both layers
  const retrogrades = [];
  Object.entries(personality).forEach(([name, p]) => {
    if (p?.isRetrograde) retrogrades.push({ planet: name, gate: p.gate, line: p.line, sign: p.sign, layer: 'conscious' });
  });
  Object.entries(design).forEach(([name, p]) => {
    if (p?.isRetrograde) retrogrades.push({ planet: name, gate: p.gate, line: p.line, sign: p.sign, layer: 'unconscious' });
  });

  // GatesByCategory
  const gbc = raw?.GatesByCategory || {};
  const gatesByCategory = {
    definedGates: gbc.DefinedGates || [],
    hangingOpen: gbc.HangingOpen || [],
    hangingClosed: gbc.HangingClosed || [],
    openGates: gbc.OpenGates || []
  };

  // Variables — merge raw.Variables + Properties.Variable for complete data
  const varsTop = raw?.Variables || {};
  const varsProp = P?.Variable || P?.Variables || {};
  const variables = {
    digestion: varsTop.Digestion || varsProp.Digestion || '',
    sense: varsTop.Sense || varsProp.Sense || '',
    motivation: varsTop.Motivation || varsProp.Motivation || '',
    environment: varsTop.Environment || varsProp.Environment || '',
    perspective: varsTop.Perspective || varsProp.Perspective || '',
    awareness: varsTop.Awareness || varsProp.Awareness || ''
  };

  // IncarnationCross — Option has the full readable text
  const crossRaw = raw?.IncarnationCross || P?.IncarnationCross;
  const incarnation_cross = (typeof crossRaw === 'string')
    ? crossRaw
    : (crossRaw?.Option || crossRaw?.Name || val('IncarnationCross') || '');
  const incarnation_cross_gates = crossRaw?.Gates || [];

  // Circuit breakdown from active gates
  const circuitBreakdown = { Individual: [], Collective: [], Tribal: [] };
  gates.forEach(g => {
    const gn = parseInt(g);
    const circuit = GATE_CIRCUIT[gn];
    if (circuit && circuitBreakdown[circuit]) circuitBreakdown[circuit].push(gn);
  });

  const norm = {
    type: { generator: 'Generator', manifesting_generator: 'Manifesting Generator', projector: 'Projector', manifestor: 'Manifestor', reflector: 'Reflector' },
    strategy: { to_respond: 'To Respond', wait_for_invitation: 'Wait for Invitation', to_inform: 'To Inform', lunar_cycle: 'Lunar Cycle' },
    authority: { sacral: 'Sacral Authority', emotional: 'Emotional Authority', splenic: 'Splenic Authority', ego: 'Ego Authority', self: 'Self-Projected Authority', mental: 'Mental Projector Authority', lunar: 'Lunar Authority', none: 'No Inner Authority' },
    profile: { '1_3': '1/3', '1_4': '1/4', '2_4': '2/4', '2_5': '2/5', '3_5': '3/5', '3_6': '3/6', '4_6': '4/6', '4_1': '4/1', '5_1': '5/1', '5_2': '5/2', '6_2': '6/2', '6_3': '6/3' },
    definition: { single_definition: 'Single Definition', split_definition: 'Split Definition', triple_split: 'Triple Split', quadruple_split: 'Quadruple Split', no_definition: 'No Definition (Reflector)' },
    signature: { satisfaction: 'Satisfaction', success: 'Success', peace: 'Peace', surprise: 'Surprise' },
    not_self: { frustration: 'Frustration', bitterness: 'Bitterness', anger: 'Anger', disappointment: 'Disappointment' },
  };
  const n = (map, raw) => map[raw] || map[raw?.toLowerCase()] || raw || '';
  return {
    type: n(norm.type, val('Type')),
    strategy: n(norm.strategy, val('Strategy')),
    authority: n(norm.authority, val('InnerAuthority')),
    profile: n(norm.profile, val('Profile')),
    incarnation_cross,
    incarnation_cross_gates,
    definition: n(norm.definition, val('Definition')),
    signature: n(norm.signature, val('Signature')),
    not_self: n(norm.not_self, val('NotSelfTheme')),
    defined_centers: ALL_CENTERS.filter(c => definedSet.has(c)),
    open_centers: ALL_CENTERS.filter(c => !definedSet.has(c)),
    channels,
    gates,
    personality,
    design,
    retrogrades,
    gatesByCategory,
    variables,
    circuitBreakdown
  };
}

export function formatV3HDChart(data) {
  // Retrograde section
  let retrogradeSection = '';
  if (data.retrogrades && data.retrogrades.length > 0) {
    const rList = data.retrogrades.map(r =>
      r.planet + ' — Gate ' + r.gate + '.' + r.line + ' in ' + r.sign + ' (' + r.layer + ') — retrograde: energy is internalized, non-linear, deeply personal'
    ).join('\n');
    retrogradeSection = '\nRETROGRADE PLANETS AT BIRTH:\n' + rList + '\n';
  }

  // Gene Keys for key planets
  const keyPlanetNames = ['Sun', 'Earth', 'Moon', 'North Node', 'Saturn', 'Chiron'];
  const gkLines = [];
  keyPlanetNames.forEach(name => {
    const pp = data.personality?.[name];
    const dp = data.design?.[name];
    if (pp?.geneKeys?.shadow) gkLines.push('Conscious ' + pp.planet + ' — Gate ' + pp.gate + ' (' + pp.iChingName + '): Shadow: ' + pp.geneKeys.shadow + ' | Gift: ' + pp.geneKeys.gift + ' | Siddhi: ' + pp.geneKeys.siddhi);
    if (dp?.geneKeys?.shadow) gkLines.push('Unconscious ' + dp.planet + ' — Gate ' + dp.gate + ' (' + dp.iChingName + '): Shadow: ' + dp.geneKeys.shadow + ' | Gift: ' + dp.geneKeys.gift + ' | Siddhi: ' + dp.geneKeys.siddhi);
  });
  const geneKeysSection = gkLines.length > 0 ? '\nGENE KEYS (key planets):\n' + gkLines.join('\n') + '\n' : '';

  // Variables / PHS
  const v = data.variables;
  const variablesSection = (v && (v.digestion || v.environment)) ?
    '\nVARIABLES (PHS / Environment):\n' +
    (v.digestion ? 'Digestion: ' + v.digestion + '\n' : '') +
    (v.sense ? 'Sense: ' + v.sense + '\n' : '') +
    (v.motivation ? 'Motivation: ' + v.motivation + '\n' : '') +
    (v.environment ? 'Environment: ' + v.environment + '\n' : '') +
    (v.awareness ? 'Awareness: ' + v.awareness + '\n' : '') +
    (v.perspective ? 'Perspective: ' + v.perspective + '\n' : '') : '';

  // Circuit breakdown
  let circuitSection = '';
  const cb = data.circuitBreakdown;
  if (cb) {
    const parts = [];
    if (cb.Individual?.length) parts.push('Individual circuit gates: ' + cb.Individual.join(', '));
    if (cb.Collective?.length) parts.push('Collective circuit gates: ' + cb.Collective.join(', '));
    if (cb.Tribal?.length) parts.push('Tribal circuit gates: ' + cb.Tribal.join(', '));
    if (parts.length) circuitSection = '\nCIRCUIT BREAKDOWN:\n' + parts.join('\n') + '\n';
  }

  return '=== NATAL CHART DATA (humandesign.ai v3) ===\n\n' +
    'TYPE: ' + data.type + '\n' +
    'STRATEGY: ' + data.strategy + '\n' +
    'INNER AUTHORITY: ' + data.authority + '\n' +
    'PROFILE: ' + data.profile + '\n' +
    'INCARNATION CROSS: ' + data.incarnation_cross + '\n' +
    'DEFINITION: ' + data.definition + '\n' +
    'SIGNATURE: ' + data.signature + '\n' +
    'NOT-SELF THEME: ' + data.not_self + '\n\n' +
    'DEFINED CENTERS: ' + data.defined_centers.join(', ') + '\n' +
    'OPEN CENTERS: ' + data.open_centers.join(', ') + '\n\n' +
    'CHANNELS: ' + data.channels.join(', ') + '\n' +
    'GATES: ' + data.gates.join(', ') + '\n' +
    retrogradeSection + geneKeysSection + variablesSection + circuitSection +
    '\n=== END NATAL CHART DATA ===\n';
}
