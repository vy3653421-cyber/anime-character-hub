import test from "node:test";
import assert from "node:assert/strict";
import { HumanVoicePlayback } from "./human-voice-playback";

test("HumanVoicePlayback accepts configured human-recorded voice assets", async () => {
  const audio = { currentTime: 0, paused: true, src: "", play: async () => {}, pause: () => {} };
  const playback = new HumanVoicePlayback(() => audio);
  await playback.play({ id: "greeting", url: "/voice/greeting.wav", durationSeconds: 2 });
  assert.equal(audio.src, "/voice/greeting.wav");
  assert.equal(playback.status().currentAssetId, "greeting");
  assert.equal(playback.status().playing, true);
});
