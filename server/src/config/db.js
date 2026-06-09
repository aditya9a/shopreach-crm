// ============================================================
// Database Connection Configuration
// Connects to MongoDB Atlas using Mongoose
// ============================================================
import mongoose from 'mongoose';

/**
 * Connects to MongoDB using the URI from environment variables.
 * - Uses mongoose.connect() which returns a promise
 * - Logs success/failure for debugging
 * - The app should NOT start the server until this resolves
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1); // Exit process if DB connection fails — nothing works without DB
  }
};

export default connectDB;
