export type PetStatusPhase =
  | 'idle'
  | 'ready'
  | 'sending'
  | 'working'
  | 'needs-approval'
  | 'error'
  | 'done';

export interface PetStatusSnapshot {
  phase: PetStatusPhase;
  sessionId?: string;
  title?: string;
  message?: string;
  error?: string;
}

export type PetStatusEvent =
  | { type: 'quick-task-started'; sessionId: string; title: string }
  | { type: 'snapshot'; snapshot: unknown }
  | { type: 'reset' };

const PET_STATUS_PHASES = new Set<PetStatusPhase>([
  'idle',
  'ready',
  'sending',
  'working',
  'needs-approval',
  'error',
  'done',
]);

const DEFAULT_MESSAGES: Record<PetStatusPhase, string> = {
  idle: '点我开始',
  ready: '准备好对话',
  sending: '正在发给 Alkaka…',
  working: 'Alkaka 正在处理…',
  'needs-approval': '需要你确认权限',
  error: 'AI 对话遇到问题',
  done: '处理完成',
};

export function createInitialPetStatus(): PetStatusSnapshot {
  return {
    phase: 'idle',
    message: DEFAULT_MESSAGES.idle,
  };
}

function truncate(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

export function sanitizePetStatusSnapshot(snapshot: unknown): PetStatusSnapshot | null {
  if (!snapshot || typeof snapshot !== 'object') return null;
  const candidate = snapshot as Partial<Record<keyof PetStatusSnapshot, unknown>>;
  if (typeof candidate.phase !== 'string' || !PET_STATUS_PHASES.has(candidate.phase as PetStatusPhase)) {
    return null;
  }

  return {
    phase: candidate.phase as PetStatusPhase,
    sessionId: truncate(candidate.sessionId, 50),
    title: truncate(candidate.title, 50),
    message: truncate(candidate.message, 160),
    error: truncate(candidate.error, 160),
  };
}

export function normalizePetStatusSnapshot(snapshot: PetStatusSnapshot): PetStatusSnapshot {
  const message = snapshot.message
    || snapshot.error
    || DEFAULT_MESSAGES[snapshot.phase]
    || DEFAULT_MESSAGES.idle;

  return {
    phase: snapshot.phase,
    sessionId: snapshot.sessionId,
    title: snapshot.title,
    message,
    error: snapshot.error,
  };
}

export function reducePetStatus(current: PetStatusSnapshot, event: PetStatusEvent): PetStatusSnapshot {
  if (event.type === 'reset') {
    return createInitialPetStatus();
  }

  if (event.type === 'quick-task-started') {
    return normalizePetStatusSnapshot({
      phase: 'sending',
      sessionId: event.sessionId,
      title: event.title,
    });
  }

  if (event.type === 'snapshot') {
    const snapshot = sanitizePetStatusSnapshot(event.snapshot);
    if (!snapshot) return current;
    return normalizePetStatusSnapshot({
      ...snapshot,
      sessionId: snapshot.sessionId ?? current.sessionId,
      title: snapshot.title ?? current.title,
    });
  }

  return current;
}
