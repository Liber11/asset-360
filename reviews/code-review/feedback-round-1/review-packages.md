## Package audit: Asset 360 Investigation Workspace

Sources: `npm outdated --json` and `npm audit --json` at commit `247c418c0e6ce4fa44dcc4e24e2d03183b5fd5c3`.
Lockfile: `package-lock.json` (npm). Packages absent from `npm outdated` are up to date.

### Dependencies

| Package | Used version | Latest | Deprecated | CVEs | Health |
| ------- | ------------ | ------ | ---------- | ---- | ------ |
| @cognite/app-sdk | 0.9.0 | 0.11.0 | No | 0 | Pass (0.x minor; template-pinned) |
| @cognite/aura | 0.3.5 | 1.46571.0 | No | 0 | Warn (1 major; template-pinned) |
| @cognite/sdk | ^10.10.0 | up to date | No | 0 | Pass |
| @tabler/icons-react | ^3.35.0 | up to date | No | 0 | Pass |
| @tanstack/react-query | 5.104.1 | 5.104.2 | No | 0 | Pass |
| @tanstack/react-table | 8.21.3 | 9.3.1 | No | 0 | Warn (1 major; peer of Aura DataGrid, which declares ^8) |
| @tanstack/react-virtual | 3.14.13 | 3.14.17 | No | 0 | Pass |
| react | 18.3.1 | 19.3.0 | No | 0 | Warn (1 major; Flows template is on React 18) |
| react-dom | 18.3.1 | 19.3.0 | No | 0 | Warn (1 major; Flows template is on React 18) |
| react-pdf | ^10.5.0 | 11.0.0 | No | 0 | Warn (1 major; 11 requires React 19) |
| recharts | ^3.7.0 | up to date | No | 0 | Pass |

`clsx` and `tailwind-merge` (scaffold leftovers) were removed in this round because nothing used them.

### Dev dependencies (informational)

Majors available for `eslint`, `@eslint/js`, `vite`, `vitest` (+ `@vitest/*`), `@vitejs/plugin-react`, `typescript`,
`happy-dom`, `@testing-library/jest-dom`, `@types/react(-dom)`. They are build/test tooling only and do not ship;
`vitest` was moved to the patched 4.1.11 in this round.

### Security audit

| Severity | Count |
| -------- | ----- |
| Critical | 0 |
| High | 0 |
| Moderate | 0 |
| Low | 0 |

#### Vulnerabilities

| Package | Severity | Title | Patched in | Advisory |
| ------- | -------- | ----- | ---------- | -------- |
| (none found) | — | — | — | — |

Fixed earlier in this round (commit `af45395`): `vitest` path traversal via `@vitest/mocker` (moderate, dev) → 4.1.11;
`katex` prototype pollution (low, transitive via Aura → mermaid) → `overrides.katex: ^0.18.11`.

### Supply-chain flags

| Package | Risk | Details |
| ------- | ---- | ------- |
| esbuild | Install script | Known build tool (native binary download); allowed explicitly in `package.json` `allowScripts`. |

### Upgrade plan

React 19 + `react-pdf` 11 + Aura 1.x should move together once the Flows app template moves to React 19; doing it
piecemeal would break peer ranges (`react-pdf` 11 requires React 19, Aura DataGrid pins `@tanstack/react-table` ^8).
