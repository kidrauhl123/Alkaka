import { describe, expect, it } from 'vitest';

import { advanceShimejiSchedule, createInitialShimejiSchedule } from './shimejiScheduler';

describe('shimejiScheduler', () => {
  it('keeps the current action until its duration expires', () => {
    const schedule = createInitialShimejiSchedule('idle');

    const next = advanceShimejiSchedule(schedule, 400, { onFloor: true }, () => 0.1);

    expect(next.action).toBe('idle');
    expect(next.elapsedMs).toBe(400);
  });

  it('chooses a new floor action after the current action has run long enough', () => {
    const schedule = createInitialShimejiSchedule('idle');

    const next = advanceShimejiSchedule(schedule, 2_000, { onFloor: true }, () => 0.1);

    expect(next.action).toBe('walk');
    expect(next.elapsedMs).toBe(0);
    expect(next.durationMs).toBeGreaterThan(1_000);
  });

  it('prefers climbing when the pet reaches a side edge', () => {
    const schedule = createInitialShimejiSchedule('walk');

    const next = advanceShimejiSchedule(schedule, 3_000, { atSideEdge: true, onFloor: true }, () => 0.2);

    expect(next.action).toBe('climb');
  });

  it('forces physical emergency actions over random choices', () => {
    const schedule = createInitialShimejiSchedule('walk');

    const falling = advanceShimejiSchedule(schedule, 100, { onFloor: false }, () => 0.1);
    const hanging = advanceShimejiSchedule(schedule, 100, { atTopEdge: true, onFloor: false }, () => 0.1);

    expect(falling.action).toBe('fall');
    expect(hanging.action).toBe('hang');
  });
});
