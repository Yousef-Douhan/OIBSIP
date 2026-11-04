require('dotenv').config({ quiet: true });
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { initSocket } = require('./services/socket.service');
const { startStockAlertJob, checkLowStock } = require('./jobs/stockAlert.cron');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

initSocket(server);

(async () => {
  await connectDB();
  startStockAlertJob();
  checkLowStock(); // run once on start-up
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT} (payments: ${process.env.PAYMENT_PROVIDER || 'mock'})`);
  });
})();
