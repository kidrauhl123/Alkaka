import { describe, expect, test, vi } from 'vitest';

import { AgentEngine } from './constants';
import { CoworkEngineRouter } from './coworkEngineRouter';
import type { CoworkRuntime } from './types';

function createRuntimeMock(): CoworkRuntime {
  return {
    on: vi.fn().mockReturnThis(),
    off: vi.fn().mockReturnThis(),
    startSession: vi.fn().mockResolvedValue(undefined),
    continueSession: vi.fn().mockResolvedValue(undefined),
    stopSession: vi.fn(),
    stopAllSessions: vi.fn(),
    respondToPermission: vi.fn(),
    isSessionActive: vi.fn().mockReturnValue(false),
    getSessionConfirmationMode: vi.fn().mockReturnValue(null),
    onSessionDeleted: vi.fn(),
  };
}

describe('CoworkEngineRouter', () => {
  test('routes stopSession to the openclaw runtime when no session engine is recorded', () => {
    const openclawRuntime = createRuntimeMock();
    const router = new CoworkEngineRouter({
      getCurrentEngine: () => AgentEngine.OpenClaw,
      runtimes: { [AgentEngine.OpenClaw]: openclawRuntime },
    });

    router.stopSession('missing-session');

    expect(openclawRuntime.stopSession).toHaveBeenCalledWith('missing-session');
  });

  test('startSession routes to the configured engine', async () => {
    const openclawRuntime = createRuntimeMock();
    const router = new CoworkEngineRouter({
      getCurrentEngine: () => AgentEngine.OpenClaw,
      runtimes: { [AgentEngine.OpenClaw]: openclawRuntime },
    });

    await router.startSession('s1', 'hello');

    expect(openclawRuntime.startSession).toHaveBeenCalledWith('s1', 'hello', {});
  });

  test('falls back to default engine when configured engine has no adapter', async () => {
    const openclawRuntime = createRuntimeMock();
    const router = new CoworkEngineRouter({
      // Hermes selected, but no Hermes adapter registered
      getCurrentEngine: () => AgentEngine.Hermes,
      runtimes: { [AgentEngine.OpenClaw]: openclawRuntime },
    });

    await router.startSession('s1', 'hi');

    expect(openclawRuntime.startSession).toHaveBeenCalledWith('s1', 'hi', {});
  });

  test('throws clear error when no runtimes are registered', async () => {
    const router = new CoworkEngineRouter({
      getCurrentEngine: () => AgentEngine.OpenClaw,
      runtimes: {},
    });

    await expect(router.startSession('s1', 'hi')).rejects.toThrow(/no adapter is registered/);
  });
});
