// ============================================================
// Customer Model
// Represents a shopper in our CRM (e.g., a BrewCraft customer)
// ============================================================
import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  // Basic contact info
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, default: '' },

  // Aggregated purchase metrics — these are recalculated when orders change
  // WHY we store these: Segment queries like "totalSpend > 5000" need fast lookups.
  // Calculating on-the-fly from orders would be slow at scale.
  totalSpend: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  lastOrderDate: { type: Date, default: null },
  firstOrderDate: { type: Date, default: null },
  avgOrderValue: { type: Number, default: 0 },

  // Tags for flexible categorisation (AI can suggest these)
  tags: [{ type: String }],
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt fields
});

// Indexes for segment queries (email index auto-created by unique: true)
// Index on totalSpend and totalOrders for segment queries
customerSchema.index({ totalSpend: 1 });
customerSchema.index({ totalOrders: 1 });
customerSchema.index({ lastOrderDate: 1 });

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;
