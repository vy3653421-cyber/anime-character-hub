export interface VoiceAsset {
  id: string;
  url: string;
  durationSeconds?: number;
  visemes?: Array<{ start: number; end: number; viseme: string; weight?: number }>;
}

export interface VoicePlaybackStatus {
  playing: boolean;
  currentAssetId?: string;
  positionSeconds: number;
}

/** Playback contract for licensed, human-recorded voice assets. No voice synthesis or cloning is implied. */
export interface VoicePlayback {
  play(asset: VoiceAsset): Promise<void>;
  stop(): void;
  update(deltaSeconds: number): void;
  status(): VoicePlaybackStatus;
}
