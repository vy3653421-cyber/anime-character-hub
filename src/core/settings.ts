import { readFile, rename, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

export type ResponseStyle = "concise" | "balanced" | "detailed";

export interface CompanionSettings {
  name: string;
  responseStyle: ResponseStyle;
  alwaysOnTop: boolean;
  launchAtLogin: boolean;
  voiceEnabled: boolean;
  microphoneEnabled: boolean;
  toolConfirmations: boolean;
}

export const DEFAULT_SETTINGS: CompanionSettings = {
  name: "Desktop Mate",
  responseStyle: "balanced",
  alwaysOnTop: true,
  launchAtLogin: false,
  voiceEnabled: true,
  microphoneEnabled: false,
  toolConfirmations: true,
};

const isResponseStyle = (value: unknown): value is ResponseStyle => value === "concise" || value === "balanced" || value === "detailed";

const sanitize = (value: unknown): CompanionSettings => {
  if (typeof value !== "object" || value === null) return { ...DEFAULT_SETTINGS };
  const input = value as Partial<CompanionSettings>;
  return {
    name: typeof input.name === "string" && input.name.trim() ? input.name.trim().slice(0, 80) : DEFAULT_SETTINGS.name,
    responseStyle: isResponseStyle(input.responseStyle) ? input.responseStyle : DEFAULT_SETTINGS.responseStyle,
    alwaysOnTop: typeof input.alwaysOnTop === "boolean" ? input.alwaysOnTop : DEFAULT_SETTINGS.alwaysOnTop,
    launchAtLogin: typeof input.launchAtLogin === "boolean" ? input.launchAtLogin : DEFAULT_SETTINGS.launchAtLogin,
    voiceEnabled: typeof input.voiceEnabled === "boolean" ? input.voiceEnabled : DEFAULT_SETTINGS.voiceEnabled,
    microphoneEnabled: typeof input.microphoneEnabled === "boolean" ? input.microphoneEnabled : DEFAULT_SETTINGS.microphoneEnabled,
    toolConfirmations: typeof input.toolConfirmations === "boolean" ? input.toolConfirmations : DEFAULT_SETTINGS.toolConfirmations,
  };
};

export class CompanionSettingsStore {
  private settings: CompanionSettings = { ...DEFAULT_SETTINGS };
  private readyPromise: Promise<void>;

  constructor(private readonly filePath?: string) {
    this.readyPromise = this.load();
  }

  async ready(): Promise<void> { await this.readyPromise; }

  async get(): Promise<CompanionSettings> {
    await this.ready();
    return { ...this.settings };
  }

  async update(patch: Partial<CompanionSettings>): Promise<CompanionSettings> {
    await this.ready();
    this.settings = sanitize({ ...this.settings, ...patch });
    await this.persist();
    return { ...this.settings };
  }

  private async load(): Promise<void> {
    if (!this.filePath) return;
    try {
      const parsed: unknown = JSON.parse(await readFile(this.filePath, "utf8"));
      this.settings = sanitize(parsed);
    } catch (error: unknown) {
      if (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "ENOENT") return;
      throw error;
    }
  }

  private async persist(): Promise<void> {
    if (!this.filePath) return;
    await mkdir(dirname(this.filePath), { recursive: true });
    const tempPath = `${this.filePath}.tmp`;
    await writeFile(tempPath, JSON.stringify(this.settings, null, 2), "utf8");
    await rename(tempPath, this.filePath);
  }
}
