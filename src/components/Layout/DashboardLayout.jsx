import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  Briefcase,
  User,
  Home,
  FileText,
  Search,
  Users,
  ChevronDown,
  MapPin,
  Upload,
  Calculator,
  UserCheck,
  Bell,
  FileCheck2,
  BookOpen,
  Map,
  ClipboardList,
  CreditCard,
  Gavel,
  Copy,
  ArrowRightLeft,
  LogOut,
  Settings,
} from 'lucide-react';
import './DashboardLayout.css';
import AiChatView from './AiChatView';

// ─── Karnataka State Services ───────────────────────────────────────────────
const KARNATAKA_SERVICES = [
  { id: 'ec', label: 'Encumbrance Certificate (EC) 2024', icon: FileCheck2, badge: null, hasChevron: true },
  { id: 'rtc', label: 'View RTC (Pahani)', icon: BookOpen, badge: '13', hasChevron: false },
  { id: 'search-survey', label: 'Search Property by Survey No.', icon: Search, badge: null, hasChevron: false },
  { id: 'survey-no', label: 'Find My Survey Number', icon: MapPin, badge: null, hasChevron: false },
  { id: 'khata', label: 'Karnataka Khata Transfer Status', icon: ArrowRightLeft, badge: null, hasChevron: false },
  { id: 'e-aasthi', label: 'E-Aasthi Property Card', icon: CreditCard, badge: null, hasChevron: false },
  { id: 'court', label: 'Revenue Court Case Status', icon: Gavel, badge: null, hasChevron: false },
  { id: 'sale-copy', label: 'Certified Copy of Sale Deeds', icon: Copy, badge: null, hasChevron: false },
  { id: 'conversion', label: 'Land Conversion Status', icon: Map, badge: null, hasChevron: false },
];

// ─── Indian States for dropdown ─────────────────────────────────────────────
const STATES = ['DELHI', 'MAHARASHTRA', 'TELANGANA', 'KARNATAKA'];

// ─── Activity Feed Data ──────────────────────────────────────────────────────
const ACTIVITY_DATA = [
  {
    id: 1,
    type: 'ec',
    iconClass: 'green',
    icon: FileCheck2,
    title: 'EC Status',
    link: 'Download',
    desc: 'Application for Sy No. 120, Jayanagar · Approved.',
    time: '3 hom ago',
  },
  {
    id: 2,
    type: 'case',
    iconClass: 'blue',
    icon: Gavel,
    title: 'Case Update',
    link: null,
    desc: 'Land dispute in Mysuru Revenue Court has next hearing on 25th Aug',
    time: '1 dag',
  },
  {
    id: 3,
    type: 'alert',
    iconClass: 'amber',
    icon: Bell,
    title: 'Document Alert',
    link: null,
    desc: '3 new sale deeds registered in your tracked area (JP Nagar)',
    time: '13m ago',
  },
  {
    id: 4,
    type: 'ec',
    iconClass: 'purple',
    icon: ClipboardList,
    title: 'Document Alert',
    link: null,
    desc: '2 new properties matched your saved search criteria in Whitefield',
    time: '1h ago',
  },
];

// ─── Smart Tools ─────────────────────────────────────────────────────────────
const SMART_TOOLS = [
  {
    id: 'property-search',
    label: 'Start New Property Search',
    sub: 'Bhoomi data access',
    icon: Search,
    color: 'green',
  },
  {
    id: 'stamp-duty',
    label: 'Calculate Stamp Duty',
    sub: 'Instant estimate',
    icon: Calculator,
    color: 'blue',
  },

  {
    id: 'consult-lawyer',
    label: 'Consult a KA Land Lawyer',
    sub: 'Consult a KA Land',
    icon: UserCheck,
    color: 'orange',
  },
  {
    id: 'ocr',
    label: 'Ingest Deeds (OCR)',
    sub: 'Upload & extract text',
    icon: Upload,
    color: 'teal',
  },
];


