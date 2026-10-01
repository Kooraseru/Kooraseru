# Kooraseru website repository guidance

This repository contains the website, contact Worker, and GitHub profile README. The root `README.md` is the public profile README, including on generated `main`.

## Branches and generated output

- Edit the `source` branch. The `main` branch is generated publication output.
- `.heap/pages/` is the locally assembled website. `.heap/repo-branches/main/` is a local preview of the generated `main` tree. `.heap/` is ignored by Git and remains available for debugging until the next task run.
- The single VS Code task, **Publish: Test locally**, validates and assembles both directories. VS Code Live Preview serves `.heap/pages/` as its root on port 3000.
- `.github/workflows/pages.yml` validates `source`, publishes the generated tree to `main`, and deploys `main` through GitHub Pages. Do not edit generated files on `main`.

## Source layout

- `projects/*.toml` is the only editable project catalog. The build generates `.heap/pages/projects.json` for the browser. Do not commit generated JSON.
- `i18n/locales.toml` declares locales. `i18n/site.toml` contains `[key.values]` localization entries; `i18n/render.luau` and `i18n/validate.luau` follow the `vscode-editor-columns` catalog workflow. `i18n/skills.toml` holds locale-neutral skill lists.
- `src/website/index/index.html` is the home page template. It uses `{{l10n:site.key}}` placeholders, rendered from TOML during the build. `src/website/shared/` contains shared CSS and JavaScript; `src/website/mod-mail/` contains existing public pages; `src/website/CNAME` owns the custom domain.
- `src/email-system/gcloud/` contains the existing public GCloud pages. `src/email-system/cloudflare/` contains the contact Worker and Wrangler configuration.
- `assets/confetti/` contains the four confetti images. There is no manifest or confetti type JSON; the effect list lives in the client code.

## Project and localization changes

Project TOML requires `id`, `title`, `description`, `details`, `status`, and `tags`. Use `released` or `unreleased`; optional `link`, `image`, and dates are only included when real values are known. Optional `[ja]` values override the English title, description, and details. Keep project data out of i18n catalogs.

Add interface text to `i18n/site.toml`, supplying `en-US` and `ja-JP` values. Use a matching placeholder in HTML when text belongs in the built page. Lune generates browser locale JSON into `.heap/pages/i18n/`; do not keep `en.json` or `ja.json` in source.

## Lune and Worker

Use Lune for repository scripts and publication. Before editing Luau, read the applicable language guidance under `.kero/mnt/global/language/luau/`, starting with `luau-system.md`, and the relevant file, structure, and language concept documents. The mounted guidance is language policy, not this site's product or repository topology.

The browser posts contact details to `https://contact.kooraseru.com/`. Keep Gmail credentials in Cloudflare Worker secrets. The Worker deployment workflow uses GitHub secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` only for CI authentication. Never put secrets in website files, project TOML, source code, or Wrangler vars.

## Validation

Run `lune run i18n/validate.luau` and the VS Code publication task. Check Live Preview at `http://127.0.0.1:3000/`, including `/ja/`, project cards, contact fields, and the existing `/mod-mail/` and `/gcloud/` pages. Preserve the profile README and legal pages when changing publication.
