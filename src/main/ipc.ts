import { ipcMain } from "electron";

export const IPC_CHANNELS = {
  getStatus: "mate:get-status",
  getCapabilities: "mate:get-capabilities",
} as const;

export function registerIpcHandlers(version: string): void {
  ipcMain.handle(IPC_CHANNELS.getStatus, () => ({
    ready: true,
    version,
  }));

  ipcMain.handle(IPC_CHANNELS.getCapabilities, () => ({
    runtime: "electron",
    secureIpc: true,
    avatar: { enabled: false, reason: "verified GLB asset not installed" },
    ai: { enabled: false, reason: "provider credentials/configuration not installed" },
    voice: { enabled: false },
    desktopTools: { enabled: false, reason: "permission-gated tool bridge not installed" },
  }));
}
