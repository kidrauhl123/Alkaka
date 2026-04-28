import { describe, expect, it } from 'vitest';

import type { ShimejiAction, ShimejiCharacterPack, ShimejiPose } from '../types/pet';
import {
  buildFrameCssVars,
  groupShimejiFramesByAction,
  REQUIRED_SHIMEJI_ACTIONS,
  validateShimejiCharacterPack,
} from './shimejiAssets';

function getDefaultPoseForAction(action: ShimejiAction): ShimejiPose {
  switch (action) {
    case 'walk':
      return 'walk-left-step';
    case 'climb':
      return 'climb-reach';
    case 'hang':
      return 'hang-dangle';
    case 'sleep':
      return 'sleep-curl';
    case 'drag':
      return 'drag-lifted';
    case 'fall':
      return 'fall-tumble';
    case 'sit':
      return 'sit-thinking';
    case 'idle':
      return 'stand-soft';
  }
}

function makeValidPack(overrides: Partial<ShimejiCharacterPack> = {}): ShimejiCharacterPack {
  const frames = REQUIRED_SHIMEJI_ACTIONS.map((action, index) => ({
    id: `${action}-0`,
    action,
    pose: getDefaultPoseForAction(action),
    durationMs: 120,
    x: index * 128,
    y: 0,
    width: 128,
    height: 128,
    anchorX: 64,
    anchorY: 120,
  }));

  return {
    id: 'default-cat',
    displayName: 'Default Cat',
    frameSize: 128,
    spriteSheetUrl: '/pets/default-cat.png',
    frames,
    ...overrides,
  };
}

describe('shimejiAssets', () => {
  it('validates a complete sprite manifest with every required Shimeji action', () => {
    const result = validateShimejiCharacterPack(makeValidPack());

    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects packs missing required actions', () => {
    const pack = makeValidPack({
      frames: makeValidPack().frames.filter((frame) => frame.action !== 'climb'),
    });

    const result = validateShimejiCharacterPack(pack);

    expect(result.ok).toBe(false);
    expect(result.errors).toContain('missing required action: climb');
  });

  it('rejects frames with invalid duration, size, or anchors', () => {
    const [firstFrame, ...rest] = makeValidPack().frames;
    const pack = makeValidPack({
      frames: [{ ...firstFrame, durationMs: 0, width: 0, anchorX: -1, anchorY: 999 }, ...rest],
    });

    const result = validateShimejiCharacterPack(pack);

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        'frame idle-0 durationMs must be positive',
        'frame idle-0 width and height must be positive',
        'frame idle-0 anchorX must be within frame width',
        'frame idle-0 anchorY must be within frame height',
      ])
    );
  });

  it('groups frames by action while preserving manifest frame order', () => {
    const pack = makeValidPack({
      frames: [
        { ...makeValidPack().frames[1], id: 'walk-0', action: 'walk', pose: 'walk-left-step', x: 128 },
        { ...makeValidPack().frames[1], id: 'walk-1', action: 'walk', pose: 'walk-right-step', x: 256 },
        ...makeValidPack().frames.filter((frame) => frame.action !== 'walk'),
      ],
    });

    const grouped = groupShimejiFramesByAction(pack);

    expect(grouped.walk.map((frame) => frame.id)).toEqual(['walk-0', 'walk-1']);
    expect(grouped.idle).toHaveLength(1);
  });

  it('computes CSS variables for sprite-sheet background positioning and anchors', () => {
    const frame = makeValidPack().frames[2];

    const vars = buildFrameCssVars(frame);

    expect(vars).toEqual({
      '--shimeji-anchor-x': '64px',
      '--shimeji-anchor-y': '120px',
      '--shimeji-frame-height': '128px',
      '--shimeji-frame-width': '128px',
      '--shimeji-frame-x': '-256px',
      '--shimeji-frame-y': '0px',
    });
  });
});
