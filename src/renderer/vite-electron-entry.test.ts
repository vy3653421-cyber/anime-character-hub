import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

const configPath = path.resolve("vite.config.ts");

test("Vite emits relative asset URLs for Electron file:// packaging", async () => {
  const config = await readFile(configPath, "utf8");
  assert.match(
    config,
    /base:\s*["']\.\/["']/,
    "vite.config.ts must set base to ./ so packaged Electron file:// pages can load renderer modules",
  );
});
