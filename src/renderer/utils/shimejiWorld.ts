import type { ShimejiAction } from '../types/pet';

export interface ShimejiBounds {
  width: number;
  height: number;
  spriteSize: number;
}

export interface ShimejiWorldState extends ShimejiBounds {
  x: number;
  y: number;
  vx: number;
  vy: number;
  direction: 1 | -1;
  action: ShimejiAction;
}

export interface ShimejiInputState {
  dragging?: boolean;
  pointerX?: number;
  pointerY?: number;
}

const WALK_SPEED_PX_PER_SECOND = 120;
const CLIMB_SPEED_PX_PER_SECOND = 90;
const GRAVITY_PX_PER_SECOND = 1600;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getFloorY(state: ShimejiBounds): number {
  return Math.max(0, state.height - state.spriteSize);
}

function getMaxX(state: ShimejiBounds): number {
  return Math.max(0, state.width - state.spriteSize);
}

export function createInitialShimejiWorld(bounds: ShimejiBounds): ShimejiWorldState {
  return {
    ...bounds,
    x: Math.round((bounds.width - bounds.spriteSize) / 2),
    y: getFloorY(bounds),
    vx: WALK_SPEED_PX_PER_SECOND,
    vy: 0,
    direction: 1,
    action: 'idle',
  };
}

export function tickShimejiWorld(
  state: ShimejiWorldState,
  deltaMs: number,
  input: ShimejiInputState = {}
): ShimejiWorldState {
  const deltaSeconds = deltaMs / 1000;
  const maxX = getMaxX(state);
  const floorY = getFloorY(state);

  if (input.dragging) {
    return {
      ...state,
      action: 'drag',
      x: clamp((input.pointerX ?? state.x + state.spriteSize / 2) - state.spriteSize / 2, 0, maxX),
      y: clamp((input.pointerY ?? state.y + state.spriteSize / 2) - state.spriteSize / 2, 0, floorY),
      vx: 0,
      vy: 0,
    };
  }

  switch (state.action) {
    case 'walk': {
      const nextX = state.x + state.direction * WALK_SPEED_PX_PER_SECOND * deltaSeconds;
      if (nextX <= 0) {
        return { ...state, x: 0, y: floorY, direction: 1, vx: WALK_SPEED_PX_PER_SECOND, vy: 0 };
      }
      if (nextX >= maxX) {
        return { ...state, x: maxX, y: floorY, direction: -1, vx: -WALK_SPEED_PX_PER_SECOND, vy: 0 };
      }
      return {
        ...state,
        x: nextX,
        y: floorY,
        vx: state.direction * WALK_SPEED_PX_PER_SECOND,
        vy: 0,
      };
    }

    case 'fall': {
      const vy = state.vy + GRAVITY_PX_PER_SECOND * deltaSeconds;
      const y = state.y + state.vy * deltaSeconds + 0.5 * GRAVITY_PX_PER_SECOND * deltaSeconds * deltaSeconds;
      if (y >= floorY) {
        return { ...state, y: floorY, vy: 0, action: 'idle' };
      }
      return { ...state, y, vy, action: 'fall' };
    }

    case 'climb': {
      const edgeX = state.direction === 1 ? maxX : 0;
      const y = Math.max(0, state.y - CLIMB_SPEED_PX_PER_SECOND * deltaSeconds);
      return {
        ...state,
        x: edgeX,
        y,
        vx: 0,
        vy: -CLIMB_SPEED_PX_PER_SECOND,
        action: y === 0 ? 'hang' : 'climb',
      };
    }

    case 'hang':
      return { ...state, x: clamp(state.x, 0, maxX), y: 0, vx: 0, vy: 0 };

    default:
      return {
        ...state,
        x: clamp(state.x, 0, maxX),
        y: clamp(state.y, 0, floorY),
        vx: 0,
        vy: 0,
      };
  }
}
