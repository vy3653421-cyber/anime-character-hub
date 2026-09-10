import { app, BrowserWindow, ipcMain } from "electron";
import { randomUUID } from "node:crypto";
import { AssistantAgent } from "../core/agent";
import type { AIProvider } from "../core/ai-provider";
import { inspectCapabilities } from "../core/capabilities";
import { OpenAICompatibleProvider } from "../core/http-ai-provider";
import { JsonFileMemoryPersistence } from "../core/memory-store";
import { MemoryStore } from "../core/memory";
import { CompanionSettingsStore, type CompanionSettings } from "../core/settings";
import { DesktopToolRuntime, type DesktopToolRequest } from "./desktop-tools";

export const IPC_CHANNELS = {
  getStatus: "mate:get-status", getCapabilities: "mate:get-capabilities", listMemories: "mate:list-memories", saveMemory: "mate:save-memory",
  searchMemories: "mate:search-memories", listTools: "mate:list-tools", executeTool: "mate:execute-tool", chat: "mate:chat",
  chatStream: "mate:chat-stream", cancelChatStream: "mate:cancel-chat-stream", chatStreamChunk: "mate:chat-stream-chunk", resetSession: "mate:reset-session", getSettings: "mate:get-settings",
  updateSettings: "mate:update-settings",
} as const;

let memory: MemoryStore;
let settings: CompanionSettingsStore;
let tools: DesktopToolRuntime;
let agent: AssistantAgent | undefined;
const activeStreams = new Map<string, AbortController>();

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
  agent = provider ? new AssistantAgent(provider, memory, {
    name: process.env.DESKTOP_MATE_NAME?.trim() || "Desktop Mate",
    personality: process.env.DESKTOP_MATE_PERSONALITY?.trim() || "Helpful, precise, and transparent.",
    responseStyle: "balanced",
  }, tools) : undefined;

  ipcMain.handle(IPC_CHANNELS.getStatus, async () => { await Promise.all([memory.ready(), settings.ready()]); return { ready: true, version }; });
  ipcMain.handle(IPC_CHANNELS.getCapabilities, async () => {
    await Promise.all([memory.ready(), settings.ready()]);
    return inspectCapabilities({ appPath: app.getAppPath(), aiConfigured: Boolean(agent), memoryReady: true, settingsReady: true });
  });
  ipcMain.handle(IPC_CHANNELS.listMemories, async () => { await memory.ready(); return memory.list(); });
  ipcMain.handle(IPC_CHANNELS.saveMemory, async (_event, content: unknown, tags?: unknown) => {
    await memory.ready();
    if (typeof content !== "string" || !content.trim()) throw new Error("Memory content is required");
    const safeTags = Array.isArray(tags) ? tags.filter((tag): tag is string => typeof tag === "string") : [];
    return memory.save(content.trim(), safeTags);
  });
  ipcMain.handle(IPC_CHANNELS.searchMemories, async (_event, query: unknown) => { await memory.ready(); return typeof query === "string" ? memory.search(query).slice(0, 20) : []; });
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
  ipcMain.handle(IPC_CHANNELS.chatStream, async (event, text: unknown) => {
    if (!agent) throw new Error("AI provider is not configured");
    if (typeof text !== "string" || !text.trim()) throw new Error("Chat text is required");
    const requestId = randomUUID();
    const controller = new AbortController();
    activeStreams.set(requestId, controller);
    setImmediate(() => {
      void (async () => {
        try {
          for await (const chunk of agent!.streamResponse(text.trim(), requestId, controller.signal)) {
            if (!event.sender.isDestroyed()) event.sender.send(IPC_CHANNELS.chatStreamChunk, chunk);
          }
        } catch (error) {
          if (controller.signal.aborted) {
            if (!event.sender.isDestroyed()) event.sender.send(IPC_CHANNELS.chatStreamChunk, { requestId, text: "", done: true, provider: "openai-compatible", cancelled: true });
            return;
          }
          const message = error instanceof Error ? error.message : "AI stream failed";
          if (!event.sender.isDestroyed()) event.sender.send(IPC_CHANNELS.chatStreamChunk, { requestId, text: `AI unavailable: ${message}`, done: true, provider: "openai-compatible" });
        } finally {
          activeStreams.delete(requestId);
        }
      })();
    });
    return { requestId };
  });
  ipcMain.handle(IPC_CHANNELS.cancelChatStream, (_event, requestId: unknown) => {
    if (typeof requestId !== "string" || !requestId.trim()) throw new Error("Stream request id is required");
    const controller = activeStreams.get(requestId);
    if (!controller) return { ok: false, reason: "Stream is no longer active" };
    controller.abort();
    activeStreams.delete(requestId);
    return { ok: true };
  });
  ipcMain.handle(IPC_CHANNELS.resetSession, () => {
    if (!agent) return { ok: false, reason: "AI provider is not configured" };
    for (const controller of activeStreams.values()) controller.abort();
    activeStreams.clear();
    agent.resetSession(); return { ok: true };
  });
  ipcMain.handle(IPC_CHANNELS.getSettings, async () => { await settings.ready(); return settings.get(); });
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
