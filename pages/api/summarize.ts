// pages/api/summarize.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { IncomingForm } from "formidable";
import { v4 as uuidv4 } from "uuid";
import { createJob, simulatePipeline } from "../../lib/jobs";

// Let formidable handle the multipart form
export const config = { api: { bodyParser: false } };

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = new IncomingForm({ multiples: false, keepExtensions: true });
  form.parse(req, (err) => {
    if (err) {
      return res.status(400).json({ error: "Upload parsing failed", details: String(err) });
    }

    const jobId = uuidv4();
    createJob(jobId);
    simulatePipeline(jobId);

    return res.status(200).json({ jobId });
  });
}
