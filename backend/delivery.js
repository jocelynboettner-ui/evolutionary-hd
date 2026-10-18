// delivery.js — optional email delivery of the finished reading PDF + one-reading-per-payment.
// Everything here is OFF unless RESEND_API_KEY and READING_FROM_EMAIL are both set, so the
// app behaves exactly as before when they are missing.
import fs from 'fs';
import os from 'os';
import path from 'path';

export const MAX_READING_ATTEMPTS = 3;   // retries allowed if generation fails before delivery
export const MAX_RESENDS = 5;
export const MAX_PDF_BYTES = 15 * 1024 * 1024;

export function deliveryConfig(env = process.env) {
  const apiKey = env.RESEND_API_KEY || '';
  const from = env.READING_FROM_EMAIL || '';
  const storeDir = env.READING_STORE_DIR
    || (fs.existsSync('/var/data') ? '/var/data/readings' : path.join(os.tmpdir(), 'ehd-readings'));
  return { enabled: !!(apiKey && from), apiKey, from, replyTo: env.READING_REPLY_TO || '', storeDir };
}

// Stripe Checkout session ids only; this also keeps file paths safe.
export const validSessionId = (id) => typeof id === 'string' && /^cs_(live|test)_[A-Za-z0-9]{10,200}$/.test(id);

// A brand-new reading = the first request of a conversation (no assistant turn yet).
// "continue" (part 2) and follow-up questions always carry an earlier assistant message.
export const isNewReadingRequest = (messages) =>
  Array.isArray(messages) && !messages.some(m => m && m.role === 'assistant');

// State lives on the PaymentIntent metadata (durable, no database needed).
export function readingState(session) {
  const md = (session && session.payment_intent && typeof session.payment_intent === 'object'
    && session.payment_intent.metadata) || {};
  return {
    status: md.ehd_status || 'new',
    attempts: parseInt(md.ehd_attempts || '0', 10) || 0,
    resends: parseInt(md.ehd_resends || '0', 10) || 0,
  };
}

export function readingAccess(session, isNew) {
  if (!isNew) return { allow: true };
  const st = readingState(session);
  if (st.status === 'delivered') return { allow: false, code: 'already_delivered' };
  if (st.attempts >= MAX_READING_ATTEMPTS) return { allow: false, code: 'attempts_exhausted' };
  return { allow: true };
}

// The paid session is bound to the birth details entered before checkout.
export function sessionBirthdata(session) {
  const md = (session && session.metadata) || {};
  if (!md.birthdate) return null;
  return { birthdate: md.birthdate, birthtime: md.birthtime || '', location: md.location || '', name: md.name || '' };
}

export function createReadingStore(dir) {
  const file = (id, ext) => {
    if (!validSessionId(id)) throw new Error('invalid session id');
    return path.join(dir, id + ext);
  };
  return {
    save(id, pdf, meta = {}) {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(file(id, '.pdf'), pdf);
      fs.writeFileSync(file(id, '.json'), JSON.stringify({ ...meta, savedAt: new Date().toISOString() }));
    },
    load(id) {
      try { return fs.readFileSync(file(id, '.pdf')); } catch { return null; }
    },
    meta(id) {
      try { return JSON.parse(fs.readFileSync(file(id, '.json'), 'utf8')); } catch { return null; }
    },
  };
}

export function decodePdf(b64) {
  if (typeof b64 !== 'string' || !b64) return null;
  const buf = Buffer.from(b64.replace(/^data:application\/pdf;[^,]*,/, ''), 'base64');
  if (buf.length < 5 || buf.length > MAX_PDF_BYTES || buf.subarray(0, 5).toString() !== '%PDF-') return null;
  return buf;
}

export const pdfFilename = (name) =>
  `evolutionary-hd-reading-${String(name || 'reading').trim().replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'reading'}.pdf`;

const esc = (s) => String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function buildReadingEmail({ from, replyTo, to, name, pdf, downloadUrl }) {
  const hi = name ? `Dear ${esc(name)},` : 'Hello,';
  const link = downloadUrl ? `<p>You can also download it again here: <a href="${esc(downloadUrl)}">${esc(downloadUrl)}</a></p>` : '';
  const msg = {
    from, to: [to],
    subject: 'Your Evolutionary Human Design Reading',
    html: `<p>${hi}</p><p>Thank you for your purchase. Your Evolutionary Human Design Reading is attached as a PDF.</p>${link}<p>With love,<br>Jocelyn</p>`,
    text: `${name ? 'Dear ' + name + ',' : 'Hello,'}\n\nThank you for your purchase. Your Evolutionary Human Design Reading is attached as a PDF.\n${downloadUrl ? '\nYou can also download it again here: ' + downloadUrl + '\n' : ''}\nWith love,\nJocelyn`,
    attachments: [{ filename: pdfFilename(name), content: pdf.toString('base64') }],
  };
  if (replyTo) msg.reply_to = replyTo;
  return msg;
}

export async function sendReadingEmail(cfg, opts, fetchImpl = fetch) {
  if (!cfg.enabled) return { sent: false, reason: 'disabled' };
  const res = await fetchImpl('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(buildReadingEmail({ from: cfg.from, replyTo: cfg.replyTo, ...opts })),
  });
  if (!res.ok) {
    let detail = '';
    try { detail = (await res.text()).slice(0, 300); } catch {}
    throw new Error(`Resend ${res.status} ${detail}`);
  }
  return { sent: true };
}

export const maskEmail = (e) => String(e || '').replace(/^(.)[^@]*(@.*)$/, '$1***$2');
