import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { store } from './store.js';
import { analyzeLegalDocument } from './cerebras.js';

const app = express();
const PORT = 3001;
const upload = multer({ storage: multer.memoryStorage() });

// AWS API Gateway endpoint for upload
const PROPERTY_API = 'https://qt6k7l80g0.execute-api.ap-south-1.amazonaws.com/prod/property';

// S3 bucket where Lambda 2 writes processed/<job_id>.json
const S3_BUCKET = process.env.S3_BUCKET || 'lawdocuments2026';

// DynamoDB table – must match the DYNAMODB_TABLE env var in both Lambdas
const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE || 'kanoon-saathi-jobs';

const awsConfig = { region: process.env.AWS_REGION || 'ap-south-1' };
const s3 = new S3Client(awsConfig);
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient(awsConfig));

// ─────────────────────────────────────────────
// Startup: verify AWS credentials and table name
// ─────────────────────────────────────────────
(async () => {
  try {
    const result = await new DynamoDBClient(awsConfig).send(new ListTablesCommand({}));
    console.log('\n  ✅ AWS credentials OK');
    console.log(`  📋 DynamoDB tables visible: ${result.TableNames.join(', ')}`);
    if (!result.TableNames.includes(DYNAMODB_TABLE)) {
      console.warn(`  ⚠️  WARNING: Table "${DYNAMODB_TABLE}" not found! Update DYNAMODB_TABLE in .env`);
      console.warn(`  ⚠️  Available tables: ${result.TableNames.join(', ')}\n`);
    } else {
      console.log(`  ✅ Table "${DYNAMODB_TABLE}" confirmed\n`);
    }
  } catch (e) {
    console.error('\n  ❌ AWS credentials FAILED:', e.message);
    console.error('  ❌ Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env\n');
  }
})();

app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────
// POST /api/upload – Proxy file upload to AWS
// ─────────────────────────────────────────────
app.post('/api/upload', upload.array('file'), async (req, res) => {
  try {
    const { serial_no } = req.body;
    const files = req.files;

    if (!serial_no) return res.status(400).json({ error: 'serial_no is required' });
    if (!files || files.length === 0) return res.status(400).json({ error: 'file is required' });

    const form = new globalThis.FormData();
    form.append('serial_no', serial_no);

    files.forEach((file) => {
      form.append('file', new Blob([file.buffer], { type: file.mimetype }), file.originalname);
    });

    const response = await fetch(PROPERTY_API, { method: 'POST', body: form });
    const data = await response.json();

    if (response.ok) {
      const displayFilename = data.file_name || files[0].originalname;
      const job = store.createJob(serial_no, displayFilename, data.s3_path || '');
      console.log(`[UPLOAD] serial_no=${serial_no} | file=${displayFilename} | s3_path=${data.s3_path || 'unknown'}`);
      console.log(`[UPLOAD] AWS response:`, JSON.stringify(data));

      // Poll DynamoDB until Lambda 2 marks status=ocr_completed, then fetch S3
      pollDynamoForResult(serial_no);

      return res.json({ ...data, job });
    } else {
      return res.status(response.status).json(data);
    }
  } catch (error) {
    console.error('[UPLOAD ERROR]', error.message);
    return res.status(500).json({ error: 'Upload failed: ' + error.message });
  }
});

// ─────────────────────────────────────────────
// POST /api/ocr/webhook – Optional webhook from Lambda (if ever wired up)
// ─────────────────────────────────────────────
app.post('/api/ocr/webhook', (req, res) => {
  console.log('\n========== WEBHOOK RECEIVED ==========');
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('======================================\n');

  const { job_id, text, ocr_text } = req.body;
  const finalText = text || ocr_text;

  if (!job_id || !finalText) {
    console.error('[WEBHOOK ERROR] Missing job_id or text – received:', req.body);
    return res.status(400).json({ error: 'job_id and OCR text are required', received: req.body });
  }

  const job = store.storeOCRResult(job_id, finalText);
  console.log(`[WEBHOOK] Stored result for job_id=${job_id} | text length=${finalText.length}`);
  return res.json({ status: 'success', job });
});

// ─────────────────────────────────────────────
// GET /api/jobs – List all jobs
// ─────────────────────────────────────────────
app.get('/api/jobs', (_req, res) => {
  return res.json({ jobs: store.getAllJobs() });
});

