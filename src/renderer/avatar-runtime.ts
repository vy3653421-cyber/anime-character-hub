import * as THREE from "three";
import { AvatarAnimationController } from "../core/avatar-controller";
import type { ResponsePlan } from "../core/response-plan";
import type { AvatarState } from "../core/avatar-state";
import { AvatarExpressionController, type AvatarExpressionSet } from "./avatar-expression-controller";

export interface AvatarRuntimeStatus {
  loaded: boolean;
  state: AvatarState;
  intensity: number;
  activeClip?: string;
  activeWeight?: number;
  morphTargetCount: number;
  expressionCount: number;
}

export class AvatarRuntime {
  private readonly controller = new AvatarAnimationController();
  private readonly expressions = new AvatarExpressionController();
  private mixer?: THREE.AnimationMixer;
  private clips: THREE.AnimationClip[] = [];
  private activeAction?: THREE.AnimationAction;
  private root?: THREE.Object3D;
  private morphTargetCount = 0;
  private expressionCount = 0;
  private state: AvatarState = "idle";
  private intensity = 1;
  private activeClip?: string;

  load(root: THREE.Object3D, clips: THREE.AnimationClip[]): AvatarRuntimeStatus {
    this.dispose();
    this.root = root;
    this.clips = clips;
    this.mixer = new THREE.AnimationMixer(root);
    root.traverse((object) => {
      if (object instanceof THREE.SkinnedMesh && object.morphTargetDictionary) {
        this.morphTargetCount += Object.keys(object.morphTargetDictionary).length;
      }
    });
    const expressionReport = this.expressions.bind(root);
    this.expressionCount = expressionReport.morphTargets;
    this.applyState("idle", 1);
    return this.status();
  }

  applyPlan(plan: ResponsePlan): AvatarRuntimeStatus {
    this.applyState(plan.avatarState, plan.intensity);
    return this.status();
  }

  setExpression(expressions: AvatarExpressionSet): void {
    this.expressions.setExpression(expressions);
  }

  clearExpressions(): void {
    this.expressions.clearExpressions();
  }

  update(deltaSeconds: number): void {
    const delta = Math.max(0, deltaSeconds);
    this.mixer?.update(delta);
    this.expressions.update(delta);
  }

  status(): AvatarRuntimeStatus {
    return {
      loaded: Boolean(this.root && this.mixer),
      state: this.state,
      intensity: this.intensity,
      activeClip: this.activeClip,
      activeWeight: this.activeAction?.getEffectiveWeight(),
      morphTargetCount: this.morphTargetCount,
      expressionCount: this.expressionCount,
    };
  }

  dispose(): void {
    this.activeAction?.stop();
    this.mixer?.stopAllAction();
    this.mixer = undefined;
    this.activeAction = undefined;
    this.root = undefined;
    this.clips = [];
    this.morphTargetCount = 0;
    this.expressionCount = 0;
    this.activeClip = undefined;
    this.expressions.clearExpressions();
  }

  private applyState(state: AvatarState, intensity: number): void {
    this.state = state;
    this.intensity = Math.max(0, Math.min(1, intensity));
    this.controller.setState(state);

    if (!this.mixer) return;
    const clipName = this.controller.resolveCurrentClip(this.clips.map((clip) => clip.name));
    if (!clipName) return;

    if (clipName === this.activeClip && this.activeAction) {
      this.activeAction.setEffectiveWeight(this.intensity);
      return;
    }

    const clip = this.clips.find((candidate) => candidate.name === clipName);
    if (!clip) return;

    const next = this.mixer.clipAction(clip);
    next.reset().setEffectiveWeight(this.intensity).fadeIn(0.2).play();
    this.activeAction?.fadeOut(0.2);
    this.activeAction = next;
    this.activeClip = clipName;
  }
}
