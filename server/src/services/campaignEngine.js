// ============================================================
// Campaign Engine
// Orchestrates the entire campaign send flow:
//   1. Resolve segment → find matching customers
//   2. Personalise message for each customer
//   3. Create CommunicationLog entries
//   4. Send batch to channel service
//   5. Update campaign status
//
// This is the CORE business logic of the CRM.
// ============================================================
import Campaign from '../models/Campaign.js';
import CommunicationLog from '../models/CommunicationLog.js';
import Segment from '../models/Segment.js';
import { evaluateSegment } from './segmentEngine.js';
import { sendToChannelService } from './channelClient.js';

/**
 * Generates a unique vendor message ID
 * In production, the channel provider (WhatsApp, Twilio) would return their own ID.
 * Here we generate one and pass it to our stubbed channel service.
 */
function generateMessageId() {
  // Use crypto.randomUUID() for a unique ID
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Personalises a message template by replacing {{variable}} placeholders
 * with actual customer data.
 * 
 * Example:
 *   Template: "Hey {{name}}, you've spent ₹{{totalSpend}} with us!"
 *   Customer: { name: "Arjun", totalSpend: 4500 }
 *   Output:   "Hey Arjun, you've spent ₹4500 with us!"
 */
function personaliseMessage(template, customer) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, field) => {
    return customer[field] !== undefined ? customer[field] : match;
  });
}

/**
 * Executes a campaign — the main orchestration function
 * 
 * FLOW:
 * 1. Load the campaign and its segment
 * 2. Evaluate segment rules to find matching customers
 * 3. For each customer, create a personalised message and a CommunicationLog
 * 4. Send all messages to the channel service in a batch
 * 5. Update campaign status and stats
 * 
 * @param {String} campaignId - ID of the campaign to send
 * @param {String} crmBaseUrl - Base URL of this CRM server (for callback URL)
 */
export async function executeCampaign(campaignId, crmBaseUrl) {
  // Step 1: Load campaign and validate
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) throw new Error('Campaign not found');
  if (campaign.status !== 'draft') throw new Error('Campaign already sent');

  // Step 2: Load segment and find matching customers
  const segment = await Segment.findById(campaign.segmentId);
  if (!segment) throw new Error('Segment not found');

  const customers = await evaluateSegment(segment.rules);
  if (customers.length === 0) throw new Error('No customers match this segment');

  // Update campaign status to "sending"
  campaign.status = 'sending';
  campaign.stats.total = customers.length;
  await campaign.save();

  // Step 3: Create communication logs and prepare messages for channel service
  const messages = [];

  for (const customer of customers) {
    const vendorMessageId = generateMessageId();
    const personalised = personaliseMessage(campaign.messageTemplate, customer);

    // Create a CommunicationLog entry for tracking this individual message
    await CommunicationLog.create({
      campaignId: campaign._id,
      customerId: customer._id,
      channel: campaign.channel,
      messageContent: personalised,
      status: 'queued',
      statusHistory: [{ status: 'queued', timestamp: new Date() }],
      vendorMessageId,
    });

    // Prepare the message payload for the channel service
    messages.push({
      vendorMessageId,
      recipient: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
      channel: campaign.channel,
      content: personalised,
    });
  }

  // Step 4: Send all messages to channel service
  // The callback URL tells the channel service where to POST delivery updates
  const callbackUrl = `${crmBaseUrl}/api/receipts`;

  try {
    await sendToChannelService(messages, callbackUrl);

    // Step 5: Update campaign status — all messages dispatched
    campaign.status = 'sent';
    campaign.stats.sent = customers.length;
    campaign.sentAt = new Date();
    await campaign.save();

    // Update all communication logs to "sent" status
    await CommunicationLog.updateMany(
      { campaignId: campaign._id, status: 'queued' },
      {
        $set: { status: 'sent' },
        $push: { statusHistory: { status: 'sent', timestamp: new Date() } },
      }
    );

    return {
      success: true,
      messagesSent: customers.length,
      campaignId: campaign._id,
    };
  } catch (error) {
    // If channel service call fails, mark campaign with error info
    campaign.status = 'draft'; // Revert to draft so user can retry
    await campaign.save();
    throw error;
  }
}
