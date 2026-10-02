# Kooraseru website knowledge

This tree owns durable knowledge for this repository. It follows the semantic
branch-and-leaf convention used by KERO: a concept with children is a directory
with a `README.md`; a leaf is a named Markdown file.

- [`product/`](product/) owns the website's behavior and visual design contract.
- [`project/`](project/) owns implementation, publication, and migration state.
- [`standards/`](standards/) owns repository-specific knowledge placement rules.

The mounted `.kero/mnt/global/` tree is a read-only snapshot of external language
guidance. HTML, CSS, JavaScript, and universal comment guidance are under
`.kero/mnt/global/language/`. They are owned by the global home, not this
repository's `data/` tree.
