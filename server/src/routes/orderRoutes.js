import express from 'express';
import { getOrders, createOrder, bulkImportOrders } from '../controllers/orderController.js';

const router = express.Router();

router.get('/', getOrders);
router.post('/', createOrder);
router.post('/bulk', bulkImportOrders);

export default router;
