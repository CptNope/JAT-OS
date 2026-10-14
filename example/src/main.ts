// Website ⇄ OS mode toggle. In the WordPress plugin this script is the only thing
// injected into theme pages; the shell itself loads on demand.
import type { JatOS } from './os.js';

const toggle = document.querySelector<HTMLButtonElement>('#jat-toggle')!;
let os: JatOS | null = null;

async function enter(push = true): Promise<void> {
  if (!os) {
    await import('./os.js');
    os = document.createElement('jat-os') as JatOS;
    os.id = 'jat-os';
    os.addEventListener('jat-exit', () => leave());
    document.body.append(os);
  }
  document.documentElement.classList.add('jat-os-active');
  toggle.setAttribute('aria-pressed', 'true');
  if (push && location.hash !== '#os') history.pushState({ jatOS: true }, '', '#os');
  await os.enter();
}

function leave(pop = false): void {
  if (!os) return;
  os.hidden = true;
  document.documentElement.classList.remove('jat-os-active');
  toggle.setAttribute('aria-pressed', 'false');
  if (!pop && location.hash === '#os') history.back();
  toggle.focus();
}

toggle.addEventListener('click', () => (toggle.getAttribute('aria-pressed') === 'true' ? leave() : enter()));
document.querySelectorAll<HTMLElement>('[data-enter-os]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); enter(); }));
window.addEventListener('popstate', () => (location.hash === '#os' ? enter(false) : leave(true)));
if (location.hash === '#os') enter(false);
