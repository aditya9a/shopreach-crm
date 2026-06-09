// ============================================================
// Order Controller
// Handles order-related API requests
// After creating orders, it recalculates customer aggregate metrics
// ============================================================
import Order from '../models/Order.js';
import Customer from '../models/Customer.js';

/**
 * Recalculates a customer's aggregate fields after orders change
 * This keeps Customer.totalSpend, totalOrders, etc. in sync
 * 
 * WHY NOT REAL-TIME? At scale, we'd use a message queue or change stream.
 * For this scope, recalculating on each order write is simple and correct.
 */
async function recalculateCustomerMetrics(customerId) {
  const orders = await Order.find({ customerId }).lean();

  const totalSpend = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? totalSpend / totalOrders : 0;
  const orderDates = orders.map(o => new Date(o.orderDate)).sort((a, b) => a - b);

  await Customer.findByIdAndUpdate(customerId, {
    totalSpend,
    totalOrders,
    avgOrderValue,
    firstOrderDate: orderDates[0] || null,
    lastOrderDate: orderDates[orderDates.length - 1] || null,
  });
}

/**
 * GET /api/orders
 * Returns orders with pagination, optionally filtered by customerId
 */
export const getOrders = async (req, res) => {
  try {
    const { customerId, page = 1, limit = 20 } = req.query;
    const filter = customerId ? { customerId } : {};

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ orderDate: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate('customerId', 'name email') // Include customer name and email
        .lean(),
      Order.countDocuments(filter),
    ]);

    res.json({ orders, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/orders
 * Creates a single order and recalculates customer metrics
 */
export const createOrder = async (req, res) => {
  try {
    const order = await Order.create(req.body);
    // Recalculate the customer's aggregate metrics
    await recalculateCustomerMetrics(order.customerId);
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/orders/bulk
 * Imports multiple orders and recalculates metrics for affected customers
 */
export const bulkImportOrders = async (req, res) => {
  try {
    const { orders } = req.body;
    if (!orders || !Array.isArray(orders)) {
      return res.status(400).json({ error: 'Expected an array of orders' });
    }

    const result = await Order.insertMany(orders);

    // Recalculate metrics for all affected customers
    const uniqueCustomerIds = [...new Set(orders.map(o => o.customerId.toString()))];
    await Promise.all(uniqueCustomerIds.map(id => recalculateCustomerMetrics(id)));

    res.status(201).json({
      imported: result.length,
      message: `Successfully imported ${result.length} orders`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
