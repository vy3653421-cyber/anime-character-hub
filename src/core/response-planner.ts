import type { BehaviorDecision } from "./behavior-brain";
import { createResponsePlan, type ResponsePlan } from "./response-plan";

export class ResponsePlanner {
  plan(responseText: string, decision: BehaviorDecision): ResponsePlan {
    const emotion = this.emotionFor(decision.avatarState);
    const speechStyle = this.speechStyleFor(emotion);
    const gesture = this.gestureFor(decision.avatarState, responseText);
    const posture = this.postureFor(decision.avatarState);
    const gaze = decision.attentionTarget === "user" ? "direct" : decision.attentionTarget === "environment" ? "soft" : "none";

    return createResponsePlan({
      responseText,
      emotion,
      intensity: decision.intensity,
      attentionTarget: decision.attentionTarget,
      gesture,
      posture,
      gaze,
      speechStyle,
      interruptionPolicy: decision.avatarState === "talking" ? "allow" : "finish",
      avatarState: decision.avatarState,
      toolRequests: [],
    });
  }

  private emotionFor(state: BehaviorDecision["avatarState"]): ResponsePlan["emotion"] {
    switch (state) {
      case "happy": return "happy";
      case "thinking": return "thinking";
      case "surprised": return "surprised";
      case "concerned": return "concerned";
      case "sleeping": return "sleepy";
      case "talking": return "calm";
      default: return "calm";
    }
  }

  private speechStyleFor(emotion: ResponsePlan["emotion"]): ResponsePlan["speechStyle"] {
    switch (emotion) {
      case "happy": return "warm";
      case "thinking": return "focused";
      case "concerned": return "concerned";
      default: return "calm";
    }
  }

  private gestureFor(state: BehaviorDecision["avatarState"], text: string): ResponsePlan["gesture"] {
    if (state === "thinking") return "thinking";
    if (state === "surprised") return "surprised";
    if (state === "happy" && text.length < 120) return "small-wave";
    if (state === "talking") return "explanatory";
    return "none";
  }

  private postureFor(state: BehaviorDecision["avatarState"]): ResponsePlan["posture"] {
    switch (state) {
      case "thinking": return "focused";
      case "sleeping": return "sleepy";
      case "talking": return "attentive";
      default: return "relaxed";
    }
  }
}
