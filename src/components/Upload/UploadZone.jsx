import React, { useState, useRef, useCallback } from 'react';
import { uploadDocument } from '../../api/client';
import { MAX_FILE_SIZE } from '../../utils/constants';
import './UploadZone.css';

export default function UploadZone({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [serialNo, setSerialNo] = useState('');
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
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
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  const handleUpload = async () => {
    if (!file || !serialNo.trim()) {
      setError('Please provide both a serial number and a document file.');
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(0);

    // Simulate progress (actual upload doesn't provide progress events with fetch)
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 300);

    try {
      const result = await uploadDocument(file, serialNo.trim());
      clearInterval(progressInterval);
      setProgress(100);

      setTimeout(() => {
        onUploadSuccess({
          serialNo: serialNo.trim(),
          fileName: file.name,
          ...result,
        });
      }, 500);
    } catch (err) {
      clearInterval(progressInterval);
      setProgress(0);
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="upload-container" id="upload-zone">
      <div className="upload-header">
        <h2>Upload Document</h2>
        <p>Upload a sale deed or legal document for OCR processing</p>
      </div>

      {/* Serial Number */}
      <div className="upload-serial">
        <label htmlFor="serial-no-input">Document Serial Number</label>
        <input
          id="serial-no-input"
          className="upload-serial-input"
          type="text"
          placeholder="Enter unique serial number (e.g., SD-2024-001)"
          value={serialNo}
          onChange={(e) => setSerialNo(e.target.value)}
          disabled={uploading}
        />
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
              <>Drag & drop your document or <span>browse files</span></>
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

      {/* File Preview */}
      {file && (
        <div className="upload-file-preview">
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
            <span>Uploading to S3...</span>
            <span>{Math.round(progress)}%</span>
          </div>
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

      {/* Submit */}
      <button
        className="upload-submit"
        onClick={handleUpload}
        disabled={!file || !serialNo.trim() || uploading}
        id="upload-submit-btn"
      >
        {uploading ? (
          <>
            <div className="upload-submit-spinner" />
            Processing...
          </>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="17 1 21 5 17 9" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <polyline points="7 23 3 19 7 15" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
            Start OCR Processing
          </>
        )}
      </button>
    </div>
  );
}
