const mongoose = require('mongoose');

// Ready-made pizza varieties shown on the user dashboard
const pizzaSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    basePrice: { type: Number, required: true, min: 0 },
    defaultIngredients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Pizza', pizzaSchema);
