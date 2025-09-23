// pages/api/jobs/[jobId].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getJob } from "../../../lib/jobs";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { jobId } = req.query;

  if (!jobId || typeof jobId !== "string") {
    return res.status(400).json({ error: "Missing jobId" });
  }

  const job = getJob(jobId);
  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }

  return res.status(200).json(job);
}
