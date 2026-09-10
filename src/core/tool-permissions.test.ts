import test from "node:test";
import assert from "node:assert/strict";
import { createDefaultToolPolicy } from "./tool-permissions";

test("unknown tools are denied", () => {
  const policy = createDefaultToolPolicy();
  assert.deepEqual(policy.decide("unknown-tool"), {
    allowed: false,
    requiresConfirmation: false,
    reason: "Tool is not registered",
  });
});

test("confirmation-gated tools stay blocked until explicitly confirmed", () => {
  const policy = createDefaultToolPolicy();
  const pending = policy.decide("open-url");
  assert.equal(pending.allowed, false);
  assert.equal(pending.requiresConfirmation, true);
  assert.equal(policy.decide("open-url", true).allowed, true);
});

test("safe tools do not require confirmation", () => {
  const policy = createDefaultToolPolicy();
  assert.equal(policy.decide("notify").allowed, true);
  assert.equal(policy.decide("notify").requiresConfirmation, false);
});

test("restricted tools remain denied even when confirmed", () => {
  const policy = createDefaultToolPolicy();
  policy.register({ id: "dangerous", description: "restricted test tool", risk: "restricted", requiresConfirmation: true });
  const decision = policy.decide("dangerous", true);
  assert.equal(decision.allowed, false);
  assert.equal(decision.requiresConfirmation, false);
  assert.equal(decision.reason, "Tool is restricted");
});
