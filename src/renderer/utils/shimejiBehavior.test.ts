import { describe, expect, it } from 'vitest';

import {
  advanceShimejiFrame,
  getShimejiFramePlan,
  resolvePetActionFromStatus,
} from './shimejiBehavior';

describe('shimejiBehavior', () => {
  it('defines a multi-pose sprite plan instead of a single mascot pose', () => {
    const plan = getShimejiFramePlan();

    expect(plan.idle).toHaveLength(2);
    expect(plan.walk).toHaveLength(4);
    expect(plan.drag).toHaveLength(1);
    expect(plan.fall).toHaveLength(1);
    expect(plan.climb).toHaveLength(2);
    expect(plan.hang).toHaveLength(1);
    expect(plan.sit).toHaveLength(1);
    expect(plan.sleep).toHaveLength(1);

    const uniquePoseNames = new Set(Object.values(plan).flat().map((frame) => frame.pose));
    expect(uniquePoseNames.size).toBeGreaterThanOrEqual(10);
  });

  it('maps product statuses to shimeji behavior actions', () => {
    expect(resolvePetActionFromStatus('idle')).toBe('idle');
    expect(resolvePetActionFromStatus('thinking')).toBe('sit');
    expect(resolvePetActionFromStatus('working')).toBe('walk');
    expect(resolvePetActionFromStatus('waiting_permission')).toBe('hang');
    expect(resolvePetActionFromStatus('error')).toBe('fall');
  });

  it('loops animated actions but holds one-shot poses', () => {
    const walkA = advanceShimejiFrame({ action: 'walk', frameIndex: 0, elapsedMs: 0 }, 120);
    const walkB = advanceShimejiFrame(walkA, 120);
    const walkC = advanceShimejiFrame({ action: 'walk', frameIndex: 3, elapsedMs: 0 }, 120);
    const drag = advanceShimejiFrame({ action: 'drag', frameIndex: 0, elapsedMs: 0 }, 500);

    expect(walkA.frameIndex).toBe(1);
    expect(walkB.frameIndex).toBe(2);
    expect(walkC.frameIndex).toBe(0);
    expect(drag.frameIndex).toBe(0);
  });
});
