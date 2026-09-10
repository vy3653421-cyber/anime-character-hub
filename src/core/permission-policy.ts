import type { PermissionLevel } from "./contracts";

export interface PermissionRule {
  toolId: string;
  level: PermissionLevel;
  requiresUserConfirmation: boolean;
}

const rank: Record<PermissionLevel, number> = {
  none: 0,
  read: 1,
  confirm: 2,
  trusted: 3,
  system: 4,
};

export class PermissionPolicy {
  private readonly rules = new Map<string, PermissionRule>();

  set(toolId: string, level: PermissionLevel): PermissionRule {
    const rule: PermissionRule = {
      toolId,
      level,
      requiresUserConfirmation: level === "confirm",
    };
    this.rules.set(toolId, rule);
    return rule;
  }

  get(toolId: string): PermissionRule | undefined {
    return this.rules.get(toolId);
  }

  allows(toolId: string, requested: PermissionLevel): boolean {
    const rule = this.rules.get(toolId);
    if (!rule) return false;
    return rank[rule.level] >= rank[requested];
  }

  list(): PermissionRule[] {
    return [...this.rules.values()];
  }
}
