import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import AlkakaProjectChatHome, {
  buildProjectGroupPreview,
  buildProjectMessageTimeline,
  buildProjectWorkbenchStats,
  buildRecentConversationItems,
  resolveChatResponsiveLayout,
  resolveComposerSubmitMessage,
  shouldClearComposerAfterSubmit,
} from './AlkakaProjectChatHome';

import type { CoworkMessage, CoworkSession, CoworkSessionSummary, OpenClawEngineStatus } from '../../types/cowork';

describe('AlkakaProjectChatHome reference-image redesign', () => {
  const html = renderToStaticMarkup(React.createElement(AlkakaProjectChatHome));

  it('renders a three-column Alkaka Chat shell instead of the old cowork landing card', () => {
    expect(html).toContain('alkaka-project-chat-shell');
    expect(html).toContain('alkaka-left-sidebar');
    expect(html).toContain('alkaka-main-chat');
    expect(html).toContain('alkaka-right-dashboard');
    expect(html).toContain('Alkaka Chat');
    expect(html).not.toContain('Alkaka 对话营地');
  });

  it('matches the reference image information architecture', () => {
    [
      '新建对话',
      '搜索对话或消息',
      '对话',
      '任务中心',
      '项目空间',
      '最近对话',
      '暂无真实 Cowork 会话',
      'Boss（你）',
    ].forEach((copy) => expect(html).toContain(copy));
  });

  it('renders a real empty home state instead of fake project groups or fake agents', () => {
    [
      '暂无真实 Cowork 会话',
      '发送第一条消息会创建真实 Cowork/OpenClaw 会话',
      '向 Alkaka 发送第一条消息',
      '向 Alkaka 发送消息，创建或继续真实 Cowork 会话',
      '还没有真实对话',
      '点击新建对话，或在下方发送第一条消息创建真实 Cowork/OpenClaw 会话。',
    ].forEach((copy) => expect(html).toContain(copy));
    [
      'AI日报项目组',
      'Boss 置顶了任务：生成今日 AI 行业日报',
      '课代表总结（已理解）',
      '任务拆解与分配',
      '思考过程（已折叠）',
      '执行代码（已折叠）',
      'analysis/report_generator.py',
      '小课代表',
      '情报姬',
      'CodeMan',
      '设计喵',
      '大监',
      '项目管理',
    ].forEach((copy) => expect(html).not.toContain(copy));
  });

  it('renders the right-side dashboard with real Cowork/OpenClaw state instead of fake usage metrics', () => {
    [
      'Cowork 运行状态',
      '状态未知',
      '活跃会话',
      '真实链路状态',
      '全部会话',
      '运行中',
      '最近真实会话',
      '真实能力入口',
    ].forEach((copy) => expect(html).toContain(copy));
    ['资源使用情况', 'Token 用量', '费用预估', 'API 调用', '快捷操作'].forEach((copy) => expect(html).not.toContain(copy));
  });

  it('uses the pale lavender and purple visual system instead of old neutral cards', () => {
    expect(html).toContain('from-[#3B5BFF]');
    expect(html).toContain('to-[#7C3AED]');
    expect(html).toContain('bg-[#F7F8FC]');
    expect(html).toContain('border-[#E6E9F2]');
    expect(html).toContain('rounded-[22px]');
  });

  it('surfaces an existing home draft in the composer rather than only a fake placeholder', () => {
    const draftHtml = renderToStaticMarkup(React.createElement(AlkakaProjectChatHome, { composerValue: '请整理今天模型融资新闻' }));

    expect(draftHtml).toContain('请整理今天模型融资新闻');
  });

  it('submits trimmed user draft text and refuses empty whitespace submissions', () => {
    expect(resolveComposerSubmitMessage('  请整理今天模型融资新闻  ')).toBe('请整理今天模型融资新闻');
    expect(resolveComposerSubmitMessage('   ')).toBeNull();
  });

  it('does not render built-in fake partner assets when no real Cowork data exists', () => {
    [
      '小课代表 伙伴头像',
      '情报姬 伙伴头像',
      'CodeMan 伙伴头像',
      '设计喵 伙伴头像',
      '数据君 伙伴头像',
      '审核官 伙伴头像',
      '搜索对话、智能体或消息',
      '搜索对话、伙伴或消息',
    ].forEach((copy) => expect(html).not.toContain(copy));
    expect(html).toContain('搜索对话或消息');
  });

  it('maps real Cowork session summaries into recent conversations and returns empty when none exist', () => {
    const sessions: CoworkSessionSummary[] = [
      {
        id: 's1',
        title: '真实项目会话',
        status: 'running',
        pinned: true,
        createdAt: 1_714_541_100_000,
        updatedAt: 1_714_541_234_000,
      },
      {
        id: 's2',
        title: 'CodeMan 修 bug',
        status: 'completed',
        pinned: false,
        createdAt: 1_714_450_000_000,
        updatedAt: 1_714_450_500_000,
      },
    ];

    const items = buildRecentConversationItems({ sessions, unreadSessionIds: ['s2'], currentSessionId: 's1', now: 1_714_541_300_000 });

    expect(items[0]).toMatchObject({
      id: 's1',
      title: '真实项目会话',
      preview: '运行中 · 最近更新',
      selected: true,
      pin: true,
      unread: undefined,
    });
    expect(items[1]).toMatchObject({
      id: 's2',
      title: 'CodeMan 修 bug',
      preview: '已完成 · 最近更新',
      unread: '1',
    });
    expect(items.map((item) => item.title)).not.toContain('AI日报项目组');
  });

  it('renders real Cowork sessions in the recent conversation rail when provided', () => {
    const sessionHtml = renderToStaticMarkup(React.createElement(AlkakaProjectChatHome, {
      recentSessions: [
        {
          id: 'real-session',
          title: '真实 OpenClaw 会话',
          status: 'running',
          pinned: false,
          createdAt: 1_714_541_100_000,
          updatedAt: 1_714_541_234_000,
        },
      ],
      now: 1_714_541_300_000,
      onOpenConversation: () => undefined,
    }));

    expect(sessionHtml).toContain('真实 OpenClaw 会话');
    expect(sessionHtml).toContain('运行中 · 最近更新');
    expect(sessionHtml).toContain('aria-label="打开对话：真实 OpenClaw 会话"');
    expect(sessionHtml).not.toContain('小课代表：已整理今日AI行业日报初稿');
  });

  it('builds the main chat project preview from real Cowork sessions when available', () => {
    const sessions: CoworkSessionSummary[] = [
      {
        id: 'older',
        title: '旧项目会话',
        status: 'completed',
        pinned: false,
        createdAt: 1_714_440_000_000,
        updatedAt: 1_714_440_100_000,
      },
      {
        id: 'live',
        title: '真实 OpenClaw 项目组',
        status: 'running',
        pinned: true,
        createdAt: 1_714_541_100_000,
        updatedAt: 1_714_541_234_000,
      },
    ];

    expect(buildProjectGroupPreview({ sessions, currentSessionId: 'missing', now: 1_714_541_300_000 })).toMatchObject({
      isDemo: false,
      title: '真实 OpenClaw 项目组',
      subtitle: 'OpenClaw 会话预览 · 创建于 2024-05-01',
      pinnedSubject: '真实 OpenClaw 项目组',
      pinnedGoal: '运行中 · 最近更新于 1分钟前',
      statusCopy: '运行中',
    });
  });

  it('renders the main chat area from a real Cowork session preview when sessions exist', () => {
    const sessionHtml = renderToStaticMarkup(React.createElement(AlkakaProjectChatHome, {
      recentSessions: [
        {
          id: 'real-main-session',
          title: '真实中间会话',
          status: 'running',
          pinned: false,
          createdAt: 1_714_541_100_000,
          updatedAt: 1_714_541_234_000,
        },
      ],
      now: 1_714_541_300_000,
    }));

    expect(sessionHtml).toContain('真实中间会话');
    expect(sessionHtml).toContain('OpenClaw 会话预览');
    expect(sessionHtml).toContain('Boss 置顶了对话：真实中间会话');
    expect(sessionHtml).toContain('运行中 · 最近更新于 1分钟前');
    expect(sessionHtml).not.toContain('Boss 置顶了任务：生成今日 AI 行业日报');
  });

  it('maps real Cowork messages into the project timeline instead of demo operational cards', () => {
    const messages: CoworkMessage[] = [
      { id: 'u1', type: 'user', content: '真正跑一下 Alkaka 链路', timestamp: 1_714_541_100_000 },
      { id: 'a1', type: 'assistant', content: '我已开始调用 OpenClaw。', timestamp: 1_714_541_120_000 },
      { id: 't1', type: 'tool_use', content: '', timestamp: 1_714_541_130_000, metadata: { toolName: 'terminal', toolInput: { command: 'npm test' } } },
      { id: 'r1', type: 'tool_result', content: '5 tests passed', timestamp: 1_714_541_140_000, metadata: { toolName: 'terminal' } },
    ];

    expect(buildProjectMessageTimeline({ messages })).toMatchObject([
      { id: 'u1', speaker: 'Boss（你）', body: '真正跑一下 Alkaka 链路', kind: 'user' },
      { id: 'a1', speaker: 'Alkaka', body: '我已开始调用 OpenClaw。', kind: 'assistant' },
      { id: 't1', speaker: 'OpenClaw 工具', title: '调用工具：terminal', body: '{\n  "command": "npm test"\n}', kind: 'tool_use' },
      { id: 'r1', speaker: 'OpenClaw 结果', title: '工具结果：terminal', body: '5 tests passed', kind: 'tool_result' },
    ]);
  });

  it('bounds long real OpenClaw outputs in the chat timeline while preserving session data', () => {
    const longOutput = 'x'.repeat(4_500);
    const timeline = buildProjectMessageTimeline({
      messages: [{ id: 'huge-tool-result', type: 'tool_result', content: longOutput, timestamp: 1_714_541_140_000, metadata: { toolName: 'terminal' } }],
    });

    expect(timeline).toHaveLength(1);
    expect(timeline[0].body.length).toBeLessThan(longOutput.length);
    expect(timeline[0].bodyTruncated).toBe(true);
    expect(timeline[0].body).toContain('已截断 500 个字符');
  });

  it('keeps only the latest real messages in the main chat timeline to avoid freezing on large sessions', () => {
    const messages: CoworkMessage[] = Array.from({ length: 130 }, (_, index) => ({
      id: `m${index}`,
      type: 'assistant',
      content: `真实消息 ${index}`,
      timestamp: 1_714_541_140_000 + index,
    }));

    const timeline = buildProjectMessageTimeline({ messages });

    expect(timeline).toHaveLength(120);
    expect(timeline[0].id).toBe('m10');
    expect(timeline[timeline.length - 1]?.id).toBe('m129');
  });

  it('renders real current Cowork session messages and removes fake AI daily cards', () => {
    const currentSession: CoworkSession = {
      id: 'real-current',
      title: '真实前后端一体化会话',
      claudeSessionId: null,
      status: 'running',
      pinned: false,
      cwd: '/Users/zuiyou/github/Alkaka',
      systemPrompt: '',
      modelOverride: '',
      executionMode: 'local',
      activeSkillIds: ['desktop-app-engineering'],
      agentId: 'main',
      createdAt: 1_714_541_000_000,
      updatedAt: 1_714_541_200_000,
      messages: [
        { id: 'u1', type: 'user', content: '不要假的，接真实链路', timestamp: 1_714_541_100_000 },
        { id: 'a1', type: 'assistant', content: '收到，我会通过真实 Cowork/OpenClaw 链路推进。', timestamp: 1_714_541_120_000 },
        { id: 't1', type: 'tool_use', content: '', timestamp: 1_714_541_130_000, metadata: { toolName: 'terminal', toolInput: { command: 'npm run build' } } },
      ],
    };

    const sessionHtml = renderToStaticMarkup(React.createElement(AlkakaProjectChatHome, {
      currentSession,
      recentSessions: [{ id: currentSession.id, title: currentSession.title, status: currentSession.status, pinned: false, createdAt: currentSession.createdAt, updatedAt: currentSession.updatedAt }],
      currentSessionId: currentSession.id,
    }));

    expect(sessionHtml).toContain('真实前后端一体化会话');
    expect(sessionHtml).toContain('不要假的，接真实链路');
    expect(sessionHtml).toContain('收到，我会通过真实 Cowork/OpenClaw 链路推进。');
    expect(sessionHtml).toContain('调用工具：terminal');
    expect(sessionHtml).toContain('npm run build');
    expect(sessionHtml).not.toContain('课代表总结（已理解）');
    expect(sessionHtml).not.toContain('任务拆解与分配');
    expect(sessionHtml).not.toContain('analysis/report_generator.py');
  });

  it('renders a real empty current session as an empty state instead of demo AI daily cards', () => {
    const currentSession: CoworkSession = {
      id: 'empty-current',
      title: '真实空会话',
      claudeSessionId: null,
      status: 'idle',
      pinned: false,
      cwd: '/Users/zuiyou/github/Alkaka',
      systemPrompt: '',
      modelOverride: '',
      executionMode: 'local',
      activeSkillIds: [],
      agentId: 'main',
      createdAt: 1_714_541_000_000,
      updatedAt: 1_714_541_200_000,
      messages: [],
    };

    const sessionHtml = renderToStaticMarkup(React.createElement(AlkakaProjectChatHome, {
      currentSession,
      recentSessions: [{ id: currentSession.id, title: currentSession.title, status: currentSession.status, pinned: false, createdAt: currentSession.createdAt, updatedAt: currentSession.updatedAt }],
      currentSessionId: currentSession.id,
    }));

    expect(sessionHtml).toContain('真实空会话');
    expect(sessionHtml).toContain('这个真实 Cowork 会话还没有消息');
    expect(sessionHtml).not.toContain('课代表总结（已理解）');
    expect(sessionHtml).not.toContain('analysis/report_generator.py');
  });

  it('keeps real session management controls in the Alkaka Chat shell for running Cowork sessions', () => {
    const currentSession: CoworkSession = {
      id: 'running-current',
      title: '可停止的真实会话',
      claudeSessionId: null,
      status: 'running',
      pinned: false,
      cwd: '/Users/zuiyou/github/Alkaka',
      systemPrompt: '',
      modelOverride: '',
      executionMode: 'local',
      activeSkillIds: [],
      agentId: 'main',
      createdAt: 1_714_541_000_000,
      updatedAt: 1_714_541_200_000,
      messages: [],
    };

    const sessionHtml = renderToStaticMarkup(React.createElement(AlkakaProjectChatHome, {
      currentSession,
      recentSessions: [{ id: currentSession.id, title: currentSession.title, status: currentSession.status, pinned: false, createdAt: currentSession.createdAt, updatedAt: currentSession.updatedAt }],
      currentSessionId: currentSession.id,
      onStopCurrentSession: () => undefined,
      onDeleteCurrentSession: () => undefined,
      onToggleCurrentSessionPin: () => undefined,
      onRenameCurrentSession: () => undefined,
    }));

    expect(sessionHtml).toContain('停止会话');
    expect(sessionHtml).toContain('aria-label="停止当前真实 Cowork 会话"');
    expect(sessionHtml).toContain('置顶');
    expect(sessionHtml).toContain('重命名');
    expect(sessionHtml).toContain('删除');
  });

  it('builds the right workbench from real sessions and OpenClaw status instead of fixed fake metrics', () => {
    const sessions: CoworkSessionSummary[] = [
      { id: 'a', title: '正在处理的真实会话', status: 'running', pinned: false, createdAt: 1, updatedAt: 10 },
      { id: 'b', title: '失败的真实会话', status: 'error', pinned: false, createdAt: 1, updatedAt: 9 },
      { id: 'c', title: '完成的真实会话', status: 'completed', pinned: false, createdAt: 1, updatedAt: 8 },
    ];
    const openClawStatus: OpenClawEngineStatus = { phase: 'running', version: '0.1.0', canRetry: false, message: 'gateway live' };

    expect(buildProjectWorkbenchStats({ sessions, currentSessionId: 'a', openClawStatus })).toMatchObject({
      activeSessions: 1,
      totalSessions: 3,
      currentStatusCopy: '运行中',
      engineCopy: 'OpenClaw running',
      engineStatusCopy: '需要处理',
      engineStatusTone: 'orange',
      latestSessionTitle: '正在处理的真实会话',
      errorSessions: 1,
    });
  });

  it('does not mark OpenClaw as online while it is installing, starting, or missing', () => {
    expect(buildProjectWorkbenchStats({ openClawStatus: { phase: 'starting', version: null, canRetry: false } })).toMatchObject({
      engineCopy: 'OpenClaw starting',
      engineStatusCopy: '启动中',
      engineStatusTone: 'gray',
    });
    expect(buildProjectWorkbenchStats({ openClawStatus: { phase: 'installing', version: null, canRetry: false } })).toMatchObject({
      engineStatusCopy: '安装中',
      engineStatusTone: 'gray',
    });
    expect(buildProjectWorkbenchStats({ openClawStatus: { phase: 'not_installed', version: null, canRetry: true } })).toMatchObject({
      engineStatusCopy: '未安装',
      engineStatusTone: 'orange',
    });
  });

  it('keeps the responsive shell usable across small, medium, and wide window widths', () => {
    expect(resolveChatResponsiveLayout(900)).toEqual({ leftRail: 'compact', rightPanel: 'drawer', mainPriority: 'primary', supportsResize: false });
    expect(resolveChatResponsiveLayout(1180)).toEqual({ leftRail: 'expanded', rightPanel: 'drawer', mainPriority: 'primary', supportsResize: true });
    expect(resolveChatResponsiveLayout(1360)).toEqual({ leftRail: 'expanded', rightPanel: 'docked', mainPriority: 'balanced', supportsResize: true });

    expect(html).toContain('lg:w-[var(--alkaka-left-width)]');
    expect(html).toContain('w-[76px]');
    expect(html).toContain('w-[var(--alkaka-right-width)]');
    expect(html).toContain('aria-label="拖动调整左侧栏宽度"');
    expect(html).toContain('aria-label="拖动调整右侧工作台宽度"');
    expect(html).toContain('aria-label="折叠右侧工作台"');
    expect(html).toContain('xl:flex');
    expect(html).toContain('xl:hidden');
    expect(html).toContain('aria-label="打开最近对话"');
    expect(html).toContain('lg:hidden');
    expect(html).toContain('overflow-x-hidden');
    expect(html).toContain('flex-wrap');
  });

  it('keeps drafts when submission is rejected and clears only after accepted submit results', () => {
    expect(shouldClearComposerAfterSubmit(false)).toBe(false);
    expect(shouldClearComposerAfterSubmit(undefined)).toBe(true);
    expect(shouldClearComposerAfterSubmit(true)).toBe(true);
  });
});
