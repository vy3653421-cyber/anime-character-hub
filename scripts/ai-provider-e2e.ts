import assert from "node:assert/strict";
import { OpenAICompatibleProvider } from "../src/core/http-ai-provider";

const baseUrl = process.env.DESKTOP_MATE_AI_BASE_URL?.trim();
const apiKey = process.env.DESKTOP_MATE_AI_API_KEY?.trim();
const model = process.env.DESKTOP_MATE_AI_MODEL?.trim();

if (!baseUrl || !apiKey || !model) {
  console.error("Real-provider AI E2E requires DESKTOP_MATE_AI_BASE_URL, DESKTOP_MATE_AI_API_KEY, and DESKTOP_MATE_AI_MODEL.");
  process.exit(2);
}

const provider = new OpenAICompatibleProvider({
  id: "openai-compatible-e2e",
  baseUrl,
  apiKey,
  model,
  timeoutMs: 45_000,
});

const messages = [
  { role: "system" as const, content: "Reply briefly. Do not call tools." },
  { role: "user" as const, content: "Reply with exactly the word READY." },
];

const response = await provider.chat({ messages, maxOutputTokens: 8, temperature: 0 });
assert.equal(typeof response.text, "string");
assert.ok(response.text.trim().length > 0, "non-streaming response must contain text");
assert.equal(response.provider, provider.id);

let streamedText = "";
let sawDone = false;
let streamModel = "";
for await (const chunk of provider.stream({ messages, maxOutputTokens: 8, temperature: 0 })) {
  if (chunk.text) streamedText += chunk.text;
  if (chunk.model) streamModel = chunk.model;
  if (chunk.done) sawDone = true;
}
assert.ok(streamedText.trim().length > 0, "streaming response must contain text");
assert.equal(sawDone, true, "stream must terminate with done=true");
assert.ok(streamModel.length > 0, "stream must report a model");

console.log(`REAL_PROVIDER_AI_E2E_OK provider=${response.provider} model=${response.model}`);
