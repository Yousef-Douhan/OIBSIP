const mongoose = require('mongoose');
const Order = require('../models/Order');
const payment = require('../services/payment.service');
const { priceOrder, deductStock, httpError } = require('../services/order.service');
const { emitToAdmins } = require('../services/socket.service');
const { checkLowStock } = require('../jobs/stockAlert.cron');

const POPULATE = [
  { path: 'items.base items.sauce items.cheese items.veggies', select: 'name category price' },
  { path: 'user', select: 'name email' },
];

// POST /api/orders/quote -> price preview for the order summary page
exports.quote = async (req, res) => {
  const { lines, total } = await priceOrder(req.body.items);
  res.json({ lines, total });
};

// POST /api/orders/checkout -> creates a pending order + gateway order
exports.checkout = async (req, res) => {
  const { items, total } = await priceOrder(req.body.items);

  const gateway = await payment.createOrder(total, `rcpt_${Date.now()}`);

  const order = await Order.create({
    user: req.user._id,
    items,
    totalAmount: total,
    payment: { provider: gateway.provider, orderId: gateway.orderId, status: 'pending' },
  });

  res.status(201).json({
    orderId: order._id,
    gateway, // { provider, orderId, amount (paise), currency, keyId? }
    user: { name: req.user.name, email: req.user.email },
  });
};

// POST /api/orders/mock-pay -> simulates the Razorpay checkout popup (mock provider only)
exports.mockPay = async (req, res) => {
  if (payment.provider() !== 'mock') throw httpError(400, 'Mock payments are disabled');

  const { gatewayOrderId, outcome } = req.body;
  const order = await Order.findOne({ 'payment.orderId': gatewayOrderId, user: req.user._id });
  if (!order) throw httpError(404, 'Order not found');

  if (outcome === 'failure') {
    return res.status(402).json({ message: 'Payment failed (simulated)', code: 'PAYMENT_FAILED' });
  }
  res.json(payment.mockCapture(gatewayOrderId)); // { paymentId, signature }
};

// POST /api/orders/verify -> checks the signature, then marks paid + deducts stock atomically
exports.verify = async (req, res) => {
  const { gatewayOrderId, paymentId, signature } = req.body;

  if (!payment.verifySignature({ orderId: gatewayOrderId, paymentId, signature })) {
    await Order.updateOne(
      { 'payment.orderId': gatewayOrderId, user: req.user._id, 'payment.status': 'pending' },
      { $set: { 'payment.status': 'failed' } }
    );
    throw httpError(400, 'Payment verification failed');
  }

  const session = await mongoose.startSession();
  let order;
  try {
    await session.withTransaction(async () => {
      order = await Order.findOne({ 'payment.orderId': gatewayOrderId, user: req.user._id }).session(session);
      if (!order) throw httpError(404, 'Order not found');
      if (order.payment.status === 'paid') return; // already verified, idempotent

      await deductStock(order.items, session);

      order.payment.paymentId = paymentId;
      order.payment.signature = signature;
      order.payment.status = 'paid';
      order.status = 'received';
      order.statusHistory.push({ status: 'received' });
      await order.save({ session });
    });
  } finally {
    await session.endSession();
  }

  await order.populate(POPULATE);
  emitToAdmins('order:new', order);
  checkLowStock(); // fire and forget: email admin if any ingredient is now low

  res.json({ message: 'Payment successful, order placed', order });
};

// GET /api/orders/my
exports.myOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id, 'payment.status': 'paid' })
    .sort({ createdAt: -1 })
    .populate(POPULATE[0]);
  res.json({ orders });
};

exports.POPULATE = POPULATE;
