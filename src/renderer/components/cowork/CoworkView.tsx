import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useRef,useState } from 'react';
import { useDispatch,useSelector } from 'react-redux';

import { agentService } from '../../services/agent';
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
  selectIsStreaming,
} from '../../store/selectors/coworkSelectors';
import { addMessage, clearCurrentSession, setCurrentSession, setStreaming, updateSessionStatus } from '../../store/slices/coworkSlice';
import { clearSelection,selectAction, setActions } from '../../store/slices/quickActionSlice';
import { clearActiveSkills, setActiveSkillIds } from '../../store/slices/skillSlice';
import type { CoworkImageAttachment, CoworkSession, OpenClawEngineStatus } from '../../types/cowork';
import { toOpenClawModelRef } from '../../utils/openclawModelRef';
import ComposeIcon from '../icons/ComposeIcon';
import SidebarToggleIcon from '../icons/SidebarToggleIcon';
import ModelSelector from '../ModelSelector';
import { PromptPanel,QuickActionBar } from '../quick-actions';
import type { SettingsOpenOptions } from '../Settings';
import WindowTitleBar from '../window/WindowTitleBar';
import { resolveAgentModelSelection } from './agentModelSelection';
import CoworkPromptInput, { type CoworkPromptInputRef } from './CoworkPromptInput';
import CoworkSessionDetail from './CoworkSessionDetail';
import {
  buildMainWindowLiteActions,
  getMainWindowHomeCopy,
  shouldShowComposerOnMainWindowHome,
  type MainWindowLiteActionId,
} from './mainWindowLiteNav';

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
  const isMac = window.electron.platform === 'darwin';
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
  // Ref for CoworkPromptInput
  const promptInputRef = useRef<CoworkPromptInputRef>(null);

  const currentSession = useSelector(selectCurrentSession);
  const homeDraftPrompt = useSelector((state: RootState) => selectDraftPrompts(state).__home__ || '');
  const isStreaming = useSelector(selectIsStreaming);
  const config = useSelector(selectCoworkConfig);
  const isOpenClawEngine = useSelector(selectIsOpenClawEngine);

  const activeSkillIds = useSelector((state: RootState) => state.skill.activeSkillIds);
  const skills = useSelector((state: RootState) => state.skill.skills);
  const quickActions = useSelector((state: RootState) => state.quickAction.actions);
  const selectedActionId = useSelector((state: RootState) => state.quickAction.selectedActionId);
  const currentAgentId = useSelector((state: RootState) => state.agent.currentAgentId);
  const agents = useSelector((state: RootState) => state.agent.agents);
  const availableModels = useSelector((state: RootState) => state.model.availableModels);
  const globalSelectedModel = useSelector((state: RootState) => state.model.selectedModel);
  const currentAgent = agents.find((agent) => agent.id === currentAgentId);
  const {
    selectedModel: headerSelectedModel,
  } = resolveAgentModelSelection({
    agentModel: currentAgent?.model ?? '',
    availableModels,
    fallbackModel: globalSelectedModel,
    engine: config.agentEngine,
  });

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

  // Get selected quick action
  const selectedAction = React.useMemo(() => {
    return quickActions.find(action => action.id === selectedActionId);
  }, [quickActions, selectedActionId]);

  // Handle quick action button click: select action + activate skill in one batch
  const handleActionSelect = (actionId: string) => {
    dispatch(selectAction(actionId));
    const action = quickActions.find(a => a.id === actionId);
    if (action) {
      const targetSkill = skills.find(s => s.id === action.skillMapping);
      if (targetSkill) {
        dispatch(setActiveSkillIds([targetSkill.id]));
      }
    }
  };

  // When the mapped skill is deactivated from input area, restore the QuickActionBar
  useEffect(() => {
    if (!selectedActionId) return;
    const action = quickActions.find(a => a.id === selectedActionId);
    if (action) {
      const skillStillActive = activeSkillIds.includes(action.skillMapping);
      if (!skillStillActive) {
        dispatch(clearSelection());
      }
    }
  }, [activeSkillIds, dispatch, quickActions, selectedActionId]);

  // Handle prompt selection from QuickAction
  const handleQuickActionPromptSelect = (prompt: string) => {
    // Fill the prompt into input
    promptInputRef.current?.setValue(prompt);
    promptInputRef.current?.focus();
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
      if (isComposerRequested || homeDraftPrompt.trim().length > 0) return;

      setIsComposerRequested(true);
      const detail = (event as CustomEvent).detail;
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent('cowork:focus-input', { detail }));
      }, 0);
    };

    window.addEventListener('cowork:focus-input', handleFocusInput);
    return () => {
      window.removeEventListener('cowork:focus-input', handleFocusInput);
    };
  }, [currentSession, homeDraftPrompt, isComposerRequested]);

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
  const isEngineReady = isOpenClawEngine
    ? isOpenClawReadyForSession(openClawStatus)
    : true;
  const homeCopy = getMainWindowHomeCopy();
  const liteActions = buildMainWindowLiteActions({ canResumeSession: Boolean(petOpenedSessionId) });
  const shouldShowComposer = shouldShowComposerOnMainWindowHome({
    requestedComposer: isComposerRequested,
    hasDraftPrompt: homeDraftPrompt.trim().length > 0,
  });

  const handleLiteAction = (actionId: MainWindowLiteActionId) => {
    switch (actionId) {
      case 'resume-current-task':
        if (petOpenedSessionId) {
          void coworkService.loadSession(petOpenedSessionId);
        }
        return;
      case 'open-settings':
        onRequestAppSettings?.();
        return;
      case 'new-complex-task':
        setIsComposerRequested(true);
        window.setTimeout(() => {
          window.dispatchEvent(new CustomEvent('cowork:focus-input', { detail: { clear: false } }));
        }, 0);
        return;
      case 'manage-skills':
        onShowSkills?.();
        return;
      default:
        return;
    }
  };

  const homeHeader = (
    <div className="draggable flex h-12 items-center justify-between px-4 border-b border-border shrink-0">
      <div className="non-draggable h-8 flex items-center">
        {isSidebarCollapsed && (
          <div className={`flex items-center gap-1 mr-2 ${isMac ? 'pl-[68px]' : ''}`}>
            <button
              type="button"
              onClick={onToggleSidebar}
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-secondary hover:bg-surface-raised transition-colors"
            >
              <SidebarToggleIcon className="h-4 w-4" isCollapsed={true} />
            </button>
            <button
              type="button"
              onClick={onNewChat}
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-secondary hover:bg-surface-raised transition-colors"
            >
              <ComposeIcon className="h-4 w-4" />
            </button>
            {updateBadge}
          </div>
        )}
        <ModelSelector
          value={isOpenClawEngine ? headerSelectedModel : undefined}
          onChange={isOpenClawEngine
            ? async (nextModel) => {
                if (!currentAgent || !nextModel) return;
                await agentService.updateAgent(currentAgent.id, { model: toOpenClawModelRef(nextModel) });
              }
            : undefined}
        />
      </div>
      <div className="non-draggable flex items-center">
        <div className="flex items-center gap-1.5 mr-2 px-2.5 py-1">
          <ShieldCheckIcon className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
          <span className="text-xs text-green-600 dark:text-green-400 whitespace-nowrap">
            {i18nService.t('alkakaGuardEnabled')}
          </span>
        </div>
        <WindowTitleBar inline />
      </div>
    </div>
  );

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

  // Home view - no current session
  return (
    <div className="flex-1 flex flex-col bg-background h-full">
      {/* Engine status banner for error states */}
      {engineStatusBanner}

      {/* Header */}
      {homeHeader}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-[680px] w-full min-w-[320px] mx-auto px-5 pt-[10vh] pb-8 space-y-6">
          <div className="rounded-[18px] border border-border bg-surface px-6 py-6 shadow-[0_18px_60px_rgba(47,42,36,0.06),0_2px_10px_rgba(47,42,36,0.04)] dark:shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="space-y-3 max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-raised px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-secondary">
                  Desktop companion
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                    {homeCopy.title}
                  </h2>
                  <p className="text-sm leading-6 text-secondary">
                    {homeCopy.subtitle}
                  </p>
                  <p className="text-xs leading-5 text-tertiary">
                    {homeCopy.hint}
                  </p>
                </div>
              </div>
              <img src="logo.png" alt="logo" className="hidden md:block h-14 w-14 opacity-80" />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {liteActions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => handleLiteAction(action.id)}
                  className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                    action.tone === 'primary'
                      ? 'border-foreground bg-foreground text-background hover:opacity-90'
                      : action.tone === 'secondary'
                        ? 'border-border bg-surface hover:bg-surface-raised'
                        : 'border-transparent bg-transparent hover:bg-surface-raised'
                  }`}
                >
                  <div className={`text-sm font-medium ${action.tone === 'primary' ? 'text-background' : 'text-foreground'}`}>{action.label}</div>
                  <div className={`mt-1 text-xs leading-5 ${action.tone === 'primary' ? 'text-background opacity-75' : 'text-secondary'}`}>{action.description}</div>
                </button>
              ))}
            </div>
          </div>

          {shouldShowComposer ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div>
                  <h3 className="text-sm font-medium text-foreground">复杂 Cowork 输入</h3>
                  <p className="text-xs text-secondary">主窗口只在需要长上下文时展开完整输入区。</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsComposerRequested(false)}
                  className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-secondary hover:bg-surface-raised hover:text-foreground transition-colors"
                >
                  收起
                </button>
              </div>

              <div className="shadow-glow-accent rounded-2xl">
                <CoworkPromptInput
                  ref={promptInputRef}
                  onSubmit={handleStartSession}
                  onStop={handleStopSession}
                  isStreaming={isStreaming}
                  disabled={!isEngineReady}
                  placeholder={i18nService.t('coworkPlaceholder')}
                  size="large"
                  workingDirectory={config.workingDirectory}
                  onWorkingDirectoryChange={async (dir: string) => {
                    await coworkService.updateConfig({ workingDirectory: dir });
                  }}
                  showFolderSelector={true}
                  onManageSkills={() => onShowSkills?.()}
                />
              </div>

              <div className="space-y-4">
                {selectedAction ? (
                  <PromptPanel
                    action={selectedAction}
                    onPromptSelect={handleQuickActionPromptSelect}
                  />
                ) : (
                  <QuickActionBar actions={quickActions} onActionSelect={handleActionSelect} />
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default CoworkView;
