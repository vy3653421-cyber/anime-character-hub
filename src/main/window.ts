import { BrowserWindow, screen } from "electron";
import { readFile, rename, writeFile } from "node:fs/promises";
import { renameSync, writeFileSync } from "node:fs";
import path from "node:path";

interface WindowState {
  x: number;
  y: number;
  width: number;
  height: number;
}

const DEFAULT_STATE: WindowState = { x: 0, y: 0, width: 520, height: 760 };
const MIN_WIDTH = 360;
const MIN_HEIGHT = 520;

async function loadWindowState(filePath: string): Promise<WindowState> {
  try {
    const parsed = JSON.parse(await readFile(filePath, "utf8")) as Partial<WindowState>;
    if (![parsed.x, parsed.y, parsed.width, parsed.height].every((value) => typeof value === "number" && Number.isFinite(value))) {
      return DEFAULT_STATE;
    }
    return {
      x: Math.round(parsed.x!),
      y: Math.round(parsed.y!),
      width: Math.max(MIN_WIDTH, Math.round(parsed.width!)),
      height: Math.max(MIN_HEIGHT, Math.round(parsed.height!)),
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function stateIsVisible(state: WindowState): boolean {
  return screen.getAllDisplays().some((display) => {
    const area = display.workArea;
    return state.x < area.x + area.width && state.x + state.width > area.x
      && state.y < area.y + area.height && state.y + state.height > area.y;
  });
}

function getWindowState(win: BrowserWindow): WindowState | undefined {
  if (win.isDestroyed() || win.isMinimized()) return undefined;
  const [x, y] = win.getPosition();
  const [width, height] = win.getSize();
  return { x, y, width, height };
}

async function persistWindowState(filePath: string, win: BrowserWindow): Promise<void> {
  const state = getWindowState(win);
  if (!state) return;
  const tempPath = `${filePath}.tmp`;
  await writeFile(tempPath, JSON.stringify(state), "utf8");
  await rename(tempPath, filePath);
}

function persistWindowStateSync(filePath: string, win: BrowserWindow): void {
  const state = getWindowState(win);
  if (!state) return;
  const tempPath = `${filePath}.tmp`;
  try {
    writeFileSync(tempPath, JSON.stringify(state), "utf8");
    renameSync(tempPath, filePath);
  } catch (error) {
    console.error("Desktop Mate window-state save failed", error);
  }
}

export function createMainWindow(statePath?: string): BrowserWindow {
  const fallback = { ...DEFAULT_STATE };
  const savedStatePromise = statePath ? loadWindowState(statePath) : Promise.resolve(fallback);

  const win = new BrowserWindow({
    x: fallback.x,
    y: fallback.y,
    width: fallback.width,
    height: fallback.height,
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    frame: false,
    transparent: true,
    resizable: true,
    alwaysOnTop: true,
    show: false,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.once("ready-to-show", () => win.show());
  if (statePath) {
    let saveTimer: NodeJS.Timeout | undefined;
    const save = () => {
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        saveTimer = undefined;
        void persistWindowState(statePath, win);
      }, 150);
    };
    win.on("move", save);
    win.on("resize", save);
    win.on("close", () => {
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = undefined;
      persistWindowStateSync(statePath, win);
    });
  }

  void savedStatePromise.then((state) => {
    if (!win.isDestroyed() && stateIsVisible(state)) win.setBounds(state);
  });
  return win;
}
