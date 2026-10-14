---
name: JAT OS
description: A browser desktop for the Craft apps, layered over a WordPress site; one system, four shell styles.
colors:
  jat-blue: "#2f6bff"
  jat-blue-interactive: "#1f5ae6"
  jat-blue-hover: "#1747bd"
  jat-blue-pressed: "#12378f"
  jat-blue-soft: "#eef3ff"
  jat-blue-light: "#7fa4ff"
  paper-white: "#ffffff"
  paper: "#f8f9fb"
  mist: "#f1f3f6"
  cloud: "#e6e9ee"
  slate-line: "#d3d8e0"
  slate-muted: "#8c95a4"
  slate-secondary: "#5a6373"
  slate-tertiary: "#5f6878"
  graphite: "#252a34"
  ink: "#15181e"
  night: "#0e1014"
  night-text: "#eef0f4"
  night-secondary: "#a9b1be"
  night-surface-1: "#1c2028"
  night-surface-2: "#191c23"
  night-raised: "#20242d"
  success: "#147a41"
  success-dark: "#55cf93"
  warning: "#94590a"
  warning-dark: "#f2b856"
  danger: "#b42330"
  danger-dark: "#ff7a82"
  close-red: "#d92d38"
  app-vectorcraft: "#7b4dff"
  app-photocraft: "#0e8f8a"
  app-figcraft: "#e2471f"
  app-pdfcraft: "#e89b0c"
  app-system: "#4e5666"
typography:
  display:
    fontFamily: "Inter, Segoe UI Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 5vw + 1rem, 4.5rem)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Inter, Segoe UI Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Inter, Segoe UI Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.011em"
  title-sm:
    fontFamily: "Inter, Segoe UI Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.011em"
  body:
    fontFamily: "Inter, Segoe UI Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0"
    fontFeature: "\"cv11\", \"ss01\""
  body-app:
    fontFamily: "Inter, Segoe UI Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, Segoe UI Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.3
  badge:
    fontFamily: "Inter, Segoe UI Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    letterSpacing: "0.01em"
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, SF Mono, Menlo, Consolas, monospace"
    fontSize: "0.92em"
    fontWeight: 400
rounded:
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  2xl: "22px"
  full: "999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "8": "32px"
  "10": "40px"
  "12": "48px"
  "16": "64px"
components:
  button-primary:
    backgroundColor: "{colors.jat-blue-interactive}"
    textColor: "{colors.paper-white}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "32px"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "{colors.jat-blue-hover}"
  button-primary-pressed:
    backgroundColor: "{colors.jat-blue-pressed}"
  button-default:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "32px"
  button-default-hover:
    backgroundColor: "{colors.cloud}"
  button-ghost-hover:
    backgroundColor: "{colors.cloud}"
    textColor: "{colors.ink}"
  button-danger:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.danger}"
  input:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "32px"
  menu:
    backgroundColor: "{colors.paper-white}"
    rounded: "{rounded.md}"
    padding: "4px"
    width: "220px"
  menu-item-active:
    backgroundColor: "{colors.jat-blue-interactive}"
    textColor: "{colors.paper-white}"
    height: "28px"
  badge-accent:
    backgroundColor: "{colors.jat-blue-soft}"
    textColor: "{colors.jat-blue-hover}"
    rounded: "{rounded.full}"
    height: "20px"
    padding: "0 8px"
    typography: "{typography.badge}"
  window:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.lg}"
  titlebar:
    backgroundColor: "{colors.mist}"
    textColor: "{colors.ink}"
    height: "38px"
    typography: "{typography.body}"
  quick-tile-on:
    backgroundColor: "{colors.jat-blue-interactive}"
    textColor: "{colors.paper-white}"
    rounded: "{rounded.lg}"
    padding: "10px"
  app-tile:
    rounded: "22.66%"
    size: "48px"
  activities-topbar:
    backgroundColor: "{colors.night}"
    textColor: "{colors.night-text}"
    height: "32px"
---

# Design System: JAT OS

