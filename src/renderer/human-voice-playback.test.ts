import test from "node:test";
import assert from "node:assert/strict";
import { HumanVoicePlayback } from "./human-voice-playback";

test("HumanVoicePlayback accepts configured human-recorded voice assets", async () => {
  const audio = {
    currentTime: 0,
    paused: true,
    src: "",
    play: async function () {
      audio.paused = false;
    },
    pause: function () {
      audio.paused = true;
    },
  };
  const playback = new HumanVoicePlayback(() => audio);
  await playback.play({ id: "greeting", url: "/voice/greeting.wav", durationSeconds: 2 });
  assert.equal(audio.src, "/voice/greeting.wav");
  assert.equal(playback.status().currentAssetId, "greeting");
  assert.equal(playback.status().playing, true);
});

test("HumanVoicePlayback stops and resets the active asset", async () => {
  const audio = {
    currentTime: 0,
    paused: true,
    src: "",
    play: async function () {
      audio.paused = false;
    },
    pause: function () {
      audio.paused = true;
    },
  };
  const playback = new HumanVoicePlayback(() => audio);
  await playback.play({ id: "greeting", url: "/voice/greeting.wav", durationSeconds: 2 });
  audio.currentTime = 1.25;
  playback.stop();
  assert.equal(audio.paused, true);
  assert.equal(audio.currentTime, 0);
  assert.equal(playback.status().currentAssetId, undefined);
  assert.equal(playback.status().playing, false);
});
