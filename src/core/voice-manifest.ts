import type { VoiceAsset } from "./voice";

export interface VoiceManifest {
  version: 1;
  voiceId: string;
  displayName: string;
  actorCredit: string;
  license: string;
  assets: VoiceAsset[];
}

const VALID_VISEMES = new Set(["sil", "A", "E", "I", "O", "U", "M"]);

export function validateVoiceManifest(value: unknown): value is VoiceManifest {
  if (typeof value !== "object' || value === null) return false;
  const manifest = value as Partial<VoiceManifest>;
  if (manifest.version !== 1 || typeof manifest.voiceId !== "string" || !manifest.voiceId.trim()) return false;
  if (typeof manifest.displayName !== "string" || !manifest.displayName.trim()) return false;
  if (typeof manifest.actorCredit !== "string" || !manifest.actorCredit.trim()) return false;
  if (typeof manifest.license !== "string" || !manifest.license.trim() || !Array.isArray(manifest.assets)) return false;
  return manifest.assets.every((asset) => {
    if (typeof asset !== "object" || asset === null) return false;
    if (typeof asset.id !== "string" || !asset.id.trim() || typeof asset.url !== "string" || !asset.url.trim()) return false;
    if (asset.transcript !== undefined && (typeof asset.transcript !== "string" || !asset.transcript.trim())) return false;
    if (asset.visemes === undefined) return true;
    return asset.visemes.every((cue) => {
      if (typeof cue !== "object" || cue === null) return false;
      const item = cue as { start?: unknown; end?: unknown; viseme?: unknown; weight?: unknown };
      return typeof item.start === "number" && Number.isFinite(item.start) && item.start >= 0
        && typeof item.end === "number" && Number.isFinite(item.end) && item.end >= item.start
        && typeof item.viseme === "string" && VALID_VISEMES.has(item.viseme)
        && (item.weight === undefined || (typeof item.weight === "number" && Number.isFinite(item.weight) && item.weight >= 0 && item.weight <= 1));
    });
  });
}

export function selectVoiceAsset(manifest: VoiceManifest, assetId: string): VoiceAsset | undefined {
  return manifest.assets.find((asset) => asset.id === assetId);
}

export function normalizeVoiceText(text: string): string {
  return text.trim().toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").replace(/\s+/g, " ");
}

/**
 * Human recordings cannot synthesize arbitrary AI output. This resolver only returns
 * a recording when its transcript matches the generated response exactly.
 */
export function resolveRecordedVoiceLine(manifest: VoiceManifest, text: string): VoiceAsset | undefined {
  const normalized = normalizeVoiceText(text);
  if (!normalized) return undefined;
  return manifest.assets.find((asset) => asset.transcript && normalizeVoiceText(asset.transcript) === normalized);
}
