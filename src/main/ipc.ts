import { app, ipcMain } from "electron";
import { JsonFileMemoryPersistence } from "../core/memory-store";
import { MemoryStore } from "../core/memory";
import { DesktopToolRuntime, type DesktopToolRequest } from "./desktop-tools";

export const IPC_CHANNELS = {
  getStatus: "mate:get-status",
  getCapabilities: "mate:get-capabilities",
  listMemories: "mate:list-memories",
  saveMemory: "mate:save-memory",
  searchMemories: "mate:search-memories",
  listTools: "mate:list-tools",
  executeTool: "mate:execute-tool",
} as const;

const memory = new MemoryStore(
  new JsonFileMemoryPersistence(`${app.getPath("userData")}/memory.json`),
);
const tools = new DesktopToolRuntime();

export function registerIpcHandlers(version: string): void {
  ipcMain.handle(IPC_CHANNELS.getStatus, async () => {
    await memory.ready();
    return { ready: true, version };
  });

  ipcMain.handle(IPC_CHANNELS.getCapabilities, () => ({
    runtime: "electron",
    secureIpc: true,
    avatar: { enabled: false, reason: "verified GLB asset not installed" },
    ai: { enabled: false, reason: "provider credentials/configuration not installed" },
    voice: { enabled: false },
    desktopTools: { enabled: true, reason: "permission-gated allowlisted bridge" },
    memory: { enabled: true, durable: true },
  }));

  ipcMain.handle(IPC_CHANNELS.listMemories, async () => {
    await memory.ready();
    return memory.list();
  });

  ipcMain.handle(IPC_CHANNELS.saveMemory, async (_event, content: unknown, tags?: unknown) => {
    await memory.ready();
    if (typeof content !== "string" || !content.trim()) throw new Error("Memory content is required");
    const safeTags = Array.isArray(tags) ? tags.filter((tag): tag is string => typeof tag === "string") : [];
    return memory.save(content.trim(), safeTags);
  });

  ipcMain.handle(IPC_CHANNELS.searchMemories, async (_event, query: unknown) => {
    await memory.ready();
    return typeof query === "string" ? memory.search(query).slice(0, 20) : [];
  });

  ipcMain.handle(IPC_CHANNELS.listTools, () => tools.listTools());
  ipcMain.handle(IPC_CHANNELS.executeTool, async (_event, request: unknown) => {
    if (typeof request !== "object" || request === null) throw new Error("Invalid tool request");
    return tools.execute(request as DesktopToolRequest);
  });
}
