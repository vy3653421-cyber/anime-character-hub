import type { AIProvider, ChatRequest, ChatResponse, ChatStreamChunk } from "./ai-provider";

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

  private buildBody(request: ChatRequest, stream: boolean): string {
    return JSON.stringify({
      model: request.model ?? this.defaultModel,
      messages: request.messages,
      ...(request.temperature === undefined ? {} : { temperature: request.temperature }),
      ...(request.maxOutputTokens === undefined ? {} : { max_tokens: request.maxOutputTokens }),
      ...(stream ? { stream: true } : {}),
    });
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    if (request.signal) request.signal.addEventListener("abort", () => controller.abort(), { once: true });
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${this.apiKey}` },
        body: this.buildBody(request, false),
        signal: controller.signal,
      });
      const raw = await response.text();
      let payload: unknown;
      try { payload = JSON.parse(raw); } catch { payload = undefined; }
      if (!response.ok) throw new Error(`AI provider ${response.status}: ${this.errorMessage(payload, raw)}`);
      const choice = typeof payload === "object" && payload !== null && "choices" in payload
        ? (payload as { choices?: Array<{ message?: { content?: unknown } }> }).choices?.[0] : undefined;
      const text = choice?.message?.content;
      if (typeof text !== "string" || !text.trim()) throw new Error("AI provider returned no assistant text");
      const model = this.responseModel(payload, request);
      return { text, model, provider: this.id };
    } finally { clearTimeout(timer); }
  }

  async *stream(request: ChatRequest): AsyncIterable<ChatStreamChunk> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    if (request.signal) request.signal.addEventListener("abort", () => controller.abort(), { once: true });
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${this.apiKey}`, accept: "text/event-stream" },
        body: this.buildBody(request, true),
        signal: controller.signal,
      });
      if (!response.ok) {
        const raw = await response.text();
        let payload: unknown;
        try { payload = JSON.parse(raw); } catch { payload = undefined; }
        throw new Error(`AI provider ${response.status}: ${this.errorMessage(payload, raw)}`);
      }
      if (!response.body) throw new Error("AI provider streaming response has no body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let model = request.model ?? this.defaultModel;
      let emitted = false;
      const consume = async (text: string): Promise<ChatStreamChunk | undefined> => {
        const lines = text.split(/\r?\n/);
        for (const line of lines) {
          const data = line.startsWith("data:") ? line.slice(5).trim() : "";
          if (!data || data === "[DONE]") continue;
          let payload: unknown;
          try { payload = JSON.parse(data); } catch { continue; }
          if (typeof payload !== "object" || payload === null) continue;
          if ("model" in payload && typeof (payload as { model?: unknown }).model === "string") model = (payload as { model: string }).model;
          const choice = "choices" in payload ? (payload as { choices?: Array<{ delta?: { content?: unknown } }> }).choices?.[0] : undefined;
          const delta = choice?.delta?.content;
          if (typeof delta === "string" && delta) { emitted = true; return { text: delta, model, provider: this.id }; }
        }
        return undefined;
      };
      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const parts = buffer.split(/\r?\n\r?\n/);
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          const chunk = await consume(part);
          if (chunk) yield chunk;
        }
        if (done) break;
      }
      const finalChunk = await consume(buffer);
      if (finalChunk) yield finalChunk;
      if (!emitted) throw new Error("AI provider stream returned no assistant text");
      yield { text: "", done: true, model, provider: this.id };
    } finally { clearTimeout(timer); }
  }

  private responseModel(payload: unknown, request: ChatRequest): string {
    return typeof payload === "object" && payload !== null && "model" in payload && typeof (payload as { model?: unknown }).model === "string"
      ? (payload as { model: string }).model : request.model ?? this.defaultModel;
  }

  private errorMessage(payload: unknown, raw: string): string {
    if (typeof payload === "object" && payload !== null && "error" in payload) return JSON.stringify((payload as { error: unknown }).error);
    return raw.slice(0, 500);
  }
}
