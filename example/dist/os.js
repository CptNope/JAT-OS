// <jat-os>: the JAT OS shell. Everything renders inside a shadow root so the host
// WordPress theme can't style the OS and the OS can't leak styles into the theme.
import { ASSETS, animate, clamp, fmtDate, fmtDay, fmtTime, h, icon, tile } from './ui.js';
import { loadPrefs, resetPrefs, savePrefs } from './store.js';
import { loadRegistry, WELCOME_APP } from './apps.js';
import { WindowManager } from './wm.js';
import { SHELLS, WALLPAPERS } from './types.js';
const SHELL_CSS = new URL('../shell.css', import.meta.url).href;
export class JatOS extends HTMLElement {
    prefs = loadPrefs();
    apps = [];
    shadow;
    os;
    wallpaper;
    desktop;
    winLayer;
    shellUI;
    panelLayer;
    menuLayer;
    toastLayer;
    live;
    tooltip;
    wm;
    panel = null;
    notices = [];
    noticeSeq = 0;
    currentWorkspace = 0;
    workspaceCount = 2;
    clockTimer = 0;
    mq = window.matchMedia('(prefers-color-scheme: dark)');
    ready;
    resolveReady;
    entered = false;
    rerendering = false;
    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: 'open', delegatesFocus: false });
        this.ready = new Promise((r) => (this.resolveReady = r));
    }
    /* ---------------- lifecycle ---------------- */
    async connectedCallback() {
        if (this.os)
            return;
        const css = (href) => h('link', { rel: 'stylesheet', href });
        this.os = h('div', { class: 'jat os', part: 'os' });
        this.wallpaper = h('div', { class: 'wallpaper', 'aria-hidden': 'true' });
        this.desktop = h('div', { class: 'desktop', role: 'list', 'aria-label': 'Desktop' });
        this.winLayer = h('div', { class: 'win-layer' });
        this.shellUI = h('div', { class: 'shell-ui' });
        this.panelLayer = h('div', { class: 'panel-layer' });
        this.menuLayer = h('div', { class: 'menu-layer' });
        this.toastLayer = h('div', { class: 'toast-layer', role: 'status', 'aria-live': 'polite' });
        this.live = h('div', { class: 'jat-visually-hidden', 'aria-live': 'polite' });
        this.tooltip = h('div', { class: 'jat-tooltip os-tooltip', role: 'tooltip', hidden: true });
        this.os.append(this.wallpaper, this.desktop, this.winLayer, this.shellUI, this.panelLayer, this.menuLayer, this.toastLayer, this.tooltip, this.live);
        this.shadow.append(css(`${ASSETS}tokens.css`), css(`${ASSETS}components.css`), css(SHELL_CSS), h('link', { rel: 'preload', as: 'image', href: `${ASSETS}icons.svg` }), this.os);
        this.wm = new WindowManager({
            root: this.winLayer,
            workArea: () => this.workArea(),
            controlsSide: () => (this.prefs.shell === 'dock' ? 'start' : 'end'),
            form: () => this.form(),
            minimizeTarget: (id) => this.shadow.querySelector(`[data-launch="${id}"]`)?.getBoundingClientRect() ?? null,
            onChange: () => this.onWindowsChanged(),
            announce: (m) => this.announce(m),
            openExternal: (a) => this.openExternal(a),
            workspace: () => this.currentWorkspace,
        });
        this.applyLook();
        this.apps = await loadRegistry();
        this.renderShell();
        this.renderDesktop();
        this.wireGlobal();
        this.clockTimer = window.setInterval(() => this.tickClock(), 15000);
        this.resolveReady();
    }
    disconnectedCallback() { clearInterval(this.clockTimer); }
    /** Called by the host page when OS mode is entered. */
    async enter() {
        await this.ready;
        this.hidden = false;
        this.applyLook();
        this.renderShell();
        await animate(this.os, [{ opacity: 0, transform: 'scale(1.015)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 480, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
        if (this.wm.windows.length === 0) {
            if (this.prefs.restoreSession && this.prefs.session.length)
                this.restoreSession();
            this.entered = true;
            if (!this.prefs.welcomed)
                this.openWelcome();
        }
        this.entered = true;
        this.saveSession();
        const first = this.shellUI.querySelector('button');
        (this.wm.focused?.el ?? first)?.focus({ preventScroll: true });
    }
    /* ---------------- OSApi ---------------- */
    app(id) { return this.apps.find((a) => a.id === id); }
    launchMode(id) { return this.prefs.launchModes[id] ?? 'embedded'; }
    setLaunchMode(id, m) {
        this.prefs.launchModes = { ...this.prefs.launchModes, [id]: m };
        this.save();
        this.notify({ title: 'Launch setting saved', body: `${this.app(id)?.name} will open ${m === 'external' ? 'in a new tab' : 'in a window'}.`, appId: 'app-manager' });
    }
    launch(id, opts = {}) {
        const app = this.app(id);
        if (!app)
            return;
        this.closePanel();
        if (app.kind === 'web' && (opts.forceExternal || this.launchMode(id) === 'external')) {
            this.openExternal(app);
            return;
        }
        const existing = this.wm.byApp(id);
        if (existing.length) {
            const w = existing.find((x) => x.workspace === this.currentWorkspace) ?? existing[0];
            if (w.workspace !== this.currentWorkspace)
                this.switchWorkspace(w.workspace);
            this.wm.focus(w);
            return;
        }
        this.openWindow(app);
    }
    openWindow(app, rect) {
        return this.wm.open(app, (win) => (app.kind === 'web' ? this.webFrame(app, win) : app.render(this, win)), { ...rect, badge: app.status === 'preview' ? 'Preview' : undefined });
    }
    openWelcome() {
        this.wm.open(WELCOME_APP, (win) => WELCOME_APP.render(this, win));
    }
    openExternal(app) {
        if (!app.url)
            return;
        const w = window.open(app.url, '_blank', 'noopener');
        this.notify(w === null && !navigator.userAgent.includes('Headless')
            ? { title: `${app.name} was blocked`, body: 'Your browser blocked the new tab. Allow pop-ups for this site, or open the app from App Manager.', appId: app.id }
            : { title: `${app.name} opened in a new tab`, body: 'It runs separately from JAT OS. Come back to this tab any time.', appId: app.id });
    }
    setTheme(t) { this.prefs.theme = t; this.save(); this.applyLook(); }
    setShell(s) {
        if (this.prefs.shell === s)
            return;
        this.prefs.shell = s;
        this.save();
        this.closePanel();
        this.applyLook();
        this.wm.setControlsSide(s === 'dock' ? 'start' : 'end');
        this.renderShell();
        requestAnimationFrame(() => this.wm.relayout());
        this.notify({ title: 'Shell style changed', body: `You’re using ${SHELLS.find((x) => x.id === s).name}. Change it any time in Settings.`, appId: 'settings' });
    }
    setWallpaper(id) { this.prefs.wallpaper = id; this.save(); this.applyLook(); }
    setPref(k, v) {
        this.prefs[k] = v;
        this.save();
        if (k === 'reduceTransparency' || k === 'showDesktopIcons') {
            this.applyLook();
            this.renderDesktop();
        }
        if (k === 'dnd')
            this.renderShell();
    }
    togglePin(id) {
        const p = this.prefs.pinned;
        this.prefs.pinned = p.includes(id) ? p.filter((x) => x !== id) : [...p, id];
        this.save();
        this.renderShell();
    }
    notify(n) {
        const notice = { ...n, id: ++this.noticeSeq, time: new Date() };
        this.notices.unshift(notice);
        this.notices = this.notices.slice(0, 30);
        this.updateBellBadge();
        if (this.panel === 'notifications')
            this.openPanel('notifications', true);
        if (this.prefs.dnd)
            return;
        const app = n.appId ? this.app(n.appId) : undefined;
        const t = h('div', { class: 'jat-toast' }, app ? tile(app.icon, 32) : h('img', { class: 'jat-apptile', src: `${ASSETS}logo/jat-os-app-icon.svg`, alt: '', width: 32, height: 32, style: '--tile:32px' }), h('div', {}, h('div', { class: 'jat-toast__title' }, n.title), h('div', { class: 'jat-toast__body' }, n.body)), h('button', { class: 'jat-iconbtn jat-iconbtn--sm', 'aria-label': 'Dismiss notification', onclick: () => dismiss() }, icon('close', 'jat-icon jat-icon--sm')));
        // one toast per title; at most three on screen
        this.toastLayer.querySelectorAll('.jat-toast').forEach((x) => { if (x.dataset.title === n.title)
            x.remove(); });
        t.dataset.title = n.title;
        this.toastLayer.prepend(t);
        [...this.toastLayer.children].slice(3).forEach((x) => x.remove());
        animate(t, [{ opacity: 0, transform: 'translateY(-8px) scale(0.98)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
        const dismiss = async () => { clearTimeout(timer); await animate(t, [{ opacity: 1 }, { opacity: 0, transform: 'translateX(12px)' }], { duration: 140, easing: 'cubic-bezier(0.7, 0, 0.84, 0)' }); t.remove(); };
        const timer = window.setTimeout(dismiss, 6000);
        t.addEventListener('pointerenter', () => clearTimeout(timer));
    }
    exit() {
        this.closePanel();
        this.closeMenu();
        this.saveSession();
        animate(this.os, [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(1.015)' }], { duration: 300, easing: 'cubic-bezier(0.7, 0, 0.84, 0)' })
            .then(() => this.dispatchEvent(new CustomEvent('jat-exit', { bubbles: true, composed: true })));
    }
    resetAll() {
        this.prefs = resetPrefs();
        for (const w of [...this.wm.windows])
            w.el.remove();
        this.wm.windows = [];
        this.wm.focused = null;
        this.applyLook();
        this.renderShell();
        this.renderDesktop();
        this.openWelcome();
    }
    /* ---------------- look & layout ---------------- */
    resolvedTheme() {
        return this.prefs.theme === 'auto' ? (this.mq.matches ? 'dark' : 'light') : this.prefs.theme;
    }
    form() {
        const w = this.os?.clientWidth || window.innerWidth;
        return w < 600 ? 'phone' : w < 1024 ? 'tablet' : 'desktop';
    }
    applyLook() {
        const d = this.os.dataset;
        d.theme = this.resolvedTheme();
        d.shell = this.prefs.shell;
        d.form = this.form();
        this.os.toggleAttribute('data-solid', this.prefs.reduceTransparency);
        this.os.toggleAttribute('data-noicons', !this.prefs.showDesktopIcons);
        const wp = WALLPAPERS.find((w) => w.id === this.prefs.wallpaper) ?? WALLPAPERS[0];
        this.wallpaper.style.backgroundImage = `url("${ASSETS}wallpapers/${d.theme === 'dark' ? wp.dark : wp.light}")`;
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta)
            meta.setAttribute('content', d.theme === 'dark' ? '#15181e' : '#f8f9fb');
    }
    workArea() {
        const W = this.os.clientWidth, H = this.os.clientHeight;
        const s = this.prefs.shell, f = this.form();
        if (f === 'phone')
            return { x: 0, y: 32, w: W, h: H - 32 - 52 };
        const top = s === 'dock' ? 28 : s === 'activities' ? 32 : 0;
        const bottom = s === 'taskbar' ? 48 : s === 'shelf' ? 56 : s === 'dock' ? 76 : 0;
        return { x: 0, y: top, w: W, h: H - top - bottom };
    }
    /* ---------------- shell rendering ---------------- */
    renderShell() {
        const s = this.prefs.shell;
        this.shellUI.replaceChildren();
        if (this.form() === 'phone') {
            this.renderPhone();
            this.onWindowsChanged();
            return;
        }
        if (s === 'dock')
            this.renderDock();
        else if (s === 'taskbar')
            this.renderTaskbar();
        else if (s === 'shelf')
            this.renderShelf();
        else
            this.renderActivities();
        this.onWindowsChanged();
        this.tickClock();
        this.updateBellBadge();
    }
    shellApps() {
        const pinned = this.prefs.pinned.map((id) => this.app(id)).filter(Boolean);
        const running = this.wm.windows.map((w) => w.app).filter((a) => a.id !== 'welcome' && !pinned.includes(a));
        return [...pinned, ...running.filter((a, i, arr) => arr.indexOf(a) === i)];
    }
    /** A launcher button for an app in a dock/taskbar/shelf. Running state is drawn in onWindowsChanged. */
    appButton(app, size) {
        const b = h('button', { class: 'bar-app', 'data-launch': app.id, 'data-tip': app.name, 'aria-label': app.name }, tile(app.icon, size), h('span', { class: 'run', 'aria-hidden': 'true' }));
        b.addEventListener('click', () => {
            const wins = this.wm.byApp(app.id).filter((w) => w.workspace === this.currentWorkspace);
            if (wins.length && this.wm.focused === wins[0] && !wins[0].minimized && this.prefs.shell !== 'dock')
                this.wm.minimize(wins[0]);
            else
                this.launch(app.id);
        });
        b.addEventListener('contextmenu', (e) => { e.preventDefault(); this.appMenu(app, b); });
        return b;
    }
    systemButton(ic, label, fn, extra = {}) {
        const b = h('button', { class: 'bar-btn', 'aria-label': label, 'data-tip': label, ...extra }, icon(ic));
        b.addEventListener('click', () => fn(b));
        return b;
    }
    clockEl(layout) {
        return h('button', { class: `bar-clock bar-clock--${layout}`, 'aria-label': 'Notifications and calendar', onclick: () => this.togglePanel('notifications') }, h('time', { class: 'clock-a num' }), layout === 'stack' ? h('time', { class: 'clock-b num' }) : null);
    }
    tickClock() {
        const now = new Date();
        this.shadow.querySelectorAll('.bar-clock').forEach((c) => {
            const a = c.querySelector('.clock-a'), b = c.querySelector('.clock-b');
            if (c.classList.contains('bar-clock--stack')) {
                a.textContent = fmtTime.format(now);
                b.textContent = fmtDate.format(now);
            }
            else
                a.textContent = `${fmtDay.format(now)}  ${fmtTime.format(now)}`;
        });
        this.shadow.querySelectorAll('.phone-time').forEach((t) => (t.textContent = fmtTime.format(now)));
    }
    workspacePills() {
        const g = h('div', { class: 'ws-pills', role: 'group', 'aria-label': 'Desktops' });
        for (let i = 0; i < this.workspaceCount; i++) {
            g.append(h('button', { 'aria-pressed': String(i === this.currentWorkspace), 'aria-label': `Desktop ${i + 1}`, 'data-tip': `Desktop ${i + 1}`, onclick: () => this.switchWorkspace(i) }, h('span', { 'aria-hidden': 'true' }, String(i + 1))));
        }
        return g;
    }
    renderDock() {
        const appName = h('span', { class: 'mb-app' }, 'Desktop');
        const top = h('div', { class: 'menubar bar-surface', role: 'menubar', 'aria-label': 'Menu bar' }, h('button', { class: 'mb-logo', 'aria-label': 'JAT OS menu', 'aria-haspopup': 'menu', onclick: (e) => this.systemMenu(e.currentTarget) }, h('img', { src: `${ASSETS}logo/jat-os-mark-currentcolor.svg`, alt: '' })), appName, h('button', { class: 'mb-item', 'aria-haspopup': 'menu', onclick: (e) => this.windowMenu(e.currentTarget) }, 'Window'), h('span', { class: 'bar-spacer' }), this.workspacePills(), this.systemButton('search', 'Search', () => this.togglePanel('launcher')), this.systemButton('sun', 'Quick settings', () => this.togglePanel('quick'), { 'data-qs': '' }), this.clockEl('inline'));
        const dock = h('nav', { class: 'dock bar-surface', 'aria-label': 'Dock' }, h('button', { class: 'bar-app bar-app--launcher', 'data-tip': 'Launcher', 'aria-label': 'Launcher', onclick: () => this.togglePanel('launcher') }, tile(`${ASSETS}apps/launcher.svg`, 48)), h('span', { class: 'dock-sep', 'aria-hidden': 'true' }));
        const appsWrap = h('div', { class: 'dock-apps' });
        this.shellApps().forEach((a) => appsWrap.append(this.appButton(a, 48)));
        dock.append(appsWrap, h('span', { class: 'dock-sep', 'aria-hidden': 'true' }), this.appButton(this.app('settings'), 48));
        this.shellUI.append(top, dock);
    }
    renderTaskbar() {
        const center = h('div', { class: 'tb-center' }, h('button', { class: 'bar-app bar-app--start', 'aria-label': 'Start', 'aria-expanded': String(this.panel === 'launcher'), 'data-tip': 'Start', onclick: () => this.togglePanel('launcher') }, h('img', { src: `${ASSETS}logo/jat-os-mark.svg`, alt: '', width: 24, height: 24 })), h('button', { class: 'tb-search', onclick: () => this.togglePanel('launcher', false, true) }, icon('search', 'jat-icon jat-icon--sm'), h('span', {}, 'Search')), ...this.shellApps().map((a) => this.appButton(a, 28)));
        const bar = h('nav', { class: 'taskbar bar-surface', 'aria-label': 'Taskbar' }, h('div', { class: 'tb-left' }, this.workspacePills()), center, h('div', { class: 'tb-tray' }, this.systemButton('sun', 'Quick settings', () => this.togglePanel('quick'), { 'data-qs': '' }), h('div', { class: 'bell-wrap' }, this.clockEl('stack'))));
        this.shellUI.append(bar);
    }
    renderShelf() {
        const bar = h('nav', { class: 'shelf', 'aria-label': 'Shelf' }, h('button', { class: 'shelf-launcher', 'aria-label': 'Launcher', 'data-tip': 'Launcher', onclick: () => this.togglePanel('launcher') }, h('span', {})), this.workspacePills(), h('div', { class: 'shelf-apps bar-surface' }, ...this.shellApps().map((a) => this.appButton(a, 36))), h('button', { class: 'shelf-status bar-surface', 'aria-label': 'Quick settings and notifications', onclick: () => this.togglePanel('quick') }, h('span', { class: 'shelf-bell' }), icon(this.resolvedTheme() === 'dark' ? 'moon' : 'sun', 'jat-icon jat-icon--sm'), h('time', { class: 'phone-time num' })));
        this.shellUI.append(bar);
        this.tickClock();
    }
    renderActivities() {
        const top = h('div', { class: 'topbar', role: 'toolbar', 'aria-label': 'Top bar' }, h('button', { class: 'tb-activities', 'aria-pressed': String(this.panel === 'overview'), onclick: () => this.togglePanel('overview') }, h('span', { class: 'act-dots', 'aria-hidden': 'true' }, ...Array.from({ length: this.workspaceCount }, (_, i) => h('i', { 'data-on': String(i === this.currentWorkspace) }))), h('span', {}, 'Activities')), h('span', { class: 'bar-spacer' }), this.clockEl('inline'), h('span', { class: 'bar-spacer' }), h('button', { class: 'tb-status', 'aria-label': 'Quick settings', onclick: () => this.togglePanel('quick') }, icon(this.resolvedTheme() === 'dark' ? 'moon' : 'sun', 'jat-icon jat-icon--sm'), icon(this.prefs.dnd ? 'bell-off' : 'bell', 'jat-icon jat-icon--sm'), icon('exit', 'jat-icon jat-icon--sm')));
        this.shellUI.append(top);
    }
    renderPhone() {
        const status = h('div', { class: 'phone-status' }, h('time', { class: 'phone-time num' }), h('span', { class: 'bar-spacer' }), h('button', { class: 'bar-btn', 'aria-label': 'Notifications', onclick: () => this.togglePanel('notifications') }, icon(this.prefs.dnd ? 'bell-off' : 'bell', 'jat-icon jat-icon--sm')), h('button', { class: 'bar-btn', 'aria-label': 'Quick settings', onclick: () => this.togglePanel('quick') }, icon('settings', 'jat-icon jat-icon--sm')));
        const home = h('div', { class: 'phone-home', role: 'list', 'aria-label': 'Apps' }, ...this.apps.map((a) => h('button', { class: 'phone-app', role: 'listitem', 'data-launch': a.id, onclick: () => this.launch(a.id) }, tile(a.icon, 60), h('span', {}, a.name))));
        const homebar = h('nav', { class: 'phone-bar', 'aria-label': 'Navigation' }, h('button', { class: 'bar-btn', 'aria-label': 'Home', onclick: () => this.goHome() }, icon('home')), h('button', { class: 'bar-btn', 'aria-label': 'Open apps', onclick: () => this.togglePanel('switcher') }, icon('workspaces')), h('button', { class: 'bar-btn', 'aria-label': 'Exit to website', onclick: () => this.exit() }, icon('exit')));
        this.shellUI.append(status, home, homebar);
        this.tickClock();
    }
    goHome() { for (const w of this.wm.windows)
        if (!w.minimized) {
            w.minimized = true;
            this.wm.apply(w);
        } this.wm.focused = null; this.closePanel(); this.onWindowsChanged(); }
    onWindowsChanged() {
        if (!this.shellUI)
            return;
        const focusedApp = this.wm.focused?.app;
        this.shadow.querySelectorAll('.bar-app[data-launch]').forEach((b) => {
            const wins = this.wm.byApp(b.dataset.launch);
            b.toggleAttribute('data-running', wins.length > 0);
            b.toggleAttribute('data-active', !!focusedApp && focusedApp.id === b.dataset.launch && !this.wm.focused.minimized);
            b.setAttribute('aria-label', `${this.app(b.dataset.launch)?.name}${wins.length ? ', running' : ''}`);
        });
        // running apps not pinned must appear in bars
        const shown = new Set([...this.shadow.querySelectorAll('.bar-app[data-launch]')].map((b) => b.dataset.launch));
        const missing = this.wm.windows.some((w) => w.app.id !== 'welcome' && !shown.has(w.app.id));
        const extra = [...shown].some((id) => id && !this.prefs.pinned.includes(id) && id !== 'settings' && !this.wm.byApp(id).length);
        const hasBar = this.form() !== 'phone' && this.prefs.shell !== 'activities';
        if ((missing || extra) && hasBar && !this.rerendering) {
            this.rerendering = true;
            try {
                this.renderShell();
            }
            finally {
                this.rerendering = false;
            }
            return;
        }
        const mbApp = this.shadow.querySelector('.mb-app');
        if (mbApp)
            mbApp.textContent = focusedApp && !this.wm.focused.minimized ? focusedApp.name : 'Desktop';
        this.os.toggleAttribute('data-app-open', this.wm.windows.some((w) => !w.minimized && w.workspace === this.currentWorkspace));
        this.saveSession();
    }
    /* ---------------- desktop ---------------- */
    renderDesktop() {
        this.desktop.replaceChildren();
        const shortcuts = ['jat-arcade', 'vectorcraft', 'photocraft', 'figcraft', 'pdfcraft', 'wordcraft', 'gridcraft', 'deckcraft', 'gods-eye-lite', 'chronos-and-canon', 'files'];
        const items = shortcuts.flatMap(id => { const app = this.app(id); return app ? [app] : []; });
        for (const a of items) {
            const b = h('button', { class: 'jat-desk-icon', role: 'listitem', title: a.name, 'aria-label': a.name, 'aria-selected': 'false', 'data-app': a.id }, tile(a.icon, 48), h('span', {}, a.name));
            b.addEventListener('click', () => this.selectDesktop(b));
            b.addEventListener('dblclick', () => this.launch(a.id));
            b.addEventListener('keydown', (e) => { if (e.key === 'Enter')
                this.launch(a.id); });
            b.addEventListener('contextmenu', (e) => { e.preventDefault(); this.selectDesktop(b); this.appMenu(a, b, e); });
            // touch: single tap opens (no double-tap on touch screens)
            b.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse')
                this.launch(a.id); });
            this.desktop.append(b);
        }
    }
    selectDesktop(b) {
        this.desktop.querySelectorAll('.jat-desk-icon').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    }
    /* ---------------- panels ---------------- */
    togglePanel(p, _refresh = false, focusSearch = false) {
        if (this.panel === p) {
            this.closePanel();
            return;
        }
        this.openPanel(p, false, focusSearch);
    }
    openPanel(p, refresh = false, _focusSearch = false) {
        this.closeMenu();
        const prev = this.panel;
        this.panel = p;
        this.panelLayer.replaceChildren();
        const scrim = h('div', { class: `panel-scrim panel-scrim--${p}`, onclick: () => this.closePanel() });
        const el = p === 'launcher' ? (this.prefs.shell === 'taskbar' && this.form() !== 'phone' ? this.taskbarStartPanel() : this.launcherPanel()) : p === 'quick' ? this.quickPanel() : p === 'notifications' ? this.notifPanel()
            : p === 'overview' ? this.overviewPanel() : this.switcherPanel();
        el.classList.add('os-panel', `os-panel--${p}`);
        this.panelLayer.append(scrim, el);
        this.os.dataset.panel = p;
        this.shadow.querySelector('.tb-activities')?.setAttribute('aria-pressed', String(p === 'overview'));
        if (!refresh || prev !== p) {
            animate(el, [{ opacity: 0, transform: 'translateY(6px) scale(0.985)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
            animate(scrim, [{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'linear' });
            (el.querySelector('input, [data-autofocus], button') ?? el).focus({ preventScroll: true });
        }
    }
    closePanel() {
        if (!this.panel)
            return;
        this.panel = null;
        delete this.os.dataset.panel;
        const kids = [...this.panelLayer.children];
        Promise.all(kids.map((k) => animate(k, [{ opacity: 1 }, { opacity: 0 }], { duration: 140, easing: 'cubic-bezier(0.7, 0, 0.84, 0)' })))
            .then(() => { if (!this.panel)
            this.panelLayer.replaceChildren(); });
        this.shadow.querySelector('.tb-activities')?.setAttribute('aria-pressed', 'false');
    }
    searchItems(q) {
        const query = q.trim().toLowerCase();
        const items = [
            ...this.apps.map((a) => ({ label: a.name, meta: a.kind === 'web' ? `App · ${a.category}` : 'System', icon: a.icon, run: () => this.launch(a.id) })),
            ...SHELLS.map((s) => ({ label: `Use ${s.name} style`, meta: 'Shell style', icon: `${ASSETS}apps/settings.svg`, run: () => this.setShell(s.id) })),
            { label: 'Dark theme', meta: 'Appearance', icon: `${ASSETS}apps/settings.svg`, run: () => this.setTheme('dark') },
            { label: 'Light theme', meta: 'Appearance', icon: `${ASSETS}apps/settings.svg`, run: () => this.setTheme('light') },
            { label: 'Change wallpaper', meta: 'Settings', icon: `${ASSETS}apps/settings.svg`, run: () => this.openSettings('wallpaper') },
            { label: 'Exit to website', meta: 'JAT OS', icon: `${ASSETS}apps/website.svg`, run: () => this.exit() },
        ];
        if (!query)
            return [];
        return items.filter((i) => (i.label + ' ' + i.meta).toLowerCase().includes(query)).slice(0, 8);
    }
  taskbarStartPanel() {
    const input = h('input', { class: 'jat-input start-search-input', type: 'search',
      placeholder: 'Search apps, games, and settings', 'aria-label': 'Search apps and games', autocomplete: 'off', spellcheck: 'false' });
    const content = h('div', { class: 'start-scroll' });
    const start = h('div', { class: 'launcher start-menu', role: 'dialog', 'aria-label': 'JAT OS Start menu' });
    let showAll = false;

    const openApp = (app) => this.launch(app.id);
    const appTile = (app) => h('button', { class: 'start-app', title: app.description || app.name, onclick: () => openApp(app),
      oncontextmenu: (e) => { e.preventDefault(); this.appMenu(app, e.currentTarget, e); } },
      tile(app.icon, 42), h('span', {}, app.name));
    const appRow = (app) => h('button', { class: 'start-app-row', onclick: () => openApp(app) },
      tile(app.icon, 34), h('span', { class: 'start-app-text' },
        h('strong', {}, app.name), h('small', {}, app.kind === 'system' ? 'System' : app.category.replace(/-/g, ' '))),
      icon('chevron-right', 'jat-icon jat-icon--sm'));
    const favorites = ['jat-arcade', ...this.prefs.pinned, 'gods-eye-lite', 'chronos-and-canon', 'files', 'settings']
      .filter((id, i, arr) => arr.indexOf(id) === i)
      .flatMap(id => { const app = this.app(id); return app ? [app] : []; }).slice(0, 12);
    const recent = this.prefs.session.slice().reverse()
      .flatMap(entry => { const app = this.app(entry.appId); return app && app.id !== 'welcome' ? [app] : []; })
      .filter((app, i, arr) => arr.findIndex(other => other.id === app.id) === i).slice(0, 3);
    const recommendations = recent.length ? recent : ['jat-arcade', 'gods-eye-lite', 'app-manager']
      .flatMap(id => { const app = this.app(id); return app ? [app] : []; });

    const draw = () => {
      content.replaceChildren();
      const query = input.value.trim().toLowerCase();
      if (query) {
        const found = this.apps.filter(app => (app.name + ' ' + app.description + ' ' + app.category).toLowerCase().includes(query))
          .sort((a, b) => a.name.localeCompare(b.name));
        content.append(h('div', { class: 'start-section-head' },
          h('h2', {}, 'Search results'), h('span', { class: 'start-muted' }, String(found.length) + ' matches')));
        if (found.length) content.append(h('div', { class: 'start-all-list' }, ...found.map(appRow)));
        else content.append(h('p', { class: 'start-empty' }, 'No matching apps. Try “Arcade”, “PhotoCraft”, or “Settings”.'));
        return;
      }
      if (showAll) {
        const back = h('button', { class: 'start-text-button', onclick: () => { showAll = false; draw(); } },
          icon('chevron-left', 'jat-icon jat-icon--sm'), 'Pinned');
        content.append(h('div', { class: 'start-section-head' }, h('h2', {}, 'All apps'), back));
        content.append(h('div', { class: 'start-all-list' },
          ...this.apps.slice().sort((a, b) => a.name.localeCompare(b.name)).map(appRow)));
        return;
      }
      const all = h('button', { class: 'start-text-button', onclick: () => { showAll = true; draw(); } },
        'All apps', icon('chevron-right', 'jat-icon jat-icon--sm'));
      content.append(h('div', { class: 'start-section-head' }, h('h2', {}, 'Pinned'), all));
      content.append(h('div', { class: 'start-pinned-grid' }, ...favorites.map(appTile)));
      content.append(h('div', { class: 'start-section-head start-second-section' },
        h('h2', {}, recent.length ? 'Continue working' : 'Recommended'),
        h('span', { class: 'start-muted' }, recent.length ? 'Your open workspace' : 'Explore JAT OS')));
      content.append(h('div', { class: 'start-recommended' }, ...recommendations.map(appRow)));
    };

    input.addEventListener('input', draw);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && input.value.trim()) {
        const q = input.value.trim().toLowerCase();
        const app = this.apps.slice().sort((a, b) => a.name.localeCompare(b.name))
          .find(a => (a.name + ' ' + a.description + ' ' + a.category).toLowerCase().includes(q));
        if (app) { e.preventDefault(); openApp(app); }
      } else if (e.key === 'ArrowDown') {
        const first = content.querySelector('button');
        if (first) { e.preventDefault(); first.focus(); }
      }
    });
    const header = h('div', { class: 'start-header' },
      h('div', { class: 'start-brand' },
        h('img', { src: ASSETS + 'logo/jat-os-mark.svg', width: 28, height: 28, alt: '' }),
        h('div', {}, h('strong', {}, 'JAT OS'), h('small', {}, 'Your workspace, all in one place'))),
      h('span', { class: 'start-header-tag' }, 'DESKTOP'));
    const search = h('div', { class: 'jat-search start-search' },
      icon('search', 'jat-icon jat-icon--sm'), input);
    const footer = h('div', { class: 'start-footer' },
      h('div', { class: 'start-profile' },
        h('span', { class: 'avatar', 'aria-hidden': 'true' }, icon('user', 'jat-icon jat-icon--sm')),
        h('div', {}, h('strong', {}, 'Guest desktop'), h('small', {}, 'Local preferences'))),
      h('div', { class: 'start-footer-actions' },
        h('button', { class: 'start-footer-button', title: 'Settings', 'aria-label': 'Open Settings', onclick: () => this.launch('settings') },
          icon('settings', 'jat-icon jat-icon--sm')),
        h('button', { class: 'start-footer-button', title: 'Return to website', 'aria-label': 'Exit to website', onclick: () => this.exit() },
          icon('exit', 'jat-icon jat-icon--sm'))));
    start.append(header, search, content, footer);
    draw();
    return start;
  }

    launcherPanel() {
        const input = h('input', { class: 'jat-input launcher-input', type: 'search', placeholder: 'Search apps and settings', 'aria-label': 'Search apps and settings', autocomplete: 'off', spellcheck: 'false' });
        const results = h('div', { class: 'launcher-results', role: 'listbox', 'aria-label': 'Results', hidden: true });
        const grid = h('div', { class: 'launcher-grid', role: 'grid', 'aria-label': 'Apps' });
        const sectionTitle = h('h2', { class: 'launcher-title' }, 'All apps');
        const appsList = [...this.apps];
        appsList.forEach((a) => grid.append(h('button', { class: 'jat-launch-item', role: 'gridcell', 'data-app': a.id, onclick: () => this.launch(a.id), oncontextmenu: (e) => { e.preventDefault(); this.appMenu(a, e.currentTarget, e); } }, tile(a.icon, 56), h('span', {}, a.name), a.status === 'preview' ? h('em', { class: 'launcher-flag' }, 'Preview') : null)));
        let active = 0;
        const draw = () => {
            const q = input.value;
            const items = this.searchItems(q);
            results.hidden = !q;
            grid.hidden = !!q;
            sectionTitle.textContent = q ? 'Results' : 'All apps';
            results.replaceChildren(...(items.length ? items.map((it, i) => h('div', { class: 'jat-result', role: 'option', 'aria-selected': String(i === active), 'data-active': i === active ? '' : null, onclick: () => it.run() }, h('img', { class: 'jat-apptile', src: it.icon, alt: '', width: 32, height: 32, style: '--tile:32px' }), h('div', {}, h('div', { class: 'jat-result__title' }, it.label), h('div', { class: 'jat-result__meta' }, it.meta)), i === active ? h('kbd', {}, 'Enter') : null))
                : [h('div', { class: 'jat-state', style: 'min-height:160px' }, h('p', { class: 'jat-state__title' }, `No results for “${q}”`), h('p', { class: 'jat-state__body' }, 'Try an app name, a setting like “dark”, or “exit”.'))]));
            results.setAttribute('aria-activedescendant', '');
        };
        input.addEventListener('input', () => { active = 0; draw(); });
        input.addEventListener('keydown', (e) => {
            const items = this.searchItems(input.value);
            if (!input.value && (e.key === 'ArrowDown' || e.key === 'ArrowRight')) {
                e.preventDefault();
                grid.querySelector('button')?.focus();
                return;
            }
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                active = Math.min(active + 1, items.length - 1);
                draw();
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                active = Math.max(active - 1, 0);
                draw();
            }
            if (e.key === 'Enter' && items[active]) {
                e.preventDefault();
                items[active].run();
            }
        });
        grid.addEventListener('keydown', (e) => {
            const btns = [...grid.querySelectorAll('button')];
            const i = btns.indexOf(this.shadow.activeElement);
            if (i < 0)
                return;
            const cols = Math.max(1, Math.round(grid.clientWidth / btns[0].offsetWidth));
            const k = e.key;
            let n = i;
            if (k === 'ArrowRight')
                n = i + 1;
            else if (k === 'ArrowLeft')
                n = i - 1;
            else if (k === 'ArrowDown')
                n = i + cols;
            else if (k === 'ArrowUp')
                n = i - cols;
            else if (k === 'Home')
                n = 0;
            else if (k === 'End')
                n = btns.length - 1;
            else
                return;
            e.preventDefault();
            if (n < 0 && k === 'ArrowUp') {
                input.focus();
                return;
            }
            btns[clamp(n, 0, btns.length - 1)].focus();
        });
        const user = h('div', { class: 'launcher-foot' }, h('div', { class: 'launcher-user' }, h('span', { class: 'avatar', 'aria-hidden': 'true' }, icon('user', 'jat-icon jat-icon--sm')), h('div', {}, h('div', { class: 'launcher-user__name' }, 'Guest'), h('div', { class: 'launcher-user__meta' }, 'Sign in on the website to save your desktop'))), h('button', { class: 'jat-btn jat-btn--ghost', onclick: () => this.exit() }, icon('exit', 'jat-icon jat-icon--sm'), 'Exit to website'));
        return h('div', { class: 'launcher', role: 'dialog', 'aria-label': 'Launcher' }, h('div', { class: 'jat-search' }, icon('search', 'jat-icon jat-icon--sm'), input), sectionTitle, results, grid, user);
    }
    quickPanel() {
        const p = this.prefs;
        const seg = h('div', { class: 'jat-segmented qs-theme', role: 'radiogroup', 'aria-label': 'Theme' }, ...['light', 'dark', 'auto'].map((t) => h('button', { role: 'radio', 'aria-checked': String(p.theme === t), onclick: () => { this.setTheme(t); this.openPanel('quick', true); this.renderShell(); } }, icon(t === 'light' ? 'sun' : t === 'dark' ? 'moon' : 'contrast', 'jat-icon jat-icon--sm'), t[0].toUpperCase() + t.slice(1))));
        const tileBtn = (label, sub, ic, on, fn) => h('button', { class: 'qs-tile', 'aria-pressed': String(on), onclick: fn }, h('span', { class: 'qs-tile__icon' }, icon(ic, 'jat-icon jat-icon--sm')), h('span', {}, h('b', {}, label), h('small', {}, sub)));
        const shellSel = h('div', { class: 'qs-shells', role: 'radiogroup', 'aria-label': 'Shell style' }, ...SHELLS.map((s) => h('button', { role: 'radio', 'aria-checked': String(p.shell === s.id), 'data-tip': s.summary, onclick: () => this.setShell(s.id) }, h('span', { class: `shell-thumb shell-thumb--${s.id}`, 'aria-hidden': 'true' }, h('i', {}), h('b', {}), h('em', {})), h('span', {}, s.name))));
        return h('div', { class: 'quick', role: 'dialog', 'aria-label': 'Quick settings' }, seg, h('div', { class: 'qs-grid' }, tileBtn('Do not disturb', p.dnd ? 'On' : 'Off', p.dnd ? 'bell-off' : 'bell', p.dnd, () => { this.setPref('dnd', !p.dnd); this.openPanel('quick', true); }), tileBtn('Solid surfaces', p.reduceTransparency ? 'On' : 'Off', 'layout', p.reduceTransparency, () => { this.setPref('reduceTransparency', !p.reduceTransparency); this.openPanel('quick', true); })), h('div', { class: 'qs-label' }, 'Shell style'), shellSel, h('div', { class: 'qs-foot' }, h('button', { class: 'jat-btn jat-btn--ghost', onclick: () => this.openSettings('appearance') }, icon('settings', 'jat-icon jat-icon--sm'), 'All settings'), h('button', { class: 'jat-btn', onclick: () => this.exit() }, icon('exit', 'jat-icon jat-icon--sm'), 'Exit to website')));
    }
    notifPanel() {
        const now = new Date();
        const list = this.notices.length
            ? h('div', { class: 'notif-list' }, ...this.notices.map((n) => {
                const a = n.appId ? this.app(n.appId) : undefined;
                return h('div', { class: 'jat-toast notif-item' }, a ? tile(a.icon, 32) : h('img', { class: 'jat-apptile', src: `${ASSETS}logo/jat-os-app-icon.svg`, alt: '', width: 32, height: 32, style: '--tile:32px' }), h('div', {}, h('div', { class: 'jat-toast__title' }, n.title), h('div', { class: 'jat-toast__body' }, n.body), h('div', { class: 'jat-toast__meta num' }, fmtTime.format(n.time))), h('button', { class: 'jat-iconbtn jat-iconbtn--sm', 'aria-label': 'Clear notification', onclick: () => { this.notices = this.notices.filter((x) => x !== n); this.updateBellBadge(); this.openPanel('notifications', true); } }, icon('close', 'jat-icon jat-icon--sm')));
            }))
            : h('div', { class: 'jat-state', style: 'min-height:180px' }, h('div', { class: 'jat-state__icon' }, icon(this.prefs.dnd ? 'bell-off' : 'bell', 'jat-icon jat-icon--lg')), h('p', { class: 'jat-state__title' }, 'No notifications'), h('p', { class: 'jat-state__body' }, 'Messages from JAT OS will show up here.'));
        return h('div', { class: 'notifs', role: 'dialog', 'aria-label': 'Notifications' }, h('div', { class: 'notif-head' }, h('div', {}, h('div', { class: 'notif-date' }, new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(now)), h('div', { class: 'notif-time num' }, fmtTime.format(now))), this.notices.length ? h('button', { class: 'jat-btn jat-btn--sm jat-btn--ghost', onclick: () => { this.notices = []; this.updateBellBadge(); this.openPanel('notifications', true); } }, 'Clear all') : null), h('label', { class: 'notif-dnd' }, h('span', {}, 'Do not disturb'), (() => { const s = h('input', { type: 'checkbox', role: 'switch', class: 'jat-switch', checked: this.prefs.dnd }); s.addEventListener('change', () => this.setPref('dnd', s.checked)); return s; })()), list);
    }
    overviewPanel() {
        const wins = this.wm.visible().filter((w) => w.app.id !== 'welcome');
        const cards = h('div', { class: 'ov-windows' }, ...(wins.length ? wins.map((w) => h('button', { class: 'ov-card', onclick: () => { this.closePanel(); this.wm.focus(w); } }, h('span', { class: 'ov-thumb' }, tile(w.app.icon, 48)), h('span', { class: 'ov-name' }, w.titleEl.textContent ?? w.app.name)))
            : [h('p', { class: 'ov-empty' }, 'No windows on this desktop')]));
        const ws = h('div', { class: 'ov-ws', role: 'group', 'aria-label': 'Desktops' }, ...Array.from({ length: this.workspaceCount }, (_, i) => h('button', { class: 'ov-ws-item', 'aria-pressed': String(i === this.currentWorkspace), onclick: () => { this.switchWorkspace(i); this.openPanel('overview', true); } }, h('span', { class: 'ov-ws-thumb' }, ...this.wm.windows.filter((w) => w.workspace === i).slice(0, 4).map((w) => tile(w.app.icon, 20))), h('span', {}, `Desktop ${i + 1}`))), this.workspaceCount < 4 ? h('button', { class: 'ov-ws-add', 'aria-label': 'Add desktop', onclick: () => { this.workspaceCount++; this.openPanel('overview', true); } }, icon('plus')) : null);
        const input = h('input', { class: 'jat-input ov-search', type: 'search', placeholder: 'Type to search', 'aria-label': 'Search apps and settings' });
        const results = h('div', { class: 'launcher-results ov-results', hidden: true });
        input.addEventListener('input', () => {
            const items = this.searchItems(input.value);
            results.hidden = !input.value;
            results.replaceChildren(...items.map((it, i) => h('div', { class: 'jat-result', 'data-active': i === 0 ? '' : null, onclick: () => it.run() }, h('img', { class: 'jat-apptile', src: it.icon, alt: '', style: '--tile:32px' }), h('div', {}, h('div', { class: 'jat-result__title' }, it.label), h('div', { class: 'jat-result__meta' }, it.meta)), h('span', {}))));
        });
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter')
            this.searchItems(input.value)[0]?.run(); });
        const dash = h('nav', { class: 'ov-dash bar-surface', 'aria-label': 'Dash' }, ...this.shellApps().map((a) => this.appButton(a, 44)), h('span', { class: 'dock-sep', 'aria-hidden': 'true' }), h('button', { class: 'bar-app', 'data-tip': 'Show apps', 'aria-label': 'Show apps', onclick: () => this.openPanel('launcher') }, tile(`${ASSETS}apps/launcher.svg`, 44)));
        const el = h('div', { class: 'overview', role: 'dialog', 'aria-label': 'Activities overview' }, input, results, ws, cards, dash);
        requestAnimationFrame(() => this.onWindowsChanged());
        return el;
    }
    switcherPanel() {
        const wins = this.wm.windows.filter((w) => w.app.id !== 'welcome');
        return h('div', { class: 'switcher', role: 'dialog', 'aria-label': 'Open apps' }, h('h2', {}, 'Open apps'), wins.length ? h('div', { class: 'switcher-list' }, ...wins.map((w) => h('div', { class: 'switcher-card' }, h('button', { class: 'switcher-open', onclick: () => { this.closePanel(); this.wm.focus(w); } }, tile(w.app.icon, 40), h('span', {}, w.app.name)), h('button', { class: 'jat-iconbtn', 'aria-label': `Close ${w.app.name}`, onclick: () => { this.wm.close(w); setTimeout(() => this.openPanel('switcher', true), 160); } }, icon('close')))))
            : h('p', { class: 'ov-empty' }, 'No apps open'));
    }
    updateBellBadge() {
        this.shadow.querySelectorAll('.bar-clock, .shelf-status').forEach((c) => c.toggleAttribute('data-unread', this.notices.length > 0));
    }
    openSettings(section) {
        this.launch('settings');
        const w = this.wm.byApp('settings')[0];
        w?.el.dispatchEvent(new CustomEvent('jat:settings-section', { detail: section }));
    }
    /* ---------------- menus ---------------- */
    closeMenu() { this.menuLayer.replaceChildren(); }
    menu(anchor, items) {
        this.closeMenu();
        const m = h('div', { class: 'jat-menu os-menu', role: 'menu' });
        for (const it of items) {
            if (it === 'sep') {
                m.append(h('div', { class: 'jat-menu__sep', role: 'separator' }));
                continue;
            }
            if ('title' in it) {
                m.append(h('div', { class: 'jat-menu__label' }, it.title));
                continue;
            }
            m.append(h('button', { class: `jat-menu__item${it.danger ? ' jat-menu__item--danger' : ''}`, role: it.checked !== undefined ? 'menuitemradio' : 'menuitem', 'aria-checked': it.checked === undefined ? null : String(it.checked),
                onclick: () => { this.closeMenu(); it.run?.(); } }, it.checked ? icon('check', 'jat-icon jat-icon--sm') : it.icon ? icon(it.icon, 'jat-icon jat-icon--sm') : h('span', {}), h('span', {}, it.label), it.hint ? h('span', { class: 'jat-menu__hint' }, it.hint) : h('span', {})));
        }
        this.menuLayer.append(m);
        const W = this.os.clientWidth, H = this.os.clientHeight;
        let x, y;
        if (anchor instanceof HTMLElement) {
            const r = anchor.getBoundingClientRect(), o = this.os.getBoundingClientRect();
            x = r.left - o.left;
            y = r.bottom - o.top + 4;
            if (y + m.offsetHeight > H)
                y = r.top - o.top - m.offsetHeight - 6;
        }
        else {
            x = anchor.x;
            y = anchor.y;
        }
        x = clamp(x, 6, W - m.offsetWidth - 6);
        y = clamp(y, 6, H - m.offsetHeight - 6);
        m.style.transform = `translate(${x}px, ${y}px)`;
        animate(m, [{ opacity: 0, transform: `translate(${x}px, ${y - 4}px)` }, { opacity: 1, transform: `translate(${x}px, ${y}px)` }], { duration: 140, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
        m.querySelector('button')?.focus({ preventScroll: true });
        m.addEventListener('keydown', (e) => {
            const btns = [...m.querySelectorAll('button')];
            const i = btns.indexOf(this.shadow.activeElement);
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                btns[(i + 1) % btns.length].focus();
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                btns[(i - 1 + btns.length) % btns.length].focus();
            }
            if (e.key === 'Escape') {
                e.stopPropagation();
                this.closeMenu();
                if (anchor instanceof HTMLElement)
                    anchor.focus();
            }
            if (e.key === 'Tab')
                this.closeMenu();
        });
    }
    systemMenu(anchor) {
        this.menu(anchor, [
            { label: 'About JAT OS', icon: 'info', run: () => this.launch('about') },
            'sep',
            { label: 'Settings…', icon: 'settings', run: () => this.launch('settings') },
            { label: 'App Manager', icon: 'apps', run: () => this.launch('app-manager') },
            'sep',
            { label: 'Exit to website', icon: 'exit', run: () => this.exit() },
        ]);
    }
    windowMenu(anchor) {
        const w = this.wm.focused;
        if (!w) {
            this.menu(anchor, [{ title: 'No window selected' }, { label: 'Open launcher', icon: 'launcher', run: () => this.togglePanel('launcher') }]);
            return;
        }
        this.menu(anchor, [
            { title: w.app.name },
            { label: 'Minimize', hint: 'Ctrl Alt ↓', run: () => this.wm.minimize(w) },
            { label: w.maximized ? 'Restore' : 'Maximize', hint: 'Ctrl Alt ↑', run: () => this.wm.toggleMax(w) },
            { label: 'Snap left', hint: 'Ctrl Alt ←', run: () => this.wm.snapTo(w, 'left') },
            { label: 'Snap right', hint: 'Ctrl Alt →', run: () => this.wm.snapTo(w, 'right') },
            'sep',
            ...Array.from({ length: this.workspaceCount }, (_, i) => ({ label: `Move to Desktop ${i + 1}`, checked: w.workspace === i, run: () => this.moveToWorkspace(w, i) })),
            'sep',
            { label: 'Cycle windows', hint: 'Alt `', run: () => this.wm.cycle() },
            { label: 'Close', hint: '', danger: true, run: () => this.wm.close(w) },
        ]);
    }
    appMenu(app, anchor, e) {
        const pinned = this.prefs.pinned.includes(app.id);
        const wins = this.wm.byApp(app.id);
        const o = this.os.getBoundingClientRect();
        const at = e && e.clientX ? { x: e.clientX - o.left, y: e.clientY - o.top } : anchor;
        this.menu(at, [
            { title: app.name },
            { label: wins.length ? 'Show window' : 'Open', icon: 'window', run: () => this.launch(app.id) },
            app.kind === 'web' ? { label: 'Open in a new tab', icon: 'external', run: () => this.openExternal(app) } : { title: '' },
            app.kind === 'web' ? { label: pinned ? 'Unpin' : 'Pin', icon: 'pin', run: () => this.togglePin(app.id) } : { title: '' },
            ...(wins.length ? ['sep', { label: wins.length > 1 ? `Close ${wins.length} windows` : 'Close window', danger: true, run: () => wins.forEach((w) => this.wm.close(w)) }] : []),
        ].filter((x) => !(typeof x === 'object' && 'title' in x && x.title === '')));
    }
    desktopMenu(x, y) {
        this.menu({ x, y }, [
            { label: 'Open launcher', icon: 'launcher', hint: 'Ctrl Space', run: () => this.togglePanel('launcher') },
            { label: 'Change wallpaper…', icon: 'image', run: () => this.openSettings('wallpaper') },
            'sep',
            { title: 'Shell style' },
            ...SHELLS.map((s) => ({ label: s.name, checked: this.prefs.shell === s.id, run: () => this.setShell(s.id) })),
            'sep',
            { label: this.prefs.showDesktopIcons ? 'Hide desktop icons' : 'Show desktop icons', run: () => this.setPref('showDesktopIcons', !this.prefs.showDesktopIcons) },
            { label: 'About JAT OS', icon: 'info', run: () => this.launch('about') },
        ]);
    }
    /* ---------------- workspaces & session ---------------- */
    switchWorkspace(i) {
        if (i === this.currentWorkspace)
            return;
        const dir = i > this.currentWorkspace ? 1 : -1;
        this.currentWorkspace = i;
        for (const w of this.wm.windows)
            this.wm.apply(w);
        animate(this.winLayer, [{ transform: `translateX(${dir * 3}%)`, opacity: 0.4 }, { transform: 'none', opacity: 1 }], { duration: 360, easing: 'cubic-bezier(0.2, 0, 0, 1)' });
        this.wm.focusTop();
        this.renderShell();
        this.announce(`Desktop ${i + 1}`);
    }
    moveToWorkspace(w, i) {
        w.workspace = i;
        this.wm.apply(w);
        this.wm.focusTop();
        this.notify({ title: `${w.app.name} moved`, body: `It’s on Desktop ${i + 1}.`, appId: w.app.id });
    }
    saveSession() {
        if (!this.entered)
            return; // never overwrite the saved session before it has been restored
        this.prefs.session = this.wm.windows.filter((w) => w.app.id !== 'welcome').map((w) => ({
            appId: w.app.id, x: w.rect.x, y: w.rect.y, w: w.rect.w, h: w.rect.h, maximized: w.maximized, workspace: w.workspace,
        }));
        this.save();
    }
    restoreSession() {
        const s = this.prefs.session;
        for (const sw of s) {
            const app = this.app(sw.appId);
            if (!app || (app.kind === 'web' && this.launchMode(app.id) === 'external'))
                continue;
            this.workspaceCount = Math.max(this.workspaceCount, sw.workspace + 1);
            this.openWindow(app, { x: sw.x, y: sw.y, w: sw.w, h: sw.h, maximized: sw.maximized, workspace: sw.workspace });
        }
        if (s.length)
            this.notify({ title: 'Windows restored', body: `Reopened ${s.length} ${s.length === 1 ? 'app' : 'apps'} from your last visit.` });
    }
    save() { savePrefs(this.prefs); }
    announce(msg) { this.live.textContent = ''; requestAnimationFrame(() => (this.live.textContent = msg)); }
    /* ---------------- web app frame ---------------- */
    webFrame(app, win) {
        const wrap = h('div', { class: 'webframe' });
        const loading = h('div', { class: 'webframe-loading' }, tile(app.icon, 56), h('div', { class: 'jat-progress jat-progress--indeterminate', style: 'width:160px' }, h('span', {})), h('p', {}, `Loading ${app.name}…`));
        const frame = h('iframe', {
            src: app.url, title: app.name, loading: 'eager',
            sandbox: 'allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-modals',
            allow: 'fullscreen; gamepad; clipboard-read; clipboard-write', referrerpolicy: 'strict-origin-when-cross-origin',
        });
        const fail = (kind) => {
            const st = kind === 'offline'
                ? h('div', { class: 'jat-state jat-state--warning webframe-state' }, h('div', { class: 'jat-state__icon' }, icon('offline', 'jat-icon jat-icon--lg')), h('h3', { class: 'jat-state__title' }, 'You’re offline'), h('p', { class: 'jat-state__body' }, `${app.name} needs a connection to load the first time. It may work offline afterward if the app supports it.`), h('div', { class: 'jat-state__actions' }, h('button', { class: 'jat-btn jat-btn--primary', onclick: () => { st.remove(); frame.src = app.url; arm(); } }, icon('refresh', 'jat-icon jat-icon--sm'), 'Try again')))
                : h('div', { class: 'jat-state jat-state--warning webframe-state' }, h('div', { class: 'jat-state__icon' }, icon('alert', 'jat-icon jat-icon--lg')), h('h3', { class: 'jat-state__title' }, `${app.name} is taking a while`), h('p', { class: 'jat-state__body' }, 'Some apps can’t run inside a window, or the network is slow. Opening it in a new tab always works.'), h('div', { class: 'jat-state__actions' }, h('button', { class: 'jat-btn jat-btn--primary', onclick: () => this.openExternal(app) }, icon('external', 'jat-icon jat-icon--sm'), 'Open in a new tab'), h('button', { class: 'jat-btn', onclick: () => { st.remove(); arm(); } }, 'Keep waiting')));
            loading.hidden = true;
            wrap.append(st);
        };
        let timer = 0;
        const arm = () => { loading.hidden = false; clearTimeout(timer); timer = window.setTimeout(() => fail('slow'), 15000); };
        frame.addEventListener('load', () => { clearTimeout(timer); loading.hidden = true; wrap.querySelector('.webframe-state')?.remove(); });
        wrap.append(frame, loading);
        if (!navigator.onLine) {
            fail('offline');
            frame.removeAttribute('src');
        }
        else
            arm();
        void win;
        return wrap;
    }
    /* ---------------- global input ---------------- */
    wireGlobal() {
        this.mq.addEventListener('change', () => { if (this.prefs.theme === 'auto') {
            this.applyLook();
            this.renderShell();
        } });
        window.addEventListener('resize', () => {
            const before = this.os.dataset.form;
            this.applyLook();
            if (before !== this.os.dataset.form)
                this.renderShell();
            this.wm.relayout();
        });
        window.addEventListener('online', () => this.notify({ title: 'Back online', body: 'Apps can load again.' }));
        window.addEventListener('offline', () => this.notify({ title: 'You’re offline', body: 'Open apps keep running. New apps can’t load until you reconnect.' }));
        this.desktop.addEventListener('contextmenu', (e) => {
            if (e.target.closest('.jat-desk-icon'))
                return;
            e.preventDefault();
            const o = this.os.getBoundingClientRect();
            this.desktopMenu(e.clientX - o.left, e.clientY - o.top);
        });
        this.desktop.addEventListener('click', (e) => { if (e.target === this.desktop)
            this.selectDesktop(null); });
        // long-press on touch/pen opens the desktop menu (hover/right-click alternative)
        let lp = 0;
        this.desktop.addEventListener('pointerdown', (e) => {
            if (e.pointerType === 'mouse' || e.target.closest('.jat-desk-icon'))
                return;
            const o = this.os.getBoundingClientRect();
            lp = window.setTimeout(() => this.desktopMenu(e.clientX - o.left, e.clientY - o.top), 550);
        });
        ['pointerup', 'pointercancel', 'pointermove'].forEach((t) => this.desktop.addEventListener(t, () => clearTimeout(lp)));
        this.os.addEventListener('pointerdown', (e) => {
            if (!e.target.closest('.os-menu'))
                this.closeMenu();
        });
        // title-bar context menu
        this.winLayer.addEventListener('contextmenu', (e) => {
            const bar = e.target.closest('.jat-titlebar');
            if (!bar)
                return;
            e.preventDefault();
            const o = this.os.getBoundingClientRect();
            this.windowMenu(h('span', {}));
            const m = this.menuLayer.firstElementChild;
            if (m) {
                const x = clamp(e.clientX - o.left, 6, this.os.clientWidth - m.offsetWidth - 6), y = clamp(e.clientY - o.top, 6, this.os.clientHeight - m.offsetHeight - 6);
                m.style.transform = `translate(${x}px, ${y}px)`;
            }
        });
        // tooltips (pointer + keyboard focus)
        let tipTimer = 0;
        const showTip = (t) => {
            clearTimeout(tipTimer);
            tipTimer = window.setTimeout(() => {
                const r = t.getBoundingClientRect(), o = this.os.getBoundingClientRect();
                this.tooltip.textContent = t.dataset.tip;
                this.tooltip.hidden = false;
                const tw = this.tooltip.offsetWidth, th = this.tooltip.offsetHeight;
                const above = r.top - o.top > this.os.clientHeight / 2;
                const x = clamp(r.left - o.left + r.width / 2 - tw / 2, 6, this.os.clientWidth - tw - 6);
                const y = above ? r.top - o.top - th - 8 : r.bottom - o.top + 8;
                this.tooltip.style.transform = `translate(${x}px, ${y}px)`;
            }, 380);
        };
        const hideTip = () => { clearTimeout(tipTimer); this.tooltip.hidden = true; };
        this.shadow.addEventListener('pointerover', (e) => { const t = e.target.closest('[data-tip]'); if (t && e.pointerType === 'mouse')
            showTip(t); });
        this.shadow.addEventListener('pointerout', (e) => { if (e.target.closest('[data-tip]'))
            hideTip(); });
        this.shadow.addEventListener('focusin', (e) => { const t = e.target.closest('[data-tip]'); if (t && t.matches(':focus-visible'))
            showTip(t);
        else
            hideTip(); });
        this.shadow.addEventListener('pointerdown', hideTip);
        // focus follows clicks into iframes (iframes swallow pointer events)
        window.addEventListener('blur', () => setTimeout(() => {
            const a = this.shadow.activeElement;
            if (a instanceof HTMLIFrameElement) {
                const w = this.wm.windows.find((x) => x.el.contains(a));
                if (w && this.wm.focused !== w)
                    this.wm.focus(w);
            }
        }));
        // keyboard
        this.os.addEventListener('keydown', (e) => {
            if (this.hidden)
                return;
            const k = e.key;
            if (k === 'Escape') {
                if (this.menuLayer.childElementCount) {
                    this.closeMenu();
                    return;
                }
                if (this.panel) {
                    e.preventDefault();
                    this.closePanel();
                    return;
                }
            }
            if (e.ctrlKey && !e.altKey && (k === ' ' || e.code === 'Space')) {
                e.preventDefault();
                this.togglePanel(this.prefs.shell === 'activities' ? 'overview' : 'launcher');
                return;
            }
            if (e.altKey && (k === '`' || e.code === 'Backquote')) {
                e.preventDefault();
                this.wm.cycle();
                return;
            }
            if (e.ctrlKey && e.altKey) {
                const map = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
                if (map[k]) {
                    e.preventDefault();
                    this.wm.keySnap(map[k]);
                }
            }
        });
    }
}
customElements.define('jat-os', JatOS);
