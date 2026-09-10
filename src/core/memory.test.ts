import test from "node:test";
import assert from "node:assert/strict";
import { MemoryStore } from "./memory";

test("MemoryStore saves and searches entries", () => {
  const store = new MemoryStore();
  const entry = store.save("User prefers concise answers", ["preference"]);

  assert.equal(store.list().length, 1);
  assert.equal(store.search("concise")[0]?.id, entry.id);
  assert.equal(store.search("preference")[0]?.id, entry.id);
});

test("MemoryStore ignores empty search queries", () => {
  const store = new MemoryStore();
  store.save("hello");
  assert.deepEqual(store.search("   "), []);
});
