import { describe, expect, test } from 'vitest';

import { createPetStatusSnapshot } from './petStatus';

describe('createPetStatusSnapshot', () => {
  test('creates safe pet snapshots with default messages for cowork phases', () => {
    expect(createPetStatusSnapshot({ phase: 'ready' })).toEqual({
      phase: 'ready',
      message: '随时待命',
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
    expect(snapshot.message).toBe('任务遇到问题');
    expect(snapshot.error).toHaveLength(160);
  });
});
