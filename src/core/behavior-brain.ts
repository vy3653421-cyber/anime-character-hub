import type { AvatarState } from "./avatar-state";

export type BehaviorEvent =
  | { type: "user-message"; active: true }
  | { type: "task-started" }
  | { type: "task-completed" }
  | { type: "task-failed" }
  | { type: "user-returned" }
  | { type: "user-idle" }
  | { type: "timer" };

export type BehaviorDecision = {
  avatarState: AvatarState;
  intensity: number;
  attentionTarget: "user" | "environment" | "none";
  shouldSpeak: boolean;
  speechReason?: string;
};

export type BehaviorConfig = {
  autonomy: number;
  speechCooldownMs: number;
  idleAfterMs: number;
};

const clamp = (value: number) => Math.max(0, Math.min(100, value));

export class BehaviorBrain {
  private lastSpokenAt = 0;
  private lastEventAt = Date.now();

  constructor(private readonly config: BehaviorConfig = {
    autonomy: 50,
    speechCooldownMs: 15_000,
    idleAfterMs: 10 * 60_000,
  }) {}

  decide(event: BehaviorEvent, now = Date.now()): BehaviorDecision {
    const previousEventAt = this.lastEventAt;
    this.lastEventAt = now;
    const autonomy = clamp(this.config.autonomy);

    if (event.type === "user-message") {
      return this.decision("talking", 0.8, "user", true, "direct user interaction", now);
    }
    if (event.type === "task-started") {
      return this.decision("thinking", 0.7, "none", false, undefined, now);
    }
    if (event.type === "task-completed") {
      const speak = autonomy >= 60 && this.canSpeak(now);
      return this.decision("happy", 0.55, "user", speak, "task completed", now);
    }
    if (event.type === "task-failed") {
      const speak = autonomy >= 45 && this.canSpeak(now);
      return this.decision("concerned", 0.65, "user", speak, "task failed", now);
    }
    if (event.type === "user-returned") {
      return this.decision("happy", 0.3, "user", false, undefined, now);
    }
    if (event.type === "user-idle") {
      return this.decision("sleeping", 0.35, "none", false, undefined, now);
    }

    return now - previousEventAt >= this.config.idleAfterMs
      ? this.decision("sleeping", 0.3, "none", false, undefined, now)
      : this.decision("idle", 0.2, "environment", false, undefined, now);
  }

  markSpoken(now = Date.now()): void {
    this.lastSpokenAt = now;
  }

  private canSpeak(now: number): boolean {
    return now - this.lastSpokenAt >= this.config.speechCooldownMs;
  }

  private decision(
    avatarState: AvatarState,
    intensity: number,
    attentionTarget: BehaviorDecision["attentionTarget"],
    shouldSpeak: boolean,
    speechReason: string | undefined,
    now: number,
  ): BehaviorDecision {
    if (shouldSpeak) this.lastSpokenAt = now;
    return { avatarState, intensity, attentionTarget, shouldSpeak, speechReason };
  }
}
