# Kooraseru website repository guidance

This repository contains the website, contact Worker, and GitHub profile README. The root `README.md` is the public GitHub profile README; preserve it as such.

## Branch and publication

- `main` is the only editable and published branch. Do not create generated publication branches.
- `.heap/pages/` is the locally assembled website and the Pages deployment artifact. `.heap/` is ignored by Git and stays available for preview until the next build.
- The single VS Code task, **Website: Build preview**, assembles `.heap/pages/`. VS Code Live Preview serves it as the root on port 3000.
- `.github/workflows/pages.yml` validates source, builds one website, and deploys GitHub Pages. Pull requests run validation and build without deploying. Cloudflare Builds deploys the contact Worker directly from the same `main` branch and the `src/email-system/cloudflare/` root directory.

## Source layout

- `projects/*.toml` is the only project catalog. The build copies those TOML files into `.heap/pages/projects/` for the browser.
- `i18n/locales.toml` declares the default and supported locales, including presentation metadata. `i18n/site.toml` contains `[key.values]` localization entries. `i18n/render.luau` and `i18n/validate.luau` follow the `vscode-editor-columns` catalog workflow. `i18n/skills.toml` holds locale-neutral skill lists.
- `src/website/index/index.html` is the one home page template. The build fills its `{{l10n:site.key}}` placeholders with the configured default locale for static fallback and inserts the available project filenames. Browser JavaScript reads the `site_language` cookie and the published TOML catalogs, then replaces text in place. Do not generate locale-specific HTML routes or hardcode supported locale lists in HTML or JavaScript.
- `src/website/shared/` contains shared CSS and JavaScript; `src/website/mod-mail/` contains existing public pages; `src/website/CNAME` owns the custom domain.
- `src/email-system/gcloud/` contains existing public GCloud pages. `src/email-system/cloudflare/` contains the contact Worker and Wrangler configuration.
- `assets/confetti/` contains confetti images. There is no manifest or confetti type JSON; the effect list lives in client code.

## Project and localization changes

Project TOML requires `id`, `title`, `description`, `details`, `status`, and `tags`. Use `released` or `unreleased`; optional `link`, `image`, and dates are only included when real values are known. Optional `[translations."locale-key"]` tables may override title, description, and details for any declared locale. Keep project data out of interface i18n catalogs.

Add locale metadata to `i18n/locales.toml` and interface text to `i18n/site.toml`. Every text key needs a value for the configured default locale; other locales may use it as fallback. The published site keeps the TOML files themselves; do not add JSON catalogs or a locale manifest.

## Lune and Worker

Use Lune for repository scripts and publication. Before editing Luau, read the applicable language guidance under the mounted `.kero` language instructions, starting with `luau-system.md`, and the relevant file, structure, and language concept documents. That guidance is language policy, not this site's product or repository topology.

The browser posts contact details to `https://contact.kooraseru.com/`. Keep Gmail credentials in Cloudflare Worker runtime secrets. Cloudflare Builds manages its own deployment token; GitHub Actions needs no Cloudflare credentials. Never put secrets in website files, project TOML, source code, or Wrangler vars.

## Validation

Run `lune run i18n/validate.luau` and `lune run src/website/scripts/build_site.luau`. Check Live Preview at `http://127.0.0.1:3000/`, including language switching on the same URL, project cards, contact fields, and existing `/mod-mail/` and `/gcloud/` pages. Preserve the profile README and legal pages when changing publication.
