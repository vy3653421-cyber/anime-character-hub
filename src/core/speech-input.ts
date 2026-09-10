export interface SpeechResult {
  transcript: string;
  confidence?: number;
  isFinal: boolean;
}

export interface SpeechInput {
  readonly supported: boolean;
  start(): void;
  stop(): void;
  isListening(): boolean;
  onResult(listener: (result: SpeechResult) => void): () => void;
  onError(listener: (error: Error) => void): () => void;
}

type SpeechRecognitionAlternativeLike = {
  transcript?: unknown;
  confidence?: unknown;
};

type SpeechRecognitionResultLike = {
  0?: SpeechRecognitionAlternativeLike;
  isFinal?: unknown;
};

type SpeechRecognitionEventLike = {
  results?: unknown;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: unknown) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function resolveConstructor(): SpeechRecognitionConstructor | undefined {
  const scope = globalThis as typeof globalThis & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition;
}

export class BrowserSpeechInput implements SpeechInput {
  readonly supported: boolean;
  private readonly recognition?: SpeechRecognitionLike;
  private listening = false;
  private readonly resultListeners = new Set<(result: SpeechResult) => void>();
  private readonly errorListeners = new Set<(error: Error) => void>();

  constructor(language = "en-IN") {
    const Constructor = resolveConstructor();
    this.supported = Boolean(Constructor);
    if (!Constructor) return;

    const recognition = new Constructor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.onresult = (event) => this.handleResult(event);
    recognition.onerror = (event) => this.handleError(event);
    recognition.onend = () => {
      this.listening = false;
    };
    this.recognition = recognition;
  }

  start(): void {
    if (!this.recognition || this.listening) return;
    try {
      this.recognition.start();
      this.listening = true;
    } catch (error) {
      this.handleError(error);
    }
  }

  stop(): void {
    if (!this.recognition) return;
    try {
      this.recognition.stop();
    } catch (error) {
      this.handleError(error);
    } finally {
      this.listening = false;
    }
  }

  isListening(): boolean {
    return this.listening;
  }

  onResult(listener: (result: SpeechResult) => void): () => void {
    this.resultListeners.add(listener);
    return () => this.resultListeners.delete(listener);
  }

  onError(listener: (error: Error) => void): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  private handleResult(event: unknown): void {
    if (typeof event !== "object" || event === null || !("results" in event)) return;
    const results = (event as SpeechRecognitionEventLike).results;
    if (!Array.isArray(results)) return;

    for (const item of results) {
      if (!item || typeof item !== "object" || !("0" in item)) continue;
      const first = (item as SpeechRecognitionResultLike)[0];
      if (!first || typeof first !== "object") continue;
      const transcript = first.transcript;
      if (typeof transcript !== "string") continue;
      const confidence = first.confidence;
      const isFinal = Boolean((item as SpeechRecognitionResultLike).isFinal);
      this.resultListeners.forEach((listener) => listener({
        transcript: transcript.trim(),
        confidence: typeof confidence === "number" ? confidence : undefined,
        isFinal,
      }));
    }
  }

  private handleError(event: unknown): void {
    const message = typeof event === "object" && event !== null && "error" in event
      ? String((event as { error?: unknown }).error ?? "Speech recognition failed")
      : event instanceof Error
        ? event.message
        : "Speech recognition failed";
    this.errorListeners.forEach((listener) => listener(new Error(message)));
    this.listening = false;
  }
}
