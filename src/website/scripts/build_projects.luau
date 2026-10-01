-- Validate top-level project TOML files published directly with the site.
local fs = require("@lune/fs")
local serde = require("@lune/serde")
local Render = require("../../../i18n/render")

local projects = {}
local ids = {}
local required = { "id", "title", "description", "details", "status", "tags" }
local allowed = { id = true, title = true, description = true, details = true, status = true,
    tags = true, link = true, image = true, startDate = true, endDate = true, translations = true }
local localeKeys = {}
for _, locale in Render.locales(".").locales do
    localeKeys[locale.key] = true
end

for _, name in fs.readDir("projects") do
    if name:match("%.toml$") then
        local project = serde.decode("toml", fs.readFile("projects/" .. name))
        for _, key in required do
            assert(project[key] ~= nil, name .. ": missing " .. key)
        end
        for key in project do
            assert(allowed[key], name .. ": unknown field " .. key)
        end
        assert(not ids[project.id], name .. ": duplicate id " .. project.id)
        ids[project.id] = true
        assert(project.status == "released" or project.status == "unreleased", name .. ": invalid status")
        assert(type(project.tags) == "table", name .. ": tags must be an array")
        for _, tag in project.tags do
            assert(type(tag) == "string", name .. ": tags must contain strings")
        end
        if project.translations then
            for localeKey, values in project.translations do
                assert(localeKeys[localeKey], name .. ": undeclared locale " .. localeKey)
                assert(type(values) == "table", name .. ": translation must be a table")
                for key, value in values do
                    assert((key == "title" or key == "description" or key == "details")
                        and type(value) == "string", name .. ": invalid translation " .. key)
                end
            end
        end
        table.insert(projects, project)
    end
end

print("Validated " .. #projects .. " project TOML files")
