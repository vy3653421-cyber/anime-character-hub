import test from "node:test";
import assert from "node:assert/strict";
import { inspectCapabilities } from "./capabilities";

 test("reports missing production assets without pretending they are ready", async () => {
  const result = await inspectCapabilities({
    appPath: "/definitely-missing-desktop-mate-path",
    aiConfigured: false,
    memoryReady: true,
    settingsReady: true,
  });

  assert.equal(result.avatar.enabled, false);
  assert.equal(result.voice.enabled, false);
  assert.equal(result.ai.enabled, false);
  assert.equal(result.memory.durable, true);
  assert.equal(result.settings.durable, true);
});
