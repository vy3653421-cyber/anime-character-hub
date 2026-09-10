import test from "node:test";
import assert from "node:assert/strict";
import { CompanionSettingsStore, DEFAULT_SETTINGS } from "./settings";

test("CompanionSettingsStore returns validated defaults", async () => {
  const store = new CompanionSettingsStore();
  assert.deepEqual(await store.get(), DEFAULT_SETTINGS);
});

test("CompanionSettingsStore updates only supported settings", async () => {
  const store = new CompanionSettingsStore();
  const updated = await store.update({ responseStyle: "detailed", alwaysOnTop: false });
  assert.equal(updated.responseStyle, "detailed");
  assert.equal(updated.alwaysOnTop, false);
  assert.equal(updated.name, DEFAULT_SETTINGS.name);
});
