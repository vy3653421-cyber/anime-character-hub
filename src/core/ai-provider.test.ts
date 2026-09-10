import test from "node:test";
import assert from "node:assert/strict";
import { ProviderRegistry, type AIProvider } from "./ai-provider";

test("ProviderRegistry prevents duplicate providers", () => {
  const registry = new ProviderRegistry();
  const provider: AIProvider = {
    id: "mock",
    async chat() {
      return { text: "ok", model: "mock", provider: "mock" };
    },
  };

  registry.register(provider);
  assert.equal(registry.get("mock"), provider);
  assert.throws(() => registry.register(provider), /already registered/);
});
