// lib/jobs.ts
type JobStatus = "queued" | "running" | "error" | "done";

export type JobRecord = {
  id: string;
  status: JobStatus;
  step: string;
  progress: number; // 0..100
  resultUrl?: string;
  log?: string;
  inputName?: string;
  durationSec?: number;
};

const jobs = new Map<string, JobRecord>();

export function createJob(id: string, inputName?: string): JobRecord {
  const job: JobRecord = { id, status: "queued", step: "Waiting", progress: 0, inputName };
  jobs.set(id, job);
  return job;
}

export function getJob(id: string) {
  return jobs.get(id);
}

export function updateJob(id: string, patch: Partial<JobRecord>) {
  const j = jobs.get(id);
  if (!j) return;
  const updated = { ...j, ...patch } as JobRecord;
  jobs.set(id, updated);
  return updated;
}

import path from 'path';
import { ensureDir, moveFile, join } from './fs';
import { probe, makePreviewClip } from './ffmpeg';

export async function runStage1Real(jobId: string, tmpUploadPath: string, originalFilename: string) {
  try {
    updateJob(jobId, { status: "running", step: "Saving upload", progress: 5 });

    const ext = path.extname(originalFilename || '') || '.mp4';
    const uploadsDir = join(process.cwd(), 'uploads', jobId);
    const savedInputPath = join(uploadsDir, `input${ext}`);
    await ensureDir(uploadsDir);
    await moveFile(tmpUploadPath, savedInputPath);

    updateJob(jobId, { step: "Probing video", progress: 20 });
    try {
      const meta = await probe(savedInputPath);
      const duration = Number(meta?.format?.duration) || 0;
      updateJob(jobId, { durationSec: duration });
    } catch (probeErr: any) {
      // Non-fatal: continue without duration if ffprobe is unavailable
      updateJob(jobId, { log: `ffprobe failed: ${probeErr?.message || String(probeErr)}` });
    }

    updateJob(jobId, { step: "Generating preview", progress: 60 });
    const publicProcessedDir = join(process.cwd(), 'public', 'processed', jobId);
    const outRel = join('processed', jobId, 'preview.mp4');
    const outAbs = join(publicProcessedDir, 'preview.mp4');
    await ensureDir(publicProcessedDir);
    await makePreviewClip(savedInputPath, outAbs);

    updateJob(jobId, { step: "Complete", progress: 100, status: "done", resultUrl: `/${outRel.replace(/\\/g, '/')}` });
  } catch (err: any) {
    updateJob(jobId, { status: "error", step: "Failed", log: err?.message || String(err) });
  }
}
