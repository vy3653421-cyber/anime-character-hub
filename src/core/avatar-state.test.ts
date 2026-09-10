import test from "node:test";
import assert from "node:assert/strict";
import { AvatarStateMachine } from "./avatar-state";

test("AvatarStateMachine clamps intensity", () => {
  const machine = new AvatarStateMachine();
  assert.equal(machine.set("happy", 2).intensity, 1);
  assert.equal(machine.set("thinking", -1).intensity, 0);
  assert.equal(machine.get().state, "thinking");
});