// ─────────────────────────────────────────────
// POST /api/analyze – Analyze OCR text with Cerebras LLM
// ─────────────────────────────────────────────
app.post('/api/analyze', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'OCR text is required' });
    }

    console.log(`[ANALYZE] Received request with text length=${text.length}`);
    const structuredData = await analyzeLegalDocument(text);
    console.log(`[ANALYZE] Success: ${JSON.stringify(structuredData).substring(0, 100)}...`);

    return res.json(structuredData);
  } catch (error) {
    console.error('[ANALYZE ERROR]', error.message);
    return res.status(500).json({ error: 'LLM Analysis failed: ' + error.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/jobs/:serialNo – Get job status (polled by frontend every 3s)
// If still processing, check DynamoDB live so a server restart doesn't stall forever
// ─────────────────────────────────────────────
app.get('/api/jobs/:serialNo', async (req, res) => {
  const { serialNo } = req.params;
  let job = store.getJob(serialNo);
  console.log(`[GET /api/jobs/${serialNo}] store status=${job?.status ?? 'NOT FOUND'}`);

  // Job not in store at all – look it up in DynamoDB and hydrate
  if (!job) {
    console.log(`[GET /api/jobs/${serialNo}] Not in store – querying DynamoDB`);
    try {
      const result = await dynamo.send(new ScanCommand({
        TableName: DYNAMODB_TABLE,
        FilterExpression: '#sno = :sno',
        ExpressionAttributeNames: { '#sno': 'S.no' },
        ExpressionAttributeValues: { ':sno': serialNo },
      }));
      if (result.Items?.length > 0) {
        const record = result.Items[0];
        job = store.createJob(serialNo, record.file_name || 'unknown', record.s3_path || '');
        if (record.status === 'ocr_completed' && record.ocr_output_path) {
          // Fetch text from S3 immediately
          await hydrateFromS3(serialNo, record.ocr_output_path);
          job = store.getJob(serialNo);
        } else {
          // Start background poll
          pollDynamoForResult(serialNo);
        }
      }
    } catch (e) {
      console.error(`[GET /api/jobs/${serialNo}] DynamoDB lookup error:`, e.message);
    }
  }

  // Job is in store but stuck in processing – check DynamoDB live with fallbacks
  if (job && job.status === 'processing') {
    try {
      const result = await dynamo.send(new ScanCommand({
        TableName: DYNAMODB_TABLE,
        FilterExpression: '#sno = :sno',
        ExpressionAttributeNames: { '#sno': 'S.no' },
        ExpressionAttributeValues: { ':sno': serialNo },
      }));
      if (result.Items?.length > 0) {
        const record = result.Items[0];
        console.log(`[GET /api/jobs/${serialNo}] DynamoDB status=${record.status} | textract_job_id=${record.textract_job_id ?? 'NOT SET'} | ocr_output_path=${record.ocr_output_path ?? 'NOT SET'}`);

        // Strategy A: Normal path
        if (record.status === 'ocr_completed' && record.ocr_output_path) {
          await hydrateFromS3(serialNo, record.ocr_output_path);
          job = store.getJob(serialNo);
        }
        // Strategy B: ocr_output_path exists but status is wrong
        else if (record.ocr_output_path) {
          await hydrateFromS3(serialNo, record.ocr_output_path);
          job = store.getJob(serialNo);
        }
        // Strategy C: textract_job_id exists → probe S3 directly
        else if (record.textract_job_id) {
          const probeKey = `processed/${record.textract_job_id}.json`;
          console.log(`[GET /api/jobs/${serialNo}] Probing S3 at ${probeKey}`);
          await hydrateFromS3(serialNo, probeKey);
          job = store.getJob(serialNo);
        }
      }
    } catch (e) {
      console.error(`[GET /api/jobs/${serialNo}] DynamoDB live-check error:`, e.message);
    }
  }

  if (!job) return res.status(404).json({ error: 'Job not found' });
  return res.json({ job });
});

// ─────────────────────────────────────────────
// Fetch OCR text from S3 and mark job completed in store
// ─────────────────────────────────────────────
async function hydrateFromS3(serialNo, s3Key) {
  try {
    console.log(`[HYDRATE] Fetching s3://${S3_BUCKET}/${s3Key} for serialNo=${serialNo}`);
    const s3Resp = await s3.send(new GetObjectCommand({ Bucket: S3_BUCKET, Key: s3Key }));
    const bodyStr = await streamToString(s3Resp.Body);
    const parsed = JSON.parse(bodyStr);
    const ocrText = parsed.ocr_text || parsed.text;
    if (ocrText) {
      console.log(`[HYDRATE] SUCCESS serialNo=${serialNo} | text length=${ocrText.length}`);
      store.storeOCRResult(serialNo, ocrText);
      return true;
    } else {
      console.warn(`[HYDRATE] S3 object has no ocr_text | key=${s3Key}`);
      return false;
    }
  } catch (e) {
    console.error(`[HYDRATE] S3 fetch failed | key=${s3Key} | ${e.message}`);
    return false;
  }
}

// ─────────────────────────────────────────────
// Background: Poll DynamoDB until status=ocr_completed, then fetch OCR text from S3
// Lambda 1 writes:  { S.no, textract_job_id, status: 'ocr_processing' }
// Lambda 2 updates: { status: 'ocr_completed', ocr_output_path: 'processed/<job_id>.json' }
//
// FALLBACK STRATEGIES (when Lambda fails to update DynamoDB):
//   1. If textract_job_id exists → probe S3 at processed/<job_id>.json
//   2. If ocr_output_path exists → fetch directly, regardless of status field
//   3. After 30s stuck at 'uploaded' → list S3 processed/ prefix and try recent files
// ─────────────────────────────────────────────
async function pollDynamoForResult(serialNo) {
  store.updateJobStatus(serialNo, 'processing');
  console.log(`[DYNAMO POLL] Started | serialNo=${serialNo} | table=${DYNAMODB_TABLE}`);

  const MAX_ATTEMPTS = 60; // 5 min at 5s intervals
  const S3_FALLBACK_AFTER = 6; // Try S3 list scan after 30s (6 × 5s)
  let attempts = 0;
  let s3FallbackTriggered = false;

  const interval = setInterval(async () => {
    attempts++;

    const currentJob = store.getJob(serialNo);
    if (!currentJob || currentJob.status === 'completed') {
      console.log(`[DYNAMO POLL] Already completed, stopping | serialNo=${serialNo}`);
      clearInterval(interval);
      return;
    }

    try {
      // ── Primary: Query DynamoDB for the record with this S.no ──
      const result = await dynamo.send(new ScanCommand({
        TableName: DYNAMODB_TABLE,
        FilterExpression: '#sno = :sno',
        ExpressionAttributeNames: { '#sno': 'S.no' },
        ExpressionAttributeValues: { ':sno': serialNo },
      }));

      const items = result.Items || [];
      console.log(`[DYNAMO POLL] Attempt ${attempts}/${MAX_ATTEMPTS} | found ${items.length} record(s) for S.no=${serialNo}`);

      if (items.length > 0) {
        const record = items[0];
        console.log(`[DYNAMO POLL] DynamoDB status=${record.status} | textract_job_id=${record.textract_job_id ?? 'NOT SET'} | ocr_output_path=${record.ocr_output_path ?? 'NOT SET'}`);

        // ── Strategy A: Normal path – status=ocr_completed ──
        if (record.status === 'ocr_completed' && record.ocr_output_path) {
          console.log(`[DYNAMO POLL] ✅ Normal path: status=ocr_completed`);
          const ok = await hydrateFromS3(serialNo, record.ocr_output_path);
          if (ok) { clearInterval(interval); return; }
        }

        // ── Strategy B: ocr_output_path exists but status is wrong ──
        if (record.ocr_output_path && record.status !== 'ocr_completed') {
          console.log(`[DYNAMO POLL] ⚡ Fallback B: ocr_output_path exists despite status=${record.status}`);
          const ok = await hydrateFromS3(serialNo, record.ocr_output_path);
          if (ok) { clearInterval(interval); return; }
        }

        // ── Strategy C: textract_job_id exists → probe S3 directly ──
        if (record.textract_job_id && !record.ocr_output_path) {
          const probeKey = `processed/${record.textract_job_id}.json`;
          console.log(`[DYNAMO POLL] ⚡ Fallback C: probing S3 at ${probeKey}`);
          const ok = await hydrateFromS3(serialNo, probeKey);
          if (ok) { clearInterval(interval); return; }
        }
      }

      // ── Strategy D: S3 list scan fallback after timeout ──
      // [DISABLED] This strategy is dangerous as it serves the most recent processed file,
      // which often belongs to a completely different document if DynamoDB is stuck.
      /*
      if (attempts >= S3_FALLBACK_AFTER && !s3FallbackTriggered) {
        s3FallbackTriggered = true;
        console.log(`[DYNAMO POLL] ⚡ Fallback D: scanning S3 processed/ prefix for serialNo=${serialNo}`);
        const ok = await fallbackS3ListScan(serialNo);
        if (ok) { clearInterval(interval); return; }
      }

      // Retry S3 list scan every 15s after first attempt
      if (s3FallbackTriggered && attempts % 3 === 0) {
        console.log(`[DYNAMO POLL] ⚡ Fallback D (retry): scanning S3 processed/ prefix`);
        const ok = await fallbackS3ListScan(serialNo);
        if (ok) { clearInterval(interval); return; }
      }
      */

    } catch (err) {
      console.error(`[DYNAMO POLL] Error on attempt ${attempts} | serialNo=${serialNo} | ${err.message}`);
    }

    if (attempts >= MAX_ATTEMPTS) {
      console.error(`[DYNAMO POLL] TIMEOUT after ${MAX_ATTEMPTS} attempts | serialNo=${serialNo}`);
      store.updateJobStatus(serialNo, 'failed');
      clearInterval(interval);
    }
  }, 5000);
}

// ─────────────────────────────────────────────
// Fallback: List recent files in S3 processed/ prefix
// When DynamoDB never gets updated, the OCR result still exists
// as processed/<job_id>.json. We list recent files and try each one.
// ─────────────────────────────────────────────
async function fallbackS3ListScan(serialNo) {
  try {
    const listResp = await s3.send(new ListObjectsV2Command({
      Bucket: S3_BUCKET,
      Prefix: 'processed/',
      MaxKeys: 20,
    }));

    const objects = (listResp.Contents || [])
      .filter(obj => obj.Key.endsWith('.json'))
      .sort((a, b) => new Date(b.LastModified) - new Date(a.LastModified));

    console.log(`[S3 FALLBACK] Found ${objects.length} processed files in S3`);

    // Track which processed files we've already tried (by job in-memory store)
    const job = store.getJob(serialNo);
    const triedKeys = job?._triedS3Keys || new Set();

    for (const obj of objects.slice(0, 10)) {
      if (triedKeys.has(obj.Key)) continue;
      triedKeys.add(obj.Key);

      console.log(`[S3 FALLBACK] Trying ${obj.Key} (LastModified: ${obj.LastModified})`);
      const ok = await hydrateFromS3(serialNo, obj.Key);
      if (ok) {
        console.log(`[S3 FALLBACK] ✅ SUCCESS – found OCR result at ${obj.Key} for serialNo=${serialNo}`);
        return true;
      }
    }

    // Persist tried keys to avoid retrying
    if (job) job._triedS3Keys = triedKeys;

    console.log(`[S3 FALLBACK] No matching processed file found yet for serialNo=${serialNo}`);
    return false;
  } catch (e) {
    console.error(`[S3 FALLBACK] Error listing S3 objects: ${e.message}`);
    return false;
  }
}

// Helper: stream S3 body to string
function streamToString(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (c) => chunks.push(c));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    stream.on('error', reject);
  });
}

app.listen(PORT, () => {
  console.log(`\n  ⚖️  Kanoon Saathi Backend running on http://localhost:${PORT}`);
  console.log(`  📤 Upload:      POST /api/upload`);
  console.log(`  📡 Webhook:     POST /api/ocr/webhook`);
  console.log(`  📋 All jobs:    GET  /api/jobs`);
  console.log(`  🔍 Job status:  GET  /api/jobs/:serialNo`);
  console.log(`  🗄️  DynamoDB:   ${DYNAMODB_TABLE} (${awsConfig.region})\n`);
});
