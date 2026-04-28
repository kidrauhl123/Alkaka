import type {
  ShimejiAssetFrame,
  ShimejiCharacterPack,
  ShimejiCharacterTemplate,
  ShimejiSkinAppearance,
  ShimejiTemplateTokenDefinition,
} from '../types/pet';
import { REQUIRED_SHIMEJI_ACTIONS, type ShimejiPackValidationResult } from './shimejiAssets';

function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

function pushTokenDefinitionErrors(token: ShimejiTemplateTokenDefinition, errors: string[]) {
  if (isBlank(token.id)) errors.push('token id is required');
  if (isBlank(token.label)) errors.push(`token ${token.id} label is required`);
  if (isBlank(token.defaultValue)) errors.push(`token ${token.id} defaultValue is required`);

  if (token.type === 'enum') {
    if (!token.allowedValues || token.allowedValues.length === 0) {
      errors.push(`token ${token.id} allowedValues are required for enum tokens`);
      return;
    }

    if (!token.allowedValues.includes(token.defaultValue)) {
      errors.push(`token ${token.id} defaultValue must be one of allowedValues`);
    }
  }
}

function getTemplateTokenMap(template: ShimejiCharacterTemplate): Map<string, ShimejiTemplateTokenDefinition> {
  return new Map(template.tokens.map((token) => [token.id, token]));
}

export function validateShimejiTemplate(template: ShimejiCharacterTemplate): ShimejiPackValidationResult {
  const errors: string[] = [];

  if (isBlank(template.id)) errors.push('template id is required');
  if (isBlank(template.displayName)) errors.push('template displayName is required');
  if (isBlank(template.basePackId)) errors.push('template basePackId is required');
  if (isBlank(template.spriteSheetUrl)) errors.push('template spriteSheetUrl is required');
  if (template.frameSize <= 0) errors.push('template frameSize must be positive');
  if (template.frames.length === 0) errors.push('template frames are required');

  for (const token of template.tokens) {
    pushTokenDefinitionErrors(token, errors);
  }

  const actionSet = new Set(template.frames.map((frame) => frame.action));
  for (const action of REQUIRED_SHIMEJI_ACTIONS) {
    if (!template.requiredActions.includes(action) || !actionSet.has(action)) {
      errors.push(`template missing required action: ${action}`);
    }
  }

  for (const frame of template.frames) {
    if (isBlank(frame.id)) errors.push('template frame id is required');
    if (frame.durationMs <= 0) errors.push(`template frame ${frame.id} durationMs must be positive`);
    if (frame.width <= 0 || frame.height <= 0) errors.push(`template frame ${frame.id} width and height must be positive`);
    if (frame.layers.length === 0) errors.push(`template frame ${frame.id} layers are required`);
  }

  return { ok: errors.length === 0, errors };
}

export function resolveTemplateTokens(
  template: ShimejiCharacterTemplate,
  overrides: Record<string, string> = {},
): Record<string, string> {
  return template.tokens.reduce<Record<string, string>>((resolved, token) => {
    resolved[token.id] = overrides[token.id] ?? token.defaultValue;
    return resolved;
  }, {});
}

export function validateShimejiSkinAppearance(
  template: ShimejiCharacterTemplate,
  appearance: ShimejiSkinAppearance,
): ShimejiPackValidationResult {
  const errors: string[] = [];
  const tokenMap = getTemplateTokenMap(template);

  if (isBlank(appearance.id)) errors.push('appearance id is required');
  if (isBlank(appearance.displayName)) errors.push('appearance displayName is required');
  if (appearance.templateId !== template.id) {
    errors.push(`appearance templateId must be ${template.id}`);
  }

  for (const [tokenId, value] of Object.entries(appearance.tokens)) {
    const definition = tokenMap.get(tokenId);
    if (!definition) {
      errors.push(`unknown token: ${tokenId}`);
      continue;
    }

    if (isBlank(value)) errors.push(`token ${tokenId} value is required`);

    if (definition.type === 'enum' && definition.allowedValues && !definition.allowedValues.includes(value)) {
      errors.push(`token ${tokenId} must be one of allowedValues`);
    }
  }

  return { ok: errors.length === 0, errors };
}

function toPackFrame(frame: ShimejiCharacterTemplate['frames'][number]): ShimejiAssetFrame {
  return {
    action: frame.action,
    anchorX: frame.anchorX,
    anchorY: frame.anchorY,
    durationMs: frame.durationMs,
    height: frame.height,
    id: frame.id,
    pose: frame.pose,
    width: frame.width,
    x: frame.x,
    y: frame.y,
  };
}

export function buildShimejiPackFromTemplate(
  template: ShimejiCharacterTemplate,
  appearance: ShimejiSkinAppearance,
): ShimejiCharacterPack {
  const tokens = resolveTemplateTokens(template, appearance.tokens);

  return {
    displayName: appearance.displayName,
    frameSize: template.frameSize,
    frames: template.frames.map(toPackFrame),
    id: `skin-${appearance.id}`,
    skin: {
      appearanceId: appearance.id,
      author: appearance.author,
      templateId: template.id,
      tokens,
    },
    spriteSheetUrl: appearance.spriteSheetUrl ?? template.spriteSheetUrl,
  };
}
