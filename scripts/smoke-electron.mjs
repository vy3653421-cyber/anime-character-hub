import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const electronBinary = join(
  process.cwd(),
  "node_modules",
  ".bin",
  process.platform === "win32" ? "electron.cmd" : "electron",
);
const entry = join(process.cwd(), "dist/main/main.js");

if (!existsSync(entry)) throw new Error(`Built Electron entry is missing: ${entry}`);
if (!existsSync(electronBinary)) throw new Error(`Electron binary is missing: ${electronBinary}`);

const electronArgs = ["."];
if (process.platform === "linux") {
  electronArgs.unshift("--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader");
}

const child = spawn(electronBinary, electronArgs, {
  cwd: process.cwd(),
  env: { ...process.env, DESKTOP_MATE_SMOKE: "1" },
  stdio: ["ignore", "pipe", "pipe"],
});

let output = "";
child.stdout.on("data", (chunk) => { output += chunk.toString(); process.stdout.write(chunk); });
child.stderr.on("data", (chunk) => { output += chunk.toString(); process.stderr.write(chunk); });

const timeout = setTimeout(() => {
  child.kill();
  console.error("Electron startup smoke timed out after 20s");
  process.exit(1);
}, 20_000);

child.on("error", (error) => {
  clearTimeout(timeout);
  console.error(error);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  clearTimeout(timeout);
  const runtimeQaPassed = output.includes("DESKTOP_MATE_RUNTIME_QA_OK");
  const smokePassed = output.includes("DESKTOP_MATE_SMOKE_OK");
  if (code === 0 && runtimeQaPassed && smokePassed) process.exit(0);
  console.error(`Electron runtime QA failed: code=${code ?? "null"} signal=${signal ?? "none"}`);
  console.error(`Runtime QA marker: ${runtimeQaPassed ? "present" : "missing"}; smoke marker: ${smokePassed ? "present" : "missing"}`);
  process.exit(1);
});
