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
  asrProvider?: "openai" | "groq";
  asrPreferred?: "local" | "external";
  asrUsed?: "openai" | "groq" | "local";
  transcriptError?: string;
  previewOnly?: boolean;
};

const jobs = new Map<string, JobRecord>();

export function createJob(id: string, inputName?: string): JobRecord {
  const defaultProvider = (process.env.ASR_PROVIDER as any) || 'openai';
  const job: JobRecord = { id, status: "queued", step: "Waiting", progress: 0, inputName, asrProvider: defaultProvider } as any;
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
import { probe, makePreviewClip, extractAudioToMp3, trimAudio } from './ffmpeg';
import fs from 'fs';
import OpenAI from 'openai';
import { transcribeAudio } from './asr';

export const MAX_TRANSCRIBE_SECONDS = Number(process.env.MAX_TRANSCRIBE_SECONDS || 60);

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
    const translate = (job.summaryLanguage || 'english') === 'english';

    // Optionally trim long audio for testing cost
    let audioForASR = audioPath;
    if ((job.durationSec || 0) > 120 && MAX_TRANSCRIBE_SECONDS > 0) {
      const trimmedPath = join(process.cwd(), 'uploads', jobId, `audio.trim.${MAX_TRANSCRIBE_SECONDS}.mp3`);
      appendLog(`[stage2] trimming audio to ${MAX_TRANSCRIBE_SECONDS}s at ${trimmedPath}`);
      await trimAudio(audioPath, trimmedPath, MAX_TRANSCRIBE_SECONDS);
      try {
        const st = await fs.promises.stat(trimmedPath);
        appendLog(`[stage2] trimmed audio size=${st.size} bytes`);
        audioForASR = trimmedPath;
      } catch {}
    }

    let transcriptText: string | null = null;
    let finalProvider: "openai" | "groq" | "local" | undefined = undefined;
    const configuredProvider = ((process.env.ASR_PROVIDER as any) || 'openai') as 'openai'|'groq'|'local';
    try {
      appendLog(`[stage2] starting ASR (${configuredProvider}), translate=${translate}, at ${new Date().toISOString()}`);
      transcriptText = await transcribeAudio({ provider: configuredProvider, audioPath: audioForASR, translate });
      finalProvider = configuredProvider;
    } catch (err: any) {
      const status = err?.status || err?.statusCode;
      appendLog(`[stage2] ${configuredProvider} ASR error: ${err?.message || String(err)} (status=${status ?? 'n/a'})`);
      if (configuredProvider === 'openai') {
        const canFallback = !!process.env.GROQ_API_KEY && (status === 429 || (status >= 500 && status < 600));
        if (canFallback) {
          try {
            appendLog(`[stage2] falling back to Groq ASR...`);
            transcriptText = await transcribeAudio({ provider: 'groq', audioPath: audioForASR, translate });
            finalProvider = 'groq';
          } catch (err2: any) {
            const s2 = err2?.status || err2?.statusCode;
            appendLog(`[stage2] Groq ASR error: ${err2?.message || String(err2)} (status=${s2 ?? 'n/a'})`);
          }
        }
      }
    }

    if (transcriptText) {
      appendLog(`[stage2] ASR success via ${finalProvider}, length=${transcriptText.length}, preview="${transcriptText.slice(0,200).replace(/\n/g,' ')}"`);
      updateJob(jobId, { transcript: transcriptText, asrProvider: finalProvider as any, step: "Transcription complete", progress: 85, transcriptError: undefined });
    } else {
      appendLog(`[stage2] ASR failed; completing with preview only.`);
      updateJob(jobId, { previewOnly: true, transcriptError: 'Transcription unavailable (quota or connection)', step: 'Complete (preview only)' });
      // Leave status as running; caller marks done with preview
    }
  } catch (err: any) {
    const stackLines = (err?.stack || '').split('\n').slice(0, 10).join('\n');
    const line = `[stage2] ${err?.name || 'Error'}: ${err?.message || String(err)}\n${stackLines}`;
    const cur = getJob(jobId);
    const next = ((cur?.log || '') + (cur?.log ? '\n' : '') + line).slice(-8000);
    updateJob(jobId, { status: 'error', step: 'Failed (transcription)', log: next });
  }
}
