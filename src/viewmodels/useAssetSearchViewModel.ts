import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import { errorMessage } from '../domain/errors';
import { toLoadStatus, type LoadStatus } from '../domain/loadStatus';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import type { AssetSummary } from '../services/AssetService';
import { useServices } from '../services/ServicesContext';
import { useWorkspaceState } from '../state/useWorkspaceState';

import { useOpenAsset } from './useOpenAsset';

export const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

export type AssetSearchViewModel = {
  query: string;
  setQuery: (query: string) => void;
  /** `idle` until the user has typed at least MIN_QUERY_LENGTH characters. */
  status: LoadStatus | 'idle';
  results: AssetSummary[];
  errorMessage?: string;
  retry: () => void;
  selectAsset: (asset: AssetSummary) => void;
};

export function useAssetSearchViewModel(): AssetSearchViewModel {
  const { state, update } = useWorkspaceState();
  const { assetService } = useServices();
  const openAsset = useOpenAsset();

  const term = useDebouncedValue(state.query.trim(), DEBOUNCE_MS);
  const enabled = term.length >= MIN_QUERY_LENGTH;

  const search = useQuery({
    queryKey: ['asset-search', term],
    queryFn: () => assetService.search(term),
    enabled,
  });

  const setQuery = useCallback((query: string) => update({ query }), [update]);
  const selectAsset = useCallback(
    (asset: AssetSummary) => openAsset({ ref: asset.ref, name: asset.name }),
    [openAsset]
  );
  const { refetch } = search;
  const retry = useCallback(() => void refetch(), [refetch]);

  return {
    query: state.query,
    setQuery,
    status: enabled ? toLoadStatus(search) : 'idle',
    results: search.data ?? [],
    errorMessage: search.isError ? errorMessage(search.error) : undefined,
    retry,
    selectAsset,
  };
}
