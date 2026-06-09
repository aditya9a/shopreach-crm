// ============================================================
// App Component — Root of the React application
// 
// LAYOUT:
// - Fixed Sidebar (left) — navigation
// - Main Content (center) — pages via React Router
// - AI Copilot (right, toggleable) — chat interface
//
// ROUTING:
// /           → Dashboard
// /customers  → Customers list
// /segments   → Segments management
// /campaigns  → Campaigns list
// /campaigns/:id → Campaign detail with live stats
// ============================================================
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import AICopilot from './components/AICopilot';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Segments from './pages/Segments';
import Campaigns from './pages/Campaigns';
import CampaignDetail from './pages/CampaignDetail';

function App() {
  // Controls whether the AI Copilot sidebar is open
  const [copilotOpen, setCopilotOpen] = useState(false);

  return (
    <Router>
      <div className="app-layout">
        {/* Left Sidebar — always visible */}
        <Sidebar />

        {/* Main Content Area — shifts right when copilot opens */}
        <main className={`main-content ${copilotOpen ? 'copilot-open' : ''}`}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/segments" element={<Segments />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/campaigns/:id" element={<CampaignDetail />} />
          </Routes>
        </main>

        {/* AI Copilot — toggle button + slide-out panel */}
        <AICopilot
          isOpen={copilotOpen}
          onClose={() => setCopilotOpen(false)}
        />

        {/* Copilot toggle button (visible when panel is closed) */}
        {!copilotOpen && (
          <button
            className="copilot-toggle"
            onClick={() => setCopilotOpen(true)}
            title="Open AI Copilot"
          >
            ✨
          </button>
        )}
      </div>
    </Router>
  );
}

export default App;
