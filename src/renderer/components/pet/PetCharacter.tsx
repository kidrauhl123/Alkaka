import type { CSSProperties } from 'react';

import type { PetAppearance } from '../../types/pet';
import { getDefaultPetAppearance } from '../../utils/petAppearance';

interface PetCharacterProps {
  appearance?: PetAppearance;
}

export function PetCharacter({ appearance = getDefaultPetAppearance() }: PetCharacterProps) {
  const isBunny = appearance.species === 'bunny';
  const showRibbon = appearance.accessory === 'ribbon';
  const showBell = appearance.accessory === 'bell';
  const showStar = appearance.accessory === 'star';

  return (
    <svg
      className="pet-character-art"
      viewBox="0 0 220 220"
      role="img"
      aria-label={`${appearance.name} 桌宠形象`}
      style={
        {
          '--pet-body': appearance.bodyColor,
          '--pet-accent': appearance.accentColor,
          '--pet-eye': appearance.eyeColor,
        } as CSSProperties
      }
    >
      <defs>
        <filter id="pet-soft-shadow" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="10" stdDeviation="9" floodColor="#1f2937" floodOpacity="0.2" />
        </filter>
        <linearGradient id="pet-body-shine" x1="44" x2="168" y1="38" y2="190">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.72" />
          <stop offset="0.45" stopColor="var(--pet-body)" stopOpacity="1" />
          <stop offset="1" stopColor="var(--pet-accent)" stopOpacity="0.22" />
        </linearGradient>
      </defs>

      <g className="pet-character-art__float" filter="url(#pet-soft-shadow)">
        {isBunny ? (
          <>
            <path className="pet-character-art__ear" d="M72 65C52 28 58 10 73 8c16-2 27 24 29 63Z" />
            <path className="pet-character-art__ear" d="M132 71c2-40 16-66 32-61 15 5 15 27-9 64Z" />
            <path className="pet-character-art__inner-ear" d="M77 59C65 34 67 22 75 20c8-1 15 17 17 42Z" />
            <path className="pet-character-art__inner-ear" d="M140 63c3-26 11-44 19-41 8 3 6 17-9 43Z" />
          </>
        ) : (
          <>
            <path className="pet-character-art__ear" d="M57 81 79 35l29 48Z" />
            <path className="pet-character-art__ear" d="m119 82 31-47 18 49Z" />
            <path className="pet-character-art__inner-ear" d="m70 74 11-22 14 23Z" />
            <path className="pet-character-art__inner-ear" d="m133 74 14-22 9 24Z" />
          </>
        )}

        <ellipse className="pet-character-art__body" cx="109" cy="127" rx="68" ry="72" />
        <ellipse className="pet-character-art__belly" cx="109" cy="147" rx="39" ry="37" />

        <path className="pet-character-art__arm" d="M49 133c-23 7-29 27-18 34 13 8 29-8 38-24" />
        <path className="pet-character-art__arm" d="M169 133c23 7 29 27 18 34-13 8-29-8-38-24" />
        <ellipse className="pet-character-art__foot" cx="74" cy="188" rx="23" ry="13" />
        <ellipse className="pet-character-art__foot" cx="144" cy="188" rx="23" ry="13" />

        <ellipse className="pet-character-art__eye" cx="84" cy="118" rx="7" ry="9" />
        <ellipse className="pet-character-art__eye" cx="134" cy="118" rx="7" ry="9" />
        <circle className="pet-character-art__eye-spark" cx="87" cy="114" r="2.2" />
        <circle className="pet-character-art__eye-spark" cx="137" cy="114" r="2.2" />
        <path className="pet-character-art__mouth" d="M102 137q7 8 14 0" />
        <path className="pet-character-art__blush" d="M61 136q12 5 24 0" />
        <path className="pet-character-art__blush" d="M133 136q12 5 24 0" />

        {showRibbon ? (
          <g className="pet-character-art__accessory">
            <path d="M95 168 72 155c-6-4-5-12 2-14l24-6Z" />
            <path d="m123 168 23-13c6-4 5-12-2-14l-24-6Z" />
            <circle cx="109" cy="152" r="10" />
          </g>
        ) : null}

        {showBell ? (
          <g className="pet-character-art__accessory">
            <path d="M93 156h32l-4 24H97Z" />
            <path d="M96 157q13-16 26 0" fill="none" />
            <circle cx="109" cy="176" r="3" />
          </g>
        ) : null}

        {showStar ? (
          <path
            className="pet-character-art__accessory"
            d="m109 139 7 15 16 2-12 11 3 16-14-8-14 8 3-16-12-11 16-2Z"
          />
        ) : null}
      </g>
    </svg>
  );
}
