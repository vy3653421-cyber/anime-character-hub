import test from "node:test";
import assert from "node:assert/strict";
import { OpenAICompatibleProvider } from "./http-ai-provider";

test("OpenAICompatibleProvider sends chat completion requests and parses text", async () => {
  const originalFetch = globalThis.fetch;
  let requestBody: Record<string, unknown> | undefined;
  globalThis.fetch = (async (_input, init) => {
    requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
    return new Response(JSON.stringify({ model: "test-model", choices: [{ message: { content: "hello" } }] }), { status: 200 });
  }) as typeof fetch;
  try {
    const provider = new OpenAICompatibleProvider({ id: "test", baseUrl: "https://example.test/v1", apiKey: "secret", model: "default" });
    const result = await provider.chat({ messages: [{ role: "user", content: "hi" }], temperature: 0.2, maxOutputTokens: 32 });
    assert.equal(result.text, "hello"); assert.equal(result.model, "test-model"); assert.equal(result.provider, "test");
    assert.equal(requestBody?.model, "default"); assert.equal(requestBody?.temperature, 0.2); assert.equal(requestBody?.max_tokens, 32);
  } finally { globalThis.fetch = originalFetch; }
});

test("OpenAICompatibleProvider reports provider errors", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify({ error: { message: "bad key" } }), { status: 401 })) as typeof fetch;
  try {
    const provider = new OpenAICompatibleProvider({ id: "test", baseUrl: "https://example.test/v1", apiKey: "secret", model: "default" });
    await assert.rejects(() => provider.chat({ messages: [{ role: "user", content: "hi" }] }), /AI provider 401/);
  } finally { globalThis.fetch = originalFetch; }
});

test("OpenAICompatibleProvider parses OpenAI-compatible SSE deltas", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (_input, init) => {
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    assert.equal(body.stream, true);
    const encoder = new TextEncoder();
    const chunks = [
      "data: {\"id\":\"x\",\"model\":\"stream-model\",\"choices\":[{\"delta\":{\"content\":\"Hel\"}}]}\n\n",
      "data: {\"choices\":[{\"delta\":{\"content\":\"lo\"}}]}\n\n",
      "data: [DONE]\n\n",
    ];
    const stream = new ReadableStream<Uint8Array>({
      start(controller) { for (const chunk of chunks) controller.enqueue(encoder.encode(chunk)); controller.close(); },
    });
    return new Response(stream, { status: 200, headers: { "content-type": "text/event-stream" } });
  }) as typeof fetch;
  try {
    const provider = new OpenAICompatibleProvider({ id: "test", baseUrl: "https://example.test/v1", apiKey: "secret", model: "default" });
    const chunks = [];
    for await (const chunk of provider.stream({ messages: [{ role: "user", content: "hi" }] })) chunks.push(chunk);
    assert.deepEqual(chunks.map((chunk) => chunk.text), ["Hel", "lo", ""]);
    assert.equal(chunks.at(-1)?.done, true);
    assert.equal(chunks.at(-1)?.model, "stream-model");
  } finally { globalThis.fetch = originalFetch; }
});
