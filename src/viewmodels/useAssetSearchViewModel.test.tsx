import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  assetSummary,
  makeAssetService,
  makeHostApi,
  makeProviders,
  makeRecentAssetsStore,
  makeServices,
} from '../__mocks__/testProviders';
import type { Services } from '../services/ServicesContext';
import { useWorkspaceState } from '../state/useWorkspaceState';

import { useAssetSearchViewModel } from './useAssetSearchViewModel';

describe(useAssetSearchViewModel.name, () => {
  let services: Services;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    services = makeServices({
      assetService: makeAssetService({ search: vi.fn(() => Promise.resolve([assetSummary('pump-101')])) }),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('is idle and does not search for fewer than 2 characters', async () => {
    const { result } = renderHook(() => useAssetSearchViewModel(), { wrapper: makeProviders({ services }) });

    act(() => result.current.setQuery('p'));
    await act(() => vi.advanceTimersByTimeAsync(500));

    expect(result.current.status).toBe('idle');
    expect(services.assetService.search).not.toHaveBeenCalled();
  });

  it('searches with the trimmed, debounced query and exposes results', async () => {
    const { result } = renderHook(() => useAssetSearchViewModel(), { wrapper: makeProviders({ services }) });

    act(() => result.current.setQuery('  pump '));
    await act(() => vi.advanceTimersByTimeAsync(500));

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(services.assetService.search).toHaveBeenCalledWith('pump');
    expect(result.current.results).toEqual([assetSummary('pump-101')]);
    expect(result.current.query).toBe('  pump ');
  });

  it('reports loading while the search is in flight', async () => {
    services.assetService.search = vi.fn(() => new Promise<never>(() => undefined));
    const { result } = renderHook(() => useAssetSearchViewModel(), {
      wrapper: makeProviders({ services, initialState: JSON.stringify({ query: 'pump' }) }),
    });

    await waitFor(() => expect(result.current.status).toBe('loading'));
  });

  it('reports errors with a message and can retry', async () => {
    services.assetService.search = vi.fn(() => Promise.reject(new Error('CDF down')));
    const { result } = renderHook(() => useAssetSearchViewModel(), {
      wrapper: makeProviders({ services, initialState: JSON.stringify({ query: 'pump' }) }),
    });

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.errorMessage).toBe('CDF down');

    act(() => result.current.retry());
    await waitFor(() => expect(services.assetService.search).toHaveBeenCalledTimes(2));
  });

  it('reports no-access on 403', async () => {
    services.assetService.search = vi.fn(() => Promise.reject({ status: 403 }));
    const { result } = renderHook(() => useAssetSearchViewModel(), {
      wrapper: makeProviders({ services, initialState: JSON.stringify({ query: 'pump' }) }),
    });

    await waitFor(() => expect(result.current.status).toBe('no-access'));
  });

  it('syncs the query to the host', () => {
    const api = makeHostApi();
    const { result } = renderHook(() => useAssetSearchViewModel(), { wrapper: makeProviders({ services, api }) });

    act(() => result.current.setQuery('valve'));

    expect(api.syncInternalState).toHaveBeenLastCalledWith(expect.stringContaining('"query":"valve"'));
  });

  it('opens the selected asset, clears the query, and records it as recent', () => {
    services.recentAssetsStore = makeRecentAssetsStore();
    const { result } = renderHook(() => ({ vm: useAssetSearchViewModel(), ws: useWorkspaceState() }), {
      wrapper: makeProviders({ services, initialState: JSON.stringify({ query: 'pump' }) }),
    });

    act(() => result.current.vm.selectAsset(assetSummary('pump-101', { description: 'ignored' })));

    expect(result.current.ws.state.selectedAsset).toEqual({ space: 'sp', externalId: 'pump-101' });
    expect(result.current.ws.state.query).toBe('');
    expect(services.recentAssetsStore.add).toHaveBeenCalledWith({
      ref: { space: 'sp', externalId: 'pump-101' },
      name: 'PUMP-101',
    });
  });
});
