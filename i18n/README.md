# Website localization

`locales.toml` declares the default locale and every supported locale's key, display name, HTML language, text direction, and font. `site.toml` stores interface text as `[key.values]` sections, following the localization catalog used in `vscode-editor-columns`. Every key needs a value for the configured default locale. Other locales may omit a value and use that fallback. `skills.toml` holds locale-neutral skill names and references localized group headings.

Run `lune run i18n/validate.luau` to check the catalogs. The site build copies these TOML files into `.heap/pages/i18n/`. The browser reads them directly, selects a locale using the `site_language` cookie, and updates one shared page in place. Adding a locale requires a new `locales.toml` entry and translations in the catalogs; no HTML or JavaScript locale list changes are needed.
