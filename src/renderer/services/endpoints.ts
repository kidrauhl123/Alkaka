const GITHUB_REPO = 'kidrauhl123/Alkaka';

// 自动更新
export const getUpdateCheckUrl = () => `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

// 手动检查更新
export const getManualUpdateCheckUrl = () => getUpdateCheckUrl();

export const getFallbackDownloadUrl = () => `https://github.com/${GITHUB_REPO}/releases/latest`;

// Skill 商店
export const getSkillStoreUrl = () => `https://raw.githubusercontent.com/${GITHUB_REPO}/main/SKILLs/skills.config.json`;
