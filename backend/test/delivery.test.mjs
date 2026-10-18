import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  deliveryConfig, validSessionId, isNewReadingRequest, readingAccess, readingState, sessionBirthdata,
  createReadingStore, decodePdf, buildReadingEmail, sendReadingEmail, maskEmail, pdfFilename, MAX_READING_ATTEMPTS,
} from '../delivery.js';

// Off unless both the key and the from address are set (no behavior change by default).
assert.equal(deliveryConfig({}).enabled, false);
assert.equal(deliveryConfig({ RESEND_API_KEY: 'k' }).enabled, false);
assert.equal(deliveryConfig({ READING_FROM_EMAIL: 'a@b.c' }).enabled, false);
assert.equal(deliveryConfig({ RESEND_API_KEY: 'k', READING_FROM_EMAIL: 'Jocelyn <readings@litbydesign.com>' }).enabled, true);
assert.equal(deliveryConfig({ READING_STORE_DIR: '/x/y' }).storeDir, '/x/y');

// Session ids: only real Checkout ids; nothing that could escape the store directory.
assert.ok(validSessionId('cs_live_a1B2c3D4e5F6g7H8'));
assert.ok(validSessionId('cs_test_a1B2c3D4e5F6g7H8'));
for (const bad of ['', 'cs_fake', '../etc/passwd', 'cs_live_../../x', 'cs_live_abc', null, 42]) assert.ok(!validSessionId(bad), String(bad));

// New reading vs continue / follow-up.
assert.ok(isNewReadingRequest([{ role: 'user', content: 'Jo 1973-09-30 05:07 Reading PA' }]));
assert.ok(!isNewReadingRequest([{ role: 'user', content: 'x' }, { role: 'assistant', content: 'part 1' }, { role: 'user', content: 'continue' }]));
assert.ok(!isNewReadingRequest(null));

// Single use: one reading per payment, limited retries before delivery, follow-ups always allowed.
const sess = (md) => ({ payment_intent: { id: 'pi_1', metadata: md } });
assert.deepEqual(readingState(sess({})), { status: 'new', attempts: 0, resends: 0 });
assert.ok(readingAccess(sess({}), true).allow);
assert.ok(readingAccess(sess({ ehd_status: 'generating', ehd_attempts: '1' }), true).allow);
assert.equal(readingAccess(sess({ ehd_status: 'generating', ehd_attempts: String(MAX_READING_ATTEMPTS) }), true).code, 'attempts_exhausted');
assert.equal(readingAccess(sess({ ehd_status: 'delivered', ehd_attempts: '1' }), true).code, 'already_delivered');
assert.ok(readingAccess(sess({ ehd_status: 'delivered' }), false).allow);
assert.equal(readingState({ payment_intent: 'pi_unexpanded' }).status, 'new');

// Birth details are bound to what was entered at checkout.
assert.deepEqual(sessionBirthdata({ metadata: { birthdate: '1973-09-30', birthtime: '05:07', location: 'Reading, PA', name: 'Jo' } }),
  { birthdate: '1973-09-30', birthtime: '05:07', location: 'Reading, PA', name: 'Jo' });
assert.equal(sessionBirthdata({ metadata: {} }), null);

// PDF validation.
const pdf = Buffer.from('%PDF-1.3\nhello');
assert.ok(decodePdf(pdf.toString('base64')).equals(pdf));
assert.ok(decodePdf('data:application/pdf;filename=generated.pdf;base64,' + pdf.toString('base64')).equals(pdf));
assert.equal(decodePdf(Buffer.from('<html>').toString('base64')), null);
assert.equal(decodePdf(''), null);

// Store round trip.
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ehd-store-'));
const store = createReadingStore(dir);
const id = 'cs_test_a1B2c3D4e5F6g7H8';
assert.equal(store.load(id), null);
store.save(id, pdf, { email: 'jo@example.com' });
assert.ok(store.load(id).equals(pdf));
assert.equal(store.meta(id).email, 'jo@example.com');
assert.throws(() => store.save('../evil', pdf));
fs.rmSync(dir, { recursive: true });

// Email payload (Resend) and sending.
const msg = buildReadingEmail({ from: 'Jocelyn <readings@litbydesign.com>', replyTo: 'jo@litbydesign.com', to: 'buyer@example.com', name: 'Jo <b>', pdf, downloadUrl: 'https://x.test/?reading=' + id });
assert.deepEqual(msg.to, ['buyer@example.com']);
assert.equal(msg.attachments[0].filename, 'evolutionary-hd-reading-jo-b-.pdf');
assert.equal(Buffer.from(msg.attachments[0].content, 'base64').toString(), pdf.toString());
assert.ok(msg.html.includes('Jo &lt;b&gt;'));
assert.equal(msg.reply_to, 'jo@litbydesign.com');
assert.equal(pdfFilename(''), 'evolutionary-hd-reading-reading.pdf');
assert.equal(maskEmail('buyer@example.com'), 'b***@example.com');

const calls = [];
const fakeFetch = async (url, opts) => { calls.push({ url, opts }); return { ok: true, text: async () => '' }; };
assert.deepEqual(await sendReadingEmail({ enabled: false }, {}, fakeFetch), { sent: false, reason: 'disabled' });
assert.equal(calls.length, 0);
const cfg = deliveryConfig({ RESEND_API_KEY: 'test-key', READING_FROM_EMAIL: 'readings@litbydesign.com' });
assert.deepEqual(await sendReadingEmail(cfg, { to: 'buyer@example.com', name: 'Jo', pdf }, fakeFetch), { sent: true });
assert.equal(calls[0].url, 'https://api.resend.com/emails');
assert.equal(calls[0].opts.headers.Authorization, 'Bearer test-key');
await assert.rejects(sendReadingEmail(cfg, { to: 'b@x.co', pdf }, async () => ({ ok: false, status: 422, text: async () => 'bad' })), /Resend 422/);

console.log('delivery tests passed');
