import type { ShimejiAction, ShimejiCharacterPack, ShimejiPose } from '../types/pet';

const FRAME_SIZE = 128;
const ANCHOR_X = 64;
const ANCHOR_Y = 116;

const frameSpecs: ReadonlyArray<{
  id: string;
  action: ShimejiAction;
  pose: ShimejiPose;
  durationMs: number;
  cell: number;
}> = [
  { id: 'idle-stand-soft', action: 'idle', pose: 'stand-soft', durationMs: 420, cell: 0 },
  { id: 'idle-stand-blink', action: 'idle', pose: 'stand-blink', durationMs: 180, cell: 1 },
  { id: 'walk-left-step', action: 'walk', pose: 'walk-left-step', durationMs: 120, cell: 2 },
  { id: 'walk-mid-step', action: 'walk', pose: 'walk-mid-step', durationMs: 120, cell: 3 },
  { id: 'walk-right-step', action: 'walk', pose: 'walk-right-step', durationMs: 120, cell: 4 },
  { id: 'walk-turn-step', action: 'walk', pose: 'walk-turn-step', durationMs: 120, cell: 5 },
  { id: 'sit-thinking', action: 'sit', pose: 'sit-thinking', durationMs: 360, cell: 6 },
  { id: 'fall-tumble', action: 'fall', pose: 'fall-tumble', durationMs: 120, cell: 7 },
  { id: 'drag-lifted', action: 'drag', pose: 'drag-lifted', durationMs: 180, cell: 8 },
  { id: 'climb-reach', action: 'climb', pose: 'climb-reach', durationMs: 140, cell: 9 },
  { id: 'climb-pull', action: 'climb', pose: 'climb-pull', durationMs: 140, cell: 10 },
  { id: 'hang-dangle', action: 'hang', pose: 'hang-dangle', durationMs: 320, cell: 11 },
  { id: 'sleep-curl', action: 'sleep', pose: 'sleep-curl', durationMs: 520, cell: 12 },
];

function buildPlaceholderSpriteSheetUrl(): string {
  const cells = frameSpecs
    .map((frame, index) => {
      const x = index * FRAME_SIZE;
      const faceY = frame.action === 'sleep' ? 72 : frame.action === 'hang' ? 42 : 56;
      const bodyRotate = frame.action === 'fall' ? -26 : frame.action === 'hang' ? 180 : 0;
      const label = frame.action.toUpperCase();
      return `
        <g transform="translate(${x} 0)">
          <rect width="128" height="128" fill="none"/>
          <ellipse cx="64" cy="116" rx="34" ry="6" fill="#1f2937" opacity="0.12"/>
          <g transform="translate(64 66) rotate(${bodyRotate})">
            <path d="M-28,-18 C-24,-46 24,-46 28,-18 C34,16 20,38 0,40 C-20,38 -34,16 -28,-18Z" fill="#fff4e6" stroke="#7c4a2d" stroke-width="4" stroke-linejoin="round"/>
            <path d="M-20,-28 L-38,-54 L-20,-44Z" fill="#fff4e6" stroke="#7c4a2d" stroke-width="4" stroke-linejoin="round"/>
            <path d="M20,-28 L38,-54 L20,-44Z" fill="#fff4e6" stroke="#7c4a2d" stroke-width="4" stroke-linejoin="round"/>
            <circle cx="-11" cy="-8" r="5" fill="#27251f"/>
            <circle cx="11" cy="-8" r="5" fill="#27251f"/>
            <path d="M-5,4 Q0,8 5,4" fill="none" stroke="#7c4a2d" stroke-width="3" stroke-linecap="round"/>
            <path d="M-16,22 Q-26,32 -36,24" fill="none" stroke="#7c4a2d" stroke-width="5" stroke-linecap="round"/>
            <path d="M16,22 Q26,32 36,24" fill="none" stroke="#7c4a2d" stroke-width="5" stroke-linecap="round"/>
          </g>
          <text x="64" y="${faceY + 56}" text-anchor="middle" font-size="10" font-family="monospace" fill="#7c4a2d" opacity="0.72">${label}</text>
        </g>`;
    })
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${frameSpecs.length * FRAME_SIZE}" height="${FRAME_SIZE}" viewBox="0 0 ${frameSpecs.length * FRAME_SIZE} ${FRAME_SIZE}">${cells}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const DEFAULT_SHIMEJI_CHARACTER_PACK: ShimejiCharacterPack = {
  id: 'alkaka-placeholder-shimeji-atlas',
  displayName: 'Alkaka Placeholder Shimeji Atlas',
  frameSize: FRAME_SIZE,
  spriteSheetUrl: buildPlaceholderSpriteSheetUrl(),
  frames: frameSpecs.map((frame) => ({
    action: frame.action,
    anchorX: ANCHOR_X,
    anchorY: ANCHOR_Y,
    durationMs: frame.durationMs,
    height: FRAME_SIZE,
    id: frame.id,
    pose: frame.pose,
    width: FRAME_SIZE,
    x: frame.cell * FRAME_SIZE,
    y: 0,
  })),
};
