import type { HostAppAPI, ConnectToHostAppResult } from '@cognite/app-sdk';
import { CogniteClient } from '@cognite/sdk';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  assetDetails,
  assetSummary,
  makeAssetService,
  makeHostApi,
  makeServices,
} from './__mocks__/testProviders';
import App from './App';
import type { HostApi } from './host/HostApiContext';
import type { Services } from './services/ServicesContext';

type AppDeps = NonNullable<ComponentProps<typeof App>['deps']>;

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    renderApp(<App deps={makeLoadingDeps()} connectToHostApp={() => new Promise<never>(() => undefined)} />);

    expect(screen.getByText('Loading project...')).toBeInTheDocument();
  });

  it('renders the workspace start screen once connected', async () => {
    renderApp(<App deps={makeDeps()} connectToHostApp={makeConnectedFn()} services={makeServices()} />);

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Asset 360' })).toBeInTheDocument());
    expect(screen.getByText('Search for an asset to start')).toBeInTheDocument();
  });

  it('shows the connection error when the host handshake fails', async () => {
    renderApp(<App deps={makeDeps()} connectToHostApp={() => Promise.reject(new Error('no host'))} />);

    await waitFor(() => expect(screen.getByText('Failed to connect to Fusion host')).toBeInTheDocument());
  });

  it('searches, opens an asset, and syncs the selection to the host URL', async () => {
    const api = makeHostApi();
    renderApp(<App deps={makeDeps()} connectToHostApp={makeConnectedFn(api)} services={makePumpServices()} />);

    await userEvent.type(await screen.findByRole('searchbox', { name: 'Search assets' }), 'pump');
    await userEvent.click(await screen.findByRole('button', { name: /PUMP-101/ }));

    expect(await screen.findByRole('heading', { name: 'Feed pump A' })).toBeInTheDocument();
    expect(api.syncInternalState).toHaveBeenLastCalledWith(
      expect.stringContaining('"selectedAsset":{"space":"sp","externalId":"pump-101"}')
    );
  });

  it('restores the selected asset from a shared link', async () => {
    const initialState = JSON.stringify({ selectedAsset: { space: 'sp', externalId: 'pump-101' } });
    renderApp(
      <App
        deps={makeDeps()}
        connectToHostApp={() => Promise.resolve({ api: makeHostApi(), initialState })}
        services={makePumpServices()}
      />
    );

    expect(await screen.findByRole('heading', { name: 'Feed pump A' })).toBeInTheDocument();
  });
});

function renderApp(ui: ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

function makePumpServices(): Services {
  return makeServices({
    assetService: makeAssetService({
      search: vi.fn(() => Promise.resolve([assetSummary('pump-101')])),
      retrieve: vi.fn(() => Promise.resolve(assetDetails('pump-101', { name: 'Feed pump A' }))),
    }),
  });
}

function makeConnectedFn(api: HostApi = makeHostApi()) {
  return vi.fn(() => Promise.resolve({ api }));
}

function makeDeps(): AppDeps {
  return {
    connectToHostApp: vi.fn<AppDeps['connectToHostApp']>(() =>
      Promise.resolve({
        api: {
          getProject: vi.fn<HostAppAPI['getProject']>(() => Promise.resolve('publicdatacdm')),
          getBaseUrl: vi.fn<HostAppAPI['getBaseUrl']>(() => Promise.resolve('https://cognite.test')),
          getAccessToken: vi.fn<HostAppAPI['getAccessToken']>(() => Promise.resolve('test-token')),
          getAppId: vi.fn<HostAppAPI['getAppId']>(() => Promise.resolve('test-app-id')),
        } as Partial<HostAppAPI> as HostAppAPI,
      })
    ),
    createClient: vi.fn<AppDeps['createClient']>((config) => new CogniteClient(config)),
  };
}

function makeLoadingDeps(): AppDeps {
  return {
    connectToHostApp: vi.fn<AppDeps['connectToHostApp']>(() => new Promise<ConnectToHostAppResult>(() => undefined)),
    createClient: vi.fn<AppDeps['createClient']>((config) => new CogniteClient(config)),
  };
}
