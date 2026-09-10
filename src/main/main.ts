import { app } from "electron";
import { registerIpcHandlers } from "./ipc";
import { createMainWindow } from "./window";

const rendererEntry = () => `${__dirname}/../renderer/index.html`;

app.whenReady().then(() => {
  registerIpcHandlers(app.getVersion());

  const window = createMainWindow();
  window.webContents.once("did-finish-load", () => {
    if (process.env.DESKTOP_MATE_SMOKE === "1") {
      console.log("DESKTOP_MATE_SMOKE_OK");
      app.quit();
    }
  });
  void window.loadFile(rendererEntry());

  app.on("activate", () => {
    if (window.isDestroyed()) createMainWindow().loadFile(rendererEntry());
  });
}).catch((error) => {
  console.error("Desktop Mate startup failed", error);
  app.exit(1);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
