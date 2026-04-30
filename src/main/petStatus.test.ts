import { describe, expect, test } from 'vitest';

import { createPetReadyStatusFromRecentSessions, createPetStatusFromCoworkActivity, createPetStatusSnapshot } from './petStatus';

describe('createPetStatusSnapshot', () => {
  test('creates safe pet snapshots with default messages for cowork phases', () => {
    expect(createPetStatusSnapshot({ phase: 'ready' })).toEqual({
      phase: 'ready',
      message: '准备好对话',
    });

    expect(createPetStatusSnapshot({
      phase: 'working',
      sessionId: 'session-1',
      title: '整理今天任务',
    })).toEqual({
      phase: 'working',
      sessionId: 'session-1',
      title: '整理今天任务',
      message: 'Alkaka 正在处理…',
    });
  });

  test('truncates long titles, messages, and errors before broadcasting to pet renderer', () => {
    const snapshot = createPetStatusSnapshot({
      phase: 'error',
      sessionId: 'session-1',
      title: 't'.repeat(100),
      error: 'e'.repeat(500),
    });

    expect(snapshot.title).toHaveLength(50);
    expect(snapshot.message).toBe('AI 对话遇到问题');
    expect(snapshot.error).toHaveLength(160);
  });
});

describe('createPetReadyStatusFromRecentSessions', () => {
  test('points the ready pet at the most recently updated real cowork session', () => {
    expect(createPetReadyStatusFromRecentSessions([
      { id: 'temp-1', title: '临时草稿', updatedAt: 300 },
      { id: ' session-2 ', title: '  整理今天的问题  ', updatedAt: 200 },
      { id: 'session-1', title: '旧问题', updatedAt: 100 },
    ])).toEqual({
      phase: 'ready',
      sessionId: 'session-2',
      title: '整理今天的问题',
      message: '准备好对话',
    });
  });

  test('ignores pinned list ordering when a newer unpinned session exists', () => {
    expect(createPetReadyStatusFromRecentSessions([
      { id: 'pinned-old', title: '置顶旧问题', pinned: true, updatedAt: 100 },
      { id: 'recent-new', title: '刚处理的问题', pinned: false, updatedAt: 300 },
    ])).toMatchObject({
      sessionId: 'recent-new',
      title: '刚处理的问题',
    });
  });

  test('falls back to plain ready when no recent session can be resumed', () => {
    expect(createPetReadyStatusFromRecentSessions([
      { id: 'temp-1', title: '临时草稿' },
      { id: '   ', title: '空 id' },
    ])).toEqual({
      phase: 'ready',
      message: '准备好对话',
    });
  });
});


describe('createPetStatusFromCoworkActivity', () => {
  test('uses a real running Cowork session as the desktop-pet working status', () => {
    expect(createPetStatusFromCoworkActivity([
      { id: 'done-old', title: '已经完成', status: 'completed', updatedAt: 100 },
      { id: 'running-new', title: '真实 OpenClaw 会话', status: 'running', updatedAt: 300 },
    ])).toEqual({
      phase: 'working',
      sessionId: 'running-new',
      title: '真实 OpenClaw 会话',
      message: 'Alkaka 正在处理…',
    });
  });

  test('surfaces real errored sessions before plain ready fallbacks', () => {
    expect(createPetStatusFromCoworkActivity([
      { id: 'ready-old', title: '普通会话', status: 'idle', updatedAt: 100 },
      { id: 'error-new', title: '失败会话', status: 'error', updatedAt: 200 },
    ])).toMatchObject({
      phase: 'error',
      sessionId: 'error-new',
      title: '失败会话',
      message: 'AI 对话遇到问题',
    });
  });

  test('falls back to latest resumable session when no active work exists', () => {
    expect(createPetStatusFromCoworkActivity([
      { id: 'completed-new', title: '刚完成的问题', status: 'completed', updatedAt: 300 },
      { id: 'idle-old', title: '旧问题', status: 'idle', updatedAt: 100 },
    ])).toEqual({
      phase: 'ready',
      sessionId: 'completed-new',
      title: '刚完成的问题',
      message: '准备好对话',
    });
  });
});
