// ============================================================
// Customers Page
// Lists all customers with search, pagination, and detail view
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { getCustomers } from '../services/api';

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Fetch customers with current search and page
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCustomers({ search, page, limit: 15 });
      setCustomers(res.data.customers);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Debounced search — reset to page 1 when searching
  useEffect(() => {
    setPage(1);
  }, [search]);

  // Format currency
  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  // Format date to readable string
  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="flex justify-between items-center">
          <div>
            <h1>Customers</h1>
            <p>{total.toLocaleString()} shoppers in your BrewCraft CRM</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Customer Table */}
      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : customers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <h3>No customers found</h3>
          <p>Try adjusting your search or seed some data</p>
        </div>
      ) : (
        <>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>Total Spend</th>
                  <th>Orders</th>
                  <th>Avg Order</th>
                  <th>Last Order</th>
                  <th>Tags</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr
                    key={customer._id}
                    onClick={() => setSelectedCustomer(customer)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {customer.name}
                    </td>
                    <td>{customer.email}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(customer.totalSpend)}</td>
                    <td>{customer.totalOrders}</td>
                    <td>{formatCurrency(customer.avgOrderValue)}</td>
                    <td>{formatDate(customer.lastOrderDate)}</td>
                    <td>
                      <div className="flex gap-4" style={{ gap: '4px' }}>
                        {customer.tags?.map((tag) => (
                          <span key={tag} className={`badge ${
                            tag === 'high-value' ? 'badge-teal' :
                            tag === 'loyal' ? 'badge-purple' :
                            tag === 'new' ? 'badge-green' :
                            tag === 'dormant' ? 'badge-rose' :
                            'badge-amber'
                          }`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-16" style={{ padding: '0 4px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Page {page} of {totalPages} • {total} customers
            </span>
            <div className="flex gap-8">
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ← Previous
              </button>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next →
              </button>
            </div>
          </div>
        </>
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="modal-overlay" onClick={() => setSelectedCustomer(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedCustomer.name}</h2>
              <button className="modal-close" onClick={() => setSelectedCustomer(null)}>✕</button>
            </div>

            <div className="flex flex-col gap-16">
              <div className="grid-2">
                <div>
                  <div className="form-label">Email</div>
                  <div style={{ fontSize: '14px' }}>{selectedCustomer.email}</div>
                </div>
                <div>
                  <div className="form-label">Phone</div>
                  <div style={{ fontSize: '14px' }}>{selectedCustomer.phone || '—'}</div>
                </div>
              </div>

              <div className="grid-2">
                <div className="card stat-card purple" style={{ padding: '16px' }}>
                  <div className="stat-card-value" style={{ fontSize: '24px' }}>
                    {formatCurrency(selectedCustomer.totalSpend)}
                  </div>
                  <div className="stat-card-label">Total Spend</div>
                </div>
                <div className="card stat-card teal" style={{ padding: '16px' }}>
                  <div className="stat-card-value" style={{ fontSize: '24px' }}>
                    {selectedCustomer.totalOrders}
                  </div>
                  <div className="stat-card-label">Total Orders</div>
                </div>
              </div>

              <div className="grid-2">
                <div>
                  <div className="form-label">First Order</div>
                  <div style={{ fontSize: '14px' }}>{formatDate(selectedCustomer.firstOrderDate)}</div>
                </div>
                <div>
                  <div className="form-label">Last Order</div>
                  <div style={{ fontSize: '14px' }}>{formatDate(selectedCustomer.lastOrderDate)}</div>
                </div>
              </div>

              <div>
                <div className="form-label">Tags</div>
                <div className="flex gap-8" style={{ marginTop: '4px' }}>
                  {selectedCustomer.tags?.length > 0 ? (
                    selectedCustomer.tags.map((tag) => (
                      <span key={tag} className="badge badge-purple">{tag}</span>
                    ))
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No tags</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Customers;
