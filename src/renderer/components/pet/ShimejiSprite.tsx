import { useEffect, useMemo, useState } from 'react';

import type {
  PetAppearance,
  PetStatus,
  ShimejiAction,
  ShimejiAnimationState,
  ShimejiCharacterPack,
} from '../../types/pet';
import {
  advanceShimejiFrame,
  getShimejiFramePlan,
  resolvePetActionFromStatus,
} from '../../utils/shimejiBehavior';
import { buildSpriteSheetFrameStyle, selectSpriteSheetFrame } from '../../utils/shimejiSpriteSheet';
import { PetCharacter } from './PetCharacter';

const TICK_MS = 60;

interface ShimejiSpriteProps {
  appearance?: PetAppearance;
  status: PetStatus;
  forcedAction?: ShimejiAction;
  characterPack?: ShimejiCharacterPack;
  animate?: boolean;
}

export function ShimejiSprite({ appearance, status, forcedAction, characterPack, animate = true }: ShimejiSpriteProps) {
  const action = forcedAction ?? resolvePetActionFromStatus(status);
  const framePlan = useMemo(() => getShimejiFramePlan(), []);
  const [animationState, setAnimationState] = useState<ShimejiAnimationState>({
    action,
    frameIndex: 0,
    elapsedMs: 0,
  });

  useEffect(() => {
    setAnimationState({ action, frameIndex: 0, elapsedMs: 0 });
  }, [action]);

  useEffect(() => {
    if (!animate) return undefined;

    const intervalId = window.setInterval(() => {
      setAnimationState((current) => advanceShimejiFrame(current, TICK_MS, framePlan));
    }, TICK_MS);

    return () => window.clearInterval(intervalId);
  }, [animate, framePlan]);

  const frames = framePlan[animationState.action];
  const frame = frames[Math.min(animationState.frameIndex, frames.length - 1)];
  const atlasFrame = characterPack ? selectSpriteSheetFrame(characterPack, animationState) : undefined;

  return (
    <span
      className="pet-shimeji-sprite"
      data-shimeji-action={animationState.action}
      data-shimeji-pack={characterPack?.id ?? 'svg-rig'}
      data-shimeji-pose={atlasFrame?.pose ?? frame.pose}
    >
      {characterPack && atlasFrame ? (
        <span
          aria-hidden="true"
          className="pet-shimeji-frame"
          data-shimeji-frame-id={atlasFrame.id}
          data-shimeji-frame-x={atlasFrame.x}
          data-shimeji-frame-y={atlasFrame.y}
          data-shimeji-frame-width={atlasFrame.width}
          data-shimeji-frame-height={atlasFrame.height}
          data-shimeji-sprite-sheet-url={characterPack.spriteSheetUrl}
          style={buildSpriteSheetFrameStyle(characterPack, atlasFrame)}
        />
      ) : (
        <PetCharacter appearance={appearance} status={status} pose={frame.pose} />
      )}
    </span>
  );
}
