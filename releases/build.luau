local fs = require("@lune/fs")
local Release = require("./release")

local changelog = Release.changelog(Release.records())
fs.writeFile("CHANGELOG.md", changelog)
fs.writeFile("design/CHANGELOG.md", changelog)
print("Generated CHANGELOG.md and design/CHANGELOG.md")
