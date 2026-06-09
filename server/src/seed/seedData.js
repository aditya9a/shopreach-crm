// ============================================================
// Seed Data Script
// Populates the database with realistic BrewCraft coffee chain data
// Run with: npm run seed
//
// Creates:
// - 200 customers with realistic Indian names and varied purchase patterns
// - 800+ orders with coffee products spanning the last 12 months
// - 4 pre-built segments to demonstrate the segment feature
//
// WHY THIS DATA MATTERS:
// Realistic data makes the demo compelling. Random "user1, user2" data
// looks lazy. This data has genuine patterns (high spenders, dormant
// customers, new customers) that make segment/campaign demos meaningful.
// ============================================================
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import Customer from '../models/Customer.js';
import Order from '../models/Order.js';
import Segment from '../models/Segment.js';

// Resolve .env path relative to the server directory (two levels up from this file)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// --- Realistic Data Pools ---

const firstNames = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan',
  'Krishna', 'Ishaan', 'Shaurya', 'Atharv', 'Advait', 'Dhruv', 'Kabir',
  'Ananya', 'Diya', 'Myra', 'Sara', 'Aanya', 'Aadhya', 'Isha', 'Pari',
  'Kiara', 'Riya', 'Priya', 'Neha', 'Meera', 'Tanvi', 'Shreya',
  'Rohan', 'Karan', 'Vikram', 'Rahul', 'Amit', 'Deepak', 'Nikhil', 'Suresh',
  'Pooja', 'Nisha', 'Kavita', 'Sunita', 'Anjali', 'Sneha', 'Divya', 'Swati',
  'Manish', 'Rajesh', 'Sanjay', 'Vinod', 'Harsh', 'Kunal', 'Tushar', 'Varun',
  'Simran', 'Jasmine', 'Ritika', 'Komal', 'Bhavna', 'Megha',
];

const lastNames = [
  'Sharma', 'Verma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Mehta', 'Jain',
  'Shah', 'Reddy', 'Nair', 'Menon', 'Rao', 'Iyer', 'Pillai', 'Das',
  'Bose', 'Banerjee', 'Chatterjee', 'Mukherjee', 'Desai', 'Kapoor',
  'Malhotra', 'Khanna', 'Chopra', 'Arora', 'Bhatt', 'Joshi', 'Tiwari', 'Pandey',
];

// BrewCraft product catalog — realistic coffee chain items
const products = [
  { name: 'Espresso Shot', priceRange: [120, 180] },
  { name: 'Cappuccino', priceRange: [180, 250] },
  { name: 'Latte', priceRange: [200, 280] },
  { name: 'Cold Brew', priceRange: [220, 300] },
  { name: 'Mocha', priceRange: [250, 320] },
  { name: 'Flat White', priceRange: [200, 260] },
  { name: 'Matcha Latte', priceRange: [280, 350] },
  { name: 'Iced Americano', priceRange: [160, 220] },
  { name: 'Caramel Frappuccino', priceRange: [300, 380] },
  { name: 'Espresso Blend Beans (250g)', priceRange: [450, 650] },
  { name: 'Single Origin Beans (250g)', priceRange: [550, 800] },
  { name: 'French Press Beans (500g)', priceRange: [700, 1100] },
  { name: 'Chocolate Croissant', priceRange: [120, 180] },
  { name: 'Blueberry Muffin', priceRange: [100, 150] },
  { name: 'Avocado Toast', priceRange: [250, 350] },
  { name: 'BrewCraft Tumbler', priceRange: [600, 900] },
  { name: 'BrewCraft Gift Card', priceRange: [500, 2000] },
];

// Helper: random number in range
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper: random date in the last N months
const randomDate = (monthsBack) => {
  const now = new Date();
  const past = new Date(now);
  past.setMonth(past.getMonth() - monthsBack);
  return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
};

