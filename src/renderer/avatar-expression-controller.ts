import * as THREE from "three";

export type AvatarExpressionName =
  | "smile"
  | "blink"
  | "mouthOpen"
  | "browUp"
  | "browDown"
  | "mouthFrown";

export type AvatarExpressionSet = Partial<Record<AvatarExpressionName, number>>;

export interface AvatarExpressionReport {
  morphTargets: number;
  mapped: Partial<Record<AvatarExpressionName, number>>;
}

interface Binding {
  mesh: THREE.SkinnedMesh;
  index: number;
  name: AvatarExpressionName;
  lastDelta: number;
  lastOutput: number;
}

const patterns: Record<AvatarExpressionName, RegExp[]> = {
  smile: [/^smile$/i, /smile/i, /mouth.?smile/i, /happy/i],
  blink: [/^blink$/i, /blink/i, /eye.?close/i],
  mouthOpen: [/^mouth.?open$/i, /mouth.?open/i, /jaw.?open/i],
  browUp: [/^brow.?up$/i, /brow.?raise/i, /eyebrow.?up/i],
  browDown: [/^brow.?down$/i, /brow.?lower/i, /eyebrow.?down/i],
  mouthFrown: [/frown/i, /sad/i, /mouth.?down/i],
};

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

export class AvatarExpressionController {
  private bindings: Binding[] = [];
  private target: AvatarExpressionSet = {};
  private current: Record<AvatarExpressionName, number> = {
    smile: 0,
    blink: 0,
    mouthOpen: 0,
    browUp: 0,
    browDown: 0,
    mouthFrown: 0,
  };

  bind(root: THREE.Object3D): AvatarExpressionReport {
    this.bindings = [];

    root.traverse((object) => {
      if (!(object instanceof THREE.SkinnedMesh) || !object.morphTargetDictionary || !object.morphTargetInfluences) return;

      for (const [rawName, index] of Object.entries(object.morphTargetDictionary)) {
        const name = this.resolveName(rawName);
        if (!name || index < 0 || index >= object.morphTargetInfluences.length) continue;
        const initial = clamp01(object.morphTargetInfluences[index] ?? 0);
        this.bindings.push({ mesh: object, index, name, lastDelta: 0, lastOutput: initial });
      }
    });

    const mapped: Partial<Record<AvatarExpressionName, number>> = {};
    for (const binding of this.bindings) mapped[binding.name] = (mapped[binding.name] ?? 0) + 1;

    return { morphTargets: this.bindings.length, mapped };
  }

  setExpression(expressions: AvatarExpressionSet): void {
    for (const [name, value] of Object.entries(expressions) as [AvatarExpressionName, number][]) {
      this.target[name] = clamp01(value);
    }
  }

  clearExpressions(): void {
    this.target = {};
    for (const name of Object.keys(this.current) as AvatarExpressionName[]) this.current[name] = 0;
  }

  update(deltaSeconds: number): void {
    const delta = Math.max(0, deltaSeconds);
    const smoothing = 1 - Math.exp(-delta / 0.12);
    const active = Object.keys(this.target).length > 0;

    for (const name of Object.keys(this.current) as AvatarExpressionName[]) {
      const target = this.target[name] ?? 0;
      this.current[name] += (target - this.current[name]) * smoothing;
      if (!active) this.current[name] = 0;
    }

    for (const binding of this.bindings) {
      const influences = binding.mesh.morphTargetInfluences;
      if (!influences) continue;

      const observed = clamp01(influences[binding.index] ?? 0);
      const sameAsLastOutput = Math.abs(observed - binding.lastOutput) < 0.0001;
      const base = sameAsLastOutput ? clamp01(observed - binding.lastDelta) : observed;
      const output = clamp01(base + this.current[binding.name]);

      influences[binding.index] = output;
      binding.lastDelta = output - base;
      binding.lastOutput = output;
    }
  }

  status(): AvatarExpressionReport & { active: AvatarExpressionSet } {
    const mapped: Partial<Record<AvatarExpressionName, number>> = {};
    for (const binding of this.bindings) mapped[binding.name] = (mapped[binding.name] ?? 0) + 1;
    return { morphTargets: this.bindings.length, mapped, active: { ...this.current } };
  }

  private resolveName(rawName: string): AvatarExpressionName | undefined {
    for (const name of Object.keys(patterns) as AvatarExpressionName[]) {
      if (patterns[name].some((pattern) => pattern.test(rawName))) return name;
    }
    return undefined;
  }
}
