import type { HostAppAPI, ConnectToHostAppResult } from '@cognite/app-sdk';
import { CogniteClient } from '@cognite/sdk';
import { render, screen, waitFor } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import App from './App';

type AppDeps = NonNullable<ComponentProps<typeof App>['deps']>;

type AppApi = Pick<HostAppAPI, 'syncInternalState'>;

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    render(<App deps={makeLoadingDeps()} connectToHostApp={() => new Promise<never>(() => undefined)} />);

    expect(screen.getByText('Loading project...')).toBeInTheDocument();
  });

  it('renders the workspace start screen once connected', async () => {
    render(<App deps={makeDeps()} connectToHostApp={makeConnectedFn()} />);

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Asset 360' })).toBeInTheDocument());
    expect(screen.getByText('Search for an asset to start')).toBeInTheDocument();
  });

  it('shows the connection error when the host handshake fails', async () => {
    render(<App deps={makeDeps()} connectToHostApp={() => Promise.reject(new Error('no host'))} />);

    await waitFor(() => expect(screen.getByText('Failed to connect to Fusion host')).toBeInTheDocument());
  });
});

function makeApi(): AppApi {
  return {
    syncInternalState: vi.fn<HostAppAPI['syncInternalState']>(() => Promise.resolve(true)),
  };
}

function makeConnectedFn(api: AppApi = makeApi()) {
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
