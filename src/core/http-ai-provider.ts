import type { AIProvider, ChatRequest, ChatResponse } from "./ai-provider";

export interface OpenAICompatibleProviderOptions {
  id: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  timeoutMs?: number;
}

export class OpenAICompatibleProvider implements AIProvider {
  readonly id: string;
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly defaultModel: string;
  private readonly timeoutMs: number;

  constructor(options: OpenAICompatibleProviderOptions) {
    this.id = options.id;
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.apiKey = options.apiKey;
    this.defaultModel = options.model;
    this.timeoutMs = options.timeoutMs ?? 30_000;
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    if (request.signal) request.signal.addEventListener("abort", () => controller.abort(), { once: true });
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: request.model ?? this.defaultModel,
          messages: request.messages,
          ...(request.temperature === undefined ? {} : { temperature: request.temperature }),
          ...(request.maxOutputTokens === undefined ? {} : { max_tokens: request.maxOutputTokens }),
        }),
        signal: controller.signal,
      });
      const raw = await response.text();
      let payload: unknown;
      try { payload = JSON.parse(raw); } catch { payload = undefined; }
      if (!response.ok) {
        const message = typeof payload === "object" && payload !== null && "error" in payload
          ? JSON.stringify((payload as { error: unknown }).error)
          : raw.slice(0, 500);
        throw new Error(`AI provider ${response.status}: ${message}`);
      }
      const choice = typeof payload === "object" && payload !== null && "choices" in payload
        ? (payload as { choices?: Array<{ message?: { content?: unknown } }> }).choices?.[0]
        : undefined;
      const text = choice?.message?.content;
      if (typeof text !== "string" || !text.trim()) throw new Error("AI provider returned no assistant text");
      const model = typeof payload === "object" && payload !== null && "model" in payload && typeof (payload as { model?: unknown }).model === "string"
        ? (payload as { model: string }).model
        : request.model ?? this.defaultModel;
      return { text, model, provider: this.id };
    } finally {
      clearTimeout(timer);
    }
  }
}
