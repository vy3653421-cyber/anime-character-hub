import { clipboard, Notification, shell } from "electron";
import { ToolPermissionPolicy, createDefaultToolPolicy } from "../core/tool-permissions";

export interface DesktopToolRequest {
  toolId: string;
  input?: unknown;
  confirmed?: boolean;
}

export interface DesktopToolResult {
  ok: boolean;
  requiresConfirmation?: boolean;
  reason?: string;
  data?: unknown;
}

const isHttpUrl = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
};

export class DesktopToolRuntime {
  constructor(private readonly policy: ToolPermissionPolicy = createDefaultToolPolicy()) {}

  listTools() {
    return this.policy.list();
  }

  async execute(request: DesktopToolRequest): Promise<DesktopToolResult> {
    const decision = this.policy.decide(request.toolId, request.confirmed === true);
    if (!decision.allowed) {
      return {
        ok: false,
        requiresConfirmation: decision.requiresConfirmation,
        reason: decision.reason,
      };
    }

    switch (request.toolId) {
      case "notify": {
        const body = typeof request.input === "object" && request.input !== null
          ? (request.input as { body?: unknown }).body
          : request.input;
        if (typeof body !== "string" || !body.trim()) {
          return { ok: false, reason: "notify requires a non-empty text body" };
        }
        new Notification({ title: "Desktop Mate", body }).show();
        return { ok: true };
      }
      case "read-clipboard":
        return { ok: true, data: clipboard.readText() };
      case "open-url": {
        const value = typeof request.input === "object" && request.input !== null
          ? (request.input as { url?: unknown }).url
          : request.input;
        if (!isHttpUrl(value)) return { ok: false, reason: "open-url accepts only http(s) URLs" };
        await shell.openExternal(value);
        return { ok: true };
      }
      case "open-app":
        return { ok: false, reason: "open-app is policy-defined but execution is intentionally disabled until an explicit app allowlist exists" };
      default:
        return { ok: false, reason: "Tool is not registered" };
    }
  }
}
