import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { assetDetails, makeAssetService, makeProviders, makeServices } from '../__mocks__/testProviders';
import type { AssetService } from '../services/AssetService';
import { useWorkspaceState } from '../state/useWorkspaceState';

import { AssetHeader } from './AssetHeader';

const SELECTED = JSON.stringify({ selectedAsset: { space: 'sp', externalId: 'pump-101' } });

describe('AssetHeader', () => {
  it('shows identifier, name, description, type, tags, and ancestors', async () => {
    renderHeader(
      vi.fn(() =>
        Promise.resolve(
          assetDetails('pump-101', {
            name: 'Feed pump A',
            description: 'Main feed pump',
            typeName: 'Centrifugal pump',
            tags: ['critical'],
            ancestors: [{ ref: { space: 'sp', externalId: 'plant' }, name: 'Plant' }],
          })
        )
      )
    );

    expect(await screen.findByRole('heading', { name: 'Feed pump A' })).toBeInTheDocument();
    expect(screen.getByText('pump-101')).toBeInTheDocument();
    expect(screen.getByText('Main feed pump')).toBeInTheDocument();
    expect(screen.getByText('Centrifugal pump')).toBeInTheDocument();
    expect(screen.getByText('critical')).toBeInTheDocument();
    expect(screen.getByText('Plant')).toBeInTheDocument();
  });

  it('shows a not-found state for a missing asset', async () => {
    renderHeader(vi.fn(() => Promise.resolve(null)));

    expect(await screen.findByText('Asset not found')).toBeInTheDocument();
  });

  it('shows the error state', async () => {
    renderHeader(vi.fn(() => Promise.reject(new Error('boom'))));

    expect(await screen.findByText('boom')).toBeInTheDocument();
  });

  it('toggles whether panels include sub-assets', async () => {
    renderHeader(vi.fn(() => Promise.resolve(assetDetails('pump-101'))));

    const toggle = await screen.findByRole('switch', { name: 'Include sub-assets' });
    expect(toggle).toBeChecked();

    await userEvent.click(toggle);

    expect(toggle).not.toBeChecked();
  });

  it('clears the selection when the user starts a new search', async () => {
    renderHeader(vi.fn(() => Promise.resolve(assetDetails('pump-101'))));

    await userEvent.click(await screen.findByRole('button', { name: 'New search' }));

    expect(screen.getByTestId('selected')).toHaveTextContent('selected:none');
  });
});

function SelectionProbe() {
  const { state } = useWorkspaceState();
  return <span data-testid="selected">selected:{state.selectedAsset?.externalId ?? 'none'}</span>;
}

function renderHeader(retrieve: AssetService['retrieve']) {
  const services = makeServices({ assetService: makeAssetService({ retrieve }) });
  return render(
    <>
      <AssetHeader />
      <SelectionProbe />
    </>,
    { wrapper: makeProviders({ services, initialState: SELECTED }) }
  );
}
