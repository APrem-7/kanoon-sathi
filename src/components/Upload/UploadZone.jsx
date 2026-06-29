import React, { useState, useRef, useCallback } from 'react';
import { uploadDocument } from '../../api/client';
import { MAX_FILE_SIZE } from '../../utils/constants';
import './UploadZone.css';

export default function UploadZone({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [serialNo, setSerialNo] = useState('');
  const [queue, setQueue] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentUploadingFile, setCurrentUploadingFile] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const acceptedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff'];

  const validateFile = useCallback((f) => {
    if (!acceptedTypes.includes(f.type)) {
      setError('Invalid file type. Please upload a PDF, JPG, PNG, or TIFF file.');
      return false;
    }
    if (f.size > MAX_FILE_SIZE) {
      setError('File too large. Maximum size is 50MB.');
      return false;
    }
    return true;
  }, []);

  const handleFile = useCallback((f) => {
    setError(null);
    if (validateFile(f)) {
      setFile(f);
    }
  }, [validateFile]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFile(droppedFile);
  }, [handleFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  const handleInputChange = useCallback((e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) handleFile(selectedFile);
  }, [handleFile]);

  const removeFile = useCallback(() => {
    setFile(null);
    setSerialNo('');
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  // Add selected file + serial number to queue
  const addToQueue = () => {
    if (!file || !serialNo.trim()) {
      setError('Please provide both a serial number and a document file before adding.');
      return;
    }
    const cleanSerial = serialNo.trim();
    
    // Prevent duplicate serial numbers in queue
    if (queue.some(q => q.serialNo.toLowerCase() === cleanSerial.toLowerCase())) {
      setError(`A document with serial number "${cleanSerial}" is already in the queue.`);
      return;
    }

    // Explicitly store fileName and fileSize as primitives (prevents loss during HMR/state-cloning)
    setQueue(prev => [...prev, { 
      id: Math.random().toString(), 
      file, 
      fileName: file.name,
      fileSize: file.size,
      serialNo: cleanSerial 
    }]);

    setFile(null);
    setSerialNo('');
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleUpload = async () => {
    let activeQueue = [...queue];

    // If queue is empty, but there is a file selected in the preview card, auto-add it
    if (activeQueue.length === 0) {
      if (file && serialNo.trim()) {
        activeQueue.push({ 
          id: 'temp', 
          file, 
          fileName: file.name,
          fileSize: file.size,
          serialNo: serialNo.trim() 
        });
      } else {
        setError('Please select a file and enter a serial number to start.');
        return;
      }
    }

    setError(null);
    setUploading(true);
    setProgress(20);

    try {
      const groupSerialNo = activeQueue[0].serialNo;
      const files = activeQueue.map(item => item.file);

      setCurrentUploadingFile(
        files.length > 1 
          ? `Combining and uploading group of ${files.length} deeds...`
          : `Uploading ${activeQueue[0].fileName}...`
      );

      // Upload all files in a single request (Lambda merges them if multiple)
      const result = await uploadDocument(files, groupSerialNo);
      setProgress(100);

      setTimeout(() => {
        onUploadSuccess({
          serialNo: groupSerialNo,
          fileName: result.file_name || (files.length > 1 ? `merged_${groupSerialNo}.pdf` : activeQueue[0].fileName),
          queue: activeQueue,
          ...result
        });
      }, 500);
    } catch (err) {
      setProgress(0);
      setError(err.message || 'Upload failed. Please check network or file size constraints.');
    } finally {
      setUploading(false);
      setCurrentUploadingFile('');
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const isAddButtonDisabled = !file || !serialNo.trim() || uploading;
  const isProcessButtonDisabled = (queue.length === 0 && (!file || !serialNo.trim())) || uploading;

  return (
    <div className="upload-container" id="upload-zone">
      <div className="upload-header">
        <h2>Ingest Deeds</h2>
        <p>Ingest one or multiple documents for the same property to compile a complete transaction title chain</p>
      </div>

      {/* Drop Zone */}
      <div
        className={`upload-dropzone ${dragging ? 'dragging' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !uploading && inputRef.current?.click()}
        id="dropzone"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.tiff,.tif"
          onChange={handleInputChange}
          style={{ display: 'none' }}
          id="file-input"
        />

        <div className="upload-dropzone-content">
          <div className="upload-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>

          <p className="upload-text-primary">
            {dragging ? 'Drop your document here' : (
              <>Drag & drop document or <span>browse files</span></>
            )}
          </p>
          <p className="upload-text-secondary">
            Supports PDF, JPG, PNG, and TIFF files up to 50MB
          </p>

          <div className="upload-formats">
            <span className="upload-format-badge">PDF</span>
            <span className="upload-format-badge">JPG</span>
            <span className="upload-format-badge">PNG</span>
            <span className="upload-format-badge">TIFF</span>
          </div>
        </div>
      </div>

      {/* Selected File Details, Serial Number, and Ingest Action (Grouped together) */}
      {file && (
        <div className="upload-file-config-card">
          <div className="upload-file-preview-row">
            <div className="upload-file-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <div className="upload-file-info">
              <div className="upload-file-name">{file.name}</div>
              <div className="upload-file-size">{formatSize(file.size)}</div>
            </div>
            <button className="upload-file-remove" onClick={removeFile} disabled={uploading} title="Remove file">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="upload-serial">
            <label htmlFor="serial-no-input">Document Serial Number</label>
            <input
              id="serial-no-input"
              className="upload-serial-input"
              type="text"
              placeholder="Enter unique serial number (e.g., SD-1982-105)"
              value={serialNo}
              onChange={(e) => setSerialNo(e.target.value)}
              disabled={uploading}
              autoFocus
            />
          </div>

          <button
            className="upload-btn-secondary"
            onClick={addToQueue}
            disabled={isAddButtonDisabled}
            style={{ margin: 0 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Document to Processing Group
          </button>
        </div>
      )}

      {/* Documents Queue Visualizer */}
      {queue.length > 0 && (
        <div className="upload-queue-container">
          <div className="upload-queue-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg>
            Group Title Chain Documents ({queue.length})
          </div>
          <div className="upload-queue-list">
            {queue.map(item => (
              <div key={item.id} className="upload-queue-item">
                <div className="upload-queue-item-info">
                  <div className="upload-queue-item-name">{item.fileName}</div>
                  <div className="upload-queue-item-meta">
                    Size: {formatSize(item.fileSize)} | Serial: <span>{item.serialNo}</span>
                  </div>
                </div>
                <div className="upload-queue-item-actions">
                  <button 
                    className="upload-queue-remove-btn" 
                    onClick={() => setQueue(prev => prev.filter(q => q.id !== item.id))}
                    title="Remove from group"
                    disabled={uploading}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress */}
      {uploading && (
        <div className="upload-progress">
          <div className="upload-progress-bar-track">
            <div
              className="upload-progress-bar-fill"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className="upload-progress-text">
            <span>Uploading documents...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          {currentUploadingFile && (
            <div className="uploading-file-indicator">
              {currentUploadingFile}
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="upload-error" id="upload-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        className="upload-submit"
        onClick={handleUpload}
        disabled={isProcessButtonDisabled}
        id="upload-submit-btn"
      >
        {uploading ? (
          <>
            <div className="upload-submit-spinner" />
            Processing Group...
          </>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="17 1 21 5 17 9" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <polyline points="7 23 3 19 7 15" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
            {queue.length > 0 ? `Process group (${queue.length} deeds)` : 'Start OCR Processing'}
          </>
        )}
      </button>
    </div>
  );
}
