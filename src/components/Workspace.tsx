import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateTitle,
} from '@cognite/aura/components/empty-state';

/** Top-level layout of the Asset 360 workspace. Panels are added in later stages. */
export function Workspace() {
  return (
    <main className="min-h-screen bg-muted/50 text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6">
        <h1 className="text-2xl font-semibold">Asset 360</h1>
        <EmptyState variant="full" type="no-results">
          <EmptyStateTitle>Search for an asset to start</EmptyStateTitle>
          <EmptyStateDescription>
            Find a piece of equipment by tag, name, or description to see its time series, work orders, and documents
            in one place.
          </EmptyStateDescription>
        </EmptyState>
      </div>
    </main>
  );
}
