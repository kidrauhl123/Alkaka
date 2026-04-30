import { describe, expect, it } from 'vitest';

import {
  SETTINGS_CONTENT_CLASSNAME,
  SETTINGS_MODAL_CLASSNAME,
  SETTINGS_OVERLAY_CLASSNAME,
  SETTINGS_SIDEBAR_CLASSNAME,
} from './settingsLayout';

describe('Settings Alkaka Chat shell layout', () => {
  it('uses a responsive chat-style overlay instead of the legacy fixed desktop modal', () => {
    expect(SETTINGS_OVERLAY_CLASSNAME).toContain('px-2');
    expect(SETTINGS_OVERLAY_CLASSNAME).toContain('pt-[44px]');
    expect(SETTINGS_OVERLAY_CLASSNAME).toContain('items-start');
    expect(SETTINGS_OVERLAY_CLASSNAME).toContain('sm:px-4');
    expect(SETTINGS_MODAL_CLASSNAME).toContain('w-full');
    expect(SETTINGS_MODAL_CLASSNAME).toContain('max-w-[1180px]');
    expect(SETTINGS_MODAL_CLASSNAME).toContain('h-[calc(100vh-52px)]');
    expect(SETTINGS_MODAL_CLASSNAME).toContain('max-h-[calc(100vh-52px)]');
    expect(SETTINGS_MODAL_CLASSNAME).not.toContain('w-[900px]');
    expect(SETTINGS_MODAL_CLASSNAME).not.toContain('h-[80vh]');
  });

  it('collapses the settings sidebar on small windows and keeps content readable', () => {
    expect(SETTINGS_MODAL_CLASSNAME).toContain('flex-col');
    expect(SETTINGS_MODAL_CLASSNAME).toContain('md:flex-row');
    expect(SETTINGS_SIDEBAR_CLASSNAME).toContain('w-full');
    expect(SETTINGS_SIDEBAR_CLASSNAME).toContain('md:w-[236px]');
    expect(SETTINGS_SIDEBAR_CLASSNAME).toContain('border-b');
    expect(SETTINGS_SIDEBAR_CLASSNAME).toContain('md:border-b-0');
    expect(SETTINGS_CONTENT_CLASSNAME).toContain('min-h-0');
    expect(SETTINGS_CONTENT_CLASSNAME).toContain('rounded-b-2xl');
    expect(SETTINGS_CONTENT_CLASSNAME).toContain('md:rounded-r-2xl');
  });
});
