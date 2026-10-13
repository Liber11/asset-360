import { useCallback } from 'react';

import { errorMessage } from '../domain/errors';
import { toLoadStatus, type LoadStatus } from '../domain/loadStatus';
import type { AssetDetails } from '../services/AssetService';
import { useWorkspaceState } from '../state/useWorkspaceState';

import { useSelectedAssetQuery } from './useSelectedAssetQuery';

export type AssetHeaderViewModel = {
  status: LoadStatus | 'not-found';
  asset?: AssetDetails;
  errorMessage?: string;
  retry: () => void;
  close: () => void;
  /** Panels also show items linked to assets below this one (host-synced). */
  includeSubAssets: boolean;
  setIncludeSubAssets: (value: boolean) => void;
};

export function useAssetHeaderViewModel(): AssetHeaderViewModel {
  const { state, update } = useWorkspaceState();
  const query = useSelectedAssetQuery();

  const { refetch } = query;
  const retry = useCallback(() => void refetch(), [refetch]);
  const setIncludeSubAssets = useCallback((value: boolean) => update({ includeSubAssets: value }), [update]);
  const close = useCallback(() => update({ selectedAsset: null, selectedSeries: [], openWorkOrder: null, openDocument: null }), [update]);

  const status = toLoadStatus(query);

  return {
    status: status === 'success' && !query.data ? 'not-found' : status,
    asset: query.data ?? undefined,
    errorMessage: query.isError ? errorMessage(query.error) : undefined,
    retry,
    close,
    includeSubAssets: state.includeSubAssets,
    setIncludeSubAssets,
  };
}
