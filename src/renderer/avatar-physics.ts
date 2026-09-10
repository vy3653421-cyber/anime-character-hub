import * as THREE from "three";

export interface AvatarPhysicsBoneConfig {
  boneName: string;
  stiffness?: number;
  damping?: number;
  maxAngle?: number;
}

export interface AvatarPhysicsReport {
  bound: number;
  requested: number;
}

interface Binding {
  bone: THREE.Object3D;
  restAngle: number;
  stiffness: number;
  damping: number;
  maxAngle: number;
  velocity: number;
}

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

export class AvatarPhysics {
  private bindings: Binding[] = [];

  bind(root: THREE.Object3D, configs: AvatarPhysicsBoneConfig[]): AvatarPhysicsReport {
    this.bindings = [];
    const byName = new Map<string, THREE.Object3D>();
    root.traverse((object) => {
      if (object.name) byName.set(object.name, object);
    });

    for (const config of configs) {
      const bone = byName.get(config.boneName);
      if (!bone) continue;
      const maxAngle = Math.max(0, config.maxAngle ?? 0.5);
      const restAngle = clamp(bone.rotation.z, -maxAngle, maxAngle);
      this.bindings.push({
        bone,
        restAngle,
        stiffness: Math.max(0.1, config.stiffness ?? 18),
        damping: Math.max(0, config.damping ?? 8),
        maxAngle,
        velocity: 0,
      });
    }

    return { bound: this.bindings.length, requested: configs.length };
  }

  update(deltaSeconds: number): void {
    const delta = clamp(deltaSeconds, 0, 1 / 20);
    if (delta === 0) return;

    for (const binding of this.bindings) {
      const displacement = binding.restAngle - binding.bone.rotation.z;
      const acceleration = displacement * binding.stiffness - binding.velocity * binding.damping;
      binding.velocity += acceleration * delta;
      const next = binding.bone.rotation.z + binding.velocity * delta;
      binding.bone.rotation.z = clamp(next, -binding.maxAngle, binding.maxAngle);

      if (Math.abs(displacement) < 0.0005 && Math.abs(binding.velocity) < 0.0005) {
        binding.bone.rotation.z = binding.restAngle;
        binding.velocity = 0;
      }
    }
  }

  clear(): void {
    this.bindings = [];
  }

  status(): { bound: number } {
    return { bound: this.bindings.length };
  }
}
