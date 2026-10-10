// Smoke test: confirm the account can call the Claude inference profiles the
// app uses, with the credentials in the current environment.
//
//   node scripts/aws/bedrock-smoke.mjs [modelId ...]
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';

const region = process.env.AWS_REGION || process.env.BEDROCK_REGION || 'us-east-1';
const models = process.argv.slice(2).length
  ? process.argv.slice(2)
  : [process.env.BEDROCK_NOTE_MODEL_ID || 'us.anthropic.claude-opus-5-5', process.env.BEDROCK_CHAT_MODEL_ID || 'us.anthropic.claude-sonnet-5-5'];

const client = new BedrockRuntimeClient({ region });
let failed = 0;
for (const modelId of models) {
  const t0 = Date.now();
  try {
    const r = await client.send(new ConverseCommand({
      modelId,
      system: [{ text: 'Reply with one short sentence.' }],
      messages: [{ role: 'user', content: [{ text: 'Say hello.' }] }],
      inferenceConfig: { maxTokens: 40, temperature: 0.2 },
    }));
    const text = r.output.message.content.map((c) => c.text || '').join('').trim();
    console.log(`OK    ${modelId}  ${Date.now() - t0} ms  "${text.slice(0, 60)}"  tokens in/out ${r.usage.inputTokens}/${r.usage.outputTokens}`);
  } catch (e) {
    failed++;
    console.log(`FAIL  ${modelId}  ${e.name}: ${String(e.message).slice(0, 160)}`);
  }
}
process.exit(failed ? 1 : 0);
