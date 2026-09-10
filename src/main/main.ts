import { app, ipcMain } from "electron";
import { createMainWindow } from "./window";

app.whenReady().then(() => {
  ipcMain.handle("mate:get-status", () => ({
    ready: true,
    version: app.getVersion(),
  }));

  const window = createMainWindow();
  window.loadFile("src/renderer/index.html");

  app.on("activate", () => {
    if (window.isDestroyed()) createMainWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
