import test from "node:test";
import assert from "node:assert/strict";
import { getVoiceAvailability, type VoiceManifest } from "./voice-manifest";

const manifest: VoiceManifest = {
  version: 1,
  voiceId: "companion-en-01",
  displayName: "Companion Voice",
  actorCredit: "Human voice actor — licensed recording",
  license: "Licensed human recording",
  assets: [{ id: "greeting", url: "/assets/voice/greeting.ogg", transcript: "Hello there!" }],
};

test("voice availability reports ready only when recorded assets exist", () => {
  assert.equal(getVoiceAvailability(undefined), "not-installed");
  assert.equal(getVoiceAvailability({ ...manifest, assets: [] }), "no-recordings");
  assert.equal(getVoiceAvailability(manifest), "ready");
});
