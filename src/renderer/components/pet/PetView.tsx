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
import { getPetPrimaryClickAction, PET_VISIBLE_ALPHA_THRESHOLD } from './petInteraction';
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
  const quickInputRef = useRef<HTMLFormElement | null>(null);
  const petButtonRef = useRef<HTMLButtonElement | null>(null);
  const pointerPassthroughRef = useRef(false);
  const spriteMaskRef = useRef<{
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D | null;
    image: HTMLImageElement;
    ready: boolean;
    url: string;
  } | null>(null);
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
    window.petElectron?.setPointerPassthrough?.(false);
  }, []);

  const setPointerPassthrough = useCallback((passthrough: boolean) => {
    if (pointerPassthroughRef.current === passthrough) return;
    pointerPassthroughRef.current = passthrough;
    window.petElectron?.setPointerPassthrough?.(passthrough);
  }, []);

  const getSpriteMask = useCallback((url: string) => {
    const normalizedUrl = new URL(url, window.location.href).href;
    if (spriteMaskRef.current?.url === normalizedUrl) return spriteMaskRef.current;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const image = new Image();
    const mask = { canvas, context, image, ready: false, url: normalizedUrl };
    spriteMaskRef.current = mask;
    image.onload = () => {
      canvas.width = image.naturalWidth || image.width;
      canvas.height = image.naturalHeight || image.height;
      context?.clearRect(0, 0, canvas.width, canvas.height);
      context?.drawImage(image, 0, 0, canvas.width, canvas.height);
      mask.ready = true;
    };
    image.src = normalizedUrl;
    return mask;
  }, []);

  const isVisiblePetPixelAt = useCallback((clientX: number, clientY: number) => {
    const frame = petButtonRef.current?.querySelector<HTMLElement>('.pet-shimeji-frame');
    if (!frame) return false;

    const rect = frame.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return false;

    const spriteSheetUrl = frame.dataset.shimejiSpriteSheetUrl;
    const frameX = Number(frame.dataset.shimejiFrameX);
    const frameY = Number(frame.dataset.shimejiFrameY);
    const frameWidth = Number(frame.dataset.shimejiFrameWidth);
    const frameHeight = Number(frame.dataset.shimejiFrameHeight);
    if (!spriteSheetUrl || !Number.isFinite(frameX) || !Number.isFinite(frameY) || !Number.isFinite(frameWidth) || !Number.isFinite(frameHeight)) {
      return false;
    }

    const mask = getSpriteMask(spriteSheetUrl);
    if (!mask.ready || !mask.context) {
      return true;
    }

    const atlasX = Math.floor(frameX + ((clientX - rect.left) / rect.width) * frameWidth);
    const atlasY = Math.floor(frameY + ((clientY - rect.top) / rect.height) * frameHeight);
    if (atlasX < 0 || atlasY < 0 || atlasX >= mask.canvas.width || atlasY >= mask.canvas.height) return false;

    const alpha = mask.context.getImageData(atlasX, atlasY, 1, 1).data[3];
    return alpha > PET_VISIBLE_ALPHA_THRESHOLD;
  }, [getSpriteMask]);

  const updatePointerPassthrough = useCallback((clientX: number, clientY: number) => {
    if (dragStateRef.current.isDragging) {
      setPointerPassthrough(false);
      return;
    }

    const button = petButtonRef.current;
    const quickInput = quickInputRef.current;
    const overQuickInput = Boolean(quickInput && (() => {
      const rect = quickInput.getBoundingClientRect();
      return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
    })());
    const overPetPixels = Boolean(button && isVisiblePetPixelAt(clientX, clientY));

    setPointerPassthrough(!(overQuickInput || overPetPixels));
  }, [isVisiblePetPixelAt, setPointerPassthrough]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => updatePointerPassthrough(event.clientX, event.clientY);
    const handleMouseLeave = () => setPointerPassthrough(true);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      setPointerPassthrough(false);
    };
  }, [setPointerPassthrough, updatePointerPassthrough]);

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

      if (!state.hasMoved) {
        state.hasMoved = true;
        setIsDragging(true);
      }
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

  const handleClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    const hitVisiblePixels = isVisiblePetPixelAt(event.clientX, event.clientY);
    if (getPetPrimaryClickAction({ detail: event.detail, hasMoved: dragStateRef.current.hasMoved, hitVisiblePixels }) === 'openQuickInput') {
      setQuickInputOpen(true);
    }
  };

  const handleDoubleClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    if (dragStateRef.current.hasMoved || !isVisiblePetPixelAt(event.clientX, event.clientY)) return;
    setQuickInputOpen(true);
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
      dispatchPetStatus({ type: 'snapshot', snapshot: { phase: 'error', message: 'AI 对话遇到问题', error: result.error } });
      return;
    }

    setStatus('sending');
    setStatusText('正在发给 Alkaka…');
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
      setStatusText(response?.error || '对话发送失败');
      dispatchPetStatus({ type: 'snapshot', snapshot: { phase: 'error', error: response?.error || '对话发送失败' } });
    } catch (error) {
      const message = error instanceof Error ? error.message : '对话发送失败';
      setStatus('error');
      setStatusText(message);
      dispatchPetStatus({ type: 'snapshot', snapshot: { phase: 'error', message: 'AI 对话遇到问题', error: message } });
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
      <button
        ref={petButtonRef}
        type="button"
        className="pet-character"
        data-shimeji-world={behaviorDemo ? 'enabled' : 'disabled'}
        style={characterStyle}
        title="双击打开快速对话"
        aria-label="Alkaka AI 桌宠，双击打开快速对话框"
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onMouseDown={handleMouseDown}
      >
        <ShimejiSprite
          appearance={appearance}
          characterPack={characterPack}
          status={visualStatus}
          forcedAction={behaviorDemo ? world.action : isDragging ? 'drag' : undefined}
          animate={behaviorDemo || isDragging || petStatus.phase === 'sending' || petStatus.phase === 'working'}
        />
      </button>

      {isQuickInputOpen ? (
        <form ref={quickInputRef} className="pet-quick-input" onSubmit={handleSubmit} onKeyDown={handleQuickInputKeyDown}>
          <div className="pet-quick-input-header">
            <span>和 Alkaka 对话</span>
            <button type="button" aria-label="收起快速输入" onClick={closeQuickInput}>×</button>
          </div>
          <textarea
            ref={textareaRef}
            value={prompt}
            placeholder="想和 Alkaka 聊什么？也可以让它帮你处理事情。"
            aria-label="快速对话内容"
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
