import OpenAI from 'openai';

async function main() {
  const keyPrefix = (process.env.OPENAI_API_KEY || '').slice(0, 7);
  console.log(`[test-openai] OPENAI_API_KEY loaded:`, keyPrefix ? keyPrefix + '...' : 'missing');
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  try {
    const models = await client.models.list();
    const first = models?.data?.[0]?.id || '(none)';
    console.log(`[test-openai] success, first model:`, first);
  } catch (err) {
    console.error(`[test-openai] error:`, err?.name || 'Error', err?.message || String(err));
    if (err?.stack) {
      console.error(err.stack.split('\n').slice(0, 10).join('\n'));
    }
    process.exit(1);
  }
}

main();


