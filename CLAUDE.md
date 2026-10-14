# JAT OS — notes for Claude

JAT OS is a browser-based desktop delivered as a WordPress plugin, by Jeremy Anderson Tech. This repository holds its brand book, its design system and an interactive prototype, all hosted on GitHub Pages.

## Read these first
- `PRODUCT.md` — product truth: users, purpose, constraints and principles. Update it only when the product changes.
- `DESIGN.md` and `.impeccable/design.json` — the visual system as built. Don't invent values; reuse the tokens.
- `.impeccable/surfaces/example-index-html.md` — the direction contract for the example shell.
- `docs/brief.md` — the original client brief.

## Design rules that are already decided
- **Direction:** the category standard, executed straight at flagship craft. Don't reopen this without the user.
- **One system, four shell styles:** Dock (the default), Taskbar, Shelf and Activities. All four share the same tokens, components and apps; only geometry and placement change (the `[data-shell]` blocks in `assets/tokens.css`).
- **No platform marks:** never use Apple, Microsoft or Google names, logos or icons in the UI.
- **Colour:** JAT Blue `#2F6BFF` is the brand colour; `#1F5AE6` is every interactive fill. App identity colours appear only on icon tiles.
- **Honest features:** no controls that imply unbuilt features. Label them Planned or Preview.

## Files
- `assets/tokens.css` is the source of truth. After editing it, regenerate `assets/tokens.json` (the brand book also hard-codes contrast ratios, so recompute those).
- `assets/components.css` holds the shared `jat-` components. It is used by the overview, the brand book and the shell.
- `example/src/*.ts` holds the shell source: vanilla TypeScript and Web Components, with no framework. Build it with `cd example && tsc -p .`, which emits `example/dist/`. Commit `dist/`, because Pages serves it as is.
- `registry/apps.json` and `manifest.schema.json` hold the JAT App Manifest v1 entries for the Craft apps.

## Impeccable
This project was designed with the Impeccable skill (github.com/pbakaus/impeccable, release skill-v4.5.2). `.claude/skills/impeccable/SKILL.md` is a small loader that clones that release on first use. Typical commands are `/impeccable critique example/index.html`, `/impeccable polish …` and `/impeccable audit …`. Screenshots under `.impeccable/review/` are local only and are git-ignored.

## Local preview
`python3 -m http.server` from the repo root, then open http://localhost:8000/. ES modules and `fetch` need http; `file://` won't work.
