import { clipboard, Notification, shell } from "electron";
import { ToolPermissionPolicy, createDefaultToolPolicy } from "../core/tool-permissions";
import { resolveAllowedApp } from "./app-allowlist";

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
      case "open-app": {
        const appId = typeof request.input === "object" && request.input !== null
          ? (request.input as { appId?: unknown }).appId
          : request.input;
        const allowedApp = resolveAllowedApp(appId);
        if (!allowedApp) {
          return {
            ok: false,
            reason: "Unknown application. Choose an application from Desktop Mate's explicit allowlist.",
          };
        }
        const error = await shell.openPath(allowedApp.path);
        if (error) return { ok: false, reason: `Unable to open ${allowedApp.label}: ${error}` };
        return { ok: true, data: { appId: allowedApp.id, label: allowedApp.label } };
      }
      default:
        return { ok: false, reason: "Tool is not registered" };
    }
  }
}
