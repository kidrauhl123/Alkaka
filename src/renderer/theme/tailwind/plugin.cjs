/**
 * Tailwind CSS v3 plugin — bridges --alkaka-* CSS variables into Tailwind utility classes.
 *
 * Usage in tailwind.config.js:
 *   plugins: [require('./src/renderer/theme/tailwind/plugin.cjs')]
 *
 * Provides: bg-background, text-foreground, bg-primary, border-border, etc.
 * Also provides legacy claude.* aliases for backward compatibility.
 */
const plugin = require('tailwindcss/plugin');

module.exports = plugin(function () {
  // The plugin itself is a no-op; we only extend the theme below.
}, {
  theme: {
    extend: {
      colors: {
        // === Semantic theme colors (driven by CSS variables) ===
        background:    'var(--alkaka-background)',
        foreground:    'var(--alkaka-foreground)',
        primary: {
          DEFAULT:     'var(--alkaka-primary)',
          foreground:  'var(--alkaka-primary-foreground)',
          hover:       'var(--alkaka-primary-hover)',
          muted:       'var(--alkaka-primary-muted)',
          dark:        'var(--alkaka-primary-hover)',  // backward compat alias
        },
        accent: {
          DEFAULT:     'var(--alkaka-accent)',
          foreground:  'var(--alkaka-accent-foreground)',
        },
        surface: {
          DEFAULT:     'var(--alkaka-surface)',
          foreground:  'var(--alkaka-surface-foreground)',
          raised:      'var(--alkaka-surface-raised)',
          overlay:     'var(--alkaka-surface-overlay)',
          inset:       'var(--alkaka-surface-raised)',  // alias
        },
        border: {
          DEFAULT:     'var(--alkaka-border)',
          subtle:      'var(--alkaka-border-subtle)',
          input:       'var(--alkaka-input-border)',
        },
        muted:         'var(--alkaka-text-muted)',
        destructive: {
          DEFAULT:     'var(--alkaka-destructive)',
          foreground:  'var(--alkaka-destructive-foreground)',
        },
        success:       'var(--alkaka-success)',
        warning:       'var(--alkaka-warning)',

        // === Legacy claude.* aliases (map to --alkaka-* for backward compat) ===
        claude: {
          bg:                'var(--alkaka-background)',
          surface:           'var(--alkaka-surface)',
          surfaceHover:      'var(--alkaka-surface-raised)',
          surfaceMuted:      'var(--alkaka-surface-raised)',
          surfaceInset:      'var(--alkaka-surface-raised)',
          border:            'var(--alkaka-border)',
          borderLight:       'var(--alkaka-border-subtle)',
          text:              'var(--alkaka-text-primary)',
          textSecondary:     'var(--alkaka-text-secondary)',
          // dark.* aliases point to the same vars — theme handles light/dark
          darkBg:            'var(--alkaka-background)',
          darkSurface:       'var(--alkaka-surface)',
          darkSurfaceHover:  'var(--alkaka-surface-raised)',
          darkSurfaceMuted:  'var(--alkaka-surface-raised)',
          darkSurfaceInset:  'var(--alkaka-surface-raised)',
          darkBorder:        'var(--alkaka-border)',
          darkBorderLight:   'var(--alkaka-border-subtle)',
          darkText:          'var(--alkaka-text-primary)',
          darkTextSecondary: 'var(--alkaka-text-secondary)',
          // Accent
          accent:            'var(--alkaka-primary)',
          accentHover:       'var(--alkaka-primary-hover)',
          accentLight:       'var(--alkaka-primary)',
          accentMuted:       'var(--alkaka-primary-muted)',
        },
        secondary: {
          DEFAULT: 'var(--alkaka-text-secondary)',
          dark:    'var(--alkaka-border)',
        },
      },
      borderRadius: {
        theme: 'var(--alkaka-radius)',
      },
    },
  },
});
