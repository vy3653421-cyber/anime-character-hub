type StreamChunk = { requestId: string; text: string; done?: boolean; model?: string; provider?: string; cancelled?: boolean };

type StreamBridge = {
  chatStream(text: string): Promise<{ requestId: string }>;
  cancelChatStream(requestId: string): Promise<{ ok: boolean; reason?: string }>;
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
  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.textContent = "Cancel";
  cancelButton.hidden = true;
  cancelButton.className = "secondary";
  form.appendChild(cancelButton);

  const appendMessage = (role: "user" | "assistant", text: string) => {
    const message = document.createElement("div");
    message.className = `message ${role}`;
    message.textContent = text;
    log.appendChild(message);
    log.scrollTop = log.scrollHeight;
    return message;
  };

  const setBusy = (busy: boolean) => {
    input.disabled = busy;
    const sendButton = form.querySelector<HTMLButtonElement>("button[type=submit]");
    if (sendButton) sendButton.disabled = busy;
    cancelButton.hidden = !busy;
  };

  const finish = (message: string) => {
    activeRequestId = undefined;
    setBusy(false);
    status.textContent = message;
    input.focus();
  };

  bridge.onChatStream((chunk) => {
    if (!activeRequestId || chunk.requestId !== activeRequestId) return;
    if (chunk.text) {
      accumulated += chunk.text;
      if (!assistantBubble) assistantBubble = appendMessage("assistant", "");
      assistantBubble.textContent = accumulated;
      log.scrollTop = log.scrollHeight;
    }
    if (chunk.done) finish(chunk.cancelled ? "AI response cancelled" : "AI response complete");
  });

  cancelButton.addEventListener("click", () => {
    const requestId = activeRequestId;
    if (!requestId) return;
    cancelButton.disabled = true;
    void bridge.cancelChatStream(requestId).catch(() => undefined);
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (activeRequestId) return;

    const text = input.value.trim();
    if (!text) return;

    appendMessage("user", text);
    input.value = "";
    setBusy(true);
    cancelButton.disabled = false;
    assistantBubble = undefined;
    accumulated = "";
    status.textContent = "AI is responding…";

    try {
      const result = await bridge.chatStream(text);
      activeRequestId = result.requestId;
      if (!activeRequestId) throw new Error("AI stream returned no request id");
    } catch (error) {
      activeRequestId = undefined;
      setBusy(false);
      appendMessage("assistant", error instanceof Error ? `AI unavailable: ${error.message}` : "AI unavailable.");
      status.textContent = "AI request failed";
      input.focus();
    }
  });
};

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", installChatStreaming, { once: true });
else installChatStreaming();

export {};
