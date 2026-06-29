import React, { useState } from 'react';
import './TextViewer.css';

export default function TextViewer({ text }) {
  // text is always an array of { text, serialNo, fileName } objects (normalized in App.jsx)
  const docsList = text || [];
  const [activeIdx, setActiveIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const activeDoc = docsList[activeIdx] || { text: '', serialNo: 'unknown', fileName: 'document' };
  const activeText = activeDoc.text || 'No text extracted.';
  const activeJobId = activeDoc.serialNo;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = activeText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = (format) => {
    let content, mimeType, ext;
    if (format === 'json') {
      content = JSON.stringify({ serial_no: activeJobId, fileName: activeDoc.fileName, text: activeText }, null, 2);
      mimeType = 'application/json';
      ext = 'json';
    } else {
      content = activeText;
      mimeType = 'text/plain';
      ext = 'txt';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocr-result-${activeJobId || 'output'}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isMultiple = docsList.length > 1;

  return (
    <div className="text-viewer animate-fadeIn" id="text-viewer">
      <div className="text-viewer-header">
        <div className="text-viewer-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          Extracted OCR Text
        </div>
        <div className="text-viewer-actions">
          <button
            className={`text-viewer-action-btn ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
            id="copy-text-btn"
          >
            {copied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copy
              </>
            )}
          </button>
          <button className="text-viewer-action-btn" onClick={() => handleDownload('txt')} id="download-txt-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            TXT
          </button>
          <button className="text-viewer-action-btn" onClick={() => handleDownload('json')} id="download-json-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            JSON
          </button>
        </div>
      </div>

      {/* Multiple Documents Tab Selector */}
      {isMultiple && (
        <div className="text-viewer-selector-bar">
          <span className="text-viewer-selector-label">Deeds:</span>
          <div className="text-viewer-selector-buttons">
            {docsList.map((doc, idx) => (
              <button
                key={doc.serialNo || idx}
                className={`text-viewer-selector-btn ${idx === activeIdx ? 'active' : ''}`}
                onClick={() => setActiveIdx(idx)}
              >
                {doc.fileName} ({doc.serialNo})
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="text-viewer-content" id="extracted-text-content">
        {activeText}
      </div>
    </div>
  );
}
