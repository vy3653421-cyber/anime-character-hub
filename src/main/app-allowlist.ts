import { platform } from "node:os";

export type AllowedAppId = "calculator" | "file-manager";

export interface AllowedApp {
  id: AllowedAppId;
  label: string;
  path: string;
}

/**
 * Fixed, auditable application targets. No user/model supplied executable
 * paths are accepted here; callers may only launch these known targets.
 */
export function getAllowedApps(os: NodeJS.Platform = platform()): AllowedApp[] {
  switch (os) {
    case "win32": {
      const windowsRoot = process.env.WINDIR || "C:\\Windows";
      return [
        { id: "calculator", label: "Calculator", path: `${windowsRoot}\\System32\\calc.exe` },
        { id: "file-manager", label: "File Explorer", path: `${windowsRoot}\\explorer.exe` },
      ];
    }
    case "darwin":
      return [
        { id: "calculator", label: "Calculator", path: "/System/Applications/Calculator.app" },
        { id: "file-manager", label: "Finder", path: "/System/Library/CoreServices/Finder.app" },
      ];
    default:
      // Linux desktop application locations vary by distribution and desktop
      // environment. Do not guess an executable path or invoke a shell.
      return [];
  }
}

export function resolveAllowedApp(
  appId: unknown,
  os: NodeJS.Platform = platform(),
): AllowedApp | undefined {
  if (typeof appId !== "string") return undefined;
  return getAllowedApps(os).find((app) => app.id === appId);
}
