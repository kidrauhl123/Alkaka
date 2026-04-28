import type { PetStatus } from '../../types/pet';
import { getPetStatusPresentation } from '../../utils/petStatus';

interface PetStatusBadgeProps {
  status?: PetStatus;
}

export function PetStatusBadge({ status = 'idle' }: PetStatusBadgeProps) {
  const presentation = getPetStatusPresentation(status);

  return (
    <div
      className={`pet-status-badge pet-status-badge--${presentation.tone}`}
      aria-label={presentation.ariaLabel}
    >
      <span className="pet-status-badge__dot" aria-hidden="true" />
      <span>{presentation.label}</span>
    </div>
  );
}
