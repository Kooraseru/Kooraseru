-- Compile top-level project TOML files into the site's JSON catalog.
local fs = require("@lune/fs")
local serde = require("@lune/serde")
local process = require("@lune/process")

local output = ".heap/pages/projects.json"
local projects = {}
local ids = {}
local required = { "id", "title", "description", "details", "status", "tags" }
local allowed = { id = true, title = true, description = true, details = true, status = true,
    tags = true, link = true, image = true, startDate = true, endDate = true, en = true, ja = true }

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
        table.insert(projects, project)
    end
end

table.sort(projects, function(a, b) return a.id < b.id end)
local content = serde.encode("json", projects)
if table.find(process.args, "--check") then
    assert(fs.isFile(output) and serde.encode("json", serde.decode("json", fs.readFile(output))) == content,
        output .. " is stale; run lune run src/website/scripts/build_projects.luau")
else
    fs.writeDir(".heap/pages")
    fs.writeFile(output, content .. "\n")
end
