import type { ShimejiAction } from '../types/pet';

export interface ShimejiScheduleContext {
  atSideEdge?: boolean;
  atTopEdge?: boolean;
  onFloor: boolean;
}

export interface ShimejiScheduleState {
  action: ShimejiAction;
  elapsedMs: number;
  durationMs: number;
}

const ACTION_DURATIONS_MS: Record<ShimejiAction, number> = {
  idle: 1_200,
  walk: 2_400,
  sit: 1_800,
  fall: 900,
  drag: 300,
  climb: 1_600,
  hang: 1_400,
  sleep: 2_800,
};

export function createInitialShimejiSchedule(action: ShimejiAction = 'idle'): ShimejiScheduleState {
  return {
    action,
    elapsedMs: 0,
    durationMs: ACTION_DURATIONS_MS[action],
  };
}

function createSchedule(action: ShimejiAction): ShimejiScheduleState {
  return createInitialShimejiSchedule(action);
}

function chooseFloorAction(roll: number): ShimejiAction {
  if (roll < 0.35) return 'walk';
  if (roll < 0.55) return 'idle';
  if (roll < 0.75) return 'sit';
  return 'sleep';
}

function chooseNextAction(context: ShimejiScheduleContext, random: () => number): ShimejiAction {
  if (context.atTopEdge) return 'hang';
  if (!context.onFloor) return 'fall';

  const roll = random();
  if (context.atSideEdge && roll < 0.4) return 'climb';

  return chooseFloorAction(roll);
}

export function advanceShimejiSchedule(
  state: ShimejiScheduleState,
  deltaMs: number,
  context: ShimejiScheduleContext,
  random: () => number = Math.random
): ShimejiScheduleState {
  if (context.atTopEdge || !context.onFloor) {
    const emergencyAction = chooseNextAction(context, random);
    return state.action === emergencyAction
      ? { ...state, elapsedMs: state.elapsedMs + deltaMs }
      : createSchedule(emergencyAction);
  }

  const elapsedMs = state.elapsedMs + deltaMs;
  if (elapsedMs < state.durationMs) {
    return { ...state, elapsedMs };
  }

  return createSchedule(chooseNextAction(context, random));
}
