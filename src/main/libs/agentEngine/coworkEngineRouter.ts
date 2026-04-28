import { EventEmitter } from 'events';

import type { OpenClawSessionPatch } from '../../../common/openclawSession';
import { AgentEngine, DEFAULT_AGENT_ENGINE } from './constants';
import type {
  AgentEngineProtocol,
  CoworkAgentEngine,
  CoworkContinueOptions,
  CoworkRuntime,
  CoworkRuntimeEvents,
  CoworkStartOptions,
  PermissionResult,
} from './types';
import { ENGINE_SWITCHED_CODE } from './types';

/**
 * Map of engine identifier → adapter implementation. Engines that are not
 * yet implemented (or runtime not installed) can be left out; the router
 * gracefully falls back to whichever engine is registered.
 */
export type AgentEngineRuntimeMap = Partial<Record<CoworkAgentEngine, AgentEngineProtocol>>;

type RouterDeps = {
  getCurrentEngine: () => CoworkAgentEngine;
  /** Registered engine adapters, keyed by engine identifier. */
  runtimes: AgentEngineRuntimeMap;
};

/**
 * Routes Cowork session lifecycle calls to the engine that owns the session.
 *
 * Selection rules:
 *   1. New sessions are routed to the *currently configured* engine
 *      (`getCurrentEngine()`), provided that engine is registered.
 *   2. If the configured engine has no registered adapter, the router falls
 *      back to the first available engine (preferring `DEFAULT_AGENT_ENGINE`).
 *   3. Existing sessions are routed by their recorded engine — switching the
 *      configured engine does not migrate already-running sessions; instead
 *      they are stopped and the renderer is notified via `ENGINE_SWITCHED_CODE`.
 */
export class CoworkEngineRouter extends EventEmitter implements CoworkRuntime {
  private readonly getCurrentEngine: () => CoworkAgentEngine;
  private readonly runtimes: AgentEngineRuntimeMap;
  private readonly sessionEngine = new Map<string, CoworkAgentEngine>();
  private readonly requestEngine = new Map<string, CoworkAgentEngine>();
  private readonly requestSession = new Map<string, string>();
  private currentEngine: CoworkAgentEngine;

  constructor(deps: RouterDeps) {
    super();
    this.getCurrentEngine = deps.getCurrentEngine;
    this.runtimes = deps.runtimes;
    this.currentEngine = this.safeResolveEngine();

    for (const [engine, runtime] of Object.entries(this.runtimes) as Array<[CoworkAgentEngine, AgentEngineProtocol]>) {
      if (runtime) this.bindRuntimeEvents(engine, runtime);
    }
  }

  override on<U extends keyof CoworkRuntimeEvents>(
    event: U,
    listener: CoworkRuntimeEvents[U],
  ): this {
    return super.on(event, listener);
  }

  override off<U extends keyof CoworkRuntimeEvents>(
    event: U,
    listener: CoworkRuntimeEvents[U],
  ): this {
    return super.off(event, listener);
  }

  async startSession(sessionId: string, prompt: string, options: CoworkStartOptions = {}): Promise<void> {
    const engine = this.safeResolveEngine();
    const runtime = this.requireRuntime(engine);
    this.sessionEngine.set(sessionId, engine);
    try {
      await runtime.startSession(sessionId, prompt, options);
    } catch (error) {
      this.sessionEngine.delete(sessionId);
      this.clearRequestEngineBySession(sessionId);
      throw error;
    }
  }

  async continueSession(sessionId: string, prompt: string, options: CoworkContinueOptions = {}): Promise<void> {
    // Continue routes to whichever engine owns the session, falling back to
    // the configured engine if we have no record of this session.
    const engine = this.sessionEngine.get(sessionId) ?? this.safeResolveEngine();
    const runtime = this.requireRuntime(engine);
    this.sessionEngine.set(sessionId, engine);
    try {
      await runtime.continueSession(sessionId, prompt, options);
    } catch (error) {
      this.sessionEngine.delete(sessionId);
      this.clearRequestEngineBySession(sessionId);
      throw error;
    }
  }

  async patchSession(sessionId: string, patch: OpenClawSessionPatch): Promise<void> {
    const engine = this.sessionEngine.get(sessionId) ?? this.safeResolveEngine();
    const runtime = this.requireRuntime(engine);
    this.sessionEngine.set(sessionId, engine);
    if (!runtime.patchSession) {
      throw new Error(`Session patch is not supported by engine: ${engine}`);
    }
    await runtime.patchSession(sessionId, patch);
  }

  stopSession(sessionId: string): void {
    const engine = this.sessionEngine.get(sessionId);
    if (engine) {
      this.runtimes[engine]?.stopSession(sessionId);
    } else {
      // No record of this session; broadcast stop to all known runtimes.
      for (const runtime of Object.values(this.runtimes)) {
        runtime?.stopSession(sessionId);
      }
    }
    this.sessionEngine.delete(sessionId);
    this.clearRequestEngineBySession(sessionId);
  }

  stopAllSessions(): void {
    for (const runtime of Object.values(this.runtimes)) {
      runtime?.stopAllSessions();
    }
    this.sessionEngine.clear();
    this.requestEngine.clear();
    this.requestSession.clear();
  }

  respondToPermission(requestId: string, result: PermissionResult): void {
    const engine = this.requestEngine.get(requestId);
    const runtime = engine ? this.runtimes[engine] : undefined;
    if (runtime) {
      runtime.respondToPermission(requestId, result);
      if (result.behavior === 'allow' || result.behavior === 'deny') {
        this.requestEngine.delete(requestId);
        this.requestSession.delete(requestId);
      }
      return;
    }
    // Unknown request — broadcast so any engine that holds the request can
    // resolve it. Cheap because pending permissions are rare.
    for (const r of Object.values(this.runtimes)) {
      r?.respondToPermission(requestId, result);
    }
  }

