export type MainWindowLiteActionId =
  | 'resume-current-task'
  | 'search-history'
  | 'open-settings'
  | 'new-complex-task'
  | 'manage-skills';

export type MainWindowLiteActionTone = 'primary' | 'secondary' | 'ghost';

export interface MainWindowLiteAction {
  id: MainWindowLiteActionId;
  label: string;
  description: string;
  tone: MainWindowLiteActionTone;
}

export interface BuildMainWindowLiteActionsOptions {
  canResumeSession: boolean;
}

export interface MainWindowHomeCopy {
  title: string;
  subtitle: string;
  hint: string;
}

export interface ShouldShowComposerOptions {
  requestedComposer: boolean;
  hasDraftPrompt: boolean;
}

export const getMainWindowHomeCopy = (): MainWindowHomeCopy => ({
  title: '主窗口',
  subtitle: '桌宠负责日常输入和状态反馈；这里作为任务历史、详情和设置的轻量辅助面板。',
  hint: '需要更长上下文或复杂 Cowork 时，再从这里展开完整输入区。',
});

export const buildMainWindowLiteActions = ({ canResumeSession }: BuildMainWindowLiteActionsOptions): MainWindowLiteAction[] => {
  const actions: MainWindowLiteAction[] = [];

  if (canResumeSession) {
    actions.push({
      id: 'resume-current-task',
      label: '回到当前任务',
      description: '继续查看刚才打开的 Cowork 详情',
      tone: 'primary',
    });
  }

  actions.push(
    {
      id: 'search-history',
      label: '任务历史',
      description: '搜索或打开最近的 Cowork 记录',
      tone: canResumeSession ? 'secondary' : 'primary',
    },
    {
      id: 'open-settings',
      label: '设置',
      description: '模型、OpenClaw、更新和偏好设置',
      tone: 'secondary',
    },
    {
      id: 'new-complex-task',
      label: '复杂 Cowork',
      description: '展开完整输入区，处理长上下文任务',
      tone: 'secondary',
    },
    {
      id: 'manage-skills',
      label: 'Skills / MCP',
      description: '管理技能和工具连接',
      tone: 'ghost',
    }
  );

  return actions;
};

export const shouldShowComposerOnMainWindowHome = ({
  requestedComposer,
  hasDraftPrompt,
}: ShouldShowComposerOptions): boolean => requestedComposer || hasDraftPrompt;
