// bodygraph.js — dependency-free SVG bodygraph renderer (no paid service).
// renderBodygraphSVG({ natal, overlay?, title? }) -> SVG string
//   natal:   { personalityGates, designGates, gates, ... }
//   overlay: { gates } (cycle overlay chart) — gates not in natal are drawn as cycle activations.

const CENTERS = {
  Head:   { pts: [[200,20],[250,90],[150,90]], fill: '#f2d14b' },
  Ajna:   { pts: [[150,118],[250,118],[200,190]], fill: '#6cbf6a' },
  Throat: { rect: [160,220,80,70], fill: '#c79a5b' },
  G:      { pts: [[200,303],[247,350],[200,397],[153,350]], fill: '#f2d14b' },
  Heart:  { pts: [[258,378],[312,394],[268,424]], fill: '#e0574f' },
  Spleen: { pts: [[38,408],[38,502],[122,455]], fill: '#c79a5b' },
  Solar:  { pts: [[362,408],[362,502],[278,455]], fill: '#c79a5b' },
  Sacral: { rect: [160,420,80,80], fill: '#e0574f' },
  Root:   { rect: [160,530,80,72], fill: '#c79a5b' },
};
const G = {
  64:[170,84],61:[200,84],63:[230,84],
  47:[170,124],24:[200,124],4:[230,124],17:[178,152],11:[222,152],43:[200,178],
  62:[175,226],23:[200,226],56:[225,226],16:[166,242],20:[166,264],35:[234,240],12:[234,258],45:[234,276],31:[180,284],8:[200,284],33:[220,284],
  1:[200,312],7:[181,330],13:[219,330],10:[162,350],25:[238,350],15:[181,370],46:[219,370],2:[200,388],
  21:[284,389],51:[266,394],26:[272,414],40:[298,404],
  48:[46,424],57:[64,438],44:[84,444],50:[106,455],32:[64,472],28:[46,482],18:[46,494],
  36:[354,424],22:[336,438],37:[316,444],6:[294,455],49:[336,472],55:[354,482],30:[354,494],
  5:[175,426],14:[200,426],29:[225,426],34:[166,446],27:[166,476],59:[234,466],42:[180,494],3:[200,494],9:[220,494],
  53:[180,536],60:[200,536],52:[220,536],54:[166,552],38:[166,570],58:[166,588],19:[234,552],39:[234,570],41:[234,588],
};
export const CHANNELS = [[1,8],[2,14],[3,60],[4,63],[5,15],[6,59],[7,31],[9,52],[10,20],[10,34],[10,57],[11,56],[12,22],[13,33],[16,48],[17,62],[18,58],[19,49],[20,34],[20,57],[21,45],[23,43],[24,61],[25,51],[26,44],[27,50],[28,38],[29,46],[30,41],[32,54],[34,57],[35,36],[37,40],[39,55],[42,53],[47,64]];
const GATE_CENTER = {};
Object.entries({Head:[64,61,63],Ajna:[47,24,4,17,43,11],Throat:[62,23,56,35,12,45,33,8,31,20,16],G:[10,25,46,15,2,1,7,13],Heart:[51,21,40,26],
  Sacral:[34,5,14,29,27,59,9,3,42],Solar:[36,22,37,6,55,30,49],Spleen:[48,57,44,50,32,28,18],Root:[53,60,52,19,39,41,58,38,54]})
  .forEach(([c, gs]) => gs.forEach(g => { GATE_CENTER[g] = c; }));

export const COLORS = { personality: '#1b1b1b', design: '#c0392b', cycle: '#1f9d55', inactive: '#d9d4cc' };

