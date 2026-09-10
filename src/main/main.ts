import { app } from "electron";
import { registerIpcHandlers } from "./ipc";
import { createMainWindow } from "./window";

app.whenReady().then(() => {
  registerIpcHandlers(app.getVersion());

  const window = createMainWindow();
  window.loadFile("src/renderer/index.html");

  app.on("activate", () => {
    if (window.isDestroyed()) createMainWindow().loadFile("src/renderer/index.html");
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
