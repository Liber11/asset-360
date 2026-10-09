import { useQuery } from '@tanstack/react-query';

import type { RecentAsset } from '../services/RecentAssetsStore';
import { useServices } from '../services/ServicesContext';

import { RECENT_ASSETS_QUERY_KEY, useOpenAsset } from './useOpenAsset';

export type RecentAssetsViewModel = {
  recent: RecentAsset[];
  open: (asset: RecentAsset) => void;
};

export function useRecentAssetsViewModel(): RecentAssetsViewModel {
  const { recentAssetsStore } = useServices();
  const open = useOpenAsset();

  const query = useQuery({
    queryKey: RECENT_ASSETS_QUERY_KEY,
    queryFn: () => recentAssetsStore.list(),
    staleTime: Infinity,
  });

  return { recent: query.data ?? [], open };
}
