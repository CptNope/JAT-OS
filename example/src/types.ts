import type { Prefs, Shell, Theme, LaunchMode } from './store.js';

export interface WebManifest {
  id: string;
  name: string;
  shortName?: string;
  description: string;
  version: string | null;
  icon: { src: string; color?: string };
  category: string;
  launch: { url: string; mode: LaunchMode | 'integrated'; fallback?: 'external' | 'none'; scope?: string };
  window?: { minWidth?: number; minHeight?: number; preferredWidth?: number; preferredHeight?: number; resizable?: boolean; appThemeColor?: string };
  publisher: { name: string; url?: string };
}

export interface AppDef {
  id: string;            // short id used by the shell, e.g. "vectorcraft"
  manifestId: string;    // reverse-domain id from the manifest
  name: string;
  description: string;
  icon: string;          // absolute URL
  kind: 'web' | 'system';
  category: string;
  url?: string;
  publisher: string;
  version: string | null;
  status?: 'preview';    // system apps that are concepts are marked Preview
  win: { minW: number; minH: number; w: number; h: number };
  render?: (os: OSApi, win: WinHandle) => HTMLElement;
}

export interface WinHandle {
  id: string;
  app: AppDef;
  el: HTMLElement;
  body: HTMLElement;
  setTitle(t: string): void;
  close(): void;
}

export interface Notice {
  id: number;
  title: string;
  body: string;
  appId?: string;
  time: Date;
}

/** What apps and panels may ask of the OS. */
export interface OSApi {
  prefs: Prefs;
  apps: AppDef[];
  app(id: string): AppDef | undefined;
  launch(id: string, opts?: { forceExternal?: boolean }): void;
  launchMode(id: string): LaunchMode;
  setLaunchMode(id: string, m: LaunchMode): void;
  setTheme(t: Theme): void;
  setShell(s: Shell): void;
  setWallpaper(id: string): void;
  setPref<K extends keyof Prefs>(k: K, v: Prefs[K]): void;
  togglePin(id: string): void;
  notify(n: Omit<Notice, 'id' | 'time'>): void;
  exit(): void;
  resetAll(): void;
}

export const WALLPAPERS: { id: string; name: string; light: string; dark: string }[] = [
  { id: 'ridge', name: 'Ridge', light: 'ridge-day.svg', dark: 'ridge-night.svg' },
  { id: 'graphite', name: 'Graphite', light: 'graphite.svg', dark: 'graphite.svg' },
  { id: 'jat-blue', name: 'JAT Blue', light: 'jat-blue.svg', dark: 'jat-blue.svg' },
  { id: 'ridge-night', name: 'Ridge at night', light: 'ridge-night.svg', dark: 'ridge-night.svg' },
];

export const SHELLS: { id: Shell; name: string; summary: string }[] = [
  { id: 'dock', name: 'Dock', summary: 'Menu bar on top, floating dock, controls on the left' },
  { id: 'taskbar', name: 'Taskbar', summary: 'Centered taskbar, Start panel, controls on the right' },
  { id: 'shelf', name: 'Shelf', summary: 'Bottom shelf, full launcher, rounded controls' },
  { id: 'activities', name: 'Activities', summary: 'Top bar, overview of windows and workspaces' },
];
