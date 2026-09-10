import test from "node:test";
import assert from "node:assert/strict";
import { ToolOrchestrator, parseToolCalls, stripToolCalls } from "./tool-orchestrator";
import type { AIProvider, ChatRequest, ChatResponse } from "./ai-provider";
import type { DesktopToolRequest, DesktopToolResult } from "../main/desktop-tools";

class FakeProvider implements AIProvider {
  readonly id = "fake";
  private index = 0;
  constructor(private readonly responses: string[]) {}
  async chat(_request: ChatRequest): Promise<ChatResponse> {
    const text = this.responses[Math.min(this.index++, this.responses.length - 1)];
    return { text, model: "fake-model", provider: this.id };
  }
}

class FakeExecutor {
  readonly requests: DesktopToolRequest[] = [];
  async execute(request: DesktopToolRequest): Promise<DesktopToolResult> {
    this.requests.push(request);
    return request.toolId === "notify" ? { ok: true } : { ok: false, reason: "denied" };
  }
}

test("parses only valid bounded tool calls", () => {
  const text = [
    "before",
    '<tool_call>{"toolId":"notify","input":{"body":"hi"}}</tool_call>',
    '<tool_call>{"toolId":"open-url","confirmed":true}</tool_call>',
    '<tool_call>{bad json}</tool_call>',
    '<tool_call>{"toolId":"read-clipboard"}</tool_call>',
    '<tool_call>{"toolId":"extra"}</tool_call>',
  ].join("\n");
  const calls = parseToolCalls(text);
  assert.equal(calls.length, 3);
  assert.equal(calls[0].toolId, "notify");
  assert.equal(calls[1].confirmed, true);
  assert.equal(calls[2].toolId, "read-clipboard");
  assert.equal(stripToolCalls(text).includes("before"), true);
  assert.equal(stripToolCalls(text).includes("bad json"), false);
});

test("executes requested tools and forces a final model turn", async () => {
  const provider = new FakeProvider([
    '<tool_call>{"toolId":"notify","input":{"body":"hello"}}</tool_call>',
    "The notification was sent.",
  ]);
  const executor = new FakeExecutor();
  const result = await new ToolOrchestrator(provider, executor).run([
    { role: "user", content: "send a notification" },
  ]);

  assert.equal(executor.requests.length, 1);
  assert.equal(executor.requests[0].toolId, "notify");
  assert.deepEqual(result.toolResults, [{ ok: true }]);
  assert.equal(result.text, "The notification was sent.");
});

test("malformed tool output never executes", async () => {
  const provider = new FakeProvider(["<tool_call>{not json}</tool_call>"]);
  const executor = new FakeExecutor();
  const result = await new ToolOrchestrator(provider, executor).run([
    { role: "user", content: "do something" },
  ]);
  assert.equal(executor.requests.length, 0);
  assert.equal(result.toolCalls.length, 0);
  assert.match(result.text, /not json/);
});
