import { API_BASE, POLL_INTERVAL } from '../utils/constants';

/**
 * Upload a document to the OCR pipeline
 */
export async function uploadDocument(file, serialNo) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('serial_no', serialNo);

  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(error.error || 'Upload failed');
  }

  return response.json();
}

/**
 * Get job status
 */
export async function getJobStatus(serialNo) {
  const response = await fetch(`${API_BASE}/jobs/${encodeURIComponent(serialNo)}`);

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error('Failed to fetch job status');
  }

  return response.json();
}

/**
 * Get all jobs
 */
export async function getAllJobs() {
  const response = await fetch(`${API_BASE}/jobs`);

  if (!response.ok) {
    throw new Error('Failed to fetch jobs');
  }

  return response.json();
}

/**
 * Simulate OCR result (for testing)
 */
export async function simulateOCR(serialNo, text) {
  const response = await fetch(`${API_BASE}/simulate-ocr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ serial_no: serialNo, text }),
  });

  if (!response.ok) {
    throw new Error('Simulation failed');
  }

  return response.json();
}

/**
 * Poll for job completion
 */
export function pollJobStatus(serialNo, onUpdate, onComplete, onError) {
  let attempts = 0;
  const maxAttempts = 60; // 3 minutes max

  const interval = setInterval(async () => {
    try {
      attempts++;
      const result = await getJobStatus(serialNo);

      if (!result) {
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          onError(new Error('Polling timeout'));
        }
        return;
      }

      onUpdate(result.job);

      if (result.job.status === 'completed') {
        clearInterval(interval);
        onComplete(result.job);
      } else if (result.job.status === 'failed') {
        clearInterval(interval);
        onError(new Error('OCR processing failed'));
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
        onError(new Error('Polling timeout – OCR may still be processing'));
      }
    } catch (err) {
      console.error('Poll error:', err);
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        onError(err);
      }
    }
  }, POLL_INTERVAL);

  return () => clearInterval(interval);
}
