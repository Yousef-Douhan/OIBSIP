const mongoose = require('mongoose');

const ORDER_STATUSES = ['received', 'kitchen', 'delivery'];
const ref = { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' };

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: {
      base: { ...ref, required: true },
      sauce: { ...ref, required: true },
      cheese: { ...ref, required: true },
      veggies: [ref],
    },
    totalAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ORDER_STATUSES, default: 'received' },
    payment: {
      provider: { type: String, default: 'mock' }, // 'razorpay' or 'mock'
      orderId: String,
      paymentId: String,
      signature: String,
      status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    },
    statusHistory: [
      {
        status: { type: String, enum: ORDER_STATUSES },
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
module.exports.ORDER_STATUSES = ORDER_STATUSES;
