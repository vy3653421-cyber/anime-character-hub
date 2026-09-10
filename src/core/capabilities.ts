import { access } from "node:fs/promises";
import path from "node:path";

export interface AssetCapability {
  enabled: boolean;
  reason?: string;
}

export interface CapabilitySnapshot {
  runtime: "electron";
  secureIpc: boolean;
  avatar: AssetCapability;
  ai: AssetCapability;
  voice: AssetCapability;
  desktopTools: AssetCapability;
  memory: AssetCapability & { durable: boolean };
  settings: AssetCapability & { durable: boolean };
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function inspectCapabilities(options: {
  appPath: string;
  aiConfigured: boolean;
  memoryReady: boolean;
  settingsReady: boolean;
}): Promise<CapabilitySnapshot> {
  const rendererPath = path.join(options.appPath, "dist", "renderer");
  const avatarPath = path.join(rendererPath, "assets", "avatar", "avatar.glb");
  const voiceManifestPath = path.join(rendererPath, "assets", "voice", "manifest.json");
  const [avatarInstalled, voiceManifestInstalled] = await Promise.all([
    fileExists(avatarPath),
    fileExists(voiceManifestPath),
  ]);

  return {
    runtime: "electron",
    secureIpc: true,
    avatar: avatarInstalled
      ? { enabled: true }
      : { enabled: false, reason: "verified GLB asset not installed" },
    ai: options.aiConfigured
      ? { enabled: true }
      : { enabled: false, reason: "provider credentials/configuration not installed" },
    voice: voiceManifestInstalled
      ? { enabled: true }
      : { enabled: false, reason: "human-recorded voice manifest not installed" },
    desktopTools: { enabled: true, reason: "permission-gated allowlisted bridge" },
    memory: { enabled: options.memoryReady, durable: true },
    settings: { enabled: options.settingsReady, durable: true },
  };
}
