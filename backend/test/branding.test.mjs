import assert from 'node:assert/strict';
import fs from 'node:fs';
const rd = p => fs.readFileSync(new URL(p, import.meta.url), 'utf8');
const server = rd('../server.js');
assert.ok(server.includes("name: 'The Unwritten Map',"), 'Stripe product name');
assert.ok(/unit_amount: 3300/.test(server), 'price stays $33');
assert.ok(server.includes('This reading is called The Unwritten Map'), 'prompt self-reference');
assert.ok(server.includes('The Living Blueprint Workbook'), 'workbook name in prompt');
for (const f of ['../../frontend/index.html', '../../frontend/src/App.jsx', '../../frontend/src/readingPdf.js', '../../frontend/src/workbookPdf.js', '../delivery.js']) {
  const s = rd(f);
  assert.ok(!/Evolutionary Human Design (Reader|Reading|Workbook)|Living Blueprint Reader/.test(s), f + ' still has the old name');
}
assert.ok(rd('../../frontend/index.html').includes('<title>The Unwritten Map</title>'));
assert.ok(rd('../../frontend/src/readingPdf.js').includes('"The Unwritten Map"'));
assert.ok(rd('../../frontend/src/workbookPdf.js').includes('"The Living Blueprint Workbook"'));
console.log('branding tests passed');
