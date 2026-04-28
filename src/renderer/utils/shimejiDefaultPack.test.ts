import { describe, expect, it } from 'vitest';

import { REQUIRED_SHIMEJI_ACTIONS, validateShimejiCharacterPack } from './shimejiAssets';
import { DEFAULT_SHIMEJI_CHARACTER_PACK } from './shimejiDefaultPack';

describe('DEFAULT_SHIMEJI_CHARACTER_PACK', () => {
  it('is a valid manifest-backed placeholder sprite pack for every required action', () => {
    const result = validateShimejiCharacterPack(DEFAULT_SHIMEJI_CHARACTER_PACK);

    expect(result).toEqual({ ok: true, errors: [] });

    for (const action of REQUIRED_SHIMEJI_ACTIONS) {
      expect(DEFAULT_SHIMEJI_CHARACTER_PACK.frames.some((frame) => frame.action === action)).toBe(true);
    }
  });
});
