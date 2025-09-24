import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const key = process.env.OPENAI_API_KEY || '';
    return res.status(200).json({ hasKey: !!key, startsWith: key ? key.slice(0,7) : undefined });
}


