import express from 'express';
import { getCampaigns, getCampaignById, createCampaign, sendCampaign, getCampaignStats } from '../controllers/campaignController.js';

const router = express.Router();

router.get('/', getCampaigns);
router.post('/', createCampaign);
router.get('/:id', getCampaignById);
router.post('/:id/send', sendCampaign);
router.get('/:id/stats', getCampaignStats);

export default router;
