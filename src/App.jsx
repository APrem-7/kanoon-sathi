import React, { useState, useEffect } from 'react';
import Header from './components/Layout/Header';
import UploadZone from './components/Upload/UploadZone';
import StatusTracker from './components/Processing/StatusTracker';
import TextViewer from './components/OCRResult/TextViewer';
import SaleDeedChart from './components/OCRResult/SaleDeedChart';
import { parseSaleDeed } from './utils/saleDeedParser';
import { simulateOCR } from './api/client';
import './index.css';

function App() {
  const [currentView, setCurrentView] = useState('upload'); // 'upload', 'processing', 'results'
  const [uploadInfo, setUploadInfo] = useState(null); // { serialNo, fileName, s3Path, ... }
  const [jobData, setJobData] = useState(null); // { status, text, ... }
  const [parsedData, setParsedData] = useState(null);
  const [activeTab, setActiveTab] = useState('flowchart'); // 'flowchart', 'text'

  // Handle successful file upload
  const handleUploadSuccess = (info) => {
    setUploadInfo(info);
    setCurrentView('processing');
  };

  // Handle OCR completion
  const handleProcessingComplete = (job) => {
    setJobData(job);
    if (job.text) {
      setParsedData(parseSaleDeed(job.text));
    }
    setCurrentView('results');
  };

  // For testing/demo purposes: simulate a webhook call
  const triggerSimulation = async () => {
    if (!uploadInfo?.serialNo) return;
    try {
      await simulateOCR(uploadInfo.serialNo, '');
      console.log('Simulated OCR result injected.');
    } catch (err) {
      console.error('Simulation failed', err);
    }
  };

  // Allow resetting flow
  const handleReset = () => {
    setUploadInfo(null);
    setJobData(null);
    setParsedData(null);
    setCurrentView('upload');
  };

  return (
    <div className="app-layout">
      <div className="app-main">
        <Header 
          currentView={currentView === 'processing' ? 'upload' : currentView} 
          onViewChange={(view) => {
            if (view === 'upload') handleReset();
          }} 
        />
        
        <main className="app-content">
          {currentView === 'upload' && (
            <UploadZone onUploadSuccess={handleUploadSuccess} />
          )}

          {currentView === 'processing' && (
            <div className="animate-fadeIn">
              <StatusTracker 
                uploadInfo={uploadInfo} 
                onComplete={handleProcessingComplete} 
              />
              
              {/* Dev Helper - Hidden in prod */}
              <div style={{ marginTop: '50px', textAlign: 'center', opacity: 0.3 }}>
                <button 
                  onClick={triggerSimulation}
                  style={{ fontSize: '10px', background: 'transparent', border: '1px solid #333', padding: '4px 8px', borderRadius: '4px' }}
                >
                  Force Webhook (Dev)
                </button>
              </div>
            </div>
          )}

          {currentView === 'results' && (
            <div className="results-container animate-fadeIn">
              <button className="results-back-btn" onClick={handleReset}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                Process Another Document
              </button>

              <div className="results-header">
                <h2>Analysis Complete</h2>
                <p>Document: {uploadInfo?.fileName || 'Unknown'} (Serial: {uploadInfo?.serialNo || 'Unknown'})</p>
              </div>

              {parsedData && (
                <div className="results-confidence">
                  <div>
                    <div className="results-confidence-score">{parsedData.confidence}%</div>
                    <div className="results-confidence-label">Extraction Confidence</div>
                  </div>
                  <div className="results-confidence-bar">
                    <div 
                      className="results-confidence-fill" 
                      style={{ width: `${parsedData.confidence}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="results-tabs">
                <button 
                  className={`results-tab ${activeTab === 'flowchart' ? 'active' : ''}`}
                  onClick={() => setActiveTab('flowchart')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="9" y1="21" x2="9" y2="9" />
                  </svg>
                  Visual Flowchart
                </button>
                <button 
                  className={`results-tab ${activeTab === 'text' ? 'active' : ''}`}
                  onClick={() => setActiveTab('text')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                  Raw Extracted Text
                </button>
              </div>

              <div style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-md)' }}>
                {activeTab === 'flowchart' ? (
                  <SaleDeedChart parsedData={parsedData} />
                ) : (
                  <TextViewer text={jobData?.text} jobId={uploadInfo?.serialNo} />
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
