// Small DOM helpers shared by the shell. No framework: the shell must stay portable outside WordPress.
export const ASSETS = new URL('../../assets/', import.meta.url).href;
export const SPRITE = ASSETS + 'icons.svg';
/** Create an element. Keys starting with "on" become listeners; booleans toggle attributes. */
export function h(tag, attrs = {}, ...children) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
        if (v === null || v === undefined || v === false)
            continue;
        if (k.startsWith('on') && typeof v === 'function')
            el.addEventListener(k.slice(2), v);
        else if (k === 'class')
            el.className = String(v);
        else if (k === 'text')
            el.textContent = String(v);
        else if (k === 'style')
            el.setAttribute('style', String(v));
        else if (v === true)
            el.setAttribute(k, '');
        else
            el.setAttribute(k, String(v));
    }
    append(el, children);
    return el;
}
export function append(el, children) {
    for (const c of children) {
        if (c === null || c === undefined || c === false)
            continue;
        if (Array.isArray(c))
            append(el, c);
        else
            el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
}
const SVGNS = 'http://www.w3.org/2000/svg';
/** An icon from the shared sprite. Decorative by default (aria-hidden). */
export function icon(name, cls = 'jat-icon') {
    const svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('class', cls);
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const use = document.createElementNS(SVGNS, 'use');
    use.setAttribute('href', `${SPRITE}#i-${name}`);
    svg.appendChild(use);
    return svg;
}
export function tile(src, size, alt = '') {
    const img = h('img', { class: 'jat-apptile', src, alt, width: size, height: size, draggable: 'false', style: `--tile:${size}px` });
    return img;
}
export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
export function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
/** Run a Web Animation unless reduced motion is on; always resolves. */
export function animate(el, frames, opts) {
    if (prefersReducedMotion() || !('animate' in el))
        return Promise.resolve();
    return el.animate(frames, opts).finished.then(() => undefined, () => undefined);
}
export function cssVar(el, name) {
    return getComputedStyle(el).getPropertyValue(name).trim();
}
export const fmtTime = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
export const fmtDay = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
export const fmtDate = new Intl.DateTimeFormat(undefined, { month: 'numeric', day: 'numeric', year: 'numeric' });
