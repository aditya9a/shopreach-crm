// ============================================================
// Customer Controller
// Handles all customer-related API requests
// ============================================================
import Customer from '../models/Customer.js';
import Order from '../models/Order.js';

/**
 * GET /api/customers
 * Returns all customers with optional search and pagination
 * Query params: ?search=arjun&page=1&limit=20
 */
export const getCustomers = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;

    // Build search filter — searches across name, email, and phone
    let filter = {};
    if (search) {
      filter = {
        $or: [
          { name: { $regex: search, $options: 'i' } },   // case-insensitive
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ],
      };
    }

    // Paginated query with total count for frontend pagination
    const [customers, total] = await Promise.all([
      Customer.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean(),
      Customer.countDocuments(filter),
    ]);

    res.json({
      customers,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/customers/:id
 * Returns a single customer with their order history
 */
export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).lean();
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    // Also fetch their orders for the detail view
    const orders = await Order.find({ customerId: customer._id })
      .sort({ orderDate: -1 })
      .limit(10)
      .lean();

    res.json({ customer, orders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/customers
 * Creates a new customer
 */
export const createCustomer = async (req, res) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json(customer);
  } catch (error) {
    // Handle duplicate email error
    if (error.code === 11000) {
      return res.status(400).json({ error: 'A customer with this email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/customers/bulk
 * Imports multiple customers at once (for data ingestion)
 * Expects: { customers: [{ name, email, phone, ... }] }
 */
export const bulkImportCustomers = async (req, res) => {
  try {
    const { customers } = req.body;
    if (!customers || !Array.isArray(customers)) {
      return res.status(400).json({ error: 'Expected an array of customers' });
    }

    // Use insertMany with ordered: false to continue on duplicate errors
    const result = await Customer.insertMany(customers, { ordered: false });
    res.status(201).json({
      imported: result.length,
      message: `Successfully imported ${result.length} customers`,
    });
  } catch (error) {
    // insertMany with ordered:false throws but still inserts non-duplicates
    if (error.code === 11000) {
      const inserted = error.result?.insertedCount || 0;
      return res.status(207).json({
        imported: inserted,
        message: `Imported ${inserted} customers. Some duplicates were skipped.`,
      });
    }
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/customers/stats
 * Returns aggregate statistics about all customers
 * Used by the Dashboard page
 */
export const getCustomerStats = async (req, res) => {
  try {
    const [totalCustomers, stats] = await Promise.all([
      Customer.countDocuments(),
      Customer.aggregate([
        {
          $group: {
            _id: null,
            avgSpend: { $avg: '$totalSpend' },
            avgOrders: { $avg: '$totalOrders' },
            totalRevenue: { $sum: '$totalSpend' },
          },
        },
      ]),
    ]);

    res.json({
      totalCustomers,
      avgSpend: stats[0]?.avgSpend || 0,
      avgOrders: stats[0]?.avgOrders || 0,
      totalRevenue: stats[0]?.totalRevenue || 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