Product truth (who it serves, stack, principles, accessibility floor) lives in [PRODUCT.md](PRODUCT.md). Long-form guidance (logo construction, iconography, motion, responsive and pen behaviour, app manifest, WordPress integration, engineering handoff) lives in the brand book at [brandbook/index.html](brandbook/index.html). This file is the compact, token-bearing record of what was built.

Sources of truth, in order: `assets/tokens.css` (every value; `assets/tokens.json` mirrors it), `assets/components.css` (the `jat-` component library), `example/shell.css` and `example/src/*.ts` (shell layout, window manager, launcher, panels, phone layout).

## Overview

**Creative North Star: "The Category Standard, Played Straight"**

JAT OS is a desktop environment at the craft level of the flagship operating systems, not a novelty web-desktop. The direction is the category standard executed straight: cool neutral greys, one blue accent, a quiet UI sans, crisp window chrome, soft layered shadows, and translucency only where it earns its place (bars, dock, menus over wallpaper). The user chose this over the assigned "Swatch Standard" direction and a "Transit Standard" pick (seed `4693b33a`, degraded roll, no challengers). Originality comes from the system and the brand mark, not from styling tricks.

One token set and one component library are expressed through four live-switchable shell styles: **Dock** (default), **Taskbar**, **Shelf** and **Activities**. Styles change only geometry and placement (bar position and height, control side and shape, window and panel radius). Colour, type, spacing, shadow and motion are shared. Every control works or is labelled as a concept.

Density is desktop-dense (13px default UI text, 32px controls) and relaxes on touch (44px targets under `pointer: coarse`). The shell renders inside a shadow root (`<jat-os>`), so it never touches the host WordPress theme and the theme never reaches in.

**Key Characteristics:**
- Cool slate neutrals plus a single JAT Blue accent; status colours only for status.
- Inter for all UI, tabular numerals for clocks and numbers; JetBrains Mono only for paths, versions and shortcuts.
- Flat surfaces inside windows; depth comes from window, menu and dock shadows.
- Translucent chrome with a solid fallback, honouring `prefers-reduced-transparency` and a user toggle.
- One system, four shell styles, three form factors (phone, tablet, desktop).
- Authored SVG art throughout: logo, app tiles, icons, wallpapers.

## Colors

A cool, almost colourless slate world with one confident blue doing all the interactive work.

### Primary
- **JAT Blue** (`jat-blue`): the brand colour. Logo mark, focus ring in light theme, selection tint (`rgb(47 107 255 / 0.18)`), snap preview, desktop selection. Not used as a button fill.
- **Interactive Blue** (`jat-blue-interactive`): every interactive fill: primary buttons, active menu item, checked switch and checkbox, active tab underline, current Settings nav item, pressed quick-settings tile, links in light theme. White text on it is 5.7:1. Hover goes to `jat-blue-hover`, pressed to `jat-blue-pressed`; dark theme hovers to `#3a72ff`.
- **Blue Wash** (`jat-blue-soft`): soft accent backgrounds (accent badges, pressed icon buttons, avatar, active launcher search result) with `jat-blue-hover` text. In dark theme it becomes `rgb(47 107 255 / 0.16)` with `#8ab0ff` text.
- **Light Blue** (`jat-blue-light`): dark-theme focus ring, links and info.

### Neutral (light theme)
- **Paper White** (`paper-white`): surface-1 (inputs, cards, default buttons) and raised surfaces (menus, popovers, panels, dialogs).
- **Paper** (`paper`): surface-0, the window and app body; also the solid bar fallback. Bars use it at 78% (`rgb(248 249 251 / 0.78)`).
- **Mist** (`mist`): surface-2 (sidebars, toolbars, launcher footer) and the focused title bar.
- **Cloud** (`cloud`): surface-3 (hover wells, selected rows, segmented track, quick tiles) and the desktop background behind wallpaper.
- **Ink** (`ink`): primary text. **Slate Secondary** (`slate-secondary`): secondary text. **Slate Tertiary** (`slate-tertiary`): placeholders, hints, inactive title text. **Slate Muted** (`slate-muted`): disabled text.
- **Borders** are ink at fixed alphas: subtle `rgb(21 24 30 / 0.08)`, default `0.14`, strong `0.28`; divider `0.08`.

