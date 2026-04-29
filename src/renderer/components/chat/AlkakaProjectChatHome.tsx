import { useEffect, useRef, type ReactNode } from 'react';

import classRepAvatarUrl from '../../assets/partners/partner-class-rep.png';
import codemanAvatarUrl from '../../assets/partners/partner-codeman.png';
import dataAnalystAvatarUrl from '../../assets/partners/partner-data-analyst.png';
import designCatAvatarUrl from '../../assets/partners/partner-design-cat.png';
import intelScoutAvatarUrl from '../../assets/partners/partner-intel-scout.png';
import reviewerAvatarUrl from '../../assets/partners/partner-reviewer.png';

export const defaultPartnerAvatarAssets = {
  classRep: classRepAvatarUrl,
  intelScout: intelScoutAvatarUrl,
  codeman: codemanAvatarUrl,
  designCat: designCatAvatarUrl,
  dataAnalyst: dataAnalystAvatarUrl,
  reviewer: reviewerAvatarUrl,
} as const;

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

const partnerAvatarByRole = {
  小课代表: { imageSrc: defaultPartnerAvatarAssets.classRep, imageAlt: '小课代表 伙伴头像' },
  情报姬: { imageSrc: defaultPartnerAvatarAssets.intelScout, imageAlt: '情报姬 伙伴头像' },
  CodeMan: { imageSrc: defaultPartnerAvatarAssets.codeman, imageAlt: 'CodeMan 伙伴头像' },
  设计喵: { imageSrc: defaultPartnerAvatarAssets.designCat, imageAlt: '设计喵 伙伴头像' },
  数据君: { imageSrc: defaultPartnerAvatarAssets.dataAnalyst, imageAlt: '数据君 伙伴头像' },
  审核官: { imageSrc: defaultPartnerAvatarAssets.reviewer, imageAlt: '审核官 伙伴头像' },
  大监: { imageSrc: defaultPartnerAvatarAssets.reviewer, imageAlt: '审核官 伙伴头像' },
} as const;

const getPartnerAvatar = (name: string): Pick<AvatarProps, 'imageSrc' | 'imageAlt'> => {
  const match = Object.entries(partnerAvatarByRole).find(([role]) => name.includes(role));
  return match?.[1] ?? {};
};

