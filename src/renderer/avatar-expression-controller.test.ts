import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { AvatarExpressionController } from "./avatar-expression-controller";

test("AvatarExpressionController binds common facial morphs and smooths expression weights", () => {
  const root = new THREE.Object3D();
  const geometry = new THREE.BufferGeometry();
  const material = new THREE.MeshBasicMaterial();
  const mesh = new THREE.SkinnedMesh(geometry, material);
  mesh.morphTargetDictionary = { Smile: 0, Blink: 1, MouthOpen: 2, BrowUp: 3 };
  mesh.morphTargetInfluences = [0, 0, 0, 0];
  root.add(mesh);

  const controller = new AvatarExpressionController();
  const report = controller.bind(root);

  assert.equal(report.morphTargets, 4);
  assert.equal(report.mapped.smile, 1);
  assert.equal(report.mapped.blink, 1);
  assert.equal(report.mapped.mouthOpen, 1);
  assert.equal(report.mapped.browUp, 1);

  controller.setExpression({ smile: 1, blink: 0.5, mouthOpen: 0.8 });
  controller.update(0.1);

  assert.ok((mesh.morphTargetInfluences?.[0] ?? 0) > 0);
  assert.ok((mesh.morphTargetInfluences?.[1] ?? 0) > 0);
  assert.ok((mesh.morphTargetInfluences?.[2] ?? 0) > 0);
});

test("AvatarExpressionController preserves the animation-produced base and decays cleanly", () => {
  const root = new THREE.Object3D();
  const geometry = new THREE.BufferGeometry();
  const material = new THREE.MeshBasicMaterial();
  const mesh = new THREE.SkinnedMesh(geometry, material);
  mesh.morphTargetDictionary = { Smile: 0 };
  mesh.morphTargetInfluences = [0.25];
  root.add(mesh);

  const controller = new AvatarExpressionController();
  controller.bind(root);
  controller.setExpression({ smile: 0.5 });
  controller.update(0.2);

  const expressed = mesh.morphTargetInfluences?.[0] ?? 0;
  assert.ok(expressed > 0.25);

  mesh.morphTargetInfluences![0] = 0.4;
  controller.clearExpressions();
  controller.update(1);

  assert.equal(mesh.morphTargetInfluences?.[0], 0.4);
});
