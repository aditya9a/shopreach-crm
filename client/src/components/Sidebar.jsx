// ============================================================
// Sidebar Component
// The main navigation sidebar for the app
// Shows the ShopReach logo and navigation links
// ============================================================
import { useLocation, useNavigate } from 'react-router-dom';

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation items with text icons (no emojis)
  const navItems = [
    { path: '/', icon: '▦', label: 'Dashboard' },
    { path: '/customers', icon: '⊞', label: 'Customers' },
    { path: '/segments', icon: '◎', label: 'Segments' },
    { path: '/campaigns', icon: '▷', label: 'Campaigns' },
  ];

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">S</div>
        <div>
          <h1>ShopReach</h1>
          <span>BrewCraft CRM</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Footer info */}
      <div style={{ 
        padding: '16px', 
        fontSize: '11px', 
        color: 'var(--text-muted)',
        borderTop: '1px solid var(--border-color)',
        marginTop: '16px'
      }}>
        <div style={{ marginBottom: '4px' }}>AI-Powered Mini CRM</div>
        <div>Built for Xeno Assignment</div>
      </div>
    </aside>
  );
}

export default Sidebar;
