# Findings: Asset 360 Investigation Workspace

Reviewed commit: `247c418c0e6ce4fa44dcc4e24e2d03183b5fd5c3`.
Checks pulled with `npx @cognite/cli@latest apps skills pull --skill flows-review-checks` and `--skill code-quality`
(2026-10-13) before scoring. `code-quality` searches were run; none of its fix steps were applied by the review.

## Config inspected
- Coverage config file(s): `vitest.config.ts` (no `test`/`coverage` block in `vite.config.ts`, no Jest config).
- `coverage.include`: `src/**/*.{ts,tsx}` (every app source file is measured, including files no test imports).
- Production paths excluded from coverage: **none**. `coverage.exclude` is `src/**/*.test.{ts,tsx}`, `src/main.tsx`,
  `src/**/*.d.ts` — all on the allowed list.
- Tests excluded from the test run: none from `src/`. `test.exclude` adds `.claude/**` and `.agents/**` (skill
  folders, not app tests) to Vitest's defaults.
- Note: `vendor/cognite-file-viewer/` (third-party copy from the `integrate-file-viewer` skill, see
  `vendor/README.md`) lives outside `src/` and is therefore outside the coverage scope, like `node_modules`.

## Searches
| Check | Hits (file:line or none) |
| ----- | ------------------------ |
| ErrorBoundary | `src/components/AppErrorBoundary.tsx:15` (wraps routed content, `src/App.tsx:103`); `src/components/filePreview/PreviewErrorBoundary.tsx` (wraps the PDF viewer, `src/components/DocumentsPanel.tsx:121`) |
| TODO/FIXME/HACK | none |
| useEffect | `src/App.tsx:79` (host handshake; `cancelled` flag cleanup); `src/hooks/useDebouncedValue.ts:7` (`clearTimeout` cleanup). No leaks. |
| useQuery/useMutation states | every panel maps React Query state through `toLoadStatus` (`src/domain/loadStatus.ts`) and renders `PanelStatus` loading/error/no-access + an explicit empty state |
| coverage/test exclude | none hiding production code or tests (see Config) |
| CDF Raw | none → 2.6 N/A |
| instances.list/query/search | `src/services/AssetService.ts:43` search (limit 20); `:98` retrieve (by id); `src/services/FileService.ts:59` search (limit 50); `src/services/relatedNodes.ts:73` search (sub-asset scope, limit ≤ 1000); `src/services/relatedNodes.ts:81` list (direct `assets` containsAny filter, limit 100, cursor, max 20 pages); `src/services/TimeSeriesService.ts:127` retrieve (unit nodes by id) |
| QueuedTaskRunner / 429 | none in `src/`. 429/5xx retries are done by `@cognite/sdk` (exponential backoff with full jitter, bounded). `src/domain/retryPolicy.ts` stops React Query from stacking extra retries on HTTP errors. No explicit concurrency cap (≤ 6 parallel calls when an asset opens). |
| any / as unknown as | none in production (only the word "any" in a comment, `src/domain/timeRange.ts:33`) |
| `as` casts in production | none (only `as const`) |
| vi.mock | `src/components/filePreview/CdfFilePreview.test.tsx:12`, `src/components/filePreview/LazyCdfFilePreview.test.tsx:7` — both commented (PDF.js cannot run in happy-dom). All other tests inject fakes via React context. |
| lint / tsc | `npm run lint`: 0 problems. `npx tsc --noEmit`: 0 errors. |
| new CogniteClient | tests only (`src/App.test.tsx`, `src/components/filePreview/CdfFilePreview.test.tsx`); production gets the client from `CogniteSdkProvider` via `useCogniteSdk()` in `src/services/ServicesProvider.tsx` |
| Services / DI / ViewModel | interfaces + private classes behind `create*Service` factories (`src/services/*Service.ts`); injected through `ServicesContext`; one `use*ViewModel` per view (`src/viewmodels/`); host API and file preview injected via context |
| hooks importing deps directly | none (`src/hooks/useDebouncedValue.ts` imports React only) |
| unused files | none (inventory script reported no unused file) |
| console.log/debug | none |
| routes | none (single-view app; view state lives in host-synced `WorkspaceState`) |
| components > 150 lines | none (largest: `src/components/TimeSeriesPanel.tsx` 135 lines, render-only) |

## Test run
- Vitest 4.1.11: 36 files, 221 tests passed, 0 failed, 0 skipped.
- Coverage (v8, full `src/` scope): Statements 96.88 %, Branches 92.18 %, Functions 94.30 %, **Lines 97.72 %**.

## Must / should / nice
Must fix: none.

Should fix: none.

Nice to fix:
- [ ] Dedicated unit tests for `src/viewmodels/useOpenAsset.ts` and `src/components/Workspace.tsx` (today covered through consumer tests: search/recent view models and `src/App.test.tsx`) — 1.4
- [ ] The "Matched by name" error state retries the linked-documents query instead of the name search — `src/components/DocumentsPanel.tsx:94` — 1.1
- [ ] Direct-link lists use `instances.list` with a filter; could move to `instances.query` — `src/services/relatedNodes.ts:81` — 2.1
- [ ] Work orders scan up to 1000 activities and sort client-side to rank by the date fallback — `src/services/ActivityService.ts` (bounded, documented) — 2.2/2.3
- [ ] No explicit concurrency cap around CDF calls (SDK backoff covers 429) — 2.5
- [ ] Plan the React 19 / react-pdf 11 / Aura 1.x upgrade together with the Flows template — `package.json` — 1.3
- [ ] Search result rows are custom buttons styled with Aura tokens (Aura has no search-results list component) — `src/components/AssetSearch.tsx` — 3.1
