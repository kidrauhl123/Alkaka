import { describe, expect, it, vi } from 'vitest';

import { buildPetContextMenuTemplate } from './petContextMenu';

describe('buildPetContextMenuTemplate', () => {
  it('puts conversation first in the pet right-click menu', () => {
    const template = buildPetContextMenuTemplate({
      openConversation: vi.fn(),
      openMainWindow: vi.fn(),
      hidePet: vi.fn(),
      quitApp: vi.fn(),
    });

    expect(template.map((item) => item.type === 'separator' ? '---' : item.label)).toEqual([
      '对话',
      '进入主窗口',
      '---',
      '隐藏桌宠',
      '---',
      '退出应用',
    ]);
  });
});
