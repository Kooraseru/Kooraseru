-- Render TOML localization catalogs into the browser's locale JSON files.
local fs = require("@lune/fs")
local serde = require("@lune/serde")

local Render = {}

local function readToml(path)
    return serde.decode("toml", fs.readFile(path))
end

local function flatten(node, path, result)
    if node.values then
        assert(path ~= "", "localization key cannot be empty")
        assert(type(node.values["en-US"]) == "string", path .. " is missing en-US")
        result[path] = node.values
        return
    end
    for key, child in node do
        assert(type(child) == "table", "invalid localization node: " .. key)
        flatten(child, path == "" and key or path .. "." .. key, result)
    end
end

local function assign(root, path, value)
    local parts = string.split(path, ".")
    local node = root
    for index = 1, #parts - 1 do
        node[parts[index]] = node[parts[index]] or {}
        node = node[parts[index]]
    end
    node[parts[#parts]] = value
end

function Render.locales(root)
    local path = (root or ".") .. "/i18n/locales.toml"
    local locales = readToml(path).locales
    assert(#locales > 0, path .. " contains no locales")
    local seen = {}
    for _, locale in locales do
        assert(locale.key and locale.language and locale.file and not seen[locale.key], "invalid or duplicate locale entry")
        seen[locale.key] = true
    end
    return locales
end

function Render.catalog(root, name)
    local result = {}
    flatten(readToml((root or ".") .. "/i18n/" .. name .. ".toml"), "", result)
    return result
end

function Render.text(root, template, locale, links)
    local catalog = Render.catalog(root, "site")
    local output = template:gsub("{{%s*l10n:site%.([%w_.%-]+)%s*}}", function(key)
        local values = catalog[key]
        assert(values, "unknown localization key: site." .. key)
        local value = values[locale] or values["en-US"]
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

function Render.Build()
    local locales = Render.locales(".")
    local catalog = Render.catalog(".", "site")
    local skills = readToml("i18n/skills.toml").groups
    local output = {}
    local seen = {}
    for _, locale in locales do
        assert(not seen[locale.key], "duplicate locale: " .. locale.key)
        seen[locale.key] = true
        local document = {
            language = string.sub(locale.key, 1, 2),
            languageName = locale.language,
            direction = "ltr",
        }
        for key, values in catalog do
            assign(document, key, values[locale.key] or values["en-US"])
        end
        document.skills.groups = {}
        for _, group in skills do
            local title = catalog[group.titleKey]
            assert(title, "unknown skills title: " .. group.titleKey)
            local items = {}
            for _, name in group.items do table.insert(items, { name = name }) end
            table.insert(document.skills.groups, {
                title = title[locale.key] or title["en-US"],
                items = items,
            })
        end
        output[locale.file] = serde.encode("json", document) .. "\n"
    end
    return output
end

function Render.Write(directory)
    fs.writeDir(directory)
    local output = Render.Build()
    for filename, content in output do
        fs.writeFile(directory .. "/" .. filename, content)
    end
end

return Render
