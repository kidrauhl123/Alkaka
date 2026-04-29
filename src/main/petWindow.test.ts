import { describe, expect, it } from 'vitest';

import { PET_WINDOW_DEFAULT_BOUNDS, PET_WINDOW_QUICK_INPUT_BOUNDS } from './petWindow';

describe('pet window bounds', () => {
  it('keeps the default AI pet window small and tight around the visible egg instead of a square image area', () => {
    expect(PET_WINDOW_DEFAULT_BOUNDS).toEqual({ width: 140, height: 164 });
  });

  it('uses a larger anchored window only while quick input is expanded', () => {
    expect(PET_WINDOW_QUICK_INPUT_BOUNDS).toEqual({ width: 360, height: 420 });
  });
});
