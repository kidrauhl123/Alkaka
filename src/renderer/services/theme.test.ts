import { describe, expect, it } from 'vitest';

import { allThemes } from '../theme';
import { normalizeThemeId } from './theme';

describe('themeService theme registry', () => {
  it('ships only one light theme and one dark theme', () => {
    expect(allThemes.map((theme) => theme.meta.id)).toEqual([
      'classic-light',
      'classic-dark',
    ]);
    expect(allThemes.map((theme) => theme.meta.name)).toEqual([
      '浅色',
      '深色',
    ]);
  });

  it('normalizes removed skin ids to the two supported themes', () => {
    expect(normalizeThemeId('dawn')).toBe('classic-light');
    expect(normalizeThemeId('paper')).toBe('classic-light');
    expect(normalizeThemeId('claude-light')).toBe('classic-light');
    expect(normalizeThemeId('midnight')).toBe('classic-dark');
    expect(normalizeThemeId('ocean')).toBe('classic-dark');
    expect(normalizeThemeId('corporate-dark')).toBe('classic-dark');
    expect(normalizeThemeId('classic-light')).toBe('classic-light');
  });
});
