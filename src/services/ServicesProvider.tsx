import { useCogniteSdk } from '@cognite/app-sdk/react';
import { useMemo } from 'react';
import type { ReactNode } from 'react';

import { createActivityService } from './ActivityService';
import { createAssetService } from './AssetService';
import { createRecentAssetsStore } from './RecentAssetsStore';
import { ServicesContext, type Services } from './ServicesContext';

type ServicesProviderProps = { storage: Pick<Storage, 'getItem' | 'setItem'>; children: ReactNode };

/** Builds the real CDF-backed services from the authenticated SDK client. */
export function ServicesProvider({ storage, children }: ServicesProviderProps) {
  const client = useCogniteSdk();
  const services = useMemo<Services>(
    () => ({
      assetService: createAssetService(client),
      activityService: createActivityService(client),
      recentAssetsStore: createRecentAssetsStore(storage),
    }),
    [client, storage]
  );

  return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>;
}
