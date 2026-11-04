const mongoose = require('mongoose');
const Inventory = require('../models/Inventory');

const httpError = (status, message) => Object.assign(new Error(message), { status });

/* Validates the selected ingredients and calculates the price on the server.
   items = { base, sauce, cheese, veggies: [] } (inventory ids) */
const priceOrder = async (items = {}) => {
  const { base, sauce, cheese } = items;
  const veggies = [...new Set(items.veggies || [])];

  if (!base || !sauce || !cheese) throw httpError(422, 'Base, sauce and cheese are required');

  const ids = [base, sauce, cheese, ...veggies];
  if (!ids.every((id) => mongoose.isValidObjectId(id))) throw httpError(422, 'Invalid ingredient id');

  const docs = await Inventory.find({ _id: { $in: ids } });
  const byId = new Map(docs.map((d) => [String(d._id), d]));

  const check = (id, category) => {
    const doc = byId.get(String(id));
    if (!doc || doc.category !== category) throw httpError(422, `Invalid ${category} selected`);
    if (!doc.isActive || doc.quantity < 1) throw httpError(409, `${doc.name} is out of stock`);
    return doc;
  };

  const lines = [
    check(base, 'base'),
    check(sauce, 'sauce'),
    check(cheese, 'cheese'),
    ...veggies.map((v) => check(v, 'veggie')),
  ];

  const total = lines.reduce((sum, d) => sum + d.price, 0);

  return {
    items: { base, sauce, cheese, veggies },
    lines: lines.map((d) => ({ id: d._id, name: d.name, category: d.category, price: d.price })),
    total,
  };
};

/* Decreases each ingredient by 1 inside the given transaction session.
   The quantity >= 1 condition makes it impossible to go below zero,
   even when two customers buy the last unit at the same time. */
const deductStock = async (items, session) => {
  const ids = [items.base, items.sauce, items.cheese, ...(items.veggies || [])];
  for (const id of ids) {
    const res = await Inventory.updateOne(
      { _id: id, quantity: { $gte: 1 } },
      { $inc: { quantity: -1 } },
      { session }
    );
    if (res.modifiedCount !== 1) throw httpError(409, 'An ingredient ran out of stock, please choose another one');
  }
};

module.exports = { priceOrder, deductStock, httpError };
