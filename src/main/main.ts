import { app } from "electron";
import { registerIpcHandlers } from "./ipc";
import { createMainWindow } from "./window";

const rendererEntry = () => `${__dirname}/../renderer/index.html`;

app.whenReady().then(() => {
  registerIpcHandlers(app.getVersion());

  const window = createMainWindow();
  window.loadFile(rendererEntry());

  app.on("activate", () => {
    if (window.isDestroyed()) createMainWindow().loadFile(rendererEntry());
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
