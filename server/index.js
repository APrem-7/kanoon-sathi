import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { store } from './store.js';

const app = express();
const PORT = 3001;
const upload = multer({ storage: multer.memoryStorage() });

// AWS API endpoints
const PROPERTY_API = 'https://qt6k7l80g0.execute-api.ap-south-1.amazonaws.com/prod/property';
const OCR_UPLOAD_API = 'https://p14hl64gn7.execute-api.ap-south-1.amazonaws.com/prod/ocr/upload';

app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────
// POST /api/upload – Proxy file upload to AWS
// ─────────────────────────────────────────────
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const { serial_no } = req.body;
    const file = req.file;

    if (!serial_no) {
      return res.status(400).json({ error: 'serial_no is required' });
    }
    if (!file) {
      return res.status(400).json({ error: 'file is required' });
    }

    // Build native multipart form data for AWS API
    const form = new globalThis.FormData();
    form.append('serial_no', serial_no);
    
    // Convert Buffer to Blob for standard FormData compliance
    const blob = new Blob([file.buffer], { type: file.mimetype });
    form.append('file', blob, file.originalname);

    const response = await fetch(PROPERTY_API, {
      method: 'POST',
      body: form,
      // No custom headers needed: fetch automatically generates the boundary for FormData body
    });

    const data = await response.json();

    if (response.ok) {
      // Track the job in our local store
      const job = store.createJob(serial_no, file.originalname, data.s3_path || '');
      console.log(`[UPLOAD] File uploaded: ${file.originalname} | Serial: ${serial_no}`);

      // Start polling for OCR completion in background
      pollForCompletion(serial_no);

      return res.json({
        ...data,
        job: job,
      });
    } else {
      return res.status(response.status).json(data);
    }
  } catch (error) {
    console.error('[UPLOAD ERROR]', error.message);
    return res.status(500).json({ error: 'Upload failed: ' + error.message });
  }
});

