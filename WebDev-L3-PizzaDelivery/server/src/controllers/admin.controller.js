const Inventory = require('../models/Inventory');
const Order = require('../models/Order');
const { ORDER_STATUSES } = require('../models/Order');
const { POPULATE } = require('./order.controller');
const { emitToUser, emitToAdmins } = require('../services/socket.service');
const { httpError } = require('../services/order.service');

// GET /api/admin/inventory
exports.listInventory = async (req, res) => {
  const items = await Inventory.find().sort({ category: 1, name: 1 });
  res.json({ items });
};

// PATCH /api/admin/inventory/:id  body: { quantity?, threshold?, price?, isActive? }
exports.updateInventory = async (req, res) => {
  const item = await Inventory.findById(req.params.id);
  if (!item) throw httpError(404, 'Item not found');

  for (const key of ['quantity', 'threshold', 'price', 'isActive']) {
    if (req.body[key] !== undefined) item[key] = req.body[key];
  }
  // restocked above the threshold -> allow a new alert next time it runs low
  if (item.quantity > item.threshold) item.lastAlertAt = null;

  await item.save();
  emitToAdmins('inventory:updated', item);
  res.json({ item });
};

// GET /api/admin/orders?status=received|kitchen|delivery
exports.listOrders = async (req, res) => {
  const filter = { 'payment.status': 'paid' };
  if (ORDER_STATUSES.includes(req.query.status)) filter.status = req.query.status;

  const orders = await Order.find(filter).sort({ createdAt: -1 }).populate(POPULATE);
  res.json({ orders });
};

// PATCH /api/admin/orders/:id/status  body: { status }
exports.updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  const order = await Order.findOne({ _id: req.params.id, 'payment.status': 'paid' });
  if (!order) throw httpError(404, 'Order not found');

  const current = ORDER_STATUSES.indexOf(order.status);
  const next = ORDER_STATUSES.indexOf(status);
  if (next !== current + 1) {
    throw httpError(422, `Order can only move from "${order.status}" to "${ORDER_STATUSES[current + 1] || 'nothing (already delivered)'}"`);
  }

  order.status = status;
  order.statusHistory.push({ status });
  await order.save();
  await order.populate(POPULATE);

  const payload = { orderId: order._id, status: order.status, statusHistory: order.statusHistory };
  emitToUser(order.user._id, 'order:status', payload);
  emitToAdmins('order:updated', order);

  res.json({ order });
};
