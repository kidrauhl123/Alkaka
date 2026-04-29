import { describe, expect, test } from 'vitest';

import {
  createPetTaskJumpRequest,
  getPetTaskDetailButtonLabel,
  hasOpenablePetSession,
} from './petTaskJump';

describe('pet task jump helpers', () => {
  test('allows opening a cowork task only when the pet status has a real session id', () => {
    expect(hasOpenablePetSession({ phase: 'done', sessionId: 'session-1', message: '任务已完成' })).toBe(true);
    expect(hasOpenablePetSession({ phase: 'working', sessionId: ' session-2 ', message: 'Alkaka 正在处理…' })).toBe(true);
    expect(hasOpenablePetSession({ phase: 'ready', message: '随时待命' })).toBe(false);
    expect(hasOpenablePetSession({ phase: 'done', sessionId: 'temp-123', message: '任务已完成' })).toBe(false);
    expect(hasOpenablePetSession({ phase: 'error', sessionId: '   ', message: '任务遇到问题' })).toBe(false);
  });

  test('normalizes the payload sent from pet window to main process', () => {
    expect(createPetTaskJumpRequest({ phase: 'working', sessionId: ' session-1 ', title: '整理今天任务' })).toEqual({
      sessionId: 'session-1',
    });
    expect(createPetTaskJumpRequest({ phase: 'done', sessionId: 'temp-1' })).toBeNull();
    expect(createPetTaskJumpRequest({ phase: 'idle' })).toBeNull();
  });

  test('uses a short label that matches the pet task state', () => {
    expect(getPetTaskDetailButtonLabel({ phase: 'working', sessionId: 'session-1' })).toBe('查看任务');
    expect(getPetTaskDetailButtonLabel({ phase: 'done', sessionId: 'session-1' })).toBe('查看结果');
    expect(getPetTaskDetailButtonLabel({ phase: 'error', sessionId: 'session-1' })).toBe('查看详情');
    expect(getPetTaskDetailButtonLabel({ phase: 'ready', sessionId: 'session-1' })).toBe('继续上次');
    expect(getPetTaskDetailButtonLabel({ phase: 'ready' })).toBe('打开主窗口');
  });
});
