import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { validateAvatar } from "./avatar-validator";

test("validateAvatar maps supported animation semantics and reports face capabilities", () => {
  const root = new THREE.Object3D();
  const geometry = new THREE.BufferGeometry();
  const material = new THREE.MeshBasicMaterial();
  const mesh = new THREE.SkinnedMesh(geometry, material);
  mesh.morphTargetDictionary = { Smile: 0, Blink: 1 };
  root.add(mesh);

  const clips = [
    new THREE.AnimationClip("Idle", 1, []),
    new THREE.AnimationClip("Breathing", 1, []),
    new THREE.AnimationClip("Blink", 0.2, []),
    new THREE.AnimationClip("Talking", 1, []),
    new THREE.AnimationClip("Happy", 1, []),
    new THREE.AnimationClip("Surprised", 1, []),
    new THREE.AnimationClip("Concerned", 1, []),
  ];

  const report = validateAvatar(root, clips);

  assert.equal(report.valid, true);
  assert.equal(report.skinnedMeshes, 1);
  assert.equal(report.morphTargetCount, 2);
  assert.equal(report.semanticClips.idle, "Idle");
  assert.equal(report.semanticClips.blink, "Blink");
  assert.equal(report.semanticClips.talking, "Talking");
  assert.equal(report.semanticClips.happy, "Happy");
  assert.equal(report.semanticClips.surprised, "Surprised");
  assert.equal(report.semanticClips.concerned, "Concerned");
});

test("validateAvatar rejects an unusable avatar and explains missing requirements", () => {
  const report = validateAvatar(new THREE.Object3D(), []);

  assert.equal(report.valid, false);
  assert.match(report.errors.join(" | "), /no skinned mesh/i);
  assert.match(report.errors.join(" | "), /no animation clips/i);
  assert.match(report.errors.join(" | "), /idle or breathing/i);
  assert.match(report.warnings.join(" | "), /no facial morph targets/i);
});
