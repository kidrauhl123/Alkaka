import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';

import type { CoworkMessage, CoworkSession, CoworkSessionSummary, CoworkSessionStatus, OpenClawEngineStatus } from '../../types/cowork';

interface AvatarProps {
  name: string;
  tone: string;
  imageSrc?: string;
  imageAlt?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-7 w-7 text-[11px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-11 w-11 text-sm',
};

const Avatar = ({ name, tone, imageSrc, imageAlt, size = 'md', className = '' }: AvatarProps) => (
  <div
    className={`${sizeClasses[size]} ${tone} ${className} relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white font-bold text-white shadow-sm`}
    title={name}
  >
    {imageSrc ? (
      <img src={imageSrc} alt={imageAlt ?? `${name} 伙伴头像`} className="h-full w-full object-cover" />
    ) : (
      <>
        <span className="relative z-10 drop-shadow-sm">{name.slice(0, 1)}</span>
        <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-white/35" />
        <span className="absolute -bottom-2 left-1 h-5 w-5 rounded-full bg-black/10" />
      </>
    )}
  </div>
);

const avatarTones = {
  boss: 'bg-gradient-to-br from-slate-700 via-indigo-600 to-violet-500',
  rep: 'bg-gradient-to-br from-amber-300 via-pink-400 to-violet-500',
  pm: 'bg-gradient-to-br from-orange-300 via-rose-400 to-fuchsia-500',
  intel: 'bg-gradient-to-br from-violet-700 via-purple-500 to-indigo-400',
  code: 'bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600',
  design: 'bg-gradient-to-br from-pink-400 via-fuchsia-500 to-purple-600',
  data: 'bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500',
  guard: 'bg-gradient-to-br from-red-400 via-orange-500 to-amber-500',
};

const getPartnerAvatar = (_name: string): Pick<AvatarProps, 'imageSrc' | 'imageAlt'> => ({});

const StatusPill = ({ children, tone = 'purple' }: { children: ReactNode; tone?: 'purple' | 'green' | 'orange' | 'gray' }) => {
  const toneClass = {
    purple: 'bg-[#EEF0FF] text-[#4F46E5]',
    green: 'bg-[#E8FFF5] text-[#059669]',
    orange: 'bg-[#FFF3E6] text-[#EA7A1A]',
    gray: 'bg-[#F3F4F6] text-[#6B7280]',
  }[tone];

  return <span className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${toneClass}`}>{children}</span>;
};

const SectionCard = ({ title, action, children, className = '' }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) => (
  <section className={`min-w-0 rounded-[22px] border border-[#E6E9F2] bg-white p-4 shadow-[0_18px_45px_rgba(71,85,105,0.07)] ${className}`}>
    <div className="mb-3 flex items-center justify-between gap-3">
      <h3 className="text-sm font-bold text-[#111827]">{title}</h3>
      {action}
    </div>
    {children}
  </section>
);

const ProgressBar = ({ value, tone = 'purple' }: { value: number; tone?: 'purple' | 'green' | 'orange' }) => {
  const bar = {
    purple: 'from-[#3B5BFF] to-[#7C3AED]',
    green: 'from-emerald-400 to-teal-500',
    orange: 'from-orange-400 to-amber-500',
  }[tone];

  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-[#EEF1F8]">
      <div className={`h-full rounded-full bg-gradient-to-r ${bar}`} style={{ width: `${value}%` }} />
    </div>
  );
};

const navItems = [
  ['💬', '对话', null, true],
  ['✅', '任务中心', null, false],
  ['🗂', '项目空间', null, false],
  ['📚', '知识库', null, false],
  ['📎', '文件', null, false],
  ['📅', '日历', null, false],
  ['⚙️', '设置', null, false],
] as const;

export interface RecentConversationItem {
  id: string;
  title: string;
  preview: string;
  time: string;
  tone: string;
  selected?: boolean;
  pin?: boolean;
  unread?: string;
}

const sessionStatusCopy: Record<CoworkSessionStatus, string> = {
  idle: '待启动',
  running: '运行中',
  completed: '已完成',
  error: '需要处理',
};

const formatRelativeSessionTime = (updatedAt: number, now = Date.now()): string => {
  const diffMs = Math.max(0, now - updatedAt);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return '刚刚';
  if (diffMs < hour) return `${Math.max(1, Math.floor(diffMs / minute))}分钟前`;
  if (diffMs < day) return `${Math.max(1, Math.floor(diffMs / hour))}小时前`;
  if (diffMs < 2 * day) return '昨天';
  return `${Math.floor(diffMs / day)}天前`;
};

const toneForSession = (session: CoworkSessionSummary): string => {
  if (session.status === 'running') return avatarTones.rep;
  if (session.status === 'completed') return avatarTones.data;
  if (session.status === 'error') return avatarTones.guard;
  return avatarTones.boss;
};

export const buildRecentConversationItems = ({
  sessions = [],
  unreadSessionIds = [],
  currentSessionId = null,
  now = Date.now(),
}: {
  sessions?: CoworkSessionSummary[];
  unreadSessionIds?: string[];
  currentSessionId?: string | null;
  now?: number;
} = {}): RecentConversationItem[] => {
  if (sessions.length === 0) return [];

  const unread = new Set(unreadSessionIds);
  return [...sessions]
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt)
    .slice(0, 8)
    .map((session) => ({
      id: session.id,
      title: session.title || '未命名对话',
      preview: `${sessionStatusCopy[session.status]} · 最近更新`,
      time: formatRelativeSessionTime(session.updatedAt, now),
      tone: toneForSession(session),
      selected: session.id === currentSessionId,
      pin: session.pinned,
      unread: unread.has(session.id) ? '1' : undefined,
    }));
};

export interface ProjectGroupPreview {
  isDemo: boolean;
  title: string;
  subtitle: string;
  pinnedSubject: string;
  pinnedGoal: string;
  statusCopy: string;
  starterMessage: string;
}

export interface ProjectTimelineItem {
  id: string;
  kind: CoworkMessage['type'];
  speaker: string;
  title?: string;
  body: string;
  bodyTruncated?: boolean;
  timestamp: number;
  statusTone: 'purple' | 'green' | 'orange' | 'gray';
  avatarTone: string;
}

const MAX_TIMELINE_ITEMS = 120;
const MAX_TIMELINE_BODY_CHARS = 4_000;

const truncateTimelineBody = (value: string): { body: string; bodyTruncated?: boolean } => {
  if (value.length <= MAX_TIMELINE_BODY_CHARS) return { body: value };
  return {
    body: `${value.slice(0, MAX_TIMELINE_BODY_CHARS)}\n\n…已截断 ${value.length - MAX_TIMELINE_BODY_CHARS} 个字符，完整内容仍保留在真实 Cowork session 中。`,
    bodyTruncated: true,
  };
};

const safeJson = (value: unknown): string => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

export const buildProjectMessageTimeline = ({
  messages = [],
}: {
  messages?: CoworkMessage[];
} = {}): ProjectTimelineItem[] => messages.slice(-MAX_TIMELINE_ITEMS).map((message) => {
  const toolName = typeof message.metadata?.toolName === 'string' ? message.metadata.toolName : 'tool';
  if (message.type === 'user') {
    return {
      id: message.id,
      kind: message.type,
      speaker: 'Boss（你）',
      ...truncateTimelineBody(message.content),
      timestamp: message.timestamp,
      statusTone: 'purple',
      avatarTone: avatarTones.boss,
    };
  }

  if (message.type === 'assistant') {
    return {
      id: message.id,
      kind: message.type,
      speaker: message.metadata?.isThinking ? 'Alkaka 思考' : 'Alkaka',
      title: message.metadata?.isThinking ? '思考过程（真实）' : undefined,
      ...truncateTimelineBody(message.content),
      timestamp: message.timestamp,
      statusTone: message.metadata?.isThinking ? 'gray' : 'green',
      avatarTone: avatarTones.rep,
    };
  }

  if (message.type === 'tool_use') {
    return {
      id: message.id,
      kind: message.type,
      speaker: 'OpenClaw 工具',
      title: `调用工具：${toolName}`,
      ...truncateTimelineBody(message.content || safeJson(message.metadata?.toolInput)),
      timestamp: message.timestamp,
      statusTone: 'orange',
      avatarTone: avatarTones.code,
    };
  }

  if (message.type === 'tool_result') {
    return {
      id: message.id,
      kind: message.type,
      speaker: 'OpenClaw 结果',
      title: `工具结果：${toolName}`,
      ...truncateTimelineBody(message.content || safeJson(message.metadata?.toolResult)),
      timestamp: message.timestamp,
      statusTone: message.metadata?.isError ? 'orange' : 'green',
      avatarTone: message.metadata?.isError ? avatarTones.guard : avatarTones.data,
    };
  }

  return {
    id: message.id,
    kind: message.type,
    speaker: '系统',
    title: message.metadata?.isError ? '系统错误' : '系统消息',
    ...truncateTimelineBody(message.content),
    timestamp: message.timestamp,
    statusTone: message.metadata?.isError ? 'orange' : 'gray',
    avatarTone: message.metadata?.isError ? avatarTones.guard : avatarTones.boss,
  };
});

export interface ProjectWorkbenchStats {
  activeSessions: number;
  totalSessions: number;
  completedSessions: number;
  errorSessions: number;
  currentStatusCopy: string;
  engineCopy: string;
  engineStatusCopy: string;
  engineStatusTone: 'green' | 'orange' | 'gray';
  latestSessionTitle: string;
  recentSessions: Array<{
    id: string;
    title: string;
    status: CoworkSessionStatus;
    statusCopy: string;
    updatedAt: number;
  }>;
}

export const buildProjectWorkbenchStats = ({
  sessions = [],
  currentSessionId = null,
  openClawStatus = null,
}: {
  sessions?: CoworkSessionSummary[];
  currentSessionId?: string | null;
  openClawStatus?: OpenClawEngineStatus | null;
} = {}): ProjectWorkbenchStats => {
  const sortedSessions = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);
  const currentSession = sessions.find((session) => session.id === currentSessionId) ?? sortedSessions[0];
  const activeSessions = sessions.filter((session) => session.status === 'running').length;
  const completedSessions = sessions.filter((session) => session.status === 'completed').length;
  const errorSessions = sessions.filter((session) => session.status === 'error').length;
  const enginePhase = openClawStatus?.phase ?? 'unknown';
  const hasEngineError = enginePhase === 'error' || errorSessions > 0;
  const engineStatusCopy = (() => {
    if (hasEngineError) return '需要处理';
    if (enginePhase === 'running') return '链路在线';
    if (enginePhase === 'ready') return '已就绪';
    if (enginePhase === 'starting') return '启动中';
    if (enginePhase === 'installing') return '安装中';
    if (enginePhase === 'not_installed') return '未安装';
    return '状态未知';
  })();
  const engineStatusTone = (() => {
    if (hasEngineError || enginePhase === 'not_installed') return 'orange';
    if (enginePhase === 'running' || enginePhase === 'ready') return 'green';
    return 'gray';
  })();

