import { useEffect, useMemo, useState } from 'react';

import type { PetAppearance, PetStatus, ShimejiAction, ShimejiAnimationState } from '../../types/pet';
import {
  advanceShimejiFrame,
  getShimejiFramePlan,
  resolvePetActionFromStatus,
} from '../../utils/shimejiBehavior';
import { PetCharacter } from './PetCharacter';

const TICK_MS = 120;

interface ShimejiSpriteProps {
  appearance?: PetAppearance;
  status: PetStatus;
  forcedAction?: ShimejiAction;
}

export function ShimejiSprite({ appearance, status, forcedAction }: ShimejiSpriteProps) {
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
    const intervalId = window.setInterval(() => {
      setAnimationState((current) => advanceShimejiFrame(current, TICK_MS, framePlan));
    }, TICK_MS);

    return () => window.clearInterval(intervalId);
  }, [framePlan]);

  const frames = framePlan[animationState.action];
  const frame = frames[Math.min(animationState.frameIndex, frames.length - 1)];

  return (
    <span
      className="pet-shimeji-sprite"
      data-shimeji-action={animationState.action}
      data-shimeji-pose={frame.pose}
    >
      <PetCharacter appearance={appearance} status={status} pose={frame.pose} />
    </span>
  );
}
