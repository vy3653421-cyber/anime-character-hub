import { app, BrowserWindow } from "electron";
import { registerIpcHandlers } from "./ipc";
import { createMainWindow } from "./window";
import { createTray } from "./tray";

const rendererEntry = () => `${__dirname}/../renderer/index.html`;
let mainWindow: BrowserWindow | undefined;

const openMainWindow = () => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    mainWindow = createMainWindow();
    createTray(mainWindow);
    mainWindow.webContents.once("did-finish-load", () => {
      if (process.env.DESKTOP_MATE_SMOKE === "1") {
        console.log("DESKTOP_MATE_SMOKE_OK");
        app.quit();
      }
    });
    void mainWindow.loadFile(rendererEntry());
    return mainWindow;
  }
  mainWindow.show();
  mainWindow.focus();
  return mainWindow;
};

app.whenReady().then(() => {
  registerIpcHandlers(app.getVersion());
  openMainWindow();
  app.on("activate", openMainWindow);
}).catch((error) => {
  console.error("Desktop Mate startup failed", error);
  app.exit(1);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
