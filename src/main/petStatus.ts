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

export interface PetRecentSessionSummary {
  id?: string;
  title?: string;
  status?: string;
  updatedAt?: number;
  pinned?: boolean;
}

const MAX_TITLE_LENGTH = 50;
const MAX_MESSAGE_LENGTH = 160;

const DEFAULT_MESSAGES: Record<PetStatusPhase, string> = {
  idle: '点我开始',
  ready: '准备好对话',
  sending: '正在发给 Alkaka…',
  working: 'Alkaka 正在处理…',
  'needs-approval': '需要你确认权限',
  error: 'AI 对话遇到问题',
  done: '处理完成',
};

const USER_VISIBLE_ERROR_MESSAGE = DEFAULT_MESSAGES.error;

function truncate(value: string | undefined, maxLength: number): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

function getOpenableSessionsByRecency(sessions: PetRecentSessionSummary[]): PetRecentSessionSummary[] {
  return sessions
    .filter((session) => {
      const id = truncate(session.id, MAX_TITLE_LENGTH);
      return Boolean(id && !id.startsWith('temp-'));
    })
    .sort((left, right) => (right.updatedAt ?? 0) - (left.updatedAt ?? 0));
}

function getLatestOpenableSession(sessions: PetRecentSessionSummary[]): PetRecentSessionSummary | undefined {
  return getOpenableSessionsByRecency(sessions)[0];
}

export function createPetStatusSnapshot(input: PetStatusSnapshot): PetStatusSnapshot {
  const error = truncate(input.error, MAX_MESSAGE_LENGTH);
  const explicitMessage = truncate(input.message, MAX_MESSAGE_LENGTH);
  const message = input.phase === 'error'
    ? (explicitMessage || USER_VISIBLE_ERROR_MESSAGE)
    : (explicitMessage || DEFAULT_MESSAGES[input.phase] || DEFAULT_MESSAGES.idle);

  return {
    phase: input.phase,
    sessionId: truncate(input.sessionId, MAX_TITLE_LENGTH),
    title: truncate(input.title, MAX_TITLE_LENGTH),
    message,
    error,
  };
}

export function createPetReadyStatusFromRecentSessions(sessions: PetRecentSessionSummary[]): PetStatusSnapshot {
  const recentSession = getLatestOpenableSession(sessions);

  return createPetStatusSnapshot({
    phase: 'ready',
    sessionId: recentSession ? truncate(recentSession.id, MAX_TITLE_LENGTH) : undefined,
    title: recentSession ? truncate(recentSession.title, MAX_TITLE_LENGTH) : undefined,
  });
}

export function createPetStatusFromCoworkActivity(sessions: PetRecentSessionSummary[]): PetStatusSnapshot {
  const openableSessions = getOpenableSessionsByRecency(sessions);
  const runningSession = openableSessions.find((session) => session.status === 'running');
  if (runningSession) {
    return createPetStatusSnapshot({
      phase: 'working',
      sessionId: truncate(runningSession.id, MAX_TITLE_LENGTH),
      title: truncate(runningSession.title, MAX_TITLE_LENGTH),
    });
  }

  const errorSession = openableSessions.find((session) => session.status === 'error');
  if (errorSession) {
    return createPetStatusSnapshot({
      phase: 'error',
      sessionId: truncate(errorSession.id, MAX_TITLE_LENGTH),
      title: truncate(errorSession.title, MAX_TITLE_LENGTH),
    });
  }

  return createPetReadyStatusFromRecentSessions(openableSessions);
}
