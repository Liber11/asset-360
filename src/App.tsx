import { connectToHostApp as connectToHostAppImpl } from '@cognite/app-sdk';
import { CogniteSdkProvider } from '@cognite/app-sdk/react';
// Import per-component, not from the `@cognite/aura/components` barrel: the
// barrel pulls in Aura's whole dependency graph (including large libraries like
// mermaid and shiki), which slows the build and can exhaust memory in CI.
import { Alert, AlertDescription } from '@cognite/aura/components/alert';
import { Card, CardContent } from '@cognite/aura/components/card';
import { Loader } from '@cognite/aura/components/loader';
import { useEffect, useState } from 'react';
import type { ComponentProps, ReactNode } from 'react';

import { AppErrorBoundary } from './components/AppErrorBoundary';
import { FilePreviewContext, type FilePreviewRenderer } from './components/filePreview/FilePreviewContext';
import { LazyCdfFilePreview } from './components/filePreview/LazyCdfFilePreview';
import { Workspace } from './components/Workspace';
import { HostApiContext, type HostApi } from './host/HostApiContext';
import { ServicesContext, type Services } from './services/ServicesContext';
import { ServicesProvider } from './services/ServicesProvider';
import { WorkspaceStateProvider } from './state/WorkspaceStateProvider';

type AppConnectResult = { api: HostApi; initialState?: string };
type Connection = { status: 'pending' } | { status: 'failed' } | ({ status: 'ready' } & AppConnectResult);

const loadingFallback = (
  <main className="min-h-screen bg-muted/50 text-foreground">
    <section className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center p-4 sm:p-8">
      <div className="mx-auto w-full max-w-sm">
        <Card aria-label="Loading project" aria-live="polite">
          <CardContent>
            <div className="inline-flex items-center gap-3 text-muted-foreground">
              <Loader size={20} />
              <span>Loading project...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  </main>
);

const errorFallback = (
  <main className="min-h-screen bg-muted/50 text-foreground">
    <section className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center p-4 sm:p-8">
      <div className="mx-auto w-full max-w-sm">
        <Alert>
          <AlertDescription>Failed to connect to Fusion host</AlertDescription>
        </Alert>
      </div>
    </section>
  </main>
);

const renderCdfFilePreview: FilePreviewRenderer = (props) => <LazyCdfFilePreview {...props} />;

type AppProps = {
  deps?: ComponentProps<typeof CogniteSdkProvider>['deps'];
  connectToHostApp?: () => Promise<AppConnectResult>;
  onReload?: () => void;
  /** Overrides the CDF-backed services (tests). */
  services?: Services;
  /** Overrides the PDF.js-based file preview (tests). */
  filePreview?: FilePreviewRenderer;
};

function AppServices({ services, children }: { services?: Services; children: ReactNode }) {
  if (services) return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>;
  return <ServicesProvider storage={window.localStorage}>{children}</ServicesProvider>;
}

function App({
  deps,
  connectToHostApp = deps?.connectToHostApp ?? connectToHostAppImpl,
  onReload = () => window.location.reload(),
  services,
  filePreview = renderCdfFilePreview,
}: AppProps) {
  const [connection, setConnection] = useState<Connection>({ status: 'pending' });

  useEffect(() => {
    let cancelled = false;
    connectToHostApp().then(
      (result) => {
        if (!cancelled) setConnection({ status: 'ready', ...result });
      },
      () => {
        if (!cancelled) setConnection({ status: 'failed' });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [connectToHostApp]);

  return (
    <CogniteSdkProvider loadingFallback={loadingFallback} errorFallback={errorFallback} deps={deps}>
      {connection.status === 'pending' && loadingFallback}
      {connection.status === 'failed' && errorFallback}
      {connection.status === 'ready' && (
        <HostApiContext.Provider value={connection.api}>
          <AppServices services={services}>
            <FilePreviewContext.Provider value={filePreview}>
              <WorkspaceStateProvider initialState={connection.initialState}>
                <AppErrorBoundary onReload={onReload}>
                  <Workspace />
                </AppErrorBoundary>
              </WorkspaceStateProvider>
            </FilePreviewContext.Provider>
          </AppServices>
        </HostApiContext.Provider>
      )}
    </CogniteSdkProvider>
  );
}

export default App;
