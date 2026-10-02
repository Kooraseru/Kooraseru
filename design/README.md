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

## GitHub package

`design/` is the npm package `@kooraseru/design`. This website still builds
from these source files directly, so preview and Pages do not need a package
registry or network download.

To use a published version in another project, add this scope to that project's
`.npmrc`:

```ini
@kooraseru:registry=https://npm.pkg.github.com
```

Then install an exact published version, for example
`npm install --save-exact @kooraseru/design@2026.10.1`, and import
`@kooraseru/design/core.css` or another
entry point. GitHub Packages requires authentication to install npm packages,
including public ones. Keep the token in your environment or CI secret, never
in a committed `.npmrc`.

To release a new version, add its ID and authored notes under `releases/`.
The workflow generates the changelog from those records. A push to
`main` validates the archive and publishes the newest listed release. The
source `package.json` uses `0.0.0`; the release list supplies the published
version. GitHub makes a new package private by default; set its visibility to
public in package settings if it should be available to everyone.
