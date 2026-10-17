// bodygraph.js — dependency-free SVG bodygraph renderer in the standard Human Design layout.
// renderBodygraphSVG({ natal, overlay?, title?, subtitle? }) -> SVG string
//   natal:   { personalityGates, designGates, gates }
//   overlay: { gates } (cycle-peak chart) — gates not in natal are drawn as cycle activations (green).
// Layout follows the conventional bodygraph: Head (triangle up) over Ajna (triangle down) over a square
// Throat, G diamond, Heart triangle right of G, Spleen (left) and Solar Plexus (right) triangles beside the
// square Sacral, square Root at the bottom. Gate numbers sit at their standard positions on each center;
// stem channels run vertically in three columns, the others follow the standard curved routes.

const K = 2.2, OX = 240 - 114 * K, OY = 6;           // layout units -> SVG px
const X = x => +(OX + x * K).toFixed(1), Y = y => +(OY + y * K).toFixed(1);

// Standard center colors when defined
export const CENTER_FILL = { Head: '#f4d03f', Ajna: '#58b368', Throat: '#b8875a', G: '#f4d03f', Heart: '#d9443a',
  Sacral: '#d9443a', Spleen: '#b8875a', Solar: '#b8875a', Root: '#b8875a' };
const CENTER_SHAPE = {
  Head:   [[114, 4], [134, 40], [94, 40]],
  Ajna:   [[94, 45], [134, 45], [114, 86]],
  Throat: [[95, 95], [133, 95], [133, 135], [95, 135]],
  G:      [[114, 140], [140, 168], [114, 196], [88, 168]],
  Heart:  [[158, 177], [177, 210], [141, 204]],
  Spleen: [[24, 214], [62, 237], [24, 260]],
  Solar:  [[207, 214], [207, 260], [167, 237]],
  Sacral: [[95, 220], [133, 220], [133, 256], [95, 256]],
  Root:   [[95, 270], [133, 270], [133, 306], [95, 306]],
};
// Standard gate positions (layout units)
const GP = {
  64:[105,34],61:[114,34],63:[123,34],
  47:[105,52],24:[114,52],4:[123,52],17:[105,64],11:[123,64],43:[114,78],
  62:[105,100],23:[114,100],56:[123,100],16:[100,106],20:[100,117],35:[128,105],12:[128,114],45:[128,123],31:[105,130],8:[114,130],33:[123,130],
  1:[114,148],7:[105,157],13:[123,157],10:[94,168],25:[134,168],15:[105,179],46:[123,179],2:[114,188],
  21:[158,184],51:[151,192],26:[146,200],40:[168,204],
  48:[29,219],57:[37,224],44:[45,229],50:[54,234],32:[45,242],28:[37,247],18:[29,253],
  36:[201,219],22:[193,224],37:[184,229],6:[175,234],49:[184,241],55:[193,246],30:[201,252],
  5:[105,226],14:[114,226],29:[123,226],34:[100,234],27:[100,246],59:[128,242],42:[105,251],3:[114,251],9:[123,251],
  53:[105,275],60:[114,275],52:[123,275],54:[100,282],38:[100,291],58:[100,300],19:[128,282],39:[128,291],41:[128,300],
};
// Channel routes: [gateA, gateB, control point (quadratic) or null for straight]
const ROUTES = [
  [64,47,null],[61,24,null],[63,4,null],[17,62,null],[43,23,null],[11,56,null],
  [31,7,null],[8,1,null],[33,13,null],[15,5,null],[2,14,null],[46,29,null],[42,53,null],[3,60,null],[9,52,null],
  [16,48,[44,138]],[20,57,[52,150]],[20,34,[76,176]],[10,20,[86,138]],[10,34,[84,206]],[10,57,[58,186]],[34,57,[62,234]],
  [35,36,[188,136]],[12,22,[178,150]],[45,21,[152,138]],[25,51,[146,172]],[26,44,[92,204]],[37,40,[182,214]],
  [6,59,[152,246]],[27,50,[78,247]],[32,54,[62,276]],[28,38,[52,290]],[18,58,[40,302]],
  [19,49,[170,276]],[39,55,[180,290]],[30,41,[192,302]],
];
export const CHANNELS = ROUTES.map(([a, b]) => [Math.min(a, b), Math.max(a, b)]);
const GATE_CENTER = {};
Object.entries({Head:[64,61,63],Ajna:[47,24,4,17,43,11],Throat:[62,23,56,35,12,45,33,8,31,20,16],G:[10,25,46,15,2,1,7,13],Heart:[51,21,40,26],
  Sacral:[34,5,14,29,27,59,9,3,42],Solar:[36,22,37,6,55,30,49],Spleen:[48,57,44,50,32,28,18],Root:[53,60,52,19,39,41,58,38,54]})
  .forEach(([c, gs]) => gs.forEach(g => { GATE_CENTER[g] = c; }));
