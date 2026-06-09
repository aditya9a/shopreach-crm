// ============================================================
// Segment Engine
// Translates segment rules into MongoDB queries and evaluates them
//
// HOW IT WORKS:
// 1. A segment has rules like: { conditions: [{field: "totalSpend", operator: ">", value: 5000}], logic: "AND" }
// 2. This engine converts those rules into a MongoDB query: { totalSpend: { $gt: 5000 } }
// 3. Then runs the query against the Customer collection
//
// WHY THIS DESIGN:
// - Rules are stored as structured JSON → easy for AI to generate
// - The engine is a separate module → can be tested independently
// - MongoDB query operators map naturally to our rule operators
// ============================================================
import Customer from '../models/Customer.js';

/**
 * Maps our rule operators to MongoDB query operators
 * Our UI/AI uses human-readable operators, MongoDB needs $gt, $lt, etc.
 */
const OPERATOR_MAP = {
  '>': '$gt',
  '<': '$lt',
  '>=': '$gte',
  '<=': '$lte',
  '==': '$eq',
  '!=': '$ne',
};

/**
 * Converts a single rule condition into a MongoDB query fragment
 * 
 * Example:
 *   Input:  { field: "totalSpend", operator: ">", value: 5000 }
 *   Output: { totalSpend: { $gt: 5000 } }
 * 
 * Special handling for date fields: converts relative values like "30_days_ago"
 * into actual Date objects for MongoDB comparison.
 */
function buildConditionQuery(condition) {
  const { field, operator, value } = condition;
  const mongoOp = OPERATOR_MAP[operator];

  if (!mongoOp) {
    throw new Error(`Unsupported operator: ${operator}`);
  }

  // Handle relative date values (e.g., "30_days_ago" → Date 30 days in the past)
  let queryValue = value;
  if (typeof value === 'string' && value.endsWith('_days_ago')) {
    const days = parseInt(value.split('_')[0]);
    queryValue = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  }

  return { [field]: { [mongoOp]: queryValue } };
}

/**
 * Converts a full set of segment rules into a MongoDB query
 * 
 * Example with AND logic:
 *   Input:  { conditions: [{totalSpend > 5000}, {totalOrders > 3}], logic: "AND" }
 *   Output: { $and: [{ totalSpend: { $gt: 5000 } }, { totalOrders: { $gt: 3 } }] }
 */
export function buildSegmentQuery(rules) {
  if (!rules || !rules.conditions || rules.conditions.length === 0) {
    return {}; // No conditions = match all customers
  }

  const conditions = rules.conditions.map(buildConditionQuery);

  // If only one condition, no need for $and/$or wrapper
  if (conditions.length === 1) {
    return conditions[0];
  }

  // Combine conditions with AND or OR logic
  const logicOp = rules.logic === 'OR' ? '$or' : '$and';
  return { [logicOp]: conditions };
}

/**
 * Evaluates a segment's rules and returns matching customers
 * Used when:
 * - Previewing a segment (how many customers match?)
 * - Sending a campaign (who should receive messages?)
 */
export async function evaluateSegment(rules) {
  const query = buildSegmentQuery(rules);
  const customers = await Customer.find(query).lean(); // .lean() returns plain JS objects (faster)
  return customers;
}

/**
 * Counts how many customers match a segment's rules
 * More efficient than evaluateSegment when you only need the count
 */
export async function countSegmentCustomers(rules) {
  const query = buildSegmentQuery(rules);
  return await Customer.countDocuments(query);
}
