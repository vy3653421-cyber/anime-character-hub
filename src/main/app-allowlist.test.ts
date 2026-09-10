import assert from "node:assert/strict";
import test from "node:test";
import { getAllowedApps, resolveAllowedApp } from "./app-allowlist";

test("Windows allowlist contains only fixed system applications", () => {
  const apps = getAllowedApps("win32");
  assert.deepEqual(apps.map((app) => app.id), ["calculator", "file-manager"]);
  assert.equal(apps[0]?.path, "C:\\Windows\\System32\\calc.exe");
  assert.equal(apps[1]?.path, "C:\\Windows\\explorer.exe");
});

test("macOS allowlist contains only fixed system applications", () => {
  const apps = getAllowedApps("darwin");
  assert.deepEqual(apps.map((app) => app.id), ["calculator", "file-manager"]);
  assert.equal(apps[0]?.path, "/System/Applications/Calculator.app");
  assert.equal(apps[1]?.path, "/System/Library/CoreServices/Finder.app");
});

test("Linux does not guess executable paths", () => {
  assert.deepEqual(getAllowedApps("linux"), []);
});

test("unknown or path-like input can never resolve to an app", () => {
  assert.equal(resolveAllowedApp("calculator.exe", "win32"), undefined);
  assert.equal(resolveAllowedApp("/usr/bin/xterm", "linux"), undefined);
  assert.equal(resolveAllowedApp({ appId: "calculator" }, "win32"), undefined);
});

test("known logical application IDs resolve to fixed targets", () => {
  assert.equal(resolveAllowedApp("calculator", "win32")?.path, "C:\\Windows\\System32\\calc.exe");
  assert.equal(resolveAllowedApp("file-manager", "darwin")?.path, "/System/Library/CoreServices/Finder.app");
});