export { GATE_CENTER, GP as GATE_POSITIONS, CENTER_SHAPE };

export const COLORS = { personality: '#1b1b1b', design: '#c0392b', cycle: '#1f9d55', inactive: '#e2ddd5' };

export function definedCenters(gateSet) {
  const s = new Set();
  CHANNELS.forEach(([a, b]) => { if (gateSet.has(a) && gateSet.has(b)) { s.add(GATE_CENTER[a]); s.add(GATE_CENTER[b]); } });
  return s;
}

// Split a straight or quadratic route at t=0.5 -> [pathFromA, pathFromB] (SVG px)
function halves(a, b, c) {
  const A = GP[a], B = GP[b];
  if (!c) { const M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
    return [`M${X(A[0])} ${Y(A[1])}L${X(M[0])} ${Y(M[1])}`, `M${X(B[0])} ${Y(B[1])}L${X(M[0])} ${Y(M[1])}`]; }
  const P1 = [(A[0] + c[0]) / 2, (A[1] + c[1]) / 2], P2 = [(c[0] + B[0]) / 2, (c[1] + B[1]) / 2], M = [(P1[0] + P2[0]) / 2, (P1[1] + P2[1]) / 2];
  return [`M${X(A[0])} ${Y(A[1])}Q${X(P1[0])} ${Y(P1[1])} ${X(M[0])} ${Y(M[1])}`, `M${X(B[0])} ${Y(B[1])}Q${X(P2[0])} ${Y(P2[1])} ${X(M[0])} ${Y(M[1])}`];
}

