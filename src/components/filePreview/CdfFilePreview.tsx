import { useCogniteSdk } from '@cognite/app-sdk/react';
import { Alert, AlertDescription, AlertTitle } from '@cognite/aura/components/alert';
import { Loader } from '@cognite/aura/components/loader';

import { CogniteFileViewer } from '../../../vendor/cognite-file-viewer';

import type { FilePreviewProps } from './FilePreviewContext';

/** Real preview: the vendored CogniteFileViewer, reading the file from CDF by instance id. */
export function CdfFilePreview({ file, name }: FilePreviewProps) {
  const client = useCogniteSdk();

  return (
    <CogniteFileViewer
      source={{ type: 'instanceId', space: file.space, externalId: file.externalId }}
      client={client}
      fitMode="width"
      className="h-[70vh] w-full"
      renderLoading={() => (
        <div className="flex h-full items-center justify-center gap-2 text-muted-foreground">
          <Loader size={20} />
          <span>Loading {name}…</span>
        </div>
      )}
      renderError={(error) => (
        <Alert variant="error">
          <AlertTitle>Could not preview this file</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}
      renderUnsupported={(mimeType) => (
        <Alert variant="info">
          <AlertDescription>
            This file type{mimeType ? ` (${mimeType})` : ''} cannot be previewed. Use Download instead.
          </AlertDescription>
        </Alert>
      )}
    />
  );
}
