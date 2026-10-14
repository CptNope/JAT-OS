// Window manager: stacking, focus, drag, resize, edge snapping, minimize/maximize, workspaces.
import { animate, clamp, h, icon, tile } from './ui.js';
import type { AppDef, WinHandle } from './types.js';

export type Rect = { x: number; y: number; w: number; h: number };
type Snap = 'left' | 'right' | 'max' | null;

export interface WinState extends WinHandle {
  rect: Rect;
  prev: Rect | null;     // rect before maximize/snap
  maximized: boolean;
  snapped: Snap;
  minimized: boolean;
  workspace: number;
  titleEl: HTMLElement;
}

export interface WMHost {
  root: HTMLElement;                 // positioned layer the windows live in
  workArea(): Rect;
  controlsSide(): 'start' | 'end';
  form(): 'desktop' | 'tablet' | 'phone';
  minimizeTarget(appId: string): DOMRect | null;
  onChange(): void;                  // stack/focus/minimize changed → shell redraws
  announce(msg: string): void;
  openExternal(app: AppDef): void;
  workspace(): number;
}

let seq = 0;

export class WindowManager {
  windows: WinState[] = [];
  private z = 100;
  private snapPreview: HTMLElement;
  focused: WinState | null = null;

  constructor(private host: WMHost) {
    this.snapPreview = h('div', { class: 'snap-preview', 'aria-hidden': 'true' });
    host.root.append(this.snapPreview);
  }

  byApp(appId: string): WinState[] { return this.windows.filter((w) => w.app.id === appId); }
  visible(): WinState[] { return this.windows.filter((w) => w.workspace === this.host.workspace()); }

