# Repository knowledge standards

Place a fact at the narrowest concept where it is true. A parent document holds
only rules shared by every child. Use a directory and `README.md` only when the
concept has actual child concepts; otherwise use a named Markdown leaf.

Keep website behavior and design contracts under `product/`. Keep source paths,
build and deployment workflow, migration progress, and review drafts under
`project/`. Generated preview output under `.heap/` is evidence, not knowledge.

When a decision changes, update its owning document and explain what changed and
why. Do not leave two documents claiming to be the current contract.

