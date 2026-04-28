import type { FormEvent, KeyboardEvent, MouseEvent as ReactMouseEvent } from 'react';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';

import { createQuickTaskPayload } from './petQuickTask';
import { createInitialPetStatus, reducePetStatus } from './petState';

const DRAG_THRESHOLD_PX = 3;

type QuickTaskStatus = 'idle' | 'sending' | 'success' | 'error';

export default function PetView() {
  const [isQuickInputOpen, setIsQuickInputOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<QuickTaskStatus>('idle');
  const [statusText, setStatusText] = useState('');
  const [petStatus, dispatchPetStatus] = useReducer(reducePetStatus, undefined, createInitialPetStatus);
  const clickTimerRef = useRef<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const petButtonRef = useRef<HTMLButtonElement | null>(null);
  const dragStateRef = useRef({
    isDragging: false,
    hasMoved: false,
    startScreenX: 0,
    startScreenY: 0,
    lastScreenX: 0,
    lastScreenY: 0,
  });

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
  }, []);

  const handleMouseDown = (event: ReactMouseEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;

    dragStateRef.current = {
      isDragging: true,
      hasMoved: false,
      startScreenX: event.screenX,
      startScreenY: event.screenY,
      lastScreenX: event.screenX,
      lastScreenY: event.screenY,
    };

    window.addEventListener('mouseup', stopDrag, { once: true });
  };

  const handleMouseMove = (event: ReactMouseEvent<HTMLButtonElement>) => {
    const state = dragStateRef.current;
    if (!state.isDragging) return;

    const dx = event.screenX - state.lastScreenX;
    const dy = event.screenY - state.lastScreenY;
    if (dx === 0 && dy === 0) return;

    state.lastScreenX = event.screenX;
    state.lastScreenY = event.screenY;

    const totalDx = event.screenX - state.startScreenX;
    const totalDy = event.screenY - state.startScreenY;
    if (!state.hasMoved && Math.hypot(totalDx, totalDy) < DRAG_THRESHOLD_PX) {
      return;
    }

    state.hasMoved = true;
    window.petElectron?.moveWindowBy(dx, dy);
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
        title="点击快速提问，双击打开 Alkaka"
        aria-label="Alkaka 桌宠，点击快速提问，双击打开主窗口"
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseLeave={stopDrag}
      >
        <img src="logo.png" alt="Alkaka" draggable={false} />
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
            <button type="button" className="pet-quick-secondary" onClick={() => window.petElectron?.openMainWindow()}>
              打开主窗口
            </button>
            <button type="submit" className="pet-quick-primary" disabled={status === 'sending'}>
              {status === 'sending' ? '发送中…' : '发送'}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
