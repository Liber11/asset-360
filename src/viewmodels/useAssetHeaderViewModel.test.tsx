import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { assetDetails, makeAssetService, makeProviders, makeServices } from '../__mocks__/testProviders';
import { useWorkspaceState } from '../state/useWorkspaceState';

import { useAssetHeaderViewModel } from './useAssetHeaderViewModel';

const SELECTED = JSON.stringify({ selectedAsset: { space: 'sp', externalId: 'pump-101' } });

describe(useAssetHeaderViewModel.name, () => {
  it('does not load anything when no asset is selected', () => {
    const services = makeServices();

    const { result } = renderHook(() => useAssetHeaderViewModel(), { wrapper: makeProviders({ services }) });

    expect(result.current.status).toBe('loading');
    expect(services.assetService.retrieve).not.toHaveBeenCalled();
  });

  it('loads the selected asset', async () => {
    const services = makeServices({
      assetService: makeAssetService({ retrieve: vi.fn(() => Promise.resolve(assetDetails('pump-101'))) }),
    });

    const { result } = renderHook(() => useAssetHeaderViewModel(), {
      wrapper: makeProviders({ services, initialState: SELECTED }),
    });

    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(services.assetService.retrieve).toHaveBeenCalledWith({ space: 'sp', externalId: 'pump-101' });
    expect(result.current.asset).toEqual(assetDetails('pump-101'));
  });

  it('reports not-found when the asset no longer exists', async () => {
    const services = makeServices({
      assetService: makeAssetService({ retrieve: vi.fn(() => Promise.resolve(null)) }),
    });

    const { result } = renderHook(() => useAssetHeaderViewModel(), {
      wrapper: makeProviders({ services, initialState: SELECTED }),
    });

    await waitFor(() => expect(result.current.status).toBe('not-found'));
  });

  it('reports errors with a message', async () => {
    const services = makeServices({
      assetService: makeAssetService({ retrieve: vi.fn(() => Promise.reject(new Error('boom'))) }),
    });

    const { result } = renderHook(() => useAssetHeaderViewModel(), {
      wrapper: makeProviders({ services, initialState: SELECTED }),
    });

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.errorMessage).toBe('boom');
  });

  it('retries after an error', async () => {
    const retrieve = vi
      .fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(assetDetails('pump-101'));
    const services = makeServices({ assetService: makeAssetService({ retrieve }) });
    const { result } = renderHook(() => useAssetHeaderViewModel(), {
      wrapper: makeProviders({ services, initialState: SELECTED }),
    });
    await waitFor(() => expect(result.current.status).toBe('error'));

    act(() => result.current.retry());

    await waitFor(() => expect(result.current.status).toBe('success'));
  });

  it('closes the asset and returns to the start screen', async () => {
    const services = makeServices({
      assetService: makeAssetService({ retrieve: vi.fn(() => Promise.resolve(assetDetails('pump-101'))) }),
    });
    const { result } = renderHook(() => ({ vm: useAssetHeaderViewModel(), ws: useWorkspaceState() }), {
      wrapper: makeProviders({ services, initialState: SELECTED }),
    });

    act(() => result.current.vm.close());

    expect(result.current.ws.state.selectedAsset).toBeNull();
  });
});
