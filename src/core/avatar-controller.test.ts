import test from "node:test";
import assert from "node:assert/strict";
import { AvatarAnimationController } from "./avatar-controller";

test("AvatarAnimationController resolves semantic animation names", () => {
  const controller = new AvatarAnimationController();
  controller.setState("talking");
  assert.equal(controller.resolveCurrentClip(["Idle", "Talk", "Happy"]), "Talk");
});

test("AvatarAnimationController returns undefined when a state has no matching clip", () => {
  const controller = new AvatarAnimationController();
  controller.setState("surprised");
  assert.equal(controller.resolveCurrentClip(["Idle", "Breathing"]), undefined);
});