  open(app: AppDef, content: (w: WinHandle) => HTMLElement, opts: Partial<Rect> & { maximized?: boolean; workspace?: number; badge?: string } = {}): WinState {
    const id = `win-${++seq}`;
    const area = this.host.workArea();
    const form = this.host.form();
    const w = clamp(opts.w ?? app.win.w, Math.min(app.win.minW, area.w), area.w);
    const hgt = clamp(opts.h ?? app.win.h, Math.min(app.win.minH, area.h), area.h);
    const cascade = (this.visible().length % 6) * 28;
    const rect: Rect = {
      x: opts.x ?? Math.round(area.x + (area.w - w) / 2 + cascade - 56),
      y: opts.y ?? Math.round(area.y + Math.max(8, (area.h - hgt) / 2.4) + cascade - 28),
      w, h: hgt,
    };
    rect.x = clamp(rect.x, area.x, area.x + area.w - w);
    rect.y = clamp(rect.y, area.y, area.y + area.h - hgt);

    const titleEl = h('span', { class: 'jat-titlebar__label' }, app.name);
    const controls = h('div', { class: 'jat-wincontrols' });
    const el = h('section', { class: 'jat-window', role: 'dialog', 'aria-modal': 'false', 'aria-label': app.name, 'data-app': app.id, id, tabindex: '-1' });
    const body = h('div', { class: 'jat-window__body' });
    const bar = h('header', { class: 'jat-titlebar' });

    const st: WinState = {
      id, app, el, body, titleEl, rect, prev: null, maximized: false, snapped: null, minimized: false,
      workspace: opts.workspace ?? this.host.workspace(),
      setTitle: (t) => { titleEl.textContent = t; },
      close: () => this.close(st),
    };

    const btn = (cls: string, label: string, ic: string, fn: () => void) =>
      h('button', { class: `jat-winbtn ${cls}`, 'aria-label': `${label} ${app.name}`, title: label, onclick: (e: Event) => { e.stopPropagation(); fn(); } }, icon(ic));
    const bClose = btn('jat-winbtn--close', 'Close', 'close', () => this.close(st));
    const bMin = btn('jat-winbtn--min', 'Minimize', 'minimize', () => this.minimize(st));
    const bMax = btn('jat-winbtn--max', 'Maximize', 'maximize', () => this.toggleMax(st));
    const title = h('div', { class: 'jat-titlebar__title' }, tile(app.icon, 16), titleEl,
      opts.badge ? h('span', { class: 'jat-badge jat-titlebar__badge' }, opts.badge) : null);
    const tools = h('div', { class: 'jat-titlebar__tools' });
    if (app.kind === 'web') {
      tools.append(h('button', { class: 'jat-iconbtn jat-iconbtn--sm', title: 'Open in a new tab', 'aria-label': `Open ${app.name} in a new tab`, onclick: (e: Event) => { e.stopPropagation(); this.host.openExternal(app); } }, icon('external', 'jat-icon jat-icon--sm')));
    }
    if (this.host.controlsSide() === 'start') {
      controls.append(bClose, bMin, bMax);
      bar.append(controls, title, tools);
    } else {
      controls.append(bMin, bMax, bClose);
      bar.append(title, tools, controls);
    }
    el.append(bar, body);
    for (const d of ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']) el.append(h('div', { class: `rz rz--${d}`, 'data-dir': d, 'aria-hidden': 'true' }));

    body.append(content(st));
    this.host.root.append(el);
    this.windows.push(st);
    this.apply(st);
    this.wireDrag(st, bar);
    this.wireResize(st);
    el.addEventListener('pointerdown', () => this.focus(st), true);
    bar.addEventListener('dblclick', (e) => { if (!(e.target as Element).closest('button')) this.toggleMax(st); });

    if (opts.maximized || form === 'tablet') this.maximize(st, false);
    this.focus(st);
    animate(el, [{ opacity: 0, transform: `${this.tf(st)} scale(0.96)` }, { opacity: 1, transform: `${this.tf(st)} scale(1)` }],
      { duration: 220, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
    this.host.announce(`${app.name} opened`);
    return st;
  }

  private tf(st: WinState): string { return `translate3d(${st.rect.x}px, ${st.rect.y}px, 0)`; }

  apply(st: WinState): void {
    const s = st.el.style;
    s.transform = this.tf(st);
    s.width = st.rect.w + 'px';
    s.height = st.rect.h + 'px';
    st.el.toggleAttribute('data-maximized', st.maximized);
    st.el.dataset.snapped = st.snapped ?? '';
    st.el.hidden = st.minimized || st.workspace !== this.host.workspace();
    const max = st.el.querySelector('.jat-winbtn--max');
    if (max) {
      max.setAttribute('title', st.maximized ? 'Restore' : 'Maximize');
      max.setAttribute('aria-label', `${st.maximized ? 'Restore' : 'Maximize'} ${st.app.name}`);
      max.querySelector('use')?.setAttribute('href', max.querySelector('use')!.getAttribute('href')!.replace(/#i-\w+/, st.maximized ? '#i-restore' : '#i-maximize'));
    }
  }

  focus(st: WinState | null): void {
    if (st && this.focused === st && st.el.hasAttribute('data-focused')) return;
    for (const w of this.windows) w.el.removeAttribute('data-focused');
    this.focused = st;
    if (st) {
      if (st.minimized) this.restore(st);
      st.el.style.zIndex = String(++this.z);
      st.el.setAttribute('data-focused', '');
      if (!st.el.contains(st.el.getRootNode() instanceof ShadowRoot ? (st.el.getRootNode() as ShadowRoot).activeElement : null)) st.el.focus({ preventScroll: true });
    }
    this.host.onChange();
  }

  focusTop(): void {
    const cands = this.visible().filter((w) => !w.minimized).sort((a, b) => Number(b.el.style.zIndex) - Number(a.el.style.zIndex));
    this.focus(cands[0] ?? null);
  }

  cycle(): void {
    const list = this.visible().filter((w) => !w.minimized).sort((a, b) => Number(a.el.style.zIndex) - Number(b.el.style.zIndex));
    if (list.length < 2) return;
    this.focus(list[0]);
    this.host.announce(`${list[0].app.name}`);
  }

  async close(st: WinState): Promise<void> {
    this.windows = this.windows.filter((w) => w !== st);
    if (this.focused === st) this.focused = null;
    this.host.onChange();
    await animate(st.el, [{ opacity: 1, transform: `${this.tf(st)} scale(1)` }, { opacity: 0, transform: `${this.tf(st)} scale(0.97)` }],
      { duration: 140, easing: 'cubic-bezier(0.7, 0, 0.84, 0)' });
    st.el.remove();
    this.host.announce(`${st.app.name} closed`);
    this.focusTop();
  }

  async minimize(st: WinState): Promise<void> {
    const target = this.host.minimizeTarget(st.app.id);
    const r = st.el.getBoundingClientRect();
    if (target) {
      const dx = target.x + target.width / 2 - (r.x + r.width / 2);
      const dy = target.y + target.height / 2 - (r.y + r.height / 2);
      await animate(st.el, [
        { transform: `${this.tf(st)}`, opacity: 1 },
        { transform: `${this.tf(st)} translate(${dx}px, ${dy}px) scale(0.08)`, opacity: 0 },
      ], { duration: 360, easing: 'cubic-bezier(0.2, 0, 0, 1)' });
    }
    st.minimized = true;
    this.apply(st);
    if (this.focused === st) { this.focused = null; this.focusTop(); }
    this.host.onChange();
    this.host.announce(`${st.app.name} minimized`);
  }

  restore(st: WinState): void {
    if (!st.minimized) return;
    st.minimized = false;
    this.apply(st);
    animate(st.el, [{ opacity: 0, transform: `${this.tf(st)} scale(0.94)` }, { opacity: 1, transform: `${this.tf(st)} scale(1)` }],
      { duration: 220, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
  }

  toggleMax(st: WinState): void { st.maximized ? this.unmaximize(st) : this.maximize(st); }

  maximize(st: WinState, anim = true): void { this.snapTo(st, 'max', anim); }

  unmaximize(st: WinState): void {
    if (!st.prev) { st.maximized = false; st.snapped = null; this.apply(st); return; }
    this.animateRect(st, st.prev);
    st.prev = null; st.maximized = false; st.snapped = null;
    this.apply(st); this.host.onChange();
  }

  snapTo(st: WinState, snap: Exclude<Snap, null>, anim = true): void {
    const a = this.host.workArea();
    if (!st.prev) st.prev = { ...st.rect };
    const target: Rect = snap === 'max' ? { ...a }
      : snap === 'left' ? { x: a.x, y: a.y, w: Math.round(a.w / 2), h: a.h }
      : { x: a.x + Math.round(a.w / 2), y: a.y, w: a.w - Math.round(a.w / 2), h: a.h };
    if (anim) this.animateRect(st, target); else st.rect = target;
    st.maximized = snap === 'max';
    st.snapped = snap;
    this.apply(st); this.host.onChange();
  }

  /** Re-fit maximized / snapped windows after the work area changes (shell switch, viewport resize). */
  relayout(): void {
    const a = this.host.workArea();
    for (const st of this.windows) {
      if (st.snapped) { const p = st.prev; this.snapTo(st, st.snapped, false); st.prev = p; continue; }
      st.rect.w = Math.min(st.rect.w, a.w); st.rect.h = Math.min(st.rect.h, a.h);
      st.rect.x = clamp(st.rect.x, a.x, a.x + a.w - st.rect.w);
      st.rect.y = clamp(st.rect.y, a.y, a.y + a.h - st.rect.h);
      this.apply(st);
    }
  }

  private animateRect(st: WinState, to: Rect): void {
    const from = { ...st.rect };
    st.rect = { ...to };
    animate(st.el, [
      { transform: `translate3d(${from.x}px, ${from.y}px, 0)`, width: from.w + 'px', height: from.h + 'px' },
      { transform: `translate3d(${to.x}px, ${to.y}px, 0)`, width: to.w + 'px', height: to.h + 'px' },
    ], { duration: 220, easing: 'cubic-bezier(0.2, 0, 0, 1)' });
  }

  private showPreview(snap: Snap): void {
    const p = this.snapPreview;
    if (!snap) { p.removeAttribute('data-on'); return; }
    const a = this.host.workArea();
    const r = snap === 'max' ? a : snap === 'left' ? { ...a, w: a.w / 2 } : { ...a, x: a.x + a.w / 2, w: a.w / 2 };
    Object.assign(p.style, { transform: `translate3d(${r.x + 6}px, ${r.y + 6}px, 0)`, width: r.w - 12 + 'px', height: r.h - 12 + 'px' });
    p.setAttribute('data-on', '');
  }

  private wireDrag(st: WinState, bar: HTMLElement): void {
    let sx = 0, sy = 0, ox = 0, oy = 0, dragging = false, pending: Snap = null, pid = -1;
    bar.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || (e.target as Element).closest('button') || this.host.form() === 'phone') return;
      pid = e.pointerId; sx = e.clientX; sy = e.clientY; ox = st.rect.x; oy = st.rect.y; dragging = false;
      bar.setPointerCapture(pid);
    });
    bar.addEventListener('pointermove', (e) => {
      if (e.pointerId !== pid) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (!dragging) {
        if (Math.hypot(dx, dy) < 4) return;
        dragging = true;
        this.host.root.classList.add('is-dragging');
        if (st.snapped) {
          // tear off a maximized/snapped window: restore its size under the pointer
          const prev = st.prev ?? st.rect;
          const ratio = (sx - st.rect.x) / st.rect.w;
          st.rect = { x: Math.round(e.clientX - prev.w * ratio), y: st.rect.y, w: prev.w, h: prev.h };
          st.prev = null; st.maximized = false; st.snapped = null;
          ox = st.rect.x; oy = st.rect.y; sx = e.clientX; sy = e.clientY;
          this.apply(st);
        }
      }
      const a = this.host.workArea();
      st.rect.x = Math.round(clamp(ox + (e.clientX - sx), a.x - st.rect.w + 96, a.x + a.w - 96));
      st.rect.y = Math.round(clamp(oy + (e.clientY - sy), a.y, a.y + a.h - 40));
      st.el.style.transform = this.tf(st);
      const edge = 10;
      pending = e.clientY <= a.y + 2 ? 'max' : e.clientX <= a.x + edge ? 'left' : e.clientX >= a.x + a.w - edge ? 'right' : null;
      this.showPreview(pending);
    });
    const end = (e: PointerEvent) => {
      if (e.pointerId !== pid) return;
      pid = -1;
      this.host.root.classList.remove('is-dragging');
      this.showPreview(null);
      if (dragging && pending) this.snapTo(st, pending);
      dragging = false; pending = null;
      this.host.onChange();
    };
    bar.addEventListener('pointerup', end);
    bar.addEventListener('pointercancel', end);
  }

  private wireResize(st: WinState): void {
    st.el.querySelectorAll<HTMLElement>('.rz').forEach((hd) => {
      let sx = 0, sy = 0, r0: Rect = st.rect, pid = -1;
      const dir = hd.dataset.dir!;
      hd.addEventListener('pointerdown', (e) => {
        if (st.maximized) return;
        e.stopPropagation(); pid = e.pointerId; sx = e.clientX; sy = e.clientY; r0 = { ...st.rect };
        hd.setPointerCapture(pid); this.host.root.classList.add('is-dragging');
        st.snapped = null; st.prev = null;
      });
      hd.addEventListener('pointermove', (e) => {
        if (e.pointerId !== pid) return;
        const a = this.host.workArea();
        const dx = e.clientX - sx, dy = e.clientY - sy;
        const minW = Math.min(st.app.win.minW, a.w), minH = Math.min(st.app.win.minH, a.h);
        let { x, y, w, h: hh } = r0;
        if (dir.includes('e')) w = clamp(r0.w + dx, minW, a.x + a.w - r0.x);
        if (dir.includes('s')) hh = clamp(r0.h + dy, minH, a.y + a.h - r0.y);
        if (dir.includes('w')) { w = clamp(r0.w - dx, minW, r0.x + r0.w - a.x); x = r0.x + r0.w - w; }
        if (dir.includes('n')) { hh = clamp(r0.h - dy, minH, r0.y + r0.h - a.y); y = r0.y + r0.h - hh; }
        st.rect = { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(hh) };
        this.apply(st);
      });
      const end = (e: PointerEvent) => { if (e.pointerId !== pid) return; pid = -1; this.host.root.classList.remove('is-dragging'); this.host.onChange(); };
      hd.addEventListener('pointerup', end);
      hd.addEventListener('pointercancel', end);
    });
  }

  /** Move focus within keyboard: snap the focused window. */
  keySnap(dir: 'left' | 'right' | 'up' | 'down'): void {
    const st = this.focused; if (!st) return;
    if (dir === 'up') this.maximize(st);
    else if (dir === 'down') st.snapped ? this.unmaximize(st) : this.minimize(st);
    else if (st.snapped === (dir === 'left' ? 'right' : 'left')) this.unmaximize(st);
    else this.snapTo(st, dir);
  }

  setControlsSide(side: 'start' | 'end'): void {
    for (const st of this.windows) {
      const bar = st.el.querySelector('.jat-titlebar')!;
      const controls = bar.querySelector('.jat-wincontrols')!;
      const [min, max, close] = ['--min', '--max', '--close'].map((c) => controls.querySelector(`.jat-winbtn${c}`)!);
      const title = bar.querySelector('.jat-titlebar__title')!, tools = bar.querySelector('.jat-titlebar__tools')!;
      if (side === 'start') { controls.replaceChildren(close, min, max); bar.replaceChildren(controls, title, tools); }
      else { controls.replaceChildren(min, max, close); bar.replaceChildren(title, tools, controls); }
    }
  }
}
