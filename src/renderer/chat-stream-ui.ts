type StreamChunk = { requestId: string; text: string; done?: boolean; model?: string; provider?: string };

type StreamBridge = {
  chatStream(text: string): Promise<{ requestId: string }>;
  onChatStream(listener: (chunk: StreamChunk) => void): () => void;
};

declare global { interface Window { desktopMate?: StreamBridge; } }

const installChatStreaming = () => {
  const bridge = window.desktopMate;
  const form = document.querySelector<HTMLFormElement>("#chatForm");
  const input = document.querySelector<HTMLInputElement>("#chatInput");
  const log = document.querySelector<HTMLDivElement>("#chatLog");
  const status = document.querySelector<HTMLDivElement>("#status");
  if (!bridge || !form || !input || !log || !status) return;

  let activeRequestId: string | undefined;
  let assistantBubble: HTMLDivElement | undefined;
  let accumulated = "";

  const appendMessage = (role: "user" | "assistant", text: string) => {
    const message = document.createElement("div");
    message.className = `message ${role}`;
    message.textContent = text;
    log.appendChild(message);
    log.scrollTop = log.scrollHeight;
    return message;
  };

  bridge.onChatStream((chunk) => {
    if (!activeRequestId || chunk.requestId !== activeRequestId) return;
    if (chunk.text) {
      accumulated += chunk.text;
      if (!assistantBubble) assistantBubble = appendMessage("assistant", "");
      assistantBubble.textContent = accumulated;
      log.scrollTop = log.scrollHeight;
    }
    if (chunk.done) {
      activeRequestId = undefined;
      input.disabled = false;
      const sendButton = form.querySelector<HTMLButtonElement>("button[type=submit]");
      if (sendButton) sendButton.disabled = false;
      status.textContent = "AI response complete";
      input.focus();
    }
  });

  document.addEventListener("submit", async (event) => {
    if (event.target !== form) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (activeRequestId) return;

    const text = input.value.trim();
    if (!text) return;

    appendMessage("user", text);
    input.value = "";
    input.disabled = true;
    const sendButton = form.querySelector<HTMLButtonElement>("button[type=submit]");
    if (sendButton) sendButton.disabled = true;
    assistantBubble = undefined;
    accumulated = "";
    status.textContent = "AI is responding…";

    try {
      const result = await bridge.chatStream(text);
      activeRequestId = result.requestId;
      if (!activeRequestId) throw new Error("AI stream returned no request id");
    } catch (error) {
      activeRequestId = undefined;
      input.disabled = false;
      if (sendButton) sendButton.disabled = false;
      appendMessage("assistant", error instanceof Error ? `AI unavailable: ${error.message}` : "AI unavailable.");
      status.textContent = "AI request failed";
      input.focus();
    }
  }, true);
};

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", installChatStreaming, { once: true });
else installChatStreaming();

export {};
