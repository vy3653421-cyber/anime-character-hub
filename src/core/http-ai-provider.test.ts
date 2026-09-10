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
    assert.equal(result.text, "hello");
    assert.equal(result.model, "test-model");
    assert.equal(result.provider, "test");
    assert.equal(requestBody?.model, "default");
    assert.equal(requestBody?.temperature, 0.2);
    assert.equal(requestBody?.max_tokens, 32);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("OpenAICompatibleProvider reports provider errors", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify({ error: { message: "bad key" } }), { status: 401 })) as typeof fetch;
  try {
    const provider = new OpenAICompatibleProvider({ id: "test", baseUrl: "https://example.test/v1", apiKey: "secret", model: "default" });
    await assert.rejects(() => provider.chat({ messages: [{ role: "user", content: "hi" }] }), /AI provider 401/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
