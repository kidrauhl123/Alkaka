/**
 * Token Contract — defines all semantic variables a theme must provide.
 *
 * Naming: --alkaka-{category}-{name}
 * Convention: shadcn/ui background/foreground pairing + Radix 12-step gray scale
 *
 * Every theme (ThemeDefinition.tokens) must supply a value for each key.
 */
export const TOKEN_CONTRACT = {
  // ── Brand ──
  'primary':            '--alkaka-primary',
  'primary-foreground': '--alkaka-primary-foreground',
  'primary-hover':      '--alkaka-primary-hover',
  'primary-muted':      '--alkaka-primary-muted',

  // ── Accent ──
  'accent':             '--alkaka-accent',
  'accent-foreground':  '--alkaka-accent-foreground',

  // ── Surface / Background ──
  'background':         '--alkaka-background',
  'foreground':         '--alkaka-foreground',
  'surface':            '--alkaka-surface',
  'surface-foreground': '--alkaka-surface-foreground',
  'surface-raised':     '--alkaka-surface-raised',
  'surface-overlay':    '--alkaka-surface-overlay',

  // ── Chat bubbles ──
  'chat-user':              '--alkaka-chat-user',
  'chat-user-foreground':   '--alkaka-chat-user-foreground',
  'chat-bot':               '--alkaka-chat-bot',
  'chat-bot-foreground':    '--alkaka-chat-bot-foreground',

  // ── Text hierarchy ──
  'text-primary':       '--alkaka-text-primary',
  'text-secondary':     '--alkaka-text-secondary',
  'text-muted':         '--alkaka-text-muted',

  // ── Borders ──
  'border':             '--alkaka-border',
  'border-subtle':      '--alkaka-border-subtle',
  'input-border':       '--alkaka-input-border',

  // ── Scrollbar ──
  'scroll-thumb':       '--alkaka-scroll-thumb',
  'scroll-thumb-hover': '--alkaka-scroll-thumb-hover',

  // ── Decorative gradients ──
  'gradient-1':         '--alkaka-gradient-1',
  'gradient-2':         '--alkaka-gradient-2',

  // ── Status ──
  'destructive':            '--alkaka-destructive',
  'destructive-foreground': '--alkaka-destructive-foreground',
  'success':                '--alkaka-success',
  'warning':                '--alkaka-warning',

  // ── Gray scale 11 steps (gray-1=lightest → gray-11=darkest, all themes) ──
  'gray-1':  '--alkaka-gray-1',
  'gray-2':  '--alkaka-gray-2',
  'gray-3':  '--alkaka-gray-3',
  'gray-4':  '--alkaka-gray-4',
  'gray-5':  '--alkaka-gray-5',
  'gray-6':  '--alkaka-gray-6',
  'gray-7':  '--alkaka-gray-7',
  'gray-8':  '--alkaka-gray-8',
  'gray-9':  '--alkaka-gray-9',
  'gray-10': '--alkaka-gray-10',
  'gray-11': '--alkaka-gray-11',

  // ── Radius ──
  'radius':  '--alkaka-radius',
} as const;

export type TokenName = keyof typeof TOKEN_CONTRACT;
export type CSSVarName = (typeof TOKEN_CONTRACT)[TokenName];

/** All token keys as an array */
export const TOKEN_NAMES = Object.keys(TOKEN_CONTRACT) as TokenName[];
