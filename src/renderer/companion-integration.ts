import { BehaviorBrain } from "../core/behavior-brain";
import { ResponsePlanner } from "../core/response-planner";
import type { AvatarRuntime } from "./avatar-runtime";

declare global {
  interface Window {
    desktopMateAvatarRuntime?: AvatarRuntime;
  }
}

type AssistantResponseEvent = CustomEvent<{ text: string; cancelled?: boolean }>;

const brain = new BehaviorBrain();
const planner = new ResponsePlanner();

const expressionsFor = (state: ReturnType<BehaviorBrain["decide"]>["avatarState"]) => {
  switch (state) {
    case "happy": return { smile: 0.85 };
    case "surprised": return { browUp: 0.9, mouthOpen: 0.35 };
    case "concerned": return { browDown: 0.7, mouthFrown: 0.45 };
    case "thinking": return { browDown: 0.25 };
    case "talking": return { mouthOpen: 0.22 };
    case "sleeping": return { mouthFrown: 0.15 };
    default: return {};
  }
};

const reactToAssistant = (text: string) => {
  const runtime = window.desktopMateAvatarRuntime;
  if (!runtime || !runtime.status().loaded) return;
  const decision = brain.decide({ type: "user-message", active: true });
  const plan = planner.plan(text, decision);
  runtime.applyPlan(plan);
  runtime.setExpression(expressionsFor(plan.avatarState));
};

window.addEventListener("desktop-mate:assistant-response", (event) => {
  const detail = (event as AssistantResponseEvent).detail;
  if (!detail?.cancelled && detail.text?.trim()) reactToAssistant(detail.text);
});

window.addEventListener("desktop-mate:task-started", () => {
  const runtime = window.desktopMateAvatarRuntime;
  if (!runtime?.status().loaded) return;
  const decision = brain.decide({ type: "task-started" });
  const plan = planner.plan("", decision);
  runtime.applyPlan(plan);
  runtime.setExpression(expressionsFor(plan.avatarState));
});

window.addEventListener("desktop-mate:task-completed", () => {
  const runtime = window.desktopMateAvatarRuntime;
  if (!runtime?.status().loaded) return;
  const decision = brain.decide({ type: "task-completed" });
  const plan = planner.plan("Done", decision);
  runtime.applyPlan(plan);
  runtime.setExpression(expressionsFor(plan.avatarState));
});

window.addEventListener("desktop-mate:task-failed", () => {
  const runtime = window.desktopMateAvatarRuntime;
  if (!runtime?.status().loaded) return;
  const decision = brain.decide({ type: "task-failed" });
  const plan = planner.plan("The task failed", decision);
  runtime.applyPlan(plan);
  runtime.setExpression(expressionsFor(plan.avatarState));
});

export {};
