import * as THREE from "three";

export interface AvatarValidationReport {
  valid: boolean;
  skinnedMeshes: number;
  morphTargetCount: number;
  animationClips: string[];
  semanticClips: Partial<Record<AvatarSemantic, string>>;
  warnings: string[];
  errors: string[];
}

export type AvatarSemantic =
  | "idle"
  | "breathing"
  | "blink"
  | "talking"
  | "thinking"
  | "happy"
  | "surprised"
  | "concerned"
  | "sleeping";

const semanticPatterns: Record<AvatarSemantic, RegExp[]> = {
  idle: [/^idle$/i, /idle/i, /rest/i],
  breathing: [/breath/i],
  blink: [/blink/i, /eye.?close/i],
  talking: [/talk/i, /speak/i, /phoneme/i, /viseme/i],
  thinking: [/think/i],
  happy: [/happy/i, /smile/i, /joy/i],
  surprised: [/surprise/i, /shock/i],
  concerned: [/concern/i, /worried/i, /sad/i],
  sleeping: [/sleep/i, /sleeping/i],
};

export function validateAvatar(root: THREE.Object3D, clips: THREE.AnimationClip[]): AvatarValidationReport {
  let skinnedMeshes = 0;
  let morphTargetCount = 0;

  root.traverse((object) => {
    if (!(object instanceof THREE.SkinnedMesh)) return;
    skinnedMeshes += 1;
    if (object.morphTargetDictionary) {
      morphTargetCount += Object.keys(object.morphTargetDictionary).length;
    }
  });

  const animationClips = clips.map((clip) => clip.name).filter(Boolean);
  const semanticClips: Partial<Record<AvatarSemantic, string>> = {};
  const warnings: string[] = [];
  const errors: string[] = [];

  for (const semantic of Object.keys(semanticPatterns) as AvatarSemantic[]) {
    const match = clips.find((clip) => semanticPatterns[semantic].some((pattern) => pattern.test(clip.name)));
    if (match) semanticClips[semantic] = match.name;
  }

  if (skinnedMeshes === 0) errors.push("Avatar has no skinned mesh");
  if (animationClips.length === 0) errors.push("Avatar has no animation clips");
  if (!semanticClips.idle && !semanticClips.breathing) {
    errors.push("Avatar needs an idle or breathing animation");
  }
  if (morphTargetCount === 0) {
    warnings.push("Avatar has no facial morph targets; expression/lip-sync will require another face-control path");
  }

  for (const semantic of ["blink", "talking", "happy", "surprised", "concerned"] as AvatarSemantic[]) {
    if (!semanticClips[semantic]) warnings.push(`No ${semantic} animation clip detected`);
  }

  return {
    valid: errors.length === 0,
    skinnedMeshes,
    morphTargetCount,
    animationClips,
    semanticClips,
    warnings,
    errors,
  };
}
