const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['base', 'sauce', 'cheese', 'veggie'],
      required: true,
    },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 0, default: 100 },
    threshold: {
      type: Number,
      min: 0,
      default: () => Number(process.env.STOCK_THRESHOLD) || 20,
    },
    image: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    lastAlertAt: { type: Date }, // prevents sending the same low-stock email repeatedly
  },
  { timestamps: true }
);

inventorySchema.index({ name: 1, category: 1 }, { unique: true });

inventorySchema.virtual('isLow').get(function () {
  return this.quantity <= this.threshold;
});

inventorySchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Inventory', inventorySchema);
