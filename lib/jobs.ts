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
  transcript?: string;
  summaryLanguage?: "english" | "original";
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
import { probe, makePreviewClip, extractAudioToMp3 } from './ffmpeg';
import fs from 'fs';
import OpenAI from 'openai';

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

export async function runStage2Transcription(jobId: string) {
  const job = getJob(jobId);
  if (!job) return;
  try {
    updateJob(jobId, { step: "Extracting audio", progress: 65 });
    const uploadsDir = join(process.cwd(), 'uploads', jobId);
    const inputPath = await (async () => {
      // Find the input file (we saved as input.ext)
      const files = await fs.promises.readdir(uploadsDir);
      const input = files.find(f => f.startsWith('input'));
      if (!input) throw new Error('Input video not found for transcription');
      return join(uploadsDir, input);
    })();
    const audioPath = join(uploadsDir, 'audio.mp3');
    await extractAudioToMp3(inputPath, audioPath);

    updateJob(jobId, { step: "Transcribing audio", progress: 75 });
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const translate = (job.summaryLanguage || 'english') === 'english';
    const fileStream = fs.createReadStream(audioPath);
    const result = await openai.audio.transcriptions.create({
      model: 'whisper-1',
      file: fileStream as any,
      translate,
      response_format: 'json'
    } as any);

    const text = (result as any)?.text || '';
    updateJob(jobId, { transcript: text, step: "Transcription complete", progress: 85 });
  } catch (err: any) {
    updateJob(jobId, { status: 'error', step: 'Failed (transcription)', log: err?.message || String(err) });
  }
}
