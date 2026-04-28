/**
 * Agent engine identifiers.
 *
 * Central source of truth for engine names — never write `'openclaw'` or
 * `'hermes'` as a bare literal. Always import `AgentEngine.OpenClaw` /
 * `AgentEngine.Hermes` and the `AgentEngine` type from this file.
 *
 * Adding a new engine:
 *   1. Add a key here
 *   2. Implement `AgentEngineProtocol` (see `types.ts`) in a new adapter
 *   3. Register the adapter via the `runtimes` map in `CoworkEngineRouter`
 *   4. Add UI affordance in Settings to let user pick it
 */
export const AgentEngine = {
  OpenClaw: 'openclaw',
  Hermes: 'hermes',
} as const;

export type AgentEngine = typeof AgentEngine[keyof typeof AgentEngine];

/** Engine selected by default when user has no preference saved. */
export const DEFAULT_AGENT_ENGINE: AgentEngine = AgentEngine.OpenClaw;

/** Engines that are selectable and fully wired in this build. */
export const SUPPORTED_AGENT_ENGINES: readonly AgentEngine[] = [
  AgentEngine.OpenClaw,
] as const;

/**
 * All known engine identifiers, including engines planned for later phases.
 * Do not use this for user/config validation until an adapter is registered.
 */
export const ALL_AGENT_ENGINES: readonly AgentEngine[] = [
  AgentEngine.OpenClaw,
  AgentEngine.Hermes,
] as const;

export const isAgentEngine = (value: unknown): value is AgentEngine =>
  typeof value === 'string' && (SUPPORTED_AGENT_ENGINES as readonly string[]).includes(value);
