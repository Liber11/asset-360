import { createContext, useContext } from 'react';

import type { ActivityService } from './ActivityService';
import type { AssetService } from './AssetService';
import type { FileService } from './FileService';
import type { RecentAssetsStore } from './RecentAssetsStore';
import type { TimeSeriesService } from './TimeSeriesService';

/** Everything view models need from the outside world; replaced with fakes in tests. */
export type Services = {
  assetService: AssetService;
  activityService: ActivityService;
  timeSeriesService: TimeSeriesService;
  fileService: FileService;
  recentAssetsStore: RecentAssetsStore;
};

export const ServicesContext = createContext<Services | null>(null);

export function useServices(): Services {
  const services = useContext(ServicesContext);
  if (!services) throw new Error('useServices must be used inside ServicesProvider');
  return services;
}
