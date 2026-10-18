// Gift codes for friends: 100%-off, single-use Stripe promotion codes on the $33 Checkout.
import crypto from 'crypto';

export const GIFT_COUPON_ID = 'unwritten-map-gift';
export const GIFT_COUPON_NAME = 'Unwritten Map gift';
export const MAX_GIFT_CODES = 20;
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // no 0/O/1/I for readability

// A completed Checkout counts as paid when it was charged, or when a 100% code made it free ($0).
export function isPaidCheckout(session) {
  if (!session) return false;
  if (session.payment_status === 'paid') return true;
  return session.payment_status === 'no_payment_required' && session.status === 'complete';
}

export function clampGiftCount(n) {
  const v = Math.floor(Number(n));
  if (!Number.isFinite(v) || v < 1) return 1;
  return Math.min(v, MAX_GIFT_CODES);
}

export function readableGiftCode(bytes = crypto.randomBytes(6)) {
  return 'MAP-' + Array.from(bytes.subarray(0, 6), b => ALPHABET[b % ALPHABET.length]).join('');
}

// Create (or reuse) the coupon, then N promotion codes with max_redemptions 1. Returns codes + livemode only.
export async function createGiftCodes(stripe, count, { makeCode = readableGiftCode } = {}) {
  const n = clampGiftCount(count);
  let coupon;
  try {
    coupon = await stripe.coupons.retrieve(GIFT_COUPON_ID);
    if (coupon.percent_off !== 100 || coupon.duration !== 'once' || coupon.valid === false) throw new Error('gift coupon is not 100% / once / valid');
  } catch (err) {
    if (err?.code !== 'resource_missing' && err?.statusCode !== 404) throw err;
    coupon = await stripe.coupons.create({ id: GIFT_COUPON_ID, name: GIFT_COUPON_NAME, percent_off: 100, duration: 'once' });
  }
  const codes = [];
  for (let i = 0; i < n; i++) {
    let promo = null;
    for (let tries = 0; !promo && tries < 3; tries++) {
      try {
        promo = await stripe.promotionCodes.create({ coupon: coupon.id, code: makeCode(), max_redemptions: 1, metadata: { purpose: 'gift' } });
      } catch (err) {
        if (tries === 2 || !/already exists|code/i.test(err?.message || '')) throw err;   // retry only on code collisions
      }
    }
    codes.push({ code: promo.code, id: promo.id, max_redemptions: promo.max_redemptions, livemode: promo.livemode });
  }
  return { livemode: coupon.livemode, coupon: { id: coupon.id, name: coupon.name, percent_off: coupon.percent_off, duration: coupon.duration, livemode: coupon.livemode }, codes };
}