// ─────────────────────────────────────────────
// POST /api/ocr/webhook – Receive OCR results
// ─────────────────────────────────────────────
app.post('/api/ocr/webhook', (req, res) => {
  try {
    const { job_id, text } = req.body;
    if (!job_id || !text) {
      return res.status(400).json({ error: 'job_id and text are required' });
    }

    const job = store.storeOCRResult(job_id, text);
    console.log(`[OCR WEBHOOK] Result received for job: ${job_id}`);
    return res.json({ status: 'success', job });
  } catch (error) {
    console.error('[WEBHOOK ERROR]', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/jobs – List all jobs
// ─────────────────────────────────────────────
app.get('/api/jobs', (req, res) => {
  return res.json({ jobs: store.getAllJobs() });
});

// ─────────────────────────────────────────────
// GET /api/jobs/:serialNo – Get job status
// ─────────────────────────────────────────────
app.get('/api/jobs/:serialNo', (req, res) => {
  const job = store.getJob(req.params.serialNo);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  return res.json({ job });
});

// ─────────────────────────────────────────────
// POST /api/simulate-ocr – For testing: simulate OCR result
// ─────────────────────────────────────────────
app.post('/api/simulate-ocr', (req, res) => {
  const { serial_no, text } = req.body;
  if (!serial_no) {
    return res.status(400).json({ error: 'serial_no is required' });
  }

  const sampleText = text || `SALE DEED

This Sale Deed is executed on 15th March 2024 at Sub-Registrar Office, Andheri, Mumbai.

BETWEEN:

SELLER: Shri Rajesh Kumar Sharma, S/o Late Shri Mohan Kumar Sharma,
residing at 45, Patel Nagar, Andheri West, Mumbai - 400058, Maharashtra
(hereinafter referred to as the "VENDOR/SELLER")

AND

BUYER: Smt. Priya Anil Deshmukh, W/o Shri Anil Vinod Deshmukh,
residing at 12, Shanti Colony, Bandra East, Mumbai - 400051, Maharashtra
(hereinafter referred to as the "PURCHASER/BUYER")

PROPERTY DETAILS:
Flat No. 302, 3rd Floor, Wing-B, Sunshine Heights Co-operative Housing Society,
Plot No. 45, Survey No. 123/4, Village Andheri, Taluka Andheri,
District Mumbai Suburban, Mumbai - 400058, Maharashtra.

Built-up Area: 1,200 sq. ft. (approx. 111.48 sq. meters)
Carpet Area: 950 sq. ft. (approx. 88.26 sq. meters)

SALE CONSIDERATION:
The total sale consideration for the said property is Rs. 1,85,00,000/- (Rupees One Crore Eighty Five Lakhs Only)

STAMP DUTY: Rs. 11,10,000/- (Six percent of sale consideration)
REGISTRATION FEE: Rs. 30,000/-

PAYMENT DETAILS:
1. Token Amount: Rs. 5,00,000/- paid on 01-Jan-2024 via Cheque No. 456789
2. Second Installment: Rs. 50,00,000/- paid on 15-Feb-2024 via Bank Transfer
3. Balance Amount: Rs. 1,30,00,000/- paid on 15-Mar-2024 via Bank Transfer

ENCUMBRANCE: The property is free from all encumbrances, liens, charges, and claims.

WITNESSES:
1. Shri Vikram Singh Rathore, Advocate, Mumbai
2. Smt. Kavita Joshi, Notary Public, Mumbai

Registration No: MH/MUM/2024/SA/12345
Sub-Registrar: Andheri, Mumbai
Date of Registration: 15th March 2024`;

  const job = store.storeOCRResult(serial_no, sampleText);
  console.log(`[SIMULATE] OCR result simulated for: ${serial_no}`);
  return res.json({ status: 'success', job });
});

// ─────────────────────────────────────────────
// Background polling for OCR completion
// ─────────────────────────────────────────────
async function pollForCompletion(serialNo) {
  // Since we don't have a direct status endpoint from AWS,
  // we simulate a processing delay and then auto-complete with simulated data
  // In production, Lambda 3 would POST to /api/ocr/webhook
  const job = store.getJob(serialNo);
  if (!job) return;

  // Update status to processing
  store.updateJobStatus(serialNo, 'processing');

  // In real scenario, wait for webhook. For demo, simulate after 8 seconds
  setTimeout(() => {
    const currentJob = store.getJob(serialNo);
    if (currentJob && currentJob.status !== 'completed') {
      // Auto-simulate if no real OCR result arrived via webhook
      console.log(`[AUTO-SIMULATE] Generating demo OCR for: ${serialNo}`);

      const demoText = `SALE DEED

This Sale Deed is executed on 15th March 2024 at Sub-Registrar Office, Andheri, Mumbai.

BETWEEN:

SELLER: Shri Rajesh Kumar Sharma, S/o Late Shri Mohan Kumar Sharma,
residing at 45, Patel Nagar, Andheri West, Mumbai - 400058, Maharashtra
(hereinafter referred to as the "VENDOR/SELLER")

AND

BUYER: Smt. Priya Anil Deshmukh, W/o Shri Anil Vinod Deshmukh,
residing at 12, Shanti Colony, Bandra East, Mumbai - 400051, Maharashtra
(hereinafter referred to as the "PURCHASER/BUYER")

PROPERTY DETAILS:
Flat No. 302, 3rd Floor, Wing-B, Sunshine Heights Co-operative Housing Society,
Plot No. 45, Survey No. 123/4, Village Andheri, Taluka Andheri,
District Mumbai Suburban, Mumbai - 400058, Maharashtra.

Built-up Area: 1,200 sq. ft. (approx. 111.48 sq. meters)
Carpet Area: 950 sq. ft. (approx. 88.26 sq. meters)

SALE CONSIDERATION:
The total sale consideration for the said property is Rs. 1,85,00,000/- (Rupees One Crore Eighty Five Lakhs Only)

STAMP DUTY: Rs. 11,10,000/- (Six percent of sale consideration)
REGISTRATION FEE: Rs. 30,000/-

PAYMENT DETAILS:
1. Token Amount: Rs. 5,00,000/- paid on 01-Jan-2024 via Cheque No. 456789
2. Second Installment: Rs. 50,00,000/- paid on 15-Feb-2024 via Bank Transfer
3. Balance Amount: Rs. 1,30,00,000/- paid on 15-Mar-2024 via Bank Transfer

ENCUMBRANCE: The property is free from all encumbrances, liens, charges, and claims.

WITNESSES:
1. Shri Vikram Singh Rathore, Advocate, Mumbai
2. Smt. Kavita Joshi, Notary Public, Mumbai

Registration No: MH/MUM/2024/SA/12345
Sub-Registrar: Andheri, Mumbai
Date of Registration: 15th March 2024`;

      store.storeOCRResult(serialNo, demoText);
    }
  }, 8000);
}

app.listen(PORT, () => {
  console.log(`\n  ⚖️  Kanoon Sathi Backend running on http://localhost:${PORT}`);
  console.log(`  📤 Upload API:     POST /api/upload`);
  console.log(`  📡 OCR Webhook:    POST /api/ocr/webhook`);
  console.log(`  📋 List Jobs:      GET  /api/jobs`);
  console.log(`  🔍 Job Status:     GET  /api/jobs/:serialNo`);
  console.log(`  🧪 Simulate OCR:   POST /api/simulate-ocr\n`);
});