const StatusPill = ({ children, tone = 'purple' }: { children: ReactNode; tone?: 'purple' | 'green' | 'orange' | 'gray' }) => {
  const toneClass = {
    purple: 'bg-[#EEF0FF] text-[#4F46E5]',
    green: 'bg-[#E8FFF5] text-[#059669]',
    orange: 'bg-[#FFF3E6] text-[#EA7A1A]',
    gray: 'bg-[#F3F4F6] text-[#6B7280]',
  }[tone];

  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${toneClass}`}>{children}</span>;
};

const SectionCard = ({ title, action, children, className = '' }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) => (
  <section className={`rounded-[22px] border border-[#E6E9F2] bg-white p-4 shadow-[0_18px_45px_rgba(71,85,105,0.07)] ${className}`}>
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
  ['🧑‍🤝‍🧑', '伙伴', null, false],
  ['✅', '任务中心', '12', false],
  ['🗂', '项目空间', null, false],
  ['📚', '知识库', null, false],
  ['📎', '文件', null, false],
  ['📅', '日历', null, false],
  ['⚙️', '设置', null, false],
] as const;

const conversations = [
  { title: 'AI日报项目组', preview: '小课代表：已整理今日AI行业日报初稿', time: '10:45', tone: avatarTones.rep, selected: true, pin: true },
  { title: '产品研发群', preview: 'CodeMan：接口文档已更新', time: '09:32', tone: avatarTones.code, unread: '5' },
  { title: '情报收集小队', preview: '情报姬：找到3篇相关论文', time: '昨天', tone: avatarTones.intel },
  { title: 'CodeMan（代码工人）', preview: '我：帮我处理权限校验的问题', time: '昨天', tone: avatarTones.code },
  { title: '设计喵（设计师）', preview: '我：做个日报的图表视觉', time: '昨天', tone: avatarTones.design },
  { title: '大监（御前监督使）', preview: '我：任务进度如何了？', time: '前天', tone: avatarTones.guard },
];

const taskRows = [
  ['Agent 相关动态收集', '情报姬', avatarTones.intel],
  ['模型相关进展跟踪', '数据君', avatarTones.data],
  ['融资信息收集', '情报姬', avatarTones.intel],
  ['数据整理与分析', 'CodeMan', avatarTones.code],
  ['日报撰写与排版', '设计喵', avatarTones.design],
  ['最终审核与质量把控', '大监（御前监督使）', avatarTones.guard],
] as const;

const partners = [
  ['小课代表（课代表）', '整理中', '整理日报结构和素材', 92, avatarTones.rep, 'purple'],
  ['项目管理（项目管理）', '规划中', '制定任务计划中', 78, avatarTones.pm, 'orange'],
  ['大监（御前监督使）', '执行中', '监督任务执行质量', 65, avatarTones.guard, 'green'],
  ['情报姬（情报员）', '执行中', '收集行业情报中', 62, avatarTones.intel, 'green'],
  ['CodeMan（代码工人）', '执行中', '进行数据处理', 45, avatarTones.code, 'green'],
  ['设计喵（设计师）', '待命中', '等待内容输入', null, avatarTones.design, 'gray'],
  ['数据君（数据分析师）', '执行中', '数据分析进行中', 58, avatarTones.data, 'green'],
  ['管管（项目管理）', '规划中', '制定任务计划中', 78, avatarTones.pm, 'orange'],
] as const;

type SubmitResult = boolean | void;

export interface AlkakaProjectChatHomeProps {
  composerValue?: string;
  onComposerChange?: (value: string) => void;
  onSubmitMessage?: (message: string) => SubmitResult | Promise<SubmitResult>;
  onRequestNewChat?: () => void;
  shouldFocusComposer?: boolean;
}

const starterMessage = '各位，开始做今天的 AI 行业日报，重点关注 Agent、模型、融资这三个方向。';

export const resolveComposerSubmitMessage = (value: string): string | null => {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

export const shouldClearComposerAfterSubmit = (result: SubmitResult): boolean => result !== false;

const AlkakaProjectChatHome = ({
  composerValue = '',
  onComposerChange,
  onSubmitMessage,
  onRequestNewChat,
  shouldFocusComposer = false,
}: AlkakaProjectChatHomeProps) => {
  const composerRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (shouldFocusComposer) {
      composerRef.current?.focus();
    }
  }, [shouldFocusComposer]);

  const handleSubmit = async () => {
    const message = resolveComposerSubmitMessage(composerValue);
    if (!message) return;

    const result = await onSubmitMessage?.(message);
    if (shouldClearComposerAfterSubmit(result)) {
      onComposerChange?.('');
    }
  };

  return (
    <div className="alkaka-project-chat-shell flex h-full min-h-0 overflow-hidden bg-[#F7F8FC] text-[#111827]">
      <aside className="alkaka-left-sidebar flex w-[318px] shrink-0 flex-col border-r border-[#E6E9F2] bg-[#FBFCFF] px-4 py-4">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3B5BFF] to-[#7C3AED] text-lg font-black text-white shadow-[0_12px_28px_rgba(91,75,255,0.3)]">A</div>
          <div className="flex items-center gap-1 text-xl font-extrabold tracking-tight">Alkaka Chat <span className="text-sm text-[#9CA3AF]">⌄</span></div>
        </div>

        <button type="button" onClick={onRequestNewChat} className="mb-3 h-10 rounded-xl bg-gradient-to-r from-[#3B5BFF] to-[#7C3AED] text-sm font-bold text-white shadow-[0_14px_28px_rgba(91,75,255,0.24)]">+ 新建对话</button>
        <div className="mb-4 flex h-10 items-center gap-2 rounded-xl border border-[#E6E9F2] bg-white px-3 text-sm text-[#9CA3AF] shadow-sm">
          <span>⌕</span>
          <span className="flex-1 truncate">搜索对话、伙伴或消息</span>
          <kbd className="rounded-md border border-[#E6E9F2] bg-[#F8FAFF] px-1.5 py-0.5 text-[11px] text-[#6B7280]">⌘K</kbd>
        </div>

        <nav className="space-y-1 border-b border-[#E6E9F2] pb-4">
          {navItems.map(([icon, label, badge, active]) => (
            <div key={label} className={`relative flex h-9 items-center gap-3 rounded-xl px-3 text-sm font-semibold ${active ? 'bg-[#F1EFFF] text-[#5B4BFF]' : 'text-[#4B5563] hover:bg-white'}`}>
              {active ? <span className="absolute left-0 top-2 h-5 w-1 rounded-r-full bg-[#5B4BFF]" /> : null}
              <span className="w-5 text-center text-base">{icon}</span>
              <span className="flex-1">{label}</span>
              {badge ? <span className="rounded-full bg-[#ECEBFF] px-2 py-0.5 text-[11px] text-[#5B4BFF]">{badge}</span> : null}
            </div>
          ))}
        </nav>

        <div className="mt-4 min-h-0 flex-1 overflow-hidden">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold">最近对话</h3>
          </div>
          <div className="mb-3 flex gap-1.5 text-xs">
            {['全部', '群聊', '私聊', '收藏'].map((filter, index) => (
              <span key={filter} className={`rounded-full px-2.5 py-1 ${index === 0 ? 'border border-[#DDDDFB] bg-[#F1EFFF] text-[#5B4BFF]' : 'text-[#6B7280]'}`}>{filter}</span>
            ))}
          </div>
          <div className="space-y-1.5 overflow-y-auto pr-1">
            {conversations.map((chat) => (
              <div key={chat.title} className={`flex gap-2 rounded-2xl p-2.5 ${chat.selected ? 'bg-[#F1EFFF] shadow-sm' : 'hover:bg-white'}`}>
                <Avatar name={chat.title} tone={chat.tone} {...getPartnerAvatar(chat.title)} />
                <div className="min-w-0 flex-1">
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
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-[18px] border border-[#E6E9F2] bg-white p-3 shadow-sm">
          <Avatar name="Boss" tone={avatarTones.boss} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold">Boss（你） <span className="text-amber-400">♛</span></div>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[#059669]"><span className="h-2 w-2 rounded-full bg-[#10B981]" />在线</div>
          </div>
          <span className="text-[#9CA3AF]">⚙</span>
        </div>
      </aside>

      <main className="alkaka-main-chat flex min-w-0 flex-1 flex-col bg-[#F7F8FC]">
        <header className="flex h-[76px] shrink-0 items-center justify-between border-b border-[#E6E9F2] bg-white/90 px-6 backdrop-blur">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              <Avatar name="Boss" tone={avatarTones.boss} size="lg" />
              <Avatar name="小课代表" tone={avatarTones.rep} size="lg" {...getPartnerAvatar('小课代表')} />
              <Avatar name="情报姬" tone={avatarTones.intel} size="lg" {...getPartnerAvatar('情报姬')} />
            </div>
            <div>
              <div className="flex items-center gap-2"><h1 className="text-xl font-extrabold">AI日报项目组</h1><StatusPill>项目组</StatusPill></div>
              <div className="mt-1 text-xs text-[#6B7280]">8位伙伴 · 创建于 2024-06-01</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[#6B7280]">
            {['⌕', '☆', '▣', '👥 8', '⋯'].map((item) => <button key={item} type="button" className="rounded-xl border border-[#E6E9F2] bg-white px-2.5 py-2 text-sm shadow-sm">{item}</button>)}
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <div aria-label="Boss 置顶了任务：生成今日 AI 行业日报" className="mb-5 flex items-center gap-3 rounded-[18px] border border-[#DDDDFB] bg-[#F1EFFF] px-4 py-3 shadow-sm">
            <span className="text-[#5B4BFF]">📌</span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">Boss 置顶了任务：<span className="text-[#5B4BFF]">生成今日 AI 行业日报</span></div>
              <div className="mt-0.5 text-xs text-[#6B7280]">目标：全面、准确、有洞察的日报，10:00 前完成</div>
            </div>
            <button type="button" className="text-sm font-semibold text-[#5B4BFF]">查看详情</button>
            <button type="button" className="text-[#9CA3AF]">×</button>
          </div>

          <div className="space-y-5 pb-4">
            <section className="flex gap-3">
              <Avatar name="Boss" tone={avatarTones.boss} size="lg" />
              <div className="max-w-[720px]">
                <div className="mb-2 flex items-center gap-2"><span className="font-bold">Boss（群主）</span><span className="text-xs text-[#9CA3AF]">09:30</span></div>
                <div className="rounded-[18px] border border-[#E6E9F2] bg-white px-4 py-3 text-sm leading-6 shadow-sm">{starterMessage}</div>
                <div className="mt-2 flex gap-2 text-xs"><span className="rounded-full border border-[#E6E9F2] bg-white px-2 py-1">👍 3</span><span className="rounded-full border border-[#E6E9F2] bg-white px-2 py-1">🔥 2</span><span className="rounded-full border border-[#E6E9F2] bg-white px-2 py-1">☺</span></div>
              </div>
            </section>

            <section className="flex gap-3">
              <Avatar name="小课代表" tone={avatarTones.rep} size="lg" {...getPartnerAvatar('小课代表')} />
              <div className="max-w-[720px] flex-1">
                <div className="mb-2 flex items-center gap-2"><span className="font-bold">小课代表（课代表）</span><span className="text-xs text-[#9CA3AF]">09:31</span><StatusPill>整理中</StatusPill></div>
                <div className="rounded-[20px] border border-[#DDDDFB] bg-gradient-to-br from-white to-[#F7F5FF] p-4 shadow-sm">
                  <div className="mb-2 flex items-center justify-between"><h3 className="font-bold text-[#34316F]">课代表总结（已理解）</h3><span className="text-[#7C3AED]">∞</span></div>
                  <p className="text-sm leading-6 text-[#374151]">需要生成一份今日 AI 行业日报，关注：</p>
                  <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-[#374151]"><li>Agent 相关动态</li><li>模型相关进展</li><li>融资信息</li></ol>
                  <p className="mt-2 text-sm leading-6 text-[#374151]">我已拆解任务，分配给相关伙伴跟进，预计 10:00 前初稿完成。</p>
                  <div className="mt-3 text-right text-sm font-semibold text-[#5B4BFF]">查看任务详情 &gt;</div>
                </div>
              </div>
            </section>

            <section className="flex gap-3">
              <Avatar name="管" tone={avatarTones.pm} size="lg" />
              <div className="max-w-[720px] flex-1">
                <div className="mb-2 flex items-center gap-2"><span className="font-bold">项目管理</span><StatusPill tone="orange">项目管理</StatusPill><span className="text-xs text-[#9CA3AF]">09:31</span><StatusPill tone="orange">规划中</StatusPill></div>
                <div className="rounded-[20px] border border-[#F7D7B6] bg-gradient-to-br from-white to-[#FFF8EF] p-4 shadow-sm">
                  <h3 className="mb-3 font-bold text-[#7C3F12]">任务拆解与分配</h3>
                  <div className="grid gap-2">
                    {taskRows.map(([task, assignee, tone], index) => (
                      <div key={task} className="flex items-center gap-3 rounded-xl bg-white/75 px-3 py-2 text-sm">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FFF3E6] text-xs font-bold text-[#EA7A1A]">{index + 1}</span>
                        <span className="min-w-0 flex-1 truncate">{task}</span>
                        <Avatar name={assignee} tone={tone} size="sm" {...getPartnerAvatar(assignee)} />
                        <span className="text-[#6B7280]">{assignee}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex justify-between text-sm"><span className="text-[#6B7280]">预计完成时间：今天 10:00</span><span className="font-semibold text-[#EA7A1A]">查看甘特图 &gt;</span></div>
                </div>
              </div>
            </section>

            <section className="flex gap-3">
              <Avatar name="情报姬" tone={avatarTones.intel} size="lg" {...getPartnerAvatar('情报姬')} />
              <div className="max-w-[720px] flex-1">
                <div className="mb-2 flex items-center gap-2"><span className="font-bold">情报姬（情报员）</span><span className="text-xs text-[#9CA3AF]">09:32</span><StatusPill tone="green">执行中</StatusPill></div>
                <div className="rounded-[18px] border border-[#E6E9F2] bg-white px-4 py-3 text-sm shadow-sm">我来收集最新的 Agent 应用动态和产品发布。</div>
                <div className="mt-2 rounded-[16px] border border-[#DDDDFB] bg-[#F7F5FF] px-4 py-3 text-sm"><div className="flex justify-between font-semibold"><span>思考过程（已折叠）</span><span className="text-[#5B4BFF]">展开 &gt;</span></div><div className="mt-1 text-xs text-[#6B7280]">关键词：Agent、AI应用、产品发布、行业动态、融资...</div></div>
              </div>
            </section>

            <section className="flex gap-3">
              <Avatar name="CodeMan" tone={avatarTones.code} size="lg" {...getPartnerAvatar('CodeMan')} />
              <div className="max-w-[720px] flex-1">
                <div className="mb-2 flex items-center gap-2"><span className="font-bold">CodeMan（代码工人）</span><span className="text-xs text-[#9CA3AF]">09:33</span><StatusPill tone="green">执行中</StatusPill></div>
                <div className="rounded-[18px] border border-[#E6E9F2] bg-white px-4 py-3 text-sm shadow-sm">我来处理相关数据清洗和趋势分析，构建可视化图表。</div>
                <div className="mt-2 rounded-[16px] border border-[#CFE3FF] bg-[#F6FAFF] px-4 py-3 text-sm">
                  <div className="flex justify-between font-semibold"><span>执行代码（已折叠）</span><span className="text-[#5B4BFF]">查看日志</span></div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-[#6B7280]"><code className="rounded-md bg-white px-2 py-1 font-mono text-[#374151]">analysis/report_generator.py</code><span>运行中</span><span className="ml-auto font-bold text-[#5B4BFF]">62%</span></div>
                  <div className="mt-2"><ProgressBar value={62} /></div>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="shrink-0 border-t border-[#E6E9F2] bg-white/85 px-6 py-4 backdrop-blur">
          <div className="rounded-[22px] border border-[#DDDDFB] bg-white p-3 shadow-[0_18px_45px_rgba(71,85,105,0.10)]">
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
              aria-label="向所有人发送消息"
              placeholder="向所有人发送消息，@ 伙伴 或 / 指令"
              className="min-h-[48px] w-full resize-none rounded-2xl border-0 bg-transparent px-2 py-2 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF]"
            />
            <div className="mt-2 flex items-center gap-2">
              {['提交', '任务', '文件', '代码块', '知识库', '更多'].map((chip) => <button key={chip} type="button" className="rounded-full border border-[#E6E9F2] px-3 py-1.5 text-xs font-semibold text-[#6B7280] hover:border-[#DDDDFB] hover:text-[#5B4BFF]">{chip}</button>)}
              <div className="ml-auto flex items-center gap-2 text-[#6B7280]"><button type="button">☺</button><button type="button">⚡</button><button type="button" onClick={() => void handleSubmit()} disabled={!resolveComposerSubmitMessage(composerValue)} className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#3B5BFF] to-[#7C3AED] text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-45">➤</button></div>
            </div>
          </div>
        </div>
      </main>

      <aside className="alkaka-right-dashboard flex w-[342px] shrink-0 flex-col gap-4 overflow-y-auto border-l border-[#E6E9F2] bg-[#FBFCFF] p-4">
        <SectionCard title="伙伴团队运行状态" action={<StatusPill tone="green">系统正常</StatusPill>}>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[#F8FAFF] p-3"><div className="text-xs text-[#6B7280]">活跃伙伴</div><div className="mt-1 text-2xl font-black">3 / 8</div><div className="text-xs text-[#9CA3AF]">3 个伙伴正在工作</div><div className="mt-3 flex -space-x-2"><Avatar name="小课代表" tone={avatarTones.rep} size="sm" {...getPartnerAvatar('小课代表')} /><Avatar name="情报姬" tone={avatarTones.intel} size="sm" {...getPartnerAvatar('情报姬')} /><Avatar name="CodeMan" tone={avatarTones.code} size="sm" {...getPartnerAvatar('CodeMan')} /><span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#EEF0FF] text-[10px] font-bold text-[#5B4BFF]">+5</span></div></div>
            <div className="rounded-2xl bg-[#F8FAFF] p-3"><div className="text-xs text-[#6B7280]">当前状态</div><div className="mt-1 text-lg font-black">深度工作中</div><div className="text-xs text-[#9CA3AF]">任务推进顺利</div></div>
          </div>
        </SectionCard>

        <SectionCard title="资源使用情况" action={<span className="rounded-full border border-[#E6E9F2] px-2 py-1 text-xs text-[#6B7280]">今日⌄</span>}>
          <div className="space-y-3">
            {[['Token 用量', '1.23M / 5M', '24.6%', 24.6], ['费用预估', '$0.42 / $5', '8.4%', 8.4], ['API 调用', '428 / 2000', '21.4%', 21.4]].map(([label, value, pct, n]) => (
              <div key={label as string}>
                <div className="mb-1 flex justify-between text-xs"><span className="text-[#6B7280]">{label}</span><span className="font-bold text-[#111827]">{value} · {pct}</span></div>
                <ProgressBar value={Number(n)} />
              </div>
            ))}
            <div className="pt-1 text-sm font-semibold text-[#5B4BFF]">查看详细使用报告</div>
          </div>
        </SectionCard>

        <SectionCard title="伙伴状态" action={<span className="text-xs font-semibold text-[#5B4BFF]">自定义排序 ×</span>}>
          <div className="space-y-3">
            {partners.map(([name, status, task, progress, tone, statusTone]) => (
              <div key={name} className="flex gap-2">
                <Avatar name={name} tone={tone} size="sm" {...getPartnerAvatar(name)} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><span className="truncate text-xs font-bold">{name}</span><StatusPill tone={statusTone as 'purple' | 'green' | 'orange' | 'gray'}>{status}</StatusPill></div>
                  <div className="mt-0.5 truncate text-[11px] text-[#6B7280]">{task}</div>
                  {progress === null ? <div className="mt-1 text-[11px] text-[#9CA3AF]">Zzz</div> : <div className="mt-1 flex items-center gap-2"><div className="flex-1"><ProgressBar value={progress} tone={statusTone === 'orange' ? 'orange' : statusTone === 'green' ? 'green' : 'purple'} /></div><span className="w-8 text-right text-[11px] font-bold text-[#6B7280]">{progress}%</span></div>}
                </div>
              </div>
            ))}
            <button type="button" className="w-full rounded-xl border border-[#DDDDFB] py-2 text-sm font-semibold text-[#5B4BFF]">查看全部伙伴状态</button>
          </div>
        </SectionCard>

        <SectionCard title="快捷操作">
          <div className="grid grid-cols-2 gap-2">
            {['新建任务', '任务看板', '日报生成', '文件管理', '代码执行', '数据分析'].map((action) => <button key={action} type="button" className="rounded-xl border border-[#E6E9F2] bg-[#F8FAFF] px-3 py-3 text-left text-sm font-semibold hover:border-[#DDDDFB] hover:text-[#5B4BFF]">{action}</button>)}
          </div>
          <div className="mt-3 text-sm font-semibold text-[#5B4BFF]">查看全部伙伴状态</div>
        </SectionCard>
      </aside>
    </div>
  );
};

export default AlkakaProjectChatHome;
