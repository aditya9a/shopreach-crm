// ============================================================
// Channel Client
// HTTP client that sends messages to the Channel Service
//
// This is the CRM's outbound connection to the channel service.
// In production, this would be like calling the WhatsApp Business API
// or Twilio's SMS API. Here it calls our stubbed channel service.
// ============================================================
import axios from 'axios';

// The channel service URL — set in .env (local: http://localhost:3001)
const CHANNEL_SERVICE_URL = process.env.CHANNEL_SERVICE_URL || 'http://localhost:3001';

/**
 * Sends a batch of messages to the channel service
 * 
 * @param {Array} messages - Array of message objects to send
 *   Each message: { vendorMessageId, recipient: { name, email, phone }, channel, content }
 * @param {String} callbackUrl - URL where channel service should send delivery updates
 * @returns {Object} Response from channel service with send confirmations
 * 
 * WHY BATCH SENDING:
 * Instead of calling the channel service once per customer, we send all messages
 * in a single HTTP request. This is more efficient and closer to how real
 * messaging APIs work (they accept batches of up to 1000 messages).
 */
export async function sendToChannelService(messages, callbackUrl) {
  try {
    const response = await axios.post(`${CHANNEL_SERVICE_URL}/api/send`, {
      messages,
      callbackUrl,
    }, {
      timeout: 30000, // 30 second timeout for large batches
    });

    return response.data;
  } catch (error) {
    console.error('❌ Failed to send to channel service:', error.message);
    throw new Error(`Channel service error: ${error.message}`);
  }
}