  return {
    activeSessions,
    totalSessions: sessions.length,
    completedSessions,
    errorSessions,
    currentStatusCopy: currentSession ? sessionStatusCopy[currentSession.status] : '无会话',
    engineCopy: openClawStatus ? `OpenClaw ${enginePhase}` : 'OpenClaw 状态未知',
    engineStatusCopy,
    engineStatusTone,
    latestSessionTitle: currentSession?.title || '暂无真实会话',
    recentSessions: sortedSessions.slice(0, 6).map((session) => ({
      id: session.id,
      title: session.title || '未命名会话',
      status: session.status,
      statusCopy: sessionStatusCopy[session.status],
      updatedAt: session.updatedAt,
    })),
  };
};

export interface ChatResponsiveLayout {
  leftRail: 'compact' | 'expanded';
  rightPanel: 'drawer' | 'docked';
  mainPriority: 'primary' | 'balanced';
  supportsResize: boolean;
}

export const resolveChatResponsiveLayout = (windowWidth: number): ChatResponsiveLayout => {
  if (windowWidth >= 1280) {
    return { leftRail: 'expanded', rightPanel: 'docked', mainPriority: 'balanced', supportsResize: true };
  }

  if (windowWidth >= 1024) {
    return { leftRail: 'expanded', rightPanel: 'drawer', mainPriority: 'primary', supportsResize: true };
  }

  return { leftRail: 'compact', rightPanel: 'drawer', mainPriority: 'primary', supportsResize: false };
};

const formatTimelineTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const formatSessionDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const buildProjectGroupPreview = ({
  sessions = [],
  currentSessionId = null,
  now = Date.now(),
}: {
  sessions?: CoworkSessionSummary[];
  currentSessionId?: string | null;
  now?: number;
} = {}): ProjectGroupPreview => {
  if (sessions.length === 0) {
    return {
      isDemo: false,
      title: '暂无真实 Cowork 会话',
      subtitle: '空白工作区 · 尚未创建任何真实会话',
      pinnedSubject: '还没有真实 Cowork 会话',
      pinnedGoal: '发送第一条消息会创建真实 Cowork/OpenClaw 会话',
      statusCopy: '空白',
      starterMessage: '',
    };
  }

  const sortedSessions = [...sessions].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt);
  const featuredSession = sortedSessions.find((session) => session.id === currentSessionId) ?? sortedSessions[0];
  const statusCopy = sessionStatusCopy[featuredSession.status];
  const relativeUpdatedAt = formatRelativeSessionTime(featuredSession.updatedAt, now);

  return {
    isDemo: false,
    title: featuredSession.title || '未命名项目组',
    subtitle: `OpenClaw 会话预览 · 创建于 ${formatSessionDate(featuredSession.createdAt)}`,
    pinnedSubject: featuredSession.title || '未命名项目组',
    pinnedGoal: `${statusCopy} · 最近更新于 ${relativeUpdatedAt}`,
    statusCopy,
    starterMessage: `各位，继续推进「${featuredSession.title || '未命名项目组'}」。请基于已有 Cowork 会话上下文同步最新进展。`,
  };
};

const LEFT_RAIL_COLLAPSED_WIDTH = 76;
const LEFT_RAIL_DEFAULT_WIDTH = 280;
const LEFT_RAIL_MIN_WIDTH = 232;
const LEFT_RAIL_MAX_WIDTH = 360;
const RIGHT_DASHBOARD_COLLAPSED_WIDTH = 56;
const RIGHT_DASHBOARD_DEFAULT_WIDTH = 342;
const RIGHT_DASHBOARD_MIN_WIDTH = 300;
const RIGHT_DASHBOARD_MAX_WIDTH = 460;

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

type SubmitResult = boolean | void;

export interface AlkakaProjectChatHomeProps {
  composerValue?: string;
  onComposerChange?: (value: string) => void;
  onSubmitMessage?: (message: string) => SubmitResult | Promise<SubmitResult>;
  onRequestNewChat?: () => void;
  onOpenConversation?: (sessionId: string) => unknown | Promise<unknown>;
  onStopCurrentSession?: () => unknown | Promise<unknown>;
  onDeleteCurrentSession?: () => unknown | Promise<unknown>;
  onToggleCurrentSessionPin?: () => unknown | Promise<unknown>;
  onRenameCurrentSession?: () => unknown | Promise<unknown>;
  shouldFocusComposer?: boolean;
  recentSessions?: CoworkSessionSummary[];
  unreadSessionIds?: string[];
  currentSessionId?: string | null;
  currentSession?: CoworkSession | null;
  openClawStatus?: OpenClawEngineStatus | null;
  now?: number;
}

