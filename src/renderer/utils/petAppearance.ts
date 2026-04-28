import type { PetAccessory, PetAppearance, PetSpecies } from '../types/pet';

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;
const SAFE_NAME_PATTERN = /^[\p{L}\p{N}\s._-]{1,16}$/u;

const SUPPORTED_SPECIES = new Set<PetSpecies>(['cat', 'bunny']);
const SUPPORTED_ACCESSORIES = new Set<PetAccessory>(['none', 'ribbon', 'bell', 'star']);

const DEFAULT_PET_APPEARANCE: PetAppearance = {
  species: 'cat',
  name: 'Alkaka',
  bodyColor: '#ffe1ec',
  accentColor: '#ff7aa8',
  eyeColor: '#2f3142',
  accessory: 'ribbon',
};

export function getDefaultPetAppearance(): PetAppearance {
  return { ...DEFAULT_PET_APPEARANCE };
}

function normalizeColor(value: unknown, fallback: string): string {
  return typeof value === 'string' && HEX_COLOR_PATTERN.test(value) ? value.toLowerCase() : fallback;
}

function normalizeName(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return SAFE_NAME_PATTERN.test(trimmed) ? trimmed : fallback;
}

function normalizeSpecies(value: unknown, fallback: PetSpecies): PetSpecies {
  return typeof value === 'string' && SUPPORTED_SPECIES.has(value as PetSpecies)
    ? (value as PetSpecies)
    : fallback;
}

function normalizeAccessory(value: unknown, fallback: PetAccessory): PetAccessory {
  return typeof value === 'string' && SUPPORTED_ACCESSORIES.has(value as PetAccessory)
    ? (value as PetAccessory)
    : fallback;
}

type PetAppearanceInput = Partial<Record<keyof PetAppearance, unknown>>;

export function normalizePetAppearance(value: PetAppearanceInput | null | undefined): PetAppearance {
  const fallback = getDefaultPetAppearance();
  if (!value) return fallback;

  return {
    species: normalizeSpecies(value.species, fallback.species),
    name: normalizeName(value.name, fallback.name),
    bodyColor: normalizeColor(value.bodyColor, fallback.bodyColor),
    accentColor: normalizeColor(value.accentColor, fallback.accentColor),
    eyeColor: normalizeColor(value.eyeColor, fallback.eyeColor),
    accessory: normalizeAccessory(value.accessory, fallback.accessory),
  };
}

export function parsePetAppearanceParams(params: URLSearchParams): PetAppearance {
  return normalizePetAppearance({
    species: params.get('petSpecies') ?? undefined,
    name: params.get('petName') ?? undefined,
    bodyColor: params.get('petBody') ?? undefined,
    accentColor: params.get('petAccent') ?? undefined,
    eyeColor: params.get('petEye') ?? undefined,
    accessory: params.get('petAccessory') ?? undefined,
  });
}
