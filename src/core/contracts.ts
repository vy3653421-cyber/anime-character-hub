export type PermissionLevel = "none" | "read" | "confirm" | "trusted" | "system";

export interface ToolContext {
  requestId: string;
  permission: PermissionLevel;
}

export interface DesktopTool<I = unknown, O = unknown> {
  id: string;
  description: string;
  requiredPermission: PermissionLevel;
  execute(input: I, context: ToolContext): Promise<O>;
}

export interface MemoryEntry {
  id: string;
  createdAt: string;
  content: string;
  tags: string[];
}

export interface AssistantConfig {
  name: string;
  personality: string;
  responseStyle: "concise" | "balanced" | "detailed";
}
