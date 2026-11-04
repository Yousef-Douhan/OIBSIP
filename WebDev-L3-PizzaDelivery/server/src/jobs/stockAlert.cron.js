const cron = require('node-cron');
const Inventory = require('../models/Inventory');
const { sendLowStockEmail } = require('../services/email.service');

/* Emails the admin about ingredients at or below their threshold.
   Each item is reported once (lastAlertAt is set); the flag is cleared
   when the admin restocks it above the threshold. */
const checkLowStock = async () => {
  const low = await Inventory.find({
    isActive: true,
    lastAlertAt: null,
    $expr: { $lte: ['$quantity', '$threshold'] },
  });
  if (!low.length) return 0;

  await sendLowStockEmail(low);
  await Inventory.updateMany({ _id: { $in: low.map((i) => i._id) } }, { $set: { lastAlertAt: new Date() } });
  console.log(`Low stock alert sent for: ${low.map((i) => i.name).join(', ')}`);
  return low.length;
};

const safeCheck = () => checkLowStock().catch((err) => console.error('Low stock check failed:', err.message));

// every 5 minutes
const startStockAlertJob = () => {
  cron.schedule('*/5 * * * *', safeCheck);
  console.log('Stock alert job scheduled (every 5 minutes)');
};

module.exports = { startStockAlertJob, checkLowStock: safeCheck };
