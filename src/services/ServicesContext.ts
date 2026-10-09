import { createContext, useContext } from 'react';

import type { AssetService } from './AssetService';
import type { RecentAssetsStore } from './RecentAssetsStore';

/** Everything view models need from the outside world; replaced with fakes in tests. */
export type Services = {
  assetService: AssetService;
  recentAssetsStore: RecentAssetsStore;
};

export const ServicesContext = createContext<Services | null>(null);

export function useServices(): Services {
  const services = useContext(ServicesContext);
  if (!services) throw new Error('useServices must be used inside ServicesProvider');
  return services;
}
