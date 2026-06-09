// ============================================================
// AI Copilot Component
// The star feature — a slide-out chat panel where marketers
// can interact with AI in natural language
//
// FEATURES:
// - Chat interface with user/AI messages
// - Sends queries to /api/ai/chat endpoint
// - Detects segment-related queries and offers to create segments
// - Detects message-related queries and generates message drafts
// - Quick action buttons for common tasks
// ============================================================
import { useState, useRef, useEffect } from 'react';
import { aiChat, aiCreateSegment, aiGenerateMessage } from '../services/api';

function AICopilot({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: "👋 Hi! I'm your AI Campaign Copilot for BrewCraft. I can help you:\n\n• **Create segments** — Describe your audience in plain English\n• **Draft messages** — I'll write personalised marketing messages\n• **Analyse campaigns** — Ask about performance insights\n• **Strategy tips** — Get marketing recommendations\n\nTry: \"Find customers who spent more than ₹5000\"",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Handles sending a message to the AI
   * Routes to different AI endpoints based on detected intent
   */
  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // Send to the general chat endpoint — the backend handles intent detection
      const response = await aiChat(userMessage);
      setMessages(prev => [...prev, {
        role: 'ai',
        content: response.data.response,
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: '❌ Sorry, I encountered an error. Please try again. Make sure the Gemini API key is configured.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key to send
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /**
   * Handles clicking a quick action button
   * Pre-fills the input with a common query
   */
  const handleQuickAction = (query) => {
    setInput(query);
  };

  /**
   * Renders message content with basic markdown-like formatting
   * Handles bold (**text**), code blocks, and line breaks
   */
  const renderContent = (content) => {
    // Split by code blocks first
    const parts = content.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, i) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        // Code block
        const code = part.slice(3, -3).replace(/^[a-z]*\n/, ''); // Remove language hint
        return (
          <pre key={i} style={{ 
            background: 'rgba(0,0,0,0.3)', 
            padding: '8px 12px', 
            borderRadius: '8px',
            overflow: 'auto',
            fontSize: '12px',
            margin: '8px 0'
          }}>
            {code}
          </pre>
        );
      }

      // Regular text — handle bold and line breaks
      return (
        <span key={i}>
          {part.split('\n').map((line, j) => (
            <span key={j}>
              {j > 0 && <br />}
              {line.split(/(\*\*.*?\*\*)/g).map((segment, k) => {
                if (segment.startsWith('**') && segment.endsWith('**')) {
                  return <strong key={k}>{segment.slice(2, -2)}</strong>;
                }
                return segment;
              })}
            </span>
          ))}
        </span>
      );
    });
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        className={`copilot-toggle ${isOpen ? 'active' : ''}`}
        onClick={isOpen ? onClose : () => {}}
        style={{ display: isOpen ? 'none' : 'flex' }}
        title="Open AI Copilot"
      >
        ✨
      </button>

      {/* Copilot Panel */}
      <div className={`copilot-panel ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="copilot-header">
          <h2>
            ✨ AI Copilot
            <span className="ai-badge">BETA</span>
          </h2>
          <button className="copilot-close" onClick={onClose}>✕</button>
        </div>

        {/* Messages */}
        <div className="copilot-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`copilot-message ${msg.role}`}>
              {renderContent(msg.content)}
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="copilot-message ai" style={{ display: 'flex', gap: '4px' }}>
              <span className="animate-pulse">●</span>
              <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>●</span>
              <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>●</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        {messages.length <= 1 && (
          <div style={{ padding: '0 16px 8px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {[
              'Find high-value customers',
              'Draft a WhatsApp message for dormant customers',
              'Suggest a re-engagement strategy',
            ].map((action) => (
              <button
                key={action}
                className="btn btn-sm btn-secondary"
                onClick={() => handleQuickAction(action)}
                style={{ fontSize: '12px' }}
              >
                {action}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="copilot-input-area">
          <textarea
            className="copilot-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about your customers..."
            rows={1}
            disabled={loading}
          />
          <button
            className="copilot-send"
            onClick={handleSend}
            disabled={!input.trim() || loading}
          >
            ➤
          </button>
        </div>
      </div>
    </>
  );
}

export default AICopilot;
