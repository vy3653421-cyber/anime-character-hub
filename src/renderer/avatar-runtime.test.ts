import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { AvatarRuntime } from "./avatar-runtime";
import { createResponsePlan } from "../core/response-plan";

test("AvatarRuntime applies a response plan to the animation state", () => {
  const runtime = new AvatarRuntime();
  const root = new THREE.Object3D();
  const clips = [
    new THREE.AnimationClip("idle", 1, []),
    new THREE.AnimationClip("happy", 1, []),
  ];

  const initial = runtime.load(root, clips);
  assert.equal(initial.loaded, true);
  assert.equal(initial.state, "idle");

  const plan = createResponsePlan({
    responseText: "Done.",
    emotion: "happy",
    intensity: 0.55,
    attentionTarget: "user",
    gesture: "small-wave",
    posture: "attentive",
    gaze: "direct",
    speechStyle: "warm",
    interruptionPolicy: "allow",
    avatarState: "happy",
    toolRequests: [],
  });

  const updated = runtime.applyPlan(plan);
  assert.equal(updated.state, "happy");
  assert.equal(updated.intensity, 0.55);
  assert.equal(updated.activeClip, "happy");

  runtime.dispose();
  assert.equal(runtime.status().loaded, false);
});