export function renderBodygraphSVG({ natal, overlay = null, title = '', subtitle = '' }) {
  const P = new Set(natal?.personalityGates || []);
  const D = new Set(natal?.designGates || []);
  (natal?.gates || []).forEach(g => { if (!P.has(g) && !D.has(g)) D.add(g); });
  const natalSet = new Set([...P, ...D]);
  const C = new Set((overlay?.gates || []).filter(g => !natalSet.has(g)));
  const all = new Set([...natalSet, ...C]);
  const natalDef = definedCenters(natalSet), allDef = definedCenters(all);
  const kind = g => (C.has(g) ? 'cycle' : P.has(g) && D.has(g) ? 'both' : P.has(g) ? 'personality' : D.has(g) ? 'design' : null);

  const H0 = Y(312), HT = H0 + (overlay ? 92 : 74);
  const out = [];
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 ${HT}" width="400" height="${Math.round(HT * 400 / 480)}" font-family="Inter, Arial, sans-serif">`);
  out.push('<rect width="100%" height="100%" fill="#fbf8f2"/>');
  out.push(`<defs><pattern id="both" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="3" height="6" fill="${COLORS.personality}"/><rect x="3" width="3" height="6" fill="${COLORS.design}"/></pattern></defs>`);

  // Channels: inactive track first, then each activated half from its gate to the midpoint
  ROUTES.forEach(([a, b, c]) => {
    const [ha, hb] = halves(a, b, c);
    out.push(`<path d="${ha}" stroke="${COLORS.inactive}" stroke-width="9" fill="none" stroke-linecap="round"/><path d="${hb}" stroke="${COLORS.inactive}" stroke-width="9" fill="none" stroke-linecap="round"/>`);
    [[a, ha], [b, hb]].forEach(([g, d]) => {
      const k = kind(g); if (!k) return;
      if (k === 'both') {
        out.push(`<path d="${d}" stroke="${COLORS.personality}" stroke-width="7" fill="none"/>`);
        out.push(`<path d="${d}" stroke="${COLORS.design}" stroke-width="7" fill="none" stroke-dasharray="5 5"/>`);
      } else out.push(`<path d="${d}" stroke="${COLORS[k]}" stroke-width="7" fill="none" stroke-linecap="round"/>`);
    });
  });

  // Centers
  Object.entries(CENTER_SHAPE).forEach(([name, pts]) => {
    const isNatal = natalDef.has(name), isCycle = !isNatal && allDef.has(name);
    const fill = isNatal ? CENTER_FILL[name] : isCycle ? CENTER_FILL[name] + '99' : '#ffffff';
    const stroke = isCycle ? COLORS.cycle : '#4f4856', sw = isCycle ? 3 : 1.4, dash = isCycle ? ' stroke-dasharray="6 3"' : '';
    out.push(`<polygon data-center="${name}" points="${pts.map(([x, y]) => X(x) + ',' + Y(y)).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"${dash}/>`);
  });

  // Gate numbers at their standard positions
  Object.entries(GP).forEach(([g, [x, y]]) => {
    g = +g; const k = kind(g);
    const fill = !k ? '#ffffff' : k === 'both' ? 'url(#both)' : COLORS[k];
    out.push(`<circle data-gate="${g}" cx="${X(x)}" cy="${Y(y)}" r="8.2" fill="${fill}" stroke="${k ? '#ffffff' : '#8f8794'}" stroke-width="1"/>`);
    out.push(`<text x="${X(x)}" y="${Y(y) + 3.2}" font-size="8.5" font-weight="600" text-anchor="middle" fill="${k ? '#ffffff' : '#3f3946'}">${g}</text>`);
  });

  // Title + legend
  const ly = H0 + 18;
  if (title) out.push(`<text x="240" y="${ly}" font-size="17" font-weight="600" text-anchor="middle" fill="#2a2430">${esc(title)}</text>`);
  if (subtitle) out.push(`<text x="240" y="${ly + 18}" font-size="12.5" text-anchor="middle" fill="#5a5260">${esc(subtitle)}</text>`);
  const items = [['Personality', COLORS.personality], ['Design', COLORS.design], ['Both', 'url(#both)']];
  if (overlay) items.push(['Cycle activation', COLORS.cycle]);
  const step = 110, lx0 = 240 - (items.length * step) / 2 + 10;
  items.forEach(([lab, col], i) => {
    const x = lx0 + i * step;
    out.push(`<rect x="${x}" y="${ly + 30}" width="13" height="13" rx="2" fill="${col}"/><text x="${x + 18}" y="${ly + 41}" font-size="12" fill="#2a2430">${lab}</text>`);
  });
  if (overlay) out.push(`<text x="240" y="${ly + 66}" font-size="11.5" text-anchor="middle" fill="#2a2430">Dashed green = center defined by this cycle (natal authority unchanged)</text>`);
  out.push('</svg>');
  return out.join('');
}

function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

// Browser helper: SVG string -> PNG data URL (for the PDF)
export function svgToPng(svg, scale = 2) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = img.width * scale; c.height = img.height * scale;
      const ctx = c.getContext('2d'); ctx.scale(scale, scale); ctx.drawImage(img, 0, 0);
      resolve({ dataUrl: c.toDataURL('image/png'), w: img.width, h: img.height });
    };
    img.onerror = reject; img.src = url;
  });
}
