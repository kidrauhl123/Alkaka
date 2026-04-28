import { describe, expect, test } from 'vitest';

const {
  buildGitEnv,
  buildNpmPackEnv,
  isGitSpec,
  isLocalPathSpec,
  parseGitSpec,
  resolveGitPackSpec,
  resolvePluginInstallSource,
} = require('../scripts/ensure-openclaw-plugins.cjs');

describe('ensure-openclaw-plugins', () => {
  test('detects local path specs', () => {
    expect(isLocalPathSpec('/tmp/openclaw-sample-plugin')).toBe(true);
    expect(isLocalPathSpec('./plugins/openclaw-sample-plugin')).toBe(true);
    expect(isLocalPathSpec('@scope/openclaw-plugin')).toBe(false);
  });

  test('detects git specs from GitHub', () => {
    expect(isGitSpec('git+https://github.com/example/openclaw-sample-plugin.git')).toBe(true);
    expect(isGitSpec('https://github.com/example/openclaw-sample-plugin.git')).toBe(true);
    expect(isGitSpec('github:example/openclaw-sample-plugin')).toBe(true);
    expect(isGitSpec('@scope/openclaw-plugin')).toBe(false);
  });

  test('appends version as git ref when the spec has no hash', () => {
    expect(resolveGitPackSpec(
      'git+https://github.com/example/openclaw-sample-plugin.git',
      '1.0.3',
    )).toBe('git+https://github.com/example/openclaw-sample-plugin.git#1.0.3');

    expect(resolveGitPackSpec(
      'git+https://github.com/example/openclaw-sample-plugin.git#main',
      '1.0.3',
    )).toBe('git+https://github.com/example/openclaw-sample-plugin.git#main');
  });

  test('resolves git sources to packed installs', () => {
    expect(resolvePluginInstallSource({
      id: 'openclaw-sample-plugin',
      npm: 'git+https://github.com/example/openclaw-sample-plugin.git',
      version: '1.0.3',
    })).toEqual({
      kind: 'git',
      gitSpec: 'git+https://github.com/example/openclaw-sample-plugin.git#1.0.3',
      pinnedDisplaySpec: 'git+https://github.com/example/openclaw-sample-plugin.git#1.0.3',
    });
  });

  test('parses git specs into clone url and ref', () => {
    expect(parseGitSpec(
      'git+https://github.com/example/openclaw-sample-plugin.git',
      '1.1.0',
    )).toEqual({
      cloneUrl: 'https://github.com/example/openclaw-sample-plugin.git',
      ref: '1.1.0',
    });

    expect(parseGitSpec(
      'github:example/openclaw-sample-plugin#main',
      '1.1.0',
    )).toEqual({
      cloneUrl: 'https://github.com/example/openclaw-sample-plugin.git',
      ref: 'main',
    });
  });

  test('clears conflicting npm prefer env vars for git pack', () => {
    process.env.npm_config_prefer_offline = 'true';
    process.env.npm_config_prefer_online = 'true';
    process.env.NPM_CONFIG_PREFER_OFFLINE = 'true';
    process.env.NPM_CONFIG_PREFER_ONLINE = 'true';

    expect(buildNpmPackEnv()).toMatchObject({
      npm_config_prefer_offline: '',
      npm_config_prefer_online: '',
      NPM_CONFIG_PREFER_OFFLINE: '',
      NPM_CONFIG_PREFER_ONLINE: '',
    });

    delete process.env.npm_config_prefer_offline;
    delete process.env.npm_config_prefer_online;
    delete process.env.NPM_CONFIG_PREFER_OFFLINE;
    delete process.env.NPM_CONFIG_PREFER_ONLINE;
  });

  test('disables interactive git prompts for clone', () => {
    expect(buildGitEnv()).toMatchObject({
      GIT_TERMINAL_PROMPT: '0',
    });
  });

  test('preserves existing registry and local path behavior', () => {
    expect(resolvePluginInstallSource({
      id: 'sample-plugin',
      npm: 'sample-plugin',
      version: '2.0.7',
      registry: 'https://registry.npmjs.org',
    })).toEqual({
      kind: 'packed',
      packSpec: 'sample-plugin@2.0.7',
      pinnedDisplaySpec: 'sample-plugin@2.0.7',
      registry: 'https://registry.npmjs.org',
    });

    expect(resolvePluginInstallSource({
      id: 'local-plugin',
      npm: '/tmp/local-plugin',
      version: '1.0.0',
    })).toEqual({
      kind: 'direct',
      installSpec: '/tmp/local-plugin',
      pinnedDisplaySpec: '/tmp/local-plugin',
    });
  });
});
