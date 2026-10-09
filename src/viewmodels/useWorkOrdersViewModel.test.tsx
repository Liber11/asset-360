import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { makeActivityService, makeHostApi, makeProviders, makeServices } from '../__mocks__/testProviders';
import type { WorkOrder } from '../domain/workOrders';
import type { ActivityService } from '../services/ActivityService';

import { useWorkOrdersViewModel } from './useWorkOrdersViewModel';

const ASSET = { space: 'sp', externalId: 'pump-101' };
const ORDER: WorkOrder = { ref: { space: 'sp', externalId: 'wo-1' }, identifier: '4001', name: 'Replace bearing' };

describe(useWorkOrdersViewModel.name, () => {
  it('is loading while the work orders are fetched', () => {
    const { result } = renderVm(vi.fn(() => new Promise<never>(() => undefined)));

    expect(result.current.status).toBe('loading');
  });

  it('lists the work orders of the selected asset', async () => {
    const listForAsset = vi.fn(() => Promise.resolve({ items: [ORDER], hasMore: true }));
    const { result } = renderVm(listForAsset);

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(listForAsset).toHaveBeenCalledWith(ASSET, { includeSubAssets: true });
    expect(result.current.orders).toEqual([ORDER]);
    expect(result.current.hasMore).toBe(true);
  });

  it('limits the list to the asset itself when sub-assets are excluded', async () => {
    const listForAsset = vi.fn(() => Promise.resolve({ items: [], hasMore: false }));
    const { result } = renderVm(listForAsset, makeHostApi(), { includeSubAssets: false });

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(listForAsset).toHaveBeenCalledWith(ASSET, { includeSubAssets: false });
  });

  it('reports errors and no-access', async () => {
    const failing = renderVm(vi.fn(() => Promise.reject(new Error('boom'))));
    const denied = renderVm(vi.fn(() => Promise.reject({ status: 403 })));

    await waitFor(() => expect(failing.result.current.status).toBe('error'));
    expect(failing.result.current.errorMessage).toBe('boom');
    await waitFor(() => expect(denied.result.current.status).toBe('no-access'));
  });

  it('retries after an error', async () => {
    const listForAsset = vi
      .fn<ActivityService['listForAsset']>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce({ items: [ORDER], hasMore: false });
    const { result } = renderVm(listForAsset);
    await waitFor(() => expect(result.current.status).toBe('error'));

    act(() => result.current.retry());

    await waitFor(() => expect(result.current.orders).toEqual([ORDER]));
  });

  it('opens and closes the detail of an order and syncs it to the host', async () => {
    const api = makeHostApi();
    const { result } = renderVm(vi.fn(() => Promise.resolve({ items: [ORDER], hasMore: false })), api);
    await waitFor(() => expect(result.current.status).toBe('success'));

    act(() => result.current.openOrder(ORDER));
    expect(result.current.openOrderDetail).toEqual(ORDER);
    expect(api.syncInternalState).toHaveBeenLastCalledWith(expect.stringContaining('"openWorkOrder":{"space":"sp"'));

    act(() => result.current.closeOrder());
    expect(result.current.openOrderDetail).toBeUndefined();
  });

  it('restores an open order from the shared link once the list is loaded', async () => {
    const { result } = renderVm(vi.fn(() => Promise.resolve({ items: [ORDER], hasMore: false })), makeHostApi(), {
      openWorkOrder: ORDER.ref,
    });

    await waitFor(() => expect(result.current.openOrderDetail).toEqual(ORDER));
  });
});

function renderVm(
  listForAsset: ActivityService['listForAsset'],
  api = makeHostApi(),
  extraState: Record<string, unknown> = {}
) {
  const services = makeServices({ activityService: makeActivityService({ listForAsset }) });
  const initialState = JSON.stringify({ selectedAsset: ASSET, ...extraState });
  return renderHook(() => useWorkOrdersViewModel(), { wrapper: makeProviders({ services, api, initialState }) });
}
