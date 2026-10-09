import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PanelStatus } from './PanelStatus';

describe('PanelStatus', () => {
  it('shows a loading placeholder', () => {
    render(<PanelStatus status="loading" onRetry={vi.fn()} />);

    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
  });

  it('shows the error message with a retry action', async () => {
    const onRetry = vi.fn();
    render(<PanelStatus status="error" errorMessage="CDF down" onRetry={onRetry} />);

    expect(screen.getByText('CDF down')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('shows a no-access message', () => {
    render(<PanelStatus status="no-access" onRetry={vi.fn()} />);

    expect(screen.getByText('No access')).toBeInTheDocument();
  });

  it('renders nothing on success', () => {
    const { container } = render(<PanelStatus status="success" onRetry={vi.fn()} />);

    expect(container).toBeEmptyDOMElement();
  });
});
