import { Alert, AlertActions, AlertButton, AlertDescription, AlertTitle } from '@cognite/aura/components/alert';
import { EmptyState, EmptyStateDescription, EmptyStateTitle } from '@cognite/aura/components/empty-state';
import { Skeleton } from '@cognite/aura/components/skeleton';

import type { LoadStatus } from '../domain/loadStatus';

type PanelStatusProps = {
  status: LoadStatus;
  errorMessage?: string;
  onRetry: () => void;
};

/** Shared loading / error / no-access rendering for every panel (FR-011). Renders nothing on success. */
export function PanelStatus({ status, errorMessage, onRetry }: PanelStatusProps) {
  if (status === 'loading') {
    return (
      <div aria-label="Loading" aria-live="polite" className="flex flex-col gap-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-5 w-3/5" />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <Alert variant="error">
        <AlertTitle>Could not load data</AlertTitle>
        <AlertDescription>{errorMessage}</AlertDescription>
        <AlertActions>
          <AlertButton onClick={onRetry}>Retry</AlertButton>
        </AlertActions>
      </Alert>
    );
  }

  if (status === 'no-access') {
    return (
      <EmptyState type="no-access">
        <EmptyStateTitle>No access</EmptyStateTitle>
        <EmptyStateDescription>
          Your CDF account does not have permission to read this data. Ask your CDF admin for access.
        </EmptyStateDescription>
      </EmptyState>
    );
  }

  return null;
}
