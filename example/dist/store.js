// User preferences. In the WordPress plugin these persist to user meta through
// REST (jat-os/v1/me/preferences); guests and this static example use localStorage.
const KEY = 'jat-os:prefs:v1';
export const DEFAULTS = {
    theme: 'auto',
    shell: 'dock',
    wallpaper: 'ridge',
    pinned: ['vectorcraft', 'photocraft', 'figcraft', 'pdfcraft', 'wordcraft', 'gridcraft', 'deckcraft', 'designcraft', 'cadcraft', 'florahearth'],
    launchModes: {},
    dnd: false,
    showDesktopIcons: true,
    reduceTransparency: false,
    welcomed: false,
    restoreSession: true,
    session: [],
};
export function loadPrefs() {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw)
            return structuredClone(DEFAULTS);
        return { ...structuredClone(DEFAULTS), ...JSON.parse(raw) };
    }
    catch {
        return structuredClone(DEFAULTS);
    }
}
export function savePrefs(p) {
    try {
        localStorage.setItem(KEY, JSON.stringify(p));
    }
    catch { /* storage unavailable: keep in memory */ }
}
export function resetPrefs() {
    try {
        localStorage.removeItem(KEY);
    }
    catch { /* ignore */ }
    return structuredClone(DEFAULTS);
}
