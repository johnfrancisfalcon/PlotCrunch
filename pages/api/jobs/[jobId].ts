import type { NextApiRequest, NextApiResponse } from 'next';
import { getJob } from '../../../lib/jobs';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    const { jobId } = req.query;
    const id = Array.isArray(jobId) ? jobId[0] : jobId;
    if (!id) return res.status(400).json({ error: 'Missing jobId' });

    const job = getJob(id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    return res.status(200).json(job);
}
