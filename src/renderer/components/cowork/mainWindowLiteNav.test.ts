import { describe, expect, it } from 'vitest';

import {
  buildMainWindowLiteActions,
  getMainWindowHomeCopy,
  shouldShowComposerOnMainWindowHome,
} from './mainWindowLiteNav';

describe('main window lite navigation', () => {
  it('positions the main window as an AI-first chat camp instead of an AI-looking task dashboard', () => {
    const copy = getMainWindowHomeCopy();

    expect(copy.title).toBe('Alkaka 对话营地');
    expect(copy.subtitle).toContain('AI 伙伴');
    expect(copy.subtitle).toContain('项目组');
    expect(copy.hint).toContain('单聊');
    expect(copy.hint).toContain('项目组');
    expect(copy.subtitle).not.toContain('AI 桌宠');
    expect(copy.subtitle).not.toContain('任务桌宠');
    expect(copy.subtitle).not.toContain('任务历史');
  });

  it('keeps conversation entry first and moves history search into records instead of a top-level task action', () => {
    const actions = buildMainWindowLiteActions({ canResumeSession: true });

    expect(actions.map(action => action.id)).toEqual([
      'resume-current-task',
      'new-complex-task',
      'open-settings',
      'manage-skills',
    ]);
    expect(actions[0]).toMatchObject({ label: '回到刚才的对话', tone: 'primary' });
    expect(actions.find(action => action.id === 'new-complex-task')).toMatchObject({ label: '新建对话', tone: 'secondary' });
    expect(actions.map(action => action.label)).not.toContain('搜索任务');
    expect(actions.map(action => action.label)).not.toContain('任务历史');
  });

  it('does not show a fake resume action when no openable session exists', () => {
    const actions = buildMainWindowLiteActions({ canResumeSession: false });

    expect(actions.map(action => action.id)).toEqual([
      'new-complex-task',
      'open-settings',
      'manage-skills',
    ]);
  });

  it('keeps the full composer collapsed by default unless explicitly requested', () => {
    expect(shouldShowComposerOnMainWindowHome({ requestedComposer: false, hasDraftPrompt: false })).toBe(false);
    expect(shouldShowComposerOnMainWindowHome({ requestedComposer: true, hasDraftPrompt: false })).toBe(true);
    expect(shouldShowComposerOnMainWindowHome({ requestedComposer: false, hasDraftPrompt: true })).toBe(true);
  });
});
