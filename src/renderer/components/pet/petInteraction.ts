export const PET_CHARACTER_SIZE = { width: 140, height: 164 } as const;

export const PET_VISIBLE_ALPHA_THRESHOLD = 48;

export interface PetHitPoint {
  x: number;
  y: number;
}

export type PetPrimaryClickAction = 'none' | 'openQuickInput';

export interface PetAlphaMaskLike {
  width: number;
  height: number;
  alphaAt: (x: number, y: number) => number;
}

export function isPointInsideVisiblePetPixels(
  point: PetHitPoint,
  mask: PetAlphaMaskLike,
  threshold = PET_VISIBLE_ALPHA_THRESHOLD,
): boolean {
  if (mask.width <= 0 || mask.height <= 0) return false;
  if (point.x < 0 || point.y < 0 || point.x >= mask.width || point.y >= mask.height) return false;

  const alpha = mask.alphaAt(Math.floor(point.x), Math.floor(point.y));
  return alpha > threshold;
}

export function getPetPrimaryClickAction(input: { detail: number; hasMoved: boolean; hitVisiblePixels: boolean }): PetPrimaryClickAction {
  if (input.hasMoved || !input.hitVisiblePixels) return 'none';
  return input.detail >= 2 ? 'openQuickInput' : 'none';
}
