import { Alert, AlertDescription, AlertTitle } from '@cognite/aura/components/alert';
import { Component } from 'react';
import type { ReactNode } from 'react';

type PreviewErrorBoundaryProps = { children: ReactNode };
type PreviewErrorBoundaryState = { hasError: boolean };

/**
 * Keeps a viewer failure (e.g. the lazily loaded PDF.js chunk cannot be fetched) inside the
 * document dialog, so the rest of the app keeps working and Download stays available.
 */
export class PreviewErrorBoundary extends Component<PreviewErrorBoundaryProps, PreviewErrorBoundaryState> {
  state: PreviewErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): PreviewErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <Alert variant="error">
        <AlertTitle>Could not load the document viewer</AlertTitle>
        <AlertDescription>Use Download instead, or reload the page to try the preview again.</AlertDescription>
      </Alert>
    );
  }
}
