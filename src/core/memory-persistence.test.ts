import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MemoryStore } from "./memory";
import { JsonFileMemoryPersistence } from "./memory-store";

test("memory store persists entries and restores them", async () => {
  const directory = await mkdtemp(join(tmpdir(), "desktop-mate-memory-"));
  const filePath = join(directory, "memory.json");
  try {
    const first = new MemoryStore(new JsonFileMemoryPersistence(filePath));
    await first.ready();
    first.save("The user prefers concise answers", ["preference"]);
    await first.flush();

    const second = new MemoryStore(new JsonFileMemoryPersistence(filePath));
    await second.ready();
    assert.equal(second.list()[0]?.content, "The user prefers concise answers");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
