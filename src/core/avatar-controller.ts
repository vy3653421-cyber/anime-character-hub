import type { AvatarState } from "./avatar-state";

export interface AnimationBinding {
  state: AvatarState;
  patterns: RegExp[];
}

const DEFAULT_BINDINGS: AnimationBinding[] = [
  { state: "idle", patterns: [/^idle$/i, /idle/i, /rest/i] },
  { state: "breathing", patterns: [/breath/i] },
  { state: "blink", patterns: [/blink/i, /eye.?close/i] },
  { state: "talking", patterns: [/talk/i, /speak/i, /phoneme/i, /viseme/i] },
  { state: "thinking", patterns: [/think/i] },
  { state: "happy", patterns: [/happy/i, /smile/i, /joy/i] },
  { state: "surprised", patterns: [/surprise/i, /shock/i] },
  { state: "sleeping", patterns: [/sleep/i, /sleeping/i] },
];

export class AvatarAnimationController {
  private readonly bindings: AnimationBinding[];
  private current: AvatarState = "idle";

  constructor(bindings: AnimationBinding[] = DEFAULT_BINDINGS) {
    this.bindings = bindings;
  }

  resolveClip(state: AvatarState, clipNames: string[]): string | undefined {
    const binding = this.bindings.find((candidate) => candidate.state === state);
    if (!binding) return undefined;
    return clipNames.find((name) => binding.patterns.some((pattern) => pattern.test(name)));
  }

  setState(state: AvatarState): void {
    this.current = state;
  }

  getState(): AvatarState {
    return this.current;
  }

  resolveCurrentClip(clipNames: string[]): string | undefined {
    return this.resolveClip(this.current, clipNames);
  }
}
