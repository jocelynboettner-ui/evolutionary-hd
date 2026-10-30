import assert from 'node:assert/strict';
import fs from 'node:fs';
const rd = p => fs.readFileSync(new URL(p, import.meta.url), 'utf8');
const server = rd('../server.js');
assert.ok(server.includes("name: 'Your Missing Map',"), 'Stripe product name');
assert.ok(/unit_amount: 3300/.test(server), 'price stays $33');
assert.ok(server.includes('This reading is called Your Missing Map'), 'prompt self-reference');
assert.ok(server.includes('The Living Blueprint Workbook'), 'workbook name in prompt');
for (const f of ['../../frontend/index.html', '../../frontend/src/App.jsx', '../../frontend/src/readingPdf.js', '../../frontend/src/workbookPdf.js', '../delivery.js']) {
  const s = rd(f);
  assert.ok(!/Evolutionary Human Design (Reader|Reading|Workbook)|Living Blueprint Reader/.test(s), f + ' still has the old name');
}
assert.ok(rd('../../frontend/index.html').includes('<title>Your Missing Map</title>'));
assert.ok(rd('../../frontend/src/readingPdf.js').includes('"Your Missing Map"'));
assert.ok(rd('../../frontend/src/workbookPdf.js').includes('"The Living Blueprint Workbook"'));
for (const f of ['../../frontend/index.html', '../../frontend/src/App.jsx', '../../frontend/src/readingPdf.js', '../../frontend/src/workbookPdf.js', '../delivery.js', '../server.js', '../support-of-process-addition.js', '../gift.js']) {
  assert.ok(!/Unwritten/.test(rd(f).replace("'unwritten-map-gift'", '')), f + ' still says The Unwritten Map');
}
const copy = rd('../reading-copy.js');
assert.ok(copy.includes('The journey of your life was always there, but no one handed you the map. Until now.'), 'opening line');
assert.ok(rd('../../frontend/src/App.jsx').includes('OPENING_LINE') && rd('../../frontend/src/readingPdf.js').includes('OPENING_LINE'), 'opening wired through');
assert.ok(!rd('../../frontend/src/readingPdf.js').includes('$222'), 'old session price');
console.log('branding tests passed');

// 1:1 session invitation (UI + clickable PDF link).
const pdfSrc = rd('../../frontend/src/readingPdf.js'), appSrc = rd('../../frontend/src/App.jsx');
assert.ok(pdfSrc.includes('https://app.acuityscheduling.com/schedule.php?owner=40622879'));
assert.ok(pdfSrc.includes("This is your map. Book a 90-minute one-on-one session to dive deeper. We'll read what's being asked of you and where you've been performing instead of living."));
assert.ok(pdfSrc.includes('Book your 90-minute session · $333') && /textWithLink\(SESSION_CTA/.test(pdfSrc));
assert.ok(appSrc.includes('href={SESSION_URL}') && appSrc.includes('{SESSION_INVITE}'));
console.log('session invite tests passed');

// Reader voice (owner-approved Reader Language Review, Oct 2026): precise, mythic frame, never flowery; Phoenix, not elder.
{
  const prompt = server.slice(server.indexOf('const SYSTEM_PROMPT = `'), server.indexOf('async function fetchHumanDesign'));
  assert.ok(prompt.includes('psychologically precise language inside a mythic frame'), 'new voice');
  assert.ok(prompt.includes('LENS (light touch'), 'lens block');
  assert.ok(prompt.includes('Desire is not indulgence. Desire is information.'), 'desire doctrine');
  assert.ok(prompt.includes('the phase no one named'), 'Phoenix definition');
  assert.ok(!/lyrical|soulful|wise woman|over tea|the elder who|across fifty years/i.test(prompt), 'old voice removed');
  assert.ok(!/\/\*|\*\/|Era of Planning|Lock Keeper|type activation/.test(prompt), 'stale commented-out blocks removed from the prompt');
  assert.ok(!/elderhood/.test(rd('../cycle-enrichment.js')), 'Sovereign theme no longer elderhood');
  const app = rd('../../frontend/src/App.jsx');
  assert.ok(!app.includes('great thresholds of your life') && !pdfSrc.includes('great thresholds of your life'), 'Human Design subtitle removed');
  assert.ok(copy.includes("Witness the cycles you've already walked.") && app.includes('COMPLETED_CYCLES_INTRO') && pdfSrc.includes('COMPLETED_CYCLES_INTRO'), 'completed cycles command');
  assert.ok(!/evolutionary reading|Weaving your story/.test(app), 'old first-screen copy');
  assert.ok(!/turned the lights on/.test(server) && server.includes('Includes your PDF reading and The Living Blueprint Workbook.'), 'Stripe description');
  console.log('reader voice tests passed');
}
