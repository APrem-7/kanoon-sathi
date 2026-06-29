import React from 'react';
import './Header.css';

export default function Header({ currentView, onViewChange }) {
  return (
    <header className="header" id="app-header">
      <div className="header-brand">
        <div className="header-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <div>
          <h1 className="header-title">Kanoon Saathi</h1>
          <p className="header-subtitle">Legal Document Intelligence</p>
        </div>
      </div>

      <nav className="header-nav">
        <button
          className={`header-nav-btn ${currentView === 'upload' ? 'active' : ''}`}
          onClick={() => onViewChange('upload')}
          id="nav-upload"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Upload
        </button>
        <button
          className={`header-nav-btn ${currentView === 'results' ? 'active' : ''}`}
          onClick={() => onViewChange('results')}
          id="nav-results"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          Results
        </button>
      </nav>

      <div className="header-status">
        <span className="header-status-dot"></span>
        AWS Connected
      </div>
    </header>
  );
}
