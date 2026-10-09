import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { stubLayoutSize } from '../__mocks__/layout';
import { makeActivityService, makeProviders, makeServices } from '../__mocks__/testProviders';
import type { WorkOrder } from '../domain/workOrders';
import type { ActivityService } from '../services/ActivityService';

import { WorkOrdersPanel } from './WorkOrdersPanel';

const ORDER: WorkOrder = {
  ref: { space: 'sp', externalId: 'wo-1' },
  identifier: '4001',
  name: 'Replace bearing',
  description: 'Bearing noise on DE side',
  endTime: '2024-03-18T10:00:00Z',
  source: 'SAP',
};

describe('WorkOrdersPanel', () => {
  beforeEach(() => {
    stubLayoutSize();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lists work orders with identifier, name, and date', async () => {
    renderPanel(vi.fn(() => Promise.resolve({ items: [ORDER], hasMore: false })));

    const grid = await screen.findByRole('table', { name: 'Work orders' });
    expect(within(grid).getByText('4001')).toBeInTheDocument();
    expect(within(grid).getByText('Replace bearing')).toBeInTheDocument();
    expect(within(grid).getByText('2024-03-18')).toBeInTheDocument();
  });

  it('opens the detail dialog when a row is clicked', async () => {
    renderPanel(vi.fn(() => Promise.resolve({ items: [ORDER], hasMore: false })));

    await userEvent.click(await screen.findByText('Replace bearing'));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Work order 4001')).toBeInTheDocument();
    expect(within(dialog).getByText('Bearing noise on DE side')).toBeInTheDocument();
    expect(within(dialog).getByText('2024-03-18 10:00 UTC')).toBeInTheDocument();
    expect(within(dialog).getByText('SAP')).toBeInTheDocument();
  });

  it('shows the empty state when the asset has no work orders', async () => {
    renderPanel(vi.fn(() => Promise.resolve({ items: [], hasMore: false })));

    expect(await screen.findByText('No work orders linked to this asset')).toBeInTheDocument();
  });

  it('tells the user when the list is capped', async () => {
    renderPanel(vi.fn(() => Promise.resolve({ items: [ORDER], hasMore: true })));

    expect(await screen.findByText('Showing the 100 most recent work orders.')).toBeInTheDocument();
  });

  it('shows the error state', async () => {
    renderPanel(vi.fn(() => Promise.reject(new Error('boom'))));

    expect(await screen.findByText('boom')).toBeInTheDocument();
  });
});

function renderPanel(listForAsset: ActivityService['listForAsset']) {
  const services = makeServices({ activityService: makeActivityService({ listForAsset }) });
  const initialState = JSON.stringify({ selectedAsset: { space: 'sp', externalId: 'pump-101' } });
  return render(<WorkOrdersPanel />, { wrapper: makeProviders({ services, initialState }) });
}
