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
  }>;
}

const api: DesktopMateAPI = {
  getStatus: () => ipcRenderer.invoke("mate:get-status"),
  getCapabilities: () => ipcRenderer.invoke("mate:get-capabilities"),
};

contextBridge.exposeInMainWorld("desktopMate", api);
