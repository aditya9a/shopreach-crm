// ============================================================
// CommunicationLog Model
// Tracks every individual message sent as part of a campaign
//
// KEY CONCEPT: Each customer in a campaign gets ONE CommunicationLog entry.
// This is the granular, per-recipient tracking — while Campaign.stats
// has the aggregated view.
//
// STATUS LIFECYCLE: queued → sent → delivered/failed → opened → read → clicked
// Each transition is recorded in statusHistory with a timestamp.
// ============================================================
import mongoose from 'mongoose';

const communicationLogSchema = new mongoose.Schema({
  // Which campaign this message belongs to
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true,
  },

  // Which customer this message was sent to
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },

  // Channel used (denormalised from campaign for faster queries)
  channel: {
    type: String,
    enum: ['whatsapp', 'sms', 'email'],
    required: true,
  },

  // The actual personalised message content sent to this specific customer
  messageContent: { type: String, required: true },

  // Current status of this specific message
  status: {
    type: String,
    enum: ['queued', 'sent', 'delivered', 'failed', 'opened', 'read', 'clicked'],
    default: 'queued',
  },

  // Full history of status transitions — useful for debugging and analytics
  // Example: [{ status: "sent", timestamp: "2024-01-01T..." }, { status: "delivered", ... }]
  statusHistory: [{
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  }],

  // Unique ID returned by the channel service — used to match callbacks
  vendorMessageId: { type: String, default: null },
}, {
  timestamps: true,
});

// Compound index for quickly finding all logs for a campaign
communicationLogSchema.index({ campaignId: 1, status: 1 });
// Index for matching incoming callbacks by vendorMessageId
communicationLogSchema.index({ vendorMessageId: 1 });

const CommunicationLog = mongoose.model('CommunicationLog', communicationLogSchema);
export default CommunicationLog;
