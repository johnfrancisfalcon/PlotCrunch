// pages/api/summarize.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { IncomingForm, Files } from "formidable";
import { v4 as uuidv4 } from "uuid";
import { createJob, runStage1Real } from "../../lib/jobs";

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

    createJob(jobId, originalFilename);

    setImmediate(() => {
      runStage1Real(jobId, filepath, originalFilename).catch(() => {});
    });

    return res.status(200).json({ jobId });
  });
}
