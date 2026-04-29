export type ChatWorkspaceMode = 'direct' | 'projectGroup';
export type ChatWorkspaceWorkbenchState = 'collapsed' | 'expanded';
export type ChatWorkspaceSlotVisibility = 'visible';

export interface ChatWorkspaceLayoutInput {
  mode: ChatWorkspaceMode;
  isDeepProcessing?: boolean;
  workbenchPreference?: ChatWorkspaceWorkbenchState;
}

export interface ChatWorkspaceLayoutDecision {
  leftNav: ChatWorkspaceSlotVisibility;
  workbench: ChatWorkspaceWorkbenchState;
}

export function resolveChatWorkspaceLayout(input: ChatWorkspaceLayoutInput): ChatWorkspaceLayoutDecision {
  if (input.workbenchPreference) {
    return {
      leftNav: 'visible',
      workbench: input.workbenchPreference,
    };
  }

  const shouldExpandWorkbench = input.mode === 'projectGroup' || input.isDeepProcessing === true;

  return {
    leftNav: 'visible',
    workbench: shouldExpandWorkbench ? 'expanded' : 'collapsed',
  };
}
