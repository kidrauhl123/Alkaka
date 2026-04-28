import type { MouseEvent as ReactMouseEvent } from 'react';
import { useCallback, useRef } from 'react';

import type { PetStatus } from '../../types/pet';
import { PetBubble } from './PetBubble';

const DRAG_THRESHOLD_PX = 3;

interface PetViewProps {
  status?: PetStatus;
}

export default function PetView({ status = 'idle' }: PetViewProps) {
  const dragStateRef = useRef({
    isDragging: false,
    hasMoved: false,
    startScreenX: 0,
    startScreenY: 0,
    lastScreenX: 0,
    lastScreenY: 0,
  });

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

  const handleDoubleClick = () => {
    if (dragStateRef.current.hasMoved) return;
    void window.petElectron?.openMainWindow();
  };

  const handleContextMenu = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    void window.petElectron?.showContextMenu?.({ x: event.clientX, y: event.clientY });
  };

  return (
    <div className="pet-view" onContextMenu={handleContextMenu}>
      <div className="pet-drag-region" />
      <PetBubble status={status} />
      <button
        type="button"
        className="pet-character"
        title="双击打开 Alkaka"
        aria-label="Alkaka 桌宠，双击打开主窗口"
        onDoubleClick={handleDoubleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseLeave={stopDrag}
      >
        <img src="logo.png" alt="Alkaka" draggable={false} />
      </button>
    </div>
  );
}
