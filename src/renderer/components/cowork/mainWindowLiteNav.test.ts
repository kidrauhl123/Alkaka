import { describe, expect, it } from 'vitest';

import {
  buildMainWindowLiteActions,
  getMainWindowHomeCopy,
  shouldShowComposerOnMainWindowHome,
} from './mainWindowLiteNav';

describe('main window lite navigation', () => {
  it('positions the main window as an auxiliary panel instead of the default daily entry', () => {
    const copy = getMainWindowHomeCopy();

    expect(copy.title).toBe('主窗口');
    expect(copy.subtitle).toContain('桌宠');
    expect(copy.subtitle).toContain('任务历史');
    expect(copy.subtitle).not.toContain('默认入口');
  });

  it('keeps task history and settings before heavyweight composition actions', () => {
    const actions = buildMainWindowLiteActions({ canResumeSession: true });

    expect(actions.map(action => action.id)).toEqual([
      'resume-current-task',
      'search-history',
      'open-settings',
      'new-complex-task',
      'manage-skills',
    ]);
    expect(actions[0]).toMatchObject({ tone: 'primary' });
    expect(actions.find(action => action.id === 'new-complex-task')).toMatchObject({ tone: 'secondary' });
  });

  it('does not show a fake resume action when no openable session exists', () => {
    const actions = buildMainWindowLiteActions({ canResumeSession: false });

    expect(actions.map(action => action.id)).toEqual([
      'search-history',
      'open-settings',
      'new-complex-task',
      'manage-skills',
    ]);
  });

  it('keeps the full composer collapsed by default unless explicitly requested', () => {
    expect(shouldShowComposerOnMainWindowHome({ requestedComposer: false, hasDraftPrompt: false })).toBe(false);
    expect(shouldShowComposerOnMainWindowHome({ requestedComposer: true, hasDraftPrompt: false })).toBe(true);
    expect(shouldShowComposerOnMainWindowHome({ requestedComposer: false, hasDraftPrompt: true })).toBe(true);
  });
});
