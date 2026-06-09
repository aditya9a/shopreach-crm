// ============================================================
// Segment Model
// Defines an audience segment — a group of customers matching certain rules
// 
// KEY CONCEPT: Segments store RULES, not customer lists.
// Every time we use a segment, we evaluate the rules against the
// current customer data. This means segments are always up-to-date.
// ============================================================
import mongoose from 'mongoose';

const segmentSchema = new mongoose.Schema({
  // Human-readable name, e.g., "High-Value Regulars"
  name: { type: String, required: true },

  // Description of what this segment represents
  description: { type: String, default: '' },

  // Machine-readable rules that define this segment
  // Example: { conditions: [{field: "totalSpend", operator: ">", value: 5000}], logic: "AND" }
  rules: {
    // Array of conditions — each one is a filter on customer data
    conditions: [{
      field: { type: String, required: true },    // Customer field name, e.g., "totalSpend"
      operator: { type: String, required: true },  // Comparison operator: ">", "<", ">=", "<=", "==", "!="
      value: { type: mongoose.Schema.Types.Mixed, required: true }, // Value to compare against
    }],
    // How to combine conditions: "AND" (all must match) or "OR" (any must match)
    logic: { type: String, enum: ['AND', 'OR'], default: 'AND' },
  },

  // Cached count of matching customers (updated when segment is evaluated)
  customerCount: { type: Number, default: 0 },

  // Whether this segment was suggested/created by the AI copilot
  createdByAI: { type: Boolean, default: false },
}, {
  timestamps: true,
});

const Segment = mongoose.model('Segment', segmentSchema);
export default Segment;
