// ============================================================
// Campaign Model
// Represents a marketing campaign sent to a segment of customers
// 
// LIFECYCLE: draft → sending → sent → completed
// - "draft": Campaign created but not yet sent
// - "sending": Messages are being dispatched to channel service
// - "sent": All messages dispatched, waiting for delivery callbacks
// - "completed": All callbacks received (or timed out)
// ============================================================
import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema({
  // Campaign name, e.g., "Summer Sale Blast"
  name: { type: String, required: true },

  // Which segment of customers to target
  segmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Segment',
    required: true,
  },

  // Messaging channel: whatsapp, sms, or email
  channel: {
    type: String,
    enum: ['whatsapp', 'sms', 'email'],
    required: true,
  },

  // Message template with {{variable}} placeholders
  // e.g., "Hey {{name}}, check out our summer sale! ☕"
  messageTemplate: { type: String, required: true },

  // Current status of the campaign
  status: {
    type: String,
    enum: ['draft', 'sending', 'sent', 'completed'],
    default: 'draft',
  },

  // Aggregated delivery statistics — updated as callbacks arrive from channel service
  // WHY we store aggregates: Counting from CommunicationLogs every time would be slow.
  // These counters are incremented atomically as each callback arrives.
  stats: {
    total: { type: Number, default: 0 },     // Total messages sent
    sent: { type: Number, default: 0 },       // Successfully dispatched
    delivered: { type: Number, default: 0 },   // Confirmed delivered to device
    failed: { type: Number, default: 0 },      // Delivery failed
    opened: { type: Number, default: 0 },      // Message opened/viewed
    read: { type: Number, default: 0 },        // Message read
    clicked: { type: Number, default: 0 },     // Link in message clicked
  },

  // When the campaign was actually sent
  sentAt: { type: Date, default: null },
}, {
  timestamps: true,
});

const Campaign = mongoose.model('Campaign', campaignSchema);
export default Campaign;
