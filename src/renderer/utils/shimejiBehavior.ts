import type {
  PetStatus,
  ShimejiAction,
  ShimejiAnimationState,
  ShimejiFramePlan,
} from '../types/pet';

const FRAME_MS = 120;

const SHIMEJI_FRAME_PLAN: ShimejiFramePlan = {
  idle: [
    { pose: 'stand-soft', durationMs: 900 },
    { pose: 'stand-blink', durationMs: 160 },
  ],
  walk: [
    { pose: 'walk-left-step', durationMs: FRAME_MS },
    { pose: 'walk-mid-step', durationMs: FRAME_MS },
    { pose: 'walk-right-step', durationMs: FRAME_MS },
    { pose: 'walk-turn-step', durationMs: FRAME_MS },
  ],
  sit: [{ pose: 'sit-thinking', durationMs: 700 }],
  fall: [{ pose: 'fall-tumble', durationMs: 700 }],
  drag: [{ pose: 'drag-lifted', durationMs: 700 }],
  climb: [
    { pose: 'climb-reach', durationMs: 180 },
    { pose: 'climb-pull', durationMs: 180 },
  ],
  hang: [{ pose: 'hang-dangle', durationMs: 700 }],
  sleep: [{ pose: 'sleep-curl', durationMs: 1200 }],
};

export function getShimejiFramePlan(): ShimejiFramePlan {
  return SHIMEJI_FRAME_PLAN;
}

export function resolvePetActionFromStatus(status: PetStatus): ShimejiAction {
  switch (status) {
    case 'thinking':
      return 'sit';
    case 'working':
      return 'walk';
    case 'waiting_permission':
      return 'hang';
    case 'error':
      return 'fall';
    case 'idle':
    default:
      return 'idle';
  }
}

export function advanceShimejiFrame(
  state: ShimejiAnimationState,
  deltaMs: number,
  framePlan = SHIMEJI_FRAME_PLAN
): ShimejiAnimationState {
  const frames = framePlan[state.action];
  if (frames.length <= 1) {
    return { ...state, frameIndex: 0, elapsedMs: 0 };
  }

  let elapsedMs = state.elapsedMs + deltaMs;
  let frameIndex = state.frameIndex;

  while (elapsedMs >= frames[frameIndex].durationMs) {
    elapsedMs -= frames[frameIndex].durationMs;
    frameIndex = (frameIndex + 1) % frames.length;
  }

  return { ...state, frameIndex, elapsedMs };
}
