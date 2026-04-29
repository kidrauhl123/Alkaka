export type MainWindowLiteActionId =
  | 'resume-current-task'
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
  title: 'Alkaka 对话营地',
  subtitle: '和单个 AI 伙伴单聊，或回到项目组继续协作；桌宠仍常驻桌面旁边，负责陪伴、提醒和快速唤起。',
  hint: '默认保持轻量：单聊像聊天，项目组需要深度处理时再展开完整工作台。',
});

export const buildMainWindowLiteActions = ({ canResumeSession }: BuildMainWindowLiteActionsOptions): MainWindowLiteAction[] => {
  const actions: MainWindowLiteAction[] = [];

  if (canResumeSession) {
    actions.push({
      id: 'resume-current-task',
      label: '回到刚才的对话',
      description: '继续查看从桌宠打开的上下文和处理结果',
      tone: 'primary',
    });
  }

  actions.push(
    {
      id: 'new-complex-task',
      label: '新建对话',
      description: '打开完整输入区，长聊、追问或深度处理',
      tone: canResumeSession ? 'secondary' : 'primary',
    },
    {
      id: 'open-settings',
      label: '设置',
      description: '模型、OpenClaw、更新和偏好设置',
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
