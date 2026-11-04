const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const catalogRoutes = require('./routes/catalog.routes');
const orderRoutes = require('./routes/order.routes');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', paymentProvider: process.env.PAYMENT_PROVIDER || 'mock', time: new Date() });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api', catalogRoutes); // /api/pizzas, /api/inventory/options

// 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler (Express 5 forwards async errors here automatically)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (!err.status || err.status >= 500) console.error(err);
  if (err.code === 11000) {
    return res.status(409).json({ message: 'Duplicate value', fields: err.keyValue });
  }
  if (err.name === 'ValidationError') {
    return res.status(422).json({ message: err.message });
  }
  if (err.name === 'CastError') {
    return res.status(422).json({ message: `Invalid ${err.path}` });
  }
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

module.exports = app;