export function definedCenters(gateSet) {
  const s = new Set();
  CHANNELS.forEach(([a, b]) => { if (gateSet.has(a) && gateSet.has(b)) { s.add(GATE_CENTER[a]); s.add(GATE_CENTER[b]); } });
  return s;
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
  const out = [];
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 ${overlay ? 690 : 670}" width="400" height="${overlay ? 690 : 670}" font-family="Inter, Arial, sans-serif">`);
  out.push('<rect width="100%" height="100%" fill="#fbf8f2"/>');
  out.push('<defs><pattern id="both" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="3" height="6" fill="' + COLORS.personality + '"/><rect x="3" width="3" height="6" fill="' + COLORS.design + '"/></pattern></defs>');

  // Channels: each half drawn from its gate to the midpoint, colored by that gate's activation.
  const half = (g, mx, my) => {
    const [x, y] = G[g], k = kind(g);
    const col = !k ? COLORS.inactive : k === 'both' ? 'url(#both)' : COLORS[k];
    if (k === 'both') {
      out.push(`<line x1="${x}" y1="${y}" x2="${mx}" y2="${my}" stroke="${COLORS.personality}" stroke-width="7" stroke-linecap="round"/>`);
      out.push(`<line x1="${x}" y1="${y}" x2="${mx}" y2="${my}" stroke="${COLORS.design}" stroke-width="7" stroke-dasharray="5 5" />`);
    } else out.push(`<line x1="${x}" y1="${y}" x2="${mx}" y2="${my}" stroke="${col}" stroke-width="${k ? 7 : 5}" stroke-linecap="round"/>`);
  };
  CHANNELS.forEach(([a, b]) => { const mx = (G[a][0] + G[b][0]) / 2, my = (G[a][1] + G[b][1]) / 2; half(a, mx, my); half(b, mx, my); });

  // Centers
  Object.entries(CENTERS).forEach(([name, c]) => {
    const isNatal = natalDef.has(name), isCycle = !isNatal && allDef.has(name);
    const fill = isNatal ? c.fill : isCycle ? c.fill + '88' : '#ffffff';
    const stroke = isCycle ? COLORS.cycle : '#5a5260', sw = isCycle ? 3 : 1.5, dash = isCycle ? ' stroke-dasharray="6 3"' : '';
    if (c.rect) { const [x, y, w, h] = c.rect; out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${dash}/>`); }
    else out.push(`<polygon points="${c.pts.map(p => p.join(',')).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"${dash}/>`);
  });

  // Gate markers
  Object.entries(G).forEach(([g, [x, y]]) => {
    g = +g; const k = kind(g);
    const fill = !k ? '#ffffff' : k === 'both' ? 'url(#both)' : COLORS[k];
    out.push(`<circle cx="${x}" cy="${y}" r="7.5" fill="${fill}" stroke="${k ? '#ffffff' : '#9a929e'}" stroke-width="1"/>`);
    out.push(`<text x="${x}" y="${y + 3}" font-size="8" font-weight="600" text-anchor="middle" fill="${k ? '#ffffff' : '#4a4450'}">${g}</text>`);
  });

  // Title + legend
  const ly = 625;
  if (title) out.push(`<text x="200" y="${ly - 8}" font-size="15" font-weight="600" text-anchor="middle" fill="#2a2430">${esc(title)}</text>`);
  if (subtitle) out.push(`<text x="200" y="${ly + 8}" font-size="11" text-anchor="middle" fill="#5a5260">${esc(subtitle)}</text>`);
  const items = [['Personality', COLORS.personality], ['Design', COLORS.design]];
  if (overlay) items.push(['Cycle activation', COLORS.cycle]);
  const lx0 = overlay ? 45 : 110;
  items.forEach(([lab, col], i) => {
    const x = lx0 + i * 115;
    out.push(`<rect x="${x}" y="${ly + 22}" width="12" height="12" rx="2" fill="${col}"/><text x="${x + 17}" y="${ly + 32}" font-size="10.5" fill="#2a2430">${lab}</text>`);
  });
  if (overlay) out.push(`<text x="200" y="${ly + 54}" font-size="10" text-anchor="middle" fill="#2a2430">Dashed green = center defined by this cycle (authority unchanged)</text>`);
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
