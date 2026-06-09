import express from 'express';
import { receiveReceipt, receiveReceiptBatch } from '../controllers/receiptController.js';

const router = express.Router();

// Single receipt callback
router.post('/', receiveReceipt);
// Batch receipt callback (more efficient for bulk updates)
router.post('/batch', receiveReceiptBatch);

export default router;
