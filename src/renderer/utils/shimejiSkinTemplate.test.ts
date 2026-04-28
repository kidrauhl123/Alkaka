import { describe, expect, it } from 'vitest';

import type { ShimejiCharacterTemplate, ShimejiSkinAppearance } from '../types/pet';
import { REQUIRED_SHIMEJI_ACTIONS, validateShimejiCharacterPack } from './shimejiAssets';
import {
  buildShimejiPackFromTemplate,
  resolveTemplateTokens,
  validateShimejiSkinAppearance,
  validateShimejiTemplate,
} from './shimejiSkinTemplate';

const baseFrames = REQUIRED_SHIMEJI_ACTIONS.map((action, index) => ({
  id: `${action}-frame`,
  action,
  pose:
    action === 'walk'
      ? 'walk-left-step'
      : action === 'sit'
        ? 'sit-thinking'
        : action === 'fall'
          ? 'fall-tumble'
          : action === 'drag'
            ? 'drag-lifted'
            : action === 'climb'
              ? 'climb-reach'
              : action === 'hang'
                ? 'hang-dangle'
                : action === 'sleep'
                  ? 'sleep-curl'
                  : 'stand-soft',
  durationMs: 160,
  x: index * 128,
  y: 0,
  width: 128,
  height: 128,
  anchorX: 64,
  anchorY: 116,
  layers: ['body', 'outline', 'eyes', 'core'],
})) satisfies ShimejiCharacterTemplate['frames'];

const template: ShimejiCharacterTemplate = {
  id: 'alkaka-base-egg-template',
  displayName: 'Alkaka Base Egg Template',
  basePackId: 'alkaka-base-egg',
  frameSize: 128,
  spriteSheetUrl: '/pets/templates/alkaka-base-egg-template/atlas.svg',
  requiredActions: [...REQUIRED_SHIMEJI_ACTIONS],
  tokens: [
    { id: 'bodyColor', label: 'Body color', type: 'color', defaultValue: '#e8dcc8' },
    { id: 'outlineColor', label: 'Outline color', type: 'color', defaultValue: '#4a3428' },
    { id: 'coreColor', label: 'Core color', type: 'color', defaultValue: '#3b82f6' },
    { id: 'species', label: 'Species', type: 'enum', defaultValue: 'egg-companion', allowedValues: ['egg-companion', 'orb-bot'] },
    { id: 'accessory', label: 'Accessory', type: 'enum', defaultValue: 'none', allowedValues: ['none', 'small-scarf'] },
  ],
  frames: baseFrames,
};

describe('validateShimejiTemplate', () => {
  it('accepts a base egg template that covers every required Shimeji action', () => {
    expect(validateShimejiTemplate(template)).toEqual({ ok: true, errors: [] });
  });

  it('reports missing required actions and invalid enum defaults', () => {
    const broken: ShimejiCharacterTemplate = {
      ...template,
      requiredActions: ['idle'],
      tokens: [{ id: 'species', label: 'Species', type: 'enum', defaultValue: 'dragon', allowedValues: ['egg-companion'] }],
      frames: template.frames.filter((frame) => frame.action !== 'sleep'),
    };

    const result = validateShimejiTemplate(broken);

    expect(result.ok).toBe(false);
    expect(result.errors).toContain('template missing required action: sleep');
    expect(result.errors).toContain('token species defaultValue must be one of allowedValues');
  });
});

describe('resolveTemplateTokens', () => {
  it('merges user tokens over defaults while dropping unknown token ids', () => {
    expect(
      resolveTemplateTokens(template, {
        bodyColor: '#222222',
        coreColor: '#00d4ff',
        unknown: 'ignored',
      }),
    ).toEqual({
      bodyColor: '#222222',
      outlineColor: '#4a3428',
      coreColor: '#00d4ff',
      species: 'egg-companion',
      accessory: 'none',
    });
  });
});

describe('validateShimejiSkinAppearance', () => {
  it('accepts token-only user skins that target the template and reject unsupported enum values', () => {
    const appearance: ShimejiSkinAppearance = {
      id: 'night-egg',
      displayName: 'Night Egg',
      templateId: template.id,
      author: 'user',
      tokens: { bodyColor: '#25212d', species: 'orb-bot', accessory: 'small-scarf' },
    };

    expect(validateShimejiSkinAppearance(template, appearance)).toEqual({ ok: true, errors: [] });

    const broken = { ...appearance, tokens: { ...appearance.tokens, species: 'dragon' } };
    expect(validateShimejiSkinAppearance(template, broken).errors).toContain('token species must be one of allowedValues');
  });
});

describe('buildShimejiPackFromTemplate', () => {
  it('turns a template plus appearance tokens into a normal ShimejiCharacterPack', () => {
    const pack = buildShimejiPackFromTemplate(template, {
      id: 'night-egg',
      displayName: 'Night Egg',
      templateId: template.id,
      author: 'Alkaka Official',
      spriteSheetUrl: '/pets/official/night-egg/atlas.svg',
      tokens: { bodyColor: '#25212d', coreColor: '#00d4ff' },
    });

    expect(pack).toMatchObject({
      id: 'skin-night-egg',
      displayName: 'Night Egg',
      frameSize: 128,
      spriteSheetUrl: '/pets/official/night-egg/atlas.svg',
      skin: {
        templateId: 'alkaka-base-egg-template',
        appearanceId: 'night-egg',
        tokens: expect.objectContaining({ bodyColor: '#25212d', coreColor: '#00d4ff' }),
      },
    });
    expect(pack.frames).toHaveLength(template.frames.length);
    expect(validateShimejiCharacterPack(pack).ok).toBe(true);
  });
});
