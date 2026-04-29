import { describe, expect, test } from 'vitest';

import { createInitialPetStatus, reducePetStatus } from './petState';

describe('reducePetStatus', () => {
  test('moves from idle to sending while preserving the active session metadata', () => {
    const initial = createInitialPetStatus();

    const next = reducePetStatus(initial, {
      type: 'quick-task-started',
      sessionId: 'session-1',
      title: '整理今天任务',
    });

    expect(next).toEqual({
      phase: 'sending',
      sessionId: 'session-1',
      title: '整理今天任务',
      message: '正在发给 Alkaka…',
    });
  });

  test('maps cowork lifecycle snapshots to pet-facing phases and messages', () => {
    const sending = reducePetStatus(createInitialPetStatus(), {
      type: 'quick-task-started',
      sessionId: 'session-1',
      title: '整理今天任务',
    });

    const working = reducePetStatus(sending, {
      type: 'snapshot',
      snapshot: {
        phase: 'working',
        sessionId: 'session-1',
        title: '整理今天任务',
        message: 'Alkaka 正在处理…',
      },
    });

    expect(working.phase).toBe('working');
    expect(working.message).toBe('Alkaka 正在处理…');

    const done = reducePetStatus(working, {
      type: 'snapshot',
      snapshot: {
        phase: 'done',
        sessionId: 'session-1',
        title: '整理今天任务',
      },
    });

    expect(done).toEqual({
      phase: 'done',
      sessionId: 'session-1',
      title: '整理今天任务',
      message: '处理完成',
    });
  });

  test('surfaces permission and error states with user-readable defaults', () => {
    const needsApproval = reducePetStatus(createInitialPetStatus(), {
      type: 'snapshot',
      snapshot: { phase: 'needs-approval', sessionId: 'session-2' },
    });
    expect(needsApproval.message).toBe('需要你确认权限');

    const error = reducePetStatus(needsApproval, {
      type: 'snapshot',
      snapshot: { phase: 'error', sessionId: 'session-2', error: 'Gateway disconnected' },
    });
    expect(error).toEqual({
      phase: 'error',
      sessionId: 'session-2',
      title: undefined,
      message: 'Gateway disconnected',
      error: 'Gateway disconnected',
    });
  });

  test('ignores malformed IPC snapshots instead of corrupting state', () => {
    const initial = createInitialPetStatus();

    const next = reducePetStatus(initial, {
      type: 'snapshot',
      snapshot: { phase: 'not-a-phase', message: 42 },
    });

    expect(next).toEqual(initial);
  });
});