### Neutral (dark theme)
Dark is a full parallel theme, not an inversion: desktop `night`, surface-0 `ink`, surface-1 `night-surface-1`, surface-2 `night-surface-2`, surface-3 `graphite`, raised `night-raised`, sunken `#121419`, title bar `#1d2129` (inactive `#181b21`), bars `rgb(21 24 30 / 0.72)`. Text: `night-text`, `night-secondary`, tertiary `slate-muted`, disabled `#5d6574`. Borders are white at 0.07 / 0.12 / 0.24. Theme comes from `[data-theme]` or, without it, `prefers-color-scheme`.

### Status
`success` / `warning` / `danger` (light) and their `-dark` counterparts, each with a soft fill (`#e3f5ea`, `#fdf1dc`, `#fde6e8` light; 14% alpha in dark). Used in badges, dots, field errors, error and offline states. Window close hover is `close-red` with white glyph (Taskbar style).

### App identity
`app-vectorcraft`, `app-photocraft`, `app-figcraft`, `app-pdfcraft`, `app-system` fill the 64-unit app tiles only.

### Named Rules
**The One Accent Rule.** Interactive state is always JAT Blue. No second accent, no gradients on UI, no glow.

**The Tile-Only Rule.** App identity colours live on icon tiles and nowhere else. They never mark state, selection or category in the UI.

**The Tertiary Floor Rule.** Light tertiary text is `#5f6878`, not the slate-500 step, because it must hold 4.6:1 on surface-3 and 5.0:1 on surface-2. Do not "lighten" it.

## Typography

**UI Font:** Inter (fallbacks: Segoe UI Variable, Segoe UI, system-ui, -apple-system, Roboto, Helvetica Neue, Arial)
**Mono Font:** JetBrains Mono (fallbacks: ui-monospace, SF Mono, Menlo, Consolas)

Loaded from Google Fonts: Inter `opsz 14..32, wght 400..700`, JetBrains Mono 400 and 500. Inter is a deliberate choice: the category-standard canon calls for the neutral, highly legible UI face of the genre, and Inter is that face. Base text sets `font-feature-settings: "cv11", "ss01"`; clocks, times and numeric cells use `tabular-nums`.

### Hierarchy
| Role | Token | Size | Weight | Leading / tracking | Where |
|---|---|---|---|---|---|
| Display | `--text-4xl` | clamp(2.5rem, 5vw + 1rem, 4.5rem) | 700 | 1.15 / -0.03em | Brand book only |
| Headline | `--text-3xl` | 36px | 700 | 1.15 / -0.03em | Welcome window (26px on phone) |
| Page title | `--text-2xl` | 26px | 600 | -0.011em | Settings pages, About, notification clock |
| Panel title | `--text-xl` | 20px | 600 | -0.011em | Settings pane `h2`, app pads |
| Dialog title | `--text-lg` | 16px | 600 | -0.011em | Dialogs, empty states, mobile body |
| App body | `--text-md` | 14px | 400 | 1.5 | Inputs in apps, launcher search, welcome lede |
| UI default | `--text-sm` | 13px | 400 / 500 | 1.5 | Menus, lists, title bars (600), buttons (500) |
| Caption | `--text-xs` | 12px | 500 | 1.3 | Hints, timestamps, icon labels, small buttons |
| Badge | `--text-2xs` | 11px | 600 | +0.01em | Badges, `kbd` |

Weights in use: 400, 500, 600, 700. Bold (700) is reserved for the headline and the Dock menu-bar app name.

### Named Rules
**The Mono-for-Machines Rule.** JetBrains Mono appears only for paths, URLs, versions, code and keyboard shortcuts, at 0.92em. Never for headings or labels.

**The No-Caps Rule.** Labels are sentence case. `--tracking-caps` exists in tokens but no shipped surface uses uppercase labels.

## Layout

**Spacing** is a 4px base scale (`--space-1` 4px to `--space-16` 64px). Panels pad 16–20px, dialogs 24px, settings panes 24px × 32px, rows 8px × 16px with 48px min height.

**Control sizes:** sm 28px, md 32px (default), lg 40px, touch 44px. Under `pointer: coarse` buttons, icon buttons and menu items grow to 44px and Dock traffic lights grow from 13px to 18px.

