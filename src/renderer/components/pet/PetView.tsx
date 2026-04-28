import type {
  CSSProperties,
  FormEvent,
  KeyboardEvent,
  MouseEvent as ReactMouseEvent,
} from 'react';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';

import type { PetAppearance, PetStatus, ShimejiCharacterPack } from '../../types/pet';
import { resolvePetActionFromStatus } from '../../utils/shimejiBehavior';
import { advanceShimejiSchedule, createInitialShimejiSchedule } from '../../utils/shimejiScheduler';
import { DEFAULT_SHIMEJI_CHARACTER_PACK } from '../../utils/shimejiDefaultPack';
import { createInitialShimejiWorld, tickShimejiWorld } from '../../utils/shimejiWorld';
import { createQuickTaskPayload } from './petQuickTask';
import {
  createPetTaskJumpRequest,
  getPetTaskDetailButtonLabel,
  hasOpenablePetSession,
} from './petTaskJump';
import {
  createInitialPetStatus,
  reducePetStatus,
  type PetStatusPhase,
} from './petState';
import { ShimejiSprite } from './ShimejiSprite';

const DRAG_THRESHOLD_PX = 3;
const SHIMEJI_DEMO_MAX_DELTA_MS = 48;
const SHIMEJI_DEMO_SPRITE_SIZE = 226;

type QuickTaskStatus = 'idle' | 'sending' | 'success' | 'error';

interface PetViewProps {
  status?: PetStatus;
  appearance?: PetAppearance;
  behaviorDemo?: boolean;
  autoBehavior?: boolean;
  characterPack?: ShimejiCharacterPack;
}

function createViewportWorld() {
  return createInitialShimejiWorld({
    width: Math.max(window.innerWidth, SHIMEJI_DEMO_SPRITE_SIZE),
    height: Math.max(window.innerHeight, SHIMEJI_DEMO_SPRITE_SIZE),
    spriteSize: SHIMEJI_DEMO_SPRITE_SIZE,
  });
}

function getWorldContext(world: ReturnType<typeof createInitialShimejiWorld>) {
  const maxX = Math.max(0, world.width - world.spriteSize);
  const floorY = Math.max(0, world.height - world.spriteSize);

  return {
    atSideEdge: world.x <= 0 || world.x >= maxX,
    atTopEdge: world.y <= 0,
    onFloor: Math.abs(world.y - floorY) <= 1,
  };
}

function mapPetStatusPhaseToShimejiStatus(phase: PetStatusPhase): PetStatus {
  switch (phase) {
    case 'sending':
      return 'thinking';
    case 'working':
      return 'working';
    case 'needs-approval':
      return 'waiting_permission';
    case 'error':
      return 'error';
    case 'done':
    case 'ready':
    case 'idle':
    default:
      return 'idle';
  }
}

