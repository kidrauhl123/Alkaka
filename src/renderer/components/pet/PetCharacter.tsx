import type { CSSProperties } from 'react';

import type { PetAppearance, PetStatus, ShimejiPose } from '../../types/pet';
import { getDefaultPetAppearance } from '../../utils/petAppearance';

interface PetCharacterProps {
  appearance?: PetAppearance;
  status?: PetStatus;
  pose?: ShimejiPose;
}

export function PetCharacter({
  appearance = getDefaultPetAppearance(),
  status = 'idle',
  pose = 'stand-soft',
}: PetCharacterProps) {
  const isBunny = appearance.species === 'bunny';
  const showRibbon = appearance.accessory === 'ribbon';
  const showBell = appearance.accessory === 'bell';
  const showStar = appearance.accessory === 'star';
  const isWorking = status === 'working' || status === 'thinking';
  const needsAttention = status === 'waiting_permission';
  const isError = status === 'error';

  return (
    <svg
      className={`pet-character-art pet-character-art--${status} pet-character-art--pose-${pose}`}
      viewBox="0 0 260 260"
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
        <filter id="pet-soft-shadow" x="-24%" y="-24%" width="148%" height="160%">
          <feDropShadow dx="0" dy="16" stdDeviation="12" floodColor="#3f2f2b" floodOpacity="0.2" />
        </filter>
        <radialGradient id="pet-body-shine" cx="34%" cy="22%" r="78%">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.94" />
          <stop offset="0.42" stopColor="var(--pet-body)" stopOpacity="1" />
          <stop offset="1" stopColor="var(--pet-accent)" stopOpacity="0.36" />
        </radialGradient>
        <linearGradient id="pet-cheek-glow" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#ffb7c8" stopOpacity="0.68" />
          <stop offset="1" stopColor="var(--pet-accent)" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      <ellipse className="pet-character-art__ground" cx="130" cy="229" rx="75" ry="16" />

      <g className="pet-character-art__float" filter="url(#pet-soft-shadow)">
        {!isBunny ? <path className="pet-character-art__tail" d="M185 165c35-2 45-39 21-52-16-8-31 6-22 22 7 12 23 5 23-6" /> : null}

        {isBunny ? (
          <g className="pet-character-art__ears pet-character-art__ears--bunny">
            <path className="pet-character-art__ear" d="M74 91C42 45 48 11 68 8c22-4 40 30 47 86Z" />
            <path className="pet-character-art__ear" d="M144 92c7-57 31-91 53-82 20 8 15 42-25 86Z" />
            <path className="pet-character-art__inner-ear" d="M80 79C61 48 63 24 72 22c10-2 24 25 31 62Z" />
            <path className="pet-character-art__inner-ear" d="M153 81c8-39 25-62 35-57 9 5 1 28-25 59Z" />
          </g>
        ) : (
          <g className="pet-character-art__ears pet-character-art__ears--cat">
            <path className="pet-character-art__ear" d="M62 104 82 47c2-7 11-9 16-3l34 48Z" />
            <path className="pet-character-art__ear" d="m130 92 36-49c5-7 15-4 17 4l15 58Z" />
            <path className="pet-character-art__inner-ear" d="m78 94 9-29 20 25Z" />
            <path className="pet-character-art__inner-ear" d="m151 89 20-25 7 31Z" />
          </g>
        )}

        <g className="pet-character-art__body-group">
          <path className="pet-character-art__body" d="M61 149c0-48 31-80 69-80 40 0 71 31 71 80 0 52-28 83-71 83-42 0-69-31-69-83Z" />
          <path className="pet-character-art__head-squish" d="M77 106c14-24 38-35 64-33 25 2 45 15 55 39-18 11-38 17-61 17-24 0-43-7-58-23Z" />
          <ellipse className="pet-character-art__belly" cx="130" cy="173" rx="42" ry="43" />
          <path className="pet-character-art__shine" d="M83 121c10-25 31-37 51-36" />
        </g>

        <path className="pet-character-art__arm pet-character-art__arm--left" d="M69 154c-27 8-39 30-27 43 13 14 35 0 45-26" />
        <path className="pet-character-art__arm pet-character-art__arm--right" d="M188 153c27 7 39 29 28 42-13 15-35 0-46-25" />
        <ellipse className="pet-character-art__foot pet-character-art__foot--left" cx="94" cy="221" rx="28" ry="15" />
        <ellipse className="pet-character-art__foot pet-character-art__foot--right" cx="166" cy="221" rx="28" ry="15" />
        <path className="pet-character-art__toe" d="M81 218q8 5 17 0" />
        <path className="pet-character-art__toe" d="M153 218q8 5 17 0" />

        <g className="pet-character-art__face">
          {isWorking ? (
            <>
              <path className="pet-character-art__sleepy-eye" d="M91 137q13 9 27 0" />
              <path className="pet-character-art__sleepy-eye" d="M143 137q13 9 27 0" />
              <path className="pet-character-art__mouth" d="M122 157q8 7 16 0" />
            </>
          ) : isError ? (
            <>
              <path className="pet-character-art__sleepy-eye" d="m93 130 20 20m0-20-20 20" />
              <path className="pet-character-art__sleepy-eye" d="m147 130 20 20m0-20-20 20" />
              <path className="pet-character-art__mouth pet-character-art__mouth--worried" d="M118 164q12-9 24 0" />
            </>
          ) : (
            <>
              <ellipse className="pet-character-art__eye" cx="105" cy="139" rx="9" ry="13" />
              <ellipse className="pet-character-art__eye" cx="155" cy="139" rx="9" ry="13" />
              <circle className="pet-character-art__eye-spark" cx="108" cy="134" r="3" />
              <circle className="pet-character-art__eye-spark" cx="158" cy="134" r="3" />
              <path className="pet-character-art__mouth" d="M121 159q9 10 18 0" />
            </>
          )}
          <path className="pet-character-art__nose" d="M126 149q4-4 8 0l-4 5Z" />
          {!isBunny ? (
            <g className="pet-character-art__whiskers">
              <path d="M73 147c-14-5-25-5-36 0" />
              <path d="M74 158c-13 2-23 7-32 15" />
              <path d="M186 147c15-5 27-5 38 0" />
              <path d="M186 158c13 2 23 7 32 15" />
            </g>
          ) : null}
          <ellipse className="pet-character-art__cheek" cx="84" cy="160" rx="15" ry="8" />
          <ellipse className="pet-character-art__cheek" cx="176" cy="160" rx="15" ry="8" />
          {needsAttention ? <path className="pet-character-art__attention" d="M187 84v32m0 14v4" /> : null}
        </g>

        {showRibbon ? (
          <g className="pet-character-art__accessory pet-character-art__accessory--ribbon">
            <path d="M116 199 91 187c-8-4-7-15 2-18l25-6Z" />
            <path d="m144 199 25-12c8-4 7-15-2-18l-25-6Z" />
            <circle cx="130" cy="182" r="10" />
            <path className="pet-character-art__accessory-shine" d="M98 176q9-5 18-2" />
          </g>
        ) : null}

        {showBell ? (
          <g className="pet-character-art__accessory pet-character-art__accessory--bell">
            <path d="M111 177h38l-5 26h-28Z" />
            <path d="M115 178q15-17 30 0" fill="none" />
            <path d="M112 190h36" />
            <circle cx="130" cy="198" r="3.5" />
          </g>
        ) : null}

        {showStar ? (
          <path
            className="pet-character-art__accessory pet-character-art__accessory--star"
            d="m130 164 8 16 18 3-13 12 3 18-16-9-16 9 3-18-13-12 18-3Z"
          />
        ) : null}
      </g>
    </svg>
  );
}
