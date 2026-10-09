import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import type { RecentAsset } from '../services/RecentAssetsStore';
import { useServices } from '../services/ServicesContext';
import { useWorkspaceState } from '../state/useWorkspaceState';

export const RECENT_ASSETS_QUERY_KEY = ['recent-assets'];

/** Opens an asset in the 360 view and records it as recently viewed. */
export function useOpenAsset(): (asset: RecentAsset) => void {
  const { update } = useWorkspaceState();
  const { recentAssetsStore } = useServices();
  const queryClient = useQueryClient();

  return useCallback(
    (asset: RecentAsset) => {
      update({ selectedAsset: asset.ref, selectedSeries: [], query: '' });
      queryClient.setQueryData(RECENT_ASSETS_QUERY_KEY, recentAssetsStore.add(asset));
    },
    [update, recentAssetsStore, queryClient]
  );
}
