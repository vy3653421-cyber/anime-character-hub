import test from "node:test";
import assert from "node:assert/strict";
import { BrowserSpeechInput } from "./speech-input";

class FakeRecognition {
  continuous = false;
  interimResults = false;
  lang = "";
  onresult: ((event: unknown) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  onend: (() => void) | null = null;
  started = false;
  start() { this.started = true; }
  stop() { this.started = false; this.onend?.(); }
}

test("speech input exposes support and forwards recognition results", async () => {
  let instance: FakeRecognition | undefined;
  const input = new BrowserSpeechInput("en-IN", class extends FakeRecognition {
    constructor() {
      super();
      instance = this;
    }
  });
  const results: string[] = [];
  input.onResult((result) => results.push(`${result.transcript}:${result.isFinal}`));

  assert.deepEqual(input.status(), { listening: false, supported: true, error: undefined });
  await input.start();
  assert.equal(input.status().listening, true);
  assert.equal(instance?.lang, "en-IN");

  instance?.onresult?.({ results: [
    Object.assign([{ transcript: " hello ", confidence: 0.91 }], { isFinal: true }),
  ] });
  assert.deepEqual(results, ["hello:true"]);

  input.stop();
  assert.equal(input.status().listening, false);
});

test("unsupported runtime fails cleanly", async () => {
  const input = new BrowserSpeechInput("en-US", undefined);
  assert.equal(input.status().supported, false);
  await assert.rejects(() => input.start(), /not supported/);
});
