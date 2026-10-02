-- Assemble one website for local preview and GitHub Pages publication.
local fs = require("@lune/fs")
local process = require("@lune/process")
local serde = require("@lune/serde")
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
fs.copy("design", pages .. "/design")
fs.writeDir(pages .. "/i18n")
for _, filename in fs.readDir("i18n") do
    if filename:match("%.toml$") then
        fs.copy("i18n/" .. filename, pages .. "/i18n/" .. filename)
    end
end
fs.copy("src/website/shared/js", pages .. "/js")
local themes = serde.decode("toml", fs.readFile("design/themes.toml"))
assert(type(themes.default) == "string" and type(themes.themes) == "table" and #themes.themes > 0
    and type(themes.roles) == "table" and #themes.roles > 0,
    "invalid theme registry")
local themeIds = {}
local themeOptions = {}
local referenceOptions = {}
local seenThemes = {}
for _, id in themes.themes do
    assert(type(id) == "string" and id:match("^[%w%-]+$") and not seenThemes[id], "invalid theme name")
    seenThemes[id] = true
    local css = fs.readFile("design/themes/" .. id .. ".css")
    for _, role in themes.roles do
        assert(css:find("--ks-" .. role .. ":", 1, true), id .. " is missing theme role " .. role)
    end
    table.insert(themeIds, '"' .. id .. '"')
    table.insert(themeOptions, '<button class="dropdown-option theme-option" data-theme="' .. id
        .. '" data-i18n="themeOptions.' .. id .. '">{{l10n:site.themeOptions.' .. id .. '}}</button>')
    table.insert(referenceOptions, '<option value="' .. id .. '">' .. id .. '</option>')
end
assert(seenThemes[themes.default], "default theme is not declared")
local themeScript = fs.readFile("src/website/shared/js/theme-manager.js")
themeScript = themeScript:gsub("{{theme:default}}", themes.default)
themeScript = themeScript:gsub("const VALID_THEMES = %[%];", "const VALID_THEMES = [" .. table.concat(themeIds, ", ") .. "];", 1)
fs.writeFile(pages .. "/js/theme-manager.js", themeScript)
local reference = fs.readFile("design/reference/index.html")
reference = reference:gsub("{{theme:reference%-options}}", function() return table.concat(referenceOptions, "\n                    ") end)
fs.writeFile(pages .. "/design/reference/index.html", reference)
local confettiImages = {}
local imageExtensions = { png = true, jpg = true, jpeg = true, gif = true, webp = true, avif = true, svg = true }
for _, filename in fs.readDir("assets/confetti") do
    local extension = filename:match("%.([%w]+)$")
    if filename:match("^[%w%._%-]+$") and extension and imageExtensions[extension:lower()] then
        table.insert(confettiImages, '"' .. filename .. '"')
    end
end
table.sort(confettiImages)
local confettiScript = fs.readFile("src/website/shared/js/confetti-manager.js")
confettiScript = confettiScript:gsub("images: %[%]", "images: [" .. table.concat(confettiImages, ", ") .. "]", 1)
fs.writeFile(pages .. "/js/confetti-manager.js", confettiScript)
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
template = template:gsub("{{theme:options}}", function() return table.concat(themeOptions, "\n                ") end)
fs.writeFile(pages .. "/index.html", Render.text(".", template, Render.locales(".").default))

local projects = process.exec("lune", { "run", "src/website/scripts/build_projects.luau" }, { stdio = "inherit" })
assert(projects.ok, "project catalog build failed")

print("Built " .. pages .. " from main source")
print("VS Code Live Preview root: " .. pages)
