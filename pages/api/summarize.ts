// pages/api/summarize.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { IncomingForm, Files } from "formidable";
import { v4 as uuidv4 } from "uuid";
import { createJob, runStage1Real, runStage2Transcription, getJob, updateJob } from "../../lib/jobs";

// Let formidable handle the multipart form
export const config = { api: { bodyParser: false } };

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = new IncomingForm({ multiples: false, keepExtensions: true });
  form.parse(req, (err, fields, files: Files) => {
    if (err) {
      return res.status(400).json({ error: "Upload parsing failed", details: String(err) });
    }

    const fileField = (files as any).file;
    const file = Array.isArray(fileField) ? fileField[0] : fileField;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const jobId = uuidv4();
    const originalFilename = Array.isArray(file.originalFilename) ? file.originalFilename[0] : file.originalFilename || 'upload.mp4';
    const filepath = Array.isArray(file.filepath) ? file.filepath[0] : file.filepath;
    if (!filepath) {
      return res.status(400).json({ error: "Upload temp path missing" });
    }

    const formLang = (fields as any)?.summaryLanguage;
    const summaryLanguage = Array.isArray(formLang) ? formLang[0] : formLang;
    const lang: "english" | "original" = (summaryLanguage === 'original') ? 'original' : 'english';

    createJob(jobId, originalFilename);
    updateJob(jobId, { summaryLanguage: lang });

    setImmediate(() => {
      runStage1Real(jobId, filepath, originalFilename).catch(() => {});
    });

    // After Stage 1 completes (preview ready), trigger Stage 2 in background
    setImmediate(async () => {
      try {
        // Poll for stage 1 preview readiness
        for (let i = 0; i < 120; i++) { // up to ~120s
          const j = getJob(jobId);
          if (!j) break;
          // Stage 1 marks previewUrl and step to "Waiting to start transcription"
          if (j.previewUrl && j.step?.toLowerCase().includes('waiting to start transcription')) break;
          if (j.status === 'error') return; // stop on error
          await new Promise(r => setTimeout(r, 1000));
        }
        const j = getJob(jobId);
        if (j && j.previewUrl) {
          updateJob(jobId, { step: 'Transcribing audio', progress: 75 });
          await runStage2Transcription(jobId);
          const j2 = getJob(jobId);
          if (j2 && j2.transcript) {
            updateJob(jobId, { step: 'Complete', progress: 100, status: 'done', resultUrl: j2.previewUrl });
          } else if (j2 && !j2.transcript) {
            // Handle quota or non-fatal skip: finish with preview only
            updateJob(jobId, { step: 'Complete (preview only)', progress: 100, status: 'done', resultUrl: j2.previewUrl });
          }
        }
      } catch {}
    });

    return res.status(200).json({ jobId });
  });
}
