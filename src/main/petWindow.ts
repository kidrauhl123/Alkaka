import { app, BrowserWindow, screen } from 'electron';
import path from 'path';

const PET_WIDTH = 220;
const PET_HEIGHT = 260;

let petWindow: BrowserWindow | null = null;

export function createPetWindow(): BrowserWindow {
  if (petWindow && !petWindow.isDestroyed()) {
    if (!petWindow.isVisible()) petWindow.show();
    return petWindow;
  }

  const isDev = process.env.NODE_ENV === 'development';
  const devServerUrl = process.env.ELECTRON_START_URL || 'http://localhost:5175';
  const preloadPath = isDev
    ? path.join(__dirname, '../dist-electron/petPreload.js')
    : path.join(__dirname, 'petPreload.js');

  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize;

  petWindow = new BrowserWindow({
    width: PET_WIDTH,
    height: PET_HEIGHT,
    x: screenW - PET_WIDTH - 24,
    y: screenH - PET_HEIGHT - 24,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      preload: preloadPath,
      devTools: isDev,
      backgroundThrottling: false,
      spellcheck: false,
      enableWebSQL: false,
      disableDialogs: true,
      navigateOnDragDrop: false,
    },
  });

  petWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  petWindow.webContents.on('will-navigate', (event) => {
    event.preventDefault();
  });

  if (isDev) {
    petWindow.loadURL(`${devServerUrl}/?window=pet`);
  } else {
    petWindow.loadFile(path.join(__dirname, '../dist/index.html'), {
      query: { window: 'pet' },
    });
  }

  petWindow.once('ready-to-show', () => {
    petWindow?.show();
  });

  petWindow.on('closed', () => {
    petWindow = null;
  });

  return petWindow;
}

export function getPetWindow(): BrowserWindow | null {
  return petWindow;
}

export function destroyPetWindow(): void {
  if (petWindow && !petWindow.isDestroyed()) {
    petWindow.destroy();
    petWindow = null;
  }
}
