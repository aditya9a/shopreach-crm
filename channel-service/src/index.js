// ============================================================
// Channel Service — Stubbed Message Delivery Simulator
//
// This is a SEPARATE service from the CRM (runs on its own port).
// It simulates what a real messaging provider (WhatsApp, Twilio, etc.)
// would do:
//
// 1. Receive a batch of messages to "send"
// 2. Acknowledge receipt immediately
// 3. Asynchronously simulate the delivery lifecycle:
//    sent → delivered (or failed) → opened → read → clicked
// 4. Call back the CRM's receipt webhook with each status update
//
// WHY SEPARATE SERVICE:
// The assignment specifically asks for this to be a separate service
// with a callback-driven loop. This mirrors real-world architecture
// where messaging providers are external services that POST webhooks
// back to your system asynchronously.
//
// REALISTIC SIMULATION:
// - ~90% of messages are "delivered", ~10% "fail"
// - Of delivered: ~60% are "opened"
// - Of opened: ~50% are "read"
// - Of read: ~30% are "clicked"
// - Each status transition has a random delay (1-8 seconds)
// ============================================================
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

/**
 * Sends a callback to the CRM's receipt webhook
 * This is like a real provider sending a delivery receipt
 */
async function sendCallback(callbackUrl, vendorMessageId, status) {
  try {
    await axios.post(callbackUrl, {
      vendorMessageId,
      status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // In production, we'd retry failed callbacks. For demo, just log it.
    console.error(`⚠️  Callback failed for ${vendorMessageId}: ${error.message}`);
  }
}

/**
 * Simulates the delivery lifecycle for a single message
 * Each status transition happens after a random delay
 * 
 * LIFECYCLE:
 *   delivered (90%) ──→ opened (60%) ──→ read (50%) ──→ clicked (30%)
 *        │
 *   failed (10%)
 */
async function simulateDeliveryLifecycle(message, callbackUrl) {
  const { vendorMessageId } = message;

  // Random delay helper (1-8 seconds between events)
  const delay = (min, max) =>
    new Promise(resolve => setTimeout(resolve, (Math.random() * (max - min) + min) * 1000));

  // Step 1: Delivered or Failed (after 1-3 seconds)
  await delay(1, 3);
  const isDelivered = Math.random() < 0.9; // 90% delivery rate

  if (!isDelivered) {
    await sendCallback(callbackUrl, vendorMessageId, 'failed');
    return; // Message failed — no further lifecycle events
  }

  await sendCallback(callbackUrl, vendorMessageId, 'delivered');

  // Step 2: Opened (after 2-5 seconds, 60% chance)
  if (Math.random() < 0.6) {
    await delay(2, 5);
    await sendCallback(callbackUrl, vendorMessageId, 'opened');

    // Step 3: Read (after 1-3 seconds, 50% chance of opened)
    if (Math.random() < 0.5) {
      await delay(1, 3);
      await sendCallback(callbackUrl, vendorMessageId, 'read');

      // Step 4: Clicked (after 1-4 seconds, 30% chance of read)
      if (Math.random() < 0.3) {
        await delay(1, 4);
        await sendCallback(callbackUrl, vendorMessageId, 'clicked');
      }
    }
  }
}

/**
 * POST /api/send
 * Main endpoint — receives a batch of messages to "send"
 * 
 * Request body: {
 *   messages: [{ vendorMessageId, recipient, channel, content }],
 *   callbackUrl: "http://crm-server/api/receipts"
 * }
 * 
 * Response: Immediate acknowledgment
 * Side effect: Async delivery simulation with callbacks
 */
app.post('/api/send', (req, res) => {
  const { messages, callbackUrl } = req.body;

  if (!messages || !Array.isArray(messages) || !callbackUrl) {
    return res.status(400).json({ error: 'messages array and callbackUrl are required' });
  }

  console.log(`📨 Received ${messages.length} messages to send via channel service`);
  console.log(`📍 Will callback to: ${callbackUrl}`);

  // Acknowledge receipt immediately (like a real messaging API would)
  res.json({
    accepted: messages.length,
    message: `${messages.length} messages queued for delivery simulation`,
  });

  // Simulate delivery lifecycle asynchronously (AFTER responding)
  // This is the key part — callbacks happen in the background
  messages.forEach(message => {
    simulateDeliveryLifecycle(message, callbackUrl);
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'shopreach-channel-service', timestamp: new Date() });
});

// Start the service
app.listen(PORT, () => {
  console.log(`📡 Channel Service running on port ${PORT}`);
  console.log(`   This service simulates message delivery for WhatsApp, SMS, and Email`);
});
