import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { AvatarExpressionController } from "./avatar-expression-controller";
import { AvatarLipSync } from "./avatar-lipsync";

test("AvatarLipSync advances deterministic viseme cues", () => {
  const root = new THREE.Object3D();
  const geometry = new THREE.BufferGeometry();
  const material = new THREE.MeshBasicMaterial();
  const mesh = new THREE.SkinnedMesh(geometry, material);
  mesh.morphTargetDictionary = { MouthOpen: 0, Smile: 1 };
  mesh.morphTargetInfluences = [0, 0];
  root.add(mesh);

  const expressions = new AvatarExpressionController();
  expressions.bind(root);
  const lipSync = new AvatarLipSync(expressions);
  lipSync.load([{ start: 0, end: 0.2, viseme: "A" }, { start: 0.2, end: 0.4, viseme: "E" }]);
  lipSync.start();
  lipSync.update(0.1);
  expressions.update(0.1);

  assert.equal(lipSync.status().activeViseme, "A");
  assert.ok((mesh.morphTargetInfluences?.[0] ?? 0) > 0);

  lipSync.update(0.15);
  assert.equal(lipSync.status().activeViseme, "E");
});

test("AvatarLipSync stops cleanly after the final cue", () => {
  const expressions = new AvatarExpressionController();
  const lipSync = new AvatarLipSync(expressions);
  lipSync.load([{ start: 0, end: 0.1, viseme: "M" }]);
  lipSync.start();
  lipSync.update(0.2);
  assert.equal(lipSync.status().playing, false);
});

test("AvatarLipSync can synchronize directly to an audio clock", () => {
  const expressions = new AvatarExpressionController();
  const lipSync = new AvatarLipSync(expressions);
  lipSync.load([{ start: 0.5, end: 0.8, viseme: "O" }]);
  lipSync.start();
  lipSync.syncToAudioTime(0.65);
  assert.equal(lipSync.status().activeViseme, "O");
  assert.equal(lipSync.status().elapsed, 0.65);
});
