export type PetStatus = 'idle' | 'thinking' | 'working' | 'waiting_permission' | 'error';

export type ShimejiAction = 'idle' | 'walk' | 'sit' | 'fall' | 'drag' | 'climb' | 'hang' | 'sleep';

export type ShimejiPose =
  | 'stand-soft'
  | 'stand-blink'
  | 'walk-left-step'
  | 'walk-mid-step'
  | 'walk-right-step'
  | 'walk-turn-step'
  | 'sit-thinking'
  | 'fall-tumble'
  | 'drag-lifted'
  | 'climb-reach'
  | 'climb-pull'
  | 'hang-dangle'
  | 'sleep-curl';

export interface ShimejiFrame {
  pose: ShimejiPose;
  durationMs: number;
}

export type ShimejiFramePlan = Record<ShimejiAction, ShimejiFrame[]>;

export interface ShimejiAnimationState {
  action: ShimejiAction;
  frameIndex: number;
  elapsedMs: number;
}

export interface ShimejiAssetFrame {
  id: string;
  action: ShimejiAction;
  pose: ShimejiPose;
  durationMs: number;
  x: number;
  y: number;
  width: number;
  height: number;
  anchorX: number;
  anchorY: number;
}

export interface ShimejiSkinMetadata {
  templateId: string;
  appearanceId: string;
  author?: string;
  tokens: Record<string, string>;
}

export interface ShimejiCharacterPack {
  id: string;
  displayName: string;
  frameSize: number;
  spriteSheetUrl: string;
  frames: ShimejiAssetFrame[];
  skin?: ShimejiSkinMetadata;
}

export type ShimejiTemplateTokenType = 'color' | 'enum' | 'string';

export interface ShimejiTemplateTokenDefinition {
  id: string;
  label: string;
  type: ShimejiTemplateTokenType;
  defaultValue: string;
  allowedValues?: string[];
}

export interface ShimejiTemplateFrame extends ShimejiAssetFrame {
  layers: string[];
}

export interface ShimejiCharacterTemplate {
  id: string;
  displayName: string;
  basePackId: string;
  frameSize: number;
  spriteSheetUrl: string;
  requiredActions: ShimejiAction[];
  tokens: ShimejiTemplateTokenDefinition[];
  frames: ShimejiTemplateFrame[];
}

export interface ShimejiSkinAppearance {
  id: string;
  displayName: string;
  templateId: string;
  author?: string;
  spriteSheetUrl?: string;
  tokens: Record<string, string>;
}

export type PetStatusTone = 'neutral' | 'active' | 'warning' | 'danger';

export interface PetStatusPresentation {
  label: string;
  message: string;
  tone: PetStatusTone;
  ariaLabel: string;
}

export type PetSpecies = 'cat' | 'bunny';

export type PetAccessory = 'none' | 'ribbon' | 'bell' | 'star';

export interface PetAppearance {
  species: PetSpecies;
  name: string;
  bodyColor: string;
  accentColor: string;
  eyeColor: string;
  accessory: PetAccessory;
}
