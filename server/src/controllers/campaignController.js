// ============================================================
// Campaign Controller
// Handles campaign CRUD and triggers the campaign execution engine
// ============================================================
import Campaign from '../models/Campaign.js';
import CommunicationLog from '../models/CommunicationLog.js';
import { executeCampaign } from '../services/campaignEngine.js';

/**
 * GET /api/campaigns
 * Returns all campaigns sorted by newest first
 */
export const getCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find()
      .sort({ createdAt: -1 })
      .populate('segmentId', 'name customerCount') // Include segment name
      .lean();
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/campaigns/:id
 * Returns a single campaign with its communication logs
 * This powers the Campaign Detail page with per-message tracking
 */
export const getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('segmentId', 'name description customerCount')
      .lean();
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    // Get communication logs for this campaign (latest status of each message)
    const logs = await CommunicationLog.find({ campaignId: campaign._id })
      .populate('customerId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ campaign, logs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/campaigns
 * Creates a new campaign in "draft" status
 */
export const createCampaign = async (req, res) => {
  try {
    const { name, segmentId, channel, messageTemplate } = req.body;

    const campaign = await Campaign.create({
      name,
      segmentId,
      channel,
      messageTemplate,
      status: 'draft',
    });

    res.status(201).json(campaign);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/campaigns/:id/send
 * Triggers the campaign execution — sends messages to all segment customers
 * 
 * This is the most important endpoint — it kicks off the entire
 * CRM → Channel Service → Callback flow
 */
export const sendCampaign = async (req, res) => {
  try {
    const campaignId = req.params.id;

    // Determine the CRM's base URL for callbacks
    // In production, this would be the deployed URL
    const crmBaseUrl = process.env.CRM_SERVER_URL || `${req.protocol}://${req.get('host')}`;

    const result = await executeCampaign(campaignId, crmBaseUrl);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/campaigns/:id/stats
 * Returns just the stats for a campaign (lightweight endpoint for polling)
 * The frontend polls this every few seconds while a campaign is active
 */
export const getCampaignStats = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .select('stats status name channel')
      .lean();
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
