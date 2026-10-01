-- Assemble the site and a local preview of the generated main branch.
local fs = require("@lune/fs")
local process = require("@lune/process")
local Render = require("../../../i18n/render")

local pages = ".heap/pages"
local branch = ".heap/repo-branches/main"
local legacy = ".heap/site"

if fs.isDir(legacy) then fs.removeDir(legacy) end

if fs.isDir(pages) then fs.removeDir(pages) end
fs.writeDir(pages)

fs.copy("assets", pages .. "/assets")
fs.copy("src/website/shared/css", pages .. "/css")
fs.copy("src/website/shared/js", pages .. "/js")
fs.copy("src/website/mod-mail", pages .. "/mod-mail")
fs.copy("src/email-system/gcloud", pages .. "/gcloud")
fs.copy("src/website/CNAME", pages .. "/CNAME")

local template = fs.readFile("src/website/index/index.html")
fs.writeFile(pages .. "/index.html", Render.text(".", template, "en-US"))
fs.writeDir(pages .. "/ja")
fs.writeFile(pages .. "/ja/index.html", Render.text(".", template, "ja-JP"))
Render.Write(pages .. "/i18n")

local projects = process.exec("lune", { "run", "src/website/scripts/build_projects.luau" }, { stdio = "inherit" })
assert(projects.ok, "project catalog build failed")

if fs.isDir(branch) then fs.removeDir(branch) end
fs.copy(pages, branch)
fs.copy("README.md", branch .. "/README.md")
fs.writeDir(branch .. "/.github/workflows")
fs.copy(".github/workflows/pages.yml", branch .. "/.github/workflows/pages.yml")

print("Built " .. pages .. " and previewed main in " .. branch)
print("VS Code Live Preview root: " .. pages)
