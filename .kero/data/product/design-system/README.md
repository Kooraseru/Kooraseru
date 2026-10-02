# Kooraseru web design system

## Decision for review

This repository is the source owner for a reusable Kooraseru web design system.
The same named component and variant should render consistently on every page
that adopts it. Individual pages own their content and composition; shared
component appearance is changed at its design-system source.

The system is authored in CSS with HTML component contracts and small JavaScript
controllers where interaction needs them. MCSS supplies the conceptual split
between foundation, reusable modules, and project modules. CSS cascade layers
make that order explicit. A new language or compiler must solve a demonstrated
gap before becoming part of the contract.

References: [MCSS methodology](https://robhrt7.github.io/MCSS/en/) and
[CSS cascade layers](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40layer).

See [`tokens.md`](tokens.md), [`themes.md`](themes.md), and
[`components.md`](components.md) for the proposed API. These are review drafts,
not a claim that the current website already conforms.

## Why

The current home page and service pages duplicate visual rules while using
different selectors and properties for similar controls. A shared contract
reduces those differences and gives other Kooraseru projects a traceable source.

## Reconsider when

The CSS/HTML contract cannot represent a required interaction or theme without
repeated page-specific logic. Measure that case before adding a preprocessor or
component runtime.
