import { contextBridge, ipcRenderer } from "electron";

export interface DesktopMateAPI {
  getStatus(): Promise<{ ready: boolean; version: string }>;
}

const api: DesktopMateAPI = {
  getStatus: () => ipcRenderer.invoke("mate:get-status"),
};

contextBridge.exposeInMainWorld("desktopMate", api);
