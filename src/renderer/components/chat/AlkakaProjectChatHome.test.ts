import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import AlkakaProjectChatHome, {
  defaultPartnerAvatarAssets,
  resolveComposerSubmitMessage,
  shouldClearComposerAfterSubmit,
} from './AlkakaProjectChatHome';

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
      '搜索对话、伙伴或消息',
      '对话',
      '伙伴',
      '任务中心',
      '项目空间',
      '最近对话',
      'AI日报项目组',
      'Boss（你）',
    ].forEach((copy) => expect(html).toContain(copy));
  });

  it('shows the AI daily report project group chat with rich operational cards', () => {
    [
      'Boss 置顶了任务：生成今日 AI 行业日报',
      '课代表总结（已理解）',
      '任务拆解与分配',
      '思考过程（已折叠）',
      '执行代码（已折叠）',
      'analysis/report_generator.py',
      '62%',
      '向所有人发送消息，@ 伙伴 或 / 指令',
    ].forEach((copy) => expect(html).toContain(copy));
  });

  it('renders the right-side AI team dashboard required by the screenshot', () => {
    [
      '伙伴团队运行状态',
      '系统正常',
      '活跃伙伴',
      '资源使用情况',
      'Token 用量',
      '费用预估',
      'API 调用',
      '伙伴状态',
      '快捷操作',
    ].forEach((copy) => expect(html).toContain(copy));
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

  it('uses generated partner avatar assets instead of gradient-letter placeholders for default partners', () => {
    expect(defaultPartnerAvatarAssets).toMatchObject({
      classRep: expect.stringContaining('partner-class-rep'),
      intelScout: expect.stringContaining('partner-intel-scout'),
      codeman: expect.stringContaining('partner-codeman'),
      designCat: expect.stringContaining('partner-design-cat'),
      dataAnalyst: expect.stringContaining('partner-data-analyst'),
      reviewer: expect.stringContaining('partner-reviewer'),
    });

    [
      '小课代表 伙伴头像',
      '情报姬 伙伴头像',
      'CodeMan 伙伴头像',
      '设计喵 伙伴头像',
      '数据君 伙伴头像',
      '审核官 伙伴头像',
    ].forEach((alt) => expect(html).toContain(alt));
    expect(html).not.toContain('搜索对话、智能体或消息');
    expect(html).toContain('搜索对话、伙伴或消息');
  });

  it('keeps drafts when submission is rejected and clears only after accepted submit results', () => {
    expect(shouldClearComposerAfterSubmit(false)).toBe(false);
    expect(shouldClearComposerAfterSubmit(undefined)).toBe(true);
    expect(shouldClearComposerAfterSubmit(true)).toBe(true);
  });
});
