import { describe, expect, it } from 'vitest';

import { REQUIRED_SHIMEJI_ACTIONS, validateShimejiCharacterPack } from './shimejiAssets';
import { DEFAULT_SHIMEJI_CHARACTER_PACK } from './shimejiDefaultPack';

describe('DEFAULT_SHIMEJI_CHARACTER_PACK', () => {
  it('is the accepted egg-no-top-horns atlas with refined natural hands, not the old horned placeholder', () => {
    expect(DEFAULT_SHIMEJI_CHARACTER_PACK).toMatchObject({
      id: 'alkaka-shimeji-egg-no-horns-v5',
      displayName: 'Alkaka Shimeji — egg silhouette, natural hands v5',
      spriteSheetUrl: '/pets/alkaka-shimeji/alkaka-shimeji-atlas-v5.svg',
    });
    expect(DEFAULT_SHIMEJI_CHARACTER_PACK.spriteSheetUrl).not.toMatch(/^data:/);
    expect(DEFAULT_SHIMEJI_CHARACTER_PACK.id).not.toContain('placeholder');
  });

  it('is a valid manifest-backed sprite pack for every required action', () => {
    const result = validateShimejiCharacterPack(DEFAULT_SHIMEJI_CHARACTER_PACK);

    expect(result).toEqual({ ok: true, errors: [] });

    for (const action of REQUIRED_SHIMEJI_ACTIONS) {
      expect(DEFAULT_SHIMEJI_CHARACTER_PACK.frames.some((frame) => frame.action === action)).toBe(true);
    }
  });
});
