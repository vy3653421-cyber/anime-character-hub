import test from "node:test";
import assert from "node:assert/strict";
import { resolveRecordedVoiceLine, selectVoiceAsset, validateVoiceManifest, type VoiceManifest } from "./voice-manifest";

const manifest: VoiceManifest = {
  version: 1,
  voiceId: "companion-en-01",
  displayName: "Companion Voice",
  actorCredit: "Human voice actor — licensed recording",
  license: "Replace with the project's actual voice license before release.",
  assets: [{ id: "greeting", url: "/assets/voice/greeting.ogg", transcript: "Hello there!", visemes: [{ start: 0, end: 0.2, viseme: "A" }] }],
};

test("voice manifest accepts valid human-recorded asset metadata", () => {
  assert.equal(validateVoiceManifest(manifest), true);
  assert.equal(selectVoiceAsset(manifest, "greeting")?.url, "/assets/voice/greeting.ogg");
});

test("voice manifest rejects invalid viseme timings and names", () => {
  assert.equal(validateVoiceManifest({ ...manifest, assets: [{ id: "x", url: "/x.ogg", visemes: [{ start: 1, end: 0, viseme: "A" }] }] }), false);
  assert.equal(validateVoiceManifest({ ...manifest, assets: [{ id: "x", url: "/x.ogg", visemes: [{ start: 0, end: 1, viseme: "BAD" }] }] }), false);
});

test("voice manifest requires actor attribution and license", () => {
  assert.equal(validateVoiceManifest({ ...manifest, actorCredit: "" }), false);
  assert.equal(validateVoiceManifest({ ...manifest, license: "" }), false);
});

test("voice line resolver only selects an exact recorded transcript", () => {
  assert.equal(resolveRecordedVoiceLine(manifest, "  hello THERE! ")?.id, "greeting");
  assert.equal(resolveRecordedVoiceLine(manifest, "Hello there, friend!"), undefined);
  assert.equal(resolveRecordedVoiceLine(manifest, ""), undefined);
});
