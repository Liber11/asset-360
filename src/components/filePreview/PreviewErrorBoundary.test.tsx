import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PreviewErrorBoundary } from './PreviewErrorBoundary';

describe('PreviewErrorBoundary', () => {
  beforeEach(() => {
    // React logs caught render errors to console.error; silence it to keep test output readable.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the preview when nothing fails', () => {
    render(
      <PreviewErrorBoundary>
        <p>PDF here</p>
      </PreviewErrorBoundary>
    );

    expect(screen.getByText('PDF here')).toBeInTheDocument();
  });

  it('keeps a viewer failure inside the dialog with a way forward', () => {
    render(
      <PreviewErrorBoundary>
        <FailingViewer />
      </PreviewErrorBoundary>
    );

    expect(screen.getByText('Could not load the document viewer')).toBeInTheDocument();
    expect(screen.getByText(/Use Download instead, or reload the page/)).toBeInTheDocument();
  });
});

function FailingViewer(): never {
  throw new Error('Failed to fetch dynamically imported module');
}
