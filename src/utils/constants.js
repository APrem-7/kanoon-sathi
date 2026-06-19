export const API_BASE = '/api';

export const PROPERTY_API_URL = 'https://qt6k7l80g0.execute-api.ap-south-1.amazonaws.com/prod/property';
export const OCR_UPLOAD_API_URL = 'https://p14hl64gn7.execute-api.ap-south-1.amazonaws.com/prod/ocr/upload';

export const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/tiff': ['.tiff', '.tif'],
};

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const JOB_STATUS = {
  UPLOADED: 'uploaded',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

export const POLL_INTERVAL = 3000; // 3 seconds
