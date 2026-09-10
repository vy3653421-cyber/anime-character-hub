export type AvatarState =
  | "idle"
  | "breathing"
  | "blink"
  | "talking"
  | "thinking"
  | "happy"
  | "surprised"
  | "sleeping";

export interface AvatarPose {
  state: AvatarState;
  intensity: number;
  timestamp: number;
}

export class AvatarStateMachine {
  private current: AvatarPose = {
    state: "idle",
    intensity: 1,
    timestamp: Date.now(),
  };

  set(state: AvatarState, intensity = 1): AvatarPose {
    this.current = {
      state,
      intensity: Math.max(0, Math.min(1, intensity)),
      timestamp: Date.now(),
    };
    return this.current;
  }

  get(): AvatarPose {
    return this.current;
  }
}
