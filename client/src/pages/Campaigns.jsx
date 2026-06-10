// ============================================================
// Campaigns Page
// Create and manage marketing campaigns
// 
// FLOW:
// 1. Select a segment (target audience)
// 2. Choose a channel (WhatsApp, SMS, Email)
// 3. Write a message (with AI suggestion option)
// 4. Create campaign → Send → Watch stats update in real-time
// ============================================================
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getCampaigns,
  getSegments,
  createCampaign,
  sendCampaign,
  aiGenerateMessage,
} from '../services/api';

function Campaigns() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create Campaign form state
  const [campaignName, setCampaignName] = useState('');
  const [selectedSegment, setSelectedSegment] = useState('');
  const [channel, setChannel] = useState('whatsapp');
  const [messageTemplate, setMessageTemplate] = useState('');
  const [aiInstructions, setAiInstructions] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingId, setSendingId] = useState(null);

  // Fetch campaigns and segments on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [campaignsRes, segmentsRes] = await Promise.all([
        getCampaigns(),
        getSegments(),
      ]);
      setCampaigns(campaignsRes.data);
      setSegments(segmentsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate message using AI
  const handleAIGenerate = async () => {
    const segment = segments.find(s => s._id === selectedSegment);
    if (!segment) return alert('Please select a segment first');

    setAiGenerating(true);
    try {
      const res = await aiGenerateMessage({
        channel,
        segmentDescription: `${segment.name}: ${segment.description}`,
        instructions: aiInstructions,
      });
      setMessageTemplate(res.data.message);
    } catch (error) {
      console.error('AI message error:', error);
      alert('Failed to generate message. Make sure the Gemini API key is configured.');
    } finally {
      setAiGenerating(false);
    }
  };

  // Create campaign
  const handleCreate = async () => {
    if (!campaignName.trim()) return alert('Please enter a campaign name');
    if (!selectedSegment) return alert('Please select a segment');
    if (!messageTemplate.trim()) return alert('Please enter a message');

    setSaving(true);
    try {
      await createCampaign({
        name: campaignName,
        segmentId: selectedSegment,
        channel,
        messageTemplate,
      });
      setShowCreateModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Create error:', error);
      alert('Error creating campaign');
    } finally {
      setSaving(false);
    }
  };

  // Send campaign (trigger the send flow)
  const handleSend = async (campaignId) => {
    if (!confirm('Send this campaign? Messages will be dispatched to all customers in the segment.')) return;

    setSendingId(campaignId);
    try {
      await sendCampaign(campaignId);
      alert('Campaign sent! Click on the campaign to see real-time delivery stats.');
      fetchData();
    } catch (error) {
      console.error('Send error:', error);
      alert(`Error sending campaign: ${error.response?.data?.error || error.message}`);
    } finally {
      setSendingId(null);
    }
  };

  // Reset form
  const resetForm = () => {
    setCampaignName('');
    setSelectedSegment('');
    setChannel('whatsapp');
    setMessageTemplate('');
    setAiInstructions('');
  };

  // Status badge colors
  const statusBadge = (status) => ({
    draft: 'badge-amber',
    sending: 'badge-blue',
    sent: 'badge-teal',
    completed: 'badge-green',
  }[status] || 'badge-purple');

  // Channel label (no emojis)
  const channelLabel = (ch) => ({
    whatsapp: 'WA',
    sms: 'SMS',
    email: 'EM',
  }[ch] || 'MSG');

  // Format date
  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  if (loading) {
    return <div className="loading-spinner"><div className="spinner"></div></div>;
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="flex justify-between items-center">
          <div>
            <h1>Campaigns</h1>
            <p>Create and send personalised messages to your shoppers</p>
          </div>
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowCreateModal(true); }}>
            + New Campaign
          </button>
        </div>
      </div>

      {/* Campaigns List */}
      {campaigns.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon" style={{ fontSize: '36px', fontWeight: 700, color: 'var(--text-muted)' }}>--</div>
          <h3>No campaigns yet</h3>
          <p>Create your first campaign to engage your customers</p>
          <button className="btn btn-primary mt-16" onClick={() => setShowCreateModal(true)}>
            Create Campaign
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-16">
          {campaigns.map((campaign) => (
            <div key={campaign._id} className="card" style={{ cursor: 'pointer' }}>
              <div className="flex justify-between items-center">
                <div
                  style={{ flex: 1 }}
                  onClick={() => navigate(`/campaigns/${campaign._id}`)}
                >
                  <div className="flex items-center gap-8" style={{ marginBottom: '4px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--purple-600)', background: 'var(--purple-glow)', padding: '2px 8px', borderRadius: 'var(--radius-sm)' }}>{channelLabel(campaign.channel)}</span>
                    <h3 style={{ fontSize: '16px', fontWeight: 600 }}>{campaign.name}</h3>
                    <span className={`badge ${statusBadge(campaign.status)}`}>{campaign.status}</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px' }}>
                    {campaign.segmentId?.name || 'Unknown Segment'} • {campaign.channel}
                    {campaign.sentAt && ` • Sent ${formatDate(campaign.sentAt)}`}
                  </p>
                  {campaign.status !== 'draft' && (
                    <div className="flex gap-12" style={{ fontSize: '13px' }}>
                      <span>{campaign.stats?.sent || 0} sent</span>
                      <span>{campaign.stats?.delivered || 0} delivered</span>
                      <span>{campaign.stats?.failed || 0} failed</span>
                      <span>{campaign.stats?.opened || 0} opened</span>
                      <span>{campaign.stats?.clicked || 0} clicked</span>
                    </div>
                  )}
                </div>

                {/* Send button for draft campaigns */}
                {campaign.status === 'draft' && (
                  <button
                    className="btn btn-success btn-sm"
                    onClick={(e) => { e.stopPropagation(); handleSend(campaign._id); }}
                    disabled={sendingId === campaign._id}
                    style={{ marginLeft: '16px' }}
                  >
                    {sendingId === campaign._id ? 'Sending...' : 'Send'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h2>Create Campaign</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>

            {/* Campaign Name */}
            <div className="form-group">
              <label className="form-label">Campaign Name</label>
              <input
                className="form-input"
                placeholder="e.g., Summer Sale Blast"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
              />
            </div>

            {/* Segment Selection */}
            <div className="form-group">
              <label className="form-label">Target Segment</label>
              {segments.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                  No segments available. <a href="/segments" style={{ color: 'var(--purple-400)' }}>Create one first</a>.
                </p>
              ) : (
                <select
                  className="form-select"
                  value={selectedSegment}
                  onChange={(e) => setSelectedSegment(e.target.value)}
                >
                  <option value="">Select a segment...</option>
                  {segments.map((seg) => (
                    <option key={seg._id} value={seg._id}>
                      {seg.name} ({seg.customerCount} customers)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Channel Selection */}
            <div className="form-group">
              <label className="form-label">Channel</label>
              <div className="flex gap-8">
                {['whatsapp', 'sms', 'email'].map((ch) => (
                  <button
                    key={ch}
                    className={`btn btn-sm ${channel === ch ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setChannel(ch)}
                  >
                    {channelLabel(ch)} {ch.charAt(0).toUpperCase() + ch.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Template */}
            <div className="form-group">
              <label className="form-label">Message Template</label>
              <textarea
                className="form-textarea"
                placeholder="Hey {{name}}, check out our latest offers! Use {{totalOrders}} and {{avgOrderValue}} for personalization."
                value={messageTemplate}
                onChange={(e) => setMessageTemplate(e.target.value)}
                rows={5}
              />
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Use {'{{name}}'}, {'{{totalOrders}}'}, {'{{avgOrderValue}}'} for personalization
              </div>
            </div>

            {/* AI Message Generator */}
            <div className="card mb-24" style={{ background: 'var(--purple-glow)', borderColor: 'rgba(139,92,246,0.2)' }}>
              <div className="flex items-center gap-8 mb-8">
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--purple-600)' }}>AI</span>
                <h3 style={{ fontSize: '14px', fontWeight: 600 }}>AI Message Writer</h3>
              </div>
              <input
                className="form-input mb-16"
                placeholder="Optional: Add instructions like 'mention 20% discount' or 'keep it casual'"
                value={aiInstructions}
                onChange={(e) => setAiInstructions(e.target.value)}
                style={{ marginBottom: '8px' }}
              />
              <button
                className="btn btn-sm btn-primary"
                onClick={handleAIGenerate}
                disabled={aiGenerating || !selectedSegment}
              >
                {aiGenerating ? 'Writing...' : 'Generate Message'}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between">
              <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
                {saving ? 'Creating...' : 'Create Campaign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Campaigns;