// ─── DashboardLayout Component ───────────────────────────────────────────────
export default function DashboardLayout({ children, activePanel, onToolSelect, onLogout, onProfileSelect, onCasesSelect }) {
  const [selectedState, setSelectedState] = useState('KARNATAKA (KA)');
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [activeNavItem, setActiveNavItem] = useState('dashboard');
  const [activeTopLink, setActiveTopLink] = useState('home');

  const stateRef = useRef(null);
  const userRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (stateRef.current && !stateRef.current.contains(e.target)) {
        setStateDropdownOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStateSelect = (state) => {
    setSelectedState(state);
    setStateDropdownOpen(false);
  };

  return (
    <div className="dashboard-shell">
      {/* ══ LEFT SIDEBAR ══════════════════════════════════════════════════ */}
      <aside className="dashboard-sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <img
            src="/kanoon-logo.png"
            alt="Kanoon Saathi Logo"
            className="sidebar-logo-img"
          />
          <div className="sidebar-logo-text">
            <h2>Kanoon Saathi</h2>
            <p>Legal AI Assistant for Indian Citizens</p>
          </div>
        </div>

        {/* Primary Navigation */}
        <nav className="sidebar-primary-nav">
          {[
            { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
            { id: 'ai-chat', label: 'AI Chat', Icon: MessageSquare },
            { id: 'my-cases', label: 'My Cases', Icon: Briefcase },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              className={`sidebar-nav-item ${activeNavItem === id ? 'active' : ''}`}
              onClick={() => {
                setActiveNavItem(id);
                if (id === 'dashboard' && onToolSelect) {
                  onToolSelect('back');
                } else if (id === 'my-cases' && onCasesSelect) {
                  onCasesSelect();
                }
              }}
              id={`sidebar-nav-${id}`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>

        {/* Karnataka State Services */}
        <div className="sidebar-services">
          <div className="sidebar-services-header">{selectedState.replace(/\s*\(.*?\)/, '')} State Services</div>
          <div className="sidebar-services-list">
            {KARNATAKA_SERVICES.map(({ id, label, icon: Icon, badge, hasChevron }) => (
              <button
                key={id}
                className="sidebar-service-item"
                id={`service-${id}`}
              >
                <span className="sidebar-service-item-left">
                  <span className="sidebar-service-icon">
                    <Icon size={13} color="#3f4e5e" />
                  </span>
                  <span>{label}</span>
                </span>
                {badge && <span className="sidebar-service-badge">{badge}</span>}
                {hasChevron && !badge && <ChevronDown size={12} color="#a8b4c0" />}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* ══ MAIN COLUMN ═══════════════════════════════════════════════════ */}
      <div className="dashboard-main">
        {/* ── TOP NAVIGATION BAR ─────────────────────────────────────────── */}
        <header className="dashboard-topnav" id="app-topnav">
          <nav className="topnav-links">
            {[
              { id: 'home', label: 'Home', Icon: Home },
              { id: 'my-documents', label: 'My Documents', Icon: FileText },
              { id: 'legal-search', label: 'Legal Search', Icon: Search },
              { id: 'consultations', label: 'Consultations', Icon: Users },
            ].map(({ id, label, Icon }) => (
              <button
                key={id}
                className={`topnav-link ${activeTopLink === id ? 'active' : ''}`}
                onClick={() => setActiveTopLink(id)}
                id={`topnav-${id}`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </nav>

          {/* Right cluster */}
          <div className="topnav-right">
            {/* AWS Connected Badge */}
            <div className="topnav-aws-badge" id="aws-status-badge">
              <span className="topnav-aws-dot" />
              AWS Connected
            </div>

            {/* User Dropdown */}
            <div className="topnav-user-wrapper" ref={userRef} style={{ position: 'relative' }}>
              <button
                className={`topnav-user ${userDropdownOpen ? 'open' : ''}`}
                onClick={() => setUserDropdownOpen((o) => !o)}
                id="user-profile-btn"
              >
                <div className="topnav-user-avatar" style={{ background: 'none', border: '1.5px solid #e2e8f0' }}>
                  <User size={17} color="#3f4e5e" />
                </div>
                <span className="topnav-user-name">My Profile</span>
                <ChevronDown size={14} className="topnav-user-chevron" />
              </button>
              {userDropdownOpen && (
                <div className="topnav-user-dropdown" id="user-dropdown-menu">
                  <button className="topnav-user-dropdown-item" onClick={() => { onProfileSelect && onProfileSelect(); setUserDropdownOpen(false); }}>
                    <User size={14} /> My Profile
                  </button>
                  <button className="topnav-user-dropdown-item">
                    <Settings size={14} /> Settings
                  </button>
                  <button className="topnav-user-dropdown-item" style={{ color: '#ef4444' }} onClick={onLogout} id="signout-btn">
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── SCROLLABLE CONTENT ──────────────────────────────────────────── */}
        <div className="dashboard-content">
          {/* ── AI CHAT VIEW ── */}
          {activeNavItem === 'ai-chat' ? (
            <AiChatView />
          ) : (
            <>
              {/* Workspace Header */}
              <div className="workspace-header">
                <div className="workspace-header-top">
                  <h1>My Legal Workspace</h1>
                  <div className="workspace-search">
                    <Search size={15} />
                    <input
                      type="text"
                      placeholder="Search by Survey Number, Case ID, or Document Type..."
                      id="workspace-search-input"
                    />
                  </div>
                </div>

                {/* State Dropdown + Flag Icons */}
                <div className="workspace-controls">
                  <div className="state-dropdown-wrapper" ref={stateRef}>
                    <button
                      className="state-dropdown-btn"
                      onClick={() => setStateDropdownOpen((o) => !o)}
                      id="state-dropdown-btn"
                    >
                      <MapPin size={14} />
                      STATE: {selectedState}
                      <ChevronDown size={14} style={{ transition: 'transform 0.15s', transform: stateDropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
                    </button>

                    {stateDropdownOpen && (
                      <div className="state-dropdown-menu" id="state-dropdown-menu">
                        {STATES.map((state) => (
                          <button
                            key={state}
                            className="state-dropdown-option"
                            onClick={() => handleStateSelect(state)}
                            id={`state-option-${state.replace(/\s+/g, '-').toLowerCase()}`}
                          >
                            {state}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Flag icons cluster */}
                  <div className="state-flag-icons">
                    <div className="state-flag-icon" title="Indian Flag">🇮🇳</div>
                  </div>
                </div>
              </div>

              {/* Smart Tools */}
              {(activePanel !== 'profile' && activePanel !== 'cases') && (
                <div className="smart-tools-section">
                  <div className="smart-tools-title">Smart Tools</div>
                  <div className="smart-tools-grid">
                    {SMART_TOOLS.map(({ id, label, sub, icon: Icon, color }) => (
                      <button
                        key={id}
                        className={`tool-card ${color} ${activePanel === 'ocr' && id === 'ocr' ? 'active-tool' : ''}`}
                        onClick={() => onToolSelect && onToolSelect(id)}
                        id={`tool-card-${id}`}
                      >
                        <div className="tool-card-icon">
                          <Icon size={18} />
                        </div>
                        <div className="tool-card-title">{label}</div>
                        <div className="tool-card-sub">{sub}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Lower area: Activity or OCR panel */}
              <div className="dashboard-lower">
                {/* Main panel — Activity or OCR or Profile or Cases */}
                {activePanel === 'profile' || activePanel === 'cases' ? (
                  <div className="profile-panel" style={activePanel === 'cases' ? {height: '100%'} : {}}>
                    {children}
                  </div>
                ) : activePanel === 'ocr' || activePanel === 'processing' || activePanel === 'results' ? (
                  <div className="ocr-panel">
                    {/* Back button shown when not on upload */}
                    {(activePanel === 'processing' || activePanel === 'results') && (
                      <button className="ocr-panel-back" onClick={() => onToolSelect && onToolSelect('back')}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="19" y1="12" x2="5" y2="12" />
                          <polyline points="12 19 5 12 12 5" />
                        </svg>
                        Back to Dashboard
                      </button>
                    )}
                    {children}
                  </div>
                ) : (
                  <>
                    {/* Recent Activity Panel */}
                    <div className="activity-panel">
                      <div className="activity-panel-title">Recent Activity &amp; Alerts</div>
                      <div className="activity-list">
                        {ACTIVITY_DATA.map((item) => {
                          const Icon = item.icon;
                          return (
                            <div key={item.id} className="activity-item">
                              <div className={`activity-item-icon ${item.iconClass}`}>
                                <Icon size={16} />
                              </div>
                              <div className="activity-item-body">
                                <div className="activity-item-title">
                                  {item.title}
                                  {item.link && <a href="#">{item.link}</a>}
                                </div>
                                <div className="activity-item-desc">{item.desc}</div>
                              </div>
                              <div className="activity-item-time">{item.time}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
