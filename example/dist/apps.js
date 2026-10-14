import { ASSETS, h, icon, tile } from './ui.js';
import { SHELLS, WALLPAPERS } from './types.js';
const REGISTRY_URL = new URL('../../registry/apps.json', import.meta.url).href;
export async function loadRegistry() {
    let manifests = [];
    try {
        const res = await fetch(REGISTRY_URL, { cache: 'no-cache' });
        if (!res.ok)
            throw new Error(String(res.status));
        manifests = (await res.json()).apps;
    }
    catch (e) {
        console.warn('[jat-os] registry unavailable', e);
    }
    const web = manifests.map((m) => ({
        id: m.id.split('.').pop(),
        manifestId: m.id,
        name: m.name,
        description: m.description,
        icon: new URL('../' + m.icon.src, REGISTRY_URL).href,
        kind: 'web',
        category: m.category,
        url: m.launch.url,
        publisher: m.publisher.name,
        version: m.version,
        win: {
            minW: m.window?.minWidth ?? 480, minH: m.window?.minHeight ?? 360,
            w: m.window?.preferredWidth ?? 1100, h: m.window?.preferredHeight ?? 720,
        },
    }));
    return [...web, ...SYSTEM_APPS];
}
const sys = (id, name, description, w, h, render, status) => ({
    id, manifestId: `os.jat.${id}`, name, description, icon: `${ASSETS}apps/${id}.svg`, kind: 'system',
    category: 'system', publisher: 'JAT OS', version: null, status, win: { minW: 420, minH: 320, w, h }, render,
});
/* ---------------- Settings ---------------- */
function settings(os, win) {
    const sections = [
        { id: 'appearance', label: 'Appearance', icon: 'contrast' },
        { id: 'shell', label: 'Shell style', icon: 'layout' },
        { id: 'wallpaper', label: 'Wallpaper', icon: 'image' },
        { id: 'notifications', label: 'Notifications', icon: 'bell' },
        { id: 'about', label: 'About', icon: 'info' },
    ];
    const nav = h('nav', { class: 'set-nav', 'aria-label': 'Settings sections' });
    const pane = h('div', { class: 'set-pane', tabindex: '-1' });
    const root = h('div', { class: 'app-settings' }, nav, pane);
    const show = (id) => {
        nav.querySelectorAll('button').forEach((b) => b.setAttribute('aria-current', String(b.dataset.id === id)));
        pane.replaceChildren(render(id));
        win.setTitle(`Settings — ${sections.find((s) => s.id === id).label}`);
    };
    for (const s of sections) {
        nav.append(h('button', { 'data-id': s.id, onclick: () => show(s.id) }, icon(s.icon), s.label));
    }
    win.el.addEventListener('jat:settings-section', (e) => show(e.detail));
    const row = (title, desc, control) => h('div', { class: 'jat-row' }, h('div', { class: 'jat-row__text' }, h('div', { class: 'jat-row__title' }, title), h('div', { class: 'jat-row__desc' }, desc)), control);
    const switchCtl = (label, checked, on) => {
        const s = h('input', { type: 'checkbox', role: 'switch', class: 'jat-switch', 'aria-label': label, checked });
        s.addEventListener('change', () => on(s.checked));
        return s;
    };
    function render(id) {
        const p = os.prefs;
        if (id === 'appearance') {
            const seg = h('div', { class: 'jat-segmented', role: 'radiogroup', 'aria-label': 'Theme' });
            ['light', 'dark', 'auto'].forEach((t) => {
                seg.append(h('button', { role: 'radio', 'aria-checked': String(p.theme === t), onclick: () => { os.setTheme(t); show('appearance'); } }, icon(t === 'light' ? 'sun' : t === 'dark' ? 'moon' : 'contrast', 'jat-icon jat-icon--sm'), t[0].toUpperCase() + t.slice(1)));
            });
            return h('section', {}, h('h2', {}, 'Appearance'), h('div', { class: 'jat-group' }, row('Theme', 'Auto follows your device setting.', seg), row('Reduce transparency', 'Use solid bars, dock and menus instead of see-through ones.', switchCtl('Reduce transparency', p.reduceTransparency, (v) => os.setPref('reduceTransparency', v))), row('Show desktop icons', 'App shortcuts on the desktop.', switchCtl('Show desktop icons', p.showDesktopIcons, (v) => os.setPref('showDesktopIcons', v)))));
        }
        if (id === 'shell') {
            const group = h('div', { class: 'shell-picker', role: 'radiogroup', 'aria-label': 'Shell style' });
            SHELLS.forEach((s) => {
                const btn = h('button', { role: 'radio', 'aria-checked': String(p.shell === s.id), class: 'shell-option', onclick: () => { os.setShell(s.id); show('shell'); } }, h('span', { class: `shell-thumb shell-thumb--${s.id}`, 'aria-hidden': 'true' }, h('i', {}), h('b', {}), h('em', {})), h('span', { class: 'shell-option__name' }, s.name, p.shell === s.id ? icon('check', 'jat-icon jat-icon--sm') : null), h('span', { class: 'shell-option__desc' }, s.summary));
                group.append(btn);
            });
            group.addEventListener('keydown', (e) => {
                const btns = [...group.querySelectorAll('button')];
                const cur = btns.findIndex((b) => b.matches(':focus'));
                const k = e.key;
                if (cur >= 0 && ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(k)) {
                    e.preventDefault();
                    btns[(cur + (k === 'ArrowRight' || k === 'ArrowDown' ? 1 : btns.length - 1)) % btns.length].focus();
                }
            });
            return h('section', {}, h('h2', {}, 'Shell style'), h('p', { class: 'set-lede' }, 'Every style uses the same apps, windows and settings. Only the layout changes, and you can switch at any time.'), group);
        }
        if (id === 'wallpaper') {
            const grid = h('div', { class: 'wall-grid', role: 'radiogroup', 'aria-label': 'Wallpaper' });
            WALLPAPERS.forEach((w) => {
                grid.append(h('button', { role: 'radio', 'aria-checked': String(p.wallpaper === w.id), class: 'wall-option', onclick: () => { os.setWallpaper(w.id); show('wallpaper'); } }, h('img', { src: `${ASSETS}wallpapers/${w.light}`, alt: '', loading: 'lazy' }), h('span', {}, w.name)));
            });
            return h('section', {}, h('h2', {}, 'Wallpaper'), h('p', { class: 'set-lede' }, 'Ridge switches to its night version in dark mode.'), grid);
        }
        if (id === 'notifications') {
            return h('section', {}, h('h2', {}, 'Notifications'), h('div', { class: 'jat-group' }, row('Do not disturb', 'Notifications still collect in the notification center but don’t pop up.', switchCtl('Do not disturb', p.dnd, (v) => os.setPref('dnd', v))), row('Restore windows', 'Reopen the apps you had open the next time you enter JAT OS.', switchCtl('Restore windows', p.restoreSession, (v) => os.setPref('restoreSession', v)))));
        }
        // about
        return h('section', {}, h('h2', {}, 'About'), h('div', { class: 'jat-group' }, row('JAT OS', 'Interactive design prototype. Not the WordPress plugin.', h('span', { class: 'jat-badge jat-badge--accent' }, 'Prototype 0.1')), row('Preferences', 'Saved in this browser only. The plugin will save them to your WordPress account.', h('button', { class: 'jat-btn jat-btn--danger jat-btn--sm', onclick: () => os.resetAll() }, 'Reset JAT OS'))));
    }
    show('appearance');
    return root;
}
/* ---------------- App Manager ---------------- */
function appManager(os) {
    const list = h('div', { class: 'jat-group am-list' });
    const draw = () => {
        list.replaceChildren();
        for (const a of os.apps.filter((x) => x.kind === 'web')) {
            const mode = h('select', { class: 'jat-select am-mode', 'aria-label': `How ${a.name} opens` }, h('option', { value: 'embedded', selected: os.launchMode(a.id) === 'embedded' }, 'In a window'), h('option', { value: 'external', selected: os.launchMode(a.id) === 'external' }, 'In a new tab'));
            mode.addEventListener('change', () => os.setLaunchMode(a.id, mode.value));
            const pinned = os.prefs.pinned.includes(a.id);
            list.append(h('div', { class: 'jat-row am-row' }, tile(a.icon, 40), h('div', { class: 'jat-row__text' }, h('div', { class: 'jat-row__title' }, a.name, ' ', h('span', { class: 'jat-badge' }, a.category)), h('div', { class: 'jat-row__desc' }, a.description, ' ', h('span', { class: 'mono' }, new URL(a.url).host + new URL(a.url).pathname)), h('div', { class: 'jat-row__desc' }, `${a.publisher} · Version not declared`)), h('div', { class: 'am-actions' }, mode, h('button', { class: 'jat-iconbtn', 'aria-pressed': String(pinned), title: pinned ? 'Unpin from dock' : 'Pin to dock', 'aria-label': pinned ? `Unpin ${a.name}` : `Pin ${a.name}`, onclick: () => { os.togglePin(a.id); draw(); } }, icon('pin')), h('button', { class: 'jat-btn jat-btn--sm', onclick: () => os.launch(a.id) }, 'Open'))));
        }
    };
    draw();
    return h('div', { class: 'app-pad' }, h('h2', {}, 'Registered apps'), h('p', { class: 'set-lede' }, 'Apps come from the site’s app registry. Each one keeps its own storage, permissions and offline support.'), list, h('div', { class: 'am-note' }, icon('info', 'jat-icon jat-icon--sm'), h('span', {}, 'Installing, updating and removing apps happens in the WordPress admin. ', h('span', { class: 'jat-badge' }, 'Planned'))));
}
/* ---------------- Files (concept) ---------------- */
function files() {
    return h('div', { class: 'files' }, h('div', { class: 'jat-toolbar' }, h('nav', { class: 'jat-crumbs', 'aria-label': 'Location' }, h('button', { 'aria-current': 'page' }, 'Files')), h('span', { class: 'jat-toolbar__spacer' }), h('span', { class: 'jat-badge' }, 'Preview')), h('div', { class: 'jat-state' }, h('div', { class: 'jat-state__icon' }, icon('folder', 'jat-icon jat-icon--lg')), h('h3', { class: 'jat-state__title' }, 'No file source connected'), h('p', { class: 'jat-state__body' }, 'In the WordPress plugin, Files will show your Media Library. This prototype has no files to browse, and apps keep their own files.')));
}
/* ---------------- About ---------------- */
function about(os) {
    return h('div', { class: 'about' }, h('img', { src: `${ASSETS}logo/jat-os-mark.svg`, alt: '', width: 72, height: 72 }), h('h2', {}, 'JAT OS'), h('p', {}, 'A browser-based desktop that sits on top of a WordPress site. Your site stays the default; JAT OS is a layer you switch into.'), h('dl', { class: 'jat-props' }, h('dt', {}, 'Build'), h('dd', {}, 'Interactive prototype 0.1'), h('dt', {}, 'Shell style'), h('dd', {}, SHELLS.find((s) => s.id === os.prefs.shell).name), h('dt', {}, 'Apps'), h('dd', {}, String(os.apps.filter((a) => a.kind === 'web').length) + ' registered'), h('dt', {}, 'Made by'), h('dd', {}, 'Jeremy Anderson Tech')), h('div', { class: 'about__links' }, h('a', { href: '../brandbook/', target: '_blank', rel: 'noopener', class: 'jat-btn' }, 'Brand book', icon('external', 'jat-icon jat-icon--sm')), h('a', { href: '../', target: '_blank', rel: 'noopener', class: 'jat-btn jat-btn--ghost' }, 'Project overview')));
}
/* ---------------- Welcome ---------------- */
function welcome(os, win) {
    const choices = h('div', { class: 'shell-picker shell-picker--compact', role: 'radiogroup', 'aria-label': 'Shell style' });
    const draw = () => {
        choices.replaceChildren();
        SHELLS.forEach((s) => choices.append(h('button', { role: 'radio', 'aria-checked': String(os.prefs.shell === s.id), class: 'shell-option', onclick: () => { os.setShell(s.id); draw(); } }, h('span', { class: `shell-thumb shell-thumb--${s.id}`, 'aria-hidden': 'true' }, h('i', {}), h('b', {}), h('em', {})), h('span', { class: 'shell-option__name' }, s.name))));
    };
    draw();
    return h('div', { class: 'welcome' }, h('img', { src: `${ASSETS}logo/jat-os-mark.svg`, alt: '', width: 56, height: 56 }), h('h2', {}, 'Welcome to JAT OS'), h('p', {}, 'Open the Craft apps side by side, arrange their windows, and come back to the website whenever you like. Pick the layout that feels like home. You can change it later in Settings.'), choices, h('div', { class: 'welcome__actions' }, h('button', { class: 'jat-btn jat-btn--primary jat-btn--lg', onclick: () => { os.setPref('welcomed', true); win.close(); os.launch('vectorcraft'); } }, 'Open VectorCraft'), h('button', { class: 'jat-btn jat-btn--lg', onclick: () => { os.setPref('welcomed', true); win.close(); } }, 'Explore the desktop')), h('p', { class: 'welcome__fine' }, 'Craft apps load from their own sites. Each one keeps its own files and settings.'));
}
export const SYSTEM_APPS = [
    sys('settings', 'Settings', 'Theme, shell style, wallpaper and notifications.', 860, 580, settings),
    sys('app-manager', 'App Manager', 'See registered apps and choose how they open.', 820, 560, appManager),
    sys('files', 'Files', 'Browse your site’s media.', 760, 500, files, 'preview'),
    sys('about', 'About JAT OS', 'Version and project information.', 460, 520, about),
];
export const WELCOME_APP = { ...sys('about', 'Welcome', '', 640, 540, welcome), id: 'welcome', manifestId: 'os.jat.welcome', icon: `${ASSETS}logo/jat-os-app-icon.svg` };
