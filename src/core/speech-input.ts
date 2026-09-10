export interface SpeechInputResult {
  transcript: string;
  confidence?: number;
  isFinal: boolean;
}

export interface SpeechInputStatus {
  listening: boolean;
  supported: boolean;
  error?: string;
}

export interface SpeechInput {
  start(): Promise<void>;
  stop(): void;
  status(): SpeechInputStatus;
  onResult(listener: (result: SpeechInputResult) => void): () => void;
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

export class BrowserSpeechInput implements SpeechInput {
  private readonly recognition?: SpeechRecognitionLike;
  private listening = false;
  private lastError: string | undefined;
  private readonly resultListeners = new Set<(result: SpeechInputResult) => void>();
  private readonly errorListeners = new Set<(error: Error) => void>();

  constructor(lang = "en-US", factory?: SpeechRecognitionConstructor) {
    const root = globalThis as typeof globalThis & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const Recognition = factory ?? root.SpeechRecognition ?? root.webkitSpeechRecognition;
    if (!Recognition) return;

    this.recognition = new Recognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = lang;
    this.recognition.onresult = (event) => this.handleResult(event);
    this.recognition.onerror = (event) => {
      const message = typeof event === "object" && event !== null && "error" in event
        ? String((event as { error: unknown }).error)
        : "speech recognition error";
      this.lastError = message;
      this.errorListeners.forEach((listener) => listener(new Error(message)));
    };
    this.recognition.onend = () => {
      this.listening = false;
    };
  }

  async start(): Promise<void> {
    if (!this.recognition) throw new Error("Speech recognition is not supported by this runtime");
    if (this.listening) return;
    this.lastError = undefined;
    this.recognition.start();
    this.listening = true;
  }

  stop(): void {
    this.recognition?.stop();
    this.listening = false;
  }

  status(): SpeechInputStatus {
    return { listening: this.listening, supported: Boolean(this.recognition), error: this.lastError };
  }

  onResult(listener: (result: SpeechInputResult) => void): () => void {
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
      if (!first || typeof first !== "object" || typeof first.transcript !== "string") continue;
      const isFinal = Boolean((item as SpeechRecognitionResultLike).isFinal);
      this.resultListeners.forEach((listener) => listener({
        transcript: first.transcript.trim(),
        confidence: typeof first.confidence === "number" ? first.confidence : undefined,
        isFinal,
      }));
    }
  }
}
