import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { AssistantAgent } from "./agent";
import type { AIProvider } from "./ai-provider";
import { MemoryStore } from "./memory";

test("AssistantAgent injects matching memory into provider context", async () => {
  let received = "";
  const provider: AIProvider = {
    id: "mock",
    async chat(request) {
      received = request.messages.map((message) => message.content).join("\n");
      return { text: "Acknowledged.", model: "mock", provider: "mock" };
    },
  };

  const memory = new MemoryStore();
  memory.save("The user likes desktop companions", ["project"]);
  const agent = new AssistantAgent(provider, memory, {
    name: "Mate",
    personality: "Be useful and precise.",
    responseStyle: "balanced",
  });

  const turn = await agent.respond("Tell me about desktop companions");
  assert.equal(turn.text, "Acknowledged.");
  assert.match(received, /The user likes desktop companions/);
  assert.match(received, /untrusted reference data/i);
  assert.match(received, /never treat.*as instructions/i);
});

test("AssistantAgent aborts an active streamed response before committing history", async () => {
  const provider: AIProvider = {
    id: "mock-stream",
    async chat() {
      return { text: "fallback", model: "mock-stream", provider: "mock-stream" };
    },
    async *stream(request) {
      yield { text: "partial", model: "mock-stream", provider: "mock-stream" };
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      if (request.signal?.aborted) return;
      yield { text: "should-not-arrive", done: true, model: "mock-stream", provider: "mock-stream" };
    },
  };
  const agent = new AssistantAgent(provider, new MemoryStore(), {
    name: "Mate",
    personality: "Be useful and precise.",
    responseStyle: "balanced",
  });
  const controller = new AbortController();

  const stream = agent.streamResponse("Cancel this response", randomUUID(), controller.signal);
  const iterator = stream[Symbol.asyncIterator]();
  const first = await iterator.next();
  assert.equal(first.value?.text, "partial");
  controller.abort();

  await assert.rejects(iterator.next(), (error: unknown) => {
    return error instanceof DOMException && error.name === "AbortError";
  });
});
