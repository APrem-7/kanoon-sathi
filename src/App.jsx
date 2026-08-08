import React, { useState, useMemo } from 'react';
import DashboardLayout from './components/Layout/DashboardLayout';
import AuthPage from './components/Auth/AuthPage';
import UploadZone from './components/Upload/UploadZone';
import StatusTracker from './components/Processing/StatusTracker';
import TextViewer from './components/OCRResult/TextViewer';
import OwnershipGraph from './components/OCRResult/OwnershipGraph';
import AISummary from './components/OCRResult/AISummary';
import TimelineView from './components/OCRResult/TimelineView';
import EntitiesView from './components/OCRResult/EntitiesView';
import AnomaliesView from './components/OCRResult/AnomaliesView';
import MyProfile from './components/Profile/MyProfile';
import MyCases from './components/Cases/MyCases';
import { analyzeDocument } from './api/client';
import { FileText, Network, Calendar, Database, AlignLeft, MapPin, AlertTriangle } from 'lucide-react';
import './index.css';
import './components/OCRResult/Results.css';

function App() {
  // ── Authentication state ─────────────────────────────────────────────────
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // ── OCR pipeline state (unchanged from original) ──────────────────────────
  const [currentView, setCurrentView] = useState('upload'); // 'upload', 'processing', 'results'
  const [uploadInfo, setUploadInfo] = useState(null);
  const [jobData, setJobData] = useState(null);
  const [propertiesList, setPropertiesList] = useState([]); // Array of per-property analysis objects
  const [activePropertyIdx, setActivePropertyIdx] = useState(0); // Currently selected property index
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'graph', 'timeline', 'entities', 'raw'

  // ── Dashboard UI state ────────────────────────────────────────────────────
  // 'dashboard' = show activity feed; 'ocr' = show OCR upload
  const [dashboardPanel, setDashboardPanel] = useState('dashboard');
  
  // Shared user profile state
  const [profileData, setProfileData] = useState({
    fullName: 'USER',
    email: 'user@example.com',
    role: 'Job Title / Role',
    company: 'Organization Name',
    practiceArea: 'Domain / Specialization'
  });

  // Derive the currently selected property's data
  const parsedData = useMemo(() => {
    if (propertiesList.length === 0) return null;
    return propertiesList[activePropertyIdx] || propertiesList[0];
  }, [propertiesList, activePropertyIdx]);

  // Handle successful file upload (unchanged)
  const handleUploadSuccess = (info) => {
    setUploadInfo(info);
    setCurrentView('processing');
  };

  // Handle OCR completion (unchanged)
  const handleProcessingComplete = async (job) => {
    setJobData(job);
    setCurrentView('results');
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      if (!job || !job.text) {
        throw new Error('No extracted OCR text found in the completed job.');
      }

      // The job text contains the combined text of all merged documents.
      // Run multi-property analysis using Gemini LLM.
      const result = await analyzeDocument(job.text);

      // New shape: { properties: [...] }
      if (result.properties && Array.isArray(result.properties) && result.properties.length > 0) {
        setPropertiesList(result.properties);
        setActivePropertyIdx(0);
      } else {
        // Backward compatibility: if the API returns the old flat shape, wrap it
        setPropertiesList([{
          propertyId: 'prop-1',
          propertyName: 'Property',
          propertyIdentifiers: {},
          ...result
        }]);
        setActivePropertyIdx(0);
      }
    } catch (error) {
      console.error('Failed to analyze documents with LLM:', error);
      setAnalysisError(error.message || 'Analysis failed');
      setActiveTab('raw'); // Fallback to raw OCR tab
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Reset entire OCR flow and return to dashboard
  const handleReset = () => {
    setUploadInfo(null);
    setJobData(null);
    setPropertiesList([]);
    setActivePropertyIdx(0);
    setCurrentView('upload');
    setDashboardPanel('dashboard');
  };

  // Handle smart tool card selection from DashboardLayout
  const handleToolSelect = (toolId) => {
    if (toolId === 'ocr') {
      setDashboardPanel('ocr');
      setCurrentView('upload'); // always start fresh at upload step
    } else if (toolId === 'back') {
      handleReset();
    } else {
      // Non-OCR tools — placeholder for future implementation
      setDashboardPanel('dashboard');
    }
  };

  // Derive which panel to show in the layout
  let activePanelForLayout = 'dashboard';
  if (currentView === 'profile' || currentView === 'cases') {
    activePanelForLayout = currentView;
  } else if (dashboardPanel === 'ocr' || currentView === 'processing' || currentView === 'results') {
    activePanelForLayout = currentView === 'upload' ? 'ocr' : currentView;
  }

  const isMultiProperty = propertiesList.length > 1;

  // Show auth gate if not authenticated
  if (!isAuthenticated) {
    return <AuthPage onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <DashboardLayout
      activePanel={activePanelForLayout}
      onToolSelect={handleToolSelect}
      onLogout={() => setIsAuthenticated(false)}
      onProfileSelect={() => setCurrentView('profile')}
      onCasesSelect={() => setCurrentView('cases')}
    >
      {/* ── Upload View ─────────────────────────────────────────────────── */}
      {currentView === 'upload' && dashboardPanel === 'ocr' && (
        <UploadZone onUploadSuccess={handleUploadSuccess} />
      )}

      {/* ── Processing View ──────────────────────────────────────────────── */}
      {currentView === 'processing' && (
        <div className="animate-fadeIn">
          <StatusTracker
            uploadInfo={uploadInfo}
            onComplete={handleProcessingComplete}
          />
        </div>
      )}

      {/* ── Results View ─────────────────────────────────────────────────── */}
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
            <p>
              {uploadInfo?.queue
                ? `Deeds Group: ${uploadInfo.queue.map(i => `${i.file?.name || i.fileName} (${i.serialNo})`).join(', ')}`
                : `Document: ${uploadInfo?.fileName || 'Unknown'} (Serial: ${uploadInfo?.serialNo || 'Unknown'})`}
            </p>
          </div>

          {isAnalyzing ? (
            <div className="analysis-loading-container animate-fadeIn">
              <div className="analysis-spinner-wrapper">
                <div className="analysis-spinner-ring"></div>
                <div className="analysis-spinner-ring"></div>
                <div className="analysis-spinner-ring"></div>
                <div className="analysis-spinner-ring"></div>
                <div className="analysis-spinner-icon">
                  <FileText size={28} />
                </div>
              </div>
              <h3 className="analysis-loading-title">
                {uploadInfo?.queue
                  ? 'AI is identifying properties and synthesizing title deeds...'
                  : 'AI is analyzing the document...'}
              </h3>
              <p className="analysis-loading-subtitle">
                {uploadInfo?.queue
                  ? 'Detecting distinct properties, grouping related deeds, and building ownership graphs for each.'
                  : 'Extracting legal intelligence, mapping property boundaries, and building the ownership graph.'}
              </p>
            </div>
          ) : (
            <>
              {analysisError && (
                <div className="analysis-error-panel">
                  <div className="analysis-error-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                  </div>
                  <div className="analysis-error-content">
                    <h4>Analysis Failed</h4>
                    <div className="analysis-error-desc">{analysisError}</div>
                    <p className="analysis-error-fallback">Falling back to raw extracted text. Please check your backend logs or Gemini API key configuration.</p>
                  </div>
                </div>
              )}

              {/* Property Selector — shown only when multiple properties are detected */}
              {isMultiProperty && (
                <div className="property-selector-container animate-fadeIn">
                  <div className="property-selector-label">
                    <MapPin size={16} />
                    <span>{propertiesList.length} Properties Detected</span>
                  </div>
                  <div className="property-selector-pills">
                    {propertiesList.map((prop, idx) => (
                      <button
                        key={prop.propertyId || idx}
                        className={`property-selector-pill ${idx === activePropertyIdx ? 'active' : ''}`}
                        onClick={() => setActivePropertyIdx(idx)}
                        title={prop.propertyName}
                      >
                        <span className="property-pill-index">{idx + 1}</span>
                        <span className="property-pill-name">{prop.propertyName || `Property ${idx + 1}`}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="results-tabs-wrapper">
                <div className="results-tabs-list">
                  <button
                    className={`results-tab-trigger ${activeTab === 'summary' ? 'active' : ''}`}
                    onClick={() => setActiveTab('summary')}
                  >
                    <FileText size={16} /> AI Summary
                  </button>
                  <button
                    className={`results-tab-trigger ${activeTab === 'graph' ? 'active' : ''}`}
                    onClick={() => setActiveTab('graph')}
                  >
                    <Network size={16} /> Ownership Graph
                  </button>
                  <button
                    className={`results-tab-trigger ${activeTab === 'timeline' ? 'active' : ''}`}
                    onClick={() => setActiveTab('timeline')}
                  >
                    <Calendar size={16} /> Timeline
                  </button>
                  <button
                    className={`results-tab-trigger ${activeTab === 'entities' ? 'active' : ''}`}
                    onClick={() => setActiveTab('entities')}
                  >
                    <Database size={16} /> Entities
                  </button>
                  <button
                    className={`results-tab-trigger ${activeTab === 'raw' ? 'active' : ''}`}
                    onClick={() => setActiveTab('raw')}
                  >
                    <AlignLeft size={16} /> Raw OCR
                  </button>
                  <button
                    className={`results-tab-trigger ${activeTab === 'anomalies' ? 'active' : ''}`}
                    onClick={() => setActiveTab('anomalies')}
                  >
                    <AlertTriangle size={16} /> Anomalies
                  </button>
                </div>
              </div>

              <div>
                {activeTab === 'summary' && (parsedData ? <AISummary data={parsedData} /> : <div className="glass p-6 text-slate-400">No summary data available.</div>)}
                {activeTab === 'graph' && (parsedData ? <OwnershipGraph data={parsedData} key={parsedData.propertyId || activePropertyIdx} /> : <div className="glass p-6 text-slate-400">No graph data available.</div>)}
                {activeTab === 'timeline' && (parsedData ? <TimelineView timeline={parsedData.timeline} /> : <div className="glass p-6 text-slate-400">No timeline data available.</div>)}
                {activeTab === 'entities' && (parsedData ? <EntitiesView data={parsedData} /> : <div className="glass p-6 text-slate-400">No entities data available.</div>)}
                {activeTab === 'anomalies' && <AnomaliesView anomalies={parsedData?.anomalies || []} key={parsedData?.propertyId || activePropertyIdx} />}
                {activeTab === 'raw' && (
                  <TextViewer
                    text={[{
                      text: jobData?.text,
                      serialNo: uploadInfo?.serialNo,
                      fileName: uploadInfo?.fileName
                    }]}
                  />
                )}
              </div>
            </>
          )}
        </div>
      )}
      
      {/* ── Profile View ─────────────────────────────────────────────────── */}
      {currentView === 'profile' && (
        <div className="animate-fadeIn">
          <MyProfile profileData={profileData} setProfileData={setProfileData} />
        </div>
      )}

      {/* ── Cases View ─────────────────────────────────────────────────── */}
      {currentView === 'cases' && (
        <div className="animate-fadeIn" style={{ height: '100%' }}>
          <MyCases userName={profileData.fullName} />
        </div>
      )}
    </DashboardLayout>
  );
}

export default App;
