import { app, BrowserWindow, ipcMain } from "electron";
import { AssistantAgent } from "../core/agent";
import type { AIProvider } from "../core/ai-provider";
import { inspectCapabilities } from "../core/capabilities";
import { OpenAICompatibleProvider } from "../core/http-ai-provider";
import { JsonFileMemoryPersistence } from "../core/memory-store";
import { MemoryStore } from "../core/memory";
import { CompanionSettingsStore, type CompanionSettings } from "../core/settings";
import { DesktopToolRuntime, type DesktopToolRequest } from "./desktop-tools";

export const IPC_CHANNELS = {
  getStatus: "mate:get-status",
  getCapabilities: "mate:get-capabilities",
  listMemories: "mate:list-memories",
  saveMemory: "mate:save-memory",
  searchMemories: "mate:search-memories",
  listTools: "mate:list-tools",
  executeTool: "mate:execute-tool",
  chat: "mate:chat",
  getSettings: "mate:get-settings",
  updateSettings: "mate:update-settings",
} as const;

let memory: MemoryStore;
let settings: CompanionSettingsStore;
let tools: DesktopToolRuntime;
let agent: AssistantAgent | undefined;

function createProvider(): AIProvider | undefined {
  const apiKey = process.env.DESKTOP_MATE_AI_API_KEY?.trim();
  const baseUrl = process.env.DESKTOP_MATE_AI_BASE_URL?.trim();
  const model = process.env.DESKTOP_MATE_AI_MODEL?.trim();
  if (!apiKey || !baseUrl || !model) return undefined;
  return new OpenAICompatibleProvider({ id: "openai-compatible", baseUrl, apiKey, model });
}

export function registerIpcHandlers(version: string): void {
  if (memory || settings || tools) throw new Error("IPC handlers are already registered");

  const userDataPath = app.getPath("userData");
  memory = new MemoryStore(new JsonFileMemoryPersistence(`${userDataPath}/memory.json`));
  settings = new CompanionSettingsStore(`${userDataPath}/settings.json`);
  tools = new DesktopToolRuntime();

  const provider = createProvider();
  agent = provider
    ? new AssistantAgent(provider, memory, {
        name: process.env.DESKTOP_MATE_NAME?.trim() || "Desktop Mate",
        personality: process.env.DESKTOP_MATE_PERSONALITY?.trim() || "Helpful, precise, and transparent.",
        responseStyle: "balanced",
      }, tools)
    : undefined;

  ipcMain.handle(IPC_CHANNELS.getStatus, async () => {
    await Promise.all([memory.ready(), settings.ready()]);
    return { ready: true, version };
  });

  ipcMain.handle(IPC_CHANNELS.getCapabilities, async () => {
    await Promise.all([memory.ready(), settings.ready()]);
    return inspectCapabilities({
      appPath: app.getAppPath(),
      aiConfigured: Boolean(agent),
      memoryReady: true,
      settingsReady: true,
    });
  });

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
    if (typeof request !== "object" || request === null || Array.isArray(request)) throw new Error("Invalid tool request");
    const candidate = request as Partial<DesktopToolRequest>;
    if (typeof candidate.toolId !== "string" || !candidate.toolId.trim()) throw new Error("Tool id is required");
    if (candidate.confirmed !== undefined && typeof candidate.confirmed !== "boolean") throw new Error("Tool confirmation must be boolean");
    return tools.execute(request as DesktopToolRequest);
  });

  ipcMain.handle(IPC_CHANNELS.chat, async (_event, text: unknown) => {
    if (!agent) throw new Error("AI provider is not configured");
    if (typeof text !== "string" || !text.trim()) throw new Error("Chat text is required");
    return agent.respond(text.trim());
  });

  ipcMain.handle(IPC_CHANNELS.getSettings, async () => {
    await settings.ready();
    return settings.get();
  });

  ipcMain.handle(IPC_CHANNELS.updateSettings, async (_event, patch: unknown) => {
    if (typeof patch !== "object" || patch === null || Array.isArray(patch)) throw new Error("Invalid settings patch");
    await settings.ready();
    const updated = await settings.update(patch as Partial<CompanionSettings>);
    const window = BrowserWindow.getAllWindows()[0];
    if (window) window.setAlwaysOnTop(updated.alwaysOnTop);
    app.setLoginItemSettings({ openAtLogin: updated.launchAtLogin });
    return updated;
  });
}
