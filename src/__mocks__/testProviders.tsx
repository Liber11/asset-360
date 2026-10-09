import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ComponentType, ReactNode } from 'react';
import { assert, vi } from 'vitest';

import { HostApiContext, type HostApi } from '../host/HostApiContext';
import type { AssetDetails, AssetService, AssetSummary } from '../services/AssetService';
import type { RecentAsset, RecentAssetsStore } from '../services/RecentAssetsStore';
import { ServicesContext, type Services } from '../services/ServicesContext';
import { WorkspaceStateProvider } from '../state/WorkspaceStateProvider';

export function makeAssetService(overrides: Partial<AssetService> = {}): AssetService {
  return {
    search: vi.fn(() => assert.fail('search not expected')),
    retrieve: vi.fn(() => assert.fail('retrieve not expected')),
    ...overrides,
  };
}

export function makeRecentAssetsStore(initial: RecentAsset[] = []): RecentAssetsStore {
  let items = initial;
  return {
    list: vi.fn(() => items),
    add: vi.fn((asset: RecentAsset) => {
      items = [asset, ...items.filter((item) => item.ref.externalId !== asset.ref.externalId)];
      return items;
    }),
  };
}

export function makeServices(overrides: Partial<Services> = {}): Services {
  return {
    assetService: makeAssetService(),
    recentAssetsStore: makeRecentAssetsStore(),
    ...overrides,
  };
}

export function makeHostApi(): HostApi {
  return { syncInternalState: vi.fn<HostApi['syncInternalState']>(() => Promise.resolve(true)) };
}

type ProvidersOptions = { services?: Services; api?: HostApi | null; initialState?: string };

/** Wraps a tree with the same providers App uses, backed by fakes. */
export function makeProviders({
  services = makeServices(),
  api = makeHostApi(),
  initialState,
}: ProvidersOptions = {}): ComponentType<{ children: ReactNode }> {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Providers({ children }) {
    return (
      <QueryClientProvider client={queryClient}>
        <HostApiContext.Provider value={api}>
          <ServicesContext.Provider value={services}>
            <WorkspaceStateProvider initialState={initialState}>{children}</WorkspaceStateProvider>
          </ServicesContext.Provider>
        </HostApiContext.Provider>
      </QueryClientProvider>
    );
  };
}

export function assetSummary(externalId: string, extra: Partial<AssetSummary> = {}): AssetSummary {
  return { ref: { space: 'sp', externalId }, name: externalId.toUpperCase(), ...extra };
}

export function assetDetails(externalId: string, extra: Partial<AssetDetails> = {}): AssetDetails {
  return { ref: { space: 'sp', externalId }, name: externalId.toUpperCase(), tags: [], ancestors: [], ...extra };
}
