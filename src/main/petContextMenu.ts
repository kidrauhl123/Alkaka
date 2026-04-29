import type { MenuItemConstructorOptions } from 'electron';

export interface PetContextMenuActions {
  openConversation: () => void;
  openMainWindow: () => void;
  hidePet: () => void;
  quitApp: () => void;
}

export function buildPetContextMenuTemplate({
  openConversation,
  openMainWindow,
  hidePet,
  quitApp,
}: PetContextMenuActions): MenuItemConstructorOptions[] {
  return [
    {
      label: '对话',
      click: openConversation,
    },
    {
      label: '进入主窗口',
      click: openMainWindow,
    },
    { type: 'separator' },
    {
      label: '隐藏桌宠',
      click: hidePet,
    },
    { type: 'separator' },
    {
      label: '退出应用',
      click: quitApp,
    },
  ];
}
