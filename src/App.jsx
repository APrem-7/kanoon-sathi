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
    
    if (job.text) {
      try {
        setIsAnalyzing(true);
        setAnalysisError(null);
        // We stay on the "processing" view (or transition to a specialized analyzing view)
        // For simplicity, we can move to 'results' but show a loading overlay for LLM
        setCurrentView('results');
        
        const structuredData = await analyzeDocument(job.text);
        setParsedData(structuredData);
      } catch (error) {
        console.error("Failed to analyze document with LLM:", error);
        setAnalysisError(error.message || 'Analysis failed');
        setActiveTab('raw'); // Fallback to raw OCR tab
      } finally {
        setIsAnalyzing(false);
      }
    } else {
      setCurrentView('results');
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
                <p>Document: {uploadInfo?.fileName || 'Unknown'} (Serial: {uploadInfo?.serialNo || 'Unknown'})</p>
              </div>

              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                  <h3 className="text-xl font-semibold text-white">Cerebras AI is analyzing the document...</h3>
                  <p className="text-slate-400">Extracting legal intelligence and building the knowledge graph.</p>
                </div>
              ) : (
                <>
                  {analysisError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 flex items-start gap-3">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <div>
                        <h4 className="font-semibold text-red-300">Analysis Failed</h4>
                        <p className="text-sm opacity-90 mt-1">{analysisError}</p>
                        <p className="text-sm mt-2">Falling back to raw extracted text. Please check your backend logs or Cerebras API key.</p>
                      </div>
                    </div>
                  )}

                  <div className="results-tabs flex flex-wrap gap-2 mb-6">
                    <button 
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'summary' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-white glass'}`}
                      onClick={() => setActiveTab('summary')}
                    >
                      <FileText size={16} /> AI Summary
                    </button>
                    <button 
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'graph' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-white glass'}`}
                      onClick={() => setActiveTab('graph')}
                    >
                      <Network size={16} /> Ownership Graph
                    </button>
                    <button 
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'timeline' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-white glass'}`}
                      onClick={() => setActiveTab('timeline')}
                    >
                      <Calendar size={16} /> Timeline
                    </button>
                    <button 
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'entities' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-white glass'}`}
                      onClick={() => setActiveTab('entities')}
                    >
                      <Database size={16} /> Entities
                    </button>
                    <button 
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'raw' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-white glass'}`}
                      onClick={() => setActiveTab('raw')}
                    >
                      <AlignLeft size={16} /> Raw OCR
                    </button>
                  </div>

                  <div>
                    {activeTab === 'summary' && (parsedData ? <AISummary data={parsedData} /> : <div className="glass p-6 text-slate-400">No summary data available.</div>)}
                    {activeTab === 'graph' && (parsedData ? <OwnershipGraph data={parsedData} /> : <div className="glass p-6 text-slate-400">No graph data available.</div>)}
                    {activeTab === 'timeline' && (parsedData ? <TimelineView timeline={parsedData.timeline} /> : <div className="glass p-6 text-slate-400">No timeline data available.</div>)}
                    {activeTab === 'entities' && (parsedData ? <EntitiesView data={parsedData} /> : <div className="glass p-6 text-slate-400">No entities data available.</div>)}
                    {activeTab === 'raw' && <TextViewer text={jobData?.text} jobId={uploadInfo?.serialNo} />}
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
