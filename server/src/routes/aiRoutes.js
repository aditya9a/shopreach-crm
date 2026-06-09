import express from 'express';
import { aiCreateSegment, aiGenerateMessage, aiSummarise, aiChat } from '../controllers/aiController.js';

const router = express.Router();

router.post('/segment', aiCreateSegment);
router.post('/message', aiGenerateMessage);
router.post('/summarise', aiSummarise);
router.post('/chat', aiChat);

export default router;
