# Website localization

`locales.toml` declares supported locales. `site.toml` stores site text as `[key.values]` sections with `en-US` and `ja-JP` strings, following the localization catalog used in `vscode-editor-columns`. `skills.toml` holds locale-neutral skill names and references localized group headings.

Run `lune run i18n/validate.luau` to check the catalogs. The publish build renders browser JSON into `.heap/pages/i18n/`; those JSON files are generated output and are not edited here.
