--!strict
local fs = require("@lune/fs")
local serde = require("@lune/serde")

local Release = {}

type Record = { id: string, version: string, notes: string }

local function parseId(id: string): (number, number, number)
    local year, month, sequence, kind = id:match("^(%d%d%d%d)%.(%d%d)%.([1-9]%d*)%-(%a+)$")
    assert(year and month and sequence and kind, "invalid release ID: " .. id)
    assert(kind == "regular" or kind == "hotfix" or kind == "security", "invalid release kind: " .. id)
    local monthNumber = tonumber(month) :: number
    assert(monthNumber >= 1 and monthNumber <= 12, "invalid release month: " .. id)
    local period = (tonumber(year) :: number) * 100 + monthNumber
    return period, tonumber(sequence) :: number, tonumber(year) :: number
end

function Release.records(): { Record }
    local list = serde.decode("toml", fs.readFile("releases/list.toml"))
    assert(type(list.ids) == "table" and #list.ids > 0, "release list is empty")
    local records: { Record } = {}
    local previousPeriod = 0
    local previousSequence = 0
    for _, id in list.ids do
        assert(type(id) == "string", "release ID must be text")
        local period, sequence, year = parseId(id)
        assert(period >= previousPeriod, "release list must be chronological")
        assert(sequence == (period == previousPeriod and previousSequence + 1 or 1),
            "release sequence must increase by one: " .. id)
        local path = "releases/records/" .. id .. ".md"
        assert(fs.isFile(path), "missing release record: " .. path)
        local notes = fs.readFile(path)
        assert(notes:match("^[^\r\n]+") == "# " .. id, "release record heading must match ID: " .. id)
        local month = period % 100
        table.insert(records, {
            id = id,
            version = string.format("%d.%d.%d", year, month, sequence),
            notes = notes,
        })
        previousPeriod = period
        previousSequence = sequence
    end
    return records
end

function Release.changelog(records: { Record }): string
    local sections = { "# Changelog" }
    for index = #records, 1, -1 do
        local notes = records[index].notes:gsub("%s+$", "")
        table.insert(sections, notes)
    end
    return table.concat(sections, "\n\n") .. "\n"
end

return Release
