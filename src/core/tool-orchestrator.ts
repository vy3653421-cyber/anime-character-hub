import type { AIProvider, ChatMessage } from "./ai-provider";
import type { DesktopToolRequest, DesktopToolResult } from "../main/desktop-tools";

export interface ToolExecutor {
  execute(request: DesktopToolRequest): Promise<DesktopToolResult>;
}

export interface ParsedToolCall {
  toolId: string;
  input?: unknown;
  confirmed?: boolean;
}

export interface ToolLoopResult {
  text: string;
  toolCalls: ParsedToolCall[];
  toolResults: DesktopToolResult[];
}

const TOOL_CALL_PATTERN = /<tool_call>\s*([\s\S]*?)\s*<\/tool_call>/gi;
const MAX_TOOL_CALLS_PER_TURN = 3;

function parseToolCalls(text: string): ParsedToolCall[] {
  const calls: ParsedToolCall[] = [];
  for (const match of text.matchAll(TOOL_CALL_PATTERN)) {
    if (calls.length >= MAX_TOOL_CALLS_PER_TURN) break;
    try {
      const parsed = JSON.parse(match[1]) as Partial<ParsedToolCall>;
      if (typeof parsed.toolId !== "string" || !parsed.toolId.trim()) continue;
      calls.push({
        toolId: parsed.toolId.trim(),
        input: parsed.input,
        confirmed: parsed.confirmed === true,
      });
    } catch {
      // Malformed model output is treated as normal text and is never executed.
    }
  }
  return calls;
}

function stripToolCalls(text: string): string {
  return text.replace(TOOL_CALL_PATTERN, "").replace(/\n{3,}/g, "\n\n").trim();
}

export class ToolOrchestrator {
  constructor(
    private readonly provider: AIProvider,
    private readonly executor: ToolExecutor,
  ) {}

  async run(messages: ChatMessage[]): Promise<ToolLoopResult & { model: string; provider: string }> {
    const first = await this.provider.chat({ messages });
    const calls = parseToolCalls(first.text);
    if (!calls.length) {
      return { text: first.text, toolCalls: [], toolResults: [], model: first.model, provider: first.provider };
    }

    const results: DesktopToolResult[] = [];
    for (const call of calls) {
      results.push(await this.executor.execute(call));
    }

    const toolSummary = calls.map((call, index) =>
      `Tool ${call.toolId} result: ${JSON.stringify(results[index])}`,
    ).join("\n");

    const final = await this.provider.chat({
      messages: [
        ...messages,
        { role: "assistant", content: first.text },
        {
          role: "system",
          content: `The runtime has executed or rejected the requested desktop tools. Use these results and do not claim an action succeeded unless its result has ok=true.\n${toolSummary}`,
        },
      ],
    });

    return {
      text: stripToolCalls(final.text),
      toolCalls: calls,
      toolResults: results,
      model: final.model,
      provider: final.provider,
    };
  }
}

export { parseToolCalls, stripToolCalls, MAX_TOOL_CALLS_PER_TURN };
