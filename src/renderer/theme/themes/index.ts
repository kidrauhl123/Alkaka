import type { ThemeDefinition } from './types';

import { classicLight } from './classic-light';
import { classicDark }  from './classic-dark';

/** Built-in themes. Alkaka intentionally ships one calm light theme and one calm dark theme. */
export const allThemes: ThemeDefinition[] = [
  classicLight,
  classicDark,
];

/** Quick lookup by theme ID */
export const themeMap = new Map(allThemes.map((t) => [t.meta.id, t]));
