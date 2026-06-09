// ============================================================
// Receipt Controller
// Handles delivery callbacks FROM the Channel Service
//
// This is the webhook endpoint that the Channel Service calls
// to report what "happened" to each message (delivered, failed, etc.)
//
// FLOW:
// 1. Channel Service sends POST to /api/receipts with status update
// 2. We find the CommunicationLog by vendorMessageId
// 3. Update the log's status and statusHistory
// 4. Increment the corresponding counter on the Campaign's stats
//
// WHY THIS MATTERS FOR THE INTERVIEW:
// This callback-driven pattern is how real messaging works.
// WhatsApp/SMS providers don't tell you instantly if a message was read —
// they call your webhook hours or days later with status updates.
// ============================================================
import CommunicationLog from '../models/CommunicationLog.js';
import Campaign from '../models/Campaign.js';

/**
 * POST /api/receipts
 * Receives a delivery status callback from the channel service
 * 
 * Expected body: {
 *   vendorMessageId: "msg_123...",
 *   status: "delivered" | "failed" | "opened" | "read" | "clicked",
 *   timestamp: "2024-01-01T..."
 * }
 */
export const receiveReceipt = async (req, res) => {
  try {
    const { vendorMessageId, status, timestamp } = req.body;

    // Find the communication log entry by vendor message ID
    const log = await CommunicationLog.findOne({ vendorMessageId });
    if (!log) {
      // This could happen if the channel service calls back with an unknown ID
      // In production, we'd log this and move on
      return res.status(404).json({ error: 'Message not found' });
    }

    // Update the log's current status and append to history
    log.status = status;
    log.statusHistory.push({
      status,
      timestamp: timestamp || new Date(),
    });
    await log.save();

    // Increment the corresponding stat counter on the campaign
    // Using MongoDB's $inc operator for atomic increment (safe for concurrent updates)
    const updateField = `stats.${status}`;
    await Campaign.findByIdAndUpdate(log.campaignId, {
      $inc: { [updateField]: 1 },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Receipt processing error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/receipts/batch
 * Receives multiple delivery callbacks at once (more efficient)
 * 
 * Expected body: {
 *   receipts: [{ vendorMessageId, status, timestamp }, ...]
 * }
 */
export const receiveReceiptBatch = async (req, res) => {
  try {
    const { receipts } = req.body;
    if (!receipts || !Array.isArray(receipts)) {
      return res.status(400).json({ error: 'Expected array of receipts' });
    }

    let processed = 0;
    let failed = 0;

    for (const receipt of receipts) {
      try {
        const log = await CommunicationLog.findOne({ vendorMessageId: receipt.vendorMessageId });
        if (!log) {
          failed++;
          continue;
        }

        log.status = receipt.status;
        log.statusHistory.push({
          status: receipt.status,
          timestamp: receipt.timestamp || new Date(),
        });
        await log.save();

        const updateField = `stats.${receipt.status}`;
        await Campaign.findByIdAndUpdate(log.campaignId, {
          $inc: { [updateField]: 1 },
        });

        processed++;
      } catch (err) {
        failed++;
      }
    }

    res.json({ processed, failed, total: receipts.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
