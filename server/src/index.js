// ============================================================
// CRM Server Entry Point
// Sets up Express, connects to MongoDB, and mounts all routes
// ============================================================
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

// Route imports
import customerRoutes from './routes/customerRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import segmentRoutes from './routes/segmentRoutes.js';
import campaignRoutes from './routes/campaignRoutes.js';
import receiptRoutes from './routes/receiptRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ---- Middleware ----

// Enable CORS for frontend requests (React runs on different port in dev)
app.use(cors());

// Parse JSON request bodies (needed for POST/PUT requests)
app.use(express.json({ limit: '10mb' })); // 10mb limit for bulk imports

// Simple request logging (helps with debugging)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ---- API Routes ----
// Each route group handles a different resource/feature
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/segments', segmentRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint (useful for deployment monitoring)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'shopreach-crm', timestamp: new Date() });
});

// ---- Start Server ----
// Connect to MongoDB first, then start listening
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 ShopReach CRM Server running on port ${PORT}`);
    console.log(`📍 API available at http://localhost:${PORT}/api`);
  });
});
