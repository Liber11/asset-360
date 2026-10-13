import { Loader } from '@cognite/aura/components/loader';
import { lazy, Suspense } from 'react';

import type { FilePreviewProps } from './FilePreviewContext';

// PDF.js is large; load the viewer only when a document is actually opened.
const CdfFilePreview = lazy(() => import('./CdfFilePreview').then((module) => ({ default: module.CdfFilePreview })));

export function LazyCdfFilePreview(props: FilePreviewProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-[70vh] items-center justify-center gap-2 text-muted-foreground">
          <Loader size={20} />
          <span>Loading viewer…</span>
        </div>
      }
    >
      <CdfFilePreview {...props} />
    </Suspense>
  );
}
