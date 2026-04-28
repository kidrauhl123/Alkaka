import type { CSSProperties, MouseEvent as ReactMouseEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { PetAppearance, PetStatus, ShimejiCharacterPack } from '../../types/pet';
import { resolvePetActionFromStatus } from '../../utils/shimejiBehavior';
import { advanceShimejiSchedule, createInitialShimejiSchedule } from '../../utils/shimejiScheduler';
import { createInitialShimejiWorld, tickShimejiWorld } from '../../utils/shimejiWorld';
import { PetBubble } from './PetBubble';
import { ShimejiSprite } from './ShimejiSprite';

const DRAG_THRESHOLD_PX = 3;
const SHIMEJI_DEMO_TICK_MS = 120;
const SHIMEJI_DEMO_SPRITE_SIZE = 226;

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

interface PetViewProps {
  status?: PetStatus;
  appearance?: PetAppearance;
  behaviorDemo?: boolean;
  autoBehavior?: boolean;
  characterPack?: ShimejiCharacterPack;
}

export default function PetView({
  status = 'idle',
  appearance,
  behaviorDemo = false,
  autoBehavior = false,
  characterPack,
}: PetViewProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [world, setWorld] = useState(() => createViewportWorld());
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

  const stopDrag = useCallback(() => {
    dragStateRef.current.isDragging = false;
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (!behaviorDemo) return undefined;

    const intervalId = window.setInterval(() => {
      setWorld((current) => {
        let action = resolvePetActionFromStatus(status);

        if (autoBehavior) {
          scheduleRef.current = advanceShimejiSchedule(
            scheduleRef.current,
            SHIMEJI_DEMO_TICK_MS,
            getWorldContext(current)
          );
          action = scheduleRef.current.action;
        }

        return tickShimejiWorld(
          { ...current, action: isDragging ? 'drag' : action },
          SHIMEJI_DEMO_TICK_MS,
          isDragging
            ? {
                dragging: true,
                pointerX: dragPointerRef.current.x,
                pointerY: dragPointerRef.current.y,
              }
            : undefined
        );
      });
    }, SHIMEJI_DEMO_TICK_MS);

    return () => window.clearInterval(intervalId);
  }, [autoBehavior, behaviorDemo, isDragging, status]);

  useEffect(() => {
    if (!behaviorDemo) return undefined;

    const handleResize = () => setWorld(createViewportWorld());
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [behaviorDemo]);

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
    dragPointerRef.current = { x: event.clientX, y: event.clientY };
    setIsDragging(true);
  };

  const handleMouseMove = (event: ReactMouseEvent<HTMLButtonElement>) => {
    const state = dragStateRef.current;
    if (!state.isDragging) return;

    const dx = event.screenX - state.lastScreenX;
    const dy = event.screenY - state.lastScreenY;
    if (dx === 0 && dy === 0) return;

    state.lastScreenX = event.screenX;
    state.lastScreenY = event.screenY;
    dragPointerRef.current = { x: event.clientX, y: event.clientY };

    const totalDx = event.screenX - state.startScreenX;
    const totalDy = event.screenY - state.startScreenY;
    if (!state.hasMoved && Math.hypot(totalDx, totalDy) < DRAG_THRESHOLD_PX) {
      return;
    }

    state.hasMoved = true;
    if (!behaviorDemo) {
      window.petElectron?.moveWindowBy(dx, dy);
    }
  };

  const handleDoubleClick = () => {
    if (dragStateRef.current.hasMoved) return;
    void window.petElectron?.openMainWindow();
  };

  const handleContextMenu = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    void window.petElectron?.showContextMenu?.({ x: event.clientX, y: event.clientY });
  };

  const characterStyle: CSSProperties | undefined = behaviorDemo
    ? {
        left: 0,
        position: 'absolute',
        top: 0,
        transform: `translate3d(${world.x}px, ${world.y}px, 0) scaleX(${world.direction})`,
      }
    : undefined;
  const bubbleStyle: CSSProperties | undefined = behaviorDemo
    ? {
        left: world.x + world.spriteSize / 2,
        top: Math.max(12, world.y - 104),
      }
    : undefined;

  return (
    <div className="pet-view" onContextMenu={handleContextMenu}>
      <div className="pet-drag-region" />
      <PetBubble status={status} style={bubbleStyle} />
      <button
        type="button"
        className="pet-character"
        data-shimeji-world={behaviorDemo ? 'enabled' : 'disabled'}
        style={characterStyle}
        title="双击打开 Alkaka"
        aria-label="Alkaka 桌宠，双击打开主窗口"
        onDoubleClick={handleDoubleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseLeave={stopDrag}
      >
        <ShimejiSprite
          appearance={appearance}
          characterPack={characterPack}
          status={status}
          forcedAction={behaviorDemo ? world.action : isDragging ? 'drag' : undefined}
        />
      </button>
    </div>
  );
}
