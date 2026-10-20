# JAT OS

A browser-based desktop that runs on top of a WordPress site, by Jeremy Anderson Tech. Visitors keep the normal website; anyone can switch into a desktop with windows, a launcher and the Craft apps (VectorCraft, PhotoCraft, FigCraft, PdfCraft, WordCraft, GridCraft, DeckCraft, DesignCraft, CADCraft, SoundCraft, LightCraft), plus FloraHearth for garden planning.

**Live site:** https://cptnope.github.io/JAT-OS/

| Page | What it is |
| --- | --- |
| [Overview](https://cptnope.github.io/JAT-OS/) | Project overview and status |
| [Brand book](https://cptnope.github.io/JAT-OS/brandbook/) | Identity, colour, type, icons, components, motion, app manifest, bridge protocol, WordPress plan |
| [Example](https://cptnope.github.io/JAT-OS/example/) | A demo site that switches into the JAT OS shell |

## The example
- **Shell styles:** four switchable layouts — Dock (the default), Taskbar, Shelf and Activities. Change them in Settings, in quick settings, or from the desktop's right-click menu.
- **Windows:** drag, resize, snap to the edges with a preview, maximize, minimize, and use two to four desktops.
- **Launcher:** search apps and settings with Ctrl + Space.
- **Craft apps:** they open in sandboxed windows, or in a new tab.
- **Adaptive layouts:** on a phone, apps run full screen with a home grid and an app switcher; on a tablet, windows open maximized.
- **Preferences:** stored in your browser. Browser Back exits to the website.

This is a design prototype, not the WordPress plugin. The overview page lists what works today and what's planned.

## Structure
```
index.html          overview
brandbook/          brand book + design system
example/            demo site + shell (src/*.ts → dist/*.js, shell.css)
assets/             tokens.css · tokens.json · components.css · icons.svg · logo/ · apps/ · wallpapers/ · screens/
registry/           apps.json · manifest.schema.json (JAT App Manifest v1)
PRODUCT.md          product truth
DESIGN.md           visual system record
CLAUDE.md           notes for Claude sessions
docs/brief.md       original brief
```

## Develop
```sh
cd example && tsc -p .        # compile the shell (TypeScript ≥ 5)
cd .. && python3 -m http.server
```

## Hosting
Served by GitHub Pages from the `main` branch root. If Pages isn't on yet, go to **Settings → Pages → Build and deployment**, set **Source: Deploy from a branch**, and choose **Branch: main / (root)**.
