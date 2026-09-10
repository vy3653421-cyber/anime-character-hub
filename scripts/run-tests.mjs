import { readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";

const root = resolve("src");
const files = [];

async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await collect(path);
    else if (entry.isFile() && entry.name.endsWith(".test.ts")) files.push(path);
  }
}

await collect(root);
files.sort();
if (files.length === 0) {
  console.error("No test files found under src/");
  process.exit(1);
}

const result = spawnSync(process.execPath, ["--test", "--import", "tsx", ...files], { stdio: "inherit" });
process.exit(result.status ?? 1);
