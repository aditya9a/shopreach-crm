// ============================================================
// Campaign Detail Page
// Shows detailed campaign info with:
// - Live-updating delivery stats (polls every 3 seconds)
// - Delivery funnel visualization
// - AI-generated performance summary
// - Per-message communication log
//
// This page is the SHOWCASE of the callback-driven delivery loop.
// After sending a campaign, the user watches stats update in real-time
// as the channel service sends callbacks.
// ============================================================
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCampaignById, getCampaignStats, aiSummarise } from '../services/api';

function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const pollRef = useRef(null);

  // Fetch campaign detail on mount
  useEffect(() => {
    fetchCampaign();
    return () => {
      // Cleanup: stop polling when leaving the page
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [id]);

  const fetchCampaign = async () => {
    try {
      const res = await getCampaignById(id);
      setCampaign(res.data.campaign);
      setLogs(res.data.logs);

      // Start polling if campaign is actively being delivered
      if (['sending', 'sent'].includes(res.data.campaign.status)) {
        startPolling();
      }
    } catch (error) {
      console.error('Error fetching campaign:', error);
    } finally {
      setLoading(false);
    }
  };

  // Poll campaign stats every 3 seconds (while campaign is active)
  // WHY POLLING: Simpler than WebSockets for this demo.
  // In production, we'd use Server-Sent Events or WebSockets.
  const startPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await getCampaignStats(id);
        setCampaign(prev => prev ? { ...prev, stats: res.data.stats, status: res.data.status } : prev);

        // Also refresh logs to see updated statuses
        const detailRes = await getCampaignById(id);
        setLogs(detailRes.data.logs);

        // Stop polling once all callbacks are likely received
        // (when delivered + failed >= total, most lifecycle is done)
        const stats = res.data.stats;
        if (stats.delivered + stats.failed >= stats.total && stats.total > 0) {
          // Give extra time for opened/read/clicked callbacks
          setTimeout(() => {
            if (pollRef.current) clearInterval(pollRef.current);
          }, 15000);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000);
  };

  // Get AI summary of campaign performance
  const handleAISummary = async () => {
    setAiLoading(true);
    try {
      const res = await aiSummarise(id);
      setAiSummary(res.data.summary);
    } catch (error) {
      console.error('AI summary error:', error);
      setAiSummary('Unable to generate summary. Make sure the Gemini API key is configured.');
    } finally {
      setAiLoading(false);
    }
  };

  // Status badge colors
  const statusColor = (status) => ({
    queued: 'badge-amber',
    sent: 'badge-blue',
    delivered: 'badge-teal',
    failed: 'badge-rose',
    opened: 'badge-purple',
    read: 'badge-green',
    clicked: 'badge-green',
  }[status] || 'badge-amber');

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

  if (!campaign) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon" style={{ fontSize: '36px', fontWeight: 700, color: 'var(--text-muted)' }}>404</div>
        <h3>Campaign not found</h3>
        <button className="btn btn-primary mt-16" onClick={() => navigate('/campaigns')}>
          Back to Campaigns
        </button>
      </div>
    );
  }

  const stats = campaign.stats || {};
  const total = stats.total || 1; // Avoid division by zero

  return (
    <div>
      {/* Back Button + Header */}
      <button
        className="btn btn-sm btn-secondary mb-24"
        onClick={() => navigate('/campaigns')}
      >
        ← Back to Campaigns
      </button>

      <div className="page-header">
        <div className="flex items-center gap-12">
          <h1>{campaign.name}</h1>
          <span className={`badge ${statusColor(campaign.status)}`}>{campaign.status}</span>
        </div>
        <p>
          {campaign.channel} • {campaign.segmentId?.name || 'Unknown Segment'} •{' '}
          {campaign.sentAt ? `Sent ${formatDate(campaign.sentAt)}` : 'Not yet sent'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
        <div className="card stat-card blue">
          <div className="stat-card-icon" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--blue-500)' }}>SNT</div>
          <div className="stat-card-value">{stats.sent || 0}</div>
          <div className="stat-card-label">Sent</div>
        </div>
        <div className="card stat-card teal">
          <div className="stat-card-icon" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--teal-600)' }}>DLV</div>
          <div className="stat-card-value">{stats.delivered || 0}</div>
          <div className="stat-card-label">Delivered</div>
        </div>
        <div className="card stat-card rose">
          <div className="stat-card-icon" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--rose-500)' }}>FLD</div>
          <div className="stat-card-value">{stats.failed || 0}</div>
          <div className="stat-card-label">Failed</div>
        </div>
        <div className="card stat-card purple">
          <div className="stat-card-icon" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--purple-600)' }}>OPN</div>
          <div className="stat-card-value">{stats.opened || 0}</div>
          <div className="stat-card-label">Opened</div>
        </div>
        <div className="card stat-card amber">
          <div className="stat-card-icon" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--amber-500)' }}>RD</div>
          <div className="stat-card-value">{stats.read || 0}</div>
          <div className="stat-card-label">Read</div>
        </div>
        <div className="card stat-card teal">
          <div className="stat-card-icon" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--teal-600)' }}>CLK</div>
          <div className="stat-card-value">{stats.clicked || 0}</div>
          <div className="stat-card-label">Clicked</div>
        </div>
      </div>

      <div className="grid-2">
        {/* Delivery Funnel */}
        <div className="card">
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Delivery Funnel</h2>
          <div className="funnel-container">
            {[
              { label: 'Sent', key: 'sent', className: 'sent' },
              { label: 'Delivered', key: 'delivered', className: 'delivered' },
              { label: 'Failed', key: 'failed', className: 'failed' },
              { label: 'Opened', key: 'opened', className: 'opened' },
              { label: 'Read', key: 'read', className: 'read' },
              { label: 'Clicked', key: 'clicked', className: 'clicked' },
            ].map((step) => (
              <div key={step.key} className="funnel-step">
                <span className="funnel-label">{step.label}</span>
                <div className="funnel-bar-bg">
                  <div
                    className={`funnel-bar-fill ${step.className}`}
                    style={{
                      width: `${Math.max(((stats[step.key] || 0) / total) * 100, stats[step.key] > 0 ? 8 : 0)}%`,
                    }}
                  >
                    {stats[step.key] > 0 && `${((stats[step.key] / total) * 100).toFixed(0)}%`}
                  </div>
                </div>
                <span className="funnel-count">{stats[step.key] || 0}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Summary + Message Preview */}
        <div className="flex flex-col gap-20">
          {/* AI Performance Summary */}
          <div className="card">
            <div className="flex justify-between items-center mb-16">
              <h2 style={{ fontSize: '16px', fontWeight: 600 }}>AI Insights</h2>
              <button
                className="btn btn-sm btn-primary"
                onClick={handleAISummary}
                disabled={aiLoading || stats.total === 0}
              >
                {aiLoading ? 'Analysing...' : 'Generate'}
              </button>
            </div>
            {aiSummary ? (
              <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                {aiSummary}
              </p>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Click "Generate" to get an AI analysis of this campaign's performance.
              </p>
            )}
          </div>

          {/* Message Preview */}
          <div className="card">
            <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>Message Template</h2>
            <div style={{
              padding: '16px',
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-md)',
              fontSize: '14px',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              color: 'var(--text-secondary)',
            }}>
              {campaign.messageTemplate}
            </div>
          </div>
        </div>
      </div>

      {/* Communication Logs */}
      <div className="card mt-24">
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
          Communication Log ({logs.length} messages)
        </h2>

        {logs.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No messages sent yet</p>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Recipient</th>
                  <th>Channel</th>
                  <th>Status</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {logs.slice(0, 50).map((log) => (
                  <tr key={log._id}>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                      {log.customerId?.name || 'Unknown'}
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {log.customerId?.email}
                      </div>
                    </td>
                    <td>{log.channel}</td>
                    <td>
                      <span className={`badge ${statusColor(log.status)}`}>{log.status}</span>
                    </td>
                    <td style={{ fontSize: '13px' }}>
                      {log.statusHistory?.length > 0
                        ? formatDate(log.statusHistory[log.statusHistory.length - 1].timestamp)
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default CampaignDetail;
