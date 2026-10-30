import assert from 'node:assert/strict';
import fs from 'node:fs';
import { gateExplanation, CONSCIOUS_UNCONSCIOUS } from '../gate-explain.js';
import { transformV3Response } from '../hd-v3-parser.js';
import { planetTable } from '../reading-context.js';

const mystery = gateExplanation({ gate: 61, line: 6 });
assert.equal(mystery.title, '61.6 Inner Truth');
assert.match(mystery.keynote, /Gate of Mystery/);
assert.match(mystery.paragraphs.join(' '), /inner truth|mysteries/i);
assert.match(mystery.paragraphs.join(' '), /Inspiration/);

const raw = JSON.parse(fs.readFileSync(new URL('./fixture-jocelyn-raw.json', import.meta.url))).full_raw;
const sun = planetTable(transformV3Response(raw)).find(r => r.planet === 'Sun').conscious;
const ex = gateExplanation(sun);
assert.equal(ex.title, '18.4 Work on the Decayed');
assert.match(ex.keynote, /Gate of Correction/);
assert.match(ex.paragraphs.join(' '), /Incompetent/);
assert.match(ex.paragraphs.join(' '), /Integrity/);
assert.match(CONSCIOUS_UNCONSCIOUS, /black side/);
assert.match(CONSCIOUS_UNCONSCIOUS, /Personality/);
assert.match(CONSCIOUS_UNCONSCIOUS, /red side/);
assert.match(CONSCIOUS_UNCONSCIOUS, /Design/);
console.log('gate explanation tests passed (61.6 Inner Truth; Jocelyn Sun 18.4 from the chart)');
