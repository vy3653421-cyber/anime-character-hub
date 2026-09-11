import { app, BrowserWindow } from "electron";
import path from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import { registerIpcHandlers } from "./ipc";
import { createMainWindow } from "./window";
import { createTray } from "./tray";

const rendererEntry = () => `${__dirname}/../renderer/index.html`;
let mainWindow: BrowserWindow | undefined;
let quitting = false;

const openMainWindow = () => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    const windowStatePath = path.join(app.getPath("userData"), "window-state.json");
    mainWindow = createMainWindow(windowStatePath);
    createTray(mainWindow);
    mainWindow.on("close", (event) => {
      if (quitting || process.env.DESKTOP_MATE_SMOKE === "1") return;
      event.preventDefault();
      mainWindow?.hide();
    });
    mainWindow.webContents.once("did-finish-load", async () => {
      if (process.env.DESKTOP_MATE_SMOKE === "1") {
        const window = mainWindow;
        if (!window || window.isDestroyed()) {
          console.error("DESKTOP_MATE_RUNTIME_QA_FAILED", { reason: "main window unavailable" });
          quitting = true;
          app.exit(1);
          return;
        }

        // Let Chromium finish a render/compositor frame before requesting a capture.
        // This avoids UnknownVizError on headless/Xvfb startup where did-finish-load
        // can fire before the first drawable surface is ready.
        await new Promise((resolve) => setTimeout(resolve, 750));

        const bounds = window.getBounds();
        const loadedUrl = window.webContents.getURL();
        const visible = window.isVisible();
        const validBounds = bounds.width >= 320 && bounds.height >= 240;
        const loadedRenderer = loadedUrl.startsWith("file:") && loadedUrl.endsWith("index.html");

        if (!visible || !validBounds || !loadedRenderer) {
          console.error("DESKTOP_MATE_RUNTIME_QA_FAILED", {
            reason: "window/renderer did not initialize",
            visible,
            bounds,
            loadedUrl,
          });
          quitting = true;
          app.exit(1);
          return;
        }

        const rendererState = await window.webContents.executeJavaScript(`(() => {
          const status = document.querySelector("#status")?.textContent ?? "";
          const capabilityCount = document.querySelectorAll("#capabilities .card").length;
          const rendererScript = Array.from(document.scripts).some((script) => script.type === "module");
          return {
            status,
            capabilityCount,
            rendererScript,
            initialized: capabilityCount > 0 && status !== "Initializing runtime…",
          };
        })()`);

        if (!rendererState.initialized) {
          console.error("DESKTOP_MATE_RUNTIME_QA_FAILED", {
            reason: "renderer JavaScript did not initialize",
            rendererState,
            loadedUrl,
          });
          quitting = true;
          app.exit(1);
          return;
        }

        try {
          const screenshotDir = path.join(process.cwd(), "qa-artifacts");
          mkdirSync(screenshotDir, { recursive: true });
          const screenshotPath = path.join(screenshotDir, "desktop-mate-runtime.png");
          const image = await window.webContents.capturePage({
            x: 0,
            y: 0,
            width: bounds.width,
            height: bounds.height,
          });
          writeFileSync(screenshotPath, image.toPNG());
          console.log("DESKTOP_MATE_VISUAL_QA_ARTIFACT", screenshotPath);
        } catch (error) {
          console.error("DESKTOP_MATE_VISUAL_QA_CAPTURE_FAILED", error);
          quitting = true;
          app.exit(1);
          return;
        }

        console.log("DESKTOP_MATE_RUNTIME_QA_OK", {
          visible,
          width: bounds.width,
          height: bounds.height,
          loadedRenderer,
          rendererState,
        });
        console.log("DESKTOP_MATE_SMOKE_OK");
        quitting = true;
        app.quit();
      }
    });
    void mainWindow.loadFile(rendererEntry());
    if (process.env.DESKTOP_MATE_SMOKE === "1") {
      mainWindow.show();
    }
    return mainWindow;
  }
  mainWindow.show();
  mainWindow.focus();
  return mainWindow;
};

app.whenReady().then(() => {
  registerIpcHandlers(app.getVersion());
  app.on("before-quit", () => { quitting = true; });
  openMainWindow();
  app.on("activate", openMainWindow);
}).catch((error) => {
  console.error("Desktop Mate startup failed", error);
  app.exit(1);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
