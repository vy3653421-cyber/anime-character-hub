export type ToolRisk = "safe" | "confirm" | "restricted";

export interface ToolDefinition {
  id: string;
  description: string;
  risk: ToolRisk;
  requiresConfirmation: boolean;
}

export interface PermissionDecision {
  allowed: boolean;
  requiresConfirmation: boolean;
  reason: string;
}

/** Least-privilege policy for desktop actions. Unknown tools are denied. */
export class ToolPermissionPolicy {
  private readonly definitions = new Map<string, ToolDefinition>();

  register(definition: ToolDefinition): void {
    if (!definition.id.trim()) throw new Error("Tool id is required");
    this.definitions.set(definition.id, { ...definition });
  }

  decide(toolId: string, confirmed = false): PermissionDecision {
    const definition = this.definitions.get(toolId);
    if (!definition) return { allowed: false, requiresConfirmation: false, reason: "Tool is not registered" };
    if (definition.risk === "restricted") return { allowed: false, requiresConfirmation: false, reason: "Tool is restricted" };
    if (definition.requiresConfirmation && !confirmed) return { allowed: false, requiresConfirmation: true, reason: "User confirmation is required" };
    return { allowed: true, requiresConfirmation: false, reason: "Policy allows execution" };
  }

  list(): ToolDefinition[] {
    return [...this.definitions.values()].map((definition) => ({ ...definition }));
  }
}

export const createDefaultToolPolicy = (): ToolPermissionPolicy => {
  const policy = new ToolPermissionPolicy();
  policy.register({ id: "open-url", description: "Open a user-requested URL", risk: "confirm", requiresConfirmation: true });
  policy.register({ id: "open-app", description: "Launch an installed desktop application", risk: "confirm", requiresConfirmation: true });
  policy.register({ id: "notify", description: "Show a desktop notification", risk: "safe", requiresConfirmation: false });
  policy.register({ id: "read-clipboard", description: "Read clipboard text", risk: "confirm", requiresConfirmation: true });
  return policy;
};
