// ============================================================
// API Service
// Centralised HTTP client for all frontend → backend API calls
// Using axios with a configured base URL
//
// WHY CENTRALISED:
// - Single place to change the API URL (local vs deployed)
// - Consistent error handling
// - Easy to add auth headers later
// ============================================================
import axios from 'axios';

// Base URL for the CRM backend
// In development: http://localhost:5000
// In production: set via VITE_API_URL environment variable
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---- Customer APIs ----

export const getCustomers = (params) => api.get('/customers', { params });
export const getCustomerById = (id) => api.get(`/customers/${id}`);
export const getCustomerStats = () => api.get('/customers/stats');
export const createCustomer = (data) => api.post('/customers', data);
export const bulkImportCustomers = (customers) => api.post('/customers/bulk', { customers });

// ---- Order APIs ----

export const getOrders = (params) => api.get('/orders', { params });
export const createOrder = (data) => api.post('/orders', data);
export const bulkImportOrders = (orders) => api.post('/orders/bulk', { orders });

// ---- Segment APIs ----

export const getSegments = () => api.get('/segments');
export const getSegmentById = (id) => api.get(`/segments/${id}`);
export const createSegment = (data) => api.post('/segments', data);
export const previewSegment = (rules) => api.post('/segments/preview', { rules });
export const deleteSegment = (id) => api.delete(`/segments/${id}`);

// ---- Campaign APIs ----

export const getCampaigns = () => api.get('/campaigns');
export const getCampaignById = (id) => api.get(`/campaigns/${id}`);
export const createCampaign = (data) => api.post('/campaigns', data);
export const sendCampaign = (id) => api.post(`/campaigns/${id}/send`);
export const getCampaignStats = (id) => api.get(`/campaigns/${id}/stats`);

// ---- AI Copilot APIs ----

export const aiCreateSegment = (query) => api.post('/ai/segment', { query });
export const aiGenerateMessage = (data) => api.post('/ai/message', data);
export const aiSummarise = (campaignId) => api.post('/ai/summarise', { campaignId });
export const aiChat = (message) => api.post('/ai/chat', { message });

export default api;
