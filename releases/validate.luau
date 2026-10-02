local Release = require("./release")

local records = Release.records()
print("Validated " .. #records .. " design release record(s)")
