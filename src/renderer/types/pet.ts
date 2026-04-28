export type PetStatus = 'idle' | 'thinking' | 'working' | 'waiting_permission' | 'error';

export type PetStatusTone = 'neutral' | 'active' | 'warning' | 'danger';

export interface PetStatusPresentation {
  label: string;
  message: string;
  tone: PetStatusTone;
  ariaLabel: string;
}
