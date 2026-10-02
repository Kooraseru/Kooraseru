# Design tokens and elevation

## Decision for review

Tokens have three levels, each with one owner:

1. **Foundation values** describe spacing, typography, radii, motion, and
   elevation scales. They are not page names.
2. **Semantic roles** describe use: `surface-card`, `text-muted`,
   `border-control`, `focus-ring`. Components consume these roles.
3. **Component slots** describe a deliberate local choice, such as a card's
   elevation or a button's density. A page sets documented slots or variants.

Use a `--ks-` prefix for public tokens. Internal implementation variables may
use `--_ks-`. A component must not depend on a theme's raw color names or on a
page's DOM ancestry. Tokens must describe meaning or a stable scale, not a
single screenshot.

Elevation is a named scale: `none`, `subtle`, and `raised` initially. A component
declares its default; the caller may select a documented variant. `none` means
`box-shadow: none`, not an omitted token that falls through to another shadow.
Do not use shadows alone to convey focus, selection, or status.

```html
<article class="ks-card" data-elevation="none">...</article>
```

```css
.ks-card { box-shadow: var(--ks-card-shadow, var(--ks-shadow-raised)); }
.ks-card[data-elevation="none"] { --ks-card-shadow: none; }
.ks-card[data-elevation="subtle"] { --ks-card-shadow: var(--ks-shadow-subtle); }
```

Only promote a value to the public token contract when more than one component
or theme needs it, or when consumers must select it. Keep one-off geometry local
to its component.

