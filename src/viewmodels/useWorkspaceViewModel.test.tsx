import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { makeProviders } from '../__mocks__/testProviders';

import { useWorkspaceViewModel } from './useWorkspaceViewModel';

describe(useWorkspaceViewModel.name, () => {
  it('shows the start hint when nothing is selected or typed', () => {
    const { result } = renderHook(() => useWorkspaceViewModel(), { wrapper: makeProviders() });

    expect(result.current).toEqual({ hasSelectedAsset: false, showStartHint: true });
  });

  it('hides the start hint while the user is searching', () => {
    const { result } = renderHook(() => useWorkspaceViewModel(), {
      wrapper: makeProviders({ initialState: JSON.stringify({ query: 'pu' }) }),
    });

    expect(result.current.showStartHint).toBe(false);
  });

  it('reports a selected asset', () => {
    const { result } = renderHook(() => useWorkspaceViewModel(), {
      wrapper: makeProviders({ initialState: JSON.stringify({ selectedAsset: { space: 's', externalId: 'a' } }) }),
    });

    expect(result.current.hasSelectedAsset).toBe(true);
  });
});
