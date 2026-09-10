import { randomUUID } from "node:crypto";
import type { AssistantConfig } from "./contracts";
import type { AIProvider, ChatMessage } from "./ai-provider";
import { MemoryStore } from "./memory";
import { ToolOrchestrator, type ToolExecutor } from "./tool-orchestrator";

export interface AgentTurn {
  requestId: string;
  text: string;
  model: string;
  provider: string;
  toolCalls: number;
  toolResults: number;
}

export class AssistantAgent {
  private readonly history: ChatMessage[] = [];
  private readonly orchestrator?: ToolOrchestrator;

  constructor(
    private readonly provider: AIProvider,
    private readonly memory: MemoryStore,
    private readonly config: AssistantConfig,
    toolExecutor?: ToolExecutor,
  ) {
    this.orchestrator = toolExecutor ? new ToolOrchestrator(provider, toolExecutor) : undefined;
  }

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
        "Never claim to have used a desktop tool unless the runtime actually executed it successfully.",
        "If a desktop action is needed, request it only with: <tool_call>{\"toolId\":\"...\",\"input\":{...},\"confirmed\":false}</tool_call>.",
        "Never invent tool results. The runtime decides whether a tool is allowed and whether confirmation is required.",
        memoryContext,
      ].join("\n"),
    };

    const messages = [system, ...this.history, { role: "user", content: userText } satisfies ChatMessage];
    const response = this.orchestrator
      ? await this.orchestrator.run(messages)
      : await this.provider.chat({ messages });

    this.history.push({ role: "user", content: userText });
    this.history.push({ role: "assistant", content: response.text });

    return {
      requestId,
      text: response.text,
      model: response.model,
      provider: response.provider,
      toolCalls: "toolCalls" in response ? response.toolCalls.length : 0,
      toolResults: "toolResults" in response ? response.toolResults.length : 0,
    };
  }

  resetSession(): void {
    this.history.length = 0;
  }
}
