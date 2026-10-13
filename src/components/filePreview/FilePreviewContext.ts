import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

import type { InstanceRef } from '../../state/workspaceState';

export type FilePreviewProps = { file: InstanceRef; name: string };
export type FilePreviewRenderer = (props: FilePreviewProps) => ReactNode;

/**
 * Renders an inline file preview. Injected so the heavy PDF.js-based viewer
 * (CdfFilePreview) is only loaded by the app, and tests can use a lightweight stub.
 */
export const FilePreviewContext = createContext<FilePreviewRenderer | null>(null);

export function useFilePreview(): FilePreviewRenderer {
  const renderPreview = useContext(FilePreviewContext);
  if (!renderPreview) throw new Error('useFilePreview must be used inside FilePreviewContext.Provider');
  return renderPreview;
}
