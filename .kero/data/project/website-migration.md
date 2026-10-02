# Website design migration

## Current shape

`src/website/index/index.html` is the home template. The Lune build copies
`src/website/shared/css/` and JavaScript into `.heap/pages/`. Mod Mail and
GCloud pages each contain large inline style blocks that duplicate foundations
and controls. `themes.css` owns only the current light and dark color values;
`stylesheet.css` also owns tokens, reset, layout, and components. The home page
uses TOML localization with one browser route. The root README remains the
public GitHub profile.

## Proposed source and output

Put authored design-system files under `design/` in this repository. The Lune
build assembles them into `.heap/pages/design/` and uses that local output for
this website. Source files remain inspectable by concept; generated files stay
under `.heap/`. Preserve the current Pages, Worker, and legal-page publication
paths during migration.

When another repository adopts the system, publish a versioned artifact from
this source repository. Consumers pin an exact version and integrity value and
copy the artifact during their build. Avoid a floating URL that changes the
result of an unchanged commit. Package-manager distribution is optional until
a consumer needs it.

## Migration sequence

1. Inventory repeated controls and map them to tokens, components, or
   page-specific patterns. Record their current behavior and visual states.
2. Build the token/theme contract and a reference page showing every variant.
3. Move buttons, fields, and cards from the home page with visual parity.
4. Move dropdowns, modal, navigation, and project patterns.
5. Convert Mod Mail and GCloud inline styles to shared components while
   preserving their content and legal routes.
6. Publish the first versioned artifact and adopt it from one external project.

At each step, validate localization and the Lune site build; inspect dark and
light themes, keyboard focus, narrow screens, and all existing public routes.
Remove the old rule only after its replacement is used by every relevant page.

