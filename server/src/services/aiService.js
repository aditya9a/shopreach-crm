// ============================================================
// AI Service — Powered by Groq (LLaMA 3.3)
// Uses the OpenAI-compatible API from Groq
//
// WHY GROQ:
// - OpenAI-compatible API (standard, well-documented)
// - Generous free tier with fast inference
// - Uses LLaMA 3.3 70B — powerful open-source model
//
// THREE MAIN CAPABILITIES:
// 1. Natural language → Segment rules
// 2. Message drafting for campaigns
// 3. Campaign analytics summary
// ============================================================
import OpenAI from 'openai';

// LAZY INITIALIZATION: Create the client on first use
// so that dotenv has time to load the env vars
let client = null;

function getClient() {
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1', // Groq's OpenAI-compatible endpoint
    });
  }
  return client;
}

// Model to use — LLaMA 3.3 70B via Groq for best quality
const MODEL = 'llama-3.3-70b-versatile';

/**
 * The customer data schema — included in prompts so AI knows
 * what fields are available for segment rules
 */
const CUSTOMER_SCHEMA = `
Customer fields available for segmentation:
- name (String): Customer's full name
- email (String): Email address
- phone (String): Phone number
- totalSpend (Number): Total money spent across all orders (in ₹)
- totalOrders (Number): Total number of orders placed
- lastOrderDate (Date): When they last placed an order
- firstOrderDate (Date): When they first placed an order
- avgOrderValue (Number): Average order value (totalSpend / totalOrders)
- tags (Array of Strings): Labels like "loyal", "high-value", "new"

Available operators: >, <, >=, <=, ==, !=
For dates, use relative values like "30_days_ago", "60_days_ago", "90_days_ago"
Logic options: "AND" (all conditions must match) or "OR" (any condition matches)
`;

/**
 * Converts natural language to segment rules
 */
export async function naturalLanguageToSegment(userQuery) {
  try {
    const response = await getClient().chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant for a coffee brand CRM called BrewCraft.
Your job is to convert natural language descriptions into structured segment rules.

${CUSTOMER_SCHEMA}

Respond with ONLY valid JSON (no markdown, no code blocks, no explanation) in this format:
{
  "name": "Short descriptive segment name",
  "description": "Human-readable description",
  "rules": {
    "conditions": [
      { "field": "fieldName", "operator": "operator", "value": value }
    ],
    "logic": "AND or OR"
  }
}`
        },
        { role: 'user', content: userQuery }
      ],
    });

    const text = response.choices[0].message.content.trim();
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('AI segment generation error:', error.message);
    throw new Error('Failed to generate segment from description. Please try rephrasing.');
  }
}

/**
 * Generates a marketing message for a campaign
 */
export async function generateMessage(channel, segmentDescription, userInstructions = '') {
  const channelGuidelines = {
    whatsapp: 'Keep it conversational, use emojis moderately, max 1024 characters.',
    sms: 'Keep it very short (under 160 characters), no emojis, clear call-to-action.',
    email: 'Can be longer, include a subject line, professional but warm tone.',
  };

  try {
    const response = await getClient().chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a marketing copywriter for BrewCraft, a premium coffee brand.
Channel guidelines: ${channelGuidelines[channel] || channelGuidelines.whatsapp}
Use {{name}} as a placeholder for the customer's name.
You can also use {{totalOrders}} and {{avgOrderValue}} if relevant.
Respond with ONLY the message text. No explanations.
${channel === 'email' ? 'Start with "Subject: ..." on the first line.' : ''}`
        },
        {
          role: 'user',
          content: `Write a ${channel} message for: ${segmentDescription}. ${userInstructions ? `Instructions: ${userInstructions}` : ''}`
        }
      ],
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('AI message generation error:', error.message);
    throw new Error('Failed to generate message. Please try again.');
  }
}

/**
 * Summarises campaign performance in natural language
 */
export async function summariseCampaignStats(campaignName, channel, stats) {
  try {
    const response = await getClient().chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an analytics expert for BrewCraft coffee brand CRM. Provide brief, insightful summaries (3-4 sentences) with actionable insights.'
        },
        {
          role: 'user',
          content: `Analyse this campaign:
Campaign: "${campaignName}" (${channel})
- Total: ${stats.total}, Sent: ${stats.sent}
- Delivered: ${stats.delivered} (${stats.total ? ((stats.delivered / stats.total) * 100).toFixed(1) : 0}%)
- Failed: ${stats.failed} (${stats.total ? ((stats.failed / stats.total) * 100).toFixed(1) : 0}%)
- Opened: ${stats.opened} (${stats.delivered ? ((stats.opened / stats.delivered) * 100).toFixed(1) : 0}% of delivered)
- Read: ${stats.read}, Clicked: ${stats.clicked} (${stats.delivered ? ((stats.clicked / stats.delivered) * 100).toFixed(1) : 0}% CTR)`
        }
      ],
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('AI summary error:', error.message);
    return 'Unable to generate AI summary at this time.';
  }
}

/**
 * General AI copilot chat
 */
export async function copilotChat(userMessage, context = {}) {
  try {
    const response = await getClient().chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `You are an AI marketing copilot for BrewCraft, a premium coffee brand CRM.
You help marketers with segments, campaigns, messages, and strategy.

${context.customerCount ? `Current data: ${context.customerCount} customers, ${context.orderCount || 0} orders, ${context.campaignCount || 0} campaigns` : ''}

${CUSTOMER_SCHEMA}

Keep responses concise and actionable. Use bullet points where appropriate.
If asked to create a segment, provide rules in JSON format.
If asked to draft a message, provide the message directly.`
        },
        { role: 'user', content: userMessage }
      ],
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('AI copilot error:', error.message);
    throw new Error('AI copilot is temporarily unavailable. Please try again.');
  }
}
