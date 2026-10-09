import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { assetSummary, makeAssetService, makeProviders, makeServices } from '../__mocks__/testProviders';

import { AssetSearch } from './AssetSearch';

describe('AssetSearch', () => {
  it('shows ranked results with description and parent context', async () => {
    const services = makeServices({
      assetService: makeAssetService({
        search: vi.fn(() =>
          Promise.resolve([assetSummary('pump-101', { description: 'Feed pump', parentName: 'Area 51' })])
        ),
      }),
    });
    render(<AssetSearch />, { wrapper: makeProviders({ services }) });

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search assets' }), 'pump');

    expect(await screen.findByText('PUMP-101')).toBeInTheDocument();
    expect(screen.getByText('Feed pump')).toBeInTheDocument();
    expect(screen.getByText('in Area 51')).toBeInTheDocument();
  });

  it('shows an empty state when nothing matches', async () => {
    const services = makeServices({ assetService: makeAssetService({ search: vi.fn(() => Promise.resolve([])) }) });
    render(<AssetSearch />, { wrapper: makeProviders({ services, initialState: JSON.stringify({ query: 'zzz' }) }) });

    expect(await screen.findByText('No assets match "zzz"')).toBeInTheDocument();
  });

  it('shows the error state with retry', async () => {
    const services = makeServices({
      assetService: makeAssetService({ search: vi.fn(() => Promise.reject(new Error('CDF down'))) }),
    });
    render(<AssetSearch />, { wrapper: makeProviders({ services, initialState: JSON.stringify({ query: 'pump' }) }) });

    expect(await screen.findByText('CDF down')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('hides the results after an asset is selected', async () => {
    const services = makeServices({
      assetService: makeAssetService({ search: vi.fn(() => Promise.resolve([assetSummary('pump-101')])) }),
    });
    render(<AssetSearch />, { wrapper: makeProviders({ services, initialState: JSON.stringify({ query: 'pump' }) }) });

    await userEvent.click(await screen.findByRole('button', { name: /PUMP-101/ }));

    await waitFor(() => expect(screen.queryByText('PUMP-101')).not.toBeInTheDocument());
    expect(screen.getByRole('searchbox', { name: 'Search assets' })).toHaveValue('');
  });
});