**Z layers:** desktop 0, windows from 100, shell bars 5000, panels 6000, menus 7000, toasts 8000, modals 9000, tooltip 9500. The host element sits at `z-index: 2147483000`, `position: fixed; inset: 0; contain: strict`.

### Shell styles (`[data-shell]`)
| Style | Bars | Window radius | Title bar | Controls | Launcher | Panel radius |
|---|---|---|---|---|---|---|
| **Dock** (default) | 28px top menu bar + floating dock (64px tall, 20px radius, 8px from bottom, 48px icons) | 12px | 38px, centred title | Left; 13px traffic-light circles, glyphs on hover | Centred at 14% from top, 720px, blurred scrim | 16px |
| **Taskbar** | 48px full-width bottom bar, 3-column grid (workspaces, centred apps with Start + search pill, tray) | 8px | 36px | Right; 40px-wide rect buttons, red close hover | Start panel above taskbar, centred | 8px |
| **Shelf** | 56px floating shelf: round 40px launcher button, workspace pill, centred app pill (22px radius), status pill | 12px | 40px | Right; 28px circle icon buttons | Bottom-left panel, 720px | 22px |
| **Activities** | 32px top bar, fixed dark (`night` / `night-text`) | 12px | 44px | Right; 28px circles on surface-3 | Full-screen overview: search, workspace thumbnails (up to 4), window cards, dash | 16px |

Running indicators: Dock 4px dot; Taskbar 6×3px pill that widens to 16px in accent when active; Shelf 4px dot widening to 12px accent; dash 5px dot. Desktop icons run in a column grid (96px × 100px cells); in Dock they sit at the right edge.

### Form factors (from container width)
- **Phone (<600px):** no free windows. Apps run full screen between a 32px status bar and a 52px translucent nav bar; a 4-column home grid of app tiles replaces the desktop; launcher, quick settings and notifications become full-width sheets; an app switcher lists open apps. Title bar 44px with 40px circular controls; minimise, maximise and resize are hidden.
- **Tablet (600–1023px):** windows open maximised; side resize handles widen to 16px.
- **Desktop (≥1024px):** full window management: drag, 8-way resize (8px edges, 14px corners, 24px on coarse pointers), edge snapping (top edge maximises, 10px side edges half-snap, with a blue snap preview), tear-off from snapped state, cascade of 28px for new windows, minimise, workspaces.

