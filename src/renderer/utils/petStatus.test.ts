import { describe, expect, test } from 'vitest';

import {
  getPetStatusPresentation,
  getPetStatusTone,
  normalizePetStatus,
} from './petStatus';

describe('pet status presentation', () => {
  test('maps idle status to a calm ready presentation', () => {
    expect(getPetStatusPresentation('idle')).toEqual({
      label: '待命中',
      message: '双击打开 Alkaka，或直接开始一次对话。',
      tone: 'neutral',
      ariaLabel: 'Alkaka 桌宠当前待命中',
    });
  });

  test('maps working status to active wording', () => {
    expect(getPetStatusPresentation('working')).toMatchObject({
      label: '工作中',
      tone: 'active',
    });
  });

  test('normalizes unknown status to idle instead of crashing pet UI', () => {
    expect(normalizePetStatus('busy')).toBe('idle');
    expect(normalizePetStatus(undefined)).toBe('idle');
  });

  test('exposes stable tone classes for all supported states', () => {
    expect(getPetStatusTone('idle')).toBe('neutral');
    expect(getPetStatusTone('thinking')).toBe('active');
    expect(getPetStatusTone('working')).toBe('active');
    expect(getPetStatusTone('waiting_permission')).toBe('warning');
    expect(getPetStatusTone('error')).toBe('danger');
  });
});
