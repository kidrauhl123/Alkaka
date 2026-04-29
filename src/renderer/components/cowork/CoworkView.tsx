import React, { useEffect, useRef,useState } from 'react';
import { useDispatch,useSelector } from 'react-redux';

import { coworkService } from '../../services/cowork';
import { i18nService } from '../../services/i18n';
import { quickActionService } from '../../services/quickAction';
import { skillService } from '../../services/skill';
import { RootState } from '../../store';
import {
  selectCoworkConfig,
  selectCurrentSession,
  selectDraftPrompts,
  selectIsOpenClawEngine,
} from '../../store/selectors/coworkSelectors';
import { addMessage, clearCurrentSession, setCurrentSession, setDraftPrompt, setStreaming, updateSessionStatus } from '../../store/slices/coworkSlice';
import { clearSelection, setActions } from '../../store/slices/quickActionSlice';
import { clearActiveSkills } from '../../store/slices/skillSlice';
import type { CoworkImageAttachment, CoworkSession, OpenClawEngineStatus } from '../../types/cowork';
import AlkakaProjectChatHome from '../chat/AlkakaProjectChatHome';
import type { SettingsOpenOptions } from '../Settings';
import WindowTitleBar from '../window/WindowTitleBar';
import CoworkSessionDetail from './CoworkSessionDetail';

export interface CoworkViewProps {
  onRequestAppSettings?: (options?: SettingsOpenOptions) => void;
  onShowSkills?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  onNewChat?: () => void;
  onSearchHistory?: () => void;
  updateBadge?: React.ReactNode;
  petOpenedSessionId?: string | null;
}

