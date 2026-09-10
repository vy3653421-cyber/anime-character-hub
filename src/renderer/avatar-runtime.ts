import * as THREE from "three";
import { AvatarAnimationController } from "../core/avatar-controller";
import type { ResponsePlan } from "../core/response-plan";
import type { AvatarState } from "../core/avatar-state";

export interface AvatarRuntimeStatus {
  loaded: boolean;
  state: AvatarState;
  intensity: number;
  activeClip?: string;
  activeWeight?: number;
  morphTargetCount: number;
}

export class AvatarRuntime {
  private readonly controller = new AvatarAnimationController();
  private mixer?: THREE.AnimationMixer;
  private clips: THREE.AnimationClip[] = [];
  private activeAction?: THREE.AnimationAction;
  private root?: THREE.Object3D;
  private morphTargetCount = 0;
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
    this.applyState("idle", 1);
    return this.status();
  }

  applyPlan(plan: ResponsePlan): AvatarRuntimeStatus {
    this.applyState(plan.avatarState, plan.intensity);
    return this.status();
  }

  update(deltaSeconds: number): void {
    this.mixer?.update(Math.max(0, deltaSeconds));
  }

  status(): AvatarRuntimeStatus {
    return {
      loaded: Boolean(this.root && this.mixer),
      state: this.state,
      intensity: this.intensity,
      activeClip: this.activeClip,
      activeWeight: this.activeAction?.getEffectiveWeight(),
      morphTargetCount: this.morphTargetCount,
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
    this.activeClip = undefined;
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
