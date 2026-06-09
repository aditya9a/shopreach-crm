// ============================================================
// AI Controller
// Handles API requests for the AI Copilot features
// ============================================================
import {
  naturalLanguageToSegment,
  generateMessage,
  summariseCampaignStats,
  copilotChat,
} from '../services/aiService.js';
import Customer from '../models/Customer.js';
import Campaign from '../models/Campaign.js';
import Order from '../models/Order.js';

/**
 * POST /api/ai/segment
 * Converts natural language to segment rules
 * Body: { query: "customers who spent more than 5000" }
 */
export const aiCreateSegment = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query is required' });

    const segmentData = await naturalLanguageToSegment(query);
    res.json(segmentData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/ai/message
 * Generates a marketing message using AI
 * Body: { channel: "whatsapp", segmentDescription: "loyal customers", instructions: "mention summer sale" }
 */
export const aiGenerateMessage = async (req, res) => {
  try {
    const { channel, segmentDescription, instructions } = req.body;
    if (!channel || !segmentDescription) {
      return res.status(400).json({ error: 'Channel and segment description are required' });
    }

    const message = await generateMessage(channel, segmentDescription, instructions);
    res.json({ message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/ai/summarise
 * Generates an AI summary of campaign performance
 * Body: { campaignId: "..." }
 */
export const aiSummarise = async (req, res) => {
  try {
    const { campaignId } = req.body;
    const campaign = await Campaign.findById(campaignId).lean();
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    const summary = await summariseCampaignStats(campaign.name, campaign.channel, campaign.stats);
    res.json({ summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/ai/chat
 * General AI copilot chat endpoint
 * Body: { message: "How do I increase engagement?" }
 */
export const aiChat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    // Gather some context about the current CRM state
    const [customerCount, orderCount, campaignCount] = await Promise.all([
      Customer.countDocuments(),
      Order.countDocuments(),
      Campaign.countDocuments(),
    ]);

    const response = await copilotChat(message, {
      customerCount,
      orderCount,
      campaignCount,
    });

    res.json({ response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
