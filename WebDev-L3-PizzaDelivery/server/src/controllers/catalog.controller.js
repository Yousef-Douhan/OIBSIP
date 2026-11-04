const Pizza = require('../models/Pizza');
const Inventory = require('../models/Inventory');

// GET /api/pizzas
exports.listPizzas = async (req, res) => {
  const pizzas = await Pizza.find()
    .sort({ basePrice: 1 })
    .populate('defaultIngredients', 'name category price quantity isActive');
  res.json({ pizzas });
};

// GET /api/inventory/options -> ingredients grouped for the 4-step pizza builder
exports.builderOptions = async (req, res) => {
  const items = await Inventory.find({ isActive: true })
    .select('name category price quantity image')
    .sort({ category: 1, price: 1 });

  const options = { base: [], sauce: [], cheese: [], veggie: [] };
  for (const i of items) {
    options[i.category].push({
      id: i._id,
      name: i.name,
      price: i.price,
      image: i.image,
      available: i.quantity > 0,
    });
  }
  res.json({ options });
};
