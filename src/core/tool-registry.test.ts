import test from "node:test";
import assert from "node:assert/strict";
import { ToolRegistry } from "./tool-registry";

test("ToolRegistry executes an allowed tool", async () => {
  const registry = new ToolRegistry();
  registry.register({
    id: "test.read",
    description: "Test read tool",
    requiredPermission: "read",
    async execute(input) {
      return { input };
    },
  });

  await assert.doesNotReject(async () => {
    const result = await registry.execute("test.read", "ok", {
      requestId: "req-1",
      permission: "read",
    });
    assert.deepEqual(result, { input: "ok" });
  });
});

test("ToolRegistry blocks insufficient permissions", async () => {
  const registry = new ToolRegistry();
  registry.register({
    id: "test.trusted",
    description: "Test trusted tool",
    requiredPermission: "trusted",
    async execute() {
      return true;
    },
  });

  await assert.rejects(
    registry.execute("test.trusted", undefined, {
      requestId: "req-2",
      permission: "read",
    }),
    /Permission denied/,
  );
});
