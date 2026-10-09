import { Card, CardContent } from '@cognite/aura/components/card';
import { EmptyState, EmptyStateDescription, EmptyStateTitle } from '@cognite/aura/components/empty-state';
import { Search } from '@cognite/aura/components/search';

import { refKey } from '../domain/cdm';
import { useAssetSearchViewModel } from '../viewmodels/useAssetSearchViewModel';

import { PanelStatus } from './PanelStatus';

export function AssetSearch() {
  const { query, setQuery, status, results, errorMessage, retry, selectAsset } = useAssetSearchViewModel();

  return (
    <div className="flex flex-col gap-3">
      <Search
        aria-label="Search assets"
        placeholder="Search by tag, name, or description (e.g. PUMP-101)"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onClear={() => setQuery('')}
      />

      {status !== 'idle' && (
        <Card>
          <CardContent>
            <PanelStatus status={status} errorMessage={errorMessage} onRetry={retry} />

            {status === 'success' && results.length === 0 && (
              <EmptyState type="no-results">
                <EmptyStateTitle>No assets match "{query.trim()}"</EmptyStateTitle>
                <EmptyStateDescription>Check the tag spelling or try part of the name or description.</EmptyStateDescription>
              </EmptyState>
            )}

            {status === 'success' && results.length > 0 && (
              <ul className="flex flex-col divide-y divide-border">
                {results.map((asset) => (
                  <li key={refKey(asset.ref)}>
                    <button
                      type="button"
                      className="flex w-full flex-col items-start gap-0.5 rounded-md px-2 py-2 text-left hover:bg-highlight-background focus-visible:bg-highlight-background focus-visible:outline-none"
                      onClick={() => selectAsset(asset)}
                    >
                      <span className="font-medium">{asset.name}</span>
                      {asset.description && <span className="text-sm text-muted-foreground">{asset.description}</span>}
                      {asset.parentName && <span className="text-xs text-muted-foreground">in {asset.parentName}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
