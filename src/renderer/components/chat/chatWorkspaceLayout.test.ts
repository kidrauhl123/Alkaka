import { describe, expect, it } from 'vitest';

import { resolveChatWorkspaceLayout } from './chatWorkspaceLayout';

describe('chat workspace layout decisions', () => {
  it('keeps ordinary one-on-one chats lightweight with the workbench collapsed by default', () => {
    expect(resolveChatWorkspaceLayout({ mode: 'direct' })).toEqual({
      leftNav: 'visible',
      workbench: 'collapsed',
    });
  });

  it('allows project groups to expand the workbench', () => {
    expect(resolveChatWorkspaceLayout({ mode: 'projectGroup' })).toEqual({
      leftNav: 'visible',
      workbench: 'expanded',
    });
  });

  it('allows deep processing sessions to expand the workbench even outside project groups', () => {
    expect(resolveChatWorkspaceLayout({ mode: 'direct', isDeepProcessing: true })).toEqual({
      leftNav: 'visible',
      workbench: 'expanded',
    });
  });

  it('respects an explicit workbench collapse override for lightweight project group moments', () => {
    expect(resolveChatWorkspaceLayout({ mode: 'projectGroup', workbenchPreference: 'collapsed' })).toEqual({
      leftNav: 'visible',
      workbench: 'collapsed',
    });
  });
});
