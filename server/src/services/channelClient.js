// ============================================================
// Channel Client
// HTTP client that sends messages to the Channel Service
//
// This is the CRM's outbound connection to the channel service.
// In production, this would be like calling the WhatsApp Business API
// or Twilio's SMS API. Here it calls our stubbed channel service.
//
// COLD START HANDLING:
// Render free tier spins down services after 15 min of inactivity.
// First request can take 30-60 seconds. We use a longer timeout
// and retry logic to handle this gracefully.
// ============================================================
import axios from 'axios';

// The channel service URL — set in .env (local: http://localhost:3001)
const CHANNEL_SERVICE_URL = process.env.CHANNEL_SERVICE_URL || 'http://localhost:3001';

/**
 * Sends a batch of messages to the channel service
 * Includes retry logic for Render cold starts (502/timeout errors)
 * 
 * @param {Array} messages - Array of message objects to send
 *   Each message: { vendorMessageId, recipient: { name, email, phone }, channel, content }
 * @param {String} callbackUrl - URL where channel service should send delivery updates
 * @returns {Object} Response from channel service with send confirmations
 */
export async function sendToChannelService(messages, callbackUrl) {
  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await axios.post(`${CHANNEL_SERVICE_URL}/api/send`, {
        messages,
        callbackUrl,
      }, {
        timeout: 90000, // 90 second timeout to handle Render cold starts
      });

      return response.data;
    } catch (error) {
      const is502 = error.response?.status === 502;
      const isTimeout = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';
      const isRetryable = is502 || isTimeout;

      console.error(`Attempt ${attempt}/${MAX_RETRIES} failed: ${error.message}`);

      if (isRetryable && attempt < MAX_RETRIES) {
        // Wait before retrying (3s, then 6s)
        const waitTime = attempt * 3000;
        console.log(`Retrying in ${waitTime / 1000}s (channel service may be waking up)...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      throw new Error(`Channel service error: ${error.message}`);
    }
  }
}