Keyboard: Ctrl+Space toggles launcher (overview in Activities), Alt+` cycles windows, Ctrl+Alt+arrows snap / maximise / restore / minimise, Escape closes menus then panels; menus use arrow keys.

## Elevation & Depth

Hybrid: surfaces inside windows are flat and separated by tone (surface-0 to surface-3) and hairline dividers; elevation is reserved for things that float over other things. Dark theme uses heavier, black shadows and adds a white 1px ring to windows.

### Shadow Vocabulary (light)
- **sm** (`0 1px 2px rgb(14 16 20 / 0.08), 0 1px 1px rgb(14 16 20 / 0.04)`): default buttons, switch knob, selected segment, wallpaper thumbnails.
- **md** (`0 4px 12px rgb(14 16 20 / 0.10), 0 1px 3px rgb(14 16 20 / 0.08)`): tooltips, Shelf pills and launcher button.
- **lg** (`0 12px 32px rgb(14 16 20 / 0.16), 0 2px 8px rgb(14 16 20 / 0.08)`): menus, popovers, panels, toasts, dock, dash.
- **window** (`0 22px 48px rgb(14 16 20 / 0.22), 0 4px 12px rgb(14 16 20 / 0.10), 0 0 0 1px rgb(14 16 20 / 0.10)`): focused window, dialogs, overview thumbnails.
- **window-inactive** (`0 10px 24px rgb(14 16 20 / 0.12), 0 0 0 1px rgb(14 16 20 / 0.08)`): unfocused windows.

### Translucency
Bars use `--chrome-bar` with `backdrop-filter: saturate(1.6) blur(24px)`. The Dock launcher scrim is `rgb(14 16 20 / 0.35)` with an 18px blur; other launcher, overview and switcher scrims are solid `--scrim`. Under `prefers-reduced-transparency: reduce`, or with Settings > Reduce transparency (`.os[data-solid]`), bars become `--chrome-bar-solid` and blur goes to 0.

### Named Rules
**The Float-Only Shadow Rule.** Shadows mark things that float (windows, menus, panels, dock, toasts). Content inside a window stays flat and tonal.

**The Solid Fallback Rule.** Every translucent surface has a solid equivalent that the user and the OS preference can force. Translucency never carries meaning.

## Shapes

Gently rounded and nested: radii step down as elements nest (panel 16px, tile 12px, button 8px, chip 6px, checkbox 4px). Menu items use `menu-radius − 3px`; segmented buttons use `radius-md − 2px`. Pills (`999px`) are for badges, search fields in the launcher and taskbar, workspace pills and Shelf chrome. Maximised and side-snapped windows, and all windows on phone, lose their radius and shadow.

**App tiles** are 64-unit squares with corner radius 14.5 (22.66% of size, applied as `calc(size × 0.2266)` at any size), a white 10% highlight band across the top 20 units, a 10% black inner stroke, and a white single-weight glyph (3.5 stroke, round caps).

**UI icons** (`assets/icons.svg`, 41 symbols): 24px grid, 2px live-area padding, 1.75 stroke, round caps and joins, 2px corner radius on rectangles, `currentColor`. Sizes 16 / 20 / 24px.

**Logo mark:** two stacked windows forming a J: a rear window drawn as a 5-unit JAT Blue outline (8 radius), masked where the front window overlaps; the front window as a solid JAT Blue title bar and body separated by a gap. Variants: full colour, reversed, mono light and dark, `currentColor`, app icon (light and dark), maskable, favicon, and a Jeremy Anderson Tech endorsement lockup.

**Wallpapers** are authored SVG (2560 × 1600): Ridge (day and night variants, chosen by theme), Graphite, JAT Blue, Ridge at night.

## Components

All classes are prefixed `jat-` and read tokens only; shell styles alter them through `--window-radius`, `--titlebar-height`, `--menu-radius` and `--panel-radius`.

### Buttons
- **Shape:** gently rounded (8px; small 6px), 32px tall, 12px side padding, weight 500, `sm` shadow.
- **Default:** surface-1 with default border; hover surface-3; active nudges down 0.5px and drops the shadow.
- **Primary:** Interactive Blue with white text, no border; hover and pressed step darker.
- **Ghost:** transparent, no border or shadow; hover surface-3. **Danger:** surface-1 with danger text; hover danger-soft.
- **Busy:** label hidden, 14px spinner. **Disabled:** 45% opacity, no pointer events.
- **Icon button:** 32px square, transparent, secondary colour; pressed state uses Blue Wash.
- Transitions: background and border 80ms linear; transform 80ms expo-out.

### Inputs / Fields
- **Style:** 32px, surface-1, default border, 8px radius, placeholder in tertiary. Hover strengthens the border.
- **Focus:** border becomes the focus ring colour plus a 3px `selection-bg` halo.
- **Error / Disabled:** danger border with an icon-led error line; disabled on surface-2 with disabled text.
- **Selection controls:** 16px checkbox (4px radius) and radio, filled Interactive Blue when checked; 36 × 20px switch; segmented control on a surface-3 track with a raised surface-1 selection.

### Menus, popovers, tooltips
- **Menu:** min 220px, 4px padding, raised surface, subtle border, `lg` shadow. Items 28px (44px on touch) on a 16px icon / label / hint grid; hover, focus and keyboard-active items fill Interactive Blue with white text. Section labels are 12px semibold tertiary.
- **Tooltip:** graphite (`#252a34`) with white 12px medium text, 6px radius.
- **Toast:** up to 360px, raised, `lg` shadow, 32px app icon, title / body / meta; top-right under the top bar, or above the bottom bar in Taskbar and Shelf; dismisses after 6s.

