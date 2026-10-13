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
import { PreviewErrorBoundary } from './filePreview/PreviewErrorBoundary';
import { PanelStatus } from './PanelStatus';

const COLUMNS: ColumnDef<DocumentItem>[] = [
  { id: 'name', header: 'Name', accessorFn: (doc) => doc.name, size: 260 },
  { id: 'type', header: 'Type', accessorFn: (doc) => documentTypeLabel(doc), size: 90 },
  {
    id: 'action',
    header: 'Open',
    accessorFn: (doc) => (isPreviewable(doc) ? 'Preview' : doc.isUploaded ? 'Download' : 'Not available'),
    size: 110,
  },
  { id: 'updated', header: 'Updated', accessorFn: (doc) => formatDate(doc.updatedTime), size: 120 },
];

type DocumentsGridProps = { label: string; documents: DocumentItem[]; onOpen: (doc: DocumentItem) => void };

function DocumentsGrid({ label, documents, onOpen }: DocumentsGridProps) {
  return (
    <DataGrid
      aria-label={label}
      className={documents.length > 4 ? 'h-64' : 'h-40'}
      data={documents}
      columns={COLUMNS}
      getRowId={(doc) => refKey(doc.ref)}
      enableSorting={false}
      size="compact"
      onRowClick={(row) => row.original.isUploaded && onOpen(row.original)}
    />
  );
}

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
          <DocumentsGrid label="Documents" documents={vm.documents} onOpen={vm.openDocument} />
        )}

        {vm.nameMatchStatus !== 'idle' && vm.nameMatchStatus !== 'success' && (
          <PanelStatus status={vm.nameMatchStatus} onRetry={vm.retry} />
        )}

        {vm.nameMatchStatus === 'success' && vm.nameMatches.length > 0 && (
          <section aria-label="Matched by name" className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium">Matched by name</h3>
              <Badge variant="warning">Not linked in CDF</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Files whose name contains "{vm.nameMatchTag}". They are not linked to this asset in the data model, so
              check that they are the right documents.
            </p>
            <DocumentsGrid label="Documents matched by name" documents={vm.nameMatches} onOpen={vm.openDocument} />
          </section>
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
            <PreviewErrorBoundary key={refKey(open.ref)}>
              {renderPreview({ file: open.ref, name: open.name })}
            </PreviewErrorBoundary>
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
