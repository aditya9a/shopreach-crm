// ============================================================
// Segment Controller
// Handles segment CRUD and evaluation (previewing matching customers)
// ============================================================
import Segment from '../models/Segment.js';
import { evaluateSegment, countSegmentCustomers } from '../services/segmentEngine.js';

/**
 * GET /api/segments
 * Returns all segments with their cached customer counts
 */
export const getSegments = async (req, res) => {
  try {
    const segments = await Segment.find().sort({ createdAt: -1 }).lean();
    res.json(segments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/segments/:id
 * Returns a single segment with its matching customers
 */
export const getSegmentById = async (req, res) => {
  try {
    const segment = await Segment.findById(req.params.id).lean();
    if (!segment) return res.status(404).json({ error: 'Segment not found' });

    // Evaluate the segment to get current matching customers
    const customers = await evaluateSegment(segment.rules);

    res.json({ segment, customers, customerCount: customers.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/segments
 * Creates a new segment and counts matching customers
 */
export const createSegment = async (req, res) => {
  try {
    const { name, description, rules, createdByAI } = req.body;

    // Count how many customers match these rules
    const customerCount = await countSegmentCustomers(rules);

    const segment = await Segment.create({
      name,
      description,
      rules,
      customerCount,
      createdByAI: createdByAI || false,
    });

    res.status(201).json(segment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/segments/preview
 * Preview how many customers match a set of rules WITHOUT saving the segment
 * Used by the segment builder to show live counts as the user builds rules
 */
export const previewSegment = async (req, res) => {
  try {
    const { rules } = req.body;
    const customers = await evaluateSegment(rules);

    res.json({
      customerCount: customers.length,
      // Return first 5 customers as a preview
      sampleCustomers: customers.slice(0, 5).map(c => ({
        name: c.name,
        email: c.email,
        totalSpend: c.totalSpend,
        totalOrders: c.totalOrders,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * DELETE /api/segments/:id
 * Deletes a segment
 */
export const deleteSegment = async (req, res) => {
  try {
    const segment = await Segment.findByIdAndDelete(req.params.id);
    if (!segment) return res.status(404).json({ error: 'Segment not found' });
    res.json({ message: 'Segment deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
