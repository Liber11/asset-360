import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppErrorBoundary } from './AppErrorBoundary';

describe('AppErrorBoundary', () => {
  beforeEach(() => {
    // React logs caught render errors to console.error; silence it to keep test output readable.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when nothing throws', () => {
    render(
      <AppErrorBoundary onReload={vi.fn()}>
        <p>All good</p>
      </AppErrorBoundary>
    );

    expect(screen.getByText('All good')).toBeInTheDocument();
  });

  it('shows a recovery screen when a child throws', () => {
    render(
      <AppErrorBoundary onReload={vi.fn()}>
        <Thrower />
      </AppErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
  });

  it('calls onReload when the user clicks Reload', async () => {
    const onReload = vi.fn();
    render(
      <AppErrorBoundary onReload={onReload}>
        <Thrower />
      </AppErrorBoundary>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Reload' }));

    expect(onReload).toHaveBeenCalledOnce();
  });
});

function Thrower(): never {
  throw new Error('render failed');
}
