import type { HostAppAPI } from '@cognite/app-sdk';
import { CogniteSdkProvider } from '@cognite/app-sdk/react';
import { CogniteClient } from '@cognite/sdk';
import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { CdfFilePreview } from './CdfFilePreview';

// vi.mock is unavoidable here: the real viewer needs PDF.js (canvas + a web worker), which
// cannot run in happy-dom. The stub records the props CdfFilePreview passes to it.
vi.mock('../../../vendor/cognite-file-viewer', () => ({
  CogniteFileViewer: (props: {
    source: { type: string; space: string; externalId: string };
    renderLoading: () => unknown;
    renderError: (error: Error) => unknown;
    renderUnsupported: (mimeType: string | undefined) => unknown;
  }) => (
    <div data-testid="viewer">
      <span>{`${props.source.type}:${props.source.space}/${props.source.externalId}`}</span>
      <>{props.renderLoading()}</>
      <>{props.renderError(new Error('bad pdf'))}</>
      <>{props.renderUnsupported('application/zip')}</>
    </div>
  ),
}));

type SdkDeps = NonNullable<ComponentProps<typeof CogniteSdkProvider>['deps']>;

describe('CdfFilePreview', () => {
  it('opens the file by instance id and renders loading, error, and unsupported states', async () => {
    render(
      <CogniteSdkProvider deps={makeDeps()} loadingFallback={<span>connecting</span>}>
        <CdfFilePreview file={{ space: 'valhall-files', externalId: 'manual.pdf' }} name="manual.pdf" />
      </CogniteSdkProvider>
    );

    expect(await screen.findByText('instanceId:valhall-files/manual.pdf')).toBeInTheDocument();
    expect(screen.getByText('Loading manual.pdf…')).toBeInTheDocument();
    expect(screen.getByText('bad pdf')).toBeInTheDocument();
    expect(screen.getByText(/This file type \(application\/zip\) cannot be previewed/)).toBeInTheDocument();
  });
});

function makeDeps(): SdkDeps {
  return {
    connectToHostApp: vi.fn<SdkDeps['connectToHostApp']>(() =>
      Promise.resolve({
        api: {
          getProject: vi.fn<HostAppAPI['getProject']>(() => Promise.resolve('publicdatacdm')),
          getBaseUrl: vi.fn<HostAppAPI['getBaseUrl']>(() => Promise.resolve('https://cognite.test')),
          getAccessToken: vi.fn<HostAppAPI['getAccessToken']>(() => Promise.resolve('test-token')),
          getAppId: vi.fn<HostAppAPI['getAppId']>(() => Promise.resolve('test-app-id')),
        } as Partial<HostAppAPI> as HostAppAPI,
      })
    ),
    createClient: vi.fn<SdkDeps['createClient']>((config) => new CogniteClient(config)),
  };
}
