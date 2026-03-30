// hd-v3-parser.js
// Full parser for humandesign.ai v3/hd-data response

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

function parsePlanetActivation(p) {
  if (!p) return null;
  const gate = parseInt(p.Gate) || 0;
  return {
    planet: p.Planet || '',
    gate,
    line: parseInt(p.Line) || 0,
    sign: p.Sign || '',
    isRetrograde: p.IsRetrograde === true || p.IsRetrograde === 'true',
    iChingName: p.IChingName || '',
    geneKeys: { shadow: p.GeneKeys?.Shadow || '', gift: p.GeneKeys?.Gift || '', siddhi: p.GeneKeys?.Siddhi || '' },
    gateKeynote: p.GateKeynote || '',
    lineDescription: p.LineDescription || '',
    circuit: GATE_CIRCUIT[gate] || 'Unknown'
  };
}

export function transformV3Response(raw) {
  const P = raw?.Properties || {};
  const val = (key) => { const v = P[key]; if (Array.isArray(v)) return v[0] || ''; return typeof v === 'string' ? v : (typeof v === 'object' && v !== null ? (v.Option || v.Id || '') : ''); };

  const channels = (P?.Channels?.List || []).map(c => String(c?.Option || '')).filter(Boolean);
  const gates = (P?.Gates?.List || []).map(g => g?.Option).filter(v => v !== undefined && v !== null);

  const definedSet = new Set();
  channels.forEach(ch => { ch.split('-').map(s => parseInt(s.trim())).forEach(g => { if (CENTER_MAP[g]) definedSet.add(CENTER_MAP[g]); }); });

  const personality = {};
  const personalityArr = raw?.Personality || P?.Personality || [];
  if (Array.isArray(personalityArr)) { personalityArr.forEach(p => { if (p?.Planet) personality[p.Planet] = parsePlanetActivation(p); }); }

  const design = {};
  const designArr = raw?.Design || P?.Design || [];
  if (Array.isArray(designArr)) { designArr.forEach(p => { if (p?.Planet) design[p.Planet] = parsePlanetActivation(p); }); }

  const retrogrades = [];
  const personalityVals = Object.values(personality);
  const designVals = Object.values(design);
  personalityVals.forEach(p => { if (p?.isRetrograde) retrogrades.push({ planet: p.planet, gate: p.gate, line: p.line, sign: p.sign, layer: 'conscious' }); });
  designVals.forEach(p => { if (p?.isRetrograde) retrogrades.push({ planet: p.planet, gate: p.gate, line: p.line, sign: p.sign, layer: 'unconscious' }); });

  const gbc = raw?.GatesByCategory || P?.GatesByCategory || {};
  const gatesByCategory = { definedGates: gbc.DefinedGates || [], hangingOpen: gbc.HangingOpen || [], hangingClosed: gbc.HangingClosed || [], openGates: gbc.OpenGates || [] };

  const vars = raw?.Variables || P?.Variables || {};
  const variables = { digestion: vars.Digestion || '', sense: vars.Sense || '', motivation: vars.Motivation || '', environment: vars.Environment || '', perspective: vars.Perspective || '' };

  const crossRaw = raw?.IncarnationCross || P?.IncarnationCross || {};
  const incarnation_cross = typeof crossRaw === 'string' ? crossRaw : (crossRaw.Name || crossRaw.Option || val('IncarnationCross'));
  const incarnation_cross_gates = crossRaw.Gates || [];

  const circuitBreakdown = { Individual: [], Collective: [], Tribal: [] };
  gates.forEach(g => { const gn = parseInt(g); const circuit = GATE_CIRCUIT[gn]; if (circuit && circuitBreakdown[circuit]) circuitBreakdown[circuit].push(gn); });

  return { type: val('Type'), strategy: val('Strategy'), authority: val('InnerAuthority'), profile: val('Profile'), incarnation_cross, incarnation_cross_gates, definition: val('Definition'), signature: val('Signature'), not_self: val('NotSelfTheme'), defined_centers: ALL_CENTERS.filter(c => definedSet.has(c)), open_centers: ALL_CENTERS.filter(c => !definedSet.has(c)), channels, gates, personality, design, retrogrades, gatesByCategory, variables, circuitBreakdown };
}

export function formatV3HDChart(data) {
  let retrogradeSection = '';
  if (data.retrogrades && data.retrogrades.length > 0) {
    const rList = data.retrogrades.map(r => r.planet + ' (Gate ' + r.gate + '.' + r.line + ' in ' + r.sign + ', ' + r.layer + ') — retrograde: energy is internalized, non-linear, deeply personal').join('\n');
    retrogradeSection = '\nRETROGRADE PLANETS AT BIRTH:\n' + rList + '\n';
  }

  const keyPlanets = ['Sun', 'Earth', 'Moon', 'North Node', 'Saturn', 'Chiron'];
  const gkLines = [];
  keyPlanets.forEach(pname => {
    const pp = data.personality?.[pname];
    const dp = data.design?.[pname];
    if (pp?.geneKeys?.shadow) gkLines.push('Conscious ' + pp.planet + ' — Gate ' + pp.gate + ' (' + pp.iChingName + '): Shadow: ' + pp.geneKeys.shadow + ' | Gift: ' + pp.geneKeys.gift + ' | Siddhi: ' + pp.geneKeys.siddhi);
    if (dp?.geneKeys?.shadow) gkLines.push('Unconscious ' + dp.planet + ' — Gate ' + dp.gate + ' (' + dp.iChingName + '): Shadow: ' + dp.geneKeys.shadow + ' | Gift: ' + dp.geneKeys.gift + ' | Siddhi: ' + dp.geneKeys.siddhi);
  });
  const geneKeysSection = gkLines.length > 0 ? '\nGENE KEYS (key planets):\n' + gkLines.join('\n') + '\n' : '';

  const v = data.variables;
  const variablesSection = (v && v.digestion) ? '\nVARIABLES (PHS / Environment):\nDigestion: ' + v.digestion + '\nSense: ' + v.sense + '\nMotivation: ' + v.motivation + '\nEnvironment: ' + v.environment + '\n' : '';

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
