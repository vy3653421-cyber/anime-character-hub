import test from "node:test";
import assert from "node:assert/strict";
import { ResponsePlanner } from "./response-planner";

test("ResponsePlanner converts behavior decisions into an animation-ready plan", () => {
  const planner = new ResponsePlanner();
  const plan = planner.plan("Task complete.", {
    avatarState: "happy",
    intensity: 0.55,
    attentionTarget: "user",
    shouldSpeak: true,
    speechReason: "task completed",
  });

  assert.equal(plan.responseText, "Task complete.");
  assert.equal(plan.emotion, "happy");
  assert.equal(plan.attentionTarget, "user");
  assert.equal(plan.gaze, "direct");
  assert.equal(plan.speechStyle, "warm");
  assert.equal(plan.avatarState, "happy");
  assert.equal(plan.intensity, 0.55);
});

test("ResponsePlanner clamps invalid behavior intensity through the response contract", () => {
  const planner = new ResponsePlanner();
  const plan = planner.plan("Thinking.", {
    avatarState: "thinking",
    intensity: 2,
    attentionTarget: "none",
    shouldSpeak: false,
  });

  assert.equal(plan.intensity, 1);
  assert.equal(plan.posture, "focused");
  assert.equal(plan.gesture, "thinking");
  assert.equal(plan.gaze, "none");
});
