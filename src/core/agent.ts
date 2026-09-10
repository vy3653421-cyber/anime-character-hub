import { randomUUID } from "node:crypto";
import type { AssistantConfig } from "./contracts";
import type { AIProvider, ChatMessage } from "./ai-provider";
import { MemoryStore } from "./memory";

export interface AgentTurn {
  requestId: string;
  text: string;
  model: string;
  provider: string;
}

export class AssistantAgent {
  private readonly history: ChatMessage[] = [];

  constructor(
    private readonly provider: AIProvider,
    private readonly memory: MemoryStore,
    private readonly config: AssistantConfig,
  ) {}

  async respond(userText: string): Promise<AgentTurn> {
    const requestId = randomUUID();
    const memories = this.memory.search(userText).slice(0, 5);
    const memoryContext = memories.length
      ? `\nRelevant memories:\n${memories.map((entry) => `- ${entry.content}`).join("\n")}`
      : "";

    const system: ChatMessage = {
      role: "system",
      content: [
        `You are ${this.config.name}, a desktop companion.`,
        this.config.personality,
        `Response style: ${this.config.responseStyle}.`,
        "Never claim to have used a desktop tool unless the runtime actually executed it.",
        memoryContext,
      ].join("\n"),
    };

    this.history.push({ role: "user", content: userText });
    const response = await this.provider.chat({
      messages: [system, ...this.history],
    });
    this.history.push({ role: "assistant", content: response.text });

    return {
      requestId,
      text: response.text,
      model: response.model,
      provider: response.provider,
    };
  }

  resetSession(): void {
    this.history.length = 0;
  }
}