### Window
- Frame with `--window-radius`, surface-0 body, inactive shadow that becomes `window` on focus. Min 280 × 180px (apps declare their own minimum, default 480 × 360).
- Title bar: `--titlebar-height`, surface-2 tint (focused) or paper (inactive), 13px semibold title with a 16px app tile; inactive title text drops to tertiary.
- Controls by style: Dock traffic lights (close `#ff5f57`, minimise `#febc2e`, zoom `#28c840`; grey when unfocused; glyphs at 55% black on hover); Taskbar rect buttons; Shelf and Activities 28px circles.
- Embedded apps load in an iframe with a loading state and an honest error / external fallback state.

### Navigation and shell chrome
- **Launcher:** pill search (40px), app grid of 104px min cells with 56px tiles, keyboard-navigable results with Blue Wash highlight, user footer on surface-2. Concept apps carry a small "flag" pill.
- **Quick settings:** 340px panel: theme segmented control, 2-column tiles (pressed = Interactive Blue), 4-up shell style picker with schematic thumbnails, footer actions.
- **Notifications:** 380px panel with large tabular clock, Do Not Disturb row and toast-style items.
- **Settings:** 210px surface-2 sidebar (current item Interactive Blue) and a scrollable pane; collapses to a horizontal tab strip under 760px.
- **Workspace pills:** 18 × 16px numbered boxes; current one inverted (text-primary fill).

### Signature: Shell style picker
Cards with a 16:10 schematic of each style drawn over the Ridge wallpaper (top bar, window with control dots, dock or bar). Selected card gets an accent border plus a 1px accent ring. Used in Settings, Quick settings and the Welcome window.

### States
Empty, error and offline states centre a 48px rounded icon well (14px radius), a 16px semibold title, a 46ch body and actions. Error and warning variants tint the well with danger-soft and warning-soft.

### Motion

Easing: `--ease-out` `cubic-bezier(0.16, 1, 0.3, 1)` for entering and opening; `--ease-in` `cubic-bezier(0.7, 0, 0.84, 0)` for leaving; `--ease-standard` `cubic-bezier(0.2, 0, 0, 1)` for moves and resizes (window snap animates 220ms on it). Durations: instant 80ms (hover, press), fast 140ms (menus, tooltips, dock hover lift of 4px), base 220ms (windows, panels), slow 360ms (minimise, workspace switch, wallpaper change), mode 480ms (entering and leaving OS mode). Under `prefers-reduced-motion: reduce`, all but instant collapse to 1ms and Web Animations are skipped.

## Do's and Don'ts

### Do:
- **Do** take every value from `assets/tokens.css` custom properties; update `tokens.json` in the same change.
- **Do** express a new shell variation through the shell-style tokens (`--window-radius`, `--titlebar-height`, `--menu-radius`, `--panel-radius`, bar heights) rather than new colours or type.
- **Do** use Interactive Blue (`#1f5ae6`) for fills behind white text and JAT Blue (`#2f6bff`) for brand, focus and selection.
- **Do** give every translucent bar a solid fallback and respect `prefers-reduced-transparency`, `prefers-reduced-motion` and the in-app Reduce transparency toggle.
- **Do** keep the shell inside its shadow root and ship styles as `tokens.css` → `components.css` → `shell.css`.
- **Do** design each form factor on its own terms: full-screen apps on phone, maximised windows on tablet, free windows on desktop; 44px targets on coarse pointers.
- **Do** draw new art as original SVG to the icon grid (24px, 1.75 stroke) or the app-tile template (64 units, 14.5 radius).
- **Do** record provenance for rasters: `assets/screens/*.jpg` are Playwright captures of the example; all SVG art (logo, app tiles, icons, wallpapers) was authored for this project.

### Don't:
- **Don't** use app identity colours for UI state, selection, categories or charts.
- **Don't** add a second accent, gradients on UI surfaces, glowing borders or decorative glassmorphism; translucency is for bars, dock, menus and scrims only.
- **Don't** lighten light-theme tertiary text below `#5f6878`.
- **Don't** use Apple, Microsoft or Google names, logos or icons in any shell style.
- **Don't** set uppercase labels or use mono for anything but paths, versions, code and shortcuts.
- **Don't** add shadows to content inside windows; tone and dividers separate it.
- **Don't** ship a control that does nothing; label concepts as concepts.
