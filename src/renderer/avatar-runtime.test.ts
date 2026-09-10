import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { AvatarRuntime } from "./avatar-runtime";
import { createResponsePlan } from "../core/response-plan";

test("AvatarRuntime applies a response plan to the animation state", () => {
  const runtime = new AvatarRuntime();
  const root = new THREE.Object3D();
  const clips = [new THREE.AnimationClip("idle", 1, []), new THREE.AnimationClip("happy", 1, [])];
  const initial = runtime.load(root, clips);
  assert.equal(initial.loaded, true);
  assert.equal(initial.state, "idle");

  const plan = createResponsePlan({ responseText: "Done.", emotion: "happy", intensity: 0.55, attentionTarget: "user", gesture: "small-wave", posture: "attentive", gaze: "direct", speechStyle: "warm", interruptionPolicy: "allow", avatarState: "happy", toolRequests: [] });
  const updated = runtime.applyPlan(plan);
  assert.equal(updated.state, "happy");
  assert.equal(updated.intensity, 0.55);
  assert.equal(updated.activeClip, "happy");
  assert.equal(updated.activeWeight, 0.55);

  const strongerPlan = createResponsePlan({ responseText: "Really happy.", emotion: "happy", intensity: 0.9, attentionTarget: "user", gesture: "small-wave", posture: "attentive", gaze: "direct", speechStyle: "warm", interruptionPolicy: "allow", avatarState: "happy", toolRequests: [] });
  const stronger = runtime.applyPlan(strongerPlan);
  assert.equal(stronger.activeClip, "happy");
  assert.equal(stronger.activeWeight, 0.9);

  runtime.dispose();
  assert.equal(runtime.status().loaded, false);
});

test("AvatarRuntime binds named secondary-motion bones when an avatar provides them", () => {
  const runtime = new AvatarRuntime();
  const root = new THREE.Object3D();
  const hair = new THREE.Object3D();
  hair.name = "HairFront";
  root.add(hair);

  const status = runtime.load(root, [new THREE.AnimationClip("idle", 1, [])]);
  assert.equal(status.secondaryPhysicsBound, 1);
});
