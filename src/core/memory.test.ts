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

test("MemoryStore matches meaningful words instead of requiring an exact phrase", () => {
  const store = new MemoryStore();
  const entry = store.save("The user likes desktop companions", ["project"]);

  assert.equal(store.search("Tell me about desktop companions")[0]?.id, entry.id);
});

test("MemoryStore ranks exact phrase matches before partial matches", () => {
  const store = new MemoryStore();
  const partial = store.save("Desktop companions can run on Windows", ["runtime"]);
  const exact = store.save("Desktop companions", ["project"]);

  const results = store.search("desktop companions");
  assert.equal(results[0]?.id, exact.id);
  assert.equal(results[1]?.id, partial.id);
});

test("MemoryStore ignores empty search queries", () => {
  const store = new MemoryStore();
  store.save("hello");
  assert.deepEqual(store.search("   "), []);
});
