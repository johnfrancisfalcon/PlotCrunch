import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import OpenAI from 'openai';
import Groq from 'groq-sdk';

export type ASRProvider = 'openai' | 'groq' | 'local';

export async function transcribeAudio({ provider, audioPath, translate }: { provider: ASRProvider, audioPath: string, translate: boolean }): Promise<string> {
    if (provider === 'openai') {
        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const fileStream = fs.createReadStream(audioPath);
        const resp = await client.audio.transcriptions.create({
            model: 'whisper-1',
            file: fileStream as any,
            translate,
            response_format: 'json'
        } as any);
        return (resp as any)?.text || '';
    }
    if (provider === 'groq') {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) throw new Error('GROQ_API_KEY not set');
        const groq = new Groq({ apiKey });
        const fileStream = fs.createReadStream(audioPath);
        const resp = await groq.audio.transcriptions.create({
            model: 'whisper-large-v3-turbo',
            file: fileStream as any,
            // Groq API largely mirrors OpenAI; adjust params if needed
            translate
        } as any);
        return (resp as any)?.text || '';
    }
    if (provider === 'local') {
        // Determine binary based on platform
        const isWin = process.platform === 'win32';
        const bin = path.join(process.cwd(), 'bin', isWin ? 'whisper.exe' : 'whisper');
        const modelDir = path.join(process.cwd(), 'models');
        const defaultModel = translate ? 'ggml-base.en.bin' : 'ggml-base.en.bin';
        const modelPath = path.join(modelDir, defaultModel);
        // Output prefix in same uploads folder
        const outPrefix = path.join(path.dirname(audioPath), 'out');

        // Basic checks
        if (!fs.existsSync(bin) || !fs.existsSync(modelPath)) {
            throw new Error('Local ASR not set up');
        }

        const args = ['-m', modelPath, '-f', audioPath, '--output-txt', '-of', outPrefix];
        if (translate) args.push('--translate');

        await new Promise<void>((resolve, reject) => {
            const child = spawn(bin, args, { stdio: ['ignore', 'pipe', 'pipe'] });
            let stdout = '';
            let stderr = '';
            child.stdout.on('data', (d) => { stdout += d.toString(); });
            child.stderr.on('data', (d) => { stderr += d.toString(); });
            child.on('error', reject);
            child.on('close', (code) => {
                if (code !== 0) {
                    return reject(new Error(`whisper exited with code ${code}: ${stderr || stdout}`));
                }
                resolve();
            });
        });

        const outTxt = `${outPrefix}.txt`;
        if (fs.existsSync(outTxt)) {
            return await fs.promises.readFile(outTxt, 'utf8');
        }
        // Some builds print to stdout; fallback
        throw new Error('Local ASR produced no output file');
    }
    throw new Error(`Unsupported ASR provider: ${provider}`);
}


