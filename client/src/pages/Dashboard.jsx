// ============================================================
// Dashboard Page
// The main overview page showing key metrics and recent activity
// 
// FEATURES:
// - Animated stat cards (total customers, revenue, campaigns, segments)
// - Recent campaigns with status
// - Quick actions to create segments/campaigns
// ============================================================
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCustomerStats, getCampaigns, getSegments } from '../services/api';

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all dashboard data on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, campaignsRes, segmentsRes] = await Promise.all([
          getCustomerStats(),
          getCampaigns(),
          getSegments(),
        ]);
        setStats(statsRes.data);
        setCampaigns(campaignsRes.data);
        setSegments(segmentsRes.data);
      } catch (error) {
        console.error('Dashboard fetch error:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Format currency (Indian Rupees)
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Status badge color mapping
  const statusBadge = (status) => {
    const map = {
      draft: 'badge-amber',
      sending: 'badge-blue',
      sent: 'badge-teal',
      completed: 'badge-green',
    };
    return map[status] || 'badge-purple';
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back! Here's how BrewCraft is performing.</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="card stat-card purple" style={{ animationDelay: '0s' }}>
          <div className="stat-card-icon" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--purple-600)' }}>CU</div>
          <div className="stat-card-value">{stats?.totalCustomers?.toLocaleString() || 0}</div>
          <div className="stat-card-label">Total Customers</div>
        </div>

        <div className="card stat-card teal" style={{ animationDelay: '0.1s' }}>
          <div className="stat-card-icon" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--teal-600)' }}>REV</div>
          <div className="stat-card-value">{formatCurrency(stats?.totalRevenue || 0)}</div>
          <div className="stat-card-label">Total Revenue</div>
        </div>

        <div className="card stat-card blue" style={{ animationDelay: '0.2s' }}>
          <div className="stat-card-icon" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--blue-500)' }}>CA</div>
          <div className="stat-card-value">{campaigns.length}</div>
          <div className="stat-card-label">Campaigns</div>
        </div>

        <div className="card stat-card amber" style={{ animationDelay: '0.3s' }}>
          <div className="stat-card-icon" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--amber-500)' }}>SG</div>
          <div className="stat-card-value">{segments.length}</div>
          <div className="stat-card-label">Active Segments</div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid-2">
        {/* Recent Campaigns */}
        <div className="card">
          <div className="flex justify-between items-center mb-16">
            <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Recent Campaigns</h2>
            <button className="btn btn-sm btn-primary" onClick={() => navigate('/campaigns')}>
              View All
            </button>
          </div>

          {campaigns.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px' }}>
              <div className="empty-state-icon" style={{ fontSize: '36px', fontWeight: 700, color: 'var(--text-muted)' }}>No data</div>
              <h3>No campaigns yet</h3>
              <p style={{ fontSize: '13px' }}>Create your first campaign to reach your customers</p>
              <button className="btn btn-sm btn-primary mt-16" onClick={() => navigate('/campaigns')}>
                Create Campaign
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-12">
              {campaigns.slice(0, 5).map((campaign) => (
                <div
                  key={campaign._id}
                  className="flex justify-between items-center"
                  style={{
                    padding: '12px 16px',
                    background: 'var(--bg-card)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                  }}
                  onClick={() => navigate(`/campaigns/${campaign._id}`)}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{campaign.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {campaign.channel} • {campaign.stats?.total || 0} recipients
                    </div>
                  </div>
                  <span className={`badge ${statusBadge(campaign.status)}`}>
                    {campaign.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions + Segments Overview */}
        <div className="flex flex-col gap-20">
          {/* Quick Actions */}
          <div className="card">
            <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Quick Actions</h2>
            <div className="flex flex-col gap-8">
              <button className="btn btn-secondary" onClick={() => navigate('/segments')} style={{ width: '100%', justifyContent: 'flex-start' }}>
                Create a Segment
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/campaigns')} style={{ width: '100%', justifyContent: 'flex-start' }}>
                Launch a Campaign
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/customers')} style={{ width: '100%', justifyContent: 'flex-start' }}>
                Browse Customers
              </button>
            </div>
          </div>

          {/* Segments Overview */}
          <div className="card">
            <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Top Segments</h2>
            {segments.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No segments created yet</p>
            ) : (
              <div className="flex flex-col gap-8">
                {segments.slice(0, 4).map((segment) => (
                  <div
                    key={segment._id}
                    className="flex justify-between items-center"
                    style={{
                      padding: '10px 14px',
                      background: 'var(--bg-card)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>{segment.name}</span>
                    <span className="badge badge-purple">{segment.customerCount} customers</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Avg Metrics */}
          <div className="card">
            <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Customer Insights</h2>
            <div className="flex flex-col gap-12">
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Avg. Spend per Customer</span>
                <span style={{ fontWeight: 700 }}>{formatCurrency(stats?.avgSpend || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Avg. Orders per Customer</span>
                <span style={{ fontWeight: 700 }}>{(stats?.avgOrders || 0).toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
