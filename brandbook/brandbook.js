/* JAT OS brand book: theme switch, contents scroll-spy, and the few live specimens. No dependencies. */
(function () {
  'use strict';
  var root = document.documentElement;
  var KEY = 'jat-bb-theme';

  function store(value) { try { localStorage.setItem(KEY, value); } catch (e) { /* storage unavailable */ } }
  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }

  /* ---------- Theme ---------- */
  var meta = document.querySelector('meta[name="theme-color"]');
  function syncMeta() {
    if (meta) meta.setAttribute('content', getComputedStyle(document.body).backgroundColor);
  }
  function applyTheme(choice, save) {
    if (choice === 'light' || choice === 'dark') root.setAttribute('data-theme', choice);
    else { root.removeAttribute('data-theme'); choice = 'auto'; }
    document.querySelectorAll('[data-theme-choice]').forEach(function (b) {
      var on = b.getAttribute('data-theme-choice') === choice;
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
    });
    if (save) store(choice);
    syncMeta();
  }
  var initial = null;
  try { initial = new URLSearchParams(location.search).get('theme'); } catch (e) {}
  if (initial !== 'light' && initial !== 'dark' && initial !== 'auto') initial = stored();
  applyTheme(initial || 'auto', false);
  if (window.matchMedia) {
    var mq = matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) mq.addEventListener('change', syncMeta);
  }

  /* ---------- Radio groups (theme switch and segmented specimens) ---------- */
  document.querySelectorAll('[role="radiogroup"]').forEach(function (group) {
    var radios = Array.prototype.slice.call(group.querySelectorAll('[role="radio"]'));
    function select(r, focus) {
      radios.forEach(function (x) { x.setAttribute('aria-checked', String(x === r)); x.tabIndex = x === r ? 0 : -1; });
      if (focus) r.focus();
      var t = r.getAttribute('data-theme-choice');
      if (t) applyTheme(t, true);
    }
    radios.forEach(function (r) {
      r.tabIndex = r.getAttribute('aria-checked') === 'true' ? 0 : -1;
      r.addEventListener('click', function () { select(r, false); });
      r.addEventListener('keydown', function (e) {
        var i = radios.indexOf(r), n = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = radios[(i + 1) % radios.length];
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = radios[(i - 1 + radios.length) % radios.length];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
  });

  /* ---------- Contents: disclosure on small screens, scroll-spy everywhere ---------- */
  var details = document.querySelector('.bb-toc__details');
  var current = document.querySelector('.bb-toc__current');
  var wide = window.matchMedia ? matchMedia('(min-width: 1024px)') : { matches: true };
  function syncDetails() { if (details) details.open = wide.matches; }
  syncDetails();
  if (wide.addEventListener) wide.addEventListener('change', syncDetails);
  if (details) {
    details.addEventListener('toggle', function () { if (wide.matches && !details.open) details.open = true; });
    details.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { if (!wide.matches) details.open = false; });
    });
  }
  var links = {};
  document.querySelectorAll('.bb-toc__list a').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
  function mark(id) {
    Object.keys(links).forEach(function (k) {
      if (k === id) links[k].setAttribute('aria-current', 'true'); else links[k].removeAttribute('aria-current');
    });
    if (current) current.textContent = id && links[id] ? links[id].textContent : '';
  }
  var sections = Array.prototype.slice.call(document.querySelectorAll('.bb-section'));
  function spy() {
    var line = window.innerHeight * 0.25, active = null;
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].getBoundingClientRect().top <= line) active = sections[i].id; else break;
    }
    mark(active);
  }
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; spy(); }); }
  }, { passive: true });
  window.addEventListener('resize', spy);
  spy();

  /* ---------- Tabs specimen ---------- */
  document.querySelectorAll('[data-bb-tabs]').forEach(function (list) {
    var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
    function activate(t) {
      tabs.forEach(function (x) {
        var on = x === t;
        x.setAttribute('aria-selected', String(on));
        x.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(x.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
      t.focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { activate(t); });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
        else if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === 'Home') n = tabs[0];
        else if (e.key === 'End') n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); activate(n); }
      });
    });
  });

  /* ---------- Resizable panel specimen ---------- */
  document.querySelectorAll('.bb-panels__handle').forEach(function (h) {
    var box = h.parentElement, min = 20, max = 60, def = 38;
    function set(v) {
      v = Math.max(min, Math.min(max, Math.round(v)));
      box.style.setProperty('--split', v + '%');
      h.setAttribute('aria-valuenow', String(v));
    }
    h.addEventListener('keydown', function (e) {
      var now = Number(h.getAttribute('aria-valuenow')), step = 16 / box.clientWidth * 100;
      if (e.key === 'ArrowLeft') set(now - step);
      else if (e.key === 'ArrowRight') set(now + step);
      else if (e.key === 'Home') set(min);
      else if (e.key === 'End') set(max);
      else if (e.key === 'Enter') set(def);
      else return;
      e.preventDefault();
    });
    h.addEventListener('pointerdown', function (e) {
      h.setPointerCapture(e.pointerId); h.setAttribute('data-dragging', '');
      var r = box.getBoundingClientRect();
      function move(ev) { set((ev.clientX - r.left) / r.width * 100); }
      function up() { h.removeAttribute('data-dragging'); h.removeEventListener('pointermove', move); h.removeEventListener('pointerup', up); h.removeEventListener('pointercancel', up); }
      h.addEventListener('pointermove', move); h.addEventListener('pointerup', up); h.addEventListener('pointercancel', up);
    });
  });

  /* ---------- Motion demo: real tokens, reduced motion handled by tokens.css ---------- */
  var toggle = document.getElementById('motion-toggle');
  var win = document.getElementById('motion-win');
  var readout = document.getElementById('motion-readout');
  if (toggle && win) {
    var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced && readout) readout.innerHTML = 'Reduced motion is on: <code>--dur-base</code> and <code>--dur-fast</code> are 1 ms, so the window appears and disappears instantly.';
    function setOpen(open) {
      if (open) {
        win.setAttribute('data-from', '');
        void win.offsetWidth;            /* commit the start state before transitioning */
        win.removeAttribute('data-from');
        win.setAttribute('data-open', '');
      } else {
        win.removeAttribute('data-open');
      }
      toggle.textContent = open ? 'Close window' : 'Open window';
      toggle.setAttribute('aria-expanded', String(open));
    }
    toggle.addEventListener('click', function () { setOpen(!win.hasAttribute('data-open')); });
    win.querySelector('[data-motion-close]').addEventListener('click', function () { setOpen(false); toggle.focus(); });
  }
})();
