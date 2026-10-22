import assert from 'node:assert/strict';
import { isPaidCheckout, clampGiftCount, readableGiftCode, createGiftCodes, GIFT_COUPON_ID, MAX_GIFT_CODES } from '../gift.js';
import { readingState, readingAccess } from '../delivery.js';

// $33 paid and $0 (100% gift code) checkouts are both accepted; open/unpaid are not.
assert.equal(isPaidCheckout({ payment_status: 'paid', status: 'complete' }), true);
assert.equal(isPaidCheckout({ payment_status: 'no_payment_required', status: 'complete' }), true);
assert.equal(isPaidCheckout({ payment_status: 'no_payment_required', status: 'open' }), false);
assert.equal(isPaidCheckout({ payment_status: 'unpaid', status: 'complete' }), false);
assert.equal(isPaidCheckout(null), false);

// $0 session: no PaymentIntent -> reading state read from the session metadata (one reading per code).
const free = { payment_status: 'no_payment_required', status: 'complete', payment_intent: null, metadata: { birthdate: '1980-01-01', ehd_status: 'delivered' } };
assert.equal(readingState(free).status, 'delivered');
assert.equal(readingAccess(free, true).allow, false);
assert.equal(readingAccess({ ...free, metadata: { birthdate: '1980-01-01' } }, true).allow, true);
assert.equal(readingState({ payment_intent: { metadata: { ehd_attempts: '2' } }, metadata: { ehd_attempts: '9' } }).attempts, 2);

// Count is capped at 20, minimum 1.
assert.equal(clampGiftCount(7), 7); assert.equal(clampGiftCount(500), MAX_GIFT_CODES); assert.equal(clampGiftCount(0), 1); assert.equal(clampGiftCount('x'), 1);
assert.match(readableGiftCode(), /^MAP-[A-HJ-NP-Z2-9]{6}$/);

// Fake Stripe: coupon created once then reused; every promo code is single-use.
const calls = { coupons: [], promos: [] };
let coupon = null;
const fake = {
  coupons: {
    retrieve: async (id) => { if (!coupon) { const e = new Error('No such coupon'); e.code = 'resource_missing'; throw e; } return coupon; },
    create: async (p) => { calls.coupons.push(p); coupon = { ...p, valid: true, livemode: false }; return coupon; },
  },
  promotionCodes: { create: async (p) => { calls.promos.push(p); return { id: 'promo_' + calls.promos.length, code: p.code, max_redemptions: p.max_redemptions, livemode: false }; } },
};
const a = await createGiftCodes(fake, 3);
assert.equal(a.codes.length, 3);
assert.deepEqual(calls.coupons, [{ id: GIFT_COUPON_ID, name: 'Your Missing Map gift', percent_off: 100, duration: 'once' }]);
assert.ok(calls.promos.every(p => p.max_redemptions === 1 && p.coupon === GIFT_COUPON_ID && /^MAP-/.test(p.code)));
assert.equal(a.livemode, false);
const b = await createGiftCodes(fake, 50);
assert.equal(b.codes.length, 20);
assert.equal(calls.coupons.length, 1);   // reused
assert.ok(!JSON.stringify(a).includes('sk_'));
console.log('gift code tests passed');
