import type { ShimejiAction, ShimejiAssetFrame, ShimejiCharacterPack, ShimejiFramePlan } from '../types/pet';

export interface ShimejiPackValidationResult {
  ok: boolean;
  errors: string[];
}

export type ShimejiFramesByAction = Record<ShimejiAction, ShimejiAssetFrame[]>;

export type ShimejiFrameCssVars = Record<
  | '--shimeji-frame-x'
  | '--shimeji-frame-y'
  | '--shimeji-frame-width'
  | '--shimeji-frame-height'
  | '--shimeji-anchor-x'
  | '--shimeji-anchor-y',
  string
>;

export const REQUIRED_SHIMEJI_ACTIONS: readonly ShimejiAction[] = [
  'idle',
  'walk',
  'sit',
  'fall',
  'drag',
  'climb',
  'hang',
  'sleep',
];

function createEmptyActionGroups(): ShimejiFramesByAction {
  return {
    idle: [],
    walk: [],
    sit: [],
    fall: [],
    drag: [],
    climb: [],
    hang: [],
    sleep: [],
  };
}

function pushPackLevelErrors(pack: ShimejiCharacterPack, errors: string[]) {
  if (!pack.id.trim()) errors.push('pack id is required');
  if (!pack.displayName.trim()) errors.push('pack displayName is required');
  if (!pack.spriteSheetUrl.trim()) errors.push('pack spriteSheetUrl is required');
  if (pack.frameSize <= 0) errors.push('pack frameSize must be positive');
  if (pack.frames.length === 0) errors.push('pack frames are required');
}

function pushFrameErrors(frame: ShimejiAssetFrame, errors: string[]) {
  if (!frame.id.trim()) errors.push('frame id is required');
  if (frame.durationMs <= 0) errors.push(`frame ${frame.id} durationMs must be positive`);
  if (frame.width <= 0 || frame.height <= 0) errors.push(`frame ${frame.id} width and height must be positive`);
  if (frame.x < 0 || frame.y < 0) errors.push(`frame ${frame.id} x and y must be non-negative`);
  if (frame.anchorX < 0 || frame.anchorX > frame.width) {
    errors.push(`frame ${frame.id} anchorX must be within frame width`);
  }
  if (frame.anchorY < 0 || frame.anchorY > frame.height) {
    errors.push(`frame ${frame.id} anchorY must be within frame height`);
  }
}

export function groupShimejiFramesByAction(pack: Pick<ShimejiCharacterPack, 'frames'>): ShimejiFramesByAction {
  return pack.frames.reduce<ShimejiFramesByAction>((groups, frame) => {
    groups[frame.action].push(frame);
    return groups;
  }, createEmptyActionGroups());
}

export function validateShimejiCharacterPack(pack: ShimejiCharacterPack): ShimejiPackValidationResult {
  const errors: string[] = [];
  pushPackLevelErrors(pack, errors);

  for (const frame of pack.frames) {
    pushFrameErrors(frame, errors);
  }

  const groups = groupShimejiFramesByAction(pack);
  for (const action of REQUIRED_SHIMEJI_ACTIONS) {
    if (groups[action].length === 0) errors.push(`missing required action: ${action}`);
  }

  return { ok: errors.length === 0, errors };
}

export function buildFrameCssVars(frame: ShimejiAssetFrame): ShimejiFrameCssVars {
  return {
    '--shimeji-anchor-x': `${frame.anchorX}px`,
    '--shimeji-anchor-y': `${frame.anchorY}px`,
    '--shimeji-frame-height': `${frame.height}px`,
    '--shimeji-frame-width': `${frame.width}px`,
    '--shimeji-frame-x': `${-frame.x}px`,
    '--shimeji-frame-y': `${-frame.y}px`,
  };
}

export function packToFramePlan(pack: ShimejiCharacterPack): ShimejiFramePlan {
  const groups = groupShimejiFramesByAction(pack);

  return REQUIRED_SHIMEJI_ACTIONS.reduce<ShimejiFramePlan>((plan, action) => {
    plan[action] = groups[action].map((frame) => ({ durationMs: frame.durationMs, pose: frame.pose }));
    return plan;
  }, createEmptyActionGroups() as unknown as ShimejiFramePlan);
}
