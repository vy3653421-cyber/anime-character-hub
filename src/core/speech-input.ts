export interface SpeechResult {
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
  readonly supported: boolean;
  start(): Promise<void>;
  stop(): void;
  isListening(): boolean;
  status(): SpeechInputStatus;
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

type SpeechRecognitionResultListLike = {
  length?: unknown;
  [index: number]: SpeechRecognitionResultLike | undefined;
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
  private lastError?: string;
  private readonly resultListeners = new Set<(result: SpeechResult) => void>();
  private readonly errorListeners = new Set<(error: Error) => void>();

  constructor(language = "en-IN", recognitionConstructor?: SpeechRecognitionConstructor) {
    const Constructor = recognitionConstructor ?? resolveConstructor();
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

  async start(): Promise<void> {
    if (!this.recognition) {
      const error = new Error("Speech recognition is not supported in this runtime");
      this.lastError = error.message;
      throw error;
    }
    if (this.listening) return;
    this.lastError = undefined;
    try {
      this.recognition.start();
      this.listening = true;
    } catch (error) {
      this.handleError(error);
      throw error instanceof Error ? error : new Error("Speech recognition failed");
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

  status(): SpeechInputStatus {
    return {
      listening: this.listening,
      supported: this.supported,
      error: this.lastError,
    };
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
    if (typeof results !== "object" || results === null) return;

    const list = results as SpeechRecognitionResultListLike;
    const length = list.length;
    if (typeof length !== "number" || !Number.isSafeInteger(length) || length < 0) return;

    for (let index = 0; index < length; index += 1) {
      const item = list[index];
      if (!item || typeof item !== "object" || !("0" in item)) continue;
      const first = item[0];
      if (!first || typeof first !== "object") continue;
      const transcript = first.transcript;
      if (typeof transcript !== "string") continue;
      const confidence = first.confidence;
      const isFinal = Boolean(item.isFinal);
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
    this.lastError = message;
    this.errorListeners.forEach((listener) => listener(new Error(message)));
    this.listening = false;
  }
}
