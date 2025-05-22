// Load .env configuration early
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';

// MongoDB Connector
import { initializeDatabase } from './config/db.js';

// Route Imports
import authRoutes from './routes/auth.routes.js';
import walletRoutes from './routes/wallet.routes.js';
import profileRoutes from './routes/profile.routes.js';
import adminRoutes from './routes/admin.routes.js';

// Scheduled Job
import scheduleDailyFraudScan from './cron/dailyFraudScan.js';


// Create Express App
const app = express();
app.use(cors());
app.use(express.json());

// Route Binder
const bindRoutes = () => {
  app.use('/api/auth', authRoutes);
  app.use('/api/wallet', walletRoutes);
  app.use('/api/user', profileRoutes);
  app.use('/api/admin', adminRoutes);
};

// Start the App
(async () => {
  try {
    await initializeDatabase(); // Connect to MongoDB first

    bindRoutes();      // Then bind all routes
    scheduleDailyFraudScan(); // 👈 call it after connecting DB and binding routesStart the daily cron job

    const PORT = process.env.PORT || 8000;
    app.listen(PORT, () => {
      console.log(`🚀 Server is running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error(' App failed to start:', err.message);
  }
})();
