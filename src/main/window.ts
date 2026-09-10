import { BrowserWindow, screen } from "electron";
import { readFile, rename, writeFile } from "node:fs/promises";
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

async function persistWindowState(filePath: string, win: BrowserWindow): Promise<void> {
  if (win.isDestroyed() || win.isMinimized()) return;
  const [x, y] = win.getPosition();
  const [width, height] = win.getSize();
  const state: WindowState = { x, y, width, height };
  const tempPath = `${filePath}.tmp`;
  await writeFile(tempPath, JSON.stringify(state), "utf8");
  await rename(tempPath, filePath);
}

export function createMainWindow(statePath?: string): BrowserWindow {
  const fallback = { ...DEFAULT_STATE };
  const savedStatePromise = statePath ? loadWindowState(statePath) : Promise.resolve(fallback);
  let win: BrowserWindow;

  const create = (state: WindowState) => {
    const bounds = stateIsVisible(state) ? state : fallback;
    win = new BrowserWindow({
      x: bounds.x || undefined,
      y: bounds.y || undefined,
      width: bounds.width,
      height: bounds.height,
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
      const save = () => { void persistWindowState(statePath, win); };
      win.on("move", save);
      win.on("resize", save);
      win.on("closed", save);
    } else {
      win.on("closed", () => undefined);
    }
    return win;
  };

  // BrowserWindow construction must remain synchronous for callers. Start from defaults,
  // then restore persisted bounds before first display when the file is available.
  // The async restoration only changes bounds; it never changes security settings.
  win = create(fallback);
  void savedStatePromise.then((state) => {
    if (!win.isDestroyed() && stateIsVisible(state)) win.setBounds(state);
  });
  return win;
}
