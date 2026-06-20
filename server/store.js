// In-memory store for OCR results and job status
const jobs = new Map();

export const store = {
  createJob(serialNo, fileName, s3Path) {
    const job = {
      serialNo,
      fileName,
      s3Path,
      status: 'uploaded',
      text: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    jobs.set(serialNo, job);
    return job;
  },

  updateJobStatus(serialNo, status, text = null) {
    const job = jobs.get(serialNo);
    if (job) {
      job.status = status;
      job.updatedAt = new Date().toISOString();
      if (text) job.text = text;
      jobs.set(serialNo, job);
    }
    return job;
  },

  getJob(serialNo) {
    return jobs.get(serialNo) || null;
  },

  getAllJobs() {
    return Array.from(jobs.values()).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  },

  // Store OCR result by job_id (from Lambda 3 webhook or S3 poll)
  storeOCRResult(jobId, text) {
    // Try to find matching job by serialNo or jobId
    for (const [key, job] of jobs) {
      if (key === jobId || job.serialNo === jobId) {
        job.status = 'completed';
        job.text = text;
        job.updatedAt = new Date().toISOString();
        jobs.set(key, job);
        console.log(`[STORE] storeOCRResult – matched key: "${key}" for jobId: "${jobId}" → status: completed`);
        return job;
      }
    }
    // No matching job found – log all known keys for debugging
    console.warn(`[STORE] storeOCRResult – NO MATCH for jobId: "${jobId}"`);
    console.warn(`[STORE] Known keys:`, Array.from(jobs.keys()));
    // Create a new orphan entry (webhook arrived before upload registered)
    const job = {
      serialNo: jobId,
      fileName: 'unknown',
      s3Path: '',
      status: 'completed',
      text,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    jobs.set(jobId, job);
    return job;
  },
};
