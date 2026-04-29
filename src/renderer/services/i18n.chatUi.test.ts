import { describe, expect, it } from 'vitest';

import { i18nService } from './i18n';

describe('AI-first chat UI translations', () => {
  it('uses chat app wording for the main navigation in Chinese', () => {
    i18nService.setLanguage('zh', { persist: false });

    expect(i18nService.t('newChat')).toBe('新建对话');
    expect(i18nService.t('coworkHistory')).toBe('对话记录');
    expect(i18nService.t('myAgents')).toBe('AI 伙伴');
    expect(i18nService.t('scheduledTasks')).toBe('项目组');
    expect(i18nService.t('searchConversations')).toBe('搜索对话...');
  });

  it('uses chat app wording for the main navigation in English', () => {
    i18nService.setLanguage('en', { persist: false });

    expect(i18nService.t('newChat')).toBe('New Chat');
    expect(i18nService.t('coworkHistory')).toBe('Conversations');
    expect(i18nService.t('myAgents')).toBe('AI Partners');
    expect(i18nService.t('scheduledTasks')).toBe('Project Groups');
    expect(i18nService.t('searchConversations')).toBe('Search conversations...');
  });
});
