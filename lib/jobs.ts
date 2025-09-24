// lib/jobs.ts
type JobStatus = "queued" | "running" | "error" | "done";

export type JobRecord = {
  id: string;
  status: JobStatus;
  step: string;
  progress: number; // 0..100
  resultUrl?: string;
  previewUrl?: string;
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

    // Do not complete yet; Stage 2 transcription runs next. Store preview URL and advance step.
    updateJob(jobId, { step: "Waiting to start transcription", progress: 70, status: "running", previewUrl: `/${outRel.replace(/\\/g, '/')}` });
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
    // logging helper
    const appendLog = (line: string) => {
      const cur = getJob(jobId);
      const next = ((cur?.log || '') + (cur?.log ? '\n' : '') + line).slice(-8000);
      updateJob(jobId, { log: next });
    };

    appendLog(`[stage2] extractAudioToMp3: input=${inputPath}, output=${audioPath}`);
    await extractAudioToMp3(inputPath, audioPath);
    try {
      await fs.promises.access(audioPath, fs.constants.F_OK);
      const st = await fs.promises.stat(audioPath);
      appendLog(`[stage2] audio exists: ${audioPath} (${st.size} bytes)`);
    } catch {
      appendLog(`[stage2] audio missing after extraction: ${audioPath}`);
    }

    updateJob(jobId, { step: "Transcribing audio", progress: 75 });
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 60_000,
      baseURL: process.env.OPENAI_BASE_URL || undefined,
      maxRetries: 0
    } as any);
    const translate = (job.summaryLanguage || 'english') === 'english';
    const keyPrefix = (process.env.OPENAI_API_KEY || '').slice(0, 7);
    appendLog(`[stage2] OPENAI key loaded: ${keyPrefix ? keyPrefix + '...' : 'missing'}`);
    appendLog(`[stage2] starting Whisper call, translate=${translate}, at ${new Date().toISOString()}`);
    const fileStream = fs.createReadStream(audioPath);
    let result;
    const attempts = 3;
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        appendLog(`[stage2] Whisper attempt ${attempt}/${attempts} ...`);
        result = await openai.audio.transcriptions.create({
          model: 'whisper-1',
          file: fileStream as any,
          translate,
          response_format: 'json'
        } as any);
        break;
      } catch (err: any) {
        const stackLines = (err?.stack || '').split('\n').slice(0, 10).join('\n');
        const status = err?.status || err?.statusCode;
        appendLog(`[stage2] Whisper error attempt ${attempt}: ${err?.name || 'Error'}: ${err?.message || String(err)} (status=${status ?? 'n/a'})\n${stackLines}`);
        if (attempt === attempts) {
          if (status === 429) {
            appendLog('[stage2] Quota exceeded. Skipping transcription and proceeding with preview only.');
            // Leave status as running; caller will finalize as done with preview
            return;
          }
          updateJob(jobId, { status: 'error', step: 'Failed (transcription)' });
          return;
        }
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }

    const text = (result as any)?.text || '';
    appendLog(`[stage2] Whisper response received, length=${text.length}, preview="${text.slice(0, 200).replace(/\n/g, ' ')}"`);
    updateJob(jobId, { transcript: text, step: "Transcription complete", progress: 85 });
  } catch (err: any) {
    const stackLines = (err?.stack || '').split('\n').slice(0, 10).join('\n');
    const line = `[stage2] ${err?.name || 'Error'}: ${err?.message || String(err)}\n${stackLines}`;
    const cur = getJob(jobId);
    const next = ((cur?.log || '') + (cur?.log ? '\n' : '') + line).slice(-8000);
    updateJob(jobId, { status: 'error', step: 'Failed (transcription)', log: next });
  }
}
