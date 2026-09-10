import test from "node:test";
import assert from "node:assert/strict";
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
