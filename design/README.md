# Kooraseru web design system

This directory is the editable source for the site's shared visual language.
The website build copies it to `.heap/pages/design/`. The repository-specific
contract and migration history live under `.kero/data/product/design-system/`
and `.kero/data/project/`.

## Entry points

- `core.css`: foundation, complete theme packs, and shared components.
- `home.css`: core plus home-page patterns and layout.
- `service.css`: core plus Mod Mail and GCloud page layout.
- `reference/index.html`: local component and theme review page.

The order is `reset`, `foundation`, `themes`, `components`, `patterns`, `pages`.
Keep every authored rule in its owning file and layer. Page styles control
composition; reusable component colors, focus states, and internal geometry
belong in `components.css`.

## Public component choices

| Component | Base class | Choices |
| --- | --- | --- |
| Card | `ks-card` | `data-elevation="none|subtle|raised"` |
| Button or action link | `ks-button` | `data-variant="primary|outline|ghost"`; optional `data-accent="discord"` |
| Field or select control | `ks-field` | `data-elevation="none|raised"`; `aria-invalid="true"` for invalid state |
| Service navigation | `ks-topbar`, `ks-topbar__inner`, `ks-brand` | Content and destination belong to the page |
| Dialog surface | `ks-dialog` | The caller owns focus and open/close behavior |

Use a semantic element first: buttons perform actions and anchors navigate.
Public values are prefixed `--ks-`. Components consume semantic color roles;
`themes/dark.css` and `themes/light.css` provide complete color packs. The
single theme registry is `themes.toml`; the Lune build validates pack roles and
generates the browser's allowed theme names and the home selector options.

Other projects can consume a versioned copy of this directory once a release
artifact exists. This repository builds from its local source. No network
download or package publication is part of the local build.