export const resolveComposerSubmitMessage = (value: string): string | null => {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

export const shouldClearComposerAfterSubmit = (result: SubmitResult): boolean => result !== false;


const RightDashboardContent = ({ stats }: { stats: ProjectWorkbenchStats }) => (
  <>
    <SectionCard title="Cowork 运行状态" action={<StatusPill tone={stats.engineStatusTone}>{stats.engineStatusCopy}</StatusPill>}>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-[#F8FAFF] p-3"><div className="text-xs text-[#6B7280]">活跃会话</div><div className="mt-1 text-2xl font-black">{stats.activeSessions} / {stats.totalSessions}</div><div className="text-xs text-[#9CA3AF]">{stats.currentStatusCopy} · {stats.latestSessionTitle}</div><div className="mt-3 text-xs text-[#9CA3AF]">无真实会话时不预置任何伙伴或智能体</div></div>
        <div className="rounded-2xl bg-[#F8FAFF] p-3"><div className="text-xs text-[#6B7280]">OpenClaw</div><div className="mt-1 text-lg font-black">{stats.engineCopy}</div><div className="text-xs text-[#9CA3AF]">完成 {stats.completedSessions} · 异常 {stats.errorSessions}</div></div>
      </div>
    </SectionCard>

    <SectionCard title="真实链路状态" action={<span className="rounded-full border border-[#E6E9F2] px-2 py-1 text-xs text-[#6B7280]">Cowork</span>}>
      <div className="space-y-3">
        {[
          ['全部会话', `${stats.totalSessions}`, stats.totalSessions > 0 ? 100 : 0],
          ['运行中', `${stats.activeSessions}`, stats.totalSessions > 0 ? (stats.activeSessions / stats.totalSessions) * 100 : 0],
          ['已完成', `${stats.completedSessions}`, stats.totalSessions > 0 ? (stats.completedSessions / stats.totalSessions) * 100 : 0],
          ['异常', `${stats.errorSessions}`, stats.totalSessions > 0 ? (stats.errorSessions / stats.totalSessions) * 100 : 0],
        ].map(([label, value, n]) => (
          <div key={label as string}>
            <div className="mb-1 flex justify-between gap-2 text-xs"><span className="text-[#6B7280]">{label}</span><span className="min-w-0 truncate font-bold text-[#111827]">{value}</span></div>
            <ProgressBar value={Number(n)} tone={label === '异常' ? 'orange' : 'purple'} />
          </div>
        ))}
        <div className="pt-1 text-xs font-semibold text-[#5B4BFF]">{stats.engineCopy}</div>
      </div>
    </SectionCard>

    <SectionCard title="最近真实会话" action={<span className="text-xs font-semibold text-[#5B4BFF]">SQLite</span>}>
      <div className="space-y-3">
        {stats.recentSessions.length > 0 ? stats.recentSessions.map((session) => (
          <div key={session.id} className="flex min-w-0 gap-2 rounded-2xl bg-[#F8FAFF] p-2.5">
            <Avatar name={session.title} tone={toneForSession({ id: session.id, title: session.title, status: session.status, pinned: false, createdAt: session.updatedAt, updatedAt: session.updatedAt })} size="sm" {...getPartnerAvatar(session.title)} />
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2"><span className="min-w-0 truncate text-xs font-bold">{session.title}</span><StatusPill tone="gray">{session.statusCopy}</StatusPill></div>
              <div className="mt-0.5 truncate text-[11px] text-[#6B7280]">真实 Cowork session · {formatRelativeSessionTime(session.updatedAt)}</div>
            </div>
          </div>
        )) : (
          <div className="rounded-2xl bg-[#F8FAFF] p-3 text-sm text-[#6B7280]">暂无真实 Cowork 会话；发送第一条消息后这里会显示 SQLite 中的真实 session。</div>
        )}
      </div>
    </SectionCard>

    <SectionCard title="真实能力入口">
      <div className="space-y-2 text-sm text-[#6B7280]">
        <div className="rounded-xl border border-[#E6E9F2] bg-[#F8FAFF] px-3 py-3">继续当前会话：底部输入框调用 Cowork/OpenClaw continueSession</div>
        <div className="rounded-xl border border-[#E6E9F2] bg-[#F8FAFF] px-3 py-3">切换会话：左侧真实 session 行调用 coworkService.loadSession</div>
        <div className="rounded-xl border border-[#E6E9F2] bg-[#F8FAFF] px-3 py-3">桌宠状态：主进程从真实 Cowork session 状态推导</div>
      </div>
    </SectionCard>
  </>
);

const AlkakaProjectChatHome = ({
  composerValue = '',
  onComposerChange,
  onSubmitMessage,
  onRequestNewChat,
  onOpenConversation,
  onStopCurrentSession,
  onDeleteCurrentSession,
  onToggleCurrentSessionPin,
  onRenameCurrentSession,
  shouldFocusComposer = false,
  recentSessions = [],
  unreadSessionIds = [],
  currentSessionId = null,
  currentSession = null,
  openClawStatus = null,
  now,
}: AlkakaProjectChatHomeProps) => {
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const resizeCleanupRef = useRef<(() => void) | null>(null);
  const [isWorkbenchOpen, setIsWorkbenchOpen] = useState(false);
  const [isConversationDrawerOpen, setIsConversationDrawerOpen] = useState(false);
  const [isLeftRailCollapsed, setIsLeftRailCollapsed] = useState(false);
  const [leftRailWidth, setLeftRailWidth] = useState(LEFT_RAIL_DEFAULT_WIDTH);
  const [isRightDashboardCollapsed, setIsRightDashboardCollapsed] = useState(false);
  const [rightDashboardWidth, setRightDashboardWidth] = useState(RIGHT_DASHBOARD_DEFAULT_WIDTH);
  const recentConversations = buildRecentConversationItems({ sessions: recentSessions, unreadSessionIds, currentSessionId, now });
  const projectPreview = buildProjectGroupPreview({ sessions: recentSessions, currentSessionId, now });
  const projectTimeline = buildProjectMessageTimeline({ messages: currentSession?.messages ?? [] });
  const hasRealTimeline = projectTimeline.length > 0;
  const hasOpenedRealSession = currentSession !== null;
  const workbenchStats = buildProjectWorkbenchStats({ sessions: recentSessions, currentSessionId, openClawStatus });

  useEffect(() => {
    if (shouldFocusComposer) {
      composerRef.current?.focus();
    }
  }, [shouldFocusComposer]);

  useEffect(() => () => {
    resizeCleanupRef.current?.();
  }, []);

  const beginPanelResize = useCallback((panel: 'left' | 'right', event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    resizeCleanupRef.current?.();
    const startX = event.clientX;
    const startWidth = panel === 'left' ? leftRailWidth : rightDashboardWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const delta = moveEvent.clientX - startX;
      if (panel === 'left') {
        setIsLeftRailCollapsed(false);
        setLeftRailWidth(clamp(startWidth + delta, LEFT_RAIL_MIN_WIDTH, LEFT_RAIL_MAX_WIDTH));
      } else {
        setIsRightDashboardCollapsed(false);
        setRightDashboardWidth(clamp(startWidth - delta, RIGHT_DASHBOARD_MIN_WIDTH, RIGHT_DASHBOARD_MAX_WIDTH));
      }
    };

    const cleanupResize = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', cleanupResize);
      window.removeEventListener('pointercancel', cleanupResize);
      resizeCleanupRef.current = null;
    };

    resizeCleanupRef.current = cleanupResize;
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', cleanupResize, { once: true });
    window.addEventListener('pointercancel', cleanupResize, { once: true });
  }, [leftRailWidth, rightDashboardWidth]);

  const handleSubmit = async () => {
    const message = resolveComposerSubmitMessage(composerValue);
    if (!message) return;

    const result = await onSubmitMessage?.(message);
    if (shouldClearComposerAfterSubmit(result)) {
      onComposerChange?.('');
    }
  };

  const handleOpenConversation = (sessionId: string) => {
    if (!onOpenConversation) return;
    setIsConversationDrawerOpen(false);
    void Promise.resolve(onOpenConversation(sessionId)).catch((error) => {
      console.error('[AlkakaProjectChatHome] Failed to open conversation:', error);
    });
  };

  const runCurrentSessionAction = (label: string, action?: () => unknown | Promise<unknown>) => {
    if (!action) return;
    void Promise.resolve(action()).catch((error) => {
      console.error(`[AlkakaProjectChatHome] Failed to ${label}:`, error);
    });
  };

  const hasCurrentSessionActions = Boolean(currentSession && (onStopCurrentSession || onDeleteCurrentSession || onToggleCurrentSessionPin || onRenameCurrentSession));

  const renderRecentConversationRows = () => {
    if (recentConversations.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-[#D8DBF6] bg-white/70 p-3 text-xs leading-5 text-[#6B7280]">
          <div className="font-bold text-[#4B5563]">还没有真实对话</div>
          <div className="mt-1">点击新建对话，或在下方发送第一条消息创建真实 Cowork/OpenClaw 会话。</div>
        </div>
      );
    }

    return recentConversations.map((chat) => {
      const content = (
        <>
          <Avatar name={chat.title} tone={chat.tone} {...getPartnerAvatar(chat.title)} />
          <div className="min-w-0 flex-1 text-left">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-bold">{chat.title}</span>
              <span className="ml-auto shrink-0 text-[11px] text-[#9CA3AF]">{chat.time}</span>
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-[#6B7280]">
              <span className="min-w-0 flex-1 truncate">{chat.preview}</span>
              {'pin' in chat && chat.pin ? <span className="text-[#7C3AED]">⌖</span> : null}
              {'unread' in chat && chat.unread ? <span className="rounded-full bg-[#5B4BFF] px-1.5 text-[10px] font-bold text-white">{chat.unread}</span> : null}
            </div>
          </div>
        </>
      );

      const rowClassName = `flex w-full gap-2 rounded-2xl p-2.5 ${chat.selected ? 'bg-[#F1EFFF] shadow-sm' : 'hover:bg-white'}`;
      return onOpenConversation ? (
        <button key={chat.id} type="button" aria-label={`打开对话：${chat.title}`} onClick={() => handleOpenConversation(chat.id)} className={rowClassName}>
          {content}
        </button>
      ) : (
        <div key={chat.id} className={rowClassName}>
          {content}
        </div>
      );
    });
  };

  return (
    <div className="alkaka-project-chat-shell flex h-full min-h-0 overflow-hidden bg-[#F7F8FC] text-[#111827]">
      <aside
        className="alkaka-left-sidebar relative flex w-[76px] shrink-0 flex-col border-r border-[#E6E9F2] bg-[#FBFCFF] px-2 py-4 transition-[width] lg:w-[var(--alkaka-left-width)] lg:px-4"
        style={{ '--alkaka-left-width': `${isLeftRailCollapsed ? LEFT_RAIL_COLLAPSED_WIDTH : leftRailWidth}px` } as CSSProperties}
      >
        <div className="mb-5 flex items-center justify-center gap-3 lg:justify-start">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3B5BFF] to-[#7C3AED] text-lg font-black text-white shadow-[0_12px_28px_rgba(91,75,255,0.3)]">A</div>
          <div className={`${isLeftRailCollapsed ? 'hidden' : 'hidden lg:flex'} min-w-0 items-center gap-1 truncate text-xl font-extrabold tracking-tight`}>Alkaka Chat <span className="text-sm text-[#9CA3AF]">⌄</span></div>
        </div>

        <button type="button" onClick={onRequestNewChat} aria-label="新建对话" className="mb-3 h-10 rounded-xl bg-gradient-to-r from-[#3B5BFF] to-[#7C3AED] text-sm font-bold text-white shadow-[0_14px_28px_rgba(91,75,255,0.24)]"><span className={isLeftRailCollapsed ? '' : 'lg:hidden'}>+</span><span className={isLeftRailCollapsed ? 'hidden' : 'hidden lg:inline'}>+ 新建对话</span></button>
        <div className={`${isLeftRailCollapsed ? 'hidden' : 'hidden lg:flex'} mb-4 h-10 items-center gap-2 rounded-xl border border-[#E6E9F2] bg-white px-3 text-sm text-[#9CA3AF] shadow-sm`}>
          <span>⌕</span>
          <span className="flex-1 truncate">搜索对话或消息</span>
          <kbd className="rounded-md border border-[#E6E9F2] bg-[#F8FAFF] px-1.5 py-0.5 text-[11px] text-[#6B7280]">⌘K</kbd>
        </div>

        <nav className="space-y-1 border-b border-[#E6E9F2] pb-4">
          {navItems.map(([icon, label, badge, active]) => (
            <div key={label} title={label} className={`relative flex h-9 items-center justify-center gap-3 rounded-xl px-3 text-sm font-semibold ${isLeftRailCollapsed ? '' : 'lg:justify-start'} ${active ? 'bg-[#F1EFFF] text-[#5B4BFF]' : 'text-[#4B5563] hover:bg-white'}`}>
              {active ? <span className="absolute left-0 top-2 h-5 w-1 rounded-r-full bg-[#5B4BFF]" /> : null}
              <span className="w-5 shrink-0 text-center text-base">{icon}</span>
              <span className={`${isLeftRailCollapsed ? 'hidden' : 'hidden lg:block'} min-w-0 flex-1 truncate`}>{label}</span>
              {badge ? <span className={`${isLeftRailCollapsed ? 'hidden' : 'hidden lg:inline-flex'} rounded-full bg-[#ECEBFF] px-2 py-0.5 text-[11px] text-[#5B4BFF]`}>{badge}</span> : null}
            </div>
          ))}
        </nav>

        <button type="button" aria-label="打开最近对话" onClick={() => setIsConversationDrawerOpen(true)} className="mt-4 flex h-10 items-center justify-center rounded-xl border border-[#E6E9F2] bg-white text-base text-[#5B4BFF] shadow-sm lg:hidden">💬</button>

        <div className={`${isLeftRailCollapsed ? 'hidden' : 'hidden lg:flex'} mt-4 min-h-0 flex-1 flex-col overflow-hidden`}>
          <div className="mb-3 flex shrink-0 items-center justify-between">
            <h3 className="text-sm font-bold">最近对话</h3>
          </div>
          <div className="mb-3 flex shrink-0 gap-1.5 text-xs">
            {['全部', '群聊', '私聊', '收藏'].map((filter, index) => (
              <span key={filter} className={`rounded-full px-2.5 py-1 ${index === 0 ? 'border border-[#DDDDFB] bg-[#F1EFFF] text-[#5B4BFF]' : 'text-[#6B7280]'}`}>{filter}</span>
            ))}
          </div>
          <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1 pb-2">
            {renderRecentConversationRows()}
          </div>
        </div>

        <div className={`${isLeftRailCollapsed ? 'hidden' : 'hidden lg:flex'} mt-4 items-center gap-3 rounded-[18px] border border-[#E6E9F2] bg-white p-3 shadow-sm`}>
          <Avatar name="Boss" tone={avatarTones.boss} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold">Boss（你） <span className="text-amber-400">♛</span></div>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[#059669]"><span className="h-2 w-2 rounded-full bg-[#10B981]" />在线</div>
          </div>
          <span className="text-[#9CA3AF]">⚙</span>
        </div>

        <button
          type="button"
          aria-label={isLeftRailCollapsed ? '展开左侧栏' : '折叠左侧栏'}
          onClick={() => setIsLeftRailCollapsed((value) => !value)}
          className="absolute bottom-3 right-2 hidden h-8 w-8 items-center justify-center rounded-full border border-[#E6E9F2] bg-white text-xs font-bold text-[#5B4BFF] shadow-sm lg:flex"
        >
          {isLeftRailCollapsed ? '›' : '‹'}
        </button>
        <button
          type="button"
          aria-label="拖动调整左侧栏宽度"
          onPointerDown={(event) => beginPanelResize('left', event)}
          className="absolute -right-1 top-0 hidden h-full w-2 cursor-col-resize touch-none bg-transparent hover:bg-[#DDDDFB]/60 lg:block"
        />
      </aside>

      <main className="alkaka-main-chat flex min-w-0 flex-1 flex-col overflow-x-hidden bg-[#F7F8FC]">
        <header className="flex min-h-[72px] shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#E6E9F2] bg-white/90 px-3 py-3 backdrop-blur sm:px-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="hidden -space-x-3 sm:flex">
              <Avatar name="Boss" tone={avatarTones.boss} size="lg" />
              {recentConversations.slice(0, 2).map((chat) => <Avatar key={chat.id} name={chat.title} tone={chat.tone} size="lg" />)}
            </div>
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2"><h1 className="min-w-0 truncate text-lg font-extrabold sm:text-xl">{projectPreview.title}</h1><StatusPill>{projectPreview.statusCopy}</StatusPill></div>
              <div className="mt-1 truncate text-xs text-[#6B7280]">{projectPreview.subtitle}</div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 text-[#6B7280]">
            {hasCurrentSessionActions ? (
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {currentSession?.status === 'running' && onStopCurrentSession ? <button type="button" aria-label="停止当前真实 Cowork 会话" onClick={() => runCurrentSessionAction('stop current session', onStopCurrentSession)} className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 shadow-sm">停止会话</button> : null}
                {onToggleCurrentSessionPin ? <button type="button" aria-label={currentSession?.pinned ? '取消置顶当前真实 Cowork 会话' : '置顶当前真实 Cowork 会话'} onClick={() => runCurrentSessionAction('toggle current session pin', onToggleCurrentSessionPin)} className="rounded-xl border border-[#E6E9F2] bg-white px-2.5 py-2 text-sm shadow-sm">{currentSession?.pinned ? '取消置顶' : '置顶'}</button> : null}
                {onRenameCurrentSession ? <button type="button" aria-label="重命名当前真实 Cowork 会话" onClick={() => runCurrentSessionAction('rename current session', onRenameCurrentSession)} className="rounded-xl border border-[#E6E9F2] bg-white px-2.5 py-2 text-sm shadow-sm">重命名</button> : null}
                {onDeleteCurrentSession ? <button type="button" aria-label="删除当前真实 Cowork 会话" onClick={() => runCurrentSessionAction('delete current session', onDeleteCurrentSession)} className="rounded-xl border border-[#E6E9F2] bg-white px-2.5 py-2 text-sm shadow-sm">删除</button> : null}
              </div>
            ) : null}
            {['⌕', '☆'].map((item) => <button key={item} type="button" className="rounded-xl border border-[#E6E9F2] bg-white px-2.5 py-2 text-sm shadow-sm">{item}</button>)}
            <button type="button" onClick={() => setIsWorkbenchOpen(true)} className="rounded-xl border border-[#DDDDFB] bg-white px-3 py-2 text-sm font-semibold text-[#5B4BFF] shadow-sm xl:hidden">工作台</button>
            {['▣', `👥 ${workbenchStats.totalSessions}`, '⋯'].map((item) => <button key={item} type="button" className="hidden rounded-xl border border-[#E6E9F2] bg-white px-2.5 py-2 text-sm shadow-sm md:inline-flex">{item}</button>)}
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 sm:px-6">
          <div aria-label={`Boss 置顶了${projectPreview.isDemo ? '任务' : '对话'}：${projectPreview.pinnedSubject}`} className="mb-5 flex flex-wrap items-center gap-3 rounded-[18px] border border-[#DDDDFB] bg-[#F1EFFF] px-4 py-3 shadow-sm">
            <span className="text-[#5B4BFF]">📌</span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">Boss 置顶了{projectPreview.isDemo ? '任务' : '对话'}：<span className="text-[#5B4BFF]">{projectPreview.pinnedSubject}</span></div>
              <div className="mt-0.5 text-xs text-[#6B7280]">{projectPreview.pinnedGoal}</div>
            </div>
            <button type="button" className="text-sm font-semibold text-[#5B4BFF]">查看详情</button>
            <button type="button" className="text-[#9CA3AF]">×</button>
          </div>

          <div className="space-y-5 pb-4">
            {hasRealTimeline ? projectTimeline.map((item) => (
              <section key={item.id} className="flex gap-3">
                <Avatar name={item.speaker} tone={item.avatarTone} size="lg" {...getPartnerAvatar(item.speaker)} />
                <div className="min-w-0 max-w-full xl:max-w-[720px] flex-1">
                  <div className="mb-2 flex min-w-0 flex-wrap items-center gap-2">
                    <span className="font-bold">{item.speaker}</span>
                    <span className="text-xs text-[#9CA3AF]">{formatTimelineTime(item.timestamp)}</span>
                    <StatusPill tone={item.statusTone}>{item.kind}</StatusPill>
                  </div>
                  <div className={`rounded-[18px] border px-4 py-3 text-sm leading-6 shadow-sm ${item.kind === 'tool_use' || item.kind === 'tool_result' ? 'border-[#CFE3FF] bg-[#F6FAFF]' : 'border-[#E6E9F2] bg-white'}`}>
                    {item.title ? <div className="mb-2 font-bold text-[#34316F]">{item.title}</div> : null}
                    <div className="whitespace-pre-wrap break-words">{item.body}</div>
                    {item.bodyTruncated ? <div className="mt-2 text-xs font-semibold text-[#5B4BFF]">已在列表中截断，完整内容保留在真实 Cowork 会话记录中。</div> : null}
                  </div>
                </div>
              </section>
            )) : hasOpenedRealSession ? (
              <section className="flex gap-3">
                <Avatar name="OpenClaw" tone={avatarTones.boss} size="lg" />
                <div className="min-w-0 max-w-full xl:max-w-[720px] flex-1">
                  <div className="mb-2 flex min-w-0 flex-wrap items-center gap-2"><span className="font-bold">OpenClaw 会话</span><StatusPill tone="gray">真实空态</StatusPill></div>
                  <div className="rounded-[18px] border border-[#E6E9F2] bg-white px-4 py-3 text-sm leading-6 text-[#6B7280] shadow-sm">这个真实 Cowork 会话还没有消息。你可以在底部输入框继续发送，消息会走 Cowork/OpenClaw continueSession 链路。</div>
                </div>
              </section>
            ) : (
              <section className="flex gap-3">
                <Avatar name="Alkaka" tone={avatarTones.boss} size="lg" />
                <div className="min-w-0 max-w-full xl:max-w-[720px] flex-1">
                  <div className="mb-2 flex min-w-0 flex-wrap items-center gap-2"><span className="font-bold">Alkaka</span><StatusPill tone="gray">真实空白</StatusPill></div>
                  <div className="rounded-[22px] border border-[#DDDDFB] bg-white px-5 py-5 text-sm leading-6 text-[#374151] shadow-sm">
                    <div className="text-base font-bold text-[#111827]">暂无真实 Cowork 会话</div>
                    <p className="mt-2 text-[#6B7280]">这里不会预置假的伙伴、智能体或项目组。发送第一条消息会创建真实 Cowork/OpenClaw 会话，创建后左侧会出现真实 session，主聊天区会显示真实消息流。</p>
                    <button type="button" onClick={() => composerRef.current?.focus()} className="mt-4 rounded-xl bg-gradient-to-r from-[#3B5BFF] to-[#7C3AED] px-4 py-2 text-sm font-bold text-white shadow-[0_14px_28px_rgba(91,75,255,0.24)]">向 Alkaka 发送第一条消息</button>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-[#E6E9F2] bg-white/85 px-3 py-3 backdrop-blur sm:px-6 sm:py-4">
          <div className="min-w-0 rounded-[22px] border border-[#DDDDFB] bg-white p-3 shadow-[0_18px_45px_rgba(71,85,105,0.10)]">
            <textarea
              ref={composerRef}
              value={composerValue}
              onChange={(event) => onComposerChange?.(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault();
                  void handleSubmit();
                }
              }}
              rows={2}
              aria-label="向 Alkaka 发送消息"
              placeholder="向 Alkaka 发送消息，创建或继续真实 Cowork 会话"
              className="min-h-[48px] w-full resize-none rounded-2xl border-0 bg-transparent px-2 py-2 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF]"
            />
            <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2">
              {['提交', '任务', '文件', '代码块', '知识库', '更多'].map((chip) => <button key={chip} type="button" className="rounded-full border border-[#E6E9F2] px-3 py-1.5 text-xs font-semibold text-[#6B7280] hover:border-[#DDDDFB] hover:text-[#5B4BFF]">{chip}</button>)}
              <div className="ml-auto flex items-center gap-2 text-[#6B7280]"><button type="button">☺</button><button type="button">⚡</button><button type="button" onClick={() => void handleSubmit()} disabled={!resolveComposerSubmitMessage(composerValue)} className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#3B5BFF] to-[#7C3AED] text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-45">➤</button></div>
            </div>
          </div>
        </div>
      </main>

      <aside
        className="alkaka-right-dashboard relative hidden w-[var(--alkaka-right-width)] shrink-0 flex-col gap-4 overflow-y-auto overflow-x-hidden border-l border-[#E6E9F2] bg-[#FBFCFF] p-3 transition-[width] xl:flex"
        style={{ '--alkaka-right-width': `${isRightDashboardCollapsed ? RIGHT_DASHBOARD_COLLAPSED_WIDTH : rightDashboardWidth}px` } as CSSProperties}
      >
        <button
          type="button"
          aria-label="拖动调整右侧工作台宽度"
          onPointerDown={(event) => beginPanelResize('right', event)}
          className="absolute -left-1 top-0 hidden h-full w-2 cursor-col-resize touch-none bg-transparent hover:bg-[#DDDDFB]/60 xl:block"
        />
        {isRightDashboardCollapsed ? (
          <div className="flex h-full flex-col items-center gap-3 pt-2">
            <button type="button" aria-label="展开右侧工作台" onClick={() => setIsRightDashboardCollapsed(false)} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#DDDDFB] bg-white text-sm font-bold text-[#5B4BFF] shadow-sm">‹</button>
            <span className="[writing-mode:vertical-rl] text-xs font-bold tracking-widest text-[#6B7280]">工作台</span>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2 px-1">
              <span className="text-xs font-bold text-[#6B7280]">可拖动调整宽度</span>
              <button type="button" aria-label="折叠右侧工作台" onClick={() => setIsRightDashboardCollapsed(true)} className="rounded-xl border border-[#E6E9F2] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#5B4BFF] shadow-sm">折叠</button>
            </div>
            <RightDashboardContent stats={workbenchStats} />
          </>
        )}
      </aside>

      {isConversationDrawerOpen ? (
        <div className="fixed inset-0 z-40 flex bg-slate-950/30 backdrop-blur-sm lg:hidden" role="dialog" aria-modal="true" aria-label="最近对话">
          <button type="button" aria-label="关闭最近对话遮罩" className="absolute inset-0 cursor-default" onClick={() => setIsConversationDrawerOpen(false)} />
          <aside className="relative z-10 flex h-full w-[min(340px,calc(100vw-40px))] flex-col overflow-y-auto overflow-x-hidden border-r border-[#E6E9F2] bg-[#FBFCFF] p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#111827]">最近对话</h2>
              <button type="button" onClick={() => setIsConversationDrawerOpen(false)} className="rounded-xl border border-[#E6E9F2] px-3 py-1.5 text-sm font-semibold text-[#6B7280]">关闭</button>
            </div>
            <div className="mb-3 flex gap-1.5 text-xs">
              {['全部', '群聊', '私聊', '收藏'].map((filter, index) => (
                <span key={filter} className={`rounded-full px-2.5 py-1 ${index === 0 ? 'border border-[#DDDDFB] bg-[#F1EFFF] text-[#5B4BFF]' : 'text-[#6B7280]'}`}>{filter}</span>
              ))}
            </div>
            <div className="space-y-1.5 overflow-y-auto pr-1">
              {renderRecentConversationRows()}
            </div>
          </aside>
        </div>
      ) : null}

      {isWorkbenchOpen ? (
        <div className="fixed inset-0 z-40 flex justify-end bg-slate-950/30 backdrop-blur-sm xl:hidden" role="dialog" aria-modal="true" aria-label="工作台">
          <button type="button" aria-label="关闭工作台遮罩" className="absolute inset-0 cursor-default" onClick={() => setIsWorkbenchOpen(false)} />
          <aside className="relative z-10 flex h-full w-[min(380px,calc(100vw-76px))] flex-col gap-4 overflow-y-auto overflow-x-hidden border-l border-[#E6E9F2] bg-[#FBFCFF] p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#111827]">工作台</h2>
              <button type="button" onClick={() => setIsWorkbenchOpen(false)} className="rounded-xl border border-[#E6E9F2] px-3 py-1.5 text-sm font-semibold text-[#6B7280]">关闭</button>
            </div>
            <RightDashboardContent stats={workbenchStats} />
          </aside>
        </div>
      ) : null}
    </div>
  );
};

export default AlkakaProjectChatHome;
