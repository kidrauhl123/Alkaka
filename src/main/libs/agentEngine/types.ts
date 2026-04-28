import type { OpenClawSessionPatch } from '../../../common/openclawSession';
import type { CoworkMessage } from '../../coworkStore';
import type { AgentEngine } from './constants';

/**
 * @deprecated Use `AgentEngine` (from `./constants`) instead. Kept as an alias
 * during the Phase 2 refactor for backward compatibility — will be removed
 * once all consumers migrate.
 */
export type CoworkAgentEngine = AgentEngine;

export type PermissionResult =
  | {
      behavior: 'allow';
      updatedInput?: Record<string, unknown>;
      updatedPermissions?: Record<string, unknown>[];
      toolUseID?: string;
    }
  | {
      behavior: 'deny';
      message: string;
      interrupt?: boolean;
      toolUseID?: string;
    };

export const ENGINE_SWITCHED_CODE = 'ENGINE_SWITCHED';

export interface PermissionRequest {
  requestId: string;
  toolName: string;
  toolInput: Record<string, unknown>;
  toolUseId?: string | null;
}

export interface CoworkRuntimeEvents {
  message: (sessionId: string, message: CoworkMessage) => void;
  messageUpdate: (sessionId: string, messageId: string, content: string) => void;
  permissionRequest: (sessionId: string, request: PermissionRequest) => void;
  complete: (sessionId: string, claudeSessionId: string | null) => void;
  error: (sessionId: string, error: string) => void;
  sessionStopped: (sessionId: string) => void;
}

export type CoworkImageAttachment = {
  name: string;
  mimeType: string;
  base64Data: string;
};

export type CoworkStartOptions = {
  skipInitialUserMessage?: boolean;
  skillIds?: string[];
  systemPrompt?: string;
  autoApprove?: boolean;
  workspaceRoot?: string;
  confirmationMode?: 'modal' | 'text';
  imageAttachments?: CoworkImageAttachment[];
  agentId?: string;
};

export type CoworkContinueOptions = {
  systemPrompt?: string;
  skillIds?: string[];
  imageAttachments?: CoworkImageAttachment[];
};

/**
 * Contract every agent engine adapter must implement.
 *
 * The router (`CoworkEngineRouter`) routes a session's lifecycle calls to
 * whichever engine is currently active. Implementations live in:
 *   - `openclawRuntimeAdapter.ts`  →  AgentEngine.OpenClaw
 *   - `hermesRuntimeAdapter.ts`    →  AgentEngine.Hermes (planned)
 *
 * Required surface:
 *   - lifecycle:   startSession / continueSession / stopSession / stopAllSessions
 *   - events:      message / messageUpdate / permissionRequest / complete /
 *                  error / sessionStopped (via EventEmitter `on` / `off`)
 *   - permission:  respondToPermission
 *   - introspection: isSessionActive / getSessionConfirmationMode
 *
 * Engine-specific (optional) features should stay optional and be fronted
 * by a capability check at the router or call site:
 *   - patchSession: OpenClaw only (model / thinking / reasoning patches).
 *   - onSessionDeleted: any engine that caches sessions can opt in.
 */
export interface AgentEngineProtocol {
  on<U extends keyof CoworkRuntimeEvents>(
    event: U,
    listener: CoworkRuntimeEvents[U],
  ): this;
  off<U extends keyof CoworkRuntimeEvents>(
    event: U,
    listener: CoworkRuntimeEvents[U],
  ): this;
  startSession(sessionId: string, prompt: string, options?: CoworkStartOptions): Promise<void>;
  continueSession(sessionId: string, prompt: string, options?: CoworkContinueOptions): Promise<void>;
  /**
   * Apply an in-flight session patch (e.g. switch model mid-session).
   * Engine-specific: only OpenClaw implements this today; Hermes does not.
   * Callers must check existence before invoking.
   */
  patchSession?(sessionId: string, patch: OpenClawSessionPatch): Promise<void>;
  stopSession(sessionId: string): void;
  stopAllSessions(): void;
  respondToPermission(requestId: string, result: PermissionResult): void;
  isSessionActive(sessionId: string): boolean;
  getSessionConfirmationMode(sessionId: string): 'modal' | 'text' | null;
  onSessionDeleted?(sessionId: string): void;
}

/**
 * @deprecated Historical name from when only OpenClaw existed. Use
 * `AgentEngineProtocol` going forward — they are the same type.
 */
export type CoworkRuntime = AgentEngineProtocol;
