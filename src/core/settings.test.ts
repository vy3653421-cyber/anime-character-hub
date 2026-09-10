import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
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

test("CompanionSettingsStore persists settings and reloads them", async () => {
  const directory = await mkdtemp(join(tmpdir(), "desktop-mate-settings-"));
  const filePath = join(directory, "settings.json");

  try {
    const first = new CompanionSettingsStore(filePath);
    await first.update({
      name: "Mate QA",
      responseStyle: "concise",
      alwaysOnTop: false,
      launchAtLogin: true,
      voiceEnabled: false,
      microphoneEnabled: true,
      toolConfirmations: false,
    });

    const persisted = JSON.parse(await readFile(filePath, "utf8")) as Record<string, unknown>;
    assert.equal(persisted.name, "Mate QA");
    assert.equal(persisted.alwaysOnTop, false);

    const second = new CompanionSettingsStore(filePath);
    assert.deepEqual(await second.get(), {
      ...DEFAULT_SETTINGS,
      name: "Mate QA",
      responseStyle: "concise",
      alwaysOnTop: false,
      launchAtLogin: true,
      voiceEnabled: false,
      microphoneEnabled: true,
      toolConfirmations: false,
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("CompanionSettingsStore falls back to safe defaults for invalid persisted values", async () => {
  const directory = await mkdtemp(join(tmpdir(), "desktop-mate-settings-invalid-"));
  const filePath = join(directory, "settings.json");

  try {
    await writeFile(filePath, JSON.stringify({ name: "   ", responseStyle: "unknown", alwaysOnTop: "yes" }), "utf8");
    const store = new CompanionSettingsStore(filePath);
    assert.deepEqual(await store.get(), DEFAULT_SETTINGS);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
