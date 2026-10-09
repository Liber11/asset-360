import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { makeProviders, makeRecentAssetsStore, makeServices } from '../__mocks__/testProviders';

import { RecentAssets } from './RecentAssets';

describe('RecentAssets', () => {
  it('lists recently viewed assets and opens one on click', async () => {
    const store = makeRecentAssetsStore([{ ref: { space: 'sp', externalId: 'a' }, name: 'Pump A' }]);
    render(<RecentAssets />, { wrapper: makeProviders({ services: makeServices({ recentAssetsStore: store }) }) });

    await userEvent.click(await screen.findByRole('button', { name: 'Pump A' }));

    expect(store.add).toHaveBeenCalledWith({ ref: { space: 'sp', externalId: 'a' }, name: 'Pump A' });
  });

  it('renders nothing when there are no recent assets', () => {
    const { container } = render(<RecentAssets />, { wrapper: makeProviders() });

    expect(container).toBeEmptyDOMElement();
  });
});
