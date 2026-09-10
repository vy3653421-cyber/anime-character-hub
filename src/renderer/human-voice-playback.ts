import type { VoiceAsset, VoicePlayback, VoicePlaybackStatus } from "../core/voice";

export interface AudioElementLike {
  currentTime: number;
  paused: boolean;
  src: string;
  play(): Promise<void>;
  pause(): void;
}

export class HumanVoicePlayback implements VoicePlayback {
  private readonly audio: AudioElementLike;
  private currentAssetId?: string;

  constructor(audioFactory: () => AudioElementLike = () => new Audio()) {
    this.audio = audioFactory();
  }

  async play(asset: VoiceAsset): Promise<void> {
    if (!asset.id.trim() || !asset.url.trim()) throw new Error("Voice asset id and URL are required");
    this.audio.pause();
    this.audio.src = asset.url;
    this.audio.currentTime = 0;
    this.currentAssetId = asset.id;
    try {
      await this.audio.play();
    } catch (error) {
      this.currentAssetId = undefined;
      throw error;
    }
  }

  stop(): void {
    this.audio.pause();
    this.audio.currentTime = 0;
    this.currentAssetId = undefined;
  }

  update(_deltaSeconds: number): void {}

  status(): VoicePlaybackStatus {
    return {
      playing: !this.audio.paused && Boolean(this.currentAssetId),
      currentAssetId: this.currentAssetId,
      positionSeconds: Math.max(0, this.audio.currentTime),
    };
  }
}
