import type { NextApiRequest, NextApiResponse } from 'next';
import { getJob, runStage2Transcription } from '../../../../lib/jobs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { jobId } = req.query;
    const id = Array.isArray(jobId) ? jobId[0] : jobId;
    if (!id) return res.status(400).json({ error: 'Missing jobId' });

    const job = getJob(id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (!job.previewUrl) return res.status(400).json({ error: 'Preview not ready yet' });

    setImmediate(() => {
        runStage2Transcription(id).catch(() => {});
    });

    return res.status(200).json({ ok: true });
}


