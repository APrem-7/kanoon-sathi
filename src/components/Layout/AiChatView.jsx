import React, { useState } from 'react';
import { Shield, Map, FileText, GitBranch, ArrowUp } from 'lucide-react';

// ─── Prompt Cards Data ──────────────────────────────────────────────────────
const PROMPT_CARDS = [
  {
    id: 'know-before-buy',
    icon: Shield,
    iconBg: '#ede9fe',
    iconColor: '#7c3aed',
    title: 'Know Before You Buy',
    desc: 'Title, ownership, red flags — the ground truth on any property before you pay.',
    highlight: false,
  },
  {
    id: 'explore-map',
    icon: Map,
    iconBg: '#d1fae5',
    iconColor: '#059669',
    title: 'Explore the Map',
    desc: 'Search any property, drop a pin, see what the records say.',
    highlight: false,
  },
  {
    id: 'certified-proof',
    icon: FileText,
    iconBg: '#ede9fe',
    iconColor: '#7c3aed',
    title: 'Get Certified Proof',
    desc: 'EC, sale deed, RoR, tax record — pulled, certified, and read against the source. Confirms loans, ownership, and transfers.',
    highlight: false,
  },
  {
    id: 'ancestral-records',
    icon: GitBranch,
    iconBg: '#fef9c3',
    iconColor: '#ca8a04',
    title: 'Ancestral Records',
    desc: "Trace a property's full ownership lineage across generations. See every transfer, owner, and title change.",
    highlight: true,
  },
];

// ─── AiChatView Component ────────────────────────────────────────────────────
export default function AiChatView() {
  const [inputValue, setInputValue] = useState('');
  const [activeCard, setActiveCard] = useState(null);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    // placeholder — future: hook up to AI API
    setInputValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="ai-chat-view">
      {/* ── Header ── */}
      <div className="ai-chat-header">
        <h1 className="ai-chat-title">What brings you here today?</h1>
        <p className="ai-chat-subtitle">
          <span className="ai-chat-brand">Kanoon AI</span>{' '}
          will guide you from there.
        </p>
      </div>

      {/* ── 2x2 Prompt Grid ── */}
      <div className="ai-chat-grid">
        {PROMPT_CARDS.map(({ id, icon: Icon, iconBg, iconColor, title, desc, highlight }) => (
          <button
            key={id}
            id={`ai-prompt-${id}`}
            className={`ai-prompt-card${activeCard === id ? ' selected' : ''}${highlight ? ' highlighted' : ''}`}
            onClick={() => setActiveCard(activeCard === id ? null : id)}
          >
            <div className="ai-prompt-icon" style={{ background: iconBg }}>
              <Icon size={22} color={iconColor} strokeWidth={1.8} />
            </div>
            <div
              className="ai-prompt-title"
              style={highlight ? { color: '#7c3aed' } : undefined}
            >
              {title}
            </div>
            <div className="ai-prompt-desc">{desc}</div>
          </button>
        ))}
      </div>

      {/* ── Chat Input Bar ── */}
      <div className="ai-chat-input-row">
        <div className="ai-chat-input-bar">
          <input
            type="text"
            className="ai-chat-input"
            placeholder="Ask Kanoon AI..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            id="ai-chat-input"
          />
          <button
            className={`ai-chat-send${inputValue.trim() ? ' active' : ''}`}
            onClick={handleSend}
            id="ai-chat-send-btn"
            aria-label="Send message"
          >
            <ArrowUp size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
