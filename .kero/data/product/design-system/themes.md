# Theme packs

## Decision for review

A theme pack supplies a complete set of semantic color roles. It does not alter
component geometry, page layout, or interaction behavior. The initial packs are
`dark` and `light`; a future pack can be added without changing component CSS.

The document root selects one theme through `data-ks-theme`. The name must be
declared in a theme registry used by the selector and build validation; do not
repeat independent allowlists in HTML and JavaScript. A selected pack defines
every required role, including surfaces, text, links, borders, focus, status,
and shadow colors. Validation should reject missing roles.

The existing site's `data-theme` cookie and attribute remain an adapter during
migration. Whether to rename persistent user preference is an implementation
decision; old preferences must continue to resolve to an equivalent pack.

Color packs are independent files so a consuming project can choose the packs
it ships. Components refer only to semantic roles, never to `dark` or `light`
selectors. Locale-specific font choice is separate from color theme choice.

