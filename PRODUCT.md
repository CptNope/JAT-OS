# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

JAT OS is a web product that must adapt across desktop, tablet and smartphone browsers, with mouse, trackpad, keyboard, touch, stylus (Samsung S Pen, Apple Pencil) and screen-reader input. It is responsive web, not a native app.

## Stack

- **Delivery:** a WordPress plugin. It adds an operating layer over an existing WordPress site and never replaces the site.
- **OS shell (desktop, windows, launcher, dock or taskbar, system apps):** vanilla TypeScript and Web Components, with no UI framework. This was chosen so the shell can later run as a standalone web app outside WordPress.
- **Server side:** WordPress PHP and the REST API, for the app registry, user preferences, permissions and settings in the admin area.
- **Open decisions:** the build tooling and whether full-viewport OS mode is a dedicated route, an app shell or another isolated layer. Both are part of the integration architecture still to be designed.

## Users

The first release is for both groups below, on a tiered model.

- **Guests (public visitors to the WordPress site):** they can enter OS mode and get a guest desktop. They see and launch the Jeremy Anderson Tech app ecosystem without an account.
- **Signed-in users (WordPress accounts):** they get personalization, saved and restored workspaces, preferences that persist between sessions, and possibly more apps. Existing WordPress authentication and user roles decide who can do what.
- **Site administrators:** they manage registered apps, permissions, branding and OS settings from the WordPress admin area.

The audience is developers, designers and makers who use the Craft apps for real work. That covers vector illustration, photo editing, Figma-style design and PDF work.

## Product Purpose

JAT OS turns a WordPress site into a browser-based desktop environment that people can switch into and out of. It hosts independently built progressive web apps (PWAs) in one coherent workspace, with windows, a launcher, a dock or taskbar, notifications, quick settings and workspaces.

Success means a serious, extensible operating environment that could become its own platform. It must not be a novelty desktop skin. The normal website stays intact and is the default.

## Positioning

JAT OS is a modular operating layer delivered as a WordPress plugin. It unifies a family of independently hosted PWAs, including apps that cannot be embedded, under one shell, one design system and one permission-controlled app registry. Meanwhile the host site's pages, permalinks, SEO, theme and block editor stay untouched.

Its originality must come from its own interaction model and visual language, not from imitating Windows, macOS, GNOME or ChromeOS.

## Operating Context

- **Entering and leaving:** visitors arrive at a normal WordPress site. An accessible toggle enters OS mode, and the return to website mode must be seamless.
- **Launching apps:** apps open in one of three ways:
  1. **Embedded window:** an isolated iframe, used only where the app's security policy allows it.
  2. **External application:** a standalone PWA or a browser tab.
  3. **Integrated application:** a future option where the app talks to the OS through a versioned, origin-verified, permission-scoped message bridge.
- **Working:** users multitask across several app windows, tile and snap them, maximize one for focused creative work, and switch between workspaces.
- **Device behavior:** on tablets and phones, layouts adapt rather than shrink. Phones use full-screen apps and simplified multitasking.

## Capabilities and Constraints

### Applications

- **First app ecosystem:** these four apps are owned by the user and can be modified. They are the reference apps for embedding, manifests and the bridge.
  - VectorCraft: https://cptnope.github.io/vectorcraft/
  - PhotoCraft: https://cptnope.github.io/photocraft/
  - FigCraft: https://cptnope.github.io/figcraft/
  - PdfCraft: https://cptnope.github.io/pdfcraft/
- **Future apps (not yet built):** code editors, AI assistants, developer tools, file utilities, media players, productivity apps and custom WordPress-powered apps.
- **App manifest spec required:** it needs fields for ID, name, description, version, icons, category, launch URL, launch mode, window preferences, minimum and preferred dimensions, permissions, capabilities, offline availability, integration endpoints, and publisher and attribution.
- **Never assume:** independently hosted apps do not automatically share storage, permissions or service-worker control. Do not assume every app can be embedded, or that every app supports pen, touch or the bridge.

### WordPress coexistence

- The OS keeps its own isolated CSS and JavaScript.
- It must not interfere with the active theme, other plugins or the block editor.

### Honesty about features

- Distinguish implemented features from future ones.
- Do not create mock controls that imply functionality nobody has specified.
- Label concept screens as concepts.

### Open decisions

- The integration architecture, whether a route, an app shell or an isolated layer.
- The bridge protocol.
- Which system apps (Settings, App Manager, File Manager, Search and others) ship in the first release and which are only specified.
- What exactly guests can and cannot do.
- Where a File Manager's files come from (for example the WordPress media library or app storage).

## Brand Commitments

- **Product name:** JAT OS. This is a working name.
- **Company:** Jeremy Anderson Tech. The identity should relate to the company without needing the full company name on every element.
- **Existing brand assets:** none. There is no logo, palette or typeface to preserve, so the identity starts fresh. Prefer original, scalable vector artwork.
- **Visual direction (confirmed in the Impeccable direction round):** the category standard, executed straight at the craft level of macOS, Windows 11, ChromeOS and GNOME. Not an imitation of any one of them.
- **Switchable shell styles (confirmed):** one JAT OS brand, token set and component library, expressed through four live-switchable shell styles: **Dock** (macOS-like, the default), **Taskbar** (Windows-like), **Shelf** (ChromeOS-like) and **Activities** (GNOME-like). Styles never use Apple, Microsoft or Google names, logos or icons.
- **Binding exclusions from the brief:** no generic AI aesthetics, excessive glowing borders, random gradients, gratuitous glassmorphism, or decoration that hurts readability.

## Evidence on Hand

- The written brief, which defines the vision, scope and phases.
- Four live Craft PWAs at the URLs above. Their iframe headers, manifests and service-worker scopes have not been audited yet.
- None of the following exist yet, and none may be invented: customers, testimonials, usage metrics, pricing, licensing terms or press.

## Product Principles

1. **The website comes first; the OS is an opt-in layer.** Entering OS mode never compromises the site's content, URLs, SEO, theme or editor, and leaving it is always one clear action away.
2. **One coherent shell around honest app boundaries.** Apps should look and behave like one family. The shell never hides real limits such as an app that can't be embedded, offline gaps or separate storage.
3. **Specify before simulating.** Every control does something that has been specified. Concepts are labeled as concepts, and future capabilities are named as future.
4. **Adapt to the device, don't shrink.** Each class of device and input method gets a layout and interaction model that fits it.
5. **Portable by construction.** The shell, tokens and components stay independent of WordPress so JAT OS can become a standalone platform.

## Accessibility & Inclusion

- Full keyboard operation of the shell: launcher, windows, menus and workspaces.
- Screen-reader support.
- Visible focus and selection states.
- Hover alternatives for touch and pen.
- Alternatives for every animation when the user has reduced motion turned on.
- Contrast that holds over user-chosen wallpapers and translucent surfaces.
- The brief asks for color pairs tested for accessibility. The exact conformance target (for example WCAG 2.2 AA) has not been confirmed. Treat AA as the floor until it is set.
