/* Seeds the admin account, inventory and ready-made pizzas.
   Run with: npm run seed
   Safe to re-run: existing records are kept, missing ones are added. */
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const User = require('../models/User');
const Inventory = require('../models/Inventory');
const Pizza = require('../models/Pizza');

// Prices in INR (Razorpay currency)
const INVENTORY = [
  { category: 'base', name: 'Thin Crust', price: 120 },
  { category: 'base', name: 'Thick Crust', price: 140 },
  { category: 'base', name: 'Cheese Burst', price: 180 },
  { category: 'base', name: 'Whole Wheat', price: 130 },
  { category: 'base', name: 'Gluten Free', price: 160 },

  { category: 'sauce', name: 'Classic Tomato', price: 30 },
  { category: 'sauce', name: 'Spicy Arrabbiata', price: 35 },
  { category: 'sauce', name: 'Pesto', price: 45 },
  { category: 'sauce', name: 'BBQ', price: 40 },
  { category: 'sauce', name: 'White Garlic', price: 40 },

  { category: 'cheese', name: 'Mozzarella', price: 60 },
  { category: 'cheese', name: 'Cheddar', price: 60 },
  { category: 'cheese', name: 'Parmesan', price: 70 },
  { category: 'cheese', name: 'Vegan Cheese', price: 80 },

  { category: 'veggie', name: 'Onion', price: 20 },
  { category: 'veggie', name: 'Capsicum', price: 20 },
  { category: 'veggie', name: 'Mushroom', price: 30 },
  { category: 'veggie', name: 'Olives', price: 30 },
  { category: 'veggie', name: 'Sweet Corn', price: 25 },
  { category: 'veggie', name: 'Jalapeno', price: 25 },
  { category: 'veggie', name: 'Tomato', price: 20 },
];

const PIZZAS = [
  { name: 'Margherita', description: 'Classic tomato sauce with mozzarella.', basePrice: 210, ingredients: ['Thin Crust', 'Classic Tomato', 'Mozzarella'] },
  { name: 'Farmhouse', description: 'Loaded with onion, capsicum, mushroom and tomato.', basePrice: 330, ingredients: ['Thick Crust', 'Classic Tomato', 'Mozzarella', 'Onion', 'Capsicum', 'Mushroom', 'Tomato'] },
  { name: 'Mexican Wave', description: 'Spicy sauce, jalapeno, corn and cheddar.', basePrice: 320, ingredients: ['Thin Crust', 'Spicy Arrabbiata', 'Cheddar', 'Jalapeno', 'Sweet Corn', 'Onion'] },
  { name: 'Pesto Garden', description: 'Basil pesto, parmesan, olives and tomato.', basePrice: 300, ingredients: ['Whole Wheat', 'Pesto', 'Parmesan', 'Olives', 'Tomato'] },
  { name: 'BBQ Supreme', description: 'Smoky BBQ sauce on a cheese burst base.', basePrice: 380, ingredients: ['Cheese Burst', 'BBQ', 'Mozzarella', 'Onion', 'Capsicum', 'Sweet Corn'] },
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected. Seeding...');

    // 1) Admin
    const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');

    const admin = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
    if (admin) {
      // keep the admin in sync with .env (password is re-hashed by the pre-save hook)
      admin.role = 'admin';
      admin.isVerified = true;
      admin.password = ADMIN_PASSWORD;
      await admin.save();
      console.log(`- Admin already exists, password synced from .env (${ADMIN_EMAIL})`);
    } else {
      await User.create({ name: 'Admin', email: ADMIN_EMAIL, password: ADMIN_PASSWORD, role: 'admin', isVerified: true });
      console.log(`- Admin created (${ADMIN_EMAIL})`);
    }

    // 2) Inventory
    let added = 0;
    for (const item of INVENTORY) {
      const res = await Inventory.updateOne(
        { name: item.name, category: item.category },
        { $setOnInsert: { ...item, quantity: 100 } },
        { upsert: true }
      );
      if (res.upsertedCount) added++;
    }
    console.log(`- Inventory: ${added} added, ${INVENTORY.length - added} already present`);

    // 3) Pizzas
    const byName = Object.fromEntries((await Inventory.find()).map((i) => [i.name, i._id]));
    let pizzasAdded = 0;
    for (const p of PIZZAS) {
      const res = await Pizza.updateOne(
        { name: p.name },
        {
          $setOnInsert: {
            name: p.name,
            description: p.description,
            basePrice: p.basePrice,
            defaultIngredients: p.ingredients.map((n) => byName[n]),
          },
        },
        { upsert: true }
      );
      if (res.upsertedCount) pizzasAdded++;
    }
    console.log(`- Pizzas: ${pizzasAdded} added, ${PIZZAS.length - pizzasAdded} already present`);

    console.log('Seeding done ✅');
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
