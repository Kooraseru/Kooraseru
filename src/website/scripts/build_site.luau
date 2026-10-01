-- Assemble one website for local preview and GitHub Pages publication.
local fs = require("@lune/fs")
local process = require("@lune/process")
local Render = require("../../../i18n/render")

local pages = ".heap/pages"
local obsoleteBranches = ".heap/repo-branches"
local obsoleteSite = ".heap/site"

if fs.isDir(obsoleteBranches) then fs.removeDir(obsoleteBranches) end
if fs.isDir(obsoleteSite) then fs.removeDir(obsoleteSite) end

if fs.isDir(pages) then fs.removeDir(pages) end
fs.writeDir(pages)

fs.copy("assets", pages .. "/assets")
fs.copy("projects", pages .. "/projects")
fs.writeDir(pages .. "/i18n")
for _, filename in fs.readDir("i18n") do
    if filename:match("%.toml$") then
        fs.copy("i18n/" .. filename, pages .. "/i18n/" .. filename)
    end
end
fs.copy("src/website/shared/css", pages .. "/css")
fs.copy("src/website/shared/js", pages .. "/js")
fs.copy("src/website/mod-mail", pages .. "/mod-mail")
fs.copy("src/email-system/gcloud", pages .. "/gcloud")
fs.copy("src/website/CNAME", pages .. "/CNAME")

local template = fs.readFile("src/website/index/index.html")
-- The configured default locale is static fallback; the browser reads the locale cookie.
local projectFiles = {}
for _, filename in fs.readDir("projects") do
    if filename:match("^[%w%-]+%.toml$") then table.insert(projectFiles, filename) end
end
table.sort(projectFiles)
template = template:gsub("{{project:files}}", table.concat(projectFiles, ","))
fs.writeFile(pages .. "/index.html", Render.text(".", template, Render.locales(".").default))

local projects = process.exec("lune", { "run", "src/website/scripts/build_projects.luau" }, { stdio = "inherit" })
assert(projects.ok, "project catalog build failed")

print("Built " .. pages .. " from main source")
print("VS Code Live Preview root: " .. pages)
