-- Read and validate TOML localization catalogs for the site build.
local fs = require("@lune/fs")
local serde = require("@lune/serde")

local Render = {}

local function readToml(path)
    return serde.decode("toml", fs.readFile(path))
end

local function flatten(node, path, result, defaultLocale)
    if node.values then
        assert(path ~= "", "localization key cannot be empty")
        assert(type(node.values[defaultLocale]) == "string", path .. " is missing " .. defaultLocale)
        result[path] = node.values
        return
    end
    for key, child in node do
        assert(type(child) == "table", "invalid localization node: " .. key)
        flatten(child, path == "" and key or path .. "." .. key, result, defaultLocale)
    end
end

function Render.locales(root)
    local path = (root or ".") .. "/i18n/locales.toml"
    local config = readToml(path)
    local locales = config.locales
    assert(type(locales) == "table" and #locales > 0, path .. " contains no locales")
    assert(type(config.default) == "string", path .. " has no default locale")
    local seen = {}
    for _, locale in locales do
        assert(type(locale.key) == "string" and type(locale.language) == "string"
            and type(locale.htmlLang) == "string"
            and type(locale.fontFamily) == "string" and not seen[locale.key],
            "invalid or duplicate locale entry")
        seen[locale.key] = true
    end
    assert(seen[config.default], "default locale is not declared")
    return config
end

function Render.catalog(root, name)
    local result = {}
    local config = Render.locales(root)
    flatten(readToml((root or ".") .. "/i18n/" .. name .. ".toml"), "", result, config.default)
    return result
end

function Render.text(root, template, locale, links)
    local catalog = Render.catalog(root, "site")
    local defaultLocale = Render.locales(root).default
    local output = template:gsub("{{%s*l10n:site%.([%w_.%-]+)%s*}}", function(key)
        local values = catalog[key]
        assert(values, "unknown localization key: site." .. key)
        local value = values[locale or defaultLocale] or values[defaultLocale]
        assert(value, "missing localization: site." .. key)
        return value
    end)
    output = output:gsub("{{%s*link:([%w_.%-]+)%s*}}", function(key)
        local value = links and links[key]
        assert(value, "unknown document link: " .. key)
        return value
    end)
    return output
end

function Render.validate(root)
    local declared = {}
    for _, locale in Render.locales(root).locales do declared[locale.key] = true end
    local catalog = Render.catalog(root, "site")
    for key, values in catalog do
        for localeKey, value in values do
            assert(declared[localeKey] and type(value) == "string", "invalid locale value: " .. key .. "." .. localeKey)
        end
    end
    local skills = readToml((root or ".") .. "/i18n/skills.toml").groups
    for _, group in skills do
        assert(catalog[group.titleKey], "unknown skills title: " .. group.titleKey)
    end
end

return Render
