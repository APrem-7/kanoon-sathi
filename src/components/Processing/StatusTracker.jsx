import React, { useState, useEffect, useRef } from 'react';
import { pollJobStatus } from '../../api/client';
import './StatusTracker.css';

const PIPELINE_STEPS = [
  {
    id: 'upload',
    title: 'Documents Uploaded & Merged',
    desc: 'Deeds received, merged by AWS Lambda, and stored in S3 raw folder',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
  },
  {
    id: 'ocr',
    title: 'Textract OCR Processing',
    desc: 'Amazon Textract is extracting text from the merged document pages',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
  },
  {
    id: 'extract',
    title: 'Text Extraction & Caching',
    desc: 'Merging extracted text pages and caching in database store',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    id: 'ready',
    title: 'Title Group Ready',
    desc: 'OCR extraction complete and ready for AI synthesis',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
];

export default function StatusTracker({ uploadInfo, onComplete }) {
  const isGroup = !!uploadInfo?.queue;
  const items = isGroup ? uploadInfo.queue : [uploadInfo];

  const [currentStep, setCurrentStep] = useState(0);
  const [jobData, setJobData] = useState(null);
  const [completed, setCompleted] = useState(false);
  const cleanupRef = useRef(null);

  useEffect(() => {
    if (!uploadInfo?.serialNo) return;

    setCurrentStep(1);
    const stepTimer = setTimeout(() => setCurrentStep(2), 3000);

    // Poll for the single merged job ID
    cleanupRef.current = pollJobStatus(
      uploadInfo.serialNo,
      (job) => {
        setJobData(job);
        if (job.status === 'processing') {
          setCurrentStep(2);
        }
      },
      (job) => {
        setCurrentStep(4);
        setJobData(job);
        setCompleted(true);
      },
      (err) => {
        console.error('Polling error:', err);
      }
    );

    return () => {
      clearTimeout(stepTimer);
      if (cleanupRef.current) cleanupRef.current();
    };
  }, [uploadInfo]);

  const getStepState = (stepIndex) => {
    if (completed) return 'completed';
    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep) return 'active';
    return 'pending';
  };

  return (
    <div className="status-tracker" id="status-tracker">
      <div className="status-header">
        <h2>
          {isGroup 
            ? 'Processing Title Chain Group' 
            : 'Processing Document'}
        </h2>
        <p>
          {isGroup 
            ? 'Your group of documents has been merged and is being processed through the OCR pipeline' 
            : 'Your document is being processed through the OCR pipeline'}
        </p>
        
        {uploadInfo && (
          <div className="status-file-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            {isGroup 
              ? `Unified Job Serial: ${uploadInfo.serialNo} (${items.length} Deeds merged)`
              : `${uploadInfo.fileName} — Serial: ${uploadInfo.serialNo}`}
          </div>
        )}
      </div>

      {/* Unified step pipeline */}
      <div className="status-pipeline">
        {PIPELINE_STEPS.map((step, index) => {
          const state = getStepState(index);
          return (
            <div
              key={step.id}
              className={`status-step ${state}`}
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="status-step-circle">
                {state === 'active' ? (
                  <div className="status-step-spinner" />
                ) : state === 'completed' ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  step.icon
                )}
              </div>
              <div className="status-step-content">
                <div className="status-step-title">{step.title}</div>
                <div className="status-step-desc">{step.desc}</div>
                {state === 'active' && (
                  <div className="status-step-time">In progress...</div>
                )}
                {state === 'completed' && (
                  <div className="status-step-time">✓ Completed</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Group Deeds Queue Details */}
      {isGroup && (
        <div className="status-group-list" style={{ marginTop: 'var(--space-xl)' }}>
          <h3 style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-md)' }}>
            Deeds Ingested in this Title Chain
          </h3>
          {items.map(item => (
            <div key={item.serialNo} className="status-group-row completed" style={{ marginBottom: '6px' }}>
              <div className="status-row-info">
                <div className="status-row-filename">{item.file?.name || item.fileName}</div>
                <div className="status-row-serial">Serial Number: {item.serialNo}</div>
              </div>
              <div className="status-row-badge">
                <span className="badge-success">Merged</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {completed && (
        <div className="status-complete-msg">
          <h3>
            {isGroup 
              ? '🎉 Title Group OCR Complete' 
              : '🎉 OCR Processing Complete'}
          </h3>
          <p>
            {isGroup 
              ? 'All pages have been compiled and processed. Let\'s perform the AI synthesis and view the ownership timeline.'
              : 'Your document has been successfully processed. View the extracted text and sale deed analysis below.'}
          </p>
          <button
            className="status-view-btn"
            onClick={() => onComplete(jobData)}
            id="view-results-btn"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {isGroup ? 'Generate Unified Title Report' : 'View Results & Analysis'}
          </button>
        </div>
      )}
    </div>
  );
}
