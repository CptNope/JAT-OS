// User preferences. In the WordPress plugin these persist to user meta through
// REST (jat-os/v1/me/preferences); guests and this static example use localStorage.

export type Theme = 'light' | 'dark' | 'auto';
export type Shell = 'dock' | 'taskbar' | 'shelf' | 'activities';
export type LaunchMode = 'embedded' | 'external';

export interface SavedWindow {
  appId: string;
  x: number; y: number; w: number; h: number;
  maximized: boolean;
  workspace: number;
}

export interface Prefs {
  theme: Theme;
  shell: Shell;
  wallpaper: string;
  pinned: string[];
  launchModes: Record<string, LaunchMode>;
  dnd: boolean;
  showDesktopIcons: boolean;
  reduceTransparency: boolean;
  welcomed: boolean;
  restoreSession: boolean;
  session: SavedWindow[];
}

const KEY = 'jat-os:prefs:v1';

export const DEFAULTS: Prefs = {
  theme: 'auto',
  shell: 'dock',
  wallpaper: 'ridge',
  pinned: ['vectorcraft', 'photocraft', 'figcraft', 'pdfcraft', 'wordcraft', 'gridcraft', 'deckcraft', 'designcraft', 'cadcraft', 'soundcraft', 'lightcraft', 'florahearth'],
  launchModes: {},
  dnd: false,
  showDesktopIcons: true,
  reduceTransparency: false,
  welcomed: false,
  restoreSession: true,
  session: [],
};

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULTS);
    return { ...structuredClone(DEFAULTS), ...JSON.parse(raw) };
  } catch {
    return structuredClone(DEFAULTS);
  }
}

export function savePrefs(p: Prefs): void {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* storage unavailable: keep in memory */ }
}

export function resetPrefs(): Prefs {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  return structuredClone(DEFAULTS);
}
