import test from "node:test";
import assert from "node:assert/strict";
import { BehaviorBrain } from "./behavior-brain";

test("direct user messages receive immediate attention", () => {
  const brain = new BehaviorBrain();
  const decision = brain.decide({ type: "user-message", active: true }, 1_000);
  assert.equal(decision.avatarState, "talking");
  assert.equal(decision.attentionTarget, "user");
  assert.equal(decision.shouldSpeak, true);
});

test("autonomy gates proactive completion speech", () => {
  const quiet = new BehaviorBrain({ autonomy: 50, speechCooldownMs: 1_000, idleAfterMs: 60_000 });
  const social = new BehaviorBrain({ autonomy: 80, speechCooldownMs: 1_000, idleAfterMs: 60_000 });
  assert.equal(quiet.decide({ type: "task-completed" }, 2_000).shouldSpeak, false);
  assert.equal(social.decide({ type: "task-completed" }, 2_000).shouldSpeak, true);
});

test("speech cooldown suppresses repeated proactive speech", () => {
  const brain = new BehaviorBrain({ autonomy: 80, speechCooldownMs: 10_000, idleAfterMs: 60_000 });
  assert.equal(brain.decide({ type: "task-completed" }, 20_000).shouldSpeak, true);
  assert.equal(brain.decide({ type: "task-completed" }, 25_000).shouldSpeak, false);
  assert.equal(brain.decide({ type: "task-completed" }, 31_000).shouldSpeak, true);
});