export default function PetView({
  status: previewStatus = 'idle',
  appearance,
  behaviorDemo = false,
  autoBehavior = false,
  characterPack = DEFAULT_SHIMEJI_CHARACTER_PACK,
}: PetViewProps) {
  const [isQuickInputOpen, setIsQuickInputOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<QuickTaskStatus>('idle');
  const [statusText, setStatusText] = useState('');
  const [petStatus, dispatchPetStatus] = useReducer(reducePetStatus, undefined, createInitialPetStatus);
  const [isDragging, setIsDragging] = useState(false);
  const [world, setWorld] = useState(() => createViewportWorld());
  const clickTimerRef = useRef<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const petButtonRef = useRef<HTMLButtonElement | null>(null);
  const scheduleRef = useRef(createInitialShimejiSchedule('idle'));
  const dragPointerRef = useRef({ x: 0, y: 0 });
  const dragStateRef = useRef({
    isDragging: false,
    hasMoved: false,
    startScreenX: 0,
    startScreenY: 0,
    lastScreenX: 0,
    lastScreenY: 0,
  });
  const visualStatus = behaviorDemo ? previewStatus : mapPetStatusPhaseToShimejiStatus(petStatus.phase);
  const canOpenPetTask = hasOpenablePetSession(petStatus);
  const detailButtonLabel = getPetTaskDetailButtonLabel(petStatus);

  const openPetSessionDetail = useCallback(async () => {
    const request = createPetTaskJumpRequest(petStatus);
    if (!request) {
      await window.petElectron?.openMainWindow?.();
      return;
    }

    const response = await window.petElectron?.openSession?.(request.sessionId);
    if (response && !response.success) {
      setStatus('error');
      setStatusText(response.error || '打开任务详情失败');
    }
  }, [petStatus]);

  useEffect(() => {
    let cancelled = false;

    window.petElectron?.getStatus?.()
      .then((snapshot) => {
        if (!cancelled && snapshot) {
          dispatchPetStatus({ type: 'snapshot', snapshot });
        }
      })
      .catch(() => {
        // Keep the local idle state if the preload API is not available yet.
      });

    const unsubscribe = window.petElectron?.onStatusChanged?.((snapshot) => {
      dispatchPetStatus({ type: 'snapshot', snapshot });
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const setQuickInputOpen = useCallback((nextOpen: boolean) => {
    setIsQuickInputOpen(nextOpen);
    void window.petElectron?.setQuickInputExpanded?.(nextOpen);
  }, []);

  useEffect(() => {
    if (!isQuickInputOpen) return;

    const focusTimer = window.setTimeout(() => textareaRef.current?.focus(), 60);
    return () => window.clearTimeout(focusTimer);
  }, [isQuickInputOpen]);

  useEffect(() => () => {
    if (clickTimerRef.current) window.clearTimeout(clickTimerRef.current);
  }, []);

  const stopDrag = useCallback(() => {
    dragStateRef.current.isDragging = false;
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (!behaviorDemo) return undefined;

    let animationFrameId = 0;
    let previousTimestamp = performance.now();

    const animate = (timestamp: number) => {
      const deltaMs = Math.min(timestamp - previousTimestamp, SHIMEJI_DEMO_MAX_DELTA_MS);
      previousTimestamp = timestamp;

      setWorld((current) => {
        let action = resolvePetActionFromStatus(previewStatus);

        if (autoBehavior) {
          scheduleRef.current = advanceShimejiSchedule(
            scheduleRef.current,
            deltaMs,
            getWorldContext(current)
          );
          action = scheduleRef.current.action;
        }

        return tickShimejiWorld(
          { ...current, action: isDragging ? 'drag' : action },
          deltaMs,
          isDragging
            ? {
                dragging: true,
                pointerX: dragPointerRef.current.x,
                pointerY: dragPointerRef.current.y,
              }
            : undefined
        );
      });

      animationFrameId = window.requestAnimationFrame(animate);
    };

    animationFrameId = window.requestAnimationFrame(animate);

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [autoBehavior, behaviorDemo, isDragging, previewStatus]);

  useEffect(() => {
    if (!behaviorDemo) return undefined;

    const handleResize = () => setWorld(createViewportWorld());
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [behaviorDemo]);

  const handleMouseDown = (event: ReactMouseEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;

    const state = {
      isDragging: true,
      hasMoved: false,
      startScreenX: event.screenX,
      startScreenY: event.screenY,
      lastScreenX: event.screenX,
      lastScreenY: event.screenY,
    };

    dragStateRef.current = state;
    dragPointerRef.current = { x: event.clientX, y: event.clientY };
    setIsDragging(true);

    const handleWindowMouseMove = (moveEvent: MouseEvent) => {
      if (!state.isDragging) return;

      const dx = moveEvent.screenX - state.lastScreenX;
      const dy = moveEvent.screenY - state.lastScreenY;
      if (dx === 0 && dy === 0) return;

      state.lastScreenX = moveEvent.screenX;
      state.lastScreenY = moveEvent.screenY;
      dragPointerRef.current = { x: moveEvent.clientX, y: moveEvent.clientY };

      const totalDx = moveEvent.screenX - state.startScreenX;
      const totalDy = moveEvent.screenY - state.startScreenY;
      if (!state.hasMoved && Math.hypot(totalDx, totalDy) < DRAG_THRESHOLD_PX) {
        return;
      }

      state.hasMoved = true;
      if (!behaviorDemo) {
        window.petElectron?.moveWindowBy(dx, dy);
      }
    };

    const handleWindowMouseUp = () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
      stopDrag();
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp, { once: true });
  };

  const handleClick = () => {
    if (dragStateRef.current.hasMoved) return;
    if (clickTimerRef.current) window.clearTimeout(clickTimerRef.current);
    clickTimerRef.current = window.setTimeout(() => {
      setQuickInputOpen(true);
      clickTimerRef.current = null;
    }, 180);
  };

  const handleDoubleClick = () => {
    if (dragStateRef.current.hasMoved) return;
    if (clickTimerRef.current) {
      window.clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
    void window.petElectron?.openMainWindow();
  };

  const handleContextMenu = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    void window.petElectron?.showContextMenu?.({ x: event.clientX, y: event.clientY });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = createQuickTaskPayload(prompt);
    if (!result.ok) {
      setStatus('error');
      setStatusText(result.error);
      dispatchPetStatus({ type: 'snapshot', snapshot: { phase: 'error', message: '任务遇到问题', error: result.error } });
      return;
    }

    setStatus('sending');
    setStatusText('正在交给 Alkaka…');
    dispatchPetStatus({ type: 'snapshot', snapshot: { phase: 'sending', title: result.payload.title } });
    try {
      const response = await window.petElectron?.startQuickTask?.(result.payload);
      if (response?.success) {
        setPrompt('');
        setStatus('success');
        setStatusText('任务已创建，可去主窗口查看详情');
        if (response.session?.id) {
          dispatchPetStatus({
            type: 'quick-task-started',
            sessionId: response.session.id,
            title: response.session.title || result.payload.title,
          });
        }
        return;
      }

      setStatus('error');
      setStatusText(response?.error || '任务创建失败');
      dispatchPetStatus({ type: 'snapshot', snapshot: { phase: 'error', error: response?.error || '任务创建失败' } });
    } catch (error) {
      const message = error instanceof Error ? error.message : '任务创建失败';
      setStatus('error');
      setStatusText(message);
      dispatchPetStatus({ type: 'snapshot', snapshot: { phase: 'error', message: '任务遇到问题', error: message } });
    }
  };

  const closeQuickInput = () => {
    setQuickInputOpen(false);
    setStatus('idle');
    setStatusText('');
    petButtonRef.current?.focus();
  };

  const handleQuickInputKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeQuickInput();
    }
  };

  const characterStyle: CSSProperties | undefined = behaviorDemo
    ? {
        left: 0,
        position: 'absolute',
        top: 0,
        transform: `translate3d(${world.x}px, ${world.y}px, 0) scaleX(${world.direction})`,
      }
    : undefined;

  return (
    <div className={`pet-view pet-status--${petStatus.phase}${isQuickInputOpen ? ' pet-view-expanded' : ''}`} onContextMenu={handleContextMenu}>
      <div className="pet-drag-region" />
      <div className="pet-status-bubble" role="status" aria-live="polite">
        <span className="pet-status-dot" aria-hidden="true" />
        <span>{petStatus.message}</span>
      </div>
      <button
        ref={petButtonRef}
        type="button"
        className="pet-character"
        data-shimeji-world={behaviorDemo ? 'enabled' : 'disabled'}
        style={characterStyle}
        title="点击快速提问，双击打开 Alkaka"
        aria-label="Alkaka 桌宠，点击快速提问，双击打开主窗口"
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onMouseDown={handleMouseDown}
      >
        <ShimejiSprite
          appearance={appearance}
          characterPack={characterPack}
          status={visualStatus}
          forcedAction={behaviorDemo ? world.action : isDragging ? 'drag' : undefined}
        />
      </button>

      {isQuickInputOpen ? (
        <form className="pet-quick-input" onSubmit={handleSubmit} onKeyDown={handleQuickInputKeyDown}>
          <div className="pet-quick-input-header">
            <span>交给 Alkaka</span>
            <button type="button" aria-label="收起快速输入" onClick={closeQuickInput}>×</button>
          </div>
          <textarea
            ref={textareaRef}
            value={prompt}
            placeholder="想让 Alkaka 做什么？"
            aria-label="快速任务内容"
            onChange={(event) => {
              setPrompt(event.target.value);
              if (status !== 'sending') {
                setStatus('idle');
                setStatusText('');
              }
            }}
          />
          {statusText ? (
            <p
              className={`pet-quick-input-status pet-quick-input-status-${status}`}
              role={status === 'error' ? 'alert' : 'status'}
              aria-live={status === 'error' ? 'assertive' : 'polite'}
            >
              {statusText}
            </p>
          ) : null}
          <div className="pet-quick-input-actions">
            <button type="button" className="pet-quick-secondary" onClick={openPetSessionDetail}>
              {detailButtonLabel}
            </button>
            {canOpenPetTask ? (
              <button type="button" className="pet-quick-secondary" onClick={() => window.petElectron?.openMainWindow()}>
                主窗口
              </button>
            ) : null}
            <button type="submit" className="pet-quick-primary" disabled={status === 'sending'}>
              {status === 'sending' ? '发送中…' : '发送'}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
