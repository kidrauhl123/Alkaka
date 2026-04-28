import { beforeEach, describe, expect, test, vi } from 'vitest';

type MenuItem = {
  label?: string;
  click?: () => void;
  type?: string;
};

let lastTemplate: MenuItem[] = [];

vi.mock('electron', () => ({
  app: {
    isPackaged: false,
    quit: vi.fn(),
  },
  nativeImage: {
    createFromPath: vi.fn(() => ({
      getSize: () => ({ width: 18, height: 18 }),
      resize: vi.fn(function resize() { return this; }),
      setTemplateImage: vi.fn(),
    })),
  },
  Menu: {
    buildFromTemplate: vi.fn((template: MenuItem[]) => {
      lastTemplate = template;
      return { template };
    }),
  },
  Tray: vi.fn(function Tray() {
    return {
      setToolTip: vi.fn(),
      on: vi.fn(),
      removeListener: vi.fn(),
      destroy: vi.fn(),
      popUpContextMenu: vi.fn(),
    };
  }),
  BrowserWindow: vi.fn(),
}));

vi.mock('./i18n', () => ({
  t: (key: string) => ({
    trayShowWindow: '显示主窗口',
    trayNewTask: '新建任务',
    traySettings: '设置',
    trayQuit: '退出',
  }[key] ?? key),
}));

const makeWindow = (loading = false) => {
  const callbacks = new Map<string, () => void>();
  return {
    isDestroyed: vi.fn(() => false),
    isVisible: vi.fn(() => false),
    show: vi.fn(),
    isFocused: vi.fn(() => false),
    focus: vi.fn(),
    webContents: {
      isLoadingMainFrame: vi.fn(() => loading),
      once: vi.fn((event: string, callback: () => void) => {
        callbacks.set(event, callback);
      }),
      send: vi.fn(),
    },
    emitWebContents(event: string) {
      callbacks.get(event)?.();
    },
  };
};

describe('trayManager pet-first main window actions', () => {
  beforeEach(async () => {
    vi.resetModules();
    lastTemplate = [];
  });

  test('new task waits for a newly-created main window to finish loading before sending IPC', async () => {
    const { createTray, destroyTray } = await import('./trayManager');
    const win = makeWindow(true);

    createTray(() => win as never);

    lastTemplate.find((item) => item.label === '新建任务')?.click?.();

    expect(win.show).toHaveBeenCalled();
    expect(win.focus).toHaveBeenCalled();
    expect(win.webContents.send).not.toHaveBeenCalled();
    expect(win.webContents.once).toHaveBeenCalledWith('did-finish-load', expect.any(Function));

    win.emitWebContents('did-finish-load');

    expect(win.webContents.send).toHaveBeenCalledWith('app:newTask');
    destroyTray();
  });
});
