type PetTaskJumpPhase = 'idle' | 'ready' | 'sending' | 'working' | 'needs-approval' | 'error' | 'done';

interface PetTaskJumpStatus {
  phase: PetTaskJumpPhase;
  sessionId?: string;
  title?: string;
  message?: string;
}

export interface PetTaskJumpRequest {
  sessionId: string;
}

const TEMP_SESSION_PREFIX = 'temp-';

const normalizeSessionId = (sessionId?: string): string | null => {
  const normalized = sessionId?.trim();
  if (!normalized) return null;
  if (normalized.startsWith(TEMP_SESSION_PREFIX)) return null;
  return normalized;
};

export function hasOpenablePetSession(status: PetTaskJumpStatus): boolean {
  return normalizeSessionId(status.sessionId) !== null;
}

export function createPetTaskJumpRequest(status: PetTaskJumpStatus): PetTaskJumpRequest | null {
  const sessionId = normalizeSessionId(status.sessionId);
  return sessionId ? { sessionId } : null;
}

export function getPetTaskDetailButtonLabel(status: PetTaskJumpStatus): string {
  if (!hasOpenablePetSession(status)) return '打开主窗口';

  switch (status.phase) {
    case 'done':
      return '查看结果';
    case 'working':
    case 'sending':
    case 'needs-approval':
      return '查看任务';
    case 'ready':
      return '继续上次';
    case 'error':
    default:
      return '查看详情';
  }
}
