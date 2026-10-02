local Release = require("./release")

local records = Release.records()
local latest = records[#records]
print("id=" .. latest.id)
print("version=" .. latest.version)
