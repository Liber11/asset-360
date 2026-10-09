import { Button } from '@cognite/aura/components/button';
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateTitle,
} from '@cognite/aura/components/empty-state';
import { Component } from 'react';
import type { ReactNode } from 'react';

type AppErrorBoundaryProps = { onReload: () => void; children: ReactNode };
type AppErrorBoundaryState = { hasError: boolean };

/** Last-resort boundary (FR-017): an uncaught render error shows a reload action instead of a blank screen. */
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
        <EmptyState variant="full" type="error-generic">
          <EmptyStateTitle>Something went wrong</EmptyStateTitle>
          <EmptyStateDescription>The page hit an unexpected error. Reload to try again.</EmptyStateDescription>
          <EmptyStateActions>
            <Button onClick={this.props.onReload}>Reload</Button>
          </EmptyStateActions>
        </EmptyState>
      </main>
    );
  }
}
