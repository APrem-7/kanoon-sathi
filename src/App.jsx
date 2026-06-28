import React, { useState } from 'react';
import Header from './components/Layout/Header';
import UploadZone from './components/Upload/UploadZone';
import StatusTracker from './components/Processing/StatusTracker';
import TextViewer from './components/OCRResult/TextViewer';
import OwnershipGraph from './components/OCRResult/OwnershipGraph';
import AISummary from './components/OCRResult/AISummary';
import TimelineView from './components/OCRResult/TimelineView';
import EntitiesView from './components/OCRResult/EntitiesView';
import { analyzeDocument } from './api/client';
import { FileText, Network, Calendar, Database, AlignLeft } from 'lucide-react';
import './index.css';

function App() {
  const [currentView, setCurrentView] = useState('upload'); // 'upload', 'processing', 'results'
  const [uploadInfo, setUploadInfo] = useState(null); 
  const [jobData, setJobData] = useState(null); 
  const [parsedData, setParsedData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'graph', 'timeline', 'entities', 'raw'

  // Handle successful file upload
  const handleUploadSuccess = (info) => {
    setUploadInfo(info);
    setCurrentView('processing');
  };

  // Handle OCR completion
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
      // Run single analysis using Cerebras LLM.
      const structuredData = await analyzeDocument(job.text);
      setParsedData(structuredData);
    } catch (error) {
      console.error("Failed to analyze combined documents with LLM:", error);
      setAnalysisError(error.message || 'Analysis failed');
      setActiveTab('raw'); // Fallback to raw OCR tab
    } finally {
      setIsAnalyzing(false);
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
                      ? 'Cerebras AI is compiling and synthesizing title deeds...' 
                      : 'Cerebras AI is analyzing the document...'}
                  </h3>
                  <p className="analysis-loading-subtitle">
                    {uploadInfo?.queue 
                      ? 'Analyzing the merged deeds to construct the unified ownership timeline and property graph.' 
                      : 'Extracting legal intelligence, mapping property boundaries, and building the ownership graph.'}
                  </p>
                </div>
              ) : (
                <>
                  {analysisError && (
                    <div className="analysis-error-panel">
                      <div className="analysis-error-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      </div>
                      <div className="analysis-error-content">
                        <h4>Analysis Failed</h4>
                        <div className="analysis-error-desc">{analysisError}</div>
                        <p className="analysis-error-fallback">Falling back to raw extracted text. Please check your backend logs or Cerebras API key configuration.</p>
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
                    </div>
                  </div>

                  <div>
                    {activeTab === 'summary' && (parsedData ? <AISummary data={parsedData} /> : <div className="glass p-6 text-slate-400">No summary data available.</div>)}
                    {activeTab === 'graph' && (parsedData ? <OwnershipGraph data={parsedData} /> : <div className="glass p-6 text-slate-400">No graph data available.</div>)}
                    {activeTab === 'timeline' && (parsedData ? <TimelineView timeline={parsedData.timeline} /> : <div className="glass p-6 text-slate-400">No timeline data available.</div>)}
                    {activeTab === 'entities' && (parsedData ? <EntitiesView data={parsedData} /> : <div className="glass p-6 text-slate-400">No entities data available.</div>)}
                    {activeTab === 'raw' && (
                      <TextViewer 
                        text={[{ text: jobData?.text, serialNo: uploadInfo?.serialNo, fileName: uploadInfo?.fileName }]} 
                      />
                    )}

                  </div>
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
