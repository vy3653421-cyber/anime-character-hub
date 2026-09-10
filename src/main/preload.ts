import { contextBridge, ipcRenderer } from "electron";

export interface DesktopMateAPI {
  getStatus(): Promise<{ ready: boolean; version: string }>;
  getCapabilities(): Promise<{
    runtime: string;
    secureIpc: boolean;
    avatar: { enabled: boolean; reason?: string };
    ai: { enabled: boolean; reason?: string };
    voice: { enabled: boolean };
    desktopTools: { enabled: boolean; reason?: string };
    memory: { enabled: boolean; durable: boolean };
  }>;
  listMemories(): Promise<Array<{ id: string; createdAt: string; content: string; tags: string[] }>>;
  saveMemory(content: string, tags?: string[]): Promise<{ id: string; createdAt: string; content: string; tags: string[] }>;
  searchMemories(query: string): Promise<Array<{ id: string; createdAt: string; content: string; tags: string[] }>>;
  listTools(): Promise<Array<{ id: string; description: string; risk: string; requiresConfirmation: boolean }>>;
  executeTool(request: { toolId: string; input?: unknown; confirmed?: boolean }): Promise<{
    ok: boolean;
    requiresConfirmation?: boolean;
    reason?: string;
    data?: unknown;
  }>;
}

const api: DesktopMateAPI = {
  getStatus: () => ipcRenderer.invoke("mate:get-status"),
  getCapabilities: () => ipcRenderer.invoke("mate:get-capabilities"),
  listMemories: () => ipcRenderer.invoke("mate:list-memories"),
  saveMemory: (content, tags) => ipcRenderer.invoke("mate:save-memory", content, tags),
  searchMemories: (query) => ipcRenderer.invoke("mate:search-memories", query),
  listTools: () => ipcRenderer.invoke("mate:list-tools"),
  executeTool: (request) => ipcRenderer.invoke("mate:execute-tool", request),
};

contextBridge.exposeInMainWorld("desktopMate", api);
