import type { VoiceAsset, VoicePlayback } from "../core/voice";
import { AvatarRuntime } from "./avatar-runtime";
import type { VisemeCue, VisemeName } from "./avatar-lipsync";

const isVisemeName = (value: string): value is VisemeName => value === "sil" || value === "A" || value === "E" || value === "I" || value === "O" || value === "U" || value === "M";

export class AvatarVoiceController {
  constructor(private readonly avatar: AvatarRuntime, private readonly playback: VoicePlayback) {}

  async play(asset: VoiceAsset): Promise<void> {
    const cues: VisemeCue[] = (asset.visemes ?? []).filter((cue): cue is VisemeCue => isVisemeName(cue.viseme));
    this.avatar.loadLipSync(cues);
    await this.playback.play(asset);
    this.avatar.startLipSync();
  }

  stop(): void {
    this.playback.stop();
    this.avatar.stopLipSync();
  }

  update(): void {
    const status = this.playback.status();
    if (!status.playing) {
      this.avatar.stopLipSync();
      return;
    }
    this.avatar.syncLipSyncToAudioTime(status.positionSeconds);
  }
}
