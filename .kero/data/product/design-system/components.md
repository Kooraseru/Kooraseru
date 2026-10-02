# Component contracts

## Decision for review

Reusable components have one public class, documented variants, and semantic
HTML. Their files own all states: default, hover, focus, disabled, selected,
invalid, and loading where applicable. A component file may depend on
foundation and semantic tokens, but cannot depend on a specific page selector.

The initial contract candidates are button, field, card, dropdown, dialog, and
navigation. A composed project card or carousel is a pattern built from these
components. A page may set documented variants and content; it must not rewrite
the component's internal colors, focus treatment, or spacing with a more
specific selector.

Use actual buttons for actions, anchors for navigation, and labels associated
with fields. JavaScript augments an interaction; it must not be required for the
basic content or accessible name to exist. Text belongs to the consuming
application's localization catalog, not the CSS package.

Each component document should include: markup, public classes and attributes,
allowed variants, token dependencies, interaction states, accessibility
behavior, and one example in each shipped theme. A screenshot alone is not a
component contract.

