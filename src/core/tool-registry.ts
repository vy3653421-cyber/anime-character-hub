import type { DesktopTool, PermissionLevel, ToolContext } from "./contracts";

const rank: Record<PermissionLevel, number> = {
  none: 0,
  read: 1,
  confirm: 2,
  trusted: 3,
  system: 4,
};

export class ToolRegistry {
  private readonly tools = new Map<string, DesktopTool>();

  register(tool: DesktopTool): void {
    if (this.tools.has(tool.id)) throw new Error(`Tool already registered: ${tool.id}`);
    this.tools.set(tool.id, tool);
  }

  get(id: string): DesktopTool | undefined {
    return this.tools.get(id);
  }

  list(): DesktopTool[] {
    return [...this.tools.values()];
  }

  async execute(id: string, input: unknown, context: ToolContext): Promise<unknown> {
    const tool = this.tools.get(id);
    if (!tool) throw new Error(`Unknown tool: ${id}`);
    if (rank[context.permission] < rank[tool.requiredPermission]) {
      throw new Error(`Permission denied for tool: ${id}`);
    }
    return tool.execute(input, context);
  }
}
