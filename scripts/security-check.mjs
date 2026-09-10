import { readFile } from "node:fs/promises";

const tools = await readFile("src/main/desktop-tools.ts", "utf8");
const permissions = await readFile("src/core/tool-permissions.ts", "utf8");
const preload = await readFile("src/main/preload.ts", "utf8");

const checks = [
  ["desktop bridge has no arbitrary process execution", !/\b(exec|execFile|spawn|spawnSync|fork)\s*\(/.test(tools)],
  ["external URL execution is restricted to HTTP(S)", /url\.protocol === "https:" \|\| url\.protocol === "http:"/.test(tools)],
  ["unknown tools are denied by policy", /Tool is not registered/.test(permissions)],
  ["restricted tools are denied by policy", /Tool is restricted/.test(permissions)],
  ["confirmation-gated tools require explicit confirmation", /requiresConfirmation && !confirmed/.test(permissions)],
  ["preload uses context isolation", /contextIsolation:\s*true/.test(preload)],
  ["preload disables Node integration", /nodeIntegration:\s*false/.test(preload)],
  ["preload enables sandboxing", /sandbox:\s*true/.test(preload)],
];

for (const [name, passed] of checks) console.log(`${passed ? "PASS" : "FAIL"} ${name}`);
if (checks.some(([, passed]) => !passed)) process.exit(1);
console.log("Security static checks passed.");
