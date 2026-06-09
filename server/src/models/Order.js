// ============================================================
// Order Model
// Represents a purchase made by a customer
// ============================================================
import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  // Reference to the customer who placed this order
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },

  // Array of items in this order
  items: [{
    name: { type: String, required: true },    // e.g., "Espresso Blend Beans"
    quantity: { type: Number, required: true }, // e.g., 2
    price: { type: Number, required: true },   // price per unit, e.g., 450
  }],

  // Total amount for this order (sum of item.price * item.quantity)
  totalAmount: { type: Number, required: true },

  // When the order was placed (can be different from createdAt for seed data)
  orderDate: { type: Date, required: true },
}, {
  timestamps: true,
});

// Index on customerId to quickly find all orders for a customer
orderSchema.index({ customerId: 1 });
// Index on orderDate for time-based queries (e.g., "orders in last 30 days")
orderSchema.index({ orderDate: 1 });

const Order = mongoose.model('Order', orderSchema);
export default Order;
