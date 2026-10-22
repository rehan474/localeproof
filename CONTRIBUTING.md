# Contributing

Use Node 22.12+ and `npm ci`. Keep changes focused on a real failure or user need.

- Keep route pages focused on composition. Extract reusable or independently understandable UI into named components.
- Keep network and database code out of UI components. Avoid introducing general-purpose abstractions for one caller.
- Use semantic elements, visible labels, keyboard focus, sufficient contrast, and reduced-motion support.
- Validate external inputs at the API boundary. Use parameterized SQL. Never add `v-html` for scanned content.
- Add a regression check for non-trivial rules, security boundaries, or data-loss risks.
- Run formatting, type checks, tests, and the production build before requesting review.
- Do not commit tokens, `.env`, scan evidence, node_modules, or build output.

For a pull request, explain the problem, the behavior changed, the checks run, and any remaining limits. See SECURITY.md before changing the scanner, authentication, or deployment model.