// Helper: pick random item from array
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB for seeding');

    // Clear existing data
    await Promise.all([
      Customer.deleteMany({}),
      Order.deleteMany({}),
      Segment.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data');

    // --- Create Customers ---
    const customers = [];
    const usedEmails = new Set();

    for (let i = 0; i < 200; i++) {
      const firstName = pick(firstNames);
      const lastName = pick(lastNames);
      const name = `${firstName} ${lastName}`;

      // Generate unique email
      let email;
      do {
        const suffix = rand(1, 999);
        email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${suffix}@${pick(['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'])}`;
      } while (usedEmails.has(email));
      usedEmails.add(email);

      const phone = `+91-${rand(70, 99)}${rand(10000000, 99999999)}`;

      // Assign customer "archetype" for realistic patterns
      // This creates natural segments in the data
      const archetype = Math.random();
      let tags = [];
      if (archetype < 0.15) {
        tags = ['high-value', 'loyal'];      // 15% — big spenders, frequent buyers
      } else if (archetype < 0.35) {
        tags = ['regular'];                   // 20% — consistent buyers
      } else if (archetype < 0.55) {
        tags = ['occasional'];                // 20% — buy now and then
      } else if (archetype < 0.75) {
        tags = ['new'];                       // 20% — recently joined
      } else {
        tags = ['dormant'];                   // 25% — haven't bought recently
      }

      customers.push({
        name,
        email,
        phone,
        tags,
        totalSpend: 0,     // Will be calculated from orders
        totalOrders: 0,
        avgOrderValue: 0,
      });
    }

    const createdCustomers = await Customer.insertMany(customers);
    console.log(`👤 Created ${createdCustomers.length} customers`);

    // --- Create Orders ---
    const allOrders = [];

    for (const customer of createdCustomers) {
      // Number of orders depends on customer archetype
      let numOrders;
      if (customer.tags.includes('high-value')) {
        numOrders = rand(8, 20);
      } else if (customer.tags.includes('regular')) {
        numOrders = rand(4, 10);
      } else if (customer.tags.includes('occasional')) {
        numOrders = rand(2, 5);
      } else if (customer.tags.includes('new')) {
        numOrders = rand(1, 3);
      } else {
        numOrders = rand(1, 4); // dormant — had orders but stopped
      }

      // When orders are placed depends on archetype
      const monthsBack = customer.tags.includes('dormant') ? rand(6, 12) :
                          customer.tags.includes('new') ? rand(1, 2) : rand(1, 12);

      for (let j = 0; j < numOrders; j++) {
        // Generate 1-4 items per order
        const numItems = rand(1, 4);
        const items = [];
        let totalAmount = 0;

        for (let k = 0; k < numItems; k++) {
          const product = pick(products);
          const quantity = rand(1, 3);
          const price = rand(product.priceRange[0], product.priceRange[1]);
          items.push({ name: product.name, quantity, price });
          totalAmount += price * quantity;
        }

        // Dormant customers have older orders; new customers have recent ones
        let orderDate;
        if (customer.tags.includes('dormant')) {
          orderDate = randomDate(rand(3, 12)); // 3-12 months ago
        } else if (customer.tags.includes('new')) {
          orderDate = randomDate(2); // Last 2 months
        } else {
          orderDate = randomDate(monthsBack);
        }

        allOrders.push({
          customerId: customer._id,
          items,
          totalAmount,
          orderDate,
        });
      }
    }

    await Order.insertMany(allOrders);
    console.log(`📦 Created ${allOrders.length} orders`);

    // --- Recalculate Customer Metrics ---
    console.log('📊 Recalculating customer metrics...');
    for (const customer of createdCustomers) {
      const orders = await Order.find({ customerId: customer._id }).lean();
      const totalSpend = orders.reduce((sum, o) => sum + o.totalAmount, 0);
      const totalOrders = orders.length;
      const avgOrderValue = totalOrders > 0 ? Math.round(totalSpend / totalOrders) : 0;
      const dates = orders.map(o => new Date(o.orderDate)).sort((a, b) => a - b);

      await Customer.findByIdAndUpdate(customer._id, {
        totalSpend,
        totalOrders,
        avgOrderValue,
        firstOrderDate: dates[0] || null,
        lastOrderDate: dates[dates.length - 1] || null,
      });
    }

    // --- Create Pre-built Segments ---
    const segments = [
      {
        name: 'High-Value Loyalists',
        description: 'Customers who spent more than ₹5,000 and placed 5+ orders — your most valuable customers',
        rules: {
          conditions: [
            { field: 'totalSpend', operator: '>', value: 5000 },
            { field: 'totalOrders', operator: '>=', value: 5 },
          ],
          logic: 'AND',
        },
      },
      {
        name: 'Dormant Customers',
        description: 'Customers who haven\'t ordered in the last 90 days — potential win-back targets',
        rules: {
          conditions: [
            { field: 'lastOrderDate', operator: '<', value: '90_days_ago' },
          ],
          logic: 'AND',
        },
      },
      {
        name: 'New Shoppers',
        description: 'Customers who joined in the last 60 days — nurture them into regulars',
        rules: {
          conditions: [
            { field: 'firstOrderDate', operator: '>', value: '60_days_ago' },
          ],
          logic: 'AND',
        },
      },
      {
        name: 'Big Basket Buyers',
        description: 'Customers with an average order value above ₹1,000 — premium customers',
        rules: {
          conditions: [
            { field: 'avgOrderValue', operator: '>', value: 1000 },
          ],
          logic: 'AND',
        },
      },
    ];

    for (const segData of segments) {
      const count = await Customer.countDocuments(
        segData.rules.conditions.length === 1
          ? (() => {
              const c = segData.rules.conditions[0];
              const opMap = { '>': '$gt', '<': '$lt', '>=': '$gte', '<=': '$lte' };
              let val = c.value;
              if (typeof val === 'string' && val.endsWith('_days_ago')) {
                const days = parseInt(val.split('_')[0]);
                val = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
              }
              return { [c.field]: { [opMap[c.operator]]: val } };
            })()
          : {
              $and: segData.rules.conditions.map(c => {
                const opMap = { '>': '$gt', '<': '$lt', '>=': '$gte', '<=': '$lte' };
                return { [c.field]: { [opMap[c.operator]]: c.value } };
              }),
            }
      );
      segData.customerCount = count;
    }

    await Segment.insertMany(segments);
    console.log(`🎯 Created ${segments.length} pre-built segments`);

    console.log('\n✅ Seed complete! BrewCraft CRM is ready.');
    console.log('   Start the server with: npm run dev');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();
