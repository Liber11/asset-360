# File inventory: Asset 360 Investigation Workspace

Reviewed commit: `247c418c0e6ce4fa44dcc4e24e2d03183b5fd5c3`. Every .ts/.tsx except tests, node_modules, dist.

| File | Lines | Structure | Quality | Patterns | Tests | Notes |
| ---- | ----- | --------- | ------- | -------- | ----- | ----- |
| src/App.tsx | 116 | app shell | ✓ | ✓ | ✓ | |
| src/components/AppErrorBoundary.tsx | 38 | component | ✓ | ✓ | ✓ | |
| src/components/AssetHeader.tsx | 92 | component | ✓ | ✓ | ✓ | |
| src/components/AssetSearch.tsx | 58 | component | ✓ | ✓ | ✓ | |
| src/components/DocumentsPanel.tsx | 136 | component | ✓ | ✓ | ✓ | |
| src/components/filePreview/CdfFilePreview.tsx | 41 | component | ✓ | ✓ | ✓ | |
| src/components/filePreview/FilePreviewContext.ts | 20 | component | ✓ | ✓ | covered via consumer tests | |
| src/components/filePreview/LazyCdfFilePreview.tsx | 23 | component | ✓ | ✓ | ✓ | |
| src/components/filePreview/PreviewErrorBoundary.tsx | 30 | component | ✓ | ✓ | ✓ | |
| src/components/PanelStatus.tsx | 50 | component | ✓ | ✓ | ✓ | |
| src/components/RecentAssets.tsx | 33 | component | ✓ | ✓ | ✓ | |
| src/components/SeriesChartCard.tsx | 68 | component | ✓ | ✓ | covered via consumer tests | |
| src/components/TimeSeriesPanel.tsx | 136 | component | ✓ | ✓ | ✓ | |
| src/components/WorkOrdersPanel.tsx | 106 | component | ✓ | ✓ | ✓ | |
| src/components/Workspace.tsx | 63 | component | ✓ | ✓ | covered via consumer tests | |
| src/domain/cdm.ts | 53 | pure domain | ✓ | ✓ | ✓ | |
| src/domain/documents.ts | 53 | pure domain | ✓ | ✓ | ✓ | |
| src/domain/errors.ts | 20 | pure domain | ✓ | ✓ | ✓ | |
| src/domain/loadStatus.ts | 13 | pure domain | ✓ | ✓ | ✓ | |
| src/domain/retryPolicy.ts | 22 | pure domain | ✓ | ✓ | ✓ | |
| src/domain/seriesFormat.ts | 39 | pure domain | ✓ | ✓ | ✓ | |
| src/domain/timeRange.ts | 42 | pure domain | ✓ | ✓ | ✓ | |
| src/domain/workOrders.ts | 47 | pure domain | ✓ | ✓ | ✓ | |
| src/hooks/useDebouncedValue.ts | 14 | hook | ✓ | ✓ | ✓ | |
| src/host/HostApiContext.tsx | 13 | host context | ✓ | ✓ | covered via consumer tests | |
| src/main.tsx | 27 | app shell | ✓ | ✓ | n/a | |
| src/services/ActivityService.ts | 53 | service | ✓ | ✓ | ✓ | |
| src/services/AssetService.ts | 114 | service | ✓ | ✓ | ✓ | |
| src/services/FileService.ts | 86 | service | ✓ | ✓ | ✓ | |
| src/services/RecentAssetsStore.ts | 62 | service | ✓ | ✓ | ✓ | |
| src/services/relatedNodes.ts | 95 | service | ✓ | ✓ | ✓ | |
| src/services/ServicesContext.ts | 25 | service | ✓ | ✓ | covered via consumer tests | |
| src/services/ServicesProvider.tsx | 30 | service | ✓ | ✓ | covered via consumer tests | |
| src/services/TimeSeriesService.ts | 143 | service | ✓ | ✓ | ✓ | |
| src/state/useWorkspaceState.ts | 17 | state | ✓ | ✓ | ✓ | |
| src/state/workspaceState.ts | 82 | state | ✓ | ✓ | ✓ | |
| src/state/WorkspaceStateProvider.tsx | 31 | state | ✓ | ✓ | covered via consumer tests | |
| src/viewmodels/useAssetHeaderViewModel.ts | 42 | view model | ✓ | ✓ | ✓ | |
| src/viewmodels/useAssetSearchViewModel.ts | 59 | view model | ✓ | ✓ | ✓ | |
| src/viewmodels/useDocumentsViewModel.ts | 104 | view model | ✓ | ✓ | ✓ | |
| src/viewmodels/useOpenAsset.ts | 24 | view model | ✓ | ✓ | covered via consumer tests | |
| src/viewmodels/useRecentAssetsViewModel.ts | 25 | view model | ✓ | ✓ | ✓ | |
| src/viewmodels/useSelectedAssetQuery.ts | 19 | view model | ✓ | ✓ | covered via consumer tests | |
| src/viewmodels/useTimeSeriesViewModel.ts | 141 | view model | ✓ | ✓ | ✓ | |
| src/viewmodels/useWorkOrdersViewModel.ts | 58 | view model | ✓ | ✓ | ✓ | |
| src/viewmodels/useWorkspaceViewModel.ts | 17 | view model | ✓ | ✓ | ✓ | |
| src/__mocks__/layout.ts | 12 | test helper | ✓ | ✓ | n/a | |
| src/__mocks__/StubFilePreview.tsx | 7 | test helper | ✓ | ✓ | n/a | |
| src/__mocks__/testProviders.tsx | 110 | test helper | ✓ | ✓ | n/a | |
| vendor/cognite-file-viewer/CogniteFileViewer.tsx | 484 | vendored | ✓ | ✓ | n/a (vendored, outside src) | |
| vendor/cognite-file-viewer/DocumentAnnotationOverlay.tsx | 231 | vendored | ✓ | ✓ | n/a (vendored, outside src) | |
| vendor/cognite-file-viewer/fileResolution.ts | 134 | vendored | ✓ | ✓ | n/a (vendored, outside src) | |
| vendor/cognite-file-viewer/index.ts | 41 | vendored | ✓ | ✓ | n/a (vendored, outside src) | |
| vendor/cognite-file-viewer/mimeTypes.ts | 172 | vendored | ✓ | ✓ | n/a (vendored, outside src) | |
| vendor/cognite-file-viewer/types.ts | 190 | vendored | ✓ | ✓ | n/a (vendored, outside src) | |
| vendor/cognite-file-viewer/useDocumentAnnotations.ts | 270 | vendored | ✓ | ✓ | n/a (vendored, outside src) | |
| vendor/cognite-file-viewer/useFileResolver.ts | 124 | vendored | ✓ | ✓ | n/a (vendored, outside src) | |
| vendor/cognite-file-viewer/useViewport.ts | 281 | vendored | ✓ | ✓ | n/a (vendored, outside src) | |
| vite.config.ts | 36 | config | ✓ | ✓ | n/a | |
| vitest.config.ts | 21 | config | ✓ | ✓ | n/a | |
| vitest.setup.ts | 2 | config | ✓ | ✓ | n/a | |

Non-trivial production files read in full: everything under `src/services`, `src/viewmodels`, `src/domain`,
`src/state`, `src/components`, `src/hooks`, `src/host`, plus `src/App.tsx` and `src/main.tsx`.
Files under `vendor/` are third-party (copied verbatim from the `integrate-file-viewer` skill, see
`vendor/README.md`); they were read for their integration surface only.
