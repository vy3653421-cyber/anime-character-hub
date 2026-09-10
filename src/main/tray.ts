import { app, BrowserWindow, Menu, nativeImage, Tray } from "electron";

const TRAY_ICON_DATA_URL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect x="1" y="1" width="30" height="30" rx="8" fill="#111827" stroke="#60a5fa" stroke-width="2"/>
  <path d="M9 12.5c1.6-3.2 4.2-4.8 7-4.8s5.4 1.6 7 4.8" fill="none" stroke="#93c5fd" stroke-width="2.2" stroke-linecap="round"/>
  <circle cx="12" cy="17" r="1.7" fill="#fff"/>
  <circle cx="20" cy="17" r="1.7" fill="#fff"/>
  <path d="M11.5 22c2.8 2 6.2 2 9 0" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linecap="round"/>
</svg>`)};`;

function createTrayIcon() {
  return nativeImage.createFromDataURL(TRAY_ICON_DATA_URL).resize({ width: 16, height: 16 });
}

export function createTray(window: BrowserWindow): Tray {
  const tray = new Tray(createTrayIcon());
  tray.setToolTip("Desktop Mate");

  const refreshMenu = () => {
    const visible = !window.isDestroyed() && window.isVisible();
    tray.setContextMenu(Menu.buildFromTemplate([
      {
        label: visible ? "Hide Desktop Mate" : "Show Desktop Mate",
        click: () => {
          if (window.isDestroyed()) return;
          if (window.isVisible()) window.hide();
          else window.show();
          refreshMenu();
        },
      },
      { type: "separator" },
      { label: "Quit Desktop Mate", click: () => app.quit() },
    ]));
  };

  tray.on("click", () => {
    if (window.isDestroyed()) return;
    if (window.isVisible()) window.hide();
    else window.show();
    refreshMenu();
  });
  window.on("show", refreshMenu);
  window.on("hide", refreshMenu);
  window.on("closed", () => tray.destroy());
  refreshMenu();
  return tray;
}
