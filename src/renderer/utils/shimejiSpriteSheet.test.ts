import { describe, expect, it } from 'vitest';

import type { ShimejiAnimationState, ShimejiCharacterPack } from '../types/pet';
import { buildSpriteSheetFrameStyle, selectSpriteSheetFrame } from './shimejiSpriteSheet';

const testPack: ShimejiCharacterPack = {
  id: 'test-pack',
  displayName: 'Test Pack',
  frameSize: 128,
  spriteSheetUrl: '/pets/test-sheet.png',
  frames: [
    {
      id: 'idle-0',
      action: 'idle',
      pose: 'stand-soft',
      durationMs: 300,
      x: 0,
      y: 0,
      width: 128,
      height: 128,
      anchorX: 64,
      anchorY: 116,
    },
    {
      id: 'walk-0',
      action: 'walk',
      pose: 'walk-left-step',
      durationMs: 120,
      x: 128,
      y: 0,
      width: 128,
      height: 128,
      anchorX: 64,
      anchorY: 116,
    },
    {
      id: 'walk-1',
      action: 'walk',
      pose: 'walk-right-step',
      durationMs: 120,
      x: 256,
      y: 0,
      width: 128,
      height: 128,
      anchorX: 64,
      anchorY: 116,
    },
  ],
};

describe('shimejiSpriteSheet', () => {
  it('selects the current atlas frame by animation action and frame index', () => {
    const state: ShimejiAnimationState = { action: 'walk', elapsedMs: 0, frameIndex: 1 };

    expect(selectSpriteSheetFrame(testPack, state)).toMatchObject({
      id: 'walk-1',
      pose: 'walk-right-step',
      x: 256,
    });
  });

  it('clamps an out-of-range frame index to the last available action frame', () => {
    const state: ShimejiAnimationState = { action: 'walk', elapsedMs: 0, frameIndex: 99 };

    expect(selectSpriteSheetFrame(testPack, state)?.id).toBe('walk-1');
  });

  it('returns undefined when the pack has no frame for the current action', () => {
    const state: ShimejiAnimationState = { action: 'hang', elapsedMs: 0, frameIndex: 0 };

    expect(selectSpriteSheetFrame(testPack, state)).toBeUndefined();
  });

  it('builds a CSSProperties style for rendering a sprite-sheet atlas frame', () => {
    const frame = testPack.frames[2];

    expect(buildSpriteSheetFrameStyle(testPack, frame)).toMatchObject({
      '--shimeji-anchor-x': '64px',
      '--shimeji-anchor-y': '116px',
      '--shimeji-frame-height': '128px',
      '--shimeji-frame-width': '128px',
      '--shimeji-frame-x': '-256px',
      '--shimeji-frame-y': '0px',
      backgroundImage: 'url("/pets/test-sheet.png")',
      backgroundPosition: '-256px 0px',
      height: '128px',
      width: '128px',
    });
  });
});
