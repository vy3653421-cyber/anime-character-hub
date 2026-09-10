import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { AvatarPhysics } from "./avatar-physics";

test("AvatarPhysics preserves a configured rest rotation and settles toward it", () => {
  const root = new THREE.Object3D();
  const bone = new THREE.Object3D();
  bone.name = "HairFront";
  bone.rotation.z = 0.35;
  root.add(bone);

  const physics = new AvatarPhysics();
  const report = physics.bind(root, [{ boneName: "HairFront", stiffness: 18, damping: 8, maxAngle: 0.5 }]);

  assert.equal(report.bound, 1);
  bone.rotation.z = 0;
  physics.update(0.05);
  assert.ok(bone.rotation.z > 0);

  for (let i = 0; i < 120; i += 1) physics.update(1 / 60);
  assert.ok(Math.abs(bone.rotation.z - 0.35) < 0.02);
});

test("AvatarPhysics clamps excessive secondary-motion displacement", () => {
  const root = new THREE.Object3D();
  const bone = new THREE.Object3D();
  bone.name = "HairSide";
  root.add(bone);

  const physics = new AvatarPhysics();
  physics.bind(root, [{ boneName: "HairSide", stiffness: 12, damping: 4, maxAngle: 0.25 }]);
  bone.rotation.z = 2;
  physics.update(1 / 60);

  assert.ok(Math.abs(bone.rotation.z) <= 0.25);
});
