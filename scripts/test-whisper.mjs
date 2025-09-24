import fs from 'fs';
import OpenAI from 'openai';

async function main() {
  const keyPrefix = (process.env.OPENAI_API_KEY || '').slice(0, 7);
  console.log(`[test-whisper] OPENAI_API_KEY loaded:`, keyPrefix ? keyPrefix + '...' : 'missing');
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const audioPath = './public/test.mp3';
  if (!fs.existsSync(audioPath)) {
    console.log(`[test-whisper] No test audio found at ${audioPath}. Place a small MP3 to test.`);
    return;
  }

  const stream = fs.createReadStream(audioPath);
  try {
    console.log('[test-whisper] calling openai.audio.transcriptions.create ...');
    const result = await client.audio.transcriptions.create({
      model: 'whisper-1',
      file: stream,
      response_format: 'json'
    });
    console.log('[test-whisper] text:', result?.text || '(no text)');
  } catch (err) {
    console.error('[test-whisper] error:', err?.name || 'Error', err?.message || String(err));
    if (err?.stack) {
      console.error(err.stack.split('\n').slice(0, 10).join('\n'));
    }
    process.exit(1);
  }
}

main();


