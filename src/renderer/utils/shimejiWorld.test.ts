import { describe, expect, it } from 'vitest';

import { createInitialShimejiWorld, tickShimejiWorld } from './shimejiWorld';

describe('shimejiWorld', () => {
  it('walks across the desktop floor and flips direction at edges', () => {
    const initial = createInitialShimejiWorld({ width: 400, height: 300, spriteSize: 128 });

    const moved = tickShimejiWorld({ ...initial, x: 120, y: 172, direction: 1, action: 'walk' }, 500);
    const bounced = tickShimejiWorld({ ...initial, x: 268, y: 172, direction: 1, action: 'walk' }, 500);

    expect(moved.x).toBeGreaterThan(120);
    expect(moved.y).toBe(172);
    expect(bounced.x).toBe(272);
    expect(bounced.direction).toBe(-1);
  });

  it('falls with gravity until landing on the desktop floor', () => {
    const initial = createInitialShimejiWorld({ width: 400, height: 300, spriteSize: 128 });

    const falling = tickShimejiWorld({ ...initial, x: 80, y: 20, vy: 0, action: 'fall' }, 250);
    const landed = tickShimejiWorld({ ...initial, x: 80, y: 160, vy: 220, action: 'fall' }, 250);

    expect(falling.y).toBeGreaterThan(20);
    expect(falling.action).toBe('fall');
    expect(landed.y).toBe(172);
    expect(landed.vy).toBe(0);
    expect(landed.action).toBe('idle');
  });

  it('climbs screen edges instead of sliding like a static mascot', () => {
    const initial = createInitialShimejiWorld({ width: 400, height: 300, spriteSize: 128 });

    const climbing = tickShimejiWorld({ ...initial, x: 272, y: 120, direction: 1, action: 'climb' }, 500);
    const hanging = tickShimejiWorld({ ...initial, x: 272, y: 2, direction: 1, action: 'climb' }, 500);

    expect(climbing.x).toBe(272);
    expect(climbing.y).toBeLessThan(120);
    expect(climbing.action).toBe('climb');
    expect(hanging.y).toBe(0);
    expect(hanging.action).toBe('hang');
  });

  it('uses drag pose while the user is holding the pet', () => {
    const initial = createInitialShimejiWorld({ width: 400, height: 300, spriteSize: 128 });

    const dragged = tickShimejiWorld({ ...initial, x: 30, y: 40, action: 'walk' }, 500, {
      dragging: true,
      pointerX: 200,
      pointerY: 140,
    });

    expect(dragged.action).toBe('drag');
    expect(dragged.x).toBe(136);
    expect(dragged.y).toBe(76);
    expect(dragged.vx).toBe(0);
    expect(dragged.vy).toBe(0);
  });
});
