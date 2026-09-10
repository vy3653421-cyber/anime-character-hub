import { AvatarExpressionController, type AvatarExpressionName, type AvatarExpressionSet } from "./avatar-expression-controller";

export type VisemeName = "sil" | "A" | "E" | "I" | "O" | "U" | "M";

export interface VisemeCue {
  start: number;
  end: number;
  viseme: VisemeName;
  weight?: number;
}

export interface LipSyncStatus {
  playing: boolean;
  elapsed: number;
  cueIndex: number;
  activeViseme?: VisemeName;
}

export class AvatarLipSync {
  private readonly expressions: AvatarExpressionController;
  private cues: VisemeCue[] = [];
  private elapsed = 0;
  private playing = false;
  private cueIndex = -1;

  constructor(expressions: AvatarExpressionController) {
    this.expressions = expressions;
  }

  load(cues: VisemeCue[]): void {
    this.cues = [...cues]
      .filter((cue) => Number.isFinite(cue.start) && Number.isFinite(cue.end) && cue.end > cue.start)
      .map((cue) => ({ ...cue, start: Math.max(0, cue.start), weight: cue.weight ?? 1 }))
      .sort((a, b) => a.start - b.start);
    this.stop();
  }

  start(): void {
    this.elapsed = 0;
    this.cueIndex = -1;
    this.playing = true;
  }

  stop(): void {
    this.playing = false;
    this.elapsed = 0;
    this.cueIndex = -1;
    this.expressions.setExpression({ mouthOpen: 0, smile: 0, mouthFrown: 0 });
  }

  update(deltaSeconds: number): void {
    if (!this.playing) return;
    this.syncToAudioTime(this.elapsed + Math.max(0, deltaSeconds));
  }

  syncToAudioTime(audioTimeSeconds: number): void {
    if (!this.playing) return;
    this.elapsed = Math.max(0, Number.isFinite(audioTimeSeconds) ? audioTimeSeconds : 0);

    while (this.cueIndex + 1 < this.cues.length && this.cues[this.cueIndex + 1].start <= this.elapsed) {
      this.cueIndex += 1;
    }

    const cue = this.cues[this.cueIndex];
    if (!cue || this.elapsed >= cue.end) {
      if (this.cueIndex >= this.cues.length - 1 && cue && this.elapsed >= cue.end) this.stop();
      return;
    }

    const progress = Math.max(0, Math.min(1, (this.elapsed - cue.start) / Math.max(0.001, cue.end - cue.start)));
    const edge = Math.min(progress, 1 - progress) * 2;
    const weight = (cue.weight ?? 1) * Math.max(0.15, edge);
    this.expressions.setExpression(this.mapViseme(cue.viseme, weight));
  }

  status(): LipSyncStatus {
    const cue = this.cues[this.cueIndex];
    return { playing: this.playing, elapsed: this.elapsed, cueIndex: this.cueIndex, activeViseme: this.playing && cue ? cue.viseme : undefined };
  }

  private mapViseme(viseme: VisemeName, weight: number): AvatarExpressionSet {
    const mouthOpen = viseme === "sil" ? 0 : weight;
    const smile = viseme === "E" || viseme === "I" ? weight * 0.25 : 0;
    return { mouthOpen, smile, mouthFrown: 0 } as Partial<Record<AvatarExpressionName, number>>;
  }
}
