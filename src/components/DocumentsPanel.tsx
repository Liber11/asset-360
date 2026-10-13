import { Alert, AlertDescription } from '@cognite/aura/components/alert';
import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@cognite/aura/components/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@cognite/aura/components/dialog';
import { EmptyState, EmptyStateDescription, EmptyStateTitle } from '@cognite/aura/components/empty-state';
import { DataGrid } from '@cognite/aura/data-grid';
import { IconDownload } from '@tabler/icons-react';
import type { ColumnDef } from '@tanstack/react-table';

import { refKey } from '../domain/cdm';
import { documentTypeLabel, isPreviewable, type DocumentItem } from '../domain/documents';
import { formatDate } from '../domain/workOrders';
import { RELATED_LIMIT } from '../services/relatedNodes';
import { useDocumentsViewModel } from '../viewmodels/useDocumentsViewModel';

import { useFilePreview } from './filePreview/FilePreviewContext';
import { PanelStatus } from './PanelStatus';

const COLUMNS: ColumnDef<DocumentItem>[] = [
  { id: 'name', header: 'Name', accessorFn: (doc) => doc.name, size: 320 },
  { id: 'type', header: 'Type', accessorFn: (doc) => documentTypeLabel(doc), size: 90 },
  {
    id: 'action',
    header: 'Open',
    accessorFn: (doc) => (isPreviewable(doc) ? 'Preview' : doc.isUploaded ? 'Download' : 'Not available'),
    size: 110,
  },
  { id: 'updated', header: 'Updated', accessorFn: (doc) => formatDate(doc.updatedTime), size: 120 },
];

export function DocumentsPanel() {
  const vm = useDocumentsViewModel();
  const renderPreview = useFilePreview();
  const open = vm.openDocumentDetail;

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2" className="flex items-center gap-2">
          Documents
          {vm.status === 'success' && (
            <Badge variant="gray">{vm.hasMore ? `${RELATED_LIMIT}+` : vm.documents.length}</Badge>
          )}
        </CardTitle>
        <CardDescription>PDFs and images open in a preview; other files download.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <PanelStatus status={vm.status} errorMessage={vm.errorMessage} onRetry={vm.retry} />

        {vm.downloadErrorMessage && (
          <Alert variant="error">
            <AlertDescription>Could not download the file: {vm.downloadErrorMessage}</AlertDescription>
          </Alert>
        )}

        {vm.status === 'success' && vm.documents.length === 0 && (
          <EmptyState type="no-results">
            <EmptyStateTitle>No documents linked to this asset</EmptyStateTitle>
            <EmptyStateDescription>No files in CDF (P&IDs, manuals, reports) reference this asset.</EmptyStateDescription>
          </EmptyState>
        )}

        {vm.status === 'success' && vm.documents.length > 0 && (
          <DataGrid
            aria-label="Documents"
            className="h-64"
            data={vm.documents}
            columns={COLUMNS}
            getRowId={(doc) => refKey(doc.ref)}
            enableSorting={false}
            size="compact"
            onRowClick={(row) => row.original.isUploaded && vm.openDocument(row.original)}
          />
        )}
      </CardContent>

      <Dialog open={open !== undefined} onOpenChange={(isOpen) => !isOpen && vm.closeDocument()}>
        {open && (
          <DialogContent className="sm:max-w-5xl">
            <DialogHeader>
              <DialogTitle>{open.name}</DialogTitle>
              <DialogDescription>
                {documentTypeLabel(open)} · Updated {formatDate(open.updatedTime)}
              </DialogDescription>
            </DialogHeader>
            {renderPreview({ file: open.ref, name: open.name })}
            <DialogFooter>
              <Button variant="outline" onClick={() => vm.download(open)} disabled={vm.isDownloading}>
                <IconDownload aria-hidden className="size-4" />
                Download
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </Card>
  );
}
