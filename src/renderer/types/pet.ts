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
