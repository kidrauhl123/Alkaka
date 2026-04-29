import { describe, expect, it } from 'vitest';

import { getPetPrimaryClickAction, isPointInsideVisiblePetPixels, type PetAlphaMaskLike } from './petInteraction';

function createMask(visiblePoints: Array<[number, number]>, alpha = 255): PetAlphaMaskLike {
  const visible = new Map(visiblePoints.map(([x, y]) => [`${x},${y}`, alpha]));
  return {
    width: 128,
    height: 128,
    alphaAt: (x, y) => visible.get(`${x},${y}`) ?? 0,
  };
}

describe('pet visible pixel hit area', () => {
  it('accepts only pixels that are visibly painted by the current pet frame', () => {
    const mask = createMask([[64, 64], [29, 89], [53, 102]]);

    expect(isPointInsideVisiblePetPixels({ x: 64, y: 64 }, mask)).toBe(true);
    expect(isPointInsideVisiblePetPixels({ x: 29, y: 89 }, mask)).toBe(true);
    expect(isPointInsideVisiblePetPixels({ x: 53, y: 102 }, mask)).toBe(true);
  });

  it('rejects transparent holes, square corners, and low-alpha shadow pixels', () => {
    const mask = createMask([[64, 116]], 20);

    expect(isPointInsideVisiblePetPixels({ x: 0, y: 0 }, mask)).toBe(false);
    expect(isPointInsideVisiblePetPixels({ x: 10, y: 64 }, mask)).toBe(false);
    expect(isPointInsideVisiblePetPixels({ x: 64, y: 116 }, mask)).toBe(false);
    expect(isPointInsideVisiblePetPixels({ x: -1, y: 64 }, mask)).toBe(false);
  });
});

describe('pet primary click behavior', () => {
  it('does not open the quick conversation on a single left click even on visible pixels', () => {
    expect(getPetPrimaryClickAction({ detail: 1, hasMoved: false, hitVisiblePixels: true })).toBe('none');
  });

  it('opens the quick conversation only on a double click on visible pixels without drag', () => {
    expect(getPetPrimaryClickAction({ detail: 2, hasMoved: false, hitVisiblePixels: true })).toBe('openQuickInput');
    expect(getPetPrimaryClickAction({ detail: 2, hasMoved: false, hitVisiblePixels: false })).toBe('none');
    expect(getPetPrimaryClickAction({ detail: 2, hasMoved: true, hitVisiblePixels: true })).toBe('none');
  });
});
