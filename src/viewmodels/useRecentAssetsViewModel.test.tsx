import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { makeProviders, makeRecentAssetsStore, makeServices } from '../__mocks__/testProviders';
import { useWorkspaceState } from '../state/useWorkspaceState';

import { useRecentAssetsViewModel } from './useRecentAssetsViewModel';

const RECENT = [
  { ref: { space: 'sp', externalId: 'a' }, name: 'A' },
  { ref: { space: 'sp', externalId: 'b' }, name: 'B' },
];

describe(useRecentAssetsViewModel.name, () => {
  it('lists the stored recent assets', async () => {
    const services = makeServices({ recentAssetsStore: makeRecentAssetsStore(RECENT) });

    const { result } = renderHook(() => useRecentAssetsViewModel(), { wrapper: makeProviders({ services }) });

    await waitFor(() => expect(result.current.recent).toEqual(RECENT));
  });

  it('is empty when nothing was viewed yet', async () => {
    const { result } = renderHook(() => useRecentAssetsViewModel(), { wrapper: makeProviders() });

    await waitFor(() => expect(result.current.recent).toEqual([]));
  });

  it('opens a recent asset and moves it to the front', async () => {
    const services = makeServices({ recentAssetsStore: makeRecentAssetsStore(RECENT) });
    const { result } = renderHook(() => ({ vm: useRecentAssetsViewModel(), ws: useWorkspaceState() }), {
      wrapper: makeProviders({ services }),
    });
    await waitFor(() => expect(result.current.vm.recent).toHaveLength(2));

    act(() => result.current.vm.open(RECENT[1]));

    expect(result.current.ws.state.selectedAsset).toEqual(RECENT[1].ref);
    await waitFor(() => expect(result.current.vm.recent.map((item) => item.name)).toEqual(['B', 'A']));
  });
});
