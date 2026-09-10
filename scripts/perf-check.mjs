import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const renderer = await readFile("src/renderer/renderer.ts", "utf8");

const checks = [
  ["renderer pixel ratio is capped", /setPixelRatio\(Math\.min\(window\.devicePixelRatio, 2\)\)/.test(renderer)],
  ["animation loop uses setAnimationLoop", /renderer\.setAnimationLoop/.test(renderer)],
  ["renderer cleans up on unload", /renderer\.dispose\(\)/.test(renderer)],
  ["performance script is registered", packageJson.scripts?.perf === "node scripts/perf-check.mjs"],
];

for (const [name, passed] of checks) console.log(`${passed ? "PASS" : "FAIL"} ${name}`);
if (checks.some(([, passed]) => !passed)) process.exit(1);

const build = spawnSync(process.execPath, ["--version"], { encoding: "utf8" });
if (build.status !== 0) process.exit(build.status ?? 1);
console.log(`Node runtime: ${build.stdout.trim()}`);
console.log("Performance static checks passed.");
