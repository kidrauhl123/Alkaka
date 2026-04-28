import type { SqliteStore } from '../sqliteStore';

const GITHUB_REPO = 'kidrauhl123/Alkaka';

/**
 * Read testMode from store and cache it.
 * Call once at startup and again whenever app_config changes.
 */
export function refreshEndpointsTestMode(store: SqliteStore): void {
  void store;
}

export const getUpdateCheckUrl = (): string => (
  `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`
);

export const getManualUpdateCheckUrl = (): string => (
  getUpdateCheckUrl()
);

export const getFallbackDownloadUrl = (): string => (
  `https://github.com/${GITHUB_REPO}/releases/latest`
);

export const getSkillStoreUrl = (): string => (
  `https://raw.githubusercontent.com/${GITHUB_REPO}/main/SKILLs/skills.config.json`
);
