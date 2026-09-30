# Kooraseru website repository guidance

This repository contains the Kooraseru website and the GitHub profile README. The root `README.md` is the profile shown on GitHub; it is never a generic site or build README.

## Branch and publication

- `main` is the only working and publication branch. Make website, profile, and workflow changes here.
- `.github/workflows/pages.yml` builds the site from `main` and deploys the assembled artifact through GitHub Pages.
- Keep the GitHub profile README at the repository root. Keep `CNAME` in the published site root.
## Source layout

- `src/` contains the website HTML, CSS, JavaScript, locale JSON, and the Lune catalog generator.
- `assets/` contains images and other static media.
- `projects/` is **top-level** and contains one TOML file per project. It does not belong under `src/`.
- `src/projects.json` is generated browser data. Edit project TOML files, then run `lune run src/scripts/build_projects.luau`; do not hand-edit the JSON.
- `src/gcloud/` and `src/mod-mail/` contain existing public pages and must remain available after publication.

## Projects and localization

Each `projects/*.toml` file owns its carousel title, description, details, status, tags, and optional `link`, `image`, and dates. Required top-level fields are `id`, `title`, `description`, `details`, `status`, and `tags`. Use `released` or `unreleased` for status. Only link to a project when a public URL is known. Optional `[ja]` fields can translate title, description, and details; the top-level English fields are the fallback.

Site interface text lives in `src/i18n/en.json` and `src/i18n/ja.json`. Preserve the existing language switch behavior and key structure when editing the site. Update both locale files for new interface text. Project records must stay out of locale JSON.

## Luau and Lune rules

Use **Lune** for repository scripts and GitHub Actions. Do not introduce Python into the build. The workflow installs a pinned Lune binary directly. Before editing Luau, read the applicable language guidance under `.kero/mnt/global/language/luau/`: start with `luau-system.md`, then the relevant file, structure, and language concept documents. `.kero/mnt/global/language/language-system.md` explains ownership and exception routing.

The mounted guidance is language policy, not a description of this website. Apply relevant rules to Luau code; do not copy the old KERO product or repository topology from previous guidance. Keep generated files under generator ownership. Do not use `any` as a shortcut for type errors. Use the naming and file-role rules in the mount where applicable.

## Validation

After project changes, run `lune run src/scripts/build_projects.luau` and `lune run src/scripts/build_projects.luau --check`. Check that links and assets in assembled output resolve from the site root. Preserve the root profile README and the existing legal pages when changing publication steps.
