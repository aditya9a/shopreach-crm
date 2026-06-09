import express from 'express';
import { getCustomers, getCustomerById, createCustomer, bulkImportCustomers, getCustomerStats } from '../controllers/customerController.js';

const router = express.Router();

// GET /api/customers/stats — must be before /:id to avoid "stats" being treated as an ID
router.get('/stats', getCustomerStats);
router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.post('/', createCustomer);
router.post('/bulk', bulkImportCustomers);

export default router;
