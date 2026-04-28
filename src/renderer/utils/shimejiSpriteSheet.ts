import type { CSSProperties } from 'react';

import type { ShimejiAnimationState, ShimejiAssetFrame, ShimejiCharacterPack } from '../types/pet';
import { buildFrameCssVars, groupShimejiFramesByAction } from './shimejiAssets';

export type ShimejiSpriteSheetStyle = CSSProperties & ReturnType<typeof buildFrameCssVars>;

export function selectSpriteSheetFrame(
  pack: ShimejiCharacterPack,
  animationState: ShimejiAnimationState,
): ShimejiAssetFrame | undefined {
  const frames = groupShimejiFramesByAction(pack)[animationState.action];
  if (frames.length === 0) return undefined;

  return frames[Math.min(animationState.frameIndex, frames.length - 1)];
}

export function buildSpriteSheetFrameStyle(
  pack: ShimejiCharacterPack,
  frame: ShimejiAssetFrame,
): ShimejiSpriteSheetStyle {
  return {
    ...buildFrameCssVars(frame),
    backgroundImage: `url("${pack.spriteSheetUrl}")`,
    backgroundPosition: `${-frame.x}px ${-frame.y}px`,
    height: `${frame.height}px`,
    width: `${frame.width}px`,
  };
}
