/* Payment gateway abstraction.
 *
 * PAYMENT_PROVIDER=razorpay -> real Razorpay Test Mode (needs RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET)
 * PAYMENT_PROVIDER=mock     -> local simulation of the same flow (default)
 *
 * Both follow Razorpay's flow:
 *   1. createOrder(amount)          -> gateway order id
 *   2. customer pays in a checkout  -> payment id + signature
 *   3. verifySignature(...)         -> HMAC_SHA256(orderId|paymentId, secret) must match
 *
 * Razorpay could not be used because sign-up requires an Indian PAN, so the mock
 * keeps the exact same contract and can be swapped by changing one env variable.
 */
const crypto = require('crypto');

const provider = () => (process.env.PAYMENT_PROVIDER || 'mock').toLowerCase();

const secret = () =>
  provider() === 'razorpay' ? process.env.RAZORPAY_KEY_SECRET : `mock-${process.env.JWT_SECRET}`;

const sign = (orderId, paymentId) =>
  crypto.createHmac('sha256', secret()).update(`${orderId}|${paymentId}`).digest('hex');

const safeEqual = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

// amount in rupees -> gateway order
const createOrder = async (amountInRupees, receipt) => {
  const amount = Math.round(amountInRupees * 100); // paise

  if (provider() === 'razorpay') {
    const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, currency: 'INR', receipt }),
    });
    if (!res.ok) throw Object.assign(new Error('Payment gateway error'), { status: 502 });
    const data = await res.json();
    return { provider: 'razorpay', orderId: data.id, amount, currency: 'INR', keyId: process.env.RAZORPAY_KEY_ID };
  }

  return {
    provider: 'mock',
    orderId: `order_mock_${crypto.randomBytes(8).toString('hex')}`,
    amount,
    currency: 'INR',
  };
};

// Mock checkout: what the Razorpay popup would return to the browser
const mockCapture = (orderId) => {
  const paymentId = `pay_mock_${crypto.randomBytes(8).toString('hex')}`;
  return { paymentId, signature: sign(orderId, paymentId) };
};

const verifySignature = ({ orderId, paymentId, signature }) =>
  Boolean(orderId && paymentId && signature) && safeEqual(sign(orderId, paymentId), signature);

module.exports = { provider, createOrder, mockCapture, verifySignature };
