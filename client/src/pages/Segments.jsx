// ============================================================
// Segments Page
// Create and manage audience segments using either:
// 1. Visual Rule Builder (AND/OR conditions)
// 2. AI Natural Language (describe audience in plain English)
//
// This is one of the most important pages — it showcases both
// the rule-based segmentation AND the AI-native capability
// ============================================================
import { useState, useEffect } from 'react';
import {
  getSegments,
  createSegment,
  previewSegment,
  deleteSegment,
  aiCreateSegment,
} from '../services/api';

// Available fields for segment rules (matches Customer schema)
const FIELDS = [
  { value: 'totalSpend', label: 'Total Spend (₹)' },
  { value: 'totalOrders', label: 'Total Orders' },
  { value: 'avgOrderValue', label: 'Avg Order Value (₹)' },
  { value: 'lastOrderDate', label: 'Last Order Date' },
  { value: 'firstOrderDate', label: 'First Order Date' },
];

const OPERATORS = [
  { value: '>', label: 'greater than' },
  { value: '<', label: 'less than' },
  { value: '>=', label: 'greater than or equal' },
  { value: '<=', label: 'less than or equal' },
  { value: '==', label: 'equals' },
  { value: '!=', label: 'not equal to' },
];

function Segments() {
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create Segment form state
  const [segmentName, setSegmentName] = useState('');
  const [segmentDescription, setSegmentDescription] = useState('');
  const [conditions, setConditions] = useState([
    { field: 'totalSpend', operator: '>', value: '' },
  ]);
  const [logic, setLogic] = useState('AND');
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // AI Natural Language state
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [useAI, setUseAI] = useState(false);

  // Fetch existing segments
  useEffect(() => {
    fetchSegments();
  }, []);

  const fetchSegments = async () => {
    try {
      const res = await getSegments();
      setSegments(res.data);
    } catch (error) {
      console.error('Error fetching segments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add a new condition row
  const addCondition = () => {
    setConditions([...conditions, { field: 'totalSpend', operator: '>', value: '' }]);
  };

  // Remove a condition
  const removeCondition = (index) => {
    if (conditions.length <= 1) return; // Must have at least one condition
    setConditions(conditions.filter((_, i) => i !== index));
  };

  // Update a condition field
  const updateCondition = (index, key, value) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [key]: value };
    setConditions(updated);
  };

  // Preview segment — shows how many customers match
  const handlePreview = async () => {
    // Parse values (convert strings to numbers for numeric fields)
    const parsedConditions = conditions
      .filter(c => c.value !== '')
      .map(c => ({
        ...c,
        value: ['lastOrderDate', 'firstOrderDate'].includes(c.field)
          ? c.value
          : parseFloat(c.value),
      }));

    if (parsedConditions.length === 0) return;

    setPreviewLoading(true);
    try {
      const res = await previewSegment({ conditions: parsedConditions, logic });
      setPreviewData(res.data);
    } catch (error) {
      console.error('Preview error:', error);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Save segment
  const handleSave = async () => {
    if (!segmentName.trim()) return alert('Please enter a segment name');

    const parsedConditions = conditions
      .filter(c => c.value !== '')
      .map(c => ({
        ...c,
        value: ['lastOrderDate', 'firstOrderDate'].includes(c.field)
          ? c.value
          : parseFloat(c.value),
      }));

    setSaving(true);
    try {
      await createSegment({
        name: segmentName,
        description: segmentDescription,
        rules: { conditions: parsedConditions, logic },
        createdByAI: useAI,
      });
      setShowCreateModal(false);
      resetForm();
      fetchSegments();
    } catch (error) {
      console.error('Save error:', error);
      alert('Error saving segment');
    } finally {
      setSaving(false);
    }
  };

  // AI: Convert natural language to segment rules
  const handleAISegment = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    try {
      const res = await aiCreateSegment(aiQuery);
      const aiData = res.data;
      // Populate the form with AI-generated data
      setSegmentName(aiData.name || '');
      setSegmentDescription(aiData.description || '');
      if (aiData.rules?.conditions) {
        setConditions(aiData.rules.conditions.map(c => ({
          field: c.field,
          operator: c.operator,
          value: String(c.value),
        })));
        setLogic(aiData.rules.logic || 'AND');
      }
      setUseAI(true);
      // Auto-preview
      handlePreview();
    } catch (error) {
      console.error('AI segment error:', error);
      alert('AI could not process your request. Please try rephrasing or use the manual builder.');
    } finally {
      setAiLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setSegmentName('');
    setSegmentDescription('');
    setConditions([{ field: 'totalSpend', operator: '>', value: '' }]);
    setLogic('AND');
    setPreviewData(null);
    setAiQuery('');
    setUseAI(false);
  };

  // Delete segment
  const handleDelete = async (id) => {
    if (!confirm('Delete this segment?')) return;
    try {
      await deleteSegment(id);
      fetchSegments();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  // Format currency
  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  if (loading) {
    return <div className="loading-spinner"><div className="spinner"></div></div>;
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="flex justify-between items-center">
          <div>
            <h1>Segments</h1>
            <p>Create targeted audiences for your campaigns</p>
          </div>
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowCreateModal(true); }}>
            + New Segment
          </button>
        </div>
      </div>

      {/* Segments List */}
      {segments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon" style={{ fontSize: '36px', fontWeight: 700, color: 'var(--text-muted)' }}>--</div>
          <h3>No segments yet</h3>
          <p>Create your first segment to target specific customers</p>
          <button className="btn btn-primary mt-16" onClick={() => setShowCreateModal(true)}>
            Create Segment
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-16">
          {segments.map((segment) => (
            <div key={segment._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div className="flex items-center gap-8" style={{ marginBottom: '4px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600 }}>{segment.name}</h3>
                  {segment.createdByAI && <span className="badge badge-purple">AI</span>}
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px' }}>
                  {segment.description}
                </p>
                <div className="flex gap-8">
                  <span className="badge badge-teal">{segment.customerCount} customers</span>
                  <span className="badge badge-amber">
                    {segment.rules?.conditions?.length || 0} conditions • {segment.rules?.logic || 'AND'}
                  </span>
                </div>
              </div>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => handleDelete(segment._id)}
                style={{ marginLeft: '16px', color: 'var(--rose-400)' }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create Segment Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2>Create Segment</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>

            {/* AI Natural Language Input */}
            <div className="card mb-24" style={{ background: 'var(--purple-glow)', borderColor: 'rgba(139,92,246,0.2)' }}>
              <div className="flex items-center gap-8 mb-16">
                <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--purple-600)' }}>AI</span>
                <h3 style={{ fontSize: '14px', fontWeight: 600 }}>AI Segment Builder</h3>
              </div>
              <div className="flex gap-8">
                <input
                  className="form-input"
                  placeholder="Describe your audience... e.g., 'customers who spent more than ₹5000 and ordered 3+ times'"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAISegment()}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleAISegment}
                  disabled={aiLoading || !aiQuery.trim()}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {aiLoading ? '...' : 'Generate'}
                </button>
              </div>
            </div>

            {/* Manual Rule Builder */}
            <div className="form-group">
              <label className="form-label">Segment Name</label>
              <input
                className="form-input"
                placeholder="e.g., High-Value Regulars"
                value={segmentName}
                onChange={(e) => setSegmentName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <input
                className="form-input"
                placeholder="Brief description of this segment"
                value={segmentDescription}
                onChange={(e) => setSegmentDescription(e.target.value)}
              />
            </div>

            {/* Logic Toggle */}
            <div className="form-group">
              <label className="form-label">Match</label>
              <div className="logic-toggle">
                <button
                  className={`logic-btn ${logic === 'AND' ? 'active' : ''}`}
                  onClick={() => setLogic('AND')}
                >
                  ALL conditions (AND)
                </button>
                <button
                  className={`logic-btn ${logic === 'OR' ? 'active' : ''}`}
                  onClick={() => setLogic('OR')}
                >
                  ANY condition (OR)
                </button>
              </div>
            </div>

            {/* Conditions */}
            <div className="form-group">
              <label className="form-label">Conditions</label>
              <div className="segment-builder">
                {conditions.map((condition, index) => (
                  <div key={index} className="condition-row">
                    <select
                      className="form-select"
                      value={condition.field}
                      onChange={(e) => updateCondition(index, 'field', e.target.value)}
                    >
                      {FIELDS.map((f) => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>

                    <select
                      className="form-select"
                      value={condition.operator}
                      onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                    >
                      {OPERATORS.map((op) => (
                        <option key={op.value} value={op.value}>{op.label}</option>
                      ))}
                    </select>

                    <input
                      className="form-input"
                      type={['lastOrderDate', 'firstOrderDate'].includes(condition.field) ? 'text' : 'number'}
                      placeholder={['lastOrderDate', 'firstOrderDate'].includes(condition.field) ? 'e.g., 30_days_ago' : 'Value'}
                      value={condition.value}
                      onChange={(e) => updateCondition(index, 'value', e.target.value)}
                    />

                    <button className="condition-remove" onClick={() => removeCondition(index)}>✕</button>
                  </div>
                ))}

                <button className="btn btn-sm btn-secondary" onClick={addCondition}>
                  + Add Condition
                </button>
              </div>
            </div>

            {/* Preview */}
            <div className="flex gap-8 mt-16">
              <button
                className="btn btn-secondary"
                onClick={handlePreview}
                disabled={previewLoading}
              >
                {previewLoading ? 'Loading...' : 'Preview Audience'}
              </button>
            </div>

            {previewData && (
              <div className="card mt-16" style={{ background: 'rgba(20, 184, 166, 0.08)', borderColor: 'rgba(20, 184, 166, 0.2)' }}>
                <div className="flex items-center gap-8 mb-8">
                  <span className="badge badge-teal" style={{ fontSize: '16px', padding: '6px 14px' }}>
                    {previewData.customerCount} customers match
                  </span>
                </div>
                {previewData.sampleCustomers?.length > 0 && (
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <strong>Sample:</strong>{' '}
                    {previewData.sampleCustomers.map(c => c.name).join(', ')}
                    {previewData.customerCount > 5 && ` and ${previewData.customerCount - 5} more...`}
                  </div>
                )}
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-between mt-24">
              <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Segment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Segments;
