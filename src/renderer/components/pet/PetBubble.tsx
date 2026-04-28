import type { CSSProperties } from 'react';

import type { PetStatus } from '../../types/pet';
import { getPetStatusPresentation } from '../../utils/petStatus';
import { PetStatusBadge } from './PetStatusBadge';

interface PetBubbleProps {
  status?: PetStatus;
  title?: string;
  style?: CSSProperties;
}

export function PetBubble({ status = 'idle', title = 'Alkaka', style }: PetBubbleProps) {
  const presentation = getPetStatusPresentation(status);

  return (
    <aside className={`pet-bubble pet-bubble--${presentation.tone}`} style={style} aria-live="polite">
      <div className="pet-bubble__header">
        <strong>{title}</strong>
        <PetStatusBadge status={status} />
      </div>
      <p>{presentation.message}</p>
    </aside>
  );
}
