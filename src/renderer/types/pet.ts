export type PetStatus = 'idle' | 'thinking' | 'working' | 'waiting_permission' | 'error';

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