  isSessionActive(sessionId: string): boolean {
    const engine = this.sessionEngine.get(sessionId);
    if (engine) {
      return this.runtimes[engine]?.isSessionActive(sessionId) ?? false;
    }
    // No recorded engine — ask each registered runtime.
    return Object.values(this.runtimes).some((r) => r?.isSessionActive(sessionId));
  }

  getSessionConfirmationMode(sessionId: string): 'modal' | 'text' | null {
    const engine = this.sessionEngine.get(sessionId);
    if (engine) {
      return this.runtimes[engine]?.getSessionConfirmationMode(sessionId) ?? null;
    }
    for (const r of Object.values(this.runtimes)) {
      const mode = r?.getSessionConfirmationMode(sessionId);
      if (mode) return mode;
    }
    return null;
  }

  onSessionDeleted(sessionId: string): void {
    const engine = this.sessionEngine.get(sessionId);
    this.sessionEngine.delete(sessionId);
    this.clearRequestEngineBySession(sessionId);
    if (engine) {
      this.runtimes[engine]?.onSessionDeleted?.(sessionId);
    } else {
      for (const r of Object.values(this.runtimes)) {
        r?.onSessionDeleted?.(sessionId);
      }
    }
  }

  /**
   * Notify the router that the user changed `agentEngine` in the config.
   * Active sessions on the previous engine are stopped and the renderer is
   * informed via `ENGINE_SWITCHED_CODE`.
   */
  handleEngineConfigChanged(nextEngine: CoworkAgentEngine): void {
    if (nextEngine === this.currentEngine) {
      return;
    }

    this.currentEngine = nextEngine;
    const activeSessionIds: string[] = [];
    for (const [sessionId, sessionEngine] of this.sessionEngine.entries()) {
      const runtime = this.runtimes[sessionEngine];
      if (runtime?.isSessionActive(sessionId)) {
        activeSessionIds.push(sessionId);
      }
    }
    this.stopAllSessions();

    activeSessionIds.forEach((sessionId) => {
      this.emit('error', sessionId, ENGINE_SWITCHED_CODE);
    });
  }

  private bindRuntimeEvents(engine: CoworkAgentEngine, runtime: AgentEngineProtocol): void {
    runtime.on('message', (sessionId, message) => {
      this.sessionEngine.set(sessionId, engine);
      this.emit('message', sessionId, message);
    });

    runtime.on('messageUpdate', (sessionId, messageId, content) => {
      this.sessionEngine.set(sessionId, engine);
      this.emit('messageUpdate', sessionId, messageId, content);
    });

    runtime.on('permissionRequest', (sessionId, request) => {
      this.sessionEngine.set(sessionId, engine);
      this.requestEngine.set(request.requestId, engine);
      this.requestSession.set(request.requestId, sessionId);
      this.emit('permissionRequest', sessionId, request);
    });

    runtime.on('complete', (sessionId, claudeSessionId) => {
      this.sessionEngine.delete(sessionId);
      this.clearRequestEngineBySession(sessionId);
      this.emit('complete', sessionId, claudeSessionId);
    });

    runtime.on('error', (sessionId, error) => {
      this.sessionEngine.delete(sessionId);
      this.clearRequestEngineBySession(sessionId);
      this.emit('error', sessionId, error);
    });

    runtime.on('sessionStopped', (sessionId) => {
      this.emit('sessionStopped', sessionId);
    });
  }

  private clearRequestEngineBySession(sessionId: string): void {
    for (const [requestId, requestSessionId] of this.requestSession.entries()) {
      if (requestSessionId !== sessionId) continue;
      this.requestSession.delete(requestId);
      this.requestEngine.delete(requestId);
    }
  }

  /** Returns a runtime for the engine, or throws an informative error. */
  private requireRuntime(engine: CoworkAgentEngine): AgentEngineProtocol {
    const runtime = this.runtimes[engine];
    if (!runtime) {
      throw new Error(
        `Agent engine "${engine}" is selected but no adapter is registered. ` +
        `Available engines: ${Object.keys(this.runtimes).join(', ') || '(none)'}.`,
      );
    }
    return runtime;
  }

  /**
   * Resolve the engine to use for new sessions. Falls back when the
   * configured engine has no adapter — prefers the default engine, then any
   * registered engine.
   */
  private safeResolveEngine(): CoworkAgentEngine {
    const requested = this.getCurrentEngine();
    if (this.runtimes[requested]) {
      this.currentEngine = requested;
      return requested;
    }
    if (this.runtimes[DEFAULT_AGENT_ENGINE]) {
      this.currentEngine = DEFAULT_AGENT_ENGINE;
      return DEFAULT_AGENT_ENGINE;
    }
    const firstRegistered = Object.keys(this.runtimes)[0] as CoworkAgentEngine | undefined;
    if (!firstRegistered) {
      // Should never happen in production — main wires at least openclaw.
      // Returning the default keeps the type narrow; callers that try to use
      // it will hit `requireRuntime` and get a clear error.
      return DEFAULT_AGENT_ENGINE;
    }
    this.currentEngine = firstRegistered;
    return firstRegistered;
  }
}

// Re-export for backward compat with anything importing AgentEngine from the
// router (kept narrow — the canonical home is `./constants`).
export { AgentEngine };
