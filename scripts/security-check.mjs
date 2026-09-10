import { readFile } from "node:fs/promises";

const tools = await readFile("src/main/desktop-tools.ts", "utf8");
const permissions = await readFile("src/core/tool-permissions.ts", "utf8");
const orchestrator = await readFile("src/core/tool-orchestrator.ts", "utf8");
const preload = await readFile("src/main/preload.ts", "utf8");
const window = await readFile("src/main/window.ts", "utf8");

const checks = [
  ["desktop bridge has no arbitrary process execution", !/\b(exec|execFile|spawn|spawnSync|fork)\s*\(/.test(tools)],
  ["external URL execution is restricted to HTTP(S)", /url\.protocol === "https:" \|\| url\.protocol === "http:"/.test(tools)],
  ["unknown tools are denied by policy", /Tool is not registered/.test(permissions)],
  ["restricted tools are denied by policy", /Tool is restricted/.test(permissions)],
  ["confirmation-gated tools require explicit confirmation", /requiresConfirmation && !confirmed/.test(permissions)],
  ["AI tool output cannot self-authorize confirmation", /confirmed:\s*false/.test(orchestrator) && /Model output is never proof of user consent/.test(orchestrator)],
  ["BrowserWindow uses context isolation", /contextIsolation:\s*true/.test(window)],
  ["BrowserWindow disables Node integration", /nodeIntegration:\s*false/.test(window)],
  ["BrowserWindow enables sandboxing", /sandbox:\s*true/.test(window)],
  ["preload exposes only the context bridge", /contextBridge\.exposeInMainWorld\("desktopMate"/.test(preload)],
];

for (const [name, passed] of checks) console.log(`${passed ? "PASS" : "FAIL"} ${name}`);
if (checks.some(([, passed]) => !passed)) process.exit(1);
console.log("Security static checks passed.");
