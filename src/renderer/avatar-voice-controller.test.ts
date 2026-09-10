import test from "node:test";
import assert from "node:assert/strict";
import { AvatarVoiceController } from "./avatar-voice-controller";
import { AvatarRuntime } from "./avatar-runtime";
import type { VoiceAsset, VoicePlayback } from "../core/voice";

test("AvatarVoiceController starts voice and synchronizes avatar lip-sync to playback time", async () => {
  const runtime = new AvatarRuntime();
  const playback = new FakePlayback();
  const controller = new AvatarVoiceController(runtime, playback);
  await controller.play({ id: "line", url: "/voice/line.wav", visemes: [{ start: 0, end: 1, viseme: "A" }] });
  playback.position = 0.1;
  controller.update();
  assert.equal(runtime.status().lipSync.playing, true);
  assert.equal(runtime.status().lipSync.elapsed, 0.1);
});

class FakePlayback implements VoicePlayback {
  position = 0;
  async play(_asset: VoiceAsset): Promise<void> { this.position = 0; }
  stop(): void { this.position = 0; }
  update(): void {}
  status() { return { playing: true, currentAssetId: "line", positionSeconds: this.position }; }
}
