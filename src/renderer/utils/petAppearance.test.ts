import { describe, expect, test } from 'vitest';

import {
  getDefaultPetAppearance,
  normalizePetAppearance,
  parsePetAppearanceParams,
} from './petAppearance';

describe('pet appearance customization', () => {
  test('defaults to a shimeji-style mascot instead of the app logo', () => {
    expect(getDefaultPetAppearance()).toEqual({
      species: 'cat',
      name: 'Alkaka',
      bodyColor: '#ffe1ec',
      accentColor: '#ff7aa8',
      eyeColor: '#2f3142',
      accessory: 'ribbon',
    });
  });

  test('accepts safe user customization values', () => {
    expect(
      normalizePetAppearance({
        species: 'bunny',
        name: 'Mika',
        bodyColor: '#dbeafe',
        accentColor: '#60a5fa',
        eyeColor: '#111827',
        accessory: 'star',
      })
    ).toEqual({
      species: 'bunny',
      name: 'Mika',
      bodyColor: '#dbeafe',
      accentColor: '#60a5fa',
      eyeColor: '#111827',
      accessory: 'star',
    });
  });

  test('falls back when customization is unsafe or unknown', () => {
    expect(
      normalizePetAppearance({
        species: 'dragon',
        name: '<script>alert(1)</script>',
        bodyColor: 'url(javascript:alert(1))',
        accentColor: 'red',
        eyeColor: '#12345g',
        accessory: 'laser',
      })
    ).toEqual(getDefaultPetAppearance());
  });

  test('parses query params for shareable local preview customization', () => {
    const params = new URLSearchParams(
      'petSpecies=bunny&petName=%E5%B0%8F%E5%92%AA&petBody=%23fef3c7&petAccent=%23f59e0b&petEye=%23111827&petAccessory=bell'
    );

    expect(parsePetAppearanceParams(params)).toEqual({
      species: 'bunny',
      name: '小咪',
      bodyColor: '#fef3c7',
      accentColor: '#f59e0b',
      eyeColor: '#111827',
      accessory: 'bell',
    });
  });
});
