import type { AvatarState } from "./avatar-state";

export type Emotion =
  | "calm"
  | "happy"
  | "curious"
  | "thinking"
  | "surprised"
  | "confused"
  | "focused"
  | "concerned"
  | "annoyed"
  | "sleepy"
  | "playful";

export type AttentionTarget = "user" | "environment" | "none";
export type Gaze = "direct" | "soft" | "away" | "none";
export type SpeechStyle = "calm" | "warm" | "focused" | "playful" | "concerned";
export type Gesture =
  | "none"
  | "greeting"
  | "explanatory"
  | "thinking"
  | "emphasis"
  | "small-wave"
  | "surprised";

export interface ResponsePlan {
  responseText: string;
  emotion: Emotion;
  intensity: number;
  attentionTarget: AttentionTarget;
  gesture: Gesture;
  posture: "relaxed" | "attentive" | "focused" | "sleepy";
  gaze: Gaze;
  speechStyle: SpeechStyle;
  interruptionPolicy: "allow" | "finish";
  avatarState: AvatarState;
  toolRequests: string[];
}

export function clampIntensity(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function createResponsePlan(
  plan: Omit<ResponsePlan, "intensity"> & { intensity?: number },
): ResponsePlan {
  return { ...plan, intensity: clampIntensity(plan.intensity ?? 0.5) };
}
