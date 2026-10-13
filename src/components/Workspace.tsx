import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateTitle,
} from '@cognite/aura/components/empty-state';

import { useWorkspaceViewModel } from '../viewmodels/useWorkspaceViewModel';

import { AssetHeader } from './AssetHeader';
import { AssetSearch } from './AssetSearch';
import { DocumentsPanel } from './DocumentsPanel';
import { RecentAssets } from './RecentAssets';
import { TimeSeriesPanel } from './TimeSeriesPanel';
import { WorkOrdersPanel } from './WorkOrdersPanel';

/** Top-level layout: start screen (search + recent) or the 360 view of the selected asset. */
export function Workspace() {
  const { hasSelectedAsset, showStartHint } = useWorkspaceViewModel();

  return (
    <main className="min-h-screen bg-muted/50 text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6">
        <h1 className="text-2xl font-semibold">Asset 360</h1>

        {hasSelectedAsset ? (
          <>
            <AssetHeader />
            {/* Wide screens: charts full width, work orders and documents side by side.
                Narrower (13" laptop next to the Fusion sidebar): everything stacks. */}
            <div className="grid items-start gap-6 xl:grid-cols-2">
              <div className="min-w-0 xl:col-span-2">
                <TimeSeriesPanel />
              </div>
              <div className="min-w-0">
                <WorkOrdersPanel />
              </div>
              <div className="min-w-0">
                <DocumentsPanel />
              </div>
            </div>
          </>
        ) : (
          <>
            <AssetSearch />
            {showStartHint && (
              <>
                <RecentAssets />
                <EmptyState variant="full" type="no-results">
                  <EmptyStateTitle>Search for an asset to start</EmptyStateTitle>
                  <EmptyStateDescription>
                    Find a piece of equipment by tag, name, or description to see its time series, work orders, and
                    documents in one place.
                  </EmptyStateDescription>
                </EmptyState>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
