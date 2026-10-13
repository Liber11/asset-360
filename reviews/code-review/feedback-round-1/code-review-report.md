# Asset 360 Investigation Workspace — Flows code review

This document is the platform review for Asset 360 Investigation Workspace, conducted as part of the Cognite Flows app certification process.

## Path to approval

This review found **0 must-fix item(s)** that block approval. The app can proceed to `flows-design-review`.

### Reviewed commit
`247c418c0e6ce4fa44dcc4e24e2d03183b5fd5c3`

## Checks performed

- Pulled current `flows-review-checks` and `code-quality` from `cognitedata/builder-skills` via `@cognite/cli apps skills pull` before scoring (2026-10-13).
- Ran every hunt in `flows-review-checks` Step 1 (correctness, Raw, DMS/limits, quality and testability incl. `code-quality` searches, component sizes, unused files). Results: `review-findings.md`.
- File inventory of every `.ts`/`.tsx` and configs: `review-files.md`.
- Packages: `npm outdated --json`, `npm audit --json`: `review-packages.md`.
- Coverage config read before quoting numbers; `npx vitest run --coverage`.
- `npm run lint` (0 problems), `npx tsc --noEmit` (0 errors), `npm run build` (passes).

## Coverage scope

- Measured: `coverage.include = src/**/*.{ts,tsx}` — all app source files, including files no test imports.
- Excluded: tests, `src/main.tsx`, `*.d.ts` only (all allowed). No production file and no test is excluded.
- Third-party code copied from the `integrate-file-viewer` skill lives in `vendor/` (outside `src/`, documented in `vendor/README.md`).
- Result: 36 test files, 221 tests, all passing. Lines **97.72 %**, statements 96.88 %, branches 92.18 %, functions 94.30 %.

## Scores

| Area | Criterion | Score | Notes |
| ---- | --------- | ----- | ----- |
| User & customer | 1.1 Known bugs | 4/5 | App-level `AppErrorBoundary` plus a preview-level boundary; every panel has loading, error (retry), no-access and empty states; effects clean up (`src/App.tsx:79`, `src/hooks/useDebouncedValue.ts:7`). Minor: the name-match error retry re-runs the linked-documents query (`src/components/DocumentsPanel.tsx:94`). |
| User & customer | 1.3 Packages | 4/5 | 0 CVEs after patching vitest and overriding katex. Production deps at most 1 major behind (React 18, Aura 0.3, react-table 8, react-pdf 10), all pinned by the Flows template / Aura peer ranges; joint upgrade plan in `review-packages.md`. |
| User & customer | 1.4 Tests & coverage | 5/5 | Honest full-`src/` scope (no production excludes), 97.72 % lines; tests for every service, view model, domain module and panel. |
| User & customer | 1.5 Dead code | 5/5 | Lint and `tsc` clean, no `any`, no unused files, no console logging; unused scaffold helper and its deps removed. |
| User & customer | 1.6 Patterns & testability | 5/5 | Interface-based services behind factories (`src/services/*Service.ts`), injected via `ServicesContext`; host API, file preview and storage injected; one ViewModel per view; only 2 `vi.mock`, both justified in comments. |
| Cognite services | 2.1 DMS query patterns | 4/5 | `instances.search` for text and sub-asset scope, `retrieve` by id; direct-link lists use `instances.list` with a server-side filter (`src/services/relatedNodes.ts:81`), which could move to `query`. |
| Cognite services | 2.2 Server-side filter | 4/5 | Filters (`containsAny`, nested `assets → path`) and limits are in requests. Client-side work is bounded: sorting ≤ 1000 activities by the date fallback (`src/services/ActivityService.ts`) and exact-substring check on ≤ 50 name-search hits. |
| Cognite services | 2.3 Limits & pages | 4/5 | Every call has a limit (20/50/100/1000), cursors are followed with a 20-page cap, panels cap at 100 and say so. Work orders read up to 1000 to rank correctly. No prefetch. |
| Cognite services | 2.4 Call rate | 5/5 | Search debounced 300 ms, min 2 characters; React Query caching (5 min stale) with shared keys (asset details fetched once for header and documents); charts refresh only on demand. |
| Cognite services | 2.5 429 backoff | 4/5 | `@cognite/sdk` retries 429/5xx with exponential backoff and full jitter, bounded; `src/domain/retryPolicy.ts` prevents React Query from stacking retries. No explicit concurrency cap (few parallel calls per asset). |
| Cognite services | 2.6 CDF Raw | N/A | No Raw usage. |
| Brand | 3.1 Aura | 4/5 | Aura Card, DataGrid, Chart, Dialog, Search, Switch, SegmentedControl, Checkbox, EmptyState, Alert, Skeleton, Breadcrumb, Badge throughout, imported per subpath; chart colors from `chart-*` tokens. Search result rows are custom buttons using Aura tokens. |

## Must fix

None.

## Should fix

None.

## Nice to fix

1. Add dedicated unit tests for `src/viewmodels/useOpenAsset.ts` and `src/components/Workspace.tsx` (currently covered through consumer tests).
2. Make the "Matched by name" error retry re-run the name search — `src/components/DocumentsPanel.tsx:94`.
3. Consider `instances.query` instead of `instances.list` for direct-link lists — `src/services/relatedNodes.ts:81`.
4. Work orders: if assets with thousands of activities appear, rank server-side (e.g. sort by `endTime`) instead of scanning up to 1000 — `src/services/ActivityService.ts`.
5. Add an explicit concurrency cap (e.g. `QueuedTaskRunner`) around CDF calls.
6. Upgrade React 19 / react-pdf 11 / Aura 1.x together once the Flows template moves — `package.json`.
7. Search result rows are custom buttons; switch to an Aura list component if one becomes available — `src/components/AssetSearch.tsx`.

## Summary

- Must Fix open: 0
- Should Fix open: 0
- Nice Fix open: 7