const CoworkView: React.FC<CoworkViewProps> = ({ onRequestAppSettings, onShowSkills, isSidebarCollapsed, onToggleSidebar, onNewChat, updateBadge, petOpenedSessionId }) => {
  const dispatch = useDispatch();
  const [isInitialized, setIsInitialized] = useState(false);
  const [openClawStatus, setOpenClawStatus] = useState<OpenClawEngineStatus | null>(null);
  const [isRestartingGateway, setIsRestartingGateway] = useState(false);
  const [isComposerRequested, setIsComposerRequested] = useState(false);
  // Track if we're starting/continuing a session to prevent duplicate submissions
  const isStartingRef = useRef(false);
  const isContinuingRef = useRef(false);
  // Track pending start request so stop can cancel delayed startup.
  const pendingStartRef = useRef<{
    requestId: number;
    cancelled: boolean;
    cancellationAction: 'stop' | 'delete' | null;
  } | null>(null);
  const startRequestIdRef = useRef(0);

  const currentSession = useSelector(selectCurrentSession);
  const homeDraftPrompt = useSelector((state: RootState) => selectDraftPrompts(state).__home__ || '');
  const config = useSelector(selectCoworkConfig);
  const isOpenClawEngine = useSelector(selectIsOpenClawEngine);

  const activeSkillIds = useSelector((state: RootState) => state.skill.activeSkillIds);
  const currentAgentId = useSelector((state: RootState) => state.agent.currentAgentId);

  const buildApiConfigNotice = (error?: string): { noticeI18nKey: string; noticeExtra?: string } => {
    const key = 'coworkModelSettingsRequired';
    if (!error) {
      return { noticeI18nKey: key };
    }
    const normalizedError = error.trim();
    if (
      normalizedError.startsWith('No enabled provider found for model:')
      || normalizedError === 'No available model configured in enabled providers.'
    ) {
      return { noticeI18nKey: key };
    }
    return { noticeI18nKey: key, noticeExtra: error };
  };

  const resolveEngineStatusText = (status: OpenClawEngineStatus): string => {
    switch (status.phase) {
      case 'not_installed':
        return i18nService.t('coworkOpenClawNotInstalledNotice');
      case 'installing':
        return i18nService.t('coworkOpenClawInstalling');
      case 'ready':
        return i18nService.t('coworkOpenClawReadyNotice');
      case 'starting':
        return i18nService.t('coworkOpenClawStarting');
      case 'error':
        return i18nService.t('coworkOpenClawError');
      case 'running':
      default:
        return i18nService.t('coworkOpenClawRunning');
    }
  };

  const isOpenClawReadyForSession = (status: OpenClawEngineStatus | null): boolean => {
    if (!status) return false;
    return status.phase === 'running' || status.phase === 'ready';
  };

  const handleRestartGateway = async () => {
    if (isRestartingGateway) return;
    setIsRestartingGateway(true);
    try {
      await coworkService.restartOpenClawGateway();
    } catch (error) {
      console.error('[CoworkView] Failed to restart gateway:', error);
    } finally {
      setIsRestartingGateway(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await coworkService.init();
      const initialEngineStatus = await coworkService.getOpenClawEngineStatus();
      if (initialEngineStatus) {
        setOpenClawStatus(initialEngineStatus);
      }
      // Load quick actions with localization
      try {
        quickActionService.initialize();
        const actions = await quickActionService.getLocalizedActions();
        dispatch(setActions(actions));
      } catch (error) {
        console.error('Failed to load quick actions:', error);
      }
      try {
        const apiConfig = await coworkService.checkApiConfig();
        if (apiConfig && !apiConfig.hasConfig) {
          onRequestAppSettings?.({
            initialTab: 'model',
            ...buildApiConfigNotice(apiConfig.error),
          });
        }
      } catch (error) {
        console.error('Failed to check cowork API config:', error);
      }
      setIsInitialized(true);
    };
    init();

    const unsubscribeOpenClawStatus = coworkService.onOpenClawEngineStatus((status) => {
      setOpenClawStatus(status);
    });

    // Subscribe to language changes to reload quick actions
    const unsubscribe = quickActionService.subscribe(async () => {
      try {
        const actions = await quickActionService.getLocalizedActions();
        dispatch(setActions(actions));
      } catch (error) {
        console.error('Failed to reload quick actions:', error);
      }
    });

    return () => {
      unsubscribe();
      unsubscribeOpenClawStatus();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const handleStartSession = async (prompt: string, skillPrompt?: string, imageAttachments?: CoworkImageAttachment[]): Promise<boolean | void> => {
    console.log('[CoworkView] handleStartSession: imageAttachments diagnosis', {
      hasImageAttachments: !!imageAttachments,
      count: imageAttachments?.length ?? 0,
      details: imageAttachments?.map(a => ({ name: a.name, mimeType: a.mimeType, base64Length: a.base64Data?.length ?? 0 })) ?? [],
    });
    if (isOpenClawEngine && openClawStatus && !isOpenClawReadyForSession(openClawStatus)) {
      window.dispatchEvent(new CustomEvent('app:showToast', { detail: i18nService.t('coworkErrorEngineNotReady') }));
      return false;
    }
    // Prevent duplicate submissions
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    const requestId = ++startRequestIdRef.current;
    pendingStartRef.current = { requestId, cancelled: false, cancellationAction: null };
    const isPendingStartCancelled = () => {
      const pending = pendingStartRef.current;
      return !pending || pending.requestId !== requestId || pending.cancelled;
    };
    const getPendingCancellationAction = () => {
      const pending = pendingStartRef.current;
      if (!pending || pending.requestId !== requestId || !pending.cancelled) {
        return null;
      }
      return pending.cancellationAction;
    };

    try {
      try {
        const apiConfig = await coworkService.checkApiConfig();
        if (apiConfig && !apiConfig.hasConfig) {
          onRequestAppSettings?.({
            initialTab: 'model',
            ...buildApiConfigNotice(apiConfig.error),
          });
          isStartingRef.current = false;
          return;
        }
      } catch (error) {
        console.error('Failed to check cowork API config:', error);
      }

      // Create a temporary session with user message to show immediately
      const tempSessionId = `temp-${Date.now()}`;
      const fallbackTitle = prompt.split('\n')[0].slice(0, 50) || i18nService.t('coworkNewSession');
      const now = Date.now();

      // Capture active skill IDs before clearing them
      const sessionSkillIds = [...activeSkillIds];

      const tempSession: CoworkSession = {
        id: tempSessionId,
        title: fallbackTitle,
        claudeSessionId: null,
        status: 'running',
        pinned: false,
        createdAt: now,
        updatedAt: now,
        cwd: config.workingDirectory || '',
        systemPrompt: '',
        modelOverride: '',
        executionMode: config.executionMode || 'local',
        activeSkillIds: sessionSkillIds,
        agentId: currentAgentId,
        messages: [
          {
            id: `msg-${now}`,
            type: 'user',
            content: prompt,
            timestamp: now,
            metadata: (sessionSkillIds.length > 0 || (imageAttachments && imageAttachments.length > 0))
              ? {
                ...(sessionSkillIds.length > 0 ? { skillIds: sessionSkillIds } : {}),
                ...(imageAttachments && imageAttachments.length > 0 ? { imageAttachments } : {}),
              }
              : undefined,
          },
        ],
      };

      // Immediately show the session detail page with user message
      dispatch(setCurrentSession(tempSession));
      dispatch(setStreaming(true));

      // Clear active skills and quick action selection after starting session
      // so they don't persist to next session
      dispatch(clearActiveSkills());
      dispatch(clearSelection());

      // Combine skill prompt with system prompt.
      // OpenClaw loads skills natively via skills.load.extraDirs, so skip the
      // auto-routing prompt to avoid injecting Claude SDK tool-calling instructions
      // that confuse non-Claude models (e.g. kimi-k2.5 falls back to text-based
      // tool calls, producing empty tool names and err=true failures).
      let effectiveSkillPrompt = skillPrompt;
      if (!skillPrompt && !isOpenClawEngine) {
        effectiveSkillPrompt = await skillService.getAutoRoutingPrompt() || undefined;
      }
      const combinedSystemPrompt = [effectiveSkillPrompt, config.systemPrompt]
        .filter(p => p?.trim())
        .join('\n\n') || undefined;

      // Start the actual session immediately with fallback title
      const { session: startedSession, error: startError } = await coworkService.startSession({
        prompt,
        title: fallbackTitle,
        cwd: config.workingDirectory || undefined,
        systemPrompt: combinedSystemPrompt,
        activeSkillIds: sessionSkillIds,
        agentId: currentAgentId,
        imageAttachments,
      });

      if (!startedSession && startError) {
        // Show the error as a system message in the temp session
        dispatch(addMessage({
          sessionId: tempSessionId,
          message: {
            id: `error-${Date.now()}`,
            type: 'system',
            content: i18nService.t('coworkErrorSessionStartFailed').replace('{error}', startError),
            timestamp: Date.now(),
          },
        }));
        dispatch(updateSessionStatus({ sessionId: tempSessionId, status: 'error' }));
        return;
      }

      // Generate title in the background and update when ready
      if (startedSession) {
        coworkService.generateSessionTitle(prompt).then(generatedTitle => {
          const betterTitle = generatedTitle?.trim();
          if (betterTitle && betterTitle !== fallbackTitle) {
            coworkService.renameSession(startedSession.id, betterTitle);
          }
        }).catch(error => {
          console.error('Failed to generate cowork session title:', error);
        });
      }

      // Stop immediately if user cancelled while startup request was in flight.
      if (isPendingStartCancelled() && startedSession) {
        await coworkService.stopSession(startedSession.id);
        if (getPendingCancellationAction() === 'delete') {
          await coworkService.deleteSession(startedSession.id);
        }
      }
    } finally {
      if (pendingStartRef.current?.requestId === requestId) {
        pendingStartRef.current = null;
      }
      isStartingRef.current = false;
    }
  };

  const handleContinueSession = async (prompt: string, skillPrompt?: string, imageAttachments?: CoworkImageAttachment[]) => {
    if (!currentSession) return;
    // Prevent duplicate submissions
    if (isContinuingRef.current) return;
    if (isOpenClawEngine && openClawStatus && !isOpenClawReadyForSession(openClawStatus)) {
      window.dispatchEvent(new CustomEvent('app:showToast', { detail: i18nService.t('coworkErrorEngineNotReady') }));
      return false;
    }

    isContinuingRef.current = true;
    try {
      console.log('[CoworkView] handleContinueSession called', {
        hasImageAttachments: !!imageAttachments,
        imageAttachmentsCount: imageAttachments?.length ?? 0,
        imageAttachmentsNames: imageAttachments?.map(a => a.name),
        imageAttachmentsBase64Lengths: imageAttachments?.map(a => a.base64Data.length),
      });

      // Capture active skill IDs before clearing
      const sessionSkillIds = [...activeSkillIds];

      // Clear active skills after capturing so they don't persist to next message
      if (sessionSkillIds.length > 0) {
        dispatch(clearActiveSkills());
      }

      // Combine skill prompt with system prompt for continuation.
      // Skip auto-routing prompt for OpenClaw — skills are loaded natively.
      let effectiveSkillPrompt = skillPrompt;
      if (!skillPrompt && !isOpenClawEngine) {
        effectiveSkillPrompt = await skillService.getAutoRoutingPrompt() || undefined;
      }
      const combinedSystemPrompt = [effectiveSkillPrompt, config.systemPrompt]
        .filter(p => p?.trim())
        .join('\n\n') || undefined;

      await coworkService.continueSession({
        sessionId: currentSession.id,
        prompt,
        systemPrompt: combinedSystemPrompt,
        activeSkillIds: sessionSkillIds.length > 0 ? sessionSkillIds : undefined,
        imageAttachments,
      });
    } finally {
      isContinuingRef.current = false;
    }
  };

  const handleStopSession = async () => {
    if (!currentSession) return;
    if (currentSession.id.startsWith('temp-') && pendingStartRef.current) {
      pendingStartRef.current.cancelled = true;
      pendingStartRef.current.cancellationAction = 'stop';
    }
    await coworkService.stopSession(currentSession.id);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (sessionId.startsWith('temp-') && pendingStartRef.current) {
      pendingStartRef.current.cancelled = true;
      pendingStartRef.current.cancellationAction = 'delete';
    }
    await coworkService.deleteSession(sessionId);
  };

  useEffect(() => {
    if (currentSession) {
      setIsComposerRequested(false);
    }
  }, [currentSession]);

  useEffect(() => {
    const handleNewSession = () => {
      // Only clear when already on home (no session) — preserve __home__ draft when returning from a session
      const shouldClear = !currentSession;
      setIsComposerRequested(true);
      dispatch(clearCurrentSession());
      dispatch(clearSelection());
      window.dispatchEvent(new CustomEvent('cowork:focus-input', {
        detail: { clear: shouldClear },
      }));
    };
    window.addEventListener('cowork:shortcut:new-session', handleNewSession);
    return () => {
      window.removeEventListener('cowork:shortcut:new-session', handleNewSession);
    };
  }, [dispatch, currentSession]);

  useEffect(() => {
    if (!isOpenClawEngine) return;
    if (!currentSession || currentSession.status !== 'running') return;

    const runningSessionId = currentSession.id;
    const handleWindowFocus = () => {
      void coworkService.loadSession(runningSessionId);
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [currentSession, isOpenClawEngine]);

  useEffect(() => {
    const handleFocusInput = (event: Event) => {
      if (currentSession) return;

      const detail = (event as CustomEvent<{ clear?: boolean }>).detail;
      if (detail?.clear) {
        dispatch(setDraftPrompt({ sessionId: '__home__', draft: '' }));
      }
      setIsComposerRequested(true);
    };

    window.addEventListener('cowork:focus-input', handleFocusInput);
    return () => {
      window.removeEventListener('cowork:focus-input', handleFocusInput);
    };
  }, [currentSession, dispatch]);

  if (!isInitialized) {
    return (
      <div className="flex-1 h-full flex flex-col bg-background">
        <div className="draggable flex h-12 items-center justify-end px-4 border-b border-border shrink-0">
          <WindowTitleBar inline />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-secondary">
            {i18nService.t('loading')}
          </div>
        </div>
      </div>
    );
  }

  const shouldShowEngineStatus = Boolean(isOpenClawEngine && openClawStatus && openClawStatus.phase !== 'running');
  const isEngineError = openClawStatus?.phase === 'error';
  // Engine status banner for error/non-running states (starting overlay is now global in App.tsx)
  const engineStatusBanner = shouldShowEngineStatus && openClawStatus && openClawStatus.phase !== 'starting' ? (
    <div className={`shrink-0 flex items-center justify-between px-4 py-2 text-xs ${isEngineError
      ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300'
      : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300'
    }`}>
      <div className="flex items-center gap-2">
        <span>{resolveEngineStatusText(openClawStatus)}</span>
        {typeof openClawStatus.progressPercent === 'number' && (
          <span className="opacity-70">({Math.round(openClawStatus.progressPercent)}%)</span>
        )}
      </div>
      <button
        type="button"
        onClick={handleRestartGateway}
        disabled={isRestartingGateway}
        className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isEngineError
          ? 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600'
          : 'bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600'
        }`}
      >
        {i18nService.t('coworkOpenClawRestartGateway')}
      </button>
    </div>
  ) : null;

  // When there's a current session, show the session detail view
  if (currentSession) {
    const openedFromPet = petOpenedSessionId === currentSession.id;
    return (
      <div className="flex-1 flex flex-col h-full">
        {engineStatusBanner}
        {openedFromPet ? (
          <div className="shrink-0 px-4 py-2 text-xs bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-200 border-b border-amber-200/70 dark:border-amber-800/50">
            🐣 从桌宠快速对话跳转而来
          </div>
        ) : null}
        <CoworkSessionDetail
          onManageSkills={() => onShowSkills?.()}
          onContinue={handleContinueSession}
          onStop={handleStopSession}
          onDeleteSession={handleDeleteSession}
          onNavigateHome={() => dispatch(clearCurrentSession())}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={onToggleSidebar}
          onNewChat={onNewChat}
          updateBadge={updateBadge}
        />
      </div>
    );
  }

  // Home view - no current session. This intentionally replaces the old Cowork landing card with
  // the reference-image Alkaka Chat workspace: three columns, project group chat, and AI team dashboard.
  return (
    <div className="relative flex h-full flex-1 flex-col overflow-hidden">
      {engineStatusBanner}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div className="draggable pointer-events-none absolute right-2 top-2 z-20 flex items-center rounded-xl bg-white/70 px-1.5 py-1 shadow-sm backdrop-blur">
          <div className="non-draggable pointer-events-auto">
            <WindowTitleBar inline />
          </div>
        </div>
        <AlkakaProjectChatHome
          composerValue={homeDraftPrompt}
          onComposerChange={(draft) => dispatch(setDraftPrompt({ sessionId: '__home__', draft }))}
          onRequestNewChat={() => {
            dispatch(setDraftPrompt({ sessionId: '__home__', draft: '' }));
            onNewChat?.();
            setIsComposerRequested(true);
          }}
          shouldFocusComposer={isComposerRequested || homeDraftPrompt.trim().length > 0}
          onSubmitMessage={(message) => handleStartSession(message)}
        />
      </div>
    </div>
  );
};

export default CoworkView;
